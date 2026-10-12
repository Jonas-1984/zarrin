/*
 * Wireframe globe linking Tehran, Hamburg and Hong Kong.
 * Orthographic projection on a <canvas>: gold graticule, glowing city
 * markers, great-circle arcs and small "cargo" dots travelling along them.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("globe");
  if (!canvas || !canvas.getContext) { return; }

  var ctx = canvas.getContext("2d");
  var SIZE = 240;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  ctx.scale(dpr, dpr);

  var R = 92;                    // globe radius in px
  var C = SIZE / 2;              // centre
  var TILT = 26 * Math.PI / 180; // view latitude
  var GOLD = "212,175,55";
  var LIGHT = "243,217,139";
  var RAD = Math.PI / 180;

  var cities = [
    { name: "Tehran", lat: 35.69, lon: 51.39, dy: 17 },
    { name: "Hamburg", lat: 53.55, lon: 9.99, dy: -10 },
    { name: "Hong Kong", lat: 22.32, lon: 114.17, dy: -10 }
  ];
  var routes = [[0, 1], [0, 2], [1, 2]];

  function toVec(lat, lon) {
    var p = lat * RAD, l = lon * RAD;
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  }

  // project a unit vector (scaled by r) for the view centred on lon0
  function project(v, r, lon0) {
    var lat = Math.asin(v[2]);
    var dl = Math.atan2(v[1], v[0]) - lon0;
    var cp = Math.cos(lat), sp = Math.sin(lat);
    return {
      x: C + R * r * cp * Math.sin(dl),
      y: C - R * r * (Math.cos(TILT) * sp - Math.sin(TILT) * cp * Math.cos(dl)),
      z: Math.sin(TILT) * sp + Math.cos(TILT) * cp * Math.cos(dl)
    };
  }

  function slerp(a, b, t) {
    var d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    var om = Math.acos(d), s = Math.sin(om);
    var k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }

  var arcs = routes.map(function (r) {
    var a = toVec(cities[r[0]].lat, cities[r[0]].lon);
    var b = toVec(cities[r[1]].lat, cities[r[1]].lon);
    var lift = 0.1 + 0.14 * Math.acos(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.PI;
    return { a: a, b: b, lift: lift };
  });

  function arcPoint(arc, t, lon0) {
    var v = slerp(arc.a, arc.b, t);
    return project(v, 1 + arc.lift * Math.sin(Math.PI * t), lon0);
  }

  function drawGraticule(lon0) {
    var i, j, pts, prev, p;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "rgba(" + GOLD + ",0.28)";

    function line(latFn, lonFn, n) {
      ctx.beginPath();
      prev = null;
      for (j = 0; j <= n; j++) {
        p = project(toVec(latFn(j), lonFn(j)), 1, lon0);
        if (p.z > 0 && prev && prev.z > 0) { ctx.lineTo(p.x, p.y); }
        else if (p.z > 0) { ctx.moveTo(p.x, p.y); }
        prev = p;
      }
      ctx.stroke();
    }

    for (i = -60; i <= 60; i += 30) {
      line(function () { return i; }, function (k) { return -180 + k * 5; }, 72);
    }
    for (i = -180; i < 180; i += 30) {
      line(function (k) { return -90 + k * 5; }, function () { return i; }, 36);
    }
  }

  function draw(time) {
    var t = time / 1000;
    var lon0 = (62 + 22 * Math.sin(t * 0.18)) * RAD;
    var i, a, p, g;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // glow behind the sphere
    g = ctx.createRadialGradient(C, C, R * 0.8, C, C, R * 1.35);
    g.addColorStop(0, "rgba(" + GOLD + ",0.22)");
    g.addColorStop(1, "rgba(" + GOLD + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(C, C, R * 1.35, 0, 7); ctx.fill();

    // sphere body
    g = ctx.createRadialGradient(C - R * 0.35, C - R * 0.4, R * 0.1, C, C, R);
    g.addColorStop(0, "#343841");
    g.addColorStop(1, "#14161a");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.fill();

    drawGraticule(lon0);

    // rim
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(" + LIGHT + ",0.75)";
    ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.stroke();

    // arcs
    for (i = 0; i < arcs.length; i++) {
      a = arcs[i];
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(" + LIGHT + ",0.9)";
      ctx.setLineDash([4, 5]);
      ctx.lineDashOffset = -t * 14;
      ctx.beginPath();
      var prev = null;
      for (var s = 0; s <= 40; s++) {
        p = arcPoint(a, s / 40, lon0);
        if (p.z > 0 && prev && prev.z > 0) { ctx.lineTo(p.x, p.y); }
        else if (p.z > 0) { ctx.moveTo(p.x, p.y); }
        prev = p;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // cargo dot travelling along the arc
      var u = (t * 0.16 + i * 0.33) % 1;
      p = arcPoint(a, u, lon0);
      if (p.z > 0) {
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(" + LIGHT + ",1)";
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // city markers with pulsing rings
    ctx.font = "600 11px Vazirmatn, sans-serif";
    ctx.textBaseline = "middle";
    for (i = 0; i < cities.length; i++) {
      p = project(toVec(cities[i].lat, cities[i].lon), 1, lon0);
      if (p.z <= 0) { continue; }
      var pulse = (t * 0.7 + i * 0.3) % 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(" + LIGHT + "," + (0.8 * (1 - pulse)) + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 + pulse * 11, 0, 7); ctx.stroke();

      ctx.fillStyle = "rgb(" + LIGHT + ")";
      ctx.shadowColor = "rgba(" + GOLD + ",1)";
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(244,241,234,0.95)";
      var w = ctx.measureText(cities[i].name).width;
      var lx = p.x - w / 2;
      if (lx + w > SIZE - 4) { lx = SIZE - 4 - w; }
      if (lx < 4) { lx = 4; }
      ctx.textAlign = "left";
      ctx.fillText(cities[i].name, lx, p.y + cities[i].dy);
    }
  }

  var running = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loop(time) {
    if (!running) { return; }
    draw(time);
    requestAnimationFrame(loop);
  }

  if (reduce) { draw(0); return; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      if (on && !running) { running = true; requestAnimationFrame(loop); }
      if (!on) { running = false; }
    }).observe(canvas);
  } else {
    running = true;
    requestAnimationFrame(loop);
  }
})();
