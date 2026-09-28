[Reading 6 lines from start (total: 6 lines, 0 remaining)]

# FINAL INTEGRATION GUIDE (MASTER)

## Yêu Cầu Cho Master Agent:
1. **Dữ liệu Shop:** Cấu trúc `<article class="amo-product-card">` đã tích hợp aria-labels. Khi fill dữ liệu Backend, KHÔNG thay đổi các class lõi.
2. **Shop Controls Hook:** Tính năng "Sắp xếp" (Sort) hiện tại đang console.info thay đổi. Backend engineer cần bắt sự kiện `change` của `#amoSort` để query Database. Tính năng Filter và Search DOM đã hoạt động hoàn thiện ở Frontend.
3. **Thư mục:** Đặt các file .html ở thư mục root, CSS ở `/css`, JS ở `/js`. Tất cả đường dẫn tĩnh đã được thiết lập theo dạng tương đối.

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]