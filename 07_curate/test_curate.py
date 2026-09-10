#!/usr/bin/env python3
"""AC cua T07-1.

  -k bai_chet        AC1 decay_risk high qua nguong => trong bao cao
  -k draft_dong      AC2 draft qua nguong => trong bao cao
  -k kho_rong        AC3 kho RONG khong loi, in "khong co gi phai lam"
  -k nhip            AC4 de xuat gop concept KHONG co trong bao cao tuan
  -k khong_hardcode  AC5 khong con so nguong nao trong ma
  -k khong_ghi       AC6 khong duong ghi nao vao kb/
"""
import re
import sys
import tempfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from curate import bao_cao_thang, bao_cao_tuan, chay, doc_kho, doc_nguong, quet  # noqa: E402

NGUONG = doc_nguong()
HOM_NAY = date(2026, 8, 19)
loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + (f"  {ct}" if not dk else ""))
    if not dk:
        loi.append(ten)


def kho(*ban):
    """Dung kho tam. Tra Path."""
    d = Path(tempfile.mkdtemp())
    for i, fm in enumerate(ban):
        dong = "\n".join(f"{k}: {v!r}" if isinstance(v, str) else f"{k}: {v}"
                         for k, v in fm.items())
        # Ten file theo SLUG, giong kb/ that (kb/<loai>/<slug>.md) — luot dau
        # toi dat b0.md nen test tim slug trong duong dan khong thay.
        p = d / (fm.get("source_type", "article")) / f"{fm.get('slug', 'b%d' % i)}.md"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(f"---\n{dong}\n---\n\n## 1. Boi canh\nx\n", encoding="utf-8")
    return d


def ban(**kw):
    fm = {"id": "src_x", "slug": "s", "source_type": "article",
          "review_status": "approved", "analyzed_at": "2026-08-01",
          "decay_risk": "low", "title": "Bai thu"}
    fm.update(kw)
    return fm


# ═══ AC1 ══════════════════════════════════════════════════════════════════
def bai_chet():
    print("\nAC1 - bai decay_risk high qua nguong => trong bao cao\n")
    n = NGUONG["decay_stale_days"]
    d = kho(ban(decay_risk="high", analyzed_at="2025-01-01", slug="cu"),
            ban(decay_risk="high", analyzed_at="2026-08-18", slug="moi"),
            ban(decay_risk="low", analyzed_at="2020-01-01", slug="cu-nhung-low"))
    kq = quet(doc_kho(d), NGUONG, HOM_NAY)
    ten = [b["slug"] for b, _ in kq["bai_chet"]]
    ok("cu" in ten, f"bai high qua {n} ngay => co trong bao cao", f"{ten}")
    ok("moi" not in ten, "bai high moi => KHONG bao")
    ok("cu-nhung-low" not in ten, "bai cu nhung decay low => KHONG bao")

    bc = bao_cao_tuan(kq, HOM_NAY, NGUONG)
    ok("cu" in bc, "duong dan xuat hien trong van ban bao cao")
    ok("re-analyze" in bc, "goi y hanh dong: xep hang cho re-analyze")


# ═══ AC2 ══════════════════════════════════════════════════════════════════
def draft_dong():
    print("\nAC2 - draft qua nguong => trong bao cao\n")
    n = NGUONG["draft_stale_days"]
    d = kho(ban(review_status="draft", analyzed_at="2026-01-01", slug="dong"),
            ban(review_status="draft", analyzed_at="2026-08-18", slug="vua-nap"),
            ban(review_status="approved", analyzed_at="2020-01-01", slug="da-duyet"))
    kq = quet(doc_kho(d), NGUONG, HOM_NAY)
    ten = [b["slug"] for b, _ in kq["draft_dong"]]
    ok("dong" in ten, f"draft qua {n} ngay => co trong bao cao", f"{ten}")
    ok("vua-nap" not in ten, "draft vua nap => KHONG nhac")
    ok("da-duyet" not in ten, "ban da duyet => KHONG nhac")
    ok(kq["draft"] == 2, "dem dung so draft", f"{kq['draft']}")


