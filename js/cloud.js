/* Thalarion – Cloud (Firebase, Welt, Bilder) – Phase 1.5 */

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

    function dungeonRef() {
      return db.collection('world').doc(DUNGEON_DOC);
    }

    function dungeonMapRef() {
      return db.collection('world').doc(DUNGEON_MAP_DOC);
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

    function indexByEntryId(id) {
      if (!id) return null;
      const i = entries.findIndex(e => e.id === id);
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
      else if (currentPage === 'chronik') showChronik();
      else if (currentPage === 'entstehung') showEntstehung();
      else if (currentPage === 'sitzung') showSitzung();
      else if (currentTitle && i === null) showCatalog(currentPage === 'bestiarium' || currentPage === 'glossar' ? 'codex' : currentPage);
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
