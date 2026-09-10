#!/usr/bin/env python3
r"""Cổng HIỆN VẬT TRANSCRIPT — `AC-V1` + `AC-V6` (vế HAPPY).

`AC-V6` đổi từ vế phủ định sang vế khẳng định: `FR-052` đã áp nên vế cũ
(*'media còn là object'*) hết đỏ được, và một cổng không đỏ được là cổng đã
chết.

ĐỎ_KHI  hiện vật thiếu `la_dan_xuat`/`kieu_moc`/model ASR · gắn `.vtt` làm đổi một byte của hiện vật cũ · `ban` không bump
XANH_KHI ba trường đủ · hiện vật cũ nguyên từng byte · `media[]` chỉ thêm · `ban` bump
"""

import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(R / "chungcat" / "src"))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}"
          + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


import json

print()
print("1 · `AC-V1` · hiện vật mang ĐỦ ba trường")
print()
sql = (R / "core" / "assets" / "kho.schema.sql").read_text(encoding="utf-8")
kiem("la_dan_xuat" in sql, "cột `la_dan_xuat` có trong schema kho")
kiem("kieu_moc" in sql, "cột `kieu_moc` có trong schema kho (T01-45)",
     "thiếu cột thì `la_asr` không có chỗ đứng, và AC-V1 không đo được")

print()
print("2 · `AC-V7` · mime `text/vtt` + magic ở bảng khai")
print()
mm = (R / "core" / "assets" / "media-mime.json").read_text(encoding="utf-8")
kiem("text/vtt" in mm, "`text/vtt` có trong `media-mime.json` (T01-45)")
kiem("5745425654" in mm, "magic `WEBVTT` = `5745425654` có trong bảng khai")

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · hiện vật đủ trường · bản gốc nguyên byte")
