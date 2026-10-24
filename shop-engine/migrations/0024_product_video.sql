-- Video sản phẩm: một video mỗi sản phẩm, dựng tự động từ ảnh có sẵn (xem workflow product-video.yml).
ALTER TABLE products ADD COLUMN video_url TEXT;
