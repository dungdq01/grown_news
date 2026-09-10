# T03-23 — FR-038/C4: cổng cho lọc-theo-nhóm + BỐN builder (đơn vị TEST)

> Đơn vị không phải `test` không được chạm file test (R1), nên phần cổng của C4
> tách ra đây. Viết **trước** T08-12 và phải **ĐỎ trước** (R5).
>
> Hai cổng:
>
> **1 · `web/test/loc-theo-nhom.test.js` (MỚI)** — chiều ÂM nặng hơn chiều dương:
> `?nhom=bai-viet` phải KHÔNG trả bản `tai-lieu`/`video`. Nếu một hôm ai đó cài
> `?nhom=` thành no-op "cho khỏi lỗi" thì chiều dương vẫn xanh (mọi bản đều có mặt)
> và chỉ chiều âm bắt được.
> Cộng ba răng: nhóm lạ ⇒ **400** không phải 200 rỗng · thân phản hồi `?nhom=video`
> nhỏ hơn hẳn bản không lọc (đo HÀNH VI, không đo chuỗi SQL) · `?nhom=bai-viet` trả
> đủ **năm** loại, không phải chỉ loại đầu bảng.
>
> **2 · `web/test/hai-ban-shape.test.js`** — mở từ hai builder lên **bốn**:
> `banTuDb` · `docTuDia` (đã canh) + `chiMucMo` · `theBai` (chưa ai canh).
> So **tập khoá** giữa bốn bên, không so giá trị — giá trị khác nhau là đúng.
> Ngoại lệ phải khai tường minh: `theBai` cố ý KHÔNG mang `than` (thẻ danh sách
> không kèm thân bài) và `chiMucMo` dùng khoá `url` khác `url_normalized`. Khai
> ngoại lệ ra chữ, không nới phép so thành "gần giống".

phạm_vi_ghi:
  - web/test/loc-theo-nhom.test.js
  - web/test/hai-ban-shape.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng mới ĐỎ trên code hiện tại (chưa có `?nhom=`) và nói ra lý do
    cmd: cd web && node test/loc-theo-nhom.test.js; test $? -ne 0
  - AC2: cổng bốn builder ĐỎ trên code hiện tại vì `theBai` thiếu ho_so/media
    cmd: cd web && node test/hai-ban-shape.test.js; test $? -ne 0
  - AC3: sau T08-12 cả hai XANH, và cổng mới có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T08-11
