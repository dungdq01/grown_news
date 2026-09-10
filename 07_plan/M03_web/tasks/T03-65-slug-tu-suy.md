# T03-65 — WO-028: hai hàm gửi tự suy slug (đơn vị CODE)

> ⛔ T03-64 phải ĐỎ trước.
>
> `ghiVideo` và `ghiBanGhiThuVien` thôi đọc `vd-slug`/`tv-slug` (đã gỡ ở WO-021),
> tự suy bằng `slugGoiY(tiêu đề || một câu)` — cùng công thức bài viết dùng.
>
> Dọn ba mồ côi của cùng lần gỡ: gợi ý slug từ tên file, listener gợi ý slug từ
> câu tóm tắt, và điền slug khi mở một bản để sửa. Cộng `veDuongGhi()` +
> hai listener của nó — thẻ `f-duong-v` cũng đã bị gỡ.
>
> Đo lại trần sau `node build-fe.mjs`.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-64 XANH
    cmd: cd web && node test/moc-fe-con-that.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
