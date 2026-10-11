/* HC Customer Hub widget - dùng chung cho mọi website trong hệ thống HC.
   Nhúng:  <script src="https://amonguyen.hcdecorhub.com/js/hc-customer.js" data-store="store_amo" defer></script>
   Tuỳ chọn: data-api="https://...workers.dev"  data-banner="off" */
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
  const start = () => { banner(); HCC.track("visit", location.pathname); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
