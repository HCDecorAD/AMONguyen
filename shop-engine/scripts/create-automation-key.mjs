// Tao 1 "ma truy cap" (API key) rieng cho GitHub Actions dung, de goi API tao video san pham.
// Khong dung mat khau hay ma truy cap ca nhan cua ai ca - day la 1 tai khoan "member" rieng,
// quyen "staff" (du de goi /api/v1/product-video), tao 1 lan qua workflow nay.
//
// Dung boi .github/workflows/create-automation-key.yml (chay tay, can secret CLOUDFLARE_API_TOKEN/ACCOUNT_ID).
// Sau khi chay xong, ma key duoc IN RA LOG cua workflow run - anh tu mo log, copy, dan vao
// repo secret SHOP_ADMIN_TOKEN. Script nay khong gui key di dau ca, chi in ra stdout.

import { execSync } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";

const STORE_KEY = process.env.STORE || "store_amo";
const DB_NAME = "hcs";
const EMAIL = "automation+shopvideo@amo.local";
const NAME = "GitHub Actions - Tao video san pham";

function d1(sqlCommand) {
  const out = execSync(
    `npx wrangler@4 d1 execute ${DB_NAME} --remote --json --command "${sqlCommand.replace(/"/g, '\\"')}"`,
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  const parsed = JSON.parse(out);
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return first?.results || [];
}

function sha256Hex(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function main() {
  console.log("== Tim store '" + STORE_KEY + "' ==");
  const stores = d1(
    `SELECT id FROM stores WHERE code='${STORE_KEY}' OR slug='${STORE_KEY}' OR id='${STORE_KEY}' LIMIT 1`
  );
  const storeId = stores[0]?.id;
  if (!storeId) {
    throw new Error("Khong tim thay store '" + STORE_KEY + "'");
  }
  console.log("Store id: " + storeId);

  const existing = d1(
    `SELECT id FROM store_members WHERE store_id='${storeId}' AND email='${EMAIL}' AND active=1 LIMIT 1`
  );
  if (existing.length) {
    throw new Error(
      "Da co key automation cho store nay roi (member id " +
        existing[0].id +
        "). Neu muon tao key moi, vo hieu hoa key cu truoc (UPDATE store_members SET active=0 WHERE id='" +
        existing[0].id +
        "')."
    );
  }

  const mid = "mem_" + randomBytes(6).toString("hex");
  const secret = randomBytes(24).toString("base64url");
  const hash = sha256Hex(secret);
  const key = mid + "." + secret;

  console.log("== Tao member automation (role: staff) ==");
  d1(
    `INSERT INTO store_members(id,store_id,email,role,active,name,key_hash) VALUES('${mid}','${storeId}','${EMAIL}','staff',1,'${NAME}','${hash}')`
  );

  console.log("");
  console.log("=== XONG. Day la key - CHI HIEN 1 LAN ===");
  console.log("Copy dong duoi day, dan vao repo secret SHOP_ADMIN_TOKEN:");
  console.log("");
  console.log(key);
  console.log("");
  console.log("(Settings -> Secrets and variables -> Actions -> New repository secret -> Name: SHOP_ADMIN_TOKEN)");
}

main();
