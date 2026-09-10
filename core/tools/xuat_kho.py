#!/usr/bin/env python3
"""Xuat kb/_kho.sqlite ra file — DUONG DB→file DUY NHAT (FR-034). CHI SELECT.

Export la BACKUP commit vao git + thu mat nguoi doc duoc + input cua
validate.py khi chay tay. Mot chieu: khong INSERT/UPDATE/DELETE nao trong file
nay (check_export_dan_xuat.py rang 2 grep dieu nay).

Deterministic: cung DB ⇒ cung byte. Ghi kieu .tmp + os.replace + retry
EPERM/EBUSY (bai hoc doiTenBenBi cua FR-027b — Windows giu handle). File
khong doi noi dung thi KHONG ghi lai (do mtime churn).

Xoa file MO COI (khong con hang DB) trong 6 thu muc loai + _recycle/ — hop le
vi kb/ la DAN XUAT; noi dung that nam trong bang recycle. KHONG dung vao
README.md hay file _* ngoai bo file minh so huu.

Dung:
    python core/tools/xuat_kho.py           # kb/_kho.sqlite -> kb/ + _recycle/
    python core/tools/xuat_kho.py --kiem    # export 2 lan, so hash cay file
"""
import hashlib
import json
import os
import sqlite3
import sys
import tempfile
import time
from pathlib import Path

R = Path(__file__).resolve().parents[2]

import yaml  # noqa: E402  (da co trong moi truong cong Python)

KB = Path(os.environ["KB_DIR"]) if os.environ.get("KB_DIR") else R / "kb"
RECYCLE = Path(os.environ["RECYCLE_DIR"]) if os.environ.get("RECYCLE_DIR") else R / "_recycle"
DB = KB / "_kho.sqlite"

# Tap loai doc tu BANG KHAI (FR-038/C1) — xem loai-nguon.json.
#
# RUI RO SO MOT cua ca FR-038 nam o cho tap nay khop voi VIEW `ban_ghi`: vong
# reap duoi day xoa moi `.md` khong co trong `can_co`, va `can_co` dung tu view.
# View thieu mot nhanh ma tap nay van liet loai do ⇒ XOA SACH loai do. Rang:
# core/tests/check_ba_bang.py §1.
_LN = json.loads((R / "core" / "assets" / "loai-nguon.json").read_text(encoding="utf-8"))
LOAI = tuple(l for m in _LN["module"] for l in m["loai"])
# File _* do export SO HUU — duoc phep xoa khi DB khong con du lieu tuong ung.
SO_HUU = ("_nhat-ky-danh-muc.md", "_audit.jsonl")

# Duoi file cho hien vat: DOC tu core/assets/media-mime.json — cung bang ma
# web/api/dungchung.mjs doc. Hai ban go tay se lech, va lech o day nghia la
# file export mang mot duoi ma server phuc vu bang content-type khac.
MEDIA_DIR = "_media"
_bang = json.loads((R / "core" / "assets" / "media-mime.json").read_text(encoding="utf-8"))
DUOI_THEO_MIME = {l["mime"]: l["duoi"] for l in _bang["loai"]}
# FR-039 · mime LA co duoi mac dinh. Khong co nhanh nay thi mot mime ngoai
# bang nem KeyError giua vong export — va export chay TU DONG sau moi lan
# ghi (dungchung.mjs banXuat), nen no khong doi ai go lenh gi.
DUOI_MAC_DINH = _bang["mac_dinh"]["duoi"]


def ghi_ben_bi(duong: Path, noi_dung: str):
    """Ghi CHU. Vo van ban -> byte roi giao cho ghi_bytes_ben_bi.

    So va ghi o muc BYTE voi newline='\\n' co dinh — write_text mac dinh tren
    Windows dich \\n thanh \\r\\n, lam export lech byte voi noi dung DB va moi
    lan export deu "doi" du khong gi doi.
    """
    return ghi_bytes_ben_bi(duong, noi_dung.encode("utf-8"))


