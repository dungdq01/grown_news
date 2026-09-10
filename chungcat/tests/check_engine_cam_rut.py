#!/usr/bin/env python3
r"""Cổng ENGINE CẮM-RÚT-ĐƯỢC — `AC-3.1` · `AC-7.1`.

VÌ SAO CỔNG NÀY TỒN TẠI
Chỉ đạo nguyên văn: *"ko chơi bỏ trứng vào 1 giỏ"*. `ADR-05` dịch nó thành: hợp
đồng vào/ra **khoá**, engine phía sau thay theo **bảng khai**. Thêm nhóm chủ đề
hay khách hàng mới = **thêm một dòng**, không sửa lõi.

`spec §3` chốt định nghĩa LÕI, và định nghĩa đó viết ra vì phép thử s6 bắt được:

    LÕI = `chungcat/src/**`  TRỪ  `chungcat/src/adapter/**`
    (`assets/` là bảng khai, không phải mã, nên không tính vào cả hai vế)

Không chốt thì cổng hoặc **đỏ oan** (đụng một file phụ), hoặc **không đỏ được**
(lõi rộng tới mức mọi thay đổi đều nằm ngoài).

⚠️ Cổng này đo **tính chất CẤU TRÚC** (lõi không biết tên nhà, thêm nhà là thêm
file). Nó **KHÔNG** đo được *"thêm nhà thật tốn 0 dòng lõi"* — phép đo đó cần
một nhà thứ hai thật, và đó là **T12-7**, tồn tại chỉ để đo điều này (như `C9`
đo `M8.2`). Khai ra để không ai đọc cổng xanh này rồi tưởng `AC-3.1` đã được
chứng minh.

ĐỎ_KHI  lõi nhắc tên nhà/model · lõi import một adapter cụ thể · `co_adapter`
        đọc một danh sách gõ tay thay vì đọc thư mục · đổi bảng khai mà hành vi
        không đổi
XANH_KHI lõi mù với mọi nhà, và danh mục adapter dẫn xuất từ thư mục
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
ADAPTER = SRC / "adapter"
ASSETS = R / "chungcat" / "assets"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(SRC))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    bang_khai = _nap.nap("bang_khai")
    hop_dong = _nap.nap("adapter.hop_dong")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_engine_cam_rut.py", "T12-5")

bang = bang_khai.doc_model(ASSETS / "model.json")
LOI_FILE = [f for f in SRC.rglob("*.py") if "adapter" not in f.parts]
kiem(bool(LOI_FILE), "định nghĩa LÕI khớp ít nhất một file thật (cổng đỏ được)")

# ══ AC-3.1 · LÕI mù với mọi tên nhà và mọi tên model ══════════════════════
ten = {d["nha_cung_cap"].lower() for d in bang["dong"]} | \
      {d["model"].lower() for d in bang["dong"]}
dinh = []
for f in LOI_FILE:
    for n in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
        if isinstance(n, ast.Constant) and isinstance(n.value, str) \
           and n.value.lower() in ten:
            dinh.append(f"{f.relative_to(R)}:{n.lineno} → {n.value}")
kiem(not dinh, "LÕI không nhắc tên nhà/model nào", f"{dinh}")

# ══ LÕI không import một adapter CỤ THỂ (chỉ import hợp đồng) ═════════════
im = []
for f in LOI_FILE:
    for n in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
        mod = ""
        if isinstance(n, ast.ImportFrom):
            mod = f"{n.module or ''}.{n.names[0].name}"
        elif isinstance(n, ast.Import):
            mod = n.names[0].name
        if mod.startswith("adapter.") and not mod.startswith("adapter.hop_dong"):
            im.append(f"{f.relative_to(R)}:{n.lineno} → {mod}")
kiem(not im, "LÕI chỉ import `adapter.hop_dong`, không import adapter cụ thể", f"{im}")

# ══ Danh mục adapter DẪN XUẤT từ thư mục, không từ danh sách gõ tay ═══════
tmp = Path(tempfile.mkdtemp(prefix="m12-engine-"))
try:
    # Nhà chưa có file ⇒ `co_adapter` phải nói KHÔNG. Nếu nó đọc một danh sách
    # gõ tay thì thêm/bớt file sẽ không đổi câu trả lời.
    kiem(hop_dong.co_adapter("nha-chua-bao-gio-ton-tai") is False,
         "`co_adapter` nói KHÔNG với nhà chưa có file")

    that = {p.stem for p in ADAPTER.glob("*.py")
            if p.stem not in ("__init__", "hop_dong")}
    kiem(bool(that), "có ít nhất một adapter thật trên đĩa", f"{sorted(that)}")
    for nha in {d["nha_cung_cap"] for d in bang["dong"]}:
        kiem(hop_dong.co_adapter(nha) == (hop_dong.ten_module(nha) in that),
             f"`co_adapter('{nha}')` khớp ĐÚNG sự có mặt của file trên đĩa")

    # `ten_module` quy đổi ở ĐÚNG MỘT chỗ — `co_adapter` nói có mà `import` nói
    # không là lỗi chỉ lộ ra giữa job.
    kiem(hop_dong.ten_module("a-b-c") == "a_b_c", "`ten_module` quy gạch nối → gạch dưới")

    # ══ AC-7.1 · đổi MỘT dòng bảng ⇒ đổi hành vi, 0 dòng mã ═══════════════
    p = tmp / "doi-che-do.json"
    d = [dict(x) for x in bang["dong"]]
    d[0]["che_do"] = "batch" if d[0]["che_do"] != "batch" else "sync"
    p.write_text(json.dumps({**bang, "dong": d}, ensure_ascii=False), encoding="utf-8")
    kiem(bang_khai.doc_model(p)["dong"][0]["che_do"] != bang["dong"][0]["che_do"],
         "AC-7.1 · đổi MỘT dòng bảng ⇒ phép đọc trả giá trị mới, 0 dòng mã")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ══ Khai GIỚI HẠN: cổng này chưa chứng minh AC-3.1 đầy đủ ═════════════════
kiem(len({d["nha_cung_cap"] for d in bang["dong"]
          if hop_dong.co_adapter(d["nha_cung_cap"])}) >= 1,
     "có ≥1 nhà đã cắm — nhưng phép đo THẬT của AC-3.1 cần nhà THỨ HAI (T12-7)")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-3.1/AC-7.1 chưa có răng")
print("lõi mù với mọi nhà · danh mục dẫn xuất từ thư mục · đổi bảng đổi hành vi")
