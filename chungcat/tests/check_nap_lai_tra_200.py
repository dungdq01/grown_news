# -*- coding: utf-8 -*-
"""`FR-071` · nạp lại một việc ĐÃ CÓ trả `200`, không `201`.

ĐỎ_KHI   lần nạp thứ hai trả `201` · `da_co` vắng · hàng đợi thành hai việc ·
         hoặc hai ULID KHÁC NHAU mà lần hai trả `200` (đỏ oan ngược)
XANH_KHI `201` → `200` kèm `da_co: true` và `viec_id` CŨ, hàng đợi vẫn MỘT việc

VÌ SAO — `201 Created` cho một lần không tạo gì là một câu NÓI DỐI, và cái vòng
nó khép lại tự nuôi chính nó:

    mã trả về sai → màn báo "đã tạo việc" lần hai → người bấm lại → lại 201

Không bước nào trong vòng đó báo lỗi. Phép idempotent vẫn ĐÚNG suốt (`AC-5.1`,
hàng đợi luôn một việc) — hỏng là ở chỗ cửa **không NÓI ĐƯỢC** nó vừa đi đường
nào, vì `nap()` cũ trả `ulid` cho cả hai đường.

`FR-071 §2.2` chọn giá trị trả về chứ không chọn một hàm `da_co(ulid)` riêng:
hàm tra riêng là hai lời gọi cho một câu hỏi, và giữa hai lời gọi có một khoảng
để trạng thái đổi — đúng lớp lỗi kiểm-rồi-mới-làm mà `_ghi_nguyen_tu` được viết
ra để tránh. Sự thật *"tôi vừa tạo hay không"* chỉ bên GHI biết chắc.
"""
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import importlib

vong = importlib.import_module("chungcat.src.vong")

loi = 0


def kiem(dat: bool, cau: str, vi_sao: str = "") -> None:
    global loi
    print(f"  {'ok  ' if dat else 'FAIL'} {cau}")
    if not dat:
        if vi_sao:
            print(f"       {vi_sao}")
        loi += 1


print("\nFR-071 · nạp lại trả 200\n")

U = "01K9ZFR0710000000000000001"
V = "01K9ZFR0710000000000000002"

with tempfile.TemporaryDirectory() as d:
    q = vong.HangDoi(Path(d))

    # ── 1 · `nap()` NÓI ĐƯỢC nó vừa làm gì ──────────────────────────────
    a = q.nap(U, {"loai": "chung-cat-mot-nguon", "slug": "x"})
    kiem(isinstance(a, tuple) and len(a) == 2,
         "`nap()` trả `(ulid, da_co)`",
         f"trả {type(a).__name__} — cửa không có gì để phân biệt hai đường")
    if not (isinstance(a, tuple) and len(a) == 2):
        print("\nĐỎ — chưa có hình dạng để kiểm tiếp")
        sys.exit(1)

    kiem(a[1] is False, "lần ĐẦU: `da_co` là False")

    # ── 2 · nạp LẠI cùng ULID ───────────────────────────────────────────
    b = q.nap(U, {"loai": "chung-cat-mot-nguon", "slug": "KHÁC HẲN"})
    kiem(b[0] == a[0], "lần HAI trả đúng `viec_id` CŨ")
    kiem(b[1] is True, "lần HAI: `da_co` là True",
         "đây là toàn bộ thứ `FR-071` mua: cửa nói được *đã có*")

    # ── 3 · và phép idempotent KHÔNG bị đổi ─────────────────────────────
    n = len(q.liet_ke(n=50)["viec"]) if "viec" in q.liet_ke(n=50) else None
    if n is None:
        ds = q.liet_ke(n=50)
        n = len(next((v for v in ds.values() if isinstance(v, list)), []))
    kiem(n == 1, f"hàng đợi vẫn đúng MỘT việc (đếm {n})",
         "`FR-071` chỉ đổi thứ cửa NÓI, không đổi thứ cửa LÀM")

    # payload lần hai KHÔNG được đè lần một — `AC-5.1`
    kiem(q.doc(U)["payload"]["slug"] == "x",
         "payload lần một GIỮ NGUYÊN, lần hai không đè",
         "nếu đè thì `ban_goc_ai` của một việc đang chạy đổi giữa đường")

    # ── 4 · CHỐNG ĐỎ OAN NGƯỢC: ULID khác ⇒ vẫn là tạo mới ──────────────
    c = q.nap(V, {"loai": "chung-cat-mot-nguon", "slug": "y"})
    kiem(c[1] is False,
         "ULID KHÁC ⇒ `da_co` False (không phải cứ nạp là `đã có`)",
         "một cửa luôn trả `200` cũng làm vế trên xanh — vế này chặn đúng "
         "cách vá sai đó")

print()
if loi:
    sys.exit(f"ĐỎ — {loi} vế")
print("pass · 201 rồi 200; hàng đợi và payload không đổi")
