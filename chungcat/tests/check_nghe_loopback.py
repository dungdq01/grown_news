#!/usr/bin/env python3
r"""Cổng NGHE LOOPBACK — `AC-1.2` · `Z3` · `Z6`.

VÌ SAO CỔNG NÀY TỒN TẠI
`M08-R1` là *"không nghe NGOÀI `127.0.0.1`"*, và `FR-045` sửa `Z3` thành: **chỉ
dịch vụ khai `nghe_ngoai: true` trong `dich-vu.json` được nghe ngoài loopback,
và hiện có ĐÚNG MỘT** (`cong/`). `chungcat` khai `false` ⇒ bind `0.0.0.0` là
biến một dịch vụ THỢ giữ **toàn bộ khoá model** thành bề mặt Internet.

Và `Z6` — *"cổng khai MỘT nơi"*: số cổng phải ĐỌC TỪ `dich-vu.json`. Gõ `8790`
trong mã là chỗ thứ hai nó xuất hiện, và chỗ thứ hai sẽ lệch.

ĐỎ_KHI  bind `0.0.0.0`/`::` · số cổng gõ tay trong mã · `chungcat` khai
        `nghe_ngoai: true` · đổi số trong bảng khai mà mã không đổi theo
XANH_KHI bind đúng loopback và số cổng dẫn xuất từ bảng khai
"""

import ast
import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "chungcat" / "src"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(SRC))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    api = _nap.nap("api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_nghe_loopback.py", "T12-6")

BANG = R / "core" / "assets" / "dich-vu.json"
dv = next(x for x in json.loads(BANG.read_text(encoding="utf-8"))["dich_vu"]
          if x["thu_muc"] == "chungcat")

# ══ Z3 · chungcat KHÔNG được khai `nghe_ngoai: true` ══════════════════════
kiem(dv.get("nghe_ngoai") is False,
     "`chungcat` khai `nghe_ngoai: false` trong bảng khai dịch vụ",
     f"khai {dv.get('nghe_ngoai')!r}")
ngoai = [x["ten"] for x in json.loads(BANG.read_text(encoding="utf-8"))["dich_vu"]
         if x.get("nghe_ngoai")]
kiem(len(ngoai) == 1, "đúng MỘT dịch vụ trong toàn bảng khai được nghe ngoài loopback",
     f"thấy {ngoai}")

# ══ Z6 · số cổng ĐỌC TỪ bảng khai, không gõ tay ═══════════════════════════
kiem(api.cong_tu_bang_khai() == int(dv["cong"]),
     "phép đọc trả đúng số cổng của bảng khai", f"{api.cong_tu_bang_khai()} vs {dv['cong']}")

src = (SRC / "api.py").read_text(encoding="utf-8")
so_cong = [n.value for n in ast.walk(ast.parse(src))
           if isinstance(n, ast.Constant) and isinstance(n.value, int)
           and 1024 <= n.value <= 65535]
kiem(not so_cong, "không số cổng nào gõ tay trong MÃ `api.py` (Z6)", f"thấy {so_cong}")

# ══ AC-1.2 · bind ĐÚNG loopback ═══════════════════════════════════════════
# Hàng đợi ở THƯ MỤC TẠM, không phải trong repo. `WO-039` đã bắt đúng lớp lỗi
# này ở `check_running`: một cổng ghi vào repo làm `git status` bẩn, và công cụ
# quy chủ (*"ai vừa sửa gì"*) mù đi ở đúng lúc cần nó nhất. Bản đầu của cổng này
# trỏ `goc_hang_doi` vào `chungcat/hang-doi-cong-thu` — tức mắc lại lỗi đã có WO.
_tmp = Path(tempfile.mkdtemp(prefix="m12-bind-"))
try:
    s = api.chay(goc_hang_doi=_tmp / "hang-doi", cong=0)
    try:
        dia_chi = s.server_address[0]
        kiem(dia_chi in ("127.0.0.1", "::1"), "bind đúng loopback", f"bind {dia_chi}")
        kiem(dia_chi not in ("0.0.0.0", "::", ""), "KHÔNG bind mọi giao diện")
    finally:
        s.server_close()
finally:
    shutil.rmtree(_tmp, ignore_errors=True)

# Và địa chỉ bind trong MÃ phải là loopback — đo TẠI CHỖ GỌI, không quét cả file.
#
# Bản đầu của cổng này quét MỌI hằng chuỗi và liệt `""` vào danh sách cấm ⇒
# ĐỎ OAN, vì `api.py` có chuỗi rỗng ở chỗ khác (mặc định của `headers.get`).
# `""` chỉ có nghĩa "mọi giao diện" KHI nó là đối số bind — nên phép đo phải
# nhìn vào lời gọi `*HTTPServer((host, port), …)`, không nhìn vào văn bản.
CAM = {"0.0.0.0", "::", ""}
bind = []
for n in ast.walk(ast.parse(src)):
    if not (isinstance(n, ast.Call) and n.args):
        continue
    ten = getattr(n.func, "id", None) or getattr(n.func, "attr", None) or ""
    if "HTTPServer" not in ten:
        continue
    dau = n.args[0]
    if isinstance(dau, ast.Tuple) and dau.elts:
        h = dau.elts[0]
        # Hằng chuỗi ⇒ đọc thẳng. Biểu thức (vd `or`) ⇒ lấy mọi hằng chuỗi trong nó.
        for c in ast.walk(h):
            if isinstance(c, ast.Constant) and isinstance(c.value, str):
                bind.append(c.value)
kiem(bool(bind), "tìm được lời gọi `*HTTPServer((host, port), …)` trong mã")
kiem(all(b not in CAM for b in bind),
     "địa chỉ bind trong mã KHÔNG phải hằng mọi-giao-diện",
     f"thấy {bind}")
kiem(all(b in ("127.0.0.1", "::1") for b in bind),
     "địa chỉ bind trong mã là loopback tường minh", f"thấy {bind}")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-1.2 / Z3 / Z6 chưa có răng")
print("bind loopback · cổng đọc từ bảng khai · đúng một dịch vụ nghe ngoài")
