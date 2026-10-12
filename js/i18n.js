/*
 * Language support (fa is the default and lives directly in the HTML).
 *
 * Every translatable element carries data-i18n="key". To add English:
 *   1. Fill the values in js/lang/en.js.
 *   2. That's it – as soon as en.js contains at least one non-empty value,
 *      the language switch appears in the header and the page flips to LTR.
 *
 * Also supported: data-i18n-placeholder="key" and <title data-i18n="key">.
 */
(function () {
  "use strict";

  var dict = { en: window.I18N_EN || {} };
  var btn = document.querySelector(".lang-switch");
  var hasEn = Object.keys(dict.en).some(function (k) { return dict.en[k]; });
  if (!btn || !hasEn) { return; }

  var els = document.querySelectorAll("[data-i18n], [data-i18n-placeholder]");

  // remember the original Persian text so we can switch back
  els.forEach(function (el) {
    if (el.hasAttribute("data-i18n")) { el.dataset.fa = el.textContent; }
    if (el.hasAttribute("data-i18n-placeholder")) { el.dataset.faPlaceholder = el.getAttribute("placeholder") || ""; }
  });

  function apply(lang) {
    var en = lang === "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = en ? "ltr" : "rtl";
    els.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key) { el.textContent = (en && dict.en[key]) || el.dataset.fa; }
      var pkey = el.getAttribute("data-i18n-placeholder");
      if (pkey) { el.setAttribute("placeholder", (en && dict.en[pkey]) || el.dataset.faPlaceholder); }
    });
    btn.textContent = en ? "فارسی" : "EN";
    try { localStorage.setItem("lang", lang); } catch (e) { /* storage unavailable */ }
  }

  btn.style.display = "inline-block";
  btn.addEventListener("click", function () {
    apply(document.documentElement.lang === "en" ? "fa" : "en");
  });

  var saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) { /* storage unavailable */ }
  if (saved === "en") { apply("en"); } else { btn.textContent = "EN"; }
})();
