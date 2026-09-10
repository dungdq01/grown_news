# T03-58 — WO-024: dải tab sinh cột theo số tab có mặt (đơn vị CODE)

> ⛔ T03-57 phải ĐỎ trước.
>
> `.np-tabs` đổi `grid-template-columns:repeat(3,1fr)` sang
> `grid-auto-flow:column;grid-auto-columns:1fr` — đúng bản đã chữa cho `.dm-tabs`.
> Truy vấn hẹp đổi sang `grid-auto-flow:row`.
>
> Đo lại `gn.css` (đang 96 KB / 100) và chạy `opacity-khong-pha-contrast` +
> `markup-matches-css`.

phạm_vi_ghi:
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-57 XANH
    cmd: cd web && node test/format-chung.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
