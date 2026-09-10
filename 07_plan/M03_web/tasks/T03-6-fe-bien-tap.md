# T03-6 — FE bàn biên tập: feature-detect + nút CRUD + mount router

phạm_vi_ghi:
  - web/server.mjs
  - web/plugins/**
  - web/styles/**
verifiability: hard
tiêu_chí:
  - AC1: bundle tĩnh không đường ghi ngoài whitelist; fetch literal từng endpoint
    cmd: node web/test/no-write-path.test.js
  - AC2: mọi control mới có mã xử lý — không có thứ nào trang trí
    cmd: node web/test/url-va-tuong-tac.test.js
  - AC3: CSS mới chỉ dùng token
    cmd: node web/test/token-only.test.js

phụ_thuộc: T08-2

## Việc

- `server.mjs` mount router M08 TRƯỚC nhánh serve tĩnh; sửa comment luận cứ
  (câu "schema khoá const draft" đã lỗi thời sau FR-012).
- `multiwindow.inline.ts`: `GET /api/health` một lần ⇒ class `api-co` trên body;
  nút Duyệt/Loại (màn Chờ duyệt) ⇒ form 3 trường M1 / lý do ⇒ PATCH; nút Sửa/Xoá
  (cửa sổ đọc + danh sách) ⇒ PUT/DELETE kèm If-Match; lỗi 4xx hiện nguyên văn.
- `shell.html`: control ghi ẩn mặc định (chỉ hiện khi `body.api-co`).

## Rule áp vào

`M03-R2` (bản FR-011) · `M03-R4` (token-only) · M08-R3 phía FE (form không prefill
3 trường M1).
