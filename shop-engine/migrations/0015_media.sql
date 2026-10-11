-- Owner-uploaded images stored in D1 (no extra service needed, $0). Client compresses before upload.
CREATE TABLE IF NOT EXISTS media(
  id TEXT PRIMARY KEY, store_id TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL,
  name TEXT, data TEXT NOT NULL, created_by TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_media_store ON media(store_id,created_at);
