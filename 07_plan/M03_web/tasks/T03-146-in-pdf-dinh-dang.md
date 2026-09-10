# T03-146 — Trang in dựng HTML thật từ Markdown

> `WO-095`.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-146-in-pdf-dinh-dang.md
  - web/api/xuat-cua.mjs
  - web/test/in-pdf-dinh-dang.test.js
  - .factory/wo/WO-095-in-pdf-dung-dinh-dang.md

verifiability: hard
tiêu_chí:
  - AC1: `mdSangHtml` dựng đúng `h2` · bảng · danh sách · trích dẫn · khối mã ·
      đậm/nghiêng/mã · liên kết
    cmd: cd web && node test/in-pdf-dinh-dang.test.js
    đỏ_khi: còn `<pre>` ôm cả thân — vế 1…1g
  - AC2: ÂM · HTML trong thân bài KHÔNG thành thẻ thật
    cmd: cd web && node test/in-pdf-dinh-dang.test.js
    đỏ_khi: `<script>` do model sinh chạy được — vế 2/2a
  - AC3: CSS in có `@page`, `orphans/widows`, `break-after` cho tiêu đề,
      `break-inside: avoid` cho bảng
    cmd: cd web && node test/in-pdf-dinh-dang.test.js
    đỏ_khi: tiêu đề rơi một mình cuối trang, bảng bị cắt đôi — vế 3
  - AC4: trang in vẫn tự gọi `print()` và vẫn mang tiêu đề + nguồn + ngày
    cmd: cd web && node test/in-pdf-dinh-dang.test.js && node test/xuat-van-ban.test.js
