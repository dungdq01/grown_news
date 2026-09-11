"""Indexer — dựng chỉ mục DẪN XUẤT từ kho, đọc kho CHỈ qua HTTP của LÕI (spec §1 · §2 · M13-R3 · T13-2).

Đường dữ liệu (FR-072 §1.3 · T08-35):
  GET /api/kho-delta                        {slug, loai, updated_at, sha_than, space} — "bản ghi nào đổi"
  GET /api/xuat/<loai>/<slug>?dang=goc      file .md ĐỦ frontmatter — số dòng đếm trên bản này, để
                                            `file:A-B` khớp `kb/<loai>/<slug>.md` người thấy
  GET /api/articles/<loai>/<slug>           {frontmatter, body} — title · category · concepts · media[]
  GET /api/articles/media/<sha>             byte hiện vật văn bản (T13-7 nối vào `chunks_cua_bai`)

Tăng dần (AC-2.4): `sha_than` + `updated_at` không đổi ⇒ 0 fetch, 0 ghi. Đổi ⇒ fetch, tính
`checksum` = sha256 MỌI byte đã fetch; bằng bản lưu ⇒ chỉ UPDATE metadata (1 dòng); khác ⇒ rechunk và
thay CẢ BÀI trong một transaction. Mồ côi (có trong index, không trong delta) ⇒ xoá (AC-1.2).
Điểm bất động (AC-1.1): delta sắp theo slug, chunk theo `thu_tu`, `BoAnchor` mới cho mỗi file.

Chunk theo `##`/`###` (spec §2): địa chỉ `file:A-B` sinh ra MIỄN PHÍ lúc parse; `heading_path`
"Title › H2 › H3"; đoạn TRƯỚC heading đầu (nếu có) là một chunk anchor rỗng. Frontmatter bỏ qua
nhưng GIỮ số dòng tuyệt đối; heading trong khối ``` không tính. `title`/`tim` = chuan_hoa_tim(...)
— MỘT call-site (M13-R1: đúng hai chỗ gọi trong toàn `truyhoi/src`, chỗ kia ở `rank`).

Không import `core/` hay `chungcat/`: ba bảng khai (`dich-vu.json` · `loai-nguon.json` ·
`media-mime.json`) đọc như FILE. Facet dùng khoá TANG của FE nguyên văn — `pl`/`nguon` suy theo cùng
luật `phanLoaiCua`/`nguonCua` của `web/render/trang.mjs` (bản thứ hai của một luật FE; cổng đối
chiếu là việc sau, ghi ở backlog).
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import db
import hien_vat
from anchor import BoAnchor
from chuan_hoa import chuan_hoa_tim

R = Path(__file__).resolve().parents[2]
ASSETS = R / "core" / "assets"
TRANG = 200
TIMEOUT = 5
# Chỉ ba mime này là VĂN BẢN để chunk theo dòng. Cửa xuất `goc` trả byte nhị phân cho bản ghi có
# hiện vật (pdf/docx/pptx) — xem `lay_bai_va_goc`. Danh sách hẹp, không đoán theo `startswith("text/")`:
# `text/csv` hay `text/html` cũng không phải markdown của kho.
TEXT_MIME = {"text/markdown", "text/plain", "text/x-markdown"}

_LOAI_NGUON = json.loads((ASSETS / "loai-nguon.json").read_text(encoding="utf-8"))["module"]
_PL_CUA = {l: m["ten"] for m in _LOAI_NGUON for l in m["loai"]}
_MEDIA = json.loads((ASSETS / "media-mime.json").read_text(encoding="utf-8"))
_HEADING = re.compile(r"^(#{2,3})\s+(.+?)\s*#*\s*$")


# ── HTTP tới LÕI — chỉ loopback ─────────────────────────────────────────────
def duong_dich_vu() -> Path:
    return Path(os.environ.get("TRUYHOI_DICH_VU") or (ASSETS / "dich-vu.json"))


def url_loi() -> str:
    """Gốc của LÕI: env `TRUYHOI_LOI_URL` (test trỏ LÕI giả), mặc định cổng `web` trong dich-vu.json (Z6)."""
    u = os.environ.get("TRUYHOI_LOI_URL")
    if u:
        return u.rstrip("/")
    d = json.loads(duong_dich_vu().read_text(encoding="utf-8"))
    web = next((x for x in d["dich_vu"] if x["thu_muc"] == "web"), None)
    if not web or web.get("cong") is None:
        raise RuntimeError("`web` không có trong bảng khai dịch vụ")
    return f"http://127.0.0.1:{web['cong']}"


def _mo(duong: str):
    url = url_loi() + duong
    host = urllib.parse.urlparse(url).hostname
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise RuntimeError(f"M13-R5: chỉ gọi loopback, không gọi `{host}`")
    return urllib.request.urlopen(urllib.request.Request(url, headers={"accept": "*/*"}), timeout=TIMEOUT)


def lay_json(duong: str):
    with _mo(duong) as r:
        return json.loads(r.read().decode("utf-8"))


def lay_bytes(duong: str) -> tuple[bytes, str]:
    with _mo(duong) as r:
        return r.read(), r.headers.get("content-type", "")


def lay_delta() -> list[dict]:
    ra, offset = [], 0
    while True:
        j = lay_json(f"/api/kho-delta?offset={offset}&limit={TRANG}")
        items = j.get("items") or []
        ra += items
        offset += len(items)
        if not items or offset >= int(j.get("tong") or 0):
            break
    return sorted(ra, key=lambda x: x["slug"])


# ── chunk ──────────────────────────────────────────────────────────────────
def _so_dong(text: str) -> list[str]:
    return text.replace("\r\n", "\n").split("\n")


def _het_frontmatter(dong: list[str]) -> int:
    if dong and dong[0].strip() == "---":
        for j in range(1, len(dong)):
            if dong[j].strip() == "---":
                return j + 1
    return 0


def _cat_trang_cuoi(dong: list[str], ls: int, le: int) -> int:
    while le > ls and not dong[le - 1].strip():
        le -= 1
    return le


def _lam_chunk(*, doc_id, file, anchor, ls, le, heading_path, body, nguon_van_ban, thu_tu) -> dict:
    """Chunk THÔ — `title`/`tim` điền sau ở `hoan_thien()` (một call-site chuan_hoa_tim cho MỌI chunk)."""
    return {
        "doc_id": doc_id, "file": file, "anchor": anchor, "line_start": ls, "line_end": le,
        "dia_chi": f"{file.removeprefix('kb/')}:{ls}-{le}", "heading_path": heading_path,
        "body": body, "nguon_van_ban": nguon_van_ban, "thu_tu": thu_tu,
    }


def hoan_thien(chunks: list[dict]) -> list[dict]:
    """Điền cột CHỈ ĐỂ TÌM cho mọi chunk (than · cue · .md) — chỗ gọi DUY NHẤT của chuan_hoa_tim phía index (M13-R1)."""
    for c in chunks:
        c["title"], c["tim"] = (chuan_hoa_tim(x) for x in (c["heading_path"], c["body"]))
    return chunks


def chunk_markdown(text: str, *, doc_id: str, file: str, title: str, nguon_van_ban: str, thu_tu_dau: int = 0) -> list[dict]:
    """Mỗi `##`/`###` một chunk; số dòng 1-based, tuyệt đối trên `text` (kể cả frontmatter)."""
    dong = _so_dong(text)
    bat_dau = _het_frontmatter(dong)
    bo = BoAnchor()
    moc = []          # (chỉ số dòng 0-based, cấp, chữ heading) — chỉ ngoài fence
    fence = False
    for i in range(bat_dau, len(dong)):
        l = dong[i]
        if l.lstrip().startswith(("```", "~~~")):
            fence = not fence
            continue
        if fence:
            continue
        m = _HEADING.match(l)
        if m:
            moc.append((i, len(m.group(1)), m.group(2).strip()))
    ra = []
    thu_tu = thu_tu_dau
    # đoạn TRƯỚC heading đầu
    dau_cuoi = (moc[0][0] if moc else len(dong))
    if any(dong[i].strip() for i in range(bat_dau, dau_cuoi)):
        ls, le = bat_dau + 1, _cat_trang_cuoi(dong, bat_dau + 1, dau_cuoi)
        while ls <= le and not dong[ls - 1].strip():
            ls += 1
        ra.append(_lam_chunk(doc_id=doc_id, file=file, anchor="", ls=ls, le=le, heading_path=title,
                             body="\n".join(dong[ls - 1:le]), nguon_van_ban=nguon_van_ban, thu_tu=thu_tu))
        thu_tu += 1
    h2 = None
    for k, (i, cap, chu) in enumerate(moc):
        if cap == 2:
            h2 = chu
            path = f"{title} › {chu}"
        else:
            path = f"{title} › {h2} › {chu}" if h2 else f"{title} › {chu}"
        ls = i + 1
        ket = moc[k + 1][0] if k + 1 < len(moc) else len(dong)
        le = _cat_trang_cuoi(dong, ls, ket)
        ra.append(_lam_chunk(doc_id=doc_id, file=file, anchor=bo.sinh(chu), ls=ls, le=le, heading_path=path,
                             body="\n".join(dong[ls - 1:le]), nguon_van_ban=nguon_van_ban, thu_tu=thu_tu))
        thu_tu += 1
    return ra


# ── facet — khoá TANG nguyên văn ─────────────────────────────────────────────
def _ds(x) -> list[str]:
    if x is None:
        return []
    return [str(v) for v in (x if isinstance(x, list) else [x]) if str(v).strip()]


def _media(fm: dict) -> list[dict]:
    m = fm.get("media")
    if isinstance(m, dict):
        return [m]
    return [x for x in (m or []) if isinstance(x, dict)]


def nguon_cua(fm: dict, loai: str) -> str:
    """Port `nguonCua` (trang.mjs): tài liệu ⇒ đuôi mime hiện vật đầu; video ⇒ `tai-len` nếu có hiện vật
    không phải dẫn xuất, không thì host theo `video_host`, không thì `khac`; còn lại = source_type."""
    pl = _PL_CUA.get(loai, "")
    ds = _media(fm)
    if pl == "tai-lieu":
        hv0 = ds[0] if ds else None
        l = next((x for x in _MEDIA["loai"] if hv0 and x["mime"] == hv0.get("mime")), None)
        return (l["duoi"] if l else _MEDIA["mac_dinh"]["duoi"]).lstrip(".")
    if pl == "video":
        dan_xuat = {x["mime"] for x in _MEDIA["loai"] if x.get("chi_dan_xuat")}
        if any(x.get("sha256") and str(x.get("mime", "")) not in dan_xuat for x in ds):
            return "tai-len"
        u = str(fm.get("url_normalized") or fm.get("url") or "").lower()
        u = re.sub(r"^https?://(www\.)?", "", u)
        h = next((x for x in _MEDIA["video_host"] if u == x["mien"] or u.startswith(x["mien"] + "/") or u.startswith(x["mien"] + "?")), None)
        return h["nhan"] if h else "khac"
    return loai


def facet_cua(fm: dict, loai: str, space: str) -> list[tuple[str, str]]:
    ra = [("loai", loai), ("space", space)]
    if loai in _PL_CUA:
        ra.append(("pl", _PL_CUA[loai]))
    ra.append(("nguon", nguon_cua(fm, loai)))
    ra += [("cat", v) for v in _ds(fm.get("category"))]
    ra += [("cpt", v) for v in _ds(fm.get("concepts"))]
    return ra


# ── dựng ─────────────────────────────────────────────────────────────────────
def chunks_cua_bai(row: dict, fm: dict, goc: str) -> tuple[list[dict], list[bytes]]:
    """(chunk[] đã hoàn thiện, byte hiện vật đã fetch — vào checksum).

    `than` luôn; rồi MỖI hiện vật văn bản (T13-7 · FR-072 §1.3) qua `GET /api/articles/media/<sha>`:
    transcript ⇒ chunk theo cue (`hien_vat.chunk_cue`), `.md`/`.txt` ⇒ chunk theo heading như than.
    Bản ghi không có hiện vật văn bản ⇒ chỉ than, 0 lỗi (AC-2.5 edge 4)."""
    file = f"kb/{row['loai']}/{row['slug']}.md"
    title = str(fm.get("title") or row["slug"])
    chunks = chunk_markdown(goc, doc_id=row["slug"], file=file, title=title, nguon_van_ban="than")
    them: list[bytes] = []
    for hv in hien_vat.chon_hien_vat(fm):
        b, _mime = lay_bytes(f"/api/articles/media/{hv['sha256']}")
        them.append(b)
        mime = str(hv.get("mime", ""))
        if mime in hien_vat.MIME_CUE:
            cues = hien_vat.doc_cue(b)
            chunks += hien_vat.chunk_cue(cues, doc_id=row["slug"], file=file, title=title, thu_tu_dau=len(chunks))
        else:
            duong_hv = f"kb/_media/{hv['sha256']}{hien_vat.duoi_cua(mime)}"
            chunks += chunk_markdown(b.decode("utf-8", errors="replace"), doc_id=row["slug"], file=duong_hv,
                                     title=title, nguon_van_ban="hien-vat:text/plain", thu_tu_dau=len(chunks))
    return hoan_thien(chunks), them


class CuaHong(Exception):
    """Một cửa của LÕI trả mã không xử được cho MỘT bản ghi — bản ghi đó bị bỏ CÓ TÊN, không kéo chết cả lượt."""

    def __init__(self, cua: str, ma: int):
        self.cua, self.ma = cua, ma
        super().__init__(f"{cua} → {ma}")


def lay_bai_va_goc(row: dict) -> tuple[dict, bytes]:
    """(frontmatter+body của /api/articles, byte văn bản để chunk) cho một bản ghi.

    WO-099 · 11/16 bản ghi kho thật KHÔNG có file trong kho (video đăng ký bằng URL — FR-075):
    `?dang=goc` trả **422 có chủ đích**. Đó là hợp đồng đúng của LÕI; M13 không được giả định
    "mọi bản ghi đều có file gốc". 422 ⇒ văn bản = `body` của `/api/articles` (cửa đã gọi sẵn cho
    metadata — 0 cửa mới). Khi đó `line_start/line_end` đếm trên CHÍNH thân đó (WO-099 §4.4) — lệch
    export `kb/<loai>/<slug>.md` một đoạn frontmatter; ô backlog M13 mở, cần một `dang` của LÕI trả
    .md kèm frontmatter cho URL-only (M01–M12 đóng băng phạm vi, rule.md 18 ⇒ FR sau).
    Mã khác 2xx/422 (500, 404…) ở bất kỳ cửa nào ⇒ `CuaHong` — bản ghi bị bỏ, CÓ NÊU slug + cửa + mã."""
    cua_bai = f"/api/articles/{row['loai']}/{row['slug']}"
    try:
        bai = lay_json(cua_bai)
    except urllib.error.HTTPError as e:
        raise CuaHong(cua_bai, e.code) from e
    cua_goc = f"/api/xuat/{row['loai']}/{row['slug']}?dang=goc"
    try:
        goc_b, mime = lay_bytes(cua_goc)
        # WO-100 · `?dang=goc` KHÔNG phải lúc nào cũng là `.md`. Với bản ghi có HIỆN VẬT NHỊ PHÂN
        # (`tai-lieu`: pdf/docx/pptx), cửa xuất **302 sang cửa media** và trả ĐÚNG BYTE ĐÃ NẠP
        # (`xuat-dang.json` `$la`) — `urllib` tự theo redirect, nên không nhìn `content-type` là
        # nuốt cả file PDF vào chỉ mục. Đo 2026-09-11 trên kho thật: một chunk 9739 dòng mở đầu
        # `%PDF-1.5` hiện thẳng lên panel tìm. Trích text PDF là nợ của M12 (`FR-079`), không phải
        # việc của M13 — nên nhị phân ⇒ dùng `than`, đúng như bản ghi không có file gốc.
        if mime.split(";")[0].strip() in TEXT_MIME:
            return bai, goc_b
    except urllib.error.HTTPError as e:
        if e.code != 422:
            raise CuaHong(cua_goc, e.code) from e
    return bai, str(bai.get("body") or "").encode("utf-8")


def reindex(con, *, day_du: bool = False) -> dict:
    delta = lay_delta()
    if day_du:
        db.xoa_sach(con)
    luu = {r[0]: r for r in con.execute("SELECT doc_id, sha_than, updated_at, checksum FROM tai_lieu")}
    dem = {"xem": len(delta), "doi": 0, "bo_qua": 0, "chi_moc": 0, "mo_coi": 0, "hong": []}
    for row in delta:
        s = luu.get(row["slug"])
        if s and s[1] == row["sha_than"] and s[2] == row.get("updated_at"):
            dem["bo_qua"] += 1
            continue
        try:
            bai, goc_b = lay_bai_va_goc(row)
        except CuaHong as e:
            dem["hong"].append({"slug": row["slug"], "cua": e.cua, "ma": e.ma})
            continue
        fm = bai.get("frontmatter") or {}
        chunks, them = chunks_cua_bai(row, fm, goc_b.decode("utf-8", errors="replace"))
        checksum = hashlib.sha256(goc_b + b"".join(them)).hexdigest()
        if s and s[3] == checksum:
            db.cap_nhat_moc(con, row["slug"], row.get("updated_at"), row["sha_than"])
            dem["chi_moc"] += 1
            continue
        space = str(row.get("space") or "mac-dinh")
        tl = {"doc_id": row["slug"], "loai": row["loai"], "space": space, "title": str(fm.get("title") or row["slug"]),
              "file": f"kb/{row['loai']}/{row['slug']}.md", "updated_at": row.get("updated_at"),
              "sha_than": row["sha_than"], "checksum": checksum}
        db.thay_tai_lieu(con, tl, facet_cua(fm, row["loai"], space), chunks)
        dem["doi"] += 1
    con_lai = {r["slug"] for r in delta}
    for doc_id in sorted(set(luu) - con_lai):
        db.xoa_tai_lieu(con, doc_id)
        dem["mo_coi"] += 1
    return dem


def kiem_lech(con) -> dict:
    """Chỉ ĐỌC: so delta của LÕI với bản lưu — nêu đúng slug (AC-1.2)."""
    delta = {r["slug"]: r["sha_than"] for r in lay_delta()}
    luu = {r[0]: r[1] for r in con.execute("SELECT doc_id, sha_than FROM tai_lieu")}
    return {
        "lech": sorted(s for s in delta if s in luu and delta[s] != luu[s]),
        "mo_coi": sorted(s for s in luu if s not in delta),
        "chua_index": sorted(s for s in delta if s not in luu),
    }


def main(argv: list[str]) -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    con = db.mo(ghi=True)
    try:
        if "--kiem-lech" in argv:
            kq = kiem_lech(con)
            for k, v in kq.items():
                for s in v:
                    print(f"{k}: {s}")
            return 1 if any(kq.values()) else 0
        kq = reindex(con, day_du="--day-du" in argv)
        print(json.dumps({**kq, "index": str(db.duong_index())}, ensure_ascii=False))
        for h in kq["hong"]:
            print(f"HỎNG · {h['slug']} ← {h['cua']} mã {h['ma']}")
        return 1 if kq["hong"] else 0
    finally:
        con.close()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
