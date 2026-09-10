# T03-130 — Năm điều khiển toàn app: đáy rail → header trang `.ph`

> `WO-073` · `FR-076` (đảo `FR-027f`). Chủ dự án 2026-09-09.

## Bước

1. Cổng ĐỎ trước — `rail-trai.test.js` đổi CHỖ ĐO (kẹp hai phía: `.ph-d` có,
   `.rail-d` không còn) → verify: chạy, phải đỏ khi mã chưa đổi
2. `shell.html` ×2 — chuyển khối, đổi tên nhóm `rail-d` → `ph-d` → verify: cổng xanh
3. `prototype.css` — thay khối cột bằng khối hàng; XOÁ khối đè `.dmode` dọc;
   XOÁ `.top .rail-d` khỏi media query mobile → verify: page-weight không tăng
4. Build + đo trên trang thật → verify: 5 nút hiện ở mọi màn, mọi bề rộng

phạm_vi_ghi:
  - .factory/fr/FR-076-dieu-khien-toan-app-len-header.md
  - .factory/wo/WO-073-dieu-khien-len-header.md
  - 07_plan/M03_web/tasks/T03-130-dieu-khien-len-header.md
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/styles/prototype.css
  - web/test/rail-trai.test.js   # R1: vế cổng LÀ hiện thân của quyết định bị đảo,
                                 # FR-076 §5 cho phép đổi CHỖ ĐO — không nới răng
  - 06_modules/M03_web/backlog.md

verifiability: hard
tiêu_chí:
  - AC1: mọi màn đã build có `.ph-d` TRONG `.ph`, và KHÔNG còn `.rail-d`
    cmd: node web/test/rail-trai.test.js
    đỏ_khi: một shell còn `.rail-d`, hoặc `.ph-d` nằm ngoài `.ph`
    xanh_khi: cả hai phía đúng trên mọi màn
  - AC2: đủ NĂM id (`dmode` `lang` `tb` `bgb` `bgp`) trong `.ph-d`
    cmd: node web/test/rail-trai.test.js
    đỏ_khi: rơi mất một nút lúc chuyển
  - AC3: HAI shell nguồn khớp nhau — không bản nào giữ markup cũ
    cmd: node web/test/rail-trai.test.js
    đỏ_khi: sửa `render/shell.html` mà quên `plugins/home-pages/shell.html`
  - AC4: mobile ≤720px KHÔNG ẩn năm nút (bug FR-076 §3.1)
    cmd: node web/test/rail-trai.test.js
    đỏ_khi: media query còn ẩn nhóm điều khiển
  - AC5: suite web không tệ hơn — page-weight không tăng byte
    cmd: cd web && npm test
