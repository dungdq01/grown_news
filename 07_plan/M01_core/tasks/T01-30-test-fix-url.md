# T01-30 — C6b: cổng cho `--fix` điền `url_normalized` (đơn vị TEST)

> `core/tests/check_fix_url.py` (MỚI). ĐỎ trước (R5).
>
> Vế nặng là **chiều âm**: `--fix` KHÔNG được ghi đè một `url_normalized` đã có.
> Chiều dương ("điền khi vắng") xanh cả với một cài đặt ghi đè mọi lúc — và cài
> đặt đó phá cổng 9 (`validate.py:383`), thứ duy nhất bắt lời khai lệch hàm tính.
>
> Chạy trên thư mục TẠM, không đụng `kb/` (CẤM "sửa file thật để thử một cổng").

phạm_vi_ghi:
  - core/tests/check_fix_url.py
  - core/tests/test_gates.py

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (`--fix` chưa điền `url_normalized`)
    cmd: python core/tests/check_fix_url.py
  - AC2: sau T01-29 XANH; ca âm "ghi đè" vẫn bị bắt
    cmd: python core/tests/check_fix_url.py
phụ_thuộc: T01-28
