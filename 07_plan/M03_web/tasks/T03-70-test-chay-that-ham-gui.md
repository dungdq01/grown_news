# T03-70 — WO-031: cổng CHẠY THẬT hai hàm gửi (đơn vị TEST)

> Thêm §6 vào `web/test/moc-fe-con-that.test.js`. ĐỎ trước (R5) — và nó tái
> hiện **đúng câu người dùng thấy**: *"Không gọi được /api/video — máy chủ chưa
> chạy?"*.

> **Vì sao phải GỌI chứ không ĐỌC:** `node --check` chỉ bắt cú pháp; một
> `ReferenceError` là lỗi lúc chạy. Và tôi vừa đọc chính đoạn đó khi sửa WO-028
> mà không thấy. Mọi cổng FE của dự án đều đọc mã hoặc markup.

> **Sandbox:** `with` trên một `Proxy` — `has` trả true cho mọi tên, `get` trả
> stub cho tên module biết trước và **NÉM** cho tên lạ. Nên một biến mất khai
> báo lộ ngay.

> **Vế quyết định, và là vế lượt đầu tôi đo THIẾU:** hàm có `try/catch` RIÊNG,
> nên lỗi bên trong **không ném ra ngoài**. Đo "có ném không" là đo sai chỗ —
> phải đo **thứ người dùng thấy**: câu cuối `kqTV` phải là *"Đã ghi …"*.

> Hai lỗi harness lượt đầu, cả hai là ĐO SAI chứ không phải mã sai: phép cắt bỏ
> mất từ khoá `async` (⇒ *"await is only valid in async functions"*), và ô nhập
> giả thiếu `setAttribute`.

phạm_vi_ghi:
  - web/test/moc-fe-con-that.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ và in ra ĐÚNG câu người dùng thấy
    cmd: cd web && node test/moc-fe-con-that.test.js; test $? -ne 0
  - AC2: sau T03-71 XANH
    cmd: cd web && node test/moc-fe-con-that.test.js