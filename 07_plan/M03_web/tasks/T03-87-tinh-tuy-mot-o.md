# T03-87 — form: tinh túy là MỘT ô (đơn vị CODE)

> ⛔ T03-86 phải ĐỎ trước.
>
> Gỡ khỏi `multiwindow.inline.ts`: `themTinhTuy` · `gomTinhTuy` · `raiTinhTuy` ·
> `TT_B` · `TT_MAX` · `TT_O` · nhánh `m.so === TT_O` trong `dungKhung()` · nhánh
> `so === TT_O` trong `layMuc()` · lời gọi `raiTinhTuy` trong `doThan()`.
>
> Mục 3.4 thành mục lá bình thường: `dungKhung()` dựng một textarea,
> `raiKhung()` rải vào nó, `gomKhung()` đọc ra — cùng đường với 7 ô kia.
>
> **Đo lại `gn.js`** — dự kiến trả lại ~2 KB. Bundle đang 102314/102400.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-86 XANH
    cmd: cd web && node build-fe.mjs && node test/form-van-xuoi.test.js
  - AC2: `gn.js` dưới trần, và không cổng nào khác đỏ thêm
    cmd: cd web && npm test
phụ_thuộc: T03-86
