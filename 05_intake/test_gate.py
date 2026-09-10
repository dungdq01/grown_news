#!/usr/bin/env python3
"""AC cua T05-1 va T05-2.

  -k tra_lai            AC1 file thieu truong bi tra lai, KHONG vao kb/
  -k khong_tu_dien      AC2 M05 khong tu dien truong thieu
  -k draft_external     AC3 ban qua cong luon draft + origin external
  -k khong_frontmatter  AC4 tra lai kem khung
  -k co_cach_sua        T05-2 moi loi co dong SUA kem hanh dong cu the
"""
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "core" / "src"))

from gate import BAT_BUOC_NGUOI, chay, gac  # noqa: E402
from source_distiller.validate import SCHEMA_PATH  # noqa: E402

SCHEMA = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + (f"  {ct}" if not dk else ""))
    if not dk:
        loi.append(ten)


# Than bai dung TU KHUNG KHAI, khong go tay. Ban truoc go cung 9 muc voi mot
# BO TEN KHAC han bo ten trong form — ca hai qua cong vi cong chi ep SO muc.
from source_distiller.khung import than_mau  # noqa: E402

THAN = than_mau({
    "1": "Mot cau.",
    "2": "Ngắn gọn.",
    "3.2": "Chi tiết [x.py:10-40] " + "thêm chữ cho thân bài đủ dày " * 10,
})


def ban(**kw):
    fm = {
        "id": "src_abc123", "slug": "ban-thu", "source_type": "article",
        "url": "https://vd.blog/bai", "protocol_version": "2.0",
        "analyzed_at": "2026-08-19", "one_liner": "Mot cau.",
        "credibility_max": "plausible", "independent_sources": 2,
        "conformance": "C", "citations_sampled": 2, "citations_verified": 2,
    }
    fm.update(kw)
    dong = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fm.items()
                     if v is not None)
    return f"---\n{dong}\n---\n\n{THAN}\n"


# ═══ AC1 · tra lai ════════════════════════════════════════════════════════
def tra_lai():
    print("\nAC1 - file thieu truong bi TRA LAI, khong vao kb/\n")
    for truong in ("id", "slug", "credibility_max", "one_liner"):
        with tempfile.TemporaryDirectory() as d:
            k, fm, tb = gac(ban(**{truong: None}), schema=SCHEMA, tmp=d)
        ok(not k, f"thieu {truong} => tra lai", f"duoc ok={k}")
        ok(truong in tb, f"thong bao neu ten truong thieu: {truong}", tb[:70])

    with tempfile.TemporaryDirectory() as d:
        k, _, _ = gac(ban(), schema=SCHEMA, tmp=d)
    ok(k, "ban day du => vao kho", "cong do gia thi nguoi se bo duong M05")


# ═══ AC2 · khong tu dien ═════════════════════════════════════════════════
def khong_tu_dien():
    print("\nAC2 - M05 KHONG tu dien truong thieu (M05-R2)\n")
    with tempfile.TemporaryDirectory() as d:
        _, fm, _ = gac(ban(id=None, credibility_max=None), schema=SCHEMA, tmp=d)
    ok(not fm.get("id"), "khong tu sinh id", f"dien {fm.get('id')!r}")
    ok(not fm.get("credibility_max"), "khong tu doan credibility_max",
       f"dien {fm.get('credibility_max')!r}")
    ok(not fm.get("concepts"), "khong tu gan concepts")
    ok(fm.get("word_count") is not None,
       "NHUNG co tinh word_count - do la PHEP TINH, khong phai phan doan")


# ═══ AC3 · draft + external ══════════════════════════════════════════════
def draft_external():
    print("\nAC3 - ban qua cong luon draft + origin external (M05-R1)\n")
    with tempfile.TemporaryDirectory() as d:
        k, fm, _ = gac(ban(), schema=SCHEMA, tmp=d)
    ok(k and fm["review_status"] == "draft", "review_status = draft",
       f"duoc {fm.get('review_status')!r}")
    ok(fm["origin"] == "external", "origin = external", f"duoc {fm.get('origin')!r}")

    # Ban khai approved van bi ha xuong draft
    with tempfile.TemporaryDirectory() as d:
        _, fm2, _ = gac(ban(review_status="approved"), schema=SCHEMA, tmp=d)
    ok(fm2["review_status"] == "draft",
       "khai approved van bi ha xuong draft",
       "cho vao thang approved la mo duong vong qua TOAN BO giao thuc")

    ok(fm.get("url_normalized") == "vd.blog/bai",
       "tinh url_normalized", f"duoc {fm.get('url_normalized')!r}")


