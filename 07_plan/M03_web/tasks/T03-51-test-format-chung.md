# T03-51 — WO-021: cổng cho MỘT format chung + bố cục hai cột (đơn vị TEST)

> `web/test/format-chung.test.js` (MỚI). ĐỎ trước (R5).
>
> **§1 · BA form CÙNG một bộ trường cố định.** Đo bằng TẬP GIAO và TẬP HIỆU, không
> bằng "có ô X": ba màn phải có cùng năm trường (`tiêu đề` · `tóm tắt` · `mô tả` ·
> `chủ đề` · `khái niệm`), và phần KHÁC nhau chỉ được là thứ đang nạp.
>
> Ca âm: nếu tôi thêm ô vào một màn mà quên hai màn kia thì "màn A có tiêu đề"
> vẫn xanh. Tập hiệu bắt được điều đó.
>
> **§2 · Bốn trường đã GỠ không còn trong form, nhưng VẪN đi vào payload.** Gỡ ô
> mà không tự điền thì schema trả 422 — và 422 đó xuất hiện sau khi người dùng gõ
> xong. Phép kiểm đòi cả hai vế: không có ô, và hàm gửi có giá trị.
>
> **§3 · Cổng module KHÔNG còn chặn** (người dùng chốt bỏ). POST tài liệu/video
> thiếu chủ đề ⇒ **201**, không 422. Đây là đảo một phép kiểm cũ, nên nó phải đo
> qua HTTP thật — không đọc chuỗi trong `cong-module.mjs`.
>
> **§4 · Nhãn đổi từ "bắt buộc" sang "nên có"** ở hai ô nhãn. Một ô ghi "bắt buộc"
> mà server nhận khi trống là màn nói sai về luật.
>
> **§5 · Bố cục HAI CỘT.** Đo được hiện trạng: `.f-row` `max-width: 600px` trong
> panel **1344px** ⇒ trống **715px = 53%**. Phép kiểm đòi tỷ lệ trống dưới ngưỡng
> ở bề rộng rộng, và về MỘT cột ở bề rộng hẹp. Đo bằng CSS (`grid-template-columns`
> của khối bao), không bằng ảnh chụp.

phạm_vi_ghi:
  - web/test/format-chung.test.js
  - web/test/thu-vien-nap.test.js
  - web/test/nap-ba-khung.test.js
  - web/test/mo-ta-va-nut-nap.test.js
  - web/test/nhan-bat-buoc.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại, nói ra màn nào lệch trường nào
    cmd: cd web && node test/format-chung.test.js; test $? -ne 0
  - AC2: sau T03-52 XANH, và có trong `npm test`
    cmd: cd web && npm test
