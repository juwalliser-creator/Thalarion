/* Thalarion – Codex (Katalog, Suche, Einträge) – Phase 1.3 */

    function fillTypeSelect(page) {
      els.type.innerHTML = '';
      const only = page === 'bestiarium' || page === 'glossar' || page === 'codex' || page === 'sitzung' ? PAGE_CATS[page] : null;
      if (only) {
        only.forEach(c => {
          const o = document.createElement('option');
          o.value = c;
          o.textContent = c;
          els.type.appendChild(o);
        });
        return;
      }
      [
        ['Kompendium', KOMPENDIUM_CATS],
        ['Bestiarium', BESTIARIUM_CATS],
        ['Glossar', GLOSSAR_CATS],
        ['Entstehung', [STORY_CAT]],
        ['Sitzung', [SESSION_CAT]]
      ].forEach(([label, cats]) => {
        const group = document.createElement('optgroup');
        group.label = label;
        cats.forEach(c => {
          const o = document.createElement('option');
          o.value = c;
          o.textContent = c;
          group.appendChild(o);
        });
        els.type.appendChild(group);
      });
    }

    fillTypeSelect('codex');

    function normalizeType(type) {
      return typeAliases[type] || type;
    }

    function pageForType(type) {
      const t = normalizeType(type);
      if (t === STORY_CAT) return 'entstehung';
      if (t === SESSION_CAT) return 'sitzung';
      if (BESTIARIUM_CATS.includes(t)) return 'bestiarium';
      if (GLOSSAR_CATS.includes(t)) return 'glossar';
      return 'codex';
    }

    function catalogLabel(page) {
      if (page === 'bestiarium') return 'Bestiarium';
      if (page === 'glossar') return 'Glossar';
      if (page === 'sitzung') return 'Sitzung';
      return 'Kompendium';
    }

    function leaveCategory() {
      selectedHomeCat = null;
      titleKingdomFilter = '';
      updateHomeHero(currentPage);
      renderHome();
    }

    function isSingleEntryCategory(cat) {
      return cat === 'Hochfänge' || cat === 'Niederfänge';
    }

    function visibleEntriesInCat(cat) {
      return entries
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.type === cat && (isDM || e.visibility === 'player'))
        .sort((a, b) => String(a.e.title || '').localeCompare(String(b.e.title || ''), 'de', { sensitivity: 'base' }));
    }

    function openHomeCategory(cat) {
      if (!confirmLeaveEditor()) return;
      titleKingdomFilter = '';
      const matching = visibleEntriesInCat(cat);
      if (isSingleEntryCategory(cat) && matching.length === 1) {
        selectedHomeCat = cat;
        loadEntry(matching[0].i);
        return;
      }
      selectedHomeCat = cat;
      renderHome();
    }

    function openCatalogCategory(page, cat) {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      selectedHomeCat = cat || null;
      currentIndex = null;
      currentTitle = null;
      showPage(page);
      els.homeView.classList.remove('hidden');
      els.viewer.classList.add('hidden');
      els.editorView.classList.add('hidden');
      els.entstehungView.classList.add('hidden');
      els.sitzungView.classList.add('hidden');
      if (cat) renderHome();
      else {
        updateHomeHero(page);
        renderHome();
      }
      updateExtraToolbars();
    }

    function renderViewerCrumb(e) {
      const bar = document.getElementById('viewerBackBar');
      const page = pageForType(e.type);
      bar.innerHTML = '';
      if (page === 'entstehung' && !openedFromMap) {
        bar.classList.add('hidden');
        return;
      }
      bar.classList.remove('hidden');
      if (openedFromMap) {
        const toMap = document.createElement('button');
        toMap.className = 'primary';
        toMap.type = 'button';
        toMap.textContent = '← Zurück zur Karte';
        toMap.onclick = () => showMap();
        bar.appendChild(toMap);
      }
      if (page === 'sitzung') {
        const toSit = document.createElement('button');
        toSit.className = openedFromMap ? 'ghost' : 'primary';
        toSit.type = 'button';
        toSit.textContent = '← Sitzung';
        toSit.onclick = () => showSitzung();
        bar.appendChild(toSit);
        return;
      }
      if (page === 'entstehung' || page === 'map' || page === 'char') return;
      const toRoot = document.createElement('button');
      toRoot.className = openedFromMap ? 'ghost' : 'primary';
      toRoot.type = 'button';
      toRoot.textContent = '← ' + catalogLabel(page);
      toRoot.onclick = () => openCatalogCategory(page, null);
      bar.appendChild(toRoot);
      if (e.type && !isSingleEntryCategory(e.type)) {
        const toCat = document.createElement('button');
        toCat.className = 'ghost';
        toCat.type = 'button';
        toCat.textContent = '← ' + e.type;
        toCat.onclick = () => openCatalogCategory(page, e.type);
        bar.appendChild(toCat);
      }
    }

    function catalogCats() {
      if (currentPage === 'bestiarium' || currentPage === 'glossar' || currentPage === 'codex') {
        return PAGE_CATS[currentPage];
      }
      if (currentPage === 'entstehung') return [STORY_CAT];
      if (currentPage === 'world') return [STORY_CAT, ...KOMPENDIUM_CATS, ...BESTIARIUM_CATS, ...GLOSSAR_CATS];
      return KOMPENDIUM_CATS;
    }

    function sidebarGroups() {
      if (currentPage === 'entstehung') return [{ label: 'Entstehung', cats: [STORY_CAT] }];
      if (currentPage === 'codex') return [{ label: 'Kompendium', cats: KOMPENDIUM_CATS }];
      if (currentPage === 'bestiarium') return [{ label: 'Bestiarium', cats: BESTIARIUM_CATS }];
      if (currentPage === 'glossar') return [{ label: 'Glossar', cats: GLOSSAR_CATS }];
      if (currentPage === 'world') return [
        { label: 'Entstehung', cats: [STORY_CAT] },
        { label: 'Kompendium', cats: KOMPENDIUM_CATS },
        { label: 'Bestiarium', cats: BESTIARIUM_CATS },
        { label: 'Glossar', cats: GLOSSAR_CATS }
      ];
      return [{ label: '', cats: catalogCats() }];
    }

    function defaultTypeForPage(page) {
      return (PAGE_CATS[page] || KOMPENDIUM_CATS)[0];
    }

    function isCatalogPage(page) {
      return page === 'codex' || page === 'bestiarium' || page === 'glossar';
    }

    function wantsSidebar(page) {
      return isDM && (page === 'world' || isCatalogPage(page) || page === 'entstehung');
    }

    function updateSidebarVisibility(page) {
      document.body.classList.toggle('no-sidebar', !wantsSidebar(page));
      if (!wantsSidebar(page)) els.sidebar.classList.remove('open');
    }

    function updateExtraToolbars() {
      const homeBar = document.getElementById('homeToolbar');
      const origBar = document.getElementById('entstehungToolbar');
      const showHomeBar = isDM && !wantsSidebar(currentPage) && isCatalogPage(currentPage) && !els.homeView.classList.contains('hidden');
      const showOrigBar = isDM && currentPage === 'entstehung' && !wantsSidebar('entstehung') && !els.entstehungView.classList.contains('hidden');
      const sitBar = document.getElementById('sitzungToolbar');
      const showSitBar = isDM && currentPage === 'sitzung' && !els.sitzungView.classList.contains('hidden');
      homeBar && homeBar.classList.toggle('hidden', !showHomeBar);
      origBar && origBar.classList.toggle('hidden', !showOrigBar);
      sitBar && sitBar.classList.toggle('hidden', !showSitBar);
    }

    function slugToken(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'x';
    }

    function newEntryId() {
      return 'entry_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function normalizeEntries(list) {
      const used = new Set();
      return (Array.isArray(list) ? list : []).map((e, i) => {
        let id = typeof e.id === 'string' ? e.id.trim() : '';
        if (!id) id = 'legacy_' + slugToken(e.title) + '_' + slugToken(e.type || categories[0]);
        const base = id;
        let n = 2;
        while (used.has(id)) id = base + '_' + n++;
        used.add(id);
        return {
          id: id,
          title: e.title || '',
          type: normalizeType(e.type || categories[0]),
          visibility: e.visibility === 'dm' ? 'dm' : 'player',
          content: e.content || '',
          imageId: typeof e.imageId === 'string' ? e.imageId : '',
          sessionDate: /^\d{4}-\d{2}-\d{2}$/.test(e.sessionDate || '') ? e.sessionDate : '',
          kingdom: String(e.kingdom || '').trim()
        };
      });
    }

    function formatSessionDate(iso) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
      const d = new Date(iso + 'T12:00:00');
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function todayIsoDate() {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    }

    function syncSessionDateField() {
      const wrap = document.getElementById('sessionDateWrap');
      const input = document.getElementById('sessionDate');
      if (!wrap || !input || !els.type) return;
      const show = els.type.value === SESSION_CAT;
      wrap.classList.toggle('hidden', !show);
      if (show && !input.value) input.value = todayIsoDate();
    }

    function kingdomNames() {
      return visibleEntries()
        .filter(e => e.type === KINGDOM_CAT && e.title)
        .map(e => e.title)
        .sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
    }

    function syncTitleKingdomField(selected) {
      const wrap = document.getElementById('titleKingdomWrap');
      const sel = document.getElementById('titleKingdom');
      if (!wrap || !sel) return;
      const show = els.type.value === TITLE_OFFICE_CAT;
      wrap.classList.toggle('hidden', !show);
      if (!show) return;
      const current = selected != null ? String(selected) : sel.value;
      sel.innerHTML = '';
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Kein Königreich';
      sel.appendChild(empty);
      const names = kingdomNames();
      if (current && !names.includes(current)) names.unshift(current);
      names.forEach(name => {
        const o = document.createElement('option');
        o.value = name;
        o.textContent = name;
        sel.appendChild(o);
      });
      sel.value = names.includes(current) || current === '' ? current : '';
    }

    function applyTitleKingdomFilter(list, cat) {
      if ((cat || selectedHomeCat) !== TITLE_OFFICE_CAT || !titleKingdomFilter) return list;
      if (titleKingdomFilter === '__none__') return list.filter(({ e }) => !e.kingdom);
      return list.filter(({ e }) => e.kingdom === titleKingdomFilter);
    }

    function renderTitleKingdomBar() {
      const bar = document.getElementById('titleKingdomBar');
      if (!bar) return;
      const show = selectedHomeCat === TITLE_OFFICE_CAT && !els.homeView.classList.contains('hidden');
      bar.innerHTML = '';
      if (!show) {
        bar.classList.add('hidden');
        return;
      }
      const kingdoms = kingdomNames();
      const titles = visibleEntriesInCat(TITLE_OFFICE_CAT);
      const hasNone = titles.some(({ e }) => !e.kingdom);
      if (!kingdoms.length && !hasNone) {
        bar.classList.add('hidden');
        return;
      }
      bar.classList.remove('hidden');
      const add = (value, label) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = titleKingdomFilter === value ? 'primary' : 'ghost';
        b.textContent = label;
        b.onclick = () => {
          titleKingdomFilter = value;
          renderHome();
          renderSidebar();
        };
        bar.appendChild(b);
      };
      add('', 'Alle');
      kingdoms.forEach(name => add(name, name));
      if (hasNone) add('__none__', 'Ohne Königreich');
    }

    function visibleEntries() {
      return entries.filter(e => isDM || e.visibility === 'player');
    }

    function htmlToText(html) {
      const d = document.createElement('div');
      d.innerHTML = sanitizeHtml(html || '');
      d.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
      d.querySelectorAll('p, div, h1, h2, h3, li, blockquote').forEach(el => {
        el.insertAdjacentText('afterend', '\n\n');
      });
      return (d.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function textToHtml(text) {
      return (text || '').trim().split(/\n{2,}/).filter(Boolean).map(block => {
        return '<p>' + escapeHtml(block).replace(/\n/g, '<br>') + '</p>';
      }).join('');
    }

    function showHome() {
      showWorld();
    }

    function showWorld() {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      openedFromMap = false;
      selectedHomeCat = null;
      showPage('world');
      currentIndex = null;
      currentTitle = null;
      els.homeView.classList.remove('hidden');
      els.viewer.classList.add('hidden');
      els.editorView.classList.add('hidden');
      els.entstehungView.classList.add('hidden');
      els.sitzungView.classList.add('hidden');
      titleKingdomFilter = '';
      updateHomeHero('world');
      renderHome();
      renderSidebar();
      updateExtraToolbars();
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
    }

    function prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    var magicAnim = null;

    function stopMagicTransition() {
      if (!magicAnim) return;
      window.clearTimeout(magicAnim.openTimer);
      window.clearTimeout(magicAnim.endTimer);
      if (magicAnim.fromEl && magicAnim.fromEl.style) magicAnim.fromEl.style.visibility = '';
      if (magicAnim.veil && magicAnim.veil.parentNode) magicAnim.veil.remove();
      els.homeView.classList.remove('is-magic-in');
      els.viewer.classList.remove('is-magic-in');
      els.sidebar.classList.remove('is-magic-in');
      magicAnim = null;
    }

    function playMagicTransition(fromEl, onOpen) {
      if (typeof onOpen !== 'function') return;
      stopMagicTransition();
      if (!fromEl || prefersReducedMotion()) {
        onOpen();
        return;
      }
      const rect = fromEl.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        onOpen();
        return;
      }
      const veil = document.createElement('div');
      veil.className = 'magic-veil';
      veil.innerHTML = '<div class="magic-shade"></div><div class="magic-dust"></div><div class="magic-flash"></div>';
      const flash = veil.querySelector('.magic-flash');
      flash.style.left = (rect.left + rect.width / 2) + 'px';
      flash.style.top = (rect.top + rect.height / 2) + 'px';
      const img = fromEl.querySelector && fromEl.querySelector('img');
      let clone;
      if (img && img.src) {
        clone = document.createElement('img');
        clone.src = img.src;
        clone.alt = '';
      } else {
        clone = fromEl.cloneNode(true);
        clone.removeAttribute('id');
        clone.tabIndex = -1;
        clone.setAttribute('aria-hidden', 'true');
      }
      clone.classList.add('magic-clone');
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      veil.appendChild(clone);
      fromEl.style.visibility = 'hidden';
      document.body.appendChild(veil);
      const anim = { veil: veil, fromEl: fromEl, openTimer: 0, endTimer: 0 };
      magicAnim = anim;
      void veil.offsetWidth;
      requestAnimationFrame(() => {
        if (magicAnim !== anim) return;
        veil.classList.add('is-on');
      });
      anim.openTimer = window.setTimeout(() => {
        if (magicAnim !== anim) return;
        onOpen();
        if (!els.homeView.classList.contains('hidden')) {
          els.homeView.classList.add('is-magic-in');
          Array.from(els.homeCards.querySelectorAll('.card, .world-tile')).forEach((card, i) => {
            card.style.setProperty('--n', String(i));
          });
        }
        if (!els.viewer.classList.contains('hidden')) els.viewer.classList.add('is-magic-in');
        els.sidebar.classList.add('is-magic-in');
        void veil.offsetWidth;
        requestAnimationFrame(() => {
          if (magicAnim !== anim) return;
          veil.classList.add('is-out');
        });
        anim.endTimer = window.setTimeout(() => {
          if (magicAnim !== anim) return;
          stopMagicTransition();
        }, 820);
      }, 400);
    }

    function openWorldCatalog(page, tile) {
      if (!confirmLeaveEditor()) return;
      playMagicTransition(tile, () => showCatalog(page));
    }

    function showCatalog(page) {
      if (!confirmLeaveEditor()) return;
      if (!isCatalogPage(page)) page = 'codex';
      openedFromMap = false;
      selectedHomeCat = null;
      showPage(page);
      currentIndex = null;
      currentTitle = null;
      els.homeView.classList.remove('hidden');
      els.viewer.classList.add('hidden');
      els.editorView.classList.add('hidden');
      els.entstehungView.classList.add('hidden');
      els.sitzungView.classList.add('hidden');
      titleKingdomFilter = '';
      updateHomeHero(page);
      renderHome();
      renderSidebar();
      updateExtraToolbars();
    }

    function showEntstehung() {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      openedFromMap = false;
      showPage('entstehung');
      currentIndex = null;
      currentTitle = null;
      els.homeView.classList.add('hidden');
      els.viewer.classList.add('hidden');
      els.editorView.classList.add('hidden');
      els.sitzungView.classList.add('hidden');
      els.entstehungView.classList.remove('hidden');
      renderEntstehung();
      renderSidebar();
      updateExtraToolbars();
    }

    function showSitzung() {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      openedFromMap = false;
      showPage('sitzung');
      currentIndex = null;
      currentTitle = null;
      els.homeView.classList.add('hidden');
      els.viewer.classList.add('hidden');
      els.editorView.classList.add('hidden');
      els.entstehungView.classList.add('hidden');
      els.sitzungView.classList.remove('hidden');
      renderSitzung();
      updateExtraToolbars();
    }

    function renderSitzung() {
      const box = document.getElementById('sitzungText');
      box.innerHTML = '';
      const sessions = visibleEntries()
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.type === SESSION_CAT)
        .sort((a, b) => {
          const da = a.e.sessionDate || '';
          const db = b.e.sessionDate || '';
          if (da !== db) return db.localeCompare(da);
          return b.i - a.i;
        });
      if (!sessions.length) {
        const empty = document.createElement('p');
        empty.style.color = 'var(--muted)';
        empty.style.textAlign = 'center';
        empty.textContent = isDM
          ? 'Noch kein Sitzungsbericht. Lege als DM einen Eintrag der Kategorie „Updates“ an.'
          : 'Die letzte Sitzung erscheint hier.';
        box.appendChild(empty);
        return;
      }
      sessions.forEach(({ e, i }, pos) => {
        const article = document.createElement('article');
        article.className = 'article origin-article';
        article.id = 'session-' + i;
        if (isDM) {
          const actions = document.createElement('div');
          actions.className = 'article-actions';
          const edit = document.createElement('button');
          edit.className = 'ghost';
          edit.type = 'button';
          edit.textContent = 'Bearbeiten';
          edit.onclick = () => {
            currentIndex = i;
            currentTitle = e.title;
            fillEditor(e);
            openEditor();
          };
          actions.appendChild(edit);
          article.appendChild(actions);
        }
        const kicker = document.createElement('div');
        kicker.className = 'kicker';
        const when = formatSessionDate(e.sessionDate);
        const label = pos === 0 ? 'Letzte Sitzung' : 'Sitzung';
        kicker.textContent = when ? (label + ' · ' + when) : label;
        const heading = document.createElement('h2');
        heading.textContent = e.title;
        heading.style.margin = '0.15rem 0 0.8rem';
        const prose = document.createElement('div');
        prose.className = 'prose';
        prose.innerHTML = entryBodyHtml(e);
        article.appendChild(kicker);
        article.appendChild(heading);
        attachEntryImage(article, e.imageId, e.title);
        article.appendChild(prose);
        box.appendChild(article);
      });
    }

    function renderEntstehung() {
      const box = els.entstehungText;
      box.innerHTML = '';
      const chapters = visibleEntries()
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.type === STORY_CAT)
        .sort((a, b) => a.e.title.localeCompare(b.e.title, 'de'));
      if (!chapters.length) {
        const empty = document.createElement('p');
        empty.style.color = 'var(--muted)';
        empty.style.textAlign = 'center';
        empty.textContent = isDM
          ? 'Noch kein Text. Lege als DM einen Eintrag der Kategorie „Entstehung“ an.'
          : 'Die Entstehungsgeschichte wird hier erscheinen.';
        box.appendChild(empty);
        return;
      }
      chapters.forEach(({ e, i }) => {
        const article = document.createElement('article');
        article.className = 'article origin-article';
        article.id = 'origin-' + i;
        if (isDM) {
          const actions = document.createElement('div');
          actions.className = 'article-actions';
          const edit = document.createElement('button');
          edit.className = 'ghost';
          edit.type = 'button';
          edit.textContent = 'Bearbeiten';
          edit.onclick = () => {
            currentIndex = i;
            currentTitle = e.title;
            fillEditor(e);
            openEditor();
          };
          actions.appendChild(edit);
          article.appendChild(actions);
        }
        const kicker = document.createElement('div');
        kicker.className = 'kicker';
        kicker.textContent = e.title;
        const prose = document.createElement('div');
        prose.className = 'prose';
        prose.innerHTML = entryBodyHtml(e);
        article.appendChild(kicker);
        attachEntryImage(article, e.imageId, e.title);
        article.appendChild(prose);
        box.appendChild(article);
      });
    }

    function renderHome() {
      const nav = document.getElementById('homeCatNav');
      els.homeCards.innerHTML = '';
      els.homeCards.classList.remove('is-world');
      els.homeView.classList.remove('is-world-hub');
      renderTitleKingdomBar();
      if (currentPage === 'world') {
        nav.classList.add('hidden');
        nav.innerHTML = '';
        els.homeCards.classList.add('is-world');
        els.homeView.classList.add('is-world-hub');
        [
          { page: 'codex', title: 'Kompendium', image: 'images/world-kompendium.jpg?v=2' },
          { page: 'bestiarium', title: 'Bestiarium', image: 'images/world-bestiarium.jpg?v=2' },
          { page: 'glossar', title: 'Glossar', image: 'images/world-glossar.jpg?v=2' }
        ].forEach(sec => {
          const btn = document.createElement('button');
          btn.className = 'world-tile';
          btn.type = 'button';
          btn.setAttribute('aria-label', sec.title);
          const img = document.createElement('img');
          img.src = sec.image;
          img.alt = '';
          const caption = document.createElement('span');
          caption.className = 'world-tile-caption';
          caption.textContent = sec.title;
          btn.appendChild(img);
          btn.appendChild(caption);
          btn.onclick = () => openWorldCatalog(sec.page, btn);
          els.homeCards.appendChild(btn);
        });
        return;
      }
      const cats = catalogCats();
      if (selectedHomeCat && cats.includes(selectedHomeCat)) {
        nav.classList.remove('hidden');
        nav.innerHTML = '';
        const back = document.createElement('button');
        back.className = 'primary';
        back.type = 'button';
        back.textContent = '← Zurück zum ' + catalogLabel(currentPage);
        back.onclick = leaveCategory;
        nav.appendChild(back);
        document.getElementById('homeTitle').textContent = selectedHomeCat;
        document.getElementById('homeBlurb').textContent = 'Wähle einen Eintrag oder gehe zurück zu den Kategorien.';
        document.getElementById('homeSeal').textContent = selectedHomeCat.charAt(0);
        renderTitleKingdomBar();
        const matching = applyTitleKingdomFilter(visibleEntriesInCat(selectedHomeCat), selectedHomeCat);
        if (!matching.length) {
          const empty = document.createElement('p');
          empty.style.gridColumn = '1 / -1';
          empty.style.color = 'var(--muted)';
          empty.style.textAlign = 'center';
          empty.textContent = selectedHomeCat === TITLE_OFFICE_CAT && titleKingdomFilter
            ? 'Keine Titel in diesem Königreich.'
            : 'Noch keine Einträge in dieser Kategorie.';
          els.homeCards.appendChild(empty);
        } else {
          matching.forEach(({ e, i }) => {
            const btn = document.createElement('button');
            btn.className = 'card';
            const sub = e.kingdom || (e.visibility === 'dm' ? 'nur DM' : 'Öffnen');
            btn.innerHTML = `<b>${escapeHtml(e.title)}</b><span>${escapeHtml(sub)}</span>`;
            btn.onclick = () => {
              if (!confirmLeaveEditor()) return;
              playMagicTransition(btn, () => loadEntry(i));
            };
            els.homeCards.appendChild(btn);
          });
        }
        return;
      }
      nav.classList.remove('hidden');
      nav.innerHTML = '';
      const toWorld = document.createElement('button');
      toWorld.className = 'primary';
      toWorld.type = 'button';
      toWorld.textContent = '← Zurück zu Thalarion';
      toWorld.onclick = showWorld;
      nav.appendChild(toWorld);
      cats.forEach(cat => {
        const count = visibleEntries().filter(e => e.type === cat).length;
        const btn = document.createElement('button');
        btn.className = 'card';
        btn.innerHTML = `<b>${cat}</b><span>${count} ${count === 1 ? 'Eintrag' : 'Einträge'}</span>`;
        btn.onclick = () => {
          if (!confirmLeaveEditor()) return;
          playMagicTransition(btn, () => openHomeCategory(cat));
        };
        els.homeCards.appendChild(btn);
      });
    }

    function renderSidebar() {
      const s = els.sidebar;
      let actions = document.getElementById('sidebarActions');
      let list = document.getElementById('sidebarList');

      if (!actions || !list) {
        s.innerHTML = '';
        actions = document.createElement('div');
        actions.id = 'sidebarActions';
        actions.className = 'aside-actions';
        s.appendChild(actions);
        list = document.createElement('div');
        list.id = 'sidebarList';
        s.appendChild(list);
      }

      actions.innerHTML = '';
      if (isDM) {
        const add = document.createElement('button');
        add.className = 'primary';
        add.textContent = '+ Neuer Eintrag';
        add.onclick = newEntry;
        const ulAll = document.createElement('button');
        ulAll.className = 'ghost';
        ulAll.textContent = 'Alles hochladen';
        ulAll.onclick = () => document.getElementById('uploadAllInput').click();
        actions.appendChild(add);
        actions.appendChild(ulAll);
      }

      list.innerHTML = '';
      const groups = sidebarGroups();
      groups.forEach(group => {
        if (group.label && groups.length > 1) {
          const label = document.createElement('div');
          label.className = 'aside-group-label';
          label.textContent = group.label;
          list.appendChild(label);
        }
        group.cats.forEach(cat => {
          const matching = applyTitleKingdomFilter(visibleEntriesInCat(cat), cat);

          const box = document.createElement('div');
          box.className = 'cat';
          const head = document.createElement('button');
          head.type = 'button';
          head.className = 'cat-head';
          const open = !!expandedCategories[cat];
          head.innerHTML = `<span class="chev">${open ? '▼' : '▶'}</span><span>${cat}</span><span class="count">${matching.length}</span>`;
          head.onclick = () => {
            if (isSingleEntryCategory(cat) && matching.length === 1) {
              openHomeCategory(cat);
              return;
            }
            expandedCategories[cat] = !expandedCategories[cat];
            if (isCatalogPage(currentPage) && !els.homeView.classList.contains('hidden')) {
              selectedHomeCat = expandedCategories[cat] ? cat : null;
              renderHome();
            }
            renderSidebar();
          };
          box.appendChild(head);

          if (open) {
            matching.forEach(({ e, i }) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'entry' + (currentIndex === i ? ' active' : '');
              b.textContent = e.title;
              if (isDM && e.visibility === 'dm') {
                const lock = document.createElement('span');
                lock.className = 'lock';
                lock.textContent = 'nur DM';
                b.appendChild(lock);
              }
              b.onclick = () => loadEntry(i);
              box.appendChild(b);
            });
          }
          list.appendChild(box);
        });
      });
    }

    function closeSearchResults() {
      document.getElementById('searchResults').classList.add('hidden');
    }

    function placeSearchResults() {
      const input = document.getElementById('globalSearch');
      const box = document.getElementById('searchResults');
      const r = input.getBoundingClientRect();
      const width = Math.max(r.width, 280);
      let left = r.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      box.style.top = (r.bottom + 6) + 'px';
      box.style.left = left + 'px';
      box.style.width = width + 'px';
    }

    function entryMatchesQuery(e, query) {
      if (!query) return false;
      const title = (e.title || '').toLowerCase();
      const body = htmlToText(e.content).toLowerCase();
      return title.includes(query) || body.includes(query);
    }

    function renderGlobalSearch() {
      const box = document.getElementById('searchResults');
      const query = (document.getElementById('globalSearch').value || '').trim().toLowerCase();
      box.innerHTML = '';
      searchHitIndex = -1;
      if (!query) {
        box.classList.add('hidden');
        return;
      }
      let total = 0;
      SEARCH_GROUPS.forEach(group => {
        const hits = entries
          .map((e, i) => ({ e, i }))
          .filter(({ e }) =>
            pageForType(e.type) === group.page &&
            (isDM || e.visibility === 'player') &&
            entryMatchesQuery(e, query)
          );
        if (!hits.length) return;
        total += hits.length;
        const wrap = document.createElement('div');
        wrap.className = 'search-group';
        const label = document.createElement('div');
        label.className = 'search-group-label';
        label.textContent = group.label;
        wrap.appendChild(label);
        hits.forEach(({ e, i }) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'search-hit';
          btn.innerHTML = '<b>' + escapeHtml(e.title) + (isDM && e.visibility === 'dm' ? ' <span class="lock">nur DM</span>' : '') + '</b><span>' + escapeHtml(e.type) + '</span>';
          btn.onclick = () => openSearchHit(i);
          wrap.appendChild(btn);
        });
        box.appendChild(wrap);
      });
      if (!total) {
        const empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.textContent = 'Keine Treffer.';
        box.appendChild(empty);
      }
      placeSearchResults();
      box.classList.remove('hidden');
    }

    function openSearchHit(i) {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      const e = entries[i];
      document.getElementById('globalSearch').value = '';
      closeSearchResults();
      if (e.type === STORY_CAT) {
        showEntstehung();
        requestAnimationFrame(() => {
          const el = document.getElementById('origin-' + i);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
      if (e.type === SESSION_CAT) {
        showSitzung();
        requestAnimationFrame(() => {
          const el = document.getElementById('session-' + i);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }
      loadEntry(i);
    }

    function loadEntry(i, fromMap) {
      if (!confirmLeaveEditor()) return;
      dirty = false;
      openedFromMap = !!fromMap;
      currentIndex = i;
      const e = entries[i];
      currentTitle = e.title;
      showPage(pageForType(e.type));
      els.homeView.classList.add('hidden');
      els.entstehungView.classList.add('hidden');
      els.sitzungView.classList.add('hidden');
      els.editorView.classList.add('hidden');
      els.viewer.classList.remove('hidden');
      document.getElementById('viewTitle').textContent = e.title;
      document.getElementById('viewType').textContent = e.type
        + (e.kingdom ? ' · ' + e.kingdom : '')
        + (e.visibility === 'dm' ? ' · nur DM' : '');
      document.getElementById('viewContent').innerHTML = entryBodyHtml(e);
      showViewImage(e.imageId, e.title);
      els.playerToEdit.classList.toggle('hidden', !isDM);
      const mapActions = document.getElementById('viewerMapActions');
      if (mapActions) mapActions.classList.remove('hidden');
      const setPinBtn = document.getElementById('entrySetPinBtn');
      if (setPinBtn) setPinBtn.classList.toggle('hidden', !isDM);
      updateEntryToKarteBtn();
      if (!selectedHomeCat && !wantsSidebar(pageForType(e.type))) selectedHomeCat = e.type;
      renderViewerCrumb(e);
      renderSidebar();
      setSidebarOpen(false);
      updateExtraToolbars();
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
      persistView();
    }

    function fillEditor(e) {
      fillTypeSelect(currentPage);
      els.title.value = e?.title || '';
      const fallback = defaultTypeForPage(currentPage);
      const allowed = [...els.type.options].map(o => o.value);
      const nextType = e?.type && allowed.includes(e.type) ? e.type : fallback;
      els.type.value = nextType;
      els.visibility.value = e?.visibility || 'player';
      const dateInput = document.getElementById('sessionDate');
      if (nextType === SESSION_CAT) dateInput.value = e?.sessionDate || todayIsoDate();
      else dateInput.value = e?.sessionDate || '';
      syncSessionDateField();
      syncTitleKingdomField(e?.kingdom || '');
      els.content.innerHTML = e?.content || '';
      els.editorHeading.textContent = e?.title ? 'Eintrag bearbeiten' : 'Neuer Eintrag';
      document.getElementById('deleteBtn').disabled = currentIndex === null;
      pendingEntryImage = null;
      editorImageId = e?.imageId || '';
      const imageToken = ++editorImageToken;
      setEditorImagePreview(null);
      if (editorImageId) {
        if (imageCache[editorImageId]) setEditorImagePreview(imageCache[editorImageId]);
        else {
          loadEntryImage(editorImageId).then(data => {
            if (imageToken !== editorImageToken || pendingEntryImage !== null) return;
            if (data) setEditorImagePreview(data);
          }).catch(() => {});
        }
      }
      dirty = false;
    }

    function openEditor() {
      const stay = currentPage === 'map' ? 'codex' : currentPage;
      showPage(stay);
      els.homeView.classList.add('hidden');
      els.entstehungView.classList.add('hidden');
      els.sitzungView.classList.add('hidden');
      els.viewer.classList.add('hidden');
      els.editorView.classList.remove('hidden');
      updateExtraToolbars();
    }

    function newEntry() {
      if (!isDM) return;
      if (!confirmLeaveEditor()) return;
      currentIndex = null;
      fillEditor(null);
      els.type.value = defaultTypeForPage(currentPage);
      if (els.type.value === SESSION_CAT) document.getElementById('sessionDate').value = todayIsoDate();
      syncSessionDateField();
      syncTitleKingdomField('');
      openEditor();
      renderSidebar();
      els.title.focus();
    }

    function editCurrent() {
      if (!isDM || currentIndex === null) return;
      if (!confirmLeaveEditor()) return;
      fillEditor(entries[currentIndex]);
      openEditor();
    }

    async function saveEntry() {
      if (!isDM) return;
      const title = els.title.value.trim();
      if (!title) return toast('Bitte einen Namen vergeben.');
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Speichert…';
      const previous = currentIndex === null ? null : entries[currentIndex];
      let imageId = previous?.imageId || editorImageId || '';
      try {
        if (pendingEntryImage === false) {
          const removedId = imageId;
          imageId = '';
          editorImageId = '';
          if (removedId) deleteEntryImage(removedId).catch(err => console.warn(err));
        } else if (typeof pendingEntryImage === 'string') {
          if (!imageId) imageId = newImageId();
          editorImageId = imageId;
          saveBtn.textContent = 'Speichert Bild…';
          await persistEntryImage(imageId, pendingEntryImage);
        }
        saveBtn.textContent = 'Speichert Codex…';
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Speichern';
        toast('Bild konnte nicht gespeichert werden: ' + (err.message === 'timeout' ? 'Die Cloud hat nicht geantwortet.' : err.message));
        return;
      }
      const e = {
        id: (previous && previous.id) || newEntryId(),
        title: title,
        type: els.type.value,
        visibility: els.visibility.value,
        content: sanitizeHtml(els.content.innerHTML),
        imageId: imageId,
        sessionDate: els.type.value === SESSION_CAT ? (document.getElementById('sessionDate').value || '') : '',
        kingdom: els.type.value === TITLE_OFFICE_CAT ? (document.getElementById('titleKingdom').value || '').trim() : ''
      };
      if (currentIndex === null) {
        entries.push(e);
        currentIndex = entries.length - 1;
      } else {
        entries[currentIndex] = e;
      }
      try {
        await persistWorld();
        dirty = false;
        pendingEntryImage = null;
        currentTitle = e.title;
        syncPinsForEntry(e);
        toast('Gespeichert.');
        if (e.type === STORY_CAT) showEntstehung();
        else if (e.type === SESSION_CAT) showSitzung();
        else loadEntry(currentIndex);
      } catch (err) {
        if (previous === null) entries.pop();
        else entries[currentIndex] = previous;
        if (previous === null) currentIndex = null;
        toast('Speichern fehlgeschlagen: ' + (err.message === 'timeout' ? 'Die Cloud hat nicht geantwortet.' : err.message));
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Speichern';
      }
    }

    async function deleteEntry() {
      if (!isDM || currentIndex === null) return;
      const name = entries[currentIndex].title;
      if (!confirm(`„${name}“ wirklich löschen?`)) return;
      const removed = entries.splice(currentIndex, 1)[0];
      const oldIndex = currentIndex;
      currentIndex = null;
      try {
        await persistWorld();
        if (removed.imageId) {
          try { await deleteEntryImage(removed.imageId); } catch (err) { console.warn(err); }
        }
        dirty = false;
        toast('Eintrag gelöscht.');
        if (removed.type === STORY_CAT) showEntstehung();
        else if (removed.type === SESSION_CAT) showSitzung();
        else showCatalog(pageForType(removed.type));
      } catch (err) {
        entries.splice(oldIndex, 0, removed);
        currentIndex = oldIndex;
        toast('Löschen fehlgeschlagen: ' + err.message);
      }
    }

/* --- Import / Export / DM-Menü --- */
    function visibilityLabel(v) {
      return v === 'dm' ? 'Nur DM' : 'Spieler';
    }

    function parseVisibility(v) {
      const s = (v || '').toLowerCase();
      return /dm|nur/.test(s) ? 'dm' : 'player';
    }

    function fileNameFor(title) {
      const clean = (title || 'eintrag').replace(/[<>:"/\\|?*]+/g, '').trim().slice(0, 60);
      return (clean || 'eintrag') + '.txt';
    }

    function formatEntryBlock(e) {
      return [
        '===== EINTRAG START =====',
        'Titel: ' + (e.title || ''),
        'Kategorie: ' + (e.type || ''),
        'Sichtbarkeit: ' + visibilityLabel(e.visibility),
        '',
        htmlToText(e.content),
        '===== EINTRAG ENDE ====='
      ].join('\n');
    }

    function formatCodexFile(list) {
      return [
        '# Thalarion – Kompendium',
        '# Bitte die Markierungen ===== EINTRAG START ===== und ===== EINTRAG ENDE ===== behalten.',
        '# Titel, Kategorie und Sichtbarkeit in den Kopfzeilen lassen.',
        '',
        list.map(formatEntryBlock).join('\n\n')
      ].join('\n');
    }

    function geminiSectionFor(type) {
      if (type === STORY_CAT) return 'Entstehung';
      if (type === SESSION_CAT) return 'Sitzung';
      if (BESTIARIUM_CATS.includes(type)) return 'Bestiarium';
      if (GLOSSAR_CATS.includes(type)) return 'Glossar';
      return 'Kompendium';
    }

    function formatGeminiDocument(list) {
      const items = (Array.isArray(list) ? list : []).slice().sort((a, b) => {
        const ai = categories.indexOf(normalizeType(a.type));
        const bi = categories.indexOf(normalizeType(b.type));
        if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        const ad = a.sessionDate || '';
        const bd = b.sessionDate || '';
        if (ad !== bd) return ad < bd ? 1 : -1;
        return String(a.title || '').localeCompare(String(b.title || ''), 'de');
      });
      const byType = {};
      const types = [];
      items.forEach(e => {
        const type = categories.includes(normalizeType(e.type)) ? normalizeType(e.type) : (e.type || 'Sonstiges');
        if (!byType[type]) {
          byType[type] = [];
          types.push(type);
        }
        byType[type].push(e);
      });
      const toc = [];
      const body = [];
      let lastSection = '';
      types.forEach(type => {
        const section = geminiSectionFor(type);
        if (section !== lastSection) {
          lastSection = section;
          toc.push('');
          toc.push(section);
          body.push('');
          body.push('════════════════════════════════════');
          body.push(section.toUpperCase());
          body.push('════════════════════════════════════');
        }
        toc.push('  ' + type + ' (' + byType[type].length + ')');
        body.push('');
        body.push('── ' + type + ' ──');
        byType[type].forEach(e => {
          toc.push('    - ' + (e.title || 'Ohne Titel'));
          body.push('');
          body.push('### ' + (e.title || 'Ohne Titel'));
          body.push('Kategorie: ' + (e.type || type));
          if (e.kingdom) body.push('Königreich: ' + e.kingdom);
          body.push('Sichtbarkeit: ' + visibilityLabel(e.visibility));
          if (e.sessionDate) body.push('Datum: ' + formatSessionDate(e.sessionDate));
          body.push('');
          body.push(htmlToText(e.content) || '(Kein Text)');
          body.push('');
          body.push('---');
        });
      });
      return [
        'Thalarion – Das Blutsiegel',
        'Gesamtdokument',
        '',
        'Dieses Dokument enthält Entstehung, Sitzung, Kompendium, Bestiarium und Glossar.',
        'Jeder Eintrag hat eine eigene Überschrift (### Name).',
        'Bilder, Karten-Pins, Kampf und Charakterblätter sind nicht enthalten.',
        '',
        'Anzahl Einträge: ' + items.length,
        'Stand: ' + new Date().toISOString().slice(0, 10),
        '',
        'INHALTSVERZEICHNIS',
        ...toc,
        '',
        ...body,
        ''
      ].join('\n');
    }

    function parseCodexFile(text) {
      const chunks = String(text || '').split(/===== EINTRAG START =====/i).slice(1);
      return chunks.map(chunk => {
        const body = chunk.split(/===== EINTRAG ENDE =====/i)[0];
        const lines = body.replace(/^\uFEFF/, '').split(/\r?\n/);
        const meta = { title: '', type: categories[0], visibility: 'player' };
        let i = 0;
        while (i < lines.length) {
          const line = lines[i];
          const m = line.match(/^\s*(Titel|Kategorie|Sichtbarkeit)\s*:\s*(.*)$/i);
          if (m) {
            const key = m[1].toLowerCase();
            const val = m[2].trim();
            if (key === 'titel') meta.title = val;
            else if (key === 'kategorie') meta.type = normalizeType(val);
            else meta.visibility = parseVisibility(val);
            i += 1;
            continue;
          }
          if (line.trim() === '') {
            i += 1;
            break;
          }
          break;
        }
        const content = lines.slice(i).join('\n').trim();
        return {
          title: meta.title,
          type: categories.includes(meta.type) ? meta.type : normalizeType(meta.type),
          visibility: meta.visibility,
          content: textToHtml(content)
        };
      }).filter(e => e.title);
    }

    function downloadText(filename, text) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function isMyDocumentEntry(e) {
      const type = normalizeType(e.type);
      return type === STORY_CAT ||
        type === SESSION_CAT ||
        KOMPENDIUM_CATS.includes(type) ||
        BESTIARIUM_CATS.includes(type) ||
        GLOSSAR_CATS.includes(type);
    }

    function myDocumentEntries() {
      return entries.filter(isMyDocumentEntry);
    }

    function downloadMyDocument() {
      if (!isDM) return;
      const list = myDocumentEntries();
      if (!list.length) return toast('Es gibt noch keine Einträge.');
      downloadText('Thalarion-Gesamtdokument.txt', formatGeminiDocument(list));
      toast(list.length + ' Einträge in einem Dokument.');
    }

    function closeDmMenu() {
      const list = document.getElementById('dmMenuList');
      const btn = document.getElementById('dmMenuBtn');
      if (list) list.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function toggleDmMenu() {
      if (!isDM) return;
      const list = document.getElementById('dmMenuList');
      const btn = document.getElementById('dmMenuBtn');
      const open = list.classList.contains('hidden');
      list.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function downloadOneEntry() {
      if (!isDM || currentIndex === null) return;
      const e = entries[currentIndex];
      downloadText(fileNameFor(e.title), formatCodexFile([e]));
      toast('Eintrag heruntergeladen.');
    }

    function readUploadedFile(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
        r.readAsText(file, 'UTF-8');
      });
    }

    async function uploadAllEntries(file) {
      if (!isDM || !file) return;
      let parsed;
      try {
        parsed = parseCodexFile(await readUploadedFile(file));
      } catch (err) {
        return toast(err.message);
      }
      if (!parsed.length) return toast('In der Datei wurde kein Eintrag gefunden.');
      if (!confirm(parsed.length + ' Einträge aus der Datei übernehmen und die bisherigen ersetzen?')) return;
      const previous = entries.slice();
      const keep = {};
      previous.forEach(e => {
        if (e.title) keep[e.title.toLowerCase()] = {
          id: e.id || '',
          imageId: e.imageId || '',
          sessionDate: e.sessionDate || '',
          kingdom: e.kingdom || ''
        };
      });
      entries = normalizeEntries(parsed.map(e => Object.assign({}, e, keep[(e.title || '').toLowerCase()] || {})));
      try {
        await persistWorld();
        toast('Alle Einträge übernommen.');
        showHome();
      } catch (err) {
        entries = previous;
        toast('Hochladen fehlgeschlagen: ' + err.message);
      }
    }

    async function uploadOneEntry(file) {
      if (!isDM || !file || currentIndex === null) return;
      let parsed;
      try {
        parsed = parseCodexFile(await readUploadedFile(file));
      } catch (err) {
        return toast(err.message);
      }
      if (!parsed.length) return toast('In der Datei wurde kein Eintrag gefunden.');
      const current = entries[currentIndex];
      const incoming = parsed.find(e => e.title.toLowerCase() === current.title.toLowerCase()) || parsed[0];
      const previous = Object.assign({}, current);
      entries[currentIndex] = Object.assign({}, incoming, {
        id: current.id || incoming.id || newEntryId(),
        imageId: current.imageId || '',
        sessionDate: current.sessionDate || incoming.sessionDate || ''
      });
      try {
        await persistWorld();
        toast('Eintrag übernommen.');
        loadEntry(currentIndex);
      } catch (err) {
        entries[currentIndex] = previous;
        toast('Hochladen fehlgeschlagen: ' + err.message);
      }
    }
