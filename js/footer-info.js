/*
 * Footer info block: date (Persian + Gregorian) and the current weather in
 * Tehran (Open-Meteo, no API key). Follows the FA | EN language switch.
 */
(function () {
  "use strict";

  var box = document.getElementById("foot-info");
  if (!box) { return; }

  var TZ = "Asia/Tehran";

  function isEn() { return window.I18N && window.I18N.lang === "en"; }
  function T(key, fa) { return window.I18N ? window.I18N.t(key, fa) : fa; }

  // Build dates from parts so the word order is stable in every browser
  function parts(locale, opts) {
    opts.timeZone = TZ;
    var p = {};
    new Intl.DateTimeFormat(locale, opts).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p;
  }

  function num(n) {
    return isEn() ? String(n) : Number(n).toLocaleString("fa-IR", { useGrouping: false });
  }

  // --- icons (layers selected by weather condition) ----------------------
  var SUN = '<g transform="translate(%X% %Y%) scale(%S%)"><circle stroke-width=".5" stroke="#f8af18" fill="url(#fw-b)" r="5" cy="24" cx="19"/><path d="M19 15.67V12.5m0 23v-3.17m5.89-14.22l2.24-2.24M10.87 32.13l2.24-2.24m0-11.78l-2.24-2.24m16.26 16.26l-2.24-2.24M7.5 24h3.17m19.83 0h-3.17" stroke-width="2" stroke-linecap="round" stroke="#fbbf24" fill="none"><animateTransform values="0 19 24; 360 19 24" type="rotate" repeatCount="indefinite" dur="45s" attributeName="transform"/></path></g>';
  var MOON = '<g transform="translate(%X% %Y%) scale(%S%)"><path d="M23.5 16.2A9 9 0 1 0 23.5 31.8A8 8 0 0 1 23.5 16.2z" fill="#fde68a" stroke="#f8af18" stroke-width=".5" stroke-linejoin="round"/><circle cx="30" cy="17" r="1" fill="#fde68a"/><circle cx="33.5" cy="23" r=".7" fill="#fde68a"/></g>';
  var CLOUD = '<path d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z" stroke-width=".5" stroke="#e6effc" fill="url(#fw-c)"/>';
  var RAIN = '<g stroke-width="2" stroke-linecap="round" stroke="url(#fw-a)" fill="none">' +
    '<path d="M24.39 43.03l-.78 4.94"><animateTransform values="1 -5; -2 10" type="translate" repeatCount="indefinite" dur="0.7s" attributeName="transform"/></path>' +
    '<path d="M31.39 43.03l-.78 4.94"><animateTransform values="1 -5; -2 10" type="translate" repeatCount="indefinite" dur="0.7s" begin="-0.4s" attributeName="transform"/></path>' +
    '<path d="M38.39 43.03l-.78 4.94"><animateTransform values="1 -5; -2 10" type="translate" repeatCount="indefinite" dur="0.7s" begin="-0.2s" attributeName="transform"/></path></g>';
  var SNOW = '<g fill="#fff">' +
    '<circle cx="24" cy="46" r="1.6"><animateTransform values="1 -4; -2 9" type="translate" repeatCount="indefinite" dur="1.6s" attributeName="transform"/></circle>' +
    '<circle cx="31" cy="46" r="1.6"><animateTransform values="1 -4; -2 9" type="translate" repeatCount="indefinite" dur="1.6s" begin="-0.9s" attributeName="transform"/></circle>' +
    '<circle cx="38" cy="46" r="1.6"><animateTransform values="1 -4; -2 9" type="translate" repeatCount="indefinite" dur="1.6s" begin="-0.4s" attributeName="transform"/></circle></g>';
  var BOLT = '<path d="M31 38l-4 7h4l-2 8 7-10h-4l3-5z" fill="#fbbf24" stroke="#f59e0b" stroke-width=".5"/>';
  var DEFS = '<defs>' +
    '<linearGradient gradientUnits="userSpaceOnUse" y2="28.33" y1="19.67" x2="21.5" x1="16.5" id="fw-b"><stop stop-color="#fbbf24" offset="0"/><stop stop-color="#fbbf24" offset=".45"/><stop stop-color="#f59e0b" offset="1"/></linearGradient>' +
    '<linearGradient gradientUnits="userSpaceOnUse" y2="50.8" y1="21.96" x2="39.2" x1="22.56" id="fw-c"><stop stop-color="#f3f7fe" offset="0"/><stop stop-color="#f3f7fe" offset=".45"/><stop stop-color="#deeafb" offset="1"/></linearGradient>' +
    '<linearGradient gradientUnits="userSpaceOnUse" y2="48.05" y1="42.95" x2="25.47" x1="22.53" id="fw-a"><stop stop-color="#4286ee" offset="0"/><stop stop-color="#4286ee" offset=".45"/><stop stop-color="#0950bc" offset="1"/></linearGradient></defs>';

  function body(day, alone) {
    // centre the sun / moon in the 64x64 icon when it is shown without a cloud
    var t = alone ? (day ? ["7", "1", "1.3"] : ["3", "-9", "1.7"]) : ["0", "0", "1"];
    return (day ? SUN : MOON).replace("%X%", t[0]).replace("%Y%", t[1]).replace("%S%", t[2]);
  }

  // WMO weather code -> [i18n key, Persian text, svg layers]
  function describe(code, day) {
    if (code === 0) { return ["wx.0", "آسمان صاف", body(day, true)]; }
    if (code === 1) { return ["wx.1", "عمدتاً صاف", body(day, true)]; }
    if (code === 2) { return ["wx.2", "کمی ابری", body(day) + CLOUD]; }
    if (code === 3) { return ["wx.3", "ابری", CLOUD]; }
    if (code === 45 || code === 48) { return ["wx.fog", "مه‌آلود", CLOUD]; }
    if (code >= 51 && code <= 57) { return ["wx.drizzle", "نم‌نم باران", CLOUD + RAIN]; }
    if (code >= 61 && code <= 67) { return ["wx.rain", "بارانی", CLOUD + RAIN]; }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) { return ["wx.snow", "برفی", CLOUD + SNOW]; }
    if (code >= 80 && code <= 82) { return ["wx.showers", "رگبار", CLOUD + RAIN]; }
    if (code >= 95) { return ["wx.storm", "رعد و برق", CLOUD + RAIN + BOLT]; }
    return ["", "—", CLOUD];
  }

  // --- render ------------------------------------------------------------
  box.innerHTML =
    '<div class="foot-date"><span class="fa-date"></span><span class="eu-date"></span></div>' +
    '<div class="foot-wx"><div class="wx-icon"></div><div class="wx-text">' +
    '<div class="wx-city"></div>' +
    '<div class="wx-main"><span class="wx-temp">—</span><span class="wx-cond"></span></div>' +
    '<div class="wx-sub"></div></div></div>';

  var faDate = box.querySelector(".fa-date");
  var euDate = box.querySelector(".eu-date");
  var wxIcon = box.querySelector(".wx-icon");
  var wxCity = box.querySelector(".wx-city");
  var wxTemp = box.querySelector(".wx-temp");
  var wxCond = box.querySelector(".wx-cond");
  var wxSub = box.querySelector(".wx-sub");

  function updateDates() {
    if (isEn()) {
      var g = parts("en-US-u-ca-gregory", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      var s = parts("en-US-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });
      faDate.textContent = g.weekday + ", " + g.day + " " + g.month + " " + g.year;
      euDate.textContent = s.day + " " + s.month + " " + s.year.replace(/\D+$/, "") + " (Solar Hijri)";
    } else {
      var a = parts("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      var b = parts("fa-IR-u-ca-gregory", { day: "numeric", month: "long", year: "numeric" });
      faDate.textContent = a.weekday + " " + a.day + " " + a.month + " " + a.year;
      euDate.textContent = b.day + " " + b.month + " " + b.year;
    }
  }

  var last = null; // last weather payload, re-rendered on language change

  function renderWeather() {
    wxCity.textContent = T("wx.city", "تهران");
    if (!last) { return; }
    var c = last.current, d = last.daily;
    var info = describe(c.weather_code, c.is_day === 1);
    wxIcon.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true">' + DEFS + info[2] + "</svg>";
    wxTemp.textContent = num(Math.round(c.temperature_2m)) + "°";
    wxCond.textContent = T(info[0], info[1]);

    var hum = num(Math.round(c.relative_humidity_2m)) + (isEn() ? "%" : "٪");
    wxSub.innerHTML =
      T("wx.humidity", "رطوبت") + " " + hum + " · " + T("wx.wind", "باد") + " " + num(Math.round(c.wind_speed_10m)) + " " + T("wx.kmh", "کیلومتر بر ساعت") +
      "<br>" + T("wx.low", "کمینه") + " " + num(Math.round(d.temperature_2m_min[0])) + "° · " +
      T("wx.high", "بیشینه") + " " + num(Math.round(d.temperature_2m_max[0])) + "°";
  }

  var API = "https://api.open-meteo.com/v1/forecast?latitude=35.6892&longitude=51.389" +
    "&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m" +
    "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";

  function loadWeather() {
    fetch(API)
      .then(function (r) {
        if (!r.ok) { throw new Error(r.status); }
        return r.json();
      })
      .then(function (d) { last = d; renderWeather(); })
      .catch(function () {
        wxCond.textContent = T("wx.unavailable", "اطلاعات آب‌وهوا در دسترس نیست");
      });
  }

  function refresh() { updateDates(); renderWeather(); }

  refresh();
  setInterval(updateDates, 60 * 1000);
  loadWeather();
  setInterval(loadWeather, 15 * 60 * 1000);
  if (window.I18N) { window.I18N.onChange(refresh); }
})();
