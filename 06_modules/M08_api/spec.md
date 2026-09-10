# M08_api — spec

> **Bàn biên tập local** (FR-011). Một tiến trình HTTP riêng (`node web/server.mjs`
> mount router từ `web/api/`), chỉ nghe `127.0.0.1`, cho NGƯỜI thao tác CRUD bài
> viết ngay trên web. Nguồn chân lý là `kb/_kho.sqlite` (B-C1 đảo theo FR-034):
> API trả JSON là **view** của hàng DB, mọi ghi COMMIT vào DB sau khi qua
> `validate.py --strict`, rồi export ra `.md` (một chiều, `xuat_kho.py`).

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | `web/api/**` (handler) · `_recycle/**` (thùng rác bài xoá) |
| **Không sở hữu** | `web/server.mjs` (entry — M03) · `kb/**` (owner M02, M08 chỉ là *writer có điều kiện*) · schema (M02) |
| **Vào** | HTTP request từ 127.0.0.1 · `kb/_kho.sqlite` (SELECT) |
| **Ra** | JSON response · COMMIT vào `kb/_kho.sqlite` (sau validate) · spawn `xuat_kho.py` export |
| **Ghi được** | `kb/_kho.sqlite` — CHỈ qua luồng validate-trước-COMMIT (M08-R2); KHÔNG ghi file `kb/**` nào (export là việc của `xuat_kho.py`) |

## 2 · Business logic

### 2.1 · CRUD — hàng trong `articles` là nguồn chân lý, JSON là view

*(FR-034 — bản gốc: "`.md` là nguồn chân lý, JSON là view".)*

Định danh tài nguyên `/:type/:slug` ánh xạ 1:1 vào khoá chính
`(source_type, slug)` của bảng `articles`: `type` ∈ enum đóng 6 giá trị,
`slug` qua whitelist `[a-z0-9-]` — traversal bị chặn bằng **cấu trúc**, không
bằng lọc. Bản lưu trữ (bảng `article_versions`, export `*.v<n>.md` — M02 §2.5)
vô hình với mọi endpoint.

| Endpoint | Việc |
|---|---|
| `GET /api/health` | FE feature-detect — site tĩnh thuần không có API vẫn nguyên chức năng đọc |
| `GET /api/index` | **FR-024** — chỉ mục mở cửa sổ, đọc lúc REQUEST. Thay `static/open-index.json` (chỉ sinh lúc build) nên sửa kho rồi F5 là thấy. Gộp theo `url_normalized` cùng luật M03-R5, gồm mọi `review_status` + thân bài. CHỈ `GET` |
| `GET /api/articles` | danh sách JSON, filter `status/category/concept/q/type` + phân trang |
| `GET /api/articles/:type/:slug` | chi tiết: frontmatter + body + etag (sha256 16 hex) |
| `POST /api/articles` | tạo bài — server ÁP `origin: manual`, `review_status: draft` |
| `PUT /api/articles/:type/:slug` | sửa — `approved` + nội dung đổi ⇒ server tự chuyển `edited` (M02 §2.2) |
| `PATCH /api/articles/:type/:slug/status` | đổi trạng thái theo bảng chuyển cứng |
| `DELETE /api/articles/:type/:slug` | move sang `_recycle/<type>/<slug>.md` — không xoá thật |
| `GET /api/recycle` · `POST .../restore` | xem thùng rác, khôi phục (409 nếu `kb/` đã có file) |

Luồng ghi (mọi POST/PUT/PATCH): compose `.md` → tmp ngoài repo (kèm snapshot
`concepts.yaml` + `categories.yaml` SELECT từ DB, cùng nhịp) →
`validate.py --fix` (word_count là phép tính) → `validate.py --strict` → đạt
mới `BEGIN IMMEDIATE … COMMIT` vào `articles` → `banXuat()` export async.
Trượt ⇒ 422 kèm **nguyên văn** THIẾU/SAI/SỬA — cổng nói gì hiện đúng thế
(khuôn FR-010).

**FR-034 — mọi đường đọc lẫn ghi cùng một nguồn: DB.** `khoDoc()` vẫn là cửa
đọc duy nhất, giờ SELECT thẳng `articles` — không fallback đĩa (fallback là
nguồn chân lý thứ hai; thiếu `node:sqlite` phải là lỗi khởi động rõ). Bảng
"ba chỗ cố ý đọc đĩa" của FR-023 **hết đối tượng**: 409-check, guard kho rỗng,
etag đều hỏi DB — chính xác tuyệt đối vì không còn cửa sổ index async.

`etag` = cột lưu sẵn, sha256(`version` + frontmatter + than)[:16]; `version`
+1 mỗi lần ghi — chống ABA giữa hai AI song song, và editor ngoài không còn là
đường ghi hợp lệ nên "sửa file ngoài web" không cần làm etag lệch nữa.

