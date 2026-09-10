# T03-54 — WO-022: bóc id video từ chuỗi GỐC (đơn vị CODE)

> ⛔ T03-53 phải ĐỎ trước.
>
> `idVideo()` giữ `.toLowerCase()` cho **phép so host** và bóc id từ chuỗi **gốc**.
> Cùng hình dạng `normalize_url()` phía Python đã dùng: hạ riêng phần host
> (`chu = duong.lower().split("/", 1)[0]`), giữ nguyên phần còn lại.
>
> Regex `id_tu` chạy với cờ `i` để khoá `v=` / `/video/` vẫn khớp khi người dùng
> gõ hoa — cờ đó KHÔNG nới nhóm bắt (`[A-Za-z0-9_-]` đã gồm cả hai kiểu chữ).
>
> Build lại `gn.js` và đo lại trần: đang 101010/102400.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js
  - web/static/gn.js

verifiability: hard
tiêu_chí:
  - AC1: cổng của T03-53 XANH
    cmd: cd web && node test/id-video-hoa-thuong.test.js
  - AC2: không cổng nào khác đỏ thêm, trần chưa vượt
    cmd: cd web && node build-fe.mjs && npm test
