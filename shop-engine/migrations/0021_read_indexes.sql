-- Giảm số dòng D1 đọc: chỉ mục cho truy vấn danh mục, tồn kho và ảnh sản phẩm.
CREATE INDEX IF NOT EXISTS idx_variants_store_product_status ON variants(store_id,product_id,status);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_variant ON inventory_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_store_status_created ON products(store_id,status,created_at);
