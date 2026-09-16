/* Thalarion – Stat-Sheet OCR – Phase 1.5 */

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
