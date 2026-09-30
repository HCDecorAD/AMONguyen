PRAGMA foreign_keys=ON;

ALTER TABLE variants ADD COLUMN barcode TEXT;
ALTER TABLE variants ADD COLUMN cost INTEGER;
ALTER TABLE variants ADD COLUMN attributes_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE inventory_levels ADD COLUMN incoming INTEGER NOT NULL DEFAULT 0 CHECK(incoming>=0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_store_barcode
 ON variants(store_id,barcode) WHERE barcode IS NOT NULL AND barcode<>'';
CREATE INDEX IF NOT EXISTS idx_inventory_levels_store_location
 ON inventory_levels(store_id,location_id,variant_id);
