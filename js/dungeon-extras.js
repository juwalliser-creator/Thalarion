/* Thalarion – Dungeon Extras (Galerie, Vorschau, Kalibrierung, Kampf, Ambient, Erkundung-Cloud) */

    function dungeonFogAsPlayer() {
      return !isDM || !!dungeonViewAsId;
    }

    function dungeonEffectiveViewerId() {
      if (isDM && dungeonViewAsId) return dungeonViewAsId;
      return currentPlayerId || '';
    }

    function dungeonCanControlToken(token) {
      if (!token) return false;
      if (isDM && !dungeonViewAsId) return true;
      const vid = dungeonEffectiveViewerId();
      if (!vid) return false;
      if (token.playerId) {
        if (sheetAccountId(token.playerId) === vid || token.playerId === vid) return true;
      }
      // Fallback: Spieler-Token ohne/mit abweichender playerId am eigenen Sheet erkennen
      if (token.kind === 'player' && typeof sheetOwnerRecord === 'function') {
        const rec = sheetOwnerRecord(vid);
        if (rec && rec.sheet) {
          if (token.portraitId && rec.sheet.portraitId && token.portraitId === rec.sheet.portraitId) return true;
          if (token.name && rec.sheet.name && String(token.name).trim() === String(rec.sheet.name).trim()) return true;
        }
      }
      return false;
    }

    function dungeonPushUndo() {
      try {
        dungeonUndoStack.push(JSON.stringify({
          walls: dungeon.walls,
          doors: dungeon.doors,
          lights: dungeon.lights,
          notes: dungeon.notes,
          zones: dungeon.zones
        }));
        if (dungeonUndoStack.length > 40) dungeonUndoStack.shift();
      } catch (err) {}
    }

    function dungeonUndo() {
      if (!isDM || !dungeonUndoStack.length) return toast('Nichts rückgängig.');
      try {
        const snap = JSON.parse(dungeonUndoStack.pop());
        dungeon.walls = (snap.walls || []).map(w => dungeonSegNorm(w, 'wall'));
        dungeon.doors = (snap.doors || []).map(dungeonDoorNorm);
        dungeon.lights = (snap.lights || []).map(dungeonLightNorm);
        dungeon.notes = (snap.notes || []).map(dungeonNoteNorm);
        dungeon.zones = (snap.zones || []).map(dungeonZoneNorm);
        dungeon.layoutAt = stampNow();
        persistDungeonSoon();
        renderDungeon();
        toast('Rückgängig.');
      } catch (err) {
        toast('Rückgängig fehlgeschlagen.');
      }
    }

    function setDungeonViewAs(playerId) {
      if (!isDM) return;
      dungeonViewAsId = playerId || '';
      const sel = document.getElementById('dungeonViewAsSelect');
      if (sel && sel.value !== dungeonViewAsId) sel.value = dungeonViewAsId;
      renderDungeon();
      toast(dungeonViewAsId
        ? 'Spielersicht: ' + (typeof combatOwnerLabel === 'function' ? combatOwnerLabel(dungeonViewAsId) : dungeonViewAsId)
        : 'DM-Übersicht');
    }

    function fillDungeonViewAsSelect() {
      const sel = document.getElementById('dungeonViewAsSelect');
      if (!sel) return;
      const cur = dungeonViewAsId;
      sel.innerHTML = '<option value="">DM-Übersicht</option>';
      const owners = typeof combatSheetOwners === 'function' ? combatSheetOwners() : Object.keys(playerAccounts || {});
      owners.forEach(id => {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = typeof combatOwnerLabel === 'function' ? combatOwnerLabel(id) : id;
        sel.appendChild(o);
      });
      sel.value = cur || '';
    }

    function beginDungeonCalibrate() {
      if (!isDM) return;
      if (!dungeon.image) return toast('Zuerst eine Karte laden.');
      cancelDungeonPlace();
      dungeonDrawMode = 'calibrate';
      dungeonCalibratePts = [];
      dungeonDrawPoints = [];
      dungeonPreviewPt = null;
      const stage = document.getElementById('dungeonStage');
      if (stage) {
        stage.classList.add('is-draw');
        stage.classList.remove('is-erase');
      }
      syncDungeonFogControls();
      renderDungeonGeometryOverlay();
      toast('Maßstab: zwei Punkte tippen (z. B. eine bekannte 5-ft-Kante).');
    }

    function finishDungeonCalibrate(pt) {
      dungeonCalibratePts.push(pt);
      dungeonDrawPoints = dungeonCalibratePts.slice();
      dungeonPreviewPt = null;
      if (dungeonCalibratePts.length < 2) {
        renderDungeonGeometryOverlay();
        toast('Zweiten Punkt tippen.');
        return;
      }
      const a = dungeonCalibratePts[0];
      const b = dungeonCalibratePts[1];
      const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
      dungeonCalibratePts = [];
      dungeonDrawPoints = [];
      dungeonDrawMode = null;
      const stage = document.getElementById('dungeonStage');
      if (stage) {
        stage.classList.remove('is-draw');
        stage.classList.remove('is-erase');
      }
      syncDungeonFogControls();
      renderDungeonGeometryOverlay();
      if (dist < 0.4) return toast('Strecke zu kurz.');
      const feetRaw = prompt('Wie viele Fuß entspricht diese Strecke?', '5');
      const feet = Number(String(feetRaw || '').replace(',', '.'));
      if (!(feet > 0)) return toast('Abgebrochen.');
      dungeon.scaleFt = feet / dist;
      dungeon.layoutAt = stampNow();
      const scaleEl = document.getElementById('dungeonScaleFt');
      if (scaleEl) scaleEl.value = String(Math.round(dungeon.scaleFt * 100) / 100);
      persistDungeonSoon();
      renderDungeonFog();
      toast('Maßstab: 1% ≈ ' + (Math.round(dungeon.scaleFt * 10) / 10) + ' ft');
    }

    function placeDungeonRectWalls(a, b) {
      dungeonPushUndo();
      const x1 = Math.min(a.x, b.x);
      const x2 = Math.max(a.x, b.x);
      const y1 = Math.min(a.y, b.y);
      const y2 = Math.max(a.y, b.y);
      const now = stampNow();
      const segs = [
        { x1: x1, y1: y1, x2: x2, y2: y1 },
        { x1: x2, y1: y1, x2: x2, y2: y2 },
        { x1: x2, y1: y2, x2: x1, y2: y2 },
        { x1: x1, y1: y2, x2: x1, y2: y1 }
      ];
      segs.forEach(s => {
        if (Math.abs(s.x1 - s.x2) + Math.abs(s.y1 - s.y2) < 0.1) return;
        dungeon.walls.push(dungeonSegNorm(Object.assign({ id: dungeonNewId('wall'), updatedAt: now }, s), 'wall'));
      });
      dungeon.layoutAt = now;
      persistDungeonSoon();
      renderDungeon();
      toast('Raum / Rechteck gesetzt.');
    }

    function transferDungeonToCombat() {
      if (!isDM) return;
      if (!(dungeon.tokens || []).length) return toast('Keine Tokens im Dungeon.');
      let n = 0;
      (dungeon.tokens || []).forEach(tok => {
        if (tok.playerId === ILLUSION_OWNER) return;
        const existing = combat.combatants.find(c =>
          (tok.playerId && c.playerId === tok.playerId) ||
          (!tok.playerId && c.name === tok.name && c.kind === (tok.kind === 'player' ? 'player' : 'enemy'))
        );
        let row = existing;
        if (!row) {
          if (tok.playerId && tok.kind === 'player' && typeof addPlayerToCombat === 'function') {
            addPlayerToCombat(tok.playerId, true);
            row = combat.combatants.find(c => c.playerId === tok.playerId);
          } else if (tok.playerId && String(tok.playerId).indexOf(NPC_PREFIX) === 0 && typeof addNpcToCombat === 'function') {
            addNpcToCombat(String(tok.playerId).slice(NPC_PREFIX.length), true);
            row = combat.combatants.find(c => c.playerId === tok.playerId);
          } else {
            row = addCombatant({
              name: tok.name,
              kind: tok.kind === 'player' ? 'player' : 'enemy',
              playerId: tok.playerId || '',
              hp: 10,
              hpMax: 10,
              portraitId: tok.portraitId || ''
            }, true);
          }
        }
        if (!row) return;
        if (typeof upsertBattleToken === 'function') {
          const t = (battle.tokens || []).find(x => x.id === row.id);
          if (t) {
            t.x = tok.x;
            t.y = tok.y;
            t.movedAt = stampNow();
          } else {
            upsertBattleToken(row);
            const nt = (battle.tokens || []).find(x => x.id === row.id);
            if (nt) {
              nt.x = tok.x;
              nt.y = tok.y;
            }
          }
        }
        n++;
      });
      if (typeof persistCombat === 'function') persistCombat();
      if (typeof persistBattleSoon === 'function') persistBattleSoon();
      else if (typeof persistBattle === 'function') persistBattle();
      toast(n + ' Figur(en) in den Kampf übernommen.');
      if (typeof showKampf === 'function') showKampf();
    }

    function syncDungeonAmbient() {
      if (!isDM && !currentPlayerId) return;
      if (currentPage !== 'dungeon') return;
      let track = dungeon.ambientId || '';
      const focus = (dungeon.tokens || []).find(t => t.id === dungeonFocusTokenId) ||
        (dungeon.tokens || []).find(t => dungeonCanControlToken(t));
      if (focus) {
        (dungeon.zones || []).forEach(z => {
          if (!z.trackId) return;
          const dx = focus.x - z.x;
          const dy = focus.y - z.y;
          if ((dx * dx + dy * dy) <= (z.r * z.r)) track = z.trackId;
        });
      }
      if (!track) return;
      if (typeof playSoundTrack === 'function' && soundTrackId !== track) {
        try { playSoundTrack(track); } catch (err) {}
      }
    }

    function persistDungeonExploredCloud() {
      if (!db || isDM || !currentPlayerId || !dungeonExploredCanvas) return;
      const key = currentPlayerId;
      const dataUrl = dungeonExploredCanvas.toDataURL('image/png');
      const gen = Math.max(0, Number(dungeon.exploredGen) || 0);
      dungeonExploredRef().set({
        [key]: { gen: gen, png: dataUrl, updatedAt: stampNow() }
      }, { merge: true }).catch(() => {});
    }

    function loadDungeonExploredCloud() {
      if (!db || isDM || !currentPlayerId) return;
      dungeonExploredRef().get().then(snap => {
        if (!snap.exists) return;
        const row = snap.data()[currentPlayerId];
        if (!row || !row.png) return;
        const gen = Math.max(0, Number(dungeon.exploredGen) || 0);
        if (Number(row.gen) !== gen) return;
        try {
          writeLocal(dungeonExploredStorageKey(), row.png);
          ensureDungeonExploredBuffer(true);
        } catch (err) {}
      }).catch(() => {});
    }

    function normalizeDungeonGalleryMap(m) {
      if (!m || typeof m !== 'object') return null;
      const id = String(m.id || '');
      const name = String(m.name || '').trim();
      if (!id || !name) return null;
      return {
        id: id,
        name: name,
        imageId: String(m.imageId || ''),
        image: typeof m.image === 'string' ? m.image : '',
        layout: m.layout && typeof m.layout === 'object' ? m.layout : null
      };
    }

    function persistDungeonGalleryLocal() {
      writeLocal(DUNGEON_GALLERY_LOCAL_KEY, JSON.stringify({
        updatedAt: dungeonGalleryUpdatedAt,
        maps: dungeonGalleryMaps
      }));
    }

    function loadDungeonGalleryLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(DUNGEON_GALLERY_LOCAL_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        dungeonGalleryUpdatedAt = Number(raw.updatedAt) || 0;
        dungeonGalleryMaps = (Array.isArray(raw.maps) ? raw.maps : []).map(normalizeDungeonGalleryMap).filter(Boolean);
      } catch (err) {}
    }

    function applyDungeonGallery(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= dungeonGalleryUpdatedAt) return;
      dungeonGalleryUpdatedAt = at;
      dungeonGalleryMaps = (Array.isArray(data.maps) ? data.maps : []).map(normalizeDungeonGalleryMap).filter(Boolean);
      persistDungeonGalleryLocal();
      renderDungeonGalleryList();
    }

    function listenDungeonGallery() {
      if (!db) return;
      dungeonGalleryRef().onSnapshot(snap => {
        if (writingDungeonGallery || !snap.exists) return;
        applyDungeonGallery(snap.data());
      });
    }

    async function persistDungeonGalleryRemote() {
      persistDungeonGalleryLocal();
      if (!db) return;
      writingDungeonGallery = true;
      try {
        const nextAt = Date.now();
        await dungeonGalleryRef().set({ updatedAt: nextAt, maps: dungeonGalleryMaps });
        dungeonGalleryUpdatedAt = nextAt;
        persistDungeonGalleryLocal();
      } finally {
        writingDungeonGallery = false;
      }
    }

    function renderDungeonGalleryList() {
      const box = document.getElementById('dungeonGalleryList');
      if (!box) return;
      box.innerHTML = '';
      const list = dungeonGalleryMaps.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
      if (!list.length) {
        const empty = document.createElement('p');
        empty.className = 'kampf-empty';
        empty.style.margin = '0';
        empty.textContent = 'Noch keine gespeicherten Dungeons.';
        box.appendChild(empty);
        return;
      }
      list.forEach(map => {
        const row = document.createElement('div');
        row.className = 'battle-gallery-item';
        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'ghost';
        pick.textContent = map.name;
        pick.onclick = () => loadDungeonGalleryMap(map.id);
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'danger';
        del.textContent = '×';
        del.onclick = () => {
          if (!confirm(map.name + ' löschen?')) return;
          dungeonGalleryMaps = dungeonGalleryMaps.filter(m => m.id !== map.id);
          persistDungeonGalleryRemote();
          renderDungeonGalleryList();
        };
        row.appendChild(pick);
        row.appendChild(del);
        box.appendChild(row);
      });
    }

    function openDungeonGallery() {
      if (!isDM) return;
      renderDungeonGalleryList();
      const overlay = document.getElementById('dungeonGalleryOverlay');
      if (overlay) overlay.classList.remove('hidden');
    }

    function closeDungeonGallery() {
      const overlay = document.getElementById('dungeonGalleryOverlay');
      if (overlay) overlay.classList.add('hidden');
    }

    async function saveCurrentDungeonToGallery() {
      if (!isDM) return;
      if (!dungeon.image) return toast('Keine Karte geladen.');
      const name = prompt('Name für diesen Dungeon?', 'Dungeon');
      if (!name || !String(name).trim()) return;
      const clean = String(name).trim();
      if (dungeonGalleryMaps.some(m => m.name.toLowerCase() === clean.toLowerCase())) {
        return toast('Name schon vergeben.');
      }
      toast('Speichere Dungeon…');
      try {
        const id = dungeonNewId('dg');
        let imageId = '';
        let image = dungeon.image;
        if (db && /^data:/i.test(dungeon.image)) {
          imageId = newImageId();
          await persistEntryImage(imageId, dungeon.image);
          image = '';
        }
        const layout = {
          walls: dungeon.walls,
          doors: dungeon.doors,
          lights: dungeon.lights,
          notes: dungeon.notes,
          zones: dungeon.zones,
          scaleFt: dungeon.scaleFt,
          ambientId: dungeon.ambientId
        };
        dungeonGalleryMaps = dungeonGalleryMaps.concat([{
          id: id,
          name: clean,
          imageId: imageId,
          image: imageId ? '' : image,
          layout: layout
        }]);
        await persistDungeonGalleryRemote();
        renderDungeonGalleryList();
        toast('Dungeon gespeichert.');
      } catch (err) {
        toast(err.message || 'Speichern fehlgeschlagen.');
      }
    }

    async function loadDungeonGalleryMap(id) {
      const map = dungeonGalleryMaps.find(m => m.id === id);
      if (!map) return;
      closeDungeonGallery();
      toast('Lade Dungeon…');
      try {
        let img = map.image || '';
        if (!img && map.imageId && typeof loadEntryImage === 'function') {
          img = await loadEntryImage(map.imageId);
        }
        if (!img) throw new Error('Bild nicht gefunden.');
        dungeon.image = img;
        if (map.layout) {
          dungeon.walls = (map.layout.walls || []).map(w => dungeonSegNorm(w, 'wall'));
          dungeon.doors = (map.layout.doors || []).map(dungeonDoorNorm);
          dungeon.lights = (map.layout.lights || []).map(dungeonLightNorm);
          dungeon.notes = (map.layout.notes || []).map(dungeonNoteNorm);
          dungeon.zones = (map.layout.zones || []).map(dungeonZoneNorm);
          if (Number(map.layout.scaleFt) > 0) dungeon.scaleFt = Number(map.layout.scaleFt);
          dungeon.ambientId = String(map.layout.ambientId || '');
        }
        dungeon.layoutAt = stampNow();
        await persistDungeonMap();
        persistDungeonSoon();
        renderDungeon();
        toast('Dungeon geladen: ' + map.name);
      } catch (err) {
        toast(err.message || 'Laden fehlgeschlagen.');
      }
    }

    function bindDungeonExtrasUi() {
      onClick('dungeonUndoBtn', dungeonUndo);
      onClick('dungeonCalibrateBtn', () => {
        beginDungeonCalibrate();
        closeDungeonMenus();
      });
      onClick('dungeonRectBtn', () => {
        setDungeonDrawMode('rect');
        closeDungeonMenus();
      });
      onClick('dungeonNoteBtn', () => {
        setDungeonDrawMode('note');
        closeDungeonMenus();
      });
      onClick('dungeonZoneBtn', () => {
        setDungeonDrawMode('zone');
        closeDungeonMenus();
      });
      onClick('dungeonToCombatBtn', () => {
        transferDungeonToCombat();
        closeDungeonMenus();
      });
      onClick('dungeonGalleryBtn', () => {
        openDungeonGallery();
        closeDungeonMenus();
      });
      onClick('dungeonGallerySaveBtn', saveCurrentDungeonToGallery);
      onClick('dungeonGalleryCloseBtn', closeDungeonGallery);
      onEv('dungeonGalleryOverlay', 'click', ev => {
        if (ev.target && ev.target.id === 'dungeonGalleryOverlay') closeDungeonGallery();
      });
      const viewAs = document.getElementById('dungeonViewAsSelect');
      if (viewAs && !viewAs.dataset.bound) {
        viewAs.dataset.bound = '1';
        viewAs.addEventListener('change', () => setDungeonViewAs(viewAs.value));
      }
      const doorKind = document.getElementById('dungeonDoorKind');
      if (doorKind && !doorKind.dataset.bound) {
        doorKind.dataset.bound = '1';
        doorKind.addEventListener('change', () => {
          dungeonPendingDoorKind = doorKind.value;
          dungeon.doorKindDefault = doorKind.value;
        });
      }
      const lightKind = document.getElementById('dungeonLightKind');
      if (lightKind && !lightKind.dataset.bound) {
        lightKind.dataset.bound = '1';
        lightKind.addEventListener('change', () => {
          dungeonPendingLightKind = lightKind.value;
          dungeon.lightKindDefault = lightKind.value;
        });
      }
      const amb = document.getElementById('dungeonAmbientSelect');
      if (amb && !amb.dataset.bound) {
        amb.dataset.bound = '1';
        amb.addEventListener('change', () => {
          dungeon.ambientId = amb.value || '';
          dungeon.layoutAt = stampNow();
          persistDungeonSoon();
          syncDungeonAmbient();
        });
      }
      fillDungeonViewAsSelect();
      fillDungeonAmbientSelect();
      fillDungeonKindSelects();
    }

    function fillDungeonKindSelects() {
      const doorKind = document.getElementById('dungeonDoorKind');
      if (doorKind && !doorKind.options.length) {
        Object.keys(DUNGEON_DOOR_KINDS).forEach(k => {
          const o = document.createElement('option');
          o.value = k;
          o.textContent = DUNGEON_DOOR_KINDS[k].label;
          doorKind.appendChild(o);
        });
        doorKind.value = dungeon.doorKindDefault || 'normal';
      }
      const lightKind = document.getElementById('dungeonLightKind');
      if (lightKind && !lightKind.options.length) {
        Object.keys(DUNGEON_LIGHT_KINDS).forEach(k => {
          const o = document.createElement('option');
          o.value = k;
          o.textContent = DUNGEON_LIGHT_KINDS[k].label;
          lightKind.appendChild(o);
        });
        lightKind.value = dungeon.lightKindDefault || 'torch';
      }
    }

    function fillDungeonAmbientSelect() {
      const amb = document.getElementById('dungeonAmbientSelect');
      if (!amb) return;
      const cur = dungeon.ambientId || '';
      amb.innerHTML = '<option value="">— Ambient aus —</option>';
      const tracks = typeof SOUND_TRACKS === 'object' ? SOUND_TRACKS : {};
      Object.keys(tracks).forEach(id => {
        const t = tracks[id];
        if (!t) return;
        const o = document.createElement('option');
        o.value = id;
        o.textContent = t.name || id;
        amb.appendChild(o);
      });
      if (typeof soundUserClips !== 'undefined') {
        soundUserClips.filter(c => c.kind === 'ambiente').forEach(c => {
          const o = document.createElement('option');
          o.value = c.id;
          o.textContent = c.name || c.id;
          amb.appendChild(o);
        });
      }
      amb.value = cur;
    }
