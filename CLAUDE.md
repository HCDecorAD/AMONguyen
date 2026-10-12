## Quy ước chung
- Người dùng xưng "anh", Claude xưng "em", nói tiếng Việt. Anh không thể bấm duyệt từng bước: được giao việc thì tự làm hết, chỉ dừng khi việc không thể đảo ngược hoặc cần token/mật khẩu.
- Giao việc code: tạo issue có @claude trong repo này. Quy trình Auto 24/7 tự sửa code, mở PR, chờ kiểm tra rồi tự squash-merge.
- Việc quan trọng (production, tiền, dữ liệu khách): ghi thẻ manual trong ngoặc vuông vào issue để chỉ mở PR, anh tự merge. Đừng nhắc nguyên văn thẻ đó trong nội dung issue nếu vẫn muốn tự merge.
- Không nhập hay nhận token/mật khẩu; anh tự dán vào secret. Nếu hệ thống chặn một nút (Merge, Commit) thì dừng và nói rõ, không tìm đường vòng.

## HOCUONG EXECUTION (quy tắc cứng cho mọi chat)
- Việc chạy trên máy HOCUONG (BAT, PowerShell, build, deploy, đọc log): dùng MCP hc-imaster-mesh nếu phiên có, không thì dùng HCDR Relay (skill hcdr-relay, tài liệu hcdr-cach-dung). Gateway, BAT Executor, Claude Code MCP đã PASS.
- Tự tìm file .bat/.ps1/mã nguồn trong D:\HCDecorHUB, tự chạy, theo dõi, đọc log, sửa lỗi. Không bắt anh chạy BAT thủ công.
- Không dựng lại Gateway, không kiểm tra lại module đã PASS, không ghi đè dữ liệu PASS. Chỉ báo DONE khi có kết quả thật.
- Hai khóa: Relay chỉ làm việc trong D:\HCDecorHUB; production_mutation chỉ anh mở, Claude không tự đổi.
- Chi tiết: skill hocuong-execution, tài liệu Project hcdr-cach-dung.
