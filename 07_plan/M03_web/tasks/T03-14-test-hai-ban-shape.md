# T03-14 — FR-036/B7a: cổng bản-song-sinh cho `Ban` (đơn vị TEST)

> Tách khỏi T03-13 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> **Vì sao cổng này đáng tồn tại riêng**: `hai-duong-doc-khop.test.js` retired ở
> FR-034 với lý do *"chỉ còn MỘT đường đọc"* — nhưng điều đó chỉ đúng cho **kho
> thật**. `duLieuMock()` vẫn quét đĩa, nên hai hàm dựng `Ban` vẫn tồn tại song
> song, và từ FR-034 tới nay **không cổng nào** so chúng. Cổng bị gỡ để lại một
> khoảng trắng mà không ai khai.

phạm_vi_ghi:
  - web/test/hai-ban-shape.test.js
  - web/package.json
  - web/test/WORKLOG.md
  - web/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: so TẬP KHOÁ hai bên, hai chiều — thiếu ở real và thiếu ở mock là hai
      lỗi khác nhau, phải nêu riêng
    cmd: cd web && node test/hai-ban-shape.test.js
  - AC2: ba ca giá trị — `tai-lieu` mang `ho_so`+`media`; vắng `ho_so` ⇒
      `phan-tich`; vắng `media` ⇒ `null` (không `undefined`, không `""`)
    cmd: cd web && node test/hai-ban-shape.test.js
  - AC3: file test trong chuỗi `npm test`, được nhắc trong `test/WORKLOG.md`,
      và số liệu ở `web/WORKLOG.md` khớp thực tế
    cmd: cd web && node test/nut-song.test.js
phụ_thuộc: T03-13
