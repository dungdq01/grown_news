#!/usr/bin/env python3
r"""Cổng TẢI TỪ URL — `T12-17` + `AC-V4`.

`tai_ve` VẪN là lời gọi ra Internet dù không gửi dữ liệu của ta đi. Nên nó
vẫn phải qua cửa egress duy nhất, host vẫn phải trong allowlist — chỉ khác là
dòng log ghi `tieu_egress: false`.

ĐỎ_KHI  domain ngoài bảng khai tải được · `yt_dlp.download()` gọi thẳng không qua egress · `tieu_egress` ghi `true` cho lối `tai_ve`
XANH_KHI domain ngoài bảng bị từ chối TRƯỚC request · mọi byte qua `egress.gui()` · `tieu_egress: false`
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


import ast
import json

try:
    _nap.nap("tai_nguon")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_tai_url_allowlist.py", "T12-17")

print()
print("1 · Allowlist domain ở BẢNG KHAI, chặn TRƯỚC request")
print()
bk = R / "chungcat" / "assets" / "nguon-transcript.json"
kiem(bk.exists(), "bảng khai `nguon-transcript.json` tồn tại")
if bk.exists():
    d = json.loads(bk.read_text(encoding="utf-8"))
    kiem("host_cho_phep" in d, "bảng khai có `host_cho_phep`", str(sorted(d)))

print()
print("2 · Mọi byte đi qua `egress.gui()` — kể cả `tai_ve`")
print()
f = R / "chungcat" / "src" / "tai_nguon.py"
cay = ast.parse(f.read_text(encoding="utf-8"))
tho = [f"{f.name}:{n.lineno}" for n in ast.walk(cay)
       if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
       and n.func.attr in ("download", "urlretrieve", "urlopen")]
kiem(not tho, "0 lời gọi tải THẲNG ngoài `egress.gui()`", str(tho))

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · allowlist chặn trước request · tai_ve qua cửa egress")