# ═══ AC4 · khong frontmatter ═════════════════════════════════════════════
def khong_frontmatter():
    print("\nAC4 - file khong frontmatter => tra lai KEM KHUNG\n")
    with tempfile.TemporaryDirectory() as d:
        k, fm, tb = gac("# Chi la markdown thuan\n\nKhong co YAML.\n", schema=SCHEMA, tmp=d)
    ok(not k, "khong vao kho")
    ok(fm is None, "khong sinh frontmatter gia")
    for t in ("id: src_", "slug:", "source_type:", "citations_sampled"):
        ok(t in tb, f"khung co {t!r}")
    ok("SỬA:" in tb, "co dong SUA")


# ═══ T05-2 · loi noi duoc cach sua ═══════════════════════════════════════
def co_cach_sua():
    print("\nT05-2 - moi loi kem dong SUA co hanh dong cu the\n")
    ca = [
        ("thieu truong", ban(id=None, slug=None)),
        ("spot-check thieu", ban(citations_sampled=0, citations_verified=0)),
        ("verified < sampled", ban(citations_sampled=3, citations_verified=1)),
        ("khong frontmatter", "# thuan\n"),
    ]
    for ten, noi in ca:
        with tempfile.TemporaryDirectory() as d:
            k, _, tb = gac(noi, schema=SCHEMA, tmp=d)
        ok(not k, f"{ten}: bi chan")
        ok("SỬA:" in tb, f"{ten}: co dong SUA", tb[:60])
        # Dong SUA phai co DONG TU, khong phai "khong hop le"
        phan_sua = tb.split("SỬA:")[-1] if "SỬA:" in tb else ""
        ok(any(v in phan_sua for v in ("điền", "mở ", "sửa ", "thêm ")),
           f"{ten}: SUA co hanh dong cu the", phan_sua[:60])


# ═══ vao kho that ════════════════════════════════════════════════════════
def vao_kho():
    print("\nGhi vao kb/ - duong day du\n")
    with tempfile.TemporaryDirectory() as d:
        inbox, kb = Path(d) / "in", Path(d) / "kb"
        inbox.mkdir(); kb.mkdir()
        (inbox / "tot.md").write_text(ban(), encoding="utf-8")
        (inbox / "hong.md").write_text(ban(id=None), encoding="utf-8")
        ket = chay(inbox, kb)

        vao = [k for k in ket if k[1]]
        ra = [k for k in ket if not k[1]]
        ok(len(vao) == 1 and len(ra) == 1, "1 vao kho, 1 tra lai", f"{ket}")
        ok((kb / "article" / "ban-thu.md").exists(), "ghi dung kb/<loai>/<slug>.md")
        ok((inbox / "hong.rejected.md").exists(), "sinh file .rejected.md")
        ok(not (kb / "article" / "src_abc123.md").exists()
           and len(list(kb.rglob("*.md"))) == 1, "ban hong KHONG vao kho")

        rj = (inbox / "hong.rejected.md").read_text(encoding="utf-8")
        ok("<!--" in rj and ban(id=None).split("---")[1][:20] in rj,
           "file tra lai GIU NGUYEN goc de sua roi tha lai")


