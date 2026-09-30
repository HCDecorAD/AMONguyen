CREATE TABLE IF NOT EXISTS import_templates(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, kind TEXT NOT NULL,
 name TEXT NOT NULL, mapping_json TEXT NOT NULL DEFAULT '{}',
 required_json TEXT NOT NULL DEFAULT '[]', active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,kind,name)
);
CREATE TABLE IF NOT EXISTS import_commits(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, job_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'committed', snapshot_json TEXT NOT NULL DEFAULT '{}',
 summary_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 rolled_back_at TEXT, FOREIGN KEY(job_id) REFERENCES import_jobs(id)
);
CREATE INDEX IF NOT EXISTS idx_import_templates_store_kind ON import_templates(store_id,kind,active);
CREATE INDEX IF NOT EXISTS idx_import_commits_job ON import_commits(job_id,created_at);
INSERT OR IGNORE INTO import_templates(id,store_id,kind,name,mapping_json,required_json)
VALUES('itpl_amo_products','store_amo','products','AMO Products','{"Product Name":"name","SKU":"sku","Price":"selling_price","Cost":"cost","Barcode":"barcode","On Hand":"on_hand"}','["name","sku"]');
INSERT OR IGNORE INTO import_templates(id,store_id,kind,name,mapping_json,required_json)
VALUES('itpl_amo_inventory','store_amo','inventory','AMO Inventory','{"SKU":"sku","Quantity":"qty"}','["sku","qty"]');
INSERT OR IGNORE INTO import_templates(id,store_id,kind,name,mapping_json,required_json)
VALUES('itpl_amo_price','store_amo','price','AMO Price','{"SKU":"sku","Price":"price"}','["sku","price"]');