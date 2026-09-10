# [Space] T01-91 — ontology PER-SPACE (cột) + `validate.py` kiểm theo space

> Spike R3: ba file yaml là **DẪN XUẤT của DB** (`xuat_kho.py:216-218`), bảng
> thật nhỏ (`concepts` 5 · `categories` 11 · `loai_nguon` 14) ⇒ per-space làm
> ở BẢNG rẻ nhất; yaml vẫn là export, **84 consumer không đổi hình dạng file**.
> CHẶN CỨNG: sau `T01-90` (cột space) VÀ sau **`T01-51` merge** (checklist
> §2.1 — cùng đụng `validate.py`).
> phụ_thuộc: T01-90, T01-51
> ID rule 13: T01-91.

## Hình dạng

- Ba bảng danh mục `+ space TEXT NOT NULL DEFAULT 'mac-dinh'` + index; PK mỗi
  bảng thành `(space, id)` — **khác** bản ghi nội dung: một khái niệm "RAG"
  của Công nghệ và "RAG" của Thể thao là HAI nhãn khác nhau, còn slug bài thì
  duy nhất toàn hệ (ADR-09 lối A). Sự khác biệt này phải ghi ngay trong DDL.
- `validate.py`: kiểm `category`/`concepts` của một bản ghi **trong space của
  chính nó**; bản ghi space A dùng nhãn của space B ⇒ ĐỎ nêu rõ hai space.
- **KHÔNG** ontology dùng chung đợt này (spike R3 — "Tin tức" xuất hiện ở hai
  space là hai hàng, không phải một hàng chia sẻ). Gộp là bài toán sau.

phạm_vi_ghi:
  - core/assets/kho.schema.sql              # FROZEN — cùng FR-080 (một lần ký cho cả hai đợt DDL)
  - core/src/source_distiller/validate.py   # kiểm danh mục theo space
  - core/tools/di_tru_space.py              # di trú thêm ba bảng danh mục

verifiability: hard
tiêu_chí:
  - AC1: bản ghi space A khai concept CHỈ có ở space B ⇒ validate ĐỎ, thông
      điệp nêu ĐÚNG hai space (không chỉ "khái niệm lạ")
    cmd: python core/tests/check_dinh_dang_mo.py
    đỏ_khi: nhãn chéo space vẫn qua
    xanh_khi: đỏ đúng + nhãn cùng space thì xanh
  - AC2: hai space có cùng id nhãn (`tin-tuc`) ⇒ CẢ HAI tồn tại, không đè nhau
    cmd: python core/tests/check_danh_muc.py
  - AC3: di trú ba bảng danh mục idempotent; yaml export vẫn đúng hình dạng cũ
    cmd: python core/tools/di_tru_space.py --kiem && python core/tests/check_khung.py
  - AC4: nền không vỡ
    cmd: python -m pytest core/tests -q
