# T03-117 — NÚT "Tải xuống ▾" + PRINT-VIEW (.pdf) — WIREFRAME TRƯỚC

> Chủ dự án duyệt 2026-09-06. Lệ mới giữ nguyên: DEV VẼ WIREFRAME TRƯỚC,
> chủ dự án duyệt rồi mới code UI (khuôn T03-116/AC0).
> CHẶN CỨNG: sau T08-33 (cửa xuất + bảng xuat-dang.json).
> ID rule 9: max 116 ⇒ 117.

## BƯỚC 1 — WIREFRAME (soft gate, NGƯỜI duyệt — CẤM code trước)

- `05_uiux/wireframes/SCR-19-tai-xuong-va-print.md`: (a) nút "Tải xuống ▾"
  đặt ở đâu trong cửa sổ đọc + cửa sổ kết quả chưng cất (cạnh nút tải-về
  media sẵn có — KHÔNG hai nút tải cạnh tranh, gộp một menu); (b) menu dạng
  theo LOẠI bản ghi (dẫn xuất xuat-dang.json — vẽ đủ 4 ca: bài viết ·
  nháp chưng cất · transcript · tài liệu-pdf-chỉ-dạng-gốc); (c) print-view
  trang sạch (ẩn rail/nút/badge, chỉ tiêu đề + meta + thân).
- Chủ dự án duyệt (worklog ghi mốc) → bước 2.

## BƯỚC 2 — CODE

- Menu "Tải xuống ▾": mục dẫn xuất từ bảng khai theo loại; mỗi mục là link
  thẳng `GET /api/xuat/...` (trình duyệt tự tải — KHÔNG blob/JS tải hộ);
  media gốc giữ mục "File gốc (.pdf/.mp4…)" trỏ đường media sẵn có.
- **PDF = print-view**: mục "PDF (in…)" mở route hiện tại + `?in=1` — SSR
  trả trang SẠCH (CSS @media print + lớp .in-sach: ẩn rail/nút/toast) rồi
  `window.print()`; người dùng Save-as-PDF. 0 phụ thuộc server.
- Nháp: menu trong cửa sổ kết quả (cctab) trỏ /api/xuat-nhap/<ulid>.

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-19-tai-xuong-va-print.md   # MỚI — bước 1
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # menu ở cửa sổ đọc
  - web/plugins/cctab/src/cctab.inline.ts             # menu ở cửa sổ kết quả
# `web/render/trang.mjs` KHÔNG chạm — bản khai đầu định đặt nhánh `?in=1` ở
# đó, nhưng đo ra là KHÔNG đặt được: site chỉ có route theo MÀN
# (`VIEW_SSR[duong]`), không có route theo từng bài. Đặt ở `trang.mjs` thì phải
# thêm một đường định tuyến mới ở `server.mjs` — hai file, cho một trang.
  - web/api/xuat-cua.mjs                              # NỚI: trang in `?dang=in`
# NỚI PHẠM VI, khai thẳng: cửa xuất đã phân giải được bản ghi, và
# `xuat-dang.json` đã liệt `in` là MỘT DẠNG cạnh md/txt/docx. Nên nó là nhà
# SẴN CÓ của trang in — 0 route mới, 0 file thứ hai. Đổi lại: một cửa `/api/`
# trả HTML, hơi lệch vai API/SSR. Nói ra để reviewer cân, không giấu.
  - web/styles/prototype.css                          # @media print (đo trần trước)
# vế cổng thuộc đơn vị test đi kèm (chung-cat-ui + hien-that mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-19 duyệt TRƯỚC mọi dòng mã bước 2, worklog mang mốc
  - AC1: menu dẫn xuất theo loại — bài viết đủ md/txt/docx/pdf; tài liệu-pdf
      CHỈ "File gốc"; transcript có srt; thêm dạng vào bảng ⇒ mục mọc, 0 mã FE
    cmd: node web/test/chung-cat-ui.test.js
    đỏ_khi: menu gõ cứng theo loại, hoặc tài liệu-pdf hiện mục docx
    xanh_khi: menu đúng bảng từng ca
  - AC2: mục tải là <a href> thẳng cửa xuất (0 fetch/blob); ?in=1 trả trang
      không rail/nút (đo markup)
    cmd: node web/test/hien-that.test.js
  - AC3: suite web xanh + page-weight xanh
    cmd: cd web && npm test

# HOTFIX PM 2026-09-06 (chủ dự án bấm không thấy gì): menu `details.tx > .tx-ds`
# sinh trong JS nhưng prototype.css 0 luật → menu MỞ mà VÔ HÌNH. Đã thêm khối
# .tx tối thiểu (token-only, ~330B), build + restart, gn.css phục vụ có luật.
# CÒN CHO DEV khi khép task: (1) style menu theo SCR-19 (bản hotfix chỉ đủ
# dùng); (2) VẾ CỔNG mới — markup-matches-css hiện MÙ với markup sinh trong
# chuỗi JS (lớp lỗi lặp: menu vô hình mà suite xanh) — thêm vế quét class
# trong *.inline.ts đối chiếu CSS; (3) page-weight vẫn đỏ (nợ trần chung,
# AC "trả xanh lúc bàn giao").