def ghi_bytes_ben_bi(duong: Path, b: bytes):
    """Ghi .tmp roi os.replace, retry EPERM/EBUSY; bo qua neu byte khong doi.

    MOT cai dat, HAI cua: chu (ghi_ben_bi) va hien vat (khoi media o duoi).
    Hai cai dat se lech o dung cho khong ai nhin — retry EPERM la bai hoc
    doiTenBenBi cua FR-027b, va no phai ap cho ca byte nhi phan.
    """
    if duong.exists() and duong.read_bytes() == b:
        return False
    duong.parent.mkdir(parents=True, exist_ok=True)
    tmp = duong.with_suffix(duong.suffix + ".tmp")
    tmp.write_bytes(b)
    for lan in range(12):
        try:
            os.replace(tmp, duong)
            return True
        except PermissionError:
            time.sleep(0.05 * (lan + 1))
    os.replace(tmp, duong)  # lan cuoi: de exception noi that
    return True


def xoa_ben_bi(duong: Path):
    for lan in range(12):
        try:
            duong.unlink(missing_ok=True)
            return
        except PermissionError:
            time.sleep(0.05 * (lan + 1))
    duong.unlink(missing_ok=True)


def md_cua(fm_json: str, than: str) -> str:
    fm = json.loads(fm_json)
    # sort_keys=False: giu thu tu da luu (thu tu nguoi viet) — diff doc duoc.
    # width lon: khong tu xuong dong giua chuoi dai ⇒ dump on dinh.
    y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100000)
    return f"---\n{y}---\n\n{than.strip()}\n"


def yaml_danh_muc(header: str, ds: list) -> str:
    """In danh mục GIỮ ĐỊNH DẠNG quy ước cũ — `aliases` FLOW style `[a, b]`.

    Không dùng yaml.safe_dump trần: nó in block list, diff phình và lệch quy
    ước 22 mục thời inDanhMuc (dungchung.mjs cũ). Vô hướng vẫn escape qua
    yaml.safe_dump từng giá trị — parser tự chế sai chính ở chỗ escape.
    """
    def gt(v):
        return yaml.safe_dump(v, allow_unicode=True, width=100000).strip().removesuffix("\n...")\
            .strip()
    dong = []
    for c in ds:
        dong.append(f"- id: {gt(c['id'])}")
        for k, v in c.items():
            if k == "id":
                continue
            if isinstance(v, list):
                dong.append(f"  {k}: [{', '.join(gt(x) for x in v)}]")
            else:
                dong.append(f"  {k}: {gt(v)}")
    ra = header
    if dong:
        if ra and not ra.endswith("\n"):
            ra += "\n"
        ra += "\n".join(dong) + "\n"
    return ra


