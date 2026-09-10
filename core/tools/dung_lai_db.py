#!/usr/bin/env python3
"""Dung lai kb/_kho.sqlite tu export. DUONG file→DB DUY NHAT (FR-034).

AI CHAY: nguoi / CI / test harness. SERVER KHONG BAO GIO GOI — mot duong
file→DB tu dong trong server la tai sinh "hai nguon chan ly" o chieu nguoc
(M02-R2, check_export_dan_xuat.py rang 2 grep dieu nay).

VAI KIEM:
  - migrate mot lan tu kho file cu sang DB (FR-034 B1)
  - seed DB cho CI (clone khong co DB — kich ban backup F4)
  - seed kho tam cho test (KB_DIR tro ra ngoai repo)

VI SAO DUNG LAI PARSER CUA validate.py: M05-R3 — hai ban parse se lech im lang.
Cung ly do sinh_index.py (FR-023) da khai.

Dung:
    python core/tools/dung_lai_db.py            # kb/ (+_recycle/) -> kb/_kho.sqlite
    KB_DIR=... RECYCLE_DIR=... python core/tools/dung_lai_db.py
"""
import hashlib
import json
import os
import re
import sqlite3
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(R / "core" / "src"))

from source_distiller.validate import (  # noqa: E402
    normalize_yaml, split_frontmatter,
)

import yaml  # noqa: E402

KB = Path(os.environ["KB_DIR"]) if os.environ.get("KB_DIR") else R / "kb"
RECYCLE = Path(os.environ["RECYCLE_DIR"]) if os.environ.get("RECYCLE_DIR") else R / "_recycle"
DB = KB / "_kho.sqlite"
DDL = (R / "core" / "assets" / "kho.schema.sql").read_text(encoding="utf-8")

# Tap loai + anh xa loai->bang doc tu BANG KHAI (FR-038/C1). Truoc do tap nay go
# tay o BON noi; gio ba ban code deu doc chung mot file.
_LN = json.loads((R / "core" / "assets" / "loai-nguon.json").read_text(encoding="utf-8"))
BANG_CUA = {l: m["bang"] for m in _LN["module"] for l in m["loai"]}
LOAI = tuple(BANG_CUA)
LUU_TRU = re.compile(r"^(?P<slug>.+)\.v(?P<ban>\d+)$")
MEDIA_DIR = "_media"
LA_SHA = re.compile(r"^[0-9a-f]{64}$")


def la_ban_phan_tich(p: Path) -> bool:
    """Cung dieu kien validate.py — mot noi khai, khong hai."""
    return p.name.lower() != "readme.md" and not p.name.startswith("_")


def etag_cua(version: int, fm_json: str, than: str) -> str:
    h = hashlib.sha256(f"{version}\n{fm_json}\n{than}".encode("utf-8"))
    return h.hexdigest()[:16]


def doc_md(p: Path):
    """Parse mot file .md -> (fm_json, than) hoac None neu khong phai ban phan tich."""
    raw, body = split_frontmatter(p.read_text(encoding="utf-8"))
    if raw is None:
        return None
    try:
        fm = normalize_yaml(yaml.safe_load(raw)) or {}
    except yaml.YAMLError:
        return None
    if not isinstance(fm, dict):
        return None
    # KHONG sort_keys: giu thu tu nguoi viet — export in lai dung thu tu do,
    # va diff giua hai ban doc duoc bang mat.
    return json.dumps(fm, ensure_ascii=False), body.strip()


def tro_media(fm_json: str) -> list[str]:
    """MOI sha256 ma frontmatter nay tro toi (FR-052 — `media` la MANG).

    Chap nhan CA HAI hinh dang:
      dict  — ban truoc FR-052; mot ban ghi chua di tru VAN doc duoc
      list  — FR-052 cach 1; M16 sinh slide + giong doc + video cho MOT bai

    ⚠️ Ban dau ham nay tra `str | None` va kiem `isinstance(m, dict)` THOI.
    Voi `media` la mang, phep kiem do la False => tap con tro RONG => vong reap
    o xuat_kho.py:194-199 coi MOI file trong kb/_media/ la mo coi va XOA SACH.
    Va no chay tu dong sau moi phep ghi (`banXuat()`), nen khong ai kip thay.
    Cong `check_media_mang.py` canh dung hai dong nay.
    """
    m = (json.loads(fm_json) or {}).get("media")
    if isinstance(m, dict):
        return [str(m["sha256"])] if m.get("sha256") else []
    if isinstance(m, list):
        return [str(x["sha256"]) for x in m
                if isinstance(x, dict) and x.get("sha256")]
    return []


