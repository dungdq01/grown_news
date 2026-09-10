# T03-24 — FR-036/B5: test đường nạp hiện vật qua HTTP (đơn vị TEST)

> Tách khỏi T08-7 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> Thêm vào `thu-vien.test.js` một mục §7 chạy **server thật** — khác §1–§6 gọi
> thẳng hàm. Hai tầng cố ý: hàm đúng mà route không nối là đúng lớp lỗi
> `duong-api-khop-route.test.js` sinh ra để chặn, và kiểm từng bên xanh KHÔNG
> suy ra chỗ nối xanh.

phạm_vi_ghi:
  - web/test/thu-vien.test.js

verifiability: hard
tiêu_chí:
  - AC1: bốn mã trả về đo trên server thật — 201 · 413 · 415 · 422, mỗi mã một ca
    cmd: cd web && node test/thu-vien.test.js
  - AC2: `x-ten-goc` mang đường dẫn (`../../etc/passwd`) ⇒ trả về đã bị lọc sạch
      dấu phân cách; và tên thường thì KHÔNG bị đổi (không lọc quá tay)
    cmd: cd web && node test/thu-vien.test.js
  - AC3: vòng đầy đủ qua HTTP — nạp byte, tạo bản ghi trỏ vào nó, GET lại thấy
      `media` trong frontmatter; và bản ghi với sha256 bịa bị 422
    cmd: cd web && node test/thu-vien.test.js
phụ_thuộc: T08-7
