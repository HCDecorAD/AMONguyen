// Image library per store, stored in D1 as base64. Public read by unguessable id; upload staff+, delete manager+.
const MAX_BYTES = 700 * 1024, MAX_FILES = 400;
const sniff = (b) => (b[0] === 0xff && b[1] === 0xd8 ? "image/jpeg" : b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? "image/png" : b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 ? "image/webp" : "");
export async function serveMedia(req, env) {
  const m = new URL(req.url).pathname.match(/^\/api\/media\/(med_[A-Za-z0-9_-]{6,60})$/);
  if (!m || req.method !== "GET") return null;
  const r = await env.DB.prepare("SELECT mime,data FROM media WHERE id=?").bind(m[1]).first();
  if (!r) return new Response("not found", { status: 404 });
  const bin = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
  return new Response(bin, { headers: { "content-type": r.mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff", "access-control-allow-origin": "*", "content-security-policy": "default-src 'none'" } });
}
export async function handleMedia(req, env, store, H, auth) {
  const { json, id, input } = H, u = new URL(req.url), path = u.pathname, { lvl, who } = auth;
  if (!path.startsWith("/api/v1/media")) return null;
  const deny = () => json(req, { error: "unauthorized" }, 401);
  if (lvl < 2) return deny();
  if (path === "/api/v1/media" && req.method === "GET") {
    const rows = (await env.DB.prepare("SELECT id,mime,size,name,created_by,created_at FROM media WHERE store_id=? ORDER BY created_at DESC LIMIT 200").bind(store.id).all()).results;
    return json(req, { items: rows.map((r) => ({ ...r, url: u.origin + "/api/media/" + r.id })) });
  }
  if (path === "/api/v1/media" && req.method === "POST") {
    const d = await input(req), b64 = String(d.data || "").replace(/^data:[^,]*,/, "");
    if (!/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length > MAX_BYTES * 1.4) return json(req, { ok: false, error: "Ảnh quá lớn (tối đa ~700KB sau nén) hoặc sai định dạng" }, 400);
    let bin; try { bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); } catch { return json(req, { ok: false, error: "Dữ liệu ảnh không hợp lệ" }, 400); }
    if (bin.length > MAX_BYTES) return json(req, { ok: false, error: "Ảnh quá lớn (tối đa 700KB)" }, 400);
    const mime = sniff(bin); if (!mime) return json(req, { ok: false, error: "Chỉ nhận ảnh JPG, PNG, WebP" }, 400);
    const n = (await env.DB.prepare("SELECT COUNT(*) c FROM media WHERE store_id=?").bind(store.id).first()).c;
    if (n >= MAX_FILES) return json(req, { ok: false, error: "Thư viện ảnh đã đầy (" + MAX_FILES + "). Xoá bớt ảnh cũ." }, 400);
    const mid = id("med"); await env.DB.prepare("INSERT INTO media(id,store_id,mime,size,name,data,created_by) VALUES(?,?,?,?,?,?,?)").bind(mid, store.id, mime, bin.length, String(d.name || "").slice(0, 120), b64, who || null).run();
    return json(req, { ok: true, id: mid, url: u.origin + "/api/media/" + mid, size: bin.length }, 201);
  }
  const dm = path.match(/^\/api\/v1\/media\/(med_[\w-]+)$/);
  if (dm && req.method === "DELETE") { if (lvl < 3) return deny(); await env.DB.prepare("DELETE FROM media WHERE id=? AND store_id=?").bind(dm[1], store.id).run(); return json(req, { ok: true }); }
  return json(req, { error: "not found" }, 404);
}
