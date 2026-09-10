# T08-14 — FR-040: ba đường API riêng, mỗi đường mang cổng của module nó (đơn vị CODE)

> `?nhom=` (FR-038/C4) đã tách **dữ liệu**. Cái còn gộp là **LUẬT**: cả ba loại đi
> qua một `taoBai`, và luật riêng của từng module sống dưới dạng lệnh `if` bên
> trong nó. Thêm luật cho tài liệu là sửa cái hàm mà bài viết cũng đi qua — đúng
> *"gộp chung tính năng"* người dùng cấm, chỉ ở tầng không nhìn thấy trên màn hình.
>
> ```
> GET POST  /api/bai-viet · /api/tai-lieu · /api/video
> GET PUT PATCH DELETE  /api/<nhom>/:type/:slug
> ```
> `/api/articles**` **GIỮ làm bí danh, không xoá**: FE dựng URL thẳng ở bốn chỗ
> sửa đổi (`multiwindow.inline.ts:1196·1289·1323·2249`) và FR-024 đã một lần làm
> vỡ đúng đó — người dùng báo *"duyệt, loại, sửa, bỏ đều không hoạt động"*.
>
> **Đo được trước khi viết**: whitelist host video hiện **chỉ** cưỡng chế ở FE
> (`multiwindow.inline.ts:1184`); server KHÔNG kiểm. POST thẳng vào API lưu được
> một bản video với URL bất kỳ. Cổng `/api/video` là lần đầu luật đó có mặt ở
> phía server.
>
> `api-guard` răng 1 (handler không có lời gọi fs ghi) và răng 2 (mọi ghi sau
> `validate.py`) **không được nới**. Tách route ≠ mỗi file tự viết SQL: mỗi route
> mang **cổng**, rồi cùng gọi một đường ghi.
>
> `:type/:slug` dưới một nhóm phải thuộc nhóm đó — `/api/video/paper/x` là lỗi
> phân loại, không phải "không tìm thấy".

phạm_vi_ghi:
  - web/api/router.mjs
  - web/api/cong-module.mjs
  - web/api/articles.mjs

verifiability: hard
tiêu_chí:
  - AC1: ba đường mới trả 200 và CHỈ trả bản của module mình (chiều âm)
    cmd: cd web && node test/route-theo-module.test.js
  - AC2: cổng RIÊNG có thật — POST `/api/tai-lieu` thiếu `media` ⇒ 422; POST
      `/api/video` thiếu `url` ⇒ 422; host ngoài whitelist ⇒ 422
    cmd: cd web && node test/route-theo-module.test.js
  - AC3: `:type/:slug` sai nhóm ⇒ 400 nói ra lỗi PHÂN LOẠI, không nói 404
    cmd: cd web && node test/route-theo-module.test.js
  - AC4: `/api/articles**` vẫn chạy đủ CRUD — không hồi quy
    cmd: cd web && node test/api-crud.test.js && node test/vong-doi-bai.test.js
  - AC5: `api-guard` răng 1+2 vẫn xanh; M08-R5 lột trường server-quyết ở CẢ BA đường
    cmd: cd web && node test/api-guard.test.js && node test/route-theo-module.test.js
  - AC6: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T08-13
