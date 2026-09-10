# Proposal 4 · Space — đa vũ trụ tri thức (đổi tiền đề "một vũ trụ")

- **mở**: 2026-09-09 · **s2** · **nguồn**: `01_research/space-model-da-vu-tru-tri-thuc.md`
  (ý tưởng, bản 2) · `01_research/space-model-danh-gia-va-de-bai.md` (đánh giá
  trên hệ + §8 đính chính)
- **trạng thái**: **ĐÃ DUYỆT** 2026-09-09 — chủ dự án (*"duyệt proposal 4"*).
  **Chủ trì**: PM-Space (phiên này). **M13 giao PM khác, chạy SONG SONG.**
- **tầng bị chạm**: s3 (BRD/PRD tiền đề "một vũ trụ" · mục lớp học) · s4
  (**ADR-09** · `project_map` entity mới `Space`/`SpaceMember`, `BaiHoc`
  thêm `space_id`) · s6 M02 · M01 · M08 · M09-11 · M03 · M13 · M14 · M18

---

## 0 · Vì sao mở proposal riêng, không bổ vào proposal-3

Proposal-3 là "quản lý và cài đặt". Space đổi **tiền đề G3**: kho từ một vũ
trụ thành N vũ trụ song song — mọi query, chỉ mục, quyền mang một trục mới.
Luật nhà "mặc định không mở proposal-4" đúng cho module; sai cho đổi tiền đề.

## 1 · Bốn quyết nền — ĐÃ CHỐT (chủ dự án, 2026-09-09)

| # | Quyết | Hệ quả thiết kế |
|---|---|---|
| 1 | Space ⊃ M19 (hai tầng lồng nhau, KHÔNG thay) | `BaiHoc.space_id`; lớp học chọn nguồn trong space; vẫn 2 trục khoanh phạm vi |
| 2 | Bot = một nút cây (gốc / space / lớp) ± rule riêng | M14: thay "bot → tập doc_id" bằng "bot → nút + nguon[] hẹp hơn" (FR khi s6) |
| 3 | R1 lối A: slug toàn hệ, `space` là cột lọc | 0 đổi địa chỉ/doc_id; validator chặn trùng slug xuyên space; migration = gán space mặc định |
| 4 | Nhà: proposal-4 + ADR-09 | file này + ADR-09 sau spike |

## 2 · Phạm vi thô

- **Data**: entity `Space` (slug · tên · loại domain/class/tenant · visibility ·
  theme · tab_order · owner) + `SpaceMember`; mọi bản ghi `space` NOT NULL
  (mặc định = space mặc định); ontology (chủ đề · khái niệm · loại nguồn)
  **per-space** — hình lưu (file/bảng) là câu R3 của spike.
- **Web (wrapper)**: tab bar trong khối nội dung; URL module-first hậu tố
  space (`/video/sport/`); sidebar đổi số liệu theo space; hiệu ứng chuyển
  tab (View Transitions, prefetch, cache) — **sau** tầng dữ liệu.
- **Tạo space từ UI, không deploy** (yêu cầu bắt buộc của ý tưởng gốc).
- **M13**: `pham_vi.space` đã dành sẵn (T13-0) · `kho-delta` có cột space
  (T08-35) ⇒ M13 không dừng.
- **Không làm đợt này**: cross-post · persona per-space · tìm xuyên vũ trụ
  (mặc định KHÔNG).

## 3 · Tiêu chí thành công (đo được)

- S1: admin tạo space "Finance" từ UI ⇒ tab xuất hiện, `/video/finance/` 200,
  **0 restart** (đo bằng pid service không đổi).
- S2: cổng chống rò: hỏi M13 trong space A ⇒ **0** hàng space B; `GET
  /api/index?space=A` ⇒ 0 bản ghi B (lệnh + đỏ_khi + xanh_khi — R4 spike).
- S3: mở lớp học 12 người trong một space **không sửa schema** (phép thử ADR).
- S4: migration 14 bản ghi → space mặc định, `bam_cay` trước/sau khớp,
  rollback bằng export cũ trong git.

## 4 · Spike trước ADR-09 — time-box 3-5 ngày, 2 nhánh

Đề bài 6 câu R1–R6 ở bản đánh giá §4 (R1 đã có đáp án ⇒ đo hệ quả lối A).
Deliverable = **ADR-09 + cổng R4 chạy được**, không slide, không prototype
hiệu ứng. Checklist review ADR: bản ý tưởng §11 + hai vế của hệ này (§5 bản
đánh giá).

## 5 · Vai và ranh giới (chốt 2026-09-09)

- **PM-Space (phiên này)**: proposal-4 · spike R1-R6 · ADR-09 · FR cho artifact
  frozen bị Space chạm · plan các đơn vị Space sau ADR.
- **PM-M13 (mới)**: plan + giám sát M13 (T13-*, T08-35, T03-125) — KHÔNG chạm
  hình dạng `space`.
- **HAI ĐIỂM NỐI đã khoá, không bên nào tự đổi** (đổi ⇒ FR + báo bên kia):
  `pham_vi.space` trong FR-072/T13-0 · cột `space` của `kho-delta` (T08-35).
- **Chia dải ID chống va** (rule.md mục 9, đã va 3 lần tuần này):
  PM-Space dùng **T##-90+** ở mọi module; PM-M13 dùng dải hiện hành (<90).
  FR: PM-Space từ **FR-080+**; ai lấy số nào ghi worklog NGAY lúc tạo file.
- Còn chờ chủ dự án: **ai cầm spike** (PM-Space tự chạy hay giao dev?) và
  **time-box** (đề nghị 3-5 ngày, song song M13).
