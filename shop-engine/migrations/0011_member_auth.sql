-- Per-store member login (customer portal). Access key shown once; only its SHA-256 is stored.
ALTER TABLE store_members ADD COLUMN name TEXT;
ALTER TABLE store_members ADD COLUMN key_hash TEXT;
ALTER TABLE store_members ADD COLUMN key_hint TEXT;
ALTER TABLE store_members ADD COLUMN last_login_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_store_email ON store_members(store_id,email);
