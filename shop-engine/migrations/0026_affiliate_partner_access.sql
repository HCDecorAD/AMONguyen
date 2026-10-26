-- Secure CTV portal access. Only hashes are stored; plaintext keys are shown once.
ALTER TABLE affiliate_partners ADD COLUMN key_hash TEXT;
ALTER TABLE affiliate_partners ADD COLUMN key_hint TEXT;
ALTER TABLE affiliate_partners ADD COLUMN last_login_at TEXT;
CREATE INDEX IF NOT EXISTS idx_aff_partners_store_status ON affiliate_partners(store_id,status);
