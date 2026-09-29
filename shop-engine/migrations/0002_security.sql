CREATE TABLE IF NOT EXISTS store_members (
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, email TEXT, role TEXT NOT NULL DEFAULT 'owner',
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_members_store ON store_members(store_id,active);
