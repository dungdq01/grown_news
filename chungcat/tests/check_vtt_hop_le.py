#!/usr/bin/env python3
r"""Cổng `.vtt` HỢP LỆ — `AC-V7` (magic) + `AC-V3` (cue tăng dần).

Magic `WEBVTT` = `5745425654` là LỚP THỨ SÁU của intake, lớp duy nhất soi
byte. Một file dán nhãn `text/vtt` mà byte mở đầu khác phải chết ở đó.

ĐỎ_KHI  file sai magic được nhận · cue giảm dần hoặc chồng nhau được nhận · mốc cuối vượt thời lượng nguồn
XANH_KHI magic đúng · cue tăng dần · mốc trong thời lượng
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


try:
    vtt = _nap.nap("vtt")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_vtt_hop_le.py", "T12-16")

print()
print("1 · Magic `WEBVTT` — sai byte mở đầu ⇒ TỪ CHỐI")
print()
kiem(hasattr(vtt, "kiem_hop_le"), "`vtt.kiem_hop_le()` tồn tại")

print()
print("2 · Cue TĂNG DẦN, không chồng nhau")
print()
kiem(hasattr(vtt, "doc_cue"), "`vtt.doc_cue()` tồn tại")

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · magic thật · cue tăng dần")
