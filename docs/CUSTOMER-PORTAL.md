# Cổng khách hàng (shop-admin.html)

Mỗi khách có **mã truy cập riêng** gắn với đúng 1 shop (bảng `store_members`). Mã chỉ hiện một lần khi tạo.

## Vai trò
- viewer: chỉ xem · staff: sửa sản phẩm/kho/đơn, tải CSV lên kiểm tra · manager: duyệt & nhập CSV, hoàn tác · owner: quản lý thành viên.
- Mã quản trị tổng (super) vẫn thấy mọi shop; thành viên không thấy shop khác, không tạo shop.

## Cấp mã cho khách (super admin)
`POST /api/v1/members` header `x-store-id: <store>` + `Authorization: Bearer <admin>`, body `{"email":"khach@...","role":"owner"}` → trả `key`. Gửi riêng cho khách. Sau đó chủ shop tự mời nhân viên trong tab "Thành viên".

## Deploy
Chạy `shop-engine\deploy.bat` (sao lưu D1 → migration 0011 → deploy → health check). Sau đó merge nhánh để GitHub Pages cập nhật giao diện.

## Sau deploy – kiểm tra
1. /api/health trả ok. 2. Đăng nhập bằng mã admin cũ vẫn được. 3. Tạo mã owner thử, đăng nhập, thấy 1 shop. 4. Nhập CSV mẫu 2 dòng rồi Hoàn tác. 5. Đặt secret `ADMIN_TOKEN` dài ngẫu nhiên (wrangler secret put ADMIN_TOKEN) vì hash admin hiện nằm trong mã công khai.
