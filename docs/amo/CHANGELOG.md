[Reading 9 lines from start (total: 9 lines, 0 remaining)]

# CHANGELOG

## [V2.0 Master - Autonomous Polish]
- **SEO & Identity:** Áp dụng đồng bộ tagline "GIÀY SI HIỆU NAM • CHÍNH HÃNG" cho toàn bộ thẻ `<title>`, `og:title` và meta description.
- **Story Rewriting:** Viết lại nội dung `story.html`. Hủy bỏ các cụm từ gây hiểu lầm về "sản xuất" hay "chế tác", tập trung hoàn toàn vào yếu tố "Tinh tuyển khắt khe" (Curation) và "Giày Si Hiệu" nhằm đảm bảo tính xác thực.
- **Shop Upgrade:** Cập nhật UI `shop.html` với cụm Controls hợp nhất, thêm Search (tìm kiếm DOM) và Sort (Select box chờ API). Xử lý triệt để trạng thái Empty State thông minh khi lọc/tìm kiếm.
- **Accessibility (a11y):** Bổ sung thuộc tính `aria-label`, `aria-controls`, `aria-hidden`, `role="tab"` cho các filter, và tối ưu viền báo nét focus (focus-visible).
- **JS Idempotency:** Bảo vệ cấu trúc `window.AMO.Shop` bằng cờ `isShopBooted`, chống lặp event listener khi chuyển trang hoặc re-render.
- **QA Pass:** Đã kiểm tra không tràn lề (overflow-x hidden), cấu trúc Heading hợp lý, và Mobile Filter Drawer vuốt ngang êm ái trên viewport 390px.

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]