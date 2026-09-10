# web/api — bàn biên tập local (M08_api · FR-011, đảo nguồn ở FR-034)

Handler CRUD bài viết sau `server.mjs`. Nguồn chân lý là `kb/_kho.sqlite`
(FR-034) — API trả JSON là view của hàng DB; mọi ghi validate trước COMMIT rồi
export ra `.md` (một chiều, `xuat_kho.py`).

## File

| File | Vai |
|---|---|
| `dungchung.mjs` | MỌI mutation SQL sống ở đây — handler khác chỉ gọi. `ghiSauValidate` (compose tmp + snapshot danh mục → `validate.py --fix --strict` → UPSERT trong BEGIN IMMEDIATE) · `chuyenSangRac`/`phucHoi` (txn recycle↔articles) · `themVaoDanhMuc`/`suaDanhMuc` (bảng concepts/categories) · `ghiNhatKyDanhMuc` (audit_log chỉ-nối-thêm) · `banXuat` (await export sau mỗi COMMIT) · etag = sha256(version+fm+than)[:16] · mutex `tuanTu` + BEGIN IMMEDIATE cho 2 process |
| `router.mjs` | bảng route, hàm thuần trả `false` để server rơi xuống SSR. Cổng cấu trúc: `:type` ∈ enum 6 · `:slug` whitelist `[a-z0-9-]` |
| `articles.mjs` | GET list (filter + phân trang) · GET detail · POST (server ÁP `origin: manual` + `approved` — FR-033) · PUT (If-Match; KHÔNG hạ trạng thái) · GET /api/concepts·categories (đọc bảng DB) |
| `status.mjs` | PATCH /status — bảng chuyển cứng; 3 trường M1 TUỲ CHỌN (FR-033), kiểm KIỂU, không default (M08-R3) |
| `recycle.mjs` | DELETE = INSERT recycle + DELETE articles cùng txn (M08-R4) · GET /api/recycle · restore (validate snapshot rồi INSERT về) |

## Quyết định ghi lại

1. **POST không đi qua `gate.py`** — gate hardcode `external` + đòi
   `citations_sampled>=2`: đúng cho hàng NHẬP, vô nghĩa với bài người tự viết
   (M05-R2). Bài tự viết = `origin: manual`, validate thẳng, lên site ngay (FR-033).
2. **Helper trông giống `server.mjs` nhưng KHÔNG import từ đó** — server thuộc
   M03 và `no-write-path.test.js` canh nó nguyên trạng từng phép kiểm.
3. **Restore cũng qua validate** — schema có thể đã đổi từ lúc xoá; M08-R2
   không có ngoại lệ. Validate SNAPSHOT trong bảng recycle (FR-034 — trước là
   nguyên văn file trong rác).
4. **Định danh `/:type/:slug`** = khoá chính `(source_type, slug)` của bảng
   articles (FR-034 — trước là địa chỉ file); traversal chặn bằng cấu trúc.
5. **`banXuat` được AWAIT trong request** — trả lời HTTP nghĩa là export đã
   xong: `git status` sau một thao tác luôn nói thật, test đọc file không cần
   poll. Giá ~300ms/lượt ghi, khai ở FR-034.

## Răng máy

`api-crud` · `api-status` · `api-recycle` · `api-guard` · `ssr-routes`
(.test.js) + khối `web/api` trong `no-write-path.test.js` +
`python core/tests/check_export_dan_xuat.py` (4 răng B-C1 đảo).
Boundary: `project_map.boundaries.api_writes = [kb/_kho.sqlite]`.

## Nợ

- `GET /api/articles` parse frontmatter JSON mỗi request — kho nghìn bài sẽ
  cần đọc cột GENERATED thay vì parse (dẫn xuất trong cùng DB, không phải
  nguồn thứ hai).
- Export await ~300ms/lượt ghi — nếu thành nghẽn khi nạp lô lớn thì tách
  chế độ lô (một export cuối lô) qua FR nhỏ.

## FR-038/C4 · `?nhom=` lọc theo module + builder thứ tư

`loaiCuaNhom(ten)` trong `dungchung.mjs` đọc `loai-nguon.json`; `khoDoc(loai)`
nhận thêm tham số tuỳ chọn. `chiMucMo(req,res,u)` và `danhSach` cùng dùng
`locNhom(u)`.

**Lọc bằng `source_type`, KHÔNG bằng cột `bang`** — phép ĐO, `EXPLAIN QUERY PLAN`
trên chính DDL hiện tại:

```
WHERE bang = 'video'            → SCAN bai_viet · SCAN tai_lieu · SCAN video
WHERE source_type IN ('video')  → SEARCH … (source_type=?) trên cả ba PK index
```

`bang` là **literal** trong từng nhánh UNION ALL nên SQLite không tỉa nhánh theo
nó — nó quét cả ba rồi lọc, tức đúng cái việc lọc này muốn tránh. Cột `bang` vẫn
hữu ích để biết một hàng đến từ đâu, chỉ không dùng để lọc. Đây là ngược với
phương án trông gọn hơn.

`loaiCuaNhom` trả **`null`** cho nhóm lạ, không trả `[]`. `[]` đi tiếp thành
`WHERE source_type IN ()` ⇒ danh sách rỗng, không phân biệt được với "kho chưa có
gì". Caller phải phân biệt được *nhóm lạ* (400) với *nhóm đúng, chưa có bản nào*
(200 rỗng), nên hai ca đó phải là hai giá trị trả về khác nhau.

`?nhom=` **rỗng** = không lọc, không phải nhóm lạ: FE ghép query bằng chuỗi và
một biến chưa gán thành `?nhom=`; chặn nó bằng 400 là biến một trạng thái vô hại
thành lỗi người dùng thấy.

`danhSach` nhận `?nhom=` cùng lúc dù đã có `?type=`: `type` lọc MỘT loại, còn
nhóm `bai-viet` gồm **năm**. Không thêm thì FE gõ tay năm loại — tầng thứ hai gõ
tay đúng thứ `loai-nguon.json` sinh ra để dẹp.

**Hai trường thêm vào `theBai()`** (`ho_so` + `media`): ba builder kia đã mang từ
B7a/B8b, đây là bản thứ tư chưa ai canh. Và `chiMucMo` được thêm
`concepts_proposed` — lỗ do cổng bốn-builder tìm ra, cùng lớp lỗi B8b: trường CÓ
trên bản mock, `undefined` trên kho THẬT.

Cổng: `test/loc-theo-nhom.test.js` + `test/hai-ban-shape.test.js` (mục 4-5).
