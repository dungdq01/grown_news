#!/usr/bin/env python3
r"""Cổng IDEMPOTENCY — `AC-5.1`.

VÌ SAO CỔNG NÀY TỒN TẠI
`build_order` hỏi *"job chạy hai lần thì sao"*. `spec §5` trả lời: **ULID trong
tên file LÀ khoá idempotency** — không phải một bảng riêng, không phải một cờ.
Nếu nạp lại cùng ULID mà sinh việc thứ hai thì một cú bấm hai lần là **hai lần
tài liệu rời khỏi máy**, và `M12-R6` mất địa chỉ để đếm.

Và bất biến mạnh hơn *"chỉ một file"*: nạp lại **KHÔNG được xoá trạng thái đã
có**. Một `nap()` ghi đè `lan_gui` về 0 thì trần gửi biến thành trang trí theo
một đường không ai nghĩ tới.

ĐỎ_KHI  cùng ULID ra hai việc · nạp lại reset `lan_gui` · nạp lại xoá phản hồi
        đã lưu · nạp lại ghi đè payload cũ
XANH_KHI nạp lại là phép KHÔNG-LÀM-GÌ, và trạng thái cũ nguyên vẹn
"""

import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(R / "chungcat" / "src"))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    vong = _nap.nap("vong")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_idempotency.py", "T12-6")

tmp = Path(tempfile.mkdtemp(prefix="m12-idem-"))
try:
    q = vong.HangDoi(tmp / "hd")
    u = "01K9ZIDEM0000000000000001"

    a = q.nap(u, {"loai": "chung-cat-mot-nguon", "slug": "x"})[0]
    q.ghi_nhan_gui(a)                        # giả lập đã gửi một lần
    q.luu_phan_hoi(a, {"text": "t", "quotes": []})

    b = q.nap(u, {"loai": "chung-cat-mot-nguon", "slug": "KHAC-HAN"})[0]
    kiem(a == b, "cùng ULID ⇒ trả cùng một id việc")
    kiem(len(list((tmp / "hd" / "new").glob("*.json"))) == 1,
         "đúng MỘT file việc sau hai lần nạp")

    # Ba bất biến mạnh hơn "một file" — mỗi cái là một đường `lan_gui` có thể
    # bị reset mà không ai để ý.
    v = q.doc(a)
    kiem(v["lan_gui"] == 1, "nạp lại KHÔNG reset `lan_gui`", f"còn {v['lan_gui']}")
    kiem(q.doc_phan_hoi(a) is not None, "nạp lại KHÔNG xoá phản hồi model đã lưu")
    kiem(v["payload"]["slug"] == "x",
         "nạp lại KHÔNG ghi đè payload cũ bằng payload mới",
         f"payload thành {v['payload']['slug']!r}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-5.1 chưa có răng")
print("ULID là khoá idempotency · nạp lại không xoá trạng thái")
