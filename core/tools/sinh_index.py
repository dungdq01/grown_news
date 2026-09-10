#!/usr/bin/env python3
"""RETIRED — FR-034 (2026-08-26).

Script này sinh `kb/_index.sqlite` — index DẪN XUẤT của kiến trúc FR-023.
FR-034 đảo nguồn chân lý sang `kb/_kho.sqlite`; phần parser của file này đã
kế thừa vào hai tool thay thế:

    python core/tools/dung_lai_db.py   # file→DB (migrate/seed — đường duy nhất)
    python core/tools/xuat_kho.py      # DB→file (export — đường duy nhất)

Exit 1 CÓ CHỦ ĐÍCH: một cron/script cũ còn gọi nó phải kêu to, không im lặng
sinh ra một index không ai đọc. Chờ xoá vật lý ở bước dọn C7.
"""
import sys

sys.exit("retired · FR-034 — dung dung_lai_db.py / xuat_kho.py thay the")
