# T01-43 — bảng khai dạng địa chỉ + phép phân giải + `citations_*` dẫn xuất (đơn vị CODE)

> `build_order` C1 · S8 + S9. Đơn vị này chỉ chạy sau khi T01-42 ĐỎ.
>
> **Nguyên lý một câu**: *địa chỉ phân giải được = trỏ vào thứ KHO CÓ*, không
> trỏ ra Internet mở. Kho là chân lý; một địa chỉ mà kho không kiểm được thì
> không khác một địa chỉ không có.
>
> **Chỗ trả giá, khai trước khi làm** (chủ dự án đã chốt 2026-09-01):
> `[§II.4]` **không** phân giải được khi nguồn nằm ngoài kho. Bản `phan-tich`
> duy nhất có 15 địa chỉ đều dạng đó, phủ **4/4** mục `CAN_LOCATOR`
> (`3.2` 6 · `3.3` 3 · `3.4` 5 · `4` 1). Cổng **không loại bài** — nó
> ép `unverifiable_citations: true`, và schema đã cấm cờ đó đi cùng
> `credibility_max: verified`. Nên agent rải `[§II.4]` vẫn vào kho được nhưng
> **vĩnh viễn không đoạt được `verified`**. Đóng G-6 mà không phá bài cũ.

phạm_vi_ghi:
  - core/assets/dia-chi.json          # MỚI — bảng khai, cùng khuôn loai-nguon.json
  - core/src/source_distiller/validate.py
  - core/pyproject.toml               # +pypdf>=6.0 (chủ dự án chốt)
  # KHAI BỔ SUNG: `kb-mock/**` là dữ liệu SINH RA. Sửa file bằng `--fix` thì
  # `sinh_kb_mock.py` (lệnh khai ở RUNNING.md:110, `check_running` chạy nó)
  # để ngược lại — đúng bài học đã ghi tại `sinh_kb_mock.py:65` cho
  # `word_count`. Nơi sinh ra thân phải là nơi tính dữ liệu dẫn xuất (M01-R2).
  - core/tools/sinh_kb_mock.py

verifiability: hard
tiêu_chí:
  - AC1: `core/assets/dia-chi.json` khai đủ 5 dạng, mỗi dạng có `mau` (regex có
      neo `^...$`), `phan_giai`, `manh`, `vi_du`; `validate.py` KHÔNG gõ tay
      dạng nào — grep `\[§|:p\.|t=` trong validate.py chỉ ra 0 dòng luật
    cmd: python core/tests/check_dia_chi.py
  - AC2: `LOCATOR_RE` cũ bị thay; mọi phép "có địa chỉ không" đọc từ bảng khai
    cmd: python core/tests/check_dia_chi.py
  - AC3: `citations_sampled` = số địa chỉ NHẬN DẠNG được, `citations_verified` =
      số PHÂN GIẢI được; cả hai do máy tính, khai lệch ⇒ đỏ (khuôn §9
      `url_normalized`)
    cmd: python core/tests/check_dia_chi.py
  - AC4: `pypdf` khai trong dependencies và `[slug:p.N]` kiểm N ≤ số trang thật
      (PDF trong kho: 23 trang ⇒ `p.7` xanh, `p.99` đỏ)
    cmd: python core/tests/check_dia_chi.py
  - AC5: kho thật đi qua được — `validate.py kb/ --strict` không đỏ vì luật mới,
      và bản `xgboost-taylor-bac-hai` ra `sampled=18 verified=0`
    cmd: python -m source_distiller.validate kb/ --strict
  - AC6: không phá gì — 42 test cũ + mọi cổng Python đang xanh vẫn xanh
    cmd: python -m pytest core/tests -q
