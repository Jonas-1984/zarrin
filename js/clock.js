/*
 * Flip clocks for the footer-top panel.
 * Each <div class="clock" data-tz="Area/City"> is filled with HH:MM:SS digits.
 * A digit flips (top half folds down) whenever its value changes.
 */
(function () {
  "use strict";

  var FLIP_MS = 600;

  function half(cls, value) {
    var el = document.createElement("div");
    el.className = "half " + cls;
    var s = document.createElement("span");
    s.textContent = value;
    el.appendChild(s);
    return el;
  }

  function Digit() {
    this.value = "0";
    this.el = document.createElement("div");
    this.el.className = "digit";
    this.top = half("top", "0");
    this.bottom = half("bottom", "0");
    this.leaf = document.createElement("div");
    this.leaf.className = "leaf";
    this.front = half("front", "0");
    this.back = half("back", "0");
    this.leaf.appendChild(this.front);
    this.leaf.appendChild(this.back);
    this.el.appendChild(this.top);
    this.el.appendChild(this.bottom);
    this.el.appendChild(this.leaf);
    this.timer = null;
  }

  function text(h, v) { h.firstChild.textContent = v; }

  Digit.prototype.set = function (v, animate) {
    if (v === this.value) { return; }
    var self = this, old = this.value;
    this.value = v;
    clearTimeout(this.timer);
    this.leaf.className = "leaf";

    text(this.top, v);
    if (!animate) { text(this.bottom, v); return; }

    text(this.front, old);
    text(this.back, v);
    text(this.bottom, old);
    this.leaf.className = "leaf on";
    void this.leaf.offsetWidth; // restart the transition
    this.leaf.className = "leaf on go";
    this.timer = setTimeout(function () {
      text(self.bottom, v);
      self.leaf.className = "leaf";
    }, FLIP_MS + 40);
  };

  function build(root) {
    var digits = [];
    for (var i = 0; i < 6; i++) {
      if (i > 0 && i % 2 === 0) {
        var sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = ":";
        root.appendChild(sep);
      }
      var d = new Digit();
      digits.push(d);
      root.appendChild(d.el);
    }
    return digits;
  }

  var clocks = [].map.call(document.querySelectorAll(".clock[data-tz]"), function (root) {
    return {
      fmt: new Intl.DateTimeFormat("en-GB", {
        timeZone: root.getAttribute("data-tz"),
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
      }),
      digits: build(root)
    };
  });

  var first = true;
  function tick() {
    var now = new Date();
    clocks.forEach(function (c) {
      var p = {};
      c.fmt.formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
      var s = p.hour + p.minute + p.second;
      for (var i = 0; i < 6; i++) { c.digits[i].set(s.charAt(i), !first); }
    });
    first = false;
  }

  tick();
  setInterval(tick, 250);
})();
