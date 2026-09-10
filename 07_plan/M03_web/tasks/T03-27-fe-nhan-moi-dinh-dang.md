# T03-27 — FR-039: FE thôi chặn theo đuôi, chặn theo trần (đơn vị CODE)

> `multiwindow.inline.ts:1026-1029` chặn ở client theo đuôi file rồi báo *"Chỉ
> nhận .pdf · .pptx …"*. Bỏ phép chặn đó; giữ **nguyên** phép chặn size ở
> `:1036` — nó tồn tại vì `413` KHÔNG tới được client giữa lúc upload (trình
> duyệt nhận ECONNRESET trên đường GHI trước khi kịp ĐỌC phản hồi, đo ở B5).
>
> `inp.accept` (`:1137`) đổi thành không giới hạn. Vẫn đặt LÚC CHẠY từ bảng khai,
> không gõ chuỗi vào `shell.html`.
>
> Mime gửi lên: `f.type` của trình duyệt, và nó có thể **rỗng** với định dạng lạ.
> Rỗng thì gửi `application/octet-stream` — không gửi chuỗi rỗng, vì server sẽ
> phải đoán, và đoán là thứ cả FR này lẫn `nosniff` tồn tại để tránh.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: FE không còn nhánh từ chối theo đuôi; `accept` không giới hạn
    cmd: cd web && node build-fe.mjs && node test/thu-vien-nap.test.js
  - AC2: phép chặn SIZE ở client CÒN NGUYÊN — nó là thứ duy nhất cho người dùng
      biết file quá lớn
    cmd: cd web && node test/thu-vien-nap.test.js
  - AC3: ngân sách gn.js không vượt 100 KB
    cmd: cd web && node test/page-weight.test.js
phụ_thuộc: T08-13
