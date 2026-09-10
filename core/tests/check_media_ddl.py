#!/usr/bin/env python3
"""Cổng DDL kho hiện vật — mọi ràng buộc khai ra phải BẮN THẬT (FR-036/B1).

VÌ SAO CỔNG NÀY TỒN TẠI
Một `CHECK` viết trong DDL là một lời khai. Nó chỉ thành cơ chế khi có ai đó thử
vi phạm và bị chặn. Repo này đã trúng lớp lỗi đó ở chỗ khác: `PRAGMA
foreign_keys = ON` được khai trong header DDL suốt nhiều tháng mà **không code
nào bật nó** — vô hại chỉ vì DDL không có FK nào, và nó là bẫy đúng ngày ai thêm
`REFERENCES`.

Cổng này thử trên **BẢN SAO** DB, không trên kho thật.

ĐỎ_KHI   một ràng buộc khai ra mà INSERT vi phạm vẫn CHO QUA
XANH_KHI hàng hợp lệ vẫn vào được — cổng không được chặn cả việc đúng
"""

import hashlib
import json
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
DDL = R / "core" / "assets" / "kho.schema.sql"
MIME_TABLE = R / "core" / "assets" / "media-mime.json"

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


def thu(cn, ten, sql, args=(), phai_chan=True):
    """Chạy một INSERT/UPDATE và khẳng định nó BỊ CHẶN (hoặc CHO QUA)."""
    try:
        cn.execute(sql, args)
        cn.commit()
        bi_chan = False
        chi_tiet = ""
    except sqlite3.Error as e:
        bi_chan = True
        chi_tiet = str(e)[:70]
    dat = bi_chan == phai_chan
    print(f"  {'ok  ' if dat else 'FAIL'} {ten}"
          + ("" if dat else f"   mong {'CHẶN' if phai_chan else 'CHO QUA'}"
                            f", được {'chặn' if bi_chan else 'cho qua'}"
                            + (f" [{chi_tiet}]" if chi_tiet and not phai_chan else "")))
    if not dat:
        loi.append(ten)


# ─── 0 · DDL và bảng mime tự nhất quán ──────────────────────────────────────
print("0 · DDL và bảng mime khai cùng một thứ\n")
ddl = DDL.read_text(encoding="utf-8")
mt = json.loads(MIME_TABLE.read_text(encoding="utf-8"))
MIME = [x["mime"] for x in mt["loai"]]

kiem("CREATE TABLE media" in ddl, "DDL có bảng `media`")
kiem("sha256      TEXT PRIMARY KEY" in ddl or "sha256 TEXT PRIMARY KEY" in ddl,
     "`sha256` là khoá chính — địa chỉ theo NỘI DUNG",
     "khoá tự tăng thì export không idempotent và không dedup được")
kiem("la_dan_xuat" in ddl, "có cột `la_dan_xuat`",
     "thêm cột sau = một lần dựng lại DB huỷ diệt nữa (SQLite không ALTER được CHECK)")
kiem("GENERATED ALWAYS AS (length(byte))" in ddl, "`so_byte` là cột GENERATED",
     "ghi tay được thì số byte khai lệch byte thật")
kiem("'tai-lieu'" in ddl, "`source_type` CHECK nhận `tai-lieu`")
kiem(len(set(MIME)) == len(MIME), f"{len(MIME)} mime, không trùng")
kiem(all(x.get("magic") for x in mt["loai"]),
     "mọi mime khai `magic` — lớp thứ sáu của intake soi BYTE",
     "năm lớp hardening hiện có không lớp nào đọc byte")
kiem(mt["tran_byte"] > 0 and mt["tran_byte"] < 100 * 1024 * 1024,
     f"trần hiện vật {mt['tran_byte'] // 1024 // 1024} MB")
kiem(len(mt["video_host"]) >= 1 and all("id_mau" in h for h in mt["video_host"]),
     "host video khai kèm mẫu id — `src` dựng từ whitelist + regex, không từ frontmatter")

