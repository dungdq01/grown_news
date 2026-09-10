# T03-71 — WO-031: xoá `oS` sót, sửa hai lỗi đường tài liệu (đơn vị CODE)

> ⛔ T03-70 phải ĐỎ trước.

> 1. Xoá hai dòng `if (oS) oS.value = ""` — `oS` mất khai báo từ WO-028.
> 2. `ghiBanGhiThuVien` POST vào `/api/tai-lieu`, không vào bí danh
>    `/api/articles` — bí danh bỏ qua cổng riêng của module.
> 3. Nhánh PUT: `title` chuyển VÀO `frontmatter` trong `body`. Trước đó nó là
>    một khoá của `fetch(init)` và bị bỏ qua im lặng ⇒ sửa tài liệu mất tiêu đề.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-70 XANH — cả hai hàm báo "Đã ghi" và gọi đúng đường
    cmd: cd web && node test/moc-fe-con-that.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test