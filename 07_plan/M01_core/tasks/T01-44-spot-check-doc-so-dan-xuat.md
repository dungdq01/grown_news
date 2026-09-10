# T01-44 — §8 `Spot-check trượt` đọc số DẪN XUẤT như lời tự nhận thất bại (đơn vị CODE)

> Lỗ trong chính **C1**, lộ ra khi làm `WO-040`. Test tái hiện **đã ĐỎ**:
> `web/test/danh-muc-phan-trang-ep-xoa.test.js` — `phucHoi` trả **422** với
> `✗ Spot-check trượt: 0/4 locator khớp — loại cả bản`.
>
> Luật §8 cũ: `verified < sampled ⇒ loại cả bản`. Nó đúng khi hai số là **LỜI
> KHAI** — khai `verified < sampled` là tự nhận thất bại. C1 biến chúng thành số
> **MÁY ĐẾM**, và khi đó `verified < sampled` là ca **bình thường** của mọi bài
> trích nguồn ngoài kho.
>
> C1 đã xử một nửa: khi `kho` bật thì dùng `dem_gay` thay cho luật cũ. Nhưng
> nhánh `elif` (khi `kho` **tắt** — `phucHoi`, validate một file) vẫn đọc số dẫn
> xuất bằng luật cũ. Nên bài có `sampled: 4 / verified: 0` bị loại ở đường
> **phục hồi dữ liệu** — đúng chỗ dự án sợ nhất.
>
> **Không xoá hẳn luật cũ**: nó vẫn bắt được ca gốc — một bản viết tay khai
> `2/5` mà không khai cờ nào. Chỉ **bỏ qua khi bản ghi đã khai
> `unverifiable_citations: true`**, tức nó đã NÓI RA rằng trích dẫn không kiểm
> được; lúc đó `verified < sampled` là điều đã khai, không phải điều bị phát hiện.

phạm_vi_ghi:
  - core/src/source_distiller/validate.py

verifiability: hard
tiêu_chí:
  - AC1: test đang ĐỎ chuyển XANH — `phucHoi` dưới tên mới trả 200
    cmd: node web/test/danh-muc-phan-trang-ep-xoa.test.js
  - AC2: luật cũ CÒN RĂNG cho ca gốc — bản khai `sampled` > `verified` mà KHÔNG
      khai `unverifiable_citations` vẫn bị loại
    cmd: python core/tests/check_dia_chi.py
  - AC3: không phá gì — 42 test pytest + mọi cổng Python đang xanh vẫn xanh
    cmd: python -m pytest core/tests -q
phụ_thuộc: T01-43
