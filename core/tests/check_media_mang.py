#!/usr/bin/env python3
"""Z3 cua FR-052 — `media` thanh MANG ma luat mo coi VAN thay moi sha256.

VI SAO CONG NAY TON TAI, va vi sao no la cong DANG SO nhat cua FR-052:

  xuat_kho.py:182   `if isinstance(m, dict) and m.get("sha256")`
  dung_lai_db.py:81 `if isinstance(m, dict) and m.get("sha256")`

Voi `media` la MANG, `isinstance(m, dict)` la **False** => tap `can_byte` RONG
=> `can_media` RONG => xuat_kho.py:194-199:

      for f in sorted(d.iterdir()):
          if f.is_file() and f not in can_media:
              xoa_ben_bi(f)

  ... XOA MOI FILE trong kb/_media/.

Khong mot ngoai le. Doi schema ma quen hai dong do la MAT TOAN BO BYTE HIEN VAT,
va no xay ra **im lang** trong mot lenh chay tu dong sau moi phep ghi
(`banXuat()` o dungchung.mjs:375).

DDL da viet ca mot doan de ke chuyen nay: "Bo sot mot nhanh thi moi DELETE pha
byte vinh vien". Day la cung loi do, nhung do MOT KIEU DU LIEU thay vi mot nhanh.

Chay `--tu-kiem` de cong tu chung minh no DO DUOC.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Hai cho THU TAP con tro media. Ca hai phai xu ly MANG.
NGUON = [
    ROOT / "core/tools/xuat_kho.py",
    ROOT / "core/tools/dung_lai_db.py",
]


def sha_tu_media(m) -> list[str]:
    """Bo con tro sha256 tu mot gia tri `media` — HINH DANG CHUAN.

    Chap nhan CA HAI: dict (bản cu) va list (FR-052). Doc bản cu de di tru
    khong phai mot ngay co: mot ban ghi chua di tru VAN doc duoc.
    """
    if isinstance(m, dict):
        return [str(m["sha256"])] if m.get("sha256") else []
    if isinstance(m, list):
        return [str(x["sha256"]) for x in m
                if isinstance(x, dict) and x.get("sha256")]
    return []


def ve1_nguon_xu_ly_mang() -> list[str]:
    """Moi file thu tap con tro phai xu ly `list` NGAY TAI CHO thu tap.

    LUOT DAU TOI DO SAI, va no DUONG TINH GIA:
      Toi hoi "file nay co chua `isinstance(..., list)` o dau khong?".
      xuat_kho.py CO — o dong 126, cho mot viec HOAN TOAN KHAC (gom nhan).
      Nen cong bao xuat_kho.py DAT trong khi dong 182 cua no van chi kiem dict.
      Do la phep do PHAM VI FILE cho mot bat bien PHAM VI DONG.
      => Sieu ve dung cho: doc 6 dong quanh moi `isinstance(m, dict)`.

    Day la lan thu TU trong phien toi viet cong khop mot HINH DANG thay vi do
    mot BAT BIEN (truoc do: V3b vi tri ky tu · X6 regex ca cau · Y3 danh sach
    toan tu). Ghi ra ngay tai day vi day la cho nguoi ta doc khi cong nay do.
    """
    loi = []
    for f in NGUON:
        if not f.exists():
            loi.append(f"khong tim thay {f}")
            continue
        dong = f.read_text(encoding="utf-8").split("\n")
        trong_docstring = False
        for i, d in enumerate(dong):
            # BO dong BINH LUAN va DOCSTRING.
            #
            # Luot truoc cong nay do 3 vi pham, va HAI trong ba la binh luan cua
            # CHINH TOI: toi viet "ban dau doan nay kiem `isinstance(m, dict)`"
            # de giai thich, va cong dem cau giai thich do la mot vi pham.
            # Day la lan thu NAM trong phien mot literal trong chu thich pha mot
            # phep dem (truoc do: AC-3.1 dem INSERT · Y3 · va cac-man-con-lai:117).
            # Luat: phep dem tren MA NGUON phai bo chu thich, khong co ngoai le.
            if d.count('"""') % 2 == 1:
                trong_docstring = not trong_docstring
                continue
            if trong_docstring or d.lstrip().startswith("#"):
                continue
            if not re.search(r"isinstance\(\s*m\s*,\s*dict\s*\)", d):
                continue
            # Cua so 6 dong quanh cho kiem — du de thay mot nhanh `list` di kem.
            quanh = "\n".join(dong[max(0, i - 3):i + 4])
            if not re.search(r"isinstance\(\s*\w+\s*,\s*list\s*\)|sha_tu_media", quanh):
                loi.append(
                    f"{f.name}:{i + 1} kiem `isinstance(m, dict)` ma trong 6 dong "
                    f"quanh do KHONG co nhanh `list` — voi `media` la MANG, tap "
                    f"con tro se RONG va vong reap XOA MOI BYTE trong kb/_media/"
                )
    return loi


