/* Thalarion – Kampf (Tracker, Schlachtfeld, Auflösung) – Phase 1.3 */

    function normalizeKarte(c) {
      return {
        id: c.id || combatNewId('k'),
        name: (c.name || '').trim(),
        hp: Math.max(0, Number(c.hp) || 0),
        ac: c.ac == null ? '' : String(c.ac).trim(),
        count: Math.max(1, Number(c.count) || 1),
        note: (c.note || '').trim(),
        portraitId: typeof c.portraitId === 'string' ? c.portraitId : ''
      };
    }

    function persistRosterLocal() {
      writeLocal(ROSTER_LOCAL_KEY, JSON.stringify({
        updatedAt: rosterUpdatedAt,
        cards: rosterCards
      }));
    }

    function loadRosterLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(ROSTER_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        rosterUpdatedAt = Number(raw.updatedAt) || 0;
        rosterCards = (Array.isArray(raw.cards) ? raw.cards : []).map(normalizeKarte).filter(c => c.name);
      } catch (err) {}
    }

    function applyRoster(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= rosterUpdatedAt) return;
      rosterUpdatedAt = at;
      rosterCards = (Array.isArray(data.cards) ? data.cards : []).map(normalizeKarte).filter(c => c.name);
      persistRosterLocal();
      if (currentPage === 'kampf') renderKampfKartenList();
    }

    function listenRoster() {
      if (!db) return;
      rosterRef().onSnapshot(snap => {
        if (writingRoster || !snap.exists) return;
        applyRoster(snap.data());
      });
    }

    async function persistRoster() {
      if (db) {
        const nextAt = Date.now();
        writingRoster = true;
        try {
          await rosterRef().set({
            updatedAt: nextAt,
            cards: rosterCards
          });
          rosterUpdatedAt = nextAt;
        } finally {
          writingRoster = false;
        }
      } else {
        rosterUpdatedAt = Date.now();
      }
      persistRosterLocal();
    }

    function battleInitials(name) {
      const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return '?';
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    function paintPortraitEl(el, portraitId, name) {
      if (!el) return;
      el.textContent = battleInitials(name);
      el.style.backgroundImage = '';
      if (!portraitId) return;
      const apply = data => {
        if (!data) return;
        el.style.backgroundImage = 'url(' + JSON.stringify(data) + ')';
        el.textContent = '';
      };
      if (imageCache[portraitId]) apply(imageCache[portraitId]);
      else loadEntryImage(portraitId).then(apply).catch(() => {});
    }

    function stamp(n) {
      const v = Number(n);
      return Number.isFinite(v) ? v : 0;
    }

    function stampNow() {
      return Date.now();
    }

    function mergeStampMap(a, b) {
      const out = {};
      [a, b].forEach(map => {
        if (!map || typeof map !== 'object' || Array.isArray(map)) return;
        Object.keys(map).forEach(id => {
          out[id] = Math.max(stamp(out[id]), stamp(map[id]));
        });
      });
      return out;
    }

    function normalizeLogItem(item) {
      if (typeof item === 'string') return { t: 0, text: item };
      if (!item || typeof item !== 'object') return null;
      const text = String(item.text || '').trim();
      if (!text) return null;
      return { t: stamp(item.t), text: text };
    }

    function combatLogText(item) {
      if (typeof item === 'string') return item;
      return item && item.text ? String(item.text) : '';
    }

    function mergeCombatLogs(a, b, resetAt) {
      const seen = {};
      const out = [];
      const cut = stamp(resetAt);
      [].concat(b || [], a || []).forEach(item => {
        const n = normalizeLogItem(item);
        if (!n) return;
        if (cut && stamp(n.t) < cut) return;
        const key = n.t + '\0' + n.text;
        if (seen[key]) return;
        seen[key] = 1;
        out.push(n);
      });
      out.sort((x, y) => stamp(y.t) - stamp(x.t));
      return out.slice(0, 20);
    }

    function normalizeBattleToken(t) {
      return {
        id: t.id || combatNewId('t'),
        name: t.name || '',
        kind: t.kind === 'player' ? 'player' : 'enemy',
        playerId: t.playerId || '',
        portraitId: t.portraitId || '',
        init: Number(t.init) || 0,
        x: Math.max(0, Math.min(100, Number(t.x) || 50)),
        y: Math.max(0, Math.min(100, Number(t.y) || 50)),
        movedAt: stamp(t.movedAt)
      };
    }

    function normalizeBattleHazard(h) {
      const type = BATTLE_HAZARDS[h.type] ? h.type : 'fire';
      const points = (Array.isArray(h.points) ? h.points : []).map(p => ({
        x: Math.max(0, Math.min(100, Number(p.x) || 0)),
        y: Math.max(0, Math.min(100, Number(p.y) || 0))
      }));
      return { id: h.id || combatNewId('h'), type: type, points: points, updatedAt: stamp(h.updatedAt) };
    }

    function normalizeFogReveal(r) {
      const raw = r && typeof r === 'object' ? r : {};
      return {
        id: raw.id || combatNewId('fog'),
        x: Math.max(0, Math.min(100, Number(raw.x) || 0)),
        y: Math.max(0, Math.min(100, Number(raw.y) || 0)),
        r: Math.max(2, Math.min(28, Number(raw.r) || 8)),
        updatedAt: stamp(raw.updatedAt)
      };
    }

    function battlePayload() {
      return {
        updatedAt: stamp(battle.updatedAt),
        layoutAt: stamp(battle.layoutAt),
        tokens: (battle.tokens || []).map(normalizeBattleToken),
        hazards: (battle.hazards || []).map(normalizeBattleHazard),
        fogOn: !!battle.fogOn,
        fogReveals: (battle.fogReveals || []).map(normalizeFogReveal),
        ping: battle.ping && Number.isFinite(Number(battle.ping.at)) ? {
          x: Math.max(0, Math.min(100, Number(battle.ping.x) || 0)),
          y: Math.max(0, Math.min(100, Number(battle.ping.y) || 0)),
          at: stamp(battle.ping.at)
        } : null,
        tokenSize: clampBattleTokenSize(battle.tokenSize),
        gridSize: clampBattleGridSize(battle.gridSize),
        gridFrac: clampBattleGridFrac(battle.gridFrac),
        removedTokens: Object.assign({}, battle.removedTokens || {}),
        removedHazards: Object.assign({}, battle.removedHazards || {}),
        removedFog: Object.assign({}, battle.removedFog || {})
      };
    }

    function mergeByStamp(listA, listB, stampKey, removed) {
      const byId = {};
      [].concat(listA || [], listB || []).forEach(item => {
        if (!item || !item.id) return;
        const prev = byId[item.id];
        if (!prev || stamp(item[stampKey]) >= stamp(prev[stampKey])) byId[item.id] = item;
      });
      return Object.keys(byId).map(id => byId[id]).filter(item => stamp(item[stampKey]) >= stamp(removed && removed[item.id]));
    }

    function mergeBattleStates(a, b) {
      a = a || {};
      b = b || {};
      const removedTokens = mergeStampMap(a.removedTokens, b.removedTokens);
      const removedHazards = mergeStampMap(a.removedHazards, b.removedHazards);
      const removedFog = mergeStampMap(a.removedFog, b.removedFog);
      const aLay = stamp(a.layoutAt);
      const bLay = stamp(b.layoutAt);
      const layoutSrc = bLay >= aLay ? b : a;
      const aPing = a.ping && stamp(a.ping.at);
      const bPing = b.ping && stamp(b.ping.at);
      const ping = (bPing || 0) >= (aPing || 0) ? (b.ping || null) : (a.ping || null);
      return {
        updatedAt: Math.max(stamp(a.updatedAt), stamp(b.updatedAt)),
        layoutAt: Math.max(aLay, bLay),
        tokens: mergeByStamp(
          (Array.isArray(a.tokens) ? a.tokens : []).map(normalizeBattleToken),
          (Array.isArray(b.tokens) ? b.tokens : []).map(normalizeBattleToken),
          'movedAt',
          removedTokens
        ),
        hazards: mergeByStamp(
          (Array.isArray(a.hazards) ? a.hazards : []).map(normalizeBattleHazard),
          (Array.isArray(b.hazards) ? b.hazards : []).map(normalizeBattleHazard),
          'updatedAt',
          removedHazards
        ),
        fogOn: !!layoutSrc.fogOn,
        fogReveals: mergeByStamp(
          (Array.isArray(a.fogReveals) ? a.fogReveals : []).map(normalizeFogReveal),
          (Array.isArray(b.fogReveals) ? b.fogReveals : []).map(normalizeFogReveal),
          'updatedAt',
          removedFog
        ),
        ping: ping,
        tokenSize: clampBattleTokenSize(layoutSrc.tokenSize),
        gridSize: clampBattleGridSize(layoutSrc.gridSize),
        gridFrac: clampBattleGridFrac(layoutSrc.gridFrac) || clampBattleGridFrac(a.gridFrac) || clampBattleGridFrac(b.gridFrac),
        removedTokens: removedTokens,
        removedHazards: removedHazards,
        removedFog: removedFog
      };
    }

    function applyBattleState(data, doRender) {
      const next = mergeBattleStates({}, data);
      battle.updatedAt = stamp(next.updatedAt);
      battle.layoutAt = stamp(next.layoutAt);
      battle.tokens = next.tokens;
      battle.hazards = next.hazards;
      battle.fogOn = !!next.fogOn;
      battle.fogReveals = next.fogReveals || [];
      battle.removedFog = next.removedFog || {};
      battle.ping = next.ping || null;
      battle.tokenSize = next.tokenSize;
      battle.gridSize = next.gridSize;
      battle.gridFrac = next.gridFrac;
      battle.removedTokens = next.removedTokens;
      battle.removedHazards = next.removedHazards;
      persistBattleLocal();
      if (battle.ping && stamp(battle.ping.at) > lastBattlePingAt) {
        lastBattlePingAt = stamp(battle.ping.at);
        spawnBattlePing(battle.ping.x, battle.ping.y, false);
      }
      if (doRender !== false) {
        renderBattleBoards();
        if (currentPage === 'kampf' && !isDM) renderPlayerKampfList();
      }
    }

    function persistBattleLocal() {
      writeLocal(BATTLE_LOCAL_KEY, JSON.stringify(battlePayload()));
    }

    function loadBattleLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(BATTLE_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        battle.updatedAt = stamp(raw.updatedAt);
        battle.layoutAt = stamp(raw.layoutAt);
        battle.tokens = (Array.isArray(raw.tokens) ? raw.tokens : []).map(normalizeBattleToken);
        battle.hazards = (Array.isArray(raw.hazards) ? raw.hazards : []).map(normalizeBattleHazard);
        battle.fogOn = !!raw.fogOn;
        battle.fogReveals = (Array.isArray(raw.fogReveals) ? raw.fogReveals : []).map(normalizeFogReveal);
        battle.removedFog = Object.assign({}, raw.removedFog || {});
        battle.ping = raw.ping || null;
        battle.tokenSize = clampBattleTokenSize(raw.tokenSize);
        battle.gridSize = clampBattleGridSize(raw.gridSize);
        battle.gridFrac = clampBattleGridFrac(raw.gridFrac);
        battle.removedTokens = Object.assign({}, raw.removedTokens || {});
        battle.removedHazards = Object.assign({}, raw.removedHazards || {});
      } catch (err) {}
    }

    function clampBattleTokenSize(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return 48;
      return Math.max(16, Math.min(96, Math.round(v)));
    }

    function clampBattleGridSize(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return 1;
      return Math.max(0.5, Math.min(4, Math.round(v * 10) / 10));
    }

    function clampBattleGridFrac(n) {
      const v = Number(n);
      if (!Number.isFinite(v) || v < 0.015 || v > 0.45) return 0;
      return Math.round(v * 100000) / 100000;
    }

    function applyBattleGridSize() {
      const size = clampBattleGridSize(battle.gridSize);
      battle.gridSize = size;
      battleGridMetricsCache = null;
      let lockedFrac = false;
      document.querySelectorAll('.battle-stage').forEach(stage => {
        const m = battleGridMetrics(stage);
        if (m.width && m.height && m.cellW && m.cellH) {
          if (isDM && !clampBattleGridFrac(battle.gridFrac)) {
            const nextFrac = clampBattleGridFrac(m.cellW / m.width);
            if (nextFrac) {
              battle.gridFrac = nextFrac;
              lockedFrac = true;
              battleGridMetricsCache = null;
            }
          }
          stage.style.setProperty('--battle-grid-x', ((m.cellW / m.width) * 100) + '%');
          stage.style.setProperty('--battle-grid-y', ((m.cellH / m.height) * 100) + '%');
        } else {
          stage.style.setProperty('--battle-grid-size', size + 'cm');
          stage.style.removeProperty('--battle-grid-x');
          stage.style.removeProperty('--battle-grid-y');
        }
      });
      const slider = document.getElementById('kampfBattleGrid');
      const val = document.getElementById('kampfBattleGridVal');
      if (slider && document.activeElement !== slider) slider.value = String(Math.round(size * 10));
      if (val) val.textContent = (Math.round(size * 10) % 10 ? size.toFixed(1).replace('.', ',') : String(size)) + ' cm';
      if (lockedFrac) persistBattleSoon();
    }

    function applyBattleTokenSize() {
      const size = clampBattleTokenSize(battle.tokenSize);
      battle.tokenSize = size;
      document.querySelectorAll('.battle-stage').forEach(stage => {
        stage.style.setProperty('--battle-token-face', size + 'px');
        stage.style.setProperty('--battle-token-size', (size + 4) + 'px');
      });
      const slider = document.getElementById('kampfBattleSize');
      if (slider && document.activeElement !== slider) slider.value = String(size);
    }

    function applyBattleLinkHighlight() {
      const id = battleLinkHoverId || battleLinkPinnedId;
      document.querySelectorAll('.battle-token, .kampf-card, .kampf-side-item').forEach(el => {
        el.classList.toggle('is-linked', !!(id && el.dataset.id === id));
      });
    }

    function applyBattleTurnHighlight() {
      document.querySelectorAll('.battle-token').forEach(el => {
        el.classList.toggle('is-turn', isCombatantActiveTurn(el.dataset.id));
        const row = combatantById(el.dataset.id);
        el.classList.toggle('is-down', !!(row && combatantDown(row)));
      });
      applyKampfAimHighlight();
    }

    function kampfIsAimTarget(id) {
      if (!id) return false;
      if (kampfAimTo && kampfAimTo === id) return true;
      return !!(kampfAimTargets && kampfAimTargets.indexOf(id) >= 0);
    }

    function applyKampfAimHighlight() {
      document.querySelectorAll('.battle-token, .kampf-card, .kampf-side-item, .kampf-init-item').forEach(el => {
        el.classList.toggle('is-aim-from', !!(kampfAimFrom && el.dataset.id === kampfAimFrom));
        el.classList.toggle('is-aim-to', kampfIsAimTarget(el.dataset.id));
      });
    }

    function setBattleLink(id, pinned) {
      if (pinned) {
        battleLinkPinnedId = battleLinkPinnedId === id ? '' : id;
      } else {
        battleLinkHoverId = id || '';
      }
      applyBattleLinkHighlight();
    }

    function scrollToKampfCard(id) {
      if (!id) return;
      const card = document.querySelector('.kampf-card[data-id="' + CSS.escape(id) + '"], .kampf-side-item[data-id="' + CSS.escape(id) + '"]');
      if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function bindKampfListLink(el, id) {
      if (!el || !id) return;
      el.dataset.id = id;
      el.addEventListener('pointerenter', () => setBattleLink(id, false));
      el.addEventListener('pointerleave', () => {
        if (battleLinkHoverId === id) setBattleLink('', false);
      });
      el.addEventListener('click', ev => {
        if (ev.target.closest('input, select, textarea, label')) return;
        const nestedBtn = ev.target.closest('button');
        if (nestedBtn && nestedBtn !== el) return;
        if (activateKampfFigure(id)) return;
        const row = combatantById(id);
        if (isDM && combat.started && row && row.delayed) {
          row.delayed = false;
          row.ready = false;
          touchCombatant(row);
          setCombatActive(id);
          return;
        }
        setBattleLink(id, true);
        const token = document.querySelector('.battle-token[data-id="' + CSS.escape(id) + '"]');
        if (token) token.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }

    function applyBattle(data, force) {
      if (!data) return;
      if (battleTokenDrag && !force) {
        pendingBattleSnap = data;
        return;
      }
      applyBattleState(mergeBattleStates(battlePayload(), data));
    }

    function applyBattleMap(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= battle.mapUpdatedAt) return;
      battle.mapUpdatedAt = at;
      battle.image = data.image || '';
      renderBattleBoards();
    }

    function listenBattle() {
      if (!db) return;
      battleRef().onSnapshot(snap => {
        if (!snap.exists) return;
        if (writingBattle) {
          pendingBattleSnap = snap.data();
          return;
        }
        applyBattle(snap.data());
      });
      battleMapRef().onSnapshot(snap => {
        if (writingBattleMap || !snap.exists) return;
        applyBattleMap(snap.data());
      });
    }

    function combatPayload() {
      return normalizeCombatState({
        updatedAt: combat.updatedAt,
        turnAt: combat.turnAt,
        round: combat.round,
        started: combat.started,
        activeId: combat.activeId,
        debuffTick: combat.debuffTick,
        combatants: combat.combatants,
        removed: combat.removed,
        log: combat.log,
        logResetAt: combat.logResetAt
      });
    }

    function persistCombatLocal() {
      writeLocal(COMBAT_KEY, JSON.stringify(combatPayload()));
    }

    function applyCombat(data) {
      if (!data) return;
      const merged = mergeCombatStates(combatPayload(), data);
      combat = merged;
      if (stripUdoFromCombatState()) {
        replaceBattleTokensFromCombat();
        persistCombat();
      }
      persistCombatLocal();
      ensureCombatTurn();
      applyBattleTurnHighlight();
      if (currentPage === 'kampf') {
        renderKampf();
        renderBattleBoards();
      }
    }

    function listenCombat() {
      if (!db) return;
      combatRef().onSnapshot(snap => {
        if (!snap.exists) return;
        if (writingCombat) {
          pendingCombatSnap = snap.data();
          return;
        }
        applyCombat(snap.data());
      });
    }

    async function persistCombatRemote() {
      if (!db) return;
      if (writingCombat) {
        combatWriteQueued = true;
        return;
      }
      writingCombat = true;
      combatWriteQueued = false;
      let wrote = null;
      try {
        await db.runTransaction(async tx => {
          const ref = combatRef();
          const snap = await tx.get(ref);
          wrote = snap.exists ? mergeCombatStates(snap.data(), combatPayload()) : combatPayload();
          wrote.updatedAt = Math.max(stamp(wrote.updatedAt), stampNow());
          tx.set(ref, wrote);
        });
        if (wrote) {
          combat = mergeCombatStates(wrote, combatPayload());
          persistCombatLocal();
          applyBattleTurnHighlight();
          if (currentPage === 'kampf') renderKampf();
        }
      } catch (err) {
        toast('Kampfstand konnte nicht gespeichert werden: ' + err.message);
      } finally {
        writingCombat = false;
        if (pendingCombatSnap) {
          const snapData = pendingCombatSnap;
          pendingCombatSnap = null;
          applyCombat(snapData);
        }
        if (combatWriteQueued) persistCombatSoon();
      }
    }

    function persistCombatSoon() {
      if (writingCombat) {
        combatWriteQueued = true;
        return;
      }
      clearTimeout(combatPersistTimer);
      combatPersistTimer = setTimeout(() => { persistCombatRemote(); }, 180);
    }

    function persistBattleSoon() {
      if (writingBattle) {
        battleWriteQueued = true;
        return;
      }
      clearTimeout(battlePersistTimer);
      battlePersistTimer = setTimeout(() => { persistBattle(); }, 180);
    }

    async function persistBattle() {
      persistBattleLocal();
      if (!db) return;
      if (writingBattle) {
        battleWriteQueued = true;
        return;
      }
      writingBattle = true;
      battleWriteQueued = false;
      let wrote = null;
      try {
        await db.runTransaction(async tx => {
          const ref = battleRef();
          const snap = await tx.get(ref);
          wrote = snap.exists ? mergeBattleStates(snap.data(), battlePayload()) : battlePayload();
          wrote.updatedAt = Math.max(stamp(wrote.updatedAt), stampNow());
          tx.set(ref, wrote);
        });
        if (wrote) {
          const keepImage = battle.image;
          applyBattleState(mergeBattleStates(wrote, battlePayload()), currentPage === 'kampf');
          battle.image = keepImage;
        }
      } catch (err) {
        toast('Schlachtfeld konnte nicht gespeichert werden: ' + err.message);
      } finally {
        writingBattle = false;
        if (pendingBattleSnap && !battleTokenDrag) {
          const snap = pendingBattleSnap;
          pendingBattleSnap = null;
          applyBattle(snap, true);
        }
        if (battleWriteQueued) persistBattleSoon();
      }
    }

    function clampBattlePan() {
      const board = document.getElementById('kampfBattleBoard');
      const stage = document.getElementById('kampfBattleStage');
      if (!board || !stage) return;
      const ww = board.clientWidth;
      const wh = board.clientHeight;
      const sw = stage.offsetWidth * battleScale;
      const sh = stage.offsetHeight * battleScale;
      if (sw <= ww) battlePanX = (ww - sw) / 2;
      else battlePanX = Math.min(0, Math.max(ww - sw, battlePanX));
      if (sh <= wh) battlePanY = (wh - sh) / 2;
      else battlePanY = Math.min(0, Math.max(wh - sh, battlePanY));
    }

    function applyBattleTransform() {
      const stage = document.getElementById('kampfBattleStage');
      const board = document.getElementById('kampfBattleBoard');
      const reset = document.getElementById('kampfBattleZoomReset');
      if (!stage || !board) return;
      if (battleScale <= 1.001) {
        battleScale = 1;
        battlePanX = 0;
        battlePanY = 0;
        board.classList.remove('is-zoomed', 'panning');
        stage.style.transform = 'none';
      } else {
        board.classList.add('is-zoomed');
        clampBattlePan();
        stage.style.transform = 'translate(' + battlePanX + 'px,' + battlePanY + 'px) scale(' + battleScale + ')';
      }
      if (reset) reset.textContent = Math.round(battleScale * 100) + '%';
    }

    function zoomBattleAt(clientX, clientY, nextScale) {
      nextScale = Math.max(1, Math.min(4, nextScale));
      const board = document.getElementById('kampfBattleBoard');
      const stage = document.getElementById('kampfBattleStage');
      if (!board || !stage || stage.classList.contains('hidden')) return;
      const rect = board.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const x = (mx - battlePanX) / battleScale;
      const y = (my - battlePanY) / battleScale;
      battleScale = nextScale;
      battlePanX = mx - x * battleScale;
      battlePanY = my - y * battleScale;
      applyBattleTransform();
    }

    function zoomBattleBy(delta) {
      const board = document.getElementById('kampfBattleBoard');
      if (!board) return;
      const rect = board.getBoundingClientRect();
      zoomBattleAt(rect.left + rect.width / 2, rect.top + rect.height / 2, battleScale + delta);
    }

    function resetBattleView() {
      battleScale = 1;
      battlePanX = 0;
      battlePanY = 0;
      applyBattleTransform();
    }

    function bindBattleZoom(board, stage) {
      if (!board || !stage || board.dataset.zoomBound) return;
      board.dataset.zoomBound = '1';
      board.addEventListener('wheel', ev => {
        if (stage.classList.contains('hidden')) return;
        ev.preventDefault();
        const step = ev.deltaY > 0 ? -0.18 : 0.18;
        zoomBattleAt(ev.clientX, ev.clientY, battleScale + step);
      }, { passive: false });
      board.addEventListener('pointerdown', ev => {
        if (ev.button && ev.button !== 0) return;
        if (battleTokenDrag || battleHazardMode || battleMapTool) return;
        if (ev.target.closest('.battle-token, .battle-power-overlay')) return;
        if (battleScale <= 1) return;
        ev.preventDefault();
        battlePan = {
          pointerId: ev.pointerId,
          x: ev.clientX,
          y: ev.clientY,
          panX: battlePanX,
          panY: battlePanY,
          moved: false
        };
        board.classList.add('panning');
        try { board.setPointerCapture(ev.pointerId); } catch (err) {}
      });
      board.addEventListener('pointermove', ev => {
        if (!battlePan || ev.pointerId !== battlePan.pointerId) return;
        const dx = ev.clientX - battlePan.x;
        const dy = ev.clientY - battlePan.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) battlePan.moved = true;
        battlePanX = battlePan.panX + dx;
        battlePanY = battlePan.panY + dy;
        applyBattleTransform();
      });
      const endPan = ev => {
        if (!battlePan || (ev && ev.pointerId !== battlePan.pointerId)) return;
        const moved = battlePan.moved;
        battlePan = null;
        board.classList.remove('panning');
        if (moved) board.dataset.battlePanned = '1';
      };
      board.addEventListener('pointerup', endPan);
      board.addEventListener('pointercancel', endPan);
    }

    async function persistBattleMap() {
      if (!db) throw new Error('Keine Verbindung zur Cloud.');
      const nextAt = Date.now();
      writingBattleMap = true;
      try {
        const stored = await storeCloudImage('kampf-map', battle.image || '');
        if (stored) battle.image = stored;
        await battleMapRef().set({ image: stored, updatedAt: nextAt });
        battle.mapUpdatedAt = nextAt;
      } finally {
        writingBattleMap = false;
      }
    }

    function normalizeGalleryMap(m) {
      if (!m || typeof m !== 'object') return null;
      const name = String(m.name || '').trim();
      const imageId = String(m.imageId || '').trim();
      if (!name || !imageId) return null;
      return {
        id: m.id || combatNewId('bm'),
        name: name,
        imageId: imageId
      };
    }

    function persistBattleGalleryLocal() {
      writeLocal(BATTLE_GALLERY_LOCAL_KEY, JSON.stringify({
        updatedAt: battleGalleryUpdatedAt,
        maps: battleGalleryMaps
      }));
    }

    function loadBattleGalleryLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(BATTLE_GALLERY_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        battleGalleryUpdatedAt = Number(raw.updatedAt) || 0;
        battleGalleryMaps = (Array.isArray(raw.maps) ? raw.maps : []).map(normalizeGalleryMap).filter(Boolean);
      } catch (err) {}
    }

    function applyBattleGallery(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= battleGalleryUpdatedAt) return;
      battleGalleryUpdatedAt = at;
      battleGalleryMaps = (Array.isArray(data.maps) ? data.maps : []).map(normalizeGalleryMap).filter(Boolean);
      persistBattleGalleryLocal();
      renderBattleGalleryList();
    }

    function listenBattleGallery() {
      if (!db) return;
      battleGalleryRef().onSnapshot(snap => {
        if (writingBattleGallery || !snap.exists) return;
        applyBattleGallery(snap.data());
      });
    }

    async function persistBattleGallery() {
      if (db) {
        const nextAt = Date.now();
        writingBattleGallery = true;
        try {
          await battleGalleryRef().set({
            updatedAt: nextAt,
            maps: battleGalleryMaps
          });
          battleGalleryUpdatedAt = nextAt;
        } finally {
          writingBattleGallery = false;
        }
      } else {
        battleGalleryUpdatedAt = Date.now();
      }
      persistBattleGalleryLocal();
    }

    function sortedBattleGalleryMaps() {
      return battleGalleryMaps.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
    }

    function renderBattleGalleryList() {
      const box = document.getElementById('battleGalleryList');
      if (!box) return;
      box.innerHTML = '';
      const list = sortedBattleGalleryMaps();
      if (!list.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.margin = '0';
        empty.textContent = 'Noch keine Karten. Oben einen Namen eingeben, dann Hinzufügen.';
        box.appendChild(empty);
        return;
      }
      list.forEach(map => {
        const row = document.createElement('div');
        row.className = 'battle-gallery-item';
        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'ghost battle-gallery-name';
        pick.textContent = map.name;
        pick.title = 'Als Schlachtfeld nutzen';
        pick.onclick = () => useBattleGalleryMap(map.id);
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'ghost';
        del.textContent = 'Löschen';
        del.title = 'Aus der Galerie entfernen';
        del.onclick = () => deleteBattleGalleryMap(map.id);
        row.appendChild(pick);
        row.appendChild(del);
        box.appendChild(row);
      });
    }

    function openBattleGallery() {
      if (!isDM) return;
      closeKampfBattleGear();
      const overlay = document.getElementById('battleGalleryOverlay');
      if (!overlay) return;
      renderBattleGalleryList();
      overlay.classList.remove('hidden');
      const nameEl = document.getElementById('battleGalleryName');
      if (nameEl) nameEl.focus();
    }

    function closeBattleGallery() {
      const overlay = document.getElementById('battleGalleryOverlay');
      if (overlay) overlay.classList.add('hidden');
    }

    function startBattleGalleryAdd() {
      if (!isDM) return;
      const nameEl = document.getElementById('battleGalleryName');
      const name = ((nameEl && nameEl.value) || '').trim();
      if (!name) return toast('Bitte zuerst einen Namen eingeben.');
      const taken = battleGalleryMaps.some(m => (m.name || '').toLowerCase() === name.toLowerCase());
      if (taken) return toast('Diesen Namen gibt es schon in der Galerie.');
      const input = document.getElementById('battleGalleryInput');
      if (input) input.click();
    }

    async function addBattleGalleryMap(file) {
      if (!isDM || !file) return;
      const nameEl = document.getElementById('battleGalleryName');
      const name = ((nameEl && nameEl.value) || '').trim();
      if (!name) return toast('Bitte zuerst einen Namen eingeben.');
      if (battleGalleryMaps.some(m => (m.name || '').toLowerCase() === name.toLowerCase())) {
        return toast('Diesen Namen gibt es schon in der Galerie.');
      }
      toast('Karte wird in die Galerie gelegt…');
      try {
        const image = await fileToMapImage(file);
        const id = combatNewId('bm');
        const imageId = 'img_gal_' + id;
        await persistEntryImage(imageId, image);
        battleGalleryMaps = battleGalleryMaps.concat([{ id: id, name: name, imageId: imageId }]);
        await persistBattleGallery();
        if (nameEl) nameEl.value = '';
        renderBattleGalleryList();
        toast('„' + name + '“ liegt in der Galerie.');
      } catch (err) {
        toast(err.message || 'Karte konnte nicht gespeichert werden.');
      }
    }

    async function useBattleGalleryMap(id) {
      if (!isDM) return;
      const map = battleGalleryMaps.find(m => m.id === id);
      if (!map) return;
      if (!confirm('„' + map.name + '“ als aktuelles Schlachtfeld nutzen? Die bisherige Karte wird ersetzt. Figuren bleiben.')) return;
      toast('Schlachtfeld wird gewechselt…');
      try {
        const src = imageCache[map.imageId] || await loadEntryImage(map.imageId);
        if (!src) throw new Error('Das Bild dieser Karte fehlt.');
        battle.image = src;
        await persistBattleMap();
        renderBattleBoards();
        resetBattleView();
        closeBattleGallery();
        toast('Schlachtfeld ist jetzt „' + map.name + '“.');
      } catch (err) {
        toast(err.message || 'Die Karte konnte nicht gesetzt werden.');
      }
    }

    async function deleteBattleGalleryMap(id) {
      if (!isDM) return;
      const map = battleGalleryMaps.find(m => m.id === id);
      if (!map) return;
      if (!confirm('„' + map.name + '“ aus der Galerie löschen?')) return;
      const src = imageCache[map.imageId] || '';
      battleGalleryMaps = battleGalleryMaps.filter(m => m.id !== id);
      try {
        await persistBattleGallery();
        if (src !== battle.image) {
          try { await deleteEntryImage(map.imageId); } catch (err) {}
        }
        renderBattleGalleryList();
        toast('„' + map.name + '“ ist aus der Galerie.');
      } catch (err) {
        toast(err.message || 'Löschen fehlgeschlagen.');
      }
    }

    function upsertBattleToken(row) {
      if (!row || !row.id) return;
      let old = battle.tokens.find(t => t.id === row.id);
      if (!old && row.playerId) {
        const activeIds = {};
        combat.combatants.forEach(c => { if (c && c.id) activeIds[c.id] = true; });
        old = battle.tokens.find(t => t.playerId === row.playerId && t.id !== row.id && !activeIds[t.id]);
        if (old) old.id = row.id;
      }
      if (old) {
        old.name = row.name || old.name;
        old.kind = row.kind === 'player' ? 'player' : 'enemy';
        old.playerId = row.playerId || '';
        old.portraitId = row.portraitId || '';
        old.init = parseCombatInit(row.init);
      } else {
        battle.tokens.push(normalizeBattleToken({
          id: row.id,
          name: row.name,
          kind: row.kind,
          playerId: row.playerId,
          portraitId: row.portraitId,
          init: row.init,
          x: 12 + (battle.tokens.length % 6) * 14,
          y: 82,
          movedAt: stampNow()
        }));
        snapBattleTokenPos(battle.tokens[battle.tokens.length - 1]);
        battle.tokens[battle.tokens.length - 1].movedAt = stampNow();
      }
      if (battle.removedTokens) delete battle.removedTokens[row.id];
      persistBattleSoon();
      renderBattleBoards();
    }

    function removeBattleToken(id) {
      if (!battle.removedTokens) battle.removedTokens = {};
      battle.removedTokens[id] = stampNow();
      battle.tokens = battle.tokens.filter(t => t.id !== id);
      persistBattleSoon();
      renderBattleBoards();
    }

    function replaceBattleTokensFromCombat() {
      const kept = {};
      battle.tokens.forEach(t => { kept[t.id] = t; });
      battle.tokens = combat.combatants.map((c, i) => {
        const old = kept[c.id];
        return normalizeBattleToken({
          id: c.id,
          name: c.name,
          kind: c.kind,
          playerId: c.playerId,
          portraitId: c.portraitId,
          init: c.init,
          x: old ? old.x : 12 + (i % 6) * 14,
          y: old ? old.y : 82,
          movedAt: old ? old.movedAt : stampNow()
        });
      });
      persistBattleSoon();
      renderBattleBoards();
    }

    function clearBattleTokensAndHazards() {
      const now = stampNow();
      if (!battle.removedTokens) battle.removedTokens = {};
      if (!battle.removedHazards) battle.removedHazards = {};
      battle.tokens.forEach(t => { battle.removedTokens[t.id] = now; });
      battle.hazards.forEach(h => { battle.removedHazards[h.id] = now; });
      battle.tokens = [];
      battle.hazards = [];
      battleDraft = [];
      battleHazardMode = null;
      persistBattleSoon();
      renderBattleBoards();
    }

    function canMoveBattleToken(token) {
      if (isDM) return true;
      if (!isOwnCombatOwner(token.playerId)) return false;
      if (combat.started) return isCombatantActiveTurn(token.id);
      return true;
    }

    function battleHintText() {
      if (battleHazardMode) {
        const label = BATTLE_HAZARDS[battleHazardMode].label;
        return label + ' zeichnen: auf die Karte tippen. Ersten Punkt nochmal antippen oder „Fläche schließen“.';
      }
      if (battleMapTool === 'ruler') return 'Maßband: ersten Punkt antippen, dann den zweiten. Felder nach 5e (Diagonal zählt 1).';
      if (battleMapTool === 'ping') return 'Ping: auf die Karte oder ein Portrait tippen.';
      if (battleMapTool === 'fog-reveal') return 'Nebel aufdecken: auf die Karte tippen.';
      if (battleMapTool === 'fog-hide') return 'Nebel verdecken: aufgedeckte Stelle antippen.';
      if (battle.fogOn && isDM) return 'Nebel aktiv. Aufdecken/Verdecken im Zahnrad, oder Figuren ziehen.';
      if (isDM && combat.started && !battleHazardMode) return 'Kurz antippen: erst wer handelt, dann das Ziel. Ziehen setzt die Figur um.';
      if (isDM) return 'Figuren ziehen. Feuer, Wasser oder Öl wählen, dann die Fläche auf die Karte legen. Eine Fläche antippen löscht sie.';
      if (currentPlayerId && isMyCombatTurn()) return combatPlayerTurnHint();
      if (currentPlayerId) return 'Warte auf deinen Zug. Du kannst dein Portrait weiter schieben.';
      return 'Zum eigenen Token als Spieler anmelden. Sonst nur zuschauen.';
    }

    function battleBoardIds() {
      return [
        { empty: 'kampfBattleEmpty', stage: 'kampfBattleStage', img: 'kampfBattleImg', overlay: 'kampfBattleOverlay', tokens: 'kampfBattleTokens', hint: 'kampfBattleHint', fire: 'kampfBattleFireBtn', water: 'kampfBattleWaterBtn', oil: 'kampfBattleOilBtn', close: 'kampfBattleCloseBtn', cancel: 'kampfBattleCancelDrawBtn' }
      ];
    }

    function renderBattleBoards() {
      if (battleTokenDrag) return;
      applyBattleTokenSize();
      applyBattleGridSize();
      const hasMap = !!battle.image;
      battleBoardIds().forEach(ids => {
        const empty = document.getElementById(ids.empty);
        const stage = document.getElementById(ids.stage);
        const img = document.getElementById(ids.img);
        const hint = document.getElementById(ids.hint);
        if (!stage || !empty || !img) return;
        if (hint) hint.textContent = battleHintText();
        empty.classList.toggle('hidden', hasMap);
        stage.classList.toggle('hidden', !hasMap);
        stage.classList.toggle('is-drawing', !!battleHazardMode);
        stage.classList.toggle('is-aiming', canStartKampfAim());
        stage.classList.toggle('is-tooling', !!battleMapTool);
        if (hasMap) {
          if (img.getAttribute('data-src') !== battle.image) {
            img.src = battle.image;
            img.setAttribute('data-src', battle.image);
          }
        } else {
          img.removeAttribute('src');
          img.removeAttribute('data-src');
        }
        ['fire', 'water', 'oil'].forEach(type => {
          const btn = document.getElementById(ids[type]);
          if (!btn) return;
          btn.classList.toggle('primary', battleHazardMode === type);
          btn.classList.toggle('ghost', battleHazardMode !== type);
        });
        const closeBtn = document.getElementById(ids.close);
        const cancelBtn = document.getElementById(ids.cancel);
        if (closeBtn) closeBtn.classList.toggle('hidden', !battleHazardMode);
        if (cancelBtn) cancelBtn.classList.toggle('hidden', !battleHazardMode);
        renderBattleOverlay(ids.overlay);
        renderBattleTokens(ids.tokens, ids.stage);
        renderBattleFog();
        renderBattleRuler();
        syncBattleToolButtons();
      });
    }

    function roundedPolyPath(points, closed) {
      const n = points.length;
      if (!n) return '';
      const fmt = p => (Math.round(p.x * 100) / 100) + ' ' + (Math.round(p.y * 100) / 100);
      if (n === 1) return 'M ' + fmt(points[0]);
      if (n === 2) return 'M ' + fmt(points[0]) + ' L ' + fmt(points[1]);
      const radius = 2.4;
      const len = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
      const toward = (from, to, dist) => {
        const d = len(from, to);
        if (d < 1e-6) return { x: from.x, y: from.y };
        const t = Math.min(1, dist / d);
        return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
      };
      if (!closed) {
        let d = 'M ' + fmt(points[0]);
        for (let i = 1; i < n - 1; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const next = points[i + 1];
          const r = Math.min(radius, len(prev, curr) / 2, len(curr, next) / 2);
          const p1 = toward(curr, prev, r);
          const p2 = toward(curr, next, r);
          d += ' L ' + fmt(p1) + ' Q ' + fmt(curr) + ' ' + fmt(p2);
        }
        return d + ' L ' + fmt(points[n - 1]);
      }
      let d = '';
      for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];
        const r = Math.min(radius, len(prev, curr) / 2, len(curr, next) / 2);
        const p1 = toward(curr, prev, r);
        const p2 = toward(curr, next, r);
        d += (i ? ' L ' : 'M ') + fmt(p1) + ' Q ' + fmt(curr) + ' ' + fmt(p2);
      }
      return d + ' Z';
    }

    function renderBattleOverlay(overlayId) {
      const svg = document.getElementById(overlayId);
      if (!svg) return;
      svg.innerHTML = '';
      const ns = 'http://www.w3.org/2000/svg';
      const drawPoly = (points, type, id) => {
        if (points.length < 2) return;
        const spec = BATTLE_HAZARDS[type] || BATTLE_HAZARDS.fire;
        const poly = document.createElementNS(ns, 'path');
        poly.setAttribute('d', roundedPolyPath(points, points.length > 2));
        poly.setAttribute('fill', points.length > 2 ? spec.fill : 'none');
        poly.setAttribute('stroke', spec.stroke);
        poly.setAttribute('stroke-width', '0.7');
        poly.setAttribute('stroke-linejoin', 'round');
        poly.setAttribute('stroke-linecap', 'round');
        if (id) {
          poly.classList.add('battle-hazard');
          poly.setAttribute('data-id', id);
          if (isDM && !battleHazardMode) {
            poly.addEventListener('click', ev => {
              ev.stopPropagation();
              if (!confirm(spec.label + '-Fläche entfernen?')) return;
              if (!battle.removedHazards) battle.removedHazards = {};
              battle.removedHazards[id] = stampNow();
              battle.hazards = battle.hazards.filter(h => h.id !== id);
              persistBattleSoon();
              renderBattleBoards();
            });
          }
        }
        svg.appendChild(poly);
      };
      battle.hazards.forEach(h => drawPoly(h.points, h.type, h.id));
      if (battleDraft.length) {
        drawPoly(battleDraft, battleHazardMode || 'fire', '');
        battleDraft.forEach((p, i) => {
          const c = document.createElementNS(ns, 'circle');
          c.setAttribute('cx', p.x);
          c.setAttribute('cy', p.y);
          c.setAttribute('r', i === 0 ? 1.4 : 0.9);
          c.setAttribute('fill', '#f3ead8');
          c.setAttribute('stroke', '#1a140c');
          c.setAttribute('stroke-width', '0.3');
          svg.appendChild(c);
        });
      }
    }

    function renderBattleTokens(boxId, stageId) {
      const box = document.getElementById(boxId);
      const stage = document.getElementById(stageId);
      if (!box || !stage) return;
      box.innerHTML = '';
      battle.tokens.forEach(token => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'battle-token ' + (token.kind === 'player' ? 'is-player' : 'is-enemy');
        if (isOwnCombatOwner(token.playerId)) el.classList.add('is-mine');
        if (isCombatantActiveTurn(token.id)) el.classList.add('is-turn');
        if (kampfAimFrom && token.id === kampfAimFrom) el.classList.add('is-aim-from');
        if (kampfIsAimTarget(token.id)) el.classList.add('is-aim-to');
        const row = combatantById(token.id);
        if (row && combatantDown(row)) el.classList.add('is-down');
        if (row && combatantBloodied(row)) el.classList.add('is-bloodied');
        if (row && combatantIsConcentrating(row)) el.classList.add('is-conc');
        const hiddenByFog = battle.fogOn && !isDM && row && row.kind !== 'player' && !isOwnCombatOwner(token.playerId) && !battlePointRevealed(token.x, token.y);
        if (hiddenByFog) return;
        const movable = canMoveBattleToken(token);
        if (!movable) el.classList.add('is-locked');
        el.style.left = token.x + '%';
        el.style.top = token.y + '%';
        const face = document.createElement('div');
        face.className = 'battle-token-face';
        paintPortraitEl(face, token.portraitId, token.name);
        const label = document.createElement('span');
        label.textContent = token.name || '—';
        el.appendChild(face);
        if (row && combatantIsConcentrating(row)) {
          const conc = document.createElement('b');
          conc.className = 'battle-token-conc';
          conc.textContent = 'K';
          conc.title = 'Konzentration';
          el.appendChild(conc);
        }
        el.appendChild(label);
        if (row) {
          const hp = Math.max(0, Number(row.hp) || 0);
          const hpMax = Math.max(0, Number(row.hpMax) || 0);
          const pct = hpMax ? Math.max(0, Math.min(100, (hp / hpMax) * 100)) : 0;
          const bar = document.createElement('div');
          bar.className = 'battle-token-hp';
          if (combatantDown(row) || pct <= 0) bar.classList.add('is-down');
          else if (combatantBloodied(row) || pct <= 50) bar.classList.add('is-bloodied', 'is-mid');
          else if (pct <= 25) bar.classList.add('is-low');
          bar.style.setProperty('--hp', pct + '%');
          bar.appendChild(document.createElement('i'));
          el.appendChild(bar);
          const hpTxt = document.createElement('em');
          hpTxt.className = 'battle-token-hp-txt';
          hpTxt.textContent = hpMax ? (hp + '/' + hpMax) : String(hp);
          if (row.tempHp) hpTxt.textContent += ' +' + row.tempHp;
          el.appendChild(hpTxt);
          if (combat.started && isCombatantActiveTurn(row.id)) kampfEnsureMove(row);
          el.title = (token.name || '') + ' · ' + hpTxt.textContent + (row.ac ? ' · RK ' + row.ac : '') +
            (combat.started && isCombatantActiveTurn(row.id) ? ' · ' + Math.max(0, Number(row.moveLeft) || 0) + ' ft.' : '');
        }
        el.dataset.id = token.id;
        if (kampfPowerPhase === 'aim' && kampfPowerAction && token.id !== kampfAimFrom) {
          el.classList.add(kampfInRange(kampfAimFrom, token.id, kampfPowerAction) ? 'is-range-ok' : 'is-range-no');
        }
        if (isDM && !row) {
          const del = document.createElement('i');
          del.className = 'battle-token-del';
          del.title = 'Portrait von der Karte entfernen';
          del.textContent = '×';
          del.addEventListener('pointerdown', ev => ev.stopPropagation());
          del.addEventListener('click', ev => {
            ev.stopPropagation();
            if (confirm((token.name || 'Portrait') + ' von der Karte entfernen?')) removeBattleToken(token.id);
          });
          el.appendChild(del);
        }
        el.addEventListener('pointerenter', () => setBattleLink(token.id, false));
        el.addEventListener('pointerleave', () => {
          if (battleLinkHoverId === token.id) setBattleLink('', false);
        });
        el.addEventListener('click', ev => {
          ev.stopPropagation();
          if (battleTokenSuppressClick || battleTokenDragMoved) return;
          if (handleBattleToolAt(token.x, token.y, ev)) return;
          if (!activateKampfFigure(token.id)) setBattleLink(token.id, true);
        });
        if (movable && !battleHazardMode && !battleMapTool) {
          el.addEventListener('pointerdown', ev => startBattleTokenDrag(ev, token, stage, el));
        }
        box.appendChild(el);
      });
      applyBattleLinkHighlight();
      applyBattleTurnHighlight();
      renderKampfInitStrip();
      renderKampfPowerOverlay();
    }

    function battlePctFromEvent(stage, ev) {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 50, y: 50 };
      return {
        x: Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100))
      };
    }

    function battleGridMetrics(stage) {
      const empty = { width: 0, height: 0, cellW: 0, cellH: 0 };
      if (!stage) return empty;
      const width = stage.offsetWidth;
      const height = stage.offsetHeight;
      const cm = clampBattleGridSize(battle.gridSize);
      const frac = clampBattleGridFrac(battle.gridFrac);
      if (
        battleGridMetricsCache &&
        battleGridMetricsCache.gridSize === cm &&
        battleGridMetricsCache.gridFrac === frac &&
        battleGridMetricsCache.width === width &&
        battleGridMetricsCache.height === height
      ) return battleGridMetricsCache;
      let cellW = 0;
      if (frac && width) {
        cellW = frac * width;
      } else {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:0;top:0;width:' + cm + 'cm;height:' + cm + 'cm;visibility:hidden;pointer-events:none';
        stage.appendChild(probe);
        cellW = probe.offsetWidth || (cm * 96 / 2.54);
        probe.remove();
      }
      const cellH = cellW;
      battleGridMetricsCache = { width: width, height: height, cellW: cellW, cellH: cellH, gridSize: cm, gridFrac: frac };
      return battleGridMetricsCache;
    }

    function snapBattlePct(stage, pct) {
      return {
        x: Math.max(0, Math.min(100, Number(pct && pct.x) || 0)),
        y: Math.max(0, Math.min(100, Number(pct && pct.y) || 0))
      };
    }

    function snapBattleTokenPos(t) {
      const stage = document.getElementById('kampfBattleStage');
      if (!t || !stage || stage.classList.contains('hidden')) return t;
      const next = snapBattlePct(stage, { x: t.x, y: t.y });
      t.x = next.x;
      t.y = next.y;
      return t;
    }

    function startBattleTokenDrag(ev, token, stage, el) {
      if (ev.button != null && ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      try { el.setPointerCapture(ev.pointerId); } catch (err) {}
      battleTokenDragMoved = false;
      battleTokenSuppressClick = false;
      const originX = ev.clientX;
      const originY = ev.clientY;
      const tapSlop = ev.pointerType === 'mouse' ? 8 : 16;
      const startPos = { x: Number(token.x), y: Number(token.y) };
      const row = combatantById(token.id);
      if (row && combat.started && isCombatantActiveTurn(token.id)) kampfEnsureMove(row);
      const spendMove = !!(combat.started && row && isCombatantActiveTurn(token.id));
      const startNeighbors = spendMove ? kampfMeleeNeighbors(token.id) : [];
      const moveBudget = spendMove ? Math.max(0, Number(row.moveLeft) || 0) : 9999;
      battleTokenDrag = { id: token.id, pointerId: ev.pointerId, el: el, stage: stage };
      el.classList.add('is-dragging');
      const move = e => {
        if (!battleTokenDrag || e.pointerId !== battleTokenDrag.pointerId) return;
        if (Math.abs(e.clientX - originX) + Math.abs(e.clientY - originY) > tapSlop) {
          battleTokenDragMoved = true;
        }
        let pct = snapBattlePct(stage, battlePctFromEvent(stage, e));
        if (spendMove && moveBudget < 9999) {
          const want = kampfPctDistanceFeet(startPos, pct);
          if (want > moveBudget && want > 0) {
            const f = moveBudget / want;
            pct = {
              x: startPos.x + (pct.x - startPos.x) * f,
              y: startPos.y + (pct.y - startPos.y) * f
            };
            pct = snapBattlePct(stage, pct);
          }
        }
        const t = battle.tokens.find(x => x.id === token.id);
        if (!t) return;
        t.x = pct.x;
        t.y = pct.y;
        el.style.left = t.x + '%';
        el.style.top = t.y + '%';
      };
      const up = e => {
        if (!battleTokenDrag || e.pointerId !== battleTokenDrag.pointerId) return;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        el.classList.remove('is-dragging');
        battleTokenDrag = null;
        if (battleTokenDragMoved) {
          const t = battle.tokens.find(x => x.id === token.id);
          if (t) {
            const pct = snapBattlePct(stage, { x: t.x, y: t.y });
            t.x = pct.x;
            t.y = pct.y;
            t.movedAt = stampNow();
            if (battle.removedTokens) delete battle.removedTokens[t.id];
            el.style.left = t.x + '%';
            el.style.top = t.y + '%';
            if (spendMove && row) {
              const used = kampfPctDistanceFeet(startPos, t);
              row.moveLeft = Math.max(0, (Number(row.moveLeft) || 0) - used);
              touchCombatant(row);
              const endNeighbors = kampfMeleeNeighbors(token.id);
              kampfOpportunity(token.id, startNeighbors, endNeighbors);
              kampfApplyHazards(row, t);
              persistCombat();
              syncKampfAimUi();
            }
          }
        }
        persistBattleSoon();
        if (pendingBattleSnap) {
          const snap = pendingBattleSnap;
          pendingBattleSnap = null;
          applyBattle(snap, true);
        }
        const wasMoved = battleTokenDragMoved;
        battleTokenSuppressClick = true;
        setTimeout(() => { battleTokenSuppressClick = false; }, 450);
        battleTokenDragMoved = false;
        if (!wasMoved) {
          if (!handleBattleToolAt(token.x, token.y, e) && !activateKampfFigure(token.id)) {
            setBattleLink(token.id, true);
          }
        }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }

    function setBattleHazardMode(type) {
      if (!isDM) return;
      battleHazardMode = battleHazardMode === type ? null : type;
      if (battleHazardMode) battleMapTool = null;
      if (!battleHazardMode) battleDraft = [];
      closeKampfBattleGear();
      renderBattleBoards();
    }

    function cancelBattleDraw() {
      battleHazardMode = null;
      battleDraft = [];
      renderBattleBoards();
    }

    function closeBattleDraft() {
      if (!isDM || !battleHazardMode) return;
      if (battleDraft.length < 3) {
        toast('Mindestens drei Punkte für eine Fläche.');
        return;
      }
      battle.hazards.push(normalizeBattleHazard({
        id: combatNewId('h'),
        type: battleHazardMode,
        points: battleDraft.slice(),
        updatedAt: stampNow()
      }));
      if (battle.removedHazards) delete battle.removedHazards[battle.hazards[battle.hazards.length - 1].id];
      battleDraft = [];
      battleHazardMode = null;
      persistBattleSoon();
      renderBattleBoards();
    }

    function onBattleStageClick(ev, stage) {
      const board = document.getElementById('kampfBattleBoard');
      if (board && board.dataset.battlePanned === '1') {
        board.dataset.battlePanned = '';
        return;
      }
      if (isDM && battleHazardMode && battle.image) {
        const pct = battlePctFromEvent(stage, ev);
        if (battleDraft.length >= 3) {
          const first = battleDraft[0];
          const dx = pct.x - first.x;
          const dy = pct.y - first.y;
          if (dx * dx + dy * dy < 9) {
            closeBattleDraft();
            return;
          }
        }
        battleDraft.push(pct);
        renderBattleBoards();
        return;
      }
      const pct = battlePctFromEvent(stage, ev);
      if (handleBattleToolAt(pct.x, pct.y, ev)) return;
      if (kampfPowerPhase) { cancelKampfAim(); return; }
      if (isDM && combat.started && kampfAimFrom) cancelKampfAim();
    }

    function battlePointRevealed(x, y) {
      if (!battle.fogOn) return true;
      return (battle.fogReveals || []).some(c => {
        const dx = x - c.x;
        const dy = y - c.y;
        return (dx * dx + dy * dy) <= (c.r * c.r);
      });
    }

    function battleFogRadiusPct(stage) {
      const m = battleGridMetrics(stage || document.getElementById('kampfBattleStage'));
      if (!m.width || !m.cellW) return 8;
      return Math.max(4, Math.min(18, (m.cellW * 1.55 / m.width) * 100));
    }

    function syncBattleToolButtons() {
      const map = {
        kampfBattleRulerBtn: 'ruler',
        kampfBattlePingBtn: 'ping',
        kampfBattleFogRevealBtn: 'fog-reveal',
        kampfBattleFogHideBtn: 'fog-hide'
      };
      Object.keys(map).forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const on = battleMapTool === map[id];
        btn.classList.toggle('primary', on);
        btn.classList.toggle('ghost', !on);
      });
      const fogBtn = document.getElementById('kampfBattleFogBtn');
      if (fogBtn) {
        fogBtn.classList.toggle('primary', !!battle.fogOn);
        fogBtn.classList.toggle('ghost', !battle.fogOn);
      }
      const reveal = document.getElementById('kampfBattleFogRevealBtn');
      const hide = document.getElementById('kampfBattleFogHideBtn');
      if (reveal) reveal.classList.toggle('hidden', !isDM || !battle.fogOn);
      if (hide) hide.classList.toggle('hidden', !isDM || !battle.fogOn);
    }

    function setBattleMapTool(tool) {
      battleMapTool = battleMapTool === tool ? null : tool;
      if (battleMapTool) {
        battleHazardMode = null;
        battleDraft = [];
      }
      if (battleMapTool !== 'ruler') {
        battleRulerFrom = null;
        battleRulerTo = null;
        battleRulerHover = null;
      }
      closeKampfBattleGear();
      renderBattleBoards();
    }

    function toggleBattleFog() {
      if (!isDM) return;
      battle.fogOn = !battle.fogOn;
      battle.layoutAt = stampNow();
      if (battle.fogOn) battleMapTool = 'fog-reveal';
      else if (battleMapTool === 'fog-reveal' || battleMapTool === 'fog-hide') battleMapTool = null;
      persistBattleSoon();
      closeKampfBattleGear();
      renderBattleBoards();
    }

    function handleBattleToolAt(x, y, ev) {
      if (!battleMapTool) return false;
      if (ev) ev.preventDefault && ev.preventDefault();
      if (battleMapTool === 'ping') {
        spawnBattlePing(x, y, true);
        return true;
      }
      if (battleMapTool === 'ruler') {
        if (!battleRulerFrom || battleRulerTo) {
          battleRulerFrom = { x: x, y: y };
          battleRulerTo = null;
        } else {
          battleRulerTo = { x: x, y: y };
        }
        renderBattleRuler();
        return true;
      }
      if (battleMapTool === 'fog-reveal' && isDM) {
        const stage = document.getElementById('kampfBattleStage');
        const reveal = normalizeFogReveal({
          id: combatNewId('fog'),
          x: x,
          y: y,
          r: battleFogRadiusPct(stage),
          updatedAt: stampNow()
        });
        if (!battle.fogReveals) battle.fogReveals = [];
        if (!battle.removedFog) battle.removedFog = {};
        battle.fogReveals.push(reveal);
        delete battle.removedFog[reveal.id];
        persistBattleSoon();
        renderBattleFog();
        return true;
      }
      if (battleMapTool === 'fog-hide' && isDM) {
        let best = -1;
        let bestD = Infinity;
        (battle.fogReveals || []).forEach((c, i) => {
          const d = Math.hypot(c.x - x, c.y - y);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        if (best >= 0 && bestD <= 12) {
          const gone = battle.fogReveals[best];
          battle.fogReveals.splice(best, 1);
          if (!battle.removedFog) battle.removedFog = {};
          battle.removedFog[gone.id] = stampNow();
          persistBattleSoon();
          renderBattleFog();
        }
        return true;
      }
      return false;
    }

    function spawnBattlePing(x, y, persist) {
      const box = document.getElementById('kampfBattlePings');
      if (box) {
        const el = document.createElement('i');
        el.style.left = x + '%';
        el.style.top = y + '%';
        box.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1600);
      }
      if (persist) {
        lastBattlePingAt = stampNow();
        battle.ping = { x: x, y: y, at: lastBattlePingAt };
        persistBattleSoon();
      }
    }

    function battleGridDistance(a, b) {
      const stage = document.getElementById('kampfBattleStage');
      const m = battleGridMetrics(stage);
      if (!a || !b || !m.cellW) return { cells: 0 };
      const dx = Math.abs(a.x - b.x) / 100 * m.width;
      const dy = Math.abs(a.y - b.y) / 100 * m.height;
      const cells = Math.max(dx / m.cellW, dy / m.cellH);
      return { cells: Math.round(cells * 10) / 10 };
    }

    function renderBattleRuler() {
      const svg = document.getElementById('kampfBattleRuler');
      const label = document.getElementById('kampfBattleRulerLabel');
      if (!svg) return;
      svg.innerHTML = '';
      if (!battleRulerFrom) {
        if (label) label.classList.add('hidden');
        return;
      }
      const to = battleRulerTo || battleRulerHover || battleRulerFrom;
      const ns = 'http://www.w3.org/2000/svg';
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', battleRulerFrom.x);
      line.setAttribute('y1', battleRulerFrom.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', '#f3e6c0');
      line.setAttribute('stroke-width', '0.7');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
      [battleRulerFrom, to].forEach(p => {
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', p.x);
        c.setAttribute('cy', p.y);
        c.setAttribute('r', '1.1');
        c.setAttribute('fill', '#f3e6c0');
        svg.appendChild(c);
      });
      if (label) {
        const dist = battleGridDistance(battleRulerFrom, to);
        label.textContent = dist.cells + ' Feld' + (dist.cells === 1 ? '' : 'er');
        label.style.left = ((battleRulerFrom.x + to.x) / 2) + '%';
        label.style.top = ((battleRulerFrom.y + to.y) / 2) + '%';
        label.classList.toggle('hidden', !(battleRulerTo || battleRulerHover) || dist.cells < 0.15);
      }
    }

    function renderBattleFog() {
      const canvas = document.getElementById('kampfBattleFog');
      const stage = document.getElementById('kampfBattleStage');
      if (!canvas || !stage) return;
      const on = !!battle.fogOn && !!battle.image;
      canvas.classList.toggle('hidden', !on);
      if (!on) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDM ? 'rgba(8,6,4,0.46)' : 'rgba(6,5,4,0.92)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      (battle.fogReveals || []).forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x / 100 * w, c.y / 100 * h, c.r / 100 * w, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    async function uploadBattleMap(file) {
      if (!isDM || !file) return;
      toast('Kampfkarte wird hochgeladen…');
      try {
        const image = await fileToMapImage(file);
        battle.image = image;
        await persistBattleMap();
        renderBattleBoards();
        toast('Kampfkarte ist für alle sichtbar.');
      } catch (err) {
        toast(err.message || 'Kampfkarte konnte nicht hochgeladen werden.');
      }
    }

    async function clearBattleMap() {
      if (!isDM) return;
      if (!battle.image) return;
      if (!confirm('Die Kampfkarte entfernen? Figuren und Flächen bleiben.')) return;
      battle.image = '';
      try {
        await persistBattleMap();
        renderBattleBoards();
        toast('Kampfkarte entfernt.');
      } catch (err) {
        toast(err.message || 'Karte konnte nicht entfernt werden.');
      }
      resetBattleView();
    }

    function sortedRosterCards() {
      return rosterCards.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
    }

    function karteById(id) {
      return rosterCards.find(c => c.id === id) || null;
    }

    function firstStatNumber(line) {
      const m = String(line || '').match(/\d+/);
      return m ? m[0] : '';
    }

    function canEntryBecomeKarte(e) {
      return !!(e && (BESTIARIUM_CATS.includes(e.type) || e.type === 'NPCs'));
    }

    function combatCardDraftFromEntry(e) {
      const parsed = parseStatSheetText(htmlToText(e.content || ''));
      const s = parsed.stats || {};
      return {
        name: (e.title || '').trim(),
        hp: firstStatNumber(s.hp),
        ac: firstStatNumber(s.ac)
      };
    }

    function updateEntryToKarteBtn() {
      const btn = document.getElementById('entryToKarteBtn');
      if (!btn) return;
      const e = currentIndex !== null ? entries[currentIndex] : null;
      const show = !!(isDM && e && canEntryBecomeKarte(e) && !els.viewer.classList.contains('hidden'));
      btn.classList.toggle('hidden', !show);
    }

    async function createKampfKarteFromEntry() {
      if (!isDM || currentIndex === null) return;
      const e = entries[currentIndex];
      if (!canEntryBecomeKarte(e)) return;
      const draft = combatCardDraftFromEntry(e);
      if (!draft.name) return toast('Der Eintrag braucht einen Namen.');
      const existing = rosterCards.find(c => (c.name || '').toLowerCase() === draft.name.toLowerCase());
      if (existing && !confirm('Es gibt schon eine Karte „' + existing.name + '“. Werte ersetzen?')) return;
      const next = normalizeKarte({
        id: existing ? existing.id : combatNewId('k'),
        name: draft.name,
        hp: draft.hp,
        ac: draft.ac,
        count: existing ? existing.count : 1,
        note: existing && existing.note.length <= 80 ? existing.note : '',
        portraitId: (existing && existing.portraitId) || e.imageId || ''
      });
      const previous = rosterCards;
      try {
        rosterCards = existing
          ? rosterCards.map(c => c.id === existing.id ? next : c)
          : rosterCards.concat([next]);
        await persistRoster();
        renderKampfKartenList();
        const missing = !next.hp && !next.ac;
        toast(missing
          ? 'Kampfkarte angelegt. TP und Rüstung fehlen — bitte prüfen.'
          : (existing ? 'Kampfkarte aktualisiert.' : 'Kampfkarte angelegt.'));
      } catch (err) {
        rosterCards = previous;
        toast('Kampfkarte fehlgeschlagen: ' + err.message);
      }
    }

    function clearKarteForm() {
      editingKarteId = null;
      document.getElementById('kampfKartenEditTitle').textContent = 'Neue Karte';
      document.getElementById('kampfKarteName').value = '';
      document.getElementById('kampfKarteHp').value = '';
      document.getElementById('kampfKarteAc').value = '';
      document.getElementById('kampfKarteCount').value = '';
      document.getElementById('kampfKarteNote').value = '';
      document.getElementById('kampfKarteCancelBtn').classList.add('hidden');
      document.getElementById('kampfKarteDeleteBtn').classList.add('hidden');
      kartePortraitId = '';
      pendingKartePortrait = null;
      updateKartePortraitStatus();
    }

    function updateKartePortraitStatus() {
      const el = document.getElementById('kampfKartePortraitStatus');
      if (!el) return;
      if (pendingKartePortrait) el.textContent = 'Neues Portrait bereit';
      else if (kartePortraitId) el.textContent = 'Portrait vorhanden';
      else el.textContent = 'Kein Portrait';
    }

    function fillKarteForm(karte) {
      editingKarteId = karte.id;
      document.getElementById('kampfKartenEditTitle').textContent = 'Karte bearbeiten';
      document.getElementById('kampfKarteName').value = karte.name;
      document.getElementById('kampfKarteHp').value = karte.hp || '';
      document.getElementById('kampfKarteAc').value = karte.ac || '';
      document.getElementById('kampfKarteCount').value = karte.count > 1 ? karte.count : '';
      document.getElementById('kampfKarteNote').value = karte.note || '';
      document.getElementById('kampfKarteCancelBtn').classList.remove('hidden');
      document.getElementById('kampfKarteDeleteBtn').classList.remove('hidden');
      kartePortraitId = karte.portraitId || '';
      pendingKartePortrait = null;
      updateKartePortraitStatus();
      document.getElementById('kampfKarteName').focus();
    }

    async function saveKampfKarte() {
      if (!isDM) return;
      const name = (document.getElementById('kampfKarteName').value || '').trim();
      if (!name) {
        toast('Bitte einen Namen für die Karte.');
        return;
      }
      const next = normalizeKarte({
        id: editingKarteId || combatNewId('k'),
        name: name,
        hp: document.getElementById('kampfKarteHp').value,
        ac: document.getElementById('kampfKarteAc').value,
        count: document.getElementById('kampfKarteCount').value,
        note: document.getElementById('kampfKarteNote').value,
        portraitId: kartePortraitId
      });
      const previous = rosterCards;
      try {
        if (pendingKartePortrait) {
          const imageId = newImageId();
          await persistEntryImage(imageId, pendingKartePortrait);
          next.portraitId = imageId;
          kartePortraitId = imageId;
          pendingKartePortrait = null;
        }
        if (editingKarteId) {
          rosterCards = rosterCards.map(c => c.id === editingKarteId ? next : c);
        } else {
          rosterCards = rosterCards.concat([next]);
        }
        await persistRoster();
        clearKarteForm();
        renderKampfKartenList();
        toast('Karte gespeichert.');
      } catch (err) {
        rosterCards = previous;
        toast('Speichern fehlgeschlagen: ' + err.message);
      }
    }

    async function deleteKampfKarte() {
      if (!isDM || !editingKarteId) return;
      const karte = karteById(editingKarteId);
      if (!karte) return;
      if (!confirm('Karte „' + karte.name + '“ löschen?')) return;
      const previous = rosterCards;
      rosterCards = rosterCards.filter(c => c.id !== editingKarteId);
      try {
        await persistRoster();
        clearKarteForm();
        renderKampfKartenList();
        toast('Karte entfernt.');
      } catch (err) {
        rosterCards = previous;
        toast('Löschen fehlgeschlagen: ' + err.message);
      }
    }

    function addKarteToCombat(id) {
      const karte = karteById(id);
      if (!karte) return;
      const override = Number(document.getElementById('kampfKartenUseCount').value);
      const count = Number.isFinite(override) && override >= 1 ? override : karte.count;
      addCombatant({
        name: uniqueCombatName(karte.name),
        kind: 'enemy',
        init: 0,
        hp: karte.hp,
        hpMax: karte.hp,
        ac: karte.ac,
        count: count,
        countMax: count,
        note: karte.note,
        portraitId: karte.portraitId || ''
      });
      toast(karte.name + ' in den Kampf. Initiative noch eintragen.');
    }

    function combatantBaseName(name) {
      return String(name || '').replace(/\s+\d+$/, '').trim();
    }

    function karteForCombatant(row) {
      if (!row) return null;
      const want = combatantBaseName(row.name).toLowerCase();
      if (!want) return null;
      return rosterCards.find(c => (c.name || '').toLowerCase() === want) || null;
    }

    function statSheetImageIdForCombatant(row) {
      if (!row) return '';
      const karte = karteForCombatant(row);
      if (karte && karte.portraitId) return karte.portraitId;
      const want = combatantBaseName(row.name).toLowerCase();
      if (want) {
        const entry = entries.find(e => canEntryBecomeKarte(e) && (e.title || '').trim().toLowerCase() === want && e.imageId);
        if (entry) return entry.imageId;
      }
      if (row.portraitId) return row.portraitId;
      return '';
    }

    function closeStatSheetOverlay() {
      const overlay = document.getElementById('statSheetOverlay');
      const img = document.getElementById('statSheetImg');
      if (overlay) overlay.classList.add('hidden');
      if (img) {
        img.classList.add('hidden');
        img.removeAttribute('src');
      }
    }

    function openStatSheetOverlay(row) {
      if (!isDM || !row) return;
      const imageId = statSheetImageIdForCombatant(row);
      if (!imageId) {
        toast('Kein Stat-Sheet-Bild hinterlegt.');
        return;
      }
      const overlay = document.getElementById('statSheetOverlay');
      const title = document.getElementById('statSheetTitle');
      const empty = document.getElementById('statSheetEmpty');
      const img = document.getElementById('statSheetImg');
      if (!overlay || !img) return;
      if (title) title.textContent = row.name || 'Stat-Sheet';
      if (empty) empty.classList.add('hidden');
      img.classList.add('hidden');
      img.alt = (row.name || 'Stat-Sheet') + ' Stat-Sheet';
      const show = src => {
        if (!src) {
          toast('Kein Stat-Sheet-Bild hinterlegt.');
          return;
        }
        img.src = src;
        img.classList.remove('hidden');
        overlay.classList.remove('hidden');
      };
      if (imageCache[imageId]) show(imageCache[imageId]);
      else {
        overlay.classList.remove('hidden');
        loadEntryImage(imageId).then(show).catch(() => {
          overlay.classList.add('hidden');
          toast('Das Stat-Sheet-Bild konnte nicht geladen werden.');
        });
      }
    }

    function makeStatSheetBtn(row) {
      if (!isDM || !row || !statSheetImageIdForCombatant(row)) return null;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ghost kampf-sheet-btn';
      btn.textContent = 'Sheet';
      btn.title = 'Stat-Sheet anzeigen';
      btn.onclick = ev => {
        ev.stopPropagation();
        openStatSheetOverlay(row);
      };
      return btn;
    }

    function renderKampfKartenList() {
      const box = document.getElementById('kampfKartenList');
      if (!box) return;
      box.innerHTML = '';
      const query = (document.getElementById('kampfKartenSearch').value || '').trim().toLowerCase();
      const list = sortedRosterCards().filter(c => {
        if (!query) return true;
        return (c.name || '').toLowerCase().includes(query) || (c.note || '').toLowerCase().includes(query);
      });
      if (!rosterCards.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.padding = '0.2rem 0 0';
        empty.textContent = 'Noch keine Karten. Unten eine anlegen, dann in der Sitzung nur noch antippen.';
        box.appendChild(empty);
        return;
      }
      if (!list.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.padding = '0.2rem 0 0';
        empty.textContent = 'Keine passende Karte.';
        box.appendChild(empty);
        return;
      }
      list.forEach(karte => {
        const row = document.createElement('div');
        row.className = 'kampf-karte-row';
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'ghost kampf-karte-add';
        const title = document.createElement('b');
        title.textContent = karte.name;
        const meta = document.createElement('span');
        const bits = [];
        bits.push((karte.hp || 0) + ' TP');
        if (karte.ac) bits.push('Rüstung ' + karte.ac);
        if (karte.count > 1) bits.push('×' + karte.count);
        if (karte.note) bits.push(karte.note);
        meta.textContent = bits.join(' · ');
        const text = document.createElement('div');
        text.style.minWidth = '0';
        text.appendChild(title);
        text.appendChild(meta);
        add.appendChild(text);
        add.title = 'In den Kampf setzen';
        add.onclick = () => addKarteToCombat(karte.id);
        if (karte.portraitId) {
          const face = document.createElement('div');
          face.className = 'karte-face';
          paintPortraitEl(face, karte.portraitId, karte.name);
          add.prepend(face);
        }
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'ghost';
        edit.textContent = '✎';
        edit.title = 'Karte bearbeiten';
        edit.onclick = () => fillKarteForm(karte);
        row.appendChild(add);
        row.appendChild(edit);
        box.appendChild(row);
      });
    }

    function emptyCombat() {
      return { round: 1, started: false, activeId: null, debuffTick: 'turn', turnAt: 0, combatants: [], removed: {}, log: [], logResetAt: 0, updatedAt: 0 };
    }

    function parseSheetHp(str) {
      const m = String(str || '').match(/(\d+)\s*(?:\/\s*(\d+))?/);
      if (!m) return { hp: 0, hpMax: 0 };
      const a = Number(m[1]);
      const b = m[2] ? Number(m[2]) : a;
      return { hp: a, hpMax: Math.max(a, b) };
    }

    function parseCombatInit(v) {
      const n = Number(String(v == null ? '' : v).replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    }

    function combatNewId(prefix) {
      return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function uniqueCombatName(base) {
      const name = (base || '').trim() || 'Gegner';
      const taken = combat.combatants.map(c => (c.name || '').toLowerCase());
      if (!taken.includes(name.toLowerCase())) return name;
      let n = 2;
      while (taken.includes((name + ' ' + n).toLowerCase())) n += 1;
      return name + ' ' + n;
    }

    function normalizeCombatDebuffs(list) {
      return (Array.isArray(list) ? list : []).map(d => ({
        id: d.id || combatNewId('d'),
        text: d.text || '',
        kind: d.kind === 'buff' ? 'buff' : 'debuff',
        rounds: d.rounds == null || d.rounds === '' ? null : Number(d.rounds)
      })).filter(d => d.text && (d.rounds == null || d.rounds > 0));
    }

    function normalizeCombatant(c) {
      const countMax = Math.max(1, Number(c.countMax) || Number(c.count) || 1);
      let count = Number(c.count);
      if (!Number.isFinite(count)) count = countMax;
      return {
        id: c.id || combatNewId('c'),
        name: c.name || '',
        kind: c.kind === 'player' ? 'player' : 'enemy',
        playerId: c.playerId || '',
        init: parseCombatInit(c.init),
        order: Number(c.order) || 0,
        hp: Number(c.hp) || 0,
        hpMax: Number(c.hpMax) || 0,
        tempHp: Math.max(0, Number(c.tempHp) || 0),
        ac: c.ac == null ? '' : String(c.ac),
        note: c.note || '',
        count: Math.max(0, count),
        countMax: countMax,
        concentrating: !!c.concentrating,
        ready: !!c.ready,
        delayed: !!c.delayed,
        actionUsed: !!c.actionUsed,
        bonusUsed: !!c.bonusUsed,
        reactionUsed: !!c.reactionUsed,
        moveMax: Math.max(0, Number(c.moveMax) || 0),
        moveLeft: Math.max(0, Number(c.moveLeft) || 0),
        debuffs: normalizeCombatDebuffs(c.debuffs),
        portraitId: typeof c.portraitId === 'string' ? c.portraitId : '',
        updatedAt: stamp(c.updatedAt)
      };
    }

    function touchCombatant(row) {
      if (row) row.updatedAt = stampNow();
    }

    function touchCombatTurn() {
      combat.turnAt = stampNow();
    }

    function markCombatRemoved(id) {
      if (!id) return;
      if (!combat.removed || typeof combat.removed !== 'object') combat.removed = {};
      combat.removed[id] = stampNow();
    }

    function normalizeCombatState(raw) {
      const data = raw && typeof raw === 'object' ? raw : {};
      return {
        updatedAt: stamp(data.updatedAt),
        turnAt: stamp(data.turnAt),
        round: Math.max(1, Number(data.round) || 1),
        started: !!data.started,
        activeId: data.activeId || null,
        debuffTick: data.debuffTick === 'round' ? 'round' : 'turn',
        combatants: (Array.isArray(data.combatants) ? data.combatants : []).map(normalizeCombatant),
        removed: Object.assign({}, data.removed && typeof data.removed === 'object' && !Array.isArray(data.removed) ? data.removed : {}),
        logResetAt: stamp(data.logResetAt),
        log: mergeCombatLogs(data.log, [], stamp(data.logResetAt))
      };
    }

    function mergeCombatStates(a, b) {
      a = normalizeCombatState(a);
      b = normalizeCombatState(b);
      const turnSrc = stamp(b.turnAt) >= stamp(a.turnAt) ? b : a;
      const removed = mergeStampMap(a.removed, b.removed);
      const byId = {};
      a.combatants.concat(b.combatants).forEach(c => {
        const prev = byId[c.id];
        if (!prev || stamp(c.updatedAt) >= stamp(prev.updatedAt)) byId[c.id] = c;
      });
      const combatants = Object.keys(byId).map(id => byId[id]).filter(c => stamp(c.updatedAt) >= stamp(removed[c.id]));
      const logResetAt = Math.max(stamp(a.logResetAt), stamp(b.logResetAt));
      return {
        updatedAt: Math.max(stamp(a.updatedAt), stamp(b.updatedAt)),
        turnAt: Math.max(stamp(a.turnAt), stamp(b.turnAt)),
        round: Math.max(1, Number(turnSrc.round) || 1),
        started: !!turnSrc.started,
        activeId: turnSrc.activeId || null,
        debuffTick: turnSrc.debuffTick === 'round' ? 'round' : 'turn',
        combatants: combatants,
        removed: removed,
        logResetAt: logResetAt,
        log: mergeCombatLogs(a.log, b.log, logResetAt)
      };
    }

    function sortedCombatants() {
      return combat.combatants.slice().sort((a, b) => {
        const di = parseCombatInit(b.init) - parseCombatInit(a.init);
        if (di) return di;
        const o = (Number(a.order) || 0) - (Number(b.order) || 0);
        if (o) return o;
        return (a.name || '').localeCompare(b.name || '', 'de');
      });
    }

    function stripUdoFromCombatState() {
      if (!combat || !Array.isArray(combat.combatants)) return false;
      const next = combat.combatants.filter(c => String(c.playerId || '').toLowerCase() !== 'udo');
      if (next.length === combat.combatants.length) return false;
      combat.combatants = next;
      return true;
    }

    function persistCombat() {
      combat.updatedAt = stampNow();
      persistCombatLocal();
      persistCombatSoon();
    }

    function loadCombat() {
      try {
        const raw = JSON.parse(localStorage.getItem(COMBAT_KEY) || 'null');
        if (!raw || typeof raw !== 'object') {
          combat = emptyCombat();
          return;
        }
        combat = normalizeCombatState(raw);
      } catch (err) {
        combat = emptyCombat();
      }
    }

    function loadCombatTemplates() {
      return combatTemplates.slice();
    }

    function persistCombatTemplatesLocal() {
      writeLocal(COMBAT_TEMPLATES_KEY, JSON.stringify({
        updatedAt: templatesUpdatedAt,
        templates: combatTemplates.slice(0, 24)
      }));
    }

    function loadCombatTemplatesLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(COMBAT_TEMPLATES_KEY) || 'null');
        if (Array.isArray(raw)) {
          combatTemplates = raw;
          templatesUpdatedAt = 0;
          return;
        }
        if (!raw || typeof raw !== 'object') return;
        templatesUpdatedAt = Number(raw.updatedAt) || 0;
        combatTemplates = Array.isArray(raw.templates) ? raw.templates : [];
      } catch (err) {
        combatTemplates = [];
      }
    }

    function applyCombatTemplates(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= templatesUpdatedAt) return;
      templatesUpdatedAt = at;
      combatTemplates = Array.isArray(data.templates) ? data.templates : [];
      persistCombatTemplatesLocal();
      if (currentPage === 'kampf') renderKampf();
    }

    function listenCombatTemplates() {
      if (!db) return;
      templatesRef().onSnapshot(snap => {
        if (writingTemplates || !snap.exists) return;
        applyCombatTemplates(snap.data());
      });
    }

    async function persistCombatTemplatesRemote() {
      if (!db) return;
      const nextAt = Date.now();
      writingTemplates = true;
      try {
        await templatesRef().set({
          updatedAt: nextAt,
          templates: combatTemplates.slice(0, 24)
        });
        templatesUpdatedAt = nextAt;
        persistCombatTemplatesLocal();
      } catch (err) {
        toast('Vorlagen konnten nicht gespeichert werden: ' + err.message);
      } finally {
        writingTemplates = false;
      }
    }

    function persistCombatTemplates(list) {
      combatTemplates = (list || []).slice(0, 24);
      templatesUpdatedAt = Date.now();
      persistCombatTemplatesLocal();
      clearTimeout(templatesPersistTimer);
      templatesPersistTimer = setTimeout(() => { persistCombatTemplatesRemote(); }, 180);
    }

    function combatLog(line) {
      combat.log.unshift({ t: stampNow(), text: 'Runde ' + combat.round + ' · ' + line });
      combat.log = combat.log.slice(0, 20);
    }

    function combatantDown(row) {
      return !row || row.hp <= 0 || row.count <= 0;
    }

    function combatantBloodied(row) {
      if (!row || combatantDown(row)) return false;
      const max = Number(row.hpMax) || 0;
      if (!max) return false;
      return (Number(row.hp) || 0) <= max / 2;
    }

    function combatantIsConcentrating(row) {
      if (!row) return false;
      if (row.concentrating) return true;
      return (row.debuffs || []).some(d => /konzentration/i.test(String(d.text || '')));
    }

    function setCombatantConcentrating(row, on) {
      if (!row) return;
      row.concentrating = !!on;
      row.debuffs = (row.debuffs || []).filter(d => !/konzentration/i.test(String(d.text || '')));
      if (on) {
        row.debuffs.push({ id: combatNewId('d'), text: 'Konzentration', rounds: null, kind: 'buff' });
      }
      touchCombatant(row);
    }

    function combatHpFromOwner(playerId) {
      const rec = sheetOwnerRecord(playerId);
      const sheet = rec && rec.sheet || {};
      const dnd = sheet.dnd || {};
      const ac = String(dnd.ac || sheet.armor || '').trim();
      const cur = Number(dnd.hpCurrent);
      const max = Number(dnd.hpMax);
      if (Number.isFinite(cur) || Number.isFinite(max)) {
        return {
          hp: Number.isFinite(cur) ? Math.max(0, cur) : (Number.isFinite(max) ? max : 0),
          hpMax: Number.isFinite(max) ? Math.max(0, max) : (Number.isFinite(cur) ? cur : 0),
          tempHp: Math.max(0, Number(dnd.hpTemp) || 0),
          ac: ac
        };
      }
      const hp = parseSheetHp(sheet.hp);
      return { hp: hp.hp, hpMax: hp.hpMax, tempHp: 0, ac: ac || String(sheet.armor || '') };
    }

    function syncCombatantHpToSheet(row) {
      if (!row || row.kind !== 'player' || !row.playerId || row.playerId === ILLUSION_OWNER) return;
      const rec = sheetOwnerRecord(row.playerId);
      if (!rec || !rec.sheet) return;
      rec.sheet.hp = row.hpMax ? (row.hp + '/' + row.hpMax) : String(row.hp || '');
      if (row.ac) rec.sheet.armor = row.ac;
      rec.sheet.dnd = normalizeDndSheet(rec.sheet.dnd);
      rec.sheet.dnd.hpCurrent = String(row.hp || 0);
      rec.sheet.dnd.hpMax = String(row.hpMax || 0);
      rec.sheet.dnd.hpTemp = row.tempHp ? String(row.tempHp) : '';
      if (row.ac) rec.sheet.dnd.ac = row.ac;
      if (currentSheetOwner === row.playerId) {
        dndState.hpCurrent = rec.sheet.dnd.hpCurrent;
        dndState.hpMax = rec.sheet.dnd.hpMax;
        dndState.hpTemp = rec.sheet.dnd.hpTemp;
        if (row.ac) dndState.ac = row.ac;
        applyDndFields();
        refreshDndCalcs();
      }
      persistPlayersSoon();
    }

    function dndProficiencyFor(dnd) {
      if (!dnd) return 2;
      const custom = String(dnd.profBonus || '').trim();
      if (custom) {
        const n = Number(String(custom).replace(',', '.'));
        if (Number.isFinite(n)) return n;
      }
      const lvl = Math.max(1, Number(dnd.stufe) || 1);
      return 2 + Math.floor((Math.min(20, lvl) - 1) / 4);
    }

    function combatantInitBonus(row) {
      if (!row || row.kind !== 'player' || !row.playerId || row.playerId === ILLUSION_OWNER) return 0;
      const rec = sheetOwnerRecord(row.playerId);
      const dnd = rec && rec.sheet && rec.sheet.dnd;
      if (!dnd || !dnd.abilities || !dnd.abilities.dex) return 0;
      return dndMod(dnd.abilities.dex.score) + dndParseBonus(dnd.initiativeBonus);
    }

    function combatTargetAc() {
      const row = combatantById(kampfAimTo);
      if (!row) return null;
      const n = Number(String(row.ac || '').replace(',', '.').replace(/[^\d.\-]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    }

    function dndRollDicePartsCrit(raw, crit) {
      const p = dndParseDice(raw);
      if (!p) return null;
      const n = crit ? p.n * 2 : p.n;
      const rolls = [];
      for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * p.sides));
      let total = p.add;
      rolls.forEach(v => { total += v; });
      return { total: total, rolls: rolls, sides: p.sides, add: p.add, n: n };
    }

    function rollDndAttack(item, wrap, chainDamage) {
      if (!diceRollsEnabled()) { noticeDiceOff(); return; }
      const bonus = dndParseBonus(item.bonus);
      const die = 1 + Math.floor(Math.random() * 20);
      const total = die + bonus;
      item.hitRoll = String(total);
      const hitEl = wrap && wrap.querySelector('[data-k="hitRoll"]');
      if (hitEl) hitEl.value = item.hitRoll;
      const target = combatantById(kampfAimTo);
      const ac = combatTargetAc();
      const crit = die === 20;
      const fumble = die === 1;
      let hit = true;
      if (fumble) hit = false;
      else if (crit) hit = true;
      else if (ac != null) hit = total >= ac;
      let caption = (item.name || 'Angriff') + ': W20 ' + die + ' (' + dndSigned(bonus) + ') = ' + total;
      if (target) caption += ' gegen ' + target.name;
      if (ac != null) caption += hit ? (crit ? ' · kritischer Treffer RK ' + ac : ' · trifft RK ' + ac) : ' · verfehlt RK ' + ac;
      else if (crit) caption += ' · kritischer Treffer';
      else if (fumble) caption += ' · Fehlschlag';
      playTableDie({ sides: 20, values: [die], caption: caption });
      if (chainDamage && hit && String(item.damage || '').trim()) {
        const toId = kampfAimTo;
        const fromId = kampfAimFrom;
        setTimeout(() => {
          rollDndDamageOnly(item, wrap, crit, { toId: toId, fromId: fromId, apply: !!(toId && combat.started) });
        }, 720);
      }
    }

    function rollDndDamageOnly(item, wrap, crit, opts) {
      if (!diceRollsEnabled()) { noticeDiceOff(); return; }
      const rolled = dndRollDicePartsCrit(item.damage, !!crit);
      if (!rolled) {
        toast('Schaden als Würfel eintragen, z. B. 1W8+3.');
        return;
      }
      item.dmgRoll = String(rolled.total);
      const el = wrap && wrap.querySelector('[data-k="dmgRoll"]');
      if (el) el.value = item.dmgRoll;
      const amtEl = document.getElementById('kampfDmgAmt');
      if (amtEl) amtEl.value = String(rolled.total);
      playTableDie({
        sides: rolled.sides,
        values: rolled.rolls,
        caption: rolled.total + ' Schaden' + (crit ? ' (Krit)' : '')
      });
      if (opts && opts.apply && opts.toId) applyCombatDamage(opts.toId, rolled.total, false, opts.fromId);
    }

    function ensureCombatTurn() {
      const order = combatTurnOrder();
      if (!order.length) {
        combat.activeId = null;
        return;
      }
      if (!combat.started) return;
      const cur = combatantById(combat.activeId);
      if (cur && order.indexOf(combatGroupKey(cur)) >= 0) return;
      const first = firstInCombatGroup(order[0]);
      combat.activeId = first ? first.id : null;
    }

    function combatantById(id) {
      return combat.combatants.find(c => c.id === id) || null;
    }

    function combatGroupKey(row) {
      if (!row) return '';
      const pid = row.playerId || '';
      const acc = sheetAccountId(pid);
      if (pid === VEYR_OWNER || acc === YUVI_ID) return 'player:' + YUVI_ID;
      if (pid === ILLUSION_OWNER || acc === CHRIS_ID) return 'player:' + CHRIS_ID;
      if (row.kind === 'player' && acc) return 'player:' + acc;
      return 'solo:' + row.id;
    }

    function combatTurnOrder() {
      const seen = {};
      const order = [];
      sortedCombatants().forEach(row => {
        const key = combatGroupKey(row);
        if (!key || seen[key]) return;
        seen[key] = true;
        order.push(key);
      });
      return order;
    }

    function firstInCombatGroup(key) {
      return sortedCombatants().find(row => combatGroupKey(row) === key) || null;
    }

    function combatGroupMembers(key) {
      if (!key) return [];
      return sortedCombatants().filter(row => combatGroupKey(row) === key);
    }

    function activeCombatGroupKey() {
      return combatGroupKey(combatantById(combat.activeId));
    }

    function combatGroupLabel(key) {
      return combatGroupMembers(key).map(row => row.name || '—').join(' + ');
    }

    function isCombatantActiveTurn(id) {
      if (!combat.started || !id) return false;
      const row = combatantById(id);
      const active = combatantById(combat.activeId);
      if (!row || !active) return false;
      return combatGroupKey(row) === combatGroupKey(active);
    }

    function playerTurnAccountId() {
      const key = activeCombatGroupKey();
      if (!key.startsWith('player:')) return '';
      return key.slice(7);
    }

    function isMyCombatTurn() {
      if (!combat.started || !currentPlayerId) return false;
      return playerTurnAccountId() === currentPlayerId;
    }

    function canControlCombatant(row) {
      if (!row) return false;
      if (isDM) return true;
      if (!isMyCombatTurn()) return false;
      return isOwnCombatOwner(row.playerId);
    }

    function canStartKampfAim() {
      if (!combat.started || battleHazardMode) return false;
      if (isDM) return true;
      return isMyCombatTurn();
    }

    function canEndCombatTurn() {
      if (!combat.started || !combat.combatants.length) return false;
      if (isDM) return true;
      return isMyCombatTurn();
    }

    function combatPlayerTurnHint() {
      const names = combatGroupMembers(activeCombatGroupKey()).map(row => row.name).filter(Boolean);
      const who = names.length > 1 ? 'Dein Zug (' + names.join(' + ') + ')' : 'Dein Zug';
      return who + ': Figur antippen, Aktion wählen, Ziel antippen. Ziehen = Bewegung. Danach „Zug beenden“.';
    }

    function addCombatant(data, quiet) {
      const row = normalizeCombatant({
        name: data.name,
        kind: data.kind || 'enemy',
        playerId: data.playerId || '',
        init: data.init,
        order: data.order != null ? data.order : combat.combatants.length + 1,
        hp: data.hp,
        hpMax: data.hpMax != null ? data.hpMax : data.hp,
        tempHp: data.tempHp,
        ac: data.ac,
        note: data.note || '',
        count: data.count,
        countMax: data.countMax,
        debuffs: [],
        portraitId: data.portraitId || ''
      });
      combat.combatants.push(row);
      touchCombatant(row);
      if (combat.removed) delete combat.removed[row.id];
      ensureCombatTurn();
      persistCombat();
      upsertBattleToken(row);
      if (!quiet) renderKampf();
      return row;
    }

    function syncPlayerCombatNames() {
      if (!combat || !Array.isArray(combat.combatants) || !combat.combatants.length) return;
      let changed = false;
      combat.combatants.forEach(c => {
        if (!c || c.kind !== 'player' || !c.playerId || c.playerId === ILLUSION_OWNER) return;
        const rec = sheetOwnerRecord(c.playerId);
        if (!rec) return;
        const next = (rec.sheet && rec.sheet.name) || rec.name;
        if (next && c.name !== next) {
          c.name = next;
          touchCombatant(c);
          if (typeof upsertBattleToken === 'function') upsertBattleToken(c);
          changed = true;
        }
      });
      if (changed) persistCombat();
    }

    function addPlayerToCombat(playerId, quiet) {
      if (playerId === ILLUSION_OWNER) ensureIllusionAlt(playerAccounts);
      const rec = sheetOwnerRecord(playerId);
      if (!rec) return;
      if (combat.combatants.some(c => c.playerId === playerId)) {
        if (!quiet) toast(rec.name + ' ist schon im Kampf.');
        return;
      }
      if (playerId === ILLUSION_OWNER) {
        addCombatant({
          name: 'Illusion',
          kind: 'player',
          playerId: ILLUSION_OWNER,
          init: 0,
          hp: 1,
          hpMax: 1,
          ac: '',
          portraitId: (rec.sheet && rec.sheet.portraitId) || ''
        }, quiet);
        if (!quiet) toast('Illusion übernommen. 1 TP, keine Aktionen.');
        return;
      }
      const sheet = rec.sheet || {};
      const hp = combatHpFromOwner(playerId);
      addCombatant({
        name: sheet.name || rec.name,
        kind: 'player',
        playerId: playerId,
        init: 0,
        hp: hp.hp,
        hpMax: hp.hpMax,
        tempHp: hp.tempHp,
        ac: hp.ac,
        portraitId: sheet.portraitId || ''
      }, quiet);
      if (!quiet) toast(rec.name + ' übernommen. Initiative noch eintragen oder oben würfeln.');
    }

    function addNpcToCombat(npcId, quiet) {
      const owner = NPC_PREFIX + npcId;
      const rec = sheetOwnerRecord(owner);
      if (!rec) return;
      if (combat.combatants.some(c => c.playerId === owner)) {
        if (!quiet) toast(rec.name + ' ist schon im Kampf.');
        return;
      }
      const sheet = rec.sheet || {};
      const hp = combatHpFromOwner(owner);
      addCombatant({
        name: sheet.name || rec.name,
        kind: 'enemy',
        playerId: owner,
        init: 0,
        hp: hp.hp,
        hpMax: hp.hpMax,
        tempHp: hp.tempHp,
        ac: hp.ac,
        portraitId: sheet.portraitId || ''
      }, quiet);
      if (!quiet) toast(rec.name + ' übernommen. Initiative noch eintragen oder oben würfeln.');
    }

    function addEnemyToCombat() {
      const nameEl = document.getElementById('kampfEnemyName');
      const hpEl = document.getElementById('kampfEnemyHp');
      const acEl = document.getElementById('kampfEnemyAc');
      const initEl = document.getElementById('kampfEnemyInit');
      const countEl = document.getElementById('kampfEnemyCount');
      const count = Math.max(1, Number(countEl.value) || 1);
      const hp = Math.max(0, Number(hpEl.value) || 0);
      addCombatant({
        name: uniqueCombatName(nameEl.value),
        kind: 'enemy',
        init: parseCombatInit(initEl.value),
        hp: hp,
        hpMax: hp,
        ac: (acEl.value || '').trim(),
        count: count,
        countMax: count
      });
      nameEl.value = '';
      hpEl.value = '';
      initEl.value = '';
      countEl.value = '';
      nameEl.focus();
    }

    function removeCombatant(id) {
      if (!combatantById(id)) return;
      markCombatRemoved(id);
      combat.combatants = combat.combatants.filter(c => c.id !== id);
      ensureCombatTurn();
      persistCombat();
      removeBattleToken(id);
      renderKampf();
    }

    function duplicateCombatant(id) {
      const row = combatantById(id);
      if (!row || row.kind === 'player') return;
      const base = (row.name || 'Gegner').replace(/\s+\d+$/, '');
      addCombatant({
        name: uniqueCombatName(base),
        kind: 'enemy',
        init: parseCombatInit(row.init) + 1,
        hp: row.hpMax,
        hpMax: row.hpMax,
        ac: row.ac,
        note: row.note,
        count: row.countMax,
        countMax: row.countMax,
        portraitId: row.portraitId || ''
      });
    }

    function nudgeCombatant(id, dir) {
      const list = sortedCombatants();
      const i = list.findIndex(c => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      const a = list[i];
      const b = list[j];
      if (parseCombatInit(a.init) !== parseCombatInit(b.init)) {
        toast('Nur bei gleicher Initiative verschieben.');
        return;
      }
      const oa = Number(a.order) || 0;
      const ob = Number(b.order) || 0;
      if (oa === ob) {
        a.order = oa + dir;
        b.order = oa;
      } else {
        a.order = ob;
        b.order = oa;
      }
      touchCombatant(a);
      touchCombatant(b);
      persistCombat();
      renderKampf();
    }

    function applyCombatDamage(id, amount, heal, fromId) {
      const row = combatantById(id);
      let n = Math.abs(Number(amount) || 0);
      if (!row || !n) return;
      const src = fromId ? combatantById(fromId) : null;
      const prefix = src ? src.name + ' → ' : '';
      if (heal) {
        row.hp = row.hp + n;
        if (row.hpMax > 0) row.hp = Math.min(row.hpMax, row.hp);
        combatLog(prefix + row.name + ' · +' + n + ' TP');
      } else {
        const temp = Number(row.tempHp) || 0;
        if (temp > 0) {
          const used = Math.min(temp, n);
          row.tempHp = temp - used;
          n -= used;
        }
        if (n > 0) row.hp = Math.max(0, row.hp - n);
        combatLog(prefix + row.name + ' · ' + Math.abs(Number(amount) || 0) + ' Schaden');
        if (n > 0) checkCombatConcentration(row, n);
      }
      touchCombatant(row);
      syncCombatantHpToSheet(row);
      persistCombat();
      renderKampf();
      renderBattleBoards();
    }

    function checkCombatConcentration(row, damage) {
      if (!combatantIsConcentrating(row) || !(Number(damage) > 0)) return;
      const dc = Math.max(10, Math.floor(Number(damage) / 2));
      const rec = row.kind === 'player' && row.playerId ? sheetOwnerRecord(row.playerId) : null;
      const dnd = rec && rec.sheet && rec.sheet.dnd;
      if (diceRollsEnabled() && dnd && dnd.abilities && dnd.abilities.con) {
        const bonus = dndMod(dnd.abilities.con.score) + (dnd.abilities.con.save ? dndProficiencyFor(dnd) : 0);
        const die = 1 + Math.floor(Math.random() * 20);
        const total = die + bonus;
        const ok = die === 20 || (die !== 1 && total >= dc);
        playTableDie({
          sides: 20,
          values: [die],
          caption: row.name + ' · Konzentration SG ' + dc + ': W20 ' + die + ' (' + dndSigned(bonus) + ') = ' + total + (ok ? ' · gehalten' : ' · verloren')
        });
        combatLog(row.name + ' · Konzentration SG ' + dc + ' → ' + total + (ok ? ' gehalten' : ' verloren'));
        if (!ok) {
          setCombatantConcentrating(row, false);
          toast(row.name + ': Konzentration verloren.');
        }
        return;
      }
      combatLog(row.name + ' · Konzentration prüfen, SG ' + dc);
      toast(row.name + ': Konzentration SG ' + dc);
    }

    function combatDamageAmount(fromEl) {
      const typed = fromEl && String(fromEl.value || '').trim();
      if (typed) {
        const n = Math.abs(Number(typed));
        if (n) return n;
      }
      const bar = document.getElementById('kampfDmgAmt');
      const n = Math.abs(Number(bar && bar.value));
      return Number.isFinite(n) && n > 0 ? n : 1;
    }

    function kampfAimLabel() {
      const from = combatantById(kampfAimFrom);
      const to = combatantById(kampfAimTo);
      if (from && to) return from.name + ' → ' + to.name;
      if (from) return from.name + ' → …';
      return '';
    }

    function kampfSheetIsLive(owner) {
      if (!owner || owner !== currentSheetOwner || !usesDndSheet(owner)) return false;
      const charOpen = els.charView && !els.charView.classList.contains('hidden');
      return !!(charOpen || sheetDirty);
    }

    function combatantDndSheet(row) {
      if (!row || !row.playerId) return null;
      if (kampfSheetIsLive(row.playerId)) return dndState;
      const rec = sheetOwnerRecord(row.playerId);
      return rec && rec.sheet && rec.sheet.dnd ? rec.sheet.dnd : null;
    }

    function kampfFeatureUseMax(item) {
      const n = Number(String((item && item.uses) || '').replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? n : 0;
    }

    function kampfFeatureUsed(item) {
      return Math.max(0, Number(String((item && item.used) || '').replace(',', '.')) || 0);
    }

    function kampfSlotLevel(action) {
      const raw = String((action && action.level) || '').trim();
      if (!raw || raw === '0' || /^k/i.test(raw)) return 0;
      const n = Number(raw.replace(/[^\d]/g, ''));
      return Number.isFinite(n) && n >= 1 && n <= 9 ? n : 0;
    }

    function kampfSpellSkipsSlot(action) {
      const notes = String((action && action.notes) || '');
      return /ohne\s*slot|\d+\s*\/\s*(lr|kr)/i.test(notes);
    }

    function kampfResetShort(reset) {
      if (reset === 'short') return 'KR';
      if (reset === 'dawn') return 'MG';
      return 'LR';
    }

    function kampfSpeedFeet(row) {
      const dnd = combatantDndSheet(row);
      const raw = String((dnd && dnd.speed) || (row && row.note) || '30 ft.');
      const m = raw.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
      const n = m ? Number(m[1]) : 30;
      if (/m\b|meter/i.test(raw) && n <= 20) return Math.round(n / 0.3 / 5) * 5;
      return Number.isFinite(n) && n > 0 ? n : 30;
    }

    function kampfEnsureMove(row) {
      if (!row) return;
      if (!(Number(row.moveMax) > 0)) {
        row.moveMax = kampfSpeedFeet(row);
        row.moveLeft = row.moveMax;
        touchCombatant(row);
      }
    }

    function kampfResetEconomy(row) {
      if (!row) return;
      row.actionUsed = false;
      row.bonusUsed = false;
      row.reactionUsed = false;
      row.moveMax = kampfSpeedFeet(row);
      row.moveLeft = row.moveMax;
      touchCombatant(row);
    }

    function kampfResetTurnEconomy(key) {
      combatGroupMembers(key || activeCombatGroupKey()).forEach(kampfResetEconomy);
    }

    function kampfEconLabel(row) {
      if (!row) return '';
      kampfEnsureMove(row);
      const bits = [];
      bits.push(row.actionUsed ? 'Aktion raus' : 'Aktion');
      bits.push(row.bonusUsed ? 'Bonus raus' : 'Bonus');
      bits.push(Math.max(0, Number(row.moveLeft) || 0) + ' ft.');
      return bits.join(' · ');
    }

    function kampfParseRangeFeet(raw, kind) {
      const s = String(raw || '').trim().toLowerCase();
      if (!s) return kind === 'attack' ? 5 : null;
      if (/selbst|self/.test(s) && !/\d/.test(s)) return 0;
      if (/berührung|touch/.test(s)) return 5;
      const m = s.match(/(\d+)/);
      return m ? Number(m[1]) : (kind === 'attack' ? 5 : null);
    }

    function kampfPctDistanceFeet(a, b) {
      if (!a || !b) return 0;
      const stage = document.getElementById('kampfBattleStage');
      const m = battleGridMetrics(stage);
      if (!m.cellW || !m.width) return 0;
      const dx = ((Number(a.x) - Number(b.x)) / 100) * m.width / m.cellW;
      const dy = ((Number(a.y) - Number(b.y)) / 100) * m.height / m.cellH;
      return Math.max(0, Math.round(Math.max(Math.abs(dx), Math.abs(dy)))) * 5;
    }

    function kampfTokenDistanceFeet(idA, idB) {
      const a = (battle.tokens || []).find(t => t.id === idA);
      const b = (battle.tokens || []).find(t => t.id === idB);
      if (!a || !b) return 0;
      return kampfPctDistanceFeet(a, b);
    }

    function kampfActionEconomy(action) {
      if (!action) return 'action';
      const t = String(action.time || '').toLowerCase();
      const name = String(action.name || '').toLowerCase();
      if (/reaktion|reaction/.test(t)) return 'reaction';
      if (/bonus/.test(t) || /second wind|zweiter wind|zweite wind/.test(name)) return 'bonus';
      if (/action surge|aktionsstoß|aktionsschub/.test(name)) return 'surge';
      if (action.kind === 'feature') {
        const live = kampfPowerLiveItem(action) || action;
        if (!dndItemAttackBonus(live) && !kampfPowerDice(action)) return 'free';
      }
      return 'action';
    }

    function kampfEconomyBlocked(row, action) {
      const slot = kampfActionEconomy(action);
      if (slot === 'reaction') return 'Reaktionen kommen später — erst der eigene Zug.';
      if (slot === 'action' && row && row.actionUsed) return 'Aktion in diesem Zug schon genutzt.';
      if (slot === 'bonus' && row && row.bonusUsed) return 'Bonusaktion in diesem Zug schon genutzt.';
      return '';
    }

    function kampfSpendEconomy(row, action) {
      if (!row) return;
      const slot = kampfActionEconomy(action);
      if (slot === 'action') row.actionUsed = true;
      if (slot === 'bonus') row.bonusUsed = true;
      if (slot === 'surge') row.actionUsed = false;
      touchCombatant(row);
    }

    function kampfActionIsHeal(action) {
      return /heal|cure|healing|heilung|heilendes wort|cure wounds|healing word|second wind|zweiter wind|aid\b|goodberry/i.test(String(action && action.name || ''));
    }

    function kampfActionIsArea(action) {
      const t = ((action && action.name) || '') + ' ' + ((action && action.notes) || '') + ' ' + ((action && action.range) || '');
      return /burning hands|faerie fire|thunderwave|shatter|spirit guardians|flaming sphere|ice storm|fireball|cone|cube|sphere|radius|kegel|fläche|burst|emanation/i.test(t);
    }

    function kampfParseSave(hit) {
      const s = String(hit || '').trim();
      const m = s.match(/(STR|DEX|CON|INT|WIS|CHA|STÄ|GES|KON|WEI)\s*(\d+)/i) || s.match(/SG\s*(\d+)/i);
      if (!m) return null;
      const abRaw = (m[1] || '').toLowerCase();
      const dc = Number(m[2] || m[1]);
      if (!Number.isFinite(dc) || dc <= 0) return null;
      let ab = 'dex';
      if (/str|stä/.test(abRaw)) ab = 'str';
      else if (/dex|ges/.test(abRaw)) ab = 'dex';
      else if (/con|kon/.test(abRaw)) ab = 'con';
      else if (/int/.test(abRaw) && !/wis|wei/.test(abRaw)) ab = 'int';
      else if (/wis|wei/.test(abRaw)) ab = 'wis';
      else if (/cha/.test(abRaw)) ab = 'cha';
      return { ab: ab, dc: dc };
    }

    function kampfAbilityMod(row, ab) {
      const dnd = combatantDndSheet(row);
      if (!dnd || !dnd.abilities || !dnd.abilities[ab]) return 0;
      return dndMod(dnd.abilities[ab].score) + (dnd.abilities[ab].save ? dndProficiencyFor(dnd) : 0);
    }

    function kampfHasCover(fromId, toId) {
      const a = (battle.tokens || []).find(t => t.id === fromId);
      const b = (battle.tokens || []).find(t => t.id === toId);
      if (!a || !b) return false;
      const ax = Number(a.x), ay = Number(a.y), bx = Number(b.x), by = Number(b.y);
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 6) return false;
      return (battle.tokens || []).some(t => {
        if (t.id === fromId || t.id === toId) return false;
        const row = combatantById(t.id);
        if (row && combatantDown(row)) return false;
        const px = Number(t.x), py = Number(t.y);
        const tparam = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / (len * len);
        if (tparam <= 0.12 || tparam >= 0.88) return false;
        const qx = ax + tparam * (bx - ax);
        const qy = ay + tparam * (by - ay);
        return Math.hypot(px - qx, py - qy) < 2.4;
      });
    }

    function kampfPointInPoly(x, y, pts) {
      if (!pts || pts.length < 3) return false;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = Number(pts[i].x), yi = Number(pts[i].y);
        const xj = Number(pts[j].x), yj = Number(pts[j].y);
        const hit = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
        if (hit) inside = !inside;
      }
      return inside;
    }

    function kampfHazardsAt(x, y) {
      return (battle.hazards || []).filter(h => kampfPointInPoly(x, y, h.points)).map(h => h.type);
    }

    function kampfApplyHazards(row, token) {
      if (!row || !token || !combat.started) return;
      if (!diceRollsEnabled()) return;
      const types = kampfHazardsAt(token.x, token.y);
      if (types.indexOf('fire') >= 0) {
        const rolled = dndRollDicePartsCrit('1W6', false);
        const n = rolled ? rolled.total : 1;
        if (rolled) playTableDie({ sides: rolled.sides, values: rolled.rolls, caption: row.name + ' · Feuer ' + n });
        applyCombatDamage(row.id, n, false, '');
        toast(row.name + ' im Feuer: ' + n + ' Schaden.');
      }
    }

    function kampfMeleeNeighbors(id) {
      return (combat.combatants || []).filter(row => {
        if (!row || row.id === id || combatantDown(row)) return false;
        return kampfTokenDistanceFeet(id, row.id) <= 5;
      });
    }

    function kampfFirstMeleeAttack(row) {
      const list = combatantPowerList(row);
      return (list.attacks || []).find(a => {
        const feet = kampfParseRangeFeet(a.range, 'attack');
        return feet == null || feet <= 5;
      }) || (list.attacks || [])[0] || null;
    }

    function kampfOpportunity(fromId, startNeighbors, endNeighbors) {
      if (!diceRollsEnabled()) return;
      const left = startNeighbors.filter(row => !endNeighbors.some(x => x.id === row.id));
      left.forEach(enemy => {
        if (enemy.reactionUsed) return;
        const atk = kampfFirstMeleeAttack(enemy);
        if (!atk && enemy.kind === 'player') return;
        enemy.reactionUsed = true;
        touchCombatant(enemy);
        const target = combatantById(fromId);
        if (!target) return;
        if (atk) {
          const live = atk;
          const bonusRaw = dndItemAttackBonus(live) || live.bonus;
          const bonus = dndParseBonus(bonusRaw);
          const die = 1 + Math.floor(Math.random() * 20);
          const total = die + bonus;
          const acRaw = Number(String(target.ac || '').replace(',', '.').replace(/[^\d.\-]/g, ''));
          const ac = Number.isFinite(acRaw) && acRaw > 0 ? acRaw : 10;
          const hit = die !== 1 && (die === 20 || total >= ac);
          playTableDie({
            sides: 20,
            values: [die],
            caption: enemy.name + ' · Gelegenheit gegen ' + target.name + ': ' + total + (hit ? ' trifft' : ' verfehlt')
          });
          combatLog(enemy.name + ' → ' + target.name + ' · Gelegenheit ' + (hit ? 'trifft' : 'verfehlt'));
          if (hit) {
            const diceRaw = kampfPowerDice(atk);
            setTimeout(() => {
              if (diceRaw) rollDndDamageOnly({ name: atk.name, damage: diceRaw }, null, die === 20, { toId: fromId, fromId: enemy.id, apply: true });
              else applyCombatDamage(fromId, 1, false, enemy.id);
            }, 500);
          }
        } else {
          const die = 1 + Math.floor(Math.random() * 20);
          playTableDie({ sides: 20, values: [die], caption: enemy.name + ' · Gelegenheit gegen ' + target.name });
          applyCombatDamage(fromId, die >= 10 ? 4 : 1, false, enemy.id);
          combatLog(enemy.name + ' → ' + target.name + ' · Gelegenheit');
        }
      });
      if (left.length) persistCombat();
    }

    function kampfInRange(fromId, toId, action) {
      if (fromId === toId) return true;
      const feet = kampfParseRangeFeet(action && action.range, action && action.kind);
      if (feet == null) return true;
      return kampfTokenDistanceFeet(fromId, toId) <= feet;
    }

    function kampfActionDepleted(row, action) {
      const dnd = combatantDndSheet(row);
      if (!dnd || !action) return false;
      if (action.kind === 'feature') {
        const f = (dnd.features || []).find(x => x.id === action.id) || action;
        const max = kampfFeatureUseMax(f);
        return max > 0 && kampfFeatureUsed(f) >= max;
      }
      if (action.kind === 'spell') {
        if (kampfSpellSkipsSlot(action)) return false;
        const lvl = kampfSlotLevel(action);
        if (!lvl || !dnd.spellSlots || !dnd.spellSlots[lvl]) return false;
        const max = Number(String(dnd.spellSlots[lvl].max || '').replace(',', '.'));
        if (!Number.isFinite(max) || max <= 0) return false;
        const used = Math.max(0, Number(String(dnd.spellSlots[lvl].used || '').replace(',', '.')) || 0);
        return used >= max;
      }
      return false;
    }

    function kampfConsumeAction(row, action) {
      if (!row || !action) return { ok: true };
      if (kampfSheetIsLive(row.playerId)) collectDndFields();
      const dnd = combatantDndSheet(row);
      if (!dnd) return { ok: true };
      if (action.kind === 'feature') {
        const f = (dnd.features || []).find(x => x.id === action.id);
        if (!f) return { ok: true };
        const max = kampfFeatureUseMax(f);
        if (!max) return { ok: true };
        const used = kampfFeatureUsed(f);
        if (used >= max) return { ok: false, msg: 'Keine Nutzungen mehr.' };
        f.used = String(used + 1);
        persistKampfPowerSheet(row);
        return { ok: true };
      }
      if (action.kind === 'spell') {
        if (kampfSpellSkipsSlot(action)) return { ok: true };
        const lvl = kampfSlotLevel(action);
        if (!lvl) return { ok: true };
        const slot = dnd.spellSlots && dnd.spellSlots[lvl];
        if (!slot) return { ok: true };
        const max = Number(String(slot.max || '').replace(',', '.'));
        if (!Number.isFinite(max) || max <= 0) return { ok: true };
        const used = Math.max(0, Number(String(slot.used || '').replace(',', '.')) || 0);
        if (used >= max) return { ok: false, msg: 'Keine Zauberplätze Grad ' + lvl + ' mehr.' };
        slot.used = String(used + 1);
        persistKampfPowerSheet(row);
        return { ok: true };
      }
      return { ok: true };
    }

    function resolveKampfPower() {
      if (!diceRollsEnabled()) { noticeDiceOff(); cancelKampfAim(); return; }
      const fromRow = combatantById(kampfAimFrom);
      const action = kampfPowerAction;
      if (!fromRow || !canControlCombatant(fromRow) || !action) return;
      let targets = (kampfAimTargets || []).filter(Boolean);
      if (!targets.length && kampfAimTo) targets = [kampfAimTo];
      if (!targets.length) targets = [kampfAimFrom];
      const blocked = kampfEconomyBlocked(fromRow, action);
      if (blocked) {
        toast(blocked);
        return;
      }
      const outOfRange = targets.filter(id => !kampfInRange(kampfAimFrom, id, action));
      if (outOfRange.length) {
        toast('Ziel außer Reichweite.');
        return;
      }
      const spent = kampfConsumeAction(fromRow, action);
      if (!spent.ok) {
        toast(spent.msg || 'Nicht verfügbar.');
        return;
      }
      kampfSpendEconomy(fromRow, action);
      const live = kampfPowerLiveItem(action) || action;
      const bonusRaw = dndItemAttackBonus(live) || dndItemAttackBonus(action);
      const diceRaw = kampfPowerDice(action);
      const save = kampfParseSave((live && live.hit) || action.hit);
      const heal = kampfActionIsHeal(action);
      const conc = !!(live && live.concentration) || !!action.concentration;
      if (conc) setCombatantConcentrating(fromRow, true);
      const noCombatRoll = action.kind === 'feature' && !diceRaw && !bonusRaw && !save && !heal;
      if (noCombatRoll) {
        combatLog((fromRow.name || 'Figur') + ' · ' + (action.name || 'Merkmal'));
        persistCombat();
        toast((action.name || 'Merkmal') + ' eingesetzt.');
        clearKampfAimState();
        renderKampfPowerOverlay();
        syncKampfAimUi();
        renderKampf();
        return;
      }
      const fromId = fromRow.id;
      const applyOne = (toId, delay) => {
        const target = combatantById(toId);
        if (!target) return;
        const run = () => {
          if (heal) {
            let n = 0;
            if (diceRaw) {
              const rolled = dndRollDicePartsCrit(diceRaw, false);
              if (rolled) {
                n = rolled.total;
                playTableDie({ sides: rolled.sides, values: rolled.rolls, caption: (action.name || 'Heilung') + ': ' + rolled.total });
              }
            }
            applyCombatDamage(toId, n || 1, true, fromId);
            if (conc) addCombatDebuff(toId, action.name || 'Konzentration', '', 'buff', fromId);
            return;
          }
          if (bonusRaw && (action.kind === 'attack' || action.kind === 'spell')) {
            const cover = kampfHasCover(fromId, toId);
            const bonus = dndParseBonus(bonusRaw);
            const die = 1 + Math.floor(Math.random() * 20);
            const total = die + bonus;
            if (live) live.hitRoll = String(total);
            const acRaw = Number(String(target.ac || '').replace(',', '.').replace(/[^\d.\-]/g, ''));
            let ac = Number.isFinite(acRaw) && acRaw > 0 ? acRaw : null;
            if (ac != null && cover) ac += 2;
            const crit = die === 20;
            const fumble = die === 1;
            let hit = true;
            if (fumble) hit = false;
            else if (crit) hit = true;
            else if (ac != null) hit = total >= ac;
            let caption = (action.name || 'Angriff') + ': W20 ' + die + ' (' + dndSigned(bonus) + ') = ' + total;
            caption += ' gegen ' + target.name;
            if (cover) caption += ' · Deckung';
            if (ac != null) caption += hit ? (crit ? ' · kritischer Treffer RK ' + ac : ' · trifft RK ' + ac) : ' · verfehlt RK ' + ac;
            playTableDie({ sides: 20, values: [die], caption: caption });
            persistKampfPowerSheet(fromRow);
            if (!hit) {
              toast(target.name + ': verfehlt.');
              return;
            }
            setTimeout(() => {
              if (diceRaw) rollDndDamageOnly({ name: action.name, damage: diceRaw }, null, crit, { toId: toId, fromId: fromId, apply: true });
              else applyCombatDamage(toId, 1, false, fromId);
            }, 720);
            return;
          }
          if (save) {
            const die = 1 + Math.floor(Math.random() * 20);
            const mod = kampfAbilityMod(target, save.ab);
            const total = die + mod;
            const ok = die === 20 || (die !== 1 && total >= save.dc);
            playTableDie({
              sides: 20,
              values: [die],
              caption: target.name + ' · ' + save.ab.toUpperCase() + ' SG ' + save.dc + ': ' + total + (ok ? ' geschafft' : ' misslungen')
            });
            combatLog(target.name + ' · Rettung SG ' + save.dc + ' → ' + total + (ok ? ' geschafft' : ' misslungen'));
            if (ok && !diceRaw) {
              toast(target.name + ' widersteht.');
              return;
            }
            setTimeout(() => {
              if (diceRaw) {
                const rolled = dndRollDicePartsCrit(diceRaw, false);
                let n = rolled ? rolled.total : 1;
                if (ok) n = Math.max(1, Math.floor(n / 2));
                if (rolled) playTableDie({ sides: rolled.sides, values: rolled.rolls, caption: action.name + ': ' + n });
                applyCombatDamage(toId, n, false, fromId);
              } else applyCombatDamage(toId, ok ? 0 : 1, false, fromId);
            }, 720);
            if (!ok) addCombatDebuff(toId, action.name || 'Wirkung', '', 'debuff', fromId);
            return;
          }
          if (diceRaw) {
            rollDndDamageOnly({ name: action.name, damage: diceRaw }, null, false, { toId: toId, fromId: fromId, apply: true });
            return;
          }
          addCombatDebuff(toId, action.name || 'Wirkung', '', conc ? 'buff' : 'debuff', fromId);
        };
        if (delay) setTimeout(run, delay);
        else run();
      };
      targets.forEach((id, i) => applyOne(id, i * 280));
      if (conc && fromRow) combatLog(fromRow.name + ' · Konzentration · ' + (action.name || ''));
      persistCombat();
      clearKampfAimState();
      renderKampfPowerOverlay();
      syncKampfAimUi();
      renderKampf();
    }

    function combatantPowerList(row) {
      const dnd = combatantDndSheet(row);
      const attacks = [];
      const spells = [];
      const features = [];
      if (!dnd) return { attacks: attacks, spells: spells, features: features };
      (dnd.attacks || []).forEach(a => {
        const name = String(a.name || '').trim();
        if (!name) return;
        attacks.push({
          kind: 'attack',
          id: a.id,
          name: name,
          bonus: a.bonus,
          damage: a.damage,
          notes: a.notes,
          range: a.range
        });
      });
      const named = (dnd.spells || []).filter(s => String(s.name || '').trim());
      const anyPrep = named.some(s => s.prepared);
      named.forEach(s => {
        const lvl = String(s.level || '0').trim();
        const cantrip = !lvl || lvl === '0' || /^k/i.test(lvl);
        if (anyPrep && !s.prepared && !cantrip) return;
        spells.push({
          kind: 'spell',
          id: s.id,
          name: String(s.name).trim(),
          bonus: dndItemAttackBonus(s),
          hit: s.hit,
          damage: s.damage,
          notes: s.notes,
          range: s.range,
          time: s.time,
          level: lvl,
          concentration: !!s.concentration
        });
      });
      (dnd.features || []).forEach(f => {
        const name = String(f.name || '').trim();
        if (!name) return;
        features.push({
          kind: 'feature',
          id: f.id,
          name: name,
          uses: f.uses,
          used: f.used,
          reset: f.reset,
          notes: ''
        });
      });
      return { attacks: attacks, spells: spells, features: features };
    }

    function combatantHasPowers(row) {
      const list = combatantPowerList(row);
      return !!(list.attacks.length || list.spells.length || list.features.length);
    }

    function kampfPowerLiveItem(action) {
      if (!action) return action;
      const key = action.kind === 'spell' ? 'spells' : action.kind === 'feature' ? 'features' : 'attacks';
      const from = combatantById(kampfAimFrom);
      if (from && kampfSheetIsLive(from.playerId)) {
        const item = (dndState[key] || []).find(x => x.id === action.id);
        if (item) return item;
      }
      const dnd = combatantDndSheet(from);
      return (dnd && (dnd[key] || []).find(x => x.id === action.id)) || action;
    }

    function kampfPowerDice(action) {
      if (!action) return '';
      const live = kampfPowerLiveItem(action);
      const dmg = String((live && live.damage) || action.damage || '').replace(/\s/g, '');
      if (dmg && dndParseDice(dmg)) return dmg;
      const notes = String((live && live.notes) || action.notes || '');
      const m = notes.replace(/\s/g, '').match(/(\d*)[wWdD]\d+([+-]\d+)?/);
      return m && dndParseDice(m[0]) ? m[0] : '';
    }

    function persistKampfPowerSheet(row) {
      if (!row || !row.playerId) return;
      const rec = sheetOwnerRecord(row.playerId);
      if (!rec || !rec.sheet) return;
      if (kampfSheetIsLive(row.playerId)) {
        rec.sheet.dnd = normalizeDndSheet(dndState);
        sheetDirty = true;
        if (!dndAttackEditId && !dndSpellEditId) renderDndLists();
        renderDndSlots();
      }
      persistPlayersSoon();
    }

    function clearKampfAimState() {
      kampfAimFrom = '';
      kampfAimTo = '';
      kampfAimTargets = [];
      kampfAimEffect = '';
      kampfPowerAction = null;
      kampfPowerPhase = '';
      kampfPowerRenderKey = '';
    }

    function openKampfPowerOverlay(id) {
      kampfAimFrom = id;
      kampfAimTo = '';
      kampfAimTargets = [];
      kampfAimEffect = '';
      kampfPowerAction = null;
      kampfPowerPhase = 'pick';
      kampfPowerRenderKey = '';
      renderKampfPowerOverlay();
      syncKampfAimUi();
    }

    function pickKampfPowerAction(action) {
      const from = combatantById(kampfAimFrom);
      if (kampfActionDepleted(from, action)) {
        toast(action && action.kind === 'spell' ? 'Keine Zauberplätze mehr.' : 'Keine Nutzungen mehr.');
        return;
      }
      const blocked = kampfEconomyBlocked(from, action);
      if (blocked) {
        toast(blocked);
        return;
      }
      kampfPowerAction = action;
      kampfAimTo = '';
      kampfAimTargets = [];
      kampfAimEffect = '';
      const live = kampfPowerLiveItem(action) || action;
      const selfOnly = kampfParseRangeFeet(action.range || (live && live.range), action.kind) === 0
        || (action.kind === 'feature' && kampfActionIsHeal(action))
        || (action.kind === 'feature' && !kampfPowerDice(action) && !dndItemAttackBonus(live));
      if (selfOnly) {
        kampfAimTo = kampfAimFrom;
        kampfAimTargets = [kampfAimFrom];
        resolveKampfPower();
        return;
      }
      kampfPowerPhase = 'aim';
      kampfPowerRenderKey = '';
      renderKampfPowerOverlay();
      syncKampfAimUi();
      renderBattleBoards();
    }

    function activateKampfFigure(id) {
      if (handleKampfPowerClick(id)) return true;
      if (pickKampfAim(id)) return true;
      return false;
    }

    function handleKampfPowerClick(id) {
      if (!combat.started || battleHazardMode || battleMapTool) return false;
      if (!id) return false;
      if (!canStartKampfAim()) {
        if (!isDM && currentPlayerId && combat.started && combatantById(id) && isOwnCombatOwner(combatantById(id).playerId)) {
          toast('Erst wenn du am Zug bist.');
          return true;
        }
        return false;
      }
      const row = combatantById(id);
      if (!row) return false;
      if (kampfAimFrom && !kampfPowerPhase) {
        if (canControlCombatant(row) && combatantHasPowers(row)) {
          openKampfPowerOverlay(id);
          return true;
        }
        return false;
      }
      if (kampfPowerPhase === 'aim' && kampfPowerAction && kampfAimFrom) {
        if (!kampfInRange(kampfAimFrom, id, kampfPowerAction)) {
          toast('Außer Reichweite (' + kampfTokenDistanceFeet(kampfAimFrom, id) + ' ft.).');
          return true;
        }
        if (kampfActionIsArea(kampfPowerAction)) {
          if (kampfAimTargets.indexOf(id) >= 0) {
            resolveKampfPower();
            return true;
          }
          kampfAimTargets.push(id);
          kampfAimTo = id;
          renderKampfPowerOverlay();
          syncKampfAimUi();
          renderBattleBoards();
          return true;
        }
        kampfAimTargets = [id];
        kampfAimTo = id;
        resolveKampfPower();
        return true;
      }
      if (kampfPowerPhase === 'pick' && kampfAimFrom) {
        if (id === kampfAimFrom) {
          positionKampfPowerOverlay();
          return true;
        }
        if (canControlCombatant(row) && combatantHasPowers(row)) {
          openKampfPowerOverlay(id);
          return true;
        }
        toast('Erst Aktion wählen.');
        return true;
      }
      if (!canControlCombatant(row)) return false;
      if (!combatantHasPowers(row)) {
        if (row.kind === 'player') {
          toast('Keine Angriffe, Zauber oder Merkmale auf dem Blatt.');
          return true;
        }
        return false;
      }
      openKampfPowerOverlay(id);
      return true;
    }

    function bindKampfFloatUi() {
      if (bindKampfFloatUi.done) return;
      bindKampfFloatUi.done = true;
      const place = () => {
        positionKampfPowerOverlay();
        positionKampfActionPanel();
      };
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
    }

    function ensureKampfFloatHost(el) {
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
    }

    function positionKampfPowerOverlay() {
      const box = document.getElementById('kampfPowerOverlay');
      if (!box || box.classList.contains('hidden')) return;
      ensureKampfFloatHost(box);
      bindKampfFloatUi();
      const id = (kampfPowerPhase === 'intent' || kampfPowerPhase === 'effect') ? (kampfAimTo || kampfAimFrom) : kampfAimFrom;
      const tokenEl = id ? document.querySelector('.battle-token[data-id="' + CSS.escape(id) + '"]') : null;
      const board = document.getElementById('kampfBattleBoard');
      const anchor = tokenEl || board;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      box.style.left = (r.right + 10) + 'px';
      box.style.top = r.top + 'px';
      requestAnimationFrame(() => {
        if (box.classList.contains('hidden')) return;
        const pad = 8;
        const br = box.getBoundingClientRect();
        let x = br.left;
        let y = br.top;
        if (br.right > window.innerWidth - pad) x = r.left - br.width - 10;
        if (x < pad) x = pad;
        if (br.bottom > window.innerHeight - pad) y = window.innerHeight - pad - br.height;
        if (y < pad) y = pad;
        box.style.left = x + 'px';
        box.style.top = y + 'px';
      });
    }

    function positionKampfActionPanel() {
      const box = document.getElementById('kampfActionPanel');
      if (!box || !box.classList.contains('is-open')) return;
      ensureKampfFloatHost(box);
      bindKampfFloatUi();
      const id = kampfAimTo || kampfAimFrom;
      const tokenEl = id ? document.querySelector('.battle-token[data-id="' + CSS.escape(id) + '"]') : null;
      const board = document.getElementById('kampfBattleBoard');
      const anchor = tokenEl || board;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      box.style.left = (r.right + 10) + 'px';
      box.style.top = r.top + 'px';
      requestAnimationFrame(() => {
        if (!box.classList.contains('is-open')) return;
        const pad = 8;
        const br = box.getBoundingClientRect();
        let x = br.left;
        let y = br.top;
        if (br.right > window.innerWidth - pad) x = r.left - br.width - 10;
        if (x < pad) x = pad;
        if (br.bottom > window.innerHeight - pad) y = window.innerHeight - pad - br.height;
        if (y < pad) y = pad;
        box.style.left = x + 'px';
        box.style.top = y + 'px';
      });
    }

    function kampfPowerAmtValue() {
      const el = document.getElementById('kampfPowerAmt');
      const n = Math.abs(Number(el && el.value));
      return Number.isFinite(n) && n > 0 ? n : 0;
    }

    function applyKampfPowerOutcome(heal) {
      if (!diceRollsEnabled()) { noticeDiceOff(); cancelKampfAim(); return; }
      const fromRow = combatantById(kampfAimFrom);
      if (!fromRow || !canControlCombatant(fromRow) || !kampfPowerAction || !kampfAimTo) return;
      const spent = kampfConsumeAction(fromRow, kampfPowerAction);
      if (!spent.ok) {
        toast(spent.msg || 'Nicht verfügbar.');
        return;
      }
      const toId = kampfAimTo;
      const fromId = kampfAimFrom;
      const action = kampfPowerAction;
      const typed = kampfPowerAmtValue();
      const diceRaw = kampfPowerDice(action);
      const live = kampfPowerLiveItem(action) || action;
      const bonusRaw = dndItemAttackBonus(live) || dndItemAttackBonus(action);
      const noCombatRoll = action.kind === 'feature' && !typed && !diceRaw && !bonusRaw;
      if (noCombatRoll) {
        combatLog((fromRow.name || 'Figur') + ' · ' + (action.name || 'Merkmal'));
        persistCombat();
        toast((action.name || 'Merkmal') + ' eingesetzt.');
        clearKampfAimState();
        renderKampfPowerOverlay();
        syncKampfAimUi();
        return;
      }
      if (heal) {
        let n = typed;
        if (!n && diceRaw) {
          const rolled = dndRollDicePartsCrit(diceRaw, false);
          if (rolled) {
            n = rolled.total;
            playTableDie({
              sides: rolled.sides,
              values: rolled.rolls,
              caption: (action.name || 'Heilung') + ': ' + rolled.total
            });
          }
        }
        if (!n) n = 1;
        clearKampfAimState();
        renderKampfPowerOverlay();
        applyCombatDamage(toId, n, true, fromId);
        return;
      }
      const doDamage = crit => {
        if (typed) {
          appendTableDieCaption(typed + ' Schaden');
          applyCombatDamage(toId, typed, false, fromId);
          return;
        }
        if (diceRaw) {
          rollDndDamageOnly({ name: action.name, damage: diceRaw }, null, !!crit, {
            toId: toId,
            fromId: fromId,
            apply: true
          });
          return;
        }
        applyCombatDamage(toId, 1, false, fromId);
      };
      if (bonusRaw && (action.kind === 'attack' || action.kind === 'spell')) {
        const bonus = dndParseBonus(bonusRaw);
        const die = 1 + Math.floor(Math.random() * 20);
        const total = die + bonus;
        if (live) live.hitRoll = String(total);
        const target = combatantById(toId);
        const acRaw = Number(String((target && target.ac) || '').replace(',', '.').replace(/[^\d.\-]/g, ''));
        const ac = Number.isFinite(acRaw) && acRaw > 0 ? acRaw : null;
        const crit = die === 20;
        const fumble = die === 1;
        let hit = true;
        if (fumble) hit = false;
        else if (crit) hit = true;
        else if (ac != null) hit = total >= ac;
        let caption = (action.name || 'Angriff') + ': W20 ' + die + ' (' + dndSigned(bonus) + ') = ' + total;
        if (target) caption += ' gegen ' + target.name;
        if (ac != null) caption += hit ? (crit ? ' · kritischer Treffer RK ' + ac : ' · trifft RK ' + ac) : ' · verfehlt RK ' + ac;
        else if (crit) caption += ' · kritischer Treffer';
        else if (fumble) caption += ' · Fehlschlag';
        playTableDie({ sides: 20, values: [die], caption: caption });
        persistKampfPowerSheet(fromRow);
        clearKampfAimState();
        renderKampfPowerOverlay();
        syncKampfAimUi();
        if (!hit) {
          toast('Verfehlt.');
          return;
        }
        setTimeout(() => doDamage(crit), 720);
        return;
      }
      clearKampfAimState();
      renderKampfPowerOverlay();
      doDamage(false);
    }

    function applyKampfPowerEffect(label) {
      const textEl = document.getElementById('kampfPowerEffectText');
      const roundEl = document.getElementById('kampfPowerEffectRounds');
      if (textEl && label) textEl.value = label;
      const fromRow = combatantById(kampfAimFrom);
      if (!fromRow || !canControlCombatant(fromRow)) return;
      const kind = kampfAimEffect === 'buff' ? 'buff' : 'debuff';
      const text = (label || (textEl && textEl.value) || '').trim();
      if (!text) {
        toast(kampfAimEffect === 'buff' ? 'Buff benennen.' : 'Debuff benennen.');
        return;
      }
      if (kampfPowerAction) {
        const spent = kampfConsumeAction(fromRow, kampfPowerAction);
        if (!spent.ok) {
          toast(spent.msg || 'Nicht verfügbar.');
          return;
        }
      }
      const rounds = roundEl && roundEl.value;
      const fromId = kampfAimFrom;
      const toId = kampfAimTo;
      clearKampfAimState();
      renderKampfPowerOverlay();
      addCombatDebuff(toId, text, rounds, kind, fromId);
    }

    function appendKampfPowerAct(box, act) {
      const from = combatantById(kampfAimFrom);
      const depleted = kampfActionDepleted(from, act);
      const econBlock = kampfEconomyBlocked(from, act);
      const off = depleted || !!econBlock;
      const selected = kampfPowerAction && kampfPowerAction.id === act.id && kampfPowerAction.kind === act.kind;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'battle-power-act' + (selected ? ' is-on' : '') + (off ? ' is-off' : '');
      const name = document.createElement('b');
      name.textContent = act.name;
      const meta = document.createElement('span');
      const bits = [];
      const slot = kampfActionEconomy(act);
      if (slot === 'bonus') bits.push('Bonus');
      else if (slot === 'reaction') bits.push('Reaktion');
      else if (slot === 'surge' || slot === 'free') bits.push('frei');
      else bits.push('Aktion');
      if (act.kind === 'spell') bits.push(act.level && act.level !== '0' ? 'G' + act.level : 'G0');
      if (act.kind === 'feature') {
        const max = kampfFeatureUseMax(act);
        if (max) bits.push(kampfFeatureUsed(act) + '/' + max + ' · ' + kampfResetShort(act.reset));
      } else {
        if (String(act.hit || act.bonus || '').trim()) bits.push(String(act.hit || act.bonus).trim());
        if (String(act.damage || '').trim()) bits.push(String(act.damage).trim());
      }
      if (String(act.range || '').trim()) bits.push(String(act.range).trim());
      meta.textContent = bits.join(' · ');
      btn.appendChild(name);
      btn.appendChild(meta);
      btn.onclick = ev => {
        ev.stopPropagation();
        if (depleted) {
          toast(act.kind === 'spell' ? 'Keine Zauberplätze mehr.' : 'Keine Nutzungen mehr.');
          return;
        }
        if (econBlock) {
          toast(econBlock);
          return;
        }
        pickKampfPowerAction(act);
      };
      box.appendChild(btn);
    }

    function renderKampfPowerOverlay() {
      const box = document.getElementById('kampfPowerOverlay');
      if (!box) return;
      if (!combat.started || !kampfPowerPhase || !kampfAimFrom || kampfPowerPhase === 'aim') {
        box.classList.add('hidden');
        box.innerHTML = '';
        kampfPowerRenderKey = '';
        return;
      }
      const from = combatantById(kampfAimFrom);
      const to = combatantById(kampfAimTo);
      const key = [kampfPowerPhase, kampfAimFrom, kampfAimTo, kampfPowerAction && kampfPowerAction.id, kampfAimEffect].join('|');
      if (key !== kampfPowerRenderKey) {
        kampfPowerRenderKey = key;
        const head = document.createElement('div');
        head.className = 'battle-power-head';
        const title = document.createElement('span');
        if (kampfPowerPhase === 'intent' || kampfPowerPhase === 'effect') {
          title.textContent = (from && from.name ? from.name : '—') + ' → ' + (to && to.name ? to.name : '…');
        } else {
          title.textContent = from && from.name ? from.name : 'Aktionen';
        }
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'ghost';
        close.textContent = '×';
        close.title = 'Schließen';
        close.onclick = ev => {
          ev.stopPropagation();
          cancelKampfAim();
        };
        head.appendChild(title);
        head.appendChild(close);
        box.innerHTML = '';
        box.appendChild(head);
        if (kampfPowerPhase === 'pick') {
          const list = combatantPowerList(from);
          if (list.attacks.length) {
            const sec = document.createElement('div');
            sec.className = 'battle-power-sec';
            sec.textContent = 'Angriffe';
            box.appendChild(sec);
            list.attacks.forEach(act => appendKampfPowerAct(box, act));
          }
          if (list.spells.length) {
            const sec = document.createElement('div');
            sec.className = 'battle-power-sec';
            sec.textContent = 'Zauber';
            box.appendChild(sec);
            list.spells.forEach(act => appendKampfPowerAct(box, act));
          }
          if (list.features.length) {
            const sec = document.createElement('div');
            sec.className = 'battle-power-sec';
            sec.textContent = 'Merkmale';
            box.appendChild(sec);
            list.features.forEach(act => appendKampfPowerAct(box, act));
          }
          const hint = document.createElement('p');
          hint.className = 'battle-power-hint';
          hint.textContent = 'Aktion oder Bonusaktion wählen';
          box.appendChild(hint);
        } else if (kampfPowerPhase === 'intent') {
          const ask = document.createElement('div');
          ask.className = 'battle-power-ask';
          const who = document.createElement('p');
          who.className = 'battle-power-hint';
          who.style.margin = '0';
          who.textContent = (kampfPowerAction && kampfPowerAction.name) || 'Aktion';
          const amtRow = document.createElement('div');
          amtRow.className = 'battle-power-amt';
          const amt = document.createElement('input');
          amt.id = 'kampfPowerAmt';
          amt.type = 'number';
          amt.min = '0';
          amt.placeholder = 'TP';
          amt.title = kampfPowerAction && kampfPowerAction.kind === 'feature'
            ? 'Leer = Merkmal nur einsetzen, ohne Schaden'
            : 'Leer = Würfel der Aktion, sonst 1';
          amtRow.appendChild(amt);
          const row = document.createElement('div');
          row.className = 'battle-power-row';
          const dmg = document.createElement('button');
          dmg.type = 'button';
          dmg.className = 'danger';
          dmg.textContent = 'Schaden';
          dmg.onclick = ev => { ev.stopPropagation(); applyKampfPowerOutcome(false); };
          const heal = document.createElement('button');
          heal.type = 'button';
          heal.className = 'ghost';
          heal.textContent = 'Heilung';
          heal.onclick = ev => { ev.stopPropagation(); applyKampfPowerOutcome(true); };
          row.appendChild(dmg);
          row.appendChild(heal);
          const row2 = document.createElement('div');
          row2.className = 'battle-power-row';
          const buff = document.createElement('button');
          buff.type = 'button';
          buff.className = 'ghost';
          buff.textContent = 'Buff';
          buff.onclick = ev => {
            ev.stopPropagation();
            kampfAimEffect = 'buff';
            kampfPowerPhase = 'effect';
            kampfPowerRenderKey = '';
            renderKampfPowerOverlay();
          };
          const debuff = document.createElement('button');
          debuff.type = 'button';
          debuff.className = 'ghost';
          debuff.textContent = 'Debuff';
          debuff.onclick = ev => {
            ev.stopPropagation();
            kampfAimEffect = 'debuff';
            kampfPowerPhase = 'effect';
            kampfPowerRenderKey = '';
            renderKampfPowerOverlay();
          };
          row2.appendChild(buff);
          row2.appendChild(debuff);
          ask.appendChild(who);
          ask.appendChild(amtRow);
          ask.appendChild(row);
          ask.appendChild(row2);
          box.appendChild(ask);
        } else if (kampfPowerPhase === 'effect') {
          const ask = document.createElement('div');
          ask.className = 'battle-power-ask';
          const text = document.createElement('input');
          text.id = 'kampfPowerEffectText';
          text.type = 'text';
          text.placeholder = kampfAimEffect === 'buff' ? 'z. B. Gesegnet' : 'z. B. Vergiftet';
          if (kampfPowerAction && kampfPowerAction.name) text.value = kampfPowerAction.name;
          const row = document.createElement('div');
          row.className = 'battle-power-row';
          const rounds = document.createElement('input');
          rounds.id = 'kampfPowerEffectRounds';
          rounds.type = 'number';
          rounds.min = '1';
          rounds.placeholder = 'Rd.';
          rounds.title = 'Leer = bleibt';
          const setBtn = document.createElement('button');
          setBtn.type = 'button';
          setBtn.className = 'primary';
          setBtn.textContent = 'Setzen';
          setBtn.onclick = ev => { ev.stopPropagation(); applyKampfPowerEffect(''); };
          row.appendChild(rounds);
          row.appendChild(setBtn);
          ask.appendChild(text);
          ask.appendChild(row);
          box.appendChild(ask);
          setTimeout(() => { try { text.focus(); } catch (err) {} }, 0);
        }
      }
      box.classList.remove('hidden');
      ensureKampfFloatHost(box);
      bindKampfFloatUi();
      positionKampfPowerOverlay();
    }

    function pickKampfAim(id) {
      if (kampfPowerPhase) return false;
      if (!canStartKampfAim() || !id || !combatantById(id)) return false;
      const row = combatantById(id);
      if (!kampfAimFrom) {
        if (!canControlCombatant(row)) return false;
        kampfAimFrom = id;
        kampfAimTo = '';
        kampfAimEffect = '';
      } else {
        kampfAimTo = id;
        kampfAimEffect = '';
      }
      syncKampfAimUi();
      return true;
    }

    function cancelKampfAim() {
      clearKampfAimState();
      renderKampfPowerOverlay();
      syncKampfAimUi();
      renderBattleBoards();
    }

    function fillKampfEffectSuggest() {
      const box = document.getElementById('kampfEffectSuggest');
      if (!box) return;
      box.innerHTML = '';
      const list = kampfAimEffect === 'buff' ? COMBAT_BUFF_SUGGEST : COMBAT_DEBUFF_SUGGEST;
      list.forEach(label => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ghost';
        btn.textContent = label;
        btn.onclick = () => applyKampfEffect(label);
        box.appendChild(btn);
      });
    }

    function syncKampfAimUi() {
      applyKampfAimHighlight();
      const hint = document.getElementById('kampfActHint');
      const econ = document.getElementById('kampfEcon');
      const panel = document.getElementById('kampfActionPanel');
      const cancel = document.getElementById('kampfAimCancel');
      const resolveBtn = document.getElementById('kampfResolveBtn');
      const effects = document.getElementById('kampfActionEffects');
      const who = document.getElementById('kampfActionWho');
      const from = combatantById(kampfAimFrom);
      const to = combatantById(kampfAimTo);
      const turnRow = combatantById(combat.activeId) || from;
      if (econ) {
        const show = !!(combat.started && turnRow && (isDM || isMyCombatTurn()));
        econ.textContent = show ? kampfEconLabel(turnRow) : '';
      }
      if (cancel) cancel.classList.toggle('hidden', !kampfAimFrom);
      if (resolveBtn) {
        const areaAim = kampfPowerPhase === 'aim' && kampfPowerAction && kampfActionIsArea(kampfPowerAction) && kampfAimTargets.length;
        resolveBtn.classList.toggle('hidden', !areaAim);
      }
      if (!combat.started) {
        if (hint) hint.textContent = 'Figuren vorbereiten, Rüstung und Initiative eintragen, dann Kampf starten.';
        if (panel) panel.classList.remove('is-open');
        if (cancel) cancel.classList.add('hidden');
        if (resolveBtn) resolveBtn.classList.add('hidden');
        if (effects) effects.classList.add('hidden');
        return;
      }
      if (!isDM && !isMyCombatTurn()) {
        if (hint) hint.textContent = 'Warte auf deinen Zug.';
        if (panel) panel.classList.remove('is-open');
        if (effects) effects.classList.add('hidden');
        return;
      }
      if (kampfPowerPhase) {
        if (panel) panel.classList.remove('is-open');
        if (effects) effects.classList.add('hidden');
        if (hint && from) {
          if (kampfPowerPhase === 'pick') hint.textContent = from.name + ': Aktion oder Bonusaktion wählen.';
          else if (kampfActionIsArea(kampfPowerAction) && kampfAimTargets.length) {
            hint.textContent = from.name + ' · ' + (kampfPowerAction.name || 'Aktion') + ' · ' + kampfAimTargets.length + ' Ziel(e) · Wirken oder weiteres Ziel.';
          } else hint.textContent = from.name + ' · ' + ((kampfPowerAction && kampfPowerAction.name) || 'Aktion') + ' → Ziel antippen.';
        }
        return;
      }
      if (!from) {
        if (hint) hint.textContent = isDM
          ? 'Figur antippen, Aktion wählen, Ziel antippen. Ziehen = Bewegung.'
          : combatPlayerTurnHint();
        if (panel) panel.classList.remove('is-open');
      } else if (!to) {
        if (hint) hint.textContent = from.name + ' → Ziel antippen. Dieselbe Figur nochmal = auf sich selbst.';
        if (panel) panel.classList.remove('is-open');
      } else {
        if (hint) hint.textContent = kampfAimLabel();
        if (who) who.textContent = kampfAimLabel();
        if (panel) {
          panel.classList.add('is-open');
          positionKampfActionPanel();
        }
      }
      if (effects) {
        effects.classList.toggle('hidden', kampfAimEffect !== 'buff' && kampfAimEffect !== 'debuff');
        if (kampfAimEffect) fillKampfEffectSuggest();
      }
    }

    function applyKampfAimDamage(heal) {
      const fromRow = combatantById(kampfAimFrom);
      if (!fromRow || !canControlCombatant(fromRow)) return;
      const to = kampfAimTo;
      const from = kampfAimFrom;
      const amt = combatDamageAmount();
      clearKampfAimState();
      renderKampfPowerOverlay();
      applyCombatDamage(to, amt, heal, from);
    }

    function applyKampfAimKill() {
      const fromRow = combatantById(kampfAimFrom);
      if (!fromRow || !canControlCombatant(fromRow)) return;
      const row = combatantById(kampfAimTo);
      if (!row) return;
      const from = combatantById(kampfAimFrom);
      clearKampfAimState();
      renderKampfPowerOverlay();
      row.count = Math.max(0, (Number(row.count) || 0) - 1);
      touchCombatant(row);
      combatLog((from ? from.name + ' → ' : '') + row.name + ' · einer tot');
      persistCombat();
      renderKampf();
    }

    function showKampfEffectPicker(kind) {
      kampfAimEffect = kind === 'buff' ? 'buff' : 'debuff';
      const text = document.getElementById('kampfEffectText');
      if (text) {
        text.placeholder = kind === 'buff' ? 'z. B. Gesegnet' : 'z. B. Vergiftet';
        text.focus();
      }
      syncKampfAimUi();
    }

    function applyKampfEffect(label) {
      const fromRow = combatantById(kampfAimFrom);
      if (!fromRow || !canControlCombatant(fromRow)) return;
      const kind = kampfAimEffect === 'buff' ? 'buff' : 'debuff';
      const text = (label || (document.getElementById('kampfEffectText') || {}).value || '').trim();
      const rounds = (document.getElementById('kampfEffectRounds') || {}).value;
      const fromId = kampfAimFrom;
      const toId = kampfAimTo;
      clearKampfAimState();
      renderKampfPowerOverlay();
      addCombatDebuff(toId, text, rounds, kind, fromId);
    }

    function combatHpBarEl(row) {
      const bar = document.createElement('div');
      bar.className = 'kampf-hp-bar';
      const pct = row.hpMax > 0 ? Math.max(0, Math.min(100, (row.hp / row.hpMax) * 100)) : 0;
      if (pct <= 25) bar.classList.add('is-low');
      const fill = document.createElement('span');
      fill.style.width = pct + '%';
      bar.appendChild(fill);
      return bar;
    }

    function kampfCompactItem(row) {
      const el = document.createElement('div');
      el.className = 'kampf-side-item ' + (row.kind === 'player' ? 'is-player' : 'is-enemy');
      if (isOwnCombatOwner(row.playerId)) el.classList.add('is-mine');
      if (isCombatantActiveTurn(row.id)) el.classList.add('is-active');
      if (combatantDown(row)) el.classList.add('is-down');
      bindKampfListLink(el, row.id);

      const init = document.createElement('div');
      init.className = 'kampf-side-init';
      const initLabel = document.createElement('span');
      initLabel.textContent = 'Init';
      init.appendChild(initLabel);
      if (isDM) {
        const initInput = kampfNumberInput(row.init, el => {
          row.init = parseCombatInit(el.value);
          touchCombatant(row);
          persistCombat();
          upsertBattleToken(row);
          renderKampf();
        }, { step: '0.1', title: 'Initiative' });
        init.appendChild(initInput);
      } else {
        const initVal = document.createElement('strong');
        initVal.textContent = String(Number(row.init) || 0);
        init.appendChild(initVal);
      }

      const face = document.createElement('div');
      face.className = 'kampf-face';
      paintPortraitEl(face, row.portraitId, row.name);

      const body = document.createElement('div');
      body.className = 'kampf-side-body';
      const head = document.createElement('div');
      head.className = 'kampf-side-head';
      const name = document.createElement('b');
      name.textContent = row.name || '—';
      const hp = document.createElement('span');
      hp.className = 'kampf-side-hp';
      hp.textContent = (Number(row.hp) || 0) + '/' + (Number(row.hpMax) || 0);
      if (row.tempHp) hp.textContent += ' +' + row.tempHp;
      if (row.countMax > 1) hp.textContent += ' · ×' + row.count;
      head.appendChild(name);
      head.appendChild(hp);
      body.appendChild(head);
      body.appendChild(combatHpBarEl(row));

      const bits = [];
      if (row.ac) bits.push('RK ' + row.ac);
      if (isCombatantActiveTurn(row.id)) bits.push('dran');
      if (combatantDown(row)) bits.push('kampfunfähig');
      if (bits.length) {
        const meta = document.createElement('span');
        meta.className = 'kampf-side-meta';
        meta.textContent = bits.join(' · ');
        body.appendChild(meta);
      }
      if (row.debuffs && row.debuffs.length) {
        const chips = document.createElement('div');
        chips.className = 'kampf-debuffs';
        row.debuffs.forEach(d => {
          const chip = document.createElement('span');
          chip.className = 'kampf-chip' + (d.kind === 'buff' ? ' is-buff' : '');
          chip.textContent = d.rounds == null ? d.text : (d.text + ' · ' + d.rounds);
          if (isDM) {
            const x = document.createElement('button');
            x.type = 'button';
            x.textContent = '×';
            x.title = d.kind === 'buff' ? 'Buff entfernen' : 'Debuff entfernen';
            x.onclick = ev => {
              ev.stopPropagation();
              removeCombatDebuff(row.id, d.id);
            };
            chip.appendChild(x);
          }
          chips.appendChild(chip);
        });
        body.appendChild(chips);
      }

      el.appendChild(init);
      el.appendChild(face);
      el.appendChild(body);
      const tools = document.createElement('div');
      tools.className = 'kampf-side-tools';
      const sheetBtn = makeStatSheetBtn(row);
      if (sheetBtn) tools.appendChild(sheetBtn);
      if (isDM && combat.started) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'danger kampf-side-del';
        del.textContent = '×';
        del.title = 'Fallen / entfernen';
        del.onclick = ev => {
          ev.stopPropagation();
          removeCombatant(row.id);
        };
        tools.appendChild(del);
      }
      if (tools.childNodes.length) el.appendChild(tools);
      return el;
    }

    function syncKampfChrome() {
      const round = document.getElementById('kampfRound');
      if (round) {
        if (!combat.started) round.textContent = 'Aufbau';
        else {
          const label = combatGroupLabel(activeCombatGroupKey());
          round.textContent = 'Runde ' + combat.round + (label ? ' · ' + label : '');
        }
      }
      const add = document.getElementById('kampfAdd');
      if (add) add.classList.remove('hidden');
      const startBtn = document.getElementById('kampfStartBtn');
      if (startBtn) startBtn.classList.toggle('hidden', !isDM || combat.started);
      const initAll = document.getElementById('kampfInitAllBtn');
      if (initAll) {
        initAll.classList.toggle('hidden', !isDM || combat.started || !combat.combatants.length);
        initAll.disabled = !diceRollsEnabled();
        initAll.title = diceRollsEnabled() ? '' : 'Würfel sind aus — Initiative selbst eintragen.';
      }
      const addToggle = document.getElementById('kampfAddToggleBtn');
      if (addToggle) addToggle.classList.toggle('hidden', !isDM || !combat.started);
      const nextBtn = document.getElementById('kampfNextBtn');
      if (nextBtn) nextBtn.classList.toggle('hidden', !canEndCombatTurn());
      const readyBtn = document.getElementById('kampfReadyBtn');
      if (readyBtn) readyBtn.classList.toggle('hidden', !canEndCombatTurn());
      const delayBtn = document.getElementById('kampfDelayBtn');
      if (delayBtn) delayBtn.classList.toggle('hidden', !canEndCombatTurn());
      ['kampfPrevBtn', 'kampfSkipBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('hidden', !isDM || !combat.started);
      });
      const endBtn = document.getElementById('kampfEndBtn');
      if (endBtn) endBtn.classList.toggle('hidden', !isDM);
      syncKampfAimUi();
      applyBattleTurnHighlight();
      document.querySelectorAll('.battle-stage').forEach(stage => {
        stage.classList.toggle('is-aiming', canStartKampfAim());
      });
      if (els.kampfView) els.kampfView.classList.toggle('is-live', !!combat.started);
      const stage = document.querySelector('#kampfView .kampf-stage');
      if (stage) stage.classList.toggle('is-live', !!combat.started);
    }

    function addCombatDebuff(id, text, roundsRaw, kind, fromId) {
      const row = combatantById(id);
      const label = (text || '').trim();
      if (!row || !label) return;
      const type = kind === 'buff' ? 'buff' : 'debuff';
      if (/^konzentration$/i.test(label)) {
        setCombatantConcentrating(row, true);
        const src = fromId ? combatantById(fromId) : null;
        combatLog((src ? src.name + ' → ' : '') + row.name + ' · Konzentration');
        persistCombat();
        renderKampf();
        renderBattleBoards();
        return;
      }
      const roundsNum = String(roundsRaw == null ? '' : roundsRaw).trim();
      const rounds = roundsNum === '' ? null : Math.max(1, Number(roundsNum) || 1);
      const existing = row.debuffs.find(d => d.text.toLowerCase() === label.toLowerCase());
      if (existing) {
        existing.rounds = rounds;
        existing.kind = type;
      } else {
        row.debuffs.push({ id: combatNewId('d'), text: label, rounds: rounds, kind: type });
      }
      const src = fromId ? combatantById(fromId) : null;
      combatLog((src ? src.name + ' → ' : '') + row.name + ' · ' + label);
      touchCombatant(row);
      persistCombat();
      renderKampf();
    }

    function removeCombatDebuff(cid, did) {
      const row = combatantById(cid);
      if (!row) return;
      const gone = row.debuffs.find(d => d.id === did);
      row.debuffs = row.debuffs.filter(d => d.id !== did);
      if (gone && /konzentration/i.test(String(gone.text || ''))) row.concentrating = false;
      touchCombatant(row);
      persistCombat();
      renderKampf();
      renderBattleBoards();
    }

    function tickCombatDebuffs(row) {
      if (!row || !row.debuffs.length) return;
      row.debuffs = row.debuffs.map(d => {
        if (d.rounds == null || !Number.isFinite(Number(d.rounds))) return d;
        return { id: d.id, text: d.text, kind: d.kind === 'buff' ? 'buff' : 'debuff', rounds: Number(d.rounds) - 1 };
      }).filter(d => d.rounds == null || d.rounds > 0);
      touchCombatant(row);
    }

    function startKampf() {
      if (!isDM) return;
      if (!combat.combatants.length) {
        toast('Erst alle Figuren setzen und Initiative eintragen.');
        return;
      }
      combat.started = true;
      ensureCombatTurn();
      combat.combatants.forEach(kampfResetEconomy);
      touchCombatTurn();
      cancelKampfAim();
      persistCombat();
      renderKampf();
      renderBattleBoards();
      const who = combatGroupLabel(activeCombatGroupKey());
      toast('Kampf läuft' + (who ? ' · ' + who + (who.indexOf(' + ') >= 0 ? ' sind' : ' ist') + ' dran' : '') + '.');
    }

    function rollAllKampfInit() {
      if (!isDM) return;
      if (!diceRollsEnabled()) { noticeDiceOff(); return; }
      if (combat.started) {
        toast('Initiative nur vor Kampfbeginn.');
        return;
      }
      if (!combat.combatants.length) {
        toast('Erst Figuren setzen.');
        return;
      }
      const dice = [];
      const lines = [];
      combat.combatants.forEach(row => {
        if (row.playerId === ILLUSION_OWNER) {
          row.init = 0;
          touchCombatant(row);
          return;
        }
        const die = 1 + Math.floor(Math.random() * 20);
        const bonus = combatantInitBonus(row);
        row.init = die + bonus;
        touchCombatant(row);
        lines.push(row.name + ' ' + die + (bonus ? ' (' + dndSigned(bonus) + ')' : '') + ' = ' + row.init);
        if (dice.length < 8) dice.push({ sides: 20, value: die });
      });
      persistCombat();
      renderKampf();
      renderBattleBoards();
      playTableDie({
        dice: dice,
        caption: 'Initiative: ' + lines.join(', ')
      });
    }

    function markActiveKampfTurn(kind) {
      if (!canEndCombatTurn()) return;
      const key = activeCombatGroupKey();
      combatGroupMembers(key).forEach(row => {
        row.ready = kind === 'ready';
        row.delayed = kind === 'delay';
        touchCombatant(row);
      });
      if (kind === 'ready') {
        nextCombatTurn();
        toast('Aktion bereit.');
        return;
      }
      ensureCombatTurn();
      const order = combatTurnOrder();
      if (!order.length) return;
      const cur = activeCombatGroupKey() || order[0];
      const i = Math.max(0, order.indexOf(cur));
      const next = firstInCombatGroup(order[(i + 1) % order.length]);
      combat.activeId = next ? next.id : null;
      if (next) kampfResetTurnEconomy(combatGroupKey(next));
      cancelKampfAim();
      touchCombatTurn();
      persistCombat();
      renderKampf();
      renderBattleBoards();
      toast('Zug aufgeschoben.');
    }

    function toggleKampfConcentrate() {
      const fromRow = combatantById(kampfAimFrom);
      if (!fromRow || !canControlCombatant(fromRow)) return;
      const row = combatantById(kampfAimTo || kampfAimFrom);
      if (!row) return;
      const on = !combatantIsConcentrating(row);
      setCombatantConcentrating(row, on);
      combatLog((fromRow.name === row.name ? row.name : fromRow.name + ' → ' + row.name) + ' · Konzentration ' + (on ? 'an' : 'aus'));
      persistCombat();
      renderKampf();
      renderBattleBoards();
      toast(row.name + (on ? ' konzentriert sich.' : ': Konzentration beendet.'));
    }

    function setCombatActive(id) {
      if (!combatantById(id) || !combat.started) return;
      combat.activeId = id;
      touchCombatTurn();
      persistCombat();
      renderKampf();
    }

    function nextCombatTurn() {
      if (!canEndCombatTurn()) {
        if (!combat.started) toast('Erst „Kampf starten“.');
        else if (!isDM) toast('Erst wenn du am Zug bist.');
        else toast('Noch niemand im Kampf.');
        return;
      }
      ensureCombatTurn();
      const order = combatTurnOrder();
      if (!order.length) return;
      const key = activeCombatGroupKey() || order[0];
      const i = Math.max(0, order.indexOf(key));
      if (combat.debuffTick === 'turn') combatGroupMembers(key).forEach(tickCombatDebuffs);
      let nextKey;
      if (i + 1 >= order.length) {
        combat.round += 1;
        if (combat.debuffTick === 'round') sortedCombatants().forEach(tickCombatDebuffs);
        nextKey = order[0];
      } else {
        nextKey = order[i + 1];
      }
      const next = firstInCombatGroup(nextKey);
      combat.activeId = next ? next.id : null;
      combatGroupMembers(nextKey).forEach(row => {
        row.ready = false;
        row.delayed = false;
        touchCombatant(row);
      });
      kampfResetTurnEconomy(nextKey);
      cancelKampfAim();
      touchCombatTurn();
      persistCombat();
      renderKampf();
      renderBattleBoards();
    }

    function skipCombatTurn() {
      if (!isDM) return;
      const order = combatTurnOrder();
      if (!order.length) {
        toast('Noch niemand im Kampf.');
        return;
      }
      if (!combat.started) {
        toast('Erst „Kampf starten“.');
        return;
      }
      ensureCombatTurn();
      const key = activeCombatGroupKey() || order[0];
      const i = Math.max(0, order.indexOf(key));
      const next = firstInCombatGroup(order[(i + 1) % order.length]);
      combat.activeId = next ? next.id : null;
      if (next) kampfResetTurnEconomy(combatGroupKey(next));
      cancelKampfAim();
      touchCombatTurn();
      persistCombat();
      renderKampf();
      renderBattleBoards();
    }

    function prevCombatTurn() {
      if (!isDM) return;
      const order = combatTurnOrder();
      if (!order.length) {
        toast('Noch niemand im Kampf.');
        return;
      }
      if (!combat.started) {
        toast('Erst „Kampf starten“.');
        return;
      }
      ensureCombatTurn();
      const key = activeCombatGroupKey() || order[0];
      const i = Math.max(0, order.indexOf(key));
      const prev = firstInCombatGroup(order[(i - 1 + order.length) % order.length]);
      combat.activeId = prev ? prev.id : null;
      if (prev) kampfResetTurnEconomy(combatGroupKey(prev));
      cancelKampfAim();
      touchCombatTurn();
      persistCombat();
      renderKampf();
      renderBattleBoards();
    }

    function endCombat() {
      if (!isDM) return;
      const tick = combat.debuffTick;
      const now = stampNow();
      const removed = Object.assign({}, combat.removed || {});
      combat.combatants.forEach(c => { if (c && c.id) removed[c.id] = now; });
      if (!combat.combatants.length) {
        combat = emptyCombat();
        combat.debuffTick = tick;
        combat.removed = removed;
        combat.turnAt = now;
        combat.log = [];
        combat.logResetAt = now;
        cancelKampfAim();
        persistCombat();
        renderKampf();
        return;
      }
      if (!confirm('Kampf beenden? Initiative und Kampfdaten werden gelöscht, Portraits und Gefahrenflächen bleiben auf der Karte stehen.')) return;
      combat = emptyCombat();
      combat.debuffTick = tick;
      combat.removed = removed;
      combat.turnAt = now;
      combat.log = [];
      combat.logResetAt = now;
      cancelKampfAim();
      persistCombat();
      renderKampf();
      renderBattleBoards();
      toast('Kampf beendet.');
    }

    function saveCombatTemplate() {
      const name = (document.getElementById('kampfTplName').value || '').trim();
      if (!name) {
        toast('Bitte einen Namen für die Vorlage, z. B. Orks an der Brücke.');
        return;
      }
      if (!combat.combatants.length) {
        toast('Die Tafel ist leer.');
        return;
      }
      const list = loadCombatTemplates();
      list.unshift({
        id: combatNewId('tpl'),
        name: name,
        savedAt: Date.now(),
        combatants: combat.combatants.map(c => ({
          name: c.name,
          kind: c.kind,
          playerId: c.playerId || '',
          init: c.init,
          order: c.order || 0,
          hpMax: c.hpMax,
          ac: c.ac || '',
          note: c.note || '',
          countMax: Math.max(1, Number(c.countMax) || Number(c.count) || 1),
          portraitId: c.portraitId || ''
        }))
      });
      persistCombatTemplates(list);
      document.getElementById('kampfTplName').value = '';
      toast('Vorlage gespeichert.');
      renderKampf();
    }

    function applyCombatTemplate(id) {
      if (combat.started) {
        toast('Der Kampf läuft. Keine neuen Figuren.');
        return;
      }
      const tpl = loadCombatTemplates().find(t => t.id === id);
      if (!tpl) return;
      if (combat.combatants.length && !confirm('Tafel durch die Vorlage „' + tpl.name + '“ ersetzen?')) return;
      const tick = combat.debuffTick;
      const now = stampNow();
      const removed = Object.assign({}, combat.removed || {});
      combat.combatants.forEach(c => { if (c && c.id) removed[c.id] = now; });
      combat = emptyCombat();
      combat.debuffTick = tick;
      combat.removed = removed;
      combat.turnAt = now;
      (tpl.combatants || []).forEach(c => {
        const row = normalizeCombatant({
          name: c.name,
          kind: c.kind,
          playerId: c.playerId,
          init: c.init,
          order: c.order,
          hp: c.hpMax,
          hpMax: c.hpMax,
          ac: c.ac,
          note: c.note,
          count: c.countMax,
          countMax: c.countMax,
          tempHp: 0,
          debuffs: [],
          portraitId: c.portraitId || ''
        });
        touchCombatant(row);
        if (combat.removed) delete combat.removed[row.id];
        combat.combatants.push(row);
      });
      ensureCombatTurn();
      persistCombat();
      replaceBattleTokensFromCombat();
      renderKampf();
      toast('Vorlage geladen. Initiative prüfen.');
    }

    function deleteCombatTemplate(id) {
      const list = loadCombatTemplates();
      const tpl = list.find(t => t.id === id);
      if (!tpl) return;
      if (!confirm('Vorlage „' + tpl.name + '“ löschen?')) return;
      persistCombatTemplates(list.filter(t => t.id !== id));
      renderKampf();
    }

    function kampfLabeledInput(label, el) {
      const wrap = document.createElement('label');
      wrap.className = 'kampf-field';
      const span = document.createElement('span');
      span.textContent = label;
      wrap.appendChild(span);
      wrap.appendChild(el);
      return wrap;
    }

    function refreshCombatantVisual(row) {
      if (row) touchCombatant(row);
      persistCombat();
      if (!row) return;
      const down = combatantDown(row);
      document.querySelectorAll('.kampf-card[data-id="' + CSS.escape(row.id) + '"], .kampf-side-item[data-id="' + CSS.escape(row.id) + '"]').forEach(el => {
        el.classList.toggle('is-down', down);
        const bar = el.querySelector('.kampf-hp-bar');
        if (bar) {
          const pct = row.hpMax > 0 ? Math.max(0, Math.min(100, (row.hp / row.hpMax) * 100)) : 0;
          bar.classList.toggle('is-low', pct <= 25);
          const fill = bar.querySelector('span');
          if (fill) fill.style.width = pct + '%';
        }
        const hp = el.querySelector('.kampf-side-hp');
        if (hp) {
          hp.textContent = (Number(row.hp) || 0) + '/' + (Number(row.hpMax) || 0);
          if (row.tempHp) hp.textContent += ' +' + row.tempHp;
          if (row.countMax > 1) hp.textContent += ' · ×' + row.count;
        }
      });
      applyBattleTurnHighlight();
      syncCombatantHpToSheet(row);
      renderBattleBoards();
    }

    function kampfNumberInput(value, onChange, extra) {
      const el = document.createElement('input');
      el.type = extra && extra.type ? extra.type : 'number';
      if (extra && extra.step) el.step = extra.step;
      if (extra && extra.min != null) el.min = extra.min;
      if (extra && extra.placeholder) el.placeholder = extra.placeholder;
      if (extra && extra.title) el.title = extra.title;
      el.value = value;
      el.onchange = () => onChange(el);
      return el;
    }

    function sortedBattleTokens() {
      return battle.tokens.slice().sort((a, b) => {
        const di = (Number(b.init) || 0) - (Number(a.init) || 0);
        if (di) return di;
        return (a.name || '').localeCompare(b.name || '', 'de');
      });
    }

    function renderKampfInitStrip() {
      const strip = document.getElementById('kampfInitStrip');
      if (!strip) return;
      const rows = combat.combatants.length ? sortedCombatants() : [];
      strip.classList.toggle('hidden', !rows.length);
      strip.innerHTML = '';
      rows.forEach(row => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'kampf-init-item ' + (row.kind === 'player' ? 'is-player' : 'is-enemy');
        if (isOwnCombatOwner(row.playerId)) btn.classList.add('is-mine');
        if (isCombatantActiveTurn(row.id)) btn.classList.add('is-active');
        if (combatantDown(row)) btn.classList.add('is-down');
        if (row.ready) btn.classList.add('is-ready');
        if (row.delayed) btn.classList.add('is-delay');
        btn.title = row.name || '';
        const face = document.createElement('div');
        face.className = 'kampf-face';
        paintPortraitEl(face, row.portraitId, row.name);
        const cap = document.createElement('span');
        cap.textContent = row.name || '—';
        btn.appendChild(face);
        btn.appendChild(cap);
        bindKampfListLink(btn, row.id);
        strip.appendChild(btn);
      });
      applyKampfAimHighlight();
    }

    function renderPlayerKampfList() {
      const list = document.getElementById('kampfList');
      if (!list) return;
      list.innerHTML = '';
      if (combat.started) {
        applyBattleLinkHighlight();
        renderKampfLog();
        return;
      }
      const rows = combat.combatants.length ? sortedCombatants() : [];
      if (!rows.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.textContent = 'Noch niemand im Kampf. Der DM setzt die Figuren in die Reihenfolge.';
        list.appendChild(empty);
        applyBattleLinkHighlight();
        return;
      }
      rows.forEach(row => list.appendChild(kampfCompactItem(row)));
      applyBattleLinkHighlight();
      renderKampfLog();
    }

    function renderKampf() {
      if (!els.kampfView || els.kampfView.classList.contains('hidden')) return;
      ensureCombatTurn();
      syncKampfChrome();
      if (!isDM) {
        renderPlayerKampfList();
        renderKampfInitStrip();
        return;
      }
      renderKampfKartenList();

      const playersBox = document.getElementById('kampfPlayers');
      if (!playersBox) return;
      playersBox.innerHTML = '';
      const ids = combatSheetOwners();
      const free = ids.filter(id => !combat.combatants.some(c => c.playerId === id));
      if (!ids.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.padding = '0';
        empty.textContent = 'Noch keine Spieler-Konten.';
        playersBox.appendChild(empty);
      } else if (!free.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.padding = '0';
        empty.textContent = 'Alle Spieler sind schon in der Liste.';
        playersBox.appendChild(empty);
      } else {
        if (free.length > 1) {
          const all = document.createElement('button');
          all.type = 'button';
          all.className = 'ghost';
          all.textContent = 'Alle übernehmen';
          all.onclick = () => {
            free.forEach(id => addPlayerToCombat(id, true));
            persistCombat();
            renderKampf();
            toast('Spieler übernommen. Initiative noch eintragen.');
          };
          playersBox.appendChild(all);
        }
        free.forEach(id => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = combatOwnerLabel(id);
          btn.onclick = () => addPlayerToCombat(id);
          playersBox.appendChild(btn);
        });
      }

      const npcsBox = document.getElementById('kampfNpcs');
      if (npcsBox) {
        npcsBox.innerHTML = '';
        const npcIds = Object.keys(npcAccounts);
        const freeNpcs = npcIds.filter(id => !combat.combatants.some(c => c.playerId === NPC_PREFIX + id));
        if (!npcIds.length) {
          const empty = document.createElement('p');
          empty.className = 'kampf-empty';
          empty.style.padding = '0';
          empty.textContent = 'Noch keine NPCs angelegt.';
          npcsBox.appendChild(empty);
        } else if (!freeNpcs.length) {
          const empty = document.createElement('p');
          empty.className = 'kampf-empty';
          empty.style.padding = '0';
          empty.textContent = 'Alle NPCs sind schon in der Liste.';
          npcsBox.appendChild(empty);
        } else {
          freeNpcs.forEach(id => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ghost';
            btn.textContent = npcAccounts[id].name || 'NPC';
            btn.onclick = () => addNpcToCombat(id);
            npcsBox.appendChild(btn);
          });
        }
      }

      const tplBox = document.getElementById('kampfTplList');
      if (!tplBox) return;
      tplBox.innerHTML = '';
      const tpls = loadCombatTemplates();
      if (!tpls.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.padding = '0.4rem 0 0';
        empty.textContent = 'Noch keine Vorlagen.';
        tplBox.appendChild(empty);
      }
      tpls.forEach(tpl => {
        const loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'ghost';
        loadBtn.textContent = tpl.name;
        loadBtn.onclick = () => applyCombatTemplate(tpl.id);
        tplBox.appendChild(loadBtn);
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'danger';
        delBtn.textContent = '×';
        delBtn.title = 'Vorlage löschen';
        delBtn.onclick = () => deleteCombatTemplate(tpl.id);
        tplBox.appendChild(delBtn);
      });

      const rows = sortedCombatants();

      const list = document.getElementById('kampfList');
      list.innerHTML = '';
      if (combat.started) {
        applyBattleLinkHighlight();
        syncKampfChrome();
        renderKampfInitStrip();
        renderKampfLog();
        return;
      }
      if (!rows.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.textContent = 'Noch niemand im Kampf. Übernimm die Spieler und füge Gegner hinzu.';
        list.appendChild(empty);
      }
      rows.forEach((row, index) => {
        const card = document.createElement('article');
        card.className = 'kampf-card ' + (row.kind === 'player' ? 'is-player' : 'is-enemy');
        if (row.id === combat.activeId) card.classList.add('is-active');
        if (combatantDown(row)) card.classList.add('is-down');
        bindKampfListLink(card, row.id);

        const top = document.createElement('div');
        top.className = 'kampf-card-top';

        const initBox = document.createElement('div');
        initBox.className = 'kampf-init';
        const initLabel = document.createElement('span');
        initLabel.textContent = 'Init';
        const initInput = kampfNumberInput(row.init, el => {
          row.init = parseCombatInit(el.value);
          touchCombatant(row);
          persistCombat();
          upsertBattleToken(row);
          renderKampf();
        }, { step: '0.1', title: 'Gewürfelte Initiative' });
        initBox.appendChild(initLabel);
        initBox.appendChild(initInput);

        const face = document.createElement('div');
        face.className = 'kampf-face';
        paintPortraitEl(face, row.portraitId, row.name);

        const who = document.createElement('div');
        who.className = 'kampf-who';
        const nameInput = document.createElement('input');
        nameInput.className = 'kampf-name';
        nameInput.value = row.name;
        nameInput.onchange = () => {
          const next = (nameInput.value || '').trim();
          if (!next) {
            nameInput.value = row.name;
            return;
          }
          row.name = next;
          touchCombatant(row);
          persistCombat();
          upsertBattleToken(row);
          renderKampf();
        };
        const meta = document.createElement('em');
        const bits = [row.kind === 'player' ? 'Spieler' : 'Gegner'];
        if (row.note) bits.push(row.note);
        if (combatantDown(row)) bits.push('kampfunfähig');
        if (isCombatantActiveTurn(row.id)) bits.push('dran');
        meta.textContent = bits.join(' · ');
        who.appendChild(nameInput);
        who.appendChild(meta);

        const tools = document.createElement('div');
        tools.className = 'kampf-card-tools';
        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'ghost';
        up.textContent = '↑';
        up.title = 'Bei gleicher Initiative einen Platz nach oben';
        up.disabled = index === 0;
        up.onclick = () => nudgeCombatant(row.id, -1);
        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'ghost';
        down.textContent = '↓';
        down.title = 'Bei gleicher Initiative einen Platz nach unten';
        down.disabled = index === rows.length - 1;
        down.onclick = () => nudgeCombatant(row.id, 1);
        tools.appendChild(up);
        tools.appendChild(down);
        const sheetBtn = makeStatSheetBtn(row);
        if (sheetBtn) tools.appendChild(sheetBtn);
        if (!combat.started && row.kind !== 'player') {
          const dup = document.createElement('button');
          dup.type = 'button';
          dup.className = 'ghost';
          dup.textContent = 'Duplizieren';
          dup.onclick = () => duplicateCombatant(row.id);
          tools.appendChild(dup);
        }
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'danger';
        del.textContent = '×';
        del.title = combat.started ? 'Fallen / entfernen' : 'Aus dem Kampf nehmen';
        del.onclick = () => removeCombatant(row.id);
        tools.appendChild(del);

        top.appendChild(initBox);
        top.appendChild(face);
        top.appendChild(who);
        top.appendChild(tools);

        const hpBox = document.createElement('div');
        hpBox.className = 'kampf-hp';
        const hpRow = document.createElement('div');
        hpRow.className = 'kampf-hp-row';
        const hpNow = kampfNumberInput(row.hp, el => {
          row.hp = Number(el.value) || 0;
          refreshCombatantVisual(row);
        });
        const hpMax = kampfNumberInput(row.hpMax, el => {
          row.hpMax = Math.max(0, Number(el.value) || 0);
          refreshCombatantVisual(row);
        });
        const acInput = document.createElement('input');
        acInput.value = row.ac;
        acInput.placeholder = '—';
        acInput.onchange = () => {
          row.ac = (acInput.value || '').trim();
          touchCombatant(row);
          persistCombat();
        };
        const tempInput = kampfNumberInput(row.tempHp, el => {
          row.tempHp = Math.max(0, Number(el.value) || 0);
          refreshCombatantVisual(row);
        }, { min: '0' });
        hpRow.appendChild(kampfLabeledInput('TP', hpNow));
        const slash = document.createElement('span');
        slash.textContent = '/';
        slash.style.color = 'var(--muted)';
        hpRow.appendChild(slash);
        hpRow.appendChild(hpMax);
        hpRow.appendChild(kampfLabeledInput('Temp', tempInput));
        hpRow.appendChild(kampfLabeledInput('Rüstung', acInput));
        if (!combat.started) {
          const dmg = kampfNumberInput('', () => {}, { min: '0', placeholder: '0' });
          dmg.value = '';
          dmg.onkeydown = ev => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              applyCombatDamage(row.id, combatDamageAmount(dmg), false);
            }
          };
          const hit = document.createElement('button');
          hit.type = 'button';
          hit.className = 'danger kampf-act-hit';
          hit.textContent = '−';
          hit.title = 'Schaden';
          hit.onclick = () => applyCombatDamage(row.id, combatDamageAmount(dmg), false);
          const heal = document.createElement('button');
          heal.type = 'button';
          heal.className = 'ghost';
          heal.textContent = '+';
          heal.title = 'Heilung';
          heal.onclick = () => applyCombatDamage(row.id, combatDamageAmount(dmg), true);
          hpRow.appendChild(kampfLabeledInput('Schaden', dmg));
          hpRow.appendChild(hit);
          hpRow.appendChild(heal);
        }
        const countInput = kampfNumberInput(row.count, el => {
          row.count = Math.max(0, Number(el.value) || 0);
          refreshCombatantVisual(row);
        }, { min: '0' });
        const countMax = kampfNumberInput(row.countMax, el => {
          row.countMax = Math.max(1, Number(el.value) || 1);
          refreshCombatantVisual(row);
        }, { min: '1' });
        const minus = document.createElement('button');
        minus.type = 'button';
        minus.className = 'ghost';
        minus.textContent = 'Einer tot';
        minus.onclick = () => {
          row.count = Math.max(0, (Number(row.count) || 0) - 1);
          countInput.value = row.count;
          refreshCombatantVisual(row);
        };
        hpRow.appendChild(kampfLabeledInput('Anzahl', countInput));
        const cSlash = document.createElement('span');
        cSlash.textContent = '/';
        cSlash.style.color = 'var(--muted)';
        hpRow.appendChild(cSlash);
        hpRow.appendChild(countMax);
        hpRow.appendChild(minus);

        hpBox.appendChild(hpRow);
        hpBox.appendChild(combatHpBarEl(row));

        const deb = document.createElement('div');
        deb.className = 'kampf-debuffs';
        row.debuffs.forEach(d => {
          const chip = document.createElement('span');
          chip.className = 'kampf-chip' + (d.kind === 'buff' ? ' is-buff' : '');
          chip.textContent = d.rounds == null ? d.text : (d.text + ' · ' + d.rounds + ' Rd.');
          const x = document.createElement('button');
          x.type = 'button';
          x.textContent = '×';
          x.title = d.kind === 'buff' ? 'Buff entfernen' : 'Debuff entfernen';
          x.onclick = () => removeCombatDebuff(row.id, d.id);
          chip.appendChild(x);
          deb.appendChild(chip);
        });
        if (!combat.started) {
        const addRow = document.createElement('div');
        addRow.className = 'kampf-debuff-add';
        const dText = document.createElement('input');
        dText.type = 'text';
        dText.placeholder = 'z. B. Vergiftet';
        const dRounds = document.createElement('input');
        dRounds.type = 'number';
        dRounds.min = '1';
        dRounds.placeholder = 'Rd.';
        dRounds.title = 'Dauer in Runden. Leer lassen, wenn der Debuff bleibt.';
        const dAdd = document.createElement('button');
        dAdd.type = 'button';
        dAdd.className = 'primary';
        dAdd.textContent = '+';
        dAdd.title = 'Debuff setzen';
        const addIt = () => addCombatDebuff(row.id, dText.value, dRounds.value);
        dAdd.onclick = addIt;
        const onEnter = ev => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            addIt();
          }
        };
        dText.onkeydown = onEnter;
        dRounds.onkeydown = onEnter;
        addRow.appendChild(kampfLabeledInput('Debuff', dText));
        addRow.appendChild(kampfLabeledInput('Dauer', dRounds));
        addRow.appendChild(dAdd);
        const suggest = document.createElement('div');
        suggest.className = 'kampf-suggest';
        COMBAT_DEBUFF_SUGGEST.forEach(label => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = label;
          btn.onclick = () => {
            if (String(dRounds.value || '').trim()) addCombatDebuff(row.id, label, dRounds.value);
            else dText.value = label;
            dText.focus();
          };
          suggest.appendChild(btn);
        });
        deb.appendChild(addRow);
        deb.appendChild(suggest);
        }

        card.appendChild(top);
        card.appendChild(hpBox);
        card.appendChild(deb);
        list.appendChild(card);
      });
      applyBattleLinkHighlight();
      syncKampfChrome();
      renderKampfInitStrip();
      renderKampfLog();
    }

    function renderKampfLog() {
      const logBox = document.getElementById('kampfLog');
      if (!logBox) return;
      logBox.innerHTML = '';
      if (!combat.log.length) {
        logBox.classList.add('hidden');
        return;
      }
      logBox.classList.remove('hidden');
      combat.log.forEach(line => {
        const div = document.createElement('div');
        div.textContent = combatLogText(line);
        if (!div.textContent) return;
        logBox.appendChild(div);
      });
    }

    function showKampf() {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      sheetDirty = false;
      openedFromMap = false;
      showPage('kampf');
      currentIndex = null;
      currentTitle = null;
      renderKampf();
      renderBattleBoards();
      persistView();
    }
