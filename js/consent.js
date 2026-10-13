/*
 * Cookie / external-services consent.
 *
 * The site itself sets no tracking cookies. It stores only two small items in
 * the browser (localStorage): the chosen language and this consent choice.
 * Optional features that contact third-party servers (currently the weather
 * widget -> Open-Meteo) only run after the visitor allows them.
 *
 * To add a new optional category later, add an entry to CATEGORIES (and its
 * texts to js/lang/en.js) and ask CONSENT.has("id") before loading anything.
 *
 *   CONSENT.has(id)        -> true if allowed
 *   CONSENT.onChange(fn)   -> fn() after every change
 *   CONSENT.open()         -> opens the settings dialog
 *
 * Any element with the attribute data-cookie-settings reopens the dialog.
 */
(function () {
  "use strict";

  var KEY = "zarrin-consent";
  var VERSION = 1; // raise it to ask everybody again after the categories changed

  // Persian texts are the defaults; English ones live in js/lang/en.js (cc.*)
  var CATEGORIES = [
    { id: "necessary", locked: true,
      title: "ضروری",
      text: "ذخیره‌ی زبان انتخابی و همین انتخاب شما. بدون این موارد سایت درست کار نمی‌کند و ردیابی انجام نمی‌شود." },
    { id: "external", locked: false,
      title: "سرویس‌های خارجی (آب‌وهوا)",
      text: "نمایش وضعیت آب‌وهوای تهران از سرویس Open-Meteo. هنگام بارگذاری، آدرس IP شما به سرور این سرویس ارسال می‌شود." }
  ];

  var FA = {
    "cc.title": "کوکی‌ها و حریم خصوصی",
    "cc.banner": "ما فقط از ذخیره‌سازی ضروری استفاده می‌کنیم. برای نمایش آب‌وهوا از یک سرویس خارجی استفاده می‌شود که فقط با اجازه‌ی شما فعال می‌شود. می‌توانید هر زمان انتخاب خود را تغییر دهید.",
    "cc.more": "سیاست حفظ حریم خصوصی",
    "cc.reject": "فقط ضروری",
    "cc.settings": "تنظیمات",
    "cc.accept": "پذیرش همه",
    "cc.save": "ذخیره‌ی انتخاب",
    "cc.dlgtitle": "تنظیمات کوکی‌ها",
    "cc.dlgintro": "انتخاب کنید کدام موارد اختیاری مجاز باشند. انتخاب شما فقط در همین مرورگر ذخیره می‌شود."
  };
  CATEGORIES.forEach(function (c) { FA["cc." + c.id + ".title"] = c.title; FA["cc." + c.id + ".text"] = c.text; });

  function T(key) { return window.I18N ? window.I18N.t(key, FA[key]) : FA[key]; }

  // ---------- stored state ----------
  function read() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === VERSION) { return s; }
    } catch (e) { /* storage unavailable or corrupt */ }
    return null;
  }

  var state = read();
  var listeners = [];

  function write(choice) {
    var s = { v: VERSION, t: new Date().toISOString() };
    CATEGORIES.forEach(function (c) { s[c.id] = c.locked ? true : !!choice[c.id]; });
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
    state = s;
    listeners.forEach(function (fn) { fn(); });
  }

  window.CONSENT = {
    has: function (id) { return !!(state && state[id]); },
    onChange: function (fn) { listeners.push(fn); },
    open: function () { openDialog(); }
  };

  // ---------- UI ----------
  // Every translatable node remembers its key (data-cc) so a language switch
  // can refresh an open banner or dialog.
  function el(tag, cls, key) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (key) { n.setAttribute("data-cc", key); n.textContent = T(key); }
    return n;
  }

  var banner = null, dialog = null, lastFocus = null;

  function allChoice(v) {
    var c = {};
    CATEGORIES.forEach(function (x) { c[x.id] = v; });
    return c;
  }

  function closeAll(restoreFocus) {
    if (banner) { banner.remove(); banner = null; }
    if (dialog) { dialog.remove(); dialog = null; document.body.classList.remove("cc-lock"); }
    if (restoreFocus !== false && lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    lastFocus = null;
  }

  function button(cls, key, onClick) {
    var b = el("button", "btn btn-sm " + cls, key);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function withPrivacyLink(p) {
    p.appendChild(document.createTextNode(" "));
    var a = el("a", "cc-link", "cc.more");
    a.href = "privacy.html";
    p.appendChild(a);
  }

  function showBanner() {
    if (banner || dialog) { return; }
    banner = el("div", "cc-banner glass");
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", T("cc.title"));
    var p = el("p", "cc-text", "cc.banner");
    withPrivacyLink(p);
    var row = el("div", "cc-actions");
    row.appendChild(button("btn-ghost", "cc.reject", function () { write(allChoice(false)); closeAll(false); }));
    row.appendChild(button("btn-ghost", "cc.settings", function () { openDialog(); }));
    row.appendChild(button("btn-gold", "cc.accept", function () { write(allChoice(true)); closeAll(false); }));
    banner.appendChild(el("h2", "cc-title", "cc.title"));
    banner.appendChild(p);
    banner.appendChild(row);
    document.body.appendChild(banner);
  }

  function dismissWithoutSaving() {
    var had = state;
    closeAll();
    if (!had) { showBanner(); }
  }

  function openDialog() {
    if (dialog) { return; }
    lastFocus = document.activeElement;
    if (banner) { banner.remove(); banner = null; }
    document.body.classList.add("cc-lock");

    dialog = el("div", "cc-overlay");
    var box = el("div", "cc-dialog glass");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "cc-dlg-title");

    var h = el("h2", "cc-title", "cc.dlgtitle");
    h.id = "cc-dlg-title";
    var intro = el("p", "cc-text", "cc.dlgintro");
    withPrivacyLink(intro);
    box.appendChild(h);
    box.appendChild(intro);

    var inputs = {};
    CATEGORIES.forEach(function (c) {
      var item = el("div", "cc-cat");
      var label = el("label", "switch");
      var input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      input.checked = c.locked ? true : (state ? !!state[c.id] : false);
      input.disabled = !!c.locked;
      inputs[c.id] = input;
      var track = el("span", "track");
      track.setAttribute("aria-hidden", "true");
      label.appendChild(input);
      label.appendChild(track);
      label.appendChild(el("span", "cc-cat-title", "cc." + c.id + ".title"));
      item.appendChild(label);
      item.appendChild(el("p", "cc-cat-text", "cc." + c.id + ".text"));
      box.appendChild(item);
    });

    function chosen() {
      var c = {};
      CATEGORIES.forEach(function (x) { c[x.id] = inputs[x.id].checked; });
      return c;
    }
    var row = el("div", "cc-actions");
    row.appendChild(button("btn-ghost", "cc.reject", function () { write(allChoice(false)); closeAll(); }));
    row.appendChild(button("btn-ghost", "cc.save", function () { write(chosen()); closeAll(); }));
    row.appendChild(button("btn-gold", "cc.accept", function () { write(allChoice(true)); closeAll(); }));
    box.appendChild(row);

    dialog.appendChild(box);
    document.body.appendChild(dialog);

    // Esc closes without saving; Tab stays inside the dialog
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { dismissWithoutSaving(); return; }
      if (e.key !== "Tab") { return; }
      var f = box.querySelectorAll("a[href], button, input:not([disabled])");
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    dialog.addEventListener("mousedown", function (e) { if (e.target === dialog) { dismissWithoutSaving(); } });
    var firstBtn = box.querySelector("button");
    if (firstBtn) { firstBtn.focus(); }
  }

  // ---------- language switch: refresh the texts of an open banner / dialog ----------
  function retranslate() {
    document.querySelectorAll("[data-cc]").forEach(function (n) {
      var txt = T(n.getAttribute("data-cc"));
      if (n.firstChild && n.firstChild.nodeType === 3) { n.firstChild.nodeValue = txt; } else { n.textContent = txt; }
    });
    if (banner) { banner.setAttribute("aria-label", T("cc.title")); }
  }
  if (window.I18N) { window.I18N.onChange(retranslate); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (t) { e.preventDefault(); openDialog(); }
  });

  if (!state) { showBanner(); }
})();
