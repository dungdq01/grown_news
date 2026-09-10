#!/usr/bin/env python3
r"""Cổng `M12-R8` + `AC-V2`/`AC-V3`/`AC-V5` — ASR local KHÔNG gọi mạng.

Quét bằng AST, không bằng `in`: chuỗi `egress` trong một chú thích không phải
một lời gọi, và một cổng phạt người viết vì đã viết ra lý do là cổng dạy người
ta đừng viết lý do.

ĐỎ_KHI  `asr.py` import `egress` · có lời gọi mạng trong đường ASR · bảng `nguon_transcript` không đổi được hành vi mà không sửa mã
XANH_KHI 0 lời gọi mạng trong đường ASR local · bảng khai đổi lối với 0 dòng mã
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

try:
    _nap.nap("asr")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_asr_khong_egress.py", "T12-16")

print()
print("1 · `M12-R8` · đường ASR local không nhắc egress")
print()
f = R / "chungcat" / "src" / "asr.py"
cay = ast.parse(f.read_text(encoding="utf-8"))
ten_nhap = []
for n in ast.walk(cay):
    if isinstance(n, ast.Import):
        ten_nhap += [a.name for a in n.names]
    elif isinstance(n, ast.ImportFrom) and n.module:
        ten_nhap.append(n.module)
kiem("egress" not in ten_nhap, "`asr.py` KHÔNG import `egress`", str(ten_nhap))

goi_mang = [f"{f.name}:{n.lineno}" for n in ast.walk(cay)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
            and n.func.attr in ("post", "stream", "request", "urlopen")]
kiem(not goi_mang, "0 lời gọi mạng trong `asr.py`", str(goi_mang))

print()
print("2 · `AC-V5` · bảng khai `nguon_transcript` đổi lối, 0 dòng mã")
print()
bk = R / "chungcat" / "assets" / "nguon-transcript.json"
kiem(bk.exists(), "bảng khai `nguon-transcript.json` tồn tại")

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · ASR local 0 egress · bảng khai đổi lối")
