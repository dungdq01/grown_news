# T03-46 — WO-016: cổng cho ba ô nhãn trên đường nạp (đơn vị TEST)

> `web/test/o-nhan-nap.test.js` (MỚI). ĐỎ trước (R5).
>
> **Vì sao đơn vị này BẮT BUỘC, không phải thêm cho đủ:** T08-17 vừa đặt luật
> server đòi `≥1 category` + `≥1 concepts` cho tài liệu/video. Hai màn nạp có
> **0** `<select>`, nên hiện tại nạp một tài liệu qua UI là **422 mà không có ô
> nào để điền**. Luật và ô phải về cùng lượt; để lệch là làm sản phẩm xấu hơn
> trước khi có luật.
>
> **Ba điều phải đo, và không điều nào là "có chuỗi trong file":**
>
> 1. Hai view nạp có mốc đổ danh mục, và mốc khai bằng **thuộc tính** chứ không
>    bằng id gõ cứng — `napDanhMuc` gõ hai id (`f-cpt`, `f-cat`) thì form thứ ba
>    im lặng không được nạp, đúng bệnh `#acount` của WO-015.
> 2. `napDanhMuc` nạp **mọi** mốc, không phải hai mốc đầu.
> 3. Hai hàm gửi (`ghiBanGhiThuVien` · `ghiVideo`) đưa `category` + `concepts`
>    vào frontmatter chúng POST. Không có vế này thì ô hiện ra mà giá trị không
>    đi đâu — và server sẽ trả 422 đúng như khi chưa có ô.
>
> **Ca âm:** nếu tôi để hai hàm gửi đọc mốc của form BÀI VIẾT (`f-cat`) thì §3
> vẫn xanh trong khi hai form kia gửi nhãn của một form khác. Phép kiểm phải đòi
> mỗi hàm đọc mốc CỦA NÓ.

phạm_vi_ghi:
  - web/test/o-nhan-nap.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (hai màn nạp không có ô nhãn nào)
    cmd: cd web && node test/o-nhan-nap.test.js; test $? -ne 0
  - AC2: sau T03-47 XANH, và có trong `npm test`
    cmd: cd web && npm test