def xuat(kb: Path, recycle: Path, db: Path = DB):
    """Export toan bo. Tra ve so file da ghi/xoa."""
    cn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    cn.execute("PRAGMA busy_timeout = 5000")
    ghi = xoa = 0
    try:
        # ---- bai + ban luu tru ------------------------------------------
        can_co: dict[Path, str] = {}
        for st, slug, fm, than in cn.execute(
                "SELECT source_type,slug,frontmatter,than FROM ban_ghi"):
            can_co[kb / st / f"{slug}.md"] = md_cua(fm, than)
        for st, slug, ban, fm, than in cn.execute(
                "SELECT source_type,slug,ban,frontmatter,than FROM article_versions"):
            can_co[kb / st / f"{slug}.v{ban}.md"] = md_cua(fm, than)
        for duong, nd in sorted(can_co.items()):
            ghi += ghi_ben_bi(duong, nd)
        for loai in LOAI:
            d = kb / loai
            if not d.exists():
                continue
            for f in sorted(d.glob("*.md")):
                if f not in can_co:
                    xoa_ben_bi(f); xoa += 1

        # ---- hien vat (FR-036/B4) ----------------------------------------
        #
        # LUAT MO COI HOP UNION BA BANG: articles + article_versions + recycle.
        #
        # Bo sot `recycle` thi MOI DELETE pha byte vinh vien, va `phucHoi()`
        # sau do VAN BAO THANH CONG — no chay lai validate, ma validate khong
        # bao gio thay blob. Mat du lieu im lang voi bo test xanh. Day la
        # M09-R1, rule nguy hiem nhat cua module, va `check_media_dan_xuat.py`
        # co mot ca fixture cho DUNG tung bang mot.
        #
        # `duoi` tra tu frontmatter cua ban ghi TRO TOI no, khong tu bang
        # `media` — bang media co dinh khong cot metadata nao (mot noi khai).
        # `.bin` la duong lui khi mime la ngoai enum: chi xay ra neu ai do sua
        # thang DB, va no khong pha nhap lai (importer doc mime tu .md, khong
        # doc tu duoi file).
        can_byte: dict[str, str] = {}          # sha256 -> duoi
        # Nam nhanh khai MOT noi — VIEW `tham_chieu_media` trong DDL (FR-038).
        # Truoc do tap nay go tay o day VA o dungchung.mjs:449-451.
        # FR-052 · `media` la MANG. Ban dau doan nay kiem `isinstance(m, dict)`
        # THOI, va voi mang thi phep kiem do la False => `can_byte` RONG =>
        # vong reap 15 dong duoi coi MOI file la mo coi va XOA SACH kb/_media/.
        # Doc CA HAI hinh dang: ban ghi chua di tru van phai doc duoc.
        for (fm,) in cn.execute("SELECT frontmatter FROM tham_chieu_media"):
            m = (json.loads(fm) or {}).get("media")
            for hv in ([m] if isinstance(m, dict) else m if isinstance(m, list) else []):
                if isinstance(hv, dict) and hv.get("sha256"):
                    can_byte.setdefault(
                        str(hv["sha256"]),
                        DUOI_THEO_MIME.get(str(hv.get("mime")), DUOI_MAC_DINH))
        can_media: dict[Path, bytes] = {}
        if can_byte:
            # `la_dan_xuat = 0` thoi: ban chuyen doi (cache) KHONG di vao git —
            # no dung lai duoc tu ban goc, va commit no la phong git khong lui.
            hoi = ",".join("?" * len(can_byte))
            for sha, byte in cn.execute(
                    f"SELECT sha256, byte FROM media WHERE la_dan_xuat = 0"
                    f" AND sha256 IN ({hoi})", tuple(can_byte)):
                can_media[kb / MEDIA_DIR / f"{sha}{can_byte[sha]}"] = bytes(byte)
        for duong, b in sorted(can_media.items()):
            ghi += ghi_bytes_ben_bi(duong, b)
        d = kb / MEDIA_DIR
        if d.exists():
            for f in sorted(d.iterdir()):
                if f.is_file() and f not in can_media:
                    xoa_ben_bi(f); xoa += 1

        # ---- danh muc ----------------------------------------------------
        header = dict(cn.execute(
            "SELECT khoa, gia_tri FROM meta WHERE khoa IN "
            "('concepts_header','categories_header','nhat_ky_goc')"))
        # ORDER BY rowid — GIỮ THỨ TỰ NGƯỜI THÊM (mục mới nối vào cuối, diff
        # đọc được); dung_lai_db insert theo thứ tự file nên round-trip ổn định.
        cs = [
            {"id": i, "label_vi": l, **({"aliases": json.loads(a)} if json.loads(a) else {})}
            for i, l, a in cn.execute("SELECT id,label_vi,aliases FROM concepts ORDER BY rowid")]
        ghi += ghi_ben_bi(kb / "concepts.yaml",
                          yaml_danh_muc(header.get("concepts_header", ""), cs))
        cats = [{"id": i, "label_vi": l, "gom": g} for i, l, g in cn.execute(
            "SELECT id,label_vi,gom FROM categories ORDER BY rowid")]
        ghi += ghi_ben_bi(kb / "categories.yaml",
                          yaml_danh_muc(header.get("categories_header", ""), cats))

        # LOAI NGUON — DB la chan ly, file la export (WO-019).
        lns = [{"id": i, "label_vi": n, "module": m, "thu_tu": t}
               for i, m, n, t in cn.execute(
                   "SELECT id,module,nhan,thu_tu FROM loai_nguon"
                   " ORDER BY thu_tu, id")]
        ghi += ghi_ben_bi(kb / "loai-nguon.yaml",
                          yaml_danh_muc(header.get("loai_nguon_header", ""), lns))

        # ---- audit + nhat ky --------------------------------------------
        audit = list(cn.execute(
            "SELECT stt,khi,bang,hanh_dong,doi_tuong,chi_tiet FROM audit_log ORDER BY stt"))
        goc = header.get("nhat_ky_goc", "")
        if audit:
            dong = [json.dumps(
                {"stt": r[0], "khi": r[1], "bang": r[2], "hanh_dong": r[3],
                 "doi_tuong": r[4], **({"chi_tiet": r[5]} if r[5] else {})},
                ensure_ascii=False) for r in audit]
            ghi += ghi_ben_bi(kb / "_audit.jsonl", "\n".join(dong) + "\n")
            bang_md = "\n".join(
                f"| {r[1]} | {r[2]} | `{r[4]}` | {r[3]} | {r[5] or '—'} |" for r in audit)
            ghi += ghi_ben_bi(
                kb / "_nhat-ky-danh-muc.md",
                goc + "<!-- audit_log -->\n"
                "| khi | bang | doi tuong | hanh dong | chi tiet |\n"
                "|---|---|---|---|---|\n" + bang_md + "\n")
        else:
            for ten in SO_HUU:
                if ten == "_nhat-ky-danh-muc.md" and goc:
                    ghi += ghi_ben_bi(kb / ten, goc)
                elif (kb / ten).exists():
                    xoa_ben_bi(kb / ten); xoa += 1

        # ---- thung rac ----------------------------------------------------
        rac = list(cn.execute(
            "SELECT stt,source_type,slug,frontmatter,than,deleted_at FROM recycle ORDER BY stt"))
        can_rac: dict[Path, str] = {}
        for stt, st, slug, fm, than, _ in rac:
            can_rac[recycle / st / f"{slug}.{stt}.md"] = md_cua(fm, than)
        for duong, nd in sorted(can_rac.items()):
            ghi += ghi_ben_bi(duong, nd)
        if rac:
            meta = "\n".join(json.dumps(
                {"stt": r[0], "source_type": r[1], "slug": r[2], "deleted_at": r[5]},
                ensure_ascii=False) for r in rac) + "\n"
            ghi += ghi_ben_bi(recycle / "_meta.jsonl", meta)
        elif (recycle / "_meta.jsonl").exists():
            xoa_ben_bi(recycle / "_meta.jsonl"); xoa += 1
        if recycle.exists():
            for f in sorted(recycle.rglob("*.md")):
                if f.parent.name in LOAI and f not in can_rac:
                    xoa_ben_bi(f); xoa += 1
    finally:
        cn.close()
    return ghi, xoa


