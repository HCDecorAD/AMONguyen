// Owner-editable website pages built from content blocks.
// Public:  GET /api/site/page?slug=home
// Admin:   /api/v1/site/pages[/:slug[/publish|unpublish|rollback|versions]]
const MAX_BLOCKS = 60, MAX_BYTES = 120000, KEEP_VERSIONS = 25;
const TYPES = ["hero", "text", "image", "gallery", "video", "cards", "links", "list", "cta", "products"];
const nowIso = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const SAFE_LINK = /^(https?:\/\/[^\s<>"']+|\/[^\s<>"':]*|#[\w-]*|mailto:[^\s<>"']+|tel:\+?[\d\s.-]+|[A-Za-z0-9_\-./]+(\?[^\s<>"']*)?(#[\w-]*)?)$/;
const SAFE_IMG = /^(https?:\/\/[^\s<>"']+|\/[^\s<>"':]+|[A-Za-z0-9_\-./]+(\?[^\s<>"']*)?)$/;

const str = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/<\/?[a-zA-Z!][^>]*>?/g, "").trim().slice(0, n);
const link = (v) => { const s = str(v, 500); if (!s) return ""; if (!SAFE_LINK.test(s)) throw Error("Liên kết không hợp lệ: " + s.slice(0, 60)); return s; };
const img = (v) => { const s = str(v, 500); if (!s) return ""; if (!SAFE_IMG.test(s)) throw Error("Địa chỉ ảnh không hợp lệ: " + s.slice(0, 60)); return s; };

export function normVideo(v) {
  const s = str(v, 500); if (!s) return { url: "", kind: "" };
  let m;
  if ((m = s.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{6,20})/i)) || (m = s.match(/^https?:\/\/youtu\.be\/([\w-]{6,20})/i)) || (m = s.match(/^https?:\/\/(?:www\.)?youtube\.com\/(?:shorts|embed)\/([\w-]{6,20})/i))) return { url: "https://www.youtube.com/embed/" + m[1], kind: "embed" };
  if ((m = s.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d{5,12})/i)) || (m = s.match(/^https?:\/\/player\.vimeo\.com\/video\/(\d{5,12})/i))) return { url: "https://player.vimeo.com/video/" + m[1], kind: "embed" };
  if ((m = s.match(/^https?:\/\/drive\.google\.com\/file\/d\/([\w-]{10,80})/i))) return { url: "https://drive.google.com/file/d/" + m[1] + "/preview", kind: "embed" };
  if (/^https:\/\/[^\s<>"']+\.(mp4|webm)(\?[^\s<>"']*)?$/i.test(s)) return { url: s, kind: "file" };
  throw Error("Video chỉ hỗ trợ YouTube, Vimeo, Google Drive hoặc file .mp4/.webm (https)");
}

function cleanBlock(b, mkId) {
  if (!b || typeof b !== "object" || !TYPES.includes(b.type)) throw Error("Loại khối không hợp lệ");
  const p = b.props && typeof b.props === "object" ? b.props : {};
  const out = {};
  const items = (arr, n, fn) => (Array.isArray(arr) ? arr.slice(0, n).map(fn) : []);
  switch (b.type) {
    case "hero": Object.assign(out, { eyebrow: str(p.eyebrow, 80), title: str(p.title, 160), lead: str(p.lead, 400), image: img(p.image), alt: str(p.alt, 120), primaryLabel: str(p.primaryLabel, 40), primaryUrl: link(p.primaryUrl), secondaryLabel: str(p.secondaryLabel, 40), secondaryUrl: link(p.secondaryUrl) }); break;
    case "text": Object.assign(out, { kicker: str(p.kicker, 60), title: str(p.title, 160), body: str(p.body, 4000), align: ["left", "center"].includes(p.align) ? p.align : "left" }); break;
    case "image": Object.assign(out, { url: img(p.url), alt: str(p.alt, 120), caption: str(p.caption, 200), link: link(p.link) }); break;
    case "gallery": Object.assign(out, { title: str(p.title, 120), images: items(p.images, 16, (x) => ({ url: img(x?.url), alt: str(x?.alt, 120) })).filter((x) => x.url) }); break;
    case "video": { const v = normVideo(p.url); Object.assign(out, { title: str(p.title, 120), url: v.url, kind: v.kind }); break; }
    case "cards": Object.assign(out, { title: str(p.title, 120), linkLabel: str(p.linkLabel, 40), linkUrl: link(p.linkUrl), items: items(p.items, 16, (x) => ({ title: str(x?.title, 100), subtitle: str(x?.subtitle, 200), image: img(x?.image), url: link(x?.url) })).filter((x) => x.title) }); break;
    case "links": Object.assign(out, { title: str(p.title, 120), note: str(p.note, 200), items: items(p.items, 24, (x) => ({ label: str(x?.label, 60), url: link(x?.url) })).filter((x) => x.label) }); break;
    case "list": Object.assign(out, { title: str(p.title, 120), linkLabel: str(p.linkLabel, 40), linkUrl: link(p.linkUrl), items: items(p.items, 20, (x) => str(typeof x === "string" ? x : x?.text, 200)).filter(Boolean) }); break;
    case "products": Object.assign(out, { title: str(p.title, 120), linkLabel: str(p.linkLabel, 40), linkUrl: link(p.linkUrl), limit: [4, 6, 8, 12, 16].includes(Number(p.limit)) ? Number(p.limit) : 8 }); break;
    case "cta": Object.assign(out, { title: str(p.title, 160), text: str(p.text, 400), buttonLabel: str(p.buttonLabel, 40), buttonUrl: link(p.buttonUrl) }); break;
  }
  out.size = ["s", "m", "l"].includes(p.size) ? p.size : "m";
  if (["cards", "gallery", "links", "list"].includes(b.type)) { const c = Number(p.cols); out.cols = [2, 3, 4, 5, 6].includes(c) ? c : 0; }
  return { id: str(b.id, 40).replace(/[^\w-]/g, "") || mkId("blk"), type: b.type, enabled: b.enabled !== false, props: out };
}
export function cleanBlocks(blocks, mkId) {
  if (!Array.isArray(blocks)) throw Error("blocks phải là danh sách");
  if (blocks.length > MAX_BLOCKS) throw Error("Tối đa " + MAX_BLOCKS + " khối mỗi trang");
  const seen = new Set(), out = blocks.map((b) => cleanBlock(b, mkId));
  for (const b of out) { while (seen.has(b.id)) b.id = mkId("blk"); seen.add(b.id); }
  if (JSON.stringify(out).length > MAX_BYTES) throw Error("Nội dung trang quá lớn");
  return out;
}

export async function handleContent(req, env, store, H, auth) {
  const { json, clean, id, input } = H, u = new URL(req.url), path = u.pathname, m = req.method;
  const bad = (msg, code = 400) => json(req, { ok: false, error: msg }, code), deny = () => json(req, { error: "unauthorized" }, 401);
  const parse = (s) => { try { return JSON.parse(s); } catch { return []; } };

  if (path === "/api/site/page" && m === "GET") {
    const slug = clean(u.searchParams.get("slug")).toLowerCase();
    if (!/^[a-z0-9-]{1,40}$/.test(slug)) return bad("slug không hợp lệ");
    const r = await env.DB.prepare("SELECT slug,title,published_json,version,published_at FROM site_pages WHERE store_id=? AND slug=?").bind(store.id, slug).first();
    if (!r || !r.published_json) return json(req, { published: false });
    return json(req, { published: true, slug: r.slug, title: r.title, version: r.version, published_at: r.published_at, blocks: parse(r.published_json) });
  }
  if (!path.startsWith("/api/v1/site/pages")) return null;
  const { lvl, who } = auth;
  if (lvl < 2) return deny();
  if (path === "/api/v1/site/pages" && m === "GET") {
    const rows = (await env.DB.prepare("SELECT slug,title,version,published_at,updated_at,draft_json,published_json FROM site_pages WHERE store_id=? ORDER BY slug").bind(store.id).all()).results;
    return json(req, { items: rows.map((r) => ({ slug: r.slug, title: r.title, version: r.version, published: !!r.published_json, published_at: r.published_at, updated_at: r.updated_at, unpublished_changes: r.draft_json !== (r.published_json ?? r.draft_json) })) });
  }
  const pm = path.match(/^\/api\/v1\/site\/pages\/([a-z0-9-]{1,40})(?:\/(publish|unpublish|rollback|versions))?$/);
  if (!pm) return bad("not found", 404);
  const slug = pm[1], act = pm[2];
  const row = () => env.DB.prepare("SELECT * FROM site_pages WHERE store_id=? AND slug=?").bind(store.id, slug).first();
  const audit = (action, payload) => env.DB.prepare("INSERT INTO audit_logs(id,store_id,action,entity_type,entity_id,payload) VALUES(?,?,?,?,?,?)").bind(id("aud"), store.id, action, "site_page", slug, JSON.stringify(payload)).run();

  if (!act && m === "GET") {
    const r = await row();
    if (!r) return json(req, { slug, exists: false, draft: [], published: null, version: 0 });
    return json(req, { slug, exists: true, title: r.title, draft: parse(r.draft_json), published: r.published_json ? parse(r.published_json) : null, version: r.version, published_at: r.published_at, updated_at: r.updated_at });
  }
  if (!act && m === "POST") {
    const d = await input(req), blocks = cleanBlocks(d.blocks, id), title = str(d.title, 120) || slug;
    const cur = await row();
    if (cur && d.base && cur.updated_at !== d.base) return json(req, { error: "stale", message: "Trang vừa được người khác sửa. Hãy tải lại trang để lấy bản mới nhất." }, 409);
    const ts = nowIso();
    await env.DB.prepare("INSERT INTO site_pages(id,store_id,slug,title,draft_json,updated_at,updated_by) VALUES(?,?,?,?,?,?,?) ON CONFLICT(store_id,slug) DO UPDATE SET title=excluded.title,draft_json=excluded.draft_json,updated_at=excluded.updated_at,updated_by=excluded.updated_by").bind(id("page"), store.id, slug, title, JSON.stringify(blocks), ts, who || null).run();
    return json(req, { ok: true, blocks, updated_at: ts });
  }
  if (act === "versions" && m === "GET") {
    return json(req, { items: (await env.DB.prepare("SELECT version,title,note,created_by,created_at FROM site_page_versions WHERE store_id=? AND slug=? ORDER BY version DESC LIMIT ?").bind(store.id, slug, KEEP_VERSIONS).all()).results });
  }
  if (m !== "POST") return bad("method", 405);
  if (lvl < 3) return deny(); // publish / unpublish / rollback: manager and above
  const r = await row();
  if (!r) return bad("Trang chưa có nội dung", 404);

  const publish = async (blocksJson, title, note) => {
    const ver = (r.version || 0) + 1;
    await env.DB.batch([
      env.DB.prepare("UPDATE site_pages SET draft_json=?,published_json=?,title=?,version=?,published_at=?,updated_at=?,updated_by=? WHERE id=?").bind(blocksJson, blocksJson, title, ver, nowIso(), nowIso(), who || null, r.id),
      env.DB.prepare("INSERT INTO site_page_versions(id,store_id,slug,version,title,blocks_json,note,created_by) VALUES(?,?,?,?,?,?,?,?)").bind(id("ver"), store.id, slug, ver, title, blocksJson, note, who || null),
      env.DB.prepare("DELETE FROM site_page_versions WHERE store_id=? AND slug=? AND version<=?").bind(store.id, slug, ver - KEEP_VERSIONS),
    ]);
    await audit(note.startsWith("rollback") ? "site_rollback" : "site_publish", { version: ver, by: who || null });
    return ver;
  };
  if (act === "publish") {
    const blocks = cleanBlocks(parse(r.draft_json), id);
    if (!blocks.some((b) => b.enabled)) return bad("Cần ít nhất một khối đang bật trước khi xuất bản");
    return json(req, { ok: true, version: await publish(JSON.stringify(blocks), r.title, "publish") });
  }
  if (act === "unpublish") {
    await env.DB.prepare("UPDATE site_pages SET published_json=NULL,published_at=NULL,updated_at=? WHERE id=?").bind(nowIso(), r.id).run();
    await audit("site_unpublish", { by: who || null });
    return json(req, { ok: true });
  }
  if (act === "rollback") {
    const d = await input(req), v = await env.DB.prepare("SELECT title,blocks_json,version FROM site_page_versions WHERE store_id=? AND slug=? AND version=?").bind(store.id, slug, Math.trunc(Number(d.version))).first();
    if (!v) return bad("Không tìm thấy phiên bản", 404);
    return json(req, { ok: true, version: await publish(v.blocks_json, v.title, "rollback to v" + v.version) });
  }
  return bad("not found", 404);
}
