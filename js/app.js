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

    function normalizeSheet(sheet) {
      if (!sheet) return Object.assign({}, EMPTY_SHEET);
      if (typeof sheet === 'string') {
        const s = Object.assign({}, EMPTY_SHEET);
        if (sheet.indexOf(OLD_SHEET_MARK) !== -1) s.extra = '';
        else s.extra = sheet;
        return s;
      }
      return Object.assign({}, EMPTY_SHEET, sheet);
    }

    function fillSheetForm(sheet) {
      const s = normalizeSheet(sheet);
      if (usesDndSheet(currentSheetOwner)) fillDndForm(s);
      document.getElementById('sheetName').value = s.name || '';
      document.getElementById('sheetVolk').value = s.volk || '';
      document.getElementById('sheetKlasse').value = s.klasse || '';
      document.getElementById('sheetStufe').value = s.stufe || '';
      document.getElementById('sheetHp').value = s.hp || '';
      document.getElementById('sheetArmor').value = s.armor || '';
      document.getElementById('sheetStats').value = s.stats || EMPTY_SHEET.stats;
      document.getElementById('sheetNotes').value = s.notes || '';
      document.getElementById('sheetContent').innerHTML = sanitizeHtml(s.extra || '');
      sheetPortraitId = s.portraitId || '';
      pendingSheetPortrait = null;
      const previewId = s.portraitId || '';
      setSheetPortraitPreview(null);
      if (previewId && imageCache[previewId]) setSheetPortraitPreview(imageCache[previewId]);
      else if (previewId) {
        loadEntryImage(previewId).then(data => {
          if (pendingSheetPortrait || sheetPortraitId !== previewId) return;
          if (data) setSheetPortraitPreview(data);
        }).catch(() => {});
      }
    }

    function setSheetPortraitPreview(src) {
      const wrap = document.getElementById('sheetPortraitPreview');
      const img = document.getElementById('sheetPortraitImg');
      const removeBtn = document.getElementById('removeSheetPortraitBtn');
      const ocrBtn = document.getElementById('ocrSheetPortraitBtn');
      const dndImg = document.getElementById('dndPortraitImg');
      const dndBtn = document.getElementById('dndPortraitBtn');
      if (dndImg) {
        if (src) {
          dndImg.src = src;
          dndImg.classList.remove('is-empty');
        } else {
          dndImg.removeAttribute('src');
          dndImg.classList.add('is-empty');
        }
      }
      if (dndBtn) dndBtn.classList.toggle('is-empty', !src);
      if (!src) {
        wrap.classList.add('hidden');
        img.removeAttribute('src');
        removeBtn.classList.toggle('hidden', !sheetPortraitId && !pendingSheetPortrait);
        if (ocrBtn) ocrBtn.classList.add('hidden');
        return;
      }
      img.src = src;
      wrap.classList.remove('hidden');
      removeBtn.classList.remove('hidden');
      if (ocrBtn) ocrBtn.classList.toggle('hidden', currentSheetOwner !== VEYR_OWNER);
    }

    function readSheetForm() {
      if (usesDndSheet(currentSheetOwner)) return readDndForm();
      return {
        name: document.getElementById('sheetName').value.trim(),
        volk: document.getElementById('sheetVolk').value.trim(),
        klasse: document.getElementById('sheetKlasse').value.trim(),
        stufe: document.getElementById('sheetStufe').value.trim(),
        hp: document.getElementById('sheetHp').value.trim(),
        armor: document.getElementById('sheetArmor').value.trim(),
        stats: document.getElementById('sheetStats').value.trim(),
        notes: document.getElementById('sheetNotes').value,
        extra: sanitizeHtml(document.getElementById('sheetContent').innerHTML),
        portraitId: sheetPortraitId || ''
      };
    }

    function clearSheetForm() {
      fillSheetForm(EMPTY_SHEET);
    }

    function playerIdFromName(name) {
      return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    }

    function isReptileAccountId(id) {
      const s = String(id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      return s === 'drreptile' || s === 'reptile';
    }

    function isReptileName(name) {
      const s = String(name || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, '');
      return s === 'drreptile' || s === 'reptile' || s.indexOf('reptile') >= 0;
    }

    function isBjoernLogin(name) {
      return /bj[öo]rn/i.test(String(name || '').trim());
    }

    function renameReptileToBjoern(accs) {
      if (!accs) return false;
      let changed = false;
      Object.keys(accs).forEach(id => {
        const acc = accs[id];
        if (!acc) return;
        const forceChris = id === 'chris';
        if (forceChris || isReptileAccountId(id) || isReptileName(acc.name)) {
          if (acc.name !== 'Björn') {
            acc.name = 'Björn';
            changed = true;
          }
        }
        if (acc.sheet && (isReptileName(acc.sheet.name) || (forceChris && !String(acc.sheet.name || '').trim()))) {
          if (acc.sheet.name !== 'Björn') {
            acc.sheet.name = 'Björn';
            changed = true;
          }
        }
        const alts = acc.alts || {};
        Object.keys(alts).forEach(key => {
          const alt = alts[key];
          if (!alt) return;
          if (isReptileName(alt.name)) {
            alt.name = 'Björn';
            changed = true;
          }
          if (alt.sheet && isReptileName(alt.sheet.name)) {
            alt.sheet.name = 'Björn';
            changed = true;
          }
        });
      });
      return changed;
    }

    function ensureBjoernFighterExtras(accs) {
      const acc = accs && accs.chris;
      if (!acc || !acc.sheet) return false;
      if (!acc.sheet.dnd || typeof acc.sheet.dnd !== 'object') acc.sheet.dnd = emptyDndSheet();
      const dnd = acc.sheet.dnd;
      let changed = false;
      const gear = String(dnd.gear || '');
      if (!/sunburst/i.test(gear)) {
        dnd.gear = gear.replace(/\s+$/, '') + (gear.trim() ? '\n' : '') + 'Sunburst-Token';
        changed = true;
      }
      (Array.isArray(dnd.attacks) ? dnd.attacks : []).forEach(a => {
        if (!a || !/crossbow|armbrust/i.test(String(a.name || ''))) return;
        if (String(a.range || '').trim()) return;
        a.range = '80 ft. / 320 ft.';
        changed = true;
      });
      if (!String(dnd.age || '').trim()) { dnd.age = 'TBD'; changed = true; }
      if (!String(dnd.skin || '').trim()) { dnd.skin = 'white boi'; changed = true; }
      if (!String(dnd.weight || '').trim()) { dnd.weight = 'Several hamsters'; changed = true; }
      const app = String(dnd.appearance || '').replace(/\r/g, '').trim();
      if (/^Age:\s*TBD\s+Skin:\s*white boi\s+Weight:\s*Several hamsters$/i.test(app)) {
        dnd.appearance = '';
        changed = true;
      }
      return changed;
    }

    function accountIdFromLoginName(name) {
      const id = playerIdFromName(name);
      if (playerAccounts[id]) return id;
      if (isBjoernLogin(name) || isReptileName(name)) {
        const found = Object.keys(playerAccounts).find(k => isReptileAccountId(k) || isReptileName(playerAccounts[k] && playerAccounts[k].name));
        if (found) return found;
      }
      return id;
    }

    function isNpcOwner(owner) {
      return typeof owner === 'string' && owner.indexOf(NPC_PREFIX) === 0;
    }

    function npcIdFromOwner(owner) {
      return isNpcOwner(owner) ? String(owner).slice(NPC_PREFIX.length) : '';
    }

    function newNpcId() {
      return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function usesDndSheet(owner) {
      if (!owner || isDmNotesOwner(owner)) return false;
      if (isNpcOwner(owner)) return true;
      if (owner === ILLUSION_OWNER) return false;
      if (owner === VEYR_OWNER) return true;
      return String(owner).indexOf(':') < 0;
    }

    function dndOwnerName() {
      const rec = sheetOwnerRecord(currentSheetOwner);
      if (rec && rec.sheet && String(rec.sheet.name || '').trim()) return rec.sheet.name;
      if (rec && rec.name) return rec.name;
      return '';
    }

    function sheetAccountId(owner) {
      return String(owner || '').split(':')[0] || '';
    }

    function isDmNotesOwner(owner) {
      return owner === DM_NOTES_OWNER;
    }

    function sheetOwnerRecord(owner) {
      if (!owner) return null;
      if (isNpcOwner(owner)) {
        const npc = npcAccounts[npcIdFromOwner(owner)];
        if (!npc) return null;
        return { name: npc.name, sheet: npc.sheet, isAlt: false, isNpc: true, accountId: owner };
      }
      const parts = String(owner).split(':');
      const acc = playerAccounts[parts[0]];
      if (!acc) return null;
      if (parts.length < 2) {
        return { name: acc.name, sheet: acc.sheet, isAlt: false, accountId: parts[0] };
      }
      const alt = acc.alts && acc.alts[parts[1]];
      if (!alt) return null;
      return { name: alt.name, sheet: alt.sheet, isAlt: true, accountId: parts[0] };
    }

    function setOwnerSheet(owner, sheet) {
      if (isNpcOwner(owner)) {
        const npc = npcAccounts[npcIdFromOwner(owner)];
        if (npc) npc.sheet = sheet;
        return;
      }
      const rec = sheetOwnerRecord(owner);
      if (!rec) return;
      if (!rec.isAlt) {
        playerAccounts[rec.accountId].sheet = sheet;
        return;
      }
      playerAccounts[rec.accountId].alts[String(owner).split(':')[1]].sheet = sheet;
    }

    function canEditOwnerSheet(owner) {
      if (isDM) return true;
      if (isNpcOwner(owner)) return false;
      if (!currentPlayerId || !owner) return false;
      return sheetAccountId(owner) === currentPlayerId;
    }

    function isOwnCombatOwner(ownerId) {
      if (!currentPlayerId || !ownerId) return false;
      return sheetAccountId(ownerId) === currentPlayerId;
    }

    function combatOwnerLabel(ownerId) {
      const rec = sheetOwnerRecord(ownerId);
      return rec ? rec.name : ownerId;
    }

    function combatSheetOwners() {
      ensureVeyrAlt(playerAccounts);
      ensureIllusionAlt(playerAccounts);
      const ids = Object.keys(playerAccounts).sort((a, b) =>
        playerAccounts[a].name.localeCompare(playerAccounts[b].name, 'de')
      );
      const out = [];
      ids.forEach(id => {
        out.push(id);
        if (id === YUVI_ID && playerAccounts[YUVI_ID] && playerAccounts[YUVI_ID].alts && playerAccounts[YUVI_ID].alts[VEYR_ALT]) {
          out.push(VEYR_OWNER);
        }
        if (id === CHRIS_ID && playerAccounts[CHRIS_ID] && playerAccounts[CHRIS_ID].alts && playerAccounts[CHRIS_ID].alts[ILLUSION_ALT]) {
          out.push(ILLUSION_OWNER);
        }
      });
      return out;
    }

    function normalizeAltEntry(raw, fallbackName) {
      const e = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      const type = e.type === 'Niederfänge' ? 'Niederfänge' : 'Hochfänge';
      return {
        title: String(e.title || fallbackName || 'Veyr').trim() || 'Veyr',
        type: type,
        content: typeof e.content === 'string' ? e.content : '',
        imageId: typeof e.imageId === 'string' ? e.imageId : ''
      };
    }

    function ensureVeyrAlt(accs) {
      const acc = accs && accs[YUVI_ID];
      if (!acc) return;
      if (!acc.alts || typeof acc.alts !== 'object') acc.alts = {};
      if (acc.alts.holger && !acc.alts.veyr) {
        acc.alts.veyr = acc.alts.holger;
        delete acc.alts.holger;
      }
      if (!acc.alts[VEYR_ALT]) {
        acc.alts[VEYR_ALT] = {
          name: 'Veyr',
          sheet: Object.assign({}, EMPTY_SHEET, { name: 'Veyr' }),
          entry: normalizeAltEntry({ title: 'Veyr' }, 'Veyr')
        };
      } else {
        acc.alts[VEYR_ALT].name = 'Veyr';
        const alt = acc.alts[VEYR_ALT];
        if (!alt.sheet) alt.sheet = Object.assign({}, EMPTY_SHEET, { name: 'Veyr' });
        const sheet = alt.sheet;
        if (!sheet.name || sheet.name === 'Holger') sheet.name = 'Veyr';
        if (!alt.entry) {
          alt.entry = normalizeAltEntry({
            title: 'Veyr',
            content: sheet.extra,
            imageId: sheet.portraitId
          }, 'Veyr');
        } else {
          alt.entry = normalizeAltEntry(alt.entry, 'Veyr');
        }
        if (!htmlToText(sheet.extra || '').trim() && alt.entry.content) sheet.extra = alt.entry.content;
        if (!sheet.portraitId && alt.entry.imageId) sheet.portraitId = alt.entry.imageId;
        if ((!sheet.name || sheet.name === 'Veyr') && alt.entry.title && alt.entry.title !== 'Veyr') {
          sheet.name = alt.entry.title;
        }
      }
    }

    function ensureVeyrDrakeSheet(accs) {
      const acc = accs && accs[YUVI_ID];
      if (!acc) return false;
      if (!acc.alts || !acc.alts[VEYR_ALT]) ensureVeyrAlt(accs);
      const alt = accs[YUVI_ID] && accs[YUVI_ID].alts && accs[YUVI_ID].alts[VEYR_ALT];
      if (!alt || !alt.sheet) return false;
      const sheet = alt.sheet;
      const dnd = normalizeDndSheet(sheet.dnd);
      if ((dnd.attacks || []).some(a => a && String(a.name || '').trim())) {
        sheet.dnd = dnd;
        return false;
      }
      const lucan = accs[YUVI_ID] && accs[YUVI_ID].sheet && accs[YUVI_ID].sheet.dnd;
      const lvl = Math.max(1, Number(String((lucan && lucan.stufe) || sheet.stufe || '4').replace(/\D/g, '')) || 4);
      const prof = lvl >= 5 ? 3 : 2;
      const hpMax = String(5 + 5 * lvl);
      dnd.name = 'Veyr';
      dnd.volk = 'Drake (klein)';
      dnd.klasse = 'Drake Companion';
      dnd.stufe = String(lvl);
      dnd.ac = String(14 + prof);
      dnd.speed = '40 ft.';
      dnd.hpMax = dnd.hpMax || hpMax;
      dnd.hpCurrent = dnd.hpCurrent || dnd.hpMax || hpMax;
      dnd.hitDice = lvl + 'd10';
      dnd.abilities.str = { score: 16, save: false };
      dnd.abilities.dex = { score: 12, save: true };
      dnd.abilities.con = { score: 15, save: false };
      dnd.abilities.int = { score: 8, save: false };
      dnd.abilities.wis = { score: 14, save: true };
      dnd.abilities.cha = { score: 8, save: false };
      dnd.skills.perception = 1;
      dnd.skills.stealth = 1;
      dnd.senses = 'Darkvision 60 ft.';
      dnd.immunities = 'Fire';
      dnd.languages = 'Draconic';
      dnd.reactions = 'Infused Strikes';
      dnd.attacks = [
        { id: combatNewId('a'), name: 'Bite', range: '5 ft.', bonus: '+5', hitRoll: '', damage: '1W6+2', dmgRoll: '', notes: 'Piercing', text: '' },
        { id: combatNewId('a'), name: 'Infused Strikes', range: '30 ft.', bonus: '', hitRoll: '', damage: '1W6', dmgRoll: '', notes: 'Reaction · Fire', text: '' }
      ];
      dnd.features = [
        { id: combatNewId('f'), name: 'Draconic Essence (Fire)', uses: '', used: '', reset: 'long', text: '' },
        { id: combatNewId('f'), name: 'Infused Strikes', uses: '', used: '', reset: 'long', text: '' }
      ];
      sheet.name = 'Veyr';
      sheet.volk = dnd.volk;
      sheet.klasse = dnd.klasse;
      sheet.stufe = dnd.stufe;
      sheet.armor = dnd.ac;
      sheet.hp = dnd.hpCurrent + ' / ' + dnd.hpMax;
      sheet.dnd = normalizeDndSheet(dnd);
      return true;
    }

    function ensureIllusionAlt(accs) {
      const acc = accs && accs[CHRIS_ID];
      if (!acc) return;
      if (!acc.alts || typeof acc.alts !== 'object') acc.alts = {};
      if (!acc.alts[ILLUSION_ALT]) {
        acc.alts[ILLUSION_ALT] = {
          name: 'Illusion',
          sheet: Object.assign({}, EMPTY_SHEET, { name: 'Illusion', hp: '1' })
        };
        return;
      }
      acc.alts[ILLUSION_ALT].name = 'Illusion';
      if (!acc.alts[ILLUSION_ALT].sheet) {
        acc.alts[ILLUSION_ALT].sheet = Object.assign({}, EMPTY_SHEET, { name: 'Illusion', hp: '1' });
      }
      const sheet = acc.alts[ILLUSION_ALT].sheet;
      sheet.name = 'Illusion';
      if (!String(sheet.hp || '').trim()) sheet.hp = '1';
    }

    function dndMetersToFeetText(raw) {
      return String(raw == null ? '' : raw).replace(/(\d+(?:[.,]\d+)?)\s*m\b/gi, (_, num) => {
        const n = Number(String(num).replace(',', '.'));
        if (!Number.isFinite(n) || n < 0) return _;
        const ft = Math.round((n * 10 / 3) / 5) * 5;
        return ft + ' ft.';
      });
    }

    function emptyDndSheet() {
      const abilities = {};
      DND_ABS.forEach(a => { abilities[a.id] = { score: 10, save: false }; });
      const skills = {};
      DND_SKILLS.forEach(s => { skills[s.id] = 0; });
      const spellSlots = {};
      for (let i = 1; i <= 9; i++) spellSlots[i] = { max: '', used: '' };
      return {
        name: '', volk: '', klasse: '', stufe: '',
        background: '', alignment: '', xp: '', playerName: '', inspiration: false, profBonus: '',
        abilities: abilities, skills: skills, jackOfAllTrades: false,
        ac: '', initiativeBonus: '', speed: '30 ft.',
        hpCurrent: '', hpMax: '', hpTemp: '', hitDice: '', hitDiceUsed: '',
        deathSuccess: 0, deathFail: 0,
        senses: '', resistances: '', immunities: '', vulnerabilities: '', conditions: '',
        armorProf: '', weaponProf: '', toolProf: '', languages: '',
        attacks: [], bonusActions: '', reactions: '', otherActions: '',
        spellAbility: 'int', spellSlots: spellSlots, spells: [],
        pp: '', gp: '', ep: '', sp: '', cp: '', attunement: ['', '', ''], items: [], gear: '',
        features: [], age: '', height: '', weight: '', eyes: '', skin: '', hair: '',
        appearance: '', personality: '', ideals: '', bonds: '', flaws: '',
        backstory: '', allies: '', enemies: '', organizations: '', notesOther: '',
        extras: '', creatures: '', tab: 'actions'
      };
    }

    function normalizeDndSheet(raw) {
      const base = emptyDndSheet();
      const src = raw && typeof raw === 'object' ? raw : {};
      Object.keys(base).forEach(key => {
        if (key === 'abilities' || key === 'skills' || key === 'spellSlots' || key === 'attunement') return;
        if (src[key] !== undefined) base[key] = src[key];
      });
      DND_ABS.forEach(a => {
        const s = src.abilities && src.abilities[a.id];
        base.abilities[a.id] = {
          score: Math.max(1, Number((s && s.score) || 10) || 10),
          save: !!(s && s.save)
        };
      });
      DND_SKILLS.forEach(sk => {
        const n = Number(src.skills && src.skills[sk.id]);
        base.skills[sk.id] = n === 2 || n === 1 ? n : 0;
      });
      for (let i = 1; i <= 9; i++) {
        const s = src.spellSlots && src.spellSlots[i];
        base.spellSlots[i] = { max: s && s.max != null ? String(s.max) : '', used: s && s.used != null ? String(s.used) : '' };
      }
      base.attunement = [0, 1, 2].map(i => String((src.attunement && src.attunement[i]) || ''));
      base.gear = String(src.gear != null ? src.gear : '');
      if (!base.gear.trim()) {
        const lines = [];
        (Array.isArray(src.items) ? src.items : []).forEach(x => {
          if (!x) return;
          const name = String(x.name || '').trim();
          const qty = String(x.qty || '').trim();
          const notes = String(x.notes || '').trim();
          if (!name && !notes) return;
          let line = name;
          if (qty && qty !== '1') line += ' ×' + qty;
          if (notes) line += (line ? ' — ' : '') + notes;
          if (line) lines.push(line);
        });
        const attune = base.attunement.map(s => String(s || '').trim()).filter(Boolean);
        if (attune.length) {
          if (lines.length) lines.push('');
          attune.forEach(s => lines.push(s));
        }
        base.gear = lines.join('\n');
      }
      base.inspiration = !!src.inspiration;
      base.jackOfAllTrades = !!src.jackOfAllTrades;
      base.deathSuccess = Math.max(0, Math.min(3, Number(src.deathSuccess) || 0));
      base.deathFail = Math.max(0, Math.min(3, Number(src.deathFail) || 0));
      const list = (arr, shape) => (Array.isArray(arr) ? arr : []).map(shape).filter(Boolean);
      base.attacks = list(src.attacks, x => x && {
        id: x.id || combatNewId('a'), name: String(x.name || ''), range: dndMetersToFeetText(x.range || ''),
        bonus: String(x.bonus || ''), hitRoll: String(x.hitRoll || ''),
        damage: String(x.damage || ''), dmgRoll: String(x.dmgRoll || ''),
        notes: dndMetersToFeetText(x.notes || ''), text: dndMetersToFeetText(x.text || '')
      });
      base.spells = list(src.spells, x => x && {
        id: x.id || combatNewId('s'),
        level: String(x.level || '0'),
        name: String(x.name || ''),
        prepared: !!x.prepared,
        time: String(x.time || ''),
        range: dndMetersToFeetText(x.range || ''),
        hit: String(x.hit || ''),
        damage: String(x.damage || ''),
        concentration: !!x.concentration,
        ritual: !!x.ritual,
        notes: dndMetersToFeetText(x.notes || ''),
        text: dndMetersToFeetText(x.text || '')
      });
      base.items = list(src.items, x => x && {
        id: x.id || combatNewId('i'), name: String(x.name || ''), qty: String(x.qty || '1'),
        weight: String(x.weight || ''), equipped: !!x.equipped, attuned: !!x.attuned, notes: String(x.notes || '')
      });
      base.features = list(src.features, x => x && {
        id: x.id || combatNewId('f'), name: String(x.name || ''), uses: String(x.uses || ''),
        used: String(x.used || ''), reset: /^(short|long|dawn)$/.test(x.reset) ? x.reset : 'long',
        text: String(x.text || '')
      });
      if (!['actions', 'spells', 'inventory', 'features', 'description', 'notes', 'extras'].includes(base.tab)) base.tab = 'actions';
      base.speed = dndMetersToFeetText(base.speed);
      base.senses = dndMetersToFeetText(base.senses);
      return base;
    }

    var dndState = emptyDndSheet();
    var dndActFilter = 'all';
    var dndSpellFilter = 'all';
    var dndAttackEditId = '';
    var dndSpellEditId = '';

    function dndParseDice(raw) {
      const s = String(raw || '').replace(/\s/g, '').replace(',', '.');
      const m = s.match(/^(\d*)[wWdD](\d+)([+-]\d+)?$/i);
      if (!m) return null;
      return { n: Math.max(1, Number(m[1] || 1)), sides: Number(m[2]), add: Number(m[3] || 0) };
    }

    function dndRollDiceParts(raw) {
      const p = dndParseDice(raw);
      if (!p) return null;
      const rolls = [];
      for (let i = 0; i < p.n; i++) rolls.push(1 + Math.floor(Math.random() * p.sides));
      let total = p.add;
      rolls.forEach(v => { total += v; });
      return { total: total, rolls: rolls, sides: p.sides, add: p.add };
    }

    function dndRollDice(raw) {
      const r = dndRollDiceParts(raw);
      return r ? r.total : null;
    }


    function dndParseBonus(raw) {
      const n = Number(String(raw || '').replace(',', '.').replace(/^\+/, ''));
      return Number.isFinite(n) ? n : 0;
    }

    function dndRoll(label, bonus) {
      if (!diceRollsEnabled()) { noticeDiceOff(); return; }
      const die = 1 + Math.floor(Math.random() * 20);
      const add = Number(bonus) || 0;
      playTableDie({
        sides: 20,
        values: [die],
        caption: label + ': ' + die + ' (' + dndSigned(add) + ') = ' + (die + add)
      });
    }

    function applyDndHpChange(kind) {
      collectDndFields();
      const n = Math.max(0, Number(document.getElementById('dndHpDelta') && document.getElementById('dndHpDelta').value) || 0);
      if (!n) {
        toast('Zuerst eine Zahl eintragen.');
        return;
      }
      let cur = Math.max(0, Number(dndState.hpCurrent) || 0);
      const max = Math.max(0, Number(dndState.hpMax) || cur);
      if (kind === 'heal') {
        dndState.hpCurrent = String(max ? Math.min(max, cur + n) : cur + n);
      } else {
        let temp = Math.max(0, Number(dndState.hpTemp) || 0);
        let dmg = n;
        if (temp) {
          const absorb = Math.min(temp, dmg);
          temp -= absorb;
          dmg -= absorb;
          dndState.hpTemp = temp ? String(temp) : '';
        }
        dndState.hpCurrent = String(Math.max(0, cur - dmg));
      }
      applyDndFields();
      refreshDndCalcs();
      sheetDirty = true;
    }

    function setDndActFilter(filter) {
      dndActFilter = filter || 'all';
      document.querySelectorAll('#dndActionFilters [data-dnd-act-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-dnd-act-filter') === dndActFilter);
      });
      document.querySelectorAll('#charDndBlock [data-dnd-act-sec]').forEach(sec => {
        const id = sec.getAttribute('data-dnd-act-sec');
        sec.classList.toggle('hidden', dndActFilter !== 'all' && dndActFilter !== id);
      });
    }

    function removeUdoAccount(accs) {
      if (!accs) return false;
      let changed = false;
      Object.keys(accs).forEach(id => {
        if (String(id || '').toLowerCase() !== 'udo') return;
        delete accs[id];
        changed = true;
      });
      return changed;
    }

    function dndMod(score) {
      return Math.floor((Number(score) - 10) / 2);
    }

    function dndSigned(n) {
      const v = Number(n) || 0;
      return (v >= 0 ? '+' : '') + v;
    }

    function dndProficiency() {
      const custom = String(dndState.profBonus || '').trim();
      if (custom) {
        const n = Number(String(custom).replace(',', '.'));
        if (Number.isFinite(n)) return n;
      }
      const lvl = Math.max(1, Number(dndState.stufe) || 1);
      return 2 + Math.floor((Math.min(20, lvl) - 1) / 4);
    }

    function dndSkillBonus(skillId) {
      const sk = DND_SKILLS.find(s => s.id === skillId);
      if (!sk) return 0;
      const mod = dndMod(dndState.abilities[sk.ability].score);
      const rank = dndState.skills[skillId] || 0;
      const prof = dndProficiency();
      if (rank === 2) return mod + prof * 2;
      if (rank === 1) return mod + prof;
      if (dndState.jackOfAllTrades) return mod + Math.floor(prof / 2);
      return mod;
    }

    function collectDndFields() {
      document.querySelectorAll('#charDndBlock [data-dnd-field]').forEach(el => {
        const key = el.getAttribute('data-dnd-field');
        if (el.type === 'checkbox') dndState[key] = el.checked;
        else dndState[key] = el.value;
      });
      document.querySelectorAll('#charDndBlock [data-dnd-attune]').forEach(el => {
        dndState.attunement[Number(el.getAttribute('data-dnd-attune'))] = el.value;
      });
      DND_ABS.forEach(a => {
        const score = document.querySelector('#charDndBlock [data-dnd-score="' + a.id + '"]');
        const save = document.querySelector('#charDndBlock [data-dnd-save="' + a.id + '"]');
        if (score) dndState.abilities[a.id].score = Math.max(1, Number(score.value) || 10);
        if (save) dndState.abilities[a.id].save = save.checked;
      });
      for (let i = 1; i <= 9; i++) {
        const max = document.querySelector('#charDndBlock [data-dnd-slot-max="' + i + '"]');
        const used = document.querySelector('#charDndBlock [data-dnd-slot-used="' + i + '"]');
        if (max) dndState.spellSlots[i].max = max.value;
        if (used) dndState.spellSlots[i].used = used.value;
      }
      document.querySelectorAll('#charDndBlock [data-dnd-row]').forEach(row => {
        const kind = row.getAttribute('data-dnd-row');
        const id = row.getAttribute('data-id');
        const item = (dndState[kind] || []).find(x => x.id === id);
        if (!item) return;
        row.querySelectorAll('[data-k]').forEach(el => {
          const key = el.getAttribute('data-k');
          if (!key) return;
          item[key] = el.type === 'checkbox' ? el.checked : el.value;
        });
      });
    }

    function applyDndFields() {
      document.querySelectorAll('#charDndBlock [data-dnd-field]').forEach(el => {
        const key = el.getAttribute('data-dnd-field');
        if (el.type === 'checkbox') el.checked = !!dndState[key];
        else if (dndState[key] != null && typeof dndState[key] !== 'object') el.value = dndState[key];
      });
      document.querySelectorAll('#charDndBlock [data-dnd-attune]').forEach(el => {
        el.value = dndState.attunement[Number(el.getAttribute('data-dnd-attune'))] || '';
      });
      const nameEl = document.querySelector('#charDndBlock [data-dnd-field="name"]');
      if (nameEl && !nameEl.value) nameEl.value = dndOwnerName();
    }

    function renderDndAbilityCol() {
      const row = document.getElementById('dndAbilityRow');
      if (row) {
        row.innerHTML = DND_ABS.map(a =>
          '<div class="dnd-ab dnd-card">' +
          '<button type="button" class="dnd-ab-mod" data-dnd-mod="' + a.id + '" data-dnd-roll-ab="' + a.id + '" title="Würfeln">+0</button>' +
          '<input data-dnd-score="' + a.id + '" inputmode="numeric" value="' + (dndState.abilities[a.id].score || 10) + '" />' +
          '<div class="dnd-ab-name">' + a.label + '</div></div>'
        ).join('');
      }
      const saves = document.getElementById('dndSaveList');
      if (saves) {
        saves.innerHTML = DND_ABS.map(a =>
          '<div class="dnd-save-row">' +
          '<button type="button" class="dnd-prof' + (dndState.abilities[a.id].save ? ' is-prof' : '') + '" data-dnd-save-toggle="' + a.id + '" title="Rettungswurf-Übung"></button>' +
          '<button type="button" class="dnd-sk-roll" data-dnd-roll-save="' + a.id + '">' +
          '<span class="dnd-skill-mod" data-dnd-save-mod="' + a.id + '">+0</span><span>' + a.label + '</span></button>' +
          '<input class="hidden" type="checkbox" data-dnd-save="' + a.id + '"' + (dndState.abilities[a.id].save ? ' checked' : '') + ' /></div>'
        ).join('');
      }
      const skills = document.getElementById('dndSkillList');
      if (skills) {
        skills.innerHTML = DND_SKILLS.map(s => {
          const rank = dndState.skills[s.id] || 0;
          const ab = DND_ABS.find(a => a.id === s.ability);
          return '<div class="dnd-skill">' +
            '<button type="button" class="dnd-prof' + (rank === 1 ? ' is-prof' : rank === 2 ? ' is-expert' : '') + '" data-skill="' + s.id + '" title="Übung / Expertise"></button>' +
            '<span class="dnd-skill-ab">' + (ab ? ab.short : '') + '</span>' +
            '<button type="button" class="dnd-sk-roll" data-dnd-roll-skill="' + s.id + '">' +
            '<span class="dnd-skill-name">' + s.label + '</span>' +
            '<span class="dnd-skill-mod" data-skill-mod="' + s.id + '">+0</span></button></div>';
        }).join('');
      }
    }

    function dndAttackIsOpen(row) {
      return !String(row && row.name || '').trim() || (row && row.id) === dndAttackEditId;
    }

    function dndFormatRange(raw) {
      const s = dndMetersToFeetText(raw).trim();
      if (!s) return { main: '—', extra: '' };
      const m = s.match(/(\d+(?:[.,]\d+)?)\s*(ft\.?|m)?\s*(?:[\/(]\s*(\d+(?:[.,]\d+)?)\)?)?/i);
      if (!m) return { main: s, extra: '' };
      if (m[3]) {
        const unit = m[2] && /m/i.test(m[2]) ? ' m' : ' ft.';
        return { main: m[1] + unit, extra: m[3] + unit };
      }
      const unit = m[2] ? (/m/i.test(m[2]) ? ' m' : ' ft.') : ' ft.';
      return { main: m[1] + unit, extra: '' };
    }

    function dndAttackKind(row) {
      const blob = [row.name, row.range, row.notes].map(v => String(v || '').toLowerCase()).join(' ');
      if (/unarmed|waffenlos|faust/.test(blob)) return { label: 'Waffenloser Schlag', icon: 'unarmed' };
      if (/fern|ranged|longbow|shortbow|crossbow|bogen|armbrust|\//.test(blob)) {
        return { label: 'Fernkampfwaffe', icon: 'ranged' };
      }
      if (/nahkampf|melee|shortsword|schwert|dolch|axt|5\s*ft|1[,.]50?\s*m/.test(blob)) {
        return { label: 'Nahkampfwaffe', icon: 'melee' };
      }
      return { label: 'Angriff', icon: 'melee' };
    }

    function dndAtkIcon(kind) {
      if (kind === 'ranged') {
        return '<svg class="dnd-atk-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V2a10 10 0 0 0 0 20v-2a8 8 0 0 1-8-8zm16.7-9.7L19.3 3.7 12 11l-2 1 1-2 7.3-7.3 2.4-1.4zM13 14l-4 2 2-4 2 2z"/></svg>';
      }
      if (kind === 'unarmed') {
        return '<svg class="dnd-atk-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 10V6.5A1.5 1.5 0 0 1 11 6.5V10h1V5.5A1.5 1.5 0 0 1 15 5.5V10h1V7.5A1.5 1.5 0 0 1 19 7.5V14c0 3.3-2.2 6-6 6H9c-2.8 0-5-2.2-5-5v-3.5A1.5 1.5 0 0 1 7 10h1z"/></svg>';
      }
      return '<svg class="dnd-atk-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 21l6-6 2 2-6 6H3v-2zm9.5-8.5l8.5-8.5V2h-2l-8.5 8.5 2 2zM8 14l2 2 1.5-1.5-2-2L8 14zm7.8-9.2l2.4 2.4 1.4-1.4-2.4-2.4-1.4 1.4z"/></svg>';
    }

    function commitDndAttack(id) {
      collectDndFields();
      const item = (dndState.attacks || []).find(x => x.id === id);
      if (!item || !String(item.name || '').trim()) {
        toast('Zuerst einen Namen für den Angriff eintragen.');
        return;
      }
      dndAttackEditId = '';
      renderDndLists();
      sheetDirty = true;
      saveSheet();
    }

    function collapseDndAttacks() {
      dndAttackEditId = '';
      dndState.attacks = (dndState.attacks || []).filter(row => String(row.name || '').trim());
    }

    function emptyDndSpell(id, level) {
      return {
        id: id || combatNewId('s'),
        level: level == null || level === '' ? '0' : String(level),
        name: '',
        prepared: false,
        time: '',
        range: '',
        hit: '',
        damage: '',
        concentration: false,
        ritual: false,
        notes: '',
        text: ''
      };
    }

    function dndSpellIsOpen(row) {
      return !String(row && row.name || '').trim() || (row && row.id) === dndSpellEditId;
    }

    function collapseDndSpells() {
      dndSpellEditId = '';
      dndState.spells = (dndState.spells || []).filter(row => String(row.name || '').trim());
    }

    function commitDndSpell(id) {
      collectDndFields();
      const item = (dndState.spells || []).find(x => x.id === id);
      if (!item || !String(item.name || '').trim()) {
        toast('Zuerst einen Namen für den Zauber eintragen.');
        return;
      }
      dndSpellEditId = '';
      renderDndLists();
      sheetDirty = true;
      saveSheet();
    }

    function dndSpellLevelNum(level) {
      const raw = String(level || '0').trim();
      if (!raw || raw === '0' || /^k/i.test(raw)) return 0;
      const n = Number(raw.replace(/[^\d]/g, ''));
      return Number.isFinite(n) && n >= 1 && n <= 9 ? n : 0;
    }

    function dndSlotMax(level) {
      const slot = dndState.spellSlots && dndState.spellSlots[level];
      const n = Number(String((slot && slot.max) || '').replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? Math.min(12, Math.floor(n)) : 0;
    }

    function dndSlotUsed(level) {
      const slot = dndState.spellSlots && dndState.spellSlots[level];
      return Math.max(0, Number(String((slot && slot.used) || '').replace(',', '.')) || 0);
    }

    function dndSpellFilterHigh() {
      let high = 0;
      (dndState.spells || []).forEach(s => { high = Math.max(high, dndSpellLevelNum(s.level)); });
      for (let i = 1; i <= 9; i++) if (dndSlotMax(i)) high = Math.max(high, i);
      return Math.max(1, high);
    }

    function setDndSpellFilter(filter) {
      dndSpellFilter = filter == null || filter === '' ? 'all' : String(filter);
      renderDndSlots();
      renderDndLists();
    }

    function dndSpellSlotPipsHtml(level) {
      if (!(level >= 1 && level <= 9)) return '';
      const max = dndSlotMax(level);
      const used = Math.min(dndSlotUsed(level), max);
      const canEdit = canEditOwnerSheet(currentSheetOwner);
      let html = '<div class="dnd-spell-slots">';
      for (let i = 1; i <= max; i++) {
        html += '<button type="button" class="dnd-slot-box' + (i <= used ? ' is-on' : '') + '" data-dnd-slot-pip="' + level + '" data-n="' + i + '"' +
          (canEdit ? '' : ' disabled') + ' title="Platz verbrauchen"></button>';
      }
      if (canEdit) {
        html += '<button type="button" class="ghost dnd-slot-step" data-dnd-slot-max-delta="' + level + '" data-delta="-1" title="Platz entfernen">−</button>';
        html += '<button type="button" class="ghost dnd-slot-step" data-dnd-slot-max-delta="' + level + '" data-delta="1" title="Platz hinzufügen">+</button>';
      }
      html += '<span class="dnd-slot-word">Plätze</span></div>';
      return html;
    }

    function dndSpellLevelHeadHtml(level) {
      return '<div class="dnd-spell-level-head"><span>' + (level === 0 ? 'Zaubertricks' : dndSpellLevelLabel(String(level))) + '</span>' +
        dndSpellSlotPipsHtml(level) + '</div>';
    }

    function dndSpellRowHtml(row) {
      if (dndSpellIsOpen(row)) {
        return '<div class="dnd-spell-edit" data-dnd-row="spells" data-id="' + row.id + '">' +
          '<div class="dnd-spell-edit-top">' +
          '<label class="dnd-save"><input class="dnd-check" type="checkbox" data-k="prepared"' + (row.prepared ? ' checked' : '') + ' /> vorb.</label>' +
          '<input data-k="level" value="' + escapeAttr(row.level) + '" placeholder="0" title="Grad" />' +
          '<input data-k="name" value="' + escapeAttr(row.name) + '" placeholder="Zauber" /></div>' +
          '<div class="dnd-spell-edit-grid">' +
          '<input data-k="time" value="' + escapeAttr(row.time) + '" placeholder="Aktion" />' +
          '<input data-k="range" value="' + escapeAttr(row.range) + '" placeholder="30 ft." />' +
          '<input data-k="hit" value="' + escapeAttr(row.hit) + '" placeholder="+7 / WIS 15" />' +
          '<input data-k="damage" value="' + escapeAttr(row.damage) + '" placeholder="2W8" /></div>' +
          '<div class="dnd-spell-flags-edit">' +
          '<label class="dnd-save"><input class="dnd-check" type="checkbox" data-k="concentration"' + (row.concentration ? ' checked' : '') + ' /> Konz.</label>' +
          '<label class="dnd-save"><input class="dnd-check" type="checkbox" data-k="ritual"' + (row.ritual ? ' checked' : '') + ' /> Ritual</label></div>' +
          '<div class="dnd-atk-edit-foot">' +
          '<input data-k="notes" value="' + escapeAttr(row.notes) + '" placeholder="Notiz" />' +
          '<button type="button" class="primary" data-dnd-spell-save="' + row.id + '">Speichern</button>' +
          '<button type="button" class="ghost" data-dnd-del="spells">×</button></div></div>';
      }
      const flags = [];
      if (row.concentration) flags.push('Konz.');
      if (row.ritual) flags.push('Ritual');
      const hit = String(row.hit || '').trim() || '—';
      const dmg = String(row.damage || '').trim() || '—';
      const hitBtn = dndHitIsAttack(row.hit);
      const dmgBtn = !!dndParseDice(String(row.damage || '').replace(/\s/g, ''));
      return '<div class="dnd-spell-item" data-dnd-row="spells" data-id="' + row.id + '">' +
        '<label class="dnd-spell-prep" title="Vorbereitet"><input class="dnd-check" type="checkbox" data-k="prepared"' + (row.prepared ? ' checked' : '') + ' /></label>' +
        '<div class="dnd-spell-id-text"><button type="button" class="dnd-atk-name" data-dnd-info title="Beschreibung">' + escapeAttr(row.name || 'Zauber') + '</button>' +
        '<span class="dnd-spell-flags">' + escapeAttr(dndSpellLevelLabel(row.level) + (flags.length ? ' · ' + flags.join(' · ') : '')) + '</span></div>' +
        '<div class="dnd-atk-range">' + escapeAttr(row.time || '—') + '</div>' +
        '<div class="dnd-atk-range">' + escapeAttr(row.range || '—') + '</div>' +
        (hitBtn
          ? '<button type="button" class="dnd-atk-stat" data-dnd-roll="attack" title="Zauberangriff würfeln">' + escapeAttr(hit) + '</button>'
          : '<div class="dnd-atk-stat" style="cursor:default;">' + escapeAttr(hit) + '</div>') +
        (dmgBtn
          ? '<button type="button" class="dnd-atk-stat" data-dnd-roll="damage" title="Nur Schaden würfeln">' + escapeAttr(dmg) + '</button>'
          : '<div class="dnd-atk-stat" style="cursor:default;">' + escapeAttr(dmg) + '</div>') +
        '<div class="dnd-atk-notes">' + escapeAttr(row.notes || '') + '</div>' +
        '<button type="button" class="ghost" data-dnd-spell-edit="' + row.id + '" title="Bearbeiten">Ändern</button>' +
        '<button type="button" class="ghost" data-dnd-del="spells">×</button></div>';
    }

    function dndSpellLevelLabel(level) {
      const l = String(level || '0').trim();
      if (!l || l === '0' || /^k/i.test(l)) return 'Zaubertrick';
      return 'Grad ' + l;
    }

    function dndHitIsAttack(hit) {
      return /^[+-]?\d+$/.test(String(hit || '').replace(/\s/g, ''));
    }

    function dndItemAttackBonus(item) {
      if (!item) return '';
      const bonus = String(item.bonus || '').trim();
      if (bonus && dndHitIsAttack(bonus)) return bonus;
      const hit = String(item.hit || '').trim();
      return hit && dndHitIsAttack(hit) ? hit : '';
    }

    var dndActionView = null;

    function closeDndActionInfo() {
      dndActionView = null;
      const overlay = document.getElementById('dndActionOverlay');
      if (overlay) overlay.classList.add('hidden');
    }

    function dndActionMetaLine(kind, item) {
      if (!item) return '';
      const bits = [];
      if (kind === 'spells') {
        bits.push(dndSpellLevelLabel(item.level));
        if (item.time) bits.push(item.time);
        if (item.range) bits.push(item.range);
        if (item.hit) bits.push(item.hit);
        if (item.damage) bits.push(item.damage);
        if (item.concentration) bits.push('Konzentration');
        if (item.ritual) bits.push('Ritual');
      } else if (kind === 'features') {
        const max = Number(String(item.uses || '').replace(',', '.'));
        const used = Math.max(0, Number(String(item.used || '').replace(',', '.')) || 0);
        if (Number.isFinite(max) && max > 0) bits.push(used + '/' + max);
        if (item.reset === 'short') bits.push('Kurzrast');
        else if (item.reset === 'dawn') bits.push('Morgengrauen');
        else if (item.reset === 'long' || (Number.isFinite(max) && max > 0)) bits.push('Langrast');
      } else {
        if (item.range) bits.push(item.range);
        if (item.bonus) bits.push(item.bonus);
        if (item.damage) bits.push(item.damage);
      }
      if (item.notes) bits.push(item.notes);
      return bits.filter(Boolean).join(' · ');
    }

    function findDndAction(kind, id, owner) {
      const live = !owner || owner === currentSheetOwner;
      if (live) {
        const item = (dndState[kind] || []).find(x => x.id === id);
        if (item) return { item: item, live: true, owner: currentSheetOwner };
      }
      const rec = sheetOwnerRecord(owner || currentSheetOwner);
      const dnd = rec && rec.sheet && rec.sheet.dnd;
      const item = dnd && (dnd[kind] || []).find(x => x.id === id);
      return { item: item, live: false, owner: owner || currentSheetOwner };
    }

    function openDndActionInfo(kind, id, owner) {
      if (kind !== 'spells' && kind !== 'attacks' && kind !== 'features') return;
      if ((!owner || owner === currentSheetOwner) && usesDndSheet(currentSheetOwner)) collectDndFields();
      const found = findDndAction(kind, id, owner);
      if (!found.item) {
        toast('Keine Beschreibung gefunden.');
        return;
      }
      dndActionView = { kind: kind, id: id, owner: found.owner, live: found.live };
      const overlay = document.getElementById('dndActionOverlay');
      const title = document.getElementById('dndActionTitle');
      const meta = document.getElementById('dndActionMeta');
      const ta = document.getElementById('dndActionText');
      const save = document.getElementById('dndActionSave');
      if (title) title.textContent = found.item.name || (kind === 'spells' ? 'Zauber' : kind === 'features' ? 'Merkmal' : 'Angriff');
      if (meta) meta.textContent = dndActionMetaLine(kind, found.item);
      const canEdit = canEditOwnerSheet(found.owner);
      if (ta) {
        ta.value = String(found.item.text || '');
        ta.readOnly = !canEdit;
      }
      if (save) save.classList.toggle('hidden', !canEdit);
      if (overlay) overlay.classList.remove('hidden');
      if (ta && canEdit) setTimeout(() => ta.focus(), 30);
    }

    function saveDndActionText() {
      if (!dndActionView) return;
      const ta = document.getElementById('dndActionText');
      const text = ta ? ta.value : '';
      const owner = dndActionView.owner;
      if (!canEditOwnerSheet(owner)) return;
      if (dndActionView.live || owner === currentSheetOwner) {
        collectDndFields();
        const item = (dndState[dndActionView.kind] || []).find(x => x.id === dndActionView.id);
        if (!item) return;
        item.text = text;
        sheetDirty = true;
        saveSheet();
      } else {
        const rec = sheetOwnerRecord(owner);
        if (!rec || !rec.sheet) return;
        rec.sheet.dnd = normalizeDndSheet(rec.sheet.dnd);
        const item = (rec.sheet.dnd[dndActionView.kind] || []).find(x => x.id === dndActionView.id);
        if (!item) return;
        item.text = text;
        persistPlayersSoon();
      }
      toast('Beschreibung gespeichert.');
    }

    function renderDndLists() {
      const atk = document.getElementById('dndAttackList');
      if (atk) {
        const anyOpen = dndState.attacks.some(dndAttackIsOpen);
        const head = document.querySelector('#charDndBlock .dnd-atk-head');
        if (head) head.classList.toggle('hidden', !anyOpen);
        const hasSaved = dndState.attacks.some(row => !dndAttackIsOpen(row));
        const cols = hasSaved
          ? '<div class="dnd-atk-cols"><span>Angriff</span><span>Reichweite</span><span>Treffer</span><span>Schaden</span><span></span><span></span></div>'
          : '';
        atk.innerHTML = cols + dndState.attacks.map(row => {
          if (dndAttackIsOpen(row)) {
            return '<div class="dnd-atk-edit" data-dnd-row="attacks" data-id="' + row.id + '">' +
              '<div class="dnd-atk-edit-top">' +
              '<input data-k="name" value="' + escapeAttr(row.name) + '" placeholder="Aktion" />' +
              '<input data-k="range" value="' + escapeAttr(row.range) + '" placeholder="5 ft." /></div>' +
              '<div class="dnd-atk-roll-row">' +
              '<input data-k="bonus" value="' + escapeAttr(row.bonus) + '" placeholder="+5" />' +
              '<span class="dnd-atk-roll-wrap">' +
              '<input class="dnd-atk-result" data-k="hitRoll" value="' + escapeAttr(row.hitRoll) + '" placeholder="Trefferwurf" readonly />' +
              '<button type="button" class="dnd-mini-roll" data-dnd-roll="attack" title="Treffer würfeln">W20</button></span></div>' +
              '<div class="dnd-atk-roll-row">' +
              '<input data-k="damage" value="' + escapeAttr(row.damage) + '" placeholder="1W8+3" />' +
              '<span class="dnd-atk-roll-wrap">' +
              '<input class="dnd-atk-result" data-k="dmgRoll" value="' + escapeAttr(row.dmgRoll) + '" placeholder="Schaden" readonly />' +
              '<button type="button" class="dnd-mini-roll" data-dnd-roll="damage" title="Schaden würfeln">W</button></span></div>' +
              '<div class="dnd-atk-edit-foot">' +
              '<input data-k="notes" value="' + escapeAttr(row.notes) + '" placeholder="Notiz" />' +
              '<button type="button" class="primary" data-dnd-atk-save="' + row.id + '">Speichern</button>' +
              '<button type="button" class="ghost" data-dnd-del="attacks">×</button></div></div>';
          }
          const kind = dndAttackKind(row);
          const range = dndFormatRange(row.range);
          const bonus = String(row.bonus || '').trim() || '—';
          const dmg = String(row.damage || '').trim() || '—';
          return '<div class="dnd-atk-item" data-dnd-row="attacks" data-id="' + row.id + '">' +
            '<div class="dnd-atk-id">' + dndAtkIcon(kind.icon) +
            '<span class="dnd-atk-id-text"><button type="button" class="dnd-atk-name" data-dnd-info title="Beschreibung">' + escapeAttr(row.name || 'Angriff') + '</button>' +
            '<span class="dnd-atk-kind">' + escapeAttr(kind.label) + '</span></span></div>' +
            '<div class="dnd-atk-range">' + escapeAttr(range.main) +
            (range.extra ? ' <span class="dnd-atk-range-far">(' + escapeAttr(range.extra) + ')</span>' : '') +
            '</div>' +
            '<button type="button" class="dnd-atk-stat" data-dnd-roll="attack" title="Treffer würfeln, bei Treffer Schaden">' + escapeAttr(bonus) + '</button>' +
            '<button type="button" class="dnd-atk-stat" data-dnd-roll="damage" title="Nur Schaden würfeln">' + escapeAttr(dmg) + '</button>' +
            '<div class="dnd-atk-notes">' + escapeAttr(row.notes || '') + '</div>' +
            '<button type="button" class="ghost" data-dnd-atk-edit="' + row.id + '" title="Bearbeiten">Ändern</button>' +
            '<button type="button" class="ghost" data-dnd-del="attacks">×</button></div>';
        }).join('');
      }
      const limited = document.getElementById('dndLimitedList');
      if (limited) {
        const rows = dndState.features.filter(f => String(f.uses || '').trim());
        limited.innerHTML = rows.length ? rows.map(row =>
          '<div class="dnd-row dnd-row-feat" data-dnd-row="features" data-id="' + row.id + '">' +
          '<input data-k="name" value="' + escapeAttr(row.name) + '" placeholder="Merkmal" />' +
          '<input data-k="used" value="' + escapeAttr(row.used) + '" placeholder="verbr." />' +
          '<input data-k="uses" value="' + escapeAttr(row.uses) + '" placeholder="max" />' +
          '<select data-k="reset"><option value="short"' + (row.reset === 'short' ? ' selected' : '') + '>Kurzrast</option>' +
          '<option value="long"' + (row.reset === 'long' ? ' selected' : '') + '>Langrast</option>' +
          '<option value="dawn"' + (row.reset === 'dawn' ? ' selected' : '') + '>Morgengrauen</option></select>' +
          '<input data-k="text" value="' + escapeAttr(row.text) + '" placeholder="Beschreibung" />' +
          '<span></span></div>'
        ).join('') : '<p style="color:var(--dnd-mute);margin:0;">Noch keine begrenzten Merkmale. Lege sie unter Merkmale an.</p>';
      }
      const spells = document.getElementById('dndSpellList');
      if (spells) {
        const filterLvl = dndSpellFilter === 'all' ? null : Number(dndSpellFilter);
        const visible = (dndState.spells || []).filter(row => {
          if (filterLvl == null) return true;
          return dndSpellLevelNum(row.level) === filterLvl;
        });
        const hasSaved = visible.some(row => !dndSpellIsOpen(row));
        let html = hasSaved
          ? '<div class="dnd-spell-cols"><span></span><span>Zauber</span><span>Zeit</span><span>Reichweite</span><span>Treffer/SG</span><span>Schaden</span><span></span><span></span></div>'
          : '';
        if (filterLvl == null) {
          const high = dndSpellFilterHigh();
          for (let lvl = 0; lvl <= high; lvl++) {
            const rows = visible.filter(s => dndSpellLevelNum(s.level) === lvl);
            if (!rows.length && !(lvl >= 1 && dndSlotMax(lvl))) continue;
            html += dndSpellLevelHeadHtml(lvl) + rows.map(dndSpellRowHtml).join('');
          }
        } else {
          html += dndSpellLevelHeadHtml(filterLvl) + visible.map(dndSpellRowHtml).join('');
        }
        spells.innerHTML = html;
      }
      const items = document.getElementById('dndItemList');
      if (items) {
        items.innerHTML = dndState.items.map(row =>
          '<div class="dnd-row dnd-row-item" data-dnd-row="items" data-id="' + row.id + '">' +
          '<input data-k="name" value="' + escapeAttr(row.name) + '" placeholder="Gegenstand" />' +
          '<input data-k="qty" value="' + escapeAttr(row.qty) + '" placeholder="1" />' +
          '<input data-k="weight" value="' + escapeAttr(row.weight) + '" placeholder="kg" />' +
          '<label class="dnd-save"><input class="dnd-check" type="checkbox" data-k="equipped"' + (row.equipped ? ' checked' : '') + ' /> an</label>' +
          '<label class="dnd-save"><input class="dnd-check" type="checkbox" data-k="attuned"' + (row.attuned ? ' checked' : '') + ' /> ein</label>' +
          '<input data-k="notes" value="' + escapeAttr(row.notes) + '" placeholder="Notiz" />' +
          '<button type="button" class="ghost" data-dnd-del="items">×</button></div>'
        ).join('');
      }
      const feats = document.getElementById('dndFeatureList');
      if (feats) {
        feats.innerHTML = dndState.features.map(row =>
          '<div class="dnd-row dnd-row-feat" data-dnd-row="features" data-id="' + row.id + '">' +
          '<input data-k="name" value="' + escapeAttr(row.name) + '" placeholder="Merkmal" />' +
          '<input data-k="used" value="' + escapeAttr(row.used) + '" placeholder="verbr." />' +
          '<input data-k="uses" value="' + escapeAttr(row.uses) + '" placeholder="max" />' +
          '<select data-k="reset"><option value="short"' + (row.reset === 'short' ? ' selected' : '') + '>Kurzrast</option>' +
          '<option value="long"' + (row.reset === 'long' ? ' selected' : '') + '>Langrast</option>' +
          '<option value="dawn"' + (row.reset === 'dawn' ? ' selected' : '') + '>Morgengrauen</option></select>' +
          '<input data-k="text" value="' + escapeAttr(row.text) + '" placeholder="Beschreibung" />' +
          '<button type="button" class="ghost" data-dnd-del="features">×</button></div>'
        ).join('');
      }
    }

    function escapeAttr(v) {
      return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function renderDndPips() {
      const ok = document.getElementById('dndDeathOk');
      const fail = document.getElementById('dndDeathFail');
      if (ok) {
        ok.innerHTML = [1, 2, 3].map(i =>
          '<button type="button" class="dnd-pip' + (dndState.deathSuccess >= i ? ' is-on' : '') + '" data-dnd-death="success" data-n="' + i + '"></button>'
        ).join('');
      }
      if (fail) {
        fail.innerHTML = [1, 2, 3].map(i =>
          '<button type="button" class="dnd-pip is-fail' + (dndState.deathFail >= i ? ' is-on' : '') + '" data-dnd-death="fail" data-n="' + i + '"></button>'
        ).join('');
      }
    }

    function renderDndSlots() {
      const box = document.getElementById('dndSpellSlots');
      if (!box) return;
      const high = dndSpellFilterHigh();
      if (dndSpellFilter !== 'all' && Number(dndSpellFilter) > high) dndSpellFilter = 'all';
      const filters = ['all'];
      for (let i = 0; i <= high; i++) filters.push(String(i));
      box.innerHTML = filters.map(f => {
        const label = f === 'all' ? 'Alle' : f;
        const on = String(dndSpellFilter) === f;
        return '<button type="button" data-dnd-spell-filter="' + f + '"' + (on ? ' class="active"' : '') + '>' + label + '</button>';
      }).join('');
    }

    function setDndTab(tab) {
      dndState.tab = tab;
      document.querySelectorAll('#dndTabs [data-dnd-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-dnd-tab') === tab);
      });
      document.querySelectorAll('#charDndBlock [data-dnd-pane]').forEach(pane => {
        pane.classList.toggle('hidden', pane.getAttribute('data-dnd-pane') !== tab);
      });
      const filters = document.getElementById('dndActionFilters');
      if (filters) filters.classList.toggle('hidden', tab !== 'actions');
      if (tab === 'actions' || tab === 'features' || tab === 'spells') renderDndLists();
      if (tab === 'spells') renderDndSlots();
    }

    function refreshDndCalcs() {
      const prof = dndProficiency();
      const setTxt = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
      setTxt('dndProfOut', dndSigned(prof));
      DND_ABS.forEach(a => {
        const score = dndState.abilities[a.id].score;
        const mod = dndMod(score);
        const save = mod + (dndState.abilities[a.id].save ? prof : 0);
        const modEl = document.querySelector('#charDndBlock [data-dnd-mod="' + a.id + '"]');
        const saveEl = document.querySelector('#charDndBlock [data-dnd-save-mod="' + a.id + '"]');
        if (modEl) modEl.textContent = dndSigned(mod);
        if (saveEl) saveEl.textContent = dndSigned(save);
      });
      DND_SKILLS.forEach(s => {
        const el = document.querySelector('#charDndBlock [data-skill-mod="' + s.id + '"]');
        if (el) el.textContent = dndSigned(dndSkillBonus(s.id));
      });
      const init = dndMod(dndState.abilities.dex.score) + (Number(String(dndState.initiativeBonus || '').replace(',', '.')) || 0);
      setTxt('dndInitOut', dndSigned(init));
      setTxt('dndInitBox', dndSigned(init));
      setTxt('dndSpeedOut', dndState.speed || '30 ft.');
      setTxt('dndInspOut', dndState.inspiration ? 'Ja' : '—');
      const classLine = document.getElementById('dndClassLine');
      if (classLine) {
        const bits = [dndState.klasse, dndState.stufe ? 'Stufe ' + dndState.stufe : '', dndState.volk, dndState.background].filter(Boolean);
        classLine.textContent = bits.join(' · ') || 'Klasse, Volk und Stufe eintragen';
      }
      const insp = document.getElementById('dndInsp');
      if (insp) insp.classList.toggle('is-on', !!dndState.inspiration);
      const senses = document.getElementById('dndSensesOut');
      if (senses) {
        senses.innerHTML =
          '<div>Passive Wahrnehmung <strong>' + (10 + dndSkillBonus('perception')) + '</strong></div>' +
          '<div>Passive Nachforschung <strong>' + (10 + dndSkillBonus('investigation')) + '</strong></div>' +
          '<div>Passive Einsicht <strong>' + (10 + dndSkillBonus('insight')) + '</strong></div>';
      }
      const spellMod = dndMod(dndState.abilities[dndState.spellAbility] ? dndState.abilities[dndState.spellAbility].score : 10);
      setTxt('dndSpellDc', String(8 + prof + spellMod));
      setTxt('dndSpellAtk', dndSigned(prof + spellMod));
    }

    function fillDndForm(sheet) {
      const s = normalizeSheet(sheet);
      dndState = normalizeDndSheet(s.dnd);
      if (!dndState.name) dndState.name = s.name || dndOwnerName();
      if (!dndState.volk) dndState.volk = s.volk || '';
      if (!dndState.klasse) dndState.klasse = s.klasse || '';
      if (!dndState.stufe) dndState.stufe = s.stufe || '';
      if (!dndState.ac) dndState.ac = s.armor || '';
      if (!dndState.hpCurrent && s.hp) {
        const hp = parseSheetHp(s.hp);
        dndState.hpCurrent = hp.hp ? String(hp.hp) : '';
        dndState.hpMax = hp.hpMax ? String(hp.hpMax) : '';
      }
      renderDndAbilityCol();
      dndSpellFilter = 'all';
      renderDndSlots();
      collapseDndAttacks();
      collapseDndSpells();
      renderDndLists();
      renderDndPips();
      applyDndFields();
      setDndTab(dndState.tab || 'actions');
      setDndActFilter(dndActFilter || 'all');
      refreshDndCalcs();
    }

    function readDndForm() {
      collectDndFields();
      const name = (dndState.name || dndOwnerName()).trim();
      const stats = DND_ABS.map(a => {
        const score = dndState.abilities[a.id].score;
        return a.label.slice(0, 2).toUpperCase() + ' ' + score + ' (' + dndSigned(dndMod(score)) + ')';
      }).join(' — ');
      const hp = [dndState.hpCurrent, dndState.hpMax].filter(Boolean).join(' / ');
      return {
        name: name,
        volk: String(dndState.volk || '').trim(),
        klasse: String(dndState.klasse || '').trim(),
        stufe: String(dndState.stufe || '').trim(),
        hp: hp,
        armor: String(dndState.ac || '').trim(),
        stats: stats,
        notes: String(dndState.notesOther || ''),
        extra: '',
        portraitId: sheetPortraitId || '',
        dnd: normalizeDndSheet(dndState)
      };
    }

    function addDndRow(kind) {
      collectDndFields();
      if (kind === 'attacks') {
        const id = combatNewId('a');
        dndState.attacks.push({
          id: id, name: '', range: '', bonus: '', hitRoll: '', damage: '', dmgRoll: '', notes: '', text: ''
        });
        dndAttackEditId = id;
      }
      if (kind === 'spells') {
        const id = combatNewId('s');
        const level = dndSpellFilter === 'all' ? '0' : String(dndSpellFilter);
        dndState.spells.push(emptyDndSpell(id, level));
        dndSpellEditId = id;
      }
      if (kind === 'items') dndState.items.push({ id: combatNewId('i'), name: '', qty: '1', weight: '', equipped: false, attuned: false, notes: '' });
      if (kind === 'features') dndState.features.push({ id: combatNewId('f'), name: '', uses: '', used: '', reset: 'long', text: '' });
      renderDndLists();
      sheetDirty = true;
    }

    async function applyDndRest(kind) {
      collectDndFields();
      dndState.features.forEach(f => {
        if (kind === 'short' && f.reset === 'short') f.used = '0';
        if (kind === 'long' && (f.reset === 'short' || f.reset === 'long')) f.used = '0';
        if (kind === 'dawn' && f.reset === 'dawn') f.used = '0';
      });
      if (kind === 'short') {
        const max = Math.max(0, Number(dndState.hpMax) || 0);
        const cur = Math.max(0, Number(dndState.hpCurrent) || 0);
        if (max) dndState.hpCurrent = String(Math.min(max, cur + Math.floor(max / 2)));
      }
      if (kind === 'long') {
        dndState.hpCurrent = dndState.hpMax || dndState.hpCurrent;
        dndState.hpTemp = '';
        dndState.hitDiceUsed = '0';
        dndState.deathSuccess = 0;
        dndState.deathFail = 0;
        for (let i = 1; i <= 9; i++) dndState.spellSlots[i].used = '0';
      }
      renderDndLists();
      renderDndPips();
      applyDndFields();
      renderDndSlots();
      refreshDndCalcs();
      sheetDirty = true;
      toast(kind === 'short' ? 'Kurzrast verrechnet.' : kind === 'long' ? 'Langrast verrechnet.' : 'Morgengrauen verrechnet.');
      if (kind === 'short' || kind === 'long') await saveSheet();
    }

    function normalizeAlts(raw) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      Object.keys(raw).forEach(key => {
        const id = playerIdFromName(key);
        if (!id) return;
        const a = raw[key] || {};
        out[id] = {
          name: (a.name || key).trim(),
          sheet: normalizeSheet(a.sheet),
          entry: a.entry ? normalizeAltEntry(a.entry, a.name || key) : undefined
        };
        if (!out[id].entry) delete out[id].entry;
      });
      return out;
    }

    function normalizeAccounts(raw) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      Object.keys(raw).forEach(key => {
        const a = raw[key] || {};
        const id = playerIdFromName(key);
        if (!id) return;
        out[id] = {
          name: (a.name || key).trim(),
          password: a.password || '',
          sheet: normalizeSheet(a.sheet),
          alts: normalizeAlts(a.alts),
          createdAt: Number(a.createdAt) || 0
        };
      });
      ensureVeyrAlt(out);
      ensureIllusionAlt(out);
      removeUdoAccount(out);
      renameReptileToBjoern(out);
      Object.keys(out).forEach(id => {
        if (!out[id] || !out[id].sheet) return;
        if (usesDndSheet(id)) {
          const dnd = normalizeDndSheet(out[id].sheet.dnd);
          if (!dnd.name) dnd.name = out[id].sheet.name || out[id].name || '';
          out[id].sheet.dnd = dnd;
        }
        const alts = out[id].alts || {};
        Object.keys(alts).forEach(k => {
          const owner = id + ':' + k;
          if (!usesDndSheet(owner) || !alts[k] || !alts[k].sheet) return;
          const dnd = normalizeDndSheet(alts[k].sheet.dnd);
          if (!dnd.name) dnd.name = alts[k].sheet.name || alts[k].name || '';
          alts[k].sheet.dnd = dnd;
        });
      });
      return out;
    }

    function normalizeNpcAccounts(raw) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      Object.keys(raw).forEach(id => {
        if (!id) return;
        const a = raw[id] || {};
        const sheet = normalizeSheet(a.sheet);
        const dnd = normalizeDndSheet(sheet.dnd);
        if (!dnd.name) dnd.name = sheet.name || a.name || 'NPC';
        sheet.dnd = dnd;
        out[id] = {
          name: (a.name || sheet.name || dnd.name || 'NPC').trim() || 'NPC',
          sheet: sheet,
          createdAt: Number(a.createdAt) || 0
        };
      });
      return out;
    }

    function applyPlayers(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= playersUpdatedAt) return;
      const rawChris = data.accounts && data.accounts.chris;
      const needsCloudRename = !!(rawChris && (
        rawChris.name !== 'Björn' ||
        (rawChris.sheet && rawChris.sheet.name !== 'Björn' && (!String(rawChris.sheet.name || '').trim() || isReptileName(rawChris.sheet.name)))
      ));
      const incoming = normalizeAccounts(data.accounts);
      if ((sheetDirty || veyrEntryEditing) && currentSheetOwner && !isNpcOwner(currentSheetOwner)) {
        const accId = sheetAccountId(currentSheetOwner);
        if (accId && playerAccounts[accId]) incoming[accId] = playerAccounts[accId];
      }
      const incomingNpcs = normalizeNpcAccounts(data.npcs);
      if (sheetDirty && currentSheetOwner && isNpcOwner(currentSheetOwner)) {
        const npcId = npcIdFromOwner(currentSheetOwner);
        if (npcId && npcAccounts[npcId]) incomingNpcs[npcId] = npcAccounts[npcId];
      }
      if (!(sheetDirty && isDmNotesOwner(currentSheetOwner))) {
        dmNotes = typeof data.dmNotes === 'string' ? data.dmNotes : '';
      }
      playersUpdatedAt = at;
      playerAccounts = incoming;
      npcAccounts = incomingNpcs;
      if (currentSheetOwner && isNpcOwner(currentSheetOwner) && !npcAccounts[npcIdFromOwner(currentSheetOwner)]) {
        currentSheetOwner = null;
      }
      if (currentPlayerId && !playerAccounts[currentPlayerId]) setPlayer(null);
      syncPlayerCombatNames();
      const hadUdo = !!(data.accounts && (data.accounts.udo || data.accounts.Udo));
      const needsBjoernExtras = ensureBjoernFighterExtras(playerAccounts);
      const needsVeyrSheet = ensureVeyrDrakeSheet(playerAccounts);
      if ((needsCloudRename || hadUdo || needsBjoernExtras || needsVeyrSheet) && db && !sheetDirty && !veyrEntryEditing) {
        persistPlayers().catch(() => {});
      }
      syncChatListeners();
      renderChatChrome();
      if (currentPage === 'char') renderCharakter();
      else if (currentPage === 'kampf') renderKampf();
      else updatePlayerChrome();
    }

    function listenPlayers() {
      if (!db) return;
      playersRef().onSnapshot(snap => {
        if (writingPlayers || !snap.exists) return;
        applyPlayers(snap.data());
      });
    }

    function persistPlayersSoon() {
      clearTimeout(playersPersistTimer);
      playersPersistTimer = setTimeout(() => {
        persistPlayers().catch(() => {});
      }, 420);
    }

    async function persistPlayers() {
      if (!db) throw new Error('Keine Verbindung zur Cloud.');
      renameReptileToBjoern(playerAccounts);
      ensureBjoernFighterExtras(playerAccounts);
      ensureVeyrDrakeSheet(playerAccounts);
      removeUdoAccount(playerAccounts);
      const nextAt = Date.now();
      writingPlayers = true;
      try {
        await playersRef().set({
          updatedAt: nextAt,
          accounts: playerAccounts,
          npcs: npcAccounts,
          dmNotes: typeof dmNotes === 'string' ? dmNotes : ''
        });
        playersUpdatedAt = nextAt;
      } finally {
        writingPlayers = false;
      }
    }

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
        if (handleKampfPowerClick(id)) return;
        if (pickKampfAim(id)) return;
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
          if (battleTokenDragMoved) return;
          if (handleBattleToolAt(token.x, token.y, ev)) return;
          if (handleKampfPowerClick(token.id)) return;
          if (pickKampfAim(token.id)) return;
          setBattleLink(token.id, true);
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
      const originX = ev.clientX;
      const originY = ev.clientY;
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
        if (Math.abs(e.clientX - originX) + Math.abs(e.clientY - originY) > 4) {
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
        if (!battleTokenDragMoved) {
          if (!handleKampfPowerClick(token.id) && !pickKampfAim(token.id)) setBattleLink(token.id, true);
          battleTokenDragMoved = true;
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

    function updatePlayerChrome() {
      const on = !!currentPlayerId;
      document.body.classList.toggle('is-player', on);
      const acc = currentPlayerId ? playerAccounts[currentPlayerId] : null;
      document.getElementById('playerChip').textContent = acc ? acc.name : 'Spieler';
      document.getElementById('playerButton').textContent = on ? 'Spieler Logout' : 'Spieler Login';
      applyDiceToolsUi();
      syncChatListeners();
      renderChatChrome();
    }

    function chatPlayerIds() {
      return Object.keys(playerAccounts).sort((a, b) =>
        playerAccounts[a].name.localeCompare(playerAccounts[b].name, 'de')
      );
    }

    function canUseChat() {
      return isDM || !!currentPlayerId;
    }

    function emptyChatThread() {
      return { updatedAt: 0, lastReadDm: 0, lastReadPlayer: 0, messages: [] };
    }

    function normalizeChatThread(raw) {
      const data = raw && typeof raw === 'object' ? raw : {};
      const messages = (Array.isArray(data.messages) ? data.messages : []).map(m => ({
        id: String(m.id || ''),
        from: m.from === 'dm' ? 'dm' : String(m.from || ''),
        text: String(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 500),
        at: Number(m.at) || 0
      })).filter(m => m.id && m.text && m.from);
      return {
        updatedAt: Number(data.updatedAt) || 0,
        lastReadDm: Number(data.lastReadDm) || 0,
        lastReadPlayer: Number(data.lastReadPlayer) || 0,
        messages: messages.slice(-150)
      };
    }

    function isOwnChatMessage(msg) {
      if (!msg) return false;
      if (isDM) return msg.from === 'dm';
      return !!currentPlayerId && msg.from === currentPlayerId;
    }

    function chatUnreadCount(id) {
      const t = chatThreads[id] || emptyChatThread();
      const last = isDM ? t.lastReadDm : t.lastReadPlayer;
      return t.messages.filter(m => m.at > last && !isOwnChatMessage(m)).length;
    }

    function formatChatTime(at) {
      const d = new Date(Number(at) || 0);
      if (!at || Number.isNaN(d.getTime())) return '';
      const now = new Date();
      const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      return sameDay ? time : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + time;
    }

    function applyChatThread(id, data, quiet) {
      if (!id) return;
      const prev = chatThreads[id];
      const next = normalizeChatThread(data);
      chatThreads[id] = next;
      const newest = next.messages[next.messages.length - 1];
      const prevNewest = prev && prev.messages[prev.messages.length - 1];
      if (
        !quiet &&
        newest &&
        (!prevNewest || prevNewest.id !== newest.id) &&
        !isOwnChatMessage(newest)
      ) {
        const last = isDM ? next.lastReadDm : next.lastReadPlayer;
        if (newest.at > last && (!chatOpen || chatActiveId !== id)) {
          const who = newest.from === 'dm' ? 'DM' : ((playerAccounts[id] && playerAccounts[id].name) || 'Spieler');
          toast('Nachricht von ' + who);
        }
      }
      if (chatOpen && chatActiveId === id) markChatRead(id);
      renderChatChrome();
    }

    function syncChatListeners() {
      if (!db) return;
      const want = {};
      if (isDM) chatPlayerIds().forEach(id => { want[id] = true; });
      else if (currentPlayerId) want[currentPlayerId] = true;
      Object.keys(chatUnsubs).forEach(id => {
        if (!want[id] && chatUnsubs[id]) {
          chatUnsubs[id]();
          delete chatUnsubs[id];
          delete chatThreads[id];
        }
      });
      Object.keys(want).forEach(id => {
        if (chatUnsubs[id]) return;
        chatUnsubs[id] = chatRef(id).onSnapshot(snap => {
          if (writingChat[id]) return;
          applyChatThread(id, snap.exists ? snap.data() : emptyChatThread());
        });
      });
      if (!isDM && currentPlayerId) chatActiveId = currentPlayerId;
      if (isDM && chatActiveId && !playerAccounts[chatActiveId]) chatActiveId = null;
    }

    function renderChatChrome() {
      const btn = document.getElementById('chatBtn');
      const panel = document.getElementById('chatPanel');
      const badge = document.getElementById('chatBadge');
      if (!btn || !panel) return;
      const allowed = canUseChat();
      btn.classList.toggle('hidden', !allowed);
      if (!allowed) {
        chatOpen = false;
        panel.classList.add('hidden');
        return;
      }
      panel.classList.toggle('hidden', !chatOpen);
      panel.classList.toggle('is-dm', isDM);
      if (!isDM && currentPlayerId) chatActiveId = currentPlayerId;
      let unread = 0;
      const ids = isDM ? chatPlayerIds() : (currentPlayerId ? [currentPlayerId] : []);
      ids.forEach(id => { unread += chatUnreadCount(id); });
      if (badge) {
        badge.textContent = unread > 9 ? '9+' : String(unread);
        badge.classList.toggle('hidden', unread < 1);
      }
      if (!chatOpen) return;
      const title = document.getElementById('chatTitle');
      if (isDM) {
        const acc = chatActiveId && playerAccounts[chatActiveId];
        if (title) title.textContent = acc ? acc.name : 'Chat';
      } else if (title) {
        title.textContent = 'Nachricht an den DM';
      }
      const list = document.getElementById('chatThreads');
      if (list) {
        list.innerHTML = '';
        if (isDM) {
          if (!ids.length) {
            const empty = document.createElement('p');
            empty.className = 'chat-empty';
            empty.textContent = 'Keine Spieler.';
            list.appendChild(empty);
          }
          ids.forEach(id => {
            const acc = playerAccounts[id];
            const b = document.createElement('button');
            b.type = 'button';
            b.className = chatActiveId === id ? 'active' : '';
            b.textContent = acc ? acc.name : id;
            const n = chatUnreadCount(id);
            if (n) {
              const em = document.createElement('em');
              em.textContent = String(n);
              b.appendChild(em);
            }
            b.onclick = () => selectChatThread(id);
            list.appendChild(b);
          });
        }
      }
      renderChatLog();
    }

    function renderChatLog() {
      const log = document.getElementById('chatLog');
      if (!log) return;
      log.innerHTML = '';
      if (isDM && !chatActiveId) {
        const empty = document.createElement('p');
        empty.className = 'chat-empty';
        empty.textContent = 'Links einen Spieler wählen.';
        log.appendChild(empty);
        return;
      }
      const id = isDM ? chatActiveId : currentPlayerId;
      const t = (id && chatThreads[id]) || emptyChatThread();
      if (!t.messages.length) {
        const empty = document.createElement('p');
        empty.className = 'chat-empty';
        empty.textContent = 'Noch keine Nachrichten.';
        log.appendChild(empty);
        return;
      }
      t.messages.forEach(m => {
        const el = document.createElement('div');
        el.className = 'chat-msg' + (isOwnChatMessage(m) ? ' is-mine' : '');
        const who = document.createElement('b');
        who.textContent = m.from === 'dm' ? 'DM' : ((playerAccounts[id] && playerAccounts[id].name) || 'Spieler');
        const text = document.createElement('span');
        text.textContent = m.text;
        const time = document.createElement('small');
        time.textContent = formatChatTime(m.at);
        el.appendChild(who);
        el.appendChild(text);
        el.appendChild(time);
        log.appendChild(el);
      });
      log.scrollTop = log.scrollHeight;
    }

    function selectChatThread(id) {
      chatActiveId = id;
      markChatRead(id);
      renderChatChrome();
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }

    function toggleChat(open) {
      if (!canUseChat()) {
        chatOpen = false;
        renderChatChrome();
        return;
      }
      chatOpen = open == null ? !chatOpen : !!open;
      if (chatOpen) {
        if (!isDM && currentPlayerId) chatActiveId = currentPlayerId;
        if (chatActiveId) markChatRead(chatActiveId);
      }
      renderChatChrome();
      if (chatOpen) {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
      }
    }

    async function markChatRead(id) {
      if (!id || !db || !canUseChat()) return;
      const t = chatThreads[id] || emptyChatThread();
      const newest = t.messages[t.messages.length - 1];
      if (!newest) return;
      const field = isDM ? 'lastReadDm' : 'lastReadPlayer';
      if ((t[field] || 0) >= newest.at) return;
      t[field] = newest.at;
      try {
        await chatRef(id).set(t, { merge: true });
      } catch (err) {}
      renderChatChrome();
    }

    async function sendChatMessage(text) {
      const raw = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
      if (!raw || !db || !canUseChat()) return;
      const id = isDM ? chatActiveId : currentPlayerId;
      if (!id || (isDM && !playerAccounts[id]) || (!isDM && id !== currentPlayerId)) {
        return toast(isDM ? 'Zuerst einen Spieler wählen.' : 'Bitte zuerst anmelden.');
      }
      const msg = {
        id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        from: isDM ? 'dm' : currentPlayerId,
        text: raw,
        at: Date.now()
      };
      writingChat[id] = true;
      try {
        await db.runTransaction(async tx => {
          const ref = chatRef(id);
          const snap = await tx.get(ref);
          const cur = snap.exists ? normalizeChatThread(snap.data()) : emptyChatThread();
          cur.messages.push(msg);
          cur.messages = cur.messages.slice(-150);
          cur.updatedAt = msg.at;
          if (isDM) cur.lastReadDm = msg.at;
          else cur.lastReadPlayer = msg.at;
          tx.set(ref, cur);
        });
        const local = chatThreads[id] || emptyChatThread();
        local.messages = local.messages.concat([msg]).slice(-150);
        local.updatedAt = msg.at;
        if (isDM) local.lastReadDm = msg.at;
        else local.lastReadPlayer = msg.at;
        chatThreads[id] = local;
        renderChatChrome();
      } catch (err) {
        toast('Nachricht nicht gesendet: ' + (err.message || err));
      } finally {
        writingChat[id] = false;
      }
    }

    function setPlayer(id) {
      currentPlayerId = id;
      try {
        if (id) {
          sessionStorage.setItem(PLAYER_SESSION_KEY, id);
          localStorage.setItem(PLAYER_SESSION_KEY, id);
        } else {
          sessionStorage.removeItem(PLAYER_SESSION_KEY);
          localStorage.removeItem(PLAYER_SESSION_KEY);
        }
      } catch (err) {}
      if (id) currentSheetOwner = id;
      else if (!isDM) currentSheetOwner = null;
      updatePlayerChrome();
      if (currentPage === 'kampf') renderBattleBoards();
    }

    function setPlayerFormMode(mode) {
      playerFormMode = mode === 'register' ? 'register' : 'login';
      const register = playerFormMode === 'register';
      document.getElementById('playerFormTitle').textContent = register ? 'Registrieren' : 'Spieler-Zugang';
      document.getElementById('playerFormHint').textContent = register
        ? 'Wähle einen Namen und ein Passwort. Danach siehst du dein Charakterblatt.'
        : 'Einfache Anmeldung für dein Charakterblatt.';
      document.getElementById('playerTabLogin').className = register ? 'ghost' : 'primary';
      document.getElementById('playerTabRegister').className = register ? 'primary' : 'ghost';
      document.getElementById('playerPass2Wrap').classList.toggle('hidden', !register);
      document.getElementById('playerSubmit').textContent = register ? 'Konto anlegen' : 'Anmelden';
      document.getElementById('playerError').textContent = '';
    }

    function openPlayerLogin(mode) {
      setPlayerFormMode(mode || 'login');
      document.getElementById('playerError').textContent = '';
      document.getElementById('playerUser').value = '';
      document.getElementById('playerPassword').value = '';
      document.getElementById('playerPassword2').value = '';
      document.getElementById('playerOverlay').classList.remove('hidden');
      document.getElementById('playerUser').focus();
    }

    function closePlayerLogin() {
      document.getElementById('playerOverlay').classList.add('hidden');
    }

    async function registerPlayer(name, password) {
      const id = playerIdFromName(name);
      if (id.length < 2) throw new Error('Bitte einen Namen mit mindestens 2 Zeichen wählen.');
      if (id === DM_USER) throw new Error('Dieser Name ist reserviert.');
      if (!password) throw new Error('Bitte ein Passwort setzen.');
      if (playerAccounts[id]) throw new Error('Diesen Namen gibt es schon.');
      const previous = playerAccounts;
      playerAccounts = Object.assign({}, playerAccounts);
      playerAccounts[id] = {
        name: name.trim().replace(/\s+/g, ' '),
        password: encodeSecret(password),
        sheet: Object.assign({}, EMPTY_SHEET),
        createdAt: Date.now()
      };
      try {
        await persistPlayers();
      } catch (err) {
        playerAccounts = previous;
        throw err;
      }
      setPlayer(id);
    }

    function loginPlayer(name, password) {
      const id = accountIdFromLoginName(name);
      const acc = playerAccounts[id];
      if (!acc || acc.password !== encodeSecret(password)) throw new Error('Name oder Passwort stimmt nicht.');
      setPlayer(id);
    }

    function showCharakter() {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      sheetDirty = false;
      veyrEntryEditing = false;
      showPage('char');
      currentIndex = null;
      currentTitle = null;
      renderCharakter();
      persistView();
    }

    function getVeyrEntry() {
      ensureVeyrAlt(playerAccounts);
      const alt = playerAccounts[YUVI_ID] && playerAccounts[YUVI_ID].alts && playerAccounts[YUVI_ID].alts[VEYR_ALT];
      if (!alt) return null;
      if (!alt.entry) alt.entry = normalizeAltEntry({ title: 'Veyr' }, 'Veyr');
      return alt.entry;
    }

    function openVeyrEditor() {
      if (!canEditOwnerSheet(VEYR_OWNER)) {
        toast('Nur Yuvi und der DM können diesen Eintrag bearbeiten.');
        return;
      }
      ensureVeyrAlt(playerAccounts);
      currentSheetOwner = VEYR_OWNER;
      veyrEntryEditing = true;
      sheetDirty = false;
      pendingVeyrImage = null;
      renderCharakter();
    }

    function setVeyrImagePreview(src) {
      const wrap = document.getElementById('veyrImagePreview');
      const img = document.getElementById('veyrImagePreviewImg');
      const removeBtn = document.getElementById('removeVeyrImageBtn');
      const ocrBtn = document.getElementById('ocrVeyrImageBtn');
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

    function showVeyrViewImage(imageId, title) {
      const fold = document.getElementById('veyrViewImageFold');
      const wrap = document.getElementById('veyrViewImageWrap');
      const img = document.getElementById('veyrViewImage');
      const token = ++veyrImageToken;
      if (!setImageFold(fold, wrap, img, imageId, title || 'Veyr')) return;
      if (imageCache[imageId]) {
        img.src = imageCache[imageId];
        return;
      }
      img.removeAttribute('src');
      loadEntryImage(imageId).then(data => {
        if (token !== veyrImageToken) return;
        if (!data) {
          if (fold) fold.classList.add('hidden');
          wrap.classList.add('hidden');
          return;
        }
        img.src = data;
      }).catch(() => {
        if (token !== veyrImageToken) return;
        if (fold) fold.classList.add('hidden');
        wrap.classList.add('hidden');
      });
    }

    function fillVeyrEditor(e) {
      document.getElementById('veyrTitle').value = e.title || 'Veyr';
      document.getElementById('veyrType').value = e.type === 'Niederfänge' ? 'Niederfänge' : 'Hochfänge';
      document.getElementById('veyrContent').innerHTML = sanitizeHtml(e.content || '');
      pendingVeyrImage = null;
      const token = ++veyrImageToken;
      setVeyrImagePreview(null);
      if (e.imageId) {
        if (imageCache[e.imageId]) setVeyrImagePreview(imageCache[e.imageId]);
        else {
          loadEntryImage(e.imageId).then(data => {
            if (token !== veyrImageToken || pendingVeyrImage !== null) return;
            if (data) setVeyrImagePreview(data);
          }).catch(() => {});
        }
      }
    }

    function renderVeyrPanel() {
      const e = getVeyrEntry() || normalizeAltEntry({ title: 'Veyr' }, 'Veyr');
      const card = document.getElementById('charMainCard');
      const view = document.getElementById('charEntryView');
      const editor = document.getElementById('charEntryEditor');
      const bar = document.getElementById('veyrViewBar');
      const canEdit = canEditOwnerSheet(VEYR_OWNER);
      const editing = !!(veyrEntryEditing && canEdit);
      veyrEntryEditing = editing;
      document.getElementById('charHeading').textContent = editing ? 'Eintrag bearbeiten' : (e.title || 'Veyr');
      card.classList.toggle('is-entry', !editing);
      if (bar) bar.classList.toggle('hidden', editing || !canEdit);
      if (editing) {
        view.classList.add('hidden');
        editor.classList.remove('hidden');
        if (!sheetDirty) fillVeyrEditor(e);
      } else {
        view.classList.remove('hidden');
        editor.classList.add('hidden');
        document.getElementById('veyrViewType').textContent = e.type || 'Hochfänge';
        document.getElementById('veyrViewTitle').textContent = e.title || 'Veyr';
        document.getElementById('veyrViewContent').innerHTML = htmlToText(e.content || '').trim()
          ? sanitizeHtml(e.content)
          : '<p><em>Noch kein Text. Über „Eintrag bearbeiten“ kannst du ihn anlegen.</em></p>';
        showVeyrViewImage(e.imageId, e.title);
      }
    }

    async function saveVeyrEntry() {
      if (!canEditOwnerSheet(VEYR_OWNER)) {
        toast('Nur Yuvi und der DM können diesen Eintrag bearbeiten.');
        return;
      }
      ensureVeyrAlt(playerAccounts);
      const alt = playerAccounts[YUVI_ID] && playerAccounts[YUVI_ID].alts && playerAccounts[YUVI_ID].alts[VEYR_ALT];
      if (!alt) {
        toast('Veyr fehlt noch. Der Account Yuvi muss existieren.');
        return;
      }
      const previous = Object.assign({}, alt.entry);
      const btn = document.getElementById('saveVeyrBtn');
      btn.disabled = true;
      btn.textContent = 'Speichert…';
      try {
        let imageId = previous.imageId || '';
        if (pendingVeyrImage === false) {
          if (imageId) await deleteEntryImage(imageId);
          imageId = '';
        } else if (typeof pendingVeyrImage === 'string') {
          const nextId = newImageId();
          await persistEntryImage(nextId, pendingVeyrImage);
          imageId = nextId;
        }
        alt.entry = {
          title: document.getElementById('veyrTitle').value.trim() || 'Veyr',
          type: document.getElementById('veyrType').value === 'Niederfänge' ? 'Niederfänge' : 'Hochfänge',
          content: sanitizeHtml(document.getElementById('veyrContent').innerHTML),
          imageId: imageId
        };
        await persistPlayers();
        pendingVeyrImage = null;
        sheetDirty = false;
        veyrEntryEditing = false;
        toast('Eintrag gespeichert.');
        renderCharakter();
      } catch (err) {
        alt.entry = previous;
        toast('Speichern fehlgeschlagen: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Speichern';
      }
    }

    async function readStatSheetFromVeyrImage() {
      if (!canEditOwnerSheet(VEYR_OWNER) || ocrBusy) return;
      const src = (typeof pendingVeyrImage === 'string' && pendingVeyrImage)
        || (document.getElementById('veyrImagePreviewImg') && document.getElementById('veyrImagePreviewImg').getAttribute('src'))
        || '';
      if (!src) return toast('Zuerst ein Stat-Sheet-Bild hochladen.');
      const existing = htmlToText(document.getElementById('veyrContent').innerHTML || '').trim();
      if (existing && !confirm('Der Text wird durch den erkannten Stat-Sheet-Text ersetzt. Fortfahren?')) return;
      ocrBusy = true;
      toast('Stat-Sheet wird gelesen… das kann einen Moment dauern.', 0);
      try {
        const ocr = await runStatSheetOcr(src);
        const parsed = parseStatSheetText(ocr.text, ocr.words, ocr.abilities);
        const html = sanitizeHtml(statSheetToHtml(parsed));
        if (!htmlToText(html).trim()) throw new Error('Im Bild wurde kein Text erkannt.');
        document.getElementById('veyrContent').innerHTML = html;
        sheetDirty = true;
        toast('Text erkannt. Bitte kurz prüfen und dann speichern. Das Bild bleibt.');
      } catch (err) {
        toast(err.message || 'Das Stat-Sheet konnte nicht gelesen werden.');
      } finally {
        ocrBusy = false;
      }
    }

    async function readStatSheetFromSheetImage() {
      if (!canEditOwnerSheet(currentSheetOwner) || ocrBusy) return;
      const src = (typeof pendingSheetPortrait === 'string' && pendingSheetPortrait)
        || (document.getElementById('sheetPortraitImg') && document.getElementById('sheetPortraitImg').getAttribute('src'))
        || '';
      if (!src) return toast('Zuerst ein Stat-Sheet-Bild hochladen.');
      const existing = htmlToText(document.getElementById('sheetContent').innerHTML || '').trim();
      if (existing && !confirm('Der Text wird durch den erkannten Stat-Sheet-Text ersetzt. Fortfahren?')) return;
      ocrBusy = true;
      toast('Stat-Sheet wird gelesen… das kann einen Moment dauern.', 0);
      try {
        const ocr = await runStatSheetOcr(src);
        const parsed = parseStatSheetText(ocr.text, ocr.words, ocr.abilities);
        const html = sanitizeHtml(statSheetToHtml(parsed));
        if (!htmlToText(html).trim()) throw new Error('Im Bild wurde kein Text erkannt.');
        document.getElementById('sheetContent').innerHTML = html;
        sheetDirty = true;
        toast('Text erkannt. Bitte kurz prüfen und dann speichern. Das Bild bleibt.');
      } catch (err) {
        toast(err.message || 'Das Stat-Sheet konnte nicht gelesen werden.');
      } finally {
        ocrBusy = false;
      }
    }

    function selectSheetOwner(owner) {
      if (currentSheetOwner === owner) return;
      if (sheetDirty && !confirm('Ungespeicherte Änderungen. Wirklich wechseln?')) return;
      currentSheetOwner = owner;
      sheetDirty = false;
      veyrEntryEditing = false;
      pendingVeyrImage = null;
      renderCharakter();
      persistView();
    }

    function renderCharakter() {
      const guest = document.getElementById('charGuest');
      const app = document.getElementById('charApp');
      const canUse = isDM || !!currentPlayerId;
      guest.classList.toggle('hidden', canUse);
      app.classList.toggle('hidden', !canUse);
      if (!canUse) {
        document.getElementById('charView').classList.remove('is-dnd-wide');
        return;
      }

      ensureVeyrAlt(playerAccounts);
      const roster = document.getElementById('charRoster');
      const layout = document.getElementById('charLayout');
      const ids = Object.keys(playerAccounts).sort((a, b) =>
        playerAccounts[a].name.localeCompare(playerAccounts[b].name, 'de')
      );
      const yuviPlayer = !isDM && currentPlayerId === YUVI_ID;
      const showRoster = isDM || yuviPlayer;
      if (showRoster) {
        roster.classList.remove('hidden');
        layout.classList.remove('solo');
        roster.querySelector('h3').textContent = yuviPlayer ? 'Charaktere' : 'Kategorien';
        const list = document.getElementById('charRosterList');
        list.innerHTML = '';
        if (isDM) {
          const dmGroup = document.createElement('div');
          dmGroup.className = 'char-roster-group';
          const dmLabel = document.createElement('div');
          dmLabel.className = 'char-roster-label';
          dmLabel.textContent = 'DM';
          dmGroup.appendChild(dmLabel);
          const dmBtn = document.createElement('button');
          dmBtn.type = 'button';
          dmBtn.className = 'char-dm-notes' + (isDmNotesOwner(currentSheetOwner) ? ' active' : '');
          dmBtn.textContent = 'DM-Notizen';
          dmBtn.onclick = () => selectSheetOwner(DM_NOTES_OWNER);
          dmGroup.appendChild(dmBtn);
          list.appendChild(dmGroup);
        }
        const rosterIds = yuviPlayer ? [YUVI_ID] : ids;
        const playerGroup = document.createElement('div');
        playerGroup.className = 'char-roster-group';
        if (isDM) {
          const playerLabel = document.createElement('div');
          playerLabel.className = 'char-roster-label';
          playerLabel.textContent = 'Spieler';
          playerGroup.appendChild(playerLabel);
        }
        if (!rosterIds.length) {
          const empty = document.createElement('p');
          empty.style.color = 'var(--muted)';
          empty.style.margin = '0';
          empty.textContent = 'Noch keine Spieler.';
          playerGroup.appendChild(empty);
        }
        rosterIds.forEach(id => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = currentSheetOwner === id ? 'active' : '';
          btn.textContent = playerAccounts[id].name;
          btn.onclick = () => selectSheetOwner(id);
          playerGroup.appendChild(btn);
          const showVeyr = id === YUVI_ID && (yuviPlayer || sheetAccountId(currentSheetOwner) === YUVI_ID);
          if (showVeyr && playerAccounts[YUVI_ID] && playerAccounts[YUVI_ID].alts && playerAccounts[YUVI_ID].alts[VEYR_ALT]) {
            const wrap = document.createElement('div');
            wrap.className = 'char-alts';
            const altBtn = document.createElement('button');
            altBtn.type = 'button';
            altBtn.className = 'char-alt' + (currentSheetOwner === VEYR_OWNER ? ' active' : '');
            altBtn.textContent = playerAccounts[YUVI_ID].alts[VEYR_ALT].name;
            altBtn.onclick = () => selectSheetOwner(VEYR_OWNER);
            wrap.appendChild(altBtn);
            playerGroup.appendChild(wrap);
          }
        });
        list.appendChild(playerGroup);
        if (isDM) {
          const npcGroup = document.createElement('div');
          npcGroup.className = 'char-roster-group';
          const npcLabel = document.createElement('div');
          npcLabel.className = 'char-roster-label';
          npcLabel.textContent = 'NPCs';
          npcGroup.appendChild(npcLabel);
          const npcIds = Object.keys(npcAccounts).sort((a, b) =>
            (npcAccounts[a].name || '').localeCompare(npcAccounts[b].name || '', 'de')
          );
          if (!npcIds.length) {
            const empty = document.createElement('p');
            empty.className = 'char-npc-empty';
            empty.textContent = 'Noch keine NPCs.';
            npcGroup.appendChild(empty);
          }
          npcIds.forEach(id => {
            const owner = NPC_PREFIX + id;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = currentSheetOwner === owner ? 'active' : '';
            btn.textContent = npcAccounts[id].name || 'NPC';
            btn.onclick = () => selectSheetOwner(owner);
            npcGroup.appendChild(btn);
          });
          const addNpcBtn = document.createElement('button');
          addNpcBtn.type = 'button';
          addNpcBtn.className = 'char-add-npc';
          addNpcBtn.textContent = '+ Neuer NPC';
          addNpcBtn.onclick = () => addNewNpc();
          npcGroup.appendChild(addNpcBtn);
          list.appendChild(npcGroup);
        }
        if (!currentSheetOwner || !(sheetOwnerRecord(currentSheetOwner) || (isDM && isDmNotesOwner(currentSheetOwner)))) {
          currentSheetOwner = rosterIds[0] || (isDM ? DM_NOTES_OWNER : null);
        }
      } else {
        roster.classList.add('hidden');
        layout.classList.add('solo');
        currentSheetOwner = currentPlayerId;
      }

      const rec = currentSheetOwner ? sheetOwnerRecord(currentSheetOwner) : null;
      const del = document.getElementById('deletePlayerBtn');
      const isVeyr = currentSheetOwner === VEYR_OWNER;
      const isNotes = isDM && isDmNotesOwner(currentSheetOwner);
      const isDnd = usesDndSheet(currentSheetOwner);
      document.getElementById('charSheetBlock').classList.toggle('hidden', isNotes || isDnd);
      const dndBlock = document.getElementById('charDndBlock');
      if (dndBlock) dndBlock.classList.toggle('hidden', isNotes || !isDnd);
      const sheetActions = document.getElementById('charSheetActions');
      if (sheetActions) sheetActions.classList.toggle('hidden', isNotes);
      document.getElementById('charEntryBlock').classList.add('hidden');
      const notesBlock = document.getElementById('charDmNotesBlock');
      if (notesBlock) notesBlock.classList.toggle('hidden', !isNotes);
      document.getElementById('charBlurb').classList.remove('hidden');
      document.getElementById('charMainCard').classList.remove('is-entry');
      document.getElementById('charMainCard').classList.toggle('is-veyr-sheet', isVeyr && !isNotes);
      document.getElementById('charMainCard').classList.toggle('is-dm-notes', isNotes);
      document.getElementById('charMainCard').classList.toggle('is-dnd', isDnd && !isNotes);
      document.getElementById('charView').classList.toggle('is-dnd-wide', isDnd && !isNotes);
      const notesField = document.getElementById('sheetNotesField');
      if (notesField) notesField.classList.toggle('hidden', isVeyr || isNotes);
      const extraLabel = document.getElementById('sheetExtraLabel');
      if (extraLabel) extraLabel.textContent = isVeyr ? 'Text' : 'Ausrüstung & mehr';
      del.classList.toggle('hidden', !isDM || !rec || rec.isAlt || isNotes);
      del.textContent = rec && rec.isNpc ? 'NPC entfernen' : 'Spieler entfernen';
      if (isNotes) {
        document.getElementById('charHeading').textContent = 'DM-Notizen';
        document.getElementById('charBlurb').textContent = 'Nur für dich. Liegt nicht in Sitzung, Codex oder auf den Spielerblättern.';
        if (!sheetDirty) {
          const box = document.getElementById('dmNotesContent');
          if (box) box.innerHTML = sanitizeHtml(dmNotes);
        }
        return;
      }
      document.getElementById('charBlurb').textContent = isVeyr
        ? 'Lucans Drake-Gefährte (Drakewarden) — nur für Yuvi und den DM.'
        : (rec && rec.isNpc)
        ? 'NPC-Blatt — nur für den DM sichtbar.'
        : 'Feste Werte oben, Notizen und Ausrüstung darunter — nur für dich und den DM.';
      if (!rec) {
        document.getElementById('charHeading').textContent = 'Charakterblatt';
        clearSheetForm();
        return;
      }
      document.getElementById('charHeading').textContent = 'Charakterblatt · ' + rec.name;
      if (!sheetDirty) fillSheetForm(rec.sheet);
    }

    async function saveDmNotes() {
      if (!isDM) return;
      const box = document.getElementById('dmNotesContent');
      const btn = document.getElementById('saveDmNotesBtn');
      const previous = dmNotes;
      dmNotes = sanitizeHtml(box ? box.innerHTML : '');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Speichert…';
      }
      try {
        await persistPlayers();
        sheetDirty = false;
        toast('Notizen gespeichert.');
      } catch (err) {
        dmNotes = previous;
        toast('Speichern fehlgeschlagen: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Notizen speichern';
        }
      }
    }

    async function saveSheet() {
      if (!currentSheetOwner || !sheetOwnerRecord(currentSheetOwner)) return;
      if (!canEditOwnerSheet(currentSheetOwner)) return;
      const rec = sheetOwnerRecord(currentSheetOwner);
      const previous = rec.sheet;
      const btn = document.getElementById('saveSheetBtn');
      btn.disabled = true;
      btn.textContent = 'Speichert…';
      try {
        if (pendingSheetPortrait) {
          const imageId = newImageId();
          await persistEntryImage(imageId, pendingSheetPortrait);
          sheetPortraitId = imageId;
          pendingSheetPortrait = null;
        }
        setOwnerSheet(currentSheetOwner, readSheetForm());
        if (currentSheetOwner === VEYR_OWNER) {
          ensureVeyrAlt(playerAccounts);
          const alt = playerAccounts[YUVI_ID] && playerAccounts[YUVI_ID].alts && playerAccounts[YUVI_ID].alts[VEYR_ALT];
          if (alt) {
            const sheet = alt.sheet || {};
            alt.entry = normalizeAltEntry({
              title: sheet.name || 'Veyr',
              type: alt.entry && alt.entry.type,
              content: sheet.extra,
              imageId: sheet.portraitId
            }, 'Veyr');
          }
        }
        await persistPlayers();
        combat.combatants.forEach(c => {
          if (c.playerId === currentSheetOwner) {
            const now = sheetOwnerRecord(currentSheetOwner);
            c.portraitId = (now && now.sheet && now.sheet.portraitId) || '';
            if (now) c.name = (now.sheet && now.sheet.name) || now.name;
            const hp = combatHpFromOwner(currentSheetOwner);
            c.hp = hp.hp;
            c.hpMax = hp.hpMax;
            c.tempHp = hp.tempHp;
            if (hp.ac) c.ac = hp.ac;
            touchCombatant(c);
            upsertBattleToken(c);
          }
        });
        persistCombat();
        if (usesDndSheet(currentSheetOwner)) {
          collapseDndAttacks();
          collapseDndSpells();
          renderDndLists();
        }
        sheetDirty = false;
        toast('Charakterblatt gespeichert.');
      } catch (err) {
        setOwnerSheet(currentSheetOwner, previous);
        toast('Speichern fehlgeschlagen: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Blatt speichern';
      }
    }

    async function deletePlayerAccount() {
      if (!isDM || !currentSheetOwner || !sheetOwnerRecord(currentSheetOwner)) return;
      const rec = sheetOwnerRecord(currentSheetOwner);
      if (rec.isAlt) return;
      if (rec.isNpc) {
        if (!confirm('NPC „' + rec.name + '“ und das Charakterblatt wirklich entfernen?')) return;
        const previousNpcs = npcAccounts;
        const removedNpcId = npcIdFromOwner(currentSheetOwner);
        npcAccounts = Object.assign({}, npcAccounts);
        delete npcAccounts[removedNpcId];
        try {
          await persistPlayers();
          currentSheetOwner = null;
          sheetDirty = false;
          toast('NPC entfernt.');
          renderCharakter();
        } catch (err) {
          npcAccounts = previousNpcs;
          toast('Löschen fehlgeschlagen: ' + err.message);
        }
        return;
      }
      if (!confirm('Spieler „' + rec.name + '“ und das Charakterblatt wirklich entfernen?')) return;
      const previous = playerAccounts;
      const removedId = rec.accountId;
      playerAccounts = Object.assign({}, playerAccounts);
      delete playerAccounts[removedId];
      try {
        await persistPlayers();
        if (currentPlayerId === removedId) setPlayer(null);
        currentSheetOwner = null;
        sheetDirty = false;
        toast('Spieler entfernt.');
        renderCharakter();
      } catch (err) {
        playerAccounts = previous;
        toast('Löschen fehlgeschlagen: ' + err.message);
      }
    }

    function addNewNpc() {
      if (!isDM) return;
      const name = (window.prompt('Name des NPCs:', '') || '').trim();
      if (!name) return;
      const id = newNpcId();
      npcAccounts = Object.assign({}, npcAccounts, {
        [id]: {
          name: name,
          sheet: Object.assign({}, EMPTY_SHEET, { name: name }),
          createdAt: Date.now()
        }
      });
      currentSheetOwner = NPC_PREFIX + id;
      sheetDirty = false;
      renderCharakter();
      persistPlayersSoon();
      toast(name + ' angelegt.');
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
      if (kampfAimFrom && !kampfPowerPhase) return false;
      if (!diceRollsEnabled()) return false;
      const row = combatantById(id);
      if (!row) return false;
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
          cancelKampfAim();
          return true;
        }
        if (canControlCombatant(row) && combatantHasPowers(row)) {
          openKampfPowerOverlay(id);
          return true;
        }
        toast('Erst Aktion wählen.');
        return true;
      }
      if (!canControlCombatant(row) || !combatantHasPowers(row)) return false;
      openKampfPowerOverlay(id);
      return true;
    }

    function positionKampfPowerOverlay() {
      const box = document.getElementById('kampfPowerOverlay');
      if (!box || box.classList.contains('hidden')) return;
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
      if (hint) hint.textContent = soundPickKind === 'fx'
        ? 'Effekt antippen. Stern legt ihn in die Leiste.'
        : 'Klang antippen. Pause hält die Stelle, Stop blendet aus. Gruppen filtern die Liste.';
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