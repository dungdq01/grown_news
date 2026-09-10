<!-- Chuyen tu 07_plan/M02_kb/: `core/**` thuoc boundary M01_core
     (project_map: be: [core/**, ...]). M02_kb la `kb/**` — du lieu, khong phai
     cong cu sinh ra no. -->

# T01-33 — WO-019: bảng `loai_nguon` · nhập · xuất · gieo (đơn vị CODE)

> ```sql
> CREATE TABLE loai_nguon (
>   id      TEXT PRIMARY KEY,   -- 'pdf' · 'youtube' · 'paper'
>   module  TEXT NOT NULL,      -- bai-viet | tai-lieu | video
>   nhan    TEXT NOT NULL,      -- chữ hiện ra
>   thu_tu  INTEGER NOT NULL DEFAULT 0
> );
> ```
>
> Ba đường, cùng khuôn `concepts`/`categories` đã có từ FR-019:
> `dung_lai_db.py` nhập từ `loai-nguon.yaml` · `xuat_kho.py` xuất ra file đó ·
> DB là chân lý, file là export dẫn xuất.
>
> **Gieo khi bảng RỖNG** từ `loai-nguon.json` + `media-mime.json` — kho mới tinh
> phải có sẵn 14 loại nguồn. Gieo mỗi lần là xoá công người dùng, im lặng.
>
> **`loai-nguon.json` KHÔNG bị thay.** Nó sinh `CHECK` của DDL và phải đọc được
> khi DB chưa tồn tại. Bảng mới giữ thứ NGƯỜI DÙNG thấy (định dạng · nơi phát ·
> loại bài); file giữ enum của schema. Hai vai khác nhau, không phải hai bản.

phạm_vi_ghi:
  - core/assets/kho.schema.sql
  - core/tools/dung_lai_db.py
  - core/tools/xuat_kho.py

verifiability: hard
tiêu_chí:
  - AC1: bảng có, hình dạng đúng, gieo đủ khi rỗng
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_loai_nguon_db.py
  - AC2: điểm bất động file→DB→file còn giữ
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_export_dan_xuat.py
  - AC3: vòng media + chỉ mục không đổi
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_media_dan_xuat.py && python core/tests/check_media_ddl.py
  - AC4: pytest và cả bộ web còn xanh
    cmd: PYTHONIOENCODING=utf-8 python -m pytest core/tests -q && cd web && npm test
phụ_thuộc: T01-32
