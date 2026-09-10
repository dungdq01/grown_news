# M10_tailieu — rules

> Ngữ pháp bốn field, giống rule khung. Tầng dưới **chỉ thêm ràng buộc, không nới**
> R1–R6, BRD, hay M09 (kho hiện vật).

```yaml
- id: M10-R1
  vi_phạm: >
    Màn `/tai-lieu/` hoặc màn nạp của nó đọc/ghi bảng `articles` hay `videos`;
    hoặc danh sách của màn hiện một bản ghi không phải `tai-lieu`.
  bề_mặt: S3          # web/test/man-tai-lieu.test.js
  lệnh: cd web && node test/man-tai-lieu.test.js
  đỏ_khi: gieo 3 bài viết + 2 video + 2 tài liệu — màn hiện nhiều hơn 2 bản ghi
  xanh_khi: cùng dữ liệu, màn hiện đúng 2, và Kho/Tổng hợp hiện cả 7
  why: >
    Người dùng nói hai lần, lần thứ hai gay hơn: *"ko gộp chung các màn và tính
    năng lại với nhau"*. FR-037 đã dựng tài liệu thành một hồ sơ TRONG màn bài
    viết, và đó là cách đọc sai phải sửa. Một màn "gần như chỉ có tài liệu" là
    màn sẽ trôi về gộp — nên luật đo bằng SỐ ĐẾM, không bằng lời khai.
    Ngoại lệ DUY NHẤT được trộn: Kho và Tổng hợp, và chúng đọc VIEW `ban_ghi`.

- id: M10-R2
  vi_phạm: >
    Form sửa tài liệu KHÔNG có ô cho `media`, tức nó dựa vào `FM_GOC` giữ hộ
    trường ngoài form.
  bề_mặt: S3          # web/test/man-tai-lieu.test.js
  lệnh: cd web && node test/man-tai-lieu.test.js
  đỏ_khi: sửa một bản `tai-lieu` bằng form KHÔNG có ô media ⇒ `media` phải mất
  xanh_khi: sửa qua form CÓ ô media ⇒ `media.sha256` không đổi một ký tự
  why: >
    Đo được hôm nay: `suaTuCua()` (`multiwindow.inline.ts:1884`) đưa bản
    `tai-lieu` vào form `#f-bai` — form không có ô nào cho `media`. Chỉ `FM_GOC`
    (`:1882`, `:3082`) giữ hộ ~40 trường ngoài form. Tức **sửa một tài liệu dựa
    vào MAY, không dựa vào cơ chế**: bỏ `FM_GOC` một lần là con trỏ `media` biến
    mất, bản ghi thành `tai-lieu` không có hiện vật, và `dung_lai_db.py` sẽ chết
    to ở lần dựng lại DB kế tiếp — tức lỗi lộ RẤT MUỘN, ở một chỗ khác hẳn.
    Một form nhìn thấy thứ nó đang sửa là cách duy nhất bỏ chữ "may".

- id: M10-R3
  vi_phạm: >
    Form nạp tài liệu ghi được bản ghi mà KHÔNG có ô chọn `category`/`concepts`
    đọc từ danh mục; hoặc nó cho gõ tự do một nhãn ngoài danh mục.
  bề_mặt: S3          # web/test/man-tai-lieu.test.js
  lệnh: cd web && node test/man-tai-lieu.test.js
  đỏ_khi: form thiếu ô nhãn, hoặc nhãn ngoài danh mục đi qua được
  xanh_khi: nhãn chọn từ `GET /api/categories`/`/api/concepts`; nhãn lạ bị chặn
  why: >
    Người dùng khai thẳng: *"cái tài liệu (pdf, ppt, docs) và url video cũng gán
    với concept và category như bài viết"*. Cổng 5/5b của `validate.py` đã áp cho
    MỌI hồ sơ nên phía máy đã chặn — nhưng người dùng gặp nó dưới dạng `422` sau
    khi đã điền xong, chứ không phải dưới dạng một ô chọn. M02-R3 nói danh mục là
    ĐÓNG và chỉ người khai nhãn; một form không có ô chọn là một form đẩy người
    dùng vào `concepts_proposed` mà họ không biết mình vừa đề xuất gì.
```
