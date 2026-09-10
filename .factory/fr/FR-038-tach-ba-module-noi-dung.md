# FR-038 — Tách BA module nội dung: bài viết · tài liệu · video

mở_bởi: người dùng, trực tiếp trong phiên 2026-08-28 — *"1 - module bài viết tách biệt với video / tài liệu. 2 - Giao diện: thanh menu cần phân biệt rõ: 1 tổng hợp, 2 bài viết, 3 tài liệu, 4 video (cùng với đó màn dashboard, kho, tổng hợp bài hay danh mục cũng cần giữ lại). Các giao diện nạp bài, CRUD cũng cần tách biệt rõ ràng. Chỉ có màn kho và tổng hợp là để chung danh sách bài viết, tài liệu, video. Cái tài liệu (pdf, ppt, docs) và url video cũng gán với concept và category như bài viết. note: ko gộp chung các màn và tính năng lại với nhau."*
tới: **M10_tailieu** + **M11_video** (module MỚI, 6 artifact mỗi module) · M09_thuvien (`spec.md` FROZEN — §1 hiện lập luận NGƯỢC) · M02_kb (`kho.schema.sql`) · M01_core (`frontmatter.schema.json` FROZEN) · M03_web (`spec.md` FROZEN — bảy màn) · M08_api (`spec.md` FROZEN — lọc theo nhóm) · `project_map.yaml` v15→v16 · `FROZEN.lock`
mức: **đổi mô hình lưu trữ** (một bảng → ba bảng) + **đổi bố cục điều hướng** (4 màn → 7 màn)
trạng_thái: **DUYỆT 2026-08-28** — người dùng duyệt plan qua ExitPlanMode; ba quyết định chốt qua AskUserQuestion

---

## 0 · FR này ĐẢO một quyết định của FR-037, và nói rõ điều đó

`06_modules/M09_thuvien/spec.md` §1 có tiêu đề nguyên văn **"Vì sao MỘT bảng,
không phải ba"**, và lập luận bằng số đo: `khoDoc()` là cửa đọc duy nhất, ~40 chỗ
`filter/reduce` sinh mọi KPI từ nó, và `(source_type, slug)` là khoá của sáu thứ
khác.

Lập luận đó **không sai về chi phí** — nó sai về **cái người dùng muốn**. Người
dùng nói *"module tài liệu, module video"* ngay từ đầu (`upgrade.md:83-99`), tôi
đọc thành "một bảng, hai hồ sơ", và dựng cả nhánh B trên cách đọc đó. Người dùng
phải nói lại lần thứ hai, gay hơn: *"Tôi đã nói rất rõ với bạn rồi"*.

Nên FR này **không** viện dẫn "yêu cầu mới". Nó là **sửa một cách đọc sai**.

Cái giá đã đo và người dùng đã thấy trước khi chọn: một lần dựng lại DB huỷ diệt ·
~18 chỗ SQL phải đổi bảng đích · `(source_type, slug)` là khoá của
`article_versions`, `recycle`, etag/version, route `/api/articles/:type/:slug`,
deep-link SSR, VIEW `nhan`.

## 1 · Ba quyết định người dùng đã chốt

| | |
|---|---|
Tầng tách | **cả bảng dữ liệu** — `articles` · `documents` · `videos` |
Thanh menu | **7 mục, hai nhóm** — NỘI DUNG: Tổng hợp · Bài viết · Tài liệu · Video · HỆ THỐNG: Dashboard · Kho · Danh mục |
Nạp + CRUD | **mỗi loại một màn nạp riêng + CRUD tại chỗ** |

## 2 · Điều GIỮ được, và vì sao nói ra

Toàn bộ **hạ tầng** nhánh B còn dùng: bảng `media`, hồ sơ `thu-vien` trong
`validate.py`, hai endpoint hiện vật, sáu đầu đề an toàn, vòng export/import cho
byte (đạt điểm bất động), `Ban` mang `ho_so`+`media` ở ba đường dữ liệu, M09-R1..R5
và bảy cổng S3.

Nói ra vì nó đổi phạm vi: đây **không** phải làm lại từ đầu. Sai nằm ở **bố cục**,
không ở tầng dưới.

## 3 · Cái giá, nói trước

**Một lần dựng lại DB huỷ diệt.** SQLite không ALTER được CHECK. Kho thật hiện có
**1 bài** nên an toàn HÔM NAY — làm muộn hơn là làm với kho đầy. Phép kiểm
đếm+hash từng bảng trước/sau là thứ duy nhất chứng minh không mất bản ghi.

**Trần JS/CSS gần đầy**: `gn.js` 92/100 KB · `gn.css` 91/100 KB — còn 8 và 9 KB.
Ba màn mới **không được nới trần** (`page-weight.test.js:85-89` có tiền lệ *"SIẾT,
không nới"*); chúng phải dùng lại helper.

**Ba bảng view song song sẽ trôi tiếp nếu không hợp lại.** `VIEW_SSR`
(`server.mjs:149`) ↔ `MAN` (`trang.mjs:901`) ↔ `DUONG`
(`multiwindow.inline.ts:1389`), và bốn tên cho cùng một màn đang khác nhau
(`khai-niem` / `concepts` / "Danh mục"). FR này đòi hợp thành **một** bảng khai.

**Module video phải làm mới.** Không có đường tạo video nào hiện tại — đăng ký URL
đi qua form viết bài chung. Đây là màn dựng mới, không phải màn tách ra.

## 4 · Điều KHÔNG làm

- **Không** tách `recycle`/`article_versions` — `source_type` đã tự phân biệt bảng
  gốc, tách là thêm sáu bảng để mã hoá một thông tin đã có.
- **Không** để `trang.mjs` đọc ba bảng riêng — nó đọc VIEW `ban_ghi`, nhờ đó
  ~25-30 site tổng hợp không đổi một dòng và M09-R4 (hai nền) giữ nguyên.
- **Không** phá URL đã có: `/tat-ca/` thành alias sang `/tong-hop/`.
- **Không** gõ danh sách loại/màn ở tầng thứ hai.

## 5 · Bề mặt cưỡng chế (S3) FR này để lại

| Rule mới | Cổng |
|---|---|
M10-R1..R3 (tài liệu) | `web/test/man-tai-lieu.test.js` |
M11-R1..R3 (video) | `web/test/man-video.test.js` |
Bảng khai một nơi | `core/tests/check_khai_mot_noi.py` |
Ba bảng + view round-trip | `core/tests/check_ba_bang.py` |
Hiện THẬT (không đo markup) | `web/test/hien-that.test.js` |

Cộng bảy cổng của FR-037 phải còn xanh sau khi tách.
