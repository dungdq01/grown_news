# T01-29 — C6b: `--fix` điền `url_normalized` — MỘT công thức (đơn vị CODE)

> `validate.py:289` đòi video hồ sơ `thu-vien` khai `url_normalized`, và cổng 9
> (`:383`) so lời khai với `normalize_url()`. Nên đường nạp video ở FE phải có
> trường đó — và FE **không được tự tính**: viết lại phép chuẩn hoá bằng JS là
> bản THỨ HAI của `normalize_url()`, đúng lớp lỗi *"hai công thức, không ai đối
> chiếu"* đã trúng ở `dongBoThe` (`nut-song.test.js` §6 kể cả câu chuyện).
>
> `--fix` **đã** tự điền `word_count` theo cùng nguyên tắc "dữ liệu dẫn xuất",
> và `ghiSauValidate` gọi `validate.py` với `--fix` (thấy trong lời 422:
> *"fix … word_count = 3"*). Nên chỗ đúng để điền là ở đây: một công thức, chạy
> ở một nơi, và FE chỉ gửi `url` thô.
>
> **CHỈ điền khi VẮNG.** Ghi đè một lời khai có sẵn là xoá bằng chứng của cổng 9 —
> cổng đó tồn tại để bắt lời khai LỆCH hàm tính, và một `--fix` ghi đè làm nó
> không bao giờ đỏ được nữa.
>
> **CHỈ điền khi `normalize_url()` trả về giá trị.** Host lạ thì nó trả rỗng, và
> ghi một chuỗi rỗng vào frontmatter là khai một trường không có nội dung.

phạm_vi_ghi:
  - core/src/source_distiller/validate.py

verifiability: hard
tiêu_chí:
  - AC1: bản `video` khai `url` mà VẮNG `url_normalized` ⇒ `--fix` điền, và bản
      ghi qua được `--strict`
    cmd: python core/tests/check_fix_url.py
  - AC2: `url_normalized` ĐÃ CÓ mà LỆCH hàm tính ⇒ `--fix` KHÔNG ghi đè, và cổng
      9 vẫn ĐỎ. Đây là vế nặng: ghi đè làm cổng 9 không bao giờ đỏ được nữa
    cmd: python core/tests/check_fix_url.py
  - AC3: host ngoài whitelist ⇒ không điền chuỗi rỗng
    cmd: python core/tests/check_fix_url.py
  - AC4: không hồi quy — `word_count` vẫn được điền; cả bộ cổng Python
    cmd: python core/tests/check_fix_url.py && python -m pytest core/tests -q
phụ_thuộc: T01-28
