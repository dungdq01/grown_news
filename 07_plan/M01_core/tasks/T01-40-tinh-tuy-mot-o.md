# T01-40 — bỏ cấu trúc con của tinh túy khỏi khung + validate (đơn vị CODE)

> ⛔ T01-39 phải ĐỎ trước.
>
> **1 · `khung-than-bai.json`**: bỏ khối `tinh_tuy` (`toi_da` + `bullets`), bỏ cờ
> `"tinh_tuy": true` ở mục 3.4, và đổi `goi_y` của 3.4 thành gợi ý **văn xuôi**.
> `goi_y` cũ chính là chuỗi markdown mà người dùng bảo bỏ — nó còn là byte chết
> trong bundle (ô backlog M01 mở hôm qua đóng theo bằng WO-038).
>
> **2 · `khung.py`**: bỏ `TINH_TUY_MAX` · `TINH_TUY_BULLETS` · phép đòi đúng một
> mục `tinh_tuy` (`:64-66`); `than_mau()` sinh 3.4 như mọi mục lá khác.
>
> **3 · `validate.py`**: bỏ §6 và `ESSENCE_ITEM_RE`/`ESSENCE_BULLETS`.
> **KHÔNG chạm §7** — locator vẫn là luật.
>
> Bài cũ không phải di trú: `####` không khớp regex chẻ khúc nào, nên nó ở lại
> trong văn của 3.4. Đã đo trên `kb/docs/xgboost-taylor-bac-hai.md`.

phạm_vi_ghi:
  - core/assets/khung-than-bai.json
  - core/src/source_distiller/khung.py
  - core/src/source_distiller/validate.py

verifiability: hard
tiêu_chí:
  - AC1: cổng T01-39 XANH
    cmd: python core/tests/check_khung.py
  - AC2: bài mẫu của chính khung đi qua validate --strict, và bài cũ trong kho
      (có `####` sót lại) VẪN hợp lệ — không di trú
    cmd: python -m pytest core/tests -q
phụ_thuộc: T01-39
