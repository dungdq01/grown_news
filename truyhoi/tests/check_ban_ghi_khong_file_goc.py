#!/usr/bin/env python3
r"""WO-099 · T13-8 — indexer CHỊU ĐƯỢC bản ghi KHÔNG có file gốc (422), và lỗi LÕI thành KẾT LUẬN, không traceback.

Kho thật 2026-09-11: 16 bản ghi, **11** trả 422 ở `GET /api/xuat/<loai>/<slug>?dang=goc` (video đăng
ký bằng URL — hợp đồng đúng của LÕI, FR-075). 20 cổng vẫn xanh vì kho tạm giàu hơn thật. Fixture ở đây
có CẢ HAI loại bản ghi (`_loi_gia.kho_mau()` có `webmcp-gia` với `khong_file_goc`).

Bốn ca (task T13-8):
  A  422 ở `goc` ⇒ `reindex` KHÔNG ném; lấy `than` qua `/api/articles`; bản ghi có chunk `than`
  B  500 ở `goc` ⇒ `reindex` không ném, trả `hong: [{slug, cua, ma}]` — ĐỎ có câu chữ, 0 traceback
  C  kho hỗn hợp 3 có file + 3 không ⇒ 6/6 trong `tai_lieu`, `kiem_lech` rỗng, chunk > 0 mỗi bài
  D  422 VÀ `/api/articles` 404 ⇒ bản ghi bị BỎ CÓ NÊU SLUG (trong `hong`), các bài khác vẫn index

ĐỎ_KHI  reindex ném HTTPError · bản ghi 422 vắng chunk · hong không nêu slug/cửa/mã · bài khác bị kéo chết
XANH_KHI bốn ca đúng
--tu-kiem: gieo `lay_bytes` giả ném 422 cho MỌI cửa (indexer không fallback) ⇒ phép chấm ca A phải ĐỎ;
           kết quả `hong` rỗng dù một bài hỏng ⇒ phép chấm ca D phải ĐỔ.
"""
import sys
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_ban_ghi_khong_file_goc.py"


def cham_a(kq, con, slug, nhan) -> list[str]:
    """kq = kết quả reindex hoặc Exception. Trả danh sách lỗi ca A."""
    loi = []
    if isinstance(kq, BaseException):
        return [f"reindex NÉM {type(kq).__name__}: {str(kq)[:80]} — chưa fallback sang /api/articles"]
    n = con.execute("SELECT count(*) FROM chunks WHERE doc_id = ? AND nguon_van_ban = 'than'", (slug,)).fetchone()[0]
    if n == 0:
        loi.append(f"bản ghi 422 `{slug}` không có chunk `than`")
    if not any(f"/api/articles/video/{slug}" in x["duong"] for x in nhan):
        loi.append(f"không thấy request /api/articles/video/{slug} — không lấy thân từ cửa thay thế")
    if kq.get("hong"):
        loi.append(f"bản ghi 422 bị coi là hỏng: {kq['hong']}")
    return loi


def cham_hong(kq, slug, cua_mong, ma_mong) -> list[str]:
    """Ca B/D: `hong` phải NÊU slug + cửa + mã — không nuốt im lặng."""
    if isinstance(kq, BaseException):
        return [f"reindex NÉM {type(kq).__name__} thay vì trả `hong` — traceback, không phải kết luận"]
    hong = kq.get("hong")
    if not isinstance(hong, list) or not hong:
        return [f"`hong` rỗng/thiếu dù `{slug}` hỏng — nuốt im lặng"]
    h = next((x for x in hong if x.get("slug") == slug), None)
    if not h:
        return [f"`hong` không nêu slug `{slug}`: {hong}"]
    loi = []
    if cua_mong not in str(h.get("cua", "")):
        loi.append(f"`hong[{slug}].cua` = {h.get('cua')!r}, mong nêu `{cua_mong}`")
    if h.get("ma") != ma_mong:
        loi.append(f"`hong[{slug}].ma` = {h.get('ma')!r}, mong {ma_mong}")
    return loi


if K.TU_KIEM:
    print("\ntu-kiem · phép chấm phải ĐỎ ĐƯỢC\n")
    e = urllib.error.HTTPError("http://x/api/xuat/video/s?dang=goc", 422, "Unprocessable", {}, None)
    K.kiem(cham_a(e, None, "s", []) and "NÉM" in cham_a(e, None, "s", [])[0], "reindex ném 422 ⇒ ca A đỏ, nêu 'chưa fallback'")
    K.kiem(cham_hong({"hong": []}, "s", "goc", 500) and "nuốt" in cham_hong({"hong": []}, "s", "goc", 500)[0], "hong rỗng dù bài hỏng ⇒ ca B/D đỏ 'nuốt im lặng'")
    K.kiem(cham_hong({"hong": [{"slug": "s", "cua": "/api/xuat/video/s?dang=goc", "ma": 500}]}, "s", "goc", 500) == [], "hong nêu đủ slug+cửa+mã ⇒ sạch")
    K.kiem(cham_hong({"hong": [{"slug": "khac", "cua": "goc", "ma": 500}]}, "s", "goc", 500), "hong nêu slug khác ⇒ đỏ")
    K.tu_kiem_xong(CONG, 4)

