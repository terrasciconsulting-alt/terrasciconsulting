(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[" + name + "]", e); }
  }

  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    var openBtn = $("[data-menu-open]");
    var closeBtn = $("[data-menu-close]");
    var menu = $("[data-mobile-menu]");
    if (!openBtn || !menu) return;
    var open = function () {
      menu.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
    };
    var close = function () {
      menu.setAttribute("data-open", "false");
      document.body.style.overflow = "";
    };
    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    $$("[data-mobile-menu] a").forEach(function (a) { a.addEventListener("click", close); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  function initHeroReady() {
    // Triggers the CSS load-in choreography (nav fade-down, hero fade-up, headline clip-reveal)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.add("is-ready");
      });
    });
  }

  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    if (typeof IntersectionObserver === "undefined") {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    // Safety net: reveal anything still hidden above the fold after 6s
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href) return;
      var hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;
      var path = href.slice(0, hashIndex);
      var hash = href.slice(hashIndex);
      if (hash === "#" || hash.length < 2) return;
      // Only intercept same-page anchors
      var samePage = path === "" || path === window.location.pathname.split("/").pop();
      if (!samePage) return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      var navOffset = 84;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
  }

  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var note = $("[data-contact-note]");
    var submitBtn = form.querySelector('[type="submit"]');
    var label = submitBtn ? submitBtn.querySelector(".btn-label") : null;

    var setNote = function (text, kind) {
      if (!note) return;
      note.textContent = text;
      note.classList.remove("is-success", "is-error");
      if (kind) note.classList.add(kind);
      note.classList.add("is-visible");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      if (!form.reportValidity()) return;

      form.classList.add("is-sending");
      if (submitBtn) submitBtn.disabled = true;
      if (label) label.textContent = "Enviando…";

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          form.classList.remove("is-sending");
          if (submitBtn) submitBtn.disabled = false;
          if (label) label.textContent = "Enviar mensaje";
          if (result && result.success) {
            form.reset();
            var successMessage = form.getAttribute("data-success-message") || "Tu mensaje fue enviado con éxito. En breve, alguien de nuestro equipo se va a contactar con vos.";
            setNote(successMessage, "is-success");
          } else {
            setNote("No pudimos enviar el mensaje. Escribinos directamente a " + (data.contactEmail || "terrasciconsulting@gmail.com") + ".", "is-error");
          }
        })
        .catch(function () {
          form.classList.remove("is-sending");
          if (submitBtn) submitBtn.disabled = false;
          if (label) label.textContent = "Enviar mensaje";
          setNote("No pudimos enviar el mensaje. Escribinos directamente a " + (data.contactEmail || "terrasciconsulting@gmail.com") + ".", "is-error");
        });
    });
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initMobileMenu, "initMobileMenu");
    safe(initHeroReady, "initHeroReady");
    safe(initReveals, "initReveals");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initContactForm, "initContactForm");
    document.documentElement.classList.add("js-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
