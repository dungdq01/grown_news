#!/usr/bin/env python3
r"""AC-4.2 · T13-4 AC3 — `w_title` đọc từ cấu hình `truyhoi/assets/nguong.json`, KHÔNG gõ
trong SQL; và có HAI số đo riêng: `vi_en` và `zh` (token một-chữ của tiếng Trung cho
điểm khác hẳn token một-từ). Đổi `w_title` ⇒ HẠNG đổi, SQL không đổi.

ĐỎ_KHI  `bm25(chunks_fts, <số>` literal trong mã · nguong.json thiếu `w_title.vi_en` hoặc `.zh` ·
        đổi w_title mà thứ hạng không đổi (số không được dùng)
XANH_KHI SQL dùng tham số bind cho w_title · hai số · đổi số ⇒ hạng đổi · zh query chọn số zh
--tu-kiem: gieo `bm25(chunks_fts, 5.0, 1.0)` ⇒ bắt; cấu hình một số ⇒ bắt.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_w_title_do_rieng.py"
NGUONG = K.R / "truyhoi" / "assets" / "nguong.json"
RX_LITERAL = re.compile(r"bm25\(\s*\w+\s*,\s*\d")


def soi_sql(nguon: dict[str, str]) -> list[str]:
    return [f"{f}:{i}" for f, t in nguon.items() for i, l in enumerate(t.splitlines(), 1) if RX_LITERAL.search(l)]


def soi_cau_hinh(cfg: dict) -> list[str]:
    w = cfg.get("w_title")
    if not isinstance(w, dict):
        return ["`w_title` phải là object {vi_en, zh}, không phải MỘT số"]
    return [f"thiếu w_title.{k}" for k in ("vi_en", "zh") if not isinstance(w.get(k), (int, float))]


if K.TU_KIEM:
    print("\ntu-kiem · soi SQL và cấu hình phải ĐỎ ĐƯỢC\n")
    K.kiem(soi_sql({"rank.py": "ORDER BY bm25(chunks_fts, 5.0, 1.0)"}) == ["rank.py:1"], "literal 5.0 trong bm25( ⇒ bắt")
    K.kiem(soi_sql({"rank.py": "ORDER BY bm25(chunks_fts, ?, 1.0)"}) == [], "tham số bind ⇒ không đỏ oan")
    K.kiem(soi_cau_hinh({"w_title": 5}) and "MỘT số" in soi_cau_hinh({"w_title": 5})[0], "cấu hình một số ⇒ đỏ, nêu lý do")
    K.kiem(soi_cau_hinh({"w_title": {"vi_en": 5}}) == ["thiếu w_title.zh"], "thiếu zh ⇒ nêu đúng khoá")
    K.kiem(soi_cau_hinh({"w_title": {"vi_en": 5, "zh": 8}}) == [], "đủ hai số ⇒ sạch")
    K.tu_kiem_xong(CONG, 5)

print("\n1 · cấu hình: hai số, đọc từ nguong.json\n")
K.kiem(NGUONG.exists(), "truyhoi/assets/nguong.json tồn tại", "T13-4 chưa dựng")
cfg = K.doc_json(NGUONG) if NGUONG.exists() else {}
loi_cfg = soi_cau_hinh(cfg)
K.kiem(not loi_cfg, "`w_title.vi_en` và `w_title.zh` đều là số", " · ".join(loi_cfg))

print("\n2 · SQL không gõ số trong bm25(\n")
nguon = K.nguon_src()
vp = soi_sql(nguon)
K.kiem(bool(nguon) and not vp, "0 literal số trong `bm25(chunks_fts, …)` — w_title bind từ cấu hình", " · ".join(vp) or "chưa có mã")

try:
    indexer, db, rank, chuan_hoa = _nap.nap("indexer", "db", "rank", "chuan_hoa")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

with K.tam("gn_m13_wt_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau_zh()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            print("\n3 · đổi w_title ⇒ hạng đổi; SQL không đổi\n")
            q = "pipeline"   # từ này nằm ở TITLE của `pipeline-basics` và ở BODY của bài khác
            hang = {}
            for w in (0.0, 50.0):
                with K.env_tam(TRUYHOI_W_TITLE_VI_EN=str(w)):
                    r = rank.truy_hoi(con, cau_hoi=q, pham_vi={}, nguon=None, k=10)
                    hang[w] = [x["doc_id"] + "#" + str(x["anchor"]) for x in r["ket_qua"]]
            K.kiem(hang[0.0] and hang[50.0], "cả hai lần đều có kết quả", str(hang))
            K.kiem(hang[0.0] != hang[50.0], "w_title 0 vs 50 ⇒ thứ hạng ĐỔI (số được dùng thật)", f"{hang[0.0][:3]} == {hang[50.0][:3]}")
            K.kiem(hasattr(rank, "doc_w_title") and set(rank.doc_w_title()) >= {"vi_en", "zh"}, "rank.doc_w_title() trả hai khoá vi_en · zh")
            K.kiem(hasattr(rank, "chon_w_title") and rank.chon_w_title("資料") == rank.doc_w_title()["zh"]
                   and rank.chon_w_title("dữ liệu") == rank.doc_w_title()["vi_en"],
                   "query có chữ Hán ⇒ dùng số zh; không ⇒ vi_en (dải đọc từ dai-han.json)")
        finally:
            con.close()

K.chot("w_title hai số từ cấu hình · SQL bind · đổi số ⇒ hạng đổi")