def doc_header_yaml(p: Path) -> str:
    """Phan comment + dong trong DAU file yaml, NGUYEN VAN — de export in lai."""
    if not p.exists():
        return ""
    dong = []
    for line in p.read_text(encoding="utf-8").splitlines(keepends=True):
        if line.lstrip().startswith("#") or line.strip() == "":
            dong.append(line)
        else:
            break
    return "".join(dong)


def gieo_loai_nguon():
    """Danh sach loai nguon dan xuat tu HAI bang khai.

    Bai viet ⇒ `source_type` (`loai-nguon.json`). Tai lieu ⇒ DINH DANG
    (`media-mime.json` `loai[]` + `mac_dinh`). Video ⇒ NOI PHAT
    (`video_host[]`) va them `tai-len` cho ban co byte.

    Cung phep suy voi `nguonCua()` ben `trang.mjs` — hai phep suy cho mot
    nhan la hai cho de lech.
    """
    import json as _json
    A = Path(__file__).resolve().parents[1] / "assets"
    bang = _json.loads((A / "loai-nguon.json").read_text(encoding="utf-8"))
    media = _json.loads((A / "media-mime.json").read_text(encoding="utf-8"))
    ra = []
    bv = next(m for m in bang["module"] if m["ten"] == "bai-viet")
    for l in bv["loai"]:
        ra.append((l, "bai-viet", l))
    # LOC hai nhom khoi `tai-lieu`, CUNG phep loc voi `trang.mjs#laTaiLieu`:
    #
    #   `chi_dan_xuat`          `.vtt` — may sinh, khong ai nap len
    #   `nhom_thu_vien: video`  mp4 · webm · m4a · mp3 · wav — dinh dang cua
    #                           ban ghi VIDEO, va video da co `tai-len`
    #
    # Docstring cua chinh ham nay canh bao: *"hai phep suy cho mot nhan la hai
    # cho de lech"*. Do duoc 2026-09-05: no lech that — `trang.mjs` da loc, day
    # thi chua, nen DB moc them 5 `loai_nguon` va HTML trang chu vo tran
    # (61981/61440). Chip "MP4" o bo loc TAI LIEU khong khop ban ghi nao.
    for l in media["loai"]:
        # `chip_loc is False` — FR-064. Cung phep loc voi `trang.mjs#laTaiLieu`.
        if (l.get("chi_dan_xuat") or l.get("nhom_thu_vien") == "video"
                or l.get("chip_loc") is False):
            continue
        ra.append((l["duoi"].lstrip("."), "tai-lieu", l["ten"]))
    md = media["mac_dinh"]
    ra.append((md["duoi"].lstrip("."), "tai-lieu", md["ten"]))
    for h in media["video_host"]:
        ra.append((h["nhan"], "video", h["nhan"]))
    ra.append(("tai-len", "video", "tai len"))
    return ra


def doc_danh_muc(p: Path):
    """Doc entries cua concepts/categories.yaml (export hoac ban tay cu)."""
    if not p.exists():
        return []
    try:
        ds = yaml.safe_load(p.read_text(encoding="utf-8")) or []
    except yaml.YAMLError:
        return []
    return [x for x in ds if isinstance(x, dict) and x.get("id")]