> **AC-2.1.2** · Round-trip DB↔file giữ đủ dữ liệu trên kho gieo (bài trùng
> slug khác `source_type` · bản lưu trữ · bài thiếu `url_normalized`).
> `hard` · `cmd: python core/tests/check_export_dan_xuat.py`
> *(thay `hai-duong-doc-khop.test.js` — hai đường đọc không còn, chỉ còn DB.)*

Ghi tuần tự hoá bằng mutex trong process + `BEGIN IMMEDIATE` giữa các process;
ETag + `If-Match` bắt lost-update giữa hai cửa sổ (multi-window là tính năng
thật của web này) — bên sau nhận 412.

> **AC-2.1.1** · Vòng CRUD đủ trên kho tạm: tạo → đọc → sửa → duyệt →
> sửa-khi-approved ⇒ `edited` → duyệt lại → xoá → restore. Kèm ca âm: POST trùng
> ⇒ 409 · PUT etag cũ ⇒ 412 · PUT đổi slug/type/id ⇒ 400 · `:type` ngoài enum ⇒
> 400 · slug traversal ⇒ 400 · `*.v1.md` không xuất hiện · cuối test kho tạm vẫn
> qua `validate.py --strict`.
> `hard` · `cmd: node web/test/api-crud.test.js`

### 2.1b · Đường HIỆN VẬT — byte đi trước, bản ghi đi sau (FR-037)

```
POST /api/articles/media          content-type: <mime trong enum đóng>
                                  content-length: kiểm TRƯỚC khi đọc byte
                                  x-ten-goc:      chỉ để hiện, LỌC ở server
  → 201 { sha256, so_byte, mime, ten_goc }
  → 413 khai content-length vượt trần · 415 mime ngoài enum
  → 422 magic-byte không khớp mime khai

GET  /api/articles/media/<sha256>
  → 200 byte + SÁU đầu đề an toàn (§2.4b) · 304 khi If-None-Match khớp
  → 404 sha256 không có, HOẶC blob không bản ghi nào trỏ tới
  → 405 + `Allow` cho method khác
```

**Vì sao byte đi TRƯỚC**: `source_type: tai-lieu ⇒ required: media`, nên bản ghi
không thể tồn tại hợp pháp trước blob của nó. Bản ghi tạo qua `POST /api/articles`
như mọi bài khác — **không** endpoint thứ hai, vì `api-guard` răng 5 đòi literal
`review_status: "approved"` chỉ ở `taoBai`.

**Blob mồ côi ⇒ 404, không 200.** Byte đang staging (người dùng vừa nạp, chưa bấm
Ghi) là hợp lệ trong kho nhưng **không phải nội dung công khai**. Phục vụ nó là
biến cửa nạp thành chỗ chứa file ai cũng đọc được, chỉ cần biết sha256. Tập tham
chiếu tính trên **cùng union ba bảng** mà exporter dùng cho luật mồ côi (M09-R1).

**`/api/index` mang thêm `ho_so` + `media`.** Đây là builder `Ban` thứ ba (ngoài
`banTuDb`/`docTuDia` của `data.mjs`); thiếu hai trường ở đây thì xem trước hiện
vật chạy trên bản `/mock/` và **im lặng không chạy trên kho thật** — bug đã đo,
xem `WL-01K9NBFR036B8`.

> **AC-2.1b.1** · Bốn mã trả về đo trên server thật; `sha256`/`so_byte` do MÁY
> tính (tham số cùng tên gửi kèm bị bỏ qua); `x-ten-goc` mang đường dẫn thì trả
> về đã lọc sạch dấu phân cách.
> `hard` · `cmd: cd web && node test/thu-vien.test.js`

> **AC-2.1b.2** · `/api/index` mang `ho_so` + `media`; bản ghi thường có
> `phan-tich` + `media: null` (cùng mặc định với `data.mjs`).
> `hard` · `cmd: cd web && node test/media-cua-so.test.js`

### 2.4b · Sáu đầu đề an toàn trên đường phục vụ byte (FR-037)

| đầu đề | vì sao |
|---|---|
`content-type` | từ **enum đóng** `media-mime.json`, KHÔNG sniff từ tên file |
`x-content-type-options: nosniff` | vắng nó ⇒ blob dán nhãn sai bị re-sniff thành HTML và **chạy same-origin** |
`content-disposition` | `inline` cho pdf · **`attachment`** cho ppt/doc — attachment CHÍNH LÀ chính sách xem trước cho format không render được |
`content-security-policy` | `default-src 'none'; object-src 'none'; sandbox` — ở **HEADER**, không ở attribute: `sandbox` attribute không kèm `allow-scripts` làm hỏng viewer PDF của Chromium |
`etag` + `cache-control: immutable` | hợp pháp vì địa chỉ theo nội dung. **Kèm nhánh 304** — etag không có 304 là etag trang trí |

`filename=` dùng **đuôi từ bảng khai** + 12 ký tự sha256, KHÔNG dùng `ten_goc`
thô: một `filename=` mang dấu ngoặc kép hay newline là đường tách đầu đề.
KHÔNG hứa `accept-ranges` — Range không cài ở v1, và hứa mà không cài là hứa dối.

