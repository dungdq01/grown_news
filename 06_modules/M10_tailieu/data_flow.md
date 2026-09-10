# M10_tailieu — data flow

## Bảng module này sở hữu

`documents` — cùng hình dạng cột với `articles`, CHECK hẹp lại
`source_type = 'tai-lieu'`. Không cột metadata nào cho hiện vật: `mime`,
`ten_goc`, `so_byte` sống trong `frontmatter.media` (M09 sở hữu bảng `media`).

## Trường frontmatter module này đọc/ghi

| Trường | Vai | Ai khai |
|---|---|---|
| `source_type` | luôn `tai-lieu` — máy đặt, form KHÔNG cho chọn | **MÁY** |
| `ho_so` | luôn `thu-vien` — schema đòi (`frontmatter.schema.json` nhánh `tai-lieu`) | **MÁY** |
| `media.sha256` | khoá vào bảng `media`, 64 hex | **MÁY** tính từ byte |
| `media.mime` | enum ĐÓNG 5 giá trị | client khai, máy kiểm magic-byte |
| `media.ten_goc` | chỉ để HIỆN — lọc ở SERVER, không bao giờ là đường dẫn | client, máy lọc |
| `media.so_byte` | ≤ 26214400 | **MÁY** đo |
| `url` | `kho://tai-lieu/<slug>` | **MÁY** dựng từ slug |
| `one_liner` | câu người đọc thấy trước | **người** |
| `category` · `concepts` | nhãn — **cùng cổng danh mục với bản phân tích** | **người**, chọn từ danh mục |

`than` **không** phải trường frontmatter — nó là **cột riêng** trong bảng, và nội dung là một ghi chú ngắn (trần 400 từ của hồ sơ `thu-vien`). Ghi ra vì `check_ba.py` bắt đúng chỗ tôi viết sai lần đầu: liệt `than` vào bảng trường frontmatter là khai một thứ schema không có.

Bốn trường đầu **máy đặt hết** — đó là điểm khác form viết bài: người nạp một PDF
không phải trả lời "đây là loại nguồn gì".

## Đường đi của một tài liệu

```
file người dùng chọn
  │
  ├─ FE: kiểm đuôi ∈ bảng khai · kiểm `file.size` ≤ 25 MB   ← TRƯỚC khi POST
  │      (413 không tới được client giữa lúc upload — đo ở WL-01K9N7FR036B5)
  │
  ├─ POST /api/articles/media          ← M09 sở hữu đường này
  │      magic-byte → sha256 → INSERT OR IGNORE media → banXuat()
  │      → 201 { sha256, so_byte, mime, ten_goc đã lọc }
  │
  ├─ người điền: one_liner · slug · category · concepts
  │
  └─ POST /api/articles                ← M08 sở hữu cửa ghi
         validate hồ sơ `thu-vien` (miễn cổng mục, ÁP cổng nhãn 5/5b)
         kiểm con trỏ treo: media.sha256 phải có byte thật
         → INSERT INTO documents        ← bảng của M10
         → banXuat() → kb/tai-lieu/<slug>.md + kb/_media/<sha256>.pdf
```

## Đường ĐỌC

| Ai đọc | Đọc gì | Lọc |
|---|---|---|
Màn `/tai-lieu/` | `GET /api/index?nhom=tailieu` | server lọc, không tải cả kho |
Kho · Tổng hợp | VIEW `ban_ghi` | **không** lọc — đó là chỗ được trộn |
Cửa sổ đọc | `BAI` đã nạp | xem trước theo `media.mime` (M09) |

## Điều module này KHÔNG đọc

Bảng `articles` · bảng `videos` · bảng `media` (nó đi qua endpoint của M09, không
`SELECT byte` trực tiếp) · `concepts`/`categories` (đọc qua API danh mục).
