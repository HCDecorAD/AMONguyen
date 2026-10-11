-- Owner-editable website pages made of content blocks (draft / published / versions)
CREATE TABLE IF NOT EXISTS site_pages(
  id TEXT PRIMARY KEY, store_id TEXT NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
  draft_json TEXT NOT NULL DEFAULT '[]', published_json TEXT, version INTEGER NOT NULL DEFAULT 0,
  published_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_by TEXT,
  UNIQUE(store_id,slug));
CREATE TABLE IF NOT EXISTS site_page_versions(
  id TEXT PRIMARY KEY, store_id TEXT NOT NULL, slug TEXT NOT NULL, version INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '', blocks_json TEXT NOT NULL, note TEXT, created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(store_id,slug,version));
