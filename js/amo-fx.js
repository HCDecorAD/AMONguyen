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
    if (document.querySelector(".sk-bar")) { var q = document.querySelector(".sk-bar"); q.dataset.k = ""; deco(); }
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
  var SEASON = {
    noel: { fall: ["❄", "❅", "❆", "•", "❄"], bar: "🎄 Giáng sinh an lành · Merry Christmas 🎁", lamps: "🎅" },
    tet: { fall: ["🌼", "🌸", "✿", "🧧", "🌼"], bar: "🧧 Chúc Mừng Năm Mới · An Khang Thịnh Vượng 🏮", lamps: "🏮" }
  };
  function deco() {
    var r = document.documentElement, k = r.dataset.skin, S = SEASON[k], b = document.body; if (!b) return;
    var hd = document.querySelector(".lw-header"), ex = document.querySelector(".sk-bar");
    if (S && ex && ex.dataset.k === k && (!hd || hd.querySelector(".sk-lan"))) return;
    document.querySelectorAll(".sk-fall,.sk-bar,.sk-lan").forEach(function (e) { e.remove(); });
    if (!S) { r.style.removeProperty("--sk-h"); return; }
    var bar = document.createElement("div"); bar.className = "sk-bar"; bar.dataset.k = k; bar.textContent = S.bar; b.insertBefore(bar, b.firstChild); r.style.setProperty("--sk-h", bar.offsetHeight + "px");
    var h = document.querySelector(".lw-header");
    if (h) ["l", "r"].forEach(function (c) { var e = document.createElement("span"); e.className = "sk-lan " + c; e.textContent = S.lamps; e.setAttribute("aria-hidden", "true"); h.appendChild(e); });
    var f = (cur || DEF); if (reduce || f.on === false || f.pulse === false && f.shine === false && f.reveal === false) return;
    var box = document.createElement("div"); box.className = "sk-fall"; box.setAttribute("aria-hidden", "true");
    var N = window.innerWidth < 600 ? 14 : 26;
    for (var i = 0; i < N; i++) {
      var s = document.createElement("i"); s.textContent = S.fall[i % S.fall.length];
      s.style.cssText = "left:" + (Math.random() * 100).toFixed(1) + "%;font-size:" + (10 + Math.random() * 14).toFixed(0) + "px;animation-duration:" + (9 + Math.random() * 10).toFixed(1) + "s,"+ (3 + Math.random() * 3).toFixed(1) + "s;animation-delay:-" + (Math.random() * 18).toFixed(1) + "s,-" + (Math.random() * 5).toFixed(1) + "s;opacity:" + (.45 + Math.random() * .5).toFixed(2);
      box.appendChild(s);
    }
    b.appendChild(box);
  }
  function skin(v) {
    var r = document.documentElement; v = /^[a-z]{3,12}$/.test(v) && v !== "noir" ? v : "";
    try { if (v) localStorage.setItem("AMO_SKIN", v); else localStorage.removeItem("AMO_SKIN"); } catch (e) {}
    if (v) { r.dataset.skin = v; if (!document.getElementById("skin-font")) { var l = document.createElement("link"); l.id = "skin-font"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap"; document.head.appendChild(l); } } else delete r.dataset.skin;
    if (document.body) deco(); else document.addEventListener("DOMContentLoaded", deco);
  }
  function init() {
    apply(read()); deco(); setTimeout(deco, 900);
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
