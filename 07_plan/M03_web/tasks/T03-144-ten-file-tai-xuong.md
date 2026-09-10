# T03-144 — Tên file tải xuống thật, và `?dang=goc` luôn `attachment`

> `WO-091`.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-144-ten-file-tai-xuong.md
  - web/api/articles.mjs
  - web/test/ten-file-tai-xuong.test.js
  - .factory/wo/WO-091-ten-file-tai-xuong.md

verifiability: hard
tiêu_chí:
  - AC1: `?dang=goc` ⇒ `attachment` kể cả khi `xem_truoc` là `iframe`/`phat`/`anh`
    cmd: cd web && node test/ten-file-tai-xuong.test.js
    đỏ_khi: PDF vẫn `inline` ⇒ bấm "Bản gốc" mở tab thay vì tải — vế 1/1a
  - AC2: KHÔNG có `?dang=goc` ⇒ hành vi y như cũ
    cmd: cd web && node test/ten-file-tai-xuong.test.js && node test/media-cua-so.test.js
    đỏ_khi: ép `attachment` mọi lúc ⇒ thẻ 2 tầng câm, `<video>` không phát —
      đúng bug `WO-064` đã sửa một lần — vế 2
  - AC3: `filename*=UTF-8''…` mang tên thật, phần trăm-mã hoá
    cmd: cd web && node test/ten-file-tai-xuong.test.js
    đỏ_khi: dán `ten_goc` thô — vế 3/3a
  - AC4: `filename=` ASCII KHÔNG chứa `"` `\` CR LF, kể cả khi `ten_goc` cố ý
      mang chúng
    cmd: cd web && node test/ten-file-tai-xuong.test.js
    đỏ_khi: một `ten_goc` có `"` tách được đầu đề — vế 4/4a/4b
  - AC5: tên rỗng / toàn ký tự lạ ⇒ lùi `<sha12><duoi>`
    cmd: cd web && node test/ten-file-tai-xuong.test.js
    đỏ_khi: `filename=""` — vế 5
