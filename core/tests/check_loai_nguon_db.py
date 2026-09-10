#!/usr/bin/env python3
"""WO-019 — bang `loai_nguon` trong DB, va vong xuat/nhap cua no.

Nguoi dung: *"ban can luu cac du lieu cua muc phan loai nay vao bang DB — giong
concept va category ay, ko duoc hardcode"* · *"quan ly danh sach LOAI NGUON do ->
loai nguon nao ung voi PHAN LOAI nao"*.

NAM VE, va ve thu hai la ve nang:

  1 · Bang co that, hinh dang dung. `module` noi loai nguon nay thuoc phan loai
      nao — do chinh la quan he nguoi dung hoi.

  2 · DIEM BAT DONG: file -> DB1 -> file' -> DB2 cho DB1 == DB2, va export(DB2)
      khong ghi them gi. Mot bang moi KHONG di qua phep kiem nay la mot bang co
      the mat sach sau mot vong export — dung thu `check_export_dan_xuat` sinh ra
      de chan.

  3 · GIEO TU BANG KHAI khi bang RONG. Kho moi tinh phai co san 14 loai nguon,
      khong bat nguoi dung go tay. Nguon gieo: `loai-nguon.json` (bai viet) +
      `media-mime.json` (dinh dang · noi phat).

      Day KHONG vi pham M02-R3: loai nguon la enum cua schema va whitelist,
      khong phai nhan nguoi tao. `concepts`/`categories` thi nguoc lai — may
      KHONG duoc tu sinh, va cong nay khong dong den chung.

  4 · CA AM: gieo KHONG duoc de. Nguoi dung sua nhan roi chay lai `dung_lai_db`
      thi sua do phai con. Gieo moi lan la xoa cong nguoi dung, im lang.

  5 · CA AM: `source_type` VAN o file khai. Bang moi khong thay `loai-nguon.json`
      — file do sinh `CHECK` cua DDL, va `coFileBai()` cung phep kiem `type` cua
      route phai chay KHI DB CHUA TON TAI.
"""
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parents[2]
TOOLS = R / "core" / "tools"
ASSETS = R / "core" / "assets"
loi: list[str] = []


def ok(dieu, ten, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {ten}" + ("" if dieu or not vi_sao
                                                     else f"  <- {vi_sao}"))
    if not dieu:
        loi.append(ten)


def chay(script, kb, rec):
    env = dict(os.environ, KB_DIR=str(kb), RECYCLE_DIR=str(rec),
               PYTHONIOENCODING="utf-8")
    return subprocess.run([sys.executable, str(TOOLS / script)],
                          capture_output=True, text=True, env=env)


def gieo(kho: Path):
    """Mot ban ghi cho MOI module — khong co no thi phep dem duoi vo can cu."""
    (kho / "_media").mkdir(parents=True, exist_ok=True)
    pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n"
    import hashlib
    sha = hashlib.sha256(pdf).hexdigest()
    (kho / "_media" / f"{sha}.pdf").write_bytes(pdf)
    than = ("\n## Overview\n\nMot cau.\n\n## Boi canh\n\nHai cau.\n"
            "\n## Tinh tuy\n\nBa cau.\n\n## Doi chieu\n\nBon.\n\n## Rui ro\n\nNam.\n")
    for thu, (d, slug, st, them) in enumerate([
        ("paper", "ln-paper", "paper", {}),
        ("tai-lieu", "ln-tl", "tai-lieu", {
            "ho_so": "thu-vien",
            "media": {"sha256": sha, "mime": "application/pdf",
                      "ten_goc": "bia.pdf", "so_byte": len(pdf)}}),
        ("video", "ln-vd", "video", {
            "ho_so": "thu-vien", "url": "https://youtu.be/abc123lnguon",
            "url_normalized": "youtube.com/watch?v=abc123lnguon"}),
    ]):
        fm = {"id": f"src_lnguon{thu}0", "slug": slug, "source_type": st,
              "url": f"https://example.com/{slug}", "protocol_version": "2.0",
              "analyzed_at": "2026-08-29", "one_liner": f"Ban thu {slug}",
              "credibility_max": "plausible", "review_status": "approved",
              "origin": "manual", "conformance": "B", **them}
        (kho / d).mkdir(parents=True, exist_ok=True)
        yaml_dong = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}"
                              for k, v in fm.items())
        (kho / d / f"{slug}.md").write_text(f"---\n{yaml_dong}\n---\n{than}",
                                            encoding="utf-8")


def dem(db: Path, sql: str):
    """Tra ve RONG khi khong doc duoc — moi cho goi la mot phep kiem, va mot
    phep kiem phai BAO chu khong CHET. Bang chua ton tai la ket qua hop le cua
    lan chay dau (R5: do truoc), khong phai loi cua cong."""
    if not db.exists():
        return []
    cn = sqlite3.connect(db)
    try:
        return cn.execute(sql).fetchall()
    except sqlite3.OperationalError:
        return []
    finally:
        cn.close()


print("\n1 · Bang `loai_nguon` co that, hinh dang dung\n")

ddl = (ASSETS / "kho.schema.sql").read_text(encoding="utf-8")
ok("CREATE TABLE loai_nguon" in ddl, "DDL khai bang `loai_nguon`",
   "nguoi dung: *luu cac du lieu cua muc phan loai nay vao bang DB*")
for cot in ("id", "module", "nhan"):
    ok(bool(ddl.count("loai_nguon") and cot in ddl.split("loai_nguon", 1)[1][:400]),
       f"  co cot `{cot}`",
       "`module` la thu tra loi *loai nguon nao ung voi phan loai nao*")

print("\n2 · DIEM BAT DONG: file -> DB1 -> file' -> DB2\n")

