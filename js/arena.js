/* Thalarion – Arena (kartenloser Kampfmodus) */

    var arena = {
      started: false,
      round: 0,
      turn: 0,
      selectedId: '',
      combatants: [],
      log: []
    };
    var arenaBound = false;
    var ARENA_COND_PRESETS = [
      'Blinded', 'Charmed', 'Frightened', 'Grappled', 'Incapacitated',
      'Invisible', 'Paralyzed', 'Poisoned', 'Prone', 'Restrained',
      'Stunned', 'Unconscious', 'Concentration'
    ];

    function arenaNewId(prefix) {
      return (prefix || 'a') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function arenaNormalizeCombatant(raw) {
      const c = raw && typeof raw === 'object' ? raw : {};
      const attacks = Array.isArray(c.attacks)
        ? c.attacks.map(a => ({
            id: a.id || arenaNewId('atk'),
            name: String(a.name || '').trim(),
            bonus: String(a.bonus || '').trim(),
            damage: String(a.damage || '').trim(),
            range: String(a.range || '').trim(),
            notes: String(a.notes || a.text || '').trim()
          })).filter(a => a.name)
        : [];
      const conditions = Array.isArray(c.conditions)
        ? c.conditions.map(x => ({
            id: x.id || arenaNewId('cd'),
            name: String(x.name || '').trim(),
            rounds: Math.max(0, Math.floor(Number(x.rounds) || 0))
          })).filter(x => x.name)
        : [];
      return {
        id: c.id || arenaNewId('f'),
        name: String(c.name || 'Kämpfer').trim() || 'Kämpfer',
        kind: c.kind === 'pc' ? 'pc' : 'enemy',
        ownerId: String(c.ownerId || ''),
        init: Number(c.init) || 0,
        hp: Math.max(0, Number(c.hp) || 0),
        hpMax: Math.max(1, Number(c.hpMax) || 1),
        hpTemp: Math.max(0, Number(c.hpTemp) || 0),
        ac: Number(c.ac) || 10,
        notes: String(c.notes || ''),
        attacks: attacks,
        conditions: conditions
      };
    }

    function arenaDemoCombatants() {
      return [
        arenaNormalizeCombatant({
          name: 'Nemeia', kind: 'pc', init: 18, hp: 42, hpMax: 48, ac: 16, notes: 'Demo-Kämpfer',
          attacks: [
            { name: 'Oathbow', bonus: '+9', damage: '1d8+4', range: '150/600', notes: 'Ranged' },
            { name: 'Shortsword', bonus: '+7', damage: '1d6+4', range: '5 ft.', notes: 'Vex' }
          ]
        }),
        arenaNormalizeCombatant({
          name: 'Lucan', kind: 'pc', init: 14, hp: 55, hpMax: 55, ac: 18, notes: 'Demo-Kämpfer',
          attacks: [
            { name: 'Longbow', bonus: '+8', damage: '1d8+4', range: '150/600', notes: 'Slow' },
            { name: 'Shortsword', bonus: '+7', damage: '1d6+4', range: '5 ft.', notes: 'Vex' }
          ]
        }),
        arenaNormalizeCombatant({
          name: 'Hill Giant', kind: 'enemy', init: 11, hp: 105, hpMax: 105, ac: 13, notes: 'Demo-Gegner · CR 5',
          attacks: [
            { name: 'Greatclub', bonus: '+8', damage: '3d8+5', range: '10 ft.', notes: 'Melee' },
            { name: 'Rock', bonus: '+8', damage: '3d10+5', range: '60/240', notes: 'Ranged' }
          ]
        })
      ].sort((a, b) => b.init - a.init || a.name.localeCompare(b.name, 'de'));
    }

    function arenaClampHp(c) {
      if (!c) return;
      c.hpMax = Math.max(1, Number(c.hpMax) || 1);
      c.hp = Math.max(0, Math.min(c.hpMax, Number(c.hp) || 0));
      c.hpTemp = Math.max(0, Number(c.hpTemp) || 0);
    }

    function arenaApplyDamage(c, amount) {
      let dmg = Math.max(0, Math.floor(Number(amount) || 0));
      if (!c || !dmg) return 0;
      arenaClampHp(c);
      const fromTemp = Math.min(c.hpTemp, dmg);
      c.hpTemp -= fromTemp;
      dmg -= fromTemp;
      const fromHp = Math.min(c.hp, dmg);
      c.hp -= fromHp;
      return fromTemp + fromHp;
    }

    function arenaApplyHeal(c, amount) {
      const heal = Math.max(0, Math.floor(Number(amount) || 0));
      if (!c || !heal) return 0;
      arenaClampHp(c);
      const before = c.hp;
      c.hp = Math.min(c.hpMax, c.hp + heal);
      return c.hp - before;
    }

    function arenaAdjustHp(c, delta) {
      if (!c) return;
      const n = Math.floor(Number(delta) || 0);
      if (!n) return;
      if (n < 0) {
        const taken = arenaApplyDamage(c, -n);
        if (taken) {
          arenaPushLog(c.name + ' nimmt ' + taken + ' Schaden → ' + c.hp + '/' + c.hpMax +
            (c.hpTemp ? ' (+' + c.hpTemp + ' temp)' : '') + ' TP');
        }
      } else {
        const got = arenaApplyHeal(c, n);
        if (got) arenaPushLog(c.name + ' heilt ' + got + ' → ' + c.hp + '/' + c.hpMax + ' TP');
      }
      renderArena();
    }

    function arenaSetTempHp(c, amount) {
      if (!c) return;
      c.hpTemp = Math.max(0, Math.floor(Number(amount) || 0));
      arenaPushLog(c.name + ': Temp-TP = ' + c.hpTemp);
      renderArena();
    }

    function arenaAttacksFromDnd(dnd) {
      const out = [];
      (dnd && dnd.attacks || []).forEach(a => {
        const name = String(a.name || '').trim();
        if (!name) return;
        out.push({
          id: a.id || arenaNewId('atk'),
          name: name,
          bonus: String(a.bonus || a.hit || '').trim(),
          damage: String(a.damage || '').trim(),
          range: String(a.range || '').trim(),
          notes: String(a.notes || a.text || '').trim()
        });
      });
      return out;
    }

    function arenaCombatantFromOwner(ownerId, kind) {
      if (typeof sheetOwnerRecord !== 'function') return null;
      const rec = sheetOwnerRecord(ownerId);
      if (!rec) return null;
      const sheet = rec.sheet || {};
      const dnd = sheet.dnd || {};
      let hp = 10;
      let hpMax = 10;
      let hpTemp = 0;
      let ac = 10;
      if (typeof combatHpFromOwner === 'function') {
        const h = combatHpFromOwner(ownerId);
        hp = h.hp;
        hpMax = h.hpMax || h.hp || 10;
        hpTemp = h.tempHp || 0;
        ac = Number(h.ac) || Number(sheet.armor) || 10;
      } else {
        const cur = Number(dnd.hpCurrent);
        const max = Number(dnd.hpMax);
        if (Number.isFinite(cur) || Number.isFinite(max)) {
          hp = Number.isFinite(cur) ? Math.max(0, cur) : (Number.isFinite(max) ? max : 10);
          hpMax = Number.isFinite(max) ? Math.max(1, max) : Math.max(1, hp);
          hpTemp = Math.max(0, Number(dnd.hpTemp) || 0);
        }
        ac = Number(dnd.ac) || Number(sheet.armor) || 10;
      }
      return arenaNormalizeCombatant({
        name: sheet.name || rec.name || 'Kämpfer',
        kind: kind || (rec.isMonster || rec.isNpc ? 'enemy' : 'pc'),
        ownerId: ownerId,
        init: 0,
        hp: hp,
        hpMax: hpMax,
        hpTemp: hpTemp,
        ac: ac,
        notes: String(dnd.volk || sheet.volk || ''),
        attacks: arenaAttacksFromDnd(dnd)
      });
    }

    function resetArena(keepDemo) {
      arena.started = false;
      arena.round = 0;
      arena.turn = 0;
      arena.selectedId = '';
      arena.combatants = keepDemo === false ? [] : arenaDemoCombatants();
      arena.log = keepDemo === false ? [] : ['Arena bereit — Demo-Kämpfer geladen.'];
      if (arena.combatants[0]) arena.selectedId = arena.combatants[0].id;
    }

    function arenaTurnCombatant() {
      if (!arena.started || !arena.combatants.length) return null;
      const idx = ((arena.turn % arena.combatants.length) + arena.combatants.length) % arena.combatants.length;
      return arena.combatants[idx] || null;
    }

    function arenaFocusCombatant() {
      if (arena.selectedId) {
        const sel = arena.combatants.find(c => c.id === arena.selectedId);
        if (sel) return sel;
      }
      return arenaTurnCombatant() || arena.combatants[0] || null;
    }

    function arenaPushLog(msg) {
      const line = String(msg || '').trim();
      if (!line) return;
      arena.log.unshift(line);
      if (arena.log.length > 60) arena.log.length = 60;
    }

    function arenaSortCombatants() {
      const focusId = arena.selectedId;
      const turnId = arenaTurnCombatant() && arenaTurnCombatant().id;
      arena.combatants.sort((a, b) => b.init - a.init || a.name.localeCompare(b.name, 'de'));
      if (arena.started && turnId) {
        const idx = arena.combatants.findIndex(c => c.id === turnId);
        if (idx >= 0) arena.turn = idx;
      }
      if (focusId && arena.combatants.some(c => c.id === focusId)) arena.selectedId = focusId;
    }

    function arenaTickConditions(c) {
      if (!c || !Array.isArray(c.conditions) || !c.conditions.length) return;
      const kept = [];
      c.conditions.forEach(cond => {
        const next = Math.max(0, Math.floor(Number(cond.rounds) || 0) - 1);
        if (next <= 0) {
          arenaPushLog(c.name + ': ' + cond.name + ' endet.');
        } else {
          kept.push({ id: cond.id, name: cond.name, rounds: next });
        }
      });
      c.conditions = kept;
    }

    function arenaAddCondition(c, name, rounds) {
      if (!c) return;
      const label = String(name || '').trim();
      if (!label) {
        toast('Bedingungsname eingeben.');
        return;
      }
      const n = Math.max(1, Math.floor(Number(rounds) || 1));
      const existing = (c.conditions || []).find(x => x.name.toLowerCase() === label.toLowerCase());
      if (existing) {
        existing.rounds = Math.max(existing.rounds, n);
        arenaPushLog(c.name + ': ' + existing.name + ' → ' + existing.rounds + ' Rd.');
      } else {
        c.conditions.push({ id: arenaNewId('cd'), name: label, rounds: n });
        arenaPushLog(c.name + ': ' + label + ' (' + n + ' Rd.)');
      }
      renderArena();
    }

    function arenaRemoveCondition(c, condId) {
      if (!c) return;
      const hit = (c.conditions || []).find(x => x.id === condId);
      c.conditions = (c.conditions || []).filter(x => x.id !== condId);
      if (hit) arenaPushLog(c.name + ': ' + hit.name + ' entfernt.');
      renderArena();
    }

    function arenaAddCombatant(raw, quiet) {
      const c = arenaNormalizeCombatant(raw);
      arenaClampHp(c);
      arena.combatants.push(c);
      arenaSortCombatants();
      arena.selectedId = c.id;
      if (!quiet) arenaPushLog(c.name + ' tritt bei (Init ' + c.init + ').');
      renderArena();
      return c;
    }

    function arenaRemoveCombatant(id) {
      const idx = arena.combatants.findIndex(c => c.id === id);
      if (idx < 0) return;
      const [gone] = arena.combatants.splice(idx, 1);
      if (arena.selectedId === id) arena.selectedId = '';
      if (arena.started) {
        if (!arena.combatants.length) {
          arena.started = false;
          arena.round = 0;
          arena.turn = 0;
        } else if (arena.turn >= arena.combatants.length) {
          arena.turn = 0;
          arena.round += 1;
        }
      }
      arenaPushLog((gone && gone.name || 'Kämpfer') + ' entfernt.');
      if (!arena.selectedId && arena.combatants[0]) arena.selectedId = arena.combatants[0].id;
      renderArena();
    }

    function arenaAddBlank() {
      const nameEl = document.getElementById('arenaAddName');
      const initEl = document.getElementById('arenaAddInit');
      const hpEl = document.getElementById('arenaAddHp');
      const acEl = document.getElementById('arenaAddAc');
      const name = String(nameEl && nameEl.value || '').trim() || 'Gegner';
      const init = Number(initEl && initEl.value);
      const hp = Math.max(1, Math.floor(Number(hpEl && hpEl.value) || 10));
      const ac = Math.max(0, Math.floor(Number(acEl && acEl.value) || 10));
      arenaAddCombatant({
        name: name,
        kind: 'enemy',
        init: Number.isFinite(init) ? init : 0,
        hp: hp,
        hpMax: hp,
        ac: ac,
        notes: 'Manuell'
      });
      if (nameEl) nameEl.value = '';
      if (initEl) initEl.value = '';
      if (hpEl) hpEl.value = '';
      if (acEl) acEl.value = '';
    }

    function arenaAddFromOwner(ownerId, kind) {
      if (arena.combatants.some(c => c.ownerId === ownerId)) {
        toast('Bereits in der Arena.');
        return;
      }
      const c = arenaCombatantFromOwner(ownerId, kind);
      if (!c) {
        toast('Kämpfer nicht gefunden.');
        return;
      }
      arenaAddCombatant(c);
      toast(c.name + ' übernommen — Initiative ggf. anpassen.');
    }

    function arenaUseAttack(c, atk) {
      if (!c || !atk) return;
      const bits = [c.name + ' greift an: ' + atk.name];
      if (atk.bonus) bits.push('Treffer ' + atk.bonus);
      if (atk.damage) bits.push('Schaden ' + atk.damage);
      if (atk.range) bits.push(atk.range);
      if (atk.notes) bits.push(atk.notes);
      arenaPushLog(bits.join(' · '));
      renderArenaLog();
      toast(atk.name + (atk.bonus ? ' ' + atk.bonus : '') + (atk.damage ? ' · ' + atk.damage : ''));
    }

    function renderArenaRound() {
      const el = document.getElementById('arenaRound');
      if (!el) return;
      if (!arena.started) el.textContent = 'Aufbau';
      else el.textContent = 'Runde ' + Math.max(1, arena.round);
    }

    function renderArenaTools() {
      const startBtn = document.getElementById('arenaStartBtn');
      const nextBtn = document.getElementById('arenaNextBtn');
      const endBtn = document.getElementById('arenaEndBtn');
      if (startBtn) startBtn.classList.toggle('hidden', !!arena.started);
      if (nextBtn) nextBtn.classList.toggle('hidden', !arena.started);
      if (endBtn) endBtn.disabled = !arena.combatants.length;
    }

    function renderArenaInitList() {
      const list = document.getElementById('arenaInitList');
      if (!list) return;
      list.innerHTML = '';
      if (!arena.combatants.length) {
        const empty = document.createElement('p');
        empty.className = 'arena-empty';
        empty.textContent = 'Keine Kämpfer.';
        list.appendChild(empty);
        return;
      }
      const focus = arenaFocusCombatant();
      const turn = arenaTurnCombatant();
      arena.combatants.forEach(c => {
        arenaClampHp(c);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'arena-init-item' +
          (focus && focus.id === c.id ? ' active' : '') +
          (turn && turn.id === c.id ? ' is-turn' : '');
        const condTxt = (c.conditions || []).map(x => x.name + ' ' + x.rounds).join(', ');
        btn.innerHTML =
          '<span class="arena-init-name"></span>' +
          '<span class="arena-init-meta"></span>' +
          (condTxt ? '<span class="arena-init-conds"></span>' : '');
        btn.querySelector('.arena-init-name').textContent = c.name;
        btn.querySelector('.arena-init-meta').textContent =
          'Init ' + c.init + ' · ' + c.hp + '/' + c.hpMax +
          (c.hpTemp ? ' (+' + c.hpTemp + ')' : '') + ' TP';
        if (condTxt) btn.querySelector('.arena-init-conds').textContent = condTxt;
        btn.onclick = () => {
          arena.selectedId = c.id;
          renderArena();
        };
        list.appendChild(btn);
      });
    }

    function renderArenaAddLists() {
      const playerBox = document.getElementById('arenaPlayerList');
      const monsterBox = document.getElementById('arenaMonsterList');
      if (playerBox) {
        playerBox.innerHTML = '';
        const owners = [];
        Object.keys(playerAccounts || {}).sort((a, b) =>
          (playerAccounts[a].name || '').localeCompare(playerAccounts[b].name || '', 'de')
        ).forEach(id => {
          owners.push(id);
          if (id === YUVI_ID && playerAccounts[id] && playerAccounts[id].alts && playerAccounts[id].alts[VEYR_ALT]) {
            owners.push(VEYR_OWNER);
          }
        });
        if (!owners.length) {
          playerBox.innerHTML = '<p class="arena-empty">Keine Charaktere.</p>';
        } else {
          owners.forEach(ownerId => {
            const rec = typeof sheetOwnerRecord === 'function' ? sheetOwnerRecord(ownerId) : null;
            if (!rec) return;
            const inArena = arena.combatants.some(c => c.ownerId === ownerId);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ghost arena-pick-btn';
            btn.textContent = rec.name + (inArena ? ' ✓' : '');
            btn.disabled = inArena;
            btn.onclick = () => arenaAddFromOwner(ownerId, 'pc');
            playerBox.appendChild(btn);
          });
        }
      }
      if (monsterBox) {
        monsterBox.innerHTML = '';
        const ids = Object.keys(monsterAccounts || {}).sort((a, b) =>
          (monsterAccounts[a].name || '').localeCompare(monsterAccounts[b].name || '', 'de')
        );
        if (!ids.length) {
          monsterBox.innerHTML = '<p class="arena-empty">Keine Monster.</p>';
        } else {
          ids.forEach(id => {
            const ownerId = MONSTER_PREFIX + id;
            const mon = monsterAccounts[id];
            const inArena = arena.combatants.some(c => c.ownerId === ownerId);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ghost arena-pick-btn';
            btn.textContent = (mon && mon.name || 'Monster') + (inArena ? ' ✓' : '');
            btn.disabled = inArena;
            btn.onclick = () => arenaAddFromOwner(ownerId, 'enemy');
            monsterBox.appendChild(btn);
          });
        }
      }
    }

    function renderArenaDetail() {
      const box = document.getElementById('arenaDetail');
      if (!box) return;
      const c = arenaFocusCombatant();
      if (!c) {
        box.innerHTML = '<p class="arena-empty">Noch kein aktiver Kämpfer.</p>';
        return;
      }
      arenaClampHp(c);
      if (!Array.isArray(c.conditions)) c.conditions = [];
      if (!Array.isArray(c.attacks)) c.attacks = [];

      box.innerHTML =
        '<div class="arena-detail-head">' +
          '<h2></h2>' +
          '<span class="arena-pill"></span>' +
        '</div>' +
        '<div class="arena-stat-grid">' +
          '<div><span>Initiative</span><input data-arena-field="init" type="number" step="1" /></div>' +
          '<div><span>Rüstungsklasse</span><input data-arena-field="ac" type="number" min="0" step="1" /></div>' +
          '<div><span>Trefferpunkte</span><strong data-k="hp"></strong></div>' +
        '</div>' +
        '<div class="arena-hp-panel">' +
          '<div class="arena-hp-quick">' +
            '<button type="button" class="ghost" data-arena-hp="-1">−1</button>' +
            '<button type="button" class="ghost" data-arena-hp="1">+1</button>' +
            '<button type="button" class="ghost" data-arena-hp="-5">−5</button>' +
            '<button type="button" class="ghost" data-arena-hp="5">+5</button>' +
          '</div>' +
          '<div class="arena-hp-row">' +
            '<input id="arenaHpAmount" type="number" min="0" step="1" placeholder="Wert" inputmode="numeric" />' +
            '<button type="button" class="primary" id="arenaDmgBtn">Schaden</button>' +
            '<button type="button" class="ghost" id="arenaHealBtn">Heilen</button>' +
            '<button type="button" class="ghost" id="arenaTempBtn">Temp-TP</button>' +
          '</div>' +
        '</div>' +
        '<div class="arena-section">' +
          '<div class="arena-section-head">Bedingungen</div>' +
          '<div class="arena-cond-list" id="arenaCondList"></div>' +
          '<div class="arena-cond-add">' +
            '<input id="arenaCondName" list="arenaCondPresets" placeholder="Bedingung" />' +
            '<datalist id="arenaCondPresets"></datalist>' +
            '<input id="arenaCondRounds" class="arena-num" type="number" min="1" value="1" placeholder="Rd." />' +
            '<button type="button" class="ghost" id="arenaCondAddBtn">Setzen</button>' +
          '</div>' +
        '</div>' +
        '<div class="arena-section">' +
          '<div class="arena-section-head">Angriffe</div>' +
          '<div class="arena-attack-list" id="arenaAttackList"></div>' +
        '</div>' +
        '<div class="arena-detail-actions">' +
          '<button type="button" class="ghost" id="arenaRemoveBtn">Entfernen</button>' +
        '</div>' +
        '<p class="arena-notes"></p>';

      box.querySelector('h2').textContent = c.name;
      box.querySelector('.arena-pill').textContent = c.kind === 'pc' ? 'Spieler' : 'Gegner';
      box.querySelector('[data-k="hp"]').textContent =
        c.hp + ' / ' + c.hpMax + (c.hpTemp ? ' (+' + c.hpTemp + ')' : '');
      box.querySelector('.arena-notes').textContent = c.notes || '';

      const initInput = box.querySelector('[data-arena-field="init"]');
      const acInput = box.querySelector('[data-arena-field="ac"]');
      if (initInput) {
        initInput.value = String(c.init);
        initInput.onchange = () => {
          c.init = Number(initInput.value) || 0;
          arenaSortCombatants();
          arenaPushLog(c.name + ': Initiative = ' + c.init);
          renderArena();
        };
      }
      if (acInput) {
        acInput.value = String(c.ac);
        acInput.onchange = () => {
          c.ac = Math.max(0, Math.floor(Number(acInput.value) || 0));
          arenaPushLog(c.name + ': RK = ' + c.ac);
          renderArena();
        };
      }

      const amountEl = box.querySelector('#arenaHpAmount');
      const readAmount = () => Math.max(0, Math.floor(Number(amountEl && amountEl.value) || 0));
      box.querySelectorAll('[data-arena-hp]').forEach(btn => {
        btn.onclick = () => arenaAdjustHp(c, Number(btn.getAttribute('data-arena-hp')));
      });
      const dmgBtn = box.querySelector('#arenaDmgBtn');
      const healBtn = box.querySelector('#arenaHealBtn');
      const tempBtn = box.querySelector('#arenaTempBtn');
      if (dmgBtn) {
        dmgBtn.onclick = () => {
          const n = readAmount();
          if (!n) return toast('Schadenswert eingeben.');
          arenaAdjustHp(c, -n);
          if (amountEl) amountEl.value = '';
        };
      }
      if (healBtn) {
        healBtn.onclick = () => {
          const n = readAmount();
          if (!n) return toast('Heilungswert eingeben.');
          arenaAdjustHp(c, n);
          if (amountEl) amountEl.value = '';
        };
      }
      if (tempBtn) {
        tempBtn.onclick = () => {
          arenaSetTempHp(c, readAmount());
          if (amountEl) amountEl.value = '';
        };
      }
      if (amountEl) {
        amountEl.addEventListener('keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          if (dmgBtn) dmgBtn.click();
        });
      }

      const condList = box.querySelector('#arenaCondList');
      if (condList) {
        if (!c.conditions.length) {
          condList.innerHTML = '<p class="arena-empty">Keine Bedingungen.</p>';
        } else {
          c.conditions.forEach(cond => {
            const row = document.createElement('div');
            row.className = 'arena-cond-row';
            row.innerHTML = '<span></span><button type="button" class="ghost" title="Entfernen">×</button>';
            row.querySelector('span').textContent = cond.name + ' · ' + cond.rounds + ' Rd.';
            row.querySelector('button').onclick = () => arenaRemoveCondition(c, cond.id);
            condList.appendChild(row);
          });
        }
      }
      const presetList = box.querySelector('#arenaCondPresets');
      if (presetList) {
        presetList.innerHTML = ARENA_COND_PRESETS.map(n => '<option value="' + n.replace(/"/g, '&quot;') + '"></option>').join('');
      }
      const condAddBtn = box.querySelector('#arenaCondAddBtn');
      const condNameEl = box.querySelector('#arenaCondName');
      const condRoundsEl = box.querySelector('#arenaCondRounds');
      if (condAddBtn) {
        condAddBtn.onclick = () => {
          arenaAddCondition(c, condNameEl && condNameEl.value, condRoundsEl && condRoundsEl.value);
          if (condNameEl) condNameEl.value = '';
          if (condRoundsEl) condRoundsEl.value = '1';
        };
      }

      const atkList = box.querySelector('#arenaAttackList');
      if (atkList) {
        if (!c.attacks.length) {
          atkList.innerHTML = '<p class="arena-empty">Keine Angriffe hinterlegt.</p>';
        } else {
          c.attacks.forEach(atk => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'arena-attack-btn';
            btn.innerHTML = '<strong></strong><span></span>';
            btn.querySelector('strong').textContent = atk.name;
            const meta = [atk.bonus, atk.damage, atk.range].filter(Boolean).join(' · ');
            btn.querySelector('span').textContent = meta || atk.notes || 'Angriff';
            btn.title = atk.notes || atk.name;
            btn.onclick = () => arenaUseAttack(c, atk);
            atkList.appendChild(btn);
          });
        }
      }

      const removeBtn = box.querySelector('#arenaRemoveBtn');
      if (removeBtn) removeBtn.onclick = () => arenaRemoveCombatant(c.id);
    }

    function renderArenaLog() {
      const log = document.getElementById('arenaLog');
      if (!log) return;
      log.innerHTML = '';
      if (!arena.log.length) {
        const empty = document.createElement('p');
        empty.className = 'arena-empty';
        empty.textContent = 'Noch keine Ereignisse.';
        log.appendChild(empty);
        return;
      }
      arena.log.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        log.appendChild(p);
      });
    }

    function renderArena() {
      const view = document.getElementById('arenaView');
      if (!view || view.classList.contains('hidden')) return;
      renderArenaRound();
      renderArenaTools();
      renderArenaInitList();
      renderArenaAddLists();
      renderArenaDetail();
      renderArenaLog();
    }

    function arenaStart() {
      if (!arena.combatants.length) {
        toast('Keine Kämpfer in der Arena.');
        return;
      }
      arenaSortCombatants();
      arena.started = true;
      arena.round = 1;
      arena.turn = 0;
      const first = arena.combatants[0];
      arena.selectedId = first.id;
      arenaPushLog('Kampf gestartet — ' + first.name + ' ist dran.');
      renderArena();
    }

    function arenaNext() {
      if (!arena.started || !arena.combatants.length) return;
      arena.turn += 1;
      if (arena.turn >= arena.combatants.length) {
        arena.turn = 0;
        arena.round += 1;
        arenaPushLog('Runde ' + arena.round + ' beginnt.');
      }
      const active = arenaTurnCombatant();
      if (active) {
        arenaTickConditions(active);
        arena.selectedId = active.id;
        arenaPushLog(active.name + ' ist dran.');
      }
      renderArena();
    }

    function arenaEnd() {
      arena.started = false;
      arena.round = 0;
      arena.turn = 0;
      arenaPushLog('Kampf beendet.');
      renderArena();
    }

    function bindArenaUi() {
      if (arenaBound) return;
      arenaBound = true;
      const startBtn = document.getElementById('arenaStartBtn');
      const nextBtn = document.getElementById('arenaNextBtn');
      const endBtn = document.getElementById('arenaEndBtn');
      const addBlank = document.getElementById('arenaAddBlankBtn');
      if (startBtn) startBtn.onclick = () => arenaStart();
      if (nextBtn) nextBtn.onclick = () => arenaNext();
      if (endBtn) endBtn.onclick = () => arenaEnd();
      if (addBlank) addBlank.onclick = () => arenaAddBlank();
    }

    function showArena() {
      if (!confirmLeaveEditor()) return;
      if (!isDM) {
        toast('Arena ist vorerst nur für den DM.');
        showMap();
        return;
      }
      dirty = false;
      sheetDirty = false;
      openedFromMap = false;
      if (!arena.combatants.length) resetArena(true);
      bindArenaUi();
      showPage('arena');
      currentIndex = null;
      currentTitle = null;
      renderArena();
      persistView();
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
    }

    resetArena(true);