try:
    indexer, db = _nap.nap("indexer", "db")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-9")


def dung(tmp, loi):
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            kq = indexer.reindex(con, day_du=True)
        except Exception as ex:  # noqa: BLE001 — cổng bắt để CHẤM, không để traceback
            kq = ex
        return con, kq


print("\nA · 422 ở ?dang=goc ⇒ lấy thân qua /api/articles, không ném\n")
with K.tam("gn_m13_422a_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    con, kq = dung(tmp, loi)
    la = cham_a(kq, con if not isinstance(kq, BaseException) else None, "webmcp-gia", loi.nhan)
    K.kiem(not la, "bản ghi `webmcp-gia` (422) có chunk than, thân lấy qua /api/articles, không ném, không vào `hong`", " · ".join(la))
    if not isinstance(kq, BaseException):
        n = con.execute("SELECT count(*) FROM tai_lieu").fetchone()[0]
        K.kiem(n == len(loi.kho), f"mọi bản ghi kho mẫu ({len(loi.kho)}) đều vào tai_lieu", f"được {n}")
        con.close()

print("\nB · 500 ở ?dang=goc ⇒ ĐỎ CÓ CÂU CHỮ (hong nêu slug + cửa + mã), 0 traceback\n")
with K.tam("gn_m13_500b_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    loi.loi_cua[("goc", "pipeline-basics")] = 500
    con, kq = dung(tmp, loi)
    lb = cham_hong(kq, "pipeline-basics", "goc", 500)
    K.kiem(not lb, "hong = [{slug: pipeline-basics, cua: …goc…, ma: 500}]", " · ".join(lb))
    if not isinstance(kq, BaseException):
        K.kiem(con.execute("SELECT count(*) FROM tai_lieu").fetchone()[0] == len(loi.kho) - 1, "các bài khác vẫn index (không bị kéo chết)")
        con.close()

print("\nC · kho hỗn hợp 3 có file + 3 không ⇒ 6/6, kiem_lech rỗng, chunk > 0 mỗi bài\n")
kho = {}
for i in range(3):
    kho[f"co-file-{i}"] = {"loai": "docs", "updated_at": "2026-09-01", "frontmatter": {"title": f"Có file {i}", "review_status": "approved"},
                          "body": f"## Mục {i}\n\nĐoạn có file {i}.\n", "media": {}}
    kho[f"url-only-{i}"] = {"loai": "video", "updated_at": "2026-09-02", "khong_file_goc": True,
                            "frontmatter": {"title": f"URL only {i}", "review_status": "approved", "url": "https://youtu.be/x"},
                            "body": f"## Ghi chú {i}\n\nĐoạn không file {i}.\n", "media": {}}
with K.tam("gn_m13_hon_") as tmp, _loi_gia.LoiGia(kho) as loi:
    con, kq = dung(tmp, loi)
    if isinstance(kq, BaseException):
        K.kiem(False, "reindex kho hỗn hợp không ném", f"{type(kq).__name__}: {str(kq)[:80]}")
    else:
        n = con.execute("SELECT count(*) FROM tai_lieu").fetchone()[0]
        K.kiem(n == 6, "6/6 bản ghi vào tai_lieu", f"được {n}")
        thieu = [s for s in kho if con.execute("SELECT count(*) FROM chunks WHERE doc_id=?", (s,)).fetchone()[0] == 0]
        K.kiem(not thieu, "chunk > 0 cho cả sáu", str(thieu))
        with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
            kl = indexer.kiem_lech(con)
        K.kiem(kl == {"lech": [], "mo_coi": [], "chua_index": []}, "kiem_lech rỗng — không mồ côi, không chưa-index", str(kl))
        K.kiem(kq.get("hong") == [], "hong rỗng — 422 KHÔNG phải hỏng", str(kq.get("hong")))
        con.close()

print("\nD · 422 VÀ /api/articles 404 ⇒ bỏ CÓ NÊU SLUG, bài khác vẫn index\n")
with K.tam("gn_m13_404d_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    loi.loi_cua[("bai", "webmcp-gia")] = 404
    con, kq = dung(tmp, loi)
    ld = cham_hong(kq, "webmcp-gia", "articles", 404)
    K.kiem(not ld, "hong nêu webmcp-gia · cửa /api/articles · mã 404", " · ".join(ld))
    if not isinstance(kq, BaseException):
        K.kiem(con.execute("SELECT count(*) FROM tai_lieu WHERE doc_id='webmcp-gia'").fetchone()[0] == 0, "bản ghi hỏng cả hai cửa KHÔNG vào index (không nửa vời)")
        K.kiem(con.execute("SELECT count(*) FROM tai_lieu").fetchone()[0] == len(loi.kho) - 1, "các bài khác vẫn index")
        con.close()

K.chot("422 ⇒ fallback /api/articles · 500/404 ⇒ hong nêu slug+cửa+mã · kho hỗn hợp 6/6")
