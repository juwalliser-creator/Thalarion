/* Thalarion – Weltkarte (Pins, Grenzen, Zoom) – Phase 1.3 */

    function applyMap(data) {
      if (!data || !data.image) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= mapUpdatedAt) return;
      mapUpdatedAt = at;
      document.getElementById('worldMap').src = data.image;
    }

    function listenMap() {
      if (!db) return;
      mapRef().onSnapshot(snap => {
        if (writingMap || !snap.exists) return;
        applyMap(snap.data());
      });
    }

    function pinKindById(id) {
      return PIN_KINDS.find(k => k.id === id) || PIN_KINDS[0];
    }

    function pinIconSvg(kindId) {
      const kind = pinKindById(kindId);
      const c = kind.color;
      const inner = {
        dot: `<circle cx="16" cy="16" r="7" fill="${c}" stroke="#e0c27a" stroke-width="2"/>`,
        city: `<circle cx="16" cy="16" r="13" fill="none" stroke="${c}" stroke-width="2"/><rect x="10" y="10" width="12" height="12" transform="rotate(45 16 16)" fill="${c}"/>`,
        outpost: `<polygon points="16,5 27,26 5,26" fill="${c}" stroke="#1a1612" stroke-width="1.4"/>`,
        battle: `<line x1="8" y1="24" x2="24" y2="8" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><line x1="8" y1="8" x2="24" y2="24" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`,
        hq: `<circle cx="16" cy="16" r="13" fill="#14110e" stroke="${c}" stroke-width="2.4"/><polygon points="16,7 19,13 26,14 21,18 22,25 16,21 10,25 11,18 6,14 13,13" fill="${c}"/>`,
        faith: `<circle cx="16" cy="16" r="10" fill="${c}" stroke="#1a1612" stroke-width="1.4"/><circle cx="16" cy="16" r="3.2" fill="#14110e"/>`
      }[kind.shape] || `<circle cx="16" cy="16" r="7" fill="${c}"/>`;
      return `<svg class="map-pin-icon" viewBox="0 0 32 32" aria-hidden="true">${inner}</svg>`;
    }

    function normalizePins(list) {
      return (Array.isArray(list) ? list : []).map((p, i) => ({
        id: p.id || ('pin_' + i + '_' + (p.title || 'ort')),
        title: p.title || '',
        x: Number(p.x),
        y: Number(p.y),
        kind: p.kind || 'ort',
        linked: p.linked !== false
      })).filter(p => p.title && Number.isFinite(p.x) && Number.isFinite(p.y));
    }

    function normalizeBorders(list) {
      return (Array.isArray(list) ? list : []).map((b, i) => ({
        id: b.id || ('border_' + i),
        name: b.name || 'Grenze',
        color: b.color || '#d4b36a',
        points: (Array.isArray(b.points) ? b.points : []).map(pt => ({
          x: Number(pt.x),
          y: Number(pt.y)
        })).filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y))
      })).filter(b => b.points.length >= 2);
    }

    function applyPins(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= mapPinsUpdatedAt) return;
      mapPinsUpdatedAt = at;
      mapPins = normalizePins(data.pins);
      mapBorders = normalizeBorders(data.borders);
      renderMapPins();
      renderMapBorders();
    }

    function listenPins() {
      if (!db) return;
      pinsRef().onSnapshot(snap => {
        if (writingPins || !snap.exists) return;
        applyPins(snap.data());
      });
    }

    async function persistPins() {
      if (!db) throw new Error('Keine Verbindung zur Cloud.');
      const nextAt = Date.now();
      writingPins = true;
      try {
        await pinsRef().set({
          updatedAt: nextAt,
          pins: mapPins,
          borders: mapBorders
        });
        mapPinsUpdatedAt = nextAt;
      } finally {
        writingPins = false;
      }
    }

    function updateMapHint() {
      const hint = document.getElementById('mapHint');
      if (drawingBorder) {
        hint.textContent = editingBorderId
          ? 'Neue Punkte für die Grenze setzen, dann „Grenze schließen“.'
          : 'Klicke Punkte entlang der Grenze. Danach „Grenze schließen“.';
        hint.classList.remove('hidden');
      } else if (placingPin) {
        hint.textContent = 'Klicke auf die Stelle auf der Karte, dann wähle Symbol und Eintrag.';
        hint.classList.remove('hidden');
      } else {
        hint.classList.add('hidden');
      }
    }

    function setPlacingPin(on) {
      placingPin = !!on && isDM;
      pendingPin = null;
      if (placingPin) setDrawingBorder(false);
      const stage = document.getElementById('mapStage');
      const btn = document.getElementById('placePinBtn');
      stage.classList.toggle('placing', placingPin);
      btn.classList.toggle('primary', placingPin);
      btn.classList.toggle('ghost', !placingPin);
      btn.textContent = placingPin ? 'Fertig' : 'Ort setzen';
      updateMapHint();
      if (!placingPin) closePinPicker();
    }

    function setDrawingBorder(on) {
      drawingBorder = !!on && isDM;
      if (drawingBorder) {
        setPlacingPin(false);
        borderDraft = [];
      } else {
        borderDraft = [];
        if (!editingBorderId) document.getElementById('borderOverlay').classList.add('hidden');
      }
      const stage = document.getElementById('mapStage');
      const btn = document.getElementById('drawBorderBtn');
      stage.classList.toggle('drawing', drawingBorder);
      btn.classList.toggle('primary', drawingBorder);
      btn.classList.toggle('ghost', !drawingBorder);
      btn.textContent = drawingBorder ? 'Grenze schließen' : 'Grenze zeichnen';
      updateMapHint();
      renderMapBorders();
    }

    function visibleMapPins() {
      return mapPins.filter(pin => {
        if (!pin.linked) return true;
        const i = indexByTitle(pin.title);
        if (i === null) return isDM;
        return isDM || entries[i].visibility === 'player';
      });
    }

    function renderMapPins() {
      const box = document.getElementById('mapPins');
      if (!box) return;
      box.innerHTML = '';
      visibleMapPins().forEach(pin => {
        const i = pin.linked ? indexByTitle(pin.title) : null;
        const kind = pinKindById(pin.kind);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-pin';
        btn.style.left = pin.x + '%';
        btn.style.top = pin.y + '%';
        btn.title = pin.title + ' · ' + kind.label;
        btn.dataset.pinId = pin.id;
        btn.innerHTML = pinIconSvg(pin.kind);
        const label = document.createElement('span');
        label.className = 'map-pin-label';
        const name = document.createElement('span');
        name.textContent = pin.title + (pin.linked && i === null ? ' (fehlt)' : '');
        label.appendChild(name);
        if (isDM) {
          const edit = document.createElement('button');
          edit.type = 'button';
          edit.className = 'ghost map-pin-del map-pin-edit';
          edit.textContent = '✎';
          edit.title = 'Ort bearbeiten';
          edit.onclick = ev => {
            ev.stopPropagation();
            openPinEditor(pin.id);
          };
          label.appendChild(edit);
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'ghost map-pin-del';
          del.textContent = '×';
          del.title = 'Ort entfernen';
          del.onclick = ev => {
            ev.stopPropagation();
            removeMapPin(pin.id);
          };
          label.appendChild(del);
        }
        btn.appendChild(label);
        box.appendChild(btn);
      });
      renderMapBorders();
    }

    function showBorderTip(name, ev) {
      const tip = document.getElementById('mapBorderTip');
      const stage = document.getElementById('mapStage');
      if (!tip || !stage || !name) return;
      const rect = stage.getBoundingClientRect();
      tip.textContent = name;
      tip.style.left = ((ev.clientX - rect.left) / mapScale) + 'px';
      tip.style.top = ((ev.clientY - rect.top) / mapScale) + 'px';
      tip.classList.add('show');
    }

    function hideBorderTip() {
      const tip = document.getElementById('mapBorderTip');
      if (tip) tip.classList.remove('show');
    }

    function renderMapBorders() {
      const svg = document.getElementById('mapOverlay');
      if (!svg) return;
      svg.innerHTML = '';
      document.querySelectorAll('.map-border-del').forEach(el => el.remove());
      hideBorderTip();
      mapBorders.forEach(border => {
        const d = roundedPolyPath(border.points, true);
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        poly.setAttribute('class', 'map-border');
        poly.setAttribute('d', d);
        poly.setAttribute('stroke', border.color || '#d4b36a');
        poly.setAttribute('fill', hexToRgba(border.color || '#d4b36a', 0.08));
        svg.appendChild(poly);
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hit.setAttribute('class', 'map-border-hit');
        hit.setAttribute('d', d);
        hit.setAttribute('data-border-id', border.id);
        hit.addEventListener('mousemove', ev => showBorderTip(border.name, ev));
        hit.addEventListener('mouseleave', hideBorderTip);
        if (isDM) {
          hit.style.cursor = 'pointer';
          hit.addEventListener('click', ev => {
            if (placingPin || drawingBorder) return;
            ev.stopPropagation();
            openBorderEditor(border.id);
          });
        }
        svg.appendChild(hit);
        if (isDM) {
          const mid = borderCentroid(border.points);
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'ghost map-pin-del map-border-del';
          del.textContent = '×';
          del.title = 'Grenze „' + border.name + '“ entfernen';
          del.style.position = 'absolute';
          del.style.left = mid.x + '%';
          del.style.top = mid.y + '%';
          del.style.transform = 'translate(-50%, -50%)';
          del.style.pointerEvents = 'auto';
          del.style.zIndex = '3';
          del.onclick = ev => {
            ev.stopPropagation();
            hideBorderTip();
            removeMapBorder(border.id);
          };
          document.getElementById('mapPins').appendChild(del);
        }
      });
      if (drawingBorder && borderDraft.length) {
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        poly.setAttribute('class', 'map-border draft');
        poly.setAttribute('d', roundedPolyPath(borderDraft, borderDraft.length > 2));
        if (borderDraft.length < 3) poly.setAttribute('fill', 'none');
        svg.appendChild(poly);
      }
    }

    function hexToRgba(hex, a) {
      const h = hex.replace('#', '');
      const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }

    function borderCentroid(points) {
      const n = points.length || 1;
      return {
        x: points.reduce((s, p) => s + p.x, 0) / n,
        y: points.reduce((s, p) => s + p.y, 0) / n
      };
    }

    async function removeMapPin(id) {
      if (!isDM) return;
      const previous = mapPins.slice();
      mapPins = mapPins.filter(p => p.id !== id);
      renderMapPins();
      try {
        await persistPins();
        toast('Ort entfernt.');
      } catch (err) {
        mapPins = previous;
        renderMapPins();
        toast('Konnte den Ort nicht speichern: ' + err.message);
      }
    }

    async function removeMapBorder(id) {
      if (!isDM) return;
      const previous = mapBorders.slice();
      mapBorders = mapBorders.filter(b => b.id !== id);
      renderMapPins();
      renderMapBorders();
      try {
        await persistPins();
        toast('Grenze entfernt.');
      } catch (err) {
        mapBorders = previous;
        renderMapPins();
        renderMapBorders();
        toast('Konnte die Grenze nicht speichern: ' + err.message);
      }
    }

    function closePinPicker() {
      pendingPin = null;
      editingPinId = null;
      document.getElementById('pinOverlay').classList.add('hidden');
      document.getElementById('pinSaveEdit').classList.add('hidden');
      document.getElementById('pinOverlayTitle').textContent = 'Ort setzen';
      document.getElementById('pinOverlayHint').textContent = 'Wähle ein Symbol. Danach einen Eintrag oder nur einen Namen.';
    }

    function openPinPicker() {
      editingPinId = null;
      document.getElementById('pinOverlayTitle').textContent = 'Ort setzen';
      document.getElementById('pinOverlayHint').textContent = 'Wähle ein Symbol. Danach einen Eintrag oder nur einen Namen.';
      document.getElementById('pinSaveEdit').classList.add('hidden');
      document.getElementById('pinSearch').value = '';
      document.getElementById('pinLabel').value = '';
      renderPinKindGrid();
      renderPinPicker();
      document.getElementById('pinOverlay').classList.remove('hidden');
      document.getElementById('pinSearch').focus();
    }

    function openPinEditor(id) {
      const pin = mapPins.find(p => p.id === id);
      if (!pin || !isDM) return;
      editingPinId = id;
      selectedPinKind = pin.kind || 'ort';
      document.getElementById('pinOverlayTitle').textContent = 'Ort bearbeiten';
      document.getElementById('pinOverlayHint').textContent = 'Symbol, Name oder verknüpften Eintrag ändern.';
      document.getElementById('pinSaveEdit').classList.remove('hidden');
      document.getElementById('pinSearch').value = '';
      document.getElementById('pinLabel').value = pin.linked ? '' : (pin.title || '');
      renderPinKindGrid();
      renderPinPicker();
      document.getElementById('pinOverlay').classList.remove('hidden');
    }

    async function savePinEdits(title, linked) {
      if (!isDM || !editingPinId) return;
      const pin = mapPins.find(p => p.id === editingPinId);
      if (!pin) return;
      const previous = mapPins.map(p => Object.assign({}, p));
      pin.kind = selectedPinKind || pin.kind;
      if (title) {
        pin.title = title;
        pin.linked = !!linked;
      }
      closePinPicker();
      renderMapPins();
      try {
        await persistPins();
        toast('Ort geändert.');
      } catch (err) {
        mapPins = previous;
        renderMapPins();
        toast('Konnte den Ort nicht speichern: ' + err.message);
      }
    }

    function renderPinKindGrid() {
      const grid = document.getElementById('pinKindGrid');
      grid.innerHTML = '';
      PIN_KINDS.forEach(kind => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pin-kind' + (selectedPinKind === kind.id ? ' active' : '');
        btn.innerHTML = pinIconSvg(kind.id) + '<span>' + kind.label + '</span>';
        btn.onclick = () => {
          selectedPinKind = kind.id;
          renderPinKindGrid();
        };
        grid.appendChild(btn);
      });
    }

    function renderMapLegend() {
      const box = document.getElementById('mapLegend');
      box.innerHTML = '<h3>Zeichenerklärung</h3>';
      PIN_KINDS.forEach(kind => {
        const row = document.createElement('div');
        row.className = 'map-legend-item';
        row.innerHTML = pinIconSvg(kind.id) + '<span>' + kind.label + '</span>';
        box.appendChild(row);
      });
    }

    function renderPinPicker() {
      const list = document.getElementById('pinList');
      const query = (document.getElementById('pinSearch').value || '').toLowerCase();
      list.innerHTML = '';
      let total = 0;
      SEARCH_GROUPS.forEach(group => {
        if (group.page === 'entstehung' || group.page === 'sitzung') return;
        const hits = entries
          .map((e, i) => ({ e, i }))
          .filter(({ e }) =>
            pageForType(e.type) === group.page &&
            (isDM || e.visibility === 'player') &&
            (!query || e.title.toLowerCase().includes(query) || htmlToText(e.content).toLowerCase().includes(query))
          );
        if (!hits.length) return;
        total += hits.length;
        const label = document.createElement('div');
        label.className = 'search-group-label';
        label.textContent = group.label;
        list.appendChild(label);
        hits.forEach(({ e }) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = e.title + ' · ' + e.type;
          btn.onclick = () => applyPinChoice(e.title, true);
          list.appendChild(btn);
        });
      });
      if (!total) {
        const empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.textContent = query ? 'Kein passender Eintrag.' : 'Keine Einträge. Du kannst oben einen Namen eingeben und nur eine Markierung setzen.';
        list.appendChild(empty);
      }
    }

    async function applyPinChoice(title, linked) {
      if (editingPinId) return savePinEdits(title, linked);
      return addMapPin(title, linked);
    }

    async function addMapPin(title, linked) {
      if (!isDM || !pendingPin || !title) return;
      const previous = mapPins.slice();
      mapPins.push({
        id: 'pin_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: title,
        x: pendingPin.x,
        y: pendingPin.y,
        kind: selectedPinKind || 'ort',
        linked: !!linked
      });
      closePinPicker();
      renderMapPins();
      try {
        await persistPins();
        toast(linked ? 'Ort verknüpft: ' + title : 'Markierung gesetzt: ' + title);
      } catch (err) {
        mapPins = previous;
        renderMapPins();
        toast('Konnte den Ort nicht speichern: ' + err.message);
      }
    }

    function finishBorderDraft() {
      if (!isDM || !drawingBorder) return;
      if (borderDraft.length < 3) {
        toast('Mindestens drei Punkte für eine Grenze.');
        return;
      }
      if (editingBorderId) {
        saveRedrawnBorder();
        return;
      }
      document.getElementById('borderOverlayTitle').textContent = 'Grenze benennen';
      document.getElementById('borderOverlayHint').textContent = 'Wie soll diese Landesgrenze heißen?';
      document.getElementById('borderRedraw').classList.add('hidden');
      document.getElementById('borderName').value = '';
      document.getElementById('borderColor').value = '#d4b36a';
      document.getElementById('borderOverlay').classList.remove('hidden');
      document.getElementById('borderName').focus();
    }

    function openBorderEditor(id) {
      const border = mapBorders.find(b => b.id === id);
      if (!border || !isDM) return;
      editingBorderId = id;
      document.getElementById('borderOverlayTitle').textContent = 'Grenze bearbeiten';
      document.getElementById('borderOverlayHint').textContent = 'Name und Farbe ändern oder die Grenze neu zeichnen.';
      document.getElementById('borderRedraw').classList.remove('hidden');
      document.getElementById('borderName').value = border.name || '';
      document.getElementById('borderColor').value = border.color || '#d4b36a';
      document.getElementById('borderOverlay').classList.remove('hidden');
      document.getElementById('borderName').focus();
    }

    async function saveRedrawnBorder() {
      const border = mapBorders.find(b => b.id === editingBorderId);
      if (!border || borderDraft.length < 3) return;
      const previous = mapBorders.map(b => Object.assign({}, b, { points: b.points.slice() }));
      border.points = borderDraft.slice();
      borderDraft = [];
      editingBorderId = null;
      setDrawingBorder(false);
      renderMapPins();
      try {
        await persistPins();
        toast('Grenze neu gezeichnet.');
      } catch (err) {
        mapBorders = previous;
        renderMapPins();
        toast('Konnte die Grenze nicht speichern: ' + err.message);
      }
    }

    async function saveBorderDraft(name, color) {
      if (!isDM) return;
      if (editingBorderId && !drawingBorder) {
        const border = mapBorders.find(b => b.id === editingBorderId);
        if (!border) return;
        const previous = mapBorders.map(b => Object.assign({}, b, { points: b.points.slice() }));
        border.name = name;
        border.color = color || border.color;
        editingBorderId = null;
        document.getElementById('borderOverlay').classList.add('hidden');
        renderMapPins();
        try {
          await persistPins();
          toast('Grenze geändert.');
        } catch (err) {
          mapBorders = previous;
          renderMapPins();
          toast('Konnte die Grenze nicht speichern: ' + err.message);
        }
        return;
      }
      if (borderDraft.length < 3) return;
      const previous = mapBorders.slice();
      mapBorders.push({
        id: 'border_' + Date.now().toString(36),
        name: name,
        color: color || '#d4b36a',
        points: borderDraft.slice()
      });
      borderDraft = [];
      document.getElementById('borderOverlay').classList.add('hidden');
      setDrawingBorder(false);
      renderMapPins();
      renderMapBorders();
      try {
        await persistPins();
        toast('Grenze gespeichert: ' + name);
      } catch (err) {
        mapBorders = previous;
        renderMapPins();
        renderMapBorders();
        toast('Konnte die Grenze nicht speichern: ' + err.message);
      }
    }

    function mapClickToPercent(ev) {
      const img = document.getElementById('worldMap');
      const rect = img.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return null;
      if (ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) return null;
      return {
        x: ((ev.clientX - rect.left) / rect.width) * 100,
        y: ((ev.clientY - rect.top) / rect.height) * 100
      };
    }

    function clampMapPan() {
      const wrap = document.getElementById('mapWrap');
      const stage = document.getElementById('mapStage');
      if (!wrap || !stage) return;
      const ww = wrap.clientWidth;
      const wh = wrap.clientHeight;
      const sw = stage.offsetWidth * mapScale;
      const sh = stage.offsetHeight * mapScale;
      if (sw <= ww) mapPanX = (ww - sw) / 2;
      else mapPanX = Math.min(0, Math.max(ww - sw, mapPanX));
      if (sh <= wh) mapPanY = 0;
      else mapPanY = Math.min(0, Math.max(wh - sh, mapPanY));
    }

    function applyMapTransform() {
      const stage = document.getElementById('mapStage');
      const wrap = document.getElementById('mapWrap');
      const reset = document.getElementById('mapZoomReset');
      if (!stage || !wrap) return;
      if (mapScale <= 1.001) {
        mapScale = 1;
        wrap.classList.remove('is-zoomed');
        stage.style.transform = 'none';
        if (mapPanX || mapPanY) {
          wrap.scrollLeft = Math.max(0, -mapPanX);
          wrap.scrollTop = Math.max(0, -mapPanY);
          mapPanX = 0;
          mapPanY = 0;
        }
      } else {
        if (!wrap.classList.contains('is-zoomed')) {
          wrap.scrollLeft = 0;
          wrap.scrollTop = 0;
        }
        wrap.classList.add('is-zoomed');
        clampMapPan();
        stage.style.transform = 'translate(' + mapPanX + 'px,' + mapPanY + 'px) scale(' + mapScale + ')';
      }
      if (reset) reset.textContent = Math.round(mapScale * 100) + '%';
    }

    function zoomMapAt(clientX, clientY, nextScale) {
      nextScale = Math.max(1, Math.min(4, nextScale));
      const wrap = document.getElementById('mapWrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      if (mapScale <= 1) {
        mapPanX = -wrap.scrollLeft;
        mapPanY = -wrap.scrollTop;
      }
      const x = (mx - mapPanX) / mapScale;
      const y = (my - mapPanY) / mapScale;
      mapScale = nextScale;
      mapPanX = mx - x * mapScale;
      mapPanY = my - y * mapScale;
      applyMapTransform();
    }

    function zoomMapBy(delta) {
      const wrap = document.getElementById('mapWrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      zoomMapAt(rect.left + rect.width / 2, rect.top + rect.height / 2, mapScale + delta);
    }

    function isMapFullscreen() {
      const view = document.getElementById('mapView');
      return !!(view && view.classList.contains('is-full'));
    }

    function syncMapFullscreenBtn() {
      const btn = document.getElementById('mapFullBtn');
      if (!btn) return;
      const on = isMapFullscreen();
      btn.textContent = on ? 'Vollbild aus' : 'Vollbild';
      btn.classList.toggle('primary', on);
      btn.classList.toggle('ghost', !on);
    }

    function setMapFullscreen(on) {
      const view = document.getElementById('mapView');
      if (!view) return;
      const next = !!on && currentPage === 'map' && !view.classList.contains('hidden');
      view.classList.toggle('is-full', next);
      document.body.classList.toggle('is-map-full', next);
      syncMapFullscreenBtn();
      requestAnimationFrame(() => applyMapTransform());
    }

    function toggleMapFullscreen() {
      setMapFullscreen(!isMapFullscreen());
    }

    function resetMapView() {
      mapScale = 1;
      mapPanX = 0;
      mapPanY = 0;
      const wrap = document.getElementById('mapWrap');
      if (wrap) {
        wrap.scrollTop = 0;
        wrap.scrollLeft = 0;
      }
      applyMapTransform();
    }

    function openMapPin(id) {
      const pin = mapPins.find(p => p.id === id);
      if (!pin) return;
      if (!pin.linked) {
        if (isDM) openPinEditor(id);
        else toast('Dieser Ort ist noch nicht mit einem Eintrag verknüpft.');
        return;
      }
      const i = indexByTitle(pin.title);
      if (i === null) {
        toast('Dieser Eintrag existiert nicht mehr. Als DM kannst du die Markierung löschen.');
        return;
      }
      loadEntry(i, true);
    }

    function fileToMapImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          let w = img.width;
          let h = img.height;
          const maxSide = 1800;
          if (Math.max(w, h) > maxSide) {
            const scale = maxSide / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          let quality = 0.82;
          let data = canvas.toDataURL('image/jpeg', quality);
          while (data.length > 700000 && quality > 0.35) {
            quality -= 0.12;
            data = canvas.toDataURL('image/jpeg', quality);
          }
          if (data.length > 900000) reject(new Error('Die Karte ist zu groß. Bitte ein kleineres Bild wählen.'));
          else resolve(data);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Das Bild konnte nicht gelesen werden.'));
        };
        img.src = url;
      });
    }

    async function uploadMapFile(file) {
      if (!isDM || !file) return;
      if (!db) return toast('Keine Verbindung zur Cloud.');
      toast('Karte wird hochgeladen…');
      try {
        const image = await storeCloudImage('world-map', await fileToMapImage(file));
        const updatedAt = Date.now();
        writingMap = true;
        await mapRef().set({ image: image, updatedAt: updatedAt });
        mapUpdatedAt = updatedAt;
        document.getElementById('worldMap').src = image;
        toast('Neue Karte ist für alle Laptops gespeichert.');
      } catch (err) {
        toast(err.message || 'Karte konnte nicht hochgeladen werden.');
      } finally {
        writingMap = false;
      }
    }

    function captureMapView() {
      const wrap = document.getElementById('mapWrap');
      if (!wrap) return;
      mapViewMemo = {
        scale: mapScale,
        panX: mapPanX,
        panY: mapPanY,
        sl: wrap.scrollLeft,
        st: wrap.scrollTop
      };
    }

    function restoreMapView() {
      if (!mapViewMemo) return;
      mapScale = Number(mapViewMemo.scale) || 1;
      mapPanX = Number(mapViewMemo.panX) || 0;
      mapPanY = Number(mapViewMemo.panY) || 0;
      applyMapTransform();
      const wrap = document.getElementById('mapWrap');
      if (!wrap) return;
      requestAnimationFrame(() => {
        if (!mapViewMemo) return;
        wrap.scrollLeft = mapViewMemo.sl || 0;
        wrap.scrollTop = mapViewMemo.st || 0;
      });
    }

    function showMap() {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      sheetDirty = false;
      openedFromMap = false;
      showPage('map');
      currentIndex = null;
      currentTitle = null;
      els.sitzungView.classList.add('hidden');
      renderSidebar();
      renderMapPins();
      renderMapBorders();
      applyMapTransform();
      restoreMapView();
    }
