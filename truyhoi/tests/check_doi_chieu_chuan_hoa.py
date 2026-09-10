#!/usr/bin/env python3
r"""M13-R1 (why) · FR-078 §1.1 · T13-1 AC3 — CỔNG ĐỐI CHIẾU hai hàm chuẩn hoá của HAI THỢ trên
FIXTURE CHUNG `truyhoi/tests/fixtures/chuan-hoa-chung.json`.

Hai hàm KHÁC MỤC ĐÍCH, được phép ra hai chuỗi khác nhau:
  `chungcat.verify.chuan_hoa`    NFKC · ligature · casefold — so khớp quote
  `truyhoi.chuan_hoa.chuan_hoa_tim`  NFC · lower · đ→d · chèn cách Hán — tokenize
Thứ phải KHỚP là PHẦN GIAO:
  (a) cùng TẬP KÝ TỰ HÁN — số ký tự Hán mỗi bên "nhìn thấy" bằng nhau và bằng `han` của
      fixture (đếm bằng dải `core/assets/dai-han.json` — bên nào thiếu một dải là lệch);
  (b) chữ Latin sau khi cả hai bỏ dấu + hạ chữ phải bằng nhau (đ→d áp cho cả hai khi so);
  (c) cả hai idempotent: f(f(x)) == f(x).

Cổng import `chungcat.verify` Ở ĐÂY (trong test) — `truyhoi/src` thì KHÔNG (M13-R1). Thiếu
`chungcat` ⇒ exit 3 (thiếu gói/mã bên kia, không phải lỗi M13).

ĐỎ_KHI  một ca có số Hán hai bên khác nhau hoặc khác `han` · Latin fold khác nhau · không idempotent
XANH_KHI mọi ca khớp phần giao
--tu-kiem: fixture cố tình lệch (`han` sai) và một hàm giả không idempotent ⇒ đỏ.
"""
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _nap  # noqa: E402

CONG = "check_doi_chieu_chuan_hoa.py"
FIX = K.TESTS / "fixtures" / "chuan-hoa-chung.json"


def dem_han(s: str, dai) -> int:
    return sum(1 for c in s if K.la_han(c, dai))


def latin_fold(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower()).replace("đ", "d")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s)


def doi_chieu(ca: list[dict], f_m12, f_m13, dai) -> list[str]:
    loi = []
    for c in ca:
        a, b = f_m12(c["vao"]), f_m13(c["vao"])
        ha, hb = dem_han(a, dai), dem_han(b, dai)
        if not (ha == hb == c["han"]):
            loi.append(f"{c['ten']}: số Hán M12={ha} M13={hb} fixture={c['han']}")
        if latin_fold(a) != latin_fold(b):
            loi.append(f"{c['ten']}: Latin fold lệch — M12 `{latin_fold(a)}` ≠ M13 `{latin_fold(b)}`")
        if f_m12(a) != a or f_m13(b) != b:
            loi.append(f"{c['ten']}: không idempotent")
    return loi


if K.TU_KIEM:
    print("\ntu-kiem · phép đối chiếu phải ĐỔ ĐƯỢC\n")
    dai = K.dai_han()
    ca = K.doc_json(FIX)["ca"]
    gia = lambda s: s.lower()  # noqa: E731 — hàm giả: giữ Hán, lower
    K.kiem(doi_chieu(ca, gia, gia, dai) == [], "hai hàm y hệt + fixture đúng ⇒ 0 lệch (không đỏ oan)", " · ".join(doi_chieu(ca, gia, gia, dai)))
    sai = [dict(ca[3], han=5)]
    K.kiem(any("fixture=5" in x for x in doi_chieu(sai, gia, gia, dai)), "fixture `han` sai ⇒ đỏ nêu ba số")
    thieu_dai = lambda s: "".join(c for c in s if not (0x20000 <= ord(c) <= 0x2A6DF)).lower()  # noqa: E731 — bên bỏ Ext B
    K.kiem(any("ext-b" in x for x in doi_chieu(ca, thieu_dai, gia, dai)), "một bên bỏ dải Ext B ⇒ lệch được nêu ở ca ext-b")
    khong_idem = lambda s: s + "x"  # noqa: E731
    K.kiem(any("idempotent" in x for x in doi_chieu(ca[:1], khong_idem, gia, dai)), "hàm không idempotent ⇒ đỏ")
    K.tu_kiem_xong(CONG, 4)

try:
    chuan_hoa = _nap.nap("chuan_hoa")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-3")

sys.path.insert(0, str(K.R / "chungcat" / "src"))
try:
    import verify as m12_verify  # noqa: E402 — mã M12, import TRONG cổng, không trong truyhoi/src
except ImportError as e:
    print(f"ĐỎ SAI LÝ DO · không nạp được chungcat/src/verify.py ({e}) — bên M12, không phải lỗi M13"); sys.exit(3)

print("\n1 · đối chiếu phần giao trên fixture chung\n")
dai = K.dai_han()
ca = K.doc_json(FIX)["ca"]
loi = doi_chieu(ca, m12_verify.chuan_hoa, chuan_hoa.chuan_hoa_tim, dai)
K.kiem(not loi, f"{len(ca)} ca: cùng số Hán (= fixture) · Latin fold bằng nhau · idempotent", " · ".join(loi[:4]))
K.kiem(chuan_hoa.chuan_hoa_tim("資料") != m12_verify.chuan_hoa("資料") or True,
       "(ghi nhận) hai hàm ĐƯỢC PHÉP khác chuỗi — M13 chèn cách, M12 không; chỉ phần giao phải khớp")

K.chot("hai THỢ nhìn cùng một tập chữ Hán · cùng Latin fold · idempotent")
