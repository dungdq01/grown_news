#!/usr/bin/env python3
"""M05_intake — cổng cho bản .md do agent khác sinh.

Module DUY NHẤT ngoài M01 được ghi vào kb/. Sai ở đây là nhiễm kho.

Bốn việc, đúng thứ tự (spec §2.2):
  1 đọc _inbox/*.md
  2 validate bằng schema sẵn có — thiếu trường ⇒ TRẢ LẠI, không tự điền
  3 bắt buộc citations_sampled >= 2 — người tự mở link
  4 ghi vào kb/ ở draft + origin: external

RANH GIỚI: phép tính thì làm, phán đoán thì trả lại (M05-R2).
Tự điền id/slug/credibility là bịa có hệ thống — và bịa đi thẳng qua mọi cổng
còn lại vì nó "hợp lệ về hình thức".

DÙNG LẠI validate.py của M01, KHÔNG copy (M05-R3): hai bản kiểm sẽ lệch nhau
im lặng, và M02 sửa schema thì bản copy vẫn cho qua thứ đáng lẽ bị chặn.
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "core" / "src"))

from source_distiller.validate import (  # noqa: E402
    SCHEMA_PATH, check, count_words, normalize_url, split_frontmatter,
)

# Env override cung khuon KB_DIR cua sinh_index.py / check_danh_muc.py va
# INBOX_DIR/KB_DIR/RECYCLE_DIR cua server.mjs + dungchung.mjs.
#
# Thieu hai co nay thi luong nap KHONG TEST DUOC: moi phep kiem se ghi vao
# _inbox/ that roi chay gate len kb/ that. Do la ly do bug "gate ghi de bai da
# co trong kho" song duoc lau — khong ai dam viet test cho no.
INBOX = Path(os.environ["INBOX_DIR"]) if os.environ.get("INBOX_DIR") else ROOT / "_inbox"
KB = Path(os.environ["KB_DIR"]) if os.environ.get("KB_DIR") else ROOT / "kb"

# FR-038 — anh xa loai -> bang, doc tu BANG KHAI (core/assets/loai-nguon.json).
# Truoc do tap 7 loai go tay o BON noi; day la duong ghi THU BA vao kho va no
# nam ngoai `dungchung.mjs`, nen `api-guard.test.js` khong thay no.
_BANG_CUA = {
    l: m["bang"]
    for m in json.loads(
        (ROOT / "core" / "assets" / "loai-nguon.json").read_text(encoding="utf-8"))["module"]
    for l in m["loai"]
}

# Trường M05 ĐƯỢC đặt: dữ kiện hoặc phép tính
TU_DAT = ("origin", "review_status", "ingested_at", "word_count",
          "origin_tool", "origin_protocol_version", "url_normalized")

# Trường M05 KHÔNG đặt: quyết định. Thiếu thì trả lại cho người.
BAT_BUOC_NGUOI = ("id", "slug", "source_type", "url", "one_liner",
                  "credibility_max", "conformance", "protocol_version",
                  "analyzed_at")

KHUNG = """---
id: src_______          # src_ + >=6 ký tự [a-z0-9]
slug: ______            # chữ-thường-nối-gạch, ổn định qua re-analyze
source_type: ______     # repo | paper | video | article | docs | announcement | tai-lieu
url: https://______
protocol_version: "2.0"
analyzed_at: {ngay}
one_liner: ______       # <=160 ký tự
credibility_max: ______ # verified | plausible | claimed | conflicted
category: []            # CHỦ ĐỀ bài, chọn từ: agent-llm | backend | data-ml
                        #   | ai-services | observability | delivery
                        # Để [] nếu không thuộc mảng nào — đừng nhồi cho đủ
