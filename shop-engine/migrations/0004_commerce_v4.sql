PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS channels(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN('website','facebook','tiktok_shop','shopee','pos','b2b','other')),
 active INTEGER NOT NULL DEFAULT 1, config_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,code), FOREIGN KEY(store_id) REFERENCES stores(id)
);
CREATE TABLE IF NOT EXISTS listings(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, channel_id TEXT NOT NULL, product_id TEXT NOT NULL,
 external_id TEXT, title TEXT NOT NULL, description TEXT DEFAULT '', selling_price INTEGER,
 seo_json TEXT NOT NULL DEFAULT '{}', images_json TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','review','approved','published','paused','archived')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,channel_id,product_id), FOREIGN KEY(channel_id) REFERENCES channels(id), FOREIGN KEY(product_id) REFERENCES products(id)
);
CREATE TABLE IF NOT EXISTS warehouses(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(store_id,code), FOREIGN KEY(store_id) REFERENCES stores(id)
);
CREATE TABLE IF NOT EXISTS warehouse_locations(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, warehouse_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
 type TEXT NOT NULL DEFAULT 'location' CHECK(type IN('location','bin')), parent_id TEXT,
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,warehouse_id,code), FOREIGN KEY(warehouse_id) REFERENCES warehouses(id), FOREIGN KEY(parent_id) REFERENCES warehouse_locations(id)
);
CREATE TABLE IF NOT EXISTS reservations(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, variant_id TEXT NOT NULL, location_id TEXT,
 qty INTEGER NOT NULL CHECK(qty>0), status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','committed','released','expired')),
 reference_type TEXT, reference_id TEXT, expires_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(variant_id) REFERENCES variants(id)
);
CREATE TABLE IF NOT EXISTS import_jobs(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN('products','inventory','price','customers','orders')),
 source_type TEXT NOT NULL, filename TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','mapped','validated','dry_run','review','approved','committed','failed','rolled_back')),
 mapping_json TEXT NOT NULL DEFAULT '{}', summary_json TEXT NOT NULL DEFAULT '{}', error_json TEXT NOT NULL DEFAULT '[]',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS import_staging(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, job_id TEXT NOT NULL, row_no INTEGER NOT NULL,
 raw_json TEXT NOT NULL, canonical_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','valid','invalid','approved','committed','skipped')),
 errors_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(job_id,row_no), FOREIGN KEY(job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_channels_store ON channels(store_id,active);
CREATE INDEX IF NOT EXISTS idx_listings_store_channel_status ON listings(store_id,channel_id,status);
CREATE INDEX IF NOT EXISTS idx_warehouses_store ON warehouses(store_id,active);
CREATE INDEX IF NOT EXISTS idx_wh_locations_store_wh ON warehouse_locations(store_id,warehouse_id,active);
CREATE INDEX IF NOT EXISTS idx_reservations_store_variant_status ON reservations(store_id,variant_id,status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_store_status ON import_jobs(store_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_import_staging_job_status ON import_staging(job_id,status,row_no);

INSERT OR IGNORE INTO channels(id,store_id,code,name,type) VALUES('chn_amo_web','store_amo','website','AMO Website','website');
INSERT OR IGNORE INTO warehouses(id,store_id,code,name) VALUES('wh_amo_main','store_amo','MAIN','Kho chinh');
INSERT OR IGNORE INTO warehouse_locations(id,store_id,warehouse_id,code,name,type) VALUES('wloc_amo_main','store_amo','wh_amo_main','MAIN','Vi tri chinh','location');
