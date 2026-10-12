/*
 * Language support: Persian (default, written directly in the HTML) and English.
 *
 *  - data-i18n="key"             -> element text
 *  - data-i18n-alt="key"         -> img alt
 *  - data-i18n-aria="key"        -> aria-label
 *  - data-i18n-placeholder="key" -> placeholder
 *
 * English strings live in js/lang/en.js. Other scripts use window.I18N:
 *   I18N.t(key, persianFallback), I18N.lang, I18N.onChange(fn)
 * The FA | EN switch in the header calls I18N.set().
 */
(function () {
  "use strict";

  var en = window.I18N_EN || {};
  var listeners = [];
  var lang = "fa";

  var els = document.querySelectorAll("[data-i18n], [data-i18n-alt], [data-i18n-aria], [data-i18n-placeholder]");

  // remember the original Persian values so we can switch back
  els.forEach(function (el) {
    if (el.hasAttribute("data-i18n")) { el.dataset.fa = el.textContent; }
    if (el.hasAttribute("data-i18n-alt")) { el.dataset.faAlt = el.getAttribute("alt") || ""; }
    if (el.hasAttribute("data-i18n-aria")) { el.dataset.faAria = el.getAttribute("aria-label") || ""; }
    if (el.hasAttribute("data-i18n-placeholder")) { el.dataset.faPlaceholder = el.getAttribute("placeholder") || ""; }
  });

  var toggle = document.querySelector(".lang-toggle");

  function pick(key, fa) { return (lang === "en" && en[key]) || fa; }

  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";

    els.forEach(function (el) {
      var k;
      if ((k = el.getAttribute("data-i18n"))) { el.textContent = pick(k, el.dataset.fa); }
      if ((k = el.getAttribute("data-i18n-alt"))) { el.setAttribute("alt", pick(k, el.dataset.faAlt)); }
      if ((k = el.getAttribute("data-i18n-aria"))) { el.setAttribute("aria-label", pick(k, el.dataset.faAria)); }
      if ((k = el.getAttribute("data-i18n-placeholder"))) { el.setAttribute("placeholder", pick(k, el.dataset.faPlaceholder)); }
    });

    if (toggle) {
      toggle.setAttribute("aria-checked", String(lang === "en"));
      toggle.classList.toggle("is-en", lang === "en");
    }
    listeners.forEach(function (fn) { fn(lang); });
  }

  function set(l) {
    lang = l === "en" ? "en" : "fa";
    try { localStorage.setItem("lang", lang); } catch (e) { /* storage unavailable */ }
    apply();
  }

  window.I18N = {
    get lang() { return lang; },
    t: pick,
    set: set,
    onChange: function (fn) { listeners.push(fn); }
  };

  if (toggle) {
    toggle.addEventListener("click", function () { set(lang === "en" ? "fa" : "en"); });
  }

  // initial language: ?lang=en|fa, then the saved choice, otherwise Persian
  var initial = "fa";
  try {
    var q = /[?&]lang=(en|fa)\b/.exec(location.search);
    initial = (q && q[1]) || localStorage.getItem("lang") || "fa";
  } catch (e) { /* ignore */ }

  lang = initial === "en" ? "en" : "fa";
  if (lang === "en") { apply(); } else if (toggle) { toggle.setAttribute("aria-checked", "false"); }
})();
