/* HC Blocks — renders owner-edited page blocks (hero/text/image/gallery/video/cards/links/list/cta).
   Shared by every HC site and by the shop-admin live preview.
   Safe by construction: only DOM APIs + textContent, URLs re-validated, no innerHTML with data.
   Usage (auto):  <div data-hc-page="home">…static fallback…</div>
                  <script src="js/hc-blocks.js" data-store="store_amo" data-api="https://…" defer></script>
   Usage (manual): HCBlocks.render(blocks, element)  /  HCBlocks.mount({store,api,slug,target})  */
(function () {
  "use strict";
  var DEFAULT_API = "https://hc-shop-engine.huycuongonline.workers.dev";
  var CSS = ".hcb{--hcb-accent:var(--amog,#d5a83f);--hcb-line:rgba(213,168,63,.28);color:inherit}" +
    ".hcb *{box-sizing:border-box}.hcb a{color:inherit;text-decoration:none}.hcb img{max-width:100%;display:block}" +
    ".hcb-b{max-width:1440px;margin:0 auto;padding:30px 4%}.hcb-c{text-align:center}" +
    ".hcb-k{font-size:11px;letter-spacing:.25em;color:var(--hcb-accent);text-transform:uppercase}" +
    ".hcb h1,.hcb h2,.hcb h3{font-weight:500;margin:.4em 0}.hcb h1{font-size:clamp(32px,5vw,62px)}.hcb h2{font-size:clamp(24px,3vw,40px)}" +
    ".hcb p{line-height:1.8;margin:.6em 0;white-space:pre-line}.hcb .hcb-lead{max-width:760px;opacity:.82}.hcb .hcb-c .hcb-lead,.hcb .hcb-c p{margin-left:auto;margin-right:auto}" +
    ".hcb-hero img{width:100%;border:1px solid var(--hcb-line);box-shadow:0 18px 55px rgba(0,0,0,.35)}.hcb-hero .hcb-t{padding:36px 0 8px}" +
    ".hcb-btn{display:inline-block;margin:14px 8px 0 0;padding:13px 24px;border:1px solid var(--hcb-accent);color:var(--hcb-accent)}.hcb-c .hcb-btn{margin:14px 6px 0}" +
    ".hcb-btn.p{background:var(--hcb-accent);color:#111}" +
    ".hcb-head{display:flex;justify-content:space-between;align-items:end;gap:12px;border-bottom:1px solid var(--hcb-line);padding-bottom:12px;margin-bottom:22px}.hcb-head h2{margin:0}" +
    ".hcb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}" +
    ".hcb-card{display:block;border:1px solid var(--hcb-line);padding:22px;min-height:150px;background:rgba(127,127,127,.07)}.hcb-card img{width:100%;aspect-ratio:4/3;object-fit:cover;margin:-22px -22px 14px;width:calc(100% + 44px);max-width:none}" +
    ".hcb-card b{display:block;font-size:17px}.hcb-card span{display:block;opacity:.7;font-size:13px;margin-top:8px;line-height:1.5}" +
    ".hcb-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--hcb-line);border:1px solid var(--hcb-line)}.hcb-links a{background:rgba(127,127,127,.09);padding:26px 12px;text-align:center;font-weight:700;color:var(--hcb-accent)}" +
    ".hcb-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.hcb-gal img{width:100%;aspect-ratio:1;object-fit:cover}" +
    ".hcb-fig img{width:100%;border:1px solid var(--hcb-line)}.hcb-fig figcaption{opacity:.7;font-size:13px;margin-top:8px;text-align:center}" +
    ".hcb-vid{position:relative;aspect-ratio:16/9;background:#000}.hcb-vid iframe,.hcb-vid video{position:absolute;inset:0;width:100%;height:100%;border:0}" +
    ".hcb-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}.hcb-list div{border-top:1px solid var(--hcb-accent);padding:16px 4px;opacity:.9}" +
    ".hcb-cta{border-top:1px solid var(--hcb-line);background:rgba(127,127,127,.09);padding:60px 5%}" +
    "@media(max-width:520px){.hcb-b{padding:22px 5%}.hcb-hero.hcb-b{padding:0}.hcb-hero .hcb-t{padding:24px 5% 6px}}";

  var LINK_OK = /^(https?:\/\/[^\s<>"']+|\/[^\s<>"':]*|#[\w-]*|mailto:[^\s<>"']+|tel:\+?[\d\s.-]+|[A-Za-z0-9_\-./]+(\?[^\s<>"']*)?(#[\w-]*)?)$/;
  var IMG_OK = /^(https?:\/\/[^\s<>"']+|\/[^\s<>"':]+|[A-Za-z0-9_\-./]+(\?[^\s<>"']*)?)$/;
  var EMBED_OK = /^https:\/\/(www\.youtube\.com\/embed\/[\w-]{6,20}|player\.vimeo\.com\/video\/\d{5,12}|drive\.google\.com\/file\/d\/[\w-]{10,80}\/preview)$/;
  var FILE_OK = /^https:\/\/[^\s<>"']+\.(mp4|webm)(\?[^\s<>"']*)?$/i;

  function injectCss() {
    if (document.getElementById("hcb-css")) return;
    var s = document.createElement("style"); s.id = "hcb-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null && text !== "") e.textContent = String(text); return e; }
  function href(u) { u = String(u || ""); return LINK_OK.test(u) ? u : ""; }
  function src(u) { u = String(u || ""); return IMG_OK.test(u) ? u : ""; }
  function anchor(cls, url, text) {
    var a = el("a", cls, text), h = href(url); if (h) { a.setAttribute("href", h); if (/^https?:/i.test(h)) { a.setAttribute("rel", "noopener noreferrer"); a.setAttribute("target", "_blank"); } } return a;
  }
  function image(url, alt) { var i = el("img"); var s = src(url); if (!s) return null; i.src = s; i.alt = alt || ""; i.loading = "lazy"; i.decoding = "async"; return i; }
  function head(title, linkLabel, linkUrl, note) {
    if (!title && !linkLabel) return null;
    var h = el("div", "hcb-head"); h.appendChild(el("h2", "", title));
    if (linkLabel && href(linkUrl)) h.appendChild(anchor("", linkUrl, linkLabel)); else if (note) h.appendChild(el("span", "", note));
    return h;
  }
  var R = {
    hero: function (p) {
      var s = el("section", "hcb-b hcb-hero"), i = image(p.image, p.alt); if (i) s.appendChild(i);
      var t = el("div", "hcb-t hcb-c"); if (p.eyebrow) t.appendChild(el("div", "hcb-k", p.eyebrow)); if (p.title) t.appendChild(el("h1", "", p.title)); if (p.lead) t.appendChild(el("p", "hcb-lead", p.lead));
      if (p.primaryLabel && href(p.primaryUrl)) t.appendChild(anchor("hcb-btn p", p.primaryUrl, p.primaryLabel));
      if (p.secondaryLabel && href(p.secondaryUrl)) t.appendChild(anchor("hcb-btn", p.secondaryUrl, p.secondaryLabel));
      if (t.childNodes.length) s.appendChild(t); return s;
    },
    text: function (p) {
      var s = el("section", "hcb-b" + (p.align === "center" ? " hcb-c" : ""));
      if (p.kicker) s.appendChild(el("div", "hcb-k", p.kicker)); if (p.title) s.appendChild(el("h2", "", p.title)); if (p.body) s.appendChild(el("p", "hcb-lead", p.body)); return s;
    },
    image: function (p) {
      var s = el("section", "hcb-b"), f = el("figure", "hcb-fig"), i = image(p.url, p.alt); f.style.margin = "0"; if (!i) return null;
      if (p.link && href(p.link)) { var a = anchor("", p.link); a.appendChild(i); f.appendChild(a); } else f.appendChild(i);
      if (p.caption) f.appendChild(el("figcaption", "", p.caption)); s.appendChild(f); return s;
    },
    gallery: function (p) {
      var s = el("section", "hcb-b"), h = head(p.title); if (h) s.appendChild(h); var g = el("div", "hcb-gal");
      (p.images || []).forEach(function (x) { var i = image(x.url, x.alt); if (i) g.appendChild(i); }); if (!g.childNodes.length) return null; s.appendChild(g); return s;
    },
    video: function (p) {
      var u = String(p.url || ""), s = el("section", "hcb-b"), h = head(p.title), box = el("div", "hcb-vid");
      if (h) s.appendChild(h);
      if (EMBED_OK.test(u)) {
        var f = el("iframe"); f.src = u; f.loading = "lazy"; f.title = p.title || "Video"; f.setAttribute("allowfullscreen", "");
        f.setAttribute("allow", "fullscreen; picture-in-picture; encrypted-media"); f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups"); box.appendChild(f);
      } else if (FILE_OK.test(u)) { var v = el("video"); v.src = u; v.controls = true; v.preload = "metadata"; v.setAttribute("playsinline", ""); box.appendChild(v); } else return null;
      s.appendChild(box); return s;
    },
    cards: function (p) {
      var s = el("section", "hcb-b"), h = head(p.title, p.linkLabel, p.linkUrl); if (h) s.appendChild(h); var g = el("div", "hcb-grid");
      (p.items || []).forEach(function (x) {
        var c = x.url && href(x.url) ? anchor("hcb-card", x.url) : el("div", "hcb-card"), i = image(x.image, x.title); if (i) c.appendChild(i);
        c.appendChild(el("b", "", x.title)); if (x.subtitle) c.appendChild(el("span", "", x.subtitle)); g.appendChild(c);
      }); if (!g.childNodes.length) return null; s.appendChild(g); return s;
    },
    links: function (p) {
      var s = el("section", "hcb-b"), h = head(p.title, "", "", p.note); if (h) s.appendChild(h); var g = el("div", "hcb-links");
      (p.items || []).forEach(function (x) { g.appendChild(anchor("", x.url, x.label)); }); if (!g.childNodes.length) return null; s.appendChild(g); return s;
    },
    list: function (p) {
      var s = el("section", "hcb-b"), h = head(p.title, p.linkLabel, p.linkUrl); if (h) s.appendChild(h); var g = el("div", "hcb-list");
      (p.items || []).forEach(function (x) { g.appendChild(el("div", "", x)); }); if (!g.childNodes.length) return null; s.appendChild(g); return s;
    },
    cta: function (p) {
      var s = el("section", "hcb-cta hcb-c"); if (p.title) s.appendChild(el("h2", "", p.title)); if (p.text) s.appendChild(el("p", "hcb-lead", p.text));
      if (p.buttonLabel && href(p.buttonUrl)) s.appendChild(anchor("hcb-btn p", p.buttonUrl, p.buttonLabel)); return s.childNodes.length ? s : null;
    }
  };

  function render(blocks, target) {
    injectCss();
    var root = el("div", "hcb"); root.setAttribute("data-hcb", "1");
    (Array.isArray(blocks) ? blocks : []).forEach(function (b) {
      if (!b || b.enabled === false || !R[b.type]) return;
      try { var n = R[b.type](b.props || {}); if (n) { n.setAttribute("data-block", b.id || ""); root.appendChild(n); } } catch (e) { /* skip bad block */ }
    });
    if (target) { while (target.firstChild) target.removeChild(target.firstChild); target.appendChild(root); }
    return root;
  }

  // Fetch the published page; replace `target` content only if a published version exists.
  function mount(o) {
    var api = (o.api || DEFAULT_API).replace(/\/$/, "");
    return fetch(api + "/api/site/page?slug=" + encodeURIComponent(o.slug), { headers: { "x-store-id": o.store } })
      .then(function (r) { return r.ok ? r.json() : { published: false }; })
      .then(function (d) {
        if (!d.published || !Array.isArray(d.blocks) || !d.blocks.length) { if (o.onMissing) o.onMissing(); return false; }
        render(d.blocks, o.target); if (o.onTitle && d.title) o.onTitle(d.title); target_mark(o.target); return true;
      })
      .catch(function () { if (o.onMissing) o.onMissing(); return false; });
  }
  function target_mark(t) { if (t && t.setAttribute) t.setAttribute("data-hc-rendered", "1"); }

  window.HCBlocks = { render: render, mount: mount, types: Object.keys(R) };

  var me = document.currentScript;
  function auto() {
    var cfg = me || document.querySelector("script[data-store][src*='hc-blocks']"); if (!cfg) return;
    var store = cfg.getAttribute("data-store"); if (!store) return;
    document.querySelectorAll("[data-hc-page]").forEach(function (t) {
      var slug = t.getAttribute("data-hc-page");
      if (slug === "@query") { slug = (new URLSearchParams(location.search).get("slug") || "").toLowerCase(); }
      if (!slug) return;
      mount({ store: store, api: cfg.getAttribute("data-api") || DEFAULT_API, slug: slug, target: t,
        onTitle: t.hasAttribute("data-hc-title") ? function (x) { document.title = x + (t.getAttribute("data-hc-title") || ""); } : null,
        onMissing: function () { t.removeAttribute("hidden"); var m = t.querySelector("[data-hc-missing]"); if (m) m.hidden = false; } });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
