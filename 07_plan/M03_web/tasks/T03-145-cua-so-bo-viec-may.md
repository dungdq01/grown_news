# T03-145 — Cửa sổ dùng CÙNG phép lọc việc với màn /chung-cat/

> `WO-092`.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-145-cua-so-bo-viec-may.md
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/plugins/cctab/src/cctab.inline.ts
  - web/test/chung-cat-nhom-theo-bai.test.js
  - .factory/wo/WO-092-cua-so-cung-bo-viec-may.md

verifiability: hard
tiêu_chí:
  - AC1: phép lọc khai MỘT chỗ (cầu `__GN_MW__`), hai chunk cùng đọc
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js && node test/chunk-tu-chua.test.js
    đỏ_khi: chép bản thứ hai sang `cctab` — vế 20/20a
  - AC2: `veViecCuaBan` lọc bằng phép ấy, không chỉ theo `slug`
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: `sinh-thumbnail` còn hiện trong cửa sổ — vế 20b
  - AC3: việc của máy HỎNG vẫn nổi trong cửa sổ
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: lọc trơn ⇒ giấu một lỗi thật — vế 20c
