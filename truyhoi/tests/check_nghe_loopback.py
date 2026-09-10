#!/usr/bin/env python3
r"""T13-4 AC2 · Z3 · Z6 — service nghe LOOPBACK (đo đối số bind), cổng đọc từ `dich-vu.json`
(0 literal `8791` trong mã), `/health` khai ĐƯỜNG CHỈ MỤC + mốc index gần nhất — cấm health trần
`{"ok": true}` (bài học vận hành M12).

ĐỎ_KHI  bind khác 127.0.0.1 · literal 8791 trong truyhoi/src · /health thiếu `duong_index` hoặc `moc_index_gan_nhat`
XANH_KHI server_address[0] == 127.0.0.1 · cổng từ bảng khai · /health đủ khoá
--tu-kiem: gieo `8791` và `("0.0.0.0"` vào mã tạm ⇒ soi bắt; health `{"ok": true}` ⇒ phép soi khoá đỏ.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _nap  # noqa: E402

CONG = "check_nghe_loopback.py"
KHOA_HEALTH = ("ok", "duong_index", "moc_index_gan_nhat")


def soi(nguon: dict[str, str]) -> list[str]:
    ra = []
    for f, t in nguon.items():
        for i, l in enumerate(t.splitlines(), 1):
            if re.search(r"\b8791\b", l):
                ra.append(f"{f}:{i} — literal 8791 (cổng phải đọc từ dich-vu.json)")
            if re.search(r"\(\s*[\"'](0\.0\.0\.0|::|)[\"']\s*,", l) and "server" in l.lower() or re.search(r"[\"']0\.0\.0\.0[\"']", l):
                ra.append(f"{f}:{i} — bind ngoài loopback")
    return ra


def soi_health(j) -> list[str]:
    if not isinstance(j, dict):
        return ["/health không trả JSON object"]
    return [f"/health thiếu `{k}`" for k in KHOA_HEALTH if k not in j]


if K.TU_KIEM:
    print("\ntu-kiem · soi mã và soi health phải ĐỎ ĐƯỢC\n")
    K.kiem(soi({"api.py": 'ThreadingHTTPServer(("0.0.0.0", 8791), Cua)'}) and len(soi({"api.py": 'ThreadingHTTPServer(("0.0.0.0", 8791), Cua)'})) == 2, "0.0.0.0 + 8791 ⇒ hai dòng")
    K.kiem(soi({"api.py": 'ThreadingHTTPServer(("127.0.0.1", cong_tu_bang_khai()), Cua)'}) == [], "loopback + cổng từ bảng khai ⇒ sạch")
    K.kiem(soi_health({"ok": True}) == ["/health thiếu `duong_index`", "/health thiếu `moc_index_gan_nhat`"], "health trần ⇒ nêu hai khoá thiếu")
    K.tu_kiem_xong(CONG, 3)

print("\n1 · soi mã: 0 literal 8791, 0 bind ngoài loopback\n")
nguon = K.nguon_src()
vp = soi(nguon)
K.kiem(bool(nguon) and not vp, "mã sạch", " · ".join(vp) or "chưa có mã")

try:
    api = _nap.nap("api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

print("\n2 · bind thật · cổng từ bảng khai · /health\n")
cong_khai = next(x["cong"] for x in K.doc_json(K.ASSETS / "dich-vu.json")["dich_vu"] if x["thu_muc"] == "truyhoi")
K.kiem(hasattr(api, "cong_tu_bang_khai") and api.cong_tu_bang_khai() == cong_khai, f"api.cong_tu_bang_khai() == {cong_khai} (đọc dich-vu.json)")
with K.tam("gn_m13_lb_") as tmp:
    s, cong = K.bat_service(api, TRUYHOI_INDEX=str(tmp / "index.sqlite"))
    try:
        K.kiem(s.server_address[0] == "127.0.0.1", "đối số bind là 127.0.0.1", str(s.server_address))
        K.kiem(cong != cong_khai and cong != 8787, "test bind cổng 0 (OS chọn), không đụng 8791/8787", str(cong))
        ma, j, _ = K.goi(cong, "GET", "/health")
        K.kiem(ma == 200 and soi_health(j) == [], "/health 200 và đủ `ok` · `duong_index` · `moc_index_gan_nhat`", f"ma={ma} {soi_health(j)} {str(j)[:120]}")
        K.kiem(isinstance(j, dict) and str(j.get("duong_index", "")).endswith("index.sqlite") and "kb" not in Path(str(j.get("duong_index", ""))).parts,
               "duong_index trỏ file index.sqlite ngoài kb/", str(j.get("duong_index") if j else j))
    finally:
        K.dung_service(s)

K.chot("nghe loopback · cổng từ bảng khai · /health khai đường chỉ mục + mốc")
