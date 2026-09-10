#!/usr/bin/env python3
"""Đồng bộ bảng khai model từ danh mục Beeknoee (`GET /v1/models`).

Bảng khai VẪN là nguồn chân lý (`M12-R4` + `AC-4.6`). Máy ghi phần DANH MỤC,
người giữ phần CHÍNH SÁCH; dòng đã có thì phần chính sách được giữ nguyên.
Kết quả commit vào repo ⇒ runtime không đọc mạng.

    python chungcat/tools/dong_bo_model.py            # đọc `$nguon_danh_muc`
    python chungcat/tools/dong_bo_model.py --tu f.json
    python chungcat/tools/dong_bo_model.py --kiem     # chỉ BÁO lệch, không ghi
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
BANG = R / "chungcat" / "assets" / "model.json"

# Cột do NGƯỜI giữ — đồng bộ không ghi lên chúng.
CHINH_SACH = ("khu_vuc", "du_phong", "la_mac_dinh", "ngon_ngu", "can_key",
              "tac_vu_model", "mien_phi",
              "dich", "ho_tro_citations", "cho_phep_cheo_khu_vuc",
              "kieu_structured", "nguong_lech_schema", "che_do")


def tai_danh_muc(nguon: str) -> list[dict]:
    p = Path(nguon)
    if p.exists():
        raw = p.read_text(encoding="utf-8")
    else:
        with urllib.request.urlopen(nguon, timeout=30) as r:
            raw = r.read().decode("utf-8")
    d = json.loads(raw)
    return d["data"] if isinstance(d, dict) and "data" in d else d


def loc(danh_muc: list[dict], bang: dict) -> list[dict]:
    """Danh mục thô → dòng dùng được.

    Beeknoee KHÔNG trả `supported_parameters`, nên `kieu_structured` không dẫn
    xuất được — nó là CHÍNH SÁCH theo nhà (`$kieu_theo_nha`).

    Danh mục có id TRÙNG (cùng một `gemini-3.5-flash-lite` xuất hiện 5 lần với
    `supports_*` khác nhau). Giữ bản NHIỀU NĂNG LỰC NHẤT — bản nghèo hơn là một
    route khác của cùng model, và `$mot_model_mot_dong` đòi mỗi model một dòng.
    """
    bo_mau = re.compile("|".join(bang["$bo_mau"]), re.I)
    mau_tv = {k: re.compile("|".join(v), re.I)
              for k, v in bang["$tac_vu_theo_mau"].items()}
    bo_nha = set(bang.get("$bo_nha") or [])
    nha_cho_phep = set(bang.get("$nha_cho_phep") or [])
    tot = {}
    for m in danh_muc:
        mid = m.get("id", "")
        nha = m.get("owned_by", "")
        if not mid or nha in bo_nha or bo_mau.search(mid):
            continue
        if nha_cho_phep and nha not in nha_cho_phep:
            continue
        diem = sum(1 for k in ("supports_vision", "supports_audio",
                               "supports_video", "supports_pdf",
                               "supports_thinking") if m.get(k))
        cu = tot.get(mid)
        if cu is None or diem > cu[0]:
            tv = next((k for k, r in mau_tv.items() if r.search(mid)), "van-ban")
            tot[mid] = (diem, {"nha_cung_cap": nha, "model": mid, "tac_vu": tv,
                               "ho_tro_pdf": bool(m.get("supports_pdf")),
                               "ho_tro_audio": bool(m.get("supports_audio"))})
    return [v[1] for v in tot.values()]


def tron(bang: dict, moi: list[dict]) -> tuple[dict, dict]:
    cu = {r["model"]: r for r in bang["dong"]}
    kieu_nha = bang["$kieu_theo_nha"]
    lech = bang["$bang_lech_schema"]
    ra, them = [], []
    for m in sorted(moi, key=lambda x: (x["nha_cung_cap"], x["model"])):
        goc = cu.get(m["model"])
        kieu = kieu_nha.get(m["nha_cung_cap"], kieu_nha["*"])
        dong = {
            "tac_vu": "chung-cat",
            "ngon_ngu": "*",
            "nha_cung_cap": m["nha_cung_cap"],
            "model": m["model"],
            "dich": bang["$dich_mac_dinh"],
            "khu_vuc": "khong-xac-dinh",
            "du_phong": None,
            "can_key": True,
            "ho_tro_citations": False,
            "kieu_structured": kieu,
            "nguong_lech_schema": lech[kieu],
            "che_do": "sync",
            "la_mac_dinh": False,
            "tac_vu_model": m["tac_vu"],
            "ho_tro_pdf": m["ho_tro_pdf"],
            "ho_tro_audio": m["ho_tro_audio"],
        }
        if goc:
            for c in CHINH_SACH:
                if c in goc:
                    dong[c] = goc[c]
        else:
            them.append(m["model"])
        ra.append(dong)
    ten_moi = {m["model"] for m in moi}
    return ({**bang, "dong": ra},
            {"them": them, "bo": [t for t in cu if t not in ten_moi],
             "tong": len(ra)})


def kiem_bat_bien(bang: dict) -> list[str]:
    loi, dong = [], bang["dong"]
    ten = [r["model"] for r in dong]
    if len(ten) != len(set(ten)):
        loi.append("`$mot_model_mot_dong` vỡ — có model xuất hiện hai dòng")
    theo = {r["model"]: r for r in dong}
    for r in dong:
        dp = r.get("du_phong")
        if dp is None:
            continue
        if dp not in theo:
            loi.append(f"`{r['model']}.du_phong` trỏ `{dp}` — không có dòng đó")
        elif theo[dp]["khu_vuc"] != r["khu_vuc"] and not r.get("cho_phep_cheo_khu_vuc"):
            loi.append(f"`{r['model']}` rơi sang khu vực khác mà không có cờ (M12-R5)")
    dem = {}
    for r in dong:
        if r.get("la_mac_dinh"):
            k = (r["tac_vu"], r["ngon_ngu"])
            dem[k] = dem.get(k, 0) + 1
    for k, n in dem.items():
        if n > 1:
            loi.append(f"{n} dòng `la_mac_dinh` cho {k} — phải đúng một")
    if not dem:
        loi.append("KHÔNG dòng nào `la_mac_dinh`")
    return loi


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tu")
    ap.add_argument("--kiem", action="store_true")
    a = ap.parse_args()

    bang = json.loads(BANG.read_text(encoding="utf-8"))
    nguon = a.tu or bang.get("$nguon_danh_muc")
    if not nguon:
        print("Thiếu `$nguon_danh_muc` và không có `--tu`.", file=sys.stderr)
        return 2

    moi = loc(tai_danh_muc(nguon), bang)
    if not moi:
        print("Lọc ra 0 dòng — KHÔNG ghi. Kiểm `$nha_cho_phep`.", file=sys.stderr)
        return 2

    bang_moi, bao = tron(bang, moi)
    loi = kiem_bat_bien(bang_moi)

    print(f"danh mục: {bao['tong']} dòng dùng được")
    if bao["them"]:
        print(f"  + {len(bao['them'])} mới: {', '.join(bao['them'][:8])}"
              + (" …" if len(bao["them"]) > 8 else ""))
    if bao["bo"]:
        print(f"  − {len(bao['bo'])} biến mất: {', '.join(bao['bo'][:8])}"
              + (" …" if len(bao["bo"]) > 8 else ""))
    for x in loi:
        print(f"  BẤT BIẾN VỠ: {x}")
    if loi:
        print("KHÔNG ghi — bảng vỡ bất biến.", file=sys.stderr)
        return 1

    if a.kiem:
        if json.dumps(bang, sort_keys=True) != json.dumps(bang_moi, sort_keys=True):
            print("LỆCH — bảng không khớp danh mục gateway.", file=sys.stderr)
            return 1
        print("khớp.")
        return 0

    BANG.write_text(json.dumps(bang_moi, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")
    print(f"đã ghi {BANG.relative_to(R)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
