#!/usr/bin/env python3
"""Bon rang cua B-C1 DAO (FR-034): DB la nguon chan ly, file la export.

Thay check_index_dan_xuat.py (FR-023) — doi xung guong: truoc kiem "index la
dan xuat cua file", gio kiem "file la dan xuat cua DB".

  1 · DUNG-LAI-DUOC HAI CHIEU (AC hard cua B-C1 dao): tren ban COPY TAM cua
      kho (kem gieo 3 hinh dang tung lam mat du lieu: bai trung slug khac
      source_type · ban .v<n> · nhan trung trong mot file):
        file → DB₁ → file′ → DB₂ : hash noi dung DB₁ ≡ DB₂, va export(DB₂)
        khong ghi them gi (file′ la fixpoint). Khong ban ghi nao mat.
  2 · MOT CHIEU: xuat_kho.py khong co INSERT INTO / UPDATE ... SET / DELETE
      FROM (chi SELECT); server (web/api/** + web/server.mjs) khong import/
      spawn dung_lai_db.py — duong file→DB tu dong trong server la tai sinh
      "hai nguon chan ly" chieu nguoc.
  3 · API KHONG GHI FILE KHO: dungchung.mjs khong con renameSync/writeFileSync
      tro kho; moi duong ghi DB co banXuat() di kem. RANG NAY CHO B4: truoc
      khi dungchung.mjs co `banXuat` (kien truc cu con chay), no in CHUYEN
      TIEP va khong do — in to, khong im lang.
  4 · .gitignore DUNG CHIEU: co kb/_kho.sqlite (DB khong vao git), KHONG co
      dong nao ignore export .md cua kho (mat export la mat kich ban F4).
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parents[2]
KB = Path(os.environ["KB_DIR"]) if os.environ.get("KB_DIR") else R / "kb"
TOOLS = R / "core" / "tools"
loi: list[str] = []

sys.path.insert(0, str(TOOLS.parent / "tools"))


def chay(script, kb, rec):
    env = dict(os.environ, KB_DIR=str(kb), RECYCLE_DIR=str(rec),
               PYTHONIOENCODING="utf-8")
    return subprocess.run([sys.executable, str(TOOLS / script)],
                          capture_output=True, text=True, env=env)


def gieo(kho: Path):
    """Hinh dang tung lam mat du lieu (FR-023 GD 3) — tu gieo, khong tin kho
    that co san chung — VA mot hang cho MOI BANG (FR-038).

    VI SAO PHAI DU BA BANG: truoc FR-038 ham nay gieo `repo` + `article`, va sau
    khi tach bang CA HAI vao `bai_viet`. Rang hard cua B-C1 dao khi do XANH tren
    mot ban cai dat lam 1/3 viec — `tai_lieu` va `video` khong co mot hang nao di
    qua vong `file → DB₁ → file′ → DB₂`.

    `tai-lieu/trung-ten.md` co CUNG `slug` voi hai ban kia nhung o BANG THU BA:
    hinh dang "trung slug khac source_type" gio trai qua ba bang, va do la ca de
    vo nhat cua phep tach — `slug` mot minh khong con la khoa.

    Ban `tai-lieu` mang `media` THAT + byte trong `_media/`: nhanh `tai_lieu` cua
    view `tham_chieu_media` phai song sot ca vong round-trip. Byte gieo TRUOC
    .md — thieu byte thi `dung_lai_db.py` chet to (M09-R1).
    """
    fm = ("---\nid: src_gieo{n}\nslug: {slug}\nsource_type: {st}\n"
          "review_status: draft\nconcepts: [rag, rag]\n---\n\nthan {n}\n")
    (kho / "repo").mkdir(parents=True, exist_ok=True)
    (kho / "article").mkdir(parents=True, exist_ok=True)
    (kho / "repo" / "trung-ten.md").write_text(
        fm.format(n=1, slug="trung-ten", st="repo"), encoding="utf-8")
    (kho / "article" / "trung-ten.md").write_text(
        fm.format(n=2, slug="trung-ten", st="article"), encoding="utf-8")
    (kho / "article" / "trung-ten.v1.md").write_text(
        fm.format(n=3, slug="trung-ten", st="article"), encoding="utf-8")

    pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n"
    sha = hashlib.sha256(pdf).hexdigest()
    (kho / "_media").mkdir(parents=True, exist_ok=True)
    (kho / "_media" / f"{sha}.pdf").write_bytes(pdf)
    (kho / "tai-lieu").mkdir(parents=True, exist_ok=True)
    (kho / "tai-lieu" / "trung-ten.md").write_text(
        "---\nid: src_gieo4\nslug: trung-ten\nsource_type: tai-lieu\n"
        "review_status: draft\nconcepts: [rag, rag]\nho_so: thu-vien\n"
        f"media:\n  sha256: {sha}\n  mime: application/pdf\n"
        f"  ten_goc: gieo.pdf\n  so_byte: {len(pdf)}\n---\n\nthan 4\n",
        encoding="utf-8")

    (kho / "video").mkdir(parents=True, exist_ok=True)
    (kho / "video" / "gieo-video.md").write_text(
        "---\nid: src_gieo5\nslug: gieo-video\nsource_type: video\n"
        "review_status: draft\nconcepts: [rag, rag]\nho_so: thu-vien\n"
        "url: https://youtu.be/abc123gieo\n"
        "url_normalized: youtube.com/watch?v=abc123gieo\n---\n\nthan 5\n",
        encoding="utf-8")

    # ── So NHAN cho `trung-ten`: DEM MAM DA GIEO, khong go tay ──────────────
    #
    # Con so nay vua het han MOT LAN: no go cung `4` ("2 bai × [rag, rag]") va
    # gieo them mot ban `trung-ten` o bang thu ba lam no sai. Go `6` vao cho `4`
    # la hen lai dung loi do cho lan sua sau. Nen doc tu file THAT vua ghi:
    # `nhan` la view tren `json_each(concepts)` nen mot ban ghi cho DUNG so muc
    # trong `concepts` cua no — ke ca muc trung.
    #
    # `.v<n>` KHONG tinh: no vao `article_versions`, va `nhan` chi doc `ban_ghi`.
    nhan_trung = 0
    for f in kho.rglob("trung-ten.md"):
        than = f.read_text(encoding="utf-8")
        cpt = re.search(r"^concepts:\s*\[(.*)\]\s*$", than, re.M)
        nhan_trung += len([x for x in cpt.group(1).split(",") if x.strip()]) if cpt else 0

    return 4, 1, nhan_trung


print("bon rang cua B-C1 dao (FR-034)\n")

# ---- 1 · round-trip hai chieu tren copy tam --------------------------------
with tempfile.TemporaryDirectory() as td:
    t = Path(td)
    kho1, rac1 = t / "kb1", t / "rac1"
    shutil.copytree(KB, kho1, ignore=shutil.ignore_patterns("_kho.sqlite*", "_index.sqlite*"))
    rac1.mkdir()
    them_bai, them_ban, nhan_trung = gieo(kho1)

    sys.path.insert(0, str(TOOLS))
    import importlib
    # import truc tiep de dem hang + bam noi dung — van CHAY tool qua subprocess
    # de kiem dung duong nguoi dung se chay.
    r1 = chay("dung_lai_db.py", kho1, rac1)
    if r1.returncode != 0:
        loi.append(f"dung_lai_db lan 1 do: {r1.stderr[-300:]}")
    else:
        import sqlite3
        cn = sqlite3.connect(kho1 / "_kho.sqlite")
        so_bai = cn.execute("SELECT count(*) FROM ban_ghi").fetchone()[0]
        so_ban = cn.execute("SELECT count(*) FROM article_versions").fetchone()[0]
        so_nhan = cn.execute(
            "SELECT count(*) FROM nhan WHERE slug='trung-ten' AND loai='concept'"
        ).fetchone()[0]
        cn.close()
        if so_bai < them_bai or so_ban < them_ban:
            loi.append(f"MAT BAN GHI: {so_bai} bai/{so_ban} ban luu tru sau gieo "
                       f"(can >= {them_bai}/{them_ban}) — khoa kep vo")
        # nhan cua cac bai trung-ten phai tach theo source_type — va tu FR-038 la
        # tach theo BA BANG. Ky vong dem tu mam gieo, khong go tay (xem gieo()).
        if so_nhan != nhan_trung:
            loi.append(f"nhan trung-ten = {so_nhan}, can {nhan_trung} (dem tu mam "
                       "gieo) — nhan gop sai hoac mot bang roi khoi view `nhan`")

        r2 = chay("xuat_kho.py", kho1, rac1)
        if r2.returncode != 0:
            loi.append(f"xuat_kho lan 1 do: {r2.stderr[-300:]}")
        else:
            def bam_db(p):
                import dung_lai_db as mod
                return mod.bam_noi_dung(p)
            h1 = bam_db(kho1 / "_kho.sqlite")
            r3 = chay("dung_lai_db.py", kho1, rac1)   # import lai tu file′
            h2 = bam_db(kho1 / "_kho.sqlite")
            r4 = chay("xuat_kho.py", kho1, rac1)      # export lan 2
            if h1 != h2:
                loi.append(f"DB₁ ≠ DB₂ sau round-trip ({h1} vs {h2}) — export mat thong tin")
            elif "ghi 0" not in r4.stdout:
                loi.append(f"export lan 2 van ghi ({r4.stdout.strip()}) — file′ chua la fixpoint")
            else:
                print(f"  ok   round-trip: DB₁ ≡ DB₂ ({h1}) · export lan 2 ghi 0 · "
                      f"{so_bai} bai, khong mat ban ghi nao")

# ---- 2 · mot chieu ----------------------------------------------------------
xk = (TOOLS / "xuat_kho.py").read_text(encoding="utf-8")
sql_ghi = re.findall(r"INSERT INTO|UPDATE \w+ SET|DELETE FROM", xk)
if sql_ghi:
    loi.append(f"xuat_kho.py co SQL ghi: {sorted(set(sql_ghi))} — no chi duoc SELECT")
else:
    print("  ok   xuat_kho.py chi SELECT — mot chieu DB→file")

server_files = list((R / "web" / "api").glob("*.mjs")) + [R / "web" / "server.mjs"]
dinh = []
for f in server_files:
    if not f.exists():
        continue
    code = f.read_text(encoding="utf-8")
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)
    code = re.sub(r"^\s*//.*$", "", code, flags=re.M)
    # Chi bat dong THUC THI (spawn/require/import) — nhac ten trong Error
    # message huong dan nguoi dung ("chay: python ... dung_lai_db.py") la hop le.
    for line in code.splitlines():
        if "dung_lai_db" in line and re.search(r"spawn|require|import|exec", line):
            dinh.append(f.name)
            break
if dinh:
    loi.append(f"server import/spawn dung_lai_db.py o {dinh} — duong file→DB tu dong bi cam")
else:
    print("  ok   server khong dinh dung_lai_db.py")

# ---- 3 · API khong ghi file kho (cho B4 — in to khi chua flip) --------------
dc = R / "web" / "api" / "dungchung.mjs"
txt = dc.read_text(encoding="utf-8") if dc.exists() else ""
if "banXuat" not in txt:
    print("  ..   CHUYEN TIEP — dungchung.mjs chua co banXuat (truoc B4); "
          "rang 3 se sac khi flip API")
else:
    # Bo comment de khong bat nham chu trong ghi chu.
    code = re.sub(r"/\*.*?\*/", "", txt, flags=re.S)
    code = re.sub(r"^\s*//.*$", "", code, flags=re.M)
    ghi_file = [m for m in re.findall(r"\w+Sync\(", code)
                if m in ("writeFileSync(", "renameSync(", "appendFileSync(")]
    # mkdtemp (compose tmp cho validate) la duong ghi HOP LE duy nhat — dem
    # so lan dung ngoai khoi tmp bang cach tim bien KB trong cung dong.
    dong_kb = [l for l in code.splitlines()
               if re.search(r"(writeFileSync|renameSync|appendFileSync)\(", l)
               and re.search(r"\bKB\b|kb/", l)]
    if dong_kb:
        loi.append(f"dungchung.mjs con {len(dong_kb)} dong ghi file tro kho: "
                   f"{dong_kb[0].strip()[:80]}…")
    else:
        print(f"  ok   dungchung.mjs khong ghi file kho ({len(ghi_file)} *Sync deu ngoai kho)")

# ---- 4 · .gitignore dung chieu ----------------------------------------------
gi = (R / ".gitignore").read_text(encoding="utf-8")
dong_gi = [l.strip() for l in gi.splitlines() if l.strip() and not l.startswith("#")]
if "kb/_kho.sqlite" not in dong_gi:
    loi.append(".gitignore thieu kb/_kho.sqlite — DB se vao git (repo phinh + conflict binary)")
xau = [l for l in dong_gi if re.match(r"kb/(\*\*/)?\*?\.?md$|kb/\*\*$|kb/$|kb$", l)]
if xau:
    loi.append(f".gitignore ignore export cua kho: {xau} — mat backup F4")
if "kb/_kho.sqlite" in dong_gi and not xau:
    print("  ok   .gitignore dung chieu: DB ngoai git, export .md trong git")

# ---- ket qua ----------------------------------------------------------------
if loi:
    print(f"\nFAIL · {len(loi)} rang gay:\n")
    for d in loi:
        print(f"  x  {d}")
    sys.exit(1)
print("\npass · export la dan xuat that: dung lai duoc, mot chieu, DB ngoai git")
