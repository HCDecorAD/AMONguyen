-- Media trang web: ảnh, video, trình chiếu do shop quản lý trong Shop Manager.
CREATE TABLE IF NOT EXISTS media_items(id TEXT PRIMARY KEY,store_id TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('image','video','slide')),title TEXT NOT NULL DEFAULT '',url TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_media_items_store_kind ON media_items(store_id,kind,sort_order);
