// Thư viện ảnh theo cửa hàng. Ảnh lưu trong R2 (binding MEDIA), metadata trong D1.
// Ảnh cũ còn trong D1 (cột data) vẫn đọc được; owner chạy /api/v1/media/migrate để chuyển dần sang R2.
// Phục vụ ảnh từ R2 không đọc dòng D1 nào, nên không tốn hạn mức đọc D1.
const MAX_BYTES = 700 * 1024, MAX_FILES = 20000, MIGRATE_BATCH = 25;
const sniff = (b) => (b[0] === 0xff && b[1] === 0xd8 ? "image/jpeg" : b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? "image/png" : b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 ? "image/webp" : "");
const key = (id) => "media/" + id;
const b64bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const HEADERS = (mime) => ({ "content-type": mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff", "access-control-allow-origin": "*", "content-security-policy": "default-src 'none'" });

export async function serveMedia(req, env) {
  const m = new URL(req.url).pathname.match(/^\/api\/media\/(med_[A-Za-z0-9_-]{6,60})$/);
  if (!m || req.method !== "GET") return null;
  if (env.MEDIA) {
    const obj = await env.MEDIA.get(key(m[1]));
    if (obj) return new Response(obj.body, { headers: HEADERS(obj.httpMetadata?.contentType || "application/octet-stream") });
  }
  const r = await env.DB.prepare("SELECT mime,data FROM media WHERE id=?").bind(m[1]).first();
  if (!r || !r.data) return new Response("not found", { status: 404 });
  return new Response(b64bytes(r.data), { headers: HEADERS(r.mime) });
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
    let bin; try { bin = b64bytes(b64); } catch { return json(req, { ok: false, error: "Dữ liệu ảnh không hợp lệ" }, 400); }
    if (bin.length > MAX_BYTES) return json(req, { ok: false, error: "Ảnh quá lớn (tối đa 700KB)" }, 400);
    const mime = sniff(bin); if (!mime) return json(req, { ok: false, error: "Chỉ nhận ảnh JPG, PNG, WebP" }, 400);
    const n = (await env.DB.prepare("SELECT COUNT(*) c FROM media WHERE store_id=?").bind(store.id).first()).c;
    if (n >= MAX_FILES) return json(req, { ok: false, error: "Thư viện đã đủ " + MAX_FILES.toLocaleString("vi-VN") + " ảnh. Thêm nữa sẽ phát sinh phí lưu trữ (vượt 10GB miễn phí). Xoá bớt ảnh cũ hoặc báo chủ shop." }, 400);
    const mid = id("med");
    if (env.MEDIA) {
      await env.MEDIA.put(key(mid), bin, { httpMetadata: { contentType: mime } });
      await env.DB.prepare("INSERT INTO media(id,store_id,mime,size,name,data,created_by) VALUES(?,?,?,?,?,?,?)").bind(mid, store.id, mime, bin.length, String(d.name || "").slice(0, 120), "", who || null).run();
    } else {
      await env.DB.prepare("INSERT INTO media(id,store_id,mime,size,name,data,created_by) VALUES(?,?,?,?,?,?,?)").bind(mid, store.id, mime, bin.length, String(d.name || "").slice(0, 120), b64, who || null).run();
    }
    return json(req, { ok: true, id: mid, url: u.origin + "/api/media/" + mid, size: bin.length }, 201);
  }
  // Chuyển ảnh cũ từ D1 sang R2 (owner). Gọi lặp lại đến khi remaining = 0.
  if (path === "/api/v1/media/migrate" && req.method === "POST") {
    if (lvl < 3) return deny();
    if (!env.MEDIA) return json(req, { ok: false, error: "Chưa gắn kho R2 (binding MEDIA)" }, 400);
    const rows = (await env.DB.prepare("SELECT id,mime,data FROM media WHERE store_id=? AND data<>'' LIMIT ?").bind(store.id, MIGRATE_BATCH).all()).results;
    for (const r of rows) {
      await env.MEDIA.put(key(r.id), b64bytes(r.data), { httpMetadata: { contentType: r.mime } });
      await env.DB.prepare("UPDATE media SET data='' WHERE id=? AND store_id=?").bind(r.id, store.id).run();
    }
    const left = (await env.DB.prepare("SELECT COUNT(*) c FROM media WHERE store_id=? AND data<>''").bind(store.id).first()).c;
    return json(req, { ok: true, moved: rows.length, remaining: left });
  }
  const dm = path.match(/^\/api\/v1\/media\/(med_[\w-]+)$/);
  if (dm && req.method === "DELETE") {
    if (lvl < 3) return deny();
    await env.DB.prepare("DELETE FROM media WHERE id=? AND store_id=?").bind(dm[1], store.id).run();
    if (env.MEDIA) await env.MEDIA.delete(key(dm[1]));
    return json(req, { ok: true });
  }
  return json(req, { error: "not found" }, 404);
}
