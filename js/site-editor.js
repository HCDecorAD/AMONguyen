/* "Giao diện website" — owner-facing block editor for shop-admin.html.
   Relies on shop-admin globals: api, act, esc, content, setnav, openBox, closeBox, canW, canMgr, STORE, ME, table. */
(function () {
  "use strict";
  var TYPE_NAME = { hero: "Banner đầu trang", text: "Văn bản", image: "Một ảnh", gallery: "Thư viện ảnh", video: "Video", cards: "Thẻ / danh mục", links: "Dãy liên kết", list: "Danh sách ý", cta: "Kêu gọi hành động", products: "Lưới sản phẩm (tự động từ kho)" };
  var FIELDS = {
    hero: [["eyebrow", "Dòng nhỏ phía trên"], ["title", "Tiêu đề lớn"], ["lead", "Mô tả ngắn", "area"], ["image", "Ảnh banner (link hoặc đường dẫn)", "img"], ["alt", "Mô tả ảnh"], ["primaryLabel", "Nút chính - chữ"], ["primaryUrl", "Nút chính - link"], ["secondaryLabel", "Nút phụ - chữ"], ["secondaryUrl", "Nút phụ - link"]],
    text: [["kicker", "Dòng nhỏ phía trên"], ["title", "Tiêu đề"], ["body", "Nội dung", "area"], ["align", "Căn lề", "align"]],
    image: [["url", "Ảnh (link hoặc đường dẫn)", "img"], ["alt", "Mô tả ảnh"], ["caption", "Chú thích"], ["link", "Bấm vào ảnh mở link (tuỳ chọn)"]],
    gallery: [["title", "Tiêu đề (tuỳ chọn)"]],
    video: [["title", "Tiêu đề (tuỳ chọn)"], ["url", "Link video: YouTube, Vimeo, Google Drive hoặc file .mp4"]],
    cards: [["title", "Tiêu đề khu vực"], ["linkLabel", "Chữ link góc phải"], ["linkUrl", "Link góc phải"]],
    links: [["title", "Tiêu đề"], ["note", "Ghi chú nhỏ"]],
    list: [["title", "Tiêu đề"], ["linkLabel", "Chữ link góc phải"], ["linkUrl", "Link góc phải"]],
    products: [["title", "Tiêu đề"], ["linkLabel", "Chữ liên kết (vd: Xem tất cả →)"], ["linkUrl", "Link (vd: shop.html)"]],
    cta: [["title", "Tiêu đề"], ["text", "Nội dung", "area"], ["buttonLabel", "Chữ nút"], ["buttonUrl", "Link nút"]]
  };
  var ITEMS = {
    gallery: { key: "images", label: "Ảnh", fields: [["url", "Link ảnh"], ["alt", "Mô tả"]] },
    cards: { key: "items", label: "Thẻ", fields: [["title", "Tên thẻ"], ["subtitle", "Mô tả ngắn"], ["image", "Ảnh (tuỳ chọn)"], ["url", "Link"]] },
    links: { key: "items", label: "Liên kết", fields: [["label", "Chữ hiển thị"], ["url", "Link"]] },
    list: { key: "items", label: "Ý", fields: null }
  };
  var ED = null, FORM = null, DRAG = null;

  function htable(rows, cols, action) { return '<div style="overflow:auto"><table><thead><tr>' + cols.map(function (c) { return '<th>' + c[0] + '</th>'; }).join("") + (action ? "<th></th>" : "") + '</tr></thead><tbody>' + rows.map(function (r) { return "<tr>" + cols.map(function (c) { return "<td>" + c[1](r) + "</td>"; }).join("") + (action ? "<td>" + action(r) + "</td>" : "") + "</tr>"; }).join("") + "</tbody></table></div>"; }
  /* ---- image upload (compress in browser, store in Worker D1) ---- */
  function compress(file) {
    return new Promise(function (res, rej) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return rej(Error("Chỉ nhận ảnh JPG, PNG, WebP"));
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var sc = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        var q = 0.85, out; for (var i = 0; i < 6; i++) { out = c.toDataURL("image/webp", q); if (!/^data:image\/webp/.test(out)) out = c.toDataURL("image/jpeg", q); if (out.length * 0.75 < 600 * 1024) break; q -= 0.12; }
        if (out.length * 0.75 > 690 * 1024) return rej(Error("Ảnh quá lớn, hãy chọn ảnh nhỏ hơn"));
        res(out);
      };
      im.onerror = function () { rej(Error("Không đọc được ảnh")); }; im.src = url;
    });
  }
  window.hcUpload = async function (file) { var d = await compress(file); var r = await api("/api/v1/media", { method: "POST", body: JSON.stringify({ name: file.name, data: d }) }); return r.url; };
  window.siteUpload = function (input, key) {
    var f = input.files && input.files[0]; if (!f) return;
    act(async function () { var u = await hcUpload(f); var pt = key.split("."), o = FORM.props; for (var q = 0; q < pt.length - 1; q++) o = o[pt[q]]; o[pt[pt.length - 1]] = u; var b = ED.blocks.find(function (x) { return x.id === FORM.id; }); formDraw(b.type); });
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nid() { return "b" + Math.random().toString(36).slice(2, 9); }
  function blank(type) {
    var p = {}; (FIELDS[type] || []).forEach(function (f) { p[f[0]] = f[2] === "align" ? "left" : ""; });
    p.size = "m"; if (ITEMS[type]) p[ITEMS[type].key] = []; return { id: nid(), type: type, enabled: true, props: p };
  }
  function summary(b) {
    var p = b.props || {}; var s = p.title || p.eyebrow || p.kicker || p.caption || p.alt || p.url || p.image || p.buttonLabel || "";
    var n = ITEMS[b.type] && (p[ITEMS[b.type].key] || []).length; return String(s).slice(0, 70) + (n ? " · " + n + " mục" : "");
  }

  /* AMO home as blocks, so the owner can start from what the site shows today */
  function seedHome() {
    var cat = function (t, u) { return { title: t, subtitle: "", image: "", url: u }; };
    var sz = ["37-37.5", "38-38.5", "39-39.5", "40-40.5", "41-41.5", "42-42.5", "43-43.5", "44-44.5", "45-45.5"].map(function (x) { return { label: x, url: "size/" + x.replace(/[-.]/g, "-").replace("--", "-") + "/" }; });
    return [
      { id: nid(), type: "hero", enabled: true, props: { eyebrow: "", title: "", lead: "", image: "assets/images/amo-banner-new.png", alt: "Shop Giày Si AMO Nguyễn", primaryLabel: "", primaryUrl: "", secondaryLabel: "", secondaryUrl: "" } },
      { id: nid(), type: "links", enabled: true, props: { title: "Giày Sneaker → chọn size", note: "", items: sz } },
      { id: nid(), type: "cards", enabled: true, props: { title: "Danh mục", linkLabel: "Xem tất cả →", linkUrl: "shop.html", cols: 3, size: "s", items: [cat("Giày công sở", "shop.html?cat=cong-so"), cat("Dép", "shop.html?cat=dep"), cat("Áo + Áo khoác", "shop.html?cat=ao"), cat("Túi xách", "shop.html?cat=tui-xach"), cat("Quần", "shop.html?cat=quan"), cat("Thắt lưng + Phụ kiện khác", "shop.html?cat=phu-kien")] } },
      { id: nid(), type: "products", enabled: true, props: { title: "", linkLabel: "", linkUrl: "", limit: 8 } },
      { id: nid(), type: "links", enabled: true, props: { title: "", note: "", items: [{ label: "LV", url: "shop.html?brand=LV" }, { label: "GUCCI", url: "shop.html?brand=GUCCI" }, { label: "SALVATORE FERRAGAMO", url: "shop.html?brand=Salvatore%20Ferragamo" }, { label: "BALLY", url: "shop.html?brand=BALLY" }, { label: "KHÁC", url: "shop.html?brand=KHAC" }] } },
      { id: nid(), type: "list", enabled: true, props: { title: "", linkLabel: "Xem chính sách bán hàng →", linkUrl: "policy.html", items: ["Thử chân khi nhận hàng", "Đổi size / đổi mẫu theo điều kiện và hàng còn sẵn", "Miễn phí ship toàn quốc theo chính sách áp dụng", "Quy định cọc / giữ hàng"] } }
    ];
  }

  function siteBase() {
    var s = (window.__SITE_STORES || []).find(function (x) { return x.id === STORE; });
    var d = s && s.domain ? String(s.domain).replace(/^https?:\/\//, "").replace(/\/.*$/, "") : ""; return d ? "https://" + d + "/" : "";
  }
  function viewUrl(slug) { var b = siteBase(); if (!b) return ""; return slug === "home" ? b : b + "p.html?slug=" + encodeURIComponent(slug); }

  window.siteView = function () {
    setnav("site", "Giao diện website"); document.body.classList.remove("side-off");
    act(async function () {
      var r = await Promise.all([api("/api/v1/site/pages"), api("/api/stores").catch(function () { return { items: [] }; })]);
      window.__SITE_STORES = r[1].items || [];
      var rows = r[0].items || [], have = {}; rows.forEach(function (x) { have[x.slug] = x; });
      if (!have.home) rows.unshift({ slug: "home", title: "Trang chủ", published: false, version: 0, empty: true });
      content.innerHTML = '<div class="panel"><div class="actions"><h3>Trang & nội dung website</h3>' + (canW() ? '<button class="primary" onclick="sitePageNew()">+ Trang mới</button>' : "") + '</div>' +
        '<p class="muted sm">Mỗi trang gồm các khối xếp chồng. Kéo thả hoặc dùng nút ↑ ↓ để đổi thứ tự. Chỉnh sửa lưu ở dạng <b>nháp</b>; khách chỉ thấy khi bấm <b>Xuất bản</b>. Trang chưa xuất bản sẽ hiện nội dung cũ của website.</p>' +
        htable(rows, [["Trang", function (x) { return esc(x.title || x.slug); }], ["Địa chỉ", function (x) { return esc(x.slug === "home" ? "Trang chủ" : "p.html?slug=" + x.slug); }],
          ["Trạng thái", function (x) { return x.published ? '<span class="pill g">Đã xuất bản v' + x.version + '</span>' + (x.unpublished_changes ? ' <span class="pill y">Có thay đổi chưa xuất bản</span>' : "") : (x.empty ? '<span class="pill">Đang dùng nội dung cũ</span>' : '<span class="pill y">Nháp</span>'); }],
          ["Cập nhật", function (x) { return esc((x.updated_at || "").slice(0, 16) || "—"); }]], function (x) { return '<button onclick="siteEdit(\'' + esc(x.slug) + '\')">' + (canW() ? "Sửa" : "Xem") + '</button>'; }) + '</div>' + '<div class="panel" id="fxPanel" style="margin-top:14px"><div class="actions"><h3>✨ Hiệu ứng sinh động</h3></div><p class="muted sm">Hiệu ứng nhẹ giúp website bớt tĩnh, thu hút khách. Bật/tắt từng loại, lưu ngay, khách thấy sau vài giây. Khách đã bật chế độ "giảm chuyển động" trên điện thoại sẽ không thấy hiệu ứng.</p><div id="fxBody" class="muted sm">Đang tải…</div></div>';
      siteFx();
    });
  };

  var FXL = [["on", "Bật tất cả hiệu ứng", "Tắt mục này = website đứng yên hoàn toàn"], ["reveal", "Hiện dần khi cuộn", "Khối nội dung trượt nhẹ lên khi khách kéo tới"], ["lift", "Thẻ sản phẩm nhấc lên", "Chạm/rê vào sản phẩm: nâng nhẹ, ảnh phóng nhẹ"], ["shine", "Ánh kim", "Tia sáng lướt qua banner, thương hiệu phát sáng nhịp nhẹ"], ["pulse", "Nhịp nút Zalo & giỏ hàng", "Nút Zalo tỏa sóng nhẹ, số giỏ hàng nảy nhẹ"]];
  window.siteFx = function () {
    api("/api/v1/site/settings").then(function (d) {
      var f = d.effects || {}, w = canMgr(), h = FXL.map(function (x) {
        return '<label class="fxr"><input type="checkbox" data-k="' + x[0] + '"' + (f[x[0]] !== false ? " checked" : "") + (w ? "" : " disabled") + ' onchange="siteFxSave()"><span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></span></label>';
      }).join("");
      var b = document.getElementById("fxBody"); if (!b) return;
      b.innerHTML = h + (w ? "" : '<p class="muted sm">Cần quyền quản lý (manager) để thay đổi.</p>') + '<p id="fxMsg" class="muted sm"></p>';
      if (!document.getElementById("fxcss")) { var st = document.createElement("style"); st.id = "fxcss"; st.textContent = ".fxr{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid #222c36;cursor:pointer}.fxr:first-child{border-top:0}.fxr input{width:22px;height:22px;margin:2px 0 0;accent-color:#246bfe}.fxr b{display:block;font-size:15px;color:#e8eef5}.fxr small{display:block;color:#8d9aa8;font-size:12.5px;margin-top:2px}"; document.head.appendChild(st); }
    }).catch(function () { var b = document.getElementById("fxBody"); if (b) b.textContent = "Chưa tải được cài đặt hiệu ứng."; });
  };
  window.siteFxSave = function () {
    var o = {}; document.querySelectorAll("#fxBody input[data-k]").forEach(function (i) { o[i.getAttribute("data-k")] = i.checked; });
    var m = document.getElementById("fxMsg"); if (m) m.textContent = "Đang lưu…";
    api("/api/v1/site/settings", { method: "POST", body: JSON.stringify({ effects: o }) }).then(function () { var m2 = document.getElementById("fxMsg"); if (m2) m2.textContent = "✓ Đã lưu. Khách thấy sau vài giây."; }).catch(function (e) { var m3 = document.getElementById("fxMsg"); if (m3) m3.textContent = "Lỗi: " + e.message; });
  };
  window.sitePageNew = function () {
    var s = (prompt("Địa chỉ trang (chữ thường, số, gạch ngang). Ví dụ: khuyen-mai, gioi-thieu") || "").trim().toLowerCase();
    if (!s) return; if (!/^[a-z0-9-]{1,40}$/.test(s)) return alert("Chỉ dùng chữ thường không dấu, số và dấu gạch ngang (tối đa 40 ký tự)");
    siteEdit(s);
  };


  var VIEW = "live", DEV = "desktop", DT = 0;
  function sizeDev() {
    var w = document.getElementById("sdev"); if (!w) return;
    var fs = [document.getElementById("sdraft"), document.getElementById("slive")], cw = w.clientWidth || 360, H = Math.max(420, Math.round(window.innerHeight * 0.72));
    var vw = DEV === "mobile" ? 390 : 1200, sc = Math.min(1, cw / vw), lw = Math.round(vw * sc);
    w.style.height = (H + 4) + "px";
    fs.forEach(function (f) { if (!f) return; f.style.width = vw + "px"; f.style.height = Math.round(H / sc) + "px"; f.style.transform = "scale(" + sc + ")"; f.style.transformOrigin = "0 0"; f.style.marginLeft = Math.max(0, Math.round((cw - lw) / 2)) + "px"; });
  }
  window.siteDev = function (d) {
    DEV = d; var a = document.getElementById("dDesk"), b = document.getElementById("dMob"); if (a) a.className = d === "desktop" ? "on" : ""; if (b) b.className = d === "mobile" ? "on" : "";
    sizeDev(); try { localStorage.setItem("siteDev", d); } catch (e) {}
  };
  window.siteLive = function (on) {
    VIEW = on ? "live" : "edit";
    var f = document.getElementById("slive"), dr = document.getElementById("sdraft"); if (!f || !dr) return;
    document.getElementById("mLive").className = on ? "on" : ""; document.getElementById("mDraft").className = on ? "" : "on";
    f.style.display = on ? "block" : "none"; dr.style.display = on ? "none" : "block";
    if (on) { var u = viewUrl(ED.slug); f.src = u ? u + (u.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now() : "about:blank"; } else drawPreview();
    sizeDev();
  };
  window.addEventListener("resize", function () { sizeDev(); });
  window.addEventListener("message", function (e) { if (e.data && e.data.hcBlk && canW()) siteBlock(e.data.hcBlk); });
  window.siteRefresh = function () {
    if (ED && ED.dirty && !confirm("Có thay đổi chưa lưu. Tải lại sẽ MẤT các thay đổi này. Tiếp tục?")) return;
    location.href = location.pathname + "?v=" + Date.now() + "#site";
  };
  window.siteEdit = function (slug) {
    act(async function () {
      var d = await api("/api/v1/site/pages/" + encodeURIComponent(slug));
      ED = { slug: slug, title: d.title || (slug === "home" ? "Trang chủ" : slug), blocks: d.exists ? d.draft : [], version: d.version || 0, published: !!d.published, dirty: false, base: d.updated_at || "", live: d.published || null, liveAt: d.published_at || "", exists: !!d.exists };
      if (ED.slug === "home" && canW() && !ED.published && (!ED.blocks.length || !ED.blocks.some(function (b) { return b.type === "products"; }))) ED.blocks = seedHome(); setnav("site", "Giao diện website"); document.body.classList.add("side-off"); siteDraw(); try { DEV = localStorage.getItem("siteDev") || (window.innerWidth < 700 ? "mobile" : "desktop"); } catch (e) { DEV = "desktop"; } siteDev(DEV); siteLive(true); if (window.innerWidth <= 700 && window.siteTab) siteTab("prev");
    });
  };
  function mark() { ED.dirty = true; var s = document.getElementById("sdirty"); if (s) s.hidden = false; drawPreview(); }

  function siteDraw() {
    var w = canW(), u = viewUrl(ED.slug);
    content.innerHTML = '<div class="panel"><div class="actions"><h3>' + esc(ED.title) + ' <span class="muted sm">(' + esc(ED.slug) + ')</span></h3><span class="w"><button onclick="siteView()">← Danh sách trang</button></span></div>' +
      '<div class="actions sbar" style="flex-wrap:wrap;gap:8px"><span id="sdirty" class="pill y" ' + (ED.dirty ? "" : "hidden") + '>Có thay đổi chưa đăng</span>' +
      (w ? '<button onclick="siteSave()">Lưu tạm</button>' : "") +
      (canMgr() ? ' <button class="primary" onclick="sitePublish()">Đăng lên web</button>' : "") + (canMgr() && ED.published ? ' <button class="opt" onclick="siteUnpublish()">Gỡ xuất bản</button>' : "") +
      ' <button onclick="siteRefresh()" title="Tải lại dữ liệu & giao diện mới nhất">↻<span class="lb"> Cập nhật</span></button> <button onclick="siteVersions()">Lịch sử</button>' + (u ? ' <a class="opt" href="' + esc(u) + '" target="_blank" rel="noopener"><button>Mở trang ↗</button></a>' : "") + '</div>' +
      '<p class="sm" style="margin:8px 0;padding:8px 10px;border-radius:8px;background:' + (ED.published ? '#12261a' : '#33260c') + '">' + (ED.published ? '🟢 Web đang chạy bản <b>v' + ED.version + '</b>' + (ED.liveAt ? ' (đăng ' + esc(String(ED.liveAt).slice(0, 16)) + ')' : '') + '. Khung bên dưới là <b>bản nháp</b>, chỉ lên web khi bấm “Đăng lên web”.' : '🟠 Web hiện <b>chưa dùng trang này từ trình sửa</b> (đang là nội dung cũ). Khung bên dưới là bản nháp, <b>chưa phải trang đang chạy</b>.') + '</p>' + '<p class="muted sm shelp" style="margin:8px 0 0"><b>Cách làm:</b> ① Xem <b>Trang thật</b> (↻ Cập nhật nếu cần) → ② bấm <b>✏ Chỉnh sửa</b>, chọn vùng cần sửa rồi bấm <b>Xong</b> → ③ bấm <b>Đăng lên web</b>.</p>' + (w ? '<input id="stitle" value="' + esc(ED.title) + '" placeholder="Tên trang" style="max-width:320px" oninput="ED_title(this.value)">' : "") + (canMgr() ? "" : '<p class="muted sm">Bạn có thể soạn nháp. Cần quyền quản lý (manager) trở lên để xuất bản.</p>') + '</div>' +
      '<div class="seg mobonly" style="margin:10px 0"><button type="button" class="on" id="tabB" onclick="siteTab(\'blocks\')">Các khối</button><button type="button" id="tabP" onclick="siteTab(\'prev\')">Trang web</button></div><div class="siteGrid" id="sgrid" data-p="blocks"><div class="panel"><div class="actions"><h3>Các khối</h3>' + (w ? '<span><select id="sadd"><option value="">+ Thêm khối…</option>' + Object.keys(TYPE_NAME).map(function (t) { return '<option value="' + t + '">' + esc(TYPE_NAME[t]) + '</option>'; }).join("") + '</select></span>' : "") + '</div>' +
      '<div id="sblocks"></div>' + (w && ED.slug === "home" ? '<button class="opt2" onclick="if(confirm(\'Đặt lại các khối theo trang chủ hiện tại? Thay đổi chưa đăng sẽ mất.\'))siteSeed()">↺ Lấy lại từ trang chủ hiện tại</button>' : "") + '</div>' +
      '<div class="panel"><div class="actions"><h3>Xem trước</h3><span class="seg mini" style="margin:0"><button type="button" id="mDraft" onclick="siteLive(false)">✏ Chỉnh sửa</button><button type="button" id="mLive" class="on" onclick="siteLive(true)">Trang thật</button></span></div><div class="seg mini" style="margin:6px 0"><button type="button" id="dDesk" class="on" onclick="siteDev(\'desktop\')">🖥 Máy tính</button><button type="button" id="dMob" onclick="siteDev(\'mobile\')">📱 Điện thoại</button></div><div id="sdev" class="sdev"><div id="sprev" style="display:none"></div><iframe id="sdraft" title="Bản nháp"></iframe><iframe id="slive" title="Trang web đang chạy" style="display:none"></iframe></div></div></div>';
    if (!document.getElementById("sitecss")) { var st = document.createElement("style"); st.id = "sitecss"; st.textContent =
      "[hidden]{display:none!important}.siteGrid{display:grid;grid-template-columns:minmax(300px,420px) 1fr;gap:14px;align-items:start}@media(max-width:1000px){.siteGrid{grid-template-columns:1fr}}" +
      ".sb{display:flex;align-items:center;gap:8px;border:1px solid #27303a;border-radius:10px;padding:8px 10px;margin:8px 0;background:#0f141a}.sb.off{opacity:.5}.sb.over{border-color:#246bfe}.sb .dg{cursor:grab;font-size:18px;color:#7f8c9b;padding:0 4px;user-select:none;touch-action:none}.sb .tx{flex:1;min-width:0}.sb .tx b{display:block}.sb .tx span{display:block;color:#8d9aa8;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sb button{padding:5px 8px}" +
      ".siteGrid>.panel{min-width:0}.sdev{width:100%}.seg.mini button{padding:7px 10px;font-size:13px;min-width:0}" +
      ".mobonly{display:none}.sbar{position:sticky;bottom:0}" +
      "@media(max-width:700px) and (orientation:portrait){.siteGrid{grid-template-columns:minmax(0,1fr)!important}.shelp,.sbar .opt,.sbar .lb{display:none!important}.sbar{flex-wrap:nowrap!important;gap:6px!important;padding:8px 10px!important}.sbar button{padding:10px 8px!important;font-size:14px}.sbar #sdirty{display:none}.mobonly{display:flex}.siteGrid>.panel{display:none}.siteGrid[data-p=blocks]>.panel:first-child{display:block}.siteGrid[data-p=prev]>.panel:last-child{display:block}.sbar{position:fixed;left:0;right:0;bottom:0;z-index:25;background:#11161d;border-top:1px solid #27303a;padding:10px 12px!important;margin:0!important;justify-content:center}.sbar button{flex:1 1 auto}.sprev{max-height:none}.sb{flex-wrap:wrap}.sb .tx{flex:1 1 100%}#content{padding-bottom:84px}}" +
      "@media(orientation:landscape) and (max-height:560px){.siteGrid{grid-template-columns:minmax(230px,320px) 1fr!important}.sprev{max-height:calc(100vh - 110px)}.mobonly{display:none!important}.siteGrid>.panel{display:block!important}.shelp{display:none}.main .top{display:none}.sb{padding:6px 8px}}" +
      ".seg{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}.seg button{min-width:56px;padding:9px 14px;font-size:14px}.seg button.on{background:#246bfe;color:#fff}.sprev [data-block]{cursor:pointer;outline:2px solid transparent;outline-offset:-2px;transition:outline-color .15s}.sprev [data-block]:hover{outline-color:#246bfe}" +
      ".sdev{overflow:hidden;border:1px solid #27303a;border-radius:10px;background:#0d0c0a}.sdev iframe{border:0;display:block;background:#0d0c0a}.sprev{background:#0d0c0a;color:#f7f1e4;border:1px solid #27303a;border-radius:10px;max-height:78vh;overflow:auto;--amog:#d5a83f}.sit{border:1px dashed #34404d;border-radius:8px;padding:8px;margin:6px 0}"; document.head.appendChild(st); }
    var add = document.getElementById("sadd"); if (add) add.onchange = function () { if (!add.value) return; var b = blank(add.value); ED.blocks.push(b); add.value = ""; mark(); drawBlocks(); siteBlock(b.id); };
    drawBlocks(); drawPreview();
  }
  window.ED_title = function (v) { ED.title = v; ED.dirty = true; var s = document.getElementById("sdirty"); if (s) s.hidden = false; };
  function drawPreview() {
    clearTimeout(DT); DT = setTimeout(function () {
      var f = document.getElementById("sdraft"); if (!f) return;
      var on = ED.blocks.some(function (b) { return b.enabled; });
      var data = JSON.stringify(ED.blocks).replace(/</g, "\\u003c");
      f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="' + location.origin + '/"><style>body{margin:0;background:#0d0c0a;color:#f7f1e4;font-family:system-ui,sans-serif;--amog:#d5a83f}[data-block]{cursor:pointer}[data-block]:hover{outline:2px solid #246bfe;outline-offset:-2px}</style></head><body><div id="r"></div><script src="js/hc-blocks.js?v=' + Date.now() + '"><\/script><script>var B=' + data + ';var r=document.getElementById("r");' + (on ? 'HCBlocks.render(B,r);' : 'r.innerHTML="<p style=padding:20px>Chưa có khối nào đang bật.</p>";') + 'document.querySelectorAll("[data-hcb-products]").forEach(function(g){g.innerHTML="<p style=\\"padding:18px;opacity:.7;text-align:center;border:1px dashed #6b5a2e;border-radius:12px\\">Lưới sản phẩm thật – tự lấy từ kho hàng khi lên web</p>"});document.addEventListener("click",function(e){var n=e.target.closest&&e.target.closest("[data-block]");if(n){e.preventDefault();parent.postMessage({hcBlk:n.getAttribute("data-block")},"*")}},true)<\/script></body></html>';
    }, 120);
  }
  function drawBlocks() {
    var host = document.getElementById("sblocks"), w = canW(); if (!host) return;
    if (!ED.blocks.length) { host.innerHTML = '<p class="muted">Trang trống. Thêm khối từ danh sách phía trên.</p>'; return; }
    host.innerHTML = ED.blocks.map(function (b, i) {
      return '<div class="sb ' + (b.enabled ? "" : "off") + '" data-i="' + i + '"><span class="dg" ' + (w ? 'draggable="true"' : "") + ' title="Kéo để đổi vị trí">⠿</span><div class="tx"><b>' + esc(TYPE_NAME[b.type] || b.type) + '</b><span>' + esc(summary(b) || "(trống)") + '</span></div>' +
        (w ? '<button onclick="siteMove(' + i + ',-1)" title="Lên">↑</button><button onclick="siteMove(' + i + ',1)" title="Xuống">↓</button><button onclick="siteToggle(' + i + ')" title="Bật/tắt">' + (b.enabled ? "👁" : "🚫") + '</button><button onclick="siteBlock(\'' + esc(b.id) + '\')">Sửa</button><button onclick="siteDel(' + i + ')" title="Xoá">✕</button>' : '<button onclick="siteBlock(\'' + esc(b.id) + '\')">Xem</button>') + '</div>';
    }).join("");
    if (!w) return;
    host.querySelectorAll(".sb").forEach(function (row) {
      var h = row.querySelector(".dg");
      h.addEventListener("dragstart", function (e) { DRAG = +row.dataset.i; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(DRAG)); e.dataTransfer.setDragImage(row, 10, 10); } catch (x) {} });
      row.addEventListener("dragover", function (e) { if (DRAG == null) return; e.preventDefault(); row.classList.add("over"); });
      row.addEventListener("dragleave", function () { row.classList.remove("over"); });
      row.addEventListener("drop", function (e) { e.preventDefault(); row.classList.remove("over"); var to = +row.dataset.i; if (DRAG == null || DRAG === to) return; var m = ED.blocks.splice(DRAG, 1)[0]; ED.blocks.splice(to, 0, m); DRAG = null; mark(); drawBlocks(); });
      h.addEventListener("dragend", function () { DRAG = null; host.querySelectorAll(".over").forEach(function (x) { x.classList.remove("over"); }); });
    });
  }
  window.siteMove = function (i, d) { var j = i + d; if (j < 0 || j >= ED.blocks.length) return; var m = ED.blocks.splice(i, 1)[0]; ED.blocks.splice(j, 0, m); mark(); drawBlocks(); };
  window.siteToggle = function (i) { ED.blocks[i].enabled = !ED.blocks[i].enabled; mark(); drawBlocks(); };
  window.siteDel = function (i) { if (confirm("Xoá khối này khỏi bản nháp?")) { ED.blocks.splice(i, 1); mark(); drawBlocks(); } };
  window.siteSeed = function () { ED.blocks = seedHome(); mark(); drawBlocks(); };

  /* ---- block form ---- */
  window.siteBlock = function (bid) {
    var b = ED.blocks.find(function (x) { return x.id === bid; }); if (!b) return;
    FORM = { id: bid, props: clone(b.props) }; formDraw(b.type);
  };
  function formDraw(type) {
    var w = canW(), it = ITEMS[type], p = FORM.props, dis = w ? "" : " disabled";
    var h = '<h3>' + esc(TYPE_NAME[type]) + '</h3>';
    var sz = p.size || "m";
    h += '<label>Kích cỡ khối này</label><div class="seg">' + [["s", "Nhỏ"], ["m", "Vừa"], ["l", "Lớn"]].map(function (o) { return '<button type="button" class="' + (sz === o[0] ? "on" : "") + '" onclick="siteSeg(\'size\',\'' + o[0] + '\',\'' + type + '\')"' + dis + '>' + o[1] + '</button>'; }).join("") + '</div><p class="muted sm" style="margin:4px 0 0">Chọn Nhỏ / Vừa / Lớn: chữ, ảnh và các ô đổi theo. Xem ngay ở khung bên phải sau khi bấm Xong.</p>';
    if (["cards", "gallery", "links", "list"].indexOf(type) >= 0) {
      var cl = Number(p.cols) || 0;
      h += '<label>Số ô trên một hàng (máy tính)</label><div class="seg">' + [[0, "Tự động"], [2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]].map(function (o) { return '<button type="button" class="' + (cl === o[0] ? "on" : "") + '" onclick="siteSeg(\'cols\',' + o[0] + ',\'' + type + '\')"' + dis + '>' + o[1] + '</button>'; }).join("") + '</div><p class="muted sm" style="margin:4px 0 0">Trên điện thoại web tự xếp tối đa 2 ô một hàng.</p>';
    }
    (FIELDS[type] || []).forEach(function (f) {
      var k = f[0], v = p[k] == null ? "" : p[k]; h += '<label>' + esc(f[1]) + '</label>';
      if (f[2] === "area") h += '<textarea rows="4" data-k="' + k + '" oninput="siteSet(this)"' + dis + '>' + esc(v) + '</textarea>';
      else if (f[2] === "align") h += '<select data-k="' + k + '" onchange="siteSet(this)"' + dis + '><option value="left"' + (v === "left" ? " selected" : "") + '>Trái</option><option value="center"' + (v === "center" ? " selected" : "") + '>Giữa</option></select>';
      else h += '<input data-k="' + k + '" value="' + esc(v) + '" oninput="siteSet(this)"' + dis + '>';
      if (f[2] === "img" && w) h += '<input type="file" accept="image/jpeg,image/png,image/webp" onchange="siteUpload(this,\'' + k + '\')">';
    });
    if (it) {
      h += '<h4>' + esc(it.label) + ' (' + (p[it.key] || []).length + ')</h4>';
      (p[it.key] || []).forEach(function (row, i) {
        h += '<div class="sit">';
        if (it.fields) it.fields.forEach(function (f) {
          h += '<input placeholder="' + esc(f[1]) + '" data-k="' + it.key + '.' + i + '.' + f[0] + '" value="' + esc(row[f[0]] || "") + '" oninput="siteSet(this)"' + dis + '>';
          if (w && /^(image|url)$/.test(f[0]) && /^Ảnh|^Link ảnh/.test(f[1])) h += '<input type="file" accept="image/jpeg,image/png,image/webp" onchange="siteUpload(this,\'' + it.key + '.' + i + '.' + f[0] + '\')">';
        });
        else h += '<input placeholder="Nội dung" data-k="' + it.key + '.' + i + '" value="' + esc(row) + '" oninput="siteSet(this)"' + dis + '>';
        if (w) h += '<button onclick="siteItem(\'' + type + '\',' + i + ',-1)">↑</button> <button onclick="siteItem(\'' + type + '\',' + i + ',1)">↓</button> <button onclick="siteItem(\'' + type + '\',' + i + ',0)">Xoá</button>';
        h += '</div>';
      });
      if (w) h += '<button onclick="siteItem(\'' + type + '\',-1,2)">+ Thêm ' + esc(it.label.toLowerCase()) + '</button>';
    }
    h += '<div class="actions stick"><button onclick="closeBox()">Đóng</button>' + (w ? '<button class="primary" onclick="siteApply(\'' + type + '\')">Xong</button>' : "") + '</div>';
    openBox(h);
  }
  window.siteTab = function (t) { var g = document.getElementById("sgrid"); if (!g) return; g.setAttribute("data-p", t); document.getElementById("tabB").className = t === "blocks" ? "on" : ""; document.getElementById("tabP").className = t === "prev" ? "on" : ""; sizeDev(); };
  window.siteSeg = function (k, v, type) { FORM.props[k] = v; formDraw(type); };
  window.siteSet = function (el) {
    var path = el.dataset.k.split("."), o = FORM.props; for (var i = 0; i < path.length - 1; i++) o = o[path[i]]; o[path[path.length - 1]] = el.value;
  };
  window.siteItem = function (type, i, op) {
    var it = ITEMS[type], a = FORM.props[it.key] = FORM.props[it.key] || [];
    if (op === 2) { if (a.length >= 24) return alert("Tối đa 24 mục"); a.push(it.fields ? Object.fromEntries(it.fields.map(function (f) { return [f[0], ""]; })) : ""); }
    else if (op === 0) a.splice(i, 1); else { var j = i + op; if (j < 0 || j >= a.length) return; var m = a.splice(i, 1)[0]; a.splice(j, 0, m); }
    formDraw(type);
  };
  window.siteApply = function (type) {
    var b = ED.blocks.find(function (x) { return x.id === FORM.id; }); if (!b) return closeBox();
    b.props = clone(FORM.props); closeBox(); mark(); drawBlocks();
  };

  /* ---- server actions ---- */
  async function save() {
    var r = await api("/api/v1/site/pages/" + encodeURIComponent(ED.slug), { method: "POST", body: JSON.stringify({ title: ED.title, blocks: ED.blocks, base: ED.base }) });
    ED.blocks = r.blocks; ED.dirty = false; ED.base = r.updated_at || ED.base; return r;
  }
  window.siteSave = function () { act(async function () { await save(); siteDraw(); }); };
  function bsig(b) { return JSON.stringify([b.type, b.enabled, b.props]); }
  function diffTxt(live, cur) {
    if (!live) return "Trang này CHƯA có bản đăng trong hệ thống: đang chạy nội dung cũ của website. Đăng lúc này sẽ THAY THẾ toàn bộ trang bằng " + cur.length + " khối đang soạn.";
    var lm = {}, cm = {}, add = 0, del = 0, chg = 0;
    live.forEach(function (b) { lm[b.id] = b; }); cur.forEach(function (b) { cm[b.id] = b; });
    cur.forEach(function (b) { if (!lm[b.id]) add++; else if (bsig(b) !== bsig(lm[b.id])) chg++; });
    live.forEach(function (b) { if (!cm[b.id]) del++; });
    if (!add && !del && !chg) return "Không có thay đổi nào so với bản đang chạy.";
    return "So với bản đang chạy: thêm " + add + " khối, sửa " + chg + " khối, xóa " + del + " khối.";
  }
  window.sitePublish = function () {
    act(async function () {
      var f = await api("/api/v1/site/pages/" + encodeURIComponent(ED.slug) + "?t=" + Date.now());
      if (f.exists && ED.base && f.updated_at !== ED.base) { alert("Trang vừa được người khác sửa. Sẽ tải lại bản mới nhất, bạn xem lại rồi đăng."); return siteEdit(ED.slug); }
      if (!confirm(diffTxt(f.published, ED.blocks) + "\n\nĐăng lên web? Khách sẽ thấy ngay.")) return;
      await save(); var r = await api("/api/v1/site/pages/" + encodeURIComponent(ED.slug) + "/publish", { method: "POST" }); ED.published = true; ED.version = r.version; ED.live = ED.blocks; siteDraw(); alert("Đã đăng phiên bản " + r.version);
    });
  };
  window.siteUnpublish = function () {
    if (!confirm("Gỡ xuất bản? Website sẽ quay về nội dung mặc định cũ (bản nháp vẫn được giữ).")) return;
    act(async function () { await api("/api/v1/site/pages/" + encodeURIComponent(ED.slug) + "/unpublish", { method: "POST" }); ED.published = false; siteDraw(); });
  };
  window.siteVersions = function () {
    act(async function () {
      var d = await api("/api/v1/site/pages/" + encodeURIComponent(ED.slug) + "/versions");
      openBox('<h3>Lịch sử xuất bản</h3>' + ((d.items || []).length ? htable(d.items, [["Bản", function (r) { return "v" + r.version; }], ["Ghi chú", function (r) { return esc(r.note || ""); }], ["Người", function (r) { return esc(r.created_by || "—"); }], ["Lúc", function (r) { return esc((r.created_at || "").slice(0, 16)); }]],
        canMgr() ? function (r) { return '<button onclick="siteRollback(' + r.version + ')">Khôi phục</button>'; } : null) : '<p class="muted">Chưa có phiên bản nào.</p>') + '<div class="actions" style="margin-top:12px"><button onclick="closeBox()">Đóng</button></div>');
    });
  };
  window.siteRollback = function (v) {
    if (!confirm("Khôi phục phiên bản " + v + " và xuất bản ngay?")) return;
    act(async function () { var r = await api("/api/v1/site/pages/" + encodeURIComponent(ED.slug) + "/rollback", { method: "POST", body: JSON.stringify({ version: v }) }); closeBox(); siteEdit(ED.slug); alert("Đã khôi phục (phiên bản mới v" + r.version + ")"); });
  };
  window.addEventListener("beforeunload", function (e) { if (ED && ED.dirty) { e.preventDefault(); e.returnValue = ""; } });
})();
