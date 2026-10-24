// Video sản phẩm: dựng ngoài hệ thống (GitHub Actions + ffmpeg, xem .github/workflows/product-video.yml
// trong repo AMONguyen), rồi tải lên đây bằng token quản trị. Lưu trong R2 (binding MEDIA), link vào products.video_url.
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB, đủ cho slideshow ~10-15 ảnh, đủ nhẹ để phát trên web
const key = (id) => "video/" + id;
const b64bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function serveProductVideo(req, env) {
  const m = new URL(req.url).pathname.match(/^\/api\/video\/(vid_[A-Za-z0-9_-]{6,60})$/);
  if (!m || req.method !== "GET") return null;
  if (!env.MEDIA) return new Response("not found", { status: 404 });
  const obj = await env.MEDIA.get(key(m[1]));
  if (!obj) return new Response("not found", { status: 404 });
  return new Response(obj.body, { headers: {
    "content-type": "video/mp4", "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
    "access-control-allow-origin": "*", "x-content-type-options": "nosniff",
  } });
}

export async function handleProductVideo(req, env, store, H, auth) {
  const { json, id, input } = H, u = new URL(req.url), path = u.pathname;
  if (path !== "/api/v1/product-video" || req.method !== "POST") return null;
  if (auth.lvl < 2) return json(req, { error: "unauthorized" }, 401);
  const d = await input(req), pid = String(d.product_id || "").trim();
  if (!pid) return json(req, { ok: false, error: "product_id required" }, 400);
  const prod = await env.DB.prepare("SELECT id FROM products WHERE id=? AND store_id=?").bind(pid, store.id).first();
  if (!prod) return json(req, { ok: false, error: "product not found" }, 404);
  const b64 = String(d.data || "").replace(/^data:[^,]*,/, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length > MAX_VIDEO_BYTES * 1.4) return json(req, { ok: false, error: "Video quá lớn (tối đa 20MB) hoặc sai định dạng" }, 400);
  let bin; try { bin = b64bytes(b64); } catch { return json(req, { ok: false, error: "Dữ liệu video không hợp lệ" }, 400); }
  if (bin.length > MAX_VIDEO_BYTES) return json(req, { ok: false, error: "Video quá lớn (tối đa 20MB)" }, 400);
  if (!env.MEDIA) return json(req, { ok: false, error: "Chưa gắn kho R2 (binding MEDIA)" }, 400);
  const vid = id("vid");
  await env.MEDIA.put(key(vid), bin, { httpMetadata: { contentType: "video/mp4" } });
  const url = u.origin + "/api/video/" + vid;
  await env.DB.prepare("UPDATE products SET video_url=? WHERE id=? AND store_id=?").bind(url, pid, store.id).run();
  return json(req, { ok: true, url, size: bin.length }, 201);
}
