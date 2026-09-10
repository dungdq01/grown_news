# T03-13 — FR-036/B7a: `Ban` mang `ho_so` + `media` ở CẢ HAI nguồn (đơn vị CODE)

> `web/render/data.mjs` có **hai** hàm dựng `Ban` — `banTuDb` (kho thật, đọc DB)
> và `docTuDia` (kb-mock, quét đĩa). Hai danh sách trường **gõ tay**, và **không
> cổng nào** so chúng: `hai-duong-doc-khop.test.js` đã retired ở FR-034.
>
> Đây đúng lớp lỗi "bản song sinh" mà repo đã trúng bốn lần. Thêm một trường vào
> một bên là cách FE nhận `undefined` ở bản mock trong khi bản real chạy đúng —
> và bug đó chỉ lộ khi có người bấm nút REAL/MOCK.
>
> `ho_so` **thiếu ⇒ `phan-tich`** (khớp `validate.py` và schema): không bản ghi cũ
> nào phải sửa. `media` thiếu ⇒ **`null`**, không `undefined` và không `""` —
> một hình dạng ổn định là thứ FE kiểm được bằng một phép thử.

phạm_vi_ghi:
  - web/render/data.mjs

verifiability: hard
tiêu_chí:
  - AC1: tập khoá của `Ban` từ `duLieuReal()` và từ `duLieuMock()` **bằng nhau** —
      răng cho bản song sinh, thứ chưa có cổng nào canh
    cmd: cd web && node test/hai-ban-shape.test.js
  - AC2: bản ghi `tai-lieu` có `ho_so: "thu-vien"` và `media.sha256` đi qua tới
      `Ban`; bản ghi không khai `ho_so` ⇒ `"phan-tich"`; không khai `media` ⇒ `null`
    cmd: cd web && node test/hai-ban-shape.test.js
  - AC3: không hồi quy — mọi màn/số đếm/SSR vẫn đúng
    cmd: cd web && npm test
phụ_thuộc: T08-8
