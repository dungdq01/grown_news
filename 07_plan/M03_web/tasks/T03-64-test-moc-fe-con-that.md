# T03-64 — WO-028: cổng cho mốc FE còn thật (đơn vị TEST)

> `web/test/moc-fe-con-that.test.js` (MỚI). ĐỎ trước (R5) — đo được 5 mốc treo,
> trong đó `vd-slug` và `tv-slug` **chặn cứng** hai đường nạp.
>
> **§1 đo theo hướng CẤU TRÚC, bắt cả lớp:** mọi `G("id")` phải trỏ tới một mốc có
> trong `shell.html` hoặc do chính FE dựng. Một mốc treo là một nhánh code chết —
> hoặc im lặng, hoặc chặn cứng như ca này.
>
> Bỏ bình luận **trước** khi quét: lượt đầu tôi đếm cả một `G("x")` nằm trong khối
> `/* … */`.
>
> Ngoại lệ `kp-rac` ghi thành **bảng có tên + lý do**, và cổng đòi ngoại lệ đó
> **vẫn đúng thực tế** — một danh sách bỏ qua không ai kiểm sẽ che mất mốc khác.
>
> **§2 đo hành vi:** hai hàm gửi không được đọc ô đã gỡ, VÀ phải tự suy. Giữ luôn
> phép đo cho bài viết — bản đúng có sẵn, phép sửa không được làm hỏng nó.
>
> **§3:** `slugGoiY` phải sinh slug hợp lệ. Đo trên byte đã build với chính hai
> chuỗi người dùng gõ ⇒ `thien-duong-chuot-…` và `du-bao-tuong-lai-cua-elon`, cả
> hai khớp `^[a-z0-9]+(-[a-z0-9]+)*$`.

phạm_vi_ghi:
  - web/test/moc-fe-con-that.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên mã hiện tại, nêu tên từng mốc treo
    cmd: cd web && node test/moc-fe-con-that.test.js; test $? -ne 0
  - AC2: sau T03-65 XANH
    cmd: cd web && node test/moc-fe-con-that.test.js
