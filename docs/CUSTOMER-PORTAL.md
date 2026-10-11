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

## Tài khoản khách hàng, hạng và giảm giá % (migration 0012)

Mỗi website (store) có hệ thống khách riêng; dữ liệu tách theo `store_id`.

**Khách (công khai, `/api/c/*`)**: đăng ký / đăng nhập bằng email hoặc SĐT + mật khẩu (PBKDF2, khóa 15 phút sau 8 lần sai), đăng nhập Google (bật khi đặt biến `GOOGLE_CLIENT_ID` cho Worker), xem hồ sơ, đơn hàng, hạng; sửa thông tin; đổi mật khẩu; xóa tài khoản (ẩn danh hóa). Ghi nhận lượt xem chỉ khi khách đồng ý (banner) hoặc đã đăng ký. Token khách chỉ có hiệu lực trong store của họ.

**Nhúng vào website khác**: `<script src="https://amonguyen.hcdecorhub.com/js/hc-customer.js" data-store="<store_id>" defer></script>` rồi dùng `HCC.login/register/me/quote/track`. Trang mẫu: `account.html`.

**Quản trị (shop-admin)**: tab *Khách hàng* (tìm, xem chi tiết, lịch sử đơn + hoạt động, khóa/mở, gán hạng, xuất CSV; staff trở lên) và *Khuyến mãi* (manager trở lên tạo/tắt; chỉnh hạng).

**Giảm giá %**
- Theo sản phẩm / danh mục: tự áp trên từng dòng hàng.
- Cấp đơn: chọn **một** ưu đãi tốt nhất trong *mã giảm giá*, *chương trình cả đơn*, *hạng khách* (không cộng dồn). Có đơn tối thiểu, trần giảm, số lượt dùng, hạn dùng. Tối đa 90%.
- Hạng mặc định: Thành viên 0%, Bạc ≥5tr 3%, Vàng ≥15tr 5%, VIP ≥30tr 8% (chỉnh trong tab Khuyến mãi); tính theo tổng đơn **hoàn tất**.
- `POST /api/orders` nhận thêm `coupon`; gửi kèm `Authorization: Bearer cs_…` để áp hạng và gắn đơn vào tài khoản. Xem trước: `GET /api/c/coupon?code=&subtotal=`.

**Lưu ý**
- Checkout hiện tại của AMO còn chuyển sang WooCommerce nên mã/hạng chưa áp ở bước đó; cần nối checkout sang `POST /api/orders` khi catalog chuyển sang D1.
- Bật Google: tạo OAuth Client ID (Web) → `wrangler secret put GOOGLE_CLIENT_ID`; thêm domain site vào Authorized JavaScript origins.
- Dọn log: `customer_events` tăng theo lượt xem; nên xóa bản ghi > 180 ngày định kỳ.
- Test: `node scripts/e2e-customers.mjs` (cần `wrangler dev --local --port 8793 --var TEST_ADMIN_TOKEN:local-e2e`).

### Thu thập khách tham quan (migration 0013)
- Widget `hc-customer.js` đã nhúng vào các trang AMO (`data-popup="on"`, `data-cart-key="AMO_CART"`): ghi lượt xem trang kèm nguồn (utm_source / referrer), xem sản phẩm, thêm giỏ — chỉ sau khi khách bấm Đồng ý ở banner.
- Popup nhận email/SĐT (có ô đồng ý riêng, hiện sau 15 giây hoặc khi rê chuột ra khỏi trang, 1 lần/thiết bị). Lưu vào `customers` với `source`; lịch sử ẩn danh của thiết bị đó được gắn vào hồ sơ.
- Mã quà tặng: tạo coupon có mã đúng `WELCOME` ở tab Khuyến mãi — popup sẽ hiện mã này cho khách vừa để lại liên hệ.
- Giới hạn 3 lượt/giờ/thiết bị; email đã có tài khoản vẫn trả phản hồi giống hệt (không lộ tài khoản tồn tại).
