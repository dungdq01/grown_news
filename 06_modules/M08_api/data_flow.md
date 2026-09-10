# M08_api — data flow

`.md` là nguồn chân lý (B-C1). API không giữ trạng thái riêng trên đĩa: JSON là
dạng TRẢ VỀ, parse lại từ file mỗi request. Không cache ghi, không file json
trung gian — hai nguồn chân lý là bệnh dự án này chống.

## Đọc — GET list/detail

| Trường | Dùng làm gì |
|---|---|
| `id` | trả trong payload cho FE (định danh hiển thị — KHÔNG phải địa chỉ route) |
| `slug` | nửa sau của route `/:type/:slug`, là tên file |
| `source_type` | nửa đầu của route, là thư mục — enum đóng 6 giá trị |
| `one_liner` | dòng mô tả trên thẻ danh sách |
| `review_status` | filter `?status=` + màu badge |
| `origin` | badge nguồn gốc (pipeline/external/manual) |
| `category` | filter `?category=` (FR-009) |
| `concepts` | filter `?concept=` |
| `analyzed_at` | cột ngày |
| `url` | link nguồn gốc |
| `word_count` | hiển thị độ dài |
| `credibility_max` | badge độ tin |

Bỏ qua khi quét: `README.md`, file bắt đầu `_`, file khớp `*.v<n>.md` (bản lưu
trữ M02 §2.5 — lịch sử, không phải nội dung).

Parse frontmatter bằng thư viện YAML thật — bài học FR-010: parser tự chế đọc
flow style, `gate.py` ghi block style, lệch nhau mà 15/15 test vẫn xanh. Parse
để HIỂN THỊ không phải "viết lại logic kiểm" (M05-R3) — kiểm vẫn là python.

## Ghi — POST/PUT/PATCH

| Trường | Ai quyết |
|---|---|
| `origin` | SERVER — POST luôn áp `manual`; PUT giữ nguyên giá trị cũ |
| `review_status` | SERVER — POST áp `draft`; PUT: `approved`+nội dung đổi ⇒ `edited`; PATCH theo bảng chuyển cứng |
| `insight_new` | NGƯỜI — bắt buộc khi approve, không default (M08-R3, FR-001) |
| `skill_installed` | NGƯỜI — bắt buộc khi approve, không default |
| `review_minutes` | NGƯỜI — bắt buộc khi approve, không default |
| `reject_reason` | NGƯỜI — bắt buộc khi reject, ≥5 ký tự |
| `word_count` | MÁY — phép tính, `validate.py --fix` |
| `url_normalized` | MÁY — phép tính, `validate.py --fix` |

Luồng: compose → tmp ngoài repo → `--fix` → `--strict --concepts kb/concepts.yaml`
(cờ tường minh — target ở tmp, CLI không tự tìm được danh mục) → exit 0 mới
rename nguyên tử vào `kb/`. Rename cùng volume: tmp-để-rename đặt cạnh `kb/`,
tmp-để-validate ở `os.tmpdir()`.

## Tương tranh

Một mutex trong process tuần tự hoá MỌI thao tác ghi (một người dùng — chi phí 0).
ETag = sha256(file)[:16], client gửi `If-Match`; lệch ⇒ 412 — hai cửa sổ cùng sửa
thì bên sau biết, người sửa bằng editor giữa chừng cũng bị bắt.
