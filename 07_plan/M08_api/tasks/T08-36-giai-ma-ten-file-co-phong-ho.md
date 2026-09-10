# T08-36 — server: giải mã tên file CÓ PHÒNG HỘ

> `WO-057`. Đầu nhận của hợp đồng `T03-127` đổi. ID rule 9: max 35 ⇒ 36.

## Hình dạng

- `tenGocAnToan` (`web/api/articles.mjs`, đọc `x-ten-goc`) và `tenAnToan`
  (`web/server.mjs`, đọc `x-ten-file`) giải mã percent-encoding TRƯỚC khi lọc.
- **Phòng hộ bắt buộc**: `decodeURIComponent` NÉM `URIError` với `%` lẻ. Client
  thứ hai (curl, một script) gửi tên thô `100% xong.pdf` không được làm 500 —
  giải mã thất bại thì GIỮ NGUYÊN chuỗi thô rồi lọc như cũ.
- Thứ tự: giải mã **trước** phép lọc `..` và `/`. Lọc trước rồi giải mã sau là
  một lỗ thật: `%2e%2e%2f` đi qua phép lọc rồi mới thành `../`.

phạm_vi_ghi:
  - web/api/articles.mjs
  - web/server.mjs
# cổng thuộc đơn vị test T03-110b (ten-file-co-dau.test.js) — R1

verifiability: hard
tiêu_chí:
  - AC1: `x-ten-goc` mã hoá ⇒ `ten_goc` trả về ĐÚNG tên tiếng Việt gốc
    cmd: node web/test/ten-file-co-dau.test.js
  - AC2: `%` lẻ (`100%.pdf`) ⇒ KHÔNG 500, giữ chuỗi thô
    cmd: node web/test/ten-file-co-dau.test.js
    đỏ_khi: handler ném URIError ra ngoài
  - AC3: `%2e%2e%2f` KHÔNG thoát ra `../` — giải mã TRƯỚC lọc
    cmd: node web/test/ten-file-co-dau.test.js
    đỏ_khi: ten_goc trả về chứa `/` hoặc `..`
  - AC4: tên ASCII thô (client cũ) vẫn đúng — tương thích lùi
    cmd: node web/test/ten-file-co-dau.test.js
