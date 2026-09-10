#!/usr/bin/env python3
r"""AC-1.2 · Chỉ mục lệch kho BÁO ĐƯỢC, nêu ĐÚNG slug — không im lặng trả kết quả cũ.

Ba vế của testcases §1: kho không đổi ⇒ 0 slug lệch · sửa một bài chưa re-index ⇒
nêu đúng slug đó · xoá một bài khỏi kho ⇒ chunk mồ côi bị nêu (index có, kho không).

ĐỔI KHO = ĐỔI DICT của LÕI giả (`_loi_gia`) — không sửa file thật nào.

ĐỔ_KHI  sửa bài mà `kiem_lech` không nêu slug · xoá bài mà không nêu mồ côi ·
        kho không đổi mà vẫn báo lệch (đỏ oan)
XANH_KHI ba vế đúng, và mỗi slug lệch được in ra một dòng
--tu-kiem: phép so delta↔index trên hai danh sách cố tình lệch phải nêu đúng slug.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_lech_kho_bao_duoc.py"


def phan_lech(delta, index):
    """delta: {slug: sha_than} từ LÕI · index: {slug: checksum/sha đã lưu} ⇒ ba danh sách."""
    lech = sorted(s for s in delta if s in index and delta[s] != index[s])
    mo_coi = sorted(s for s in index if s not in delta)
    chua = sorted(s for s in delta if s not in index)
    return {"lech": lech, "mo_coi": mo_coi, "chua_index": chua}


if K.TU_KIEM:
    print("\ntu-kiem · phép so delta↔index phải ĐỎ ĐƯỢC, nêu đúng slug\n")
    d = {"a": "1", "b": "2", "c": "3"}
    K.kiem(phan_lech(d, {"a": "1", "b": "X", "c": "3"})["lech"] == ["b"], "sha khác ở `b` ⇒ lech == [b]")
    K.kiem(phan_lech({"a": "1"}, {"a": "1", "z": "9"})["mo_coi"] == ["z"], "index có `z`, kho không ⇒ mo_coi == [z]")
    K.kiem(phan_lech(d, {"a": "1"})["chua_index"] == ["b", "c"], "kho có b,c chưa index ⇒ chua_index")
    K.kiem(phan_lech(d, dict(d)) == {"lech": [], "mo_coi": [], "chua_index": []}, "kho không đổi ⇒ ba danh sách rỗng")
    K.tu_kiem_xong(CONG, 4)

try:
    indexer, db = _nap.nap("indexer", "db")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-2")

with K.tam("gn_m13_lech_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            print("\n1 · kho không đổi ⇒ im lặng\n")
            kq = indexer.kiem_lech(con)
            K.kiem(kq.get("lech") == [] and kq.get("mo_coi") == [] and kq.get("chua_index") == [],
                   "0 slug lệch · 0 mồ côi · 0 chưa index", str(kq))

            print("\n2 · sửa MỘT bài, chưa re-index ⇒ nêu ĐÚNG slug\n")
            loi.kho["pipeline-basics"]["body"] += "\n\n## Thêm\n\nMột đoạn mới.\n"
            kq = indexer.kiem_lech(con)
            K.kiem(kq.get("lech") == ["pipeline-basics"], "lech == [pipeline-basics] — đúng slug, không chỉ 'có lệch'", str(kq.get("lech")))
            K.kiem("huong-dan-cai-dat" not in (kq.get("lech") or []), "bài không sửa KHÔNG bị nêu (đỏ oan)")

            print("\n3 · xoá một bài khỏi kho ⇒ mồ côi bị nêu\n")
            del loi.kho["thien-duong-chuot"]
            kq = indexer.kiem_lech(con)
            K.kiem("thien-duong-chuot" in (kq.get("mo_coi") or []), "mo_coi nêu `thien-duong-chuot`", str(kq.get("mo_coi")))

            print("\n4 · re-index xong ⇒ hết lệch\n")
            indexer.reindex(con)
            kq = indexer.kiem_lech(con)
            K.kiem(kq.get("lech") == [] and kq.get("mo_coi") == [], "sau re-index: 0 lệch, 0 mồ côi", str(kq))
        finally:
            con.close()

K.chot("lệch kho nêu đúng slug · mồ côi nêu được · re-index xong hết lệch")
