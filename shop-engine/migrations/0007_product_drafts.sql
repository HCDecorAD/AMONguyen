PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS product_drafts(
 id TEXT PRIMARY KEY,store_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT,brand_id TEXT,category_id TEXT,
 description TEXT NOT NULL DEFAULT '',sku TEXT,barcode TEXT,cost INTEGER,selling_price INTEGER,
 warehouse_id TEXT,location_id TEXT,on_hand INTEGER NOT NULL DEFAULT 0,incoming INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','review','approved','published','rejected')),
 payload_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(store_id) REFERENCES stores(id));
CREATE INDEX IF NOT EXISTS idx_product_drafts_store_status ON product_drafts(store_id,status,updated_at);
