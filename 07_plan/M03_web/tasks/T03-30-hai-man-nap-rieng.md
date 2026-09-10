# T03-30 — FR-038/C6a: dời hai lối nạp sang màn riêng, bỏ `/nap/` chung (đơn vị CODE)

> **DỜI, không chép.** `v-nap` hiện 16819 ký tự: khung+tabs 3732 · `link` 891 ·
> `file` 1052 · `viet` 9267 · `thu-vien` 1877. Chép sang hai màn là +16 KB HTML
> trên một trang đang 57/74. Dời thì tổng không đổi, và `cat_khi_khac` giữ mỗi
> màn chỉ nằm trên trang của nó.
>
> `catNap()` (`trang.mjs:247`) cắt ĐÚNG MỘT view `v-nap` bằng cách đếm sâu thẻ
> `<div>`. Phải tổng quát thành *"cắt mọi màn có `cat_khi_khac`, TRỪ màn đang
> render"* — không thì `/bai-viet/nap/` mang cả màn nạp tài liệu, và
> `/tai-lieu/nap/` mang cả form viết bài 9 KB.
>
> Nút `+ nạp nguồn` (`shell.html:68`, `data-nav="nap"`) phải trỏ chỗ khác — bỏ
> màn mà để nút trỏ vào nó là một nút chết, và `nut-song.test.js` canh đúng lớp
> đó.
>
> **Ngân sách**: trang lớn nhất 57/74 · `gn.css` 92/100. Dời không được làm trang
> nào vượt.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: `/bai-viet/nap/` có ba lối (link · file · viet) và KHÔNG có lối tài liệu;
      `/tai-lieu/nap/` có lối tài liệu và KHÔNG có form viết bài
    cmd: cd web && node test/man-nap-rieng.test.js
  - AC2: `/nap/` không còn; không nút nào trỏ vào một màn không tồn tại
    cmd: cd web && node test/man-nap-rieng.test.js && node test/nut-song.test.js
  - AC3: hai `shell.html` byte-identical
    cmd: cd web && node test/four-screens.test.js
  - AC4: ngân sách — trang lớn nhất ≤ 74 KB, gn.css/gn.js ≤ 100 KB
    cmd: cd web && node build-fe.mjs && node test/page-weight.test.js
  - AC5: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T01-28
