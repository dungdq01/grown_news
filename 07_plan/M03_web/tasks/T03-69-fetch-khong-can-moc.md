# T03-69 — WO-030: tách phép fetch khỏi mount (đơn vị CODE)

> ⛔ T03-68 phải ĐỎ trước.
>
> `napMotDanhMuc` nhận **phần tử** (có thể `null`) thay vì id, fetch trước, và ghi
> vào mốc **chỉ khi** có mốc. `napLoaiDanhMuc` bỏ `if (!moc.length) return []`,
> truyền `moc[0] ?? null`.
>
> Đổi chữ ký ⇒ kiểm **mọi** nơi gọi: chỉ có một, đã đổi.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-68 XANH
    cmd: cd web && node test/moc-fe-con-that.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
