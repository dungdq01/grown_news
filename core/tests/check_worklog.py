"""Kiem moi file WORKLOG.md trong web/: duong dan co that, lenh npm co that,
so lieu khop thuc te, va moi plugin/test deu duoc nhac.

Tai lieu lac hau la loai hong IM LANG: nguoi doc go mot lenh sai roi mat long
tin vao ca nhung phan dung.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
WEB = R / "web"
loi = []

# os.walk + cắt nhánh TRƯỚC khi đi vào — không phải rglob rồi lọc SAU:
# rglob duyệt hết cây trước khi filter chạy, mà _quartz chứa junction
# (link-plugins.mjs) trỏ ngược về web/plugins ⇒ pathlib scandir một FILE
# qua junction và sập NotADirectoryError trước khi filter kịp bỏ nó.
BO_QUA = ("_quartz", "node_modules", ".git")


def tim_thay(goc, ten_file):
    """Có file tên này ở đâu đó dưới goc không — cùng luật cắt nhánh."""
    for dirpath, dirnames, filenames in os.walk(goc):
        dirnames[:] = [d for d in dirnames if d not in BO_QUA]
        if ten_file in filenames:
            return True
    return False


files = []
for dirpath, dirnames, filenames in os.walk(WEB):
    dirnames[:] = [d for d in dirnames if d not in BO_QUA]
    if "WORKLOG.md" in filenames:
        files.append(Path(dirpath) / "WORKLOG.md")
files = sorted(files)
print(f"{len(files)} file WORKLOG.md\n")

pkg = json.loads((WEB / "package.json").read_text(encoding="utf-8"))

for f in files:
    t = f.read_text(encoding="utf-8")
    ten = str(f.relative_to(WEB))
    print(f"── {ten} ({len(t.splitlines())} dong)")

    # 1 · lien ket markdown [x](y)
    for m in re.finditer(r"\[[^\]]+\]\(([^)]+)\)", t):
        u = m.group(1)
        if u.startswith(("http", "#")):
            continue
        p = (f.parent / u).resolve()
        if not p.exists():
            print(f"   FAIL link chet: {u}")
            loi.append(f"{ten}: link {u}")

    # 2 · lenh npm run X
    for m in re.finditer(r"npm run ([\w:]+)", t):
        s = m.group(1)
        if s not in pkg["scripts"]:
            print(f"   FAIL npm run {s} khong co")
            loi.append(f"{ten}: npm run {s}")

    # 3 · file .test.js nhac toi
    for m in re.finditer(r"`?(\w[\w-]*)\.test\.js`?", t):
        p = WEB / "test" / f"{m.group(1)}.test.js"
        if not p.exists():
            print(f"   FAIL {m.group(1)}.test.js khong co")
            loi.append(f"{ten}: {m.group(1)}.test.js")

    # 4 · duong dan file trong backtick
    for m in re.finditer(r"`([\w./_-]+\.(?:ts|js|mjs|css|scss|html|json|yaml|py|md))`", t):
        u = m.group(1)
        # Bo qua ten file TRICH DAN lam vi du, khong phai duong dan trong repo:
        #   /index.css, component-<hash>.css  — Quartz sinh luc build
        #   QuartzComponent.css               — ten thuoc tinh trong API
        if (u.startswith(("http", "~", "/")) or "<" in u or "*" in u
                or u.startswith("Quartz") or re.match(r"^(component|index)-?\w*\.css$", u)):
            continue
        ten_file = u.split("/")[-1]
        co = ((f.parent / u).exists() or (WEB / u).exists() or (R / u).exists()
              or tim_thay(WEB, ten_file) or tim_thay(R, ten_file))
        if not co:
            print(f"   FAIL duong dan: {u}")
            loi.append(f"{ten}: {u}")

print()

# 5 · so lieu phai khop thuc te
n_plugin = len([d for d in (WEB / "plugins").iterdir() if d.is_dir()])
n_test = len(list((WEB / "test").glob("*.test.js")))
n_proto = len((WEB / "styles" / "prototype.css").read_text(encoding="utf-8").splitlines())
shell = (WEB / "plugins" / "home-pages" / "shell.html").read_text(encoding="utf-8")

goc = (WEB / "WORKLOG.md").read_text(encoding="utf-8")
plug = (WEB / "plugins" / "WORKLOG.md").read_text(encoding="utf-8")
tst = (WEB / "test" / "WORKLOG.md").read_text(encoding="utf-8")
sty = (WEB / "styles" / "WORKLOG.md").read_text(encoding="utf-8")

for ten, thuc, doc, o in [
    ("plugin", n_plugin, str(n_plugin), goc),
    ("test", n_test, str(n_test), goc),
    ("dong prototype.css", n_proto, str(n_proto), sty),
    ("ky tu shell.html", len(shell), str(len(shell)), plug),
]:
    # Tai lieu viet so co dau phan cach (10.448) — bo dau truoc khi so
    ok = doc in o.replace(".", "").replace(",", "") or doc in o
    print(f"  {'ok  ' if ok else 'FAIL'} {ten}: thuc te {thuc}")
    if not ok:
        loi.append(f"so lieu {ten} = {thuc} khong khop tai lieu")

# 6 · sau plugin deu duoc nhac
for d in sorted((WEB / "plugins").iterdir()):
    if not d.is_dir():
        continue
    if d.name not in plug:
        print(f"  FAIL plugin {d.name} khong duoc nhac trong plugins/WORKLOG.md")
        loi.append(f"plugin {d.name} thieu tai lieu")

# 7 · muoi test deu duoc nhac
for p in sorted((WEB / "test").glob("*.test.js")):
    ten = p.stem.replace(".test", "")
    if ten not in tst:
        print(f"  FAIL test {ten} khong duoc nhac trong test/WORKLOG.md")
        loi.append(f"test {ten} thieu tai lieu")

print("\n" + "-" * 56)
if loi:
    for x in sorted(set(loi)):
        print("  -", x)
    sys.exit(f"{len(set(loi))} van de")
print("4 file WORKLOG.md: duong dan co that, lenh co that, so lieu khop")
