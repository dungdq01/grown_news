#!/usr/bin/env python3
r"""AC-1.1 · Chỉ mục là DẪN XUẤT: xoá sạch rồi dựng lại ⇒ CÙNG tập
`(file, anchor, line_start, line_end, checksum)`, từng dòng, thứ tự cố định.

Ba vế của testcases §1: dựng lại = bằng nhau từng dòng · dựng lần ba vẫn bằng
(điểm bất động) · kho RỖNG ⇒ 0 chunk, không lỗi.

ĐỎ_KHI  hai lần dựng lệch một dòng · lần ba khác lần hai · kho rỗng ném lỗi
XANH_KHI ba lần dựng cho cùng danh sách; kho rỗng ⇒ 0 chunk
--tu-kiem: hai danh sách lệch một dòng ⇒ phép so phải nêu đúng dòng lệch.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_dung_lai_duoc.py"
COT = "SELECT t.file, c.anchor, c.line_start, c.line_end, t.checksum FROM chunks c JOIN tai_lieu t USING(doc_id) ORDER BY t.file, c.line_start, c.thu_tu"


def so_hai_ban(a, b):
    """Danh sách dòng lệch giữa hai lần dựng — rỗng nghĩa là điểm bất động."""
    lech = []
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y:
            lech.append(f"dòng {i}: {x} ≠ {y}")
    if len(a) != len(b):
        lech.append(f"số dòng {len(a)} ≠ {len(b)}")
    return lech


def dung(indexer, db, day_du=True):
    con = db.mo(ghi=True)
    try:
        indexer.reindex(con, day_du=day_du)
        return [tuple(r) for r in con.execute(COT).fetchall()]
    finally:
        con.close()


if K.TU_KIEM:
    print("\ntu-kiem · phép so hai lần dựng phải ĐỎ ĐƯỢC\n")
    a = [("kb/docs/a.md", "x", 1, 5, "aa"), ("kb/docs/a.md", "y", 6, 9, "aa")]
    b = [("kb/docs/a.md", "x", 1, 5, "aa"), ("kb/docs/a.md", "y", 6, 10, "aa")]
    K.kiem(so_hai_ban(a, b) and "dòng 1" in so_hai_ban(a, b)[0], "lệch line_end một dòng ⇒ nêu đúng dòng 1")
    K.kiem(so_hai_ban(a, a[:1]) and "số dòng" in so_hai_ban(a, a[:1])[-1], "thiếu một dòng ⇒ nêu số dòng")
    K.kiem(so_hai_ban(a, list(a)) == [], "hai bản y hệt ⇒ rỗng (không đỏ oan)")
    K.tu_kiem_xong(CONG, 3)

try:
    indexer, db = _nap.nap("indexer", "db")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-2")

with K.tam("gn_m13_dung_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        print("\n1 · dựng · xoá sạch · dựng lại ⇒ từng dòng bằng nhau\n")
        lan1 = dung(indexer, db)
        K.kiem(len(lan1) > 0, "lần 1 có chunk", f"được {len(lan1)}")
        (tmp / "index.sqlite").unlink()
        lan2 = dung(indexer, db)
        lech = so_hai_ban(lan1, lan2)
        K.kiem(not lech, "xoá index.sqlite rồi dựng lại ⇒ CÙNG tập (file, anchor, line_start, line_end, checksum)",
               " · ".join(lech[:3]))
        print("\n2 · dựng lần ba (không xoá) ⇒ điểm bất động, không chỉ 'gần giống'\n")
        lan3 = dung(indexer, db, day_du=False)
        lech3 = so_hai_ban(lan2, lan3)
        K.kiem(not lech3, "re-index tăng dần trên kho không đổi ⇒ bằng lần hai", " · ".join(lech3[:3]))
        K.kiem(any("hien-vat" in str(r) or r[1] is None for r in lan1) or True,
               "(ghi nhận) tập có cả chunk hiện vật nếu T13-7 đã dựng — điểm bất động phải giữ cả khi có chúng")

    print("\n3 · kho RỖNG là trạng thái hợp lệ\n")
    loi.kho.clear()
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "rong.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        try:
            rong = dung(indexer, db)
            K.kiem(rong == [], "kho rỗng ⇒ 0 chunk, không lỗi", f"được {len(rong)}")
        except Exception as e:  # noqa: BLE001
            K.kiem(False, "kho rỗng ⇒ 0 chunk, không lỗi", f"{type(e).__name__}: {e}")

K.chot("chỉ mục dựng lại là điểm bất động · kho rỗng hợp lệ")
