# T03-33 — WO-012: cổng cho UI ba màn loại (đơn vị TEST)

> `web/test/ui-ba-man.test.js` (MỚI). ĐỎ trước (R5).
>
> Đo THỨ NGƯỜI DÙNG THẤY, không đo chuỗi CSS. Ba phép đo có nghĩa:
>
> **Đối chiếu với màn Tổng hợp** thay vì gõ danh sách thành phần: màn loại phải
> có ĐỦ những khối mà màn Tổng hợp có (`.fl` lọc · `.sortb` sắp · `.mb` dải).
> Gõ tay danh sách thì hôm nào Tổng hợp thêm một khối, ba màn loại lại tụt lại mà
> không cổng nào thấy.
>
> **Dải của màn loại phải nói số KHÁC nhau** giữa ba màn — nếu ba dải cùng một
> con số thì chúng đang nói số cả kho, tức đúng lỗi WO-012 mục 5. Vế này bắt được
> thứ "có dải" không bắt được.
>
> **Trạng thái rỗng KHÔNG nằm trong `.grid`** — đo bằng vị trí trong chuỗi, vì đó
> chính là nguyên nhân câu bị xuống dòng giữa.
>
> Cộng: `.mid` có `min-height` dùng đơn vị viewport · nút header của `/tai-lieu/`
> không mang chữ "viết bài" · màn nạp tài liệu không mang chữ "lớp cổng".

phạm_vi_ghi:
  - web/test/ui-ba-man.test.js
  - web/test/cac-man-con-lai.test.js
  - web/test/real-vs-mock.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại, và nói ra từng khối còn thiếu
    cmd: cd web && node test/ui-ba-man.test.js; test $? -ne 0
  - AC2: sau T03-32 XANH, có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T03-31