def ve2_schema_cho_mang() -> list[str]:
    """`frontmatter.schema.json` phai khai `media` la mang, `minItems: 1`."""
    p = ROOT / "core/assets/frontmatter.schema.json"
    if not p.exists():
        return [f"khong tim thay {p}"]
    m = json.loads(p.read_text(encoding="utf-8"))["properties"].get("media")
    if m is None:
        return ["schema khong khai `media`"]
    loi = []
    if m.get("type") != "array":
        loi.append(f"`media.type` = {m.get('type')!r}, mong 'array' (FR-052 cach 1)")
    elif m.get("minItems") != 1:
        # `media: []` la mot trang thai VO NGHIA — ho so `thu-vien` doi CO hien
        # vat. Mang rong phai la "khong khai media", khong phai "khai mang rong".
        loi.append(f"`media.minItems` = {m.get('minItems')!r}, mong 1")
    return loi


def tu_kiem() -> int:
    """Chung minh `sha_tu_media` bat DUOC ca hai hinh dang, va do dung so."""
    xau = 0

    def ca(ten, gt, mong):
        nonlocal xau
        that = sha_tu_media(gt)
        dung = that == mong
        print(f"  {'ok  ' if dung else 'SAI '} {ten:<46} => {that}")
        if not dung:
            xau += 1

    ca("dict co sha256 (ban cu)", {"sha256": "aa", "mime": "x"}, ["aa"])
    ca("mang MOT phan tu", [{"sha256": "aa"}], ["aa"])
    ca("mang BA phan tu (M16: slide+giong+video)",
       [{"sha256": "aa"}, {"sha256": "bb"}, {"sha256": "cc"}], ["aa", "bb", "cc"])
    ca("mang rong", [], [])
    ca("None", None, [])
    ca("mang co phan tu thieu sha256", [{"mime": "x"}, {"sha256": "bb"}], ["bb"])
    ca("dict thieu sha256", {"mime": "x"}, [])
    return xau


def main() -> int:
    if "--tu-kiem" in sys.argv:
        print("check_media_mang --tu-kiem · phep bo con tro\n")
        n = tu_kiem()
        print()
        if n:
            sys.exit(f"{n} ca tu-kiem SAI")
        print("pass · bo duoc ca dict lan list, dung so phan tu")
        return 0

    loi = []
    print("1 · nguon thu tap con tro media phai xu ly MANG\n")
    r = ve1_nguon_xu_ly_mang()
    loi.extend(r)
    print("  " + ("\n  ".join(r) if r else f"ok · {len(NGUON)}/{len(NGUON)} file xu ly duoc mang"))

    print("\n2 · schema khai `media` la mang, minItems 1\n")
    r = ve2_schema_cho_mang()
    loi.extend(r)
    print("  " + ("\n  ".join(r) if r else "ok · type=array, minItems=1"))

    print("\n" + "-" * 56)
    if loi:
        for x in loi:
            print("FAIL:", x)
        sys.exit(f"{len(loi)} vi pham Z3/Z4 (FR-052)")
    print("pass · FR-052 cach 1 — mang, va luat mo coi thay moi sha256")
    return 0


if __name__ == "__main__":
    sys.exit(main())
