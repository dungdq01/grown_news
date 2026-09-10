# T03-57 — WO-024: cổng cho dải tab không đếm cứng (đơn vị TEST)

> Thêm §6 vào `web/test/format-chung.test.js`. ĐỎ trước (R5).
>
> **Đo TRUTH, không đo FORM.** Không hỏi "CSS có chuỗi `auto-flow` không" mà hỏi
> *"có màn nào mà số cột khai ra LỚN HƠN số tab thật không"* — đếm `.np-tab` trên
> cả ba màn rồi so với `repeat(N,…)` đọc từ luật `.np-tabs`.
>
> Ca âm bắt buộc: phép đếm phải **phân biệt được** ba màn. Nếu nó ra cùng một số
> cho cả ba thì tôi đang đếm sai phạm vi, và §6 xanh vì mù.
>
> Vế thứ hai: truy vấn hẹp phải đổi `grid-auto-flow`, không đổi
> `grid-template-columns` — với `auto-flow: column` thuộc tính kia vô hiệu, nên
> một truy vấn hẹp "đã sửa" trên giấy sẽ không làm gì cả.

phạm_vi_ghi:
  - web/test/format-chung.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên CSS hiện tại, nói ra màn nào thừa mấy cột
    cmd: cd web && node test/format-chung.test.js; test $? -ne 0
  - AC2: sau T03-58 XANH
    cmd: cd web && node test/format-chung.test.js
