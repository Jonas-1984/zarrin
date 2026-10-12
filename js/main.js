(function () {
  "use strict";

  /* ---------- Header: scrolled state + mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.querySelector("#f-consent").addEventListener("change", function () {
      this.closest(".switch").classList.remove("invalid");
      if (this.checked) { status.textContent = ""; }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var consent = form.querySelector("#f-consent");
      if (!consent.checked) {
        consent.closest(".switch").classList.add("invalid");
        status.textContent = "برای ارسال پیام، لطفاً با سیاست حفظ حریم خصوصی موافقت کنید.";
        return;
      }
      var cfg = window.SITE_CONFIG || {};
      var data = new FormData(form);

      if (cfg.formEndpoint) {
        fetch(cfg.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) { throw new Error(r.status); }
            form.reset();
            status.textContent = "پیام شما با موفقیت ارسال شد. سپاسگزاریم.";
          })
          .catch(function () {
            status.textContent = "ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.";
          });
      } else if (cfg.email) {
        var body = "نام: " + data.get("name") + "\nتماس: " + data.get("contact") + "\n\n" + data.get("message");
        window.location.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent(data.get("subject") || "") + "&body=" + encodeURIComponent(body);
      } else {
        status.textContent = "فرم تماس هنوز فعال نشده است.";
      }
    });
  }
})();
