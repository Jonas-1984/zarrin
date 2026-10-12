/*
 * Current weather for Tehran (Open-Meteo, no API key needed).
 * Fills the weather card next to the clocks.
 */
(function () {
  "use strict";

  var svg = document.getElementById("wx-svg");
  if (!svg) { return; }

  var tempEl = document.getElementById("wx-temp");
  var descEl = document.getElementById("wx-desc");
  var humEl = document.getElementById("wx-hum");

  var API = "https://api.open-meteo.com/v1/forecast?latitude=35.6892&longitude=51.389" +
    "&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto";

  // WMO weather code -> [Persian description, icon layers]
  function describe(code, day) {
    var body = day ? "sun" : "moon";
    if (code === 0) { return ["آسمان صاف", body]; }
    if (code === 1) { return ["عمدتاً صاف", body]; }
    if (code === 2) { return ["کمی ابری", body + " cloud"]; }
    if (code === 3) { return ["ابری", "cloud"]; }
    if (code === 45 || code === 48) { return ["مه‌آلود", "cloud"]; }
    if (code >= 51 && code <= 57) { return ["نم‌نم باران", "cloud rain"]; }
    if (code >= 61 && code <= 67) { return ["باران", "cloud rain"]; }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) { return ["برف", "cloud snow"]; }
    if (code >= 80 && code <= 82) { return ["رگبار", "cloud rain"]; }
    if (code >= 95) { return ["رعد و برق", "cloud rain bolt"]; }
    return ["—", "cloud"];
  }

  function load() {
    fetch(API)
      .then(function (r) {
        if (!r.ok) { throw new Error(r.status); }
        return r.json();
      })
      .then(function (d) {
        var c = d.current;
        var info = describe(c.weather_code, c.is_day === 1);
        tempEl.textContent = Math.round(c.temperature_2m) + "°";
        descEl.textContent = info[0];
        humEl.textContent = "رطوبت " + Math.round(c.relative_humidity_2m) + "%";
        svg.setAttribute("data-c", info[1]);
      })
      .catch(function () {
        descEl.textContent = "اطلاعات در دسترس نیست";
      });
  }

  load();
  setInterval(load, 15 * 60 * 1000);
})();