# ═══ AC3 ══════════════════════════════════════════════════════════════════
def kho_rong():
    print("\nAC3 - kho RONG: duong chay DAU TIEN cua module\n")
    d = Path(tempfile.mkdtemp())
    kq = quet(doc_kho(d), NGUONG, HOM_NAY)
    ok(kq["tong"] == 0, "doc kho rong khong no")

    for nhip, ham in (("tuan", bao_cao_tuan), ("thang", bao_cao_thang)):
        bc = ham(kq, HOM_NAY, NGUONG)
        ok(len(bc.strip()) > 20, f"bao cao {nhip} KHONG de trong",
           "rong khac han voi 'chua quet'")
        ok("0" in bc, f"bao cao {nhip} in con so 0")
    ok("Không có gì phải làm" in bao_cao_tuan(kq, HOM_NAY, NGUONG),
       "noi ro DA QUET va khong co gi")

    # kb/ khong ton tai cung khong duoc no
    kq2 = quet(doc_kho(Path(tempfile.mkdtemp()) / "khong-ton-tai"), NGUONG, HOM_NAY)
    ok(kq2["tong"] == 0, "kb/ khong ton tai => khong no")


# ═══ AC4 ══════════════════════════════════════════════════════════════════
def nhip():
    print("\nAC4 - de xuat gop concept KHONG co trong bao cao tuan (M07-R3)\n")
    d = kho(ban(concepts_proposed=["rag-pipeline", "rag-pipelines"], slug="a"),
            ban(concepts_proposed=["RAG_Pipeline"], slug="b"))
    kq = quet(doc_kho(d), NGUONG, HOM_NAY)
    ok(len(kq["gop_concept"]) >= 1, "phat hien nhom trung nghia", f"{kq['gop_concept']}")

    tuan = bao_cao_tuan(kq, HOM_NAY, NGUONG)
    thang = bao_cao_thang(kq, HOM_NAY, NGUONG)
    ok("gop" not in tuan.lower() and "gộp" not in tuan.lower(),
       "bao cao TUAN khong nhac gop concept",
       "nhac qua thuong => nguoi ta tat thong bao => mat luon nhac quan trong")
    ok("gộp" in thang.lower(), "bao cao THANG co de xuat gop")
    ok("người chốt" in thang or "nguoi chot" in thang,
       "ghi ro may CHI GOI Y, nguoi chot")


# ═══ AC5 ══════════════════════════════════════════════════════════════════
def khong_hardcode():
    print("\nAC5 - khong con so nguong nao trong ma (M07-R2)\n")
    src = (HERE / "curate.py").read_text(encoding="utf-8")
    # Bo comment va docstring truoc khi quet
    ma = re.sub(r'"""[\s\S]*?"""', "", src)
    ma = re.sub(r"#.*$", "", ma, flags=re.M)

    for k, v in NGUONG.items():
        co = re.search(rf"\b{v}\b", ma)
        ok(not co, f"gia tri {k}={v} KHONG xuat hien trong ma",
           "kho dang 0 bai nen nguong SE SAI — rai trong ma thi phai di tim tung cho")

    for k in NGUONG:
        ok(f'nguong["{k}"]' in ma or f"nguong['{k}']" in ma,
           f"doc {k} tu thresholds.yaml")


# ═══ AC6 ══════════════════════════════════════════════════════════════════
def khong_ghi():
    print("\nAC6 - khong duong ghi nao vao kb/ (M07-R1)\n")
    src = (HERE / "curate.py").read_text(encoding="utf-8")

    for mau, mo in [(r"KB\s*/[^)]*write", "ghi vao KB"),
                    (r"write_text\([^)]*kb", "write_text vao kb"),
                    (r"open\([^)]*kb[^)]*[\"']w", "open kb che do ghi"),
                    (r"shutil\.(move|copy)[^)]*kb", "move/copy vao kb")]:
        co = re.search(mau, src, re.I)
        ok(not co, f"khong {mo}")

    # Chay that: quet mot kho roi khang dinh khong file nao doi
    d = kho(ban(review_status="draft", analyzed_at="2026-01-01"))
    truoc = {p: p.read_bytes() for p in d.rglob("*.md")}
    with tempfile.TemporaryDirectory() as out:
        chay("week", kb=d, hom_nay=HOM_NAY, out=out)
        chay("month", kb=d, hom_nay=HOM_NAY, out=out)
        ok(len(list(Path(out).glob("*.md"))) == 2, "sinh 2 bao cao")
    sau = {p: p.read_bytes() for p in d.rglob("*.md")}
    ok(truoc == sau, "KHONG file nao trong kho doi sau khi quet",
       "kb/ vua la nguon chan ly vua la thu M1 do")


CHON = {"bai_chet": bai_chet, "draft_dong": draft_dong, "kho_rong": kho_rong,
        "nhip": nhip, "khong_hardcode": khong_hardcode, "khong_ghi": khong_ghi}

k = sys.argv[sys.argv.index("-k") + 1] if "-k" in sys.argv else None
for ten, fn in CHON.items():
    if not k or k == ten:
        fn()
print()
sys.exit(f"{len(loi)} loi" if loi else 0)
