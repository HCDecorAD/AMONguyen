// Nhap nhanh nhieu san pham (1 dong = 1 san pham, tu sinh bien the size x mau).
//   POST /api/products/bulk  {dry?:bool, items:[{name,brand,category,price,sale_price,sizes,colors,stock,images,description,material,origin,badge,tags,status,sku}]}
const list = (v) => (Array.isArray(v) ? v : String(v ?? "").split(/[,;|\n]+/)).map((s) => String(s).trim()).filter(Boolean);
const BADGES = ["", "Mới", "Hot", "Sale", "Bán chạy"];

export async function handleBulk(req, env, store, H, A) {
  const path = new URL(req.url).pathname;
  const { json, clean, id, input, slug } = H;
  if (path === "/api/taxonomy" && req.method === "GET") {
    if (A.lvl < 1) return json(req, { error: "unauthorized" }, 401);
    const q = async (t) => (await env.DB.prepare("SELECT name FROM " + t + " WHERE store_id=? ORDER BY name").bind(store.id).all()).results.map((r) => r.name);
    return json(req, { brands: await q("brands"), categories: await q("categories") });
  }
  if (path !== "/api/products/bulk" || req.method !== "POST") return null;
  if (A.lvl < 2) return json(req, { error: "unauthorized" }, 401);
  const d = await input(req), items = Array.isArray(d.items) ? d.items : [];
  if (!items.length || items.length > 200) return json(req, { ok: false, error: "1-200 dòng mỗi lần" }, 422);

  const errs = [], plan = [];
  const skuTaken = new Set((await env.DB.prepare("SELECT sku FROM variants WHERE store_id=?").bind(store.id).all()).results.map((r) => r.sku));
  const slugTaken = new Set((await env.DB.prepare("SELECT slug FROM products WHERE store_id=?").bind(store.id).all()).results.map((r) => r.slug));
  const code = String(store.code || "SHOP").toUpperCase();
  items.forEach((x, i) => {
    const row = i + 1, e = (m) => errs.push({ row, error: m });
    const name = clean(x.name);
    if (!name) return e("Thiếu tên sản phẩm");
    const price = Number(String(x.price ?? "").replace(/[^\d]/g, ""));
    if (!Number.isFinite(price) || price <= 0) return e("Giá bán phải là số lớn hơn 0");
    const sp = clean(x.sale_price) ? Number(String(x.sale_price).replace(/[^\d]/g, "")) : null;
    if (sp != null && (!Number.isFinite(sp) || sp < 0 || sp > price)) return e("Giá khuyến mãi phải nhỏ hơn hoặc bằng giá bán");
    const cost = clean(x.cost) ? Number(String(x.cost).replace(/[^\d]/g, "")) : null;
    if (cost != null && (!Number.isFinite(cost) || cost < 0)) return e("Giá vốn phải là số không âm");
    let sizes = list(x.sizes), colors = list(x.colors);
    if (!sizes.length) sizes = [""];
    if (!colors.length) colors = [""];
    if (sizes.length * colors.length > 60) return e("Quá nhiều biến thể (tối đa 60 = size × màu)");
    const stock = clean(x.stock) === "" ? 0 : Number(x.stock);
    if (!Number.isInteger(stock) || stock < 0) return e("Tồn kho phải là số nguyên không âm");
    const badge = clean(x.badge);
    if (badge && !BADGES.includes(badge)) return e("Nhãn chỉ nhận: Mới, Hot, Sale, Bán chạy");
    const base = slug(name) || "sp";
    let s = base, n = 2;
    while (slugTaken.has(s)) s = base + "-" + n++;
    slugTaken.add(s);
    const prefix = (clean(x.sku) || code + "-" + base.split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 4)).replace(/\s+/g, "").toUpperCase();
    const vars = [];
    for (const sz of sizes) for (const c of colors) {
      let sku = [prefix, sz, c && slug(c).toUpperCase()].filter(Boolean).join("-").replace(/[^A-Za-z0-9\-.]/g, ""), k = 2, b = sku;
      while (skuTaken.has(sku)) sku = b + "-" + k++;
      skuTaken.add(sku);
      vars.push({ sku, size: sz, color: c });
    }
    plan.push({ row, name, slug: s, price, sp, cost, stock, vars, brand: clean(x.brand), cat: clean(x.category),
      desc: clean(x.description), material: clean(x.material), origin: clean(x.origin), badge, tags: list(x.tags).join(", "),
      status: clean(x.status) === "draft" ? "draft" : "active", images: list(String(x.images ?? "").replace(/\s+/g, "\n")).filter((u) => /^https?:\/\//.test(u) || u.startsWith("/")).slice(0, 8) });
  });
  // Thương hiệu và danh mục chỉ nhận giá trị đã có trong hệ thống (không tự tạo mới, tránh trùng kiểu "Lv"/"LV").
  // "Khác" hoặc để trống = không gắn thương hiệu.
  const known = { brands: new Map(), categories: new Map() };
  for (const t of Object.keys(known)) (await env.DB.prepare("SELECT id,slug FROM " + t + " WHERE store_id=?").bind(store.id).all()).results.forEach((r) => known[t].set(r.slug, r.id));
  for (const p of plan) {
    p.bid = null; p.cid = null;
    if (p.brand && slug(p.brand) !== "khac") {
      p.bid = known.brands.get(slug(p.brand)) || null;
      if (!p.bid) errs.push({ row: p.row, error: "Thương hiệu \"" + p.brand + "\" không có trong danh sách (chọn: Gucci, LV, Salvatore Ferragamo, Bally, Dior, Khác)" });
    }
    if (p.cat) {
      p.cid = known.categories.get(slug(p.cat)) || null;
      if (!p.cid) errs.push({ row: p.row, error: "Danh mục \"" + p.cat + "\" không có trong danh sách" });
    }
  }
  if (errs.length) return json(req, { ok: false, error: errs.map((e) => "Sản phẩm " + e.row + ": " + e.error).join("; "), errors: errs }, 422);
  const summary = { products: plan.length, variants: plan.reduce((a, p) => a + p.vars.length, 0) };
  if (d.dry) return json(req, { ok: true, dry: true, summary });

  const loc = "loc_" + code.toLowerCase() + "_main", created = [];
  for (const p of plan) {
    const pid = id("prd"), bid = p.bid, cid = p.cid, b = [];
    b.push(env.DB.prepare("INSERT INTO products(id,store_id,brand_id,category_id,name,slug,description,status,price,sale_price,material,origin,badge,tags) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(pid, store.id, bid, cid, p.name, p.slug, p.desc, p.status, p.price, p.sp, p.material || null, p.origin || null, p.badge || null, p.tags || null));
    for (const v of p.vars) {
      const vid = id("var");
      b.push(env.DB.prepare("INSERT INTO variants(id,store_id,product_id,sku,size,color,price,sale_price,cost,status,attributes_json) VALUES(?,?,?,?,?,?,?,?,?,'active','{}')").bind(vid, store.id, pid, v.sku, v.size || null, v.color || null, p.price, p.sp, p.cost),
        env.DB.prepare("INSERT INTO inventory_levels(store_id,location_id,variant_id,on_hand,reserved,incoming) VALUES(?,?,?,?,0,0)").bind(store.id, loc, vid, p.stock));
    }
    p.images.forEach((u, k) => b.push(env.DB.prepare("INSERT INTO product_images(id,store_id,product_id,url,alt,sort_order) VALUES(?,?,?,?,?,?)").bind(id("img"), store.id, pid, u, p.name, k)));
    await env.DB.batch(b);
    created.push({ id: pid, slug: p.slug, name: p.name, variants: p.vars.length });
  }
  return json(req, { ok: true, summary, created }, 201);
}
