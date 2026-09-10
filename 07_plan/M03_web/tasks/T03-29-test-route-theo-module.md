# T03-29 — FR-040: cổng cho ba đường API riêng (đơn vị TEST)

> `web/test/route-theo-module.test.js` (MỚI). Viết **trước** T08-14, ĐỎ trước.
>
> Vế nặng: **cổng riêng phải có THẬT**, không phải ba tên gọi của một hàm. Cách
> duy nhất chứng minh là bắt mỗi đường TỪ CHỐI thứ đường kia nhận:
> `/api/tai-lieu` thiếu `media` ⇒ 422 · `/api/video` thiếu `url` ⇒ 422 ·
> `/api/video` host ngoài whitelist ⇒ 422. Nếu ba đường chỉ là bí danh thì cả ba
> ca này đều 201 và mọi phép kiểm "trả đúng loại" vẫn xanh.
>
> Cộng chiều âm phân loại: `/api/video/paper/x` phải nói ra là lỗi PHÂN LOẠI. Trả
> 404 ở đó là nói sai chỗ — người gọi đọc rồi đi sửa slug trong khi cái sai là
> đường.
>
> Và M08-R5 ở **cả ba** đường: client đặt `review_status`/`origin` phải bị lột.
> Một route mới quên lột là một lỗ, và nó không lộ ra ở đường cũ.

phạm_vi_ghi:
  - web/test/route-theo-module.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (ba đường chưa tồn tại ⇒ 404)
    cmd: cd web && node test/route-theo-module.test.js; test $? -ne 0
  - AC2: sau T08-14 XANH, và có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T03-28
