# T01-20 — FR-038/C2: cổng round-trip phải gieo ĐỦ BA BẢNG (đơn vị TEST)

> `check_export_dan_xuat.py:gieo()` gieo `repo` + `article` + một bản `.v1`. Sau
> FR-038 **cả ba đều vào `bai_viet`** ⇒ cổng round-trip — răng hard của B-C1 đảo —
> **XANH trên một bản cài đặt làm 1/3 việc**. `tai_lieu` và `video` không có một
> hàng nào đi qua vòng `file → DB₁ → file′ → DB₂` của nó.
>
> Đây là lỗ **có sẵn** (S11 trong plan); tách bảng làm nó thành lỗ nguy hiểm.
>
> Gieo thêm ba hình dạng, mỗi hình dạng bịt một cách xanh-vô-căn-cứ:
>
> **`tai-lieu/trung-ten.md`** — cùng `slug` với hai bản kia nhưng ở **bảng thứ
> ba**. Hình dạng "trùng slug khác source_type" (FR-023 GĐ 3) giờ trải qua ba
> bảng, và đó là ca dễ vỡ nhất của phép tách: `slug` một mình không còn là khoá.
>
> **`tai-lieu` có `media` THẬT + byte trong `_media/`** — nhánh `tai_lieu` của
> view `tham_chieu_media` phải sống sót cả vòng round-trip. Thiếu byte thì
> `dung_lai_db.py` chết to (M09-R1) nên byte phải gieo TRƯỚC .md.
>
> **`video/…`** — bảng thứ ba, không byte, đăng ký URL.
>
> `gieo()` trả `(thêm bài, thêm bản lưu trữ)`; số bài tăng từ 2 lên 4.

phạm_vi_ghi:
  - core/tests/check_export_dan_xuat.py

verifiability: hard
tiêu_chí:
  - AC1: cổng vẫn XANH sau khi gieo đủ ba bảng — điểm bất động còn đạt khi kho có
      cả tài liệu (kèm hiện vật) và video
    cmd: python core/tests/check_export_dan_xuat.py
  - AC2: cổng ĐỎ được nếu một bảng rơi khỏi vòng round-trip — chứng minh bằng cách
      bỏ một nhánh của `ban_ghi` rồi đòi đỏ, sau đó hoàn tác khớp byte
    cmd: python core/tests/check_export_dan_xuat.py
  - AC3: không hồi quy — cả bộ cổng Python
    cmd: python core/tests/check_ba_bang.py && python core/tests/check_media_dan_xuat.py
phụ_thuộc: T01-19