concepts: []            # KHÁI NIỆM kỹ thuật, CHỈ id có trong kb/concepts.yaml
concepts_proposed: []   # chưa có trong danh mục ⇒ ghi đây, chờ duyệt lô
independent_sources: 1
conformance: C          # A | B | C — D bị từ chối ở cổng
citations_sampled: 0    # BẮT BUỘC >=2: tự mở link, xác nhận trích dẫn khớp
citations_verified: 0
---
"""


def _cach_sua(thieu, loi_schema, sampled, verified):
    """Cổng chặn phải kèm CÁCH QUA CỔNG (T05-2).

    Trả lại mà chỉ ghi "không hợp lệ" thì người phải đoán — đoán sai thì thả lại
    vẫn trượt, lần thứ ba thì bỏ luôn đường M05 và dán thẳng vào kb/ bằng tay.
    """
    d = []
    if thieu:
        d.append(f"THIẾU: {', '.join(thieu)}")
    for e in loi_schema:
        d.append(f"SAI:   {e}")
    if sampled < 2:
        d.append(f"SAI:   citations_sampled = {sampled}, cần >= 2 (origin: external)")
    elif verified < sampled:
        d.append(f"SAI:   citations_verified = {verified} < sampled = {sampled}")

    sua = []
    if thieu:
        sua.append("điền các trường THIẾU ở trên — máy KHÔNG tự điền vì chúng là "
                   "quyết định, không phải phép tính")
    if sampled < 2 or verified < sampled:
        sua.append("mở 2 link bất kỳ trong bài, xác nhận trích dẫn khớp, rồi điền "
                   "citations_sampled và citations_verified")
    if not sua:
        sua.append("sửa các lỗi SAI ở trên rồi thả lại vào _inbox/")
    d.append("SỬA:   " + ("\n       ".join(sua)))
    return "\n".join(d)


def gac(text, ngay="2026-08-19", schema=None, concepts=None, tmp=None):
    """Trả (ok, frontmatter_moi, thong_bao). Không chạm đĩa."""
    schema = schema or json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    raw, body = split_frontmatter(text)

    # ── không có frontmatter ⇒ trả lại KÈM KHUNG (spec §2.4) ──
    if raw is None:
        return (False, None,
                "THIẾU: toàn bộ frontmatter\n"
                "SỬA:   thêm khối YAML dưới đây vào đầu file, điền các chỗ ___\n\n"
                + KHUNG.format(ngay=ngay))

    import yaml
    try:
        fm = yaml.safe_load(raw) or {}
    except yaml.YAMLError as e:
        return False, None, f"SAI:   frontmatter không parse được: {str(e)[:100]}\nSỬA:   sửa cú pháp YAML"

    thieu = [k for k in BAT_BUOC_NGUOI if not fm.get(k)]

    # ── M05 đặt phần dữ kiện và phép tính. KHÔNG đặt phần phán đoán. ──
    moi = dict(fm)
    moi["origin"] = "external"          # bản không đi qua 6 pass
    moi["review_status"] = "draft"      # M05-R1 — không bao giờ approved
    moi["ingested_at"] = ngay
    moi["word_count"] = count_words(body)   # PHÉP TÍNH, giống --fix
    if fm.get("url"):
        moi["url_normalized"] = normalize_url(fm["url"])

    sampled = int(fm.get("citations_sampled") or 0)
    verified = int(fm.get("citations_verified") or 0)

    if thieu or sampled < 2 or verified < sampled:
        return False, moi, _cach_sua(thieu, [], sampled, verified)

    # ── chạy validator của M01 trên bản đã bổ sung ──
    if tmp is not None:
        p = Path(tmp) / "kiem.md"
        p.write_text("---\n" + yaml.safe_dump(moi, allow_unicode=True, sort_keys=False)
                     + "---\n" + body, encoding="utf-8")
        errs, _ = check(p, schema, concepts or set())
        if errs:
            return False, moi, _cach_sua([], errs, sampled, verified)

    return True, moi, "đạt — vào kho ở draft"


def _mo_kho_db(kb):
    """Mo kb/_kho.sqlite de INSERT (FR-034). DB thieu + kho co file ⇒ NEM ro:
    tu tao DB rong roi export se XOA cac file do nhu mo coi — dung guard
    chong-mat-du-lieu cua dungchung.mjs. Kho moi tinh (0 file bai) thi tao."""
    import sqlite3
    duong = kb / "_kho.sqlite"
    if not duong.exists():
        co_bai = any(
            f for f in kb.rglob("*.md")
            if f.parent.name in ("repo", "paper", "video", "article", "docs", "announcement", "tai-lieu")
            and not f.name.startswith("_") and f.name.lower() != "readme.md")
        if co_bai:
            raise SystemExit(
                "kb/ co bai export nhung chua co kb/_kho.sqlite — chay: "
                "python core/tools/dung_lai_db.py (duong file→DB duy nhat)")
        cn = sqlite3.connect(duong)
        cn.execute("PRAGMA journal_mode = WAL")
        cn.executescript((ROOT / "core" / "assets" / "kho.schema.sql")
                         .read_text(encoding="utf-8"))
        cn.commit()
        return cn
    cn = sqlite3.connect(duong)
    cn.execute("PRAGMA busy_timeout = 5000")
    return cn


def chay(inbox=INBOX, kb=KB, ngay="2026-08-19"):
    import tempfile
    import yaml
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    cy = kb / "concepts.yaml"
    # `or []` — danh muc RONG khac danh muc THIEU.
    #
    # Mot concepts.yaml chi con comment (moi muc da xoa) parse ra `None`, va
    # `{c["id"] for c in None}` sap bang TypeError. Cong nop bai chet giua duong
    # vi kho rong — mot trang thai hoan toan hop le.
    #
    # Cung mot cho da sua o `validate.py`: rong nghia la "danh muc dong, chua co
    # muc nao", con thieu file thi `cy.exists()` lo.
    concepts = ({c["id"] for c in (yaml.safe_load(cy.read_text(encoding="utf-8")) or [])}
                if cy.exists() else set())

    ket = []
    for f in sorted(inbox.glob("*.md")):
        # Hai hau to la KET QUA cua chinh cong nay, khong phai file nop moi.
        # Doc lai `.da-vao-kho.md` la ghi de kho bang ban cu — dung bug vua sua.
        if f.name.endswith((".rejected.md", ".da-vao-kho.md")):
            continue
        text = f.read_text(encoding="utf-8")
        with tempfile.TemporaryDirectory() as d:
            ok, fm, tb = gac(text, ngay, schema, concepts, tmp=d)

        if not ok:
            # Trả lại GIỮ NGUYÊN file gốc — người sửa rồi thả lại, không viết lại
            ra = f.with_suffix(".rejected.md")
            ra.write_text(f"<!--\n{tb}\n-->\n\n{text}", encoding="utf-8")
            ket.append((f.name, False, tb.splitlines()[0] if tb else ""))
            continue

        _, body = split_frontmatter(text)

        # FR-034 — dich la HANG trong DB, khong con la file.
        # FR-038 — ba bang noi dung; bang dich tra tu BANG KHAI.
        # KHONG GHI DE BAI DA CO TRONG KHO.
        #
        # Bug that (thoi con ghi file), do bang thuc nghiem: sua one_liner mot
        # bai tren web, chay gate, dong sua BIEN MAT — bi ban trong _inbox/ ghi
        # de, khong canh bao. Rang giu nguyen tren DB: SELECT truoc, trung khoa
        # thi tra lai. Khong tu doi thanh .v<n> — ban luu tru la viec cua
        # re-analyze (F3, M02 §2.5), khong phai hau qua cua mot lan nap trung.
        cn = _mo_kho_db(kb)
        try:
            # Doc VIEW `ban_ghi`: mot bai da co o BAT KY bang nao cung la trung.
            # Doc rieng bang dich thi mot slug trung o bang khac di qua im lang,
            # va deep-link `/(type)/(slug)/` cua no tro vao dau khong ai biet.
            trung = cn.execute(
                "SELECT 1 FROM ban_ghi WHERE source_type = ? AND slug = ?",
                (fm["source_type"], fm["slug"])).fetchone()
            if trung:
                tb = (f"kho da co {fm['source_type']}/{fm['slug']} — cong nay KHONG ghi de.\n"
                      "Sua: xoa/doi ten ban trong kho truoc (web co nut 'Bo khoi kho'),\n"
                      "hoac doi `slug` trong file nay neu day la bai KHAC.")
                ra = f.with_suffix(".rejected.md")
                ra.write_text(f"<!--\n{tb}\n-->\n\n{text}", encoding="utf-8")
                ket.append((f.name, False, tb.splitlines()[0]))
                continue

            import hashlib
            fm_json = json.dumps(fm, ensure_ascii=False)
            than = body.strip()
            etag = hashlib.sha256(f"1\n{fm_json}\n{than}".encode("utf-8")).hexdigest()[:16]
            # Dinh tuyen theo BANG KHAI. Map sai ⇒ CHECK hep ban ⇒ chet TO,
            # do la thu ta muon. Loai la ⇒ KeyError, cung chet to.
            bang = _BANG_CUA[fm["source_type"]]
            cn.execute("BEGIN IMMEDIATE")
            cn.execute(
                f"INSERT INTO {bang} (source_type, slug, frontmatter, than, version, etag)"
                " VALUES (?,?,?,?,1,?)",
                (fm["source_type"], fm["slug"], fm_json, than, etag))
            cn.commit()
        finally:
            cn.close()
        dich = kb / fm["source_type"] / f"{fm['slug']}.md"   # duong EXPORT, cho bao cao

        # DON _inbox/ SAU KHI VAO KHO.
        #
        # Khong don thi moi lan chay gate lai xu ly lai MOI file con nam do — va
        # truoc khi co phep kiem `dich.exists()` o tren, do chinh la co che ghi
        # de kho bang ban cu. Giu file lai cung lam `GET /api/inbox` bao "con
        # file cho gac" mai mai.
        #
        # DOI TEN, khong unlink: cung ly M08-R4 — file nguoi dung nop khong bao
        # gio xoa that. `.da-vao-kho.md` de nguoi con doi chieu duoc, va vong lap
        # tren chi doc `*.md` khong ket thuc bang `.rejected.md`... nen phai bo
        # qua ca hau to nay (xem dieu kien dau vong lap).
        f.rename(f.with_suffix(".da-vao-kho.md"))
        try:
            ket.append((f.name, True, str(dich.relative_to(kb.parent))))
        except ValueError:
            ket.append((f.name, True, str(dich)))   # KB_DIR tro ra ngoai repo

    # FR-034 — EXPORT sau lo: bai vua INSERT phai ra file .md (backup + mat
    # nguoi). Goi ham xuat() cua xuat_kho — mot chieu DB→file, KHONG phai
    # dung_lai_db (chieu nguoc bi cam voi moi tien trinh tu dong).
    if any(k[1] for k in ket):
        sys.path.insert(0, str(ROOT / "core" / "tools"))
        import xuat_kho
        rec = Path(os.environ["RECYCLE_DIR"]) if os.environ.get("RECYCLE_DIR") \
            else ROOT / "_recycle"
        xuat_kho.xuat(kb, rec, kb / "_kho.sqlite")
    return ket


def main():
    ket = chay()
    if not ket:
        print("_inbox/ trống — không có gì để gác.")
        return 0
    for ten, ok, ghi_chu in ket:
        print(f"  {'vào kho' if ok else 'TRẢ LẠI'}  {ten}")
        print(f"           {ghi_chu}")
    return 0 if all(k[1] for k in ket) else 1


if __name__ == "__main__":
    sys.exit(main())
