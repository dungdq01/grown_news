# T08-35 — cửa kho-delta cho indexer + proxy /api/tim (web = wrapper) + gocTho(ten)

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT, mất không mất gì.
> Hai cửa M08 phục vụ M13: (1) GET /api/kho-delta — trang slug + loai +
> updated_at + sha_than (+ `space`, quyết Space 2026-09-09: cột dành sẵn, giá
> trị = space mặc định cho tới khi ADR-09 áp — M13 lọc theo nó từ ngày đầu,
> không phải sửa hợp đồng sau) cho re-index incremental (đọc DB CHÂN LÝ, không đọc
> kb/ export — FR-034); (2) GET /api/tim — proxy tới `POST :8791/truy-hoi`
> (hình dạng FR-072 §1.1) khuôn tho-cua, mang khoá chiều `web→truyhoi` +
> `x-aud: truyhoi`; khoá ở lại server. Cộng POKE fire-and-forget: ghiSauValidate
> xong gọi POST :8791/reindex-poke, không chờ, M13 chết cũng không chặn ghi.
> Thêm 2026-09-09 (FR-072 §1.4): tổng quát `gocTho(ten)` — hôm nay cả 5 cửa
> gõ cứng `thu_muc === "chungcat"` (tho-cua.mjs:47); thêm `truyhoi` là lần thứ
> hai cùng một hằng, đúng thứ Z6 cấm. Đọc cổng theo tên dịch vụ từ dich-vu.json.
> ID rule 9: max 34 ⇒ 35.

phạm_vi_ghi:
  - web/api/tho-cua.mjs
  - web/api/dungchung.mjs
  - web/api/router.mjs

phụ_thuộc: T01-51 (goi_duoc trong dich-vu.json)

verifiability: hard
tiêu_chí:
  - AC1: kho-delta trả đúng NĂM trường (slug · loai · updated_at · sha_than ·
      space — điểm nối khoá rule.md mục 13, giá trị = space mặc định cho tới
      ADR-09), trang được; sửa bài thì sha_than đổi
    cmd: node web/test/kho-delta.test.js
  - AC2: /api/tim proxy nguyên kết quả :8791 (mock); request đi ra mang x-aud +
      khoá chiều web→truyhoi; khoá không lộ về client
    cmd: node web/test/kho-delta.test.js
  - AC3: HOÃN (PM M13 quyết 2026-09-10) — `POST :8791/reindex-poke` KHÔNG có trong spec/
      model_flow M13 đã ký; thêm endpoint là FR. M13 đã re-index TĂNG DẦN theo
      kho-delta khi được gọi (T13-2 AC5), đủ cho đợt này. Cổng in SKIP kèm lý do,
      không xanh rỗng. Ô backlog M13 mở; lật lại khi có FR.
    cmd: node web/test/kho-delta.test.js
  - AC4: gocTho("chungcat") và gocTho("truyhoi") đọc đúng cổng từ dich-vu.json;
      grep `=== "chungcat"` trong tho-cua.mjs ⇒ 0; 5 cửa M12 cũ vẫn xanh
    cmd: node web/test/kho-delta.test.js
  - AC5: suite web xanh
    cmd: cd web && npm test
# cổng kho-delta.test.js thuộc đơn vị test đi kèm T03-150 (M03 — web/test/** là đất M03,
# tiền lệ T08-27/29/30) — R1.
# 2026-09-10: cổng viết-trước đang ở 07_plan/M08_api/tasks/T08-35-kho-delta.test.js
# (rule 8) — T03-150 git mv vào web/test/ + đăng ký npm test.
