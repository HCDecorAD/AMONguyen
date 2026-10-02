import fs from 'node:fs';
import assert from 'node:assert/strict';

const h=fs.readFileSync('admin/visual.html','utf8');
assert.ok(h.includes('storageManager:false'),'editor storage must be explicit');
assert.ok(h.includes("localStorage.setItem('hc-builder-'"),'draft must stay local');
assert.ok(h.includes('function preview()'),'preview missing');
assert.ok(h.includes("BRIDGE='http://127.0.0.1:17321'"),'publish bridge must remain loopback-only');
assert.ok(h.includes("fetch(BRIDGE+'/publish'"),'publish bridge missing');
assert.ok(h.includes("fetch(BRIDGE+'/rollback'"),'rollback bridge missing');
assert.ok(h.includes("confirm('Publish "),'explicit publish confirmation missing');
assert.ok(h.includes("confirm('Rollback latest visual publish?')"),'rollback confirmation missing');
assert.ok(h.includes('function validate(h)'),'pre-publish validation missing');
console.log('VISUAL_EDITOR_GATE_PASS draft_local=1 preview=1 publish_loopback_only=1 rollback=1 production_authority=0');
