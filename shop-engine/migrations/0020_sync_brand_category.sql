-- Đồng bộ danh mục thương hiệu và danh mục sản phẩm theo quyết định mới.
-- Thương hiệu: Gucci, LV, Salvatore Ferragamo, Bally, Dior, Khác (Khác = không gắn thương hiệu, brand_id NULL).
-- Danh mục: 7 danh mục hiển thị trên web và trong form admin.

INSERT OR IGNORE INTO brands(id,store_id,name,slug) VALUES
('brand_lv','store_amo','LV','lv'),
('brand_dior','store_amo','Dior','dior');

INSERT OR IGNORE INTO categories(id,store_id,name,slug) VALUES
('cat_sneaker','store_amo','Giày Sneaker','giay-sneaker'),
('cat_cong_so','store_amo','Giày công sở','giay-cong-so'),
('cat_dep','store_amo','Dép','dep'),
('cat_ao','store_amo','Áo + Áo khoác','ao-ao-khoac'),
('cat_tui_xach','store_amo','Túi xách','tui-xach'),
('cat_quan','store_amo','Quần','quan'),
('cat_that_lung','store_amo','Thắt lưng + Phụ kiện','that-lung-phu-kien');

-- Chuyển sản phẩm đang gắn danh mục cũ sang danh mục mới (ánh xạ đề xuất, chủ shop xác nhận trước khi merge).
UPDATE products SET category_id='cat_sneaker' WHERE category_id='cat_sneakers';
UPDATE products SET category_id='cat_cong_so' WHERE category_id IN ('cat_loafers','cat_oxford','cat_boots');
UPDATE product_drafts SET category_id='cat_sneaker' WHERE category_id='cat_sneakers';
UPDATE product_drafts SET category_id='cat_cong_so' WHERE category_id IN ('cat_loafers','cat_oxford','cat_boots');

-- Bỏ thương hiệu AMO NGUYEN: sản phẩm đang gắn sẽ thành "Khác".
UPDATE products SET brand_id=NULL WHERE brand_id='brand_amo';
UPDATE product_drafts SET brand_id=NULL WHERE brand_id='brand_amo';
DELETE FROM brands WHERE id='brand_amo';

-- Xóa 4 danh mục tiếng Anh cũ (đã không còn sản phẩm nào gắn vào).
DELETE FROM categories WHERE id IN ('cat_loafers','cat_sneakers','cat_oxford','cat_boots');
