# ~~T03-98 — THÁO `/dot-hai/`~~ · **SUPERSEDED 2026-09-03**

> ⛔ **KHÔNG THI CÔNG.** Chủ dự án quyết khác, nguyên văn:
> *"/doi-hai coi như overview của các module phase 2: note và ẩn nó đi"*.
>
> ⇒ `/dot-hai/` **giữ URL**, `menu: false`, gỡ button rail + luật icon mồ côi.
> Đơn vị thi công điều đó: **`T03-103-an-dot-hai-khoi-menu.md`** — đã XONG.
>
> Vì sao quyết đó đúng hơn "tháo": `rule 5` cấm **GOM** các module vào một URL,
> nó **không** cấm một trang toàn cảnh. Và `/dot-hai/` là thứ duy nhất hôm nay
> trả lời được *"đợt hai đang đứng ở đâu"* — bằng số đọc từ hợp đồng mẫu, không
> bằng chữ gõ tay. Bốn màn thay thế chưa dựng.
>
> File này giữ lại làm **hồ sơ vì-sao-đổi** (đây là lần đổi hướng thứ NĂM của
> cùng một màn — số liệu cho `s10-retro`, ghi ở `screen_inventory.md`). Xoá nó
> là xoá lịch sử; ID `T03-98` **không** được dùng lại.

## Nội dung gốc (không còn hiệu lực)

# T03-98 — THÁO `/dot-hai/` (chạy CUỐI đợt FE, sau khi /chung-cat/ sống)

> Rule 5 + quyết PM trong T03-97: trang gom là hướng bị bỏ. Tháo đúng 5 lớp
> như lần gỡ 2026-09-01 (đã có tiền lệ + script khuôn): man-hinh.json (mục
> dot-hai + dồn vi_tri) · shell ×2 (nút + view) · trang.mjs (builder + nhánh)
> · prototype.css (khối .dh-*) · i18n nav.dothai. KHÔNG tháo trước khi
> /chung-cat/ trả 200 — người dùng không được rơi vào khoảng trống.

phạm_vi_ghi:
  - core/assets/man-hinh.json
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: grep dot-hai/dothai/dh- trên 5 file = 0; /chung-cat/ vẫn 200
    cmd: node web/test/ssr-routes.test.js
  - AC2: suite web xanh toàn bộ sau tháo
    cmd: cd web && npm run build && npm test
