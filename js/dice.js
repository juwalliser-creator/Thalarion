/* Thalarion – Würfel (Tray, Log, 3D-Animation) – Phase 1.3 */
var writingDiceLog = false;

    function dieShapeForSides(sides) {
      const n = Number(sides) || 20;
      if (n === 100) return 'd100';
      if (n <= 4) return 'd4';
      if (n <= 6) return 'd6';
      if (n <= 8) return 'd8';
      if (n <= 10) return 'd10';
      if (n <= 12) return 'd12';
      return 'd20';
    }

    function dieVec(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function dieAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function dieDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function dieCross(a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function dieLen(a) { return Math.hypot(a[0], a[1], a[2]) || 1; }
    function dieNorm(a) {
      const l = dieLen(a);
      return [a[0] / l, a[1] / l, a[2] / l];
    }
    function dieDist(a, b) { return dieLen(dieVec(a, b)); }
    function dieScaleVerts(verts, radius) {
      let m = 0;
      verts.forEach(v => { m = Math.max(m, dieLen(v)); });
      const s = radius / (m || 1);
      return verts.map(v => [v[0] * s, v[1] * s, v[2] * s]);
    }

    function dieNbrs(verts, edge) {
      const n = verts.length;
      const nbrs = verts.map(() => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(dieDist(verts[i], verts[j]) - edge) < edge * 0.12) {
            nbrs[i].push(j);
            nbrs[j].push(i);
          }
        }
      }
      return nbrs;
    }

    function dieMinEdge(verts) {
      let edge = Infinity;
      for (let i = 0; i < verts.length; i++) {
        for (let j = i + 1; j < verts.length; j++) {
          const d = dieDist(verts[i], verts[j]);
          if (d > 0.001 && d < edge) edge = d;
        }
      }
      return edge;
    }

    function dieTriFaces(verts) {
      const edge = dieMinEdge(verts);
      const nbrs = dieNbrs(verts, edge);
      const faces = [];
      const seen = {};
      verts.forEach((_, i) => {
        const nb = nbrs[i];
        for (let a = 0; a < nb.length; a++) {
          for (let b = a + 1; b < nb.length; b++) {
            const j = nb[a];
            const k = nb[b];
            if (nbrs[j].indexOf(k) < 0) continue;
            const key = [i, j, k].sort((x, y) => x - y).join(',');
            if (seen[key]) continue;
            seen[key] = 1;
            faces.push([i, j, k]);
          }
        }
      });
      return faces;
    }

    function diePentFaces(verts) {
      const edge = dieMinEdge(verts);
      const nbrs = dieNbrs(verts, edge);
      const faces = [];
      const seen = {};
      verts.forEach((_, start) => {
        nbrs[start].forEach(second => {
          const poly = [start, second];
          let prev = start;
          let cur = second;
          for (let step = 0; step < 3; step++) {
            const vPrev = verts[prev];
            const vCur = verts[cur];
            let best = -1;
            let bestScore = -Infinity;
            nbrs[cur].forEach(c => {
              if (c === prev) return;
              const cr = dieCross(dieVec(vCur, vPrev), dieVec(verts[c], vCur));
              const score = dieDot(cr, vCur);
              if (score > bestScore) {
                bestScore = score;
                best = c;
              }
            });
            if (best < 0) return;
            poly.push(best);
            prev = cur;
            cur = best;
          }
          if (poly.length !== 5) return;
          const key = poly.slice().sort((a, b) => a - b).join(',');
          if (seen[key]) return;
          seen[key] = 1;
          faces.push(poly);
        });
      });
      return faces;
    }

    function dieOrientFace(nx, ny, nz, radius, twist, scale) {
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const ax = -ny;
      const ay = nx;
      const alen = Math.hypot(ax, ay);
      const angle = Math.acos(Math.max(-1, Math.min(1, nz))) * 180 / Math.PI;
      const twistPart = 'rotateZ(' + (twist || 0).toFixed(3) + 'deg)';
      const sc = scale && scale !== 1 ? 'scale(' + scale + ')' : '';
      const z = 'translateZ(' + radius.toFixed(4) + 'rem)';
      const tail = [twistPart, sc, z].filter(Boolean).join(' ');
      if (alen < 1e-6) {
        if (nz >= 0) return tail;
        return 'rotateY(180deg) ' + tail;
      }
      return 'rotate3d(' + (ax / alen).toFixed(5) + ',' + (ay / alen).toFixed(5) + ',0,' + angle.toFixed(3) + 'deg) ' + tail;
    }

    function dieTwistToApex(n, apex) {
      const target = dieNorm([
        apex[0] - n[0] * dieDot(apex, n),
        apex[1] - n[1] * dieDot(apex, n),
        apex[2] - n[2] * dieDot(apex, n)
      ]);
      const ax = -n[1];
      const ay = n[0];
      const alen = Math.hypot(ax, ay);
      const c = n[2];
      const s = Math.sqrt(Math.max(0, 1 - c * c));
      let cur;
      if (alen < 1e-6) {
        cur = n[2] >= 0 ? [0, -1, 0] : [0, -1, 0];
      } else {
        const ux = ax / alen;
        const uy = ay / alen;
        const vx = 0;
        const vy = -1;
        const vz = 0;
        const dt = ux * vx + uy * vy;
        cur = [
          vx * c + (uy * vz) * s + ux * dt * (1 - c),
          vy * c + (-ux * vz) * s + uy * dt * (1 - c),
          vz * c + (ux * vy - uy * vx) * s
        ];
      }
      const cr = dieCross(cur, target);
      return Math.atan2(dieDot(cr, n), dieDot(cur, target)) * 180 / Math.PI;
    }

    function dieSolidSpec(shape) {
      const p = (1 + Math.sqrt(5)) / 2;
      if (shape === 'd6') {
        return {
          verts: [
            [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
            [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]
          ],
          faces: [
            [0, 2, 3, 1],
            [0, 1, 5, 4],
            [0, 4, 6, 2],
            [4, 5, 7, 6],
            [2, 6, 7, 3],
            [1, 3, 7, 5]
          ],
          kind: 'quad',
          radius: 2.15
        };
      }
      if (shape === 'd4') {
        return {
          verts: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
          faces: [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]],
          kind: 'tri',
          radius: 2.15
        };
      }
      if (shape === 'd8') {
        return {
          verts: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
          faces: null,
          kind: 'tri',
          radius: 2.2
        };
      }
      if (shape === 'd20') {
        return {
          verts: [
            [0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p],
            [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0],
            [p, 0, 1], [p, 0, -1], [-p, 0, 1], [-p, 0, -1]
          ],
          faces: null,
          kind: 'tri',
          radius: 2.45
        };
      }
      if (shape === 'd12') {
        const ip = 1 / p;
        const verts = [];
        [-1, 1].forEach(x => [-1, 1].forEach(y => [-1, 1].forEach(z => verts.push([x, y, z]))));
        [[0, ip, p], [0, ip, -p], [0, -ip, p], [0, -ip, -p],
         [ip, p, 0], [ip, -p, 0], [-ip, p, 0], [-ip, -p, 0],
         [p, 0, ip], [p, 0, -ip], [-p, 0, ip], [-p, 0, -ip]].forEach(v => verts.push(v));
        return { verts: verts, faces: null, kind: 'pent', radius: 2.4 };
      }
      const n = 5;
      const ringR = 1;
      const h = ringR * 0.68;
      const top = [];
      const bot = [];
      for (let i = 0; i < n; i++) {
        const a = i * 2 * Math.PI / n;
        const b = a + Math.PI / n;
        top.push([Math.cos(a) * ringR, h, Math.sin(a) * ringR]);
        bot.push([Math.cos(b) * ringR, -h, Math.sin(b) * ringR]);
      }
      const dualOf = pts => {
        const c = pts.reduce((acc, p) => dieAdd(acc, p), [0, 0, 0]).map(x => x / pts.length);
        let nrm = dieNorm(dieCross(dieVec(pts[1], pts[0]), dieVec(pts[2], pts[0])));
        if (dieDot(nrm, c) < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]];
        const k = dieDot(nrm, pts[0]);
        return [nrm[0] / k, nrm[1] / k, nrm[2] / k];
      };
      const triA = [];
      const triB = [];
      for (let i = 0; i < n; i++) {
        const i1 = (i + 1) % n;
        triA.push(dualOf([top[i], top[i1], bot[i]]));
        triB.push(dualOf([bot[i], bot[i1], top[i1]]));
      }
      const verts = [dualOf(top), dualOf(bot)].concat(triA, triB);
      const faces = [];
      for (let i = 0; i < n; i++) {
        const im = (i + n - 1) % n;
        faces.push([0, 2 + i, 7 + im, 2 + im]);
        faces.push([1, 7 + i, 2 + i, 7 + im]);
      }
      return { verts: verts, faces: faces, kind: 'kite', radius: 2.52 };
    }

    function dieClipForKind(kind) {
      if (kind === 'tri') return 'polygon(50% 0, 0 100%, 100% 100%)';
      if (kind === 'pent') return 'polygon(50% 0, 100% 36.2%, 81.6% 100%, 18.4% 100%, 0 36.2%)';
      return 'polygon(50% 0, 100% 38%, 50% 100%, 0 38%)';
    }

    function dieFaceBox(kind, side, pts) {
      if (kind === 'tri') {
        const h = side * 0.8660254;
        return { w: side, h: h, ox: '50% 66.666%', ml: side / -2, mt: h * -0.666, clip: dieClipForKind(kind) };
      }
      if (kind === 'pent') {
        const r = side / (2 * Math.sin(Math.PI / 5));
        const w = 2 * r * Math.sin(Math.PI * 72 / 180);
        const h = r * (1 + Math.cos(Math.PI * 36 / 180));
        return { w: w, h: h, ox: '50% 55.28%', ml: w / -2, mt: h * -0.5528, clip: dieClipForKind(kind) };
      }
      const w = dieDist(pts[1], pts[3]);
      const h = dieDist(pts[0], pts[2]);
      return { w: w, h: h, ox: '50% 42%', ml: w / -2, mt: h * -0.42, clip: dieClipForKind(kind) };
    }

    function dieFacePointsCss(pts, n, c, twistDeg) {
      const rad = -(twistDeg || 0) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return pts.map(p => {
        const r = dieRotToZ([p[0] - c[0], p[1] - c[1], p[2] - c[2]], n);
        const x0 = r[0];
        const y0 = r[1];
        return [x0 * cos - y0 * sin, x0 * sin + y0 * cos];
      });
    }

    function diePlateFromPoints(pts2d) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      pts2d.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] > maxY) maxY = p[1];
      });
      const pad = 0.03;
      minX -= pad;
      minY -= pad;
      maxX += pad;
      maxY += pad;
      const w = Math.max(0.2, maxX - minX);
      const h = Math.max(0.2, maxY - minY);
      const clip = 'polygon(' + pts2d.map(p => {
        const x = ((p[0] - minX) / w) * 100;
        const y = ((p[1] - minY) / h) * 100;
        return x.toFixed(2) + '% ' + y.toFixed(2) + '%';
      }).join(',') + ')';
      return {
        w: w,
        h: h,
        ox: ((-minX / w) * 100).toFixed(2) + '% ' + ((-minY / h) * 100).toFixed(2) + '%',
        ml: minX,
        mt: minY,
        clip: clip
      };
    }

    function dieRotToZ(v, n) {
      const ax = n[1];
      const ay = -n[0];
      const alen = Math.hypot(ax, ay);
      const c = n[2];
      const s = Math.sqrt(Math.max(0, 1 - c * c));
      if (alen < 1e-6) {
        if (n[2] >= 0) return v;
        return [v[0], -v[1], -v[2]];
      }
      const ux = ax / alen;
      const uy = ay / alen;
      const dt = ux * v[0] + uy * v[1];
      return [
        v[0] * c + (uy * v[2]) * s + ux * dt * (1 - c),
        v[1] * c + (-ux * v[2]) * s + uy * dt * (1 - c),
        v[2] * c + (ux * v[1] - uy * v[0]) * s
      ];
    }

    function diePolyParts(shape, value) {
      const spec = dieSolidSpec(shape);
      let verts = dieScaleVerts(spec.verts, spec.radius);
      let idx = spec.faces;
      if (!idx) idx = spec.kind === 'pent' ? diePentFaces(verts) : dieTriFaces(verts);
      const normals = idx.map(face => {
        const pts = face.map(i => verts[i]);
        const c = pts.reduce((acc, p) => dieAdd(acc, p), [0, 0, 0]).map(x => x / pts.length);
        let n = dieNorm(dieCross(dieVec(pts[1], pts[0]), dieVec(pts[2], pts[0])));
        if (dieDot(n, c) < 0) n = [-n[0], -n[1], -n[2]];
        return n;
      });
      let topAt = 0;
      normals.forEach((n, i) => { if (n[2] > normals[topAt][2]) topAt = i; });
      verts = verts.map(v => dieRotToZ(v, normals[topAt]));
      const plates = [];
      idx.forEach(face => {
        const pts = face.map(i => verts[i]);
        const c = pts.reduce((acc, p) => dieAdd(acc, p), [0, 0, 0]).map(x => x / pts.length);
        let n = dieNorm(dieCross(dieVec(pts[1], pts[0]), dieVec(pts[2], pts[0])));
        if (dieDot(n, c) < 0) n = [-n[0], -n[1], -n[2]];
        const R = Math.abs(dieDot(c, n));
        const up = spec.kind === 'quad'
          ? [
              (pts[0][0] + pts[1][0]) * 0.5 - c[0],
              (pts[0][1] + pts[1][1]) * 0.5 - c[1],
              (pts[0][2] + pts[1][2]) * 0.5 - c[2]
            ]
          : dieVec(pts[0], c);
        const twist = dieTwistToApex(n, up);
        const box = (spec.kind === 'kite' || spec.kind === 'quad')
          ? diePlateFromPoints(dieFacePointsCss(pts, n, c, twist))
          : dieFaceBox(spec.kind, dieDist(pts[0], pts[1]), pts);
        const inset = spec.kind === 'kite' ? 0.76 : 0.84;
        const tGold = dieOrientFace(n[0], n[1], n[2], R, twist, 1);
        const t = dieOrientFace(n[0], n[1], n[2], R + 0.018, twist, inset);
        const tCore = dieOrientFace(n[0], n[1], n[2], R * 0.7, twist, 0.9);
        const boxStyle = 'width:' + box.w.toFixed(3) + 'rem;height:' + box.h.toFixed(3) + 'rem;margin:' + box.mt.toFixed(3) + 'rem 0 0 ' + box.ml.toFixed(3) + 'rem;transform-origin:' + box.ox + ';clip-path:' + box.clip + ';';
        plates.push({
          t: t,
          tGold: tGold,
          tCore: tCore,
          nx: n[0],
          ny: n[1],
          nz: n[2],
          twist: twist,
          R: R,
          boxStyle: boxStyle
        });
      });
      topAt = 0;
      plates.forEach((p, i) => { if (p.nz > plates[topAt].nz) topAt = i; });
      let labels;
      if (shape === 'd100') labels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      else {
        const n = plates.length;
        labels = [];
        for (let i = 1; i <= n; i++) labels.push(i);
      }
      const rest = labels.filter(x => x !== value).sort(() => Math.random() - 0.5);
      let html = '';
      plates.forEach((p, i) => {
        const num = i === topAt ? value : rest.shift();
        html += '<b class="dice-core-poly" style="' + p.boxStyle + 'transform:' + p.tCore + '"></b>';
        html += '<b class="dice-gold" style="' + p.boxStyle + 'transform:' + p.tGold + '"></b>';
        html += '<div class="dice-face" data-side="' + (i === topAt ? 'top' : 'side') + '" style="' + p.boxStyle + 'transform:' + p.t + '"><span>' + (num != null ? num : '') + '</span></div>';
      });
      return { html: html, twist: plates[topAt] ? plates[topAt].twist : 0 };
    }

    function canUseDiceTools() {
      return !!(isDM || currentPlayerId);
    }

    function diceAnimLabel(mode) {
      if (mode === 'off') return 'Aus';
      if (mode === 'combat') return 'Nicht im Kampf';
      return 'Immer an';
    }

    function loadDicePrefs() {
      try {
        const raw = localStorage.getItem(DICE_PREF_KEY);
        if (raw === 'off' || raw === 'combat' || raw === 'on') {
          diceAnimMode = raw;
          return;
        }
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && (data.anim === 'off' || data.anim === 'combat' || data.anim === 'on')) {
          diceAnimMode = data.anim;
        }
      } catch (err) {}
    }

    function saveDicePrefs() {
      try {
        localStorage.setItem(DICE_PREF_KEY, JSON.stringify({ anim: diceAnimMode }));
      } catch (err) {}
    }

    function diceAnimBlocked() {
      if (diceAnimMode === 'off') return true;
      if (diceAnimMode === 'combat' && combat && combat.started) return true;
      return false;
    }

    function diceRollsEnabled() {
      return diceAnimMode !== 'off';
    }

    function noticeDiceOff() {
      toast('Würfel sind aus — nutze deine eigenen Würfel.');
    }

    function setDiceAnimMode(mode) {
      diceAnimMode = mode === 'off' || mode === 'combat' ? mode : 'on';
      saveDicePrefs();
      applyDiceToolsUi();
      renderDiceTray();
      if (typeof syncKampfChrome === 'function') syncKampfChrome();
      if (diceAnimBlocked()) clearTableDice();
      toast('Würfel am Tisch: ' + diceAnimLabel(diceAnimMode));
    }

    function diceQueueTotal() {
      let n = 0;
      DICE_TRAY_SIDES.forEach(s => { n += diceQueue[s] || 0; });
      return n;
    }

    function diceQueueParts() {
      const parts = [];
      DICE_TRAY_SIDES.forEach(s => {
        const n = diceQueue[s] || 0;
        if (n) parts.push((n > 1 ? n : '') + 'W' + s);
      });
      return parts;
    }

    function formatDiceQueueLabel() {
      const parts = diceQueueParts();
      return parts.length ? parts.join(' + ') : 'Keine Würfel';
    }

    function resetDiceQueue() {
      DICE_TRAY_SIDES.forEach(s => { diceQueue[s] = 0; });
    }

    function renderDiceTray() {
      const kinds = document.querySelectorAll('#diceTrayKinds [data-sides]');
      kinds.forEach(btn => {
        const n = diceQueue[Number(btn.getAttribute('data-sides'))] || 0;
        btn.classList.toggle('is-on', n > 0);
        const badge = btn.querySelector('.dice-kind-count');
        if (badge) {
          badge.textContent = n ? String(n) : '0';
          badge.classList.toggle('hidden', !n);
        }
      });
      const sum = document.getElementById('diceTraySum');
      const total = diceQueueTotal();
      if (sum) sum.textContent = formatDiceQueueLabel();
      const rollBtn = document.getElementById('diceTrayRollBtn');
      const resetBtn = document.getElementById('diceTrayResetBtn');
      if (rollBtn) {
        rollBtn.disabled = !total || !diceRollsEnabled();
        rollBtn.title = diceRollsEnabled() ? '' : 'Würfel sind aus — nutze deine eigenen Würfel.';
      }
      if (resetBtn) resetBtn.disabled = !total;
    }

    function escapeDiceLogHtml(s) {
      return String(s || '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    }

    function renderDiceLog() {
      const list = document.getElementById('diceLogList');
      if (!list) return;
      if (!diceLog.length) {
        list.innerHTML = '<div class="dice-log-empty">Noch keine Würfe.</div>';
        return;
      }
      list.innerHTML = diceLog.map(row =>
        '<div class="dice-log-item">' +
        (row.who ? '<span class="dice-log-who">' + escapeDiceLogHtml(row.who) + '</span> · ' : '') +
        escapeDiceLogHtml(row.text) + '</div>'
      ).join('');
    }

    function currentActorLabel() {
      if (isDM) return 'DM';
      if (currentPlayerId && playerAccounts[currentPlayerId] && playerAccounts[currentPlayerId].name) {
        return playerAccounts[currentPlayerId].name;
      }
      return 'Spieler';
    }

    async function persistDiceLog() {
      if (!db) return;
      writingDiceLog = true;
      try {
        await diceLogRef().set({ entries: diceLog, updatedAt: Date.now() });
      } catch (err) {
        console.warn(err);
      } finally {
        writingDiceLog = false;
      }
    }

    function logDiceRoll(caption) {
      const text = String(caption || '').trim();
      if (!text) return;
      diceLog.unshift({ text: text, who: currentActorLabel(), t: Date.now() });
      if (diceLog.length > 24) diceLog.length = 24;
      renderDiceLog();
      persistDiceLog();
    }

    function listenDiceLog() {
      if (!db) return;
      diceLogRef().onSnapshot(snap => {
        if (!snap.exists || writingDiceLog) return;
        const data = snap.data();
        diceLog = Array.isArray(data && data.entries) ? data.entries.slice(0, 24) : [];
        renderDiceLog();
      });
    }

    function applyDiceToolsUi() {
      const wrap = document.getElementById('diceToolsWrap');
      const tray = document.getElementById('diceTray');
      const log = document.getElementById('diceLog');
      const trayBtn = document.getElementById('diceTrayBtn');
      const logBtn = document.getElementById('diceLogBtn');
      const prefPanel = document.getElementById('dicePrefPanel');
      const show = canUseDiceTools();
      if (!show) {
        diceTrayOpen = false;
        diceLogOpen = false;
      }
      if (wrap) wrap.classList.toggle('hidden', !show);
      if (tray) tray.classList.toggle('hidden', !diceTrayOpen);
      if (log) log.classList.toggle('hidden', !diceLogOpen);
      if (prefPanel) prefPanel.classList.toggle('hidden', !show);
      if (trayBtn) trayBtn.setAttribute('aria-expanded', diceTrayOpen ? 'true' : 'false');
      if (logBtn) logBtn.setAttribute('aria-expanded', diceLogOpen ? 'true' : 'false');
      if (prefPanel) {
        prefPanel.querySelectorAll('[data-dice-anim]').forEach(btn => {
          btn.classList.toggle('is-on', btn.getAttribute('data-dice-anim') === diceAnimMode);
        });
      }
      document.body.classList.toggle('dice-log-open', !!(show && diceLogOpen));
    }

    function closeDiceTray() {
      if (!diceTrayOpen) return;
      diceTrayOpen = false;
      applyDiceToolsUi();
    }

    function closeDiceLog() {
      if (!diceLogOpen) return;
      diceLogOpen = false;
      applyDiceToolsUi();
    }

    function toggleDiceTray() {
      if (!canUseDiceTools()) return;
      diceTrayOpen = !diceTrayOpen;
      if (diceTrayOpen) diceLogOpen = false;
      applyDiceToolsUi();
    }

    function toggleDiceLog() {
      if (!canUseDiceTools()) return;
      diceLogOpen = !diceLogOpen;
      if (diceLogOpen) diceTrayOpen = false;
      applyDiceToolsUi();
    }

    function addDiceToQueue(sides) {
      const key = Number(sides);
      if (!diceQueue.hasOwnProperty(key)) return;
      if (diceQueueTotal() >= 8) {
        toast('Maximal 8 Würfel.');
        return;
      }
      diceQueue[key] += 1;
      renderDiceTray();
    }

    function clearTableDice(keepStage) {
      (playTableDie._items || []).slice().forEach(d => {
        if (d.life) clearTimeout(d.life);
        if (d.scene && d.scene.parentNode) d.scene.parentNode.removeChild(d.scene);
      });
      playTableDie._items = [];
      const stage = document.getElementById('diceStage');
      if (stage && !keepStage) {
        stage.classList.add('hidden');
        stage.classList.remove('is-landed');
        stage.setAttribute('aria-hidden', 'true');
      }
    }

    function presentDiceCaption(caption) {
      const text = String(caption || '').trim();
      logDiceRoll(text);
      if (text) {
        playTableDie._quiet = playTableDie._quiet || [];
        if (playTableDie._quiet.indexOf(text) < 0) playTableDie._quiet.push(text);
      }
      const joined = (playTableDie._quiet || []).join(' · ');
      clearTableDice(true);
      const stage = document.getElementById('diceStage');
      const cap = document.getElementById('diceCaption');
      if (!joined) return;
      if (!stage || !cap) {
        toast(joined, 3800);
        return;
      }
      const span = cap.querySelector('span');
      if (span) span.textContent = joined;
      else cap.textContent = joined;
      stage.classList.remove('hidden');
      stage.classList.add('is-landed');
      stage.setAttribute('aria-hidden', 'false');
      clearTimeout(playTableDie._quietHide);
      playTableDie._quietHide = setTimeout(() => {
        playTableDie._quiet = [];
        stage.classList.add('hidden');
        stage.classList.remove('is-landed');
        stage.setAttribute('aria-hidden', 'true');
      }, 5600);
    }

    function rollQueuedDice() {
      if (!diceRollsEnabled()) { noticeDiceOff(); return; }
      const dice = [];
      DICE_TRAY_SIDES.forEach(sides => {
        const n = diceQueue[sides] || 0;
        for (let i = 0; i < n; i++) dice.push({ sides: sides, value: 1 + Math.floor(Math.random() * sides) });
      });
      if (!dice.length) {
        toast('Zuerst Würfel wählen.');
        return;
      }
      const total = dice.reduce((sum, d) => sum + d.value, 0);
      const detail = dice.map(d => 'W' + d.sides + ' ' + d.value).join(', ');
      playTableDie({
        dice: dice,
        caption: formatDiceQueueLabel() + ': ' + detail + ' = ' + total
      });
    }

    function revealTableDieCaption() {
      const cap = document.getElementById('diceCaption');
      const stage = document.getElementById('diceStage');
      const items = (playTableDie._items || []).filter(x => x.phase !== 'gone');
      if (!cap || !items.length) return;
      const byBatch = {};
      items.forEach(d => {
        const b = d.batch || 0;
        if (!byBatch[b]) byBatch[b] = [];
        byBatch[b].push(d);
      });
      const parts = [];
      Object.keys(byBatch).map(Number).sort((a, b) => a - b).forEach(b => {
        const group = byBatch[b];
        if (group.some(x => x.phase !== 'rest')) return;
        const text = String(group[0].caption || '').trim();
        if (text && parts.indexOf(text) < 0) parts.push(text);
      });
      if (!parts.length) return;
      const span = cap.querySelector('span');
      if (span) span.textContent = parts.join(' · ');
      else cap.textContent = parts.join(' · ');
      if (stage) stage.classList.add('is-landed');
    }

    function appendTableDieCaption(text) {
      const extra = String(text || '').trim();
      if (!extra) return;
      const items = (playTableDie._items || []).filter(x => x.phase !== 'gone');
      if (!items.length) {
        presentDiceCaption(extra);
        return;
      }
      const last = items[items.length - 1];
      if (last.caption && last.caption.indexOf(extra) < 0) last.caption += ' · ' + extra;
      else if (!last.caption) last.caption = extra;
      revealTableDieCaption();
    }

    function playTableDie(opts) {
      const caption = String(opts && opts.caption || '');
      let dice = [];
      if (opts && Array.isArray(opts.dice) && opts.dice.length) {
        dice = opts.dice.map(d => ({
          sides: Math.max(2, Number(d && d.sides) || 20),
          value: d && d.value
        })).filter(d => d.value != null).slice(0, 8);
      } else {
        const sides = Math.max(2, Number(opts && opts.sides) || 20);
        dice = (opts && opts.values || []).filter(v => v != null).slice(0, 8).map(v => ({
          sides: sides,
          value: v
        }));
      }
      if (!dice.length) {
        toast(caption);
        return;
      }
      if (diceAnimBlocked() || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        presentDiceCaption(caption);
        return;
      }
      playTableDie._quiet = [];
      logDiceRoll(caption);
      const stage = document.getElementById('diceStage');
      const rack = document.getElementById('diceRack');
      const cap = document.getElementById('diceCaption');
      if (!stage || !rack) {
        toast(caption);
        return;
      }

      const vw = Math.max(320, window.innerWidth || 800);
      const shortestDeg = (from, to) => {
        let d = (to - from) % 360;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        return d;
      };
      const unwrapTowards = (from, to) => to - shortestDeg(from, to);

      const sparkHtml = () => {
        let out = '';
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
          const dist = 70 + (i % 5) * 22 + Math.random() * 28;
          out += '<i style="--i:' + i + ';--spin:' + (i * 13) + 'deg;--dx:' + Math.round(Math.cos(a) * dist) + 'px;--dy:' + Math.round(Math.sin(a) * dist) + 'px"></i>';
        }
        return out;
      };

      const dieHtml = (value, sides) => {
        const shape = dieShapeForSides(sides);
        const built = diePolyParts(shape, value);
        const rz = (-(built.twist || 0)).toFixed(3);
        return '<div class="dice-scene is-poly is-' + shape + ' is-spinning" data-rest-rz="' + rz + '"><div class="dice-glow"></div><div class="dice-mesh">' + built.html + '</div><div class="dice-shadow"></div><div class="dice-sparks">' + sparkHtml() + '</div></div>';
      };

      if (!playTableDie._items) playTableDie._items = [];
      while (playTableDie._items.length + dice.length > 8) {
        const old = playTableDie._items.shift();
        if (old && old.life) clearTimeout(old.life);
        if (old && old.scene && old.scene.parentNode) old.scene.parentNode.removeChild(old.scene);
      }

      const wrap = document.createElement('div');
      wrap.innerHTML = dice.map(d => dieHtml(d.value, d.sides)).join('');
      const scenes = Array.prototype.slice.call(wrap.children);
      scenes.forEach(scene => rack.appendChild(scene));

      stage.classList.remove('hidden');
      if (!(playTableDie._items || []).some(x => x.phase === 'rest')) {
        stage.classList.remove('is-landed');
      }
      stage.setAttribute('aria-hidden', 'false');

      const pose = (d, vis) => {
        const x = vis ? d.sx : d.x;
        const y = vis ? d.sy : d.y;
        const rx = vis ? d.srx : d.rx;
        const ry = vis ? d.sry : d.ry;
        const rz = vis ? d.srz : d.rz;
        const sc = d.scale != null ? d.scale : 1;
        if (d.mesh) {
          d.mesh.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        }
        if (d.shadow) {
          const grounded = Math.max(0, Math.min(1, sc));
          d.shadow.style.opacity = String(0.12 + 0.38 * grounded);
          d.shadow.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + (y + 36).toFixed(2) + 'px,0) scale(' + (0.42 + 0.58 * grounded).toFixed(3) + ')';
        }
      };

      const syncVis = (d) => {
        d.sx = d.x;
        d.sy = d.y;
        d.srx = d.rx;
        d.sry = d.ry;
        d.srz = d.rz;
      };

      const easeVis = (d, dt, rate) => {
        const k = 1 - Math.exp(-(rate || 12) * dt);
        d.sx += (d.x - d.sx) * k;
        d.sy += (d.y - d.sy) * k;
        d.srx = unwrapTowards(d.srx, d.rx);
        d.sry = unwrapTowards(d.sry, d.ry);
        d.srz = unwrapTowards(d.srz, d.rz);
        d.srx += (d.rx - d.srx) * k;
        d.sry += (d.ry - d.sry) * k;
        d.srz += (d.rz - d.srz) * k;
      };

      const setTopFace = (d, text) => {
        const face = d.mesh && d.mesh.querySelector('.dice-face[data-side="top"] span');
        if (face) face.textContent = text;
      };

      const scrambleFace = (d) => {
        if (d.sides === 100) setTopFace(d, String((1 + Math.floor(Math.random() * 10)) * 10));
        else setTopFace(d, String(1 + Math.floor(Math.random() * (d.sides || 20))));
      };

      const dissolveDie = (d) => {
        if (!d || d.phase === 'gone') return;
        d.phase = 'gone';
        if (d.life) clearTimeout(d.life);
        if (d.scene) {
          d.scene.classList.remove('is-spinning', 'is-rest', 'is-pop');
          d.scene.classList.add('is-dissolving');
        }
        setTimeout(() => {
          if (d.scene && d.scene.parentNode) d.scene.parentNode.removeChild(d.scene);
          playTableDie._items = (playTableDie._items || []).filter(x => x !== d);
          revealTableDieCaption();
          if (rack && !rack.children.length) {
            stage.classList.add('hidden');
            stage.classList.remove('is-landed');
            stage.setAttribute('aria-hidden', 'true');
          }
        }, 760);
      };

      const n = dice.length;
      const liveBefore = (playTableDie._items || []).filter(x => x.phase !== 'gone').length;
      const gapX = vw < 420 ? 74 : 98;
      const gapY = vw < 420 ? 92 : 108;
      const row0 = n <= 4 ? n : Math.ceil(n / 2);
      const row1 = n - row0;
      const extraY = liveBefore ? 100 : 24;
      const slotFor = i => {
        const row = i < row0 ? 0 : 1;
        const col = i < row0 ? i : i - row0;
        const cols = row === 0 ? row0 : row1;
        return {
          x: (col - (cols - 1) / 2) * gapX,
          y: extraY + (row1 ? (row - 0.5) * gapY : 0)
        };
      };

      const batch = (playTableDie._batch = (playTableDie._batch || 0) + 1);

      dice.forEach((spec, i) => {
        const scene = scenes[i];
        const slot = slotFor(i);
        let ax = Math.random() * 2 - 1;
        let ay = Math.random() * 2 - 1;
        let az = Math.random() * 2 - 1;
        const alen = Math.hypot(ax, ay, az) || 1;
        ax /= alen;
        ay /= alen;
        az /= alen;
        const d = {
          scene: scene,
          mesh: scene.querySelector('.dice-mesh'),
          shadow: scene.querySelector('.dice-shadow'),
          phase: 'spin',
          delay: i * 0.05,
          born: performance.now(),
          slotX: slot.x,
          slotY: slot.y,
          x: slot.x,
          y: slot.y - 28,
          scale: 0.12,
          rx: Math.random() * 360,
          ry: Math.random() * 360,
          rz: Math.random() * 360,
          wx: 0,
          wy: 0,
          wz: 0,
          ax: ax,
          ay: ay,
          az: az,
          spinSpeed0: 3200 + Math.random() * 1400,
          spinFor: 0.72 + Math.random() * 0.12 + i * 0.03,
          glideFor: 0.72 + Math.random() * 0.1,
          scrambleAt: 0,
          rest: {
            rx: 0,
            ry: 0,
            rz: Number(scene.getAttribute('data-rest-rz')) || 0
          },
          value: spec.value,
          sides: spec.sides,
          batch: batch,
          caption: caption
        };
        scrambleFace(d);
        syncVis(d);
        pose(d, true);
        d.life = setTimeout(() => dissolveDie(d), 5000 + Math.random() * 500 + i * 140);
        playTableDie._items.push(d);
      });

      const lockRest = (d) => {
        if (d.phase === 'rest' || d.phase === 'gone') return;
        d.x = d.slotX;
        d.y = d.slotY;
        d.wx = 0;
        d.wy = 0;
        d.wz = 0;
        d.rx = d.rest.rx;
        d.ry = d.rest.ry;
        d.rz = d.rest.rz;
        d.scale = 1;
        d.phase = 'rest';
        if (d.scene) {
          d.scene.classList.remove('is-spinning', 'is-braking');
          d.scene.classList.add('is-rest', 'is-pop');
          if (d.sides === 20 && d.value === 20) d.scene.classList.add('is-crit');
          if (d.sides === 20 && d.value === 1) d.scene.classList.add('is-fumble');
        }
        if (d.value != null) setTopFace(d, String(d.value));
        revealTableDieCaption();
        setTimeout(() => {
          if (d.scene) d.scene.classList.remove('is-pop');
        }, 620);
      };

      const beginGlide = (d, t) => {
        if (d.phase !== 'spin') return;
        d.phase = 'settle';
        d.glideAt = t;
        d.fromRx = unwrapTowards(d.rx, d.rest.rx);
        d.fromRy = unwrapTowards(d.ry, d.rest.ry);
        d.fromRz = unwrapTowards(d.rz, d.rest.rz);
        d.rx = d.fromRx;
        d.ry = d.fromRy;
        d.rz = d.fromRz;
        d.dx = shortestDeg(d.fromRx, d.rest.rx);
        d.dy = shortestDeg(d.fromRy, d.rest.ry);
        d.dz = shortestDeg(d.fromRz, d.rest.rz);
        d.extraDeg = 260 + Math.random() * 160;
        d.x = d.slotX;
        d.y = d.slotY;
        if (d.scene) d.scene.classList.add('is-braking');
        syncVis(d);
      };

      const stepDie = (d, dt, now) => {
        const t = (now - d.born) / 1000 - d.delay;
        if (t < 0) return;
        const appear = 0.2;
        if (t < appear) {
          const e = 1 - Math.pow(1 - t / appear, 3);
          d.scale = 0.12 + e * 0.96;
          d.y = d.slotY - (1 - e) * 28;
        } else if (d.phase !== 'rest') {
          d.scale += (1 - d.scale) * Math.min(1, 10 * dt);
          d.y += (d.slotY - d.y) * Math.min(1, 12 * dt);
        }
        d.x = d.slotX;

        if (d.phase === 'spin') {
          const speed = d.spinSpeed0;
          const wobble = 8;
          d.x = d.slotX + Math.sin(t * 38 + d.born) * wobble;
          d.rx += d.ax * speed * dt;
          d.ry += d.ay * speed * dt;
          d.rz += d.az * speed * dt;
          if (now - d.scrambleAt > 18) {
            d.scrambleAt = now;
            scrambleFace(d);
          }
          if (t >= d.spinFor) beginGlide(d, t);
        } else if (d.phase === 'settle') {
          const p = Math.min(1, Math.max(0, (t - d.glideAt) / (d.glideFor || 0.72)));
          const e = 1 - Math.pow(1 - p, 4);
          const bulge = Math.sin(p * Math.PI);
          d.rx = d.fromRx + d.dx * e + d.ax * d.extraDeg * bulge;
          d.ry = d.fromRy + d.dy * e + d.ay * d.extraDeg * bulge;
          d.rz = d.fromRz + d.dz * e + d.az * d.extraDeg * bulge;
          d.x = d.slotX + Math.sin(t * 18 + d.born) * (1 - e) * 4;
          d.y = d.slotY;
          if (p > 0.48 && d.value != null) setTopFace(d, String(d.value));
          if (p >= 1) lockRest(d);
        }
      };

      if (playTableDie._raf) {
        cancelAnimationFrame(playTableDie._raf);
        playTableDie._raf = 0;
      }

      let last = performance.now();
      const step = 1 / 120;

      const frame = now => {
        const renderDt = Math.min(0.05, Math.max(0.008, (now - last) / 1000));
        let acc = renderDt;
        last = now;
        let moving = false;

        while (acc > 0.0004) {
          const dt = Math.min(step, acc);
          acc -= dt;
          (playTableDie._items || []).forEach(d => {
            if (d.phase === 'gone') return;
            if (d.phase === 'rest') return;
            const local = (now - d.born) / 1000 - d.delay;
            if (local < 0) {
              moving = true;
              return;
            }
            stepDie(d, dt, now);
            if (d.phase !== 'rest' && d.phase !== 'gone') moving = true;
          });
        }

        (playTableDie._items || []).forEach(d => {
          if (d.phase === 'gone') return;
          if (d.phase === 'rest') {
            d.x = d.slotX;
            d.y = d.slotY;
            d.scale = 1;
            easeVis(d, renderDt, 10);
            pose(d, true);
            const tilt = Math.hypot(
              shortestDeg(d.srx, d.rx),
              shortestDeg(d.sry, d.ry),
              shortestDeg(d.srz, d.rz)
            );
            if (tilt > 0.2) moving = true;
            return;
          }
          if ((now - d.born) / 1000 - d.delay < 0) {
            moving = true;
            return;
          }
          if (d.phase === 'spin') pose(d, false);
          else {
            easeVis(d, renderDt, 11);
            pose(d, true);
          }
          moving = true;
        });

        if (moving) {
          playTableDie._raf = requestAnimationFrame(frame);
        } else {
          playTableDie._raf = 0;
        }
      };
      playTableDie._raf = requestAnimationFrame(frame);
    }

    if (!playTableDie._ptBound) {
      playTableDie._ptBound = true;
      document.addEventListener('pointerdown', ev => {
        playTableDie._pt = { x: ev.clientX, y: ev.clientY };
      }, true);
    }
