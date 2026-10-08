/* Thalarion – Dungeon Vision / LoS (BG3-Stil) */

    function parseDungeonVision(sensesText, override) {
      if (override && typeof override === 'object' && (Number(override.rangeFeet) > 0 || override.type === 'darkvision' || override.type === 'superior_darkvision')) {
        const feet = Math.max(0, Number(override.rangeFeet) || 0);
        const type = override.type === 'superior_darkvision' || feet >= 100
          ? 'superior_darkvision'
          : (feet > 0 || override.type === 'darkvision' ? 'darkvision' : 'none');
        return {
          type: type,
          rangeFeet: feet,
          angleDeg: 90
        };
      }
      const s = String(sensesText || '');
      if (!s.trim()) {
        return { type: 'none', rangeFeet: 0, angleDeg: 90 };
      }
      const superior = /superior\s*(dark\s*vision|dunkelsicht)|verbesserte\s*dunkelsicht/i.test(s);
      const label = '(?:dark\\s*vision|dunkelsicht|nachtsicht|infravision)';
      // "Darkvision 60 ft." / "Dunkelsicht 18 m" / "60 ft. Darkvision"
      let m = s.match(new RegExp(label + '[^\\d]{0,12}(\\d+(?:[.,]\\d+)?)', 'i'));
      if (!m) m = s.match(new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(?:ft\\.?|feet|fu(?:ß|ss)|m|meter)?[^\\n]{0,12}' + label, 'i'));
      if (!m) {
        return { type: 'none', rangeFeet: 0, angleDeg: 90 };
      }
      let n = Number(String(m[1]).replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) {
        return { type: 'none', rangeFeet: 0, angleDeg: 90 };
      }
      const around = s.slice(Math.max(0, (m.index || 0) - 8), (m.index || 0) + m[0].length + 12);
      const asMeters = /\bm(?:eter)?s?\b/i.test(around) && !/\bft\.?|\bfeet\b|fu(?:ß|ss)/i.test(around);
      let feet = asMeters ? Math.round(n * 3.28084) : n;
      if (!asMeters && n <= 30 && !/\bft\.?|\bfeet\b|fu(?:ß|ss)/i.test(around)) {
        // BG3-Angaben in Metern (12 / 24), wenn keine Einheit
        feet = Math.round(n * 3.28084);
      }
      if (superior || feet >= 100) {
        return { type: 'superior_darkvision', rangeFeet: feet, angleDeg: 90 };
      }
      return { type: 'darkvision', rangeFeet: feet, angleDeg: 90 };
    }

    function dungeonScaleFt() {
      const v = Number(dungeon && dungeon.scaleFt);
      return Number.isFinite(v) && v > 0 ? v : DUNGEON_DEFAULT_SCALE_FT;
    }

    function dungeonFeetToPct(feet) {
      return Math.max(0, Number(feet) || 0) / dungeonScaleFt();
    }

    function dungeonStageSize() {
      const stage = document.getElementById('dungeonStage');
      const w = stage && stage.clientWidth;
      const h = stage && stage.clientHeight;
      if (!(w > 0) || !(h > 0)) return { w: 1, h: 1 };
      return { w: w, h: h };
    }

    // Echter Bildschirmwinkel (Pixel), damit der Kegel starr 90° bleibt
    function dungeonFacingFromDelta(dxPct, dyPct) {
      const size = dungeonStageSize();
      return Math.atan2(dyPct * size.h, dxPct * size.w);
    }

    function dungeonClampPct(n) {
      return Math.max(0, Math.min(100, Number(n) || 0));
    }

    function dungeonSegNorm(raw, prefix) {
      const r = raw && typeof raw === 'object' ? raw : {};
      return {
        id: r.id || dungeonNewId(prefix || 'seg'),
        x1: dungeonClampPct(r.x1),
        y1: dungeonClampPct(r.y1),
        x2: dungeonClampPct(r.x2),
        y2: dungeonClampPct(r.y2),
        updatedAt: stamp(r.updatedAt)
      };
    }

    function dungeonDoorNorm(raw) {
      const base = dungeonSegNorm(raw, 'door');
      base.open = !!raw.open;
      const kind = String((raw && raw.kind) || 'normal');
      base.kind = DUNGEON_DOOR_KINDS[kind] ? kind : 'normal';
      return base;
    }

    function dungeonLightKindInfo(kind) {
      const k = String(kind || 'torch');
      return (DUNGEON_LIGHT_KINDS && DUNGEON_LIGHT_KINDS[k]) || DUNGEON_LIGHT_KINDS.torch;
    }

    function dungeonLightNorm(raw) {
      const r = raw && typeof raw === 'object' ? raw : {};
      const kind = DUNGEON_LIGHT_KINDS[r.kind] ? String(r.kind) : 'torch';
      const info = dungeonLightKindInfo(kind);
      const range = Math.max(1, Number(r.range) || info.range || DUNGEON_TORCH_FEET);
      return {
        id: r.id || dungeonNewId('light'),
        x: dungeonClampPct(r.x),
        y: dungeonClampPct(r.y),
        range: range,
        kind: kind,
        enabled: r.enabled !== false,
        updatedAt: stamp(r.updatedAt)
      };
    }

    function dungeonTokenLightNorm(raw) {
      const r = raw && typeof raw === 'object' ? raw : {};
      const kind = DUNGEON_LIGHT_KINDS[r.kind] ? String(r.kind) : 'torch';
      const info = dungeonLightKindInfo(kind);
      return {
        enabled: !!r.enabled,
        range: Math.max(1, Number(r.range) || info.range || DUNGEON_TORCH_FEET),
        kind: kind
      };
    }

    function dungeonNoteNorm(raw) {
      const r = raw && typeof raw === 'object' ? raw : {};
      return {
        id: r.id || dungeonNewId('note'),
        x: dungeonClampPct(r.x),
        y: dungeonClampPct(r.y),
        title: String(r.title || '').trim() || 'Notiz',
        text: String(r.text || ''),
        updatedAt: stamp(r.updatedAt)
      };
    }

    function dungeonZoneNorm(raw) {
      const r = raw && typeof raw === 'object' ? raw : {};
      return {
        id: r.id || dungeonNewId('zone'),
        x: dungeonClampPct(r.x != null ? r.x : 50),
        y: dungeonClampPct(r.y != null ? r.y : 50),
        r: Math.max(2, Math.min(40, Number(r.r) || 12)),
        name: String(r.name || '').trim() || 'Zone',
        trackId: String(r.trackId || ''),
        updatedAt: stamp(r.updatedAt)
      };
    }

    function dungeonRaySegHit(ox, oy, dx, dy, maxT, x1, y1, x2, y2) {
      const sx = x2 - x1;
      const sy = y2 - y1;
      const det = dx * sy - dy * sx;
      if (Math.abs(det) < 1e-9) return null;
      const qx = x1 - ox;
      const qy = y1 - oy;
      const t = (qx * sy - qy * sx) / det;
      const u = (qx * dy - qy * dx) / det;
      if (t > 1e-4 && t <= maxT && u >= -0.001 && u <= 1.001) return t;
      return null;
    }

    function dungeonObstacleSegments() {
      const segs = [];
      (dungeon.walls || []).forEach(w => {
        segs.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 });
      });
      (dungeon.doors || []).forEach(d => {
        if (d.open) return;
        segs.push({ x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2 });
      });
      return segs;
    }

    function dungeonObstaclesToPx(obstacles, size) {
      return (obstacles || []).map(o => ({
        x1: o.x1 / 100 * size.w,
        y1: o.y1 / 100 * size.h,
        x2: o.x2 / 100 * size.w,
        y2: o.y2 / 100 * size.h
      }));
    }

    // Raycast in Pixelraum → Polygon zurück in % (Winkel sind echte Bildschirmwinkel)
    function dungeonCastPolygonPx(oxPx, oyPx, rangePx, a0, a1, rayCount, segsPx) {
      const pts = [];
      const n = Math.max(8, rayCount | 0);
      const span = a1 - a0;
      for (let i = 0; i <= n; i++) {
        const a = a0 + span * (i / n);
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        let best = rangePx;
        for (let s = 0; s < segsPx.length; s++) {
          const o = segsPx[s];
          const t = dungeonRaySegHit(oxPx, oyPx, dx, dy, best, o.x1, o.y1, o.x2, o.y2);
          if (t != null && t < best) best = t;
        }
        pts.push({ x: oxPx + dx * best, y: oyPx + dy * best });
      }
      return pts;
    }

    function dungeonLightPolygon(x, y, rangeFeet, obstacles) {
      const rPct = dungeonFeetToPct(rangeFeet);
      if (rPct <= 0) return [];
      const size = dungeonStageSize();
      const ox = x / 100 * size.w;
      const oy = y / 100 * size.h;
      const rangePx = rPct / 100 * size.w;
      const rays = Math.max(24, Math.min(72, Math.round(28 + rPct)));
      const segsPx = dungeonObstaclesToPx(obstacles, size);
      return dungeonCastPolygonPx(ox, oy, rangePx, 0, Math.PI * 2, rays, segsPx).map(p => ({
        x: p.x / size.w * 100,
        y: p.y / size.h * 100
      }));
    }

    function dungeonVisionPolygon(x, y, facing, rangeFeet, angleDeg, obstacles) {
      const rPct = dungeonFeetToPct(rangeFeet);
      if (rPct <= 0) return [];
      const size = dungeonStageSize();
      const ox = x / 100 * size.w;
      const oy = y / 100 * size.h;
      const rangePx = rPct / 100 * size.w;
      // Starrer Sichtkegel: immer exakt 90° Bildschirmwinkel
      const coneDeg = 90;
      const half = (coneDeg * Math.PI / 180) / 2;
      const rays = Math.max(24, Math.min(72, Math.round(24 + rPct)));
      const segsPx = dungeonObstaclesToPx(obstacles, size);
      const rim = dungeonCastPolygonPx(ox, oy, rangePx, facing - half, facing + half, rays, segsPx).map(p => ({
        x: p.x / size.w * 100,
        y: p.y / size.h * 100
      }));
      return [{ x: x, y: y }].concat(rim);
    }

    function dungeonFillPolyPct(ctx, poly, w, h) {
      if (!poly || poly.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(poly[0].x / 100 * w, poly[0].y / 100 * h);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x / 100 * w, poly[i].y / 100 * h);
      }
      ctx.closePath();
      ctx.fill();
    }

    function dungeonPointInPoly(x, y, poly) {
      if (!poly || poly.length < 3) return false;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x;
        const yi = poly[i].y;
        const xj = poly[j].x;
        const yj = poly[j].y;
        const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    function dungeonPointVisibleNow(x, y) {
      const polys = dungeonVisiblePolys || [];
      for (let i = 0; i < polys.length; i++) {
        if (dungeonPointInPoly(x, y, polys[i])) return true;
      }
      return false;
    }
