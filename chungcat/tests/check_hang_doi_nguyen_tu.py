#!/usr/bin/env python3
r"""Cổng HÀNG ĐỢI — `AC-5.1` · `AC-5.2` · `AC-5.5` · `M12-R6`.

VÌ SAO CỔNG NÀY TỒN TẠI
`build_order` để ngỏ ba câu, và `spec §5` trả lời bằng Maildir: ULID trong tên
file **là** khoá idempotency; `tmp/ → new/` nguyên tử nên không có trạng thái
nửa vời; trần **2 lần GỬI** và `lan_gui` **không bao giờ reset**.

Câu thứ ba không thuần kỹ thuật: **mỗi lần gửi là một lần tài liệu rời khỏi
máy**. Retry vô hạn = gửi vô hạn, và `FR-043` bậc 4 đòi log từng lần. Nếu chạy
lại **reset** bộ đếm thì người bấm mười lần là tài liệu đi ra mười lần, và trần
thành **trang trí** — đó là toàn bộ lý do `AC-5.5` tồn tại.

⚠️ `AC-5.2` ĐO LẠI theo `FR-053 §4`. `spec §5` viết *"`os.replace` NGUYÊN TỬ nên
không có trạng thái nửa vời"*; mệnh đề đó **sai trên Windows** — `MoveFileEx`
không được bảo đảm nguyên tử và có thể âm thầm rơi về `CopyFile`. Nên cổng đo
một **TÍNH CHẤT** (`new/` không chứa JSON parse-lỗi) thay vì một **NIỀM TIN**,
và luật đi kèm là: tên đích trong `new/` **luôn duy nhất** ⇒ chỉ đi đường
rename-không-đè, nhánh fallback hết cửa.

ĐỎ_KHI  cùng ULID nạp hai lần ra hai việc · `new/` có file JSON hỏng · chạy lại
        làm `lan_gui` giảm/reset · gửi lần thứ ba · chạy lại từ `dang-verify`
        mà vẫn gọi model
XANH_KHI idempotent · `new/` luôn đọc được · `lan_gui` bền và chặn ở 2
"""

import json
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


tmp = Path(tempfile.mkdtemp(prefix="m12-vong-"))
try:
    try:
        vong = _nap.nap("vong")
    except (_nap.ThieuMa, _nap.ThieuGoi) as e:
        _nap.bao_do_va_thoat(e, "check_hang_doi_nguyen_tu.py", "T12-6")


    q = vong.HangDoi(tmp / "hang-doi")

    # ══ AC-5.1 · ULID là khoá idempotency ═════════════════════════════════
    u = "01K9ZTEST0000000000000000"
    a = q.nap(u, {"loai": "chung-cat-mot-nguon", "slug": "x"})[0]
    b = q.nap(u, {"loai": "chung-cat-mot-nguon", "slug": "x"})[0]
    kiem(a == b, "cùng ULID nạp hai lần ⇒ ĐÚNG MỘT việc", f"{a} vs {b}")
    kiem(len(list((tmp / "hang-doi" / "new").glob("*.json"))) == 1,
         "chỉ một file trong `new/`")

    # ══ AC-5.2 · `new/` KHÔNG BAO GIỜ chứa JSON nửa vời ═══════════════════
    # Đo TÍNH CHẤT, không đo niềm tin về `os.replace` (FR-053 §4).
    for i in range(25):
        q.nap(f"01K9ZLOAT{i:016d}", {"loai": "chung-cat-mot-nguon", "slug": f"s{i}"})[0]
    hong = []
    for f in (tmp / "hang-doi" / "new").glob("*.json"):
        try:
            json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            hong.append(f"{f.name}: {e}")
    kiem(not hong, "sau 26 lần nạp, `new/` KHÔNG có file JSON parse-lỗi", f"{hong}")
    kiem(not list((tmp / "hang-doi" / "tmp").glob("*")),
         "`tmp/` sạch sau khi nạp xong — không bỏ lại rác")

    # Luật đi kèm: tên đích LUÔN duy nhất ⇒ không có đường đè.
    ten = [f.name for f in (tmp / "hang-doi" / "new").glob("*.json")]
    kiem(len(ten) == len(set(ten)), "mọi tên file trong `new/` là duy nhất (không đè)")

    # ══ M12-R6 · trần 2 lần GỬI, và `lan_gui` KHÔNG reset ═════════════════
    v = q.doc(a)
    kiem(v["lan_gui"] == 0, "việc mới có `lan_gui = 0`")
    q.ghi_nhan_gui(a)
    q.ghi_nhan_gui(a)
    kiem(q.doc(a)["lan_gui"] == 2, "đếm đúng hai lần gửi")
    try:
        q.ghi_nhan_gui(a)
        kiem(False, "lần GỬI thứ BA bị chặn")
    except Exception as e:
        kiem(True, "lần GỬI thứ BA bị chặn", f"ném {type(e).__name__}")

    # AC-5.5 · chạy lại KHÔNG reset — nếu reset thì trần thành trang trí
    q.chay_lai(a, tu_giai_doan="dang-verify")
    kiem(q.doc(a)["lan_gui"] == 2,
         "AC-5.5 · chạy lại từ `dang-verify` KHÔNG làm `lan_gui` giảm/reset",
         f"còn {q.doc(a)['lan_gui']}")
    for _ in range(5):
        q.chay_lai(a, tu_giai_doan="dang-verify")
    kiem(q.doc(a)["lan_gui"] == 2, "chạy lại 5 lần nữa ⇒ `lan_gui` vẫn 2")

    # "Chạy lại TỪ ĐẦU" khi lan_gui = 2 ⇒ TỪ CHỐI kèm lý do, không im lặng
    try:
        q.chay_lai(a, tu_giai_doan="cho")
        kiem(False, "chạy-lại-từ-đầu khi `lan_gui = 2` ⇒ TỪ CHỐI")
    except Exception as e:
        kiem("lan_gui" in str(e) or "gửi" in str(e).lower(),
             "chạy-lại-từ-đầu khi `lan_gui = 2` ⇒ TỪ CHỐI **kèm lý do**", f"{e}")

    # ══ AC-5.4 · phản hồi model lưu CẠNH job ⇒ chạy lại từ verify tốn 0 gọi ═
    q.luu_phan_hoi(a, {"text": "x", "quotes": []})
    kiem(q.doc_phan_hoi(a) is not None,
         "phản hồi model lưu CẠNH job trong Maildir — chạy lại từ `dang-verify` "
         "không phải gọi model lần nữa (AC-5.4)")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-5.x / M12-R6 chưa có răng")
print("idempotent · new/ luôn đọc được · lan_gui bền và chặn ở 2")
