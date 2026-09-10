# T01-4 — FR-034 B1+B3: DDL, hai tool một chiều, cổng --categories

Theo plan đã duyệt 2026-08-26 (giai đoạn B). Ghi chú: `.gitignore` (gốc repo)
đổi cùng đơn vị này — khai ở FR-034 vì boundary module không biểu diễn được
file gốc; reviewer đối chiếu FR.

phạm_vi_ghi:
  - core/assets/kho.schema.sql
  - core/tools/dung_lai_db.py
  - core/tools/xuat_kho.py
  - core/src/source_distiller/validate.py
verifiability: hard
tiêu_chí:
  - AC1: migrate kho thật (1 bài + 2 yaml) vào DB rồi export lại — `git status` sạch
      (byte-equal); export 2 lần cùng hash (--kiem)
    cmd: python core/tools/xuat_kho.py --kiem
  - AC2: dựng DB từ export xong validate kho export vẫn xanh
    cmd: python core/src/source_distiller/validate.py kb/ --strict
phụ_thuộc: T08-4
