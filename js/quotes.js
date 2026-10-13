/*
 * Footer quote slider (desktop footer, middle box): a round portrait, the
 * name, a short description and one quote. Slides change every 6 seconds with
 * a fade + blur. Follows the FA | EN language switch.
 */
(function () {
  "use strict";

  var box = document.querySelector(".foot-mid");
  if (!box) { return; }

  var INTERVAL = 6000;

  var PEOPLE = [
    { img: "pitter-docker.jpg", key: "drucker",
      name: "پیتر دراکر", role: "نظریه‌پرداز مدیریت",
      quote: "تجارت یعنی بازاریابی، و هدف تجارت ایجاد و حفظ مشتری است" },
    { img: "henri-ford.jpg", key: "ford",
      name: "هنری فورد", role: "بنیانگذار خودروسازی فورد",
      quote: "توقف تبلیغات برای صرفه‌جویی در پول، مثل متوقف کردن ساعت برای صرفه‌جویی در وقت است" },
    { img: "warrn-buffet.jpg", key: "buffett",
      name: "وارن بافت", role: "سرمایه‌گذار بزرگ",
      quote: "قانون اول: هرگز پول خود را از دست ندهید. قانون دوم: قانون اول را هرگز فراموش نکنید" },
    { img: "cuka.jpg", key: "iacocca",
      name: "لی لاکوکا", role: "مدیر ارتباطات و صنعتگر",
      quote: "در نهایت، تمام فعالیت‌های تجاری در سه کلمه خلاصه می‌شوند: کارکنان، محصول و سود" },
    { img: "kiusaki.jpg", key: "kiyosaki",
      name: "رابرت کیوساکی", role: "نویسنده و کارآفرین",
      quote: "ذهن آموزش‌دیده، قدرتمندترین دارایی و پول‌سازترین ابزار شماست" },
    { img: "Steve_Jobs.jpg", key: "jobs",
      name: "استیو جابز", role: "بنیانگذار اپل",
      quote: "به جای تأسف خوردن بر گذشته، با اشتیاق به استقبال آینده بروید" }
  ];

  function T(key, fa) { return window.I18N ? window.I18N.t(key, fa) : fa; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text) { n.textContent = text; }
    return n;
  }

  var slides = [];
  var texts = [];

  PEOPLE.forEach(function (p, i) {
    var slide = el("figure", "quote-slide" + (i === 0 ? " is-active" : ""));
    var img = el("img", "quote-photo");
    img.src = "images/" + p.img;
    img.alt = "";
    img.decoding = "async";
    if (i > 0) { img.loading = "lazy"; }
    var body = el("div", "quote-body");
    var name = el("h3", "quote-name");
    var role = el("p", "quote-role");
    var quote = el("blockquote", "quote-text");
    body.appendChild(name); body.appendChild(role); body.appendChild(quote);
    slide.appendChild(img); slide.appendChild(body);
    box.appendChild(slide);
    slides.push(slide);
    texts.push({ p: p, img: img, name: name, role: role, quote: quote });
  });

  function render() {
    texts.forEach(function (t) {
      var k = "quote." + t.p.key;
      t.name.textContent = T(k + ".name", t.p.name);
      t.role.textContent = T(k + ".role", t.p.role);
      t.quote.textContent = T(k + ".quote", t.p.quote);
      t.img.alt = t.name.textContent;
    });
  }
  render();
  if (window.I18N) { window.I18N.onChange(render); }

  var current = 0;
  var timer = null;

  function show(n) {
    slides[current].classList.remove("is-active");
    current = n % slides.length;
    slides[current].classList.add("is-active");
  }
  function start() { stop(); timer = setInterval(function () { show(current + 1); }, INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  box.addEventListener("mouseenter", stop);
  box.addEventListener("mouseleave", start);
  start();
})();
