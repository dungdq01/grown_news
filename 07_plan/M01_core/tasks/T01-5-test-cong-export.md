# T01-5 — FR-034 B2: đơn vị TEST — cổng mới trước code (R3)

phạm_vi_ghi:
  - core/tests/check_export_dan_xuat.py
  - core/tests/test_gates.py
  - core/tests/check_ci_teeth.py
verifiability: hard
tiêu_chí:
  - AC1: bốn răng — round-trip 2 chiều byte/hash-equal trên copy tạm; xuat_kho
      chỉ SELECT + server không import dung_lai_db; API không ghi file kho
      ngoài mkdtemp, mỗi COMMIT kèm banXuat; .gitignore đúng chiều
    cmd: python core/tests/check_export_dan_xuat.py
  - AC2: cổng --categories của validate — khai category ngoài danh mục bị chặn,
      thiếu file catalog = catalog_missing, None = cổng tắt
    cmd: python -m pytest core/tests/test_gates.py -k category
  - AC3: ca phá cổng category trong bộ răng-thật
    cmd: python core/tests/check_ci_teeth.py
