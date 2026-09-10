# T03-85 — chiếu bảng khai xuống trường FE thật đọc (đơn vị CODE)

> ⛔ T03-84 phải ĐỎ trước. Đã đỏ 2 mục, chỉ đích danh 6 khoá:
> `phien_ban` · `tran_tu_thu_vien` · `tran_tu_mem` · `locator` (khung) và
> `$magic_la` · `loai_thu_vien` (media).
>
> **1 · `lotComment` lột MỌI khoá `$`, không chỉ `$comment*`.** `$magic_la` là
> chú thích cho `magic` — mà `magic` đã bị chiếu ra khỏi bundle từ FR-036. Lọc
> theo tiền tố hẹp thì khoá `$` đặt tên khác lọt qua, im lặng. Đây là sửa đúng
> tên hàm đang tự nhận: nó tên là *lột comment*.
>
> **2 · Khai `BO_KHOI_BUNDLE` cho hai bảng trường**, mỗi khoá kèm lý do. Đây là
> danh sách gõ tay — nhưng T03-84 canh **hai chiều**, nên nó không trôi được:
> thừa thì đỏ ở chiều A, thiếu thì đỏ ở chiều B.
>
> **KHÔNG nới trần `gn.js`.** Đó là điều kiện tồn tại của việc này: WO-037 tốn
> ~2,1 KB trong khi trần còn 1,8 KB, và tiền lệ dự án là *SIẾT, không nới*.

phạm_vi_ghi:
  - web/build-fe.mjs

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-84 XANH
    cmd: cd web && node build-fe.mjs && node test/bang-khai-khong-mo.test.js
  - AC2: `gn.js` về DƯỚI trần, không đổi một con số trần nào
    cmd: cd web && node test/page-weight.test.js
  - AC3: không cổng nào khác đỏ thêm — nhất là cổng form, vì nó đọc `KHUNG`
    cmd: cd web && npm test
phụ_thuộc: T03-84
