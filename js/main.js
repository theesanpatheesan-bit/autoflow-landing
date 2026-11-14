/* =========================================================
   AutoFlow – page behaviour
   Navigation · reveal · 3D tilt · tabs · timeline · forms · analytics
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.AUTOFLOW_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------------- Analytics ---------------- */
  function loadScript(src, attrs) {
    var s = document.createElement("script"); s.src = src; s.async = true;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }
  if (CFG.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", CFG.ga4Id, { anonymize_ip: true });
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.ga4Id));
  }
  if (CFG.plausibleDomain) {
    loadScript("https://plausible.io/js/script.js", { "data-domain": CFG.plausibleDomain, defer: "" });
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  }
  function track(name, params) {
    try {
      if (window.gtag && CFG.ga4Id) window.gtag("event", name, params || {});
      if (window.plausible && CFG.plausibleDomain) window.plausible(name, { props: params || {} });
    } catch (e) { /* analytics must never break the page */ }
  }
  $$("[data-cta]").forEach(function (el) {
    el.addEventListener("click", function () { track("cta_click", { cta: el.getAttribute("data-cta") }); });
  });

  /* ---------------- Apply config (email / phone / socials) ---------------- */
  $$("[data-email]").forEach(function (a) { if (CFG.email) { a.textContent = CFG.email; a.href = "mailto:" + CFG.email; } });
  $$("[data-phone]").forEach(function (a) {
    if (CFG.phone) { a.textContent = CFG.phone; a.href = "tel:" + CFG.phone.replace(/[^\d+]/g, ""); }
    else { var li = a.closest("li"); if (li) li.hidden = true; }
  });
  var projectEmail = CFG.email || "hello@autoflow.lk";
  $$("[data-copy-email-value]").forEach(function (el) { el.textContent = projectEmail; });
  var whatsapp = $("[data-whatsapp]");
  if (whatsapp) {
    var whatsappNumber = (CFG.phone || "").replace(/\D/g, "");
    if (whatsappNumber) whatsapp.href = "https://wa.me/" + whatsappNumber;
    else whatsapp.hidden = true;
  }
  var demoEmail = $("[data-demo-email]");
  if (demoEmail) demoEmail.href = "mailto:" + encodeURIComponent(projectEmail) + "?subject=" + encodeURIComponent("Book a live demo");
  var copyEmailButton = $("[data-copy-email]"), copyToast = $(".copy-toast"), copyToastTimer;
  function showCopyToast(message, isError) {
    window.clearTimeout(copyToastTimer);
    copyToast.textContent = message;
    copyToast.classList.toggle("is-error", isError);
    copyToast.hidden = false;
    copyToastTimer = window.setTimeout(function () { copyToast.hidden = true; }, 3500);
  }
  function fallbackCopyEmail() {
    var field = document.createElement("textarea");
    field.value = projectEmail;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try { copied = document.execCommand("copy"); }
    finally { field.remove(); }
    return copied;
  }
  if (copyEmailButton) {
    copyEmailButton.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(projectEmail).then(function () {
          showCopyToast("Copied!", false);
        }).catch(function (error) {
          console.warn("[AutoFlow] Clipboard access failed; trying the compatibility copy method.", error);
          try {
            if (fallbackCopyEmail()) showCopyToast("Copied!", false);
            else showCopyToast("Could not copy the email. Please use the address shown above.", true);
          } catch (fallbackError) {
            console.error("[AutoFlow] Could not copy the contact email.", fallbackError);
            showCopyToast("Could not copy the email. Please use the address shown above.", true);
          }
        });
      } else {
        try {
          if (fallbackCopyEmail()) showCopyToast("Copied!", false);
          else showCopyToast("Could not copy the email. Please use the address shown above.", true);
        } catch (error) {
          console.error("[AutoFlow] Could not copy the contact email.", error);
          showCopyToast("Could not copy the email. Please use the address shown above.", true);
        }
      }
    });
  }
  $$("[data-social]").forEach(function (a) {
    var u = CFG.social && CFG.social[a.getAttribute("data-social")];
    if (u) a.href = u; else a.hidden = true;
  });
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- Navigation ---------------- */
  var nav = $(".nav"), toggle = $(".nav__toggle"), menu = $("#nav-menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024 && menu.classList.contains("open")) setMenu(false);
  }, { passive: true });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); toggle.focus(); } });
  document.addEventListener("click", function (e) {
    if (menu.classList.contains("open") && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });

  // smooth scroll + focus management for every in-page link
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = $(id);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.pushState(null, "", id);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      setTimeout(function () { target.focus({ preventScroll: true }); }, 500);
    });
  });

  // scroll-spy
  var spyMap = { home: "#home", about: "#about", problem: "#about", solution: "#about", features: "#features", showcase: "#features", "how-it-works": "#how-it-works", why: "#how-it-works", team: "#team", waitlist: "#waitlist", contact: "#contact" };
  var spySections = ["home", "problem", "solution", "features", "how-it-works", "showcase", "why", "team", "waitlist", "contact"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var navLinks = $$(".nav__links a:not(.btn)");
  var navCtas = $$(".nav__cta,.nav__cta-mobile");

  var progress = $(".scroll-progress span"), toTop = $(".to-top"), ticking = false;
  var activeSpySections = Object.create(null), currentSpySection = "home";
  var spyOffsets = [], spyObserver = null, timelineObserver = null;
  var timeline = $("#timeline"), fill = $(".track__fill"), car = $(".track__car"), nodes = $$(".track__nodes span");
  var timelineSteps = timeline ? $$("#timeline > li") : [];
  var timelineRoot = $(".track");
  var timelineNodes = timelineRoot && $(".track__nodes", timelineRoot);
  var timelineWidth = 0, timelineOffsets = [], timelineVisited = timelineSteps.map(function () { return false; });

  function applyScrollSpy() {
    var current = currentSpySection;
    spySections.forEach(function (section) {
      if (activeSpySections[section.id]) current = section.id;
    });
    currentSpySection = current;
    setActiveNav(current);
  }

  function setActiveNav(current) {
    var href = spyMap[current];
    navLinks.forEach(function (link) { link.classList.toggle("is-active", link.getAttribute("href") === href); });
    navCtas.forEach(function (cta) { cta.classList.toggle("is-active", cta.getAttribute("href") === href); });
  }

  function measureSpySections() {
    spyOffsets = spySections.map(function (section) { return section.getBoundingClientRect().top + window.scrollY; });
  }

  function updateScrollSpyFromScroll() {
    var threshold = window.scrollY + window.innerHeight * 0.35, current = "home";
    spyOffsets.forEach(function (offset, i) { if (offset <= threshold) current = spySections[i].id; });
    currentSpySection = current;
    setActiveNav(current);
  }

  function renderTimeline(activeIndex) {
    if (!timeline || !fill || !timelineSteps.length) return;
    var p = activeIndex < 0 ? 0 : activeIndex / Math.max(1, timelineSteps.length - 1);
    fill.style.transform = "scaleX(" + p + ")";
    var carIndex = Math.max(0, activeIndex);
    var carX = timelineWidth * ((carIndex + 0.5) / timelineSteps.length) - 22;
    car.style.transform = "translate3d(" + carX.toFixed(1) + "px,0,0)";
    nodes.forEach(function (node, i) { node.classList.toggle("on", i <= activeIndex); });
  }

  function measureTimeline() {
    if (!timelineSteps.length) return;
    timelineWidth = timelineNodes ? timelineNodes.getBoundingClientRect().width : 0;
    timelineOffsets = timelineSteps.map(function (step) { return step.getBoundingClientRect().top + window.scrollY; });
  }

  function updateTimelineFromScroll() {
    var threshold = window.scrollY + window.innerHeight * 0.62, activeIndex = -1;
    timelineOffsets.forEach(function (offset, i) { if (offset <= threshold) activeIndex = i; });
    renderTimeline(activeIndex);
  }

  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("is-scrolled", y > 20);
    progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    toTop.hidden = y < 700;
    if (!("IntersectionObserver" in window)) {
      updateScrollSpyFromScroll();
      updateTimelineFromScroll();
    }
    ticking = false;
  }
  function scheduleScrollUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", function () {
    measureSpySections();
    measureTimeline();
    setupScrollSpyObserver();
    setupTimelineObserver();
    scheduleScrollUpdate();
  }, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  function setupScrollSpyObserver() {
    if (!("IntersectionObserver" in window)) return;
    if (spyObserver) spyObserver.disconnect();
    var lineTop = Math.round(window.innerHeight * 0.35);
    var lineHeight = 2;
    spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { activeSpySections[entry.target.id] = entry.isIntersecting; });
      applyScrollSpy();
    }, { rootMargin: "-" + lineTop + "px 0px -" + Math.max(0, window.innerHeight - lineTop - lineHeight) + "px 0px", threshold: 0 });
    spySections.forEach(function (section) { spyObserver.observe(section); });
  }
  setupScrollSpyObserver();

  /* ---------------- Reveal on scroll ---------------- */
  var revealEls = $$(".reveal");
  revealEls.forEach(function (el) {
    var existingDelay = parseFloat(el.style.getPropertyValue("--d")) || 0;
    el.style.setProperty("--reveal-delay", existingDelay + "s");
  });
  $$(".grid,.apps-grid,.bento,.why-grid,.team-grid,.edge__grid").forEach(function (grid) {
    $$(".reveal", grid).filter(function (el) { return el.parentElement === grid; }).forEach(function (el, index) {
      el.style.setProperty("--reveal-delay", (index * 0.06) + "s");
    });
  });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("in"); });

  /* ---------------- 3D tilt + cursor glow ---------------- */
  if (finePointer && !reduce) {
    document.body.classList.add("has-pointer");
    var glow = $(".cursor-glow"), stage = $("[data-parallax]");
    var pointerFrame = 0, pointerX = 0, pointerY = 0, pointerTarget = null;
    var tiltTarget = null, tiltRect = null, spotlightTarget = null, spotlightRect = null;
    var magneticCards = $$(".hero__ctas .btn,.app-card");
    var tiltCards = $$("[data-tilt], [data-tilt-soft]").concat(magneticCards);
    var spotlightCards = $$(".card,.app-card,.bento__item,.why-card,.compare__col,.table-wrap");
    magneticCards.forEach(function (el) { el.classList.add("magnetic-card"); });
    tiltCards.forEach(function (el) {
      el.dataset.tiltMax = el.classList.contains("magnetic-card") ? (el.classList.contains("app-card") ? "3.5" : "4") : (el.hasAttribute("data-tilt-soft") ? "7" : "6");
    });
    spotlightCards.forEach(function (el) { el.classList.add("spotlight-card"); });

    function resetTilt() {
      if (!tiltTarget) return;
      tiltTarget.style.setProperty("--ry", "0deg");
      tiltTarget.style.setProperty("--rx", "0deg");
      tiltTarget.style.setProperty("--mag-x", "0px");
      tiltTarget.style.setProperty("--mag-y", "0px");
      tiltTarget.classList.remove("is-magnet-active");
      tiltTarget = null;
      tiltRect = null;
    }

    function resetSpotlight() {
      if (!spotlightTarget) return;
      spotlightTarget.classList.remove("is-spotlit");
      spotlightTarget = null;
      spotlightRect = null;
    }

    function processPointer() {
      pointerFrame = 0;
      if (glow) glow.style.transform = "translate3d(" + pointerX + "px," + pointerY + "px,0)";
      if (stage) {
        var x = pointerX / window.innerWidth - 0.5, y = pointerY / window.innerHeight - 0.5;
        stage.style.transform = "perspective(1200px) rotateY(" + (x * 8).toFixed(2) + "deg) rotateX(" + (-y * 6).toFixed(2) + "deg)";
      }

      var target = pointerTarget instanceof Element ? pointerTarget : null;
      var nextTilt = target && target.closest(".magnetic-card, [data-tilt], [data-tilt-soft]");
      var nextSpotlight = target && target.closest(".spotlight-card");
      var updateTilt = nextTilt !== tiltTarget, updateSpotlight = nextSpotlight !== spotlightTarget;
      var nextTiltRect = updateTilt ? (nextTilt ? nextTilt.getBoundingClientRect() : null) : tiltRect;
      var nextSpotlightRect = updateSpotlight
        ? (nextSpotlight ? (nextSpotlight === nextTilt ? nextTiltRect : nextSpotlight.getBoundingClientRect()) : null)
        : spotlightRect;
      if (updateTilt) {
        resetTilt();
        tiltTarget = nextTilt;
        tiltRect = nextTiltRect;
        if (tiltTarget && tiltTarget.classList.contains("magnetic-card")) tiltTarget.classList.add("is-magnet-active");
      }
      if (updateSpotlight) {
        resetSpotlight();
        spotlightTarget = nextSpotlight;
        spotlightRect = nextSpotlightRect;
      }

      if (tiltTarget && tiltRect && tiltRect.width && tiltRect.height) {
        var px = clamp((pointerX - tiltRect.left) / tiltRect.width, 0, 1);
        var py = clamp((pointerY - tiltRect.top) / tiltRect.height, 0, 1);
        var max = Number(tiltTarget.dataset.tiltMax);
        tiltTarget.style.setProperty("--ry", ((px - 0.5) * max * 2).toFixed(2) + "deg");
        tiltTarget.style.setProperty("--rx", ((0.5 - py) * max * 2).toFixed(2) + "deg");
        if (tiltTarget.classList.contains("magnetic-card")) {
          tiltTarget.style.setProperty("--mag-x", ((px - 0.5) * 8).toFixed(1) + "px");
          tiltTarget.style.setProperty("--mag-y", ((py - 0.5) * 8).toFixed(1) + "px");
        }
        tiltTarget.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        tiltTarget.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      }
      if (spotlightTarget && spotlightRect) {
        spotlightTarget.style.setProperty("--spot-x", (pointerX - spotlightRect.left).toFixed(1) + "px");
        spotlightTarget.style.setProperty("--spot-y", (pointerY - spotlightRect.top).toFixed(1) + "px");
        spotlightTarget.classList.add("is-spotlit");
      }
    }

    window.addEventListener("pointermove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerTarget = event.target;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(processPointer);
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (tiltTarget) tiltRect = tiltTarget.getBoundingClientRect();
      if (spotlightTarget) spotlightRect = spotlightTarget === tiltTarget ? tiltRect : spotlightTarget.getBoundingClientRect();
    }, { passive: true });
    document.addEventListener("pointerout", function (event) {
      var relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (tiltTarget && event.target instanceof Node && tiltTarget.contains(event.target) && !tiltTarget.contains(relatedTarget)) resetTilt();
      if (spotlightTarget && event.target instanceof Node && spotlightTarget.contains(event.target) && !spotlightTarget.contains(relatedTarget)) resetSpotlight();
    }, { passive: true });
  }

  /* ---------------- Pseudo-QR codes (decorative) ---------------- */
  $$("g.qr").forEach(function (g, idx) {
    var N = 21, cell = 64 / N, seed = 1234 + idx * 17, ns = "http://www.w3.org/2000/svg";
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    function finder(ox, oy) { return ox <= 7 && oy <= 7 ? 1 : 0; }
    var inFinder = function (x, y) {
      var f = function (cx, cy) { var dx = x - cx, dy = y - cy; return dx >= 0 && dx < 7 && dy >= 0 && dy < 7; };
      return f(0, 0) || f(N - 7, 0) || f(0, N - 7);
    };
    var finderOn = function (x, y) {
      var l = function (cx, cy) {
        var dx = x - cx, dy = y - cy; if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return null;
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      };
      var r = l(0, 0); if (r !== null) return r; r = l(N - 7, 0); if (r !== null) return r; return l(0, N - 7);
    };
    var d = "";
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var on = inFinder(x, y) ? finderOn(x, y) : rnd() > 0.52;
      if (on) d += "M" + (x * cell).toFixed(2) + " " + (y * cell).toFixed(2) + "h" + cell.toFixed(2) + "v" + cell.toFixed(2) + "h-" + cell.toFixed(2) + "z";
    }
    var p = document.createElementNS(ns, "path"); p.setAttribute("d", d); p.setAttribute("fill", "#111");
    g.appendChild(p);
  });

  /* ---------------- Tabs (accessible) ---------------- */
  var tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      p.hidden = !on; p.classList.toggle("is-active", on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); track("showcase_tab", { tab: t.id }); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") n = tabs[0];
      else if (e.key === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---------------- How-it-works timeline progress ---------------- */
  function setupTimelineObserver() {
    if (!("IntersectionObserver" in window) || !timelineSteps.length) return;
    if (timelineObserver) timelineObserver.disconnect();
    var lineTop = Math.round(window.innerHeight * 0.62);
    var lineHeight = 4;
    timelineObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var index = timelineSteps.indexOf(entry.target);
        if (index >= 0) timelineVisited[index] = entry.boundingClientRect.top <= window.innerHeight * 0.62 + lineHeight / 2;
      });
      var activeIndex = -1;
      timelineVisited.forEach(function (visited, index) { if (visited) activeIndex = index; });
      renderTimeline(activeIndex);
    }, { rootMargin: "-" + Math.max(0, lineTop - lineHeight / 2) + "px 0px -" + Math.max(0, window.innerHeight - lineTop - lineHeight / 2) + "px 0px", threshold: 0 });
    timelineSteps.forEach(function (step) { timelineObserver.observe(step); });
  }
  measureSpySections();
  measureTimeline();
  setupTimelineObserver();
  if ("ResizeObserver" in window && timelineRoot) {
    new ResizeObserver(function () {
      measureTimeline();
      var activeIndex = -1;
      timelineVisited.forEach(function (visited, index) { if (visited) activeIndex = index; });
      renderTimeline(activeIndex);
    }).observe(timelineRoot);
  }
  onScroll();

  /* ---------------- Real prototype screenshots (optional) ----------------
     Drop PNG files into assets/screens/ named after the data-screen
     value (e.g. customer-tracking.png) and they replace the built-in mockups. */
  function tryImages(urls, ok) {
    var i = 0;
    (function next() {
      if (i >= urls.length) return;
      var img = new Image();
      img.onload = function () { ok(img, urls[i]); };
      img.onerror = function () { i++; next(); };
      img.src = urls[i];
    })();
  }
  $$("[data-screen]").forEach(function (el) {
    var name = el.getAttribute("data-screen");
    tryImages(["assets/screens/" + name + ".png"], function (img, src) {
      el.innerHTML = "";
      var im = document.createElement("img");
      im.src = src; im.alt = "AutoFlow prototype screen: " + name.replace(/-/g, " "); im.loading = "lazy";
      el.appendChild(im);
    });
  });
  // Team photos: assets/team/member-N.jpg replaces the placeholder automatically
  $$("[data-photo]").forEach(function (box) {
    var base = box.getAttribute("data-photo").replace(/\.\w+$/, "");
    tryImages([base + ".jpg"], function (img, src) {
      var target = $("img", box); if (target) target.src = src;
    });
  });

  /* ---------------- Forms ---------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function normalisePhone(v) {
    var s = v.replace(/[\s\-().]/g, "");
    if (/^\+94\d{9}$/.test(s)) return s;
    if (/^0\d{9}$/.test(s)) return "+94" + s.slice(1);
    if (/^94\d{9}$/.test(s)) return "+" + s;
    return null;
  }
  function validateField(el) {
    var wrap = el.closest(".field"), err = $(".field__err", wrap), msg = "", v = el.type === "checkbox" ? el.checked : el.value.trim();
    if (el.required && (el.type === "checkbox" ? !v : !v)) {
      msg = el.type === "checkbox" ? "Please accept to continue." : el.tagName === "SELECT" ? "Please choose an option." : "This field is required.";
    } else if (v) {
      if (el.type === "email" && !EMAIL_RE.test(v)) msg = "Enter a valid email address, e.g. name@example.com.";
      else if (el.type === "tel" && !normalisePhone(v)) msg = "Enter a valid Sri Lankan number, e.g. 077 123 4567 or +94 77 123 4567.";
      else if (el.minLength > 0 && v.length < el.minLength && el.type !== "checkbox") msg = "Please enter at least " + el.minLength + " characters.";
    }
    wrap.classList.toggle("invalid", !!msg);
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg;
    return !msg;
  }

  function submitForm(form) {
    var type = form.getAttribute("data-endpoint");
    var status = $(".form__status", form), btn = $("button[type=submit]", form);
    var fields = $$("input:not(.hp), select, textarea", form);
    var firstBad = null;
    fields.forEach(function (f) { if (!validateField(f) && !firstBad) firstBad = f; });
    status.className = "form__status"; status.textContent = "";
    if (firstBad) { firstBad.focus(); status.className = "form__status err"; status.textContent = "Please fix the highlighted fields and try again."; return; }

    var data = {};
    fields.forEach(function (f) { data[f.name] = f.type === "checkbox" ? f.checked : f.value.trim(); });
    if (data.phone) data.phone = normalisePhone(data.phone);
    data.form = type; data.page = location.href; data.submittedAt = new Date().toISOString();

    if ($(".hp", form).value) { // bot trap: pretend success
      status.className = "form__status ok"; status.textContent = "Thank you!"; form.reset(); return;
    }

    var endpoint = CFG.formEndpoints && CFG.formEndpoints[type];
    btn.disabled = true; btn.classList.add("is-loading");
    var label = $(".btn__label", btn), oldLabel = label.textContent; label.textContent = "Sending…";

    var done = function (ok, demo) {
      btn.disabled = false; btn.classList.remove("is-loading"); label.textContent = oldLabel;
      if (ok) {
        status.className = "form__status ok";
        status.textContent = type === "waitlist"
          ? "You're on the list! We'll email you as soon as early access opens."
          : "Message sent! Thank you – our team will reply as soon as possible.";
        if (demo) status.textContent += " (Demo mode: connect a form endpoint in js/config.js to receive submissions by email.)";
        form.reset(); $$(".field", form).forEach(function (f) { f.classList.remove("invalid"); });
        track(type === "waitlist" ? "waitlist_signup" : "contact_submit", { role: data.role || "" });
        if (window.gtag && CFG.ga4Id) window.gtag("event", "generate_lead", { form: type });
      } else {
        status.className = "form__status err";
        status.innerHTML = "Sorry, something went wrong and your message was not sent. Please try again, or email us at <a href=\"mailto:" + (CFG.email || "") + "\">" + (CFG.email || "our team") + "</a>.";
        track("form_error", { form: type });
      }
    };

    if (!endpoint) { // DEMO MODE – keep a local copy so the flow can be shown in the viva
      try {
        var key = "autoflow_submissions", list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push(data); localStorage.setItem(key, JSON.stringify(list));
      } catch (e) { /* storage unavailable */ }
      console.warn("[AutoFlow] No form endpoint configured – submission stored locally only.", data);
      setTimeout(function () { done(true, true); }, 700);
      return;
    }
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { done(r.ok); })
      .catch(function () { done(false); });
  }

  $$("form[novalidate]").forEach(function (form) {
    form.addEventListener("submit", function (e) { e.preventDefault(); submitForm(form); });
    $$("input:not(.hp), select, textarea", form).forEach(function (f) {
      f.addEventListener("blur", function () { if (f.type !== "checkbox") validateField(f); });
      f.addEventListener("input", function () { if (f.closest(".field").classList.contains("invalid")) validateField(f); });
      f.addEventListener("change", function () { validateField(f); });
    });
  });

  onScroll();
})();
