/* Thalarion – Style Lab (Farben + Schreibstile, lokal pro Gerät) */

(function () {
  var THEME_KEY = 'thalarion-theme';
  var FONT_KEY = 'thalarion-font';
  var DEFAULT_THEME = 'thalarion';
  var DEFAULT_FONT = 'normal';
  var THEMES = [
    { id: 'thalarion', label: 'Thalarion', blurb: 'Pergament · Siegelgold' },
    { id: 'emerald', label: 'Smaragd', blurb: 'Tiefes Smaragdgrün' },
    { id: 'ruby', label: 'Rubin', blurb: 'Tiefes Rubinrot' },
    { id: 'sapphire', label: 'Saphir', blurb: 'Tiefes Saphirblau' },
    { id: 'purple', label: 'Lila', blurb: 'Tiefes Violett' },
    { id: 'yellow', label: 'Gelb', blurb: 'Tiefes Gelb' },
    { id: 'orange', label: 'Orange', blurb: 'Tiefes Orange' },
    { id: 'white', label: 'Weiß', blurb: 'Silberweiß' },
    { id: 'brown', label: 'Braun', blurb: 'Tiefes Braun' }
  ];
  var FONTS = [
    { id: 'normal', label: 'Normal', blurb: 'Cinzel · Source Serif' },
    { id: 'medieval', label: 'Mittelalter', blurb: 'Almendra · überall' },
    { id: 'comic', label: 'Comic Sans', blurb: 'Comic Neue / Comic Sans' },
    { id: 'machine', label: 'Maschine', blurb: 'Monospace · technisch' }
  ];

  function isTheme(id) {
    return THEMES.some(function (t) { return t.id === id; });
  }
  function isFont(id) {
    return FONTS.some(function (t) { return t.id === id; });
  }

  function currentTheme() {
    var raw = '';
    try { raw = localStorage.getItem(THEME_KEY) || ''; } catch (e) {}
    if (raw === 'classic') return DEFAULT_THEME;
    if (isTheme(raw)) return raw;
    return DEFAULT_THEME;
  }

  function currentFont() {
    var raw = '';
    try { raw = localStorage.getItem(FONT_KEY) || ''; } catch (e) {}
    if (isFont(raw)) return raw;
    return DEFAULT_FONT;
  }

  function applyTheme(id) {
    var theme = isTheme(id) ? id : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    document.querySelectorAll('#themeLab [data-theme-id]').forEach(function (el) {
      el.classList.toggle('is-on', el.getAttribute('data-theme-id') === theme);
    });
    syncLabBtn();
  }

  function applyFont(id) {
    var font = isFont(id) ? id : DEFAULT_FONT;
    document.documentElement.setAttribute('data-font', font);
    try { localStorage.setItem(FONT_KEY, font); } catch (e) {}
    document.querySelectorAll('#themeLab [data-font-id]').forEach(function (el) {
      el.classList.toggle('is-on', el.getAttribute('data-font-id') === font);
    });
    syncLabBtn();
  }

  function syncLabBtn() {
    var btn = document.getElementById('themeLabBtn');
    if (!btn) return;
    var custom = currentTheme() !== DEFAULT_THEME || currentFont() !== DEFAULT_FONT;
    btn.classList.toggle('is-on', custom);
  }

  function placeThemeLab() {
    var panel = document.getElementById('themeLab');
    var btn = document.getElementById('themeLabBtn');
    if (!panel || !btn || panel.classList.contains('hidden')) return;
    var r = btn.getBoundingClientRect();
    var gap = 8;
    var margin = 8;
    var width = Math.min(panel.offsetWidth || 304, window.innerWidth - margin * 2);
    var right = Math.max(margin, window.innerWidth - r.right);
    if (r.right - width < margin) right = margin;
    panel.style.width = width + 'px';
    panel.style.right = Math.round(right) + 'px';
    panel.style.left = 'auto';
    panel.style.bottom = 'auto';
    var top = r.bottom + gap;
    var maxH = Math.max(160, window.innerHeight - top - margin);
    panel.style.maxHeight = Math.min(window.innerHeight * 0.7, maxH) + 'px';
    panel.style.top = Math.round(top) + 'px';
    var ph = panel.getBoundingClientRect().height;
    if (top + ph > window.innerHeight - margin && r.top > ph + gap + margin) {
      panel.style.top = Math.round(r.top - gap - ph) + 'px';
      panel.style.maxHeight = Math.min(window.innerHeight * 0.7, r.top - gap - margin) + 'px';
    }
  }

  function setThemeLabOpen(on) {
    var panel = document.getElementById('themeLab');
    var btn = document.getElementById('themeLabBtn');
    if (panel) panel.classList.toggle('hidden', !on);
    if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) {
      requestAnimationFrame(function () {
        placeThemeLab();
        requestAnimationFrame(placeThemeLab);
      });
    }
  }

  function initThemeLab() {
    applyTheme(currentTheme());
    applyFont(currentFont());
    var btn = document.getElementById('themeLabBtn');
    var panel = document.getElementById('themeLab');
    var close = document.getElementById('themeLabClose');
    if (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var open = panel && panel.classList.contains('hidden');
        setThemeLabOpen(!!open);
      });
    }
    if (close) {
      close.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        setThemeLabOpen(false);
      });
    }
    if (panel) {
      panel.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var themeOpt = ev.target.closest('[data-theme-id]');
        if (themeOpt) {
          applyTheme(themeOpt.getAttribute('data-theme-id'));
          return;
        }
        var fontOpt = ev.target.closest('[data-font-id]');
        if (fontOpt) applyFont(fontOpt.getAttribute('data-font-id'));
      });
    }
    document.addEventListener('click', function (ev) {
      if (!panel || panel.classList.contains('hidden')) return;
      if (ev.target.closest('#themeLab') || ev.target.closest('#themeLabBtn')) return;
      setThemeLabOpen(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') setThemeLabOpen(false);
    });
    window.addEventListener('resize', placeThemeLab);
    window.addEventListener('scroll', placeThemeLab, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeLab);
  } else {
    initThemeLab();
  }

  try {
    var savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'classic') savedTheme = DEFAULT_THEME;
    if (savedTheme && isTheme(savedTheme)) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    var savedFont = localStorage.getItem(FONT_KEY);
    if (savedFont && isFont(savedFont)) {
      document.documentElement.setAttribute('data-font', savedFont);
    } else {
      document.documentElement.setAttribute('data-font', DEFAULT_FONT);
    }
  } catch (e) {}
})();
