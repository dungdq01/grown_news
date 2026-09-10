# T03-28 — FR-039: cổng hành vi cho định dạng mở (đơn vị TEST)

> `web/test/dinh-dang-mo.test.js` (MỚI). Viết **trước** T08-13/T03-13, ĐỎ trước.
>
> Đo HÀNH VI qua HTTP thật, không đo chuỗi trong mã: nạp một file `.xyz`, rồi
> GET lại nó và đọc ĐẦU ĐỀ trả về. Một cổng đọc mã nguồn sẽ xanh ngay cả khi
> `phucVuHienVat` có một nhánh sớm trả 404 trước khi tới chỗ đặt đầu đề.
>
> Vế nặng là **chiều âm**: định dạng lạ mà phục vụ `inline` hoặc mang
> `content-type` đoán từ tên file là đúng lỗ mà FR-039 §0 nói sẽ không mở.
>
> Cộng ca `ten_goc` độc: `a".pdf` · `a\nb.pdf` · `../../etc/passwd` — `filename=`
> phải không mang ký tự nào trong số đó.

phạm_vi_ghi:
  - web/test/dinh-dang-mo.test.js
  - web/test/thu-vien.test.js
  - web/test/thu-vien-nap.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (mime lạ ⇒ 415 lúc nạp)
    cmd: cd web && node test/dinh-dang-mo.test.js; test $? -ne 0
  - AC2: sau T08-13 + T03-13 XANH, và có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T01-24
