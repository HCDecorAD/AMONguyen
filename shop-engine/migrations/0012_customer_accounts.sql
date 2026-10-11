-- Customer accounts, activity log, loyalty tiers and % promotions (per store)
ALTER TABLE customers ADD COLUMN password_hash TEXT;
ALTER TABLE customers ADD COLUMN password_salt TEXT;
ALTER TABLE customers ADD COLUMN google_sub TEXT;
ALTER TABLE customers ADD COLUMN tier_override TEXT;
ALTER TABLE customers ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE customers ADD COLUMN note TEXT;
ALTER TABLE customers ADD COLUMN consent_at TEXT;
ALTER TABLE customers ADD COLUMN last_login_at TEXT;
ALTER TABLE customers ADD COLUMN last_seen_at TEXT;
ALTER TABLE customers ADD COLUMN fail_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN locked_until TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_store_email ON customers(store_id,email);
CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON customers(store_id,phone);
CREATE INDEX IF NOT EXISTS idx_customers_google ON customers(store_id,google_sub);

CREATE TABLE IF NOT EXISTS customer_sessions(
  token_hash TEXT PRIMARY KEY, store_id TEXT NOT NULL, customer_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_csess_customer ON customer_sessions(customer_id);

CREATE TABLE IF NOT EXISTS customer_events(
  id TEXT PRIMARY KEY, store_id TEXT NOT NULL, customer_id TEXT, visitor_id TEXT,
  type TEXT NOT NULL, ref TEXT, meta TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_cevents_customer ON customer_events(store_id,customer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_cevents_visitor ON customer_events(store_id,visitor_id,created_at);

CREATE TABLE IF NOT EXISTS customer_tiers(
  id TEXT PRIMARY KEY, store_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
  min_spent INTEGER NOT NULL DEFAULT 0, percent INTEGER NOT NULL DEFAULT 0,
  UNIQUE(store_id,code));

ALTER TABLE promotions ADD COLUMN scope TEXT NOT NULL DEFAULT 'coupon';
ALTER TABLE promotions ADD COLUMN scope_ref TEXT;
ALTER TABLE promotions ADD COLUMN min_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE promotions ADD COLUMN max_discount INTEGER;
ALTER TABLE promotions ADD COLUMN max_uses INTEGER;
ALTER TABLE promotions ADD COLUMN used_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE promotions ADD COLUMN created_at TEXT;
CREATE INDEX IF NOT EXISTS idx_promotions_store_code ON promotions(store_id,code);

CREATE TABLE IF NOT EXISTS promo_redemptions(
  id TEXT PRIMARY KEY, store_id TEXT NOT NULL, promo_id TEXT, order_id TEXT NOT NULL,
  customer_id TEXT, source TEXT NOT NULL, label TEXT, amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_redeem_order ON promo_redemptions(store_id,order_id);

ALTER TABLE orders ADD COLUMN discount_label TEXT;
