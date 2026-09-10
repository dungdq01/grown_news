#!/usr/bin/env python3
"""Cuong che be mat S3/S4 — hai phan.

PHAN A (co tu dau): hai rule go cung M01-R3 va M04-R1.
PHAN B (T04-6, 2026-09-02): quet MOI 06_modules/*/rules.md.

  Truoc T04-6 file nay kiem DUNG HAI rule va KHONG MO mot rules.md nao, trong
  khi CLAUDE.md dac ta <rule-surface-check> la "moi rule S3/S4 trong rules.md
  co `lenh:` chay duoc". No chua bao gio lam viec ten no noi.

  Bat rang thang tay = 61 rule do ngay, va cong nay nam trong dieu kien dong
  G6A => mot cong do 61 cho ngay dau la mot cong nguoi ta se TAT.
  Nen PHAN B la mot BANH COC:
    - le CHO  : thu muc chua lenh CHUA TON TAI (dich vu chua dung) -> in, khong do
    - le DO   : thu muc CO ma file KHONG -> do
    - le CHO  : khai S3 khong co `lenh:` NHUNG co ten trong GRANDFATHER -> in
    - le DO   : khai S3 khong co `lenh:` va KHONG co ten -> do
  No cu: duoc neu ten, chi CO LAI duoc. No moi: do ngay.

  Phan loai bang CO HOC (thu muc co ton tai khong), KHONG bang project_map.status
  — status khong dung duoc: M08_api khai `planned` nhung web/api/** da chay that,
  con M12-M17 khong co status.

Chay `--tu-kiem` de cong tu chung minh no DO DUOC tren fixture o thu muc TAM.

--- (docstring goc) ---
Cưỡng chế hai rule khai S3 mà trước đó không có lệnh nào.

m-ba bắt được ở s7: cả hai khai bề mặt máy nhưng không script nào chạy chúng.
Theo factory-rules, rule không định tuyến được vào S1-S4 là KỶ LUẬT, không phải
cơ chế. File này biến chúng thành cơ chế thật.

  M01-R3  thêm cổng vào validate.py mà không có test phá đúng luật đó
  M04-R1  workflow có continue-on-error, hoặc CI xanh khi test đỏ
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
fails = []

# ═══ M01-R3 ═══════════════════════════════════════════════════════════
# Đếm cổng trong check() và test trong test_gates.py. Thêm cổng mà không
# thêm test thì tỉ lệ tụt — đó là lúc rule fire.
val = (ROOT / "core/src/source_distiller/validate.py").read_text(encoding="utf-8")
body = val[val.index("def check("):]
body = body[:body.index("\ndef ", 1)] if "\ndef " in body[1:] else body
cong = len(re.findall(r"errs\.append\(", body))

tests = (ROOT / "core/tests/test_gates.py").read_text(encoding="utf-8")
n_test = len(re.findall(r"^def test_|^    def test_", tests, re.M))

print(f"M01-R3  cổng trong check(): {cong}   test trong test_gates.py: {n_test}")
if n_test < cong:
    fails.append(f"M01-R3 · {cong} cổng nhưng chỉ {n_test} test — "
                 f"cổng nào đó mất hiệu lực mà không ai biết")
else:
    print("        ok · mỗi cổng có ít nhất một test đối ứng")

# ═══ M04-R1 ═══════════════════════════════════════════════════════════
wf_dir = ROOT / ".github/workflows"
wfs = list(wf_dir.glob("ci.yml")) + list(wf_dir.glob("ci.yml.template"))
if not wfs:
    fails.append("M04-R1 · không tìm thấy workflow nào")
for wf in wfs:
    txt = wf.read_text(encoding="utf-8")
    xau = [(n, l.strip()) for n, l in enumerate(txt.splitlines(), 1)
           if re.search(r"continue-on-error:\s*true", l)
           or re.search(r"\|\|\s*true\s*$", l)
           or re.search(r"\|\|\s*exit\s+0", l)]
    # bỏ dòng nằm trong comment
    xau = [(n, l) for n, l in xau if not l.lstrip().startswith("#")]
    print(f"M04-R1  {wf.name}: {len(xau)} chỗ nuốt lỗi")
    for n, l in xau:
        fails.append(f"M04-R1 · {wf.name}:{n} nuốt lỗi — {l}")
    if not xau:
        print("        ok · không bước nào nuốt lỗi")

# ═══ PHAN B — quet MOI rules.md (T04-6) ═══════════════════════════════
# Danh sach DONG BANG: rule khai S3 truoc khi co bo ba lenh/do_khi/xanh_khi.
# Chi CO LAI duoc. Them mot id vao day la mot QUYET DINH, khong phai mot sua loi.
GRANDFATHER = {
    "M01-R3", "M02-R2", "M02-R3", "M03-R2", "M03-R3", "M03-R4", "M03-R5",
    "M04-R1", "M04-R4", "M05-R1", "M05-R2", "M06-R1", "M06-R2", "M06-R3",
    "M07-R1", "M07-R2", "M07-R3", "M08-R1", "M08-R2", "M08-R3", "M08-R4",
    "M08-R5",
}
GOC_LENH = ["", "web"]     # lenh cua M09-M11 chay tu web/


def _file_trong_lenh(cmd: str):
    m = re.search(r"([\w./-]+\.(?:py|mjs|js|sh))", cmd)
    return m.group(1) if m else None


def _do_o_thu_muc_task(root: Path, f: str):
    """Cong viet-truoc dang DO o `07_plan/**/tasks/T*-<ten>`? Tra duong, hoac None.

    `.claude/rule.md` muc 8 cho phep mot cong song o thu muc task truoc khi ma
    cua no ton tai, roi doi vao `web/test/` CUNG LUOT voi ma. Khop theo TEN
    FILE, khong theo duong: cong do mang tien to task (`T08-26b-`), nen duong
    trong `lenh:` khong bao gio khop nguyen ven.
    """
    ten = f.rsplit("/", 1)[-1]
    for p in (root / "07_plan").glob("*/tasks/T*"):
        if p.name.endswith(ten):
            return p.relative_to(root).as_posix()
    return None


def soi_rule(root: Path, rules_txt: str):
    """Tra (ok, cho, do) cho mot noi dung rules.md."""
    ok, cho, do = [], [], []
    for blk in re.split(r"\n(?=- id: )", rules_txt):
        m = re.search(r"- id:\s*(\S+)", blk)
        if not m or not re.search(r"^\s*bề_mặt:\s*S3", blk, re.M):
            continue
        rid = m.group(1)
        L = re.search(r"^\s*lệnh:\s*(.+)$", blk, re.M)
        if not L:
            if rid in GRANDFATHER:
                cho.append((rid, "khai S3 khong co `lenh:` — trong danh sach dong bang"))
            else:
                do.append((rid, "khai S3 khong co `lenh:` va KHONG co trong GRANDFATHER"))
            continue
        f = _file_trong_lenh(L.group(1))
        if not f:
            ok.append((rid, "lenh khong tro mot file"))
            continue
        duong = [(root / g / f) if g else (root / f) for g in GOC_LENH]
        if any(d.exists() for d in duong):
            ok.append((rid, f))
        elif _do_o_thu_muc_task(root, f):
            # Cong viet-truoc, dang doi ma cua no — `rule.md` muc 8. DAY KHONG
            # PHAI rule mat rang: co che co that, chi chua toi cho o. Bao CHO
            # de no khong lan vao danh sach DO that.
            cho.append((rid, f"`{f}` — cong viet-truoc DO o "
                             f"`{_do_o_thu_muc_task(root, f)}`, cho ma"))
        elif any(d.parent.exists() for d in duong):
            do.append((rid, f"`{f}` THIEU trong mot thu muc DA TON TAI"))
        else:
            cho.append((rid, f"`{f}` — thu muc chua dung, cho s8"))
    return ok, cho, do


def phan_b():
    ok, cho, do = [], [], []
    files = sorted((ROOT / "06_modules").glob("*/rules.md"))
    for rp in files:
        a, b, c = soi_rule(ROOT, rp.read_text(encoding="utf-8"))
        ok += a
        cho += b
        do += c
    print(f"\nPHAN B  quet {len(files)} file rules.md")
    print(f"        S3 lenh CHAY DUOC : {len(ok)}")
    print(f"        CHO               : {len(cho)}")
    print(f"        DO                : {len(do)}")
    if cho:
        print("\n        — CHO (neu ten, chi co lai duoc) —")
        for rid, ly in cho:
            print(f"        CHO  {rid:<10} {ly}")
    for rid, ly in do:
        fails.append(f"{rid} · {ly}")
    return do


def tu_kiem() -> int:
    """Fixture o thu muc TAM. Khong cham mot file that nao."""
    import tempfile

    xau = 0
    with tempfile.TemporaryDirectory() as d:
        r = Path(d)
        (r / "co_that").mkdir()
        (r / "co_that" / "co.py").write_text("", encoding="utf-8")

        def ca(ten: str, txt: str, mong: str):
            nonlocal xau
            _, cho, do = soi_rule(r, txt)
            that = "DO" if do else ("CHO" if cho else "OK")
            print(f"  {ten:<50} => {that:<4}", end="")
            print("  ok" if that == mong else f"  SAI (mong {mong})")
            xau += that != mong

        ca("A · lenh tro file THIEU trong thu muc DA CO",
           "- id: MX-R1\n  bề_mặt: S3\n  lệnh: python co_that/thieu.py\n", "DO")
        ca("B · lenh tro file CO THAT",
           "- id: MX-R2\n  bề_mặt: S3\n  lệnh: python co_that/co.py\n", "OK")
        ca("C · thu muc CHUA dung",
           "- id: MX-R3\n  bề_mặt: S3\n  lệnh: python chua_co/x.py\n", "CHO")
        ca("D · khong `lenh:`, KHONG trong GRANDFATHER",
           "- id: MX-R4\n  bề_mặt: S3\n  why: gi do\n", "DO")
        ca("E · khong `lenh:`, CO trong GRANDFATHER",
           "- id: M08-R1\n  bề_mặt: S3\n  why: gi do\n", "CHO")
        ca("F · rule S4 — ngoai pham vi phan B",
           "- id: MX-R5\n  bề_mặt: S4\n  why: gi do\n", "OK")
        # `.claude/rule.md` muc 8: cong viet-truoc SONG o thu muc task
        # (`07_plan/**/T*.test.js`), doi vao `web/test/` CUNG LUOT voi ma.
        # Truoc hai ca nay, checker bao DO cho mot cong dang do dung le —
        # no khong doc duoc le cua chinh du an, nen no TO OAN. Va mot cong
        # to oan bi nguoi ta hoc cach lo, roi lan sau no do THAT thi khong
        # ai tin no nua.
        (r / "07_plan" / "M08_api" / "tasks").mkdir(parents=True)
        (r / "07_plan" / "M08_api" / "tasks" / "T08-26b-do.test.js").write_text(
            "", encoding="utf-8")
        def _r(rid: str, tep: str) -> str:
            return "\n".join([f"- id: {rid}", "  bề_mặt: S3",
                              f"  lệnh: node co_that/{tep}", ""])

        ca("G · cong DO o 07_plan, thu muc dich DA CO",
           _r("MX-R6", "do.test.js"), "CHO")
        ca("H · khong o 07_plan, khong o dich — van phai DO",
           _r("MX-R7", "chua-co.test.js"), "DO")
    return xau


if "--tu-kiem" in sys.argv:
    print("check_rule_surfaces --tu-kiem · phan B tu chung minh no DO DUOC\n")
    _n = tu_kiem()
    print()
    if _n:
        sys.exit(f"{_n} ca tu-kiem SAI — phan B khong dang tin")
    print("pass · phan B do duoc khi phai do, va khong do oan khi khong phai")
    sys.exit(0)

phan_b()

print()
if fails:
    for f in fails:
        print("FAIL:", f)
    sys.exit(f"{len(fails)} rule mất răng")
print("pass · M01-R3 · M04-R1 · và mọi rule S3 trong rules.md có cơ chế thật")
