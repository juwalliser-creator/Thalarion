/* Thalarion – Dungeon (Karte + BG3-Sicht / FoW) */

    function dungeonNewId(prefix) {
      return (prefix || 'd') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function clampDungeonTokenSize(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return 48;
      return Math.max(24, Math.min(80, Math.round(v)));
    }

    function dungeonVisionFromOwner(playerId) {
      if (!playerId || typeof sheetOwnerRecord !== 'function') {
        return parseDungeonVision('');
      }
      const rec = sheetOwnerRecord(playerId);
      const dnd = rec && rec.sheet && rec.sheet.dnd;
      const senses = dnd ? (dnd.senses || '') : '';
      // Auch Notizen/Features durchsuchen, falls Sinne nur dort stehen
      const blob = [
        senses,
        dnd && dnd.features ? dnd.features.map(f => (f && f.name) + ' ' + (f && f.text)).join(' ') : '',
        dnd && dnd.extras ? dnd.extras : '',
        rec && rec.sheet ? rec.sheet.extra : ''
      ].join('\n');
      return parseDungeonVision(blob || senses);
    }

    function resolveDungeonTokenVision(token) {
      if (!token) return parseDungeonVision('');
      if (token.playerId) {
        const live = dungeonVisionFromOwner(token.playerId);
        if (live.rangeFeet > 0) return live;
      }
      if (token.vision && Number(token.vision.rangeFeet) > 0) {
        return parseDungeonVision('', token.vision);
      }
      return parseDungeonVision('');
    }

    function normalizeDungeonToken(t) {
      const raw = t && typeof t === 'object' ? t : {};
      const kind = raw.kind === 'player' || raw.kind === 'npc' ? raw.kind : 'custom';
      let vision = parseDungeonVision('', raw.vision);
      if (raw.playerId) {
        const live = dungeonVisionFromOwner(raw.playerId);
        if (live.rangeFeet > 0) vision = live;
        else if (!(vision.rangeFeet > 0)) vision = live;
      }
      const light = dungeonTokenLightNorm(raw.lightSource);
      if (raw.lightSource == null) {
        light.enabled = vision.type === 'none';
        light.range = DUNGEON_TORCH_FEET;
      }
      return {
        id: raw.id || dungeonNewId('dt'),
        name: String(raw.name || '').trim() || 'Figur',
        kind: kind,
        playerId: String(raw.playerId || ''),
        portraitId: String(raw.portraitId || ''),
        x: dungeonClampPct(raw.x != null ? raw.x : 50),
        y: dungeonClampPct(raw.y != null ? raw.y : 50),
        facing: Number.isFinite(Number(raw.facing)) ? Number(raw.facing) : -Math.PI / 2,
        vision: vision,
        lightSource: light,
        movedAt: stamp(raw.movedAt)
      };
    }

    function dungeonPayload() {
      return {
        updatedAt: stamp(dungeon.updatedAt),
        layoutAt: stamp(dungeon.layoutAt),
        tokens: (dungeon.tokens || []).map(normalizeDungeonToken),
        walls: (dungeon.walls || []).map(w => dungeonSegNorm(w, 'wall')),
        doors: (dungeon.doors || []).map(dungeonDoorNorm),
        lights: (dungeon.lights || []).map(dungeonLightNorm),
        fogOn: dungeon.fogOn !== false,
        scaleFt: dungeonScaleFt(),
        exploredGen: Math.max(0, Number(dungeon.exploredGen) || 0),
        tokenSize: clampDungeonTokenSize(dungeon.tokenSize),
        removedTokens: Object.assign({}, dungeon.removedTokens || {}),
        removedWalls: Object.assign({}, dungeon.removedWalls || {}),
        removedDoors: Object.assign({}, dungeon.removedDoors || {}),
        removedLights: Object.assign({}, dungeon.removedLights || {})
      };
    }

    function mergeDungeonStates(a, b) {
      a = a || {};
      b = b || {};
      const removedTokens = mergeStampMap(a.removedTokens, b.removedTokens);
      const removedWalls = mergeStampMap(a.removedWalls, b.removedWalls);
      const removedDoors = mergeStampMap(a.removedDoors, b.removedDoors);
      const removedLights = mergeStampMap(a.removedLights, b.removedLights);
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
        walls: mergeByStamp(
          (Array.isArray(a.walls) ? a.walls : []).map(w => dungeonSegNorm(w, 'wall')),
          (Array.isArray(b.walls) ? b.walls : []).map(w => dungeonSegNorm(w, 'wall')),
          'updatedAt',
          removedWalls
        ),
        doors: mergeByStamp(
          (Array.isArray(a.doors) ? a.doors : []).map(dungeonDoorNorm),
          (Array.isArray(b.doors) ? b.doors : []).map(dungeonDoorNorm),
          'updatedAt',
          removedDoors
        ),
        lights: mergeByStamp(
          (Array.isArray(a.lights) ? a.lights : []).map(dungeonLightNorm),
          (Array.isArray(b.lights) ? b.lights : []).map(dungeonLightNorm),
          'updatedAt',
          removedLights
        ),
        fogOn: layoutSrc.fogOn !== false,
        scaleFt: Number(layoutSrc.scaleFt) > 0 ? Number(layoutSrc.scaleFt) : dungeonScaleFt(),
        exploredGen: Math.max(Number(a.exploredGen) || 0, Number(b.exploredGen) || 0),
        tokenSize: clampDungeonTokenSize(
          stamp(b.layoutAt) >= stamp(a.layoutAt)
            ? (b.tokenSize != null ? b.tokenSize : a.tokenSize)
            : (a.tokenSize != null ? a.tokenSize : b.tokenSize)
        ),
        removedTokens: removedTokens,
        removedWalls: removedWalls,
        removedDoors: removedDoors,
        removedLights: removedLights
      };
    }

    function applyDungeonState(next, doRender) {
      dungeon.updatedAt = stamp(next.updatedAt);
      dungeon.layoutAt = stamp(next.layoutAt);
      dungeon.tokens = next.tokens || [];
      dungeon.walls = next.walls || [];
      dungeon.doors = next.doors || [];
      dungeon.lights = next.lights || [];
      dungeon.fogOn = next.fogOn !== false;
      dungeon.scaleFt = Number(next.scaleFt) > 0 ? Number(next.scaleFt) : DUNGEON_DEFAULT_SCALE_FT;
      dungeon.exploredGen = Math.max(0, Number(next.exploredGen) || 0);
      dungeon.tokenSize = clampDungeonTokenSize(next.tokenSize);
      dungeon.removedTokens = next.removedTokens || {};
      dungeon.removedWalls = next.removedWalls || {};
      dungeon.removedDoors = next.removedDoors || {};
      dungeon.removedLights = next.removedLights || {};
      persistDungeonLocal();
      ensureDungeonExploredBuffer(true);
      if (doRender !== false) renderDungeon();
    }

    function applyDungeon(data, doRender) {
      if (!data) return;
      applyDungeonState(mergeDungeonStates({}, data), doRender);
    }

    function persistDungeonLocal() {
      writeLocal(DUNGEON_LOCAL_KEY, JSON.stringify(dungeonPayload()));
    }

    function persistDungeonMapLocal() {
      try {
        writeLocal(DUNGEON_MAP_LOCAL_KEY, JSON.stringify({
          image: dungeon.image || '',
          updatedAt: stamp(dungeon.mapUpdatedAt)
        }));
      } catch (err) {}
    }

    function loadDungeonLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(DUNGEON_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        dungeon.updatedAt = stamp(raw.updatedAt);
        dungeon.layoutAt = stamp(raw.layoutAt);
        dungeon.tokens = (Array.isArray(raw.tokens) ? raw.tokens : []).map(normalizeDungeonToken);
        dungeon.walls = (Array.isArray(raw.walls) ? raw.walls : []).map(w => dungeonSegNorm(w, 'wall'));
        dungeon.doors = (Array.isArray(raw.doors) ? raw.doors : []).map(dungeonDoorNorm);
        dungeon.lights = (Array.isArray(raw.lights) ? raw.lights : []).map(dungeonLightNorm);
        dungeon.fogOn = raw.fogOn !== false;
        dungeon.scaleFt = Number(raw.scaleFt) > 0 ? Number(raw.scaleFt) : DUNGEON_DEFAULT_SCALE_FT;
        dungeon.exploredGen = Math.max(0, Number(raw.exploredGen) || 0);
        dungeon.tokenSize = clampDungeonTokenSize(raw.tokenSize);
        dungeon.removedTokens = Object.assign({}, raw.removedTokens || {});
        dungeon.removedWalls = Object.assign({}, raw.removedWalls || {});
        dungeon.removedDoors = Object.assign({}, raw.removedDoors || {});
        dungeon.removedLights = Object.assign({}, raw.removedLights || {});
      } catch (err) {}
    }

    function loadDungeonMapLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(DUNGEON_MAP_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        const at = stamp(raw.updatedAt);
        if (at && at <= dungeon.mapUpdatedAt && dungeon.image) return;
        if (raw.image) {
          dungeon.image = raw.image;
          dungeon.mapUpdatedAt = at || dungeon.mapUpdatedAt;
        }
      } catch (err) {}
    }

    function applyDungeonMap(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= dungeon.mapUpdatedAt) return;
      dungeon.mapUpdatedAt = at;
      dungeon.image = data.image || '';
      persistDungeonMapLocal();
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
        persistDungeonMapLocal();
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

    function canMoveDungeonToken(token) {
      if (!token) return false;
      if (isDM) return true;
      if (!currentPlayerId || !token.playerId) return false;
      return sheetAccountId(token.playerId) === currentPlayerId || token.playerId === currentPlayerId;
    }

    function dungeonViewerKey() {
      if (isDM) return 'dm';
      return currentPlayerId || 'guest';
    }

    function dungeonExploredStorageKey() {
      return DUNGEON_EXPLORED_LOCAL_KEY + '_' + dungeonViewerKey() + '_g' + (Math.max(0, Number(dungeon.exploredGen) || 0));
    }

    function ensureDungeonExploredBuffer(forceReload) {
      const size = 256;
      const viewer = dungeonViewerKey();
      const gen = Math.max(0, Number(dungeon.exploredGen) || 0);
      if (!dungeonExploredCanvas) {
        dungeonExploredCanvas = document.createElement('canvas');
        dungeonExploredCanvas.width = size;
        dungeonExploredCanvas.height = size;
        dungeonExploredCtx = dungeonExploredCanvas.getContext('2d');
      }
      if (!forceReload && dungeonExploredLoadedGen === gen && dungeonExploredViewer === viewer) return;
      dungeonExploredLoadedGen = gen;
      dungeonExploredViewer = viewer;
      dungeonExploredCtx.setTransform(1, 0, 0, 1, 0, 0);
      dungeonExploredCtx.clearRect(0, 0, size, size);
      try {
        const raw = localStorage.getItem(dungeonExploredStorageKey());
        if (!raw) return;
        const img = new Image();
        img.onload = () => {
          dungeonExploredCtx.clearRect(0, 0, size, size);
          dungeonExploredCtx.drawImage(img, 0, 0, size, size);
          if (currentPage === 'dungeon') renderDungeonFog();
        };
        img.src = raw;
      } catch (err) {}
    }

    function persistDungeonExploredSoon() {
      if (!dungeonExploredCanvas || isDM) return;
      try {
        writeLocal(dungeonExploredStorageKey(), dungeonExploredCanvas.toDataURL('image/png'));
      } catch (err) {}
    }

    function accumulateDungeonExplored(polys, w, h) {
      if (isDM || !dungeonExploredCtx || !polys || !polys.length) return;
      const size = dungeonExploredCanvas.width;
      dungeonExploredCtx.save();
      dungeonExploredCtx.fillStyle = '#fff';
      dungeonExploredCtx.globalCompositeOperation = 'source-over';
      polys.forEach(poly => {
        if (!poly || poly.length < 3) return;
        dungeonExploredCtx.beginPath();
        dungeonExploredCtx.moveTo(poly[0].x / 100 * size, poly[0].y / 100 * size);
        for (let i = 1; i < poly.length; i++) {
          dungeonExploredCtx.lineTo(poly[i].x / 100 * size, poly[i].y / 100 * size);
        }
        dungeonExploredCtx.closePath();
        dungeonExploredCtx.fill();
      });
      dungeonExploredCtx.restore();
      clearTimeout(accumulateDungeonExplored._t);
      accumulateDungeonExplored._t = setTimeout(persistDungeonExploredSoon, 400);
    }

    function collectDungeonVisiblePolys() {
      const obstacles = dungeonObstacleSegments();
      const polys = [];
      (dungeon.lights || []).forEach(L => {
        if (!L || !L.enabled) return;
        const p = dungeonLightPolygon(L.x, L.y, L.range, obstacles);
        if (p.length) polys.push(p);
      });
      (dungeon.tokens || []).forEach(token => {
        if (token.lightSource && token.lightSource.enabled) {
          const p = dungeonLightPolygon(token.x, token.y, token.lightSource.range || DUNGEON_TORCH_FEET, obstacles);
          if (p.length) polys.push(p);
        }
      });
      const visionTokens = (dungeon.tokens || []).filter(t => {
        if (isDM) return false;
        return canMoveDungeonToken(t);
      });
      visionTokens.forEach(token => {
        const v = resolveDungeonTokenVision(token);
        token.vision = v;
        if (!v || v.type === 'none' || !(v.rangeFeet > 0)) return;
        const p = dungeonVisionPolygon(token.x, token.y, token.facing || 0, v.rangeFeet, v.angleDeg, obstacles);
        if (p.length) polys.push(p);
      });
      if (isDM) {
        (dungeon.tokens || []).forEach(token => {
          const v = resolveDungeonTokenVision(token);
          token.vision = v;
          if (v && v.type !== 'none' && v.rangeFeet > 0) {
            const p = dungeonVisionPolygon(token.x, token.y, token.facing || 0, v.rangeFeet, v.angleDeg, obstacles);
            if (p.length) polys.push(p);
          }
        });
      }
      return polys;
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
        fogBtn.classList.toggle('hidden', !isDM || !dungeon.image);
        fogBtn.classList.toggle('is-on', !!dungeon.fogOn);
        fogBtn.setAttribute('aria-pressed', dungeon.fogOn ? 'true' : 'false');
        fogBtn.title = dungeon.fogOn ? 'Nebel aus' : 'Nebel an';
      }
      const drawMenuBtn = document.getElementById('dungeonDrawMenuBtn');
      if (drawMenuBtn) {
        const drawing = !!dungeonDrawMode;
        drawMenuBtn.classList.toggle('primary', drawing);
        drawMenuBtn.classList.toggle('ghost', !drawing);
      }
      [
        ['dungeonWallBtn', 'wall'],
        ['dungeonDoorBtn', 'door'],
        ['dungeonLightBtn', 'light'],
        ['dungeonEraseBtn', 'erase']
      ].forEach(([id, mode]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const on = dungeonDrawMode === mode;
        btn.classList.toggle('primary', on);
        btn.classList.toggle('ghost', !on);
      });
    }

    function closeDungeonMenus(exceptId) {
      [
        ['dungeonFiguresPanel', 'dungeonFiguresMenuBtn'],
        ['dungeonDrawPanel', 'dungeonDrawMenuBtn'],
        ['dungeonGeoPanel', 'dungeonGeoMenuBtn'],
        ['dungeonMapPanel', 'dungeonMapMenuBtn']
      ].forEach(([panelId, btnId]) => {
        if (exceptId && panelId === exceptId) return;
        const panel = document.getElementById(panelId);
        const btn = document.getElementById(btnId);
        if (panel) panel.classList.add('hidden');
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          if (btnId !== 'dungeonDrawMenuBtn' || !dungeonDrawMode) {
            btn.classList.add('ghost');
            btn.classList.remove('primary');
          }
        }
      });
      syncDungeonFogControls();
    }

    function toggleDungeonMenu(panelId, btnId) {
      const panel = document.getElementById(panelId);
      const btn = document.getElementById(btnId);
      if (!panel || !btn) return;
      const open = panel.classList.contains('hidden');
      closeDungeonMenus(open ? panelId : '');
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.classList.toggle('primary', open || (btnId === 'dungeonDrawMenuBtn' && !!dungeonDrawMode));
      btn.classList.toggle('ghost', !(open || (btnId === 'dungeonDrawMenuBtn' && !!dungeonDrawMode)));
      if (open && isDM) {
        renderDungeonPickLists();
        renderDungeonGeoLists();
      }
    }

    function setDungeonFigTab(tab) {
      const tabs = {
        players: ['dungeonFigTabPlayers', 'dungeonFigPanePlayers'],
        npcs: ['dungeonFigTabNpcs', 'dungeonFigPaneNpcs'],
        tokens: ['dungeonFigTabTokens', 'dungeonFigPaneTokens']
      };
      Object.keys(tabs).forEach(key => {
        const [tabId, paneId] = tabs[key];
        const t = document.getElementById(tabId);
        const p = document.getElementById(paneId);
        const on = key === tab;
        if (t) {
          t.classList.toggle('primary', on);
          t.classList.toggle('ghost', !on);
        }
        if (p) p.classList.toggle('hidden', !on);
      });
      if (isDM) renderDungeonPickLists();
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
      const reset = document.getElementById('dungeonZoomReset');
      if (!board || !stage) return;
      if (dungeonScale <= 1.001) {
        dungeonScale = 1;
        dungeonPanX = 0;
        dungeonPanY = 0;
        board.classList.remove('is-zoomed', 'panning');
        stage.style.transform = 'none';
        stage.style.width = '';
      } else {
        board.classList.add('is-zoomed');
        clampDungeonPan();
        stage.style.transform = 'translate(' + dungeonPanX + 'px,' + dungeonPanY + 'px) scale(' + dungeonScale + ')';
      }
      if (reset) reset.textContent = Math.round(dungeonScale * 100) + '%';
    }

    function zoomDungeonAt(clientX, clientY, nextScale) {
      nextScale = Math.max(1, Math.min(4, nextScale));
      const board = document.getElementById('dungeonBoard');
      const stage = document.getElementById('dungeonStage');
      if (!board || !stage || stage.classList.contains('hidden')) return;
      const rect = board.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const x = (mx - dungeonPanX) / dungeonScale;
      const y = (my - dungeonPanY) / dungeonScale;
      dungeonScale = nextScale;
      dungeonPanX = mx - x * dungeonScale;
      dungeonPanY = my - y * dungeonScale;
      applyDungeonTransform();
      renderDungeonFog();
    }

    function zoomDungeonBy(delta) {
      const board = document.getElementById('dungeonBoard');
      if (!board) return;
      const rect = board.getBoundingClientRect();
      zoomDungeonAt(rect.left + rect.width / 2, rect.top + rect.height / 2, dungeonScale + delta);
    }

    function setDungeonZoom(next) {
      const board = document.getElementById('dungeonBoard');
      if (!board) {
        dungeonScale = Math.max(1, Math.min(4, next));
        applyDungeonTransform();
        renderDungeonFog();
        return;
      }
      const rect = board.getBoundingClientRect();
      zoomDungeonAt(rect.left + rect.width / 2, rect.top + rect.height / 2, next);
    }

    function bindDungeonBoardPan() {
      const board = document.getElementById('dungeonBoard');
      const stage = document.getElementById('dungeonStage');
      if (!board || !stage || board.dataset.dungeonPanBound) return;
      board.dataset.dungeonPanBound = '1';
      board.addEventListener('wheel', ev => {
        if (stage.classList.contains('hidden')) return;
        ev.preventDefault();
        const step = ev.deltaY > 0 ? -0.18 : 0.18;
        zoomDungeonAt(ev.clientX, ev.clientY, dungeonScale + step);
      }, { passive: false });
      board.addEventListener('pointerdown', ev => {
        if (ev.button && ev.button !== 0) return;
        if (dungeonTokenDrag || dungeonPlaceMode || dungeonDrawMode) return;
        if (ev.target.closest && ev.target.closest('.battle-token')) return;
        if (dungeonScale <= 1) return;
        ev.preventDefault();
        dungeonPan = {
          pointerId: ev.pointerId,
          x: ev.clientX,
          y: ev.clientY,
          ox: dungeonPanX,
          oy: dungeonPanY,
          moved: false
        };
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
      if (!on) {
        dungeonVisiblePolys = [];
        return;
      }
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      ensureDungeonExploredBuffer(false);
      const polys = collectDungeonVisiblePolys();
      dungeonVisiblePolys = polys;
      if (!isDM) accumulateDungeonExplored(polys, w, h);

      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDM ? 'rgba(8,6,4,0.42)' : '#000';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'destination-out';
      if (!isDM && dungeonExploredCanvas) {
        ctx.globalAlpha = 0.55;
        ctx.drawImage(dungeonExploredCanvas, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#fff';
      polys.forEach(poly => dungeonFillPolyPct(ctx, poly, w, h));
      ctx.globalCompositeOperation = 'source-over';
      renderDungeonGeometryOverlay();
    }

    function renderDungeonGeometryOverlay() {
      let svg = document.getElementById('dungeonGeo');
      const stage = document.getElementById('dungeonStage');
      if (!stage) return;
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'dungeonGeo');
        svg.setAttribute('class', 'dungeon-geo');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        stage.appendChild(svg);
      }
      const hasDoors = (dungeon.doors || []).length > 0;
      const show = isDM || dungeonDrawMode || hasDoors;
      svg.classList.toggle('hidden', !show);
      if (!show) {
        svg.innerHTML = '';
        return;
      }
      let html = '';
      if (isDM || dungeonDrawMode) {
        (dungeon.walls || []).forEach(w => {
          html += '<line class="dungeon-wall" data-id="' + w.id + '" x1="' + w.x1 + '" y1="' + w.y1 +
            '" x2="' + w.x2 + '" y2="' + w.y2 + '" />';
        });
        (dungeon.lights || []).forEach(L => {
          if (!L.enabled) return;
          html += '<circle class="dungeon-light-dot" data-id="' + L.id + '" cx="' + L.x + '" cy="' + L.y + '" r="1.2" />';
        });
        dungeonDrawPoints.forEach((p, i) => {
          html += '<circle class="dungeon-draw-pt" cx="' + p.x + '" cy="' + p.y + '" r="0.8" />';
          if (i > 0) {
            const prev = dungeonDrawPoints[i - 1];
            html += '<line class="dungeon-draw-line" x1="' + prev.x + '" y1="' + prev.y +
              '" x2="' + p.x + '" y2="' + p.y + '" />';
          }
        });
      }
      (dungeon.doors || []).forEach(d => {
        if (!isDM && dungeon.fogOn) {
          const mx = (d.x1 + d.x2) / 2;
          const my = (d.y1 + d.y2) / 2;
          if (!dungeonPointVisibleNow(mx, my) && !dungeonPointVisibleNow(d.x1, d.y1) && !dungeonPointVisibleNow(d.x2, d.y2)) {
            return;
          }
        }
        html += '<line class="dungeon-door' + (d.open ? ' is-open' : '') + '" data-id="' + d.id +
          '" x1="' + d.x1 + '" y1="' + d.y1 + '" x2="' + d.x2 + '" y2="' + d.y2 + '" />';
      });
      svg.innerHTML = html;
      svg.querySelectorAll('.dungeon-door').forEach(el => {
        el.style.pointerEvents = 'stroke';
        el.addEventListener('click', ev => {
          ev.stopPropagation();
          const id = el.getAttribute('data-id');
          if (isDM && dungeonDrawMode === 'erase') {
            removeDungeonDoor(id);
            return;
          }
          toggleDungeonDoor(id);
        });
      });
      if (isDM) {
        svg.querySelectorAll('.dungeon-wall').forEach(el => {
          el.style.pointerEvents = 'stroke';
          el.classList.toggle('is-erasable', dungeonDrawMode === 'erase');
          el.addEventListener('click', ev => {
            ev.stopPropagation();
            if (dungeonDrawMode === 'erase') {
              removeDungeonWall(el.getAttribute('data-id'));
              return;
            }
          });
          el.addEventListener('dblclick', ev => {
            ev.stopPropagation();
            removeDungeonWall(el.getAttribute('data-id'));
          });
        });
        svg.querySelectorAll('.dungeon-light-dot').forEach(el => {
          el.style.pointerEvents = 'all';
          el.addEventListener('click', ev => {
            ev.stopPropagation();
            if (dungeonDrawMode === 'erase') {
              removeDungeonLight(el.getAttribute('data-id'));
            }
          });
          el.addEventListener('dblclick', ev => {
            ev.stopPropagation();
            removeDungeonLight(el.getAttribute('data-id'));
          });
        });
      }
    }

    function scheduleDungeonVision() {
      if (dungeonVisionRaf) return;
      dungeonVisionRaf = requestAnimationFrame(() => {
        dungeonVisionRaf = 0;
        renderDungeonFog();
        if (dungeonFacingDirty) {
          dungeonFacingDirty = false;
          persistDungeonSoon();
        }
      });
    }

    function updateDungeonFacingFromEvent(ev) {
      const stage = document.getElementById('dungeonStage');
      if (!stage || !dungeon.image || dungeonDrawMode || dungeonPlaceMode) return;
      const pct = dungeonPctFromEvent(stage, ev);
      const focus = (dungeon.tokens || []).find(t => t.id === dungeonFocusTokenId);
      const movers = (dungeon.tokens || []).filter(t => canMoveDungeonToken(t));
      if (!movers.length) return;
      // Fokus-Token folgt der Maus; andere eigene Tokens mit Dunkelsicht ebenfalls
      let changed = false;
      movers.forEach(token => {
        const v = resolveDungeonTokenVision(token);
        const isFocus = focus ? token.id === focus.id : token.id === movers[0].id;
        if (!isFocus && !(v.rangeFeet > 0)) return;
        const dx = pct.x - token.x;
        const dy = pct.y - token.y;
        if (Math.abs(dx) + Math.abs(dy) < 0.15) return;
        const next = Math.atan2(dy, dx);
        if (Math.abs(next - (token.facing || 0)) < 0.02) return;
        token.facing = next;
        token.movedAt = stampNow();
        changed = true;
      });
      if (!changed) return;
      dungeonFacingDirty = true;
      scheduleDungeonVision();
    }

    function startDungeonTokenDrag(ev, token, stage, el) {
      if (!canMoveDungeonToken(token)) return;
      if (ev.button != null && ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      try { el.setPointerCapture(ev.pointerId); } catch (err) {}
      dungeonTokenDragMoved = false;
      dungeonFocusTokenId = token.id;
      const originX = ev.clientX;
      const originY = ev.clientY;
      const tapSlop = ev.pointerType === 'mouse' ? 8 : 16;
      dungeonTokenDrag = { id: token.id, pointerId: ev.pointerId, el: el, stage: stage };
      el.classList.add('is-dragging');
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
        renderDungeonFog();
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
        const mine = canMoveDungeonToken(token);
        if (!isDM && dungeon.fogOn && !mine && !dungeonPointVisibleNow(token.x, token.y)) return;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'battle-token ' + (token.kind === 'player' ? 'is-player' : 'is-enemy');
        if (mine) el.classList.add('is-mine');
        if (token.id === dungeonFocusTokenId) el.classList.add('is-focus');
        el.dataset.id = token.id;
        el.style.left = token.x + '%';
        el.style.top = token.y + '%';
        el.style.setProperty('--dungeon-facing', (token.facing || 0) + 'rad');
        el.title = token.name;
        const face = document.createElement('div');
        face.className = 'battle-token-face';
        paintPortraitEl(face, token.portraitId, token.name);
        const label = document.createElement('span');
        label.textContent = token.name || '—';
        el.appendChild(face);
        el.appendChild(label);
        if (mine || isDM) {
          const torch = document.createElement('span');
          torch.className = 'dungeon-token-torch' + (token.lightSource && token.lightSource.enabled ? ' is-on' : '');
          torch.textContent = 'L';
          torch.title = token.lightSource && token.lightSource.enabled ? 'Fackel aus' : 'Fackel an';
          torch.addEventListener('pointerdown', ev => ev.stopPropagation());
          torch.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            toggleDungeonTokenLight(token.id);
          });
          el.appendChild(torch);
        }
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
        if (mine) {
          el.addEventListener('pointerdown', ev => startDungeonTokenDrag(ev, token, stage, el));
          el.addEventListener('click', () => { dungeonFocusTokenId = token.id; });
        } else {
          el.style.cursor = 'default';
        }
        box.appendChild(el);
      });
    }

    function toggleDungeonTokenLight(id) {
      const t = (dungeon.tokens || []).find(x => x.id === id);
      if (!t) return;
      if (!isDM && !canMoveDungeonToken(t)) return;
      if (!t.lightSource) t.lightSource = dungeonTokenLightNorm({ enabled: false });
      t.lightSource.enabled = !t.lightSource.enabled;
      t.movedAt = stampNow();
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
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

    function removeDungeonWall(id) {
      if (!isDM || !id) return;
      if (!dungeon.removedWalls) dungeon.removedWalls = {};
      dungeon.removedWalls[id] = stampNow();
      dungeon.walls = (dungeon.walls || []).filter(w => w.id !== id);
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
    }

    function removeDungeonDoor(id) {
      if (!isDM || !id) return;
      if (!dungeon.removedDoors) dungeon.removedDoors = {};
      dungeon.removedDoors[id] = stampNow();
      dungeon.doors = (dungeon.doors || []).filter(d => d.id !== id);
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
    }

    function removeDungeonLight(id) {
      if (!isDM || !id) return;
      if (!dungeon.removedLights) dungeon.removedLights = {};
      dungeon.removedLights[id] = stampNow();
      dungeon.lights = (dungeon.lights || []).filter(L => L.id !== id);
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
    }

    function toggleDungeonDoor(id) {
      const door = (dungeon.doors || []).find(d => d.id === id);
      if (!door) return;
      if (!isDM) {
        if (!dungeonPointVisibleNow((door.x1 + door.x2) / 2, (door.y1 + door.y2) / 2) &&
            !dungeonPointVisibleNow(door.x1, door.y1) &&
            !dungeonPointVisibleNow(door.x2, door.y2)) {
          return toast('Tür nicht in Sicht.');
        }
      }
      door.open = !door.open;
      door.updatedAt = stampNow();
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
      toast(door.open ? 'Tür geöffnet.' : 'Tür geschlossen.');
    }

    function setDungeonDrawMode(mode) {
      if (!isDM) return;
      const stage = document.getElementById('dungeonStage');
      if (dungeonDrawMode === mode) {
        dungeonDrawMode = null;
        dungeonDrawPoints = [];
      } else {
        cancelDungeonPlace();
        dungeonDrawMode = mode;
        dungeonDrawPoints = [];
        toast(mode === 'wall'
          ? 'Wand: Punkte tippen (fast waagerecht/senkrecht wird begradigt). Doppelklick/Enter fertig.'
          : mode === 'door'
            ? 'Tür: zwei Punkte tippen (wird ggf. begradigt).'
            : mode === 'erase'
              ? 'Löschen: Wand, Tür oder Licht antippen.'
              : 'Licht: auf die Karte tippen.');
      }
      if (stage) {
        stage.classList.toggle('is-draw', !!dungeonDrawMode);
        stage.classList.toggle('is-erase', dungeonDrawMode === 'erase');
      }
      syncDungeonFogControls();
      renderDungeonGeometryOverlay();
    }

    function clearAllDungeonWalls() {
      if (!isDM) return;
      if (!(dungeon.walls || []).length) return toast('Keine Wände.');
      if (!confirm('Alle Wände entfernen?')) return;
      const now = stampNow();
      if (!dungeon.removedWalls) dungeon.removedWalls = {};
      (dungeon.walls || []).forEach(w => { dungeon.removedWalls[w.id] = now; });
      dungeon.walls = [];
      dungeon.layoutAt = now;
      persistDungeonSoon();
      renderDungeon();
      toast('Alle Wände entfernt.');
    }

    function beautifyExistingDungeonWalls() {
      if (!isDM) return;
      const walls = dungeon.walls || [];
      if (!walls.length) return toast('Keine Wände.');
      let n = 0;
      walls.forEach(w => {
        const prev = { x: w.x1, y: w.y1 };
        const snapped = dungeonSnapOrthoToPrev(prev, { x: w.x2, y: w.y2 });
        if (Math.abs(snapped.x - w.x2) > 0.01 || Math.abs(snapped.y - w.y2) > 0.01) {
          w.x2 = snapped.x;
          w.y2 = snapped.y;
          w.updatedAt = stampNow();
          n++;
        }
      });
      if (!n) return toast('Nichts zu begradigen.');
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
      toast(n + ' Wandsegment(e) begradigt.');
    }

    // Winkel-Toleranz für Auto-Gerade (≈12°); Endpunkt-Snap in % der Karte
    var DUNGEON_ORTHO_TOL_DEG = 12;
    var DUNGEON_ENDPOINT_SNAP_PCT = 1.4;

    function dungeonSnapToNearbyEndpoint(pt) {
      if (!pt) return pt;
      let best = null;
      let bestD = DUNGEON_ENDPOINT_SNAP_PCT * DUNGEON_ENDPOINT_SNAP_PCT;
      const consider = (x, y) => {
        const dx = pt.x - x;
        const dy = pt.y - y;
        const d = dx * dx + dy * dy;
        if (d <= bestD) {
          bestD = d;
          best = { x: x, y: y };
        }
      };
      (dungeon.walls || []).forEach(w => {
        consider(w.x1, w.y1);
        consider(w.x2, w.y2);
      });
      (dungeon.doors || []).forEach(d => {
        consider(d.x1, d.y1);
        consider(d.x2, d.y2);
      });
      dungeonDrawPoints.forEach(p => consider(p.x, p.y));
      return best || pt;
    }

    function dungeonSnapOrthoToPrev(prev, pt) {
      if (!prev || !pt) return pt;
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.05) return { x: prev.x, y: prev.y };
      const ang = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
      // nahe waagerecht → gleiche Y; nahe senkrecht → gleiche X
      if (ang <= DUNGEON_ORTHO_TOL_DEG) {
        return { x: pt.x, y: prev.y };
      }
      if (ang >= 90 - DUNGEON_ORTHO_TOL_DEG) {
        return { x: prev.x, y: pt.y };
      }
      return { x: pt.x, y: pt.y };
    }

    function dungeonBeautifyDrawPoint(raw) {
      let pt = { x: dungeonClampPct(raw.x), y: dungeonClampPct(raw.y) };
      pt = dungeonSnapToNearbyEndpoint(pt);
      const prev = dungeonDrawPoints.length
        ? dungeonDrawPoints[dungeonDrawPoints.length - 1]
        : null;
      if (prev) pt = dungeonSnapOrthoToPrev(prev, pt);
      // Nach Ortho nochmal Endpunkt-Snap (saubere Ecken an bestehenden Wänden)
      pt = dungeonSnapToNearbyEndpoint(pt);
      if (prev) pt = dungeonSnapOrthoToPrev(prev, pt);
      return { x: dungeonClampPct(pt.x), y: dungeonClampPct(pt.y) };
    }

    function dungeonBeautifyPolyline(points) {
      if (!points || points.length < 2) return points || [];
      const out = [{ x: points[0].x, y: points[0].y }];
      out[0] = dungeonSnapToNearbyEndpoint(out[0]);
      for (let i = 1; i < points.length; i++) {
        let pt = { x: points[i].x, y: points[i].y };
        pt = dungeonSnapOrthoToPrev(out[i - 1], pt);
        pt = dungeonSnapToNearbyEndpoint(pt);
        pt = dungeonSnapOrthoToPrev(out[i - 1], pt);
        out.push({ x: dungeonClampPct(pt.x), y: dungeonClampPct(pt.y) });
      }
      return out;
    }

    function finishDungeonWall() {
      if (dungeonDrawPoints.length < 2) {
        dungeonDrawPoints = [];
        return;
      }
      const pts = dungeonBeautifyPolyline(dungeonDrawPoints);
      const now = stampNow();
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 0.08) continue;
        dungeon.walls.push(dungeonSegNorm({
          id: dungeonNewId('wall'),
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          updatedAt: now
        }, 'wall'));
      }
      dungeonDrawPoints = [];
      dungeon.layoutAt = now;
      persistDungeonSoon();
      renderDungeon();
      toast('Wand gespeichert.');
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
        const v = token.vision || {};
        const bits = [token.name];
        if (token.kind === 'player') bits.push('Spieler');
        else if (token.kind === 'npc') bits.push('NPC');
        if (v.type && v.type !== 'none') bits.push('DV ' + v.rangeFeet + 'ft');
        if (token.lightSource && token.lightSource.enabled) bits.push('Fackel');
        row.textContent = bits.join(' · ');
        row.onclick = () => {
          if (!confirm(token.name + ' entfernen?')) return;
          removeDungeonToken(token.id);
        };
        box.appendChild(row);
      });
    }

    function renderDungeonGeoLists() {
      const wallsBox = document.getElementById('dungeonWallList');
      const doorsBox = document.getElementById('dungeonDoorList');
      const lightsBox = document.getElementById('dungeonLightList');
      if (wallsBox) {
        wallsBox.innerHTML = '';
        (dungeon.walls || []).forEach((w, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = 'Wand ' + (i + 1);
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'danger';
          del.textContent = '×';
          del.title = 'Wand entfernen';
          del.onclick = () => removeDungeonWall(w.id);
          const row = document.createElement('div');
          row.className = 'dungeon-geo-row';
          row.appendChild(btn);
          row.appendChild(del);
          wallsBox.appendChild(row);
        });
      }
      if (doorsBox) {
        doorsBox.innerHTML = '';
        (dungeon.doors || []).forEach((d, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = 'Tür ' + (i + 1) + (d.open ? ' (offen)' : ' (zu)');
          btn.onclick = () => toggleDungeonDoor(d.id);
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'danger';
          del.textContent = '×';
          del.onclick = () => {
            if (!confirm('Tür entfernen?')) return;
            removeDungeonDoor(d.id);
          };
          const row = document.createElement('div');
          row.className = 'dungeon-geo-row';
          row.appendChild(btn);
          row.appendChild(del);
          doorsBox.appendChild(row);
        });
      }
      if (lightsBox) {
        lightsBox.innerHTML = '';
        (dungeon.lights || []).forEach((L, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost';
          btn.textContent = (L.kind || 'Licht') + ' ' + (i + 1) + (L.enabled ? '' : ' (aus)');
          btn.onclick = () => {
            L.enabled = !L.enabled;
            L.updatedAt = stampNow();
            dungeon.layoutAt = stampNow();
            persistDungeonSoon();
            renderDungeon();
          };
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'danger';
          del.textContent = '×';
          del.onclick = () => {
            if (!confirm('Licht entfernen?')) return;
            removeDungeonLight(L.id);
          };
          const row = document.createElement('div');
          row.className = 'dungeon-geo-row';
          row.appendChild(btn);
          row.appendChild(del);
          lightsBox.appendChild(row);
        });
      }
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
      dungeonDrawMode = null;
      dungeonDrawPoints = [];
      dungeonPlaceDraft = draft;
      dungeonPlaceMode = true;
      const stage = document.getElementById('dungeonStage');
      if (stage) stage.classList.add('is-place');
      closeDungeonMenus();
      syncDungeonFogControls();
      toast('Auf die Karte tippen, um „' + (draft.name || 'Token') + '“ zu setzen.');
    }

    function cancelDungeonPlace() {
      dungeonPlaceMode = false;
      dungeonPlaceDraft = null;
      const stage = document.getElementById('dungeonStage');
      if (stage) stage.classList.remove('is-place');
    }

    function placeDungeonTokenAt(x, y, draft) {
      if (!draft) return;
      const vision = dungeonVisionFromOwner(draft.playerId || '');
      const token = normalizeDungeonToken({
        id: dungeonNewId('dt'),
        name: draft.name,
        kind: draft.kind || 'custom',
        playerId: draft.playerId || '',
        portraitId: draft.portraitId || '',
        x: x,
        y: y,
        facing: -Math.PI / 2,
        vision: vision,
        lightSource: {
          enabled: vision.type === 'none',
          range: DUNGEON_TORCH_FEET,
          kind: 'torch'
        },
        movedAt: stampNow()
      });
      dungeon.tokens.push(token);
      dungeonFocusTokenId = token.id;
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
      const pct = dungeonPctFromEvent(stage, ev);

      if (dungeonDrawMode === 'light' && isDM) {
        dungeon.lights.push(dungeonLightNorm({
          id: dungeonNewId('light'),
          x: pct.x,
          y: pct.y,
          range: DUNGEON_TORCH_FEET,
          kind: 'torch',
          enabled: true,
          updatedAt: stampNow()
        }));
        dungeon.layoutAt = stampNow();
        persistDungeonSoon();
        renderDungeon();
        toast('Lichtquelle gesetzt.');
        return;
      }

      if (dungeonDrawMode === 'door' && isDM) {
        const snapped = dungeonBeautifyDrawPoint(pct);
        dungeonDrawPoints.push(snapped);
        if (dungeonDrawPoints.length >= 2) {
          const pts = dungeonBeautifyPolyline(dungeonDrawPoints);
          const a = pts[0];
          const b = pts[1];
          dungeon.doors.push(dungeonDoorNorm({
            id: dungeonNewId('door'),
            x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            open: false,
            updatedAt: stampNow()
          }));
          dungeonDrawPoints = [];
          dungeon.layoutAt = stampNow();
          persistDungeonSoon();
          renderDungeon();
          toast('Tür gesetzt (geschlossen).');
        } else {
          renderDungeonGeometryOverlay();
        }
        return;
      }

      if (dungeonDrawMode === 'wall' && isDM) {
        dungeonDrawPoints.push(dungeonBeautifyDrawPoint(pct));
        renderDungeonGeometryOverlay();
        return;
      }

      if (!dungeonPlaceMode || !dungeonPlaceDraft) return;
      placeDungeonTokenAt(pct.x, pct.y, dungeonPlaceDraft);
    }

    function onDungeonStageDblClick(ev) {
      if (dungeonDrawMode === 'wall' && isDM) {
        ev.preventDefault();
        finishDungeonWall();
      }
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
      if (!confirm('Die Dungeon-Karte entfernen? Tokens und Geometrie bleiben.')) return;
      dungeon.image = '';
      try {
        await persistDungeonMap();
        renderDungeon();
        toast('Dungeon-Karte entfernt.');
      } catch (err) {
        toast(err.message || 'Karte konnte nicht entfernt werden.');
      }
      dungeonScale = 1;
      dungeonPanX = 0;
      dungeonPanY = 0;
      applyDungeonTransform();
    }

    function toggleDungeonFog() {
      if (!isDM) return;
      dungeon.fogOn = !dungeon.fogOn;
      dungeon.layoutAt = stampNow();
      persistDungeonSoon();
      renderDungeon();
    }

    function clearDungeonExplored() {
      if (!isDM) return;
      if (!confirm('Erkundung für alle zurücksetzen? Die Karte wird wieder unbekannt (außer aktueller Sicht).')) return;
      dungeon.exploredGen = Math.max(0, Number(dungeon.exploredGen) || 0) + 1;
      dungeon.layoutAt = stampNow();
      ensureDungeonExploredBuffer(true);
      persistDungeonSoon();
      renderDungeon();
      toast('Erkundung zurückgesetzt.');
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
        if (img.getAttribute('data-src') !== dungeon.image) {
          img.onload = () => {
            applyDungeonTransform();
            renderDungeonFog();
          };
          img.src = dungeon.image;
          img.setAttribute('data-src', dungeon.image);
        }
      } else {
        img.removeAttribute('src');
        img.removeAttribute('data-src');
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
      renderDungeonBoard();
      renderDungeonTokenList();
      if (isDM) {
        renderDungeonPickLists();
        renderDungeonGeoLists();
      }
    }

    function bindDungeonUi() {
      bindDungeonBoardPan();
      const stage = document.getElementById('dungeonStage');
      if (stage && !stage.dataset.dungeonClickBound) {
        stage.dataset.dungeonClickBound = '1';
        stage.addEventListener('click', onDungeonStageClick);
        stage.addEventListener('dblclick', onDungeonStageDblClick);
        stage.addEventListener('pointermove', updateDungeonFacingFromEvent);
      }
      onClick('dungeonZoomIn', () => zoomDungeonBy(0.2));
      onClick('dungeonZoomOut', () => zoomDungeonBy(-0.2));
      onClick('dungeonZoomReset', () => {
        dungeonScale = 1;
        dungeonPanX = 0;
        dungeonPanY = 0;
        applyDungeonTransform();
        renderDungeonFog();
      });
      onClick('dungeonUploadBtn', () => {
        const input = document.getElementById('dungeonMapInput');
        if (input) input.click();
      });
      onClick('dungeonClearBtn', clearDungeonMap);
      onClick('dungeonFogBtn', toggleDungeonFog);
      onClick('dungeonFiguresMenuBtn', () => toggleDungeonMenu('dungeonFiguresPanel', 'dungeonFiguresMenuBtn'));
      onClick('dungeonDrawMenuBtn', () => toggleDungeonMenu('dungeonDrawPanel', 'dungeonDrawMenuBtn'));
      onClick('dungeonGeoMenuBtn', () => toggleDungeonMenu('dungeonGeoPanel', 'dungeonGeoMenuBtn'));
      onClick('dungeonMapMenuBtn', () => toggleDungeonMenu('dungeonMapPanel', 'dungeonMapMenuBtn'));
      onClick('dungeonFigTabPlayers', () => setDungeonFigTab('players'));
      onClick('dungeonFigTabNpcs', () => setDungeonFigTab('npcs'));
      onClick('dungeonFigTabTokens', () => setDungeonFigTab('tokens'));
      onClick('dungeonWallBtn', () => {
        setDungeonDrawMode('wall');
        closeDungeonMenus();
      });
      onClick('dungeonDoorBtn', () => {
        setDungeonDrawMode('door');
        closeDungeonMenus();
      });
      onClick('dungeonLightBtn', () => {
        setDungeonDrawMode('light');
        closeDungeonMenus();
      });
      onClick('dungeonEraseBtn', () => {
        setDungeonDrawMode('erase');
        closeDungeonMenus();
      });
      onClick('dungeonBeautifyWallsBtn', () => {
        beautifyExistingDungeonWalls();
        closeDungeonMenus();
      });
      onClick('dungeonClearWallsBtn', () => {
        clearAllDungeonWalls();
        closeDungeonMenus();
      });
      onClick('dungeonClearRevealsBtn', () => {
        clearDungeonExplored();
        closeDungeonMenus();
      });
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
      if (!document.body.dataset.dungeonMenuOutside) {
        document.body.dataset.dungeonMenuOutside = '1';
        document.addEventListener('click', ev => {
          const tools = document.querySelector('.dungeon-add-tools');
          if (!tools || tools.contains(ev.target)) return;
          closeDungeonMenus();
        });
        document.addEventListener('keydown', ev => {
          if (ev.key === 'Escape') {
            if (dungeonDrawMode) {
              dungeonDrawMode = null;
              dungeonDrawPoints = [];
              const st = document.getElementById('dungeonStage');
              if (st) {
                st.classList.remove('is-draw');
                st.classList.remove('is-erase');
              }
              syncDungeonFogControls();
              renderDungeonGeometryOverlay();
            }
            cancelDungeonPlace();
          }
          if (ev.key === 'Enter' && dungeonDrawMode === 'wall') finishDungeonWall();
        });
      }
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
      const scaleEl = document.getElementById('dungeonScaleFt');
      if (scaleEl && !scaleEl.dataset.bound) {
        scaleEl.dataset.bound = '1';
        scaleEl.value = String(dungeonScaleFt());
        scaleEl.addEventListener('change', () => {
          const v = Number(scaleEl.value);
          if (!(v > 0)) return;
          dungeon.scaleFt = v;
          dungeon.layoutAt = stampNow();
          persistDungeonSoon();
          renderDungeonFog();
        });
      }
      window.addEventListener('resize', () => {
        if (currentPage === 'dungeon') {
          applyDungeonTransform();
          renderDungeonFog();
        }
      });
    }
