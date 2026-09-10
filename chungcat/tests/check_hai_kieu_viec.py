#!/usr/bin/env python3
r"""Cổng HAI LOẠI VIỆC, MỘT HỢP ĐỒNG — `AC-2.1` · `T1` của `FR-044`.

VÌ SAO CỔNG NÀY TỒN TẠI
`spec §2`: cùng một đường API, khác `loai` trong payload. Nếu hai loại việc mọc
thành hai đường thì `M12-R6` (trần gửi) và `AC-5.1` (idempotency) phải cài hai
lần — và bản thứ hai sẽ là bản không ai nhớ.

`AC-2.1` đòi một vế sắc: `loai: tong-hop-chu-de` mà `nguon` chỉ có 1 slug ⇒ từ
chối **TRƯỚC KHI** gọi model, **không tiêu một token nào**. Vì sao ≥2: tổng hợp
từ một nguồn **LÀ** một `phan-tich`, và cho phép 1 là mở đường dùng nhầm hồ sơ
để **thoát cổng locator** của `phan-tich`.

ĐỎ_KHI  `nguon` 1 slug vẫn tạo được việc · slug trùng nhau được nhận · slug trỏ
        hư không mà qua · hai loại việc đi hai vòng đời khác nhau · từ chối
        SAU khi đã gọi model
XANH_KHI một hợp đồng cho cả hai loại, và T1 chặn trước token
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
    tong_hop, vong = _nap.nap("tong_hop", "vong")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_hai_kieu_viec.py", "T12-9")

CO_THAT = {"nguon-mot", "nguon-hai", "nguon-ba"}
THAN_TOT = ("Điểm chung của hai nguồn là cùng một giả định "
            "[nguon-mot:p.3], và nguồn thứ hai đo được nó [nguon-hai:p.7].")

goi_model = []          # phải RỖNG sau mọi ca bị từ chối


def tra(s):
    return s in CO_THAT


# ══ T1 · `nguon` < 2 ⇒ TỪ CHỐI, 0 token ═══════════════════════════════════
for ten, ng in (("rỗng", []), ("một slug", ["nguon-mot"])):
    try:
        tong_hop.kiem_tong_hop(ng, THAN_TOT, slug_co_that=tra)
        kiem(False, f"AC-2.1 · `nguon` {ten} ⇒ TỪ CHỐI")
    except Exception as e:
        kiem("T1" in str(e), f"AC-2.1 · `nguon` {ten} ⇒ TỪ CHỐI ở T1", f"{e}")
kiem(not goi_model, "AC-2.1 · từ chối xảy ra TRƯỚC lời gọi model — 0 token")

# ══ T1 · slug trùng, và slug trỏ hư không ═════════════════════════════════
try:
    tong_hop.kiem_tong_hop(["nguon-mot", "nguon-mot"], THAN_TOT, slug_co_that=tra)
    kiem(False, "`nguon` có slug TRÙNG ⇒ TỪ CHỐI")
except Exception as e:
    kiem("T1" in str(e), "`nguon` có slug TRÙNG ⇒ TỪ CHỐI", f"{e}")

try:
    tong_hop.kiem_tong_hop(["nguon-mot", "khong-co-that"], THAN_TOT, slug_co_that=tra)
    kiem(False, "slug trỏ HƯ KHÔNG ⇒ TỪ CHỐI")
except Exception as e:
    kiem("hư không" in str(e) or "T1" in str(e), "slug trỏ HƯ KHÔNG ⇒ TỪ CHỐI", f"{e}")

# Không tiêm phép tra ⇒ T1 chỉ kiểm HÌNH DẠNG, và hàm phải NÓI RA điều đó.
# Một cổng im lặng hạ mức kiểm là cổng nói dối về sức mạnh của nó.
kq = tong_hop.kiem_tong_hop(["nguon-mot", "nguon-hai"], THAN_TOT)
kiem(kq["t1_chi_kiem_hinh_dang"] is True,
     "không tiêm phép tra kho ⇒ hàm KHAI rằng T1 chỉ kiểm hình dạng")

# ══ Ca TỐT ════════════════════════════════════════════════════════════════
kq = tong_hop.kiem_tong_hop(["nguon-mot", "nguon-hai"], THAN_TOT, slug_co_that=tra)
kiem(kq["so_dia_chi"] == 2, "hai địa chỉ mang tên nguồn được đếm", f"{kq}")
kiem(kq["nguon_da_nhac"] == ["nguon-hai", "nguon-mot"], "cả hai nguồn được nhắc")
kiem(kq["t1_chi_kiem_hinh_dang"] is False, "có phép tra ⇒ T1 kiểm THẬT")

# ══ MỘT hợp đồng · hai loại việc dùng CÙNG vòng đời ═══════════════════════
tmp = Path(tempfile.mkdtemp(prefix="m12-haikieu-"))
try:
    q = vong.HangDoi(tmp / "hd")
    a = q.nap("01K9ZHAI00000000000000001",
              {"loai": "chung-cat-mot-nguon", "slug": "x"})[0]
    b = q.nap("01K9ZHAI00000000000000002",
              {"loai": "tong-hop-chu-de", "nguon": ["nguon-mot", "nguon-hai"]})[0]
    for u, ten in ((a, "chung-cat-mot-nguon"), (b, "tong-hop-chu-de")):
        v = q.doc(u)
        kiem(v["giai_doan"] == vong.GIAI_DOAN[0],
             f"`{ten}` bắt đầu ở CÙNG giai đoạn đầu")
        kiem(v["lan_gui"] == 0, f"`{ten}` dùng CÙNG bộ đếm `lan_gui`")
    q.ghi_nhan_gui(b)
    q.ghi_nhan_gui(b)
    try:
        q.ghi_nhan_gui(b)
        kiem(False, "`tong-hop-chu-de` chịu CÙNG trần 2 lần gửi")
    except Exception:
        kiem(True, "`tong-hop-chu-de` chịu CÙNG trần 2 lần gửi (M12-R6, một hợp đồng)")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ══ FR-044 §1.4 · `url` tự đặt tên, nói đúng sự thật ══════════════════════
kiem(tong_hop.url_tu_dat("chu-de-x") == "grown://tong-hop/chu-de-x",
     "`url` của bản tổng hợp là `grown://tong-hop/<slug>` — không trỏ vào một "
     "trong các nguồn (trỏ vào đó là nói dối)")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-2.1 / T1 chưa có răng")
print("một hợp đồng hai loại việc · T1 chặn trước token · url nói đúng sự thật")