# ─── 1 · Dựng DB tạm rồi THỬ VI PHẠM ────────────────────────────────────────
print("\n1 · Ràng buộc `articles` bắn thật (trên DB tạm)\n")
# mkdtemp + don best-effort, KHONG dung context manager: tren Windows
# `TemporaryDirectory.__exit__` nem PermissionError khi mot handle sqlite con
# song, va no nem SAU khi moi phep kiem da xanh — tuc cong do vi viec DON,
# khong vi viec DO. Dung lop loi `maxRetries` cua `_api.mjs:don()`.
if True:
    d = tempfile.mkdtemp(prefix="gn-mediaddl-")
    db = Path(d) / "thu.sqlite"
    cn = sqlite3.connect(str(db))
    cn.executescript(ddl)

    def fm(**kw):
        return json.dumps({"id": "src_aaaaaa", "review_status": "approved", **kw},
                          ensure_ascii=False)

    I = ("INSERT INTO bai_viet(source_type,slug,frontmatter,than,etag) "
         "VALUES(?,?,?,?,'e0')")

    thu(cn, "source_type ngoài enum bị chặn",
        I, ("khong-co-loai", "x1", fm(slug="x1", source_type="khong-co-loai"), "t"))
    # FR-038 đổi kỳ vọng của phép kiểm này, và đổi ĐÚNG chiều.
    #
    # Bản trước khai `tai-lieu` phải ĐƯỢC NHẬN vào bảng nội dung — đúng khi có
    # MỘT bảng cho cả 7 loại. Giờ có ba bảng với CHECK hẹp, nên `tai-lieu` vào
    # `bai_viet` phải BỊ CHẶN, và nó được nhận ở `tai_lieu`.
    #
    # Giữ cả hai chiều: chặn ở bảng sai (chiều âm) VÀ nhận ở bảng của nó
    # (chiều dương — cổng không được đỏ oan). Bỏ chiều dương thì một CHECK
    # `source_type = 'khong-bao-gio'` cũng đi qua mọi phép kiểm còn lại.
    thu(cn, "`tai-lieu` BỊ CHẶN ở `bai_viet` (chiều âm — CHECK hẹp có hiệu lực)",
        I, ("tai-lieu", "x-tl", fm(slug="x-tl", source_type="tai-lieu"), "t"))
    thu(cn, "`tai-lieu` ĐƯỢC nhận ở `tai_lieu` (xanh_khi — không đỏ oan)",
        ("INSERT INTO tai_lieu(source_type,slug,frontmatter,than,etag) "
         "VALUES(?,?,?,?,'e0')"),
        ("tai-lieu", "x-tl", fm(slug="x-tl", source_type="tai-lieu"), "t"),
        phai_chan=False)
    thu(cn, "frontmatter.slug lệch cột slug bị chặn",
        I, ("repo", "LECH", fm(slug="x2", source_type="repo"), "t"))
    thu(cn, "frontmatter.source_type lệch cột bị chặn",
        I, ("repo", "x3", fm(slug="x3", source_type="paper"), "t"))
    thu(cn, "trùng khoá chính (source_type, slug) bị chặn",
        I, ("tai-lieu", "x-tl", fm(slug="x-tl", source_type="tai-lieu"), "t"))
    thu(cn, "`than` NULL bị chặn",
        "INSERT INTO bai_viet(source_type,slug,frontmatter,than,etag) VALUES('repo','x4',?,NULL,'e')",
        (fm(slug="x4", source_type="repo"),))

    print("\n2 · Ràng buộc `media` bắn thật\n")
    byte = b"%PDF-1.7 gia lap"
    sha = hashlib.sha256(byte).hexdigest()

    thu(cn, "hàng media hợp lệ vào được (xanh_khi)",
        "INSERT INTO media(sha256, byte) VALUES(?,?)", (sha, byte), phai_chan=False)
    thu(cn, "`byte` NULL bị chặn",
        "INSERT INTO media(sha256, byte) VALUES('a'*64, NULL)")
    thu(cn, "trùng `sha256` bị chặn (PK)",
        "INSERT INTO media(sha256, byte) VALUES(?,?)", (sha, b"khac"))
    thu(cn, "`la_dan_xuat` ngoài {0,1} bị chặn",
        "INSERT INTO media(sha256, byte, la_dan_xuat) VALUES(?,?,7)", ("b" * 64, b"x"))
    thu(cn, "ghi tay `so_byte` bị chặn — nó là cột GENERATED",
        "INSERT INTO media(sha256, byte, so_byte) VALUES(?,?,999)", ("c" * 64, b"x"))

    # `INSERT OR IGNORE` là cách hai bản ghi dùng chung một file mà không nổ.
    truoc = cn.execute("SELECT COUNT(*) FROM media").fetchone()[0]
    cn.execute("INSERT OR IGNORE INTO media(sha256, byte) VALUES(?,?)", (sha, byte))
    cn.commit()
    sau = cn.execute("SELECT COUNT(*) FROM media").fetchone()[0]
    kiem(truoc == sau, "`INSERT OR IGNORE` cùng sha256 KHÔNG thêm hàng — dedup",
         "hai bản ghi dùng chung một PDF phải chia nhau một blob")

    n, sb = cn.execute("SELECT sha256, so_byte FROM media WHERE sha256=?", (sha,)).fetchone()
    kiem(sb == len(byte), f"`so_byte` tự đo đúng ({sb} byte)")

    print("\n3 · VIEW `nhan` không phân biệt hồ sơ\n")
    # Bản ghi `tai-lieu` vào bảng `tai_lieu` (FR-038) — `I` trỏ `bai_viet`.
    cn.execute("INSERT INTO tai_lieu(source_type,slug,frontmatter,than,etag)"
               " VALUES(?,?,?,?,'e0')",
               ("tai-lieu", "co-nhan",
                fm(slug="co-nhan", source_type="tai-lieu",
                   ho_so="thu-vien", category=["a"], concepts=["b"]), "t"))
    cn.commit()
    r = cn.execute("SELECT loai, gia_tri FROM nhan WHERE slug='co-nhan' ORDER BY loai").fetchall()
    kiem(r == [("category", "a"), ("concept", "b")],
         "bản ghi `thu-vien` đếm nhãn qua VIEW `nhan` y như bản phân tích",
         f"thấy {r} — đây là lý do 'loại mới cũng cần danh mục' KHÔNG phải viết mã mới")
    cn.close()

# ─── 4 · Kho THẬT chưa bị đụng ──────────────────────────────────────────────
print("\n4 · Kho thật giữ nguyên\n")
that = R / "kb" / "_kho.sqlite"
if that.exists():
    c2 = sqlite3.connect(f"file:{that}?mode=ro", uri=True)
    bang = {r[0] for r in c2.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    kiem("media" in bang, "kho thật đã có bảng `media` (đã di trú)")
    kiem(c2.execute("PRAGMA integrity_check").fetchone()[0] == "ok",
         "kho thật integrity_check ok")
    c2.close()
else:
    kiem(False, "kb/_kho.sqlite tồn tại", "chạy dung_lai_db.py trước")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} ràng buộc DDL không bắn thật — sửa DDL, KHÔNG sửa cổng")
print("DDL kho hiện vật: mọi ràng buộc khai ra đều bắn thật")

import shutil as _sh
_sh.rmtree(d, ignore_errors=True)
