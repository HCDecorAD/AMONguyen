-- Per-store key/value settings (e.g. website visual effects on/off)
CREATE TABLE IF NOT EXISTS store_settings(
  store_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by TEXT,
  PRIMARY KEY(store_id,key));
