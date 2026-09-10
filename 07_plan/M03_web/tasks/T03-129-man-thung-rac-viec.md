# T03-129 — màn THÙNG RÁC VIỆC (tab thứ ba của `/chung-cat/`)

> `WO-070` · task A của `PLAN-2026-09-09`. ID rule 9: max 128 ⇒ 129.

## Hình dạng

- tab thứ ba `rac` dùng CƠ CHẾ SẴN CÓ (`data-cctab` + `ccDoiTab`), không dựng
  màn mới — shell đi theo mọi trang, trần HTML trang chủ đang âm.
- `GET /api/job?rac=1&n=200`; mỗi dòng: chặng hỏng · lý do · `lan_gui`.
- **↻ Chạy lại** → `POST /api/viec/<u>/lai`; hết 2 lần gửi ⇒ nút tắt, nói
  "tạo việc mới".
- **🗑 Xoá hẳn** → `DELETE /api/viec/<u>`; hỏi xác nhận, và câu hỏi phải nói
  rõ *"vết chi phí vẫn giữ"* — không thì người tưởng xoá luôn sổ tiền.
- `nhomLoc()` thêm nhánh `hong` tường minh.

phạm_vi_ghi:
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/api/tho-cua.mjs
  - web/api/router.mjs
  - chungcat/src/api.py
  - web/test/no-write-path.test.js     # khai `DELETE viec` như một quyết định
# cổng thuộc T03-110b (thung-rac-viec.test.js) — R1

verifiability: hard
tiêu_chí:
  - AC1: `GET /api/job?rac=1` trả đúng việc trong rác; danh sách chính KHÔNG kể
    cmd: node web/test/thung-rac-viec.test.js
  - AC2: `POST /api/viec/<u>/lai` đưa việc RA khỏi rác, giữ file tiến độ
    cmd: node web/test/thung-rac-viec.test.js
  - AC3: `DELETE /api/viec/<u>` xoá việc trong rác; sổ egress KHÔNG đổi
    cmd: node web/test/thung-rac-viec.test.js
    đỏ_khi: xoá được việc đang chạy, hoặc số dòng egress giảm
  - AC4: FE có tab `rac`, hai nút, và câu xác nhận nói "vết chi phí vẫn giữ"
    cmd: node web/test/thung-rac-viec.test.js
  - AC5: suite web xanh (trừ page-weight — WO-055 đã có chủ)
    cmd: cd web && npm test
