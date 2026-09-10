# T03-125 — UI TÌM TOÀN VĂN — wireframe TRỌN FLOW một lượt, chống sửa-đi-sửa-lại

> Bối cảnh chung plan M13 (s7 2026-09-07): spec G6A xanh (20 AC hard, 5 rule
> CHỜ bề mặt) · service RIÊNG :8791 (dich-vu.json sẵn) · rule.md mục 11: THỢ
> gọi THỢ trực tiếp, web chỉ wrapper · chỉ mục = DẪN XUẤT, mất không mất gì.
> Chủ dự án 2026-09-07: làm UI nhúng web luôn, plan CHUẨN CHỈ — rút kinh
> nghiệm M12 sửa UI quá nhiều. SÁU BÀI HỌC M12 thành LUẬT của đơn vị này:
>  1 Wireframe TRỌN FLOW một lượt, NGƯỜI duyệt xong mới code; đổi flow sau
>    duyệt = mở lại bước 1, không vá giữa code.
>  2 HÀNH VI SAU HÀNH ĐỘNG đặc tả ngay trong wireframe (gõ - debounce - kết
>    quả; bấm - mở; 0-kết-quả - gì; lỗi service - gì). T03-119 là giá của
>    việc bỏ mục này.
>  3 BYTE đo TRƯỚC lúc nhận việc: JS màn tìm đi CHUNK riêng ngay từ đầu
>    (khuôn cctab) — khỏi giảm-béo giữa chừng như T03-99/104.
>  4 Markup sinh trong JS phải có VẾ CỔNG CSS (lỗ menu-vô-hình đã trả giá).
>  5 Nút/nhãn TỰ GIẢI THÍCH, qua chu-giao-dien (bài học Loại vs Bỏ).
>  6 Trạng thái đủ bộ NGAY đợt đầu: rỗng · đang tìm · lỗi service ·
>    0-kết-quả (kèm bắn tín hiệu AC-7.1) — không "đợt sau".
> CHẶN CỨNG: sau T08-35 + T13-4 (có dữ liệu thật, wireframe khỏi bịa).
> **+ T03-149 (C3)** cho AC2 — đo 2026-09-10: `md()` render heading KHÔNG có `id`,
> `nhay()` chỉ nhảy theo mục khung 5 mục ⇒ *"cuộn đúng anchor"* không có đường xanh
> cho tới khi C3 xong. Không có T03-149 thì AC2 là AC treo.
> ID rule 9: max 124 ⇒ 125.

> 🔁 **`rule.md` mục 15 (chốt 2026-09-10)**: `multiwindow.inline.ts` (4 167 dòng) có
> trong `phạm_vi_ghi` dưới đây **chỉ để đặt MỘT DÒNG MÓC** qua cầu `__GN_MW__` (khuôn
> `chungcat` gọi `capNhin`). Toàn bộ logic tìm — debounce · gọi `/api/tim` · vẽ panel ·
> phím · 4 trạng thái · bắn tín hiệu — sống ở `web/plugins/timkiem/`. Diff của
> `multiwindow.inline.ts` trong đơn vị này **> 5 dòng** ⇒ reviewer FAIL.

> 🔁 **SCR-22 → SCR-27 (2026-09-10)**: `SCR-22-nhip-sinh.md` đã tồn tại (team M12 lấy số
> trước). Max hiện tại SCR-26 ⇒ 27. Dev đã có bản nháp `SCR-27-tim-toan-van.DRAFT.md`
> ở scratchpad — đưa vào `05_uiux/wireframes/` rồi NGƯỜI duyệt.

## BƯỚC 1 — WIREFRAME 05_uiux/wireframes/SCR-27-tim-toan-van.md (NGƯỜI duyệt)

- Nâng ô "Tìm bài, khái niệm, nguồn..." sẵn có: gõ 2+ ký tự, debounce, panel
  kết quả trượt dưới ô — mỗi dòng: đoạn khớp (highlight TỰ TÔ từ vị trí
  match, không snippet FTS) · breadcrumb heading · badge loại nguồn.
- Bấm kết quả ⇒ mở CỬA SỔ ĐỌC đúng bài, NHẢY đúng anchor (dùng lại máy
  mucCua/nhay sẵn có) — người không rời trang.
- Facet chips (loại nguồn · chủ đề) = tap_nguon param.
- Vẽ đủ 4 trạng thái (mục 6) + ca 50 kết quả cuộn trong panel + phím
  lên/xuống chọn, Enter mở, Esc đóng.

## BƯỚC 2 — CODE (sau duyệt SCR-27)

- Chunk gn-tim.js nạp khi focus ô tìm (khuôn cctab); gọi /api/tim qua web;
  CSS token-only; tín hiệu 0-kết-quả/gõ-lại bắn kèm query.

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-27-tim-toan-van.md
  - web/plugins/timkiem/src/timkiem.inline.ts
  - web/render/assets.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css
# cổng tim-toan-van.test.js thuộc đơn vị test đi kèm — R1

phụ_thuộc: T08-35 · T13-4 · T03-149

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-27 duyệt TRỌN FLOW trước mọi dòng mã bước 2
      · 2026-09-10 chủ dự án: *"tôi tạm duyệt SCR-27"* — TẠM DUYỆT trên bản nháp còn ở
        scratchpad dev (`SCR-27-tim-toan-van.DRAFT.md`). Điều kiện để AC0 XANH THẬT: dev
        đưa file vào `05_uiux/wireframes/SCR-27-tim-toan-van.md` (bỏ hậu tố DRAFT), commit
        trên `m13`; đổi flow sau đó = mở lại bước 1 (luật 1 của đơn vị này)
  - AC1: gõ có dấu và không dấu ra CÙNG kết quả; highlight tự tô, 0 snippet()
    cmd: node web/test/tim-toan-van.test.js
  - AC2: bấm kết quả ⇒ cửa sổ đọc mở đúng bài + cuộn đúng anchor (đo DOM)
    cmd: node web/test/tim-toan-van.test.js
  - AC3: đủ 4 trạng thái; 0-kết-quả bắn đúng MỘT tín hiệu (mock đếm)
    cmd: node web/test/tim-toan-van.test.js
  - AC4: chunk gn-tim 0 màn phát thẻ (nạp theo focus — page-weight giữ);
      markup-JS có luật CSS (vế cổng mới)
    cmd: node web/test/page-weight.test.js
  - AC5: suite web xanh
    cmd: cd web && npm test
