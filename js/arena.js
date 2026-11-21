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

    function arenaNewId(prefix) {
      return (prefix || 'a') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function arenaDemoCombatants() {
      return [
        { id: arenaNewId('pc'), name: 'Nemeia', kind: 'pc', init: 18, hp: 42, hpMax: 48, ac: 16, notes: 'Demo-Kämpfer' },
        { id: arenaNewId('pc'), name: 'Lucan', kind: 'pc', init: 14, hp: 55, hpMax: 55, ac: 18, notes: 'Demo-Kämpfer' },
        { id: arenaNewId('en'), name: 'Hill Giant', kind: 'enemy', init: 11, hp: 105, hpMax: 105, ac: 13, notes: 'Demo-Gegner · CR 5' }
      ].sort((a, b) => b.init - a.init || a.name.localeCompare(b.name, 'de'));
    }

    function resetArena(keepDemo) {
      arena.started = false;
      arena.round = 0;
      arena.turn = 0;
      arena.selectedId = '';
      arena.combatants = keepDemo === false ? [] : arenaDemoCombatants();
      arena.log = keepDemo === false ? [] : ['Arena bereit — Demo-Kämpfer geladen.'];
    }

    function arenaActiveCombatant() {
      if (!arena.combatants.length) return null;
      if (!arena.started) {
        return arena.combatants.find(c => c.id === arena.selectedId) || arena.combatants[0] || null;
      }
      const idx = ((arena.turn % arena.combatants.length) + arena.combatants.length) % arena.combatants.length;
      return arena.combatants[idx] || null;
    }

    function arenaPushLog(msg) {
      arena.log.unshift(String(msg || '').trim());
      if (arena.log.length > 40) arena.log.length = 40;
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
      const active = arenaActiveCombatant();
      arena.combatants.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'arena-init-item' + (active && active.id === c.id ? ' active' : '');
        btn.innerHTML =
          '<span class="arena-init-name"></span>' +
          '<span class="arena-init-meta"></span>';
        btn.querySelector('.arena-init-name').textContent = c.name;
        btn.querySelector('.arena-init-meta').textContent =
          'Init ' + c.init + ' · ' + c.hp + '/' + c.hpMax + ' TP';
        btn.onclick = () => {
          arena.selectedId = c.id;
          if (!arena.started) renderArena();
          else {
            const idx = arena.combatants.findIndex(x => x.id === c.id);
            if (idx >= 0) {
              arena.turn = idx;
              renderArena();
            }
          }
        };
        list.appendChild(btn);
      });
    }

    function renderArenaDetail() {
      const box = document.getElementById('arenaDetail');
      if (!box) return;
      const c = arenaActiveCombatant();
      if (!c) {
        box.innerHTML = '<p class="arena-empty">Noch kein aktiver Kämpfer.</p>';
        return;
      }
      box.innerHTML =
        '<div class="arena-detail-head">' +
          '<h2></h2>' +
          '<span class="arena-pill"></span>' +
        '</div>' +
        '<div class="arena-stat-grid">' +
          '<div><span>Initiative</span><strong data-k="init"></strong></div>' +
          '<div><span>Rüstungsklasse</span><strong data-k="ac"></strong></div>' +
          '<div><span>Trefferpunkte</span><strong data-k="hp"></strong></div>' +
        '</div>' +
        '<p class="arena-notes"></p>';
      box.querySelector('h2').textContent = c.name;
      box.querySelector('.arena-pill').textContent = c.kind === 'pc' ? 'Spieler' : 'Gegner';
      box.querySelector('[data-k="init"]').textContent = String(c.init);
      box.querySelector('[data-k="ac"]').textContent = String(c.ac);
      box.querySelector('[data-k="hp"]').textContent = c.hp + ' / ' + c.hpMax;
      box.querySelector('.arena-notes').textContent = c.notes || '';
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
      renderArenaDetail();
      renderArenaLog();
    }

    function arenaStart() {
      if (!arena.combatants.length) {
        toast('Keine Kämpfer in der Arena.');
        return;
      }
      arena.combatants.sort((a, b) => b.init - a.init || a.name.localeCompare(b.name, 'de'));
      arena.started = true;
      arena.round = 1;
      arena.turn = 0;
      arena.selectedId = arena.combatants[0].id;
      arenaPushLog('Kampf gestartet — ' + arena.combatants[0].name + ' ist dran.');
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
      const active = arenaActiveCombatant();
      if (active) {
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
      if (startBtn) startBtn.onclick = () => arenaStart();
      if (nextBtn) nextBtn.onclick = () => arenaNext();
      if (endBtn) endBtn.onclick = () => arenaEnd();
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
