/* Thalarion – Sound (Ambiente, Effekte, Dock) – Phase 1.3 */

    function clampSoundVol(n, fallback) {
      const v = Number(n);
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
    }

    function soundGroupId(raw) {
      return SOUND_GROUPS.some(g => g.id === raw) ? raw : 'reise';
    }

    function loadSoundPrefs() {
      try {
        const raw = localStorage.getItem(SOUND_PREF_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data && typeof data === 'object') {
            if (data.amb != null) soundVolAmb = clampSoundVol(data.amb, soundVolAmb);
            if (data.fx != null) soundVolFx = clampSoundVol(data.fx, soundVolFx);
            if (typeof data.lastAmbient === 'string') soundLastAmbientId = data.lastAmbient;
            if (Array.isArray(data.favorites)) {
              soundFavorites = data.favorites.filter(id => typeof id === 'string').slice(0, SOUND_FAV_MAX);
            }
          }
          return;
        }
        const old = localStorage.getItem(SOUND_VOL_KEY);
        if (old == null || old === '') return;
        const n = Number(old);
        if (Number.isFinite(n)) soundVolAmb = Math.min(1, Math.max(0, n));
      } catch (err) {}
    }

    function saveSoundPrefs() {
      try {
        localStorage.setItem(SOUND_PREF_KEY, JSON.stringify({
          amb: soundVolAmb,
          fx: soundVolFx,
          lastAmbient: soundLastAmbientId,
          favorites: soundFavorites
        }));
      } catch (err) {}
    }

    function soundAssetUrl(rel) {
      try {
        return new URL(rel, document.baseURI || location.href).href;
      } catch (err) {
        return rel;
      }
    }

    function isElementPlaying(el) {
      return !!(el && !el.paused && !el.ended);
    }

    function isSoundPlaying() {
      return isElementPlaying(soundMusic);
    }

    function cancelSoundFade(audio) {
      if (!audio) return;
      const raf = soundFadeRafs.get(audio);
      if (raf) cancelAnimationFrame(raf);
      soundFadeRafs.delete(audio);
    }

    function isAudioFading(audio) {
      return soundFadeRafs.has(audio);
    }

    function currentSoundTargetVol() {
      return soundDuckUntil > performance.now() ? soundVolAmb * 0.32 : soundVolAmb;
    }

    function soundFadeMix(t, ease) {
      const x = Math.min(1, Math.max(0, t));
      if (ease === 'out') return 1 - Math.cos(x * Math.PI / 2);
      if (ease === 'in') return Math.sin(x * Math.PI / 2);
      if (ease === 'smooth') return 0.5 - 0.5 * Math.cos(Math.PI * x);
      return x;
    }

    function fadeAudio(audio, target, ms, onDone, ease) {
      if (!audio) {
        if (onDone) onDone();
        return;
      }
      cancelSoundFade(audio);
      const from = Number(audio.volume) || 0;
      const start = performance.now();
      const dur = Math.max(0, ms || 0);
      const follow = target == null;
      const destNow = () => follow ? currentSoundTargetVol() : Math.min(1, Math.max(0, Number(target) || 0));
      if (!dur) {
        audio.volume = destNow();
        if (onDone) onDone();
        return;
      }
      let rafId = 0;
      const tick = now => {
        if (soundFadeRafs.get(audio) !== rafId) return;
        const t = Math.min(1, (now - start) / dur);
        const dest = destNow();
        audio.volume = from + (dest - from) * soundFadeMix(t, ease);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
          soundFadeRafs.set(audio, rafId);
        } else {
          soundFadeRafs.delete(audio);
          audio.volume = dest;
          if (onDone) onDone();
        }
      };
      rafId = requestAnimationFrame(tick);
      soundFadeRafs.set(audio, rafId);
    }

    function applySoundVolumeNow() {
      if (soundMusic && !isAudioFading(soundMusic)) {
        soundMusic.volume = Math.min(1, Math.max(0, currentSoundTargetVol()));
      }
      Object.keys(soundLoopFx).forEach(id => {
        const el = soundLoopFx[id];
        if (el && !isAudioFading(el)) el.volume = Math.min(1, Math.max(0, soundVolFx));
      });
    }

    function soundAmbientExists(id) {
      return !!(SOUND_TRACKS[id] || soundUserClips.some(c => c.id === id && c.kind === 'ambiente'));
    }

    function soundTrackLabel(id) {
      if (SOUND_TRACKS[id]) return SOUND_TRACKS[id].name;
      const rec = soundUserClips.find(c => c.id === id);
      return rec ? rec.name : 'Ambiente';
    }

    function soundItemGroup(id, rec) {
      if (SOUND_TRACKS[id]) return SOUND_TRACKS[id].group;
      return soundGroupId(rec && rec.group);
    }

    function pruneSoundFavorites() {
      const before = soundFavorites.join('\0');
      soundFavorites = soundFavorites.filter(id =>
        SOUND_FX.some(fx => fx.id === id) || soundUserClips.some(c => c.id === id && c.kind === 'fx')
      ).slice(0, SOUND_FAV_MAX);
      if (soundFavorites.join('\0') !== before) saveSoundPrefs();
    }

    function applySoundDockOpen() {
      const wrap = document.getElementById('soundDockWrap');
      const dock = document.getElementById('soundDock');
      const btn = document.getElementById('soundDockBtn');
      const open = !!(isDM && soundDockOpen);
      document.body.classList.toggle('sound-dock-open', open);
      if (wrap) {
        wrap.classList.toggle('hidden', !isDM);
        wrap.classList.toggle('is-open', open);
      }
      if (dock) dock.classList.toggle('hidden', !open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeSoundDock() {
      if (!soundDockOpen) return;
      soundDockOpen = false;
      applySoundDockOpen();
    }

    function toggleSoundDock() {
      if (!isDM) return;
      soundDockOpen = !soundDockOpen;
      applySoundDockOpen();
    }

    function syncSoundUi() {
      applySoundDockOpen();
      const now = document.getElementById('soundNow');
      if (now) {
        const playing = isSoundPlaying();
        const id = soundTrackId || soundLastAmbientId;
        const name = id ? soundTrackLabel(id) : '';
        now.classList.toggle('is-on', playing);
        if (playing) now.textContent = name;
        else if (soundPaused && soundTrackId) now.textContent = 'Pausiert · ' + soundTrackLabel(soundTrackId);
        else if (soundLastAmbientId && soundAmbientExists(soundLastAmbientId)) now.textContent = 'Bereit · ' + soundTrackLabel(soundLastAmbientId);
        else now.textContent = 'Stille';
      }
      const amb = document.getElementById('soundAmbienteBtn');
      if (amb) amb.className = isSoundPlaying() ? 'primary' : 'ghost';
      const pauseBtn = document.getElementById('soundPauseBtn');
      if (pauseBtn) {
        pauseBtn.textContent = isSoundPlaying() ? 'Pause' : 'Weiter';
        pauseBtn.disabled = !isSoundPlaying() && !soundTrackId && !soundAmbientExists(soundLastAmbientId);
      }
      const fxStop = document.getElementById('soundFxStopBtn');
      if (fxStop) fxStop.disabled = !isAnyFxPlaying();
      const volA = document.getElementById('soundVolAmb');
      if (volA && document.activeElement !== volA) volA.value = String(Math.round(soundVolAmb * 100));
      const volF = document.getElementById('soundVolFx');
      if (volF && document.activeElement !== volF) volF.value = String(Math.round(soundVolFx * 100));
      renderSoundFxButtons();
      if (soundPickOpen()) {
        renderSoundGroupBar();
        renderSoundPickList();
      }
    }

    function soundElId(id) {
      return id === 'kampf' ? 'soundElKampf' : 'soundElReise';
    }

    function getSoundPlayer(id) {
      if (soundPlayers[id]) return soundPlayers[id];
      if (SOUND_TRACKS[id]) {
        const el = document.getElementById(soundElId(id));
        if (!el) return null;
        el.loop = true;
        el.preload = 'auto';
        el.setAttribute('playsinline', '');
        el.addEventListener('play', syncSoundUi);
        el.addEventListener('pause', syncSoundUi);
        el.addEventListener('error', () => {
          toast('Musikdatei fehlt oder lädt nicht. Bitte Strg+F5.');
        });
        soundPlayers[id] = el;
        try { el.load(); } catch (err) {}
        return el;
      }
      const rec = soundUserClips.find(c => c.id === id);
      if (!rec || !rec.url) return null;
      const el = new Audio(rec.url);
      el.loop = rec.kind === 'ambiente';
      el.preload = 'auto';
      el.addEventListener('play', syncSoundUi);
      el.addEventListener('pause', syncSoundUi);
      soundPlayers[id] = el;
      return el;
    }

    function warmupSoundPlayers() {
      Object.keys(SOUND_TRACKS).forEach(id => getSoundPlayer(id));
    }

    function unlockSound() {
      if (soundUnlocked) return;
      soundUnlocked = true;
      const dummy = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      dummy.volume = 0.01;
      const p = dummy.play();
      if (p && typeof p.then === 'function') p.then(() => dummy.pause()).catch(() => {});
    }

    function playIncomingAudio(audio, gen, onReady) {
      const begin = () => {
        if (gen !== soundPlayGen || soundMusic !== audio) return;
        onReady();
      };
      const tryPlay = () => {
        if (gen !== soundPlayGen || soundMusic !== audio) return;
        const play = audio.play();
        if (play && typeof play.then === 'function') {
          play.then(begin).catch(err => {
            if (gen !== soundPlayGen || soundMusic !== audio) return;
            if (err && err.name === 'AbortError') {
              window.setTimeout(tryPlay, 50);
              return;
            }
            toast('Musik startet nicht. Nochmal antippen.');
            syncSoundUi();
          });
        } else {
          begin();
        }
      };
      tryPlay();
    }

    function playSoundTrack(id, opts) {
      opts = opts || {};
      if (!isDM) return;
      const builtin = SOUND_TRACKS[id];
      const rec = soundUserClips.find(c => c.id === id);
      if (!builtin && !(rec && rec.kind === 'ambiente')) return;
      unlockSound();
      const audio = getSoundPlayer(id);
      if (!audio) return toast('Musikplayer fehlt.');
      const same = soundTrackId === id;
      if (same && isSoundPlaying() && !opts.restart) {
        syncSoundUi();
        return;
      }
      const resume = !!(opts.resume || (same && soundPaused));
      const outgoing = (!same && soundMusic && soundMusic !== audio && isElementPlaying(soundMusic))
        ? soundMusic
        : null;
      soundPlayGen += 1;
      const gen = soundPlayGen;
      soundMusic = audio;
      soundTrackId = id;
      soundLastAmbientId = id;
      soundPaused = false;
      soundDuckUntil = 0;
      saveSoundPrefs();
      if (!resume) {
        try { audio.currentTime = 0; } catch (err) {}
      }
      const intoKampf = !!(outgoing && id === 'kampf');
      audio.muted = false;
      audio.volume = outgoing
        ? (intoKampf ? 0.08 : 0.12)
        : Math.max(0.18, Math.min(soundVolAmb || 0.55, 0.32));
      if (outgoing) {
        fadeAudio(outgoing, 0, SOUND_CROSSFADE, () => {
          try { outgoing.pause(); } catch (err) {}
          try { outgoing.currentTime = 0; } catch (err) {}
        }, 'out');
      }
      const fadeMs = !outgoing ? SOUND_FADE_IN : (intoKampf ? SOUND_CROSSFADE + 1500 : SOUND_CROSSFADE);
      const fadeEase = !outgoing ? 'smooth' : (intoKampf ? 'smooth' : 'in');
      playIncomingAudio(audio, gen, () => {
        fadeAudio(audio, null, fadeMs, null, fadeEase);
        syncSoundUi();
      });
      syncSoundUi();
    }

    function pauseSoundTrack() {
      if (!isSoundPlaying() || !soundMusic) return;
      soundPlayGen += 1;
      cancelSoundFade(soundMusic);
      try { soundMusic.pause(); } catch (err) {}
      soundPaused = true;
      syncSoundUi();
    }

    function resumeSoundTrack() {
      const id = soundTrackId || soundLastAmbientId;
      if (!id || !soundAmbientExists(id)) return;
      playSoundTrack(id, { resume: !!(soundTrackId && soundPaused) });
    }

    function togglePauseSound() {
      if (isSoundPlaying()) pauseSoundTrack();
      else resumeSoundTrack();
    }

    function stopLoopFx(id, hard) {
      const el = soundLoopFx[id];
      delete soundLoopFx[id];
      if (!el) return;
      if (hard) {
        cancelSoundFade(el);
        try { el.pause(); } catch (err) {}
        return;
      }
      fadeAudio(el, 0, 500, () => {
        try { el.pause(); } catch (err) {}
      });
    }

    function stopAllLoopFx(hard) {
      Object.keys(soundLoopFx).forEach(id => stopLoopFx(id, hard));
    }

    function stopAllSoundFx(hard) {
      stopAllLoopFx(hard);
      soundFxShots.splice(0).forEach(el => {
        cancelSoundFade(el);
        try { el.pause(); } catch (err) {}
        try { el.currentTime = 0; } catch (err) {}
      });
      syncSoundUi();
    }

    function isAnyFxPlaying() {
      return Object.keys(soundLoopFx).length > 0 || soundFxShots.some(el => isElementPlaying(el));
    }

    function stopSoundTrack() {
      soundPlayGen += 1;
      soundPaused = false;
      stopAllSoundFx(false);
      const audio = soundMusic;
      if (!audio) {
        soundMusic = null;
        soundTrackId = '';
        syncSoundUi();
        return;
      }
      fadeAudio(audio, 0, SOUND_FADE_OUT, () => {
        try { audio.pause(); } catch (err) {}
        try { audio.currentTime = 0; } catch (err) {}
        if (soundMusic === audio) {
          soundMusic = null;
          soundTrackId = '';
        }
        syncSoundUi();
      });
      syncSoundUi();
    }

    function setSoundAmbVolume(raw) {
      soundVolAmb = clampSoundVol(raw, soundVolAmb);
      saveSoundPrefs();
      applySoundVolumeNow();
    }

    function setSoundFxVolume(raw) {
      soundVolFx = clampSoundVol(raw, soundVolFx);
      saveSoundPrefs();
      applySoundVolumeNow();
    }

    function duckSoundMusic(ms) {
      soundDuckUntil = performance.now() + Math.max(400, ms || 1600);
      applySoundVolumeNow();
      window.setTimeout(() => {
        if (soundDuckUntil <= performance.now()) applySoundVolumeNow();
      }, (ms || 1600) + 40);
    }

    function playSoundFxSrc(src) {
      if (!isDM || !src) return;
      unlockSound();
      const fx = new Audio(src);
      fx.volume = Math.min(1, Math.max(0, soundVolFx));
      soundFxShots.push(fx);
      fx.addEventListener('ended', () => {
        const i = soundFxShots.indexOf(fx);
        if (i >= 0) soundFxShots.splice(i, 1);
        syncSoundUi();
      });
      duckSoundMusic(1600);
      const play = fx.play();
      if (play && typeof play.catch === 'function') {
        play.catch(() => {
          const i = soundFxShots.indexOf(fx);
          if (i >= 0) soundFxShots.splice(i, 1);
          toast('Effekt konnte nicht abgespielt werden.');
          syncSoundUi();
        });
      }
      syncSoundUi();
    }

    function fxSrcFor(id) {
      const builtin = SOUND_FX.find(item => item.id === id);
      if (builtin) return soundAssetUrl(builtin.src);
      const rec = soundUserClips.find(c => c.id === id && c.kind === 'fx');
      return rec && rec.url ? rec.url : '';
    }

    function fxIsLoop(id) {
      const rec = soundUserClips.find(c => c.id === id && c.kind === 'fx');
      if (rec) return !!rec.loop;
      const builtin = SOUND_FX.find(item => item.id === id);
      return !!(builtin && builtin.loop);
    }

    function toggleLoopFx(id) {
      if (soundLoopFx[id]) {
        stopLoopFx(id, false);
        syncSoundUi();
        return;
      }
      const src = fxSrcFor(id);
      if (!src) return;
      unlockSound();
      const el = new Audio(src);
      el.loop = true;
      el.volume = Math.min(1, Math.max(0, soundVolFx));
      soundLoopFx[id] = el;
      const play = el.play();
      if (play && typeof play.catch === 'function') {
        play.catch(() => {
          delete soundLoopFx[id];
          toast('Effekt konnte nicht abgespielt werden.');
          syncSoundUi();
        });
      }
      syncSoundUi();
    }

    function playSoundFx(id) {
      if (!isDM) return;
      if (fxIsLoop(id) || soundLoopFx[id]) {
        toggleLoopFx(id);
        return;
      }
      const src = fxSrcFor(id);
      if (src) playSoundFxSrc(src);
    }

    function soundPickOpen() {
      const el = document.getElementById('soundPickOverlay');
      return !!(el && !el.classList.contains('hidden'));
    }

    function closeSoundPicker() {
      const el = document.getElementById('soundPickOverlay');
      if (el) el.classList.add('hidden');
    }

    function renderSoundGroupBar() {
      const bar = document.getElementById('soundGroupBar');
      if (!bar) return;
      if (soundPickKind === 'fx') {
        bar.classList.add('hidden');
        bar.innerHTML = '';
        return;
      }
      bar.classList.remove('hidden');
      bar.innerHTML = '';
      [{ id: 'all', name: 'Alle' }].concat(SOUND_GROUPS).forEach(g => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = soundGroupFilter === g.id ? 'primary' : 'ghost';
        btn.textContent = g.name;
        btn.onclick = () => {
          soundGroupFilter = g.id;
          const sel = document.getElementById('soundAddGroup');
          if (sel && g.id !== 'all') sel.value = g.id;
          renderSoundGroupBar();
          renderSoundPickList();
        };
        bar.appendChild(btn);
      });
    }

    function syncSoundPickerChrome() {
      const fx = soundPickKind === 'fx';
      const meta = document.getElementById('soundPickMeta');
      const add = document.getElementById('soundPickAddBtn');
      const exp = document.getElementById('soundPickExportBtn');
      const imp = document.getElementById('soundPickImportBtn');
      if (meta) meta.classList.toggle('hidden', fx);
      if (add) add.classList.toggle('hidden', fx);
      if (exp) exp.classList.toggle('hidden', fx);
      if (imp) imp.classList.toggle('hidden', fx);
    }

    function openSoundPicker(kind) {
      if (!isDM) return;
      soundPickKind = kind === 'fx' ? 'fx' : 'ambiente';
      const overlay = document.getElementById('soundPickOverlay');
      const title = document.getElementById('soundPickTitle');
      const hint = document.getElementById('soundPickHint');
      if (title) title.textContent = soundPickKind === 'fx' ? 'Effekte' : 'Ambiente';
      if (hint) {
        hint.textContent = '';
        hint.classList.add('hidden');
      }
      syncSoundPickerChrome();
      renderSoundGroupBar();
      renderSoundPickList();
      if (overlay) overlay.classList.remove('hidden');
    }

    function soundClipName(file) {
      return String(file && file.name || 'Klang')
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim() || 'Klang';
    }

    function openSoundDb() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('thalarion_sounds', 2);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('clips')) db.createObjectStore('clips', { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async function soundDbAll() {
      const db = await openSoundDb();
      const rows = await new Promise((resolve, reject) => {
        const tx = db.transaction('clips', 'readonly');
        const req = tx.objectStore('clips').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return rows;
    }

    async function soundDbPut(rec) {
      const db = await openSoundDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('clips', 'readwrite');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.objectStore('clips').put(rec);
      });
      db.close();
    }

    async function loadSoundUserClips() {
      soundUserClips.forEach(c => {
        if (c.url) try { URL.revokeObjectURL(c.url); } catch (err) {}
      });
      Object.keys(soundPlayers).forEach(id => {
        if (SOUND_TRACKS[id]) return;
        const el = soundPlayers[id];
        cancelSoundFade(el);
        try { if (el) el.pause(); } catch (err) {}
        delete soundPlayers[id];
        if (soundMusic === el) {
          soundMusic = null;
          soundTrackId = '';
          soundPaused = false;
        }
      });
      soundUserClips = [];
      try {
        const rows = await soundDbAll();
        soundUserClips = rows.map(row => ({
          id: row.id,
          kind: row.kind === 'fx' ? 'fx' : 'ambiente',
          name: row.name || 'Klang',
          group: soundGroupId(row.group),
          loop: row.kind === 'fx' && !!row.loop,
          url: row.blob ? URL.createObjectURL(row.blob) : ''
        })).filter(c => c.url);
      } catch (err) {
        soundUserClips = [];
      }
      if (soundLastAmbientId && !soundAmbientExists(soundLastAmbientId)) soundLastAmbientId = '';
      pruneSoundFavorites();
    }

    async function saveSoundUserClip(kind, file, extra) {
      extra = extra || {};
      const rec = {
        id: 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        kind: kind === 'fx' ? 'fx' : 'ambiente',
        name: String(extra.name || '').trim() || soundClipName(file),
        group: soundGroupId(extra.group),
        loop: kind === 'fx' && !!extra.loop,
        blob: file
      };
      await soundDbPut(rec);
      soundUserClips.push({
        id: rec.id,
        kind: rec.kind,
        name: rec.name,
        group: rec.group,
        loop: rec.loop,
        url: URL.createObjectURL(file)
      });
    }

    async function deleteSoundUserClip(id) {
      if (soundTrackId === id) stopSoundTrack();
      if (soundLastAmbientId === id) {
        soundLastAmbientId = '';
        saveSoundPrefs();
      }
      stopLoopFx(id, true);
      if (soundPlayers[id]) {
        cancelSoundFade(soundPlayers[id]);
        try { soundPlayers[id].pause(); } catch (err) {}
        delete soundPlayers[id];
      }
      const rec = soundUserClips.find(c => c.id === id);
      if (rec && rec.url) try { URL.revokeObjectURL(rec.url); } catch (err) {}
      soundUserClips = soundUserClips.filter(c => c.id !== id);
      const favI = soundFavorites.indexOf(id);
      if (favI >= 0) {
        soundFavorites.splice(favI, 1);
        saveSoundPrefs();
      }
      try {
        const db = await openSoundDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction('clips', 'readwrite');
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          tx.objectStore('clips').delete(id);
        });
        db.close();
      } catch (err) {}
      syncSoundUi();
    }

    function toggleSoundFavorite(id) {
      const i = soundFavorites.indexOf(id);
      if (i >= 0) soundFavorites.splice(i, 1);
      else {
        if (soundFavorites.length >= SOUND_FAV_MAX) {
          toast('Höchstens ' + SOUND_FAV_MAX + ' Favoriten. Erst einen Stern entfernen.');
          return;
        }
        soundFavorites.push(id);
      }
      saveSoundPrefs();
      renderSoundFxButtons();
      if (soundPickOpen()) renderSoundPickList();
    }

    function collectSoundPickItems() {
      const items = [];
      if (soundPickKind === 'ambiente') {
        Object.keys(SOUND_TRACKS).forEach(id => {
          items.push({
            id: id,
            name: SOUND_TRACKS[id].name,
            group: SOUND_TRACKS[id].group,
            custom: false,
            loop: true
          });
        });
        soundUserClips.filter(c => c.kind === 'ambiente').forEach(c => {
          items.push({ id: c.id, name: c.name, group: c.group, custom: true, loop: true });
        });
      } else {
        SOUND_FX.forEach(fx => items.push({
          id: fx.id,
          name: fx.name,
          group: soundGroupId(fx.group),
          custom: false,
          loop: !!fx.loop
        }));
        soundUserClips.filter(c => c.kind === 'fx').forEach(c => {
          items.push({ id: c.id, name: c.name, group: c.group, custom: true, loop: !!c.loop });
        });
      }
      if (soundPickKind === 'ambiente' && soundGroupFilter !== 'all') {
        return items.filter(item => item.group === soundGroupFilter);
      }
      return items;
    }

    function renderSoundPickList() {
      const list = document.getElementById('soundPickList');
      if (!list) return;
      list.innerHTML = '';
      const items = collectSoundPickItems();
      if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'sound-pick-hint';
        empty.style.gridColumn = '1 / -1';
        empty.textContent = soundPickKind === 'fx'
          ? 'Noch keine Effekte.'
          : (soundGroupFilter === 'all' ? 'Noch kein Ambiente.' : 'Keine Klänge in dieser Gruppe.');
        list.appendChild(empty);
        return;
      }
      items.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'sound-pick-item';
        const btn = document.createElement('button');
        btn.type = 'button';
        const activeAmb = soundPickKind === 'ambiente' && (soundTrackId === item.id || (!isSoundPlaying() && !soundPaused && soundLastAmbientId === item.id));
        const playingAmb = soundPickKind === 'ambiente' && soundTrackId === item.id && isSoundPlaying();
        const loopingFx = soundPickKind === 'fx' && !!soundLoopFx[item.id];
        btn.className = 'sound-pick-play ' + (playingAmb || loopingFx ? 'primary' : 'ghost');
        btn.textContent = item.loop && soundPickKind === 'fx' ? item.name + ' · Loop' : item.name;
        if (activeAmb && !playingAmb) btn.title = soundPaused ? 'Pausiert' : 'Zuletzt gewählt';
        btn.onclick = () => {
          if (soundPickKind === 'fx') playSoundFx(item.id);
          else playSoundTrack(item.id);
        };
        wrap.appendChild(btn);
        if (soundPickKind === 'fx') {
          const star = document.createElement('button');
          star.type = 'button';
          star.className = 'ghost sound-pick-star';
          const fav = soundFavorites.indexOf(item.id) >= 0;
          star.textContent = fav ? '★' : '☆';
          star.title = fav ? 'Favorit entfernen' : 'In die Leiste';
          star.onclick = () => toggleSoundFavorite(item.id);
          wrap.appendChild(star);
        }
        if (item.custom) {
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'ghost sound-pick-del';
          del.title = 'Entfernen';
          del.textContent = '×';
          del.onclick = () => deleteSoundUserClip(item.id);
          wrap.appendChild(del);
        }
        list.appendChild(wrap);
      });
    }

    function renderSoundFxButtons() {
      const row = document.getElementById('soundFavRow');
      if (!row) return;
      pruneSoundFavorites();
      row.innerHTML = '';
      if (!soundFavorites.length) {
        row.classList.add('hidden');
        return;
      }
      row.classList.remove('hidden');
      soundFavorites.forEach(id => {
        const rec = soundUserClips.find(c => c.id === id) || SOUND_FX.find(fx => fx.id === id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = soundLoopFx[id] ? 'primary' : 'ghost';
        btn.textContent = rec ? rec.name : id;
        btn.title = rec && rec.loop ? 'Loop an/aus' : 'Effekt';
        btn.onclick = () => playSoundFx(id);
        row.appendChild(btn);
      });
    }

    function bufToB64(buf) {
      const bytes = new Uint8Array(buf);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(binary);
    }

    function b64ToBlob(b64, mime) {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime || 'audio/mpeg' });
    }

    async function exportSoundLibrary() {
      try {
        const rows = await soundDbAll();
        if (!rows.length) return toast('Keine eigenen Klänge zum Sichern.');
        const clips = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row.blob) continue;
          const buf = await row.blob.arrayBuffer();
          clips.push({
            id: row.id,
            kind: row.kind === 'fx' ? 'fx' : 'ambiente',
            name: row.name || 'Klang',
            group: soundGroupId(row.group),
            loop: row.kind === 'fx' && !!row.loop,
            mime: row.blob.type || 'audio/mpeg',
            data: bufToB64(buf)
          });
        }
        const payload = { v: 1, clips: clips, favorites: soundFavorites };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'thalarion-klaenge.json';
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 1500);
        toast(clips.length + (clips.length === 1 ? ' Klang gesichert.' : ' Klänge gesichert.'));
      } catch (err) {
        toast('Sichern ist fehlgeschlagen.');
      }
    }

    async function importSoundLibrary(file) {
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const clips = data && Array.isArray(data.clips) ? data.clips : null;
        if (!clips || !clips.length) return toast('Keine Klänge in der Datei.');
        let n = 0;
        for (let i = 0; i < clips.length; i++) {
          const clip = clips[i];
          if (!clip || !clip.data) continue;
          const blob = b64ToBlob(String(clip.data), clip.mime);
          await soundDbPut({
            id: typeof clip.id === 'string' && clip.id ? clip.id : ('user_' + Date.now().toString(36) + '_' + i),
            kind: clip.kind === 'fx' ? 'fx' : 'ambiente',
            name: String(clip.name || 'Klang').slice(0, 80),
            group: soundGroupId(clip.group),
            loop: clip.kind === 'fx' && !!clip.loop,
            blob: blob
          });
          n += 1;
        }
        if (Array.isArray(data.favorites)) {
          soundFavorites = data.favorites.filter(id => typeof id === 'string').slice(0, SOUND_FAV_MAX);
          saveSoundPrefs();
        }
        await loadSoundUserClips();
        syncSoundUi();
        toast(n + (n === 1 ? ' Klang geladen.' : ' Klänge geladen.'));
      } catch (err) {
        toast('Datei konnte nicht geladen werden.');
      }
    }

    async function addSoundFromFile(file) {
      if (!file) return;
      const nameEl = document.getElementById('soundAddName');
      let name = nameEl && nameEl.value.trim();
      if (!name) {
        const typed = window.prompt('Name für diesen Klang:', soundClipName(file));
        if (typed == null) return;
        name = typed.trim() || soundClipName(file);
      }
      const groupEl = document.getElementById('soundAddGroup');
      const loopEl = document.getElementById('soundAddLoop');
      const group = (soundGroupFilter !== 'all')
        ? soundGroupFilter
        : ((groupEl && groupEl.value) || 'reise');
      try {
        await saveSoundUserClip(soundPickKind, file, {
          name: name,
          group: group,
          loop: !!(loopEl && loopEl.checked)
        });
        if (nameEl) nameEl.value = '';
        if (loopEl) loopEl.checked = false;
        renderSoundPickList();
        toast((soundPickKind === 'fx' ? 'Effekt' : 'Ambiente') + ' „' + name + '“ gespeichert.');
      } catch (err) {
        toast('Datei konnte nicht gespeichert werden.');
      }
    }
