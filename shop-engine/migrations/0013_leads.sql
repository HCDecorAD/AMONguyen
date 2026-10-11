-- Lead capture: contact left by visitors (popup / forms) without an account
ALTER TABLE customers ADD COLUMN source TEXT;
ALTER TABLE customers ADD COLUMN lead_at TEXT;
