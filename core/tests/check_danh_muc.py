#!/usr/bin/env python3
"""Danh muc `category` — cong chan lech giua cac be mat con lai.

FR-034 THU GON: chan ly danh muc chu de la BANG `categories` trong
kb/_kho.sqlite; `kb/categories.yaml` la EXPORT dan xuat; schema KHONG con enum
(items.pattern kebab thay the — thanh vien kiem bang validate.py --categories).

Ve 1 cu (yaml khop THU TU enum schema) MAT DOI TUONG — enum khong con. Thay
bang hai phep kiem giu dung tinh than "mot su that mot noi khai":

    1. schema khong duoc MOC LAI enum cho category (enum hoi sinh = quay ve
       kien truc 3-noi-khai ma FR-019 tu khai la yeu nhat), va file export
       categories.yaml PHAI TON TAI du rong (thieu file = export gay).
    2. hai ban schema (core/assets vs core/skill-src) khop RANG BUOC — van la
       hai bo kiem tren cung mot kho, lech nhau la lech im lang. (Giu nguyen.)
    3. shell.html khong go tay id chu de nao dang co trong export — form phai
       nap dong qua GET /api/categories. (Giu, doc id tu export thay vi enum;
       ve nay RETIRE khi FE moi thay shell.html o giai doan C.)
"""
import json
import os
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
# Duong MAC DINH la repo. Bien moi truong tro sang kho/schema TAM — cung khuon
# KB_DIR/SCHEMA_DIR cua FR-010/FR-021 (API tung goi script nay lam cong sau ghi;
# FR-034 bo duong goi do nhung test van can kho tam).
_SCHEMA = Path(os.environ["SCHEMA_DIR"]) if os.environ.get("SCHEMA_DIR") else R / "core"
_KB = Path(os.environ["KB_DIR"]) if os.environ.get("KB_DIR") else R / "kb"

CHUAN = _SCHEMA / "assets" / "frontmatter.schema.json"
BAN_HAI = _SCHEMA / "skill-src" / "frontmatter.schema.json"
YAML_CAT = _KB / "categories.yaml"
SHELL = R / "web" / "plugins" / "home-pages" / "shell.html"

# $comment/description la GHI CHU cho nguoi doc — lech o day khong doi hanh vi
# kiem. Chi so rang buoc.
GHI_CHU = ("$comment", "description", "title", "examples")

loi: list[str] = []
print("danh muc category — cong chan lech (FR-034)\n")


def bo_ghi_chu(x):
    """Xoa moi khoa ghi chu, de quy — con lai dung phan rang buoc."""
    if isinstance(x, dict):
        return {k: bo_ghi_chu(v) for k, v in x.items() if k not in GHI_CHU}
    if isinstance(x, list):
        return [bo_ghi_chu(v) for v in x]
    return x


# ---- 1 · schema khong enum + export phai ton tai ---------------------------
chuan = json.loads(CHUAN.read_text(encoding="utf-8"))
cat_items = chuan["properties"]["category"]["items"]
if "enum" in cat_items:
    loi.append(
        "schema con enum cho category — FR-034 bo enum, thanh vien kiem bang "
        "validate.py --categories; enum hoi sinh la quay ve 3-noi-khai"
    )
elif cat_items.get("pattern") != "^[a-z0-9]+(-[a-z0-9]+)*$":
    loi.append("category items thieu pattern kebab ^[a-z0-9]+(-[a-z0-9]+)*$")
else:
    print("  ok   schema dung pattern kebab, khong enum")

ids: list[str] = []
if not YAML_CAT.exists():
    loi.append(f"khong co {YAML_CAT} — export danh muc gay (file phai ton tai du rong)")
else:
    # Doc bang regex, khong can pyyaml: script nay chay trong `make check` va
    # phai chay duoc truoc khi cai phu thuoc.
    ids = re.findall(r"^-\s+id:\s*(\S+)", YAML_CAT.read_text(encoding="utf-8"), re.M)
    print(f"  ok   categories.yaml (export) ton tai — {len(ids)} muc")

# ---- 2 · hai ban schema phai khop RANG BUOC -------------------------------
if not BAN_HAI.exists():
    loi.append(f"khong co {BAN_HAI.relative_to(R)}")
else:
    hai = json.loads(BAN_HAI.read_text(encoding="utf-8"))
    a, b = bo_ghi_chu(chuan), bo_ghi_chu(hai)
    if a != b:
        pa, pb = a.get("properties", {}), b.get("properties", {})
        for k in sorted(set(pa) | set(pb)):
            if k not in pa:
                loi.append(f"schema lech · `{k}` chi co o skill-src")
            elif k not in pb:
                loi.append(f"schema lech · `{k}` chi co o assets")
            elif pa[k] != pb[k]:
                loi.append(f"schema lech · rang buoc `{k}` khac nhau")
        aa, ab = a.get("allOf", []), b.get("allOf", [])
        if len(aa) != len(ab):
            loi.append(f"schema lech · so muc allOf: assets {len(aa)}, skill-src {len(ab)}")
        else:
            # Chi ra DUNG muc nao lech, khong chi noi "khac nhau": muc allOf la
            # `if/then` — biet so thu tu roi van phai mo file doc. In dieu kien.
            for i, (x, y) in enumerate(zip(aa, ab)):
                if x == y:
                    continue
                dk = json.dumps(x.get("if", {}), ensure_ascii=False)[:70]
                loi.append(f"schema lech · allOf[{i}] khac nhau · if={dk}")
        if a.get("required") != b.get("required"):
            loi.append("schema lech · danh sach required khac nhau")
    else:
        print(f"  ok   hai ban schema khop rang buoc ({len(a.get('properties', {}))} property)")

# ---- 3 · shell.html khong duoc go tay id chu de ----------------------------
if not SHELL.exists():
    loi.append(f"khong co {SHELL.relative_to(R)}")
else:
    txt = SHELL.read_text(encoding="utf-8")
    # Chi bat trong the <input value="...">: van ban giai thich duoc phep noi
    # ten mot chu de, thu can chan la CHECKBOX go tay.
    go_tay = [v for v in ids if re.search(rf'<input[^>]*value="{re.escape(v)}"', txt)]
    if go_tay:
        loi.append(
            f"shell.html go tay lai id chu de: {go_tay} — form phai nap qua "
            f"GET /api/categories (moc `<span id=\"f-cat\">`)"
        )
    else:
        print("  ok   shell.html khong go tay gia tri nao — nap dong")

# ---- ket qua -------------------------------------------------------------
if loi:
    print(f"\nFAIL · {len(loi)} lech:\n")
    for d in loi:
        print(f"  x  {d}")
    print("\nFR-034: chan ly danh muc la bang `categories` trong kb/_kho.sqlite.")
    print("categories.yaml la export — sua bang API, dung sua file.")
    print("Hai ban schema: sua core/skill-src cho khop core/assets.")
    sys.exit(1)

print("\npass · category: schema pattern-only, export ton tai, hai schema khop")
