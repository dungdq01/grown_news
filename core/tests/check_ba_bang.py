#!/usr/bin/env python3
"""FR-038/C2 — BA BẢNG + HAI VIEW, và mỗi loại vào ĐÚNG bảng của nó.

RỦI RO SỐ MỘT của cả FR-038 nằm ở chỗ `ban_ghi` khớp với `loai-nguon.json`:

  `xuat_kho.py:141-146` lặp `for loai in LOAI` rồi xoá mọi `.md` không có trong
  `can_co` — và `can_co` dựng từ `ban_ghi`. Nếu view THIẾU một nhánh mà bảng khai
  vẫn liệt loại đó thì export coi MỌI `.md` của loại đó là mồ côi và XOÁ SẠCH.
  `banXuat()` chạy tự động sau mỗi lần ghi (`dungchung.mjs:358-374`) nên nó xảy
  ra KHÔNG cần ai gõ lệnh gì, rồi `dung_lai_db.py` kế tiếp dựng DB từ cây đã bị
  dọn ⇒ mất vĩnh viễn.

CHIỀU ÂM quan trọng hơn chiều dương. Nếu một hôm ai đó dán CHECK rộng
(`source_type IN (…7 giá trị…)`) vào cả ba bảng "cho khỏi lỗi", thì mọi hàng vào
bảng nào cũng được, `ban_ghi` vẫn trả đủ, và mọi cổng khác vẫn xanh. Nên §1 đòi
mỗi loại BỊ TỪ CHỐI ở hai bảng kia, không chỉ được nhận ở bảng của nó.

Chạy trên DB TẠM dựng từ chính DDL — không đụng kho thật (CẤM "sửa file thật để
thử một cổng").
"""
import json
import sqlite3
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parents[2]
DDL = (R / "core" / "assets" / "kho.schema.sql").read_text(encoding="utf-8")
LN = json.loads((R / "core" / "assets" / "loai-nguon.json").read_text(encoding="utf-8"))
MODULE = [m for m in LN["module"]]
BANG_CUA = {l: m["bang"] for m in MODULE for l in m["loai"]}
MOI_BANG = sorted({m["bang"] for m in MODULE})

loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


def mo():
    cn = sqlite3.connect(":memory:")
    cn.executescript(DDL)
    return cn


def fm(loai, slug, media=None):
    d = {"id": "src_" + slug.replace("-", "")[:10].ljust(6, "0"), "slug": slug,
         "source_type": loai, "review_status": "approved"}
    if media:
        d["media"] = media
    return json.dumps(d, ensure_ascii=False)


def chen(cn, bang, loai, slug, media=None):
    """Trả `(nhận?, lời lỗi)` — KHÔNG ném.

    Cổng phải SỐNG SÓT qua đúng thứ nó đang chấm: bảng chưa tồn tại thì đây là
    một dòng FAIL nói ra điều đó, không phải một traceback giết cả cổng trước
    khi in được phép kiểm nào. Lớp lỗi này đã ăn bốn cổng trong FR-036.
    """
    try:
        cn.execute(
            f"INSERT INTO {bang} (source_type,slug,frontmatter,than,version,etag)"
            " VALUES (?,?,?,?,1,'x')", (loai, slug, fm(loai, slug, media), "than"))
        return True, ""
    except sqlite3.Error as e:
        return False, str(e)


def dem(cn, cau, *ts):
    try:
        return cn.execute(cau, ts).fetchone()[0]
    except sqlite3.Error as e:
        return f"LỖI: {e}"


print("\n1 · Mỗi loại vào ĐÚNG bảng — và BỊ TỪ CHỐI ở hai bảng kia\n")

