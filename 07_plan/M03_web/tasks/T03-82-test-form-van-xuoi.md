# T03-82 — WO-037: cổng cho form chỉ nhận văn xuôi (đơn vị TEST)

> `web/test/form-van-xuoi.test.js` (MỚI). ĐỎ trước (R5).
>
> **§1 · Không ô nhập nào GỢI Ý cú pháp markdown.** Quét `placeholder` của mọi
> `textarea`/`input` trong form viết bài, cấm `##` · `###` · `####` · `**`.
> Suy danh sách ô từ `khung-than-bai.json`, không gõ tay.
>
> **§2 · Ô tinh túy có cấu trúc CON.** Bảng khai đánh dấu `tinh_tuy: true` cho
> một mục; mục đó phải sinh ra nhiều ô nhỏ, không phải một textarea. Đo bằng
> **số ô con**, không đo tên id — id là thứ tôi tự đặt.
>
> **§3 · `gomKhung()` sinh markdown cho tinh túy.** Năm nhãn bullet lấy TỪ
> `khung-than-bai.json` (`tinh_tuy.bullets`), không gõ tay trong cổng.
>
> **§4 · Không còn chế độ thô.** Không `[data-soan]`, không `#f-tho-o`.
> **VÀ vế nặng:** `gomKhung` phải TRẢ VỀ chuỗi — `#f-than` là đích lắp ráp, xoá
> thẻ mà không đổi hàm là mất đường gửi thân bài.
>
> **§5 · Chốt an toàn.** Mở một bài có thân KHÔNG khớp khung ⇒ phải BÁO và không
> mở form. Đo trên hàm, vì đây là chỗ mất dữ liệu nếu làm ẩu.

phạm_vi_ghi:
  - web/test/form-van-xuoi.test.js
  # `four-screens` khai HỢP ĐỒNG CŨ: nó đòi hai nút `[data-soan]` phải có mặt,
  # với lý do 'chế độ thô là ĐƯỜNG THOÁT cho bài không khớp khung'. Người dùng
  # đã chốt bỏ hẳn chế độ đó, và WO-037 thay đường thoát bằng chốt an toàn ở
  # `dienForm`. Khai thêm file này TRƯỚC khi chạm, không nới lúc đang sửa.
  - web/test/four-screens.test.js
  - web/package.json
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên mã hiện tại, nêu ô nào còn markdown
    cmd: cd web && node test/form-van-xuoi.test.js; test $? -ne 0
  - AC2: sau T03-83 XANH
    cmd: cd web && node test/form-van-xuoi.test.js
