ALTER TABLE customers ADD COLUMN reset_requested_at TEXT;
CREATE TABLE IF NOT EXISTS customer_resets(token_hash TEXT PRIMARY KEY,store_id TEXT NOT NULL,customer_id TEXT NOT NULL,expires_at TEXT NOT NULL,used_at TEXT);
CREATE INDEX IF NOT EXISTS idx_cresets_customer ON customer_resets(customer_id);
