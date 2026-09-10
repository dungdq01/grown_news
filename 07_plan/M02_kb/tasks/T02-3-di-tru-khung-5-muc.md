# T02-3 — FR-036: di trú bài thật sang khung 5 mục

> `kb/**` là EXPORT sau FR-034, nên di trú không phải "sửa file rồi xong":
> sửa export → `dung_lai_db.py` (file→DB, người chạy) → `xuat_kho.py` về fixpoint.

phạm_vi_ghi:
  - kb/repo/hermes-agent.md
verifiability: hard
tiêu_chí:
  - AC1: bài thật qua cổng hình dạng 0 lỗi và KHÔNG còn cảnh báo trần mềm
      (1580 → dưới 1500 từ); tỉ lệ dẫn nhập dưới trần
    cmd: python core/src/source_distiller/validate.py kb/ --no-concepts --no-categories
  - AC2: round-trip file→DB→file đạt fixpoint (lần xuất thứ hai ghi 0 file) và
      hash nội dung DB không đổi giữa hai lần dựng
    cmd: python core/tests/check_export_dan_xuat.py
phụ_thuộc: T01-6
