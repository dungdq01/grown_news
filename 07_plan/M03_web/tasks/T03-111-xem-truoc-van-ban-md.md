# T03-111 — XEM TRƯỚC văn bản thuần (.md · .txt) trong cửa sổ đọc

> Chủ dự án bắt trên màn thật 2026-09-05: nạp `linux-foundation.md` thành công
> (sau 2 hotfix slugGoiY + media-mảng) nhưng cửa sổ đọc TRẮNG — mime ngoài
> bảng bị viewer trả rỗng. Hotfix PM đã cho rơi về `mac_dinh` (thẻ + nút tải);
> đơn vị này làm phần THẬT: hiện NỘI DUNG văn bản ngay trong cửa sổ.
> ID theo rule.md mục 9: ls max 110 ⇒ 111.

## Hình dạng

- Bảng khai `media-mime.json` (đất M01 — một dòng, kèm $vi_sao): thêm
  `text/markdown` (.md) và `text/plain` (.txt), `xem_truoc: "van-ban"`.
  $vi_sao phải KHAI THẲNG đánh đổi: văn bản thuần KHÔNG có magic byte —
  chấp nhận yếu lớp soi-byte cho hai mime này (tiền lệ $vi_sao của text/vtt
  giải thích vì sao từng né application/json; ở đây né không được nữa vì
  .md là nguyên liệu chưng cất chính của người dùng).
- Viewer (multiwindow): nhánh `xem_truoc === "van-ban"` — fetch
  `/api/articles/media/<sha>` dạng text, hiển thị trong khối cuộn.
  **AN TOÀN trên hết**: đổ chữ bằng `textContent`/escape — TUYỆT ĐỐI không
  innerHTML nội dung file (cổng no-dangerous-html đang canh); render
  markdown-đẹp là đợt sau nếu chủ dự án muốn, đợt này chữ thuần đọc được là
  đạt. Trần đọc: chỉ fetch khi so_byte ≤ ngưỡng (bảng khai, vd 512KB) —
  quá thì rơi về thẻ + tải.
- Giữ nút "tải về" trong mọi nhánh.

phạm_vi_ghi:
  - core/assets/media-mime.json                    # +2 dòng (đất M01 — bảng khai, không frozen)
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # nhánh van-ban
  - web/styles/prototype.css                       # khối .hv-txt cuộn
# cổng thuộc đơn vị test đi kèm T03-111b nếu sinh file test mới (khuôn 110b)

verifiability: hard
tiêu_chí:
  - AC1: bản ghi media text/markdown ⇒ cửa sổ đọc hiện NỘI DUNG chữ (đọc được
      dòng đầu file), không trắng; vẫn có nút tải về
    cmd: node web/test/hien-that.test.js
    đỏ_khi: vùng xem trước rỗng với mime text/markdown
    xanh_khi: chữ của file xuất hiện trong markup
  - AC2: nội dung chứa "<script>alert(1)</script>" hiển thị NHƯ CHỮ, không
      thực thi — đổ bằng textContent/escape
    cmd: node web/test/no-dangerous-html.test.js
  - AC3: so_byte vượt ngưỡng bảng khai ⇒ rơi về thẻ+tải, không fetch
    cmd: node web/test/hien-that.test.js
  - AC4: mime lạ ngoài bảng vẫn rơi về mac_dinh (giữ hotfix), suite xanh
    cmd: cd web && npm test

# AS-BUILT 2026-09-05 03:4x — PM cài phần LÕI (chủ dự án chờ xem .md):
#   · media-mime +text/markdown +text/plain (xem_truoc van-ban, $vi_sao khai
#     đánh đổi không-magic) + tran_van_ban_byte 512KB
#   · viewer: nhánh van-ban + napVanBanXemTruoc() — fetch sau innerHTML, đổ
#     bằng textContent (AC2: no-dangerous-html xanh); quá trần rơi về thẻ+tải
#   · .hv-txt TỐI GIẢN (110B — gn.css đang sát trần bởi dev in-flight)
#   Cổng xanh: token-only · markup-matches-css · no-dangerous-html · hien-that.
# CÒN CHO DEV: (1) vế cổng chuyên biệt AC1/AC3 (fixture .md trong hien-that);
#   (2) style .hv-txt đẹp hơn KHI gn.css có chỗ (T03-104 đợt 2 nếu cần);
#   (3) page-weight đang đỏ bởi thay đổi SONG SONG của dev (trang chủ +541B ·
#   css +~400B kể từ mốc T03-110) — trả xanh lúc bàn giao đơn vị đang mở.
