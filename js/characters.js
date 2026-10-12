/* Thalarion – Charaktere (Blätter, NPCs, Login, Chat) – Phase 1.3 */

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

    function ensureMinSpellSlots(dnd, slots) {
      if (!dnd || !slots) return false;
      if (!dnd.spellSlots || typeof dnd.spellSlots !== 'object') dnd.spellSlots = {};
      let changed = false;
      Object.keys(slots).forEach(key => {
        const level = Number(key);
        const want = Number(slots[key]);
        if (!(level >= 1 && level <= 9) || !(want > 0)) return;
        if (!dnd.spellSlots[level]) dnd.spellSlots[level] = { max: '', used: '' };
        const cur = Number(String(dnd.spellSlots[level].max || '').replace(',', '.'));
        if (!Number.isFinite(cur) || cur < want) {
          dnd.spellSlots[level].max = String(want);
          const used = Math.max(0, Number(String(dnd.spellSlots[level].used || '').replace(',', '.')) || 0);
          if (used > want) dnd.spellSlots[level].used = String(want);
          changed = true;
        }
      });
      return changed;
    }

    function accountMatchesName(id, acc, re) {
      if (!acc || !re) return false;
      if (re.test(String(id || ''))) return true;
      if (re.test(String(acc.name || ''))) return true;
      const sheet = acc.sheet || {};
      if (re.test(String(sheet.name || ''))) return true;
      return re.test(String((sheet.dnd && sheet.dnd.name) || ''));
    }

    function ensureKnownSpellLevels(dnd) {
      if (!dnd || !Array.isArray(dnd.spells)) return false;
      let changed = false;
      dnd.spells.forEach(s => {
        if (!s) return;
        const name = String(s.name || '').toLowerCase().replace(/\s+/g, ' ');
        const raw = String(s.level || '').trim();
        if (raw && raw !== '0' && !/^k/i.test(raw)) return;
        if (/speak with animals|mit tieren sprechen/.test(name) && (!raw || raw === '0')) {
          s.level = '1';
          changed = true;
        }
      });
      return changed;
    }

    function ensureCasterSpellSlots(accs) {
      if (!accs) return false;
      let changed = false;
      const yuvi = accs[YUVI_ID];
      if (yuvi && yuvi.sheet) {
        yuvi.sheet.dnd = normalizeDndSheet(yuvi.sheet.dnd);
        if (ensureMinSpellSlots(yuvi.sheet.dnd, { 1: 4, 2: 2 })) changed = true;
        if (ensureKnownSpellLevels(yuvi.sheet.dnd)) changed = true;
      }
      Object.keys(accs).forEach(id => {
        const acc = accs[id];
        if (!accountMatchesName(id, acc, /nemeia/i) || !acc.sheet) return;
        acc.sheet.dnd = normalizeDndSheet(acc.sheet.dnd);
        if (ensureMinSpellSlots(acc.sheet.dnd, { 1: 4, 2: 3 })) changed = true;
        if (ensureKnownSpellLevels(acc.sheet.dnd)) changed = true;
      });
      if (changed && currentSheetOwner && dndState) {
        const rec = sheetOwnerRecord(currentSheetOwner);
        const src = rec && rec.sheet && rec.sheet.dnd;
        if (src) {
          if (src.spellSlots && dndState.spellSlots) {
            for (let i = 1; i <= 9; i++) {
              if (!src.spellSlots[i]) continue;
              if (!dndState.spellSlots[i]) dndState.spellSlots[i] = { max: '', used: '' };
              const liveMax = Number(String(dndState.spellSlots[i].max || '').replace(',', '.')) || 0;
              const srcMax = Number(String(src.spellSlots[i].max || '').replace(',', '.')) || 0;
              if (srcMax > liveMax) dndState.spellSlots[i].max = src.spellSlots[i].max;
            }
          }
          (src.spells || []).forEach(s => {
            const live = (dndState.spells || []).find(x => x.id === s.id);
            if (!live || !s.level) return;
            const raw = String(live.level || '').trim();
            if (!raw || raw === '0') live.level = s.level;
          });
        }
      }
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
      base.items = list(src.items, x => x && normalizeDndItem(x));
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
    var dndInvFilter = 'all';
    var dndAttackEditId = '';
    var dndSpellEditId = '';
    var dndItemEditId = '';
    var dndItemPackId = '';

    function dndItemCategoryId(raw) {
      const id = String(raw || '');
      return (DND_ITEM_CATEGORIES || []).some(c => c.id === id) ? id : 'other';
    }

    function dndItemContainerId(raw, equipped) {
      const id = String(raw || '');
      if ((DND_ITEM_CONTAINERS || []).some(c => c.id === id)) return id;
      return equipped ? 'carried' : 'backpack';
    }

    function normalizeDndItem(raw) {
      const x = raw && typeof raw === 'object' ? raw : {};
      const equipped = !!x.equipped;
      return {
        id: x.id || combatNewId('i'),
        name: String(x.name || ''),
        qty: String(x.qty != null && x.qty !== '' ? x.qty : '1'),
        weight: String(x.weight || ''),
        category: dndItemCategoryId(x.category),
        container: dndItemContainerId(x.container, equipped),
        equipped: equipped,
        attuned: !!x.attuned,
        notes: String(x.notes || ''),
        text: String(x.text || ''),
        range: String(x.range || ''),
        bonus: String(x.bonus || ''),
        damage: String(x.damage || ''),
        attackId: String(x.attackId || '')
      };
    }

    function dndItemIsCombat(item) {
      const c = item && item.category;
      return c === 'weapon' || c === 'armor' || c === 'shield';
    }

    function dndItemIsUsable(item) {
      return !!(item && item.category === 'consumable');
    }

    function dndItemNum(raw) {
      const n = Number(String(raw == null ? '' : raw).replace(',', '.').trim());
      return Number.isFinite(n) ? n : 0;
    }

    function dndItemUnitWeight(item) {
      return Math.max(0, dndItemNum(item && item.weight));
    }

    function dndItemStackWeight(item) {
      const qty = Math.max(0, dndItemNum(item && item.qty) || 0);
      return qty * dndItemUnitWeight(item);
    }

    function dndCarryCapacityKg() {
      const str = dndState && dndState.abilities && dndState.abilities.str
        ? Number(dndState.abilities.str.score) || 10
        : 10;
      // 5e: 15 lb × ST, hier als kg (×0,5)
      return Math.round(str * 7.5 * 10) / 10;
    }

    function dndItemMatchesInvFilter(item, filter) {
      if (!item) return false;
      const f = filter || 'all';
      if (f === 'all') return true;
      if (f === 'carried') return item.equipped || item.container === 'carried' || item.container === 'belt';
      if (f === 'backpack') return item.container === 'backpack';
      if (f === 'magic') return item.category === 'magic' || item.attuned;
      if (f === 'consumable') return item.category === 'consumable';
      return true;
    }

    function dndInvSelectHtml(kind, value) {
      const list = kind === 'category' ? DND_ITEM_CATEGORIES : DND_ITEM_CONTAINERS;
      const key = kind === 'category' ? 'category' : 'container';
      return '<select data-k="' + key + '">' + (list || []).map(opt =>
        '<option value="' + opt.id + '"' + (opt.id === value ? ' selected' : '') + '>' +
        escapeAttr(opt.label) + '</option>'
      ).join('') + '</select>';
    }

    function dndItemLabel(list, id) {
      return ((list || []).find(c => c.id === id) || {}).label || id || '';
    }

    function dndItemIsOpen(row) {
      return !String(row && row.name || '').trim() || (row && row.id) === dndItemEditId;
    }

    function commitDndItem(id) {
      collectDndFields();
      const item = (dndState.items || []).find(x => x.id === id);
      if (!item || !String(item.name || '').trim()) {
        toast('Zuerst einen Namen für den Gegenstand eintragen.');
        return;
      }
      dndItemEditId = '';
      dndItemPackId = '';
      renderDndInventory();
      sheetDirty = true;
      saveSheet();
    }

    function useDndItem(id) {
      collectDndFields();
      const item = (dndState.items || []).find(x => x.id === id);
      if (!item) return;
      if (!dndItemIsUsable(item)) {
        toast('Nur Verbrauchbares lässt sich so nutzen.');
        return;
      }
      let qty = Math.max(0, Math.floor(dndItemNum(item.qty)));
      if (!qty) qty = 0;
      if (qty <= 0) {
        toast((item.name || 'Gegenstand') + ' ist aufgebraucht.');
        return;
      }
      qty -= 1;
      item.qty = String(qty);
      toast((item.name || 'Gegenstand') + ' genutzt · noch ' + qty + '.');
      renderDndInventory();
      sheetDirty = true;
      saveSheet();
      if (dndActionView && dndActionView.kind === 'items' && dndActionView.id === id) {
        openDndActionInfo('items', id, currentSheetOwner);
      }
    }

    function setDndItemContainer(id, containerId) {
      collectDndFields();
      const item = (dndState.items || []).find(x => x.id === id);
      if (!item) return;
      const next = dndItemContainerId(containerId, item.equipped);
      item.container = next;
      if (next === 'carried' || next === 'belt') {
        if (dndItemIsCombat(item)) item.equipped = true;
      } else {
        item.equipped = false;
      }
      dndItemPackId = '';
      renderDndInventory();
      sheetDirty = true;
      saveSheet();
      toast((item.name || 'Gegenstand') + ' → ' + dndItemLabel(DND_ITEM_CONTAINERS, next));
    }

    function toggleDndItemPack(id) {
      collectDndFields();
      dndItemPackId = dndItemPackId === id ? '' : (id || '');
      renderDndInventory();
    }

    function createDndAttackFromItem(id) {
      collectDndFields();
      const item = (dndState.items || []).find(x => x.id === id);
      if (!item || !String(item.name || '').trim()) {
        toast('Zuerst einen Namen für den Gegenstand eintragen.');
        return;
      }
      let atk = item.attackId
        ? (dndState.attacks || []).find(a => a.id === item.attackId)
        : null;
      if (!atk) {
        const want = String(item.name || '').trim().toLowerCase();
        atk = (dndState.attacks || []).find(a => String(a.name || '').trim().toLowerCase() === want);
      }
      if (atk) {
        item.attackId = atk.id;
        dndItemEditId = '';
        dndItemPackId = '';
        setDndTab('actions');
        sheetDirty = true;
        saveSheet();
        toast('Angriff „' + (atk.name || item.name) + '“ ist unter Aktionen.');
        return;
      }
      const newId = combatNewId('a');
      const rangeDefault = item.category === 'weapon' ? '5 ft.' : '';
      dndState.attacks.push({
        id: newId,
        name: item.name,
        range: String(item.range || rangeDefault),
        bonus: String(item.bonus || ''),
        hitRoll: '',
        damage: String(item.damage || ''),
        dmgRoll: '',
        notes: String(item.notes || ''),
        text: String(item.text || '')
      });
      item.attackId = newId;
      item.equipped = true;
      item.container = 'carried';
      dndAttackEditId = newId;
      dndItemEditId = '';
      dndItemPackId = '';
      setDndTab('actions');
      sheetDirty = true;
      saveSheet();
      toast('Angriff aus „' + item.name + '“ angelegt.');
    }

    function dndItemPackHtml(row) {
      if (dndItemPackId !== row.id) return '';
      return '<div class="dnd-inv-pack">' + (DND_ITEM_CONTAINERS || []).map(opt =>
        '<button type="button" class="' + (opt.id === row.container ? 'active' : '') +
        '" data-dnd-item-container="' + opt.id + '" data-id="' + row.id + '">' +
        escapeAttr(opt.label) + '</button>'
      ).join('') + '</div>';
    }

    function dndItemRowHtml(row) {
      if (dndItemIsOpen(row)) {
        const combat = dndItemIsCombat(row) || row.category === 'magic';
        return '<div class="dnd-inv-edit" data-dnd-row="items" data-id="' + row.id + '">' +
          '<div class="dnd-inv-edit-top">' +
          '<input data-k="name" value="' + escapeAttr(row.name) + '" placeholder="Gegenstand" />' +
          '<input data-k="qty" value="' + escapeAttr(row.qty) + '" placeholder="1" title="Menge" />' +
          '<input data-k="weight" value="' + escapeAttr(row.weight) + '" placeholder="kg" title="Gewicht je Stück" /></div>' +
          '<div class="dnd-inv-edit-grid">' +
          dndInvSelectHtml('category', row.category) +
          dndInvSelectHtml('container', row.container) +
          '<label class="dnd-save" title="Ausgerüstet"><input class="dnd-check" type="checkbox" data-k="equipped"' +
          (row.equipped ? ' checked' : '') + ' /> an</label>' +
          '<label class="dnd-save" title="Eingestimmt"><input class="dnd-check" type="checkbox" data-k="attuned"' +
          (row.attuned ? ' checked' : '') + ' /> ein</label></div>' +
          (combat
            ? '<div class="dnd-inv-edit-combat">' +
              '<input data-k="range" value="' + escapeAttr(row.range) + '" placeholder="Reichweite" />' +
              '<input data-k="bonus" value="' + escapeAttr(row.bonus) + '" placeholder="+5" title="Angriffsbonus" />' +
              '<input data-k="damage" value="' + escapeAttr(row.damage) + '" placeholder="1W8+3" title="Schaden" /></div>'
            : '') +
          '<input data-k="notes" value="' + escapeAttr(row.notes) + '" placeholder="Kurznotiz" />' +
          '<textarea data-k="text" class="dnd-inv-edit-text" placeholder="Wirkung / Beschreibung…">' +
          escapeAttr(row.text) + '</textarea>' +
          '<div class="dnd-atk-edit-foot">' +
          '<button type="button" class="primary" data-dnd-item-save="' + row.id + '">Speichern</button>' +
          '<button type="button" class="ghost" data-dnd-del="items">×</button></div></div>';
      }
      const qty = String(row.qty || '1').trim() || '1';
      const w = Math.round(dndItemStackWeight(row) * 100) / 100;
      const cat = dndItemLabel(DND_ITEM_CATEGORIES, row.category);
      const bits = [cat];
      if (qty !== '1') bits.push('×' + qty);
      bits.push(w + ' kg');
      if (row.equipped) bits.push('an');
      if (row.attuned) bits.push('ein');
      const meta = bits.join(' · ');
      const actions = [];
      if (dndItemIsUsable(row)) {
        actions.push('<button type="button" class="primary" data-dnd-item-use="' + row.id +
          '" title="Einen verbrauchen">Nutzen</button>');
      }
      if (dndItemIsCombat(row)) {
        actions.push('<button type="button" class="ghost" data-dnd-item-attack="' + row.id +
          '" title="Als Angriff unter Aktionen">' +
          (row.attackId ? 'Angriff' : '→ Angriff') + '</button>');
      }
      actions.push('<button type="button" class="ghost" data-dnd-item-pack="' + row.id +
        '" title="Umpacken">Packen</button>');
      actions.push('<button type="button" class="ghost" data-dnd-item-edit="' + row.id +
        '" title="Bearbeiten">Ändern</button>');
      actions.push('<button type="button" class="ghost" data-dnd-del="items">×</button>');
      return '<div class="dnd-inv-item" data-dnd-row="items" data-id="' + row.id + '">' +
        '<div class="dnd-inv-id"><button type="button" class="dnd-atk-name" data-dnd-info title="Beschreibung">' +
        escapeAttr(row.name || 'Gegenstand') + '</button>' +
        '<span class="dnd-atk-kind">' + escapeAttr(meta) + '</span></div>' +
        '<div class="dnd-atk-notes">' + escapeAttr(row.notes || '') + '</div>' +
        '<div class="dnd-inv-actions">' +
        '<label class="dnd-save" title="Ausgerüstet"><input class="dnd-check" type="checkbox" data-k="equipped"' +
        (row.equipped ? ' checked' : '') + ' /> an</label>' +
        '<label class="dnd-save" title="Eingestimmt"><input class="dnd-check" type="checkbox" data-k="attuned"' +
        (row.attuned ? ' checked' : '') + ' /> ein</label>' +
        actions.join('') + '</div>' +
        dndItemPackHtml(row) + '</div>';
    }

    function setDndInvFilter(filter) {
      collectDndFields();
      dndInvFilter = filter || 'all';
      renderDndInventory();
    }

    function refreshDndInvSummary() {
      const items = (dndState.items || []).map(normalizeDndItem);
      const total = items.reduce((sum, it) => sum + dndItemStackWeight(it), 0);
      const cap = dndCarryCapacityKg();
      const attuned = items.filter(it => it.attuned).length;
      const weightEl = document.getElementById('dndInvWeight');
      if (weightEl) {
        const rounded = Math.round(total * 100) / 100;
        weightEl.textContent = rounded + ' / ' + cap + ' kg';
        weightEl.classList.toggle('is-warn', total > cap * 0.8 && total <= cap);
        weightEl.classList.toggle('is-over', total > cap);
      }
      const attuneEl = document.getElementById('dndInvAttune');
      if (attuneEl) {
        attuneEl.textContent = attuned + ' / 3';
        attuneEl.classList.toggle('is-over', attuned > 3);
      }
      document.querySelectorAll('#dndInvFilters [data-dnd-inv-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-dnd-inv-filter') === dndInvFilter);
      });
    }

    function renderDndInventory() {
      const box = document.getElementById('dndItemList');
      if (!box) return;
      const items = (dndState.items || []).map(normalizeDndItem);
      dndState.items = items;
      refreshDndInvSummary();
      const visible = items.filter(it => dndItemMatchesInvFilter(it, dndInvFilter));
      if (!visible.length) {
        box.innerHTML = '<p class="dnd-inv-empty">' +
          (items.length ? 'Keine Gegenstände in diesem Filter.' : 'Noch keine Gegenstände.') + '</p>';
        return;
      }
      const order = (DND_ITEM_CONTAINERS || []).map(c => c.id);
      const byContainer = {};
      visible.forEach(it => {
        const key = it.equipped && it.container !== 'mount' && it.container !== 'camp' && it.container !== 'quest'
          ? 'carried'
          : it.container;
        if (!byContainer[key]) byContainer[key] = [];
        byContainer[key].push(it);
      });
      let html = '';
      order.forEach(cid => {
        const rows = byContainer[cid];
        if (!rows || !rows.length) return;
        const label = ((DND_ITEM_CONTAINERS || []).find(c => c.id === cid) || {}).label || cid;
        const sectionWeight = Math.round(rows.reduce((s, it) => s + dndItemStackWeight(it), 0) * 100) / 100;
        html += '<div class="dnd-inv-section">' +
          '<div class="dnd-inv-section-head"><span>' + escapeAttr(label) + '</span>' +
          '<span class="dnd-inv-section-w">' + sectionWeight + ' kg</span></div>' +
          rows.map(dndItemRowHtml).join('') + '</div>';
      });
      box.innerHTML = html || '<p class="dnd-inv-empty">Keine Gegenstände.</p>';
    }

    function dndItemRarityId(raw) {
      const id = String(raw || '');
      return (DND_ITEM_RARITIES || []).some(r => r.id === id) ? id : '';
    }

    function normalizeCatalogItem(raw) {
      const x = raw && typeof raw === 'object' ? raw : {};
      return {
        id: x.id || combatNewId('ic'),
        name: String(x.name || ''),
        category: dndItemCategoryId(x.category),
        rarity: dndItemRarityId(x.rarity),
        weight: String(x.weight || ''),
        cost: String(x.cost || ''),
        notes: String(x.notes || ''),
        text: String(x.text || ''),
        range: String(x.range || ''),
        bonus: String(x.bonus || ''),
        damage: String(x.damage || ''),
        attunement: !!x.attunement,
        tags: String(x.tags || ''),
        source: String(x.source || '')
      };
    }

    function persistItemCatalogLocal() {
      writeLocal(ITEM_CATALOG_KEY, JSON.stringify({
        updatedAt: itemCatalogUpdatedAt,
        items: (itemCatalog || []).slice(0, ITEM_CATALOG_MAX)
      }));
    }

    function loadItemCatalogLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(ITEM_CATALOG_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return;
        itemCatalogUpdatedAt = Number(raw.updatedAt) || 0;
        itemCatalog = Array.isArray(raw.items)
          ? raw.items.map(normalizeCatalogItem)
          : [];
      } catch (err) {
        itemCatalog = [];
      }
    }

    function applyItemCatalog(data) {
      if (!data) return;
      const at = Number(data.updatedAt) || 0;
      if (at && at <= itemCatalogUpdatedAt) return;
      itemCatalogUpdatedAt = at;
      itemCatalog = Array.isArray(data.items)
        ? data.items.map(normalizeCatalogItem)
        : [];
      persistItemCatalogLocal();
      const overlay = document.getElementById('dndCatalogOverlay');
      if (overlay && !overlay.classList.contains('hidden')) renderItemCatalog();
    }

    function listenItemCatalog() {
      if (!db) return;
      itemCatalogRef().onSnapshot(snap => {
        if (writingItemCatalog || !snap.exists) return;
        applyItemCatalog(snap.data());
      });
    }

    async function persistItemCatalogRemote() {
      if (!db) return;
      const nextAt = Date.now();
      writingItemCatalog = true;
      try {
        await itemCatalogRef().set({
          updatedAt: nextAt,
          items: (itemCatalog || []).slice(0, ITEM_CATALOG_MAX)
        });
        itemCatalogUpdatedAt = nextAt;
        persistItemCatalogLocal();
      } catch (err) {
        toast('Katalog konnte nicht gespeichert werden: ' + (err && err.message ? err.message : err));
      } finally {
        writingItemCatalog = false;
      }
    }

    function persistItemCatalogSoon() {
      itemCatalogUpdatedAt = Date.now();
      persistItemCatalogLocal();
      clearTimeout(itemCatalogPersistTimer);
      itemCatalogPersistTimer = setTimeout(() => { persistItemCatalogRemote(); }, 220);
    }

    function openItemCatalog() {
      itemCatalogEditId = null;
      if (!itemCatalogSelectedId && itemCatalog.length) {
        itemCatalogSelectedId = itemCatalog[0].id;
      }
      const overlay = document.getElementById('dndCatalogOverlay');
      if (overlay) overlay.classList.remove('hidden');
      renderItemCatalog();
      const search = document.getElementById('dndCatalogSearch');
      if (search) {
        search.value = itemCatalogQuery || '';
        setTimeout(() => search.focus(), 30);
      }
    }

    function closeItemCatalog() {
      itemCatalogEditId = null;
      const overlay = document.getElementById('dndCatalogOverlay');
      if (overlay) overlay.classList.add('hidden');
    }

    function catalogMatchesQuery(item, q) {
      if (!q) return true;
      const hay = [
        item.name, item.notes, item.text, item.tags, item.source, item.cost,
        dndItemLabel(DND_ITEM_CATEGORIES, item.category),
        dndItemLabel(DND_ITEM_RARITIES, item.rarity)
      ].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    }

    function filteredCatalogItems() {
      const q = String(itemCatalogQuery || '').trim().toLowerCase();
      const f = itemCatalogFilter || 'all';
      return (itemCatalog || []).filter(it => {
        if (f !== 'all' && it.category !== f) return false;
        return catalogMatchesQuery(it, q);
      }).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'de'));
    }

    function catalogSelectHtml(kind, value) {
      const list = kind === 'category' ? DND_ITEM_CATEGORIES : DND_ITEM_RARITIES;
      const name = kind === 'category' ? 'category' : 'rarity';
      return '<select data-cat-k="' + name + '">' + (list || []).map(opt =>
        '<option value="' + opt.id + '"' + (opt.id === value ? ' selected' : '') + '>' +
        escapeAttr(opt.label) + '</option>'
      ).join('') + '</select>';
    }

    function catalogEditFormHtml(row) {
      const isNew = !row || !row.id;
      const r = row || normalizeCatalogItem({});
      return '<div class="dnd-catalog-edit" data-cat-edit="' + escapeAttr(r.id || '') + '">' +
        '<div class="dnd-catalog-edit-grid">' +
        '<label>Name<input data-cat-k="name" value="' + escapeAttr(r.name) + '" placeholder="Name" /></label>' +
        '<label>Kategorie' + catalogSelectHtml('category', r.category) + '</label>' +
        '<label>Seltenheit' + catalogSelectHtml('rarity', r.rarity) + '</label>' +
        '<label>Gewicht<input data-cat-k="weight" value="' + escapeAttr(r.weight) + '" placeholder="kg" /></label>' +
        '<label>Preis<input data-cat-k="cost" value="' + escapeAttr(r.cost) + '" placeholder="z. B. 50 gp" /></label>' +
        '<label>Quelle<input data-cat-k="source" value="' + escapeAttr(r.source) + '" placeholder="Kampagne / eigen" /></label>' +
        '<label>Reichweite<input data-cat-k="range" value="' + escapeAttr(r.range) + '" placeholder="5 ft." /></label>' +
        '<label>Bonus<input data-cat-k="bonus" value="' + escapeAttr(r.bonus) + '" placeholder="+5" /></label>' +
        '<label>Schaden<input data-cat-k="damage" value="' + escapeAttr(r.damage) + '" placeholder="1W8" /></label>' +
        '<label class="dnd-save dnd-catalog-attune"><input class="dnd-check" type="checkbox" data-cat-k="attunement"' +
        (r.attunement ? ' checked' : '') + ' /> Einstimmung nötig</label>' +
        '<label class="dnd-catalog-span">Tags<input data-cat-k="tags" value="' + escapeAttr(r.tags) + '" placeholder="z. B. trank, heilung" /></label>' +
        '<label class="dnd-catalog-span">Kurznotiz<input data-cat-k="notes" value="' + escapeAttr(r.notes) + '" placeholder="Kurz" /></label>' +
        '<label class="dnd-catalog-span">Beschreibung<textarea data-cat-k="text" class="dnd-catalog-text" placeholder="Wirkung / Text…">' +
        escapeAttr(r.text) + '</textarea></label></div>' +
        '<div class="editor-actions">' +
        '<button type="button" class="primary" data-cat-save>' + (isNew ? 'Anlegen' : 'Speichern') + '</button>' +
        (!isNew ? '<button type="button" class="ghost" data-cat-delete>Löschen</button>' : '') +
        '<button type="button" class="ghost" data-cat-cancel>Abbrechen</button></div></div>';
    }

    function catalogDetailHtml(item) {
      if (!item) return '<p class="dnd-inv-empty">Eintrag wählen oder neu anlegen.</p>';
      const bits = [
        dndItemLabel(DND_ITEM_CATEGORIES, item.category),
        dndItemLabel(DND_ITEM_RARITIES, item.rarity),
        item.weight ? item.weight + ' kg' : '',
        item.cost || '',
        item.attunement ? 'Einstimmung' : '',
        item.source || ''
      ].filter(Boolean);
      const combat = [item.range, item.bonus, item.damage].filter(Boolean).join(' · ');
      return '<div class="dnd-catalog-view" data-cat-id="' + escapeAttr(item.id) + '">' +
        '<h3>' + escapeAttr(item.name || 'Gegenstand') + '</h3>' +
        '<p class="dnd-action-meta">' + escapeAttr(bits.join(' · ')) + '</p>' +
        (combat ? '<p class="dnd-catalog-combat">' + escapeAttr(combat) + '</p>' : '') +
        (item.tags ? '<p class="dnd-catalog-tags">' + escapeAttr(item.tags) + '</p>' : '') +
        (item.notes ? '<p class="dnd-catalog-notes">' + escapeAttr(item.notes) + '</p>' : '') +
        '<div class="dnd-catalog-body-text">' + escapeAttr(item.text || 'Noch keine Beschreibung.') + '</div>' +
        '<div class="editor-actions">' +
        '<button type="button" class="primary" data-cat-add="' + escapeAttr(item.id) + '">Zum Inventar</button>' +
        (typeof isDM !== 'undefined' && isDM
          ? '<button type="button" class="ghost" data-cat-edit="' + escapeAttr(item.id) + '">Bearbeiten</button>'
          : '') +
        '</div></div>';
    }

    function renderItemCatalog() {
      const filters = document.getElementById('dndCatalogFilters');
      if (filters) {
        const cats = [{ id: 'all', label: 'Alles' }].concat(DND_ITEM_CATEGORIES || []);
        filters.innerHTML = cats.map(c =>
          '<button type="button" class="' + (itemCatalogFilter === c.id ? 'active' : '') +
          '" data-cat-filter="' + c.id + '">' + escapeAttr(c.label) + '</button>'
        ).join('');
      }
      const list = document.getElementById('dndCatalogList');
      const detail = document.getElementById('dndCatalogDetail');
      const visible = filteredCatalogItems();
      if (list) {
        if (!visible.length) {
          list.innerHTML = '<p class="dnd-inv-empty">' +
            ((itemCatalog || []).length ? 'Keine Treffer.' : 'Katalog ist leer — DM kann Einträge anlegen.') +
            '</p>';
        } else {
          list.innerHTML = visible.map(it => {
            const sub = [
              dndItemLabel(DND_ITEM_CATEGORIES, it.category),
              dndItemLabel(DND_ITEM_RARITIES, it.rarity),
              it.weight ? it.weight + ' kg' : ''
            ].filter(Boolean).join(' · ');
            return '<button type="button" class="dnd-catalog-row' +
              (it.id === itemCatalogSelectedId ? ' is-on' : '') +
              '" data-cat-select="' + escapeAttr(it.id) + '">' +
              '<span class="dnd-catalog-row-name">' + escapeAttr(it.name || 'Ohne Namen') + '</span>' +
              '<span class="dnd-catalog-row-meta">' + escapeAttr(sub) + '</span></button>';
          }).join('');
        }
      }
      if (!detail) return;
      if (itemCatalogEditId !== null) {
        const editing = itemCatalogEditId
          ? (itemCatalog || []).find(x => x.id === itemCatalogEditId)
          : normalizeCatalogItem({});
        detail.innerHTML = catalogEditFormHtml(editing || normalizeCatalogItem({ id: itemCatalogEditId || '' }));
        return;
      }
      const selected = (itemCatalog || []).find(x => x.id === itemCatalogSelectedId) || visible[0] || null;
      if (selected) itemCatalogSelectedId = selected.id;
      detail.innerHTML = catalogDetailHtml(selected);
    }

    function readCatalogForm(root) {
      if (!root) return null;
      const data = {};
      root.querySelectorAll('[data-cat-k]').forEach(el => {
        const key = el.getAttribute('data-cat-k');
        if (!key) return;
        data[key] = el.type === 'checkbox' ? el.checked : el.value;
      });
      return data;
    }

    function saveCatalogItemFromForm() {
      if (!(typeof isDM !== 'undefined' && isDM)) {
        toast('Nur der DM kann den Katalog bearbeiten.');
        return;
      }
      const root = document.querySelector('#dndCatalogDetail [data-cat-edit]');
      const raw = readCatalogForm(root);
      if (!raw) return;
      const id = itemCatalogEditId || combatNewId('ic');
      const next = normalizeCatalogItem(Object.assign({}, raw, { id: id }));
      if (!String(next.name || '').trim()) {
        toast('Name fehlt.');
        return;
      }
      const idx = (itemCatalog || []).findIndex(x => x.id === id);
      if (idx >= 0) itemCatalog[idx] = next;
      else itemCatalog.push(next);
      itemCatalogSelectedId = id;
      itemCatalogEditId = null;
      persistItemCatalogSoon();
      renderItemCatalog();
      toast('Katalogeintrag gespeichert.');
    }

    function deleteCatalogItem(id) {
      if (!(typeof isDM !== 'undefined' && isDM)) return;
      const want = id || itemCatalogEditId || itemCatalogSelectedId;
      if (!want) return;
      itemCatalog = (itemCatalog || []).filter(x => x.id !== want);
      if (itemCatalogSelectedId === want) itemCatalogSelectedId = itemCatalog[0] ? itemCatalog[0].id : '';
      itemCatalogEditId = null;
      persistItemCatalogSoon();
      renderItemCatalog();
      toast('Eintrag gelöscht.');
    }

    function addCatalogItemToInventory(id) {
      if (!usesDndSheet(currentSheetOwner)) {
        toast('Kein Charakterblatt geladen.');
        return;
      }
      if (!canEditOwnerSheet(currentSheetOwner)) {
        toast('Kein Schreibrecht auf diesem Blatt.');
        return;
      }
      const cat = (itemCatalog || []).find(x => x.id === id);
      if (!cat) return;
      collectDndFields();
      const row = normalizeDndItem({
        id: combatNewId('i'),
        name: cat.name,
        qty: '1',
        weight: cat.weight,
        category: cat.category,
        container: 'backpack',
        equipped: false,
        attuned: false,
        notes: cat.notes,
        text: cat.text,
        range: cat.range,
        bonus: cat.bonus,
        damage: cat.damage
      });
      dndState.items.push(row);
      dndInvFilter = 'all';
      dndItemEditId = '';
      renderDndInventory();
      sheetDirty = true;
      saveSheet();
      toast('„' + (cat.name || 'Gegenstand') + '“ ins Inventar gelegt.');
    }

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

    function dndAvailableSlotLevel(dnd, minLevel) {
      const min = Math.max(1, Number(minLevel) || 1);
      if (!dnd || !dnd.spellSlots) return 0;
      for (let i = min; i <= 9; i++) {
        const slot = dnd.spellSlots[i];
        const max = Number(String((slot && slot.max) || '').replace(',', '.'));
        if (!Number.isFinite(max) || max <= 0) continue;
        const used = Math.max(0, Number(String((slot && slot.used) || '').replace(',', '.')) || 0);
        if (used < max) return i;
      }
      return 0;
    }

    function dndCastSpell(item) {
      if (!item || !canEditOwnerSheet(currentSheetOwner)) return false;
      collectDndFields();
      const min = dndSpellLevelNum(item.level);
      if (!min) {
        toast((item.name || 'Zaubertrick') + ' braucht keinen Platz.');
        return false;
      }
      const lvl = dndAvailableSlotLevel(dndState, min);
      if (!lvl) {
        toast('Keine Zauberplätze ab Grad ' + min + '.');
        return false;
      }
      const slot = dndState.spellSlots[lvl];
      const used = Math.max(0, Number(String((slot && slot.used) || '').replace(',', '.')) || 0);
      slot.used = String(used + 1);
      const rec = sheetOwnerRecord(currentSheetOwner);
      if (rec && rec.sheet) rec.sheet.dnd = normalizeDndSheet(dndState);
      sheetDirty = true;
      persistPlayersSoon();
      renderDndLists();
      renderDndSlots();
      toast((item.name || 'Zauber') + ' gewirkt · Platz Grad ' + lvl + '.');
      return true;
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
        (dndSpellLevelNum(row.level) >= 1
          ? '<button type="button" class="primary dnd-spell-cast" data-dnd-spell-cast="' + row.id + '" title="Zauber wirken und einen Platz verbrauchen">Wirken</button>'
          : '<span></span>') +
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
      const cast = document.getElementById('dndActionCast');
      if (cast) cast.classList.add('hidden');
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
      } else if (kind === 'items') {
        bits.push(dndItemLabel(DND_ITEM_CATEGORIES, item.category));
        bits.push(dndItemLabel(DND_ITEM_CONTAINERS, item.container));
        const qty = String(item.qty || '1').trim() || '1';
        if (qty !== '1') bits.push('×' + qty);
        if (item.range) bits.push(item.range);
        if (item.bonus) bits.push(item.bonus);
        if (item.damage) bits.push(item.damage);
        if (item.equipped) bits.push('angelegt');
        if (item.attuned) bits.push('eingestimmt');
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
      if (kind !== 'spells' && kind !== 'attacks' && kind !== 'features' && kind !== 'items') return;
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
      if (title) {
        title.textContent = found.item.name || (
          kind === 'spells' ? 'Zauber' :
          kind === 'features' ? 'Merkmal' :
          kind === 'items' ? 'Gegenstand' : 'Angriff'
        );
      }
      if (meta) meta.textContent = dndActionMetaLine(kind, found.item);
      const canEdit = canEditOwnerSheet(found.owner);
      if (ta) {
        ta.value = String(found.item.text || '');
        ta.placeholder = kind === 'items' ? 'Wirkung / Beschreibung…' : 'Was tut diese Aktion?';
        ta.readOnly = !canEdit;
      }
      if (save) save.classList.toggle('hidden', !canEdit);
      const cast = document.getElementById('dndActionCast');
      if (cast) {
        if (canEdit && kind === 'spells' && dndSpellLevelNum(found.item.level) >= 1) {
          cast.textContent = 'Wirken';
          cast.classList.remove('hidden');
        } else if (canEdit && kind === 'items' && dndItemIsUsable(found.item)) {
          cast.textContent = 'Nutzen';
          cast.classList.remove('hidden');
        } else {
          cast.classList.add('hidden');
        }
      }
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
          ? '<div class="dnd-spell-cols"><span></span><span>Zauber</span><span>Zeit</span><span>Reichweite</span><span>Treffer/SG</span><span>Schaden</span><span></span><span></span><span></span><span></span></div>'
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
      renderDndInventory();
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
      if (tab === 'actions' || tab === 'features' || tab === 'spells' || tab === 'inventory') renderDndLists();
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
      if (dndState.tab === 'inventory') refreshDndInvSummary();
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
      if (kind === 'items') {
        dndInvFilter = 'all';
        const id = combatNewId('i');
        dndState.items.push(normalizeDndItem({
          id: id, name: '', qty: '1', weight: '',
          category: 'other', container: 'backpack', equipped: false, attuned: false, notes: ''
        }));
        dndItemEditId = id;
      }
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
      const needsSpellSlots = ensureCasterSpellSlots(playerAccounts);
      if ((needsCloudRename || hadUdo || needsBjoernExtras || needsVeyrSheet || needsSpellSlots) && db && !sheetDirty && !veyrEntryEditing) {
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
      ensureCasterSpellSlots(playerAccounts);
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
      if (currentPage === 'dungeon') {
        if (typeof dungeonFocusTokenId !== 'undefined') dungeonFocusTokenId = '';
        if (typeof renderDungeon === 'function') renderDungeon();
      }
    }

    function setPlayerFormMode(mode) {
      playerFormMode = mode === 'register' ? 'register' : 'login';
      const register = playerFormMode === 'register';
      document.getElementById('playerFormTitle').textContent = register ? 'Registrieren' : 'Spieler-Zugang';
      const formHint = document.getElementById('playerFormHint');
      if (formHint) {
        formHint.textContent = '';
        formHint.classList.add('hidden');
      }
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
      if (isDM && typeof setDM === 'function') setDM(false);
      setPlayer(id);
    }

    function loginPlayer(name, password) {
      const id = accountIdFromLoginName(name);
      const acc = playerAccounts[id];
      if (!acc || acc.password !== encodeSecret(password)) throw new Error('Name oder Passwort stimmt nicht.');
      if (isDM && typeof setDM === 'function') setDM(false);
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
      document.getElementById('charBlurb').classList.add('hidden');
      document.getElementById('charBlurb').textContent = '';
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
        if (!sheetDirty) {
          const box = document.getElementById('dmNotesContent');
          if (box) box.innerHTML = sanitizeHtml(dmNotes);
        }
        return;
      }
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
