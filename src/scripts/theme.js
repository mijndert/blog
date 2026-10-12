// Theme picker. The theme list lives in src/_data/themes.json and is rendered
// into the nav as swatch buttons, so this script reads ids and colours from
// the DOM instead of keeping its own copy. The chosen theme is stored in
// localStorage under "theme" and applied before first paint by the inline
// script in base.html; without a stored theme, prefers-color-scheme decides.
(function () {
  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');

  var picker = document.querySelector('[data-theme-picker]');
  if (!picker) return;

  var options = picker.querySelector('.theme-options');
  var swatches = Array.prototype.slice.call(options.querySelectorAll('[data-theme-value]'));
  var toggle = picker.querySelector('.theme-toggle');
  var currentSwatch = toggle.querySelector('.theme-swatch--current');

  function activeTheme() {
    return root.getAttribute('data-theme') || (systemDark.matches ? 'mocha' : 'latte');
  }

  function swatchFor(id) {
    for (var i = 0; i < swatches.length; i++) {
      if (swatches[i].getAttribute('data-theme-value') === id) return swatches[i];
    }
    return null;
  }

  function updateThemeColor() {
    var base = getComputedStyle(root).getPropertyValue('--ctp-base').trim();
    if (!base) return;
    // Both tags carry a media query; set both so the browser chrome follows
    // the active theme whatever the OS preference is.
    for (var i = 0; i < themeColorMetas.length; i++) {
      themeColorMetas[i].setAttribute('content', base);
    }
  }

  // Sync the toggle swatch, hide the active theme's button and update
  // theme-color. Called on load, on pick and on OS scheme changes.
  function render() {
    var active = swatchFor(activeTheme());
    swatches.forEach(function (btn) {
      btn.hidden = btn === active;
    });
    if (active) {
      currentSwatch.style.setProperty('--swatch-bg', active.style.getPropertyValue('--swatch-bg'));
      currentSwatch.style.setProperty('--swatch-accent', active.style.getPropertyValue('--swatch-accent'));
    }
    updateLabel();
    updateThemeColor();
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  function updateLabel() {
    var active = swatchFor(activeTheme());
    toggle.setAttribute('aria-label', 'Theme' + (active ? ' (current: ' + active.getAttribute('aria-label') + ')' : ''));
  }

  function setOpen(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    options.hidden = !open;
    if (open) {
      // The swatches sit before the toggle in the DOM, so move focus onto the
      // first one; Tab then walks through them and back to the toggle.
      var first = options.querySelector('[data-theme-value]:not([hidden])');
      if (first) first.focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  function applyTheme(id) {
    root.setAttribute('data-theme', id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
    render();
  }

  toggle.addEventListener('click', function () {
    setOpen(!isOpen(), true);
  });

  swatches.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(btn.getAttribute('data-theme-value'));
      setOpen(false, true);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false, true);
    }
  });

  // Close on a click elsewhere, leaving focus where the user put it.
  document.addEventListener('click', function (e) {
    if (isOpen() && !picker.contains(e.target)) setOpen(false, false);
  });

  // Close when keyboard focus moves out of the picker.
  picker.addEventListener('focusout', function (e) {
    if (isOpen() && e.relatedTarget && !picker.contains(e.relatedTarget)) setOpen(false, false);
  });

  // Visitors who never picked a theme keep following the OS live.
  systemDark.addEventListener('change', function () {
    if (!root.hasAttribute('data-theme')) render();
  });

  render();
  picker.hidden = false;
})();
