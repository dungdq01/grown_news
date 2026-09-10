# T01-16 — FR-038/C1: hai bảng khai — loại nguồn + màn hình (đơn vị CODE)

> **Đây là đơn vị dồn bốn bản gõ tay về một.** `LOAI` (7 giá trị) hiện gõ tay ở
> **bốn** nơi: `kho.schema.sql:33-36` · `xuat_kho.py:37` · `dung_lai_db.py:42` ·
> `dungchung.mjs:50-51`. Và bảng view gõ tay ở **ba** nơi: `VIEW_SSR`
> (`server.mjs:149`) · `MAN` (`trang.mjs:901`) · `DUONG`
> (`multiwindow.inline.ts:1389`).
>
> C1 chỉ **khai**; consumer đấu vào ở C2 (Python) · C3 (api) · C5 (màn). Nên cổng
> của C1 **cố ý đỏ** tới khi C5 xong — nó là cổng theo dõi, giống cách A1 canh
> A2–A4.

phạm_vi_ghi:
  - core/assets/loai-nguon.json
  - core/assets/man-hinh.json

verifiability: hard
tiêu_chí:
  - AC1: `loai-nguon.json` tự nhất quán — ba module, mỗi loại thuộc ĐÚNG một
      module, và hợp cả ba bằng đúng 7 giá trị enum `source_type` của schema
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: `man-hinh.json` tự nhất quán — mỗi màn có `path` duy nhất, `id_shell`
      duy nhất, `data_nav` **thuần `[a-z]`** (ràng buộc `rail-trai.test.js:137`
      và `:167`), và nhãn ≤ 9 ký tự
    cmd: python core/tests/check_khai_mot_noi.py
  - AC3: không tầng nào gõ tay lại hai tập đó — cổng đếm bản sao. **Cố ý đỏ tới
      C5**; xanh khi cả ba tầng đọc bảng khai
    cmd: python core/tests/check_khai_mot_noi.py
phụ_thuộc: T01-15
