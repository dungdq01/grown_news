# T08-13 — FR-039: nhận mọi định dạng, phục vụ định dạng lạ dưới octet-stream (đơn vị CODE)

> `luuHienVat` hiện từ chối 415 nếu `mime` ngoài enum. Bỏ cửa đó — nhưng **chỉ**
> cửa đó. Định dạng đã biết GIỮ magic-byte; định dạng lạ không có chữ ký để so
> nên lớp thứ sáu **không tồn tại** với chúng (không phải "yếu đi").
>
> `hienVatPhucVu` hiện trả `null` cho mime ngoài enum ⇒ 404. Đổi: trả khối
> `mac_dinh` — `application/octet-stream`, đuôi lọc từ `ten_goc`, `xem_truoc`
> không phải `iframe` ⇒ `phucVuHienVat` tự cho `attachment`.
>
> **Đuôi file phải LỌC**: chỉ `[a-z0-9]{1,8}` lấy từ `ten_goc`, không có thì bỏ
> hẳn. `ten_goc` là chuỗi của người gửi và nó đi vào `filename=` — dấu ngoặc kép
> hay newline ở đó là đường tách đầu đề. Đây là lý do đuôi hôm nay lấy từ bảng
> khai chứ không từ tên gốc, và lý do đó KHÔNG mất đi khi bảng thôi làm cổng.
>
> `mime` vẫn phải qua phép kiểm HÌNH DẠNG trước khi vào `content-type`.

phạm_vi_ghi:
  - web/api/dungchung.mjs
  - web/api/articles.mjs

verifiability: hard
tiêu_chí:
  - AC1: file `.xyz` mime lạ NẠP ĐƯỢC (chiều dương)
    cmd: cd web && node test/dinh-dang-mo.test.js
  - AC2: định dạng lạ phục vụ ra `application/octet-stream` + `attachment` —
      chiều ÂM, vế nặng: nạp được mà vẫn `inline` là đúng thứ nguy hiểm
    cmd: cd web && node test/dinh-dang-mo.test.js
  - AC3: `.pdf` VẪN `application/pdf` + `inline` + magic-byte — không hồi quy
    cmd: cd web && node test/dinh-dang-mo.test.js && node test/thu-vien.test.js
  - AC4: `ten_goc` chứa `"` / newline / `../` ⇒ `filename=` không mang chúng
    cmd: cd web && node test/dinh-dang-mo.test.js
  - AC5: vượt trần 25 MB vẫn 413; không hồi quy cả bộ
    cmd: cd web && npm test
phụ_thuộc: T01-23
