"""Kiem moi lenh trong RUNNING.md chay that.

Tai lieu tro vao lenh hong con te hon khong co tai lieu: nguoi doc mat long tin
vao CA nhung phan dung.
"""
import os
import re
import subprocess
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
PY = sys.executable
ENV = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}

txt = (R / "RUNNING.md").read_text(encoding="utf-8")

# Lenh python trong bang va khoi code
lenh = set()
for m in re.finditer(r"`(python [^`]+)`", txt):
    lenh.add(m.group(1).strip())
for m in re.finditer(r"^(python \S.*)$", txt, re.M):
    # Bo comment cuoi dong: bang lenh co "# giai thich" phia sau
    lenh.add(re.sub(r"\s+#.*$", "", m.group(1)).strip())

BO_QUA = {"python --version", "python -m pip install -e \"./core[dev]\""}

# Lenh ghi/sua: chi kiem CU PHAP, khong chay that.
#
# WO-039 · BO PHAT HIEN NAY DOAN TU HAU TO CO, va do la mot heuristic dung cho
# ba lenh roi IM LANG SAI o lenh thu tu: `python 07_curate/curate.py week` GHI
# ma khong co co nao, nen no lot qua va sinh 07_curate/reports/2026-Wxx.md moi
# lan ai chay bo cong.
#
# Nen tu day co HAI tang: bang duoi (doan, re, chay truoc) va LUOI o cuoi file
# (do that, bat ca lop). Bang mot minh khong du — no chi biet nhung gi da biet.
CHI_CU_PHAP = ("--fix", "--ghi", "--ky")

# WO-039 · va DUONG DAN cua lenh ghi ma khong co co nao. Danh sach nay se
# khong bao gio day — nen LUOI o duoi moi la thu bat ca lop; bang nay chi de
# khong sinh vet ngay tu dau.
#
# curate.py: ve "chay that" cua no KHONG mat — 07_curate/test_curate.py chay no
# thật (Makefile:56). Day la chia viec, khong phai bo viec.
GHI_KHONG_CO = ("07_curate/curate.py",)


def chup_cay():
    """Chup working tree: (trang thai git, bam noi dung moi file dang doi).

    Bam ca noi dung chu khong chi `git status`: mot lenh GHI DE mot file da
    dang `M` thi porcelain khong doi, nhung noi dung doi. Chi so sanh porcelain
    la mot luoi co lo dung o cho de lot nhat.

    Gioi han da biet: lenh nao ghi ra noi dung Y HET thu dang co thi luoi khong
    thay — va dung, vi no khong doi gi."""
    import hashlib

    r = subprocess.run(["git", "status", "--porcelain"], cwd=R,
                       capture_output=True, text=True, encoding="utf-8",
                       errors="replace")
    if r.returncode != 0:
        return None            # khong phai git repo: luoi tat, khong gia vo
    trang_thai = r.stdout
    bam = {}
    for dong in trang_thai.splitlines():
        duong = dong[3:].strip().strip('"')
        f = R / duong
        if f.is_file():
            bam[duong] = hashlib.sha256(f.read_bytes()).hexdigest()[:16]
    return trang_thai, bam


def so_cay(truoc, sau):
    """Tra danh sach duong da doi giua hai lan chup."""
    if truoc is None or sau is None:
        return []
    t_tt, t_bam = truoc
    s_tt, s_bam = sau
    doi = []
    for d in set(s_tt.splitlines()) - set(t_tt.splitlines()):
        doi.append(d[3:].strip().strip('"') + " (moi/doi trang thai)")
    for d, h in s_bam.items():
        if d in t_bam and t_bam[d] != h:
            doi.append(d + " (ghi de)")
    return sorted(set(doi))

loi = []
print("Lenh python trong RUNNING.md\n")
for c in sorted(lenh):
    if c in BO_QUA:
        print(f"  bo qua  {c}")
        continue
    args = c.split()
    args[0] = PY
    if any(k in c for k in CHI_CU_PHAP) or any(g in c for g in GHI_KHONG_CO):
        # Chay --help hoac chi import de khong doi du lieu
        f = next((a for a in args if a.endswith(".py")), None)
        if f and (R / f).exists():
            r = subprocess.run([PY, "-c", f"compile(open(r'{R / f}',encoding='utf-8').read(),'x','exec')"],
                               capture_output=True, env=ENV)
            ok = r.returncode == 0
            print(f"  {'ok  ' if ok else 'FAIL'} {c}   (chi kiem cu phap - lenh nay GHI)")
            if not ok:
                loi.append(c)
        continue

    # LUOI · WO-039: chup truoc, so sau. Cong khong duoc de vet.
    truoc = chup_cay()
    r = subprocess.run(args, cwd=R, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=ENV, timeout=180)
    ok = r.returncode == 0
    print(f"  {'ok  ' if ok else 'FAIL'} {c}")
    if not ok:
        loi.append(c)
        for l in (r.stdout + r.stderr).strip().splitlines()[-2:]:
            print(f"         {l[:88]}")
    vet = so_cay(truoc, chup_cay())
    if vet:
        print(f"  FAIL {c}   ĐỂ LẠI VẾT trong working tree:")
        for v in vet[:4]:
            print(f"         {v}")
        loi.append(f"{c} — de lai vet: {', '.join(vet[:3])}")

# Script npm
print("\nScript npm trong RUNNING.md\n")
import json
pkg = json.loads((R / "web" / "package.json").read_text(encoding="utf-8"))
for m in re.finditer(r"`npm (?:run )?(\w+)`", txt):
    s = m.group(1)
    if s in ("install", "ci"):
        continue
    co = s in pkg["scripts"]
    print(f"  {'ok  ' if co else 'FAIL'} npm run {s}")
    if not co:
        loi.append(f"npm run {s}")

# Duong dan nhac toi
print("\nDuong dan nhac toi\n")
for m in re.finditer(r"`([\w./_-]+\.(?:py|md|json|yaml|yml|mjs|css|ts))`", txt):
    p = m.group(1)
    if p.startswith(("http", "~")) or "*" in p or p.count("/") > 4:
        continue
    if "<" in p:
        continue
    # Tai lieu hay nhac TEN FILE ngan (draft.py) thay vi duong day du.
    # Tim o bat ky dau trong repo truoc khi ket luan la sai.
    #
    # rglob boc trong os.walk co onerror-bo-qua: web/_quartz/.quartz/plugins/
    # la RUNG SYMLINK do `npm run link` tao — pathlib.rglob dam vao mot symlink
    # tro FILE va nem NotADirectoryError giua chung, giet ca cong vi mot thu
    # muc se bien mat o C6. Bo qua loi duyet, khong bo qua ket qua.
    import os
    def _tim(mau_duoi, loc_quartz=False):
        for goc_d, dirs, files in os.walk(R, onerror=lambda e: None):
            if "node_modules" in goc_d or (loc_quartz and "_quartz" in goc_d):
                dirs[:] = []
                continue
            for f in files:
                duong = os.path.join(goc_d, f).replace("\\", "/")
                if duong.endswith("/" + mau_duoi):
                    return True
        return False
    ten = p.split("/")[-1]
    co = ((R / p).exists() or (R / "web" / p).exists()
          or _tim(p) or _tim(ten, loc_quartz=True))
    if not co:
        print(f"  FAIL {p}")
        loi.append(p)

print("\n" + "-" * 54)
if loi:
    for l in sorted(set(loi)):
        print("  -", l)
    sys.exit(f"{len(set(loi))} muc trong RUNNING.md khong chay/khong ton tai")
print("RUNNING.md: moi lenh chay that, moi duong dan ton tai")
