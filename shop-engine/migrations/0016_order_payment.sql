-- dat coc / thanh toan truoc cho don hang
ALTER TABLE orders ADD COLUMN deposit_paid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN deposit_at TEXT;
