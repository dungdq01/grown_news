# T03-37 — WO-013/1: cổng cho "sửa về đúng màn" (đơn vị TEST)

> `web/test/sua-dung-man.test.js` (MỚI). ĐỎ trước (R5).
>
> Đo bằng cách gọi CHÍNH phép tra đó trên bundle với ba `source_type` khác nhau —
> không đo "có chuỗi `napvideo` trong file". Một chuỗi có mặt vì bất kỳ lý do gì;
> phép tra trả về đúng đích mới là thứ người dùng gặp.
>
> Cộng **răng ngân sách đo bằng BYTE**: `page-weight` so
> `Math.round(byte/1024) <= 100` nên nó cho vượt tới **511 byte** mà vẫn xanh —
> vừa lọt thật ở C6b (102666 byte báo "100 KB" và XANH). Ở đây so byte thẳng.

phạm_vi_ghi:
  - web/test/sua-dung-man.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (mọi loại đều về `napbaiviet`)
    cmd: cd web && node test/sua-dung-man.test.js; test $? -ne 0
  - AC2: sau T03-36 XANH, có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T03-35
