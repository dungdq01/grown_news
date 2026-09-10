# Spike Space R1–R6 — kết quả ĐO (PM-Space tự chạy, 2026-09-09)

> Time-box 3 ngày, phương án 1 (PM đo, dev chỉ nhận R4). Mọi số dưới đây đo
> trên hệ thật hoặc trên BẢN SAO kho ở thư mục tạm — kho thật không bị chạm.
> Nhãn: **fact** = lệnh chạy ra số · **suy luận** = từ fact · **giả định** = chưa đo.

## R1 · Slug — lối A xác nhận, và nó RẺ HƠN dự kiến

**fact.** `kho.schema.sql` khai `PRIMARY KEY (source_type, slug)` ở cả ba bảng
(`:59` `:84` `:108`) và `article_versions` `(source_type, slug, ban)` `:222`.
Không bảng nào có cột space ⇒ **tính duy nhất của slug đang là TOÀN HỆ theo
cấu trúc**, không phải theo quy ước.

**fact.** `dia-chi.json` 5 dạng địa chỉ đều bắt đầu bằng `slug` trần
(`^([a-z0-9][a-z0-9-]{1,79})...`) — `slug` · `slug-trang` · `slug-moc` ·
`file-dong` · `muc`. `doc_id` của M13 = slug (chốt `decisions.md` 2026-09-09).

**fact.** Đường ghi ĐÃ chặn trùng: `web/api/articles.mjs:542,545` trả **409**
*"kho đã có `type/slug`"*.

**⇒ Lối A (slug toàn hệ, `space` là cột lọc) tốn:**
| Việc | Số |
|---|---|
| DDL đổi cho vế PK | **0 dòng** |
| Địa chỉ trích dẫn đổi hình dạng | **0 dạng** (5/5 giữ) |
| `doc_id` M13/M14 đổi | **0** |
| Chặn trùng slug xuyên space | **đã có sẵn** (PK + 409), chỉ cần thông điệp gợi slug khác |

**Lối B (PK ba cột)** — không chọn, ghi để truy: đổi PK 4 bảng + 5 dạng địa chỉ
mang tiền tố + di trú mọi trích dẫn trong 13 bản ghi + đổi `doc_id` (FR-072).

## R2 · Space nằm ở đâu trong cây `kb/`

**fact.** `xuat_kho.py` là đường DB→file DUY NHẤT (`:2`), ghi `kb/<loai>/`
(`:155 d = kb / loai`), và `bam_cay()` (`:280`) là điểm bất động của round-trip.
**fact.** `kb/` hiện có `article/` `tai-lieu/` `video/` + 3 file ontology yaml.

**⇒ Đề nghị: space là CỘT trong frontmatter, cây file GIỮ `kb/<loai>/`.**
Lý do (suy luận từ fact): đổi sang `kb/<space>/<loai>/` làm `bam_cay` đổi hình
⇒ mọi cổng round-trip (`check_export_dan_xuat`, B-C1) phải sửa cùng lúc, đổi
lấy một tiện lợi duyệt-thư-mục mà không ai cần — kho đọc qua API, không qua ls.
**Rủi ro giữ nguyên**: hai space nhiều bài thì một thư mục to; chấp nhận được
tới ~10³ bản ghi (giả định — chưa đo).

## R3 · Ontology per-space

**fact.** Ba file yaml là **DẪN XUẤT của DB**: `xuat_kho.py:216-218` SELECT từ
bảng `concepts`/`categories` rồi ghi ra `kb/*.yaml`. Chân lý ở DB (đúng FR-034).
**fact.** Consumer đọc chúng: `categories.yaml` **27** chỗ · `concepts.yaml`
**37** · `loai-nguon.yaml` **20** (grep trên core/web/intake).
**fact.** Bảng thật: `concepts` 5 hàng · `categories` 11 · `loai_nguon` 14.

**⇒ Đề nghị: per-space làm ở BẢNG (thêm cột `space`), file yaml vẫn là export
theo space.** Ba bảng nhỏ (30 hàng tổng) ⇒ ALTER rẻ; consumer đọc yaml không
đổi hình dạng file, chỉ đổi NỘI DUNG theo space đang mở. **Câu chưa trả lời
(giả định)**: có ontology DÙNG CHUNG giữa space không (ví dụ "Tin tức")? Đề
nghị: **không** ở đợt 1 — mỗi space tự khai, gộp là bài toán sau.

