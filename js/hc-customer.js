/* HC Customer Hub widget - dùng chung cho mọi website trong hệ thống HC.
   Nhúng:  <script src="https://amonguyen.com/js/hc-customer.js" data-store="store_amo" defer></script>
   Tuỳ chọn: data-api="https://...workers.dev"  data-banner="off"
              data-popup="on"  (popup nhận email/SĐT + mã WELCOME)   data-cart-key="AMO_CART" (tự ghi add_cart) */
(() => {
  const S = document.currentScript || {}, D = S.dataset || {};
  const API = (D.api || "https://hc-shop-engine.huycuongonline.workers.dev").replace(/\/$/, "");
  const STORE = D.store || "store_amo";
  const K = { tok: "HCC_TOKEN_" + STORE, vid: "HCC_VID", con: "HCC_CONSENT" };
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  let vid = ls.get(K.vid);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(vid || "")) {
    vid = "v" + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
    ls.set(K.vid, vid);
  }
  const utm = (() => {
    const q = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign"].forEach((k) => { if (q.get(k)) o[k] = q.get(k).slice(0, 60); });
    let ref = ""; try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch {}
    if (ref && ref !== location.hostname) o.ref = ref.slice(0, 80);
    try { if (Object.keys(o).length) sessionStorage.setItem("HCC_SRC", JSON.stringify(o)); else return JSON.parse(sessionStorage.getItem("HCC_SRC") || "{}"); } catch {}
    return o;
  })();
  const srcLabel = () => utm.utm_source || utm.ref || "direct";
  const token = () => ls.get(K.tok) || "";
  async function call(path, { method = "GET", body } = {}) {
    const h = { "x-store-id": STORE };
    if (body) h["content-type"] = "application/json";
    if (token()) h.authorization = "Bearer " + token();
    const r = await fetch(API + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || "Lỗi " + r.status); e.status = r.status; throw e; }
    return d;
  }
  const keep = (d) => { if (d.token) ls.set(K.tok, d.token); return d; };
  const HCC = {
    api: API, store: STORE, visitorId: vid,
    loggedIn: () => !!token(),
    config: () => call("/api/c/config"),
    register: (f) => call("/api/c/register", { method: "POST", body: { ...f, visitor_id: vid } }).then(keep),
    login: (login, password) => call("/api/c/login", { method: "POST", body: { login, password, visitor_id: vid } }).then(keep),
    google: (credential) => call("/api/c/google", { method: "POST", body: { credential, visitor_id: vid } }).then(keep),
    logout: async () => { try { await call("/api/c/logout", { method: "POST" }); } catch {} ls.del(K.tok); },
    me: () => call("/api/c/me").catch((e) => { if (e.status === 401) ls.del(K.tok); throw e; }),
    update: (f) => call("/api/c/me", { method: "PATCH", body: f }),
    remove: () => call("/api/c/me/delete", { method: "POST" }).then((d) => { ls.del(K.tok); return d; }),
    quote: (subtotal, code) => call("/api/c/coupon?subtotal=" + encodeURIComponent(subtotal) + "&code=" + encodeURIComponent(code || "")),
    lead: (f) => call("/api/c/lead", { method: "POST", body: { ...f, source: f.source || srcLabel(), visitor_id: vid } }),
    consent: () => ls.get(K.con),
    setConsent(v) { ls.set(K.con, v ? "1" : "0"); if (v) HCC.track("visit", location.pathname); },
    track(type, ref, meta) {
      if (!HCC.loggedIn() && ls.get(K.con) !== "1") return;
      call("/api/c/event", { method: "POST", body: { type, ref: ref || "", meta, visitor_id: vid } }).catch(() => {});
    },
  };
  window.HCC = HCC;

  function banner() {
    if (D.banner === "off" || HCC.loggedIn() || ls.get(K.con) !== null) return;
    const b = document.createElement("div");
    b.setAttribute("role", "dialog");
    b.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;max-width:560px;margin:auto;background:#111;color:#fff;padding:14px 16px;font:14px/1.45 system-ui,sans-serif;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 6px 24px rgba(0,0,0,.3)";
    const t = document.createElement("span");
    t.style.flex = "1 1 240px";
    t.textContent = "Chúng tôi ghi nhận lượt xem trang để cải thiện trải nghiệm. Bạn đồng ý chứ?";
    const mk = (label, v, primary) => { const x = document.createElement("button"); x.textContent = label; x.style.cssText = "border:1px solid #fff;padding:8px 14px;cursor:pointer;background:" + (primary ? "#fff" : "transparent") + ";color:" + (primary ? "#111" : "#fff"); x.onclick = () => { HCC.setConsent(v); b.remove(); }; return x; };
    b.append(t, mk("Từ chối", false, false), mk("Đồng ý", true, true));
    document.body.appendChild(b);
  }
  function popup() {
    if (D.popup !== "on" || HCC.loggedIn() || ls.get("HCC_LEAD")) return;
    let shown = false;
    const open = async () => {
      if (shown || ls.get("HCC_POP") === "1" || document.querySelector("[role=dialog]")) return;
      shown = true;
      let cfg = {}; try { cfg = await HCC.config(); } catch {}
      const w = document.createElement("div");
      w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
      w.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;font:15px/1.5 system-ui,sans-serif";
      const c = document.createElement("div");
      c.style.cssText = "background:#fff;color:#111;max-width:400px;width:100%;padding:26px;position:relative";
      const el = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt) e.textContent = txt; return e; };
      const T = (n, f) => { try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; } catch { return f; } };
      const C = { bg: T("--lw-panel", "#fff"), tx: T("--lw-text", "#111"), mute: T("--lw-mute", "#555"), gold: T("--lw-gold", "#111"), gold2: T("--lw-gold-2", "#111"), ink: T("--lw-gold-ink", "#fff"), field: T("--lw-field", "#fff"), line: T("--lw-line", "#ccc") };
      c.style.cssText = "background:" + C.bg + ";color:" + C.tx + ";max-width:400px;width:100%;padding:28px 26px 24px;position:relative;border:1px solid " + C.gold + ";border-radius:4px;box-shadow:0 18px 60px rgba(0,0,0,.55)";
      let timer = 0;
      const close = () => { clearTimeout(timer); document.removeEventListener("keydown", esc); ls.set("HCC_POP", "1"); w.remove(); };
      const esc = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", esc);
      w.addEventListener("click", (e) => { if (e.target === w) close(); });
      const x = el("button", "position:absolute;right:10px;top:6px;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:" + C.mute, "×"); x.setAttribute("aria-label", "Đóng"); x.onclick = close;
      const title = el("h3", "margin:0 0 6px;font-size:20px;color:" + C.gold2, cfg.welcome ? "Nhận ưu đãi -" + cfg.welcome.percent + "% đơn đầu tiên" : "Nhận tin ưu đãi và hàng mới");
      const sub = el("p", "margin:0 0 12px;color:" + C.mute, "Để lại email hoặc số điện thoại, chúng tôi sẽ gửi ưu đãi và thông báo hàng mới về.");
      const inp = el("input", "width:100%;padding:11px;border:1px solid " + C.line + ";background:" + C.field + ";color:" + C.tx + ";margin:4px 0;box-sizing:border-box;border-radius:2px"); inp.placeholder = "Email hoặc số điện thoại"; inp.autocomplete = "email";
      const lab = el("label", "display:flex;gap:8px;font-size:13px;margin:8px 0;align-items:flex-start");
      const cb = el("input"); cb.type = "checkbox"; cb.style.marginTop = "3px";
      lab.append(cb, el("span", "", "Tôi đồng ý để lưu thông tin liên hệ này và nhận tin ưu đãi. Có thể hủy bất cứ lúc nào."));
      const err = el("p", "color:#ff8a80;margin:4px 0;min-height:1em;font-size:13px");
      const go = el("button", "width:100%;background:" + C.gold + ";color:" + C.ink + ";border:0;padding:12px;cursor:pointer;font-weight:700", "Nhận ưu đãi");
      go.onclick = async () => {
        err.textContent = "";
        const v = inp.value.trim(), f = { consent: cb.checked };
        if (v.includes("@")) f.email = v; else f.phone = v;
        go.disabled = true;
        try {
          const r = await HCC.lead(f);
          ls.set("HCC_LEAD", "1"); ls.set("HCC_POP", "1");
          const ok = el("div", "width:44px;height:44px;border-radius:50%;border:1px solid " + C.gold + ";color:" + C.gold2 + ";display:grid;place-items:center;font-size:22px;margin:0 0 12px", "✓");
          const msg = r.coupon ? "Mã ưu đãi của bạn: " : "Chúng tôi sẽ liên hệ với bạn sớm.";
          const body = el("p", "margin:0 0 6px;color:" + C.tx + ";line-height:1.6", msg);
          if (r.coupon) { body.append(el("b", "color:" + C.gold2 + ";letter-spacing:.06em", r.coupon.code), document.createTextNode(" (-" + r.coupon.percent + "%" + (r.coupon.min_order ? ", đơn từ " + new Intl.NumberFormat("vi-VN").format(r.coupon.min_order) + " đ" : "") + ").")); }
          const hint = el("p", "margin:0 0 14px;font-size:12.5px;color:" + C.mute, "Cửa sổ này sẽ tự đóng sau vài giây.");
          const ok2 = el("button", "width:100%;background:transparent;color:" + C.tx + ";border:1px solid " + C.gold + ";padding:11px;cursor:pointer", "Đóng"); ok2.onclick = close;
          c.replaceChildren(x, ok, el("h3", "margin:0 0 8px;font-size:20px;color:" + C.gold2, "Cảm ơn bạn!"), body, hint, ok2);
          timer = setTimeout(close, 6000);
        } catch (e) { err.textContent = e.message; go.disabled = false; }
      };
      c.append(x, title, sub, inp, lab, err, go); w.appendChild(c); document.body.appendChild(w); inp.focus();
    };
    const arm = () => {
      setTimeout(open, 15000);
      document.addEventListener("mouseout", (e) => { if (e.clientY <= 0 && !e.relatedTarget) open(); });
    };
    // wait until the tracking banner has been answered so two prompts never stack
    const t = setInterval(() => { if (!document.querySelector("[role=dialog]")) { clearInterval(t); arm(); } }, 1000);
  }
  function autoTrack() {
    const p = new URLSearchParams(location.search).get("p");
    if (p && /product/.test(location.pathname)) HCC.track("view_product", p);
    const key = D.cartKey; if (!key) return;
    const count = (v) => { try { return JSON.parse(v || "[]").reduce((a, b) => a + (Number(b.qty) || 0), 0); } catch { return 0; } };
    // trang gán trực tiếp localStorage.KEY=... nên dùng polling thay vì chặn setItem
    let prev = count(ls.get(key));
    setInterval(() => {
      const raw = ls.get(key), n = count(raw);
      if (n > prev) { let last = ""; try { const a = JSON.parse(raw); last = String(a[a.length - 1]?.sku || a[a.length - 1]?.product_id || ""); } catch {} HCC.track("add_cart", last); }
      prev = n;
    }, 1000);
  }
  const start = () => { banner(); HCC.track("visit", location.pathname, Object.keys(utm).length ? utm : undefined); autoTrack(); popup(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
