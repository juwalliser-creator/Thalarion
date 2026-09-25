/* Thalarion – Dungeon (Karte + Fog of War) */

    function dungeonNewId(prefix) {
      return (prefix || 'd') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function clampDungeonTokenSize(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return 48;
      return Math.max(24, Math.min(80, Math.round(v)));
    }

    function clampDungeonFogRadius(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return 9;
      return Math.max(4, Math.min(18, Math.round(v)));
    }

    function normalizeDungeonToken(t) {
      const raw = t && typeof t === 'object' ? t : {};
      const kind = raw.kind === 'player' || raw.kind === 'npc' ? raw.kind : 'custom';
      return {
        id: raw.id || dungeonNewId('dt'),
        name: String(raw.name || '').trim() || 'Figur',
        kind: kind,
        playerId: String(raw.playerId || ''),
        portraitId: String(raw.portraitId || ''),
        x: Math.max(0, Math.min(100, Number(raw.x) || 50)),
        y: Math.max(0, Math.min(100, Number(raw.y) || 50)),
        movedAt: stamp(raw.movedAt)
      };
    }

    function normalizeDungeonFogReveal(r) {
      const raw = r && typeof r === 'object' ? r : {};
      return {
        id: raw.id || dungeonNewId('fog'),
        x: Math.max(0, Math.min(100, Number(raw.x) || 0)),
        y: Math.max(0, Math.min(100, Number(raw.y) || 0)),
        r: clampDungeonFogRadius(raw.r || dungeon.fogRadius),
        updatedAt: stamp(raw.updatedAt)
      };
    }

    function dungeonPayload() {
      return {
        updatedAt: stamp(dungeon.updatedAt),
        layoutAt: stamp(dungeon.layoutAt),
        tokens: (dungeon.tokens || []).map(normalizeDungeonToken),
        fogOn: dungeon.fogOn !== false,
        fogReveals: (dungeon.fogReveals || []).map(normalizeDungeonFogReveal),
        fogRadius: clampDungeonFogRadius(dungeon.fogRadius),
        tokenSize: clampDungeonTokenSize(dungeon.tokenSize),
        removedTokens: Object.assign({}, dungeon.removedTokens || {}),
        removedFog: Object.assign({}, dungeon.removedFog || {})
      };
    }

    function mergeDungeonStates(a, b) {
      a = a || {};
      b = b || {};
      const removedTokens = mergeStampMap(a.removedTokens, b.removedTokens);
      const removedFog = mergeStampMap(a.removedFog, b.removedFog);
      const layoutSrc = stamp(b.layoutAt) >= stamp(a.layoutAt) ? b : a;
      return {
        updatedAt: Math.max(stamp(a.updatedAt), stamp(b.updatedAt)),
        layoutAt: Math.max(stamp(a.layoutAt), stamp(b.layoutAt)),
        tokens: mergeByStamp(
          (Array.isArray(a.tokens) ? a.tokens : []).map(normalizeDungeonToken),
          (Array.isArray(b.tokens) ? b.tokens : []).map(normalizeDungeonToken),
          'movedAt',
          removedTokens
        ),
        fogOn: layoutSrc.fogOn !== false,
        fogReveals: mergeByStamp(
          (Array.isArray(a.fogReveals) ? a.fogReveals : []).map(normalizeDungeonFogReveal),
          (Array.isArray(b.fogReveals) ? b.fogReveals : []).map(normalizeDungeonFogReveal),
          'updatedAt',
          removedFog
        ),
        fogRadius: clampDungeonFogRadius(
          stamp(b.layoutAt) >= stamp(a.layoutAt) ? (b.fogRadius != null ? b.fogRadius : a.fogRadius) : (a.fogRadius != null ? a.fogRadius : b.fogRadius)
        ),
        tokenSize: clampDungeonTokenSize(
          stamp(b.layoutAt) >= stamp(a.layoutAt) ? (b.tokenSize != null ? b.tokenSize : a.tokenSize) : (a.tokenSize != null ? a.tokenSize : b.tokenSize)
        ),
        removedTokens: removedTokens,
        removedFog: removedFog
      };
    }

    function applyDungeonState(next, doRender) {
      dungeon.updatedAt = stamp(next.updatedAt);
      dungeon.layoutAt = stamp(next.layoutAt);
      dungeon.tokens = next.tokens || [];
      dungeon.fogOn = next.fogOn !== false;
      dungeon.fogReveals = next.fogReveals || [];
      dungeon.fogRadius = clampDungeonFogRadius(next.fogRadius);
      dungeon.tokenSize = clampDungeonTokenSize(next.tokenSize);
      dungeon.removedTokens = next.removedTokens || {};
      dungeon.removedFog = next.removedFog || {};
      persistDungeonLocal();
      if (doRender !== false) renderDungeon();
    }

    function applyDungeon(data, doRender) {
      if (!data) return;
      applyDungeonState(mergeDungeonStates({}, data), doRender);
    }

    function persistDungeonLocal() {
      writeLocal(DUNGEON_LOCAL_KEY, JSON.stringify(dungeonPayload()));
    }

    function loadDungeonLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(DUNGEON_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        dungeon.updatedAt = stamp(raw.updatedAt);
        dungeon.layoutAt = stamp(raw.layoutAt);
        dungeon.tokens = (Array.isArray(raw.tokens) ? raw.tokens : []).map(normalizeDungeonToken);
        dungeon.fogOn = raw.fogOn !== false;
        dungeon.fogReveals = (Array.isArray(raw.fogReveals) ? raw.fogReveals : []).map(normalizeDungeonFogReveal);
        dungeon.fogRadius = clampDungeonFogRadius(raw.fogRadius);
        dungeon.tokenSize = clampDungeonTokenSize(raw.tokenSize);
        dungeon.removedTokens = Object.assign({}, raw.removedTokens || {});
        dungeon.removedFog = Object.assign({}, raw.removedFog || {});
      } catch (err) {}
    }

    function applyDungeonMap(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= dungeon.mapUpdatedAt) return;
      dungeon.mapUpdatedAt = at;
      dungeon.image = data.image || '';
      renderDungeon();
    }

    function listenDungeon() {
      if (!db) return;
      dungeonRef().onSnapshot(snap => {
        if (!snap.exists) return;
        if (writingDungeon) {
          pendingDungeonSnap = snap.data();
          return;
        }
        applyDungeon(snap.data());
      });
      dungeonMapRef().onSnapshot(snap => {
        if (writingDungeonMap || !snap.exists) return;
        applyDungeonMap(snap.data());
      });
    }

    function persistDungeonSoon() {
      clearTimeout(dungeonPersistTimer);
      dungeonPersistTimer = setTimeout(() => { persistDungeon(); }, 180);
    }

    async function persistDungeon() {
      persistDungeonLocal();
      if (!db) return;
      if (writingDungeon) {
        dungeonWriteQueued = true;
        return;
      }
      writingDungeon = true;
      dungeonWriteQueued = false;
      let wrote = null;
      try {
        await db.runTransaction(async tx => {
          const ref = dungeonRef();
          const snap = await tx.get(ref);
          wrote = snap.exists ? mergeDungeonStates(snap.data(), dungeonPayload()) : dungeonPayload();
          wrote.updatedAt = Math.max(stamp(wrote.updatedAt), stampNow());
          tx.set(ref, wrote);
        });
        if (wrote) {
          const keepImage = dungeon.image;
          applyDungeonState(mergeDungeonStates(wrote, dungeonPayload()), currentPage === 'dungeon');
          dungeon.image = keepImage;
        }
      } catch (err) {
        toast('Dungeon konnte nicht gespeichert werden: ' + err.message);
      } finally {
        writingDungeon = false;
        if (pendingDungeonSnap && !dungeonTokenDrag) {
          const snap = pendingDungeonSnap;
          pendingDungeonSnap = null;
          applyDungeon(snap, true);
        }
        if (dungeonWriteQueued) persistDungeonSoon();
      }
    }

    async function persistDungeonMap() {
      if (!db) throw new Error('Keine Verbindung zur Cloud.');
      const nextAt = Date.now();
      writingDungeonMap = true;
      try {
        const stored = await storeCloudImage('dungeon-map', dungeon.image || '');
        if (stored) dungeon.image = stored;
        await dungeonMapRef().set({ image: stored, updatedAt: nextAt });
        dungeon.mapUpdatedAt = nextAt;
      } finally {
        writingDungeonMap = false;
      }
    }

    function dungeonPctFromEvent(stage, ev) {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 50, y: 50 };
      return {
        x: Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100))
      };
    }

    function dungeonPointCovered(x, y, minR) {
      const need = (minR != null ? minR : clampDungeonFogRadius(dungeon.fogRadius) * 0.55);
      const drawR = clampDungeonFogRadius(dungeon.fogRadius);
      return (dungeon.fogReveals || []).some(c => {
        const dx = x - c.x;
        const dy = y - c.y;
        const r = Math.max(need, drawR);
        return (dx * dx + dy * dy) <= (r * r);
      });
    }

    function dungeonStampReveal(x, y, force) {
      if (!dungeon.fogOn) return false;
      const r = clampDungeonFogRadius(dungeon.fogRadius);
      if (!force && dungeonPointCovered(x, y, r * 0.5)) return false;
      dungeon.fogReveals.push({
        id: dungeonNewId('fog'),
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        r: r,
        updatedAt: stampNow()
      });
      dungeon.layoutAt = stampNow();
      return true;
    }

    function setDungeonFogRadius(value, persist) {
      dungeon.fogRadius = clampDungeonFogRadius(value);
      const r = dungeon.fogRadius;
      const now = stampNow();
      (dungeon.fogReveals || []).forEach(c => {
        c.r = r;
        c.updatedAt = now;
      });
      dungeon.layoutAt = now;
      syncDungeonFogControls();
      renderDungeonFog();
      if (persist) persistDungeonSoon();
    }

    function canMoveDungeonToken(token) {
      if (!token) return false;
      if (isDM) return true;
      if (!currentPlayerId || !token.playerId) return false;
      return sheetAccountId(token.playerId) === currentPlayerId || token.playerId === currentPlayerId;
    }

    function applyDungeonTokenSize() {
      const size = clampDungeonTokenSize(dungeon.tokenSize);
      dungeon.tokenSize = size;
      const stage = document.getElementById('dungeonStage');
      if (stage) {
        stage.style.setProperty('--battle-token-face', size + 'px');
        stage.style.setProperty('--battle-token-size', (size + 4) + 'px');
      }
      const slider = document.getElementById('dungeonTokenSize');
      if (slider && document.activeElement !== slider) slider.value = String(size);
    }

    function syncDungeonFogControls() {
      const fogBtn = document.getElementById('dungeonFogBtn');
      if (fogBtn) {
        fogBtn.classList.toggle('primary', !!dungeon.fogOn);
        fogBtn.classList.toggle('ghost', !dungeon.fogOn);
      }
      const r = clampDungeonFogRadius(dungeon.fogRadius);
      const radVal = document.getElementById('dungeonFogRadiusVal');
      if (radVal) radVal.textContent = String(r);
      const down = document.getElementById('dungeonFogRadiusDown');
      const up = document.getElementById('dungeonFogRadiusUp');
      if (down) down.disabled = r <= 4;
      if (up) up.disabled = r >= 18;
    }

    function updateDungeonHint() {
      const hint = document.getElementById('dungeonHint');
      if (!hint) return;
      if (!dungeon.image) {
        hint.textContent = isDM ? 'Als DM eine Karte hochladen.' : 'Der DM hat noch keine Dungeon-Karte gelegt.';
        return;
      }
      if (dungeonPlaceMode) {
        hint.textContent = 'Auf die Karte tippen, um das Token zu setzen.';
        return;
      }
      if (dungeon.fogOn) {
        hint.textContent = isDM
          ? 'Nebel aktiv — unerkundetes Gebiet ist abgegraut, Aufgedecktes klar.'
          : 'Nur aufgedeckte Bereiche sind sichtbar. Portraits erhellen ihren Umkreis.';
      } else {
        hint.textContent = 'Nebel aus — ganze Karte sichtbar.';
      }
    }

    function fitDungeonStageToBoard() {
      const board = document.getElementById('dungeonBoard');
      const stage = document.getElementById('dungeonStage');
      const img = document.getElementById('dungeonImg');
      if (!board || !stage || !img || !dungeon.image) return;
      const nw = img.naturalWidth || 0;
      const nh = img.naturalHeight || 0;
      if (!nw || !nh) return;
      const bw = board.clientWidth;
      const bh = board.clientHeight;
      if (!bw || !bh) {
        stage.style.width = nw + 'px';
        return;
      }
      const fit = Math.min(bw / nw, bh / nh);
      const scale = Math.max(1, fit);
      stage.style.width = Math.max(1, Math.floor(nw * scale)) + 'px';
    }

    function clampDungeonPan() {
      const board = document.getElementById('dungeonBoard');
      const stage = document.getElementById('dungeonStage');
      if (!board || !stage) return;
      const ww = board.clientWidth;
      const wh = board.clientHeight;
      const sw = stage.offsetWidth * dungeonScale;
      const sh = stage.offsetHeight * dungeonScale;
      if (sw <= ww) dungeonPanX = (ww - sw) / 2;
      else dungeonPanX = Math.min(0, Math.max(ww - sw, dungeonPanX));
      if (sh <= wh) dungeonPanY = (wh - sh) / 2;
      else dungeonPanY = Math.min(0, Math.max(wh - sh, dungeonPanY));
    }

    function applyDungeonTransform() {
      const board = document.getElementById('dungeonBoard');
      const stage = document.getElementById('dungeonStage');
      if (!board || !stage) return;
      if (dungeonScale <= 1.01) fitDungeonStageToBoard();
      clampDungeonPan();
      stage.style.transform = 'translate(' + dungeonPanX + 'px,' + dungeonPanY + 'px) scale(' + dungeonScale + ')';
      board.classList.toggle('is-zoomed', dungeonScale > 1.01);
      const reset = document.getElementById('dungeonZoomReset');
      if (reset) reset.textContent = Math.round(dungeonScale * 100) + '%';
    }

    function setDungeonZoom(next) {
      dungeonScale = Math.max(1, Math.min(4, Math.round(next * 100) / 100));
      if (dungeonScale <= 1.01) {
        dungeonScale = 1;
        dungeonPanX = 0;
        dungeonPanY = 0;
      }
      applyDungeonTransform();
      renderDungeonFog();
    }

    function zoomDungeonAt(clientX, clientY, nextScale) {
      const board = document.getElementById('dungeonBoard');
      const stage = document.getElementById('dungeonStage');
      if (!board || !stage) return;
      const prev = dungeonScale;
      const next = Math.max(1, Math.min(4, nextScale));
      if (Math.abs(next - prev) < 0.001) return;
      const rect = board.getBoundingClientRect();
      const bx = clientX - rect.left;
      const by = clientY - rect.top;
      const sx = (bx - dungeonPanX) / prev;
      const sy = (by - dungeonPanY) / prev;
      dungeonScale = next;
      dungeonPanX = bx - sx * next;
      dungeonPanY = by - sy * next;
      if (dungeonScale <= 1.01) {
        dungeonScale = 1;
        dungeonPanX = 0;
        dungeonPanY = 0;
      }
      applyDungeonTransform();
      renderDungeonFog();
    }

    function bindDungeonBoardPan() {
      const board = document.getElementById('dungeonBoard');
      if (!board || board.dataset.dungeonPanBound) return;
      board.dataset.dungeonPanBound = '1';
      board.addEventListener('wheel', ev => {
        if (!dungeon.image || currentPage !== 'dungeon') return;
        if (!ev.ctrlKey && !ev.metaKey) return;
        ev.preventDefault();
        const delta = ev.deltaY < 0 ? 0.12 : -0.12;
        zoomDungeonAt(ev.clientX, ev.clientY, dungeonScale + delta);
      }, { passive: false });
      board.addEventListener('pointerdown', ev => {
        if (!dungeon.image || dungeonScale <= 1.01) return;
        if (ev.button != null && ev.button !== 0) return;
        if (ev.target && ev.target.closest && ev.target.closest('.battle-token')) return;
        if (dungeonPlaceMode) return;
        dungeonPan = { pointerId: ev.pointerId, x: ev.clientX, y: ev.clientY, ox: dungeonPanX, oy: dungeonPanY, moved: false };
        try { board.setPointerCapture(ev.pointerId); } catch (err) {}
        board.classList.add('panning');
      });
      board.addEventListener('pointermove', ev => {
        if (!dungeonPan || ev.pointerId !== dungeonPan.pointerId) return;
        const dx = ev.clientX - dungeonPan.x;
        const dy = ev.clientY - dungeonPan.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) dungeonPan.moved = true;
        dungeonPanX = dungeonPan.ox + dx;
        dungeonPanY = dungeonPan.oy + dy;
        applyDungeonTransform();
      });
      const endPan = ev => {
        if (!dungeonPan || (ev && ev.pointerId !== dungeonPan.pointerId)) return;
        const moved = dungeonPan.moved;
        dungeonPan = null;
        board.classList.remove('panning');
        if (moved) board.dataset.dungeonPanned = '1';
      };
      board.addEventListener('pointerup', endPan);
      board.addEventListener('pointercancel', endPan);
    }

    function renderDungeonFog() {
      const canvas = document.getElementById('dungeonFog');
      const stage = document.getElementById('dungeonStage');
      if (!canvas || !stage) return;
      const on = !!dungeon.fogOn && !!dungeon.image;
      canvas.classList.toggle('hidden', !on);
      if (!on) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDM ? 'rgba(8,6,4,0.48)' : 'rgba(6,5,4,0.94)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      const holeR = clampDungeonFogRadius(dungeon.fogRadius);
      (dungeon.fogReveals || []).forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x / 100 * w, c.y / 100 * h, (holeR / 100) * w, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    function startDungeonTokenDrag(ev, token, stage, el) {
      if (!canMoveDungeonToken(token)) return;
      if (ev.button != null && ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      try { el.setPointerCapture(ev.pointerId); } catch (err) {}
      dungeonTokenDragMoved = false;
      const originX = ev.clientX;
      const originY = ev.clientY;
      const tapSlop = ev.pointerType === 'mouse' ? 8 : 16;
      dungeonTokenDrag = { id: token.id, pointerId: ev.pointerId, el: el, stage: stage };
      el.classList.add('is-dragging');
      let lastReveal = { x: token.x, y: token.y };
      dungeonStampReveal(token.x, token.y, false);
      const move = e => {
        if (!dungeonTokenDrag || e.pointerId !== dungeonTokenDrag.pointerId) return;
        if (Math.abs(e.clientX - originX) + Math.abs(e.clientY - originY) > tapSlop) {
          dungeonTokenDragMoved = true;
        }
        const pct = dungeonPctFromEvent(stage, e);
        const t = dungeon.tokens.find(x => x.id === token.id);
        if (!t) return;
        t.x = pct.x;
        t.y = pct.y;
        el.style.left = t.x + '%';
        el.style.top = t.y + '%';
        const dx = pct.x - lastReveal.x;
        const dy = pct.y - lastReveal.y;
        const step = clampDungeonFogRadius(dungeon.fogRadius) * 0.45;
        if ((dx * dx + dy * dy) >= (step * step)) {
          if (dungeonStampReveal(pct.x, pct.y, false)) {
            lastReveal = { x: pct.x, y: pct.y };
            renderDungeonFog();
          }
        }
      };
      const up = e => {
        if (!dungeonTokenDrag || e.pointerId !== dungeonTokenDrag.pointerId) return;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        el.classList.remove('is-dragging');
        dungeonTokenDrag = null;
        const t = dungeon.tokens.find(x => x.id === token.id);
        if (t) {
          t.movedAt = stampNow();
          if (dungeon.removedTokens) delete dungeon.removedTokens[t.id];
          dungeonStampReveal(t.x, t.y, false);
        }
        dungeon.layoutAt = stampNow();
        persistDungeonSoon();
        renderDungeonFog();
        renderDungeonTokenList();
        if (pendingDungeonSnap) {
          const snap = pendingDungeonSnap;
          pendingDungeonSnap = null;
          applyDungeon(snap, true);
        }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }

    function renderDungeonTokens() {
      const box = document.getElementById('dungeonTokens');
      const stage = document.getElementById('dungeonStage');
      if (!box || !stage) return;
      box.innerHTML = '';
      dungeon.tokens.forEach(token => {
        if (!isDM && dungeon.fogOn && !dungeonPointCovered(token.x, token.y, 1)) return;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'battle-token ' + (token.kind === 'player' ? 'is-player' : 'is-enemy');
        if (canMoveDungeonToken(token)) el.classList.add('is-mine');
        el.dataset.id = token.id;
        el.style.left = token.x + '%';
        el.style.top = token.y + '%';
        el.title = token.name;
        const face = document.createElement('div');
        face.className = 'battle-token-face';
        paintPortraitEl(face, token.portraitId, token.name);
        const label = document.createElement('span');
        label.textContent = token.name || '—';
        el.appendChild(face);
        el.appendChild(label);
        if (isDM) {
          const del = document.createElement('span');
          del.className = 'battle-token-del';
          del.textContent = '×';
          del.title = 'Entfernen';
          del.addEventListener('pointerdown', ev => ev.stopPropagation());
          del.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            removeDungeonToken(token.id);
          });
          el.appendChild(del);
        }
        if (canMoveDungeonToken(token)) {
          el.addEventListener('pointerdown', ev => startDungeonTokenDrag(ev, token, stage, el));
        } else {
          el.style.cursor = 'default';
        }
        box.appendChild(el);
      });
    }

    function removeDungeonToken(id) {
      if (!isDM || !id) return;
      if (!dungeon.removedTokens) dungeon.removedTokens = {};
      dungeon.removedTokens[id] = stampNow();
      dungeon.tokens = dungeon.tokens.filter(t => t.id !== id);
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
    }

    function renderDungeonTokenList() {
      const box = document.getElementById('dungeonTokenList');
      if (!box) return;
      box.innerHTML = '';
      if (!dungeon.tokens.length) {
        const empty = document.createElement('p');
        empty.className = 'dungeon-side-note';
        empty.textContent = 'Keine Tokens auf der Karte.';
        box.appendChild(empty);
        return;
      }
      dungeon.tokens.slice().sort((a, b) => a.name.localeCompare(b.name, 'de')).forEach(token => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'ghost';
        row.textContent = token.name + (token.kind === 'player' ? ' · Spieler' : token.kind === 'npc' ? ' · NPC' : '');
        row.onclick = () => {
          if (!confirm(token.name + ' entfernen?')) return;
          removeDungeonToken(token.id);
        };
        box.appendChild(row);
      });
    }

    function renderDungeonPickLists() {
      const playersBox = document.getElementById('dungeonPlayerList');
      const npcsBox = document.getElementById('dungeonNpcList');
      if (playersBox) {
        playersBox.innerHTML = '';
        const owners = typeof combatSheetOwners === 'function' ? combatSheetOwners() : Object.keys(playerAccounts || {});
        owners.forEach(owner => {
          const rec = sheetOwnerRecord(owner);
          if (!rec) return;
          const name = (rec.sheet && rec.sheet.name) || rec.name || owner;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = name;
          btn.onclick = () => beginDungeonPlace({
            name: name,
            kind: 'player',
            playerId: owner,
            portraitId: (rec.sheet && rec.sheet.portraitId) || ''
          });
          playersBox.appendChild(btn);
        });
        if (!owners.length) {
          const empty = document.createElement('p');
          empty.className = 'dungeon-side-note';
          empty.textContent = 'Keine Spieler angelegt.';
          playersBox.appendChild(empty);
        }
      }
      if (npcsBox) {
        npcsBox.innerHTML = '';
        const ids = Object.keys(npcAccounts || {}).sort((a, b) =>
          String((npcAccounts[a] && npcAccounts[a].name) || '').localeCompare(String((npcAccounts[b] && npcAccounts[b].name) || ''), 'de')
        );
        ids.forEach(id => {
          const npc = npcAccounts[id];
          if (!npc) return;
          const name = (npc.sheet && npc.sheet.name) || npc.name || 'NPC';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = name;
          btn.onclick = () => beginDungeonPlace({
            name: name,
            kind: 'npc',
            playerId: typeof NPC_PREFIX === 'string' ? (NPC_PREFIX + id) : ('npc:' + id),
            portraitId: (npc.sheet && npc.sheet.portraitId) || ''
          });
          npcsBox.appendChild(btn);
        });
        if (!ids.length) {
          const empty = document.createElement('p');
          empty.className = 'dungeon-side-note';
          empty.textContent = 'Keine NPCs angelegt.';
          npcsBox.appendChild(empty);
        }
      }
    }

    var dungeonPlaceDraft = null;

    function beginDungeonPlace(draft) {
      if (!isDM) return;
      if (!dungeon.image) return toast('Zuerst eine Karte hochladen.');
      dungeonPlaceDraft = draft;
      dungeonPlaceMode = true;
      const stage = document.getElementById('dungeonStage');
      if (stage) stage.classList.add('is-place');
      updateDungeonHint();
      toast('Auf die Karte tippen, um „' + (draft.name || 'Token') + '“ zu setzen.');
    }

    function cancelDungeonPlace() {
      dungeonPlaceMode = false;
      dungeonPlaceDraft = null;
      const stage = document.getElementById('dungeonStage');
      if (stage) stage.classList.remove('is-place');
      updateDungeonHint();
    }

    function placeDungeonTokenAt(x, y, draft) {
      if (!draft) return;
      const token = normalizeDungeonToken({
        id: dungeonNewId('dt'),
        name: draft.name,
        kind: draft.kind || 'custom',
        playerId: draft.playerId || '',
        portraitId: draft.portraitId || '',
        x: x,
        y: y,
        movedAt: stampNow()
      });
      dungeon.tokens.push(token);
      dungeonStampReveal(x, y, true);
      dungeon.layoutAt = stampNow();
      cancelDungeonPlace();
      persistDungeonSoon();
      renderDungeon();
    }

    function onDungeonStageClick(ev) {
      const stage = document.getElementById('dungeonStage');
      if (!stage || !dungeon.image) return;
      const board = document.getElementById('dungeonBoard');
      if (board && board.dataset.dungeonPanned === '1') {
        board.dataset.dungeonPanned = '';
        return;
      }
      if (ev.target && ev.target.closest && ev.target.closest('.battle-token')) return;
      if (!dungeonPlaceMode || !dungeonPlaceDraft) return;
      const pct = dungeonPctFromEvent(stage, ev);
      placeDungeonTokenAt(pct.x, pct.y, dungeonPlaceDraft);
    }

    async function uploadDungeonMap(file) {
      if (!isDM || !file) return;
      toast('Dungeon-Karte wird hochgeladen…');
      try {
        const image = await fileToMapImage(file);
        dungeon.image = image;
        dungeon.fogOn = true;
        dungeon.layoutAt = stampNow();
        await persistDungeonMap();
        persistDungeonSoon();
        renderDungeon();
        toast('Dungeon-Karte ist für alle sichtbar.');
      } catch (err) {
        toast(err.message || 'Karte konnte nicht hochgeladen werden.');
      }
    }

    async function clearDungeonMap() {
      if (!isDM) return;
      if (!dungeon.image) return;
      if (!confirm('Die Dungeon-Karte entfernen? Tokens und Aufdeckung bleiben.')) return;
      dungeon.image = '';
      try {
        await persistDungeonMap();
        renderDungeon();
        toast('Dungeon-Karte entfernt.');
      } catch (err) {
        toast(err.message || 'Karte konnte nicht entfernt werden.');
      }
      setDungeonZoom(1);
    }

    function toggleDungeonFog() {
      if (!isDM) return;
      dungeon.fogOn = !dungeon.fogOn;
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
    }

    function clearDungeonReveals() {
      if (!isDM) return;
      if (!dungeon.fogReveals.length) return;
      if (!confirm('Gesamte Aufdeckung zurücksetzen? Tokens bleiben.')) return;
      const now = stampNow();
      if (!dungeon.removedFog) dungeon.removedFog = {};
      dungeon.fogReveals.forEach(r => { dungeon.removedFog[r.id] = now; });
      dungeon.fogReveals = [];
      dungeon.tokens.forEach(t => dungeonStampReveal(t.x, t.y, true));
      dungeon.layoutAt = now;
      persistDungeonSoon();
      renderDungeon();
    }

    function renderDungeonBoard() {
      const empty = document.getElementById('dungeonEmpty');
      const stage = document.getElementById('dungeonStage');
      const img = document.getElementById('dungeonImg');
      if (!empty || !stage || !img) return;
      const has = !!dungeon.image;
      empty.classList.toggle('hidden', has);
      stage.classList.toggle('hidden', !has);
      if (has) {
        if (img.getAttribute('src') !== dungeon.image) {
          img.onload = () => {
            fitDungeonStageToBoard();
            applyDungeonTransform();
            renderDungeonFog();
          };
          img.src = dungeon.image;
        } else {
          fitDungeonStageToBoard();
        }
      } else {
        img.removeAttribute('src');
        stage.style.width = '';
      }
      applyDungeonTokenSize();
      applyDungeonTransform();
      renderDungeonTokens();
      renderDungeonFog();
    }

    function renderDungeon() {
      if (els.dungeonView) els.dungeonView.classList.toggle('is-live', !!dungeon.image);
      syncDungeonFogControls();
      updateDungeonHint();
      renderDungeonBoard();
      renderDungeonTokenList();
      if (isDM) renderDungeonPickLists();
    }

    function bindDungeonUi() {
      bindDungeonBoardPan();
      const stage = document.getElementById('dungeonStage');
      if (stage && !stage.dataset.dungeonClickBound) {
        stage.dataset.dungeonClickBound = '1';
        stage.addEventListener('click', onDungeonStageClick);
      }
      onClick('dungeonZoomIn', () => setDungeonZoom(dungeonScale + 0.2));
      onClick('dungeonZoomOut', () => setDungeonZoom(dungeonScale - 0.2));
      onClick('dungeonZoomReset', () => setDungeonZoom(1));
      onClick('dungeonUploadBtn', () => {
        const input = document.getElementById('dungeonMapInput');
        if (input) input.click();
      });
      onClick('dungeonClearBtn', clearDungeonMap);
      onClick('dungeonFogBtn', toggleDungeonFog);
      onClick('dungeonClearRevealsBtn', clearDungeonReveals);
      onClick('dungeonCustomPortraitBtn', () => {
        const input = document.getElementById('dungeonPortraitInput');
        if (input) input.click();
      });
      onClick('dungeonCustomAddBtn', () => {
        if (!isDM) return;
        const nameEl = document.getElementById('dungeonCustomName');
        const name = ((nameEl && nameEl.value) || '').trim();
        if (!name) return toast('Bitte einen Namen eingeben.');
        beginDungeonPlace({
          name: name,
          kind: 'custom',
          playerId: '',
          portraitId: (dungeonPendingPortrait && dungeonPendingPortrait.id) || ''
        });
      });
      const mapInput = document.getElementById('dungeonMapInput');
      if (mapInput && !mapInput.dataset.bound) {
        mapInput.dataset.bound = '1';
        mapInput.addEventListener('change', () => {
          const file = mapInput.files && mapInput.files[0];
          mapInput.value = '';
          if (file) uploadDungeonMap(file);
        });
      }
      const portraitInput = document.getElementById('dungeonPortraitInput');
      if (portraitInput && !portraitInput.dataset.bound) {
        portraitInput.dataset.bound = '1';
        portraitInput.addEventListener('change', async () => {
          const file = portraitInput.files && portraitInput.files[0];
          portraitInput.value = '';
          if (!file || !isDM) return;
          try {
            const data = await fileToPortraitImage(file);
            const id = newImageId();
            await persistEntryImage(id, data);
            dungeonPendingPortrait = { id: id };
            const status = document.getElementById('dungeonCustomPortraitStatus');
            if (status) status.textContent = 'Portrait bereit';
            toast('Portrait übernommen.');
          } catch (err) {
            toast(err.message || 'Portrait fehlgeschlagen.');
          }
        });
      }
      const size = document.getElementById('dungeonTokenSize');
      if (size && !size.dataset.bound) {
        size.dataset.bound = '1';
        size.addEventListener('input', () => {
          dungeon.tokenSize = clampDungeonTokenSize(size.value);
          applyDungeonTokenSize();
        });
        size.addEventListener('change', () => {
          dungeon.tokenSize = clampDungeonTokenSize(size.value);
          dungeon.layoutAt = stampNow();
          persistDungeonSoon();
          renderDungeonTokens();
        });
      }
      const fogDown = document.getElementById('dungeonFogRadiusDown');
      const fogUp = document.getElementById('dungeonFogRadiusUp');
      if (fogDown && !fogDown.dataset.bound) {
        fogDown.dataset.bound = '1';
        fogDown.addEventListener('click', () => {
          setDungeonFogRadius(clampDungeonFogRadius(dungeon.fogRadius) - 1, true);
        });
      }
      if (fogUp && !fogUp.dataset.bound) {
        fogUp.dataset.bound = '1';
        fogUp.addEventListener('click', () => {
          setDungeonFogRadius(clampDungeonFogRadius(dungeon.fogRadius) + 1, true);
        });
      }
      window.addEventListener('resize', () => {
        if (currentPage === 'dungeon') {
          fitDungeonStageToBoard();
          applyDungeonTransform();
          renderDungeonFog();
        }
      });
    }
