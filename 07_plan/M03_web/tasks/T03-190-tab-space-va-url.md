# [Space] T03-190 — TAB BAR space + URL hậu tố + sidebar theo space — WIREFRAME TRƯỚC

> ADR-09 · ý tưởng gốc §2.1/§7. Tab chỉ là **công tắc**; scoping đã xong ở
> tầng dữ liệu (T01-90 · T08-90) trước khi động vào FE — đúng thứ tự tài liệu
> gốc tự dặn.
> SÁU LUẬT chống-sửa-lại (khuôn T03-125) áp nguyên: wireframe TRỌN FLOW một
> lượt · hành-vi-sau-hành-động đặc tả sẵn · byte đo TRƯỚC + chunk riêng ·
> markup-JS phải có vế cổng CSS · nhãn tự giải thích · đủ trạng thái đợt đầu.
> CHẶN CỨNG: sau `T08-90` và **`T04-91` (R4) XANH** — không dựng tab trên một
> tầng dữ liệu chưa chứng minh được là không rò.
> phụ_thuộc: T08-90, T04-91
> ID: M03 đã dùng tới T03-137 ⇒ dải Space ở M03 là **190+** (rule 13 điều chỉnh).

## BƯỚC 1 — WIREFRAME `05_uiux/wireframes/SCR-24-tab-space.md` (NGƯỜI duyệt)

- Tab bar **trong khối nội dung**, trên tiêu đề module; nav rail trái GIỮ
  NGUYÊN (ý tưởng gốc §2.1 — đã chốt phạm vi UI).
- Vẽ đủ: 1 space (tab bar ẩn hay hiện?) · 3 space · >6 space (cuộn ngang hay
  gom `⌄ Khác`) · space 0 bản ghi (tự ẩn — rủi ro §10) · nút `+` (chỉ `chu`).
- Sidebar cùng cấu trúc, số liệu đổi theo space; ô đếm ở header đổi theo.
- URL: `/video/` (mặc định) · `/video/<space>/`; Back/Forward đúng; copy link
  mở đúng space; nhớ space cuối (khuôn `sessionStorage` T03-105).
- 4 trạng thái: đang tải · lỗi service · space rỗng · space bị ẩn.

## BƯỚC 2 — CODE (sau duyệt SCR-24)

- `man-hinh.json` thêm chiều URL hậu tố (bảng khai — route dẫn xuất, không gõ
  cứng); `catNap()` + 7 cổng quét-mọi-trang phải hiểu chiều mới.
- JS tab vào **chunk riêng** `gn-space.js` (khuôn cctab, nạp theo yêu cầu) —
  đo `gn.js`/`gn.css` TRƯỚC khi viết dòng đầu, ghi số vào worklog.

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-24-tab-space.md
  - core/assets/man-hinh.json                      # chiều URL hậu tố (FR-056: chủ M03)
  - web/render/trang.mjs
  - web/plugins/spacetab/src/spacetab.inline.ts    # MỚI — chunk riêng
  - web/render/assets.mjs
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-24 duyệt TRỌN FLOW trước mọi dòng mã bước 2
  - AC1: `/video/<space>/` trả 200 + đúng danh sách space đó; `/video/` giữ
      nguyên hành vi cũ (0 redirect — ADR-09 lối A giữ URL hiện tại)
    cmd: node web/test/ssr-routes.test.js
    đỏ_khi: URL cũ đổi hành vi, hoặc space lạ trả 500 thay vì 404 nói rõ
    xanh_khi: cả hai đường đúng
  - AC2: sidebar + ô đếm đổi theo space (đo markup hai space khác nhau)
    cmd: node web/test/tab-space.test.js
  - AC3: space 0 bản ghi TỰ ẨN khỏi tab bar; nút `+` chỉ hiện với `chu`
    cmd: node web/test/tab-space.test.js
  - AC4: chunk `gn-space` nạp theo yêu cầu (0 màn phát thẻ) — page-weight giữ
    cmd: node web/test/page-weight.test.js
  - AC5: suite web xanh
    cmd: cd web && npm test
# cổng `web/test/tab-space.test.js` thuộc ĐƠN VỊ TEST **T03-192** (R1).