## R4 · Cổng chống rò chéo space — GIAO DEV (đề bài ở §cuối)

Không tự viết: cổng phải là mã thật, và người viết cổng không nên là người
quyết kiến trúc (luật gốc). Đề bài + `cmd`/`đỏ_khi`/`xanh_khi` ở dưới.

## R5 · Quyền theo space vs FR-045

**fact.** FR-045 (đã duyệt): **một `chu` + ≤5 tài khoản đọc**, 4 bảng M18.
**suy luận.** `space_member(owner|editor|viewer)` là mô hình mới: (a) nhiều
owner theo từng space, (b) vai `editor` chưa tồn tại, (c) quyền theo NGỮ CẢNH
(space) chứ không theo tài khoản toàn hệ.
**⇒ Đề nghị đợt 1: KHÔNG mở `space_member`.** Giữ FR-045 nguyên: `chu` thấy
mọi space; 5 tài khoản đọc thấy space `visibility != private`. Lớp học (nhiều
người góp bài) là **đợt 2** — lúc đó mở FR sửa FR-045 với dữ liệu thật.
Lý do: mở mô hình quyền mới lúc chưa có người dùng thứ hai là xây phép đo
không có gì để đo (cùng lập luận đã dùng để hoãn vector M13).

## R6 · Migration + rollback — ĐÃ CHẠY THẬT trên bản sao

**fact.** Bản sao `kb/_kho.sqlite` (276 MB) → `ALTER TABLE ×3 + CREATE INDEX ×3`
= **8 ms**, 13 bản ghi nhận `space='mac-dinh'`.
**fact.** `view tham_chieu_media` (17 hàng) và `view nhan` (31 hàng) **không gãy**.
**fact.** `view ban_ghi` **THIẾU cột space** sau ALTER — view liệt cột tường
minh ⇒ **phải sửa DDL của view** (FR, vì `kho.schema.sql` frozen).
**fact.** Rollback = bỏ bản sao; kho thật nguyên vẹn 276 MB.

**⇒ Migration là 1 script ~20 dòng + 1 FR cho view.** Rẻ đúng như dự đoán §12
của tài liệu gốc — và nó chỉ rẻ HÔM NAY (13 bản ghi).

---

## Tổng: hệ quả lối A trên từng module (thay bảng ước lượng của bản s1)

| Module | Việc thật sau spike | Mức |
|---|---|---|
| M01_core | +cột `space` 3 bảng + 3 index · **sửa view `ban_ghi`** (FR) · `validate.py` kiểm ontology theo space | 🟠 |
| M02_kb | ontology 3 bảng +cột space; yaml vẫn export | 🟠 |
| M08_api | mọi query +`WHERE space` · `?space=` · cửa CRUD space · thông điệp 409 gợi slug | 🟠 |
| M03_web | tab bar · URL hậu tố · sidebar theo space · **hiệu ứng chuyển tab (làm SAU)** | 🟠 |
| M13 | `pham_vi.space` (đã dành) · chỉ mục +cột lọc · cổng R4 | 🟡 |
| M09-11 | ba bảng đã +cột ở M01; `xuat_kho` giữ cây `kb/<loai>/` | 🟢 |
| M12/M14/M18 | M12 kế thừa space của nguyên liệu · M14 bot = nút cây (FR khi s6) · M18 **không đổi đợt 1** | 🟢 |
| M04/M15/M16/M17 | 0 | ⚪ |

## Đề bài R4 cho dev (đơn vị đầu tiên của Space)

Cổng `check_khong_ro_cheo_space.py`:
- gieo 2 space (`mac-dinh`, `the-thao`) mỗi space 2 bản ghi vào **kho tạm**;
- `cmd`: chạy truy vấn qua M13 `/tim?q=...&pham_vi={space: mac-dinh}` **và**
  `GET /api/index?space=mac-dinh`;
- `đỏ_khi`: bất kỳ hàng nào của `the-thao` lọt vào kết quả (dù 1 hàng);
- `xanh_khi`: 0 hàng chéo, VÀ cổng phải đỏ được khi cố tình bỏ `WHERE space`
  (chứng minh bằng fixture bỏ-lọc — cổng không đỏ được là cổng trang trí).
