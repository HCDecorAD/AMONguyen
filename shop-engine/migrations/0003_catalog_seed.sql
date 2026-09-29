INSERT OR IGNORE INTO brands(id,store_id,name,slug) VALUES
('brand_amo','store_amo','AMO NGUYEN','amo-nguyen'),
('brand_gucci','store_amo','Gucci','gucci'),
('brand_ferragamo','store_amo','Salvatore Ferragamo','salvatore-ferragamo'),
('brand_bally','store_amo','Bally','bally');

INSERT OR IGNORE INTO categories(id,store_id,name,slug) VALUES
('cat_loafers','store_amo','Loafers','loafers'),
('cat_sneakers','store_amo','Sneakers','sneakers'),
('cat_oxford','store_amo','Oxford & Derby','oxford-derby'),
('cat_boots','store_amo','Boots','boots');

UPDATE products SET brand_id='brand_amo',category_id='cat_loafers' WHERE id='prd_985ca2265a33480a8cdc';

INSERT OR IGNORE INTO products(id,store_id,brand_id,category_id,name,slug,description,status,price,sale_price) VALUES
('prd_gucci_loafer05','store_amo','brand_gucci','cat_loafers','Gucci Men''s Loafers 05','gucci-mens-loafers-05','Mẫu tham khảo thị trường cho catalog AMO.','active',26000000,16000000),
('prd_gucci_horsebit','store_amo','brand_gucci','cat_loafers','Gucci Horsebit Loafer Black','gucci-horsebit-loafer-black','Mẫu tham khảo thị trường cho catalog AMO.','active',17000000,14500000),
('prd_gucci_geometric','store_amo','brand_gucci','cat_loafers','Gucci Geometric G Loafer','gucci-geometric-g-loafer','Mẫu tham khảo thị trường cho catalog AMO.','active',17500000,14500000),
('prd_gucci_ace','store_amo','brand_gucci','cat_sneakers','Gucci Ace Sneaker Interlocking G','gucci-ace-sneaker-interlocking-g','Mẫu tham khảo thị trường cho catalog AMO.','active',12670000,11000000),
('prd_amo_oxford','store_amo','brand_amo','cat_oxford','AMO Classic Oxford','amo-classic-oxford','Oxford nam phom cổ điển, phong cách Quiet Luxury.','active',2890000,2590000),
('prd_amo_derby','store_amo','brand_amo','cat_oxford','AMO Modern Derby','amo-modern-derby','Derby nam hiện đại cho business và smart casual.','active',2790000,NULL),
('prd_amo_boot','store_amo','brand_amo','cat_boots','AMO Chelsea Boot','amo-chelsea-boot','Chelsea boot tối giản, dễ phối trang phục.','active',3290000,2990000),
('prd_amo_sneaker','store_amo','brand_amo','cat_sneakers','AMO Minimal Sneaker','amo-minimal-sneaker','Sneaker tối giản cho phong cách contemporary.','active',2390000,2190000);

INSERT OR IGNORE INTO product_images(id,store_id,product_id,url,alt,sort_order) VALUES
('img_g1','store_amo','prd_gucci_loafer05','/assets/reference/gucci-loafer-05.jpg','Gucci Men''s Loafers 05',0),
('img_g2','store_amo','prd_gucci_horsebit','/assets/reference/gucci-horsebit.jpg','Gucci Horsebit Loafer',0),
('img_g3','store_amo','prd_gucci_geometric','/assets/reference/gucci-geometric.jpg','Gucci Geometric G Loafer',0),
('img_g4','store_amo','prd_gucci_ace','/assets/reference/gucci-ace.jpg','Gucci Ace Sneaker',0),
('img_a1','store_amo','prd_amo_oxford','/assets/images/demo/shoe-demo-2.jpg','AMO Classic Oxford',0),
('img_a2','store_amo','prd_amo_derby','/assets/images/demo/shoe-demo-3.jpg','AMO Modern Derby',0),
('img_a3','store_amo','prd_amo_boot','/assets/images/demo/shoe-demo-4.jpg','AMO Chelsea Boot',0),
('img_a4','store_amo','prd_amo_sneaker','/assets/images/demo/shoe-demo-5.jpg','AMO Minimal Sneaker',0);

INSERT OR IGNORE INTO variants(id,store_id,product_id,sku,size,color,status) VALUES
('var_g1_40','store_amo','prd_gucci_loafer05','GUC-L05-40','40','Black','active'),('var_g1_41','store_amo','prd_gucci_loafer05','GUC-L05-41','41','Black','active'),('var_g1_42','store_amo','prd_gucci_loafer05','GUC-L05-42','42','Black','active'),
('var_g2_40','store_amo','prd_gucci_horsebit','GUC-HB-40','40','Black','active'),('var_g2_41','store_amo','prd_gucci_horsebit','GUC-HB-41','41','Black','active'),('var_g2_42','store_amo','prd_gucci_horsebit','GUC-HB-42','42','Black','active'),
('var_g3_40','store_amo','prd_gucci_geometric','GUC-GEO-40','40','Black','active'),('var_g3_41','store_amo','prd_gucci_geometric','GUC-GEO-41','41','Black','active'),('var_g3_42','store_amo','prd_gucci_geometric','GUC-GEO-42','42','Black','active'),
('var_g4_40','store_amo','prd_gucci_ace','GUC-ACE-40','40','Black','active'),('var_g4_41','store_amo','prd_gucci_ace','GUC-ACE-41','41','Black','active'),('var_g4_42','store_amo','prd_gucci_ace','GUC-ACE-42','42','Black','active'),
('var_aox_40','store_amo','prd_amo_oxford','AMO-OXF-40','40','Black','active'),('var_aox_41','store_amo','prd_amo_oxford','AMO-OXF-41','41','Black','active'),('var_aox_42','store_amo','prd_amo_oxford','AMO-OXF-42','42','Black','active'),
('var_ade_40','store_amo','prd_amo_derby','AMO-DER-40','40','Brown','active'),('var_ade_41','store_amo','prd_amo_derby','AMO-DER-41','41','Brown','active'),('var_ade_42','store_amo','prd_amo_derby','AMO-DER-42','42','Brown','active'),
('var_abt_40','store_amo','prd_amo_boot','AMO-CHB-40','40','Black','active'),('var_abt_41','store_amo','prd_amo_boot','AMO-CHB-41','41','Black','active'),('var_abt_42','store_amo','prd_amo_boot','AMO-CHB-42','42','Black','active'),
('var_asn_40','store_amo','prd_amo_sneaker','AMO-SNK-40','40','White','active'),('var_asn_41','store_amo','prd_amo_sneaker','AMO-SNK-41','41','White','active'),('var_asn_42','store_amo','prd_amo_sneaker','AMO-SNK-42','42','White','active');

INSERT OR IGNORE INTO inventory_levels(store_id,location_id,variant_id,on_hand,reserved) SELECT 'store_amo','loc_amo_main',id,CASE WHEN size='40' THEN 4 WHEN size='41' THEN 5 ELSE 3 END,0 FROM variants WHERE store_id='store_amo' AND id LIKE 'var_%' AND NOT EXISTS(SELECT 1 FROM inventory_levels l WHERE l.variant_id=variants.id AND l.location_id='loc_amo_main');
