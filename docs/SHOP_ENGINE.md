# HC Shop Engine / AMO Commerce — Production v3

AMO Commerce is complete as a reusable multi-tenant commerce layer.

Flow: Catalog → Product detail → Variant/Size → Cart → Checkout → Customer → Order → Admin order workflow → Inventory ledger.

Storefront public API: store metadata, catalog, product detail and validated checkout. Admin API: stores, products, media, variants, inventory, orders, customers, promotions, dashboard and reports.

Each store owns its own products, media, variants, inventory, customers, orders and reports through store_id. HC Shop Manager includes a store switcher and Create Store flow; a new store automatically receives its own MAIN inventory location. This is the Store #002/#003 onboarding path without creating another backend.

Inventory lifecycle: checkout=new; confirmed reserves; cancelled releases; completed decrements on-hand and reserved; returned replenishes. Inventory movements retain the audit trail.

Media: product_images is now part of the storefront catalog/detail API. HC Shop Manager can attach ordered image URLs to products. Existing repository media can be used immediately; later media storage can be swapped without changing commerce entities.

Production services: Cloudflare Worker hc-shop-engine; D1 database hcs; GitHub Pages storefront/admin from AMONguyen main.
