# T03-31 — FR-038/C6a: cổng cho hai màn nạp riêng (đơn vị TEST)

> `web/test/man-nap-rieng.test.js` (MỚI). ĐỎ trước (R5).
>
> Vế nặng là **chiều âm**: màn nạp Tài liệu KHÔNG được chứa form viết bài, và màn
> nạp Bài viết KHÔNG được chứa ô chọn file hiện vật. "Màn nạp tài liệu có ô chọn
> file" xanh ngay cả khi nó mang nguyên cả bốn lối như `/nap/` cũ — tức đúng thứ
> người dùng vừa cấm.
>
> Cộng: mỗi màn nạp chỉ nằm trên TRANG CỦA NÓ (`cat_khi_khac`), đo bằng cách quét
> mọi trang · không nút `data-nav` nào trỏ vào một màn không có trong bảng khai.
>
> Năm file test ghim `v-nap`/`naptab`/`napview` sẽ đỏ và phải sửa ở đây:
> `cac-man-con-lai` (7) · `four-screens` (4) · `page-weight` (1) ·
> `thu-vien-nap` (6) · `khung-8-o`.

phạm_vi_ghi:
  - web/test/man-nap-rieng.test.js
  - web/test/cac-man-con-lai.test.js
  - web/test/four-screens.test.js
  - web/test/page-weight.test.js
  - web/test/thu-vien-nap.test.js
  - web/test/khung-8-o.test.js
  - web/test/ssr-routes.test.js
  - web/test/chu-giao-dien.test.js
  - web/test/_render.mjs
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng mới ĐỎ trên code hiện tại (hai màn chưa tồn tại)
    cmd: cd web && node test/man-nap-rieng.test.js; test $? -ne 0
  - AC2: sau T03-30 cả bộ XANH, cổng mới có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T01-28
