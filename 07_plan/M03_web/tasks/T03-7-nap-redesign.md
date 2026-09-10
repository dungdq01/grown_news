# T03-7 — redesign màn Nạp nguồn: 3 lối ngang hàng + form tạo bài

phạm_vi_ghi:
  - web/plugins/**
  - web/styles/**
verifiability: hard
tiêu_chí:
  - AC1: CSS mới chỉ dùng token (M03-R4)
    cmd: node web/test/token-only.test.js
  - AC2: control mới có mã xử lý, filter/buttons không vỡ
    cmd: node web/test/buttons.test.js

phụ_thuộc: T03-6

## Việc (skill /design:frontend-design — trong hệ token, KHÔNG bump ui_frozen)

- v-nap: 3 bước tuần tự 01→03 → **3 lối ngang hàng**: A dán link distiller
  (chép lệnh, luôn sống) · B nộp file agent sinh (kéo-thả → /api/inbox) ·
  C tự viết bài (form → POST /api/articles, origin manual).
- Form lối C theo schema: slug gợi ý từ tiêu đề (người xác nhận), source_type
  select 6, one_liner đếm 160, category checkbox 6, concepts chọn từ danh mục
  API (không bịa id), concepts_proposed tự do, body textarea.
- Khối kết quả cổng thống nhất lối B+C: render nguyên văn THIẾU/SAI/SỬA.
- Banner API: chạy ⇒ lối B/C sống; không ⇒ mờ + lệnh `npm run build && npm run api`.
- Sửa comment lỗi thời đầu v-nap ("màn HƯỚNG DẪN...") + i18n vi/en.

## Rule áp vào

`M03-R4` · M08-R3 phía FE (form không tự điền trường quyết định).
