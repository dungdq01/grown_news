# T12-24 — bản chưng cất kế thừa `category` + `concepts` của bài gốc

> `WO-056` ①. Chủ dự án: *"nhãn concept và category gán đúng như bài viết gốc"*.
>
> ID: M12 dev lấy 20-29. Max dev = 23 ⇒ 24.

## Hỏng IM LẶNG, và vì sao không ai báo

`_dung_nhap` ghi `source_type: article` (đúng — bài chưng cất VÀO danh sách bài
viết) nhưng **không ghi `category` lẫn `concepts`**.

`frontmatter.schema.json` `required` có 11 trường, **không có hai trường ấy**.
Nên bản nháp qua `validate.py --strict` sạch, cổng `check_nhap_duyet_duoc` xanh,
mà bài lên site nhãn RỖNG. Đo trên `kb/tai-lieu/linux-foundation.md`:
`category:` trống, `concepts:` trống.

> Lỗi của tôi ở `T12-20`: task file liệt kê `category`·`concepts` phải điền,
> lúc thi công lại đo bằng `--strict` — mà `--strict` không đòi hai trường đó.
> **Để THƯỚC quyết định phạm vi thay vì để YÊU CẦU quyết định.** Cổng xanh
> không có nghĩa yêu cầu đã xong; nó chỉ có nghĩa cổng ấy không nói gì.

## Hình dạng

- `_dung_nhap` **đọc frontmatter bài gốc** rồi chép `category` + `concepts`.
- **CHÉP, không sinh.** Không hỏi model đặt nhãn: nhãn là dữ liệu người đã
  duyệt trên bài gốc, còn nhãn model bịa thì không ai đối chiếu nổi và nó vào
  thẳng bộ lọc.
- Gốc **vắng nhãn** ⇒ bản chưng cất cũng vắng, không bịa mảng rỗng giả vờ đầy.
- `nguon` ghi **slug có tiền tố loại** (`tai-lieu/linux-foundation`), khớp
  `FR-067`. Bản trước ghi slug trần ⇒ nay `origin: pipeline` sẽ bị schema từ
  chối, tức lỗi này KHÔNG còn im lặng được nữa.

phạm_vi_ghi:
  - chungcat/src/worker.py     # `_dung_nhap` đọc fm gốc, chép nhãn, `nguon` đủ khuôn
# Cổng `chungcat/tests/check_ke_thua_nhan.py` thuộc ĐƠN VỊ TEST `T12-8`.

phụ_thuộc: T01-47 · FR-067

verifiability: hard
tiêu_chí:
  - AC1: `category` + `concepts` của bản nháp KHỚP bài gốc
    cmd: python chungcat/tests/check_ke_thua_nhan.py
    đỏ_khi: bản nháp thiếu nhãn trong khi gốc CÓ
  - AC2: gốc vắng nhãn ⇒ nháp vắng, không bịa
    cmd: python chungcat/tests/check_ke_thua_nhan.py
  - AC3: `nguon` mang tiền tố loại và qua được schema `FR-067`
    cmd: python chungcat/tests/check_ke_thua_nhan.py
    đỏ_khi: ghi slug trần ⇒ `origin: pipeline` bị từ chối
  - AC4: bản nháp vẫn đi qua `validate.py --strict` (nền T12-20 không vỡ)
    cmd: python chungcat/tests/check_nhap_duyet_duoc.py
  - AC5: nền giữ xanh
    cmd: python -m pytest core/tests -q
