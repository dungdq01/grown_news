# T03-142 — Bìa dòng bài mang icon LOẠI NGUỒN

> `WO-089`. Chủ dự án 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-142-icon-nguon-dong-bai.md
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/test/chung-cat-nhom-theo-bai.test.js
  - .factory/wo/WO-089-icon-nguon-tren-dong-bai.md

verifiability: hard
tiêu_chí:
  - AC1: `nhanTuBan(ban, MEDIA)` THUẦN — video khớp host ⇒ trả `nhan` của host
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: youtube ra `video` ⇒ ô bìa trống như hôm nay — vế 19/19a
  - AC2: khớp HOST tách khỏi việc bóc id — url youtube mà `id_tu` không khớp
      VẪN ra icon youtube
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: cài bằng `idVideo` (trả `null` khi id không bóc được) — vế 19b
  - AC3: tài liệu ⇒ đuôi hiện vật đầu (`pdf`/`docx`/…)
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: mọi tài liệu cùng một icon — vế 19c
  - AC4: không khớp gì ⇒ lùi `source_type`, KHÔNG ném
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: ném trên `ban` thiếu trường — một dòng bài lạ làm chết cả màn — vế 19d
  - AC5: đi qua cầu `__GN_MW__`; chunk `chungcat` KHÔNG tự tải chỉ mục
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js && node test/chunk-tu-chua.test.js
  - AC6: không nới trần bundle
    cmd: cd web && node test/o-nhan-nap.test.js && node test/token-only.test.js
