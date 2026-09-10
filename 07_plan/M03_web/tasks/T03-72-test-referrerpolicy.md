# T03-72 — WO-032: cổng cho `referrerpolicy` của khung nhúng (đơn vị TEST)

> Thêm §5 vào `web/test/media-cua-so.test.js`. ĐỎ trước (R5).

> **Đo được trên trình duyệt thật, hai khung cạnh nhau, khác đúng một thuộc**
> **tính**: `no-referrer` ⇒ *Error 153 · Video player configuration error*;
> `origin` ⇒ video nạp bình thường. Một biến, hai kết quả.

> Cổng đo giá trị thuộc tính vì phép đo hành vi cần **mạng ra ngoài** — một cổng
> gọi YouTube mỗi lần chạy là cổng đỏ theo đường truyền, không theo mã. Bằng
> chứng hành vi nằm ở WO-032; ở đây canh cho nó khỏi trôi ngược.

> Hai vế: KHÔNG được là `no-referrer`, VÀ phải là một giá trị còn gửi origin.
> Chỉ cấm `no-referrer` thì `same-origin` lọt qua và cũng hỏng y hệt.

phạm_vi_ghi:
  - web/test/media-cua-so.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên mã hiện tại, nêu rõ giá trị đang đặt
    cmd: cd web && node test/media-cua-so.test.js; test $? -ne 0
  - AC2: sau T03-73 XANH
    cmd: cd web && node test/media-cua-so.test.js