> **AC-2.4b.1** · Sáu đầu đề đo bằng `res.headers` của request THẬT; `content-type`
> và `content-disposition` so với `media-mime.json`, không với chuỗi gõ tay.
> `hard` · `cmd: cd web && node test/media-dau-de.test.js`

### 2.2 · Chuyển trạng thái — cửa RIÊNG, người khai, máy không điền hộ

Bảng chuyển **cứng trong code**, đúng vòng đời M02 §2.2 — ngoài bảng ⇒ 409:

```
draft → approved   (đòi đủ 3 trường M1: insight_new, skill_installed, review_minutes)
draft → rejected   (đòi reject_reason ≥ 5 ký tự)
edited → approved  (đòi đủ 3 trường M1)
```

`approved → edited` KHÔNG đi cửa này — nó là hệ quả của PUT sửa nội dung.
PUT/POST **lột** `review_status`/`origin`/`id`/`slug`/`source_type` khỏi payload
(M08-R5): chuyển trạng thái chỉ có một cửa, cửa đó đòi lời khai của người.

B-B1 nguyên vẹn: endpoint chỉ phản ứng một HTTP request người bấm, và 3 trường M1
**không có default trong code** (M08-R3) — máy không có gì để điền vào chỗ chỉ
người trả lời được. Schema FR-001 là lưới thứ hai, chạy bằng python thật mỗi lần ghi.

> **AC-2.2.1** · Approve thiếu bất kỳ 1/3 trường M1 ⇒ 422 và file trên đĩa không
> đổi byte; reject với lý do <5 ký tự ⇒ 422; chuyển ngoài bảng (vd `rejected →
> approved`) ⇒ 409; external + approve (FR-012) ⇒ 200.
> `hard` · `cmd: node web/test/api-status.test.js`

### 2.3 · Xoá = recycle, không bao giờ unlink

Kho là thứ backup F4 gọi là *"mất là mất tất cả"*. DELETE (FR-034) = một
transaction `INSERT INTO recycle` (snapshot nguyên văn frontmatter + than)
**cùng** `DELETE FROM articles` — hai vế không tách rời; restore là chiều
ngược. Không code path nào DELETE trên bảng `recycle`. Export vẫn ghi
`_recycle/` ra file để mắt người soát.

> **AC-2.3.1** · DELETE xong file trong `_recycle/` byte-equal bản gốc; restore về
> đúng chỗ cũ; restore khi `kb/` đã có file cùng tên ⇒ 409; xoá hai lần cùng slug
> ⇒ bản sau mang hậu tố epoch, không ghi đè bản trước.
> `hard` · `cmd: node web/test/api-recycle.test.js`

### 2.4 · Chặn bù là cấu trúc code, kiểm tĩnh được

Mọi ghi `kb/` đi qua đúng MỘT hàm (`ghiSauValidate`), hàm đó có spawn
`validate.py --strict`; handler không tự mở `listen`, không `0.0.0.0`, không
`unlink`/`rmSync` trỏ kho, không default trường quyết định.

> **AC-2.4.1** · Quét tĩnh `web/api/**` xác nhận cả năm điều trên.
> `hard` · `cmd: node web/test/api-guard.test.js`

### 2.5 · Bundle tĩnh không đổi tính chất

Site build ra vẫn read-only tuyệt đối, deploy được không cần API; FE chỉ bật
control ghi sau khi `/api/health` trả 200.

> **AC-2.5.1** · Bundle tĩnh không có đường ghi ngoài whitelist literal đóng;
> khối quét plugins giữ nguyên như trước FR-011.
> `hard` · `cmd: node web/test/no-write-path.test.js`

> **AC-2.5.2** · Trải nghiệm duyệt trên màn Chờ duyệt: mở web, bấm duyệt, khai 3
> trường M1, thấy trạng thái đổi.
> `soft` — thao tác người trên bản chạy thật. Người chốt.

## 3 · Công thức

Không sở hữu công thức nào. `etag = sha256(file)[:16]` là phép bấm vân tay, cùng
cách `check_frozen.py` dùng — không phải công thức nghiệp vụ.

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Nghe ngoài `127.0.0.1` | không có auth — localhost LÀ lớp bảo vệ (M08-R1, B-D3) |
| Ghi `kb/` không qua validate | cổng thành trang trí, đường không cổng thành lối chính (M08-R2) |
| Default trường quyết định | B-B1 — máy tự duyệt có vỏ bọc người bấm (M08-R3) |
| Xoá thật | một click nhầm = mất bài; recycle thuận nghịch (M08-R4) |
| Nhận `review_status`/`origin`/`id`/`slug`/`source_type` từ payload | cửa hông qua cổng người (M08-R5) |
| Viết lại logic kiểm bằng JS | M05-R3 — hai bản kiểm lệch nhau im lặng |

## 5 · Trạng thái

`planned` — FR-011 thi hành. Ghi chú vận hành: trang ĐỌC của site tĩnh là bản
build; sau mutation, UI nhắc chạy `npm run build`. Build-trigger endpoint là việc
khác, chưa cam kết.
