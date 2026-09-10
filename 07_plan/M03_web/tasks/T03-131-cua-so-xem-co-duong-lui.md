# T03-131 — Cửa sổ xem: nhận URL douyin thật, và LUÔN có đường lùi

> `WO-074` §3 §4. Hôm nay một bản ghi không nhúng được hiện **trắng trơn**.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-131-cua-so-xem-co-duong-lui.md
  - core/assets/media-mime.json
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/test/xem-tiktok-douyin.test.js
  - 06_modules/M03_web/backlog.md

verifiability: hard
tiêu_chí:
  - AC1: `idVideo` bóc được id từ CẢ BA dạng URL douyin thật
      (`/video/<id>` · `?modal_id=<id>` · `/share/video/<id>`)
    cmd: node web/test/xem-tiktok-douyin.test.js
    đỏ_khi: dạng `modal_id` của chủ dự án trả null
  - AC2: host khai `nhung: null` ⇒ cửa sổ hiện LINK mở ở nguồn, KHÔNG hiện nút
      nhúng — nút nhúng cho một khung 403 tệ hơn không có nút
    cmd: node web/test/xem-tiktok-douyin.test.js
  - AC3: `idVideo` trả null ⇒ VẪN có link, không `return ""`
    cmd: node web/test/xem-tiktok-douyin.test.js
    đỏ_khi: còn `return ""` trần trong nhánh cuối
  - AC4: tiktok/youtube/fb KHÔNG đổi hành vi — vẫn nút "▶ Xem video"
    cmd: node web/test/xem-tiktok-douyin.test.js
  - AC5: `gn.js` còn dưới trần (103 243 / 104 448 trước khi sửa)
    cmd: node web/test/page-weight.test.js
