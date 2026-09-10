# T03-113 — BUG: cửa sổ xem NHÁP đang đi ĐƯỜNG BÀI-KHO — đọc 404, mọi nút chết

> Chủ dự án bắt trên màn thật 2026-09-05 (2 ảnh, /chung-cat/ tab Kết quả):
> mở nháp `phan-tich-xgboost-stap-by-step` ⇒
> (1) `GET /api/articles/article/phan-tich-xgboost-stap-by-step` → **404**,
>     panel báo "Không đọc được bài từ API." — thân bài trống;
> (2) BỐN nút chân cửa sổ là bộ nút BÀI KHO (Đưa lên site · Loại (ghi lý do)
>     · Sửa · Bỏ khỏi kho) và TẤT CẢ fail cùng lỗi đó.
> GỐC: bản nháp KHÔNG tồn tại trong kho — nó sống ở DB nháp (khoá `job_ulid`,
> đọc bằng `GET /api/nhap-chung-cat/<job_ulid>`), nhưng danh sách Kết quả mở
> nó bằng cửa sổ đọc bài-kho generic. Sai CỬA, không phải sai API.
> ID theo rule 9: max 112 ⇒ 113.

## Sửa

- Danh sách Kết quả mở nháp bằng **cửa sổ NHÁP** (khuôn T03-112/cctab): đọc
  `GET /api/nhap-chung-cat/<job_ulid>` (trả CẢ ban_goc_ai lẫn ban_hien_tai
  một lời gọi — T08-22), KHÔNG gọi /api/articles/* cho bản chưa vào kho.
- Bộ nút đúng vai nháp: **Duyệt vào kho · Sửa · Trả lại (bắt lý do) · Bỏ**
  — gọi các hành động sẵn có của nhap-cua (T08-22/T08-29). Nút "Đưa lên
  site"/"Loại"/"Bỏ khỏi kho" là đời sống của BÀI ĐÃ VÀO KHO — chỉ hiện sau
  khi duyệt.
- Nháp `trang_thai=da_vao_kho` ⇒ cửa sổ dẫn sang bài kho thật (lúc này
  /api/articles/... mới đúng đường).

phạm_vi_ghi:
  - web/plugins/chungcat/src/chungcat.inline.ts    # tab Kết quả: mở đúng cửa sổ nháp
  - web/plugins/cctab/src/cctab.inline.ts          # cửa sổ nháp: đọc nhap-chung-cat + 4 nút đúng vai
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # CHỈ nếu khung cửa sổ cần loại "nhap"
# cổng thuộc đơn vị test đi kèm: chung-cat-nhap.test.js + tab-theo-doi-chung-cat.test.js thêm vế CÙNG LƯỢT

verifiability: hard
tiêu_chí:
  - AC1: mở một nháp từ tab Kết quả ⇒ 0 request tới /api/articles/* ; thân
      ban_hien_tai hiện ra (đọc từ /api/nhap-chung-cat/<ulid>)
    cmd: node web/test/chung-cat-nhap.test.js
    đỏ_khi: có request /api/articles cho bản trang_thai != da_vao_kho, hoặc thân trống
    xanh_khi: đọc đúng cửa nháp + thân hiện
  - AC2: bộ nút là Duyệt/Sửa/Trả/Bỏ; bấm Duyệt (mock) gọi đúng hành động
      nhap-cua và trạng thái đổi da_vao_kho; KHÔNG nút Đưa-lên-site trên nháp
    cmd: node web/test/chung-cat-nhap.test.js
  - AC3: nháp da_vao_kho ⇒ mở ra bài kho thật (đường /api/articles hợp lệ)
    cmd: node web/test/chung-cat-nhap.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
