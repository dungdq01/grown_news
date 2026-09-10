#!/usr/bin/env python3
r"""AC-1.3 · AC-2.6 edge 2 · M13-R3 · T13-7 AC2 — M13 KHÔNG ghi `kb/**`, KHÔNG mở
`kb/_kho.sqlite`, KHÔNG `open()` vào `kb/_media/**`. Mọi lần đọc kho là HTTP tới LÕI.

Hai lớp đo, cả hai bắt buộc:
  AST  — soi mã `truyhoi/src`: `sqlite3.connect(... _kho ...)`, `open(... kb/ ...)`,
         mọi literal `kb/_media`, `_kho.sqlite`. Soi MÃ (đã lột comment/docstring).
  RUNTIME — `sys.addaudithook` bắt mọi sự kiện `open` khi dựng chỉ mục + một truy vấn:
         không đường nào dưới `<repo>/kb`. Và LÕI giả phải NHẬN được request (đọc qua HTTP).

ĐỎ_KHI  một dòng mã trỏ `_kho.sqlite`/`kb/_media`/`open("kb/…")` · runtime mở file dưới kb/
XANH_KHI 0 dòng mã chạm kho · 0 open() dưới kb/ · ≥1 request HTTP tới LÕI giả
--tu-kiem: gieo một file tạm có `open("kb/_media/x.vtt")` và `sqlite3.connect("kb/_kho.sqlite")` ⇒ soi ra đúng hai dòng.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_khong_cham_kho.py"
MAU_CAM = [
    (re.compile(r"sqlite3\.connect\([^)\n]*_kho"), "sqlite3.connect(… _kho …)"),
    (re.compile(r"_kho\.sqlite"), "literal `_kho.sqlite`"),
    (re.compile(r"kb/_media|kb\\\\_media|[\"']_media[\"']"), "literal `kb/_media`"),
    (re.compile(r"\bopen\([^)\n]*[\"'](?:\.\./)*kb/"), "open(… \"kb/…\")"),
]


def soi(nguon: dict[str, str]) -> list[str]:
    ra = []
    for f, txt in nguon.items():
        for i, dong in enumerate(txt.splitlines(), 1):
            for rx, ten in MAU_CAM:
                if rx.search(dong):
                    ra.append(f"{f}:{i} — {ten}")
    return ra


if K.TU_KIEM:
    print("\ntu-kiem · soi mã phải ĐỎ ĐƯỢC trên file cố-tình-hỏng\n")
    xau = {"hong.py": 'import sqlite3\nc = sqlite3.connect("kb/_kho.sqlite")\nb = open("kb/_media/x.vtt", "rb").read()\n'}
    kq = soi(xau)
    K.kiem(len(kq) >= 2 and any("_kho" in x for x in kq) and any("_media" in x or "open" in x for x in kq),
           "file gieo hai vi phạm ⇒ soi ra ≥2 dòng, nêu file:dòng", " · ".join(kq))
    K.kiem(soi({"sach.py": 'import urllib.request\nr = urllib.request.urlopen("http://127.0.0.1:8895/api/kho-delta")\n'}) == [],
           "file chỉ đọc HTTP ⇒ 0 dòng (không đỏ oan)")
    K.kiem(soi({"cmt.py": K.lot_ma('# open("kb/_media/x") chỉ trong comment\nx = 1\n')}) == [],
           "comment nhắc `kb/_media` ⇒ KHÔNG tính (soi mã, không soi lời kể)")
    K.tu_kiem_xong(CONG, 3)

print("\n1 · AST — mã truyhoi/src không trỏ kho\n")
nguon = K.nguon_src()
K.kiem(bool(nguon), "truyhoi/src có mã để soi", "T13-2 chưa dựng")
vi_pham = soi(nguon)
K.kiem(not vi_pham, "0 dòng mã trỏ `_kho.sqlite` / `kb/_media` / open(\"kb/…\")", " · ".join(vi_pham[:5]))

try:
    indexer, db = _nap.nap("indexer", "db")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-2")
# `rank` là T13-4: vắng thì vế truy vấn CHƯA đo — nói ra, không đỏ oan T13-2 và không xanh im lặng.
try:
    rank = _nap.nap("rank")
except _nap.ThieuMa:
    rank = None
    print("  ·  chờ T13-4 — chưa có rank.py, vế 'một truy vấn không chạm kho' chưa đo được")
except _nap.ThieuGoi as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

print("\n2 · RUNTIME — dựng + một truy vấn: 0 open() dưới kb/, mọi lần đọc là HTTP\n")
KB_THAT = (K.R / "kb").resolve()
mo_kb = []


def hook(su_kien, args):
    if su_kien == "open":
        duong = str(args[0]) if args else ""
        try:
            if Path(duong).resolve().is_relative_to(KB_THAT):
                mo_kb.append(duong)
        except (OSError, ValueError):
            pass


sys.addaudithook(hook)
with K.tam("gn_m13_cham_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            if rank is not None:
                kq = rank.truy_hoi(con, cau_hoi="đường ống dữ liệu", pham_vi={}, nguon=None, k=5)
                K.kiem(isinstance(kq, dict) and "ket_qua" in kq, "truy vấn chạy được sau khi dựng")
        finally:
            con.close()
        K.kiem(mo_kb == [], "0 lần open() trỏ vào <repo>/kb/** khi dựng + truy vấn", " · ".join(mo_kb[:3]))
        K.kiem(any("/api/kho-delta" in x["duong"] for x in loi.nhan), "indexer gọi GET /api/kho-delta của LÕI (HTTP, không đọc file)")
        K.kiem(any("/api/articles/media/" in x["duong"] for x in loi.nhan) or not any(d.get("media") for d in _loi_gia.kho_mau().values()),
               "hiện vật đọc qua GET /api/articles/media/<sha> (T13-7) — không mở kb/_media",
               "chưa thấy request media; T13-7 chưa dựng hoặc đọc sai cửa")

K.chot("0 dòng mã chạm kho · 0 open() dưới kb/ · mọi lần đọc là HTTP tới LÕI")
