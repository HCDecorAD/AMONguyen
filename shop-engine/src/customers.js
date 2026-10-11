// Customer accounts, activity log, loyalty tiers and % promotions (per store).
// Public routes: /api/c/*    Admin routes: /api/v1/customers*, /api/v1/promotions*, /api/v1/tiers

const DEFAULT_TIERS = [
  { code: "member", name: "Thành viên", min_spent: 0, percent: 0 },
  { code: "silver", name: "Bạc", min_spent: 5000000, percent: 3 },
  { code: "gold", name: "Vàng", min_spent: 15000000, percent: 5 },
  { code: "vip", name: "VIP", min_spent: 30000000, percent: 8 },
];
const EVENT_TYPES = new Set(["visit", "view_product", "add_cart", "search", "wishlist"]);
const SESSION_DAYS = 30;
const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const nowIso = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const plusIso = (ms) => new Date(Date.now() + ms).toISOString().slice(0, 19).replace("T", " ");

async function pbkdf2(password, saltB64) {
  const salt = Uint8Array.from(atob(saltB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return b64u(new Uint8Array(bits));
}
const newSalt = () => b64u(crypto.getRandomValues(new Uint8Array(16)));
const safeEq = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const normPhone = (p) => { const s = String(p ?? "").replace(/[\s.\-()]/g, ""); return /^\+?\d{9,15}$/.test(s) ? s : ""; };
const normEmail = (e) => { const s = String(e ?? "").trim().toLowerCase(); return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 120 ? s : ""; };

export async function loadTiers(env, store) {
  const rows = (await env.DB.prepare("SELECT code,name,min_spent,percent FROM customer_tiers WHERE store_id=? ORDER BY min_spent").bind(store.id).all()).results;
  return rows.length ? rows : DEFAULT_TIERS;
}
export function tierFor(tiers, spent, override) {
  if (override) { const t = tiers.find((x) => x.code === override); if (t) return t; }
  let cur = tiers[0];
  for (const t of tiers) if (spent >= t.min_spent) cur = t;
  return cur;
}
async function spentOf(env, store, customerId) {
  const r = await env.DB.prepare("SELECT COALESCE(SUM(total),0) spent,COUNT(*) orders FROM orders WHERE store_id=? AND customer_id=? AND status='completed'").bind(store.id, customerId).first();
  return { spent: r?.spent || 0, completed: r?.orders || 0 };
}
const publicProfile = (c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, google: !!c.google_sub, created_at: c.created_at });

async function newSession(env, store, customerId) {
  const token = "cs_" + b64u(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await sha(token);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id=? AND expires_at<?").bind(customerId, nowIso()),
    env.DB.prepare("INSERT INTO customer_sessions(token_hash,store_id,customer_id,expires_at) VALUES(?,?,?,?)").bind(hash, store.id, customerId, plusIso(SESSION_DAYS * 864e5)),
    env.DB.prepare("UPDATE customers SET last_login_at=?,last_seen_at=?,fail_count=0,locked_until=NULL WHERE id=?").bind(nowIso(), nowIso(), customerId),
  ]);
  return token;
}
async function sha(v) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)))].map((x) => x.toString(16).padStart(2, "0")).join(""); }

export async function customerFromReq(req, env, store) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/, "");
  if (!/^cs_[A-Za-z0-9_-]{40,}$/.test(t)) return null;
  const s = await env.DB.prepare("SELECT customer_id FROM customer_sessions WHERE token_hash=? AND store_id=? AND expires_at>?").bind(await sha(t), store.id, nowIso()).first();
  if (!s) return null;
  const c = await env.DB.prepare("SELECT * FROM customers WHERE id=? AND store_id=? AND status='active'").bind(s.customer_id, store.id).first();
  return c || null;
}

