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

    function mapShapeById(id) {
      return MAP_SHAPES.find(s => s.id === id) || MAP_SHAPES.find(s => s.id === 'landmark') || MAP_SHAPES[0];
    }

    function mapFactionById(id) {
      return MAP_FACTIONS.find(f => f.id === id) || MAP_FACTIONS.find(f => f.id === 'neutral') || MAP_FACTIONS[0];
    }

    function mapTierById(id) {
      return MAP_TIERS.find(t => t.id === id) || MAP_TIERS.find(t => t.id === 'marker') || MAP_TIERS[0];
    }

    function ensureMapFilters() {
      MAP_FACTIONS.forEach(f => {
        if (typeof mapFilter.factions[f.id] !== 'boolean') mapFilter.factions[f.id] = true;
      });
      MAP_SHAPES.forEach(s => {
        if (typeof mapFilter.shapes[s.id] !== 'boolean') mapFilter.shapes[s.id] = true;
      });
      if (typeof mapFilter.showBorders !== 'boolean') mapFilter.showBorders = true;
      if (typeof mapFilter.sessionOnly !== 'boolean') mapFilter.sessionOnly = false;
      if (typeof mapFilter.showDmSecrets !== 'boolean') mapFilter.showDmSecrets = true;
    }

    function migratePinKind(kind) {
      return PIN_KIND_MIGRATE[kind] || null;
    }

    function pinDescribe(pin) {
      const shape = mapShapeById(pin.shape);
      const faction = mapFactionById(pin.faction);
      const tier = mapTierById(pin.tier);
      return shape.label + ' · ' + faction.label + ' · ' + tier.label;
    }

    function pinFactionGlyph(factionId, color) {
      const ink = MAP_PIN_EDGE;
      const deep = MAP_PIN_CORE;
      if (factionId === 'swords') {
        return `<g fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round">
          <line x1="12" y1="22" x2="20" y2="10"/><line x1="12" y1="10" x2="20" y2="22"/>
          <line x1="11" y1="11" x2="13" y2="9"/><line x1="19" y1="21" x2="21" y2="19"/>
        </g>`;
      }
      if (factionId === 'lakunos') {
        return `<polygon points="16,10 20,18 12,18" fill="none" stroke="${ink}" stroke-width="1.5"/>
          <circle cx="16" cy="15.2" r="1.6" fill="${ink}"/>`;
      }
      if (factionId === 'blood') {
        return `<path d="M16 10 C16 10 21 16 21 18.5 A5 5 0 0 1 11 18.5 C11 16 16 10 16 10Z" fill="${ink}"/>`;
      }
      if (factionId === 'night') {
        return `<path d="M19 11.5 A6 6 0 1 0 19 20.5 A4.5 4.5 0 1 1 19 11.5Z" fill="${ink}"/>`;
      }
      if (factionId === 'elf') {
        return `<path d="M16 9 L18.2 14.5 L24 15 L19.5 18.5 L21 24 L16 21 L11 24 L12.5 18.5 L8 15 L13.8 14.5Z" fill="${ink}"/>`;
      }
      if (factionId === 'orc') {
        return `<path d="M10 14 L16 9 L22 14 L20 23 L12 23Z" fill="${ink}"/>`;
      }
      if (factionId === 'human') {
        return `<circle cx="16" cy="13" r="3" fill="${ink}"/><path d="M10 24 C10 19 22 19 22 24" fill="${ink}"/>`;
      }
      if (factionId === 'dwarf') {
        return `<rect x="11" y="12" width="10" height="9" rx="1" fill="${ink}"/><path d="M13 12 L16 8 L19 12" fill="${deep}"/>`;
      }
      return '';
    }

    function pinShapeBody(shapeId, color) {
      const c = color;
      const edge = MAP_PIN_EDGE;
      const core = MAP_PIN_CORE;
      const bodies = {
        settlement: `<circle cx="16" cy="16" r="13" fill="none" stroke="${c}" stroke-width="2"/><rect x="10" y="10" width="12" height="12" transform="rotate(45 16 16)" fill="${c}" stroke="${edge}" stroke-width="1"/>`,
        outpost: `<polygon points="16,5 27,26 5,26" fill="${c}" stroke="${core}" stroke-width="1.4"/>`,
        landmark: `<path d="M16 4 C11 4 7 8.2 7 13.2 C7 19.5 16 28 16 28 C16 28 25 19.5 25 13.2 C25 8.2 21 4 16 4Z" fill="${c}" stroke="${edge}" stroke-width="1.4"/><circle cx="16" cy="13" r="3.2" fill="${core}"/>`,
        temple: `<circle cx="16" cy="16" r="12" fill="${c}" stroke="${edge}" stroke-width="1.6"/><circle cx="16" cy="16" r="5.5" fill="${core}"/>`,
        hq: `<circle cx="16" cy="16" r="13" fill="${core}" stroke="${c}" stroke-width="2.4"/><circle cx="16" cy="16" r="8.5" fill="${c}"/>`,
        ruin: `<path d="M7 24 L7 12 L12 8 L16 12 L20 7 L25 12 L25 24 Z" fill="${c}" stroke="${core}" stroke-width="1.3"/><path d="M12 24 L12 16 L16 16 L16 24" fill="${core}" opacity="0.55"/>`,
        danger: `<circle cx="16" cy="16" r="12" fill="${core}" stroke="${c}" stroke-width="2"/><line x1="9" y1="23" x2="23" y2="9" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="9" y1="9" x2="23" y2="23" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
        harbor: `<circle cx="16" cy="16" r="12" fill="${c}" stroke="${edge}" stroke-width="1.5"/><path d="M16 8 V18 M16 18 C11 18 10 22 10 24 M16 18 C21 18 22 22 22 24 M12 11 H20" fill="none" stroke="${core}" stroke-width="1.8" stroke-linecap="round"/>`,
        mine: `<polygon points="16,6 26,22 6,22" fill="${c}" stroke="${core}" stroke-width="1.4"/><path d="M12 22 L16 12 L20 22" fill="none" stroke="${core}" stroke-width="1.5"/><rect x="14.2" y="14" width="3.6" height="8" fill="${core}"/>`,
        magic: `<circle cx="16" cy="16" r="12" fill="none" stroke="${c}" stroke-width="2"/><circle cx="16" cy="16" r="7" fill="${c}" opacity="0.85"/><path d="M16 9 L17.5 14.5 L23 16 L17.5 17.5 L16 23 L14.5 17.5 L9 16 L14.5 14.5 Z" fill="${core}"/>`,
        camp: `<polygon points="16,7 26,24 6,24" fill="${c}" stroke="${core}" stroke-width="1.4"/><line x1="16" y1="11" x2="16" y2="24" stroke="${core}" stroke-width="1.6"/><path d="M10 24 L16 14 L22 24" fill="none" stroke="${edge}" stroke-width="1.2"/>`
      };
      return bodies[shapeId] || bodies.landmark;
    }

    function pinIconSvg(shapeId, factionId, tierId) {
      const shape = mapShapeById(shapeId);
      const faction = mapFactionById(factionId);
      const tier = mapTierById(tierId);
      const c = faction.color;
      const showRaceGlyph = MAP_RACE_FACTIONS.indexOf(faction.id) >= 0 && (shape.id === 'hq' || shape.id === 'temple');
      const showOrderGlyph = MAP_ORDER_FACTIONS.indexOf(faction.id) >= 0;
      let glyph = '';
      if (showOrderGlyph || showRaceGlyph) glyph = pinFactionGlyph(faction.id, c);
      const scale = tier.scale || 1;
      const tx = 16 - 16 * scale;
      return `<svg class="map-pin-icon" viewBox="0 0 32 32" aria-hidden="true"><g transform="translate(${tx} ${tx}) scale(${scale})">${pinShapeBody(shape.id, c)}${glyph}</g></svg>`;
    }

    function pinIconFromPin(pin) {
      return pinIconSvg(pin.shape, pin.faction, pin.tier);
    }

    function normalizePins(list) {
      return (Array.isArray(list) ? list : []).map((p, i) => {
        const migrated = (!p.shape || !p.faction) ? migratePinKind(p.kind) : null;
        const shape = p.shape || (migrated && migrated.shape) || 'landmark';
        const faction = p.faction || (migrated && migrated.faction) || 'neutral';
        const tier = p.tier || (migrated && migrated.tier) || 'marker';
        return {
          id: p.id || ('pin_' + i + '_' + (p.title || 'ort')),
          title: p.title || '',
          x: Number(p.x),
          y: Number(p.y),
          shape: mapShapeById(shape).id,
          faction: mapFactionById(faction).id,
          tier: mapTierById(tier).id,
          visibility: p.visibility === 'dm' ? 'dm' : 'player',
          sessionFocus: !!p.sessionFocus,
          linked: p.linked !== false
        };
      }).filter(p => p.title && Number.isFinite(p.x) && Number.isFinite(p.y));
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
      ensureMapFilters();
      return mapPins.filter(pin => {
        if (pin.visibility === 'dm' && !isDM) return false;
        if (isDM && !mapFilter.showDmSecrets && pin.visibility === 'dm') return false;
        if (mapFilter.sessionOnly && !pin.sessionFocus) return false;
        if (mapFilter.factions[pin.faction] === false) return false;
        if (mapFilter.shapes[pin.shape] === false) return false;
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
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-pin map-pin-tier-' + (pin.tier || 'marker');
        if (pin.sessionFocus) btn.classList.add('is-session-focus');
        if (pin.visibility === 'dm') btn.classList.add('is-dm-secret');
        btn.style.left = pin.x + '%';
        btn.style.top = pin.y + '%';
        btn.title = pin.title + ' · ' + pinDescribe(pin);
        btn.dataset.pinId = pin.id;
        btn.innerHTML = pinIconFromPin(pin);
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
      ensureMapFilters();
      const showSavedBorders = mapFilter.showBorders;
      if (showSavedBorders) mapBorders.forEach(border => {
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
      document.getElementById('pinOverlayHint').textContent = 'Typ, Zugehörigkeit und Größe wählen, dann einen Namen vergeben.';
    }

    function readPinMetaFromUi() {
      const vis = document.getElementById('pinVisibility');
      const focus = document.getElementById('pinSessionFocus');
      return {
        visibility: vis && vis.value === 'dm' ? 'dm' : 'player',
        sessionFocus: !!(focus && focus.checked)
      };
    }

    function openPinPicker() {
      editingPinId = null;
      selectedPinShape = 'landmark';
      selectedPinFaction = 'neutral';
      selectedPinTier = 'marker';
      selectedPinVisibility = 'player';
      selectedPinSessionFocus = false;
      document.getElementById('pinOverlayTitle').textContent = 'Ort setzen';
      document.getElementById('pinOverlayHint').textContent = 'Typ, Zugehörigkeit und Größe wählen, dann einen Namen vergeben.';
      document.getElementById('pinSaveEdit').classList.add('hidden');
      document.getElementById('pinLabel').value = '';
      const vis = document.getElementById('pinVisibility');
      const focus = document.getElementById('pinSessionFocus');
      if (vis) vis.value = 'player';
      if (focus) focus.checked = false;
      renderPinBuilder();
      document.getElementById('pinOverlay').classList.remove('hidden');
      document.getElementById('pinLabel').focus();
    }

    function openPinEditor(id) {
      const pin = mapPins.find(p => p.id === id);
      if (!pin || !isDM) return;
      editingPinId = id;
      selectedPinShape = pin.shape || 'landmark';
      selectedPinFaction = pin.faction || 'neutral';
      selectedPinTier = pin.tier || 'marker';
      selectedPinVisibility = pin.visibility === 'dm' ? 'dm' : 'player';
      selectedPinSessionFocus = !!pin.sessionFocus;
      document.getElementById('pinOverlayTitle').textContent = 'Ort bearbeiten';
      document.getElementById('pinOverlayHint').textContent = 'Symbol und Name ändern.';
      document.getElementById('pinSaveEdit').classList.remove('hidden');
      document.getElementById('pinLabel').value = pin.title || '';
      const vis = document.getElementById('pinVisibility');
      const focus = document.getElementById('pinSessionFocus');
      if (vis) vis.value = selectedPinVisibility;
      if (focus) focus.checked = selectedPinSessionFocus;
      renderPinBuilder();
      document.getElementById('pinOverlay').classList.remove('hidden');
      document.getElementById('pinLabel').focus();
    }

    async function savePinEdits(title, linked) {
      if (!isDM || !editingPinId) return;
      const pin = mapPins.find(p => p.id === editingPinId);
      if (!pin) return;
      const previous = mapPins.map(p => Object.assign({}, p));
      const meta = readPinMetaFromUi();
      pin.shape = selectedPinShape || pin.shape;
      pin.faction = selectedPinFaction || pin.faction;
      pin.tier = selectedPinTier || pin.tier;
      pin.visibility = meta.visibility;
      pin.sessionFocus = meta.sessionFocus;
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

    function updatePinPreview() {
      const preview = document.getElementById('pinPreview');
      const label = document.getElementById('pinPreviewLabel');
      if (preview) {
        preview.innerHTML = pinIconSvg(selectedPinShape, selectedPinFaction, selectedPinTier);
      }
      if (label) {
        label.textContent = pinDescribe({
          shape: selectedPinShape,
          faction: selectedPinFaction,
          tier: selectedPinTier
        });
      }
    }

    function renderPinBuilder() {
      const shapeGrid = document.getElementById('pinShapeGrid');
      const factionGrid = document.getElementById('pinFactionGrid');
      const tierGrid = document.getElementById('pinTierGrid');
      if (!shapeGrid || !factionGrid || !tierGrid) return;
      shapeGrid.innerHTML = '';
      MAP_SHAPES.forEach(shape => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pin-kind' + (selectedPinShape === shape.id ? ' active' : '');
        btn.innerHTML = pinIconSvg(shape.id, selectedPinFaction, selectedPinTier) + '<span>' + shape.label + '</span>';
        btn.onclick = () => {
          selectedPinShape = shape.id;
          renderPinBuilder();
        };
        shapeGrid.appendChild(btn);
      });
      factionGrid.innerHTML = '';
      MAP_FACTIONS.forEach(faction => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pin-kind' + (selectedPinFaction === faction.id ? ' active' : '');
        btn.innerHTML = pinIconSvg(selectedPinShape, faction.id, selectedPinTier) + '<span>' + faction.label + '</span>';
        btn.onclick = () => {
          selectedPinFaction = faction.id;
          renderPinBuilder();
        };
        factionGrid.appendChild(btn);
      });
      tierGrid.innerHTML = '';
      MAP_TIERS.forEach(tier => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pin-kind' + (selectedPinTier === tier.id ? ' active' : '');
        btn.innerHTML = pinIconSvg(selectedPinShape, selectedPinFaction, tier.id) + '<span>' + tier.label + '</span>';
        btn.onclick = () => {
          selectedPinTier = tier.id;
          renderPinBuilder();
        };
        tierGrid.appendChild(btn);
      });
      updatePinPreview();
    }

    function renderMapLegend() {
      ensureMapFilters();
      const box = document.getElementById('mapLegend');
      if (!box) return;
      box.innerHTML = '';
      const title = document.createElement('h3');
      title.textContent = 'Zeichenerklärung & Filter';
      box.appendChild(title);

      function addSection(label, items, key, getIcon) {
        const head = document.createElement('div');
        head.className = 'map-legend-section';
        head.textContent = label;
        box.appendChild(head);
        items.forEach(item => {
          const on = mapFilter[key][item.id] !== false;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'map-legend-item' + (on ? ' is-on' : ' is-off');
          btn.innerHTML = getIcon(item) + '<span>' + item.label + '</span>';
          btn.title = on ? 'Ausblenden' : 'Einblenden';
          btn.onclick = () => {
            mapFilter[key][item.id] = !on;
            renderMapLegend();
            renderMapPins();
          };
          box.appendChild(btn);
        });
      }

      addSection('Völker', MAP_FACTIONS.filter(f => f.group === 'Völker'), 'factions', f => pinIconSvg('settlement', f.id, 'minor'));
      addSection('Orden', MAP_FACTIONS.filter(f => f.group === 'Orden'), 'factions', f => pinIconSvg('hq', f.id, 'major'));
      addSection('Typen', MAP_SHAPES, 'shapes', s => pinIconSvg(s.id, 'neutral', 'minor'));

      const layers = document.createElement('div');
      layers.className = 'map-legend-section';
      layers.textContent = 'Ebenen';
      box.appendChild(layers);

      function addLayerToggle(id, label, get, set) {
        const on = get();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-legend-item map-legend-layer' + (on ? ' is-on' : ' is-off');
        btn.innerHTML = '<span class="map-legend-check">' + (on ? '☑' : '☐') + '</span><span>' + label + '</span>';
        btn.onclick = () => {
          set(!on);
          renderMapLegend();
          renderMapPins();
        };
        box.appendChild(btn);
      }

      addLayerToggle('borders', 'Grenzen', () => mapFilter.showBorders, v => { mapFilter.showBorders = v; });
      addLayerToggle('session', 'Nur Sitzung', () => mapFilter.sessionOnly, v => { mapFilter.sessionOnly = v; });
      if (isDM) {
        addLayerToggle('dmSecrets', 'DM-Geheimnisse', () => mapFilter.showDmSecrets, v => { mapFilter.showDmSecrets = v; });
      }
    }

    function applyPinChoice(title, linked) {
      if (editingPinId) return savePinEdits(title, linked);
      return addMapPin(title, linked);
    }

    async function addMapPin(title, linked) {
      if (!isDM || !pendingPin || !title) return;
      const previous = mapPins.slice();
      const meta = readPinMetaFromUi();
      const autoLink = linked || indexByTitle(title) !== null;
      mapPins.push({
        id: 'pin_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: title,
        x: pendingPin.x,
        y: pendingPin.y,
        shape: selectedPinShape || 'landmark',
        faction: selectedPinFaction || 'neutral',
        tier: selectedPinTier || 'marker',
        visibility: meta.visibility,
        sessionFocus: meta.sessionFocus,
        linked: !!autoLink
      });
      closePinPicker();
      renderMapPins();
      try {
        await persistPins();
        toast(autoLink ? 'Ort gesetzt: ' + title : 'Markierung gesetzt: ' + title);
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
