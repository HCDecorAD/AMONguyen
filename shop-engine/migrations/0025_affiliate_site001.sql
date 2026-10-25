-- HC Affiliate Hub: SITE-001 / AMO Nguyen attribution, conversion and commission ledger.
CREATE TABLE IF NOT EXISTS affiliate_programs(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, site_id TEXT NOT NULL,
 name TEXT NOT NULL, commission_bps INTEGER NOT NULL DEFAULT 1000,
 cookie_days INTEGER NOT NULL DEFAULT 30, active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,site_id)
);
CREATE TABLE IF NOT EXISTS affiliate_partners(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, program_id TEXT NOT NULL,
 referral_code TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active'
 CHECK(status IN('active','paused','disabled')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,referral_code)
);
CREATE TABLE IF NOT EXISTS affiliate_clicks(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, program_id TEXT NOT NULL, partner_id TEXT NOT NULL,
 referral_code TEXT NOT NULL, landing_url TEXT, referrer_url TEXT, user_agent TEXT,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS affiliate_attributions(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, program_id TEXT NOT NULL, partner_id TEXT NOT NULL,
 referral_code TEXT NOT NULL, click_id TEXT, order_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','converted','cancelled','reversed')),
 attributed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, converted_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,order_id)
);
CREATE TABLE IF NOT EXISTS affiliate_conversions(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, attribution_id TEXT NOT NULL, order_id TEXT NOT NULL,
 order_total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'approved'
 CHECK(status IN('approved','reversed')),
 converted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reversed_at TEXT,
 UNIQUE(store_id,order_id)
);
CREATE TABLE IF NOT EXISTS affiliate_commissions(
 id TEXT PRIMARY KEY, store_id TEXT NOT NULL, conversion_id TEXT NOT NULL, partner_id TEXT NOT NULL,
 basis_amount INTEGER NOT NULL, rate_bps INTEGER NOT NULL, amount INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','payable','paid','reversed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(store_id,conversion_id)
);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_store_partner_time ON affiliate_clicks(store_id,partner_id,occurred_at);
CREATE INDEX IF NOT EXISTS idx_aff_attr_store_status ON affiliate_attributions(store_id,status,attributed_at);
CREATE INDEX IF NOT EXISTS idx_aff_conv_store_status ON affiliate_conversions(store_id,status,converted_at);
CREATE INDEX IF NOT EXISTS idx_aff_comm_store_status ON affiliate_commissions(store_id,status,created_at);
INSERT OR IGNORE INTO affiliate_programs(id,store_id,site_id,name,commission_bps,cookie_days)
VALUES('affprog_amo_site001','store_amo','SITE-001','AMO Nguyen Affiliate',1000,30);
