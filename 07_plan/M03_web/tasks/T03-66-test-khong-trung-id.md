# T03-66 — WO-029: không id nào trùng trong shell (đơn vị TEST)

> Thêm §4 vào `web/test/moc-fe-con-that.test.js`. ĐỎ trước (R5): `dlg-nhan×2` ở
> **cả hai** bản shell.
>
> §1 của cổng đó hỏi *"mốc có tồn tại không"* — **không** hỏi *"có đúng một
> không"*. Một id trùng thì `getElementById` trả **phần tử đầu tiên**, im lặng,
> không cảnh báo nào.
>
> Quét **cả hai** bản shell (chúng phải byte-identical), kèm phép tự kiểm vật
> liệu `> 50 id` — regex hỏng thì phép dưới đúng vô điều kiện.
>
> Cộng một vế **hành vi**: ô "Tên hiển thị" phải là `<input id="dlg-nhan-o">`, và
> `guiPopupNhan` phải đọc đúng ô đó. Đo tên thẻ, không chỉ đo id — nếu `G()` trả
> về thẻ bao thì `.value` là `undefined` và nhãn gửi lên luôn rỗng.

phạm_vi_ghi:
  - web/test/moc-fe-con-that.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên shell hiện tại, nêu tên id trùng
    cmd: cd web && node test/moc-fe-con-that.test.js; test $? -ne 0
  - AC2: sau T03-67 XANH
    cmd: cd web && node test/moc-fe-con-that.test.js
