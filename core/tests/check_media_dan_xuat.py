#!/usr/bin/env python3
"""M09-R1 · BYTE đi trọn vòng DB → file → DB, và luật MỒ CÔI hợp UNION BA bảng.

Vì sao cổng này tồn tại, nói bằng một câu: bỏ sót `recycle` khỏi tập tham chiếu
thì MỖI DELETE phá byte vĩnh viễn, và `phucHoi()` sau đó VẪN BÁO THÀNH CÔNG —
nó chạy lại validate, mà validate không bao giờ thấy blob. Mất dữ liệu im lặng
với bộ test xanh. Đây là rule nguy hiểm nhất của M09_thuvien.

Fixture ở thư mục TẠM. Cổng này thử XOÁ và thử LÀM HỎNG, và làm hai việc đó
trên kho thật là đúng điều CẤM "sửa file thật để thử một cổng".

Vòng tròn đo bằng ĐIỂM BẤT ĐỘNG, không đo bằng cách so với bản dựng tay:
    DB(tay) → export1 → DB2 → export2 ,  rồi đòi bam_cay(export1) == bam_cay(export2)
Bản dựng tay không phải chân lý về định dạng export; điểm bất động thì có.
"""
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(R / "core" / "tools"))
from xuat_kho import bam_cay  # noqa: E402

PY = sys.executable
DDL = (R / "core" / "assets" / "kho.schema.sql").read_text(encoding="utf-8")
XUAT = R / "core" / "tools" / "xuat_kho.py"
NAP = R / "core" / "tools" / "dung_lai_db.py"

PDF = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n"
SHA = hashlib.sha256(PDF).hexdigest()

loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


def fm_tai_lieu(slug):
    return json.dumps({
        "id": "src_tl0001", "slug": slug, "source_type": "tai-lieu",
        "url": f"kho://tai-lieu/{slug}", "protocol_version": "2.0",
        "analyzed_at": "2026-08-27", "one_liner": "Tai lieu thu",
        "credibility_max": "plausible", "review_status": "draft",
        "origin": "manual", "conformance": "B", "word_count": 5,
        "ho_so": "thu-vien",
        "media": {"sha256": SHA, "mime": "application/pdf",
                  "ten_goc": "bia.pdf", "so_byte": len(PDF)},
    }, ensure_ascii=False)


def dung_db(duong: Path, *, o_articles=True, o_versions=False, o_recycle=False,
            co_byte=True):
    """DB fixture: cùng một con trỏ media, đặt ở (những) bảng được chọn."""
    duong.parent.mkdir(parents=True, exist_ok=True)
    cn = sqlite3.connect(duong)
    cn.executescript(DDL)
    than = "Ghi chu ngan ve tai lieu."
    if o_articles:
        # `tai-lieu` vao bang `tai_lieu` (FR-038) — ban ghi fixture la MOT TAI LIEU,
        # nen dinh tuyen sai bang la fixture noi mot dieu khac voi cai no khai.
        cn.execute("INSERT INTO tai_lieu (source_type,slug,frontmatter,than,version,etag)"
                   " VALUES ('tai-lieu','tai-lieu-thu',?,?,1,'0000000000000000')",
                   (fm_tai_lieu("tai-lieu-thu"), than))
    if o_versions:
        cn.execute("INSERT INTO article_versions (source_type,slug,ban,frontmatter,than)"
                   " VALUES ('tai-lieu','tai-lieu-thu',1,?,?)",
                   (fm_tai_lieu("tai-lieu-thu"), than))
    if o_recycle:
        cn.execute("INSERT INTO recycle (stt,source_type,slug,frontmatter,than,deleted_at)"
                   " VALUES (1,'tai-lieu','tai-lieu-thu',?,?,'2026-08-27T10:00:00Z')",
                   (fm_tai_lieu("tai-lieu-thu"), than))
    if co_byte:
        cn.execute("INSERT INTO media (sha256,byte) VALUES (?,?)", (SHA, PDF))
    cn.commit()
    cn.close()


def chay(script, kb, rac, *them):
    return subprocess.run(
        [PY, str(script), *them],
        cwd=R, capture_output=True,
        env={**os.environ, "PYTHONIOENCODING": "utf-8",
             "KB_DIR": str(kb), "RECYCLE_DIR": str(rac)})


def duong_media(kb: Path):
    d = kb / "_media"
    return sorted(d.iterdir()) if d.exists() else []


print("\n1 · Byte RA khỏi DB — export ghi kb/_media/<sha256>.<duoi>\n")