// ---------- pricing helpers used by POST /api/orders ----------
const promoLive = (p, now) => p.active && (!p.starts_at || p.starts_at <= now) && (!p.ends_at || p.ends_at >= now) && (p.max_uses == null || p.used_count < p.max_uses);
async function activePromos(env, store) {
  const now = nowIso();
  return (await env.DB.prepare("SELECT * FROM promotions WHERE store_id=? AND active=1 AND type='percent'").bind(store.id).all()).results.filter((p) => promoLive(p, now));
}
export async function lineAutoPercent(env, store, productId, categoryId, cache) {
  const promos = cache || (await activePromos(env, store));
  let best = 0;
  for (const p of promos) {
    if ((p.scope === "product" && p.scope_ref === productId) || (p.scope === "category" && categoryId && p.scope_ref === categoryId)) best = Math.max(best, p.value);
  }
  return best;
}
export { activePromos };

// Best single order-level discount among: coupon, automatic 'order' promo, loyalty tier.
export async function orderDiscount(env, store, customer, subtotal, code) {
  const cands = [];
  const now = nowIso();
  const c = String(code || "").trim().toUpperCase();
  let promoId = null, couponReason = null;
  if (c) {
    const p = await env.DB.prepare("SELECT * FROM promotions WHERE store_id=? AND UPPER(code)=? AND scope='coupon' AND type='percent' LIMIT 1").bind(store.id, c).first();
    if (!p || !promoLive(p, now)) couponReason = "Mã không hợp lệ hoặc đã hết hạn";
    else if (subtotal < p.min_order) couponReason = "Đơn tối thiểu " + new Intl.NumberFormat("vi-VN").format(p.min_order) + " đ";
    else cands.push({ source: "coupon", label: "Mã " + c + " (-" + p.value + "%)", percent: p.value, cap: p.max_discount, promo_id: p.id });
  }
  for (const p of await activePromos(env, store)) {
    if (p.scope === "order" && subtotal >= p.min_order) cands.push({ source: "promo", label: p.name + " (-" + p.value + "%)", percent: p.value, cap: p.max_discount, promo_id: p.id });
  }
  if (customer) {
    const tiers = await loadTiers(env, store), { spent } = await spentOf(env, store, customer.id), t = tierFor(tiers, spent, customer.tier_override);
    if (t.percent > 0) cands.push({ source: "tier", label: "Hạng " + t.name + " (-" + t.percent + "%)", percent: t.percent, cap: null, promo_id: null });
  }
  let best = null;
  for (const x of cands) {
    let amt = Math.floor((subtotal * x.percent) / 100);
    if (x.cap != null) amt = Math.min(amt, x.cap);
    if (!best || amt > best.amount) best = { ...x, amount: amt };
  }
  return { discount: best?.amount || 0, best, coupon_error: couponReason };
}