def bam_cay(*thu_muc: Path) -> str:
    """Hash noi dung cay export — de --kiem so hai lan.

    KE CA `_media`: loc theo duoi (.md/.yaml/.jsonl) thi hien vat lot het, va
    `--kiem` thanh cong NOI DOI — khai "export tat dinh" trong khi bo qua phan
    lon byte cua kho. Nen dieu kien la "duoi van ban HOAC nam trong _media",
    khong phai mot danh sach duoi (duoi cua hien vat la .pdf/.pptx/.doc/.bin).
    """
    h = hashlib.sha256()
    for goc in thu_muc:
        if not goc.exists():
            continue
        for f in sorted(goc.rglob("*")):
            if not f.is_file():
                continue
            if f.suffix in (".md", ".yaml", ".jsonl") or MEDIA_DIR in f.parts:
                h.update(str(f.relative_to(goc)).replace("\\", "/").encode())
                h.update(f.read_bytes())
    return h.hexdigest()[:16]


if __name__ == "__main__":
    if not DB.exists():
        sys.exit(f"Chua co {DB} — chay: python core/tools/dung_lai_db.py")
    if "--kiem" in sys.argv:
        # Cung DB export 2 lan ra 2 cay tam ⇒ byte phai giong het (don dinh).
        with tempfile.TemporaryDirectory() as t1, tempfile.TemporaryDirectory() as t2:
            a, b = Path(t1), Path(t2)
            xuat(a / "kb", a / "_recycle")
            xuat(b / "kb", b / "_recycle")
            h1, h2 = bam_cay(a), bam_cay(b)
            print(f"lan 1: {h1}\nlan 2: {h2}")
            if h1 != h2:
                sys.exit("FAIL · hai lan export ra byte KHAC nhau — export khong don dinh")
            print("\npass · export don dinh: hai lan cung byte")
            sys.exit(0)
    ghi, xoa = xuat(KB, RECYCLE)
    print(f"da xuat kho -> file · ghi {ghi} · xoa mo coi {xoa}")