def dung(duong=DB):
    """Xoa DB cu, dung lai tu dau. DB khong co lich su — audit nam trong export."""
    duong.unlink(missing_ok=True)
    for duoi in ("-wal", "-shm"):
        Path(str(duong) + duoi).unlink(missing_ok=True)
    cn = sqlite3.connect(duong)
    cn.execute("PRAGMA journal_mode = WAL")
    cn.executescript(DDL)
    so = {b: 0 for b in dict.fromkeys(BANG_CUA.values())}
    so.update({"versions": 0, "recycle": 0, "media": 0, "concepts": 0,
               "loai_nguon": 0,
               "categories": 0, "audit": 0})
    tro_toi: set[str] = set()          # sha256 ma .md nao do khai
    try:
        # ---- hien vat (FR-036/B4) ------------------------------------------
        #
        # Nap TRUOC bai, de phep kiem con-tro-treo o cuoi hoi duoc mot tap day.
        #
        # Ten file PHAI la sha256 CUA CHINH noi dung. Khong kiem thi mot file bi
        # doi ten (hoac sua ruot) di vao kho duoi mot khoa NOI DOI, va tu do moi
        # thu tin vao "dia chi theo noi dung" deu sai: dedup gop hai file khac
        # nhau, va con tro cua bai tro tim mot thu khong phai thu no khai.
        d_media = KB / MEDIA_DIR
        if d_media.exists():
            for f in sorted(d_media.iterdir()):
                if not f.is_file():
                    continue
                b = f.read_bytes()
                that = hashlib.sha256(b).hexdigest()
                if not LA_SHA.match(f.stem):
                    sys.exit(f"FAIL · {f.name}: ten file khong phai 64 hex — "
                             f"kho hien vat dia chi theo noi dung, ten LA khoa")
                if f.stem != that:
                    sys.exit(f"FAIL · {f.name}: byte bam ra {that[:12]}… — "
                             f"ten file NOI DOI ve noi dung cua chinh no")
                cn.execute("INSERT INTO media (sha256,byte) VALUES (?,?)", (that, b))
                so["media"] += 1

        # ---- bai + ban luu tru --------------------------------------------
        for f in sorted(KB.rglob("*.md")):
            if not la_ban_phan_tich(f) or f.parent.name not in LOAI:
                continue
            kq = doc_md(f)
            if kq is None:
                continue
            fm_json, than = kq
            tro_toi.update(tro_media(fm_json))   # FR-052: MOI sha256, khong chi mot
            m = LUU_TRU.match(f.stem)
            if m:
                cn.execute(
                    "INSERT INTO article_versions (source_type,slug,ban,frontmatter,than)"
                    " VALUES (?,?,?,?,?)",
                    (f.parent.name, m["slug"], int(m["ban"]), fm_json, than))
                so["versions"] += 1
            else:
                # INSERT thuong, KHONG OR IGNORE — trung khoa la loi that,
                # tha nem ra con hon ghi thieu (bai hoc FR-023 GD 3).
                # Dinh tuyen theo BANG KHAI. Map sai thi CHECK hep ban ⇒ chet
                # TO — do la thu ta muon. Ngat nhat la map DUNG ma CHECK rong:
                # luc do hang vao bang nao cung duoc va moi cong van xanh.
                bang = BANG_CUA[f.parent.name]
                cn.execute(
                    f"INSERT INTO {bang} (source_type,slug,frontmatter,than,version,etag)"
                    " VALUES (?,?,?,?,1,?)",
                    (f.parent.name, f.stem, fm_json, than,
                     etag_cua(1, fm_json, than)))
                so[bang] = so.get(bang, 0) + 1

        # ---- thung rac -----------------------------------------------------
        meta_rac = RECYCLE / "_meta.jsonl"
        if meta_rac.exists():
            # Export chuan: _meta.jsonl la chan ly ve stt/deleted_at,
            # file .md canh no la noi dung.
            for line in meta_rac.read_text(encoding="utf-8").splitlines():
                r = json.loads(line)
                f = RECYCLE / r["source_type"] / f"{r['slug']}.{r['stt']}.md"
                kq = doc_md(f)
                if kq is None:
                    sys.exit(f"FAIL · _meta.jsonl tro {f} nhung khong doc duoc")
                tro_toi.update(tro_media(kq[0]))   # FR-052: mang
                cn.execute(
                    "INSERT INTO recycle (stt,source_type,slug,frontmatter,than,deleted_at)"
                    " VALUES (?,?,?,?,?,?)",
                    (r["stt"], r["source_type"], r["slug"], kq[0], kq[1],
                     r["deleted_at"]))
                so["recycle"] += 1
        elif RECYCLE.exists():
            # _recycle/ kieu CU (truoc FR-034): <slug>.md | <slug>.<epoch>.md,
            # khong co meta — stt theo thu tu ten, deleted_at de trong. Chi xay
            # ra dung mot lan luc migrate.
            for f in sorted(RECYCLE.rglob("*.md")):
                if f.parent.name not in LOAI:
                    continue
                kq = doc_md(f)
                if kq is None:
                    continue
                tro_toi.update(tro_media(kq[0]))   # FR-052: mang
                slug = re.sub(r"\.\d+$", "", f.stem)
                cn.execute(
                    "INSERT INTO recycle (source_type,slug,frontmatter,than,deleted_at)"
                    " VALUES (?,?,?,?,?)",
                    (f.parent.name, slug, kq[0], kq[1], ""))
                so["recycle"] += 1

        # ---- danh muc + header nguyen van ----------------------------------
        for ten, bang in (("concepts.yaml", "concepts"), ("categories.yaml", "categories")):
            p = KB / ten
            cn.execute("INSERT INTO meta (khoa,gia_tri) VALUES (?,?)",
                       (f"{bang}_header", doc_header_yaml(p)))
            for m in doc_danh_muc(p):
                if bang == "concepts":
                    cn.execute(
                        "INSERT INTO concepts (id,label_vi,aliases) VALUES (?,?,?)",
                        (str(m["id"]), str(m.get("label_vi") or ""),
                         json.dumps([str(a) for a in (m.get("aliases") or [])],
                                    ensure_ascii=False)))
                else:
                    cn.execute(
                        "INSERT INTO categories (id,label_vi,gom) VALUES (?,?,?)",
                        (str(m["id"]), str(m.get("label_vi") or ""),
                         str(m.get("gom") or "")))
                so[bang] += 1

        # LOAI NGUON — cung khuon `concepts`/`categories`: DB la chan ly,
        # file la export dan xuat (FR-019).
        f_ln = KB / "loai-nguon.yaml"
        if f_ln.exists():
            for e in doc_danh_muc(f_ln):
                cn.execute(
                    "INSERT OR REPLACE INTO loai_nguon"
                    " (id,module,nhan,thu_tu) VALUES (?,?,?,?)",
                    (e["id"], e.get("module", ""), e.get("label_vi") or e.get("nhan") or e["id"],
                     int(e.get("thu_tu", 0))))
                so["loai_nguon"] = so.get("loai_nguon", 0) + 1

        # GIEO khi bang RONG — kho moi tinh phai co san danh sach, khong bat
        # nguoi dung go tay 14 dong. Chi khi RONG: gieo moi lan la xoa cong
        # nguoi dung, im lang.
        #
        # KHONG vi pham M02-R3: loai nguon la enum cua schema va whitelist,
        # khong phai nhan nguoi tao. `concepts`/`categories` thi may KHONG
        # duoc tu sinh, va cho nay khong dong den chung.
        # GIEO khi CHUA CO FILE, khong phai khi bang rong.
        #
        # "Bang rong" va "chua co file" la HAI trang thai. Mot kho da co
        # `loai-nguon.yaml` RONG la mot kho da noi: khong loai nguon nao. Gieo o do
        # la ghi de mot cau tra loi da co — va no pha diem bat dong: export ra file
        # rong, nhap lai thanh 14 dong, export lai ra khac han.
        #
        # `check_media_dan_xuat` bat duoc dung ca do: no dung DB1 bang SQL truc
        # tiep (khong qua day), nen file xuat ra rong — va vong sau gieo 14 dong.
        if not f_ln.exists():
            for i_, (mid, mod, nhan) in enumerate(gieo_loai_nguon()):
                cn.execute(
                    "INSERT OR IGNORE INTO loai_nguon"
                    " (id,module,nhan,thu_tu) VALUES (?,?,?,?)",
                    (mid, mod, nhan, i_))
                so["loai_nguon"] = so.get("loai_nguon", 0) + 1

        # ---- audit + nhat ky goc -------------------------------------------
        audit = KB / "_audit.jsonl"
        if audit.exists():
            for line in audit.read_text(encoding="utf-8").splitlines():
                r = json.loads(line)
                cn.execute(
                    "INSERT INTO audit_log (stt,khi,bang,hanh_dong,doi_tuong,chi_tiet)"
                    " VALUES (?,?,?,?,?,?)",
                    (r["stt"], r["khi"], r["bang"], r["hanh_dong"],
                     r["doi_tuong"], r.get("chi_tiet")))
                so["audit"] += 1
        nhat_ky = KB / "_nhat-ky-danh-muc.md"
        # Nhat ky GOC chi la phan nguoi viet truoc FR-034; phan render tu
        # audit_log khong nap nguoc (no la dan-xuat-cua-dan-xuat).
        goc = ""
        if nhat_ky.exists():
            goc = nhat_ky.read_text(encoding="utf-8").split("<!-- audit_log -->")[0]
        cn.execute("INSERT INTO meta (khoa,gia_tri) VALUES (?,?)", ("nhat_ky_goc", goc))
        cn.execute("INSERT INTO meta (khoa,gia_tri) VALUES (?,?)", ("schema_version", "1"))

        # ---- con tro treo: CHET TO, khong dung tiep ------------------------
        #
        # Mot .md khai media.sha256 ma khong co byte nao la mot ban ghi ma
        # `phucHoi()` sau nay VAN BAO THANH CONG — no chay lai validate, ma
        # validate khong bao gio thay blob. Dung tiep la dung mot DB thieu du
        # lieu MA KHONG AI BIET; do la kieu that bai phai on ao nhat (M09-R1).
        co = {r[0] for r in cn.execute("SELECT sha256 FROM media")}
        treo = sorted(tro_toi - co)
        if treo:
            cn.close()
            sys.exit(
                f"FAIL · {len(treo)} con tro media TREO — .md khai sha256 ma "
                f"thieu byte trong {KB / MEDIA_DIR}/:\n  "
                + "\n  ".join(treo)
                + "\nKhong dung DB tiep: mot kho thieu byte im lang la kieu "
                  "mat du lieu te nhat.")
        cn.commit()
    finally:
        cn.close()
    return so


