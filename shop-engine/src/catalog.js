// Public read-only catalog for storefronts (no auth, no cost/barcode, stock capped).
//   GET /api/public/products?store=<id>          -> list of active products
//   GET /api/public/product?store=<id>&slug=...  -> one product with variants + images
const CAP = 20;
const abs = (origin, u) => { u = String(u || ""); return u.startsWith("/") ? origin + u : u; };
const eff = (p, v) => (v?.sale_price ?? v?.price ?? p.sale_price ?? p.price ?? 0);
const baseP = (p, v) => (v?.price ?? p.price ?? 0);

export async function handleCatalog(req, env, store, H) {
  const u = new URL(req.url), path = u.pathname;
  if (req.method !== "GET" || (path !== "/api/public/products" && path !== "/api/public/product" && path !== "/api/public/media")) return null;
  const { json } = H, origin = u.origin;
  const pub = (data) => { const r = json(req, data); r.headers.set("cache-control", "public, max-age=30"); return r; };

  if (path === "/api/public/media") {
    const rows = (await env.DB.prepare("SELECT id,kind,title,url,sort_order FROM media_items WHERE store_id=? ORDER BY sort_order,created_at DESC").bind(store.id).all()).results;
    return pub({ items: rows.map((r) => ({ ...r, url: abs(origin, r.url) })) });
  }

  if (path === "/api/public/products") {
    const prods = (await env.DB.prepare(
      "SELECT p.id,p.slug,p.name,p.price,p.sale_price,p.badge,c.name cat,c.slug cat_slug,b.name brand,b.slug brand_slug," +
      "(SELECT url FROM product_images i WHERE i.store_id=p.store_id AND i.product_id=p.id ORDER BY sort_order LIMIT 1) image " +
      "FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id " +
      "WHERE p.store_id=? AND p.status='active' ORDER BY p.created_at DESC LIMIT 300").bind(store.id).all()).results;
    const vars = (await env.DB.prepare(
      "SELECT v.product_id,v.size,v.color,v.price,v.sale_price," +
      "COALESCE((SELECT SUM(l.on_hand-l.reserved) FROM inventory_levels l WHERE l.store_id=v.store_id AND l.variant_id=v.id),0) avail " +
      "FROM variants v WHERE v.store_id=? AND v.status='active'").bind(store.id).all()).results;
    const by = new Map();
    for (const v of vars) { if (!by.has(v.product_id)) by.set(v.product_id, []); by.get(v.product_id).push(v); }
    const items = prods.map((p) => {
      const vs = by.get(p.id) || [], ok = vs.filter((v) => v.avail > 0);
      const prices = (ok.length ? ok : vs).map((v) => eff(p, v)).filter((x) => x > 0);
      const pool = (ok.length ? ok : vs).filter((v) => eff(p, v) > 0).sort((a, b) => eff(p, a) - eff(p, b)), top = pool[0];
      const cmp = top ? baseP(p, top) : (p.price || 0), cur = top ? eff(p, top) : eff(p, null);
      return {
        id: p.id, slug: p.slug, name: p.name, cat: p.cat || "", cat_slug: p.cat_slug || "", brand: p.brand || "", brand_slug: p.brand_slug || "",
        price: top ? cur : eff(p, null), compare: cmp > cur ? cmp : 0, image: abs(origin, p.image),
        badge: p.badge || "", colors: [...new Set(ok.map((v) => String(v.color || "").trim()).filter(Boolean))], available: ok.length ? 1 : 0, sizes: [...new Set(ok.map((v) => String(v.size || "").trim()).filter(Boolean))],
      };
    });
    return pub({ items });
  }

  const key = String(u.searchParams.get("slug") || "").trim();
  if (!key) return json(req, { error: "slug required" }, 400);
  const p = await env.DB.prepare(
    "SELECT p.id,p.slug,p.name,p.description,p.price,p.sale_price,p.material,p.origin,p.badge,p.tags,p.video_url,c.name cat,b.name brand FROM products p " +
    "LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id WHERE p.store_id=? AND p.status='active' AND (p.slug=? OR p.id=?)").bind(store.id, key, key).first();
  if (!p) return json(req, { error: "not found" }, 404);
  const images = (await env.DB.prepare("SELECT url,alt FROM product_images WHERE product_id=? AND store_id=? ORDER BY sort_order").bind(p.id, store.id).all()).results.map((i) => ({ url: abs(origin, i.url), alt: i.alt || "" }));
  const variants = (await env.DB.prepare(
    "SELECT v.id,v.sku,v.size,v.color,v.price,v.sale_price," +
    "COALESCE((SELECT SUM(l.on_hand-l.reserved) FROM inventory_levels l WHERE l.store_id=v.store_id AND l.variant_id=v.id),0) avail " +
    "FROM variants v WHERE v.store_id=? AND v.product_id=? AND v.status='active' ORDER BY v.size,v.sku").bind(store.id, p.id).all()).results
    .map((v) => ({ id: v.id, sku: v.sku, size: v.size || "", color: v.color || "", price: eff(p, v), base_price: v.price ?? p.price, available: Math.max(0, Math.min(CAP, v.avail)) }));
  return pub({ id: p.id, slug: p.slug, name: p.name, description: p.description || "", cat: p.cat || "", brand: p.brand || "", material: p.material || "", origin: p.origin || "", badge: p.badge || "", tags: p.tags || "", video_url: abs(origin, p.video_url || ""), price: eff(p, null), compare: (p.price || 0) > eff(p, null) ? p.price : 0, images, variants });
}
