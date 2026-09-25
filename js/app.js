    function persistView() {
      try {
        const wrap = document.getElementById('mapWrap');
        sessionStorage.setItem(VIEW_KEY, JSON.stringify({
          page: currentPage,
          title: currentTitle || '',
          cat: selectedHomeCat || '',
          sheet: currentSheetOwner || '',
          map: wrap ? {
            scale: mapScale,
            panX: mapPanX,
            panY: mapPanY,
            sl: wrap.scrollLeft,
            st: wrap.scrollTop
          } : mapViewMemo
        }));
      } catch (err) {}
    }

    function showPage(page) {
      if (currentPage === 'dungeon' && page !== 'dungeon') {
        if (typeof cancelDungeonPlace === 'function') cancelDungeonPlace();
        if (typeof closeDungeonMenus === 'function') closeDungeonMenus();
      }
      if (currentPage === 'map' && page !== 'map') captureMapView();
      currentPage = page;
      persistView();
      const chronikOn = page === 'chronik' || page === 'entstehung' || page === 'sitzung';
      const codexOn = page === 'codex' || page === 'bestiarium' || page === 'glossar' || page === 'world';
      if (els.navChronik) els.navChronik.classList.toggle('active', chronikOn);
      if (els.navCodex) els.navCodex.classList.toggle('active', codexOn);
      if (els.dmMenuSitzung) els.dmMenuSitzung.classList.toggle('active', page === 'sitzung');
      els.navMap.classList.toggle('active', page === 'map');
      els.navCharakter.classList.toggle('active', page === 'char');
      els.navKampf.classList.toggle('active', page === 'kampf');
      if (els.navDungeon) els.navDungeon.classList.toggle('active', page === 'dungeon');
      els.mapView.classList.toggle('hidden', page !== 'map');
      if (page !== 'map') setMapFullscreen(false);
      els.charView.classList.toggle('hidden', page !== 'char');
      els.kampfView.classList.toggle('hidden', page !== 'kampf');
      if (els.dungeonView) els.dungeonView.classList.toggle('hidden', page !== 'dungeon');
      if (page !== 'kampf') closeStatSheetOverlay();
      updateSidebarVisibility(page);
      if (page === 'map' || page === 'char' || page === 'kampf' || page === 'dungeon') {
        els.homeView.classList.add('hidden');
        els.viewer.classList.add('hidden');
        els.editorView.classList.add('hidden');
        els.entstehungView.classList.add('hidden');
        els.sitzungView.classList.add('hidden');
      }
      updateExtraToolbars();
    }

    function showDungeon() {
      if (!confirmLeaveEditor()) return;
      openedFromMap = false;
      selectedHomeCat = null;
      showPage('dungeon');
      currentIndex = null;
      currentTitle = null;
      updateExtraToolbars();
      renderDungeon();
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
    }

    function updateHomeHero(page) {
      if (page === 'codex') {
        applyCodexSectionHero();
        return;
      }
      const hero = PAGE_HERO[page] || PAGE_HERO.codex;
      const seal = document.getElementById('homeSeal');
      if (seal) {
        seal.innerHTML = '';
        seal.textContent = hero.seal;
      }
      document.getElementById('homeTitle').textContent = hero.title;
      const blurb = document.getElementById('homeBlurb');
      if (blurb) {
        blurb.textContent = '';
        blurb.classList.add('hidden');
      }
    }

    function confirmLeaveEditor() {
      if (dirty && isDM && !els.editorView.classList.contains('hidden')) {
        if (!confirm('Du hast ungespeicherte Änderungen. Wirklich verlassen?')) return false;
        dirty = false;
      }
      if (sheetDirty && !els.charView.classList.contains('hidden')) {
        if (!confirm('Das Charakterblatt ist nicht gespeichert. Wirklich verlassen?')) return false;
        sheetDirty = false;
      }
      return true;
    }

    function setDM(on) {
      if (!on && isDM && !confirmLeaveEditor()) return;
      if (!on && isDM && sheetDirty && els.charView && !els.charView.classList.contains('hidden')) {
        if (!confirm('Ungespeicherte Charakter- oder DM-Notizen. Trotzdem abmelden?')) return;
        sheetDirty = false;
      }
      isDM = on;
      document.body.classList.toggle('is-dm', on);
      els.dmButton.textContent = on ? 'DM Logout' : 'DM Login';
      if (on) {
        sessionStorage.setItem(SESSION_KEY, '1');
        warmupSoundPlayers();
      } else sessionStorage.removeItem(SESSION_KEY);
      document.getElementById('mapToolbar').classList.toggle('hidden', !on);
      updateSidebarVisibility(currentPage);
      if (!on) {
        closeDmMenu();
        setPlacingPin(false);
        setDrawingBorder(false);
        if (typeof cancelDungeonPlace === 'function') cancelDungeonPlace();
        if (typeof closeDungeonMenus === 'function') closeDungeonMenus();
        stopSoundTrack();
        closeSoundDock();
        if (isDmNotesOwner(currentSheetOwner)) currentSheetOwner = currentPlayerId || null;
        if (!currentPlayerId) toggleChat(false);
        else {
          syncChatListeners();
          renderChatChrome();
        }
      } else {
        syncChatListeners();
        renderChatChrome();
      }
      renderMapPins();
      renderMapBorders();
      if (currentPage === 'dungeon') renderDungeon();
      if (!on && !els.editorView.classList.contains('hidden')) {
        if (currentIndex !== null && entries[currentIndex]?.type === STORY_CAT) showEntstehung();
        else if (currentIndex !== null && entries[currentIndex]?.type === SESSION_CAT) showSitzung();
        else if (currentIndex !== null) loadEntry(currentIndex);
        else if (isCatalogPage(currentPage)) showCatalog(currentPage);
        else if (currentPage === 'chronik') showChronik();
        else if (currentPage === 'entstehung') showEntstehung();
        else if (currentPage === 'sitzung') showSitzung();
        else if (currentPage === 'kampf') showKampf();
        else if (currentPage === 'dungeon') showDungeon();
        else if (currentPage === 'char') showCharakter();
        else if (currentPage === 'map') showMap();
        else showCodex();
      } else {
        renderHome();
        renderSidebar();
        if (!els.entstehungView.classList.contains('hidden')) renderEntstehung();
        if (!els.sitzungView.classList.contains('hidden')) renderSitzung();
        if (currentPage === 'char') renderCharakter();
        if (currentPage === 'kampf') renderKampf();
        if (currentPage === 'kampf') renderBattleBoards();
        els.playerToEdit.classList.toggle('hidden', !on || currentIndex === null || els.viewer.classList.contains('hidden'));
        updateEntryToKarteBtn();
        updateExtraToolbars();
        syncSoundUi();
      }
      if (!on) {
        cancelBattleDraw();
      }
      applyDiceToolsUi();
    }

    function openLogin() {
      els.loginError.textContent = '';
      els.dmUser.value = '';
      els.dmPassword.value = '';
      els.loginOverlay.classList.remove('hidden');
      els.dmUser.focus();
    }

    function closeLogin() {
      els.loginOverlay.classList.add('hidden');
    }

    function closeKampfBattleGear() {
      const panel = document.getElementById('kampfBattleGearPanel');
      const btn = document.getElementById('kampfBattleGearBtn');
      if (panel) panel.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function toggleKampfBattleGear() {
      const panel = document.getElementById('kampfBattleGearPanel');
      const btn = document.getElementById('kampfBattleGearBtn');
      if (!panel) return;
      const open = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindBattleTools(prefix) {
      onClick(prefix + 'BattleUploadBtn', () => {
        if (!isDM) return;
        closeKampfBattleGear();
        const input = document.getElementById('battleMapInput');
        if (input) input.click();
      });
      onClick(prefix + 'BattleGalleryBtn', () => {
        if (!isDM) return;
        openBattleGallery();
      });
      onClick(prefix + 'BattleFireBtn', () => setBattleHazardMode('fire'));
      onClick(prefix + 'BattleWaterBtn', () => setBattleHazardMode('water'));
      onClick(prefix + 'BattleOilBtn', () => setBattleHazardMode('oil'));
      onClick(prefix + 'BattleRulerBtn', () => setBattleMapTool('ruler'));
      onClick(prefix + 'BattlePingBtn', () => setBattleMapTool('ping'));
      onClick(prefix + 'BattleFogBtn', toggleBattleFog);
      onClick(prefix + 'BattleFogRevealBtn', () => setBattleMapTool('fog-reveal'));
      onClick(prefix + 'BattleFogHideBtn', () => setBattleMapTool('fog-hide'));
      onClick(prefix + 'BattleCloseBtn', closeBattleDraft);
      onClick(prefix + 'BattleCancelDrawBtn', cancelBattleDraw);
      onClick(prefix + 'BattleClearBtn', clearBattleMap);
      const sizeEl = document.getElementById(prefix + 'BattleSize');
      if (sizeEl) {
        sizeEl.addEventListener('input', () => {
          if (!isDM) return;
          battle.tokenSize = clampBattleTokenSize(sizeEl.value);
          battle.layoutAt = stampNow();
          applyBattleTokenSize();
          persistBattleSoon();
        });
        sizeEl.addEventListener('change', () => {
          if (!isDM) return;
          battle.tokenSize = clampBattleTokenSize(sizeEl.value);
          battle.layoutAt = stampNow();
          applyBattleTokenSize();
          persistBattleSoon();
        });
      }
      const gridEl = document.getElementById(prefix + 'BattleGrid');
      if (gridEl) {
        const setGrid = () => {
          if (!isDM) return;
          battle.gridSize = clampBattleGridSize(Number(gridEl.value) / 10);
          battle.gridFrac = 0;
          battle.layoutAt = stampNow();
          applyBattleGridSize();
          persistBattleSoon();
        };
        gridEl.addEventListener('input', setGrid);
        gridEl.addEventListener('change', setGrid);
      }
      const stage = document.getElementById(prefix + 'BattleStage');
      const overlay = document.getElementById(prefix + 'BattleOverlay');
      const img = document.getElementById(prefix + 'BattleImg');
      const board = document.getElementById(prefix + 'BattleBoard');
      if (overlay && stage) overlay.addEventListener('click', ev => onBattleStageClick(ev, stage));
      if (stage) {
        stage.addEventListener('pointermove', ev => {
          if (battleMapTool !== 'ruler' || !battleRulerFrom || battleRulerTo) return;
          battleRulerHover = battlePctFromEvent(stage, ev);
          renderBattleRuler();
        });
      }
      if (img) {
        img.addEventListener('load', () => {
          applyBattleGridSize();
          applyBattleTransform();
        });
      }
      if (stage && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (battleTokenDrag) return;
          applyBattleGridSize();
          applyBattleTransform();
          renderBattleFog();
        });
        ro.observe(stage);
      }
      bindBattleZoom(board, stage);
      onClick(prefix + 'BattleZoomIn', () => zoomBattleBy(0.35));
      onClick(prefix + 'BattleZoomOut', () => zoomBattleBy(-0.35));
      onClick(prefix + 'BattleZoomReset', resetBattleView);
      onClick(prefix + 'BattleGearBtn', ev => {
        ev.stopPropagation();
        toggleKampfBattleGear();
      });
      document.addEventListener('click', ev => {
        const wrap = document.getElementById('kampfBattleGear');
        if (!wrap || wrap.contains(ev.target)) return;
        closeKampfBattleGear();
      });
    }

    function setSidebarOpen(open) {
      if (!els.sidebar) return;
      els.sidebar.classList.toggle('open', !!open);
      const mobile = window.matchMedia('(max-width: 860px)').matches;
      document.body.classList.toggle('sidebar-open', !!open && mobile);
    }

    function restoreSessionView() {
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(VIEW_KEY) || 'null'); } catch (err) {}
      if (saved && saved.map) {
        mapViewMemo = {
          scale: saved.map.scale,
          panX: saved.map.panX,
          panY: saved.map.panY,
          sl: saved.map.sl,
          st: saved.map.st
        };
      }
      const page = saved && saved.page;
      if (saved && saved.sheet && (sheetOwnerRecord(saved.sheet) || (isDM && isDmNotesOwner(saved.sheet)))) {
        currentSheetOwner = saved.sheet;
      }
      if (!page || page === 'map') {
        showMap();
        return;
      }
      if (page === 'kampf') showKampf();
      else if (page === 'char') showCharakter();
      else if (page === 'dungeon') showDungeon();
      else if (page === 'chronik') showChronik();
      else if (page === 'entstehung') showEntstehung();
      else if (page === 'sitzung') showSitzung();
      else if (page === 'world') showCodex();
      else if (page === 'bestiarium' || page === 'glossar') {
        selectedCodexSection = page;
        showCatalog('codex');
        if (saved && saved.cat) {
          selectedHomeCat = saved.cat;
          renderHome();
          renderSidebar();
          persistView();
        }
      } else if (isCatalogPage(page) || page === 'codex') {
        if (saved.title) {
          const i = indexByTitle(saved.title);
          if (i !== null) {
            selectedHomeCat = saved.cat || null;
            loadEntry(i);
            return;
          }
        }
        showCatalog('codex');
        if (saved.cat) {
          selectedHomeCat = saved.cat;
          renderHome();
          renderSidebar();
          persistView();
        }
      } else showMap();
    }

    function bindAll() {
      safeBind('nav', () => {
        onClick('navChronik', showChronik);
        onClick('navCodex', showCodex);
        onClick('navMap', showMap);
        onClick('navCharakter', showCharakter);
        onClick('navKampf', showKampf);
        onClick('navDungeon', showDungeon);
        onClick('menuBtn', () => setSidebarOpen(!(els.sidebar && els.sidebar.classList.contains('open'))));
      });

      safeBind('dungeon', () => {
        bindDungeonUi();
      });

      safeBind('sound', () => {
        warmupSoundPlayers();
        loadSoundUserClips().then(() => {
          syncSoundUi();
        }).catch(() => {});
        onClick('soundDockBtn', ev => {
          ev.stopPropagation();
          toggleSoundDock();
        });
        const wrap = document.getElementById('soundDockWrap');
        if (wrap) wrap.addEventListener('pointerdown', unlockSound, { passive: true });
        document.addEventListener('click', ev => {
          const box = document.getElementById('soundDockWrap');
          if (!box || box.contains(ev.target)) return;
          if (soundPickOpen()) return;
          closeSoundDock();
        });
        onClick('soundAmbienteBtn', () => openSoundPicker('ambiente'));
        onClick('soundFxPickBtn', () => openSoundPicker('fx'));
        onClick('soundPauseBtn', togglePauseSound);
        onClick('soundStopBtn', stopSoundTrack);
        onClick('soundFxStopBtn', () => stopAllSoundFx(false));
        onClick('soundPickCloseBtn', closeSoundPicker);
        onClick('soundPickAddBtn', () => {
          const input = document.getElementById('soundFxInput');
          if (input) input.click();
        });
        onClick('soundPickExportBtn', exportSoundLibrary);
        onClick('soundPickImportBtn', () => {
          const input = document.getElementById('soundLibInput');
          if (input) input.click();
        });
        onEv('soundVolAmb', 'input', ev => setSoundAmbVolume(Number(ev.target.value) / 100));
        onEv('soundVolFx', 'input', ev => setSoundFxVolume(Number(ev.target.value) / 100));
        onEv('soundFxInput', 'change', async ev => {
          const file = ev.target.files && ev.target.files[0];
          ev.target.value = '';
          if (!file) return;
          await addSoundFromFile(file);
        });
        onEv('soundLibInput', 'change', async ev => {
          const file = ev.target.files && ev.target.files[0];
          ev.target.value = '';
          if (!file) return;
          await importSoundLibrary(file);
        });
        onEv('soundPickOverlay', 'click', ev => {
          if (ev.target === document.getElementById('soundPickOverlay')) closeSoundPicker();
        });
      });

      safeBind('dice', () => {
        renderDiceTray();
        renderDiceLog();
        applyDiceToolsUi();
        onClick('diceTrayBtn', ev => {
          ev.stopPropagation();
          toggleDiceTray();
        });
        const prefPanel = document.getElementById('dicePrefPanel');
        if (prefPanel) prefPanel.addEventListener('click', ev => {
          const btn = ev.target.closest('[data-dice-anim]');
          if (!btn) return;
          setDiceAnimMode(btn.getAttribute('data-dice-anim'));
        });
        onClick('diceTrayResetBtn', () => {
          resetDiceQueue();
          renderDiceTray();
        });
        onClick('diceTrayRollBtn', rollQueuedDice);
        onClick('diceTrayClearBtn', () => {
          resetDiceQueue();
          renderDiceTray();
          clearTableDice();
        });
        onClick('diceLogClearBtn', () => {
          diceLog = [];
          renderDiceLog();
          persistDiceLog();
        });
        const kinds = document.getElementById('diceTrayKinds');
        if (kinds) kinds.addEventListener('click', ev => {
          const btn = ev.target.closest('[data-sides]');
          if (!btn) return;
          addDiceToQueue(btn.getAttribute('data-sides'));
        });
        document.addEventListener('click', ev => {
          const wrap = document.getElementById('diceToolsWrap');
          if (wrap && wrap.contains(ev.target)) return;
          closeDiceTray();
        });
      });

      safeBind('kampf', () => {
        onClick('kampfStartBtn', startKampf);
        onClick('kampfInitAllBtn', rollAllKampfInit);
        onClick('kampfAddToggleBtn', () => {
          const add = document.getElementById('kampfAdd');
          if (!add) return;
          add.classList.remove('hidden');
          add.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
        onClick('kampfNextBtn', nextCombatTurn);
        onClick('kampfPrevBtn', prevCombatTurn);
        onClick('kampfSkipBtn', skipCombatTurn);
        onClick('kampfReadyBtn', () => markActiveKampfTurn('ready'));
        onClick('kampfDelayBtn', () => markActiveKampfTurn('delay'));
        onClick('kampfEndBtn', endCombat);
        onClick('kampfAimCancel', cancelKampfAim);
        onClick('kampfResolveBtn', resolveKampfPower);
        onEv('kampfPowerOverlay', 'click', ev => ev.stopPropagation());
        onEv('kampfPowerOverlay', 'pointerdown', ev => ev.stopPropagation());
        onEv('kampfActionPanel', 'click', ev => ev.stopPropagation());
        onEv('kampfActionPanel', 'pointerdown', ev => ev.stopPropagation());
        bindKampfFloatUi();
        onClick('kampfActDmg', () => applyKampfAimDamage(false));
        onClick('kampfActHeal', () => applyKampfAimDamage(true));
        onClick('kampfActBuff', () => showKampfEffectPicker('buff'));
        onClick('kampfActDebuff', () => showKampfEffectPicker('debuff'));
        onClick('kampfActConcentrate', toggleKampfConcentrate);
        onClick('kampfActKill', applyKampfAimKill);
        onClick('kampfEffectAdd', () => applyKampfEffect(''));
        onEv('kampfDmgAmt', 'keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          applyKampfAimDamage(false);
        });
        onEv('kampfEffectText', 'keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          applyKampfEffect('');
        });
        onClick('statSheetCloseBtn', closeStatSheetOverlay);
        onEv('statSheetOverlay', 'click', ev => {
          if (ev.target === document.getElementById('statSheetOverlay')) closeStatSheetOverlay();
        });
        onClick('kampfAddEnemyBtn', addEnemyToCombat);
        onClick('kampfSaveTplBtn', saveCombatTemplate);
        onEv('kampfKartenSearch', 'input', renderKampfKartenList);
        onClick('kampfKarteSaveBtn', saveKampfKarte);
        onClick('kampfKarteCancelBtn', clearKarteForm);
        onClick('kampfKarteDeleteBtn', deleteKampfKarte);
        onClick('kampfKartePortraitBtn', () => {
          if (!isDM) return;
          const input = document.getElementById('kampfKartePortraitInput');
          if (input) input.click();
        });
        onEv('kampfKartePortraitInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file || !isDM) return;
          try {
            pendingKartePortrait = await fileToPortraitImage(file);
            updateKartePortraitStatus();
            toast('Portrait bereit. Karte speichern, dann ist es dabei.');
          } catch (err) {
            toast(err.message || 'Portrait konnte nicht gelesen werden.');
          }
        });
        ['kampfKarteName', 'kampfKarteHp', 'kampfKarteAc', 'kampfKarteCount', 'kampfKarteNote'].forEach(id => {
          onEv(id, 'keydown', ev => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            saveKampfKarte();
          });
        });
        ['kampfEnemyName', 'kampfEnemyHp', 'kampfEnemyAc', 'kampfEnemyInit', 'kampfEnemyCount', 'kampfTplName'].forEach(id => {
          onEv(id, 'keydown', ev => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            if (id === 'kampfTplName') saveCombatTemplate();
            else addEnemyToCombat();
          });
        });
        bindBattleTools('kampf');
        onEv('battleMapInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadBattleMap(file);
        });
        onClick('battleGalleryAddBtn', startBattleGalleryAdd);
        onClick('battleGalleryCloseBtn', closeBattleGallery);
        onEv('battleGalleryOverlay', 'click', ev => {
          if (ev.target === document.getElementById('battleGalleryOverlay')) closeBattleGallery();
        });
        onEv('battleGalleryName', 'keydown', ev => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          startBattleGalleryAdd();
        });
        onEv('battleGalleryInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          addBattleGalleryMap(file);
        });
      });

      safeBind('char', () => {
        onClick('uploadSheetPortraitBtn', () => {
          const input = document.getElementById('sheetPortraitInput');
          if (input) input.click();
        });
        onClick('removeSheetPortraitBtn', () => {
          pendingSheetPortrait = null;
          sheetPortraitId = '';
          setSheetPortraitPreview(null);
          sheetDirty = true;
        });
        onClick('ocrSheetPortraitBtn', () => readStatSheetFromSheetImage());
        onEv('sheetPortraitInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file) return;
          try {
            pendingSheetPortrait = currentSheetOwner === VEYR_OWNER
              ? await fileToEntryImage(file)
              : await fileToPortraitImage(file);
            setSheetPortraitPreview(pendingSheetPortrait);
            sheetDirty = true;
            toast(currentSheetOwner === VEYR_OWNER
              ? 'Bild bereit. Text aus Stat-Sheet lesen oder Blatt speichern.'
              : 'Portrait bereit. Blatt speichern, dann ist es für den Kampf da.');
          } catch (err) {
            toast(err.message || 'Portrait konnte nicht gelesen werden.');
          }
        });
        onClick('saveSheetBtn', saveSheet);
        onClick('saveDmNotesBtn', saveDmNotes);
        onClick('deletePlayerBtn', deletePlayerAccount);
        onClick('dndPortraitBtn', () => {
          const input = document.getElementById('sheetPortraitInput');
          if (input) input.click();
        });
        onClick('dndInsp', () => {
          collectDndFields();
          dndState.inspiration = !dndState.inspiration;
          refreshDndCalcs();
          sheetDirty = true;
        });
        onClick('dndShortRest', () => applyDndRest('short'));
        onClick('dndLongRest', () => applyDndRest('long'));
        onClick('dndDawn', () => applyDndRest('dawn'));
        onClick('dndHealBtn', () => applyDndHpChange('heal'));
        onClick('dndDmgBtn', () => applyDndHpChange('dmg'));
        const dndBlock = document.getElementById('charDndBlock');
        if (dndBlock && !dndBlock.dataset.bound) {
          dndBlock.dataset.bound = '1';
          const syncDnd = ev => {
            if (!usesDndSheet(currentSheetOwner)) return;
            sheetDirty = true;
            const row = ev.target.closest && ev.target.closest('[data-dnd-row]');
            if (row) {
              const kind = row.getAttribute('data-dnd-row');
              const id = row.getAttribute('data-id');
              const key = ev.target.getAttribute('data-k');
              const item = (dndState[kind] || []).find(x => x.id === id);
              if (item && key) item[key] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
            }
            collectDndFields();
            refreshDndCalcs();
          };
          dndBlock.addEventListener('input', syncDnd);
          dndBlock.addEventListener('change', syncDnd);
          dndBlock.addEventListener('click', ev => {
            if (!usesDndSheet(currentSheetOwner)) return;
            const tab = ev.target.closest('[data-dnd-tab]');
            if (tab) {
              collectDndFields();
              setDndTab(tab.getAttribute('data-dnd-tab'));
              return;
            }
            const actFilter = ev.target.closest('[data-dnd-act-filter]');
            if (actFilter) {
              setDndActFilter(actFilter.getAttribute('data-dnd-act-filter'));
              return;
            }
            const spellFilter = ev.target.closest('[data-dnd-spell-filter]');
            if (spellFilter) {
              collectDndFields();
              setDndSpellFilter(spellFilter.getAttribute('data-dnd-spell-filter'));
              return;
            }
            const slotPip = ev.target.closest('[data-dnd-slot-pip]');
            if (slotPip) {
              if (!canEditOwnerSheet(currentSheetOwner)) return;
              const level = Number(slotPip.getAttribute('data-dnd-slot-pip'));
              const n = Number(slotPip.getAttribute('data-n'));
              if (!dndState.spellSlots[level]) dndState.spellSlots[level] = { max: '', used: '' };
              const used = dndSlotUsed(level);
              dndState.spellSlots[level].used = String(used === n ? Math.max(0, n - 1) : n);
              renderDndLists();
              sheetDirty = true;
              return;
            }
            const slotDelta = ev.target.closest('[data-dnd-slot-max-delta]');
            if (slotDelta) {
              if (!canEditOwnerSheet(currentSheetOwner)) return;
              const level = Number(slotDelta.getAttribute('data-dnd-slot-max-delta'));
              const delta = Number(slotDelta.getAttribute('data-delta')) || 0;
              if (!dndState.spellSlots[level]) dndState.spellSlots[level] = { max: '', used: '' };
              const max = Math.max(0, Math.min(12, dndSlotMax(level) + delta));
              dndState.spellSlots[level].max = max ? String(max) : '';
              if (dndSlotUsed(level) > max) dndState.spellSlots[level].used = max ? String(max) : '0';
              renderDndLists();
              renderDndSlots();
              sheetDirty = true;
              return;
            }
            const saveToggle = ev.target.closest('[data-dnd-save-toggle]');
            if (saveToggle) {
              const id = saveToggle.getAttribute('data-dnd-save-toggle');
              dndState.abilities[id].save = !dndState.abilities[id].save;
              const cb = document.querySelector('#charDndBlock [data-dnd-save="' + id + '"]');
              if (cb) cb.checked = dndState.abilities[id].save;
              saveToggle.classList.toggle('is-prof', dndState.abilities[id].save);
              refreshDndCalcs();
              sheetDirty = true;
              return;
            }
            const rollAb = ev.target.closest('[data-dnd-roll-ab]');
            if (rollAb) {
              const id = rollAb.getAttribute('data-dnd-roll-ab');
              const ab = DND_ABS.find(a => a.id === id);
              dndRoll(ab ? ab.label : id, dndMod(dndState.abilities[id].score));
              return;
            }
            const rollSave = ev.target.closest('[data-dnd-roll-save]');
            if (rollSave) {
              const id = rollSave.getAttribute('data-dnd-roll-save');
              const ab = DND_ABS.find(a => a.id === id);
              const bonus = dndMod(dndState.abilities[id].score) + (dndState.abilities[id].save ? dndProficiency() : 0);
              dndRoll('Rettung ' + (ab ? ab.label : id), bonus);
              return;
            }
            const rollSkill = ev.target.closest('[data-dnd-roll-skill]');
            if (rollSkill) {
              const id = rollSkill.getAttribute('data-dnd-roll-skill');
              const sk = DND_SKILLS.find(s => s.id === id);
              dndRoll(sk ? sk.label : id, dndSkillBonus(id));
              return;
            }
            const rollInit = ev.target.closest('[data-dnd-roll="init"]');
            if (rollInit) {
              collectDndFields();
              const bonus = dndMod(dndState.abilities.dex.score) + dndParseBonus(dndState.initiativeBonus);
              dndRoll('Initiative', bonus);
              return;
            }
            const infoBtn = ev.target.closest('[data-dnd-info]');
            if (infoBtn) {
              const wrap = infoBtn.closest('[data-dnd-row]');
              const kind = wrap && wrap.getAttribute('data-dnd-row');
              const id = wrap && wrap.getAttribute('data-id');
              if (kind && id) openDndActionInfo(kind, id, currentSheetOwner);
              return;
            }
            const rollAtk = ev.target.closest('[data-dnd-roll="attack"], [data-dnd-roll="damage"]');
            if (rollAtk) {
              const wrap = rollAtk.closest('[data-dnd-row]');
              const id = wrap && wrap.getAttribute('data-id');
              collectDndFields();
              const item = (dndState.attacks || []).find(x => x.id === id)
                || (dndState.spells || []).find(x => x.id === id);
              if (!item) return;
              const kind = rollAtk.getAttribute('data-dnd-roll');
              const rollItem = Object.assign({}, item, { bonus: dndItemAttackBonus(item) || item.bonus });
              if (kind === 'attack') rollDndAttack(rollItem, wrap, true);
              else rollDndDamageOnly(rollItem, wrap, false);
              sheetDirty = true;
              if (!dndAttackIsOpen(item) && !dndSpellIsOpen(item)) renderDndLists();
              return;
            }
            const spellSave = ev.target.closest('[data-dnd-spell-save]');
            if (spellSave) {
              commitDndSpell(spellSave.getAttribute('data-dnd-spell-save'));
              return;
            }
            const spellEdit = ev.target.closest('[data-dnd-spell-edit]');
            if (spellEdit) {
              collectDndFields();
              dndSpellEditId = spellEdit.getAttribute('data-dnd-spell-edit') || '';
              renderDndLists();
              return;
            }
            const spellCast = ev.target.closest('[data-dnd-spell-cast]');
            if (spellCast) {
              const wrap = spellCast.closest('[data-dnd-row]');
              const id = wrap && wrap.getAttribute('data-id');
              collectDndFields();
              const item = (dndState.spells || []).find(x => x.id === id);
              if (item) dndCastSpell(item);
              return;
            }
            const atkSave = ev.target.closest('[data-dnd-atk-save]');
            if (atkSave) {
              commitDndAttack(atkSave.getAttribute('data-dnd-atk-save'));
              return;
            }
            const atkEdit = ev.target.closest('[data-dnd-atk-edit]');
            if (atkEdit) {
              collectDndFields();
              dndAttackEditId = atkEdit.getAttribute('data-dnd-atk-edit') || '';
              renderDndLists();
              return;
            }
            const skill = ev.target.closest('[data-skill]');
            if (skill) {
              const id = skill.getAttribute('data-skill');
              dndState.skills[id] = ((Number(dndState.skills[id]) || 0) + 1) % 3;
              skill.classList.toggle('is-prof', dndState.skills[id] === 1);
              skill.classList.toggle('is-expert', dndState.skills[id] === 2);
              refreshDndCalcs();
              sheetDirty = true;
              return;
            }
            const add = ev.target.closest('[data-dnd-add]');
            if (add) {
              addDndRow(add.getAttribute('data-dnd-add'));
              return;
            }
            const del = ev.target.closest('[data-dnd-del]');
            if (del) {
              const row = del.closest('[data-dnd-row]');
              if (!row) return;
              const kind = row.getAttribute('data-dnd-row');
              const id = row.getAttribute('data-id');
              dndState[kind] = (dndState[kind] || []).filter(x => x.id !== id);
              renderDndLists();
              sheetDirty = true;
              return;
            }
            const death = ev.target.closest('[data-dnd-death]');
            if (death) {
              const n = Number(death.getAttribute('data-n'));
              const which = death.getAttribute('data-dnd-death');
              if (which === 'success') dndState.deathSuccess = dndState.deathSuccess === n ? n - 1 : n;
              else dndState.deathFail = dndState.deathFail === n ? n - 1 : n;
              renderDndPips();
              sheetDirty = true;
            }
          });
        }
        onEv('dmNotesContent', 'input', () => { sheetDirty = true; });
        ['sheetName', 'sheetVolk', 'sheetKlasse', 'sheetStufe', 'sheetHp', 'sheetArmor', 'sheetStats', 'sheetNotes'].forEach(id => {
          onEv(id, 'input', () => { sheetDirty = true; });
        });
        onEv('sheetContent', 'input', () => { sheetDirty = true; });
        onClick('charLoginBtn', () => openPlayerLogin('login'));
        onClick('charRegisterBtn', () => openPlayerLogin('register'));
        onClick('editVeyrBtn', openVeyrEditor);
        onClick('cancelVeyrBtn', () => {
          if (sheetDirty && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
          sheetDirty = false;
          veyrEntryEditing = false;
          pendingVeyrImage = null;
          renderCharakter();
        });
        onClick('saveVeyrBtn', saveVeyrEntry);
        onClick('uploadVeyrImageBtn', () => {
          if (!canEditOwnerSheet(VEYR_OWNER)) return;
          const input = document.getElementById('veyrImageInput');
          if (input) input.click();
        });
        onClick('ocrVeyrImageBtn', () => readStatSheetFromVeyrImage());
        onClick('removeVeyrImageBtn', () => {
          pendingVeyrImage = false;
          setVeyrImagePreview(null);
          sheetDirty = true;
        });
        onEv('veyrImageInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file || !canEditOwnerSheet(VEYR_OWNER)) return;
          try {
            toast('Bild wird vorbereitet…');
            const data = await fileToEntryImage(file);
            pendingVeyrImage = data;
            setVeyrImagePreview(data);
            sheetDirty = true;
            toast('Bild bereit. Jetzt Speichern, damit es für alle sichtbar ist.');
          } catch (err) {
            toast(err.message || 'Bild konnte nicht gelesen werden.');
          }
        });
        ['veyrTitle', 'veyrType'].forEach(id => {
          onEv(id, 'input', () => { sheetDirty = true; });
          onEv(id, 'change', () => { sheetDirty = true; });
        });
        onEv('veyrContent', 'input', () => { sheetDirty = true; });
      });

      safeBind('search', () => {
        onEv('globalSearch', 'input', renderGlobalSearch);
        onEv('globalSearch', 'focus', renderGlobalSearch);
        onEv('globalSearch', 'keydown', ev => {
          const hits = Array.from(document.querySelectorAll('#searchResults .search-hit'));
          if (ev.key === 'Escape') {
            closeSearchResults();
            closeDmMenu();
            ev.target.blur();
            return;
          }
          if (ev.key === 'ArrowDown' && hits.length) {
            ev.preventDefault();
            searchHitIndex = Math.min(hits.length - 1, searchHitIndex + 1);
            hits.forEach((h, i) => h.classList.toggle('active', i === searchHitIndex));
            hits[searchHitIndex].scrollIntoView({ block: 'nearest' });
            return;
          }
          if (ev.key === 'ArrowUp' && hits.length) {
            ev.preventDefault();
            searchHitIndex = searchHitIndex <= 0 ? 0 : searchHitIndex - 1;
            hits.forEach((h, i) => h.classList.toggle('active', i === searchHitIndex));
            hits[searchHitIndex].scrollIntoView({ block: 'nearest' });
            return;
          }
          if (ev.key === 'Enter') {
            const box = document.getElementById('searchResults');
            if (!box || box.classList.contains('hidden')) return;
            ev.preventDefault();
            const active = hits[searchHitIndex] || hits[0];
            if (active) active.click();
          }
        });
        document.addEventListener('click', ev => {
          if (!ev.target.closest('.header-search') && !ev.target.closest('#searchResults')) closeSearchResults();
          if (!ev.target.closest('#dmMenuWrap')) closeDmMenu();
          if (els.sidebar && els.sidebar.classList.contains('open') && !ev.target.closest('#sidebar') && !ev.target.closest('#menuBtn')) {
            setSidebarOpen(false);
          }
        });
        window.addEventListener('resize', closeSearchResults);
        window.addEventListener('scroll', () => {
          const box = document.getElementById('searchResults');
          if (box && !box.classList.contains('hidden')) placeSearchResults();
        }, true);
      });

      safeBind('codex', () => {
        onClick('homeNewBtn', newEntry);
        onClick('entstehungNewBtn', newEntry);
        onClick('sitzungNewBtn', newEntry);
        onClick('entstehungBackBtn', showChronik);
        onClick('sitzungBackBtn', showChronik);
        ['homeUploadAllBtn', 'entstehungUploadAllBtn', 'sitzungUploadAllBtn'].forEach(id => {
          onClick(id, () => {
            const input = document.getElementById('uploadAllInput');
            if (input) input.click();
          });
        });
        onClick('saveBtn', saveEntry);
        onClick('deleteBtn', deleteEntry);
        onClick('cancelEdit', () => {
          if (!confirmLeaveEditor()) return;
          dirty = false;
          if (currentIndex !== null && entries[currentIndex] && entries[currentIndex].type === STORY_CAT) showEntstehung();
          else if (currentIndex !== null && entries[currentIndex] && entries[currentIndex].type === SESSION_CAT) showSitzung();
          else if (currentIndex !== null) loadEntry(currentIndex);
          else if (isCatalogPage(currentPage)) showCatalog(currentPage);
          else if (currentPage === 'chronik') showChronik();
          else if (currentPage === 'entstehung') showEntstehung();
          else if (currentPage === 'sitzung') showSitzung();
          else if (currentPage === 'kampf') showKampf();
          else if (currentPage === 'dungeon') showDungeon();
          else if (currentPage === 'char') showCharakter();
          else if (currentPage === 'map') showMap();
          else showCodex();
        });
        onClick('editCurrent', editCurrent);
        onClick('entryToKarteBtn', createKampfKarteFromEntry);
        onClick('downloadOneBtn', downloadOneEntry);
        onClick('uploadOneBtn', () => {
          if (!isDM || currentIndex === null) return;
          const input = document.getElementById('uploadOneInput');
          if (input) input.click();
        });
        onEv('uploadAllInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadAllEntries(file);
        });
        onEv('uploadOneInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadOneEntry(file);
        });
        onClick('uploadEntryImageBtn', () => {
          if (!isDM) return;
          const input = document.getElementById('entryImageInput');
          if (input) input.click();
        });
        onClick('ocrEntryImageBtn', () => { readStatSheetFromEditorImage(); });
        onClick('removeEntryImageBtn', () => {
          pendingEntryImage = false;
          setEditorImagePreview(null);
          dirty = true;
        });
        onEv('entryImageInput', 'change', async ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          if (!file || !isDM) return;
          try {
            toast('Bild wird vorbereitet…');
            const data = await fileToEntryImage(file);
            pendingEntryImage = data;
            setEditorImagePreview(data);
            dirty = true;
            toast('Bild bereit. Jetzt Speichern, damit es für alle sichtbar ist.');
          } catch (err) {
            toast(err.message || 'Bild konnte nicht gelesen werden.');
          }
        });
        ['title', 'type', 'visibility', 'sessionDate'].forEach(id => {
          onEv(id, 'input', () => { dirty = true; });
          onEv(id, 'change', () => { dirty = true; });
        });
        onEv('type', 'change', () => {
          syncSessionDateField();
          syncTitleKingdomField();
        });
        onEv('titleKingdom', 'change', () => { dirty = true; });
        onEv('content', 'input', () => { dirty = true; });
      });

      safeBind('player', () => {
        onClick('chatBtn', () => toggleChat());
        onClick('chatCloseBtn', () => toggleChat(false));
        onEv('chatForm', 'submit', ev => {
          ev.preventDefault();
          const input = document.getElementById('chatInput');
          const text = input ? input.value : '';
          sendChatMessage(text).then(() => {
            if (input) input.value = '';
          });
        });
        onClick('playerButton', () => {
          if (currentPlayerId) {
            if (currentPage === 'char' && sheetDirty && !confirm('Das Charakterblatt ist nicht gespeichert. Wirklich abmelden?')) return;
            sheetDirty = false;
            setPlayer(null);
            if (currentPage === 'char') renderCharakter();
            toast('Spieler abgemeldet.');
          } else {
            openPlayerLogin('login');
          }
        });
        onClick('playerTabLogin', () => setPlayerFormMode('login'));
        onClick('playerTabRegister', () => setPlayerFormMode('register'));
        onClick('playerCancel', closePlayerLogin);
        onEv('playerOverlay', 'click', ev => {
          if (ev.target === document.getElementById('playerOverlay')) closePlayerLogin();
        });
        onEv('playerForm', 'submit', async ev => {
          ev.preventDefault();
          const nameEl = document.getElementById('playerUser');
          const passEl = document.getElementById('playerPassword');
          const errEl = document.getElementById('playerError');
          if (!nameEl || !passEl || !errEl) return;
          const name = nameEl.value;
          const password = passEl.value;
          errEl.textContent = '';
          try {
            if (playerFormMode === 'register') {
              const againEl = document.getElementById('playerPassword2');
              const again = againEl ? againEl.value : '';
              if (password !== again) throw new Error('Die Passwörter stimmen nicht überein.');
              await registerPlayer(name, password);
              closePlayerLogin();
              toast('Willkommen, ' + playerAccounts[currentPlayerId].name + '.');
            } else {
              loginPlayer(name, password);
              closePlayerLogin();
              toast('Angemeldet als ' + playerAccounts[currentPlayerId].name + '.');
            }
            showCharakter();
          } catch (err) {
            errEl.textContent = err.message || 'Das hat nicht geklappt.';
          }
        });
      });

      safeBind('dm', () => {
        onClick('dmMenuBtn', ev => {
          ev.stopPropagation();
          toggleDmMenu();
        });
        onClick('dmMenuSitzung', () => {
          closeDmMenu();
          showSitzung();
        });
        onClick('dmMenuMyDoc', () => {
          closeDmMenu();
          downloadMyDocument();
        });
        onClick('dmButton', () => {
          if (isDM) setDM(false);
          else openLogin();
        });
        onClick('loginCancel', closeLogin);
        onEv('loginOverlay', 'click', ev => {
          if (ev.target === document.getElementById('loginOverlay')) closeLogin();
        });
        onClick('dndActionClose', closeDndActionInfo);
        onClick('dndActionDismiss', closeDndActionInfo);
        onClick('dndActionSave', saveDndActionText);
        onClick('dndActionCast', () => {
          if (!dndActionView || dndActionView.kind !== 'spells') return;
          const item = (dndState.spells || []).find(x => x.id === dndActionView.id);
          if (item) dndCastSpell(item);
        });
        onEv('dndActionOverlay', 'click', ev => {
          if (ev.target === document.getElementById('dndActionOverlay')) closeDndActionInfo();
        });
        onEv('loginForm', 'submit', ev => {
          ev.preventDefault();
          const userEl = els.dmUser;
          const passEl = els.dmPassword;
          if (!userEl || !passEl) return;
          const userOk = (userEl.value || '').trim().toLowerCase() === DM_USER;
          const passOk = encodeSecret(passEl.value) === DM_PASS;
          if (userOk && passOk) {
            closeLogin();
            setDM(true);
            toast('Angemeldet als DM.');
          } else if (els.loginError) {
            els.loginError.textContent = 'Benutzername oder Passwort stimmt nicht.';
          }
        });
      });

      safeBind('map', () => {
        onClick('placePinBtn', () => {
          if (!isDM) return;
          setPlacingPin(!placingPin);
        });
        onClick('mapZoomIn', () => zoomMapBy(0.35));
        onClick('mapZoomOut', () => zoomMapBy(-0.35));
        onClick('mapZoomReset', resetMapView);
        onEv('mapWrap', 'wheel', ev => {
          if (mapScale <= 1 && !ev.ctrlKey) return;
          ev.preventDefault();
          const step = ev.deltaY > 0 ? -0.18 : 0.18;
          zoomMapAt(ev.clientX, ev.clientY, mapScale + step);
        }, { passive: false });
        onEv('mapWrap', 'pointerdown', ev => {
          if (ev.button && ev.button !== 0) return;
          if (placingPin || drawingBorder) return;
          if (ev.target.closest('.map-pin-del') || ev.target.closest('.map-border-del') || ev.target.closest('.map-border-mid')) return;
          const wrap = document.getElementById('mapWrap');
          if (!wrap) return;
          const vert = ev.target.closest('.map-border-vert');
          if (vert && isDM) {
            ev.preventDefault();
            mapDrag = {
              type: 'border-vert',
              borderId: vert.dataset.borderId,
              index: Number(vert.dataset.pointIndex),
              el: vert,
              x: ev.clientX,
              y: ev.clientY,
              moved: false
            };
            wrap.classList.add('panning');
            wrap.setPointerCapture(ev.pointerId);
            return;
          }
          const pinEl = ev.target.closest('.map-pin');
          if (pinEl && isDM) {
            ev.preventDefault();
            mapDrag = { type: 'pin', id: pinEl.dataset.pinId, el: pinEl, x: ev.clientX, y: ev.clientY, moved: false };
            wrap.classList.add('panning');
            wrap.setPointerCapture(ev.pointerId);
            return;
          }
          if (pinEl) {
            mapDrag = { type: 'pin-click', id: pinEl.dataset.pinId, x: ev.clientX, y: ev.clientY, moved: false };
            wrap.setPointerCapture(ev.pointerId);
            return;
          }
          if (isDM && mapScale <= 1 && !ev.target.closest('.map-border-hit')) {
            clearMapLongPress();
            const pos = mapClickToPercent(ev);
            if (pos) {
              mapLongPressPos = { x: ev.clientX, y: ev.clientY, pos: pos };
              mapLongPressTimer = setTimeout(() => {
                if (!mapLongPressPos || mapDrag) return;
                pendingPin = mapLongPressPos.pos;
                clearMapLongPress();
                openPinPicker();
              }, 550);
            }
          }
          if (mapScale <= 1) return;
          ev.preventDefault();
          clearMapLongPress();
          const hit = ev.target.closest('.map-border-hit');
          mapDrag = {
            type: 'pan',
            id: ev.pointerId,
            x: ev.clientX,
            y: ev.clientY,
            panX: mapPanX,
            panY: mapPanY,
            moved: false,
            borderId: hit ? (hit.getAttribute('data-border-id') || '') : null
          };
          wrap.classList.add('panning');
          wrap.setPointerCapture(ev.pointerId);
        });
        document.addEventListener('pointermove', ev => {
          if (mapLongPressPos && mapLongPressTimer) {
            const dx0 = ev.clientX - mapLongPressPos.x;
            const dy0 = ev.clientY - mapLongPressPos.y;
            if (dx0 * dx0 + dy0 * dy0 > 36) clearMapLongPress();
          }
          if (!mapDrag) return;
          if (mapDrag.type === 'pan' || mapDrag.type === 'pin' || mapDrag.type === 'border-vert') ev.preventDefault();
          const dx = ev.clientX - mapDrag.x;
          const dy = ev.clientY - mapDrag.y;
          if (!mapDrag.moved && (dx * dx + dy * dy) > 36) {
            mapDrag.moved = true;
            clearMapLongPress();
          }
          if (!mapDrag.moved) return;
          if (mapDrag.type === 'pan') {
            mapPanX = mapDrag.panX + dx;
            mapPanY = mapDrag.panY + dy;
            applyMapTransform();
            return;
          }
          if (mapDrag.type === 'pin') {
            const pos = mapClickToPercent(ev);
            if (!pos) return;
            const pin = mapPins.find(p => p.id === mapDrag.id);
            if (!pin) return;
            pin.x = pos.x;
            pin.y = pos.y;
            if (mapDrag.el) {
              mapDrag.el.style.left = pos.x + '%';
              mapDrag.el.style.top = pos.y + '%';
            }
            return;
          }
          if (mapDrag.type === 'border-vert') {
            const pos = mapClickToPercent(ev);
            if (!pos) return;
            const border = mapBorders.find(b => b.id === mapDrag.borderId);
            if (!border || !border.points[mapDrag.index]) return;
            border.points[mapDrag.index].x = pos.x;
            border.points[mapDrag.index].y = pos.y;
            if (mapDrag.el) {
              mapDrag.el.style.left = pos.x + '%';
              mapDrag.el.style.top = pos.y + '%';
            }
          }
        });
        document.addEventListener('pointerup', async ev => {
          clearMapLongPress();
          const wrap = document.getElementById('mapWrap');
          if (wrap) wrap.classList.remove('panning');
          const drag = mapDrag;
          mapDrag = null;
          if (!drag) return;
          if (drag.type === 'pin' && drag.moved) {
            try { await persistPins(); toast('Ort verschoben.'); }
            catch (err) { toast('Konnte den Ort nicht speichern: ' + err.message); }
            return;
          }
          if ((drag.type === 'pin' || drag.type === 'pin-click') && !drag.moved) {
            return;
          }
          if (drag.type === 'border-vert' && drag.moved) {
            renderMapBorders();
            try { await persistPins(); toast('Grenzpunkt verschoben.'); }
            catch (err) { toast('Konnte die Grenze nicht speichern: ' + err.message); }
            return;
          }
          if (drag.type === 'pan' && !drag.moved && drag.borderId && isDM) {
            startBorderVertEdit(drag.borderId);
          }
        });
        document.addEventListener('pointercancel', () => {
          clearMapLongPress();
          mapDrag = null;
          const wrap = document.getElementById('mapWrap');
          if (wrap) wrap.classList.remove('panning');
        });
        onEv('mapStage', 'contextmenu', ev => {
          if (!isDM) return;
          ev.preventDefault();
          openPinAtMapEvent(ev);
        });
        onEv('mapStage', 'click', ev => {
          if (!isDM) return;
          if (ev.target.closest('.map-pin') || ev.target.closest('.map-border-del') || ev.target.closest('.map-border-vert') || ev.target.closest('.map-border-mid')) return;
          const pos = mapClickToPercent(ev);
          if (!pos) return;
          if (drawingBorder) {
            borderDraft.push(pos);
            renderMapBorders();
            return;
          }
          if (editingBorderVertsId && !ev.target.closest('.map-border-hit')) {
            endBorderVertEdit();
            return;
          }
          if (!placingPin) return;
          pendingPin = pos;
          openPinPicker();
        });
        onClick('drawBorderBtn', () => {
          if (!isDM) return;
          if (!drawingBorder) {
            setDrawingBorder(true);
            return;
          }
          if (borderDraft.length < 3) {
            editingBorderId = null;
            setDrawingBorder(false);
            toast('Zeichnen abgebrochen.');
            return;
          }
          finishBorderDraft();
        });
        onClick('mapLegendBtn', () => {
          const box = document.getElementById('mapLegend');
          if (!box) return;
          const hide = !box.classList.contains('hidden');
          box.classList.toggle('hidden', hide);
          if (!hide) renderMapLegend();
          if (isMapFullscreen()) requestAnimationFrame(() => applyMapTransform());
        });
        onClick('mapFullBtn', toggleMapFullscreen);
        onClick('pinNoEntry', () => {
          const nameEl = document.getElementById('pinLabel');
          const name = ((nameEl && nameEl.value) || '').trim();
          if (!name) return toast('Bitte einen Namen eingeben.');
          applyPinChoice(name);
        });
        onClick('pinSaveEdit', () => {
          const nameEl = document.getElementById('pinLabel');
          const name = ((nameEl && nameEl.value) || '').trim();
          if (!name) return toast('Bitte einen Namen eingeben.');
          savePinEdits(name);
        });
        onClick('entryShowOnMapBtn', () => showEntryOnMap());
        onClick('entrySetPinBtn', () => beginPinFromEntry());
        onEv('borderForm', 'submit', ev => {
          ev.preventDefault();
          const nameEl = document.getElementById('borderName');
          const colorEl = document.getElementById('borderColor');
          const name = ((nameEl && nameEl.value) || '').trim();
          if (!name) return toast('Bitte einen Namen für die Grenze vergeben.');
          saveBorderDraft(name, colorEl ? colorEl.value : '');
        });
        onClick('borderRedraw', () => {
          if (!isDM || !editingBorderId) return;
          const overlay = document.getElementById('borderOverlay');
          if (overlay) overlay.classList.add('hidden');
          setDrawingBorder(true);
        });
        onClick('borderCancel', () => {
          const overlay = document.getElementById('borderOverlay');
          if (overlay) overlay.classList.add('hidden');
          if (drawingBorder && !editingBorderId) setDrawingBorder(false);
          else if (!drawingBorder) editingBorderId = null;
        });
        onEv('worldMap', 'load', () => {
          renderMapPins();
          applyMapTransform();
        });
        window.addEventListener('resize', () => {
          if (currentPage === 'map') applyMapTransform();
        });
        onClick('pinCancel', closePinPicker);
        onEv('pinOverlay', 'click', ev => {
          if (ev.target === document.getElementById('pinOverlay')) closePinPicker();
        });
        onClick('uploadMapBtn', () => {
          if (!isDM) return;
          const input = document.getElementById('mapFileInput');
          if (input) input.click();
        });
        onEv('mapFileInput', 'change', ev => {
          const file = ev.target.files[0];
          ev.target.value = '';
          uploadMapFile(file);
        });
      });
    }

    bindAll();
    loadSoundPrefs();
    loadDicePrefs();
    renderSoundFxButtons();
    renderDiceTray();
    renderDiceLog();
    if (sessionStorage.getItem(SESSION_KEY) === '1') setDM(true);
    else {
      syncSoundUi();
      applyDiceToolsUi();
    }

    window.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape') return;
      if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.isContentEditable)) {
        if (ev.target.id === 'globalSearch') return;
      }
      if (chatOpen) { toggleChat(false); return; }
      const login = document.getElementById('loginOverlay');
      if (login && !login.classList.contains('hidden')) { closeLogin(); return; }
      const dndAction = document.getElementById('dndActionOverlay');
      if (dndAction && !dndAction.classList.contains('hidden')) { closeDndActionInfo(); return; }
      const player = document.getElementById('playerOverlay');
      if (player && !player.classList.contains('hidden')) { closePlayerLogin(); return; }
      const pin = document.getElementById('pinOverlay');
      if (pin && !pin.classList.contains('hidden')) { closePinPicker(); return; }
      const soundPick = document.getElementById('soundPickOverlay');
      if (soundPick && !soundPick.classList.contains('hidden')) { closeSoundPicker(); return; }
      if (diceTrayOpen) { closeDiceTray(); return; }
      if (soundDockOpen) { closeSoundDock(); return; }
      const gallery = document.getElementById('battleGalleryOverlay');
      if (gallery && !gallery.classList.contains('hidden')) { closeBattleGallery(); return; }
      if (typeof dungeonPlaceMode !== 'undefined' && dungeonPlaceMode) {
        cancelDungeonPlace();
        return;
      }
      if (document.getElementById('dungeonPlayerPanel') && !document.getElementById('dungeonPlayerPanel').classList.contains('hidden')) {
        closeDungeonMenus();
        return;
      }
      if (document.getElementById('dungeonNpcPanel') && !document.getElementById('dungeonNpcPanel').classList.contains('hidden')) {
        closeDungeonMenus();
        return;
      }
      if (document.getElementById('dungeonTokenPanel') && !document.getElementById('dungeonTokenPanel').classList.contains('hidden')) {
        closeDungeonMenus();
        return;
      }
      const statSheet = document.getElementById('statSheetOverlay');
      if (statSheet && !statSheet.classList.contains('hidden')) { closeStatSheetOverlay(); return; }
      const border = document.getElementById('borderOverlay');
      if (border && !border.classList.contains('hidden')) {
        const cancel = document.getElementById('borderCancel');
        if (cancel) cancel.click();
        return;
      }
      if (placingPin) { setPlacingPin(false); toast('Ort setzen abgebrochen.'); return; }
      if (drawingBorder) {
        editingBorderId = null;
        setDrawingBorder(false);
        toast('Grenze zeichnen abgebrochen.');
        return;
      }
      if (editingBorderVertsId) { endBorderVertEdit(); return; }
      if (pendingPinEntryId) { pendingPinEntryId = null; updateMapHint(); return; }
      if (kampfAimFrom) { cancelKampfAim(); return; }
      const gear = document.getElementById('kampfBattleGearPanel');
      if (gear && !gear.classList.contains('hidden')) { closeKampfBattleGear(); return; }
      if (isMapFullscreen()) { setMapFullscreen(false); return; }
      const searchBox = document.getElementById('searchResults');
      if (searchBox && !searchBox.classList.contains('hidden')) {
        closeSearchResults();
        return;
      }
      if (els.sidebar && els.sidebar.classList.contains('open')) setSidebarOpen(false);
    });

    window.addEventListener('beforeunload', ev => {
      const editing = dirty && isDM && els.editorView && !els.editorView.classList.contains('hidden');
      const sheet = sheetDirty && els.charView && !els.charView.classList.contains('hidden');
      if (!editing && !sheet) return;
      ev.preventDefault();
      ev.returnValue = '';
    });

    (async function boot() {
      loadRosterLocal();
      loadCombatTemplatesLocal();
      loadBattleLocal();
      loadBattleGalleryLocal();
      loadDungeonLocal();
      loadDungeonMapLocal();
      loadCombat();
      if (!initFirebase()) toast('Keine Verbindung zur Cloud.');
      const localPack = readLocalPack();
      let remotePack = null;
      if (db) {
        try {
          const snap = await worldRef().get();
          if (snap.exists) remotePack = parseWorldPayload(snap.data());
          const mapSnap = await mapRef().get();
          if (mapSnap.exists) applyMap(mapSnap.data());
          const pinSnap = await pinsRef().get();
          if (pinSnap.exists) applyPins(pinSnap.data());
          const playerSnap = await playersRef().get();
          if (playerSnap.exists) applyPlayers(playerSnap.data());
          const rosterSnap = await rosterRef().get();
          if (rosterSnap.exists) applyRoster(rosterSnap.data());
          const tplSnap = await templatesRef().get();
          if (tplSnap.exists) applyCombatTemplates(tplSnap.data());
          else if (combatTemplates.length) persistCombatTemplatesRemote();
          const battleSnap = await battleRef().get();
          if (battleSnap.exists) applyBattle(battleSnap.data());
          const battleMapSnap = await battleMapRef().get();
          if (battleMapSnap.exists) applyBattleMap(battleMapSnap.data());
          const gallerySnap = await battleGalleryRef().get();
          if (gallerySnap.exists) applyBattleGallery(gallerySnap.data());
          const dungeonSnap = await dungeonRef().get();
          if (dungeonSnap.exists) applyDungeon(dungeonSnap.data(), false);
          const dungeonMapSnap = await dungeonMapRef().get();
          if (dungeonMapSnap.exists) applyDungeonMap(dungeonMapSnap.data());
          const combatSnap = await combatRef().get();
          if (combatSnap.exists) applyCombat(combatSnap.data());
          else if (combat.combatants.length) persistCombat();
        } catch (err) {
          console.warn(err);
          toast('Keine Verbindung zur Cloud.');
        }
      }

      const remoteAt = remotePack ? Number(remotePack.updatedAt) || 0 : 0;
      const localAt = localPack ? Number(localPack.updatedAt) || 0 : 0;
      const localHas = !!(localPack && localPack.entries && localPack.entries.length);
      let chosen = { entries: [], updatedAt: 0 };
      let upload = false;

      if (remotePack && localPack && localAt > remoteAt) {
        chosen = localPack;
        upload = true;
        toast('Lokaler Codex war neuer und wird in die Cloud übernommen.');
      } else if (remotePack) {
        chosen = remotePack;
      } else if (localHas) {
        chosen = localPack;
        upload = true;
      } else {
        try {
          const r = await fetch('world.json');
          if (r.ok) {
            const seedPack = parseWorldPayload(await r.json());
            if (seedPack && seedPack.entries && seedPack.entries.length) {
              chosen = { entries: seedPack.entries, updatedAt: Date.now() };
              upload = true;
            }
          }
        } catch (err) {}
      }

      entries = chosen.entries || [];
      worldUpdatedAt = chosen.updatedAt || 0;
      migratePinEntryLinks();
      renderMapPins();
      persistLocal();
      if (db && upload) {
        try {
          await persistWorld();
        } catch (err) {
          console.warn(err);
        }
      }

      const savedPlayer = sessionStorage.getItem(PLAYER_SESSION_KEY) || (function () {
        try { return localStorage.getItem(PLAYER_SESSION_KEY); } catch (err) { return null; }
      })();
      if (savedPlayer && playerAccounts[savedPlayer]) setPlayer(savedPlayer);

      restoreSessionView();
      listenWorld();
      listenMap();
      listenPins();
      listenPlayers();
      syncChatListeners();
      listenRoster();
      listenCombatTemplates();
      listenBattle();
      listenBattleGallery();
      listenDungeon();
      listenCombat();
      listenDiceLog();
    })().catch(err => {
      console.warn(err);
      toast('Die Seite konnte nicht vollständig starten. Bitte neu laden.');
    });