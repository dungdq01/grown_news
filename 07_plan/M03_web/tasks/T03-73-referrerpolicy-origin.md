# T03-73 — WO-032: khung nhúng gửi origin (đơn vị CODE)

> ⛔ T03-72 phải ĐỎ trước.

> `nhungVideo()` đổi `referrerpolicy` từ `no-referrer` sang `origin` — chặt nhất
> trong những giá trị còn chạy được: gửi `http://localhost:8787`, KHÔNG gửi
> đường dẫn trang đang đọc.

> `youtube-nocookie.com` giữ nguyên (nó chặn cookie theo dõi, không liên quan
> lỗi 153). M09-R3 giữ nguyên: `src` vẫn chỉ dựng từ whitelist + regex id.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-72 XANH
    cmd: cd web && node test/media-cua-so.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test