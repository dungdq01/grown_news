#!/usr/bin/env python3
"""kb-mock/ phai sach — tru DUNG MOT ca am da khai trong contract.

VI SAO CO SCRIPT NAY (FR-015):

`kb-mock/` nam TRONG git va la thu ban `/mock/` render, nhung khong lenh nao
tung validate no. `kb/` thi rong (0 bai) nen moi cong deu xanh. Ket qua:
contract thieu 3 truong M1 tu FR-001 ma song duoc toi FR-015 — 37 loi im lang.

VI SAO KHONG PHAI MOT DONG TRONG ci.yml:

Luot dau toi viet truc tiep vao ci.yml:

    python ... validate.py kb-mock/ --strict > mock.log 2>&1 || true
    n=$(grep -oE '[0-9]+ loi' ...); test "${n:-0}" -le 1

Hai loi, ca hai tu bat duoc:

  1 `|| true` la NUOT LOI — `check_rule_surfaces.py` bat dung cum do va bao
    "M04-R1 mat rang". Cong ma nuot exit code thi khong phai cong.

  2 Nguong DEM (`-le 1`) cho qua mot loi BAT KY, khong rieng ca am da biet.
    Toi tu kiem bang mot file co tinh lam hong (doi ten `insight_new`) va no
    CHO QUA. Loc theo SO LUONG khong bao gio dung — phai loc theo NOI DUNG.

CA AM DUY NHAT duoc phep:

`blog-prompt-caching` khai citations_verified(1) < sampled(2). Contract khai ro
o khoa `$case`: "EDGE — DAI CANH BAO: external + trich dan khong kiem duoc + co
phan bien". Do la du lieu mau de test dai canh bao — sua no la bo mat mot phep
kiem.
"""
import re
import subprocess
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
KHO = R / "kb-mock"
VALIDATE = R / "core" / "src" / "source_distiller" / "validate.py"

# Ca am da khai trong contract ($case). Khop theo NOI DUNG dong loi.
CA_AM = ("Spot-check trượt",)

if not KHO.exists():
    print("khong co kb-mock/ — bo qua (chay `python core/tools/sinh_kb_mock.py`)")
    sys.exit(0)

r = subprocess.run(
    [sys.executable, str(VALIDATE), str(KHO), "--strict"],
    capture_output=True, text=True, encoding="utf-8",
    env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"},
)
ra = (r.stdout or "") + (r.stderr or "")

# Moi dong loi, tru ca am
dong_loi = [d.strip() for d in ra.splitlines() if "✗" in d]
la = [d for d in dong_loi if not any(c in d for c in CA_AM)]
am = [d for d in dong_loi if any(c in d for c in CA_AM)]

print("kb-mock/ — kho mau phai sach\n")
tom = next((d for d in ra.splitlines() if re.search(r"\d+ file", d)), "").strip()
if tom:
    print(f"  {tom}")
for d in am:
    print(f"  ok   ca am da khai: {d}")

if la:
    print(f"\nFAIL · {len(la)} loi NGOAI ca am da khai:\n")
    for d in la:
        print(f"  {d}")
    print("\nSinh lai kho: python core/tools/sinh_kb_mock.py")
    print("word_count lech thi: python core/src/source_distiller/validate.py kb-mock/ --fix")
    print("Loi o contract (frozen) thi phai mo FR — xem FR-015.")
    sys.exit(1)

print(f"\npass · kb-mock/ sach ({len(am)} ca am co y, 0 loi that)")
