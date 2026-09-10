#!/usr/bin/env python3
r"""Cổng ĐỊA CHỈ MANG TÊN NGUỒN — `AC-2.2` · `AC-2.3` · `T2`+`T3` của `FR-044`.

VÌ SAO CỔNG NÀY TỒN TẠI
`FR-044` gọi `T2` là *"cổng đắt nhất và là lý do hồ sơ này đáng tồn tại"*. Ở
`phan-tich`, câu *"địa chỉ này trỏ đâu"* có **đúng một** đáp án. Ở `tong-hop` nó
có **N** — nên địa chỉ phải **mang tên nguồn**: `[nguon:p.7]`, không phải `[p.7]`.

`T3` bắt một kiểu bịa **riêng của tổng hợp**: khai năm nguồn cho oai rồi chỉ đọc
hai. Không có `T3` thì `nguon` là một danh sách trang trí, và
`independent_sources` bị thổi phồng theo đúng cách `B-A7` sinh ra để chặn.

Và cổng phải giữ được vế **KHÔNG ĐỎ OAN** của `FR-046`: công thức toán trong
ngoặc vuông vẫn viết thoải mái — chúng **bỏ qua im lặng**, không báo lỗi. Cổng
chỉ đỏ khi thân bài **không có** địa chỉ nào hiểu được.

ĐỎ_KHI  `[p.7]` (không tên nguồn) vẫn qua · địa chỉ trỏ ra ngoài `nguon` vẫn
        qua · nguồn khai mà không trích lần nào vẫn qua · công thức toán bị BÁO
        LỖI (đỏ oan) · bảng khai `dia-chi.json` vắng mà rơi về regex ngầm
XANH_KHI T2 và T3 đều chặn, và công thức toán không bị tính là địa chỉ hỏng
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
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    tong_hop = _nap.nap("tong_hop")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_dia_chi_mang_ten_nguon.py", "T12-9")

NGUON = ["nguon-mot", "nguon-hai"]
CO_THAT = set(NGUON) | {"nguon-ba"}


def tra(s):
    return s in CO_THAT


def do(than, mong, ten):
    try:
        tong_hop.kiem_tong_hop(NGUON, than, slug_co_that=tra)
        kiem(mong is None, ten, "qua sạch mà đáng lẽ phải đỏ")
    except Exception as e:
        kiem(mong is not None and mong in str(e), ten, f"{e}")


# ══ T2 · địa chỉ PHẢI mang tên nguồn ══════════════════════════════════════
do("Hai nguồn cùng giả định [nguon-mot:p.3] và [nguon-hai:p.7].", None,
   "ca TỐT · mọi địa chỉ mang tên nguồn ⇒ qua")

# Dạng KHÔNG mang tên nguồn thật của bảng khai v1 là `muc` (`[§II.4]`) — nó
# khớp một dạng đã khai, `manh: khong`, và không có nhóm slug nào.
do("Hai nguồn cùng một giả định [§II.4], và nguồn kia đo được [nguon-hai:p.7].",
   "T2", "T2 · `[§II.4]` KHỚP một dạng nhưng KHÔNG mang tên nguồn ⇒ ĐỎ")

# `[p.3]` là ca KHÁC, và bản đầu của cổng này nhầm hai ca với nhau:
# `dia-chi.json` v1 **không có dạng `trang` trần**, nên `[p.3]` không khớp dạng
# nào ⇒ **bỏ qua im lặng** (đúng luật `FR-046`, không phải lỗi). Hệ quả: một
# thân bài chỉ dùng `[p.3]` đỏ ở vế *"không có địa chỉ nào"*, KHÔNG ở vế
# *"không mang tên nguồn"*. Hai thông điệp khác nhau cho hai lỗi khác nhau —
# và gộp chúng là cách người thi công đi sửa nhầm chỗ.
do("Trích ở [p.3] rồi ở [p.9], hết.", "T2",
   "T2 · thân bài chỉ dùng dạng KHÔNG khai (`[p.3]`) ⇒ đỏ vì 'không có địa chỉ nào'")

do("Trích ở [nguon-mot:p.3] và ở [nguon-ba:p.1].", "T2",
   "T2 · địa chỉ trỏ slug CÓ THẬT nhưng NGOÀI `nguon` đã khai ⇒ ĐỎ")

do("Bài này không có địa chỉ nào máy hiểu được.", "T2",
   "T2 · thân bài KHÔNG có địa chỉ nào ⇒ ĐỎ")

# ══ T3 · MỖI nguồn được nhắc ít nhất một lần ══════════════════════════════
do("Chỉ trích một nguồn thôi [nguon-mot:p.3], và [nguon-mot:p.9] nữa.", "T3",
   "T3 · khai hai nguồn mà chỉ trích MỘT ⇒ ĐỎ (kiểu bịa riêng của tổng hợp)")

# ══ Vế KHÔNG ĐỎ OAN — công thức toán, mảng số, chữ thường trong ngoặc ═════
CONG_THUC = (
    "Hàm mục tiêu là [ l(yᵢ, ŷᵢ^(t-1)) + gᵢ·f_t(xᵢ) + ½·hᵢ·f_t(xᵢ)² ] theo "
    "[nguon-mot:p.3], và dải giá trị [2, 1, 0.5, −0.5, −1, −2] ở [nguon-hai:p.7]. "
    "Mục [Reading] và ghi chú [TODO] cũng không phải địa chỉ."
)
do(CONG_THUC, None,
   "KHÔNG ĐỎ OAN · công thức Taylor · mảng số · `[Reading]` · `[TODO]` đều BỎ "
   "QUA im lặng, và bài vẫn qua nhờ hai địa chỉ thật")

dc = tong_hop.tach_dia_chi(CONG_THUC)
kiem(len(dc) == 2,
     "phép tách đếm ĐÚNG HAI địa chỉ — bốn chuỗi không-phải-địa-chỉ không lọt vào",
     f"đếm {len(dc)}: {[x['tho'] for x in dc]}")

# ══ Bảng khai vắng ⇒ NÉM, không rơi về regex ngầm ═════════════════════════
that = tong_hop.DIA_CHI
kiem(that.exists(), "bảng khai `dia-chi.json` có thật — phép tách đọc FILE, không gõ regex")
import ast  # noqa: E402
src = (R / "chungcat" / "src" / "tong_hop.py").read_text(encoding="utf-8")
mau = [n.value for n in ast.walk(ast.parse(src))
       if isinstance(n, ast.Constant) and isinstance(n.value, str)
       and ("\\d" in n.value or "p\\." in n.value or "^([a-z" in n.value)]
kiem(not mau,
     "KHÔNG mẫu địa chỉ nào gõ trong mã — mọi dạng đọc từ bảng khai của M01",
     f"thấy {mau}")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — T2/T3 của FR-044 chưa có răng")
print("T2 đòi tên nguồn · T3 đòi trích đủ · công thức toán KHÔNG bị đỏ oan")
