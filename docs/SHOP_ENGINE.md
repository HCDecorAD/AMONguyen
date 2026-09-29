# HC Shop Manager — Production Workflow

## Architecture
AMO storefront (GitHub Pages) reads public catalog data from HC Shop Engine on Cloudflare Workers. Transactional data lives in Cloudflare D1 database `hcs`. GitHub remains the storefront source and is not used as an inventory/order database.

## Admin
Open `/shop-admin.html`. Admin actions require the HC Shop Manager access code and are not available anonymously. The code is kept only in the browser session; the repository stores only its SHA-256 verifier.

Available modules: Dashboard, Products, Variant/SKU, Inventory, Orders, Customers, Promotions and Reports.

## Inventory lifecycle
New order does not reserve stock. Confirm reserves quantity. Cancel releases reserved quantity. Complete reduces on-hand and releases reserved quantity. Return replenishes on-hand. Every inventory action is recorded in `inventory_movements`.

## Deployment
Worker: `hc-shop-engine`; D1 binding: `DB`; database: `hcs`. Storefront and admin deploy from AMONguyen `main` through the existing GitHub Pages workflow.

## Security
Admin write/read-management endpoints require Bearer authentication. Public catalog GET and validated order creation remain public storefront endpoints. CORS is restricted to AMO production and local development origins. No plaintext admin credential is committed to Git.
