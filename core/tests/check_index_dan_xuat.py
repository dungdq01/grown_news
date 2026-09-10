#!/usr/bin/env python3
"""RETIRED — FR-034 (2026-08-26).

Cổng này canh 6 tính chất của `kb/_index.sqlite` — index DẪN XUẤT của kiến
trúc FR-023 (file là chân lý). FR-034 đảo nguồn chân lý sang `kb/_kho.sqlite`:
index chết theo (API SELECT thẳng kho), nên cả 6 phép kiểm mất đối tượng.

Cổng THAY THẾ: `python core/tests/check_export_dan_xuat.py` — 4 răng đối xứng
gương (round-trip 2 chiều · xuat_kho chỉ SELECT · API không ghi file kho ·
.gitignore đúng chiều). Đã vào Makefile + CI từ B2 của FR-034.

File này chờ xoá vật lý ở bước dọn C7; giữ stub để đường gọi cũ không nổ.
"""
print("retired · FR-034 — xem check_export_dan_xuat.py")
