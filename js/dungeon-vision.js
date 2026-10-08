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
          angleDeg: Math.max(20, Math.min(360, Number(override.angleDeg) || DUNGEON_VISION_ANGLE))
        };
      }
      const s = String(sensesText || '');
      if (!s.trim()) {
        return { type: 'none', rangeFeet: 0, angleDeg: DUNGEON_VISION_ANGLE };
      }
      const superior = /superior\s*(dark\s*vision|dunkelsicht)|verbesserte\s*dunkelsicht/i.test(s);
      const label = '(?:dark\\s*vision|dunkelsicht|nachtsicht|infravision)';
      // "Darkvision 60 ft." / "Dunkelsicht 18 m" / "60 ft. Darkvision"
      let m = s.match(new RegExp(label + '[^\\d]{0,12}(\\d+(?:[.,]\\d+)?)', 'i'));
      if (!m) m = s.match(new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(?:ft\\.?|feet|fu(?:ß|ss)|m|meter)?[^\\n]{0,12}' + label, 'i'));
      if (!m) {
        return { type: 'none', rangeFeet: 0, angleDeg: DUNGEON_VISION_ANGLE };
      }
      let n = Number(String(m[1]).replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) {
        return { type: 'none', rangeFeet: 0, angleDeg: DUNGEON_VISION_ANGLE };
      }
      const around = s.slice(Math.max(0, (m.index || 0) - 8), (m.index || 0) + m[0].length + 12);
      const asMeters = /\bm(?:eter)?s?\b/i.test(around) && !/\bft\.?|\bfeet\b|fu(?:ß|ss)/i.test(around);
      let feet = asMeters ? Math.round(n * 3.28084) : n;
      if (!asMeters && n <= 30 && !/\bft\.?|\bfeet\b|fu(?:ß|ss)/i.test(around)) {
        // BG3-Angaben in Metern (12 / 24), wenn keine Einheit
        feet = Math.round(n * 3.28084);
      }
      if (superior || feet >= 100) {
        return { type: 'superior_darkvision', rangeFeet: feet, angleDeg: DUNGEON_VISION_ANGLE };
      }
      return { type: 'darkvision', rangeFeet: feet, angleDeg: DUNGEON_VISION_ANGLE };
    }

    function dungeonScaleFt() {
      const v = Number(dungeon && dungeon.scaleFt);
      return Number.isFinite(v) && v > 0 ? v : DUNGEON_DEFAULT_SCALE_FT;
    }

    function dungeonFeetToPct(feet) {
      return Math.max(0, Number(feet) || 0) / dungeonScaleFt();
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

    function dungeonCastPolygon(ox, oy, rangePct, a0, a1, rayCount, obstacles) {
      const pts = [];
      const n = Math.max(8, rayCount | 0);
      const span = a1 - a0;
      for (let i = 0; i <= n; i++) {
        const a = a0 + span * (i / n);
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        let best = rangePct;
        for (let s = 0; s < obstacles.length; s++) {
          const o = obstacles[s];
          const t = dungeonRaySegHit(ox, oy, dx, dy, best, o.x1, o.y1, o.x2, o.y2);
          if (t != null && t < best) best = t;
        }
        pts.push({ x: ox + dx * best, y: oy + dy * best });
      }
      return pts;
    }

    function dungeonLightPolygon(x, y, rangeFeet, obstacles) {
      const r = dungeonFeetToPct(rangeFeet);
      if (r <= 0) return [];
      const rays = Math.max(24, Math.min(72, Math.round(28 + r)));
      return dungeonCastPolygon(x, y, r, 0, Math.PI * 2, rays, obstacles);
    }

    function dungeonVisionPolygon(x, y, facing, rangeFeet, angleDeg, obstacles) {
      const r = dungeonFeetToPct(rangeFeet);
      if (r <= 0) return [];
      const half = ((angleDeg || DUNGEON_VISION_ANGLE) * Math.PI / 180) / 2;
      const a0 = facing - half;
      const a1 = facing + half;
      const rays = Math.max(16, Math.min(64, Math.round(20 + r * 0.8)));
      const rim = dungeonCastPolygon(x, y, r, a0, a1, rays, obstacles);
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