# ═══ KHONG GHI DE + DON _inbox ════════════════════════════════════════════
# Hai bug that, do bang thuc nghiem tren kho that (2026-08-24):
#
#  1 Sua one_liner mot bai TREN WEB, chay gate, dong sua BIEN MAT — ban cu con
#    nam trong _inbox/ ghi de len kho, khong mot canh bao nao. Mat du lieu nguoi
#    dung, im lang. M08_api co _recycle/ + 409 cho ca nay; duong nay khong co gi.
#
#  2 File da vao kho van nam lai _inbox/, nen MOI lan chay gate lai xu ly lai
#    tu dau — do chinh la co che cua bug 1.
#
# Ca hai ngu qua moi phep kiem cu vi chung dung kho TAM RONG: khong bao gio co
# san mot bai trung slug. Dung lop loi quen: "du lieu mau khong phu hinh dang
# du lieu that".
def khong_ghi_de():
    print("\nKho da co bai cung slug - KHONG ghi de\n")
    with tempfile.TemporaryDirectory() as d:
        inbox, kb = Path(d) / "in", Path(d) / "kb"
        inbox.mkdir(); kb.mkdir()

        # Lan 1: vao kho binh thuong
        (inbox / "lan1.md").write_text(ban(), encoding="utf-8")
        chay(inbox, kb)
        dich = kb / "article" / "ban-thu.md"
        ok(dich.exists(), "lan 1: bai vao kho")

        # Nguoi sua ban TRONG KHO (mo phong sua tren web)
        goc = dich.read_text(encoding="utf-8")
        dich.write_text(goc.replace("one_liner:", "one_liner: SUA-TREN-WEB"), encoding="utf-8")
        truoc = dich.read_text(encoding="utf-8")

        # Lan 2: tha lai CUNG slug
        (inbox / "lan2.md").write_text(ban(), encoding="utf-8")
        ket = chay(inbox, kb)

        k2 = [k for k in ket if k[0] == "lan2.md"]
        ok(len(k2) == 1 and not k2[0][1], "lan 2 (trung slug) bi TRA LAI, khong vao kho",
           f"{ket}")
        ok(dich.read_text(encoding="utf-8") == truoc,
           "ban dang trong kho khong doi MOT BYTE",
           "gate ghi de = mat sua cua nguoi dung, im lang")
        ok((inbox / "lan2.rejected.md").exists(), "co file .rejected.md noi ly do")
        rj = (inbox / "lan2.rejected.md").read_text(encoding="utf-8")
        ok("KHONG ghi de" in rj and "slug" in rj,
           "ly do noi ro: kho da co, va cach sua")


def don_inbox():
    print("\nDon _inbox/ sau khi vao kho - chay lai khong xu ly lai\n")
    with tempfile.TemporaryDirectory() as d:
        inbox, kb = Path(d) / "in", Path(d) / "kb"
        inbox.mkdir(); kb.mkdir()
        (inbox / "tot.md").write_text(ban(), encoding="utf-8")

        chay(inbox, kb)
        ok(not (inbox / "tot.md").exists(), "file goc khong con la *.md cho gac")
        ok((inbox / "tot.da-vao-kho.md").exists(),
           "DOI TEN chu khong xoa — nguoi con doi chieu duoc",
           "unlink that la trai tinh than M08-R4 (file nguoi nop khong xoa that)")

        # Chay lai: khong duoc xu ly lai file da vao kho
        ket2 = chay(inbox, kb)
        ok(ket2 == [], "chay lai: khong file nao duoc xu ly lai", f"{ket2}")

        # Va ban trong kho van nguyen
        dich = kb / "article" / "ban-thu.md"
        dich.write_text(dich.read_text(encoding="utf-8") + "\nDONG THEM\n", encoding="utf-8")
        truoc = dich.read_text(encoding="utf-8")
        chay(inbox, kb)
        ok(dich.read_text(encoding="utf-8") == truoc,
           "chay gate nhieu lan khong dung den ban trong kho")


CHON = {"tra_lai": tra_lai, "khong_tu_dien": khong_tu_dien,
        "draft_external": draft_external, "khong_frontmatter": khong_frontmatter,
        "co_cach_sua": co_cach_sua, "vao_kho": vao_kho,
        "khong_ghi_de": khong_ghi_de, "don_inbox": don_inbox}

k = sys.argv[sys.argv.index("-k") + 1] if "-k" in sys.argv else None
for ten, fn in CHON.items():
    if not k or k == ten:
        fn()
print()
sys.exit(f"{len(loi)} loi" if loi else 0)
