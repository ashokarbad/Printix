/*
 * Printix — shared page behaviour: navigation and contact links from config.
 */
(function () {
  "use strict";

  var cfg = window.PRINTIX_CONFIG;
  var lib = window.PrintixLib;

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function hoursText() {
    return (cfg.hoursDays ? cfg.hoursDays + ", " : "") + cfg.hoursTime;
  }

  /* Fill contact details from config so they live in one place. */
  function applyConfig() {
    document.querySelectorAll("[data-wa]").forEach(function (a) {
      a.href = lib.whatsappLink(cfg.whatsappNumber, a.getAttribute("data-wa") || "Hi Printix, I'd like to know more about your printing.");
      a.target = "_blank";
      a.rel = "noopener";
    });
    document.querySelectorAll("[data-tel]").forEach(function (a) {
      a.href = "tel:+" + cfg.whatsappNumber.replace(/\D/g, "");
    });
    document.querySelectorAll("[data-phone-text]").forEach(function (el) { el.textContent = cfg.phoneDisplay; });
    document.querySelectorAll("[data-hours-text]").forEach(function (el) { el.textContent = hoursText(); });
    document.querySelectorAll("[data-email]").forEach(function (el) {
      if (!cfg.email) { el.hidden = true; return; }
      var a = el.querySelector("a");
      if (a) { a.href = "mailto:" + cfg.email; a.textContent = cfg.email; }
    });
    document.querySelectorAll("[data-address]").forEach(function (el) {
      if (!cfg.address) { el.hidden = true; return; }
      var t = el.querySelector("[data-address-text]");
      if (t) t.textContent = cfg.address;
    });
    document.querySelectorAll("[data-map]").forEach(function (el) {
      if (!cfg.mapUrl) { el.hidden = true; return; }
      el.href = cfg.mapUrl;
    });
    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  function setupMenu() {
    var btn = document.querySelector(".menu-toggle");
    var nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  window.PrintixUI = {
    escapeHtml: escapeHtml,
    hoursText: hoursText
  };

  /* ---------- Clean address bar ----------
   * Pages link to each other with ?category=, ?product= and #section. Each page reads
   * those when it loads; after that they are removed so the address bar stays clean.
   * On the live site "index.html" is hidden too, so addresses read like printix.in/products/.
   * Opened from a folder on a computer, the browser always shows the file path; that's normal.
   */
  var ONLINE = /^https?:$/.test(location.protocol);
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cleanAddress() {
    var path = ONLINE ? location.pathname.replace(/index\.html$/, "") : location.pathname;
    if (path === location.pathname && !location.search && !location.hash) return;
    try { history.replaceState(history.state, "", path); } catch (err) { /* some browsers refuse this for local files */ }
  }

  function scrollToId(id) {
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  function setupCleanUrls() {
    // Links within the same page scroll without adding #something to the address.
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      e.preventDefault();
      // Wait a tick so page scripts (e.g. the product filters) can show the section first.
      setTimeout(function () { scrollToId(id); }, 0);
    });
    // On the live site, links to other pages drop "index.html".
    if (ONLINE) {
      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[href]");
        if (!a || a.target === "_blank") return;
        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin || !/\/index\.html$/.test(url.pathname)) return;
        url.pathname = url.pathname.replace(/index\.html$/, "");
        a.href = url.href;
      }, true);
    }
    window.addEventListener("load", function () { setTimeout(cleanAddress, 0); });
  }

  applyConfig();
  setupMenu();
  setupCleanUrls();
})();
