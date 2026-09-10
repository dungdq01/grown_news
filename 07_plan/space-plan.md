# Space — kế hoạch tổng (CON TRỎ, không chép nội dung task)

- **chủ trì**: PM-Space · **nhánh**: `space` (worktree `../gn-space`)
- **nền**: `02_proposal/proposal-4-space-da-vu-tru.md` (ĐÃ DUYỆT) ·
  `04_system/adr.md#ADR-09` (**ĐÃ DUYỆT** 2026-09-09) ·
  `.factory/fr/FR-080` (**ĐÃ DUYỆT**) ·
  `01_research/space-spike-r1-r6-ket-qua.md` (spike, số đo thật) ·
  `07_plan/song-song-m13-space-checklist.md` (kỷ luật hai nhánh)
- **luật ID**: Space không có thư mục module (không đánh số) ⇒ task Space nằm
  TRONG module sở hữu file, tiêu đề mang tiền tố `[Space]`, số theo dải
  **T##-90+** (rule.md mục 13) — RIÊNG **M03 đã dùng tới T03-137** nên dải Space
ở M03 là **190+**. FR: **FR-081+** (FR-081 đã mở: bot = nút cây).

## Đơn vị Space — thứ tự và cạnh chờ

| Task | Ở module | Việc | Chờ |
|---|---|---|---|
| T04-90 | M04_ci | `check_scope` — cổng hai-task-tranh-một-file | — (làm ĐẦU, cả hai nhánh cần) |
| T01-90 | M01_core | DDL `space` 3 bảng + index + **view `ban_ghi`** (FR-080) + script migration + rollback | FR-080 ✅ |
| T04-91 | M04_ci | **R4** `core/tests/check_khong_ro_cheo_space.py` — hộp đen, đỏ được trên fixture bỏ-lọc | T01-90 · T04-90 |
| T03-193 | M03_web | đơn vị TEST — `web/test/space-cua.test.js` (cổng của T08-90; `web/test` là đất M03 — tiền lệ T03-91) | T01-90 |
| T03-192 | M03_web | đơn vị TEST — `web/test/tab-space.test.js` (cổng của T03-190/191) | T08-90 |
| T08-90 | M08_api | `WHERE space` mọi query · `?space=` · CRUD space (chỉ `chu`) | T01-90 · **T08-35 merge** · T03-193 (cổng đỏ trước) |
| T01-91 | M01_core | ontology per-space (cột `space` 3 bảng nhỏ) + `validate.py` kiểm theo space | T01-90 · **T01-51 merge** |
| T01-92 | M01_core | `xuat_kho`/`dung_lai_db`: yaml export theo space; cây `kb/<loai>/` GIỮ (đất M01, không phải M02) | T01-91 |
| T03-190 | M03_web | tab bar · URL hậu tố · sidebar theo space (**wireframe SCR-24 trước**) | T08-90 · T04-91 xanh |
| T03-191 | M03_web | hiệu ứng chuyển tab + prefetch + cache + skeleton | T03-190 |
| FR-081 | — | "bot = NÚT trên cây" cho M14 (spec FROZEN) — PM-Space mở, PM M13 review | sau ADR-09 ✅ |

## Ba cạnh xuyên nhánh (ghi vào `phụ_thuộc:` của task để check_scope/g6b thấy)

1. `T13-5` (M13) ← FR-080 **đã áp** (cột `space` có thật trong `ban_ghi`)
2. `T08-90` (Space) ← `T08-35` (M13) merge
3. `T01-91` (Space) ← `T01-51` (M13/M01) merge

## Tranh phạm vi XUYÊN NHÁNH — đo 2026-09-09 (kiểm định plan, bản tạm thay `check_scope`)

Bốn file mà task Space và task nhánh M13 **cùng khai**; `check_scope` (T04-90)
phải bắt đúng bốn cặp này, và cách gỡ là **tuần tự**, không rebase chồng:

| File | Space | Nhánh kia | Gỡ |
|---|---|---|---|
| `core/tests/test_gates.py` | T04-90 · T04-91 | T01-54 (g6b thiếu-verifiability) | ai merge trước, bên sau rebase; ba dòng đăng ký độc lập nhau |
| `web/render/assets.mjs` | T03-190 (chunk `gn-space`) | T03-125 (chunk `gn-tim`) | cùng khuôn khai chunk — merge trước/sau đều được, chỉ cần rebase |
| `web/render/trang.mjs` | T03-190 | T03-114 · T03-119 · T03-126 | Space làm SAU (T03-190 đã chặn cứng sau T04-91 xanh) |
| `web/api/articles.mjs` | T08-90 | T08-31 (media mảng) | T08-90 đã khai `phụ_thuộc: T08-35`; thêm điều kiện thực dụng: chờ T08-31 merge nếu nó còn mở |

Ba cặp còn lại **trong nội bộ Space** đã gỡ bằng `phụ_thuộc:` tường minh
(`ci.yml`/`Makefile`/`test_gates` ← T04-91 sau T04-90; `di_tru_space.py` ←
T01-91 sau T01-90; `dung_lai_db.py` ← T02-90 sau chuỗi T01-90→T01-91).

## Bút chung — PM-Space giữ

`project_map.yaml` (tới khi ADR-09 áp xong) · `FROZEN.lock` **chỉ chủ dự án ký**,
mỗi đợt một commit riêng.

## KHÔNG làm đợt này

`space_member` (spike R5 — đợt 2) · cross-post · persona per-space · tìm xuyên
vũ trụ · đổi cây file `kb/` (spike R2).
