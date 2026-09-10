# T03-60 — WO-026: hai phép kiểm chết trong `filter-counts` (đơn vị TEST)

> Đo được khi chạy: `nhãn đếm "(trống — danh mục rỗng)"` ⇒ `if (mCc)` không chạy
> và **không in dòng nào**; `soTrongHang` rỗng nên `.every` đúng vô điều kiện.
>
> Bản render riêng gieo 3 khái niệm với **3 · 2 · 1** lượt dùng — thứ tự đúng
> phải là `3 2 1`, và nó phân biệt được với mọi thứ tự khác.
>
> **Bằng chứng ĐỎ ĐƯỢC (kiểm hai chiều):** phá `.sort` ở `trang.mjs:590` ⇒ ĐỎ
> `1 2 3`; phục hồi ⇒ sha256 `5d0d03b9be187164` y hệt và xanh lại. Trước bản vá,
> cùng phép phá đó **không sinh lỗi nào**.
>
> Hai phép tự kiểm vật liệu bắt buộc: `> 0` hàng nhãn, và `>= 2` hàng mang số.
> Dưới 2 thì `.every` lại đúng vô điều kiện — chết ở chỗ mới.

phạm_vi_ghi:
  - web/test/filter-counts.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng xanh, và in ra số liệu THẬT (3 hàng · 3/3 · `3 2 1`)
    cmd: cd web && node test/filter-counts.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