// ---------- request handling ----------
export async function handleCustomers(req, env, store, H, auth) {
  const { json, clean, id, input } = H;
  const u = new URL(req.url), path = u.pathname, m = req.method;
  const bad = (msg, code = 400) => json(req, { ok: false, error: msg }, code);

  // ===== public: /api/c/* =====
  if (path.startsWith("/api/c/")) {
    const cust = await customerFromReq(req, env, store);

    if (path === "/api/c/config" && m === "GET") {
      const tiers = await loadTiers(env, store);
      const auto = (await activePromos(env, store)).filter((p) => p.scope !== "coupon").map((p) => ({ id: p.id, name: p.name, percent: p.value, scope: p.scope, scope_ref: p.scope_ref, min_order: p.min_order, ends_at: p.ends_at }));
      const wc = (await activePromos(env, store)).find((p) => p.scope === "coupon" && String(p.code || "").toUpperCase() === "WELCOME");
      return json(req, { welcome: wc ? { percent: wc.value, min_order: wc.min_order } : null, store: store.code, google_client_id: env.GOOGLE_CLIENT_ID?.value ?? env.GOOGLE_CLIENT_ID ?? null, tiers, promos: auto });
    }

    if (path === "/api/c/register" && m === "POST") {
      const d = await input(req), email = normEmail(d.email), phone = normPhone(d.phone), name = clean(d.name).slice(0, 80), pw = String(d.password || "");
      if (!name) return bad("Vui lòng nhập họ tên");
      if (!email && !phone) return bad("Cần email hoặc số điện thoại hợp lệ");
      if (pw.length < 8 || pw.length > 128) return bad("Mật khẩu từ 8 đến 128 ký tự");
      if (!d.consent) return bad("Cần đồng ý để chúng tôi lưu thông tin tài khoản");
      if (email && (await env.DB.prepare("SELECT 1 x FROM customers WHERE store_id=? AND email=? AND (password_hash IS NOT NULL OR google_sub IS NOT NULL)").bind(store.id, email).first())) return bad("Email đã được đăng ký");
      if (phone && (await env.DB.prepare("SELECT 1 x FROM customers WHERE store_id=? AND phone=? AND (password_hash IS NOT NULL OR google_sub IS NOT NULL)").bind(store.id, phone).first())) return bad("Số điện thoại đã được đăng ký");
      const cid = id("cus"), salt = newSalt(), hash = await pbkdf2(pw, salt);
      await env.DB.prepare("INSERT INTO customers(id,store_id,name,phone,email,address,password_hash,password_salt,consent_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(cid, store.id, name, phone || null, email || null, clean(d.address).slice(0, 300) || null, hash, salt, nowIso()).run();
      await linkVisitor(env, store, cid, d.visitor_id);
      await logEvent(env, store, cid, d.visitor_id, "register", null, null, id);
      const token = await newSession(env, store, cid);
      return json(req, { ok: true, token, customer: publicProfile(await env.DB.prepare("SELECT * FROM customers WHERE id=?").bind(cid).first()) }, 201);
    }

    if (path === "/api/c/login" && m === "POST") {
      const d = await input(req), login = clean(d.login).toLowerCase(), pw = String(d.password || "");
      const email = normEmail(login), phone = email ? "" : normPhone(login);
      if ((!email && !phone) || !pw) return bad("Thông tin đăng nhập không đúng", 401);
      const c = await env.DB.prepare(`SELECT * FROM customers WHERE store_id=? AND ${email ? "email=?" : "phone=?"} AND password_hash IS NOT NULL LIMIT 1`).bind(store.id, email || phone).first();
      if (!c || c.status !== "active") return bad("Thông tin đăng nhập không đúng", 401);
      if (c.locked_until && c.locked_until > nowIso()) return bad("Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau 15 phút.", 429);
      const ok = safeEq(await pbkdf2(pw, c.password_salt), c.password_hash);
      if (!ok) {
        const n = (c.fail_count || 0) + 1;
        await env.DB.prepare("UPDATE customers SET fail_count=?,locked_until=? WHERE id=?").bind(n >= 8 ? 0 : n, n >= 8 ? plusIso(15 * 60e3) : null, c.id).run();
        return bad("Thông tin đăng nhập không đúng", 401);
      }
      await linkVisitor(env, store, c.id, d.visitor_id);
      await logEvent(env, store, c.id, d.visitor_id, "login", null, null, id);
      return json(req, { ok: true, token: await newSession(env, store, c.id), customer: publicProfile(c) });
    }

    if (path === "/api/c/google" && m === "POST") {
      const cid0 = env.GOOGLE_CLIENT_ID?.value ?? env.GOOGLE_CLIENT_ID;
      if (!cid0) return bad("Đăng nhập Google chưa được bật cho website này", 501);
      const d = await input(req), cred = String(d.credential || "");
      if (!cred || cred.length > 4096) return bad("Thiếu thông tin Google");
      const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(cred));
      if (!r.ok) return bad("Không xác thực được tài khoản Google", 401);
      const g = await r.json();
      if (g.aud !== String(cid0) || !["accounts.google.com", "https://accounts.google.com"].includes(g.iss) || g.email_verified !== "true" || !g.sub) return bad("Không xác thực được tài khoản Google", 401);
      const email = normEmail(g.email);
      let c = await env.DB.prepare("SELECT * FROM customers WHERE store_id=? AND google_sub=? LIMIT 1").bind(store.id, g.sub).first();
      if (!c && email) {
        c = await env.DB.prepare("SELECT * FROM customers WHERE store_id=? AND email=? AND (password_hash IS NOT NULL OR google_sub IS NOT NULL) LIMIT 1").bind(store.id, email).first();
        if (c) {
          // verified Google email takes over an unverified password account to prevent squatting
          await env.DB.batch([env.DB.prepare("UPDATE customers SET google_sub=?,password_hash=NULL,password_salt=NULL WHERE id=?").bind(g.sub, c.id), env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id=?").bind(c.id)]);
        }
      }
      if (c && c.status !== "active") return bad("Tài khoản đã bị khóa", 403);
      if (!c) {
        const cid = id("cus");
        await env.DB.prepare("INSERT INTO customers(id,store_id,name,email,google_sub,consent_at) VALUES(?,?,?,?,?,?)").bind(cid, store.id, clean(g.name).slice(0, 80) || email, email || null, g.sub, nowIso()).run();
        c = await env.DB.prepare("SELECT * FROM customers WHERE id=?").bind(cid).first();
      }
      await linkVisitor(env, store, c.id, d.visitor_id);
      await logEvent(env, store, c.id, d.visitor_id, "login", "google", null, id);
      return json(req, { ok: true, token: await newSession(env, store, c.id), customer: publicProfile(c) });
    }

    if (path === "/api/c/lead" && m === "POST") {
      const d = await input(req), email = normEmail(d.email), phone = normPhone(d.phone), name = clean(d.name).slice(0, 80);
      if (!d.consent) return bad("Cần đồng ý để chúng tôi lưu thông tin liên hệ");
      if (!email && !phone) return bad("Cần email hoặc số điện thoại hợp lệ");
      const vid = /^[A-Za-z0-9_-]{8,64}$/.test(String(d.visitor_id || "")) ? d.visitor_id : null;
      if (!vid) return bad("Thiếu visitor_id");
      const recent = await env.DB.prepare("SELECT COUNT(*) n FROM customer_events WHERE store_id=? AND visitor_id=? AND type='lead' AND created_at>?").bind(store.id, vid, plusIso(-3600e3)).first();
      if (recent.n >= 3) return bad("Bạn thao tác quá nhanh, vui lòng thử lại sau", 429);
      const src = clean(d.source).slice(0, 60) || "popup";
      let row = await env.DB.prepare(`SELECT id,password_hash,google_sub FROM customers WHERE store_id=? AND status='active' AND (${email ? "email=?" : "phone=?"}) ORDER BY (password_hash IS NULL AND google_sub IS NULL) DESC LIMIT 1`).bind(store.id, email || phone).first();
      const guest = row && !row.password_hash && !row.google_sub;
      let cid = null;
      if (guest) {
        cid = row.id;
        await env.DB.prepare("UPDATE customers SET name=CASE WHEN name=email OR name=phone OR name='' THEN COALESCE(NULLIF(?,''),name) ELSE name END,phone=COALESCE(phone,?),email=COALESCE(email,?),source=COALESCE(source,?),lead_at=COALESCE(lead_at,?),consent_at=COALESCE(consent_at,?),last_seen_at=? WHERE id=?").bind(name, phone || null, email || null, src, nowIso(), nowIso(), nowIso(), cid).run();
      } else if (!row) {
        cid = id("cus");
        await env.DB.prepare("INSERT INTO customers(id,store_id,name,phone,email,source,lead_at,consent_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(cid, store.id, name || email || phone, phone || null, email || null, src, nowIso(), nowIso(), nowIso()).run();
      }
      if (cid) await linkVisitor(env, store, cid, vid);
      // existing registered account: respond identically, never reveal that it exists
      await logEvent(env, store, cid, vid, "lead", src, null, id);
      const wc = (await activePromos(env, store)).find((p) => p.scope === "coupon" && String(p.code || "").toUpperCase() === "WELCOME");
      return json(req, { ok: true, coupon: wc ? { code: "WELCOME", percent: wc.value, min_order: wc.min_order } : null }, 201);
    }

    if (path === "/api/c/logout" && m === "POST") {
      const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/, "");
      if (t) await env.DB.prepare("DELETE FROM customer_sessions WHERE token_hash=?").bind(await sha(t)).run();
      return json(req, { ok: true });
    }

    if (path === "/api/c/event" && m === "POST") {
      const d = await input(req), type = clean(d.type);
      if (!EVENT_TYPES.has(type)) return bad("Loại sự kiện không hợp lệ");
      const vid = /^[A-Za-z0-9_-]{8,64}$/.test(String(d.visitor_id || "")) ? d.visitor_id : null;
      if (!cust && !vid) return bad("Thiếu visitor_id");
      const who = cust ? ["customer_id", cust.id] : ["visitor_id", vid];
      const recent = await env.DB.prepare(`SELECT COUNT(*) n FROM customer_events WHERE store_id=? AND ${who[0]}=? AND created_at>?`).bind(store.id, who[1], plusIso(-3600e3)).first();
      if (recent.n >= 60) return json(req, { ok: true, skipped: true });
      const known = cust ? null : (await env.DB.prepare("SELECT customer_id FROM customer_events WHERE store_id=? AND visitor_id=? AND customer_id IS NOT NULL ORDER BY created_at DESC LIMIT 1").bind(store.id, vid).first())?.customer_id;
      await logEvent(env, store, cust?.id || known || null, vid, type, clean(d.ref).slice(0, 200) || null, d.meta ? JSON.stringify(d.meta).slice(0, 500) : null, id);
      if (cust) await env.DB.prepare("UPDATE customers SET last_seen_at=? WHERE id=?").bind(nowIso(), cust.id).run();
      return json(req, { ok: true });
    }

    if (path === "/api/c/coupon" && m === "GET") {
      const subtotal = Math.max(0, parseInt(u.searchParams.get("subtotal") || "0", 10) || 0);
      const r = await orderDiscount(env, store, cust, subtotal, u.searchParams.get("code"));
      return json(req, { ok: true, discount: r.discount, applied: r.best ? { source: r.best.source, label: r.best.label, percent: r.best.percent } : null, coupon_error: r.coupon_error });
    }

    // everything below needs a signed-in customer
    if (!cust) return bad("Vui lòng đăng nhập", 401);

    if (path === "/api/c/me" && m === "GET") {
      const tiers = await loadTiers(env, store), { spent, completed } = await spentOf(env, store, cust.id), tier = tierFor(tiers, spent, cust.tier_override);
      const next = tiers.find((t) => t.min_spent > spent) || null;
      const orders = (await env.DB.prepare("SELECT order_no,status,subtotal,discount,discount_label,total,deposit_paid,created_at FROM orders WHERE store_id=? AND customer_id=? ORDER BY created_at DESC LIMIT 30").bind(store.id, cust.id).all()).results;
      return json(req, { customer: publicProfile(cust), tier: { code: tier.code, name: tier.name, percent: tier.percent }, spent, completed_orders: completed, next_tier: next ? { name: next.name, percent: next.percent, remaining: next.min_spent - spent } : null, orders });
    }
    if (path === "/api/c/me" && m === "PATCH") {
      const d = await input(req), sets = [], vals = [];
      if (d.name !== undefined) { const v = clean(d.name).slice(0, 80); if (!v) return bad("Họ tên không được trống"); sets.push("name=?"); vals.push(v); }
      if (d.address !== undefined) { sets.push("address=?"); vals.push(clean(d.address).slice(0, 300) || null); }
      if (d.phone !== undefined) {
        const p = normPhone(d.phone); if (d.phone && !p) return bad("Số điện thoại không hợp lệ");
        if (p && (await env.DB.prepare("SELECT 1 x FROM customers WHERE store_id=? AND phone=? AND id<>? AND (password_hash IS NOT NULL OR google_sub IS NOT NULL)").bind(store.id, p, cust.id).first())) return bad("Số điện thoại đã được dùng");
        sets.push("phone=?"); vals.push(p || null);
      }
      if (d.new_password !== undefined) {
        const np = String(d.new_password);
        if (np.length < 8 || np.length > 128) return bad("Mật khẩu từ 8 đến 128 ký tự");
        if (cust.password_hash && !safeEq(await pbkdf2(String(d.password || ""), cust.password_salt), cust.password_hash)) return bad("Mật khẩu hiện tại không đúng", 403);
        const salt = newSalt(); sets.push("password_hash=?", "password_salt=?"); vals.push(await pbkdf2(np, salt), salt);
        await env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id=? AND token_hash<>?").bind(cust.id, await sha((req.headers.get("authorization") || "").replace(/^Bearer\s+/, ""))).run();
      }
      if (!sets.length) return bad("Không có gì để cập nhật");
      await env.DB.prepare(`UPDATE customers SET ${sets.join(",")} WHERE id=?`).bind(...vals, cust.id).run();
      return json(req, { ok: true, customer: publicProfile(await env.DB.prepare("SELECT * FROM customers WHERE id=?").bind(cust.id).first()) });
    }
    if (path === "/api/c/me/delete" && m === "POST") {
      // right to erasure: anonymise the profile, keep order totals for accounting
      await env.DB.batch([
        env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id=?").bind(cust.id),
        env.DB.prepare("DELETE FROM customer_events WHERE customer_id=?").bind(cust.id),
        env.DB.prepare("UPDATE customers SET name='(đã xóa)',phone=NULL,email=NULL,address=NULL,password_hash=NULL,password_salt=NULL,google_sub=NULL,note=NULL,status='deleted' WHERE id=?").bind(cust.id),
      ]);
      return json(req, { ok: true });
    }
    return null;
  }

  // ===== admin =====
  if (!path.startsWith("/api/v1/customers") && !path.startsWith("/api/v1/promotions") && path !== "/api/v1/tiers") return null;
  const { lvl } = auth, deny = () => json(req, { error: "unauthorized" }, 401);

  if (path === "/api/v1/customers" && m === "GET") {
    if (lvl < 2) return deny();
    const q = clean(u.searchParams.get("q")).slice(0, 60), lim = Math.min(500, parseInt(u.searchParams.get("limit") || "200", 10) || 200);
    const like = "%" + q.replace(/[%_]/g, "") + "%";
    const rows = (await env.DB.prepare(`SELECT c.id,c.name,c.email,c.phone,c.address,c.status,c.tier_override,c.created_at,c.last_login_at,c.last_seen_at,c.source,c.lead_at,(c.password_hash IS NOT NULL OR c.google_sub IS NOT NULL) has_account,
      COALESCE((SELECT SUM(total) FROM orders o WHERE o.customer_id=c.id AND o.status='completed'),0) spent,
      (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id) orders,
      (SELECT COUNT(*) FROM customer_events e WHERE e.customer_id=c.id AND e.type='visit') visits
      FROM customers c WHERE c.store_id=? AND c.status<>'deleted' AND (?='' OR c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?) ORDER BY COALESCE(c.last_seen_at,c.created_at) DESC LIMIT ?`).bind(store.id, q, like, like, like, lim).all()).results;
    const tiers = await loadTiers(env, store);
    return json(req, { items: rows.map((r) => ({ ...r, tier: tierFor(tiers, r.spent, r.tier_override).name })) });
  }
  const cm = path.match(/^\/api\/v1\/customers\/([^/]+)$/);
  if (cm && m === "GET") {
    if (lvl < 2) return deny();
    const c = await env.DB.prepare("SELECT id,name,email,phone,address,status,tier_override,note,created_at,consent_at,last_login_at,last_seen_at,google_sub FROM customers WHERE id=? AND store_id=?").bind(cm[1], store.id).first();
    if (!c) return bad("Không tìm thấy khách", 404);
    const tiers = await loadTiers(env, store), { spent, completed } = await spentOf(env, store, c.id);
    return json(req, {
      customer: { ...c, google: !!c.google_sub, google_sub: undefined }, spent, completed_orders: completed, tier: tierFor(tiers, spent, c.tier_override),
      orders: (await env.DB.prepare("SELECT order_no,status,subtotal,discount,discount_label,total,created_at FROM orders WHERE store_id=? AND customer_id=? ORDER BY created_at DESC LIMIT 50").bind(store.id, c.id).all()).results,
      events: (await env.DB.prepare("SELECT type,ref,created_at FROM customer_events WHERE store_id=? AND customer_id=? ORDER BY created_at DESC LIMIT 100").bind(store.id, c.id).all()).results,
    });
  }
  if (cm && m === "PATCH") {
    if (lvl < 3) return deny();
    const d = await input(req), sets = [], vals = [];
    if (d.status !== undefined) { if (!["active", "blocked"].includes(d.status)) return bad("status phải là active hoặc blocked"); sets.push("status=?"); vals.push(d.status); }
    if (d.note !== undefined) { sets.push("note=?"); vals.push(clean(d.note).slice(0, 500) || null); }
    if (d.tier_override !== undefined) {
      const code = clean(d.tier_override) || null;
      if (code && !(await loadTiers(env, store)).some((t) => t.code === code)) return bad("Hạng không tồn tại");
      sets.push("tier_override=?"); vals.push(code);
    }
    if (!sets.length) return bad("Không có gì để cập nhật");
    await env.DB.prepare(`UPDATE customers SET ${sets.join(",")} WHERE id=? AND store_id=?`).bind(...vals, cm[1], store.id).run();
    if (d.status === "blocked") await env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id=?").bind(cm[1]).run();
    return json(req, { ok: true });
  }

  if (path === "/api/v1/tiers" && m === "GET") { if (lvl < 1) return deny(); return json(req, { items: await loadTiers(env, store), custom: (await env.DB.prepare("SELECT COUNT(*) n FROM customer_tiers WHERE store_id=?").bind(store.id).first()).n > 0 }); }
  if (path === "/api/v1/tiers" && m === "POST") {
    if (lvl < 3) return deny();
    const d = await input(req), list = Array.isArray(d.tiers) ? d.tiers : [];
    if (list.length < 1 || list.length > 8) return bad("Cần 1 đến 8 hạng");
    const seen = new Set(), rows = list.map((t) => {
      const code = slug(t.code || t.name), name = clean(t.name).slice(0, 40), min = Math.trunc(Number(t.min_spent)), pct = Math.trunc(Number(t.percent));
      if (!code || !name || seen.has(code) || !(min >= 0) || !(pct >= 0 && pct <= 50)) throw Error("Hạng không hợp lệ (percent 0-50, min_spent >= 0)");
      seen.add(code); return { code, name, min, pct };
    });
    if (!rows.some((r) => r.min === 0)) return bad("Phải có một hạng bắt đầu từ 0 đ");
    await env.DB.batch([env.DB.prepare("DELETE FROM customer_tiers WHERE store_id=?").bind(store.id), ...rows.map((r) => env.DB.prepare("INSERT INTO customer_tiers(id,store_id,code,name,min_spent,percent) VALUES(?,?,?,?,?,?)").bind(id("tier"), store.id, r.code, r.name, r.min, r.pct))]);
    return json(req, { ok: true });
  }

  if (path === "/api/v1/promotions" && m === "GET") {
    if (lvl < 1) return deny();
    return json(req, { items: (await env.DB.prepare("SELECT id,code,name,scope,scope_ref,value percent,min_order,max_discount,max_uses,used_count,active,starts_at,ends_at,created_at FROM promotions WHERE store_id=? AND type='percent' ORDER BY COALESCE(created_at,'') DESC,rowid DESC").bind(store.id).all()).results });
  }
  if (path === "/api/v1/promotions" && m === "POST") {
    if (lvl < 3) return deny();
    const d = await input(req), pct = Math.trunc(Number(d.percent)), scope = clean(d.scope) || "coupon", name = clean(d.name).slice(0, 80);
    if (!["coupon", "order", "product", "category"].includes(scope)) return bad("scope: coupon, order, product hoặc category");
    if (!name) return bad("Thiếu tên chương trình");
    if (!(pct >= 1 && pct <= 90)) return bad("Giảm giá từ 1% đến 90%");
    const code = clean(d.code).toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
    if (scope === "coupon") {
      if (code.length < 3) return bad("Mã coupon tối thiểu 3 ký tự (A-Z, 0-9)");
      if (await env.DB.prepare("SELECT 1 x FROM promotions WHERE store_id=? AND UPPER(code)=?").bind(store.id, code).first()) return bad("Mã đã tồn tại");
    }
    const ref = clean(d.scope_ref).slice(0, 80) || null;
    if ((scope === "product" || scope === "category") && !ref) return bad("Thiếu scope_ref (id sản phẩm/danh mục)");
    const int = (v) => (v === undefined || v === null || v === "" ? null : Math.max(0, Math.trunc(Number(v))));
    const pid = id("promo");
    await env.DB.prepare("INSERT INTO promotions(id,store_id,code,name,type,value,active,starts_at,ends_at,scope,scope_ref,min_order,max_discount,max_uses,created_at) VALUES(?,?,?,?,'percent',?,?,?,?,?,?,?,?,?,?)").bind(pid, store.id, scope === "coupon" ? code : null, name, pct, d.active === false ? 0 : 1, clean(d.starts_at) || null, clean(d.ends_at) || null, scope, ref, int(d.min_order) || 0, int(d.max_discount), int(d.max_uses), nowIso()).run();
    return json(req, { ok: true, id: pid }, 201);
  }
  const pm = path.match(/^\/api\/v1\/promotions\/([^/]+)$/);
  if (pm && m === "PATCH") {
    if (lvl < 3) return deny();
    const d = await input(req), sets = [], vals = [];
    if (d.active !== undefined) { sets.push("active=?"); vals.push(d.active ? 1 : 0); }
    if (d.ends_at !== undefined) { sets.push("ends_at=?"); vals.push(clean(d.ends_at) || null); }
    if (d.max_uses !== undefined) { sets.push("max_uses=?"); vals.push(d.max_uses === null || d.max_uses === "" ? null : Math.max(0, Math.trunc(Number(d.max_uses)))); }
    if (!sets.length) return bad("Không có gì để cập nhật");
    await env.DB.prepare(`UPDATE promotions SET ${sets.join(",")} WHERE id=? AND store_id=?`).bind(...vals, pm[1], store.id).run();
    return json(req, { ok: true });
  }
  return null;
}

const slug = (s) => String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function logEvent(env, store, customerId, visitorId, type, ref, meta, id) {
  const vid = /^[A-Za-z0-9_-]{8,64}$/.test(String(visitorId || "")) ? visitorId : null;
  await env.DB.prepare("INSERT INTO customer_events(id,store_id,customer_id,visitor_id,type,ref,meta) VALUES(?,?,?,?,?,?,?)").bind(id("evt"), store.id, customerId, vid, type, ref, meta).run();
}
async function linkVisitor(env, store, customerId, visitorId) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(visitorId || ""))) return;
  await env.DB.prepare("UPDATE customer_events SET customer_id=? WHERE store_id=? AND visitor_id=? AND customer_id IS NULL").bind(customerId, store.id, visitorId).run();
}
