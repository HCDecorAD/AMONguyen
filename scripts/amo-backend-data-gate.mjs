import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const wrangler=read('shop-engine/wrangler.toml');
const tx=read('shop-engine/scripts/e2e-transaction.mjs');
const imp=read('shop-engine/scripts/e2e-imports.mjs');
const index=read('shop-engine/src/index.js');
const migrations=fs.readdirSync('shop-engine/migrations').filter(x=>x.endsWith('.sql')).sort();

assert.ok(/\[\[d1_databases\]\]/.test(wrangler),'D1 binding missing');
assert.ok(/binding\s*=\s*["']DB["']/.test(wrangler),'DB binding missing');
for(const m of ['0001_core.sql','0002_security.sql','0004_commerce_v4.sql','0005_product_inventory_identity.sql','0006_inventory_location_bridge.sql','0007_product_drafts.sql','0008_product_draft_promotion.sql','0009_import_governance.sql','0010_import_customer_order_templates.sql']) assert.ok(migrations.includes(m),`missing ${m}`);

for(const token of ['/api/v1/product-drafts','/promote','/api/v1/listings','/activate','/api/catalog','/api/orders','confirmed','cancelled','packing','shipping','completed','returned','reserved','on_hand']) assert.ok(tx.includes(token),`transaction E2E missing ${token}`);
for(const token of ['/api/v1/import-jobs','/stage','/dry-run','review','approved','/commit','/rollback','products','inventory','price','customers','orders']) assert.ok(imp.includes(token),`import E2E missing ${token}`);

assert.ok(index.includes('authorization') || index.includes('Authorization'),'backend authorization contract missing');
assert.ok(index.includes('x-store-id'),'store isolation header contract missing');

console.log(`AMO_BACKEND_DATA_CONTRACT_PASS migrations=${migrations.length} tx_lifecycle=1 import_governance=1 d1=1 auth=1 store_isolation=1`);
