/* AMO – hiệu ứng nhẹ cho website. Chủ shop bật/tắt trong Admin > Giao diện website. */
(function () {
  "use strict";
  var KEY = "AMO_FX", LW = window.AMO_LW || {}, ENGINE = LW.engine || "https://hc-shop-engine.huycuongonline.workers.dev", STORE = LW.store || "store_amo";
  var DEF = { on: true, reveal: true, lift: true, shine: true, pulse: true }, io = null, mo = null, cur = null;
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || DEF; } catch (e) { return DEF; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var SEL = ".amo-new-section > *, .lw-card, .hcb-b, .lw-cat-main, .lw-cat-grid a, .amo-usp, .lw-foot > *, .my .card";
  function apply(v) {
    cur = v; var b = document.body; if (!b) return;
    var on = v.on !== false && !reduce;
    ["reveal", "lift", "shine", "pulse"].forEach(function (k) { b.classList.toggle("fx-" + k, on && v[k] !== false); });
    if (on && v.reveal !== false) startReveal(); else stopReveal();
  }
  function startReveal() {
    if (io || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("fx-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    var n = 0; function watch(root) { root.querySelectorAll(SEL).forEach(function (el) { if (el.__fx) return; el.__fx = 1; var r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.9) { return; } el.classList.add("fx-pre"); el.style.setProperty("--fx-d", (n++ % 4) * 70 + "ms"); io.observe(el); }); }
    watch(document);
    mo = new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (x) { if (x.nodeType === 1) { if (x.matches && x.matches(SEL) && !x.__fx) { x.__fx = 1; x.classList.add("fx-pre"); io.observe(x); } watch(x); } }); }); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  function stopReveal() {
    if (io) { io.disconnect(); io = null; } if (mo) { mo.disconnect(); mo = null; }
    document.querySelectorAll(".fx-pre").forEach(function (el) { el.classList.remove("fx-pre"); el.classList.add("fx-in"); });
  }
  function skin(v) {
    var r = document.documentElement; v = /^[a-z]{3,12}$/.test(v) && v !== "noir" ? v : "";
    try { if (v) localStorage.setItem("AMO_SKIN", v); else localStorage.removeItem("AMO_SKIN"); } catch (e) {}
    if (v) { r.dataset.skin = v; if (!document.getElementById("skin-font")) { var l = document.createElement("link"); l.id = "skin-font"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap"; document.head.appendChild(l); } } else delete r.dataset.skin;
  }
  function init() {
    apply(read());
    try {
      fetch(ENGINE + "/api/site/settings", { headers: { "x-store-id": STORE } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (d && d.effects) { save(d.effects); apply(d.effects); }
        if (d && typeof d.skin === "string") skin(d.skin);
      }).catch(function () {});
    } catch (e) {}
  }
  window.AMO_FX = { apply: apply, skin: skin };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