cn = mo()
ten_bang = {r[0] for r in cn.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
ok(set(MOI_BANG) <= ten_bang, f"DDL có đủ {len(MOI_BANG)} bảng nội dung",
   f"thiếu {sorted(set(MOI_BANG) - ten_bang)}")
ok("articles" not in ten_bang,
   "bảng `articles` cũ KHÔNG còn — tách là tách, không để lại bản song sinh")

view = {r[0] for r in cn.execute("SELECT name FROM sqlite_master WHERE type='view'")}
ok({"ban_ghi", "tham_chieu_media", "nhan"} <= view,
   "DDL có ba view: `ban_ghi` · `tham_chieu_media` · `nhan`",
   f"thiếu {sorted({'ban_ghi', 'tham_chieu_media', 'nhan'} - view)}")

for loai, bang in sorted(BANG_CUA.items()):
    cn2 = mo()
    # chiều DƯƠNG — vào bảng của nó
    nhan, err = chen(cn2, bang, loai, f"t-{loai}")
    ok(nhan, f"`{loai}` vào được `{bang}`", err)

    # xuất hiện trong `ban_ghi` — đây là răng cho RỦI RO SỐ MỘT
    thay = dem(cn2, "SELECT count(*) FROM ban_ghi WHERE source_type=? AND slug=?",
               loai, f"t-{loai}") if nhan else "chưa chèn được"
    ok(thay == 1, f"  `{loai}` XUẤT HIỆN trong `ban_ghi`",
       f"{thay} — view thiếu nhánh ⇒ xuat_kho coi mọi .md loại này là mồ côi và XOÁ SẠCH")

    # chiều ÂM — hai bảng kia phải TỪ CHỐI
    for khac in MOI_BANG:
        if khac == bang:
            continue
        cn3 = mo()
        lot, _ = chen(cn3, khac, loai, f"t-{loai}")
        ok(not lot, f"  `{loai}` BỊ TỪ CHỐI ở `{khac}`",
           "CHECK rộng ⇒ hàng vào bảng nào cũng được, mọi cổng vẫn xanh")

print("\n2 · `tham_chieu_media` phủ ĐÚNG năm bảng\n")

MEDIA = {"sha256": "a" * 64, "mime": "application/pdf", "ten_goc": "a.pdf", "so_byte": 9}
NAM = [(b, "tai-lieu" if b == "tai_lieu" else ("video" if b == "video" else "paper"))
       for b in MOI_BANG] + [("article_versions", "paper"), ("recycle", "paper")]

for bang, loai in NAM:
    cn4 = mo()
    try:
      if bang == "article_versions":
        cn4.execute("INSERT INTO article_versions (source_type,slug,ban,frontmatter,than)"
                    " VALUES (?,?,1,?,'t')", (loai, "x", fm(loai, "x", MEDIA)))
      elif bang == "recycle":
        cn4.execute("INSERT INTO recycle (source_type,slug,frontmatter,than,deleted_at)"
                    " VALUES (?,?,?,'t','2026-01-01')", (loai, "x", fm(loai, "x", MEDIA)))
      else:
        chen(cn4, bang, loai, "x", MEDIA)
    except sqlite3.Error as e:
        ok(False, f"gieo được con trỏ media vào `{bang}`", str(e)); continue
    n = dem(cn4, "SELECT count(*) FROM tham_chieu_media"
                 " WHERE json_extract(frontmatter,'$.media.sha256') = ?", "a" * 64)
    ok(n == 1, f"con trỏ media trong `{bang}` xuất hiện trong `tham_chieu_media`",
       "bỏ nhánh này ⇒ mỗi DELETE phá byte vĩnh viễn, phucHoi() vẫn báo thành công")

print("\n3 · `nhan` view đếm nhãn trên CẢ ba bảng\n")

cn5 = mo()
for loai, bang in (("paper", "bai_viet"), ("tai-lieu", "tai_lieu"), ("video", "video")):
    d = json.loads(fm(loai, f"n-{loai}"))
    d["category"] = ["chu-de"]
    d["concepts"] = ["kn-a", "kn-b"]
    try:
        cn5.execute(f"INSERT INTO {bang} (source_type,slug,frontmatter,than,version,etag)"
                    " VALUES (?,?,?,'t',1,'x')",
                    (loai, f"n-{loai}", json.dumps(d, ensure_ascii=False)))
    except sqlite3.Error as e:
        ok(False, f"gieo nhãn vào `{bang}`", str(e))
n_cat = dem(cn5, "SELECT count(*) FROM nhan WHERE loai='category'")
n_cpt = dem(cn5, "SELECT count(*) FROM nhan WHERE loai='concept'")
ok(n_cat == 3, f"`nhan` đếm category trên cả ba bảng (được {n_cat}, chờ 3)")
ok(n_cpt == 6, f"`nhan` đếm concept trên cả ba bảng (được {n_cpt}, chờ 6)")

print("\n4 · `bam_noi_dung` băm BA BẢNG GỐC, không băm view\n")

sys.path.insert(0, str(R / "core" / "tools"))
try:
    from dung_lai_db import bam_noi_dung
except Exception as e:      # noqa: BLE001
    bam_noi_dung = None
    ok(False, "import được `bam_noi_dung`", str(e))

if bam_noi_dung:
    # mkdtemp + dọn best-effort, KHÔNG dùng context manager: trên Windows
    # `TemporaryDirectory.__exit__` ném PermissionError khi một handle sqlite còn
    # sống, và nó ném SAU khi mọi phép kiểm đã xanh — tức cổng đỏ vì việc DỌN,
    # không vì việc ĐO. Đúng lớp lỗi `maxRetries` của `_api.mjs:don()`.
    d = tempfile.mkdtemp(prefix="gn-babang-")
    try:
        p = Path(d) / "k.sqlite"
        c = sqlite3.connect(p)
        c.executescript(DDL)
        thieu_bang = []
        for loai, bang in (("paper", "bai_viet"), ("tai-lieu", "tai_lieu"),
                           ("video", "video")):
            try:
                c.execute(
                    f"INSERT INTO {bang} (source_type,slug,frontmatter,than,version,etag)"
                    " VALUES (?,?,?,'t',1,'x')", (loai, "b", fm(loai, "b")))
            except sqlite3.Error as e:
                thieu_bang.append(f"{bang}: {e}")
        c.commit(); c.close()
        ok(not thieu_bang, "gieo được một hàng vào cả ba bảng",
           " · ".join(thieu_bang))
        goc = bam_noi_dung(p) if not thieu_bang else None

        # Đột biến TỪNG bảng một. Không có ba ca này thì `bam_noi_dung` gõ thiếu
        # một bảng vẫn xanh vĩnh viễn — cổng round-trip đi mù 1/3 kho.
        for bang in (MOI_BANG if goc else []):
            c = sqlite3.connect(p)
            c.execute(f"UPDATE {bang} SET than = than || 'x'")
            c.commit(); c.close()
            moi = bam_noi_dung(p)
            ok(moi != goc, f"sửa một byte trong `{bang}` ⇒ hash ĐỔI",
               "bảng này KHÔNG nằm trong vòng lặp bam_noi_dung — cổng đi mù 1/3 kho")
            c = sqlite3.connect(p)
            c.execute(f"UPDATE {bang} SET than = substr(than,1,length(than)-1)")
            c.commit(); c.close()
            ok(bam_noi_dung(p) == goc, f"  hoàn tác `{bang}` ⇒ hash về cũ")

        # Răng `sqlite_master`: thêm một bảng mà quên thêm vào vòng lặp phải làm
        # hash ĐỔI — biến "quên" thành thứ người sửa buộc phải nhìn.
        if goc:
            c = sqlite3.connect(p)
            c.execute("CREATE TABLE bang_thu_tu (x TEXT)")
            c.commit(); c.close()
            ok(bam_noi_dung(p) != goc,
               "thêm một BẢNG ⇒ hash đổi (răng sqlite_master)",
               "không có răng này thì 'quên thêm bảng vào vòng lặp' là im lặng")

    finally:
        import shutil
        shutil.rmtree(d, ignore_errors=True)

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — ba bảng CHƯA đúng")
print("pass · mỗi loại vào đúng bảng, ban_ghi phủ đủ, tham_chieu_media 5 nhánh")
