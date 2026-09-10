#!/usr/bin/env python3
r"""AC-4.1 · M13-R4 — `snippet()` CHỈ làm preview; bằng chứng trích dẫn là `body` ĐẦY ĐỦ
của chunk, lấy qua `rowid`. Trần 64 token của snippet() cắt giữa câu mà vẫn TRÔNG như
trích dẫn — cổng verify quote của M14 sẽ trượt vì lý do sai.

Hai lớp đo:
  AST — trên đường trả `ket_qua` không có lời gọi `snippet(` (soi mã rank/api đã lột comment).
  RUNTIME — một chunk dài > 64 token: `body` trả về DÀI HƠN thứ `snippet()` cho ra trên
  cùng dòng, và bằng đúng `body` trong bảng `chunks` theo rowid.

ĐỎ_KHI  `snippet(` xuất hiện trong rank/api · body trả về ngắn hơn/khác body của bảng
XANH_KHI 0 snippet( trong đường trả · body == chunks.body · dài hơn snippet()
--tu-kiem: gieo `snippet(chunks_fts, 1, ...)` vào một file tạm ⇒ soi ra; body bị cắt ⇒ so lệch.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_snippet_chi_preview.py"
RX = re.compile(r"\bsnippet\s*\(")


def soi(nguon: dict[str, str]) -> list[str]:
    return [f"{f}:{i}" for f, t in nguon.items() for i, l in enumerate(t.splitlines(), 1) if RX.search(l)]


def body_bi_cat(body_tra: str, body_bang: str) -> str | None:
    if body_tra != body_bang:
        return f"body trả về ({len(body_tra)} ký tự) ≠ body trong bảng ({len(body_bang)} ký tự)"
    return None


if K.TU_KIEM:
    print("\ntu-kiem · soi snippet( và so body phải ĐỎ ĐƯỢC\n")
    K.kiem(soi({"rank.py": "sql = \"SELECT snippet(chunks_fts, 1, '', '', '…', 12) FROM chunks_fts\""}) == ["rank.py:1"], "snippet( trong SQL ⇒ bắt được")
    K.kiem(soi({"rank.py": K.lot_ma("# dùng snippet() làm preview thôi\nx = 1\n")}) == [], "comment nhắc snippet ⇒ không tính")
    K.kiem(body_bi_cat("a b c", "a b c d e") is not None, "body bị cắt ⇒ lệch")
    K.kiem(body_bi_cat("đầy đủ", "đầy đủ") is None, "body y hệt ⇒ không đỏ oan")
    K.tu_kiem_xong(CONG, 4)

print("\n1 · AST — 0 `snippet(` trên đường trả kết quả\n")
nguon = K.nguon_src()
K.kiem(bool(nguon), "truyhoi/src có mã", "T13-4 chưa dựng")
vp = soi(nguon)
K.kiem(not vp, "0 lời gọi snippet( trong truyhoi/src", " · ".join(vp))

try:
    indexer, db, rank = _nap.nap("indexer", "db", "rank")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

kho = _loi_gia.kho_mau()
DAI = "## Đoạn rất dài\n\n" + " ".join(f"từ{i} đường ống dữ liệu" for i in range(60)) + "\n"
kho["huong-dan-cai-dat"]["body"] += "\n" + DAI
with K.tam("gn_m13_snip_") as tmp, _loi_gia.LoiGia(kho) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            print("\n2 · RUNTIME — chunk > 64 token: body trả về đầy đủ, dài hơn snippet()\n")
            r = rank.truy_hoi(con, cau_hoi="từ59 đường ống dữ liệu", pham_vi={}, nguon=None, k=3)
            kq = r["ket_qua"]
            K.kiem(kq, "có kết quả cho chunk dài", str(r)[:120])
            dai = [x for x in kq if x["doc_id"] == "huong-dan-cai-dat" and "từ59" in x["body"]]
            K.kiem(dai, "chunk dài nằm trong kết quả", str([x["heading_path"] for x in kq]))
            if dai:
                x = dai[0]
                row = con.execute("SELECT id, body FROM chunks WHERE doc_id=? AND line_start=? AND line_end=?",
                                  (x["doc_id"], x["line_start"], x["line_end"])).fetchone()
                K.kiem(row is not None and body_bi_cat(x["body"], row[1]) is None, "body trả về == chunks.body theo rowid", body_bi_cat(x["body"], row[1] if row else ""))
                sn = con.execute("SELECT snippet(chunks_fts, 1, '', '', '…', 64) FROM chunks_fts WHERE rowid=?", (row[0],)).fetchone()[0] if row else ""
                K.kiem(len(x["body"]) > len(sn), f"body ({len(x['body'])} ký tự) DÀI HƠN snippet() ({len(sn)} ký tự) — không dùng snippet làm bằng chứng")
                K.kiem(len(x["body"].split()) > 64, "chunk thử thật sự > 64 token", str(len(x["body"].split())))
        finally:
            con.close()

K.chot("snippet() không trên đường trả · body đầy đủ qua rowid")