with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as td:
    t = Path(td)
    kho1, rac1 = t / "kb1", t / "rac1"
    kho1.mkdir()
    rac1.mkdir()
    gieo(kho1)

    r = chay("dung_lai_db.py", kho1, rac1)
    ok(r.returncode == 0, "dung_lai_db lan 1 chay duoc", r.stderr[-260:])
    db1 = kho1 / "_kho.sqlite"
    ok(db1.exists(), "  DB1 duoc dung")

    if db1.exists():
        try:
            h1 = dem(db1, "SELECT id,module,nhan FROM loai_nguon ORDER BY id")
        except sqlite3.OperationalError as e:
            h1 = []
            ok(False, "  doc duoc bang `loai_nguon` tu DB1", str(e))
        ok(len(h1) > 0, f"  DB1 co {len(h1)} loai nguon",
           "bang rong ⇒ man Danh muc rong, va nguoi dung phai go tay 14 dong")

        r = chay("xuat_kho.py", kho1, rac1)
        ok(r.returncode == 0, "xuat_kho lan 1 chay duoc", r.stderr[-260:])
        f1 = kho1 / "loai-nguon.yaml"
        ok(f1.exists(), "  xuat ra `loai-nguon.yaml`",
           "khong xuat ⇒ DB la chan ly nhung khong ai doc duoc no ngoai SQL")

        if f1.exists():
            # vong hai: dung lai tu chinh file vua xuat
            kho2, rac2 = t / "kb2", t / "rac2"
            import shutil
            shutil.copytree(kho1, kho2)
            rac2.mkdir()
            (kho2 / "_kho.sqlite").unlink(missing_ok=True)
            r = chay("dung_lai_db.py", kho2, rac2)
            ok(r.returncode == 0, "dung_lai_db lan 2 chay duoc", r.stderr[-260:])
            db2 = kho2 / "_kho.sqlite"
            h2 = dem(db2, "SELECT id,module,nhan FROM loai_nguon ORDER BY id") \
                if db2.exists() else []
            ok(h1 == h2, f"DB1 == DB2 ({len(h1)} vs {len(h2)} hang)",
               "mot vong export/import lam doi noi dung ⇒ bang nay se troi")

            truoc = f1.read_bytes()
            chay("xuat_kho.py", kho2, rac2)
            sau = (kho2 / "loai-nguon.yaml").read_bytes()
            ok(truoc == sau, "export(DB2) == file' (diem bat dong)",
               "export lan hai ghi khac ⇒ moi lan chay lai la mot diff rac")

print("\n3 · GIEO tu bang khai khi bang RONG\n")

bangJ = json.loads((ASSETS / "loai-nguon.json").read_text(encoding="utf-8"))
media = json.loads((ASSETS / "media-mime.json").read_text(encoding="utf-8"))
cho = (len(next(m for m in bangJ["module"] if m["ten"] == "bai-viet")["loai"])
       + len(media["loai"]) + 1                      # + `mac_dinh`
       + len(media["video_host"]) + 1)               # + `tai-len`
with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as td:
    t = Path(td)
    kho, rac = t / "kb", t / "rac"
    kho.mkdir()
    rac.mkdir()
    gieo(kho)
    chay("dung_lai_db.py", kho, rac)
    db = kho / "_kho.sqlite"
    try:
        hang = dem(db, "SELECT id,module FROM loai_nguon")
    except Exception:
        hang = []
    ok(len(hang) == cho, f"gieo du {cho} loai nguon (duoc {len(hang)})",
       "kho moi tinh phai co san danh sach — bat go tay 14 dong la bat lam viec "
       "cua may")
    mod = {m for _, m in hang}
    ok(mod == {"bai-viet", "tai-lieu", "video"},
       f"  du ba phan loai (duoc {sorted(mod)})",
       "thieu mot phan loai ⇒ man Danh muc mat mot nhom")

    print("\n4 · CA AM: gieo KHONG de sua cua nguoi dung\n")
    # BOC: bang chua ton tai thi muc nay phai BAO, khong duoc CHET — mot cong
    # chet khong noi duoc rang nao dang canh gi.
    try:
        cn = sqlite3.connect(db)
        cn.execute("UPDATE loai_nguon SET nhan='TEN NGUOI DUNG DAT' "
                   "WHERE id=(SELECT id FROM loai_nguon LIMIT 1)")
        cn.commit()
        cn.close()
    except Exception as e:
        ok(False, "sua duoc mot nhan de thu ca am", str(e))
    chay("xuat_kho.py", kho, rac)
    chay("dung_lai_db.py", kho, rac)
    con = dem(db, "SELECT COUNT(*) FROM loai_nguon WHERE nhan='TEN NGUOI DUNG DAT'")
    ok(con and con[0][0] == 1, "sua cua nguoi dung SONG qua mot vong dung lai",
       "gieo chay moi lan ⇒ xoa cong nguoi dung, im lang")

print("\n5 · CA AM: `source_type` VAN o file khai\n")

ok((ASSETS / "loai-nguon.json").exists(), "`loai-nguon.json` van con",
   "file do sinh `CHECK` cua DDL; bo di la mat rang buoc enum")
dung = (R / "web" / "api" / "dungchung.mjs").read_text(encoding="utf-8")
ok("loai-nguon.json" in dung, "`dungchung.mjs` van doc file khai (khong doc DB)",
   "`coFileBai()` va phep kiem `type` cua route phai chay KHI DB CHUA TON TAI")

print("\n" + "-" * 56)
if loi:
    for l in loi:
        print("  -", l)
    print(f"{len(loi)} van de")
    sys.exit(1)
print("bang `loai_nguon`: co that · bat dong · gieo dung · khong de sua")