with tempfile.TemporaryDirectory() as t:
    kb, rac = Path(t) / "kb", Path(t) / "_recycle"
    dung_db(kb / "_kho.sqlite")
    r = chay(XUAT, kb, rac)
    ok(r.returncode == 0, "xuat_kho chay xong", r.stderr.decode("utf-8", "replace")[-300:])
    f = kb / "_media" / f"{SHA}.pdf"
    ok(f.exists(), "byte ra dung ten <sha256>.pdf — duoi tu media-mime.json",
       f"thay: {[p.name for p in duong_media(kb)]}")
    ok(f.exists() and f.read_bytes() == PDF, "byte KHOP tung byte voi blob trong DB")
    # Ten file la sha256 cua chinh noi dung — kiem tai cho, khong tin loi khai.
    ok(f.exists() and hashlib.sha256(f.read_bytes()).hexdigest() == f.stem,
       "ten file la sha256 CUA CHINH noi dung file")

print("\n2 · Luat MO COI hop UNION BA bang (M09-R1)\n")

for ten_ca, tham_so in (
    ("chi `tai_lieu` tro", dict(o_articles=True)),
    ("chi `article_versions` tro (ban luu tru)", dict(o_articles=False, o_versions=True)),
    ("chi `recycle` tro (bai DA XOA — do_khi cua M09-R1)",
     dict(o_articles=False, o_recycle=True)),
):
    with tempfile.TemporaryDirectory() as t:
        kb, rac = Path(t) / "kb", Path(t) / "_recycle"
        dung_db(kb / "_kho.sqlite", **tham_so)
        chay(XUAT, kb, rac)
        con = (kb / "_media" / f"{SHA}.pdf").exists()
        ok(con, f"{ten_ca} ⇒ byte CON",
           "bo sot bang nay khoi tap tham chieu la mat du lieu im lang")

with tempfile.TemporaryDirectory() as t:
    # xanh_khi: bo tham chieu CUOI ⇒ byte phai bi reap. Khong co ca nay thi
    # "luat mo coi" chi la mot cau noi — mot exporter khong bao gio reap cung
    # di qua moi phep kiem o tren.
    kb, rac = Path(t) / "kb", Path(t) / "_recycle"
    f = kb / "_media" / f"{SHA}.pdf"
    # Export MOT LAN CO tham chieu truoc, de file that su ton tai. Neu chay
    # thang ca "khong ai tro" thi `not f.exists()` dung san — mot phep kiem tu
    # vo hieu, xanh ma khong chung minh gi. Lop loi nay repo da an bon lan.
    dung_db(kb / "_kho.sqlite")
    chay(XUAT, kb, rac)
    ok(f.exists(), "  (tien de) file co that truoc khi do phep reap")
    cn = sqlite3.connect(kb / "_kho.sqlite")
    cn.execute("DELETE FROM tai_lieu")
    cn.commit(); cn.close()
    chay(XUAT, kb, rac)
    ok(not f.exists(), "khong bang nao tro ⇒ byte BI REAP (xanh_khi)",
       f"con lai: {[p.name for p in duong_media(kb)]}")

with tempfile.TemporaryDirectory() as t:
    # Va reap chi an file MO COI: mot file la trong _media bi xoa, file dang
    # duoc tro KHONG bi xoa cung. Cong reap qua tay la cong an du lieu that.
    kb, rac = Path(t) / "kb", Path(t) / "_recycle"
    dung_db(kb / "_kho.sqlite")
    chay(XUAT, kb, rac)
    la = kb / "_media" / ("a" * 64 + ".pdf")
    la.parent.mkdir(parents=True, exist_ok=True)
    la.write_bytes(b"%PDF-lang")
    chay(XUAT, kb, rac)
    ok((kb / "_media" / f"{SHA}.pdf").exists() and not la.exists(),
       "reap chi an file mo coi, khong an file dang duoc tro")

print("\n3 · bam_cay() phai hash ca _media — khong thi --kiem NOI DOI\n")

with tempfile.TemporaryDirectory() as t:
    kb, rac = Path(t) / "kb", Path(t) / "_recycle"
    dung_db(kb / "_kho.sqlite")
    chay(XUAT, kb, rac)
    h1 = bam_cay(kb, rac)
    f = kb / "_media" / f"{SHA}.pdf"
    f.write_bytes(PDF + b"\n% da doi")
    h2 = bam_cay(kb, rac)
    ok(h1 != h2, "doi mot byte trong _media ⇒ bam_cay DOI",
       f"ca hai lan cung {h1} — --kiem khai 'export tat dinh' ma bo qua byte")
    f.write_bytes(PDF)
    ok(bam_cay(kb, rac) == h1, "khoi phuc byte ⇒ bam_cay ve dung gia tri cu")

print("\n4 · Diem bat dong: DB → file → DB → file, cung byte\n")

