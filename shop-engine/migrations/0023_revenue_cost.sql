-- Doanh thu & lợi nhuận: lưu giá vốn tại thời điểm bán cho từng dòng đơn.
ALTER TABLE order_items ADD COLUMN cost INTEGER;
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id,created_at);
