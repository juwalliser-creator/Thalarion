/* Thalarion – UI-Helfer (Toast, Events, Speicher, Sanitize) – Phase 1.3 */

    function fmt(cmd) { try { document.execCommand(cmd, false, null); } catch (err) {} }
    function fmtValue(cmd, value) { if (!value) return; try { document.execCommand(cmd, false, value); } catch (err) {} }

    function toast(msg, ms) {
      if (!els.toast) return;
      els.toast.textContent = msg;
      els.toast.classList.remove('hidden');
      clearTimeout(toast._t);
      if (ms === 0) return;
      toast._t = setTimeout(() => els.toast.classList.add('hidden'), typeof ms === 'number' ? ms : 2600);
    }

    function writeLocal(key, value) {
      if (!localStorageOk) return false;
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (err) {
        localStorageOk = false;
        toast('Lokaler Speicher ist voll. Die Cloud gilt weiter, dieser Browser nicht.');
        return false;
      }
    }

    function encodeSecret(value) {
      try {
        return btoa(value || '');
      } catch (err) {
        throw new Error('Bitte nur Buchstaben, Zahlen und einfache Zeichen im Passwort.');
      }
    }

    function persistLocal() {
      writeLocal(LOCAL_KEY, JSON.stringify({
        updatedAt: worldUpdatedAt,
        entries: entries
      }));
    }

    function sanitizeHtml(html) {
      if (!html) return '';
      const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
      const root = doc.body && doc.body.firstElementChild;
      if (!root) return '';
      const blocked = {
        script: 1, iframe: 1, object: 1, embed: 1, link: 1, meta: 1, form: 1,
        input: 1, button: 1, textarea: 1, base: 1, style: 1, svg: 1, math: 1,
        foreignobject: 1, video: 1, audio: 1, source: 1, frame: 1, frameset: 1, applet: 1
      };
      const walk = node => {
        [...node.children].forEach(child => {
          const tag = child.tagName.toLowerCase();
          if (blocked[tag]) {
            child.remove();
            return;
          }
          [...child.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const val = attr.value || '';
            if (
              name.startsWith('on') ||
              name === 'style' ||
              name === 'srcdoc' ||
              name === 'xlink:href' ||
              name === 'href' && /^\s*javascript:/i.test(val) ||
              /javascript:/i.test(val) ||
              /data:text\/html/i.test(val) ||
              /data:image\/svg\+xml/i.test(val)
            ) {
              child.removeAttribute(attr.name);
            }
          });
          walk(child);
        });
      };
      walk(root);
      return root.innerHTML;
    }

    function escapeAttr(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function onClick(id, handler) {
      const node = document.getElementById(id);
      if (node) node.onclick = handler;
    }

    function onEv(id, type, handler, opts) {
      const node = document.getElementById(id);
      if (node) node.addEventListener(type, handler, opts);
    }

    function safeBind(label, fn) {
      try {
        fn();
      } catch (err) {
        console.warn('[Thalarion] bind', label, err);
      }
    }
