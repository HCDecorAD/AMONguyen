PRAGMA foreign_keys=ON;
ALTER TABLE warehouse_locations ADD COLUMN inventory_location_id TEXT;
UPDATE warehouse_locations SET inventory_location_id='loc_amo_main' WHERE id='wloc_amo_main' AND store_id='store_amo';
CREATE INDEX IF NOT EXISTS idx_wh_locations_inventory_location ON warehouse_locations(store_id,inventory_location_id);
