# T03-67 — WO-029: ô nhập của hộp thoại đổi tên (đơn vị CODE)

> ⛔ T03-66 phải ĐỎ trước.
>
> `<input id="dlg-nhan">` → `<input id="dlg-nhan-o">` ở **cả hai** bản shell (phải
> còn byte-identical sau khi sửa). Thẻ `<dialog>` **giữ** `dlg-nhan` —
> `man-danh-muc.test.js:100` đang đòi đúng nó.
>
> FE đổi **hai** chỗ muốn cái input: vòng dọn form, và dòng đọc `label_vi`. Hai chỗ
> còn lại (`showModal`/`close`) giữ nguyên vì chúng muốn cái dialog.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-66 XANH và hai bản shell còn giống nhau từng byte
    cmd: cd web && node test/moc-fe-con-that.test.js && cmp render/shell.html plugins/home-pages/shell.html
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
