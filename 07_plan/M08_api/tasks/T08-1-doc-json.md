# T08-1 — đường ĐỌC: router + health + list + detail JSON

phạm_vi_ghi:
  - web/api/**
verifiability: hard
tiêu_chí:
  - AC1: GET /api/health, /api/articles (filter status/category/concept/q/type + phân trang), /api/articles/:type/:slug trả đúng shape; *.v<n>.md vô hình; :type ngoài enum ⇒ 400; slug traversal ⇒ 400
    cmd: node web/test/api-crud.test.js
  - AC2: (FR-023 GĐ 3) hai đường đọc — index SQLite và quét đĩa — trả DỮ LIỆU Y HỆT trên kho gieo (bài trùng slug khác source_type · bản *.v<n>.md · bài thiếu url_normalized); xoá index xong vẫn trả đúng dữ liệu đó
    cmd: node web/test/hai-duong-doc-khop.test.js

## Việc

- `web/api/dungchung.mjs` — trích từ `server.mjs`: `json()`, `docBody()`,
  `tenAnToan()`; thêm `etag()` (sha256 16 hex, cùng cách `check_frozen.py`),
  `docBai()` (parse frontmatter bằng thư viện YAML thật — bài học FR-010),
  mutex hàng đợi promise, env override `KB_DIR`/`RECYCLE_DIR`/`INBOX_DIR`.
- `web/api/router.mjs` — bảng route, trả `false` nếu không khớp để server.mjs
  rơi xuống serve tĩnh.
- `web/api/articles.mjs` — phần GET.
- **FR-023 GĐ 3** — `khoDoc()` trong `dungchung.mjs`: CỬA ĐỌC DUY NHẤT, index
  SQLite nếu có / quét đĩa nếu không. Đo được 7.546 → 1.079 ms mỗi lượt. Ba chỗ
  cố ý GIỮ đọc đĩa vì mỗi chỗ là một răng: `etag` (sha256 của FILE — index làm
  `If-Match` mất răng), kiểm-tồn-tại-trước-khi-GHI (index trễ một nhịp ⇒ ghi đè),
  guard "kho rỗng" khi xoá nhãn (index rỗng ≠ kho rỗng).

## Ranh giới

Chỉ ĐỌC trong task này — chưa có đường ghi nào. `server.mjs` (M03) mount router
ở đơn vị T03-6; trước đó test spawn router qua harness riêng nếu cần.

## Rule áp vào

`M08-R1` (không tự mở listen — router là hàm thuần nhận req/res).
