# T03-41 — WO-013/2: cổng cho ô hiện vật trong form sửa (đơn vị TEST)

> `web/test/o-media-sua.test.js` (MỚI). ĐỎ trước (R5).
>
> Vế nặng là **AC2 — lưu mà KHÔNG đổi file**. "Thay được file" là chiều dương và
> nó xanh cả với một cài đặt ghi đè `media` mỗi lần lưu; chỉ *"không đụng vào thì
> `sha256` không đổi"* mới bắt được cài đặt đó.
>
> Đo qua HTTP thật trên KHO TẠM (`dungKho`) — không đụng `kb/`. Bài học C6b: một
> bản ghi thử đã đi vào kho thật vì tôi trỏ server vào `kb/`.

phạm_vi_ghi:
  - web/test/o-media-sua.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (màn nạp tài liệu không có ô hiện vật đang gắn)
    cmd: cd web && node test/o-media-sua.test.js; test $? -ne 0
  - AC2: sau T03-40 XANH, có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T03-39
