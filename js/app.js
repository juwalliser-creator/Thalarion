    var db = null;
    var worldUpdatedAt = 0;
    var mapUpdatedAt = 0;
    var mapPins = [];
    var mapBorders = [];
    var mapPinsUpdatedAt = 0;
    var writingPins = false;
    var placingPin = false;
    var pendingPin = null;
    var selectedPinKind = 'ort';
    var drawingBorder = false;
    var borderDraft = [];
    var editingPinId = null;
    var editingBorderId = null;
    var mapScale = 1;
    var mapPanX = 0;
    var mapPanY = 0;
    var mapDrag = null;
    var mapViewMemo = null;
    var openedFromMap = false;
    var localStorageOk = true;
    var searchHitIndex = -1;
    var writingRemote = false;
    var writingMap = false;
    var storageAvailable = true;
    var cloudDiagLog = [];
    var entries = [];
    var currentIndex = null;
    var currentTitle = null;
    var isDM = false;
    var expandedCategories = {};
    var currentPage = 'map';
    var selectedHomeCat = null;
    var titleKingdomFilter = '';
    var dirty = false;
    var imageCache = {};
    var pendingEntryImage = null;
    var editorImageId = '';
    var viewImageToken = 0;
    var editorImageToken = 0;
    var ocrBusy = false;
    var ocrWorkerPromise = null;
    var sheetDirty = false;
    var playerAccounts = {};
    var npcAccounts = {};
    var dmNotes = '';
    var playersUpdatedAt = 0;
    var writingPlayers = false;
    var rosterCards = [];
    var rosterUpdatedAt = 0;
    var writingRoster = false;
    var combatTemplates = [];
    var templatesUpdatedAt = 0;
    var writingTemplates = false;
    var templatesPersistTimer = null;
    var editingKarteId = null;
    var currentPlayerId = null;
    var currentSheetOwner = null;
    var chatThreads = {};
    var chatUnsubs = {};
    var chatOpen = false;
    var chatActiveId = null;
    var writingChat = {};
    var veyrEntryEditing = false;
    var pendingVeyrImage = null;
    var veyrImageToken = 0;
    var playerFormMode = 'login';
    var combat = { round: 1, started: false, activeId: null, debuffTick: 'turn', turnAt: 0, combatants: [], removed: {}, log: [], logResetAt: 0, updatedAt: 0 };
    var writingCombat = false;
    var combatWriteQueued = false;
    var pendingCombatSnap = null;
    var combatPersistTimer = null;
    var soundPlayers = {};
    var soundFadeRafs = new Map();
    var soundLoopFx = {};
    var soundFxShots = [];
    var soundMusic = null;
    var soundPlayGen = 0;
    var soundTrackId = '';
    var soundLastAmbientId = '';
    var soundPaused = false;
    var soundVolAmb = 0.55;
    var soundVolFx = 0.7;
    var soundDuckUntil = 0;
    var soundUnlocked = false;
    var soundDockOpen = false;
    var diceTrayOpen = false;
    var diceLogOpen = false;
    var diceAnimMode = 'on';
    var diceLog = [];
    var diceQueue = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
    var soundPickKind = 'ambiente';
    var soundGroupFilter = 'all';
    var soundFavorites = [];
    var soundUserClips = [];
    var kampfAimFrom = '';
    var kampfAimTo = '';
    var kampfAimTargets = [];
    var kampfAimEffect = '';
    var kampfPowerAction = null;
    var kampfPowerPhase = '';
    var kampfPowerRenderKey = '';
    var sheetPortraitId = '';
    var pendingSheetPortrait = null;
    var kartePortraitId = '';
    var pendingKartePortrait = null;
    var battle = { image: '', tokens: [], hazards: [], fogOn: false, fogReveals: [], ping: null, tokenSize: 48, gridSize: 1, gridFrac: 0, updatedAt: 0, mapUpdatedAt: 0, layoutAt: 0, removedTokens: {}, removedHazards: {}, removedFog: {} };
    var writingBattle = false;
    var battleWriteQueued = false;
    var pendingBattleSnap = null;
    var writingBattleMap = false;
    var battleGalleryMaps = [];
    var battleGalleryUpdatedAt = 0;
    var writingBattleGallery = false;
    var battlePersistTimer = null;
    var battleHazardMode = null;
    var battleMapTool = null;
    var battleDraft = [];
    var battleRulerFrom = null;
    var battleRulerTo = null;
    var battleRulerHover = null;
    var lastBattlePingAt = 0;
    var playersPersistTimer = null;
    var battleTokenDrag = null;
    var battleTokenDragMoved = false;
    var battleScale = 1;
    var battlePanX = 0;
    var battlePanY = 0;
    var battlePan = null;
    var battleGridMetricsCache = null;
    var battleLinkPinnedId = '';
    var battleLinkHoverId = '';

    var els = {
      sidebar: document.getElementById('sidebar'),
      homeView: document.getElementById('homeView'),
      homeCards: document.getElementById('homeCards'),
      viewer: document.getElementById('viewer'),
      editorView: document.getElementById('editorView'),
      mapView: document.getElementById('mapView'),
      entstehungView: document.getElementById('entstehungView'),
      entstehungText: document.getElementById('entstehungText'),
      dmButton: document.getElementById('dmButton'),
      loginOverlay: document.getElementById('loginOverlay'),
      loginForm: document.getElementById('loginForm'),
      dmUser: document.getElementById('dmUser'),
      dmPassword: document.getElementById('dmPassword'),
      loginError: document.getElementById('loginError'),
      toast: document.getElementById('toast'),
      title: document.getElementById('title'),
      type: document.getElementById('type'),
      visibility: document.getElementById('visibility'),
      content: document.getElementById('content'),
      editorHeading: document.getElementById('editorHeading'),
      playerToEdit: document.getElementById('playerToEdit'),
      navWorld: document.getElementById('navWorld'),
      navEntstehung: document.getElementById('navEntstehung'),
      dmMenuSitzung: document.getElementById('dmMenuSitzung'),
      navMap: document.getElementById('navMap'),
      navCharakter: document.getElementById('navCharakter'),
      navKampf: document.getElementById('navKampf'),
      charView: document.getElementById('charView'),
      kampfView: document.getElementById('kampfView'),
      sitzungView: document.getElementById('sitzungView')
    };

    function parseWorldPayload(data) {
      if (!data) return null;
      if (Array.isArray(data)) {
        return { entries: normalizeEntries(data), updatedAt: 0, legacy: true };
      }
      if (Array.isArray(data.entries)) {
        return {
          entries: normalizeEntries(data.entries),
          updatedAt: Number(data.updatedAt) || 0,
          legacy: false
        };
      }
      return null;
    }

    function readLocalPack() {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      try {
        return parseWorldPayload(JSON.parse(raw));
      } catch {
        return null;
      }
    }

    function initFirebase() {
      if (!window.firebase || !window.FIREBASE_CONFIG) return false;
      if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      db = firebase.firestore();
      return true;
    }

    function templatesRef() {
      return db.collection('world').doc(TEMPLATES_DOC);
    }

    function cloudDiag(step, detail) {
      const line = { t: Date.now(), step: step, detail: detail || '' };
      cloudDiagLog.push(line);
      if (cloudDiagLog.length > 40) cloudDiagLog.shift();
      console.warn('[Thalarion]', step, detail || '');
      window.thalarionDiag = cloudDiagLog.slice();
    }

    function withTimeout(promise, ms) {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
      ]);
    }

    async function cloudWait(label, promise, ms) {
      const t0 = Date.now();
      try {
        const val = await withTimeout(promise, ms);
        cloudDiag(label + ' ok', (Date.now() - t0) + 'ms');
        return val;
      } catch (err) {
        cloudDiag(label + ' fail', (err && err.message ? err.message : err) + ' nach ' + (Date.now() - t0) + 'ms');
        throw err;
      }
    }

    async function storeCloudImage(id, dataUrl) {
      if (!dataUrl) return '';
      if (/^https?:\/\//i.test(dataUrl)) return dataUrl;
      if (!storageAvailable || !window.firebase || !firebase.storage) return dataUrl;
      try {
        const mime = (dataUrl.match(/^data:([^;,]+)/) || [])[1] || 'image/jpeg';
        const ref = firebase.storage().ref().child('images/' + id);
        await cloudWait('storage.put ' + id, ref.putString(dataUrl, 'data_url', { contentType: mime }), 5000);
        return await cloudWait('storage.url ' + id, ref.getDownloadURL(), 4000);
      } catch (err) {
        storageAvailable = false;
        cloudDiag('storage off', 'Bilder bleiben in Firestore');
        return dataUrl;
      }
    }

    async function deleteCloudImage(id) {
      if (!id) return;
      const cached = imageCache[id];
      if (cached && /^data:/i.test(cached)) return;
      if (!storageAvailable || !window.firebase || !firebase.storage) return;
      try {
        await cloudWait('storage.del ' + id, firebase.storage().ref().child('images/' + id).delete(), 4000);
      } catch (err) {
        storageAvailable = false;
      }
    }

    function worldRef() {
      return db.collection('world').doc(WORLD_DOC);
    }

    function mapRef() {
      return db.collection('world').doc('map');
    }

    function pinsRef() {
      return db.collection('world').doc('mapPins');
    }

    function playersRef() {
      return db.collection('world').doc(PLAYERS_DOC);
    }

    function chatRef(playerId) {
      return db.collection('world').doc('chat-' + playerId);
    }

    function rosterRef() {
      return db.collection('world').doc(ROSTER_DOC);
    }

    function battleRef() {
      return db.collection('world').doc(BATTLE_DOC);
    }

    function battleMapRef() {
      return db.collection('world').doc(BATTLE_MAP_DOC);
    }

    function battleGalleryRef() {
      return db.collection('world').doc(BATTLE_GALLERY_DOC);
    }

    function combatRef() {
      return db.collection('world').doc(COMBAT_DOC);
    }

    function diceLogRef() {
      return db.collection('world').doc(DICE_LOG_DOC);
    }

    function imageRef(id) {
      return db.collection('world').doc(id);
    }

    function newImageId() {
      return 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function fileToEntryImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          let w = img.width;
          let h = img.height;
          const maxSide = 2000;
          if (Math.max(w, h) > maxSide) {
            const scale = maxSide / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          let quality = 0.88;
          let data = canvas.toDataURL('image/jpeg', quality);
          while (data.length > 700000 && quality > 0.5) {
            quality -= 0.08;
            data = canvas.toDataURL('image/jpeg', quality);
          }
          if (data.length > 900000) reject(new Error('Das Bild ist zu groß. Bitte ein kleineres wählen.'));
          else resolve(data);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Das Bild konnte nicht gelesen werden.'));
        };
        img.src = url;
      });
    }

    function fileToPortraitImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const side = Math.min(img.width, img.height);
          if (!side) {
            reject(new Error('Das Bild konnte nicht gelesen werden.'));
            return;
          }
          const sx = Math.round((img.width - side) / 2);
          const sy = img.height >= img.width ? 0 : Math.round((img.height - side) / 2);
          const out = 280;
          const canvas = document.createElement('canvas');
          canvas.width = out;
          canvas.height = out;
          canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, out, out);
          let quality = 0.82;
          let data = canvas.toDataURL('image/jpeg', quality);
          while (data.length > 70000 && quality > 0.4) {
            quality -= 0.1;
            data = canvas.toDataURL('image/jpeg', quality);
          }
          if (data.length > 100000) reject(new Error('Das Portrait ist zu groß. Bitte ein kleineres Bild wählen.'));
          else resolve(data);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Das Bild konnte nicht gelesen werden.'));
        };
        img.src = url;
      });
    }

    async function loadEntryImage(imageId) {
      if (!imageId) return null;
      if (imageCache[imageId]) return imageCache[imageId];
      if (!db) return null;
      const snap = await imageRef(imageId).get();
      if (!snap.exists) return null;
      const data = snap.data().image;
      if (data) imageCache[imageId] = data;
      return data || null;
    }

    async function persistEntryImage(imageId, dataUrl) {
      if (!db) throw new Error('Keine Verbindung zur Cloud.');
      const stored = await storeCloudImage(imageId, dataUrl);
      await cloudWait('image.set ' + imageId, imageRef(imageId).set({ image: stored, updatedAt: Date.now() }), 12000);
      imageCache[imageId] = stored;
    }

    async function deleteEntryImage(imageId) {
      if (!imageId || !db) return;
      try { await deleteCloudImage(imageId); } catch (err) {}
      try { await withTimeout(imageRef(imageId).delete(), 8000); } catch (err) {}
      delete imageCache[imageId];
    }

    function setEditorImagePreview(src) {
      const wrap = document.getElementById('entryImagePreview');
      const img = document.getElementById('entryImagePreviewImg');
      const removeBtn = document.getElementById('removeEntryImageBtn');
      const ocrBtn = document.getElementById('ocrEntryImageBtn');
      if (!src) {
        wrap.classList.add('hidden');
        img.removeAttribute('src');
        removeBtn.classList.add('hidden');
        if (ocrBtn) ocrBtn.classList.add('hidden');
        return;
      }
      img.src = src;
      wrap.classList.remove('hidden');
      removeBtn.classList.remove('hidden');
      if (ocrBtn) ocrBtn.classList.remove('hidden');
    }

    function setImageFold(fold, wrap, img, imageId, title) {
      if (fold) {
        fold.open = false;
        fold.classList.toggle('hidden', !imageId);
      }
      if (!imageId) {
        if (wrap) wrap.classList.add('hidden');
        if (img) img.removeAttribute('src');
        return false;
      }
      if (wrap) wrap.classList.remove('hidden');
      if (img) img.alt = title || '';
      return true;
    }

    function showViewImage(imageId, title) {
      const fold = document.getElementById('viewImageFold');
      const wrap = document.getElementById('viewImageWrap');
      const img = document.getElementById('viewImage');
      const token = ++viewImageToken;
      if (!setImageFold(fold, wrap, img, imageId, title)) return;
      if (imageCache[imageId]) {
        img.src = imageCache[imageId];
        return;
      }
      img.removeAttribute('src');
      loadEntryImage(imageId).then(data => {
        if (token !== viewImageToken) return;
        if (!data) {
          if (fold) fold.classList.add('hidden');
          wrap.classList.add('hidden');
          return;
        }
        img.src = data;
      }).catch(() => {
        if (token !== viewImageToken) return;
        if (fold) fold.classList.add('hidden');
        wrap.classList.add('hidden');
      });
    }

    function attachEntryImage(parent, imageId, alt) {
      if (!imageId) return;
      const fold = document.createElement('details');
      fold.className = 'entry-image-fold';
      const sum = document.createElement('summary');
      sum.textContent = 'Bild anzeigen';
      const wrap = document.createElement('div');
      wrap.className = 'entry-image-wrap';
      const img = document.createElement('img');
      img.alt = alt || '';
      wrap.appendChild(img);
      fold.appendChild(sum);
      fold.appendChild(wrap);
      parent.appendChild(fold);
      if (imageCache[imageId]) {
        img.src = imageCache[imageId];
        return;
      }
      loadEntryImage(imageId).then(data => {
        if (!data) {
          fold.remove();
          return;
        }
        img.src = data;
      }).catch(() => fold.remove());
    }

    function entryBodyHtml(e) {
      const hasText = htmlToText(e.content || '').trim();
      if (hasText) return sanitizeHtml(e.content);
      if (e.imageId) return '';
      return '<p><em>Noch kein Text.</em></p>';
    }

    function indexByTitle(title) {
      if (!title) return null;
      const i = entries.findIndex(e => e.title === title);
      return i < 0 ? null : i;
    }

    function refreshOpenView() {
      if (currentPage === 'map') {
        renderMapPins();
        renderSidebar();
        return;
      }
      if (currentPage === 'char') {
        renderCharakter();
        return;
      }
      if (currentPage === 'kampf') {
        renderKampf();
        return;
      }
      const i = indexByTitle(currentTitle);
      currentIndex = i;
      if (i !== null && !dirty) loadEntry(i);
      else if (currentPage === 'entstehung') showEntstehung();
      else if (currentPage === 'sitzung') showSitzung();
      else if (currentTitle && i === null) showCatalog(currentPage);
      else {
        renderHome();
        renderSidebar();
      }
    }

    function applyRemote(data) {
      const pack = parseWorldPayload(data);
      if (!pack) return;
      const at = pack.updatedAt;
      if (at <= worldUpdatedAt) return;
      if (dirty) {
        toast('Ein anderer Laptop hat gespeichert. Erst Speichern oder Abbrechen, dann erscheint der neue Stand.');
        return;
      }
      worldUpdatedAt = at;
      entries = pack.entries || [];
      persistLocal();
      refreshOpenView();
    }

    async function persistWorld() {
      if (!db) throw new Error('Keine Verbindung zur Cloud.');
      const nextAt = Date.now();
      writingRemote = true;
      try {
        await cloudWait('world.set', worldRef().set({
          updatedAt: nextAt,
          entries: entries
        }), 15000);
        worldUpdatedAt = nextAt;
        persistLocal();
      } finally {
        writingRemote = false;
      }
    }

    function listenWorld() {
      if (!db) return;
      worldRef().onSnapshot(snap => {
        if (writingRemote || !snap.exists) return;
        applyRemote(snap.data());
      }, () => {
        toast('Keine Verbindung zur Cloud.');
      });
    }

    function loadTesseract() {
      if (window.Tesseract) return Promise.resolve(window.Tesseract);
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Tesseract fehlt.'));
        s.onerror = () => reject(new Error('Texterkennung konnte nicht geladen werden. Bitte Internet prüfen.'));
        document.head.appendChild(s);
      });
    }

    function getOcrWorker() {
      if (ocrWorkerPromise) return ocrWorkerPromise;
      ocrWorkerPromise = loadTesseract().then(async T => {
        const worker = await T.createWorker('eng');
        try {
          await worker.setParameters({ tessedit_pageseg_mode: '6' });
        } catch (err) {}
        return worker;
      }).catch(err => {
        ocrWorkerPromise = null;
        throw err;
      });
      return ocrWorkerPromise;
    }

    async function recognizeStatSheetCanvas(canvas, psm) {
      const worker = await getOcrWorker();
      try {
        await worker.setParameters({ tessedit_pageseg_mode: String(psm == null ? 6 : psm) });
      } catch (err) {}
      return worker.recognize(canvas);
    }

    function prepareStatSheetForOcr(src, mode) {
      const binary = mode === 'binary';
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const scale = Math.max(2.6, 2200 / Math.max(img.width, 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pix = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = pix.data;
          let min = 255;
          let max = 0;
          for (let i = 0; i < d.length; i += 4) {
            const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
            if (g < min) min = g;
            if (g > max) max = g;
          }
          const span = Math.max(1, max - min);
          for (let i = 0; i < d.length; i += 4) {
            const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
            let stretched = ((g - min) / span) * 255;
            stretched = Math.pow(stretched / 255, 1.12) * 255;
            const v = binary ? (stretched < 148 ? 0 : 255) : stretched;
            d[i] = d[i + 1] = d[i + 2] = v;
          }
          ctx.putImageData(pix, 0, 0);
          resolve(canvas);
        };
        img.onerror = () => reject(new Error('Das Stat-Sheet konnte nicht gelesen werden.'));
        img.src = src;
      });
    }

    function scrubStatOcrNoise(text) {
      return String(text || '')
        .replace(/\[\s*\d+\s*\]/g, ' ')
        .replace(/\(\s*po[il1]nt(?:er|or)?\s*\)/gi, ' ')
        .replace(/(^|\s)pointer(?=\s|$)/gi, '$1')
        .replace(/\bSRD\s*5(?:\.\d+)?\b/gi, ' ')
        .replace(/\bOGL\b/g, ' ')
        .replace(/\bCC-BY(?:-SA)?(?:-\d+(?:\.\d+)?)?\b/gi, ' ')
        .replace(/\b5e\.?tools\b/gi, ' ')
        .replace(/\(\s*\)/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/ +\./g, '.')
        .trim();
    }

    function isOcrJunkWord(text) {
      const t = String(text || '').trim();
      if (!t) return true;
      if (/^(\[\s*\d+\s*\])+$/.test(t)) return true;
      if (/^\(\s*po[il1]nt(?:er|or)?\s*\)$/i.test(t)) return true;
      if (/^pointer$/i.test(t)) return true;
      if (/^(SRD5|OGL|CC-BY)/i.test(t)) return true;
      return false;
    }

    function pickStatLine(text, re) {
      const m = String(text || '').match(re);
      return m ? scrubStatOcrNoise(m[1].replace(/\s+/g, ' ')) : '';
    }

    function abilityModFromScore(n) {
      const m = Math.floor((Number(n) - 10) / 2);
      return (m >= 0 ? '+' : '') + m;
    }

    function formatAbility(score, mod) {
      const n = String(score || '').replace(/\D/g, '');
      if (!n) return '';
      let m = String(mod || '').replace(/[−–—]/g, '-').replace(/[^+\-\d]/g, '');
      if (!/^[+-]\d+$/.test(m)) m = abilityModFromScore(n);
      return n + ' (' + m + ')';
    }

    function fuzzyAbilityKey(raw) {
      let t = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (t.length < 2 || t.length > 5) return '';
      t = t.replace(/0/g, 'O').replace(/1/g, 'I').replace(/5/g, 'S').replace(/7/g, 'T');
      if (t === 'STR' || t === 'ST' || t === 'STRR' || t === 'SFR') return 'STR';
      if (t === 'DEX' || t === 'DFX' || t === 'DEK' || t === 'DX' || t === 'DEC') return 'DEX';
      if (t === 'CON' || t === 'CDN' || t === 'COM' || t === 'CN' || t === 'CQN') return 'CON';
      if (t === 'INT' || t === 'INTT' || t === 'IN' || t === 'LNT') return 'INT';
      if (t === 'WIS' || t === 'WS' || t === 'VIS' || t === 'WLS' || t === 'WlS') return 'WIS';
      if (t === 'CHA' || t === 'CH' || t === 'CNA' || t === 'CHAR' || t === 'GHA') return 'CHA';
      return '';
    }

    function ocrWordsFromData(data) {
      const raw = (data && Array.isArray(data.words) && data.words.length)
        ? data.words
        : ((data && data.lines) || []).reduce((out, line) => out.concat(line.words || []), []);
      return raw.filter(w => !isOcrJunkWord(w && w.text));
    }

    function normalizeOcrNumText(text) {
      return String(text || '')
        .replace(/[−–—]/g, '-')
        .replace(/＋/g, '+')
        .replace(/[Il|]/g, '1')
        .replace(/O/g, '0');
    }

    function parseScoreToken(text) {
      const t = normalizeOcrNumText(text).trim();
      const both = t.match(/^(\d{1,2})\s*[\(\[]?\s*([+-]\s*\d+)\s*[\)\]]?$/);
      if (both) return { score: both[1], mod: both[2].replace(/\s+/g, '') };
      const score = t.match(/^(\d{1,2})$/);
      if (score && Number(score[1]) >= 1 && Number(score[1]) <= 30) return { score: score[1], mod: '' };
      const mod = t.match(/^[(\[]?\s*([+-]\s*\d+)\s*[\)\]]?$/);
      if (mod) return { score: '', mod: mod[1].replace(/\s+/g, '') };
      return null;
    }

    function splitScoreTokens(text) {
      const t = normalizeOcrNumText(text);
      const out = [];
      const re = /(\d{1,2})\s*(?:[\(\[]\s*)?([+-]\s*\d+)?(?:\s*[\)\]])?/g;
      let m;
      while ((m = re.exec(t))) {
        const n = Number(m[1]);
        if (n < 1 || n > 30) continue;
        out.push({ score: m[1], mod: m[2] ? m[2].replace(/\s+/g, '') : '' });
      }
      if (out.length) return out;
      const tok = parseScoreToken(t);
      return tok ? [tok] : [];
    }

    function abilityCount(abs) {
      return ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].filter(k => abs && abs[k]).length;
    }

    function mergeAbilities(into, extra) {
      const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
      keys.forEach(k => {
        if (!extra || !extra[k]) return;
        if (!into[k] || (extra[k].indexOf('(') >= 0 && into[k].indexOf('(') < 0)) into[k] = extra[k];
      });
      return into;
    }

    function parseAbilitiesFromWords(words) {
      const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
      const items = (words || []).map(w => {
        const box = w.bbox || {};
        return {
          text: String(w.text || '').trim(),
          x: ((box.x0 || 0) + (box.x1 || 0)) / 2,
          y: ((box.y0 || 0) + (box.y1 || 0)) / 2,
          x0: box.x0 || 0,
          x1: box.x1 || 0,
          y0: box.y0 || 0,
          y1: box.y1 || 0
        };
      }).filter(w => w.text);
      const labels = [];
      items.forEach(w => {
        const key = fuzzyAbilityKey(w.text);
        if (key) labels.push(Object.assign({ key: key }, w));
      });
      if (labels.length < 4) return {};
      const rows = [];
      labels.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach(lab => {
        const row = rows.find(r => Math.abs(r.y - lab.y) <= Math.max(20, (lab.y1 - lab.y0) * 0.9));
        if (!row) {
          rows.push({ y: lab.y, labs: [lab] });
          return;
        }
        if (!row.labs.some(l => l.key === lab.key)) row.labs.push(lab);
        row.y = row.labs.reduce((s, l) => s + l.y, 0) / row.labs.length;
      });
      rows.sort((a, b) => b.labs.length - a.labs.length);
      const best = rows[0];
      if (!best || best.labs.length < 4) return {};
      best.labs.sort((a, b) => a.x - b.x);
      const y0 = Math.min.apply(null, best.labs.map(l => l.y0));
      const y1 = Math.max.apply(null, best.labs.map(l => l.y1));
      const h = Math.max(16, y1 - y0);
      const stop = items.find(w =>
        w.y > y1 + h * 0.4 &&
        /^(Saving|Skills|Damage|Senses|Languages|Challenge|Vulnerab|Immunit|Resist|Gear|Tools|Equipment|Proficiency)/i.test(w.text)
      );
      const bandBottom = Math.min(y1 + h * 5.6, stop ? stop.y0 - 2 : y1 + h * 5.6);
      const bandWords = items.filter(w =>
        w.y >= y0 - 6 &&
        w.y <= bandBottom &&
        !fuzzyAbilityKey(w.text)
      );
      const placed = [];
      bandWords.forEach(w => {
        const toks = splitScoreTokens(w.text);
        if (!toks.length) return;
        if (toks.length === 1) {
          placed.push(Object.assign({}, toks[0], { x: w.x, y: w.y }));
          return;
        }
        const span = Math.max(1, w.x1 - w.x0);
        toks.forEach((tok, i) => {
          placed.push(Object.assign({}, tok, {
            x: w.x0 + span * (i + 0.5) / toks.length,
            y: w.y
          }));
        });
      });
      const out = {};
      best.labs.forEach((lab, i) => {
        const prev = best.labs[i - 1];
        const next = best.labs[i + 1];
        const left = prev ? (prev.x + lab.x) / 2 : lab.x0 - Math.max(24, lab.x1 - lab.x0);
        const right = next ? (lab.x + next.x) / 2 : lab.x1 + Math.max(24, lab.x1 - lab.x0);
        const nearby = placed.filter(t => t.x >= left && t.x < right).sort((a, b) => a.y - b.y || a.x - b.x);
        let score = '';
        let mod = '';
        nearby.forEach(tok => {
          if (tok.score && !score) score = tok.score;
          if (tok.mod && !mod) mod = tok.mod;
        });
        if (score) out[lab.key] = formatAbility(score, mod);
      });
      const seq = placed.filter(t => t.score).sort((a, b) => a.x - b.x || a.y - b.y);
      if (seq.length >= 4 && (abilityCount(out) < 6 || seq.length === 6)) {
        keys.forEach((k, i) => {
          if (seq[i] && seq[i].score) {
            if (!out[k] || seq.length === 6) out[k] = formatAbility(seq[i].score, seq[i].mod);
          }
        });
      }
      return out;
    }

    function fillAbilitiesFromText(text, out) {
      const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
      const norm = String(text || '')
        .replace(/[−–—]/g, '-')
        .replace(/[|\[\]]/g, ' ');
      keys.forEach(k => {
        if (out[k]) return;
        const re = new RegExp('\\b' + k + '\\b[ \\t]*(\\d{1,2})[ \\t]*(?:[\\(\\[]\\s*)?([+-]\\s*\\d+)?', 'i');
        const m = norm.match(re);
        if (m && m[1]) out[k] = formatAbility(m[1], m[2] || '');
      });
      if (keys.every(k => out[k])) return out;
      const lines = norm.split(/\n/).map(l => l.trim()).filter(Boolean);
      const headerIdx = lines.findIndex(l => {
        const found = keys.filter(k => new RegExp('\\b' + k + '\\b', 'i').test(l));
        return found.length >= 4;
      });
      if (headerIdx >= 0) {
        const headerLine = lines[headerIdx];
        const headerHasScores = /(\d{1,2})\s*(?:[\(\[]\s*)?[+-]\s*\d+/.test(headerLine);
        const chunk = (headerHasScores ? lines.slice(headerIdx, headerIdx + 8) : lines.slice(headerIdx + 1, headerIdx + 12)).join(' ');
        const pairs = [...chunk.matchAll(/(\d{1,2})\s*(?:[\(\[]\s*)?([+-]\s*\d+)(?:\s*[\)\]])?/g)].slice(0, 6);
        if (pairs.length >= 4) {
          keys.forEach((k, i) => {
            if (!out[k] && pairs[i]) out[k] = formatAbility(pairs[i][1], pairs[i][2]);
          });
        } else {
          const nums = [...chunk.matchAll(/\b(\d{1,2})\b/g)]
            .map(m => m[1])
            .filter(n => Number(n) >= 1 && Number(n) <= 30)
            .slice(0, 6);
          const mods = [...chunk.matchAll(/([+-]\s*\d+)\b/g)].map(m => m[1].replace(/\s+/g, '')).slice(0, 6);
          if (nums.length >= 4) {
            keys.forEach((k, i) => {
              if (!out[k] && nums[i]) out[k] = formatAbility(nums[i], mods[i] || '');
            });
          }
        }
      }
      if (abilityCount(out) >= 4) return out;
      const pairs = [...norm.matchAll(/(\d{1,2})\s*\(\s*([+-]\s*\d+)\s*\)/g)].slice(0, 6);
      if (pairs.length === 6) {
        keys.forEach((k, i) => {
          if (!out[k]) out[k] = formatAbility(pairs[i][1], pairs[i][2]);
        });
      }
      return out;
    }

    function parseStatAbilities(text, words) {
      const out = parseAbilitiesFromWords(words);
      return fillAbilitiesFromText(text, out);
    }

    function parseStatSheetText(raw, words, seededAbs) {
      const text = scrubStatOcrNoise(String(raw || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[|]+/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n'));
      const lines = text.split(/\n/).map(l => scrubStatOcrNoise(l)).filter(Boolean)
        .filter(l => !/SRD5|OGL|CC-BY/i.test(l) && !/^pointer$/i.test(l));
      const joined = lines.join('\n');
      const sizeRe = /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/i;
      const name = lines.find(l => l.length > 1 && !sizeRe.test(l) && !/^(Armor|Hit|Speed|STR|Skills|Senses|Languages|Habitat|Challenge|Features|Actions|Reactions)\b/i.test(l)) || '';
      const kind = lines.find(l => sizeRe.test(l)) || '';
      const abilities = mergeAbilities(Object.assign({}, seededAbs || {}), parseStatAbilities(joined, words));
      const fields = [
        ['ac', /Armor\s*C[il]ass\s*[:.]?\s*(.+)/i],
        ['hp', /Hit\s*Points?\s*[:.]?\s*(.+)/i],
        ['speed', /Speed\s*[:.]?\s*(.+)/i],
        ['saves', /Saving\s*Throws?\s*[:.]?\s*(.+)/i],
        ['skills', /Skills?\s*[:.]?\s*(.+)/i],
        ['senses', /Senses?\s*[:.]?\s*(.+)/i],
        ['languages', /Languages?\s*[:.]?\s*(.+)/i],
        ['habitat', /Habitat\s*[:.]?\s*(.+)/i],
        ['challenge', /Challenge(?:\s*Rating)?\s*[:.]?\s*(.+?)(?=\s*Proficiency|\s*PB\b|$)/i],
        ['pb', /(?:Proficiency\s*Bonus|\bPB\b)\s*(?:\(PB\))?\s*([+\-]?\d+)/i]
      ];
      const stats = {};
      fields.forEach(([key, re]) => { stats[key] = pickStatLine(joined, re); });
      const sectionNames = ['Features', 'Actions', 'Bonus Actions', 'Reactions', 'Legendary Actions', 'Mythic Actions'];
      const sections = [];
      const secRe = new RegExp('^(' + sectionNames.join('|') + ')\\s*$', 'i');
      let current = null;
      lines.forEach(line => {
        if (secRe.test(line)) {
          current = { title: line.replace(/\s+/g, ' '), items: [] };
          sections.push(current);
          return;
        }
        if (!current) return;
        const item = line.match(/^([A-Z][A-Za-z0-9'’\- ]{1,48})\.\s*(.*)$/);
        if (item) current.items.push({ name: scrubStatOcrNoise(item[1]), text: scrubStatOcrNoise(item[2]) });
        else if (current.items.length) current.items[current.items.length - 1].text += ' ' + scrubStatOcrNoise(line);
        else current.items.push({ name: '', text: scrubStatOcrNoise(line) });
      });
      return { name: name, kind: kind, stats: stats, abilities: abilities, sections: sections, raw: text };
    }

    function cleanStatText(text) {
      return scrubStatOcrNoise(String(text || '').replace(/\s+/g, ' '));
    }

    function statSheetToHtml(parsed) {
      const s = parsed.stats || {};
      const rows = [];
      if (parsed.name) rows.push('<b>' + escapeHtml(cleanStatText(parsed.name)) + '</b>' + (parsed.kind ? '<br><i>' + escapeHtml(cleanStatText(parsed.kind)) + '</i>' : ''));
      else if (parsed.kind) rows.push('<i>' + escapeHtml(cleanStatText(parsed.kind)) + '</i>');
      const core = [];
      if (s.ac) core.push('<b>Armor Class:</b> ' + escapeHtml(cleanStatText(s.ac)));
      if (s.hp) core.push('<b>Hit Points:</b> ' + escapeHtml(cleanStatText(s.hp)));
      if (s.speed) core.push('<b>Speed:</b> ' + escapeHtml(cleanStatText(s.speed)));
      if (core.length) rows.push(core.join('<br>'));
      const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
      const abs = parsed.abilities || {};
      if (keys.some(k => abs[k])) {
        rows.push(keys.map(k => '<b>' + k + '</b> ' + escapeHtml(abs[k] || '—')).join(' · '));
      }
      const extra = [
        ['saves', 'Saving Throws'],
        ['skills', 'Skills'],
        ['senses', 'Senses'],
        ['languages', 'Languages'],
        ['habitat', 'Habitat'],
        ['challenge', 'Challenge'],
        ['pb', 'Proficiency Bonus']
      ];
      const extraLines = extra.filter(([key]) => s[key]).map(([key, label]) => '<b>' + label + ':</b> ' + escapeHtml(cleanStatText(s[key])));
      if (extraLines.length) rows.push(extraLines.join('<br>'));
      parsed.sections.forEach(sec => {
        rows.push('<b>' + escapeHtml(cleanStatText(sec.title)) + '</b>');
        sec.items.forEach(item => {
          if (item.name) rows.push('<i><b>' + escapeHtml(cleanStatText(item.name)) + '.</b></i> ' + escapeHtml(cleanStatText(item.text)));
          else if (item.text) rows.push(escapeHtml(cleanStatText(item.text)));
        });
      });
      if (rows.length < 2) return textToHtml(parsed.raw);
      return rows.map(html => '<p>' + html + '</p>').join('');
    }

    async function runStatSheetOcr(src) {
      const passes = [];
      const take = data => {
        const text = (data && data.text) || '';
        const words = ocrWordsFromData(data || {});
        const abilities = parseStatAbilities(text, words);
        passes.push({ text: text, words: words, abilities: abilities, n: abilityCount(abilities) });
      };
      const gray = await prepareStatSheetForOcr(src, 'gray');
      const first = await recognizeStatSheetCanvas(gray, 6);
      take(first && first.data);
      if (!passes.length) return { text: '', words: [], abilities: {} };
      let abs = Object.assign({}, passes[0].abilities);
      if (passes[0].n < 6) {
        const binary = await prepareStatSheetForOcr(src, 'binary');
        const second = await recognizeStatSheetCanvas(binary, 6);
        take(second && second.data);
        abs = mergeAbilities(abs, passes[passes.length - 1].abilities);
      }
      if (abilityCount(abs) < 4) {
        const third = await recognizeStatSheetCanvas(gray, 11);
        take(third && third.data);
        abs = mergeAbilities(abs, passes[passes.length - 1].abilities);
      }
      passes.sort((a, b) => b.n - a.n || String(b.text).length - String(a.text).length);
      const best = passes[0] || { text: '', words: [], abilities: {} };
      return { text: best.text, words: best.words, abilities: mergeAbilities(Object.assign({}, best.abilities), abs) };
    }

    function currentEditorImageSrc() {
      if (typeof pendingEntryImage === 'string' && pendingEntryImage) return pendingEntryImage;
      const img = document.getElementById('entryImagePreviewImg');
      return (img && img.getAttribute('src')) || '';
    }

    async function readStatSheetFromEditorImage() {
      if (!isDM || ocrBusy) return;
      const src = currentEditorImageSrc();
      if (!src) return toast('Zuerst ein Stat-Sheet-Bild hochladen oder den Eintrag mit Bild öffnen.');
      const existing = htmlToText(els.content.innerHTML || '').trim();
      if (existing && !confirm('Der Text wird durch den erkannten Stat-Sheet-Text ersetzt. Fortfahren?')) return;
      ocrBusy = true;
      toast('Stat-Sheet wird gelesen… das kann einen Moment dauern.', 0);
      try {
        const ocr = await runStatSheetOcr(src);
        const parsed = parseStatSheetText(ocr.text, ocr.words, ocr.abilities);
        const html = sanitizeHtml(statSheetToHtml(parsed));
        if (!htmlToText(html).trim()) throw new Error('Im Bild wurde kein Text erkannt.');
        els.content.innerHTML = html;
        dirty = true;
        toast('Text erkannt. Bitte kurz prüfen und dann speichern. Das Bild bleibt.');
      } catch (err) {
        toast(err.message || 'Das Stat-Sheet konnte nicht gelesen werden.');
      } finally {
        ocrBusy = false;
      }
    }

    function visibilityLabel(v) {
      return v === 'dm' ? 'Nur DM' : 'Spieler';
    }

    function parseVisibility(v) {
      const s = (v || '').toLowerCase();
      return /dm|nur/.test(s) ? 'dm' : 'player';
    }

    function fileNameFor(title) {
      const clean = (title || 'eintrag').replace(/[<>:"/\\|?*]+/g, '').trim().slice(0, 60);
      return (clean || 'eintrag') + '.txt';
    }

    function formatEntryBlock(e) {
      return [
        '===== EINTRAG START =====',
        'Titel: ' + (e.title || ''),
        'Kategorie: ' + (e.type || ''),
        'Sichtbarkeit: ' + visibilityLabel(e.visibility),
        '',
        htmlToText(e.content),
        '===== EINTRAG ENDE ====='
      ].join('\n');
    }

    function formatCodexFile(list) {
      return [
        '# Thalarion – Kompendium',
        '# Bitte die Markierungen ===== EINTRAG START ===== und ===== EINTRAG ENDE ===== behalten.',
        '# Titel, Kategorie und Sichtbarkeit in den Kopfzeilen lassen.',
        '',
        list.map(formatEntryBlock).join('\n\n')
      ].join('\n');
    }

    function geminiSectionFor(type) {
      if (type === STORY_CAT) return 'Entstehung';
      if (type === SESSION_CAT) return 'Sitzung';
      if (BESTIARIUM_CATS.includes(type)) return 'Bestiarium';
      if (GLOSSAR_CATS.includes(type)) return 'Glossar';
      return 'Kompendium';
    }

    function formatGeminiDocument(list) {
      const items = (Array.isArray(list) ? list : []).slice().sort((a, b) => {
        const ai = categories.indexOf(normalizeType(a.type));
        const bi = categories.indexOf(normalizeType(b.type));
        if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        const ad = a.sessionDate || '';
        const bd = b.sessionDate || '';
        if (ad !== bd) return ad < bd ? 1 : -1;
        return String(a.title || '').localeCompare(String(b.title || ''), 'de');
      });
      const byType = {};
      const types = [];
      items.forEach(e => {
        const type = categories.includes(normalizeType(e.type)) ? normalizeType(e.type) : (e.type || 'Sonstiges');
        if (!byType[type]) {
          byType[type] = [];
          types.push(type);
        }
        byType[type].push(e);
      });
      const toc = [];
      const body = [];
      let lastSection = '';
      types.forEach(type => {
        const section = geminiSectionFor(type);
        if (section !== lastSection) {
          lastSection = section;
          toc.push('');
          toc.push(section);
          body.push('');
          body.push('════════════════════════════════════');
          body.push(section.toUpperCase());
          body.push('════════════════════════════════════');
        }
        toc.push('  ' + type + ' (' + byType[type].length + ')');
        body.push('');
        body.push('── ' + type + ' ──');
        byType[type].forEach(e => {
          toc.push('    - ' + (e.title || 'Ohne Titel'));
          body.push('');
          body.push('### ' + (e.title || 'Ohne Titel'));
          body.push('Kategorie: ' + (e.type || type));
          if (e.kingdom) body.push('Königreich: ' + e.kingdom);
          body.push('Sichtbarkeit: ' + visibilityLabel(e.visibility));
          if (e.sessionDate) body.push('Datum: ' + formatSessionDate(e.sessionDate));
          body.push('');
          body.push(htmlToText(e.content) || '(Kein Text)');
          body.push('');
          body.push('---');
        });
      });
      return [
        'Thalarion – Das Blutsiegel',
        'Gesamtdokument',
        '',
        'Dieses Dokument enthält Entstehung, Sitzung, Kompendium, Bestiarium und Glossar.',
        'Jeder Eintrag hat eine eigene Überschrift (### Name).',
        'Bilder, Karten-Pins, Kampf und Charakterblätter sind nicht enthalten.',
        '',
        'Anzahl Einträge: ' + items.length,
        'Stand: ' + new Date().toISOString().slice(0, 10),
        '',
        'INHALTSVERZEICHNIS',
        ...toc,
        '',
        ...body,
        ''
      ].join('\n');
    }

    function parseCodexFile(text) {
      const chunks = String(text || '').split(/===== EINTRAG START =====/i).slice(1);
      return chunks.map(chunk => {
        const body = chunk.split(/===== EINTRAG ENDE =====/i)[0];
        const lines = body.replace(/^\uFEFF/, '').split(/\r?\n/);
        const meta = { title: '', type: categories[0], visibility: 'player' };
        let i = 0;
        while (i < lines.length) {
          const line = lines[i];
          const m = line.match(/^\s*(Titel|Kategorie|Sichtbarkeit)\s*:\s*(.*)$/i);
          if (m) {
            const key = m[1].toLowerCase();
            const val = m[2].trim();
            if (key === 'titel') meta.title = val;
            else if (key === 'kategorie') meta.type = normalizeType(val);
            else meta.visibility = parseVisibility(val);
            i += 1;
            continue;
          }
          if (line.trim() === '') {
            i += 1;
            break;
          }
          break;
        }
        const content = lines.slice(i).join('\n').trim();
        return {
          title: meta.title,
          type: categories.includes(meta.type) ? meta.type : normalizeType(meta.type),
          visibility: meta.visibility,
          content: textToHtml(content)
        };
      }).filter(e => e.title);
    }

    function downloadText(filename, text) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function isMyDocumentEntry(e) {
      const type = normalizeType(e.type);
      return type === STORY_CAT ||
        type === SESSION_CAT ||
        KOMPENDIUM_CATS.includes(type) ||
        BESTIARIUM_CATS.includes(type) ||
        GLOSSAR_CATS.includes(type);
    }

    function myDocumentEntries() {
      return entries.filter(isMyDocumentEntry);
    }

    function downloadMyDocument() {
      if (!isDM) return;
      const list = myDocumentEntries();
      if (!list.length) return toast('Es gibt noch keine Einträge.');
      downloadText('Thalarion-Gesamtdokument.txt', formatGeminiDocument(list));
      toast(list.length + ' Einträge in einem Dokument.');
    }

    function closeDmMenu() {
      const list = document.getElementById('dmMenuList');
      const btn = document.getElementById('dmMenuBtn');
      if (list) list.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function toggleDmMenu() {
      if (!isDM) return;
      const list = document.getElementById('dmMenuList');
      const btn = document.getElementById('dmMenuBtn');
      const open = list.classList.contains('hidden');
      list.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function downloadOneEntry() {
      if (!isDM || currentIndex === null) return;
      const e = entries[currentIndex];
      downloadText(fileNameFor(e.title), formatCodexFile([e]));
      toast('Eintrag heruntergeladen.');
    }

    function readUploadedFile(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
        r.readAsText(file, 'UTF-8');
      });
    }

    async function uploadAllEntries(file) {
      if (!isDM || !file) return;
      let parsed;
      try {
        parsed = parseCodexFile(await readUploadedFile(file));
      } catch (err) {
        return toast(err.message);
      }
      if (!parsed.length) return toast('In der Datei wurde kein Eintrag gefunden.');
      if (!confirm(parsed.length + ' Einträge aus der Datei übernehmen und die bisherigen ersetzen?')) return;
      const previous = entries.slice();
      const keep = {};
      previous.forEach(e => {
        if (e.title) keep[e.title.toLowerCase()] = { imageId: e.imageId || '', sessionDate: e.sessionDate || '', kingdom: e.kingdom || '' };
      });
      entries = parsed.map(e => Object.assign({}, e, keep[(e.title || '').toLowerCase()] || {}));
      try {
        await persistWorld();
        toast('Alle Einträge übernommen.');
        showHome();
      } catch (err) {
        entries = previous;
        toast('Hochladen fehlgeschlagen: ' + err.message);
      }
    }

    async function uploadOneEntry(file) {
      if (!isDM || !file || currentIndex === null) return;
      let parsed;
      try {
        parsed = parseCodexFile(await readUploadedFile(file));
      } catch (err) {
        return toast(err.message);
      }
      if (!parsed.length) return toast('In der Datei wurde kein Eintrag gefunden.');
      const current = entries[currentIndex];
      const incoming = parsed.find(e => e.title.toLowerCase() === current.title.toLowerCase()) || parsed[0];
      const previous = Object.assign({}, current);
      entries[currentIndex] = Object.assign({}, incoming, {
        imageId: current.imageId || '',
        sessionDate: current.sessionDate || incoming.sessionDate || ''
      });
      try {
        await persistWorld();
        toast('Eintrag übernommen.');
        loadEntry(currentIndex);
      } catch (err) {
        entries[currentIndex] = previous;
        toast('Hochladen fehlgeschlagen: ' + err.message);
      }
    }

    function persistView() {
      try {
        const wrap = document.getElementById('mapWrap');
        sessionStorage.setItem(VIEW_KEY, JSON.stringify({
          page: currentPage,
          title: currentTitle || '',
          cat: selectedHomeCat || '',
          sheet: currentSheetOwner || '',
          map: wrap ? {
            scale: mapScale,
            panX: mapPanX,
            panY: mapPanY,
            sl: wrap.scrollLeft,
            st: wrap.scrollTop
          } : mapViewMemo
        }));
      } catch (err) {}
    }

    function showPage(page) {
      if (currentPage === 'map' && page !== 'map') captureMapView();
      currentPage = page;
      persistView();
      els.navWorld.classList.toggle('active', page === 'world' || page === 'codex' || page === 'bestiarium' || page === 'glossar');
      els.navEntstehung.classList.toggle('active', page === 'entstehung');
      els.dmMenuSitzung.classList.toggle('active', page === 'sitzung');
      els.navMap.classList.toggle('active', page === 'map');
      els.navCharakter.classList.toggle('active', page === 'char');
      els.navKampf.classList.toggle('active', page === 'kampf');
      els.mapView.classList.toggle('hidden', page !== 'map');
      if (page !== 'map') setMapFullscreen(false);
      els.charView.classList.toggle('hidden', page !== 'char');
      els.kampfView.classList.toggle('hidden', page !== 'kampf');
      if (page !== 'kampf') closeStatSheetOverlay();
      updateSidebarVisibility(page);
      if (page === 'map' || page === 'char' || page === 'kampf') {
        els.homeView.classList.add('hidden');
        els.viewer.classList.add('hidden');
        els.editorView.classList.add('hidden');
        els.entstehungView.classList.add('hidden');
        els.sitzungView.classList.add('hidden');
      }
      updateExtraToolbars();
    }

    function updateHomeHero(page) {
      const hero = PAGE_HERO[page] || PAGE_HERO.codex;
      document.getElementById('homeSeal').textContent = hero.seal;
      document.getElementById('homeTitle').textContent = hero.title;
      document.getElementById('homeBlurb').textContent = hero.blurb;
    }

    function confirmLeaveEditor() {
      if (dirty && isDM && !els.editorView.classList.contains('hidden')) {
        if (!confirm('Du hast ungespeicherte Änderungen. Wirklich verlassen?')) return false;
        dirty = false;
      }
      if (sheetDirty && !els.charView.classList.contains('hidden')) {
        if (!confirm('Das Charakterblatt ist nicht gespeichert. Wirklich verlassen?')) return false;
        sheetDirty = false;
      }
      return true;
    }

    function setDM(on) {
      if (!on && isDM && !confirmLeaveEditor()) return;
      if (!on && isDM && sheetDirty && els.charView && !els.charView.classList.contains('hidden')) {
        if (!confirm('Ungespeicherte Charakter- oder DM-Notizen. Trotzdem abmelden?')) return;
        sheetDirty = false;
      }
      isDM = on;
      document.body.classList.toggle('is-dm', on);
      els.dmButton.textContent = on ? 'DM Logout' : 'DM Login';
      if (on) {
        sessionStorage.setItem(SESSION_KEY, '1');
        warmupSoundPlayers();
      } else sessionStorage.removeItem(SESSION_KEY);
      document.getElementById('mapToolbar').classList.toggle('hidden', !on);
      updateSidebarVisibility(currentPage);
      if (!on) {
        closeDmMenu();
        setPlacingPin(false);
        setDrawingBorder(false);
        stopSoundTrack();
        closeSoundDock();
        if (isDmNotesOwner(currentSheetOwner)) currentSheetOwner = currentPlayerId || null;
        if (!currentPlayerId) toggleChat(false);
        else {
          syncChatListeners();
          renderChatChrome();
        }
      } else {
        syncChatListeners();
        renderChatChrome();
      }
      renderMapPins();
      renderMapBorders();
      if (!on && !els.editorView.classList.contains('hidden')) {
        if (currentIndex !== null && entries[currentIndex]?.type === STORY_CAT) showEntstehung();
        else if (currentIndex !== null && entries[currentIndex]?.type === SESSION_CAT) showSitzung();
        else if (currentIndex !== null) loadEntry(currentIndex);
        else if (isCatalogPage(currentPage)) showCatalog(currentPage);
        else if (currentPage === 'entstehung') showEntstehung();
        else if (currentPage === 'sitzung') showSitzung();
        else if (currentPage === 'map' || currentPage === 'kampf') showMap();
        else showHome();
      } else {
        renderHome();
        renderSidebar();
        if (!els.entstehungView.classList.contains('hidden')) renderEntstehung();
        if (!els.sitzungView.classList.contains('hidden')) renderSitzung();
        if (currentPage === 'char') renderCharakter();
        if (currentPage === 'kampf') renderKampf();
        if (currentPage === 'kampf') renderBattleBoards();
        els.playerToEdit.classList.toggle('hidden', !on || currentIndex === null || els.viewer.classList.contains('hidden'));
        updateEntryToKarteBtn();
        updateExtraToolbars();
        syncSoundUi();
      }
      if (!on) {
        cancelBattleDraw();
      }
      applyDiceToolsUi();
    }

    function openLogin() {
      els.loginError.textContent = '';
      els.dmUser.value = '';
      els.dmPassword.value = '';
      els.loginOverlay.classList.remove('hidden');
      els.dmUser.focus();
    }

    function closeLogin() {
      els.loginOverlay.classList.add('hidden');
    }

    function closeKampfBattleGear() {
      const panel = document.getElementById('kampfBattleGearPanel');
      const btn = document.getElementById('kampfBattleGearBtn');
      if (panel) panel.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function toggleKampfBattleGear() {
      const panel = document.getElementById('kampfBattleGearPanel');
      const btn = document.getElementById('kampfBattleGearBtn');
      if (!panel) return;
      const open = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindBattleTools(prefix) {
      onClick(prefix + 'BattleUploadBtn', () => {
        if (!isDM) return;
        closeKampfBattleGear();
        const input = document.getElementById('battleMapInput');
        if (input) input.click();
      });
      onClick(prefix + 'BattleGalleryBtn', () => {
        if (!isDM) return;
        openBattleGallery();
      });
      onClick(prefix + 'BattleFireBtn', () => setBattleHazardMode('fire'));
      onClick(prefix + 'BattleWaterBtn', () => setBattleHazardMode('water'));
      onClick(prefix + 'BattleOilBtn', () => setBattleHazardMode('oil'));
      onClick(prefix + 'BattleRulerBtn', () => setBattleMapTool('ruler'));
      onClick(prefix + 'BattlePingBtn', () => setBattleMapTool('ping'));
      onClick(prefix + 'BattleFogBtn', toggleBattleFog);
      onClick(prefix + 'BattleFogRevealBtn', () => setBattleMapTool('fog-reveal'));
      onClick(prefix + 'BattleFogHideBtn', () => setBattleMapTool('fog-hide'));
      onClick(prefix + 'BattleCloseBtn', closeBattleDraft);
      onClick(prefix + 'BattleCancelDrawBtn', cancelBattleDraw);
      onClick(prefix + 'BattleClearBtn', clearBattleMap);
      const sizeEl = document.getElementById(prefix + 'BattleSize');
      if (sizeEl) {
        sizeEl.addEventListener('input', () => {
          if (!isDM) return;
          battle.tokenSize = clampBattleTokenSize(sizeEl.value);
          battle.layoutAt = stampNow();
          applyBattleTokenSize();
          persistBattleSoon();
        });
        sizeEl.addEventListener('change', () => {
          if (!isDM) return;
          battle.tokenSize = clampBattleTokenSize(sizeEl.value);
          battle.layoutAt = stampNow();
          applyBattleTokenSize();
          persistBattleSoon();
        });
      }
      const gridEl = document.getElementById(prefix + 'BattleGrid');
      if (gridEl) {
        const setGrid = () => {
          if (!isDM) return;
          battle.gridSize = clampBattleGridSize(Number(gridEl.value) / 10);
          battle.gridFrac = 0;
          battle.layoutAt = stampNow();
          applyBattleGridSize();
          persistBattleSoon();
        };
        gridEl.addEventListener('input', setGrid);
        gridEl.addEventListener('change', setGrid);
      }
      const stage = document.getElementById(prefix + 'BattleStage');
      const overlay = document.getElementById(prefix + 'BattleOverlay');
      const img = document.getElementById(prefix + 'BattleImg');
      const board = document.getElementById(prefix + 'BattleBoard');
      if (overlay && stage) overlay.addEventListener('click', ev => onBattleStageClick(ev, stage));
      if (stage) {
        stage.addEventListener('pointermove', ev => {
          if (battleMapTool !== 'ruler' || !battleRulerFrom || battleRulerTo) return;
          battleRulerHover = battlePctFromEvent(stage, ev);
          renderBattleRuler();
        });
      }
      if (img) {
        img.addEventListener('load', () => {
          applyBattleGridSize();
          applyBattleTransform();
        });
      }
      if (stage && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (battleTokenDrag) return;
          applyBattleGridSize();
          applyBattleTransform();
          renderBattleFog();
        });
        ro.observe(stage);
      }
      bindBattleZoom(board, stage);
      onClick(prefix + 'BattleZoomIn', () => zoomBattleBy(0.35));
      onClick(prefix + 'BattleZoomOut', () => zoomBattleBy(-0.35));
      onClick(prefix + 'BattleZoomReset', resetBattleView);
      onClick(prefix + 'BattleGearBtn', ev => {
        ev.stopPropagation();
        toggleKampfBattleGear();
      });
      document.addEventListener('click', ev => {
        const wrap = document.getElementById('kampfBattleGear');
        if (!wrap || wrap.contains(ev.target)) return;
        closeKampfBattleGear();
      });
    }

    function setSidebarOpen(open) {
      if (!els.sidebar) return;
      els.sidebar.classList.toggle('open', !!open);
      const mobile = window.matchMedia('(max-width: 860px)').matches;
      document.body.classList.toggle('sidebar-open', !!open && mobile);
    }

    function restoreSessionView() {
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(VIEW_KEY) || 'null'); } catch (err) {}
      if (saved && saved.map) {
        mapViewMemo = {
          scale: saved.map.scale,
          panX: saved.map.panX,
          panY: saved.map.panY,
          sl: saved.map.sl,
          st: saved.map.st
        };
      }
      const page = saved && saved.page;
      if (saved && saved.sheet && (sheetOwnerRecord(saved.sheet) || (isDM && isDmNotesOwner(saved.sheet)))) {
        currentSheetOwner = saved.sheet;
      }
      if (!page || page === 'map') {
        showMap();
        return;
      }
      if (page === 'kampf') showKampf();
      else if (page === 'char') showCharakter();
      else if (page === 'entstehung') showEntstehung();
      else if (page === 'sitzung') showSitzung();
      else if (page === 'world') showWorld();
      else if (isCatalogPage(page)) {
        if (saved.title) {
          const i = indexByTitle(saved.title);
          if (i !== null) {
            selectedHomeCat = saved.cat || null;
            loadEntry(i);
            return;
          }
        }
        showCatalog(page);
        if (saved.cat) {
          selectedHomeCat = saved.cat;
          renderHome();
          renderSidebar();
          persistView();
        }
      } else showMap();
    }

    function bindAll() {
      safeBind('nav', () => {
        onClick('homeBtn', showMap);
        onClick('navWorld', showWorld);
        onClick('navEntstehung', showEntstehung);
        onClick('navMap', showMap);
        onClick('navCharakter', showCharakter);
        onClick('navKampf', showKampf);
        onClick('menuBtn', () => setSidebarOpen(!(els.sidebar && els.sidebar.classList.contains('open'))));
      });

      safeBind('sound', () => {
        warmupSoundPlayers();
        loadSoundUserClips().then(() => {
          syncSoundUi();
        }).catch(() => {});
        onClick('soundDockBtn', ev => {
          ev.stopPropagation();
          toggleSoundDock();
        });
        const wrap = document.getElementById('soundDockWrap');
        if (wrap) wrap.addEventListener('pointerdown', unlockSound, { passive: true });
        document.addEventListener('click', ev => {
          const box = document.getElementById('soundDockWrap');
          if (!box || box.contains(ev.target)) return;
          if (soundPickOpen()) return;
          closeSoundDock();
        });
        onClick('soundAmbienteBtn', () => openSoundPicker('ambiente'));
        onClick('soundFxPickBtn', () => openSoundPicker('fx'));
        onClick('soundPauseBtn', togglePauseSound);
        onClick('soundStopBtn', stopSoundTrack);
        onClick('soundFxStopBtn', () => stopAllSoundFx(false));
        onClick('soundPickCloseBtn', closeSoundPicker);
        onClick('soundPickAddBtn', () => {
          const input = document.getElementById('soundFxInput');
          if (input) input.click();
        });
        onClick('soundPickExportBtn', exportSoundLibrary);
        onClick('soundPickImportBtn', () => {
          const input = document.getElementById('soundLibInput');
          if (input) input.click();
        });
        onEv('soundVolAmb', 'input', ev => setSoundAmbVolume(Number(ev.target.value) / 100));
        onEv('soundVolFx', 'input', ev => setSoundFxVolume(Number(ev.target.value) / 100));
        onEv('soundFxInput', 'change', async ev => {
          const file = ev.target.files && ev.target.files[0];
          ev.target.value = '';
          if (!file) return;
          await addSoundFromFile(file);
        });
        onEv('soundLibInput', 'change', async ev => {
          const file = ev.target.files && ev.target.files[0];
          ev.target.value = '';
          if (!file) return;
          await importSoundLibrary(file);
        });
        onEv('soundPickOverlay', 'click', ev => {
          if (ev.target === document.getElementById('soundPickOverlay')) closeSoundPicker();
        });
      });

      safeBind('dice', () => {
        renderDiceTray();
        renderDiceLog();
        applyDiceToolsUi();
        onClick('diceTrayBtn', ev => {
          ev.stopPropagation();
          toggleDiceTray();
        });
        onClick('diceLogBtn', ev => {
          ev.stopPropagation();
          toggleDiceLog();
        });
        const prefPanel = document.getElementById('dicePrefPanel');
        if (prefPanel) prefPanel.addEventListener('click', ev => {
          const btn = ev.target.closest('[data-dice-anim]');
          if (!btn) return;
          setDiceAnimMode(btn.getAttribute('data-dice-anim'));
        });
        onClick('diceTrayResetBtn', () => {
          resetDiceQueue();
          renderDiceTray();
        });
        onClick('diceTrayRollBtn', rollQueuedDice);
        onClick('diceTrayClearBtn', () => {
          resetDiceQueue();
          renderDiceTray();
          clearTableDice();
        });
        onClick('diceLogClearBtn', () => {
          diceLog = [];
          renderDiceLog();
          persistDiceLog();
        });
        const kinds = document.getElementById('diceTrayKinds');
        if (kinds) kinds.addEventListener('click', ev => {
          const btn = ev.target.closest('[data-sides]');
          if (!btn) return;
          addDiceToQueue(btn.getAttribute('data-sides'));
        });
        document.addEventListener('click', ev => {
          const wrap = document.getElementById('diceToolsWrap');
          if (wrap && wrap.contains(ev.target)) return;
          closeDiceTray();
        });
      });

      safeBind('kampf', () => {
        onClick('kampfStartBtn', startKampf);
        onClick('kampfInitAllBtn', rollAllKampfInit);
        onClick('kampfAddToggleBtn', () => {
          const add = document.getElementById('kampfAdd');
          if (!add) return;
          add.classList.remove('hidden');
          add.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
        onClick('kampfNextBtn', nextCombatTurn);
        onClick('kampfPrevBtn', prevCombatTurn);
        onClick('kampfSkipBtn', skipCombatTurn);
        onClick('kampfReadyBtn', () => markActiveKampfTurn('ready'));
        onClick('kampfDelayBtn', () => markActiveKampfTurn('delay'));
        onClick('kampfEndBtn', endCombat);
        onClick('kampfAimCancel', cancelKampfAim);
        onClick('kampfResolveBtn', resolveKampfPower);
        onEv('kampfPowerOverlay', 'click', ev => ev.stopPropagation());
        onEv('kampfPowerOverlay', 'pointerdown', ev => ev.stopPropagation());
        onEv('kampfActionPanel', 'click', ev => ev.stopPropagation());
        onEv('kampfActionPanel', 'pointerdown', ev => ev.stopPropagation());
        onClick('kampfActDmg', () => applyKampfAimDamage(false));
        onClick('kampfActHeal', () => applyKampfAimDamage(true));
        onClick('kampfActBuff', () => showKampfEffectPicker('buff'));
        onClick('kampfActDebuff', () => showKampfEffectPicker('debuff'));
        onClick('kampfActConcentrate', toggleKampfConcentrate);
        onClick('kampfActKill', applyKampfAimKill);
        onClick('kampfEffectAdd', () => applyKampfEffect(''));
        onEv('kampfDmgAmt', 'keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          applyKampfAimDamage(false);
        });
        onEv('kampfEffectText', 'keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          applyKampfEffect('');
        });
        onClick('statSheetCloseBtn', closeStatSheetOverlay);
        onEv('statSheetOverlay', 'click', ev => {
          if (ev.target === document.getElementById('statSheetOverlay')) closeStatSheetOverlay();
        });
        onClick('kampfAddEnemyBtn', addEnemyToCombat);
        onClick('kampfSaveTplBtn', saveCombatTemplate);
        onEv('kampfKartenSearch', 'input', renderKampfKartenList);
        onClick('kampfKarteSaveBtn', saveKampfKarte);
        onClick('kampfKarteCancelBtn', clearKarteForm);
        onClick('kampfKarteDeleteBtn', deleteKampfKarte);
        onClick('kampfKartePortraitBtn', () => {
          if (!isDM) return;
          const input = document.getElementById('kampfKartePortraitInput');
          if (input) input.click();
        });
        onEv('kampfKartePortraitInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file || !isDM) return;
          try {
            pendingKartePortrait = await fileToPortraitImage(file);
            updateKartePortraitStatus();
            toast('Portrait bereit. Karte speichern, dann ist es dabei.');
          } catch (err) {
            toast(err.message || 'Portrait konnte nicht gelesen werden.');
          }
        });
        ['kampfKarteName', 'kampfKarteHp', 'kampfKarteAc', 'kampfKarteCount', 'kampfKarteNote'].forEach(id => {
          onEv(id, 'keydown', ev => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            saveKampfKarte();
          });
        });
        ['kampfEnemyName', 'kampfEnemyHp', 'kampfEnemyAc', 'kampfEnemyInit', 'kampfEnemyCount', 'kampfTplName'].forEach(id => {
          onEv(id, 'keydown', ev => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            if (id === 'kampfTplName') saveCombatTemplate();
            else addEnemyToCombat();
          });
        });
        bindBattleTools('kampf');
        onEv('battleMapInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadBattleMap(file);
        });
        onClick('battleGalleryAddBtn', startBattleGalleryAdd);
        onClick('battleGalleryCloseBtn', closeBattleGallery);
        onEv('battleGalleryOverlay', 'click', ev => {
          if (ev.target === document.getElementById('battleGalleryOverlay')) closeBattleGallery();
        });
        onEv('battleGalleryName', 'keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          startBattleGalleryAdd();
        });
        onEv('battleGalleryInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          addBattleGalleryMap(file);
        });
      });

      safeBind('char', () => {
        onClick('uploadSheetPortraitBtn', () => {
          const input = document.getElementById('sheetPortraitInput');
          if (input) input.click();
        });
        onClick('removeSheetPortraitBtn', () => {
          pendingSheetPortrait = null;
          sheetPortraitId = '';
          setSheetPortraitPreview(null);
          sheetDirty = true;
        });
        onClick('ocrSheetPortraitBtn', () => readStatSheetFromSheetImage());
        onEv('sheetPortraitInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file) return;
          try {
            pendingSheetPortrait = currentSheetOwner === VEYR_OWNER
              ? await fileToEntryImage(file)
              : await fileToPortraitImage(file);
            setSheetPortraitPreview(pendingSheetPortrait);
            sheetDirty = true;
            toast(currentSheetOwner === VEYR_OWNER
              ? 'Bild bereit. Text aus Stat-Sheet lesen oder Blatt speichern.'
              : 'Portrait bereit. Blatt speichern, dann ist es für den Kampf da.');
          } catch (err) {
            toast(err.message || 'Portrait konnte nicht gelesen werden.');
          }
        });
        onClick('saveSheetBtn', saveSheet);
        onClick('saveDmNotesBtn', saveDmNotes);
        onClick('deletePlayerBtn', deletePlayerAccount);
        onClick('dndPortraitBtn', () => {
          const input = document.getElementById('sheetPortraitInput');
          if (input) input.click();
        });
        onClick('dndInsp', () => {
          collectDndFields();
          dndState.inspiration = !dndState.inspiration;
          refreshDndCalcs();
          sheetDirty = true;
        });
        onClick('dndShortRest', () => applyDndRest('short'));
        onClick('dndLongRest', () => applyDndRest('long'));
        onClick('dndDawn', () => applyDndRest('dawn'));
        onClick('dndHealBtn', () => applyDndHpChange('heal'));
        onClick('dndDmgBtn', () => applyDndHpChange('dmg'));
        const dndBlock = document.getElementById('charDndBlock');
        if (dndBlock && !dndBlock.dataset.bound) {
          dndBlock.dataset.bound = '1';
          const syncDnd = ev => {
            if (!usesDndSheet(currentSheetOwner)) return;
            sheetDirty = true;
            const row = ev.target.closest && ev.target.closest('[data-dnd-row]');
            if (row) {
              const kind = row.getAttribute('data-dnd-row');
              const id = row.getAttribute('data-id');
              const key = ev.target.getAttribute('data-k');
              const item = (dndState[kind] || []).find(x => x.id === id);
              if (item && key) item[key] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
            }
            collectDndFields();
            refreshDndCalcs();
          };
          dndBlock.addEventListener('input', syncDnd);
          dndBlock.addEventListener('change', syncDnd);
          dndBlock.addEventListener('click', ev => {
            if (!usesDndSheet(currentSheetOwner)) return;
            const tab = ev.target.closest('[data-dnd-tab]');
            if (tab) {
              collectDndFields();
              setDndTab(tab.getAttribute('data-dnd-tab'));
              return;
            }
            const actFilter = ev.target.closest('[data-dnd-act-filter]');
            if (actFilter) {
              setDndActFilter(actFilter.getAttribute('data-dnd-act-filter'));
              return;
            }
            const spellFilter = ev.target.closest('[data-dnd-spell-filter]');
            if (spellFilter) {
              collectDndFields();
              setDndSpellFilter(spellFilter.getAttribute('data-dnd-spell-filter'));
              return;
            }
            const slotPip = ev.target.closest('[data-dnd-slot-pip]');
            if (slotPip) {
              if (!canEditOwnerSheet(currentSheetOwner)) return;
              const level = Number(slotPip.getAttribute('data-dnd-slot-pip'));
              const n = Number(slotPip.getAttribute('data-n'));
              if (!dndState.spellSlots[level]) dndState.spellSlots[level] = { max: '', used: '' };
              const used = dndSlotUsed(level);
              dndState.spellSlots[level].used = String(used === n ? Math.max(0, n - 1) : n);
              renderDndLists();
              sheetDirty = true;
              return;
            }
            const slotDelta = ev.target.closest('[data-dnd-slot-max-delta]');
            if (slotDelta) {
              if (!canEditOwnerSheet(currentSheetOwner)) return;
              const level = Number(slotDelta.getAttribute('data-dnd-slot-max-delta'));
              const delta = Number(slotDelta.getAttribute('data-delta')) || 0;
              if (!dndState.spellSlots[level]) dndState.spellSlots[level] = { max: '', used: '' };
              const max = Math.max(0, Math.min(12, dndSlotMax(level) + delta));
              dndState.spellSlots[level].max = max ? String(max) : '';
              if (dndSlotUsed(level) > max) dndState.spellSlots[level].used = max ? String(max) : '0';
              renderDndLists();
              renderDndSlots();
              sheetDirty = true;
              return;
            }
            const saveToggle = ev.target.closest('[data-dnd-save-toggle]');
            if (saveToggle) {
              const id = saveToggle.getAttribute('data-dnd-save-toggle');
              dndState.abilities[id].save = !dndState.abilities[id].save;
              const cb = document.querySelector('#charDndBlock [data-dnd-save="' + id + '"]');
              if (cb) cb.checked = dndState.abilities[id].save;
              saveToggle.classList.toggle('is-prof', dndState.abilities[id].save);
              refreshDndCalcs();
              sheetDirty = true;
              return;
            }
            const rollAb = ev.target.closest('[data-dnd-roll-ab]');
            if (rollAb) {
              const id = rollAb.getAttribute('data-dnd-roll-ab');
              const ab = DND_ABS.find(a => a.id === id);
              dndRoll(ab ? ab.label : id, dndMod(dndState.abilities[id].score));
              return;
            }
            const rollSave = ev.target.closest('[data-dnd-roll-save]');
            if (rollSave) {
              const id = rollSave.getAttribute('data-dnd-roll-save');
              const ab = DND_ABS.find(a => a.id === id);
              const bonus = dndMod(dndState.abilities[id].score) + (dndState.abilities[id].save ? dndProficiency() : 0);
              dndRoll('Rettung ' + (ab ? ab.label : id), bonus);
              return;
            }
            const rollSkill = ev.target.closest('[data-dnd-roll-skill]');
            if (rollSkill) {
              const id = rollSkill.getAttribute('data-dnd-roll-skill');
              const sk = DND_SKILLS.find(s => s.id === id);
              dndRoll(sk ? sk.label : id, dndSkillBonus(id));
              return;
            }
            const rollInit = ev.target.closest('[data-dnd-roll="init"]');
            if (rollInit) {
              collectDndFields();
              const bonus = dndMod(dndState.abilities.dex.score) + dndParseBonus(dndState.initiativeBonus);
              dndRoll('Initiative', bonus);
              return;
            }
            const infoBtn = ev.target.closest('[data-dnd-info]');
            if (infoBtn) {
              const wrap = infoBtn.closest('[data-dnd-row]');
              const kind = wrap && wrap.getAttribute('data-dnd-row');
              const id = wrap && wrap.getAttribute('data-id');
              if (kind && id) openDndActionInfo(kind, id, currentSheetOwner);
              return;
            }
            const rollAtk = ev.target.closest('[data-dnd-roll="attack"], [data-dnd-roll="damage"]');
            if (rollAtk) {
              const wrap = rollAtk.closest('[data-dnd-row]');
              const id = wrap && wrap.getAttribute('data-id');
              collectDndFields();
              const item = (dndState.attacks || []).find(x => x.id === id)
                || (dndState.spells || []).find(x => x.id === id);
              if (!item) return;
              const kind = rollAtk.getAttribute('data-dnd-roll');
              const rollItem = Object.assign({}, item, { bonus: dndItemAttackBonus(item) || item.bonus });
              if (kind === 'attack') rollDndAttack(rollItem, wrap, true);
              else rollDndDamageOnly(rollItem, wrap, false);
              sheetDirty = true;
              if (!dndAttackIsOpen(item) && !dndSpellIsOpen(item)) renderDndLists();
              return;
            }
            const spellSave = ev.target.closest('[data-dnd-spell-save]');
            if (spellSave) {
              commitDndSpell(spellSave.getAttribute('data-dnd-spell-save'));
              return;
            }
            const spellEdit = ev.target.closest('[data-dnd-spell-edit]');
            if (spellEdit) {
              collectDndFields();
              dndSpellEditId = spellEdit.getAttribute('data-dnd-spell-edit') || '';
              renderDndLists();
              return;
            }
            const atkSave = ev.target.closest('[data-dnd-atk-save]');
            if (atkSave) {
              commitDndAttack(atkSave.getAttribute('data-dnd-atk-save'));
              return;
            }
            const atkEdit = ev.target.closest('[data-dnd-atk-edit]');
            if (atkEdit) {
              collectDndFields();
              dndAttackEditId = atkEdit.getAttribute('data-dnd-atk-edit') || '';
              renderDndLists();
              return;
            }
            const skill = ev.target.closest('[data-skill]');
            if (skill) {
              const id = skill.getAttribute('data-skill');
              dndState.skills[id] = ((Number(dndState.skills[id]) || 0) + 1) % 3;
              skill.classList.toggle('is-prof', dndState.skills[id] === 1);
              skill.classList.toggle('is-expert', dndState.skills[id] === 2);
              refreshDndCalcs();
              sheetDirty = true;
              return;
            }
            const add = ev.target.closest('[data-dnd-add]');
            if (add) {
              addDndRow(add.getAttribute('data-dnd-add'));
              return;
            }
            const del = ev.target.closest('[data-dnd-del]');
            if (del) {
              const row = del.closest('[data-dnd-row]');
              if (!row) return;
              const kind = row.getAttribute('data-dnd-row');
              const id = row.getAttribute('data-id');
              dndState[kind] = (dndState[kind] || []).filter(x => x.id !== id);
              renderDndLists();
              sheetDirty = true;
              return;
            }
            const death = ev.target.closest('[data-dnd-death]');
            if (death) {
              const n = Number(death.getAttribute('data-n'));
              const which = death.getAttribute('data-dnd-death');
              if (which === 'success') dndState.deathSuccess = dndState.deathSuccess === n ? n - 1 : n;
              else dndState.deathFail = dndState.deathFail === n ? n - 1 : n;
              renderDndPips();
              sheetDirty = true;
            }
          });
        }
        onEv('dmNotesContent', 'input', () => { sheetDirty = true; });
        ['sheetName', 'sheetVolk', 'sheetKlasse', 'sheetStufe', 'sheetHp', 'sheetArmor', 'sheetStats', 'sheetNotes'].forEach(id => {
          onEv(id, 'input', () => { sheetDirty = true; });
        });
        onEv('sheetContent', 'input', () => { sheetDirty = true; });
        onClick('charLoginBtn', () => openPlayerLogin('login'));
        onClick('charRegisterBtn', () => openPlayerLogin('register'));
        onClick('editVeyrBtn', openVeyrEditor);
        onClick('cancelVeyrBtn', () => {
          if (sheetDirty && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
          sheetDirty = false;
          veyrEntryEditing = false;
          pendingVeyrImage = null;
          renderCharakter();
        });
        onClick('saveVeyrBtn', saveVeyrEntry);
        onClick('uploadVeyrImageBtn', () => {
          if (!canEditOwnerSheet(VEYR_OWNER)) return;
          const input = document.getElementById('veyrImageInput');
          if (input) input.click();
        });
        onClick('ocrVeyrImageBtn', () => readStatSheetFromVeyrImage());
        onClick('removeVeyrImageBtn', () => {
          pendingVeyrImage = false;
          setVeyrImagePreview(null);
          sheetDirty = true;
        });
        onEv('veyrImageInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file || !canEditOwnerSheet(VEYR_OWNER)) return;
          try {
            toast('Bild wird vorbereitet…');
            const data = await fileToEntryImage(file);
            pendingVeyrImage = data;
            setVeyrImagePreview(data);
            sheetDirty = true;
            toast('Bild bereit. Jetzt Speichern, damit es für alle sichtbar ist.');
          } catch (err) {
            toast(err.message || 'Bild konnte nicht gelesen werden.');
          }
        });
        ['veyrTitle', 'veyrType'].forEach(id => {
          onEv(id, 'input', () => { sheetDirty = true; });
          onEv(id, 'change', () => { sheetDirty = true; });
        });
        onEv('veyrContent', 'input', () => { sheetDirty = true; });
      });

      safeBind('search', () => {
        onEv('globalSearch', 'input', renderGlobalSearch);
        onEv('globalSearch', 'focus', renderGlobalSearch);
        onEv('globalSearch', 'keydown', ev => {
          const hits = Array.from(document.querySelectorAll('#searchResults .search-hit'));
          if (ev.key === 'Escape') {
            closeSearchResults();
            closeDmMenu();
            ev.target.blur();
            return;
          }
          if (ev.key === 'ArrowDown' && hits.length) {
            ev.preventDefault();
            searchHitIndex = Math.min(hits.length - 1, searchHitIndex + 1);
            hits.forEach((h, i) => h.classList.toggle('active', i === searchHitIndex));
            hits[searchHitIndex].scrollIntoView({ block: 'nearest' });
            return;
          }
          if (ev.key === 'ArrowUp' && hits.length) {
            ev.preventDefault();
            searchHitIndex = searchHitIndex <= 0 ? 0 : searchHitIndex - 1;
            hits.forEach((h, i) => h.classList.toggle('active', i === searchHitIndex));
            hits[searchHitIndex].scrollIntoView({ block: 'nearest' });
            return;
          }
          if (ev.key === 'Enter') {
            const box = document.getElementById('searchResults');
            if (!box || box.classList.contains('hidden')) return;
            ev.preventDefault();
            const active = hits[searchHitIndex] || hits[0];
            if (active) active.click();
          }
        });
        document.addEventListener('click', ev => {
          if (!ev.target.closest('.header-search') && !ev.target.closest('#searchResults')) closeSearchResults();
          if (!ev.target.closest('#dmMenuWrap')) closeDmMenu();
          if (els.sidebar && els.sidebar.classList.contains('open') && !ev.target.closest('#sidebar') && !ev.target.closest('#menuBtn')) {
            setSidebarOpen(false);
          }
        });
        window.addEventListener('resize', closeSearchResults);
        window.addEventListener('scroll', () => {
          const box = document.getElementById('searchResults');
          if (box && !box.classList.contains('hidden')) placeSearchResults();
        }, true);
      });

      safeBind('codex', () => {
        onClick('homeNewBtn', newEntry);
        onClick('entstehungNewBtn', newEntry);
        onClick('sitzungNewBtn', newEntry);
        ['homeUploadAllBtn', 'entstehungUploadAllBtn', 'sitzungUploadAllBtn'].forEach(id => {
          onClick(id, () => {
            const input = document.getElementById('uploadAllInput');
            if (input) input.click();
          });
        });
        onClick('saveBtn', saveEntry);
        onClick('deleteBtn', deleteEntry);
        onClick('cancelEdit', () => {
          if (!confirmLeaveEditor()) return;
          dirty = false;
          if (currentIndex !== null && entries[currentIndex] && entries[currentIndex].type === STORY_CAT) showEntstehung();
          else if (currentIndex !== null && entries[currentIndex] && entries[currentIndex].type === SESSION_CAT) showSitzung();
          else if (currentIndex !== null) loadEntry(currentIndex);
          else if (isCatalogPage(currentPage)) showCatalog(currentPage);
          else if (currentPage === 'entstehung') showEntstehung();
          else if (currentPage === 'sitzung') showSitzung();
          else if (currentPage === 'map') showMap();
          else showHome();
        });
        onClick('editCurrent', editCurrent);
        onClick('entryToKarteBtn', createKampfKarteFromEntry);
        onClick('downloadOneBtn', downloadOneEntry);
        onClick('uploadOneBtn', () => {
          if (!isDM || currentIndex === null) return;
          const input = document.getElementById('uploadOneInput');
          if (input) input.click();
        });
        onEv('uploadAllInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadAllEntries(file);
        });
        onEv('uploadOneInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadOneEntry(file);
        });
        onClick('uploadEntryImageBtn', () => {
          if (!isDM) return;
          const input = document.getElementById('entryImageInput');
          if (input) input.click();
        });
        onClick('ocrEntryImageBtn', () => { readStatSheetFromEditorImage(); });
        onClick('removeEntryImageBtn', () => {
          pendingEntryImage = false;
          setEditorImagePreview(null);
          dirty = true;
        });
        onEv('entryImageInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file || !isDM) return;
          try {
            toast('Bild wird vorbereitet…');
            const data = await fileToEntryImage(file);
            pendingEntryImage = data;
            setEditorImagePreview(data);
            dirty = true;
            toast('Bild bereit. Jetzt Speichern, damit es für alle sichtbar ist.');
          } catch (err) {
            toast(err.message || 'Bild konnte nicht gelesen werden.');
          }
        });
        ['title', 'type', 'visibility', 'sessionDate'].forEach(id => {
          onEv(id, 'input', () => { dirty = true; });
          onEv(id, 'change', () => { dirty = true; });
        });
        onEv('type', 'change', () => {
          syncSessionDateField();
          syncTitleKingdomField();
        });
        onEv('titleKingdom', 'change', () => { dirty = true; });
        onEv('content', 'input', () => { dirty = true; });
      });

      safeBind('player', () => {
        onClick('chatBtn', () => toggleChat());
        onClick('chatCloseBtn', () => toggleChat(false));
        onEv('chatForm', 'submit', ev => {
          ev.preventDefault();
          const input = document.getElementById('chatInput');
          const text = input ? input.value : '';
          sendChatMessage(text).then(() => {
            if (input) input.value = '';
          });
        });
        onClick('playerButton', () => {
          if (currentPlayerId) {
            if (currentPage === 'char' && sheetDirty && !confirm('Das Charakterblatt ist nicht gespeichert. Wirklich abmelden?')) return;
            sheetDirty = false;
            setPlayer(null);
            if (currentPage === 'char') renderCharakter();
            toast('Spieler abgemeldet.');
          } else {
            openPlayerLogin('login');
          }
        });
        onClick('playerTabLogin', () => setPlayerFormMode('login'));
        onClick('playerTabRegister', () => setPlayerFormMode('register'));
        onClick('playerCancel', closePlayerLogin);
        onEv('playerOverlay', 'click', ev => {
          if (ev.target === document.getElementById('playerOverlay')) closePlayerLogin();
        });
        onEv('playerForm', 'submit', async ev => {
          ev.preventDefault();
          const nameEl = document.getElementById('playerUser');
          const passEl = document.getElementById('playerPassword');
          const errEl = document.getElementById('playerError');
          if (!nameEl || !passEl || !errEl) return;
          const name = nameEl.value;
          const password = passEl.value;
          errEl.textContent = '';
          try {
            if (playerFormMode === 'register') {
              const againEl = document.getElementById('playerPassword2');
              const again = againEl ? againEl.value : '';
              if (password !== again) throw new Error('Die Passwörter stimmen nicht überein.');
              await registerPlayer(name, password);
              closePlayerLogin();
              toast('Willkommen, ' + playerAccounts[currentPlayerId].name + '.');
            } else {
              loginPlayer(name, password);
              closePlayerLogin();
              toast('Angemeldet als ' + playerAccounts[currentPlayerId].name + '.');
            }
            showCharakter();
          } catch (err) {
            errEl.textContent = err.message || 'Das hat nicht geklappt.';
          }
        });
      });

      safeBind('dm', () => {
        onClick('dmMenuBtn', ev => {
          ev.stopPropagation();
          toggleDmMenu();
        });
        onClick('dmMenuSitzung', () => {
          closeDmMenu();
          showSitzung();
        });
        onClick('dmMenuMyDoc', () => {
          closeDmMenu();
          downloadMyDocument();
        });
        onClick('dmButton', () => {
          if (isDM) setDM(false);
          else openLogin();
        });
        onClick('loginCancel', closeLogin);
        onEv('loginOverlay', 'click', ev => {
          if (ev.target === document.getElementById('loginOverlay')) closeLogin();
        });
        onClick('dndActionClose', closeDndActionInfo);
        onClick('dndActionDismiss', closeDndActionInfo);
        onClick('dndActionSave', saveDndActionText);
        onEv('dndActionOverlay', 'click', ev => {
          if (ev.target === document.getElementById('dndActionOverlay')) closeDndActionInfo();
        });
        onEv('loginForm', 'submit', ev => {
          ev.preventDefault();
          const userEl = els.dmUser;
          const passEl = els.dmPassword;
          if (!userEl || !passEl) return;
          const userOk = (userEl.value || '').trim().toLowerCase() === DM_USER;
          const passOk = encodeSecret(passEl.value) === DM_PASS;
          if (userOk && passOk) {
            closeLogin();
            setDM(true);
            toast('Angemeldet als DM.');
          } else if (els.loginError) {
            els.loginError.textContent = 'Benutzername oder Passwort stimmt nicht.';
          }
        });
      });

      safeBind('map', () => {
        onClick('placePinBtn', () => {
          if (!isDM) return;
          setPlacingPin(!placingPin);
        });
        onClick('mapZoomIn', () => zoomMapBy(0.35));
        onClick('mapZoomOut', () => zoomMapBy(-0.35));
        onClick('mapZoomReset', resetMapView);
        onEv('mapWrap', 'wheel', ev => {
          if (mapScale <= 1 && !ev.ctrlKey) return;
          ev.preventDefault();
          const step = ev.deltaY > 0 ? -0.18 : 0.18;
          zoomMapAt(ev.clientX, ev.clientY, mapScale + step);
        }, { passive: false });
        onEv('mapWrap', 'pointerdown', ev => {
          if (ev.button && ev.button !== 0) return;
          if (placingPin || drawingBorder) return;
          if (ev.target.closest('.map-pin-del') || ev.target.closest('.map-border-del')) return;
          const pinEl = ev.target.closest('.map-pin');
          const wrap = document.getElementById('mapWrap');
          if (!wrap) return;
          if (pinEl && isDM) {
            ev.preventDefault();
            mapDrag = { type: 'pin', id: pinEl.dataset.pinId, el: pinEl, x: ev.clientX, y: ev.clientY, moved: false };
            wrap.classList.add('panning');
            wrap.setPointerCapture(ev.pointerId);
            return;
          }
          if (pinEl) {
            mapDrag = { type: 'pin-click', id: pinEl.dataset.pinId, x: ev.clientX, y: ev.clientY, moved: false };
            wrap.setPointerCapture(ev.pointerId);
            return;
          }
          if (mapScale <= 1) return;
          ev.preventDefault();
          const hit = ev.target.closest('.map-border-hit');
          mapDrag = {
            type: 'pan',
            id: ev.pointerId,
            x: ev.clientX,
            y: ev.clientY,
            panX: mapPanX,
            panY: mapPanY,
            moved: false,
            borderId: hit ? (hit.getAttribute('data-border-id') || '') : null
          };
          wrap.classList.add('panning');
          wrap.setPointerCapture(ev.pointerId);
        });
        document.addEventListener('pointermove', ev => {
          if (!mapDrag) return;
          if (mapDrag.type === 'pan' || mapDrag.type === 'pin') ev.preventDefault();
          const dx = ev.clientX - mapDrag.x;
          const dy = ev.clientY - mapDrag.y;
          if (!mapDrag.moved && (dx * dx + dy * dy) > 36) mapDrag.moved = true;
          if (!mapDrag.moved) return;
          if (mapDrag.type === 'pan') {
            mapPanX = mapDrag.panX + dx;
            mapPanY = mapDrag.panY + dy;
            applyMapTransform();
            return;
          }
          if (mapDrag.type === 'pin') {
            const pos = mapClickToPercent(ev);
            if (!pos) return;
            const pin = mapPins.find(p => p.id === mapDrag.id);
            if (!pin) return;
            pin.x = pos.x;
            pin.y = pos.y;
            if (mapDrag.el) {
              mapDrag.el.style.left = pos.x + '%';
              mapDrag.el.style.top = pos.y + '%';
            }
          }
        });
        document.addEventListener('pointerup', async ev => {
          const wrap = document.getElementById('mapWrap');
          if (wrap) wrap.classList.remove('panning');
          const drag = mapDrag;
          mapDrag = null;
          if (!drag) return;
          if (drag.type === 'pin' && drag.moved) {
            try { await persistPins(); toast('Ort verschoben.'); }
            catch (err) { toast('Konnte den Ort nicht speichern: ' + err.message); }
            return;
          }
          if ((drag.type === 'pin' || drag.type === 'pin-click') && !drag.moved) {
            openMapPin(drag.id);
            return;
          }
          if (drag.type === 'pan' && !drag.moved && drag.borderId && isDM) {
            openBorderEditor(drag.borderId);
          }
        });
        document.addEventListener('pointercancel', () => {
          mapDrag = null;
          const wrap = document.getElementById('mapWrap');
          if (wrap) wrap.classList.remove('panning');
        });
        onEv('mapStage', 'click', ev => {
          if (!isDM) return;
          if (ev.target.closest('.map-pin') || ev.target.closest('.map-border-del')) return;
          const pos = mapClickToPercent(ev);
          if (!pos) return;
          if (drawingBorder) {
            borderDraft.push(pos);
            renderMapBorders();
            return;
          }
          if (!placingPin) return;
          pendingPin = pos;
          openPinPicker();
        });
        onClick('drawBorderBtn', () => {
          if (!isDM) return;
          if (!drawingBorder) {
            setDrawingBorder(true);
            return;
          }
          if (borderDraft.length < 3) {
            editingBorderId = null;
            setDrawingBorder(false);
            toast('Zeichnen abgebrochen.');
            return;
          }
          finishBorderDraft();
        });
        onClick('mapLegendBtn', () => {
          const box = document.getElementById('mapLegend');
          if (!box) return;
          const hide = !box.classList.contains('hidden');
          box.classList.toggle('hidden', hide);
          if (!hide) renderMapLegend();
          if (isMapFullscreen()) requestAnimationFrame(() => applyMapTransform());
        });
        onClick('mapFullBtn', toggleMapFullscreen);
        onClick('pinNoEntry', () => {
          const nameEl = document.getElementById('pinLabel');
          const name = ((nameEl && nameEl.value) || '').trim();
          if (!name) return toast('Bitte einen Namen für die Markierung eingeben.');
          applyPinChoice(name, false);
        });
        onClick('pinSaveEdit', () => {
          const nameEl = document.getElementById('pinLabel');
          const name = ((nameEl && nameEl.value) || '').trim();
          savePinEdits(name, false);
        });
        onEv('borderForm', 'submit', ev => {
          ev.preventDefault();
          const nameEl = document.getElementById('borderName');
          const colorEl = document.getElementById('borderColor');
          const name = ((nameEl && nameEl.value) || '').trim();
          if (!name) return toast('Bitte einen Namen für die Grenze vergeben.');
          saveBorderDraft(name, colorEl ? colorEl.value : '');
        });
        onClick('borderRedraw', () => {
          if (!isDM || !editingBorderId) return;
          const overlay = document.getElementById('borderOverlay');
          if (overlay) overlay.classList.add('hidden');
          setDrawingBorder(true);
        });
        onClick('borderCancel', () => {
          const overlay = document.getElementById('borderOverlay');
          if (overlay) overlay.classList.add('hidden');
          if (drawingBorder && !editingBorderId) setDrawingBorder(false);
          else if (!drawingBorder) editingBorderId = null;
        });
        onEv('worldMap', 'load', () => {
          renderMapPins();
          applyMapTransform();
        });
        window.addEventListener('resize', () => {
          if (currentPage === 'map') applyMapTransform();
        });
        onEv('pinSearch', 'input', renderPinPicker);
        onClick('pinCancel', closePinPicker);
        onEv('pinOverlay', 'click', ev => {
          if (ev.target === document.getElementById('pinOverlay')) closePinPicker();
        });
        onClick('uploadMapBtn', () => {
          if (!isDM) return;
          const input = document.getElementById('mapFileInput');
          if (input) input.click();
        });
        onEv('mapFileInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadMapFile(file);
        });
      });
    }

    bindAll();
    loadSoundPrefs();
    loadDicePrefs();
    renderSoundFxButtons();
    renderDiceTray();
    renderDiceLog();
    if (sessionStorage.getItem(SESSION_KEY) === '1') setDM(true);
    else {
      syncSoundUi();
      applyDiceToolsUi();
    }

    window.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape') return;
      if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.isContentEditable)) {
        if (ev.target.id === 'globalSearch') return;
      }
      if (chatOpen) { toggleChat(false); return; }
      const login = document.getElementById('loginOverlay');
      if (login && !login.classList.contains('hidden')) { closeLogin(); return; }
      const dndAction = document.getElementById('dndActionOverlay');
      if (dndAction && !dndAction.classList.contains('hidden')) { closeDndActionInfo(); return; }
      const player = document.getElementById('playerOverlay');
      if (player && !player.classList.contains('hidden')) { closePlayerLogin(); return; }
      const pin = document.getElementById('pinOverlay');
      if (pin && !pin.classList.contains('hidden')) { closePinPicker(); return; }
      const soundPick = document.getElementById('soundPickOverlay');
      if (soundPick && !soundPick.classList.contains('hidden')) { closeSoundPicker(); return; }
      if (diceTrayOpen) { closeDiceTray(); return; }
      if (diceLogOpen) { closeDiceLog(); return; }
      if (soundDockOpen) { closeSoundDock(); return; }
      const gallery = document.getElementById('battleGalleryOverlay');
      if (gallery && !gallery.classList.contains('hidden')) { closeBattleGallery(); return; }
      const statSheet = document.getElementById('statSheetOverlay');
      if (statSheet && !statSheet.classList.contains('hidden')) { closeStatSheetOverlay(); return; }
      const border = document.getElementById('borderOverlay');
      if (border && !border.classList.contains('hidden')) {
        const cancel = document.getElementById('borderCancel');
        if (cancel) cancel.click();
        return;
      }
      if (kampfAimFrom) { cancelKampfAim(); return; }
      const gear = document.getElementById('kampfBattleGearPanel');
      if (gear && !gear.classList.contains('hidden')) { closeKampfBattleGear(); return; }
      if (isMapFullscreen()) { setMapFullscreen(false); return; }
      const searchBox = document.getElementById('searchResults');
      if (searchBox && !searchBox.classList.contains('hidden')) {
        closeSearchResults();
        return;
      }
      if (els.sidebar && els.sidebar.classList.contains('open')) setSidebarOpen(false);
    });

    window.addEventListener('beforeunload', ev => {
      const editing = dirty && isDM && els.editorView && !els.editorView.classList.contains('hidden');
      const sheet = sheetDirty && els.charView && !els.charView.classList.contains('hidden');
      if (!editing && !sheet) return;
      ev.preventDefault();
      ev.returnValue = '';
    });

    (async function boot() {
      loadRosterLocal();
      loadCombatTemplatesLocal();
      loadBattleLocal();
      loadBattleGalleryLocal();
      loadCombat();
      if (!initFirebase()) toast('Keine Verbindung zur Cloud.');
      const localPack = readLocalPack();
      let remotePack = null;
      if (db) {
        try {
          const snap = await worldRef().get();
          if (snap.exists) remotePack = parseWorldPayload(snap.data());
          const mapSnap = await mapRef().get();
          if (mapSnap.exists) applyMap(mapSnap.data());
          const pinSnap = await pinsRef().get();
          if (pinSnap.exists) applyPins(pinSnap.data());
          const playerSnap = await playersRef().get();
          if (playerSnap.exists) applyPlayers(playerSnap.data());
          const rosterSnap = await rosterRef().get();
          if (rosterSnap.exists) applyRoster(rosterSnap.data());
          const tplSnap = await templatesRef().get();
          if (tplSnap.exists) applyCombatTemplates(tplSnap.data());
          else if (combatTemplates.length) persistCombatTemplatesRemote();
          const battleSnap = await battleRef().get();
          if (battleSnap.exists) applyBattle(battleSnap.data());
          const battleMapSnap = await battleMapRef().get();
          if (battleMapSnap.exists) applyBattleMap(battleMapSnap.data());
          const gallerySnap = await battleGalleryRef().get();
          if (gallerySnap.exists) applyBattleGallery(gallerySnap.data());
          const combatSnap = await combatRef().get();
          if (combatSnap.exists) applyCombat(combatSnap.data());
          else if (combat.combatants.length) persistCombat();
        } catch (err) {
          console.warn(err);
          toast('Keine Verbindung zur Cloud.');
        }
      }

      const remoteAt = remotePack ? Number(remotePack.updatedAt) || 0 : 0;
      const localAt = localPack ? Number(localPack.updatedAt) || 0 : 0;
      const localHas = !!(localPack && localPack.entries && localPack.entries.length);
      let chosen = { entries: [], updatedAt: 0 };
      let upload = false;

      if (remotePack && localPack && localAt > remoteAt) {
        chosen = localPack;
        upload = true;
        toast('Lokaler Codex war neuer und wird in die Cloud übernommen.');
      } else if (remotePack) {
        chosen = remotePack;
      } else if (localHas) {
        chosen = localPack;
        upload = true;
      } else {
        try {
          const r = await fetch('world.json');
          if (r.ok) {
            const seedPack = parseWorldPayload(await r.json());
            if (seedPack && seedPack.entries && seedPack.entries.length) {
              chosen = { entries: seedPack.entries, updatedAt: Date.now() };
              upload = true;
            }
          }
        } catch (err) {}
      }

      entries = chosen.entries || [];
      worldUpdatedAt = chosen.updatedAt || 0;
      persistLocal();
      if (db && upload) {
        try {
          await persistWorld();
        } catch (err) {
          console.warn(err);
        }
      }

      const savedPlayer = sessionStorage.getItem(PLAYER_SESSION_KEY) || (function () {
        try { return localStorage.getItem(PLAYER_SESSION_KEY); } catch (err) { return null; }
      })();
      if (savedPlayer && playerAccounts[savedPlayer]) setPlayer(savedPlayer);

      restoreSessionView();
      listenWorld();
      listenMap();
      listenPins();
      listenPlayers();
      syncChatListeners();
      listenRoster();
      listenCombatTemplates();
      listenBattle();
      listenBattleGallery();
      listenCombat();
      listenDiceLog();
    })().catch(err => {
      console.warn(err);
      toast('Die Seite konnte nicht vollständig starten. Bitte neu laden.');
    });