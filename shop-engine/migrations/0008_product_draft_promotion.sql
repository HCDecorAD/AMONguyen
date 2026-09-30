ALTER TABLE product_drafts ADD COLUMN promoted_product_id TEXT;
ALTER TABLE product_drafts ADD COLUMN promoted_variant_id TEXT;
CREATE INDEX IF NOT EXISTS idx_product_drafts_promoted ON product_drafts(store_id,promoted_product_id);
