# T08-37 — `CONG.video` nới thành `anyOf [media, url]`

> `FR-075` (duyệt 2026-09-09) · `WO-058`. ID rule 9: max 36 ⇒ 37.

## Hình dạng

- `CONG.video` qua khi có **`media` trỏ hiện vật** HOẶC **`url`**. Thiếu CẢ HAI
  ⇒ 422, và câu lỗi nêu **cả hai** lối, không nêu một.
- `url` có ⇒ **kiểm host y như cũ**. `FR-075 §4` không nới whitelist một milimet.
- Dùng lại `hienVat(fm)` sẵn có (nhánh `tai-lieu` đang dùng) — không viết phép
  đọc `media` thứ hai.

phạm_vi_ghi:
  - web/api/cong-module.mjs
# cổng thuộc đơn vị test T03-110b (tai-file-video.test.js) — R1

verifiability: hard
tiêu_chí:
  - AC1: `media` có, `url` vắng ⇒ **201**
    cmd: node web/test/tai-file-video.test.js
    đỏ_khi: trả 422 "Bản video phải có url"
  - AC2: `url` có (host hợp lệ), `media` vắng ⇒ 201 (đường cũ nguyên vẹn)
    cmd: node web/test/tai-file-video.test.js
  - AC3: `url` host NGOÀI whitelist ⇒ vẫn 422 — không nới host
    cmd: node web/test/tai-file-video.test.js
  - AC4: thiếu CẢ HAI ⇒ 422, câu lỗi nhắc cả `media` lẫn `url`
    cmd: node web/test/tai-file-video.test.js