def bam_noi_dung(duong=DB):
    """Bam cot NOI DUNG — version/etag la bookkeeping, khai o kho.schema.sql."""
    cn = sqlite3.connect(duong)
    try:
        h = hashlib.sha256()
        for bang, cot, sap in (
            # BA BANG GOC, KHONG bam view `ban_ghi`: bam view thi mot hang di vao
            # SAI bang van cho cung hash — hom nay CHECK hep chan duoc, nhung cong
            # round-trip phai con rang ca khi ai do noi CHECK.
            ("bai_viet", "source_type,slug,frontmatter,than", "source_type,slug"),
            ("tai_lieu", "source_type,slug,frontmatter,than", "source_type,slug"),
            ("video", "source_type,slug,frontmatter,than", "source_type,slug"),
            ("article_versions", "source_type,slug,ban,frontmatter,than", "source_type,slug,ban"),
            ("recycle", "stt,source_type,slug,frontmatter,than,deleted_at", "stt"),
            ("concepts", "id,label_vi,aliases", "id"),
            ("categories", "id,label_vi,gom", "id"),
            ("audit_log", "stt,khi,bang,hanh_dong,doi_tuong,chi_tiet", "stt"),
            # HASH KHOA, KHONG hash byte: `sha256` LA hash cua noi dung, nen
            # bam lai byte chi doi CPU cho cung mot thong tin. Dung sua thanh
            # `byte` — no khong "chinh xac hon", chi cham hon.
            ("media", "sha256", "sha256"),
            ("meta", "khoa,gia_tri", "khoa"),
        ):
            for hang in cn.execute(f"SELECT {cot} FROM {bang} ORDER BY {sap}"):
                h.update(repr(hang).encode("utf-8"))
        # RANG: bam ca DANH SACH BANG/VIEW. Them mot bang ma quen them vao vong
        # lap tren la cong round-trip di mu 1/n kho MA VAN in xanh. Dong nay bien
        # "quen" thanh mot hash doi — nguoi sua buoc phai nhin.
        for hang in cn.execute(
                "SELECT name,type FROM sqlite_master WHERE type IN ('table','view')"
                " AND name NOT LIKE 'sqlite_%' ORDER BY name"):
            h.update(repr(hang).encode("utf-8"))
        return h.hexdigest()[:16]
    finally:
        cn.close()


if __name__ == "__main__":
    so = dung()
    try:
        ten = DB.relative_to(R)
    except ValueError:
        ten = DB
    print(f"da dung {ten} · " + " · ".join(f"{k} {v}" for k, v in so.items())
          + f" · {bam_noi_dung()}")