with tempfile.TemporaryDirectory() as t:
    goc = Path(t)
    kb1, rac1 = goc / "k1" / "kb", goc / "k1" / "_recycle"
    dung_db(kb1 / "_kho.sqlite")
    chay(XUAT, kb1, rac1)

    # Cay export SACH (khong mang DB cu sang) — dung_lai_db phai dung lai duoc
    # tu FILE, do la ca ban backup F4 dang mo phong.
    kb2, rac2 = goc / "k2" / "kb", goc / "k2" / "_recycle"
    shutil.copytree(kb1, kb2)
    (kb2 / "_kho.sqlite").unlink()
    if rac1.exists():
        shutil.copytree(rac1, rac2)

    r = chay(NAP, kb2, rac2)
    ra = (r.stdout + r.stderr).decode("utf-8", "replace")
    ok(r.returncode == 0, "dung_lai_db dung lai DB tu cay export co media", ra[-300:])

    if (kb2 / "_kho.sqlite").exists():
        cn = sqlite3.connect(kb2 / "_kho.sqlite")
        hang = cn.execute("SELECT sha256, byte, la_dan_xuat FROM media").fetchall()
        cn.close()
        ok(len(hang) == 1 and hang[0][0] == SHA and bytes(hang[0][1]) == PDF,
           "bang media dung lai DUNG mot dong, byte nguyen ven",
           f"thay {len(hang)} dong")
        ok(len(hang) == 1 and hang[0][2] == 0,
           "la_dan_xuat = 0 — ban export khong bao gio la ban dan xuat")
    else:
        ok(False, "bang media dung lai duoc", "khong co DB")

    # Export lan hai: chi mang DB da dung lai sang mot cay TRONG, roi export vao
    # do. Xoa file cu truoc khi so — neu khong thi "cung byte" cung dung khi
    # exporter khong ghi gi ca, va phep kiem thanh vo can cu.
    kb2b, rac2b = goc / "k2b" / "kb", goc / "k2b" / "_recycle"
    kb2b.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(kb2, kb2b)
    for f in (kb2b / "_media").iterdir():
        f.unlink()
    for d in kb2b.iterdir():
        if d.is_dir() and d.name != "_media":
            shutil.rmtree(d)
    r = chay(XUAT, kb2b, rac2b)
    ok(r.returncode == 0, "export lan hai tu DB da dung lai", r.stderr.decode()[-200:])
    h1, h2 = bam_cay(kb1, rac1), bam_cay(kb2b, rac2b)
    ok(h1 == h2, "DIEM BAT DONG: hai cay export cung byte (ke ca _media)",
       f"{h1} != {h2}")

print("\n5 · Con tro treo va khoa NOI DOI — dung_lai_db phai chet TO\n")

with tempfile.TemporaryDirectory() as t:
    goc = Path(t)
    kb1, rac1 = goc / "k1" / "kb", goc / "k1" / "_recycle"
    dung_db(kb1 / "_kho.sqlite")
    chay(XUAT, kb1, rac1)

    kb2 = goc / "k2" / "kb"
    shutil.copytree(kb1, kb2)
    (kb2 / "_kho.sqlite").unlink()
    for f in (kb2 / "_media").iterdir():
        f.unlink()
    r = chay(NAP, kb2, goc / "k2" / "_recycle")
    ra = (r.stdout + r.stderr).decode("utf-8", "replace")
    # "exit khac 0" MOT MINH khong chung minh gi: mot SyntaxError trong chinh
    # dung_lai_db.py cung exit khac 0, va da thuc su xay ra mot lan trong lan
    # viet nay — ca §5 "xanh" trong khi file khong parse noi. Nen doi DUNG lai
    # khai cua guard, va doi KHONG phai loi cua trinh thong dich.
    ok(r.returncode != 0 and "con tro media TREO" in ra,
       "`.md` khai media.sha256 ma thieu byte ⇒ exit khac 0, dung loi cua guard",
       f"exit={r.returncode}; {ra[-260:]}")
    ok("Error" not in ra.split("FAIL ·")[0],
       "  (va do khong phai vi script tu no vo)", ra[:200])
    ok(SHA in ra, "va noi RA sha256 nao thieu", ra[-200:])

    kb3 = goc / "k3" / "kb"
    shutil.copytree(kb1, kb3)
    (kb3 / "_kho.sqlite").unlink()
    f = kb3 / "_media" / f"{SHA}.pdf"
    f.write_bytes(b"%PDF-noi-doi")     # ten file khong con la sha256 cua noi dung
    r = chay(NAP, kb3, goc / "k3" / "_recycle")
    ra = (r.stdout + r.stderr).decode("utf-8", "replace")
    ok(r.returncode != 0 and "NOI DOI" in ra,
       "byte khong bam ra dung TEN FILE ⇒ exit khac 0, dung loi cua guard",
       f"exit={r.returncode}; {ra[-260:]}")

print("\n6 · --kiem van tat dinh khi kho co hien vat\n")

with tempfile.TemporaryDirectory() as t:
    kb, rac = Path(t) / "kb", Path(t) / "_recycle"
    dung_db(kb / "_kho.sqlite")
    r = chay(XUAT, kb, rac, "--kiem")
    ra = (r.stdout + r.stderr).decode("utf-8", "replace")
    ok(r.returncode == 0, "xuat_kho --kiem xanh", ra[-300:])

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} van de — byte KHONG di tron vong")
print("pass · byte di tron vong DB→file→DB; mo coi tinh tu BA bang; khoa khong noi doi")
