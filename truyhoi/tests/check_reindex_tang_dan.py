#!/usr/bin/env python3
r"""AC-2.4 · Re-index TĂNG DẦN: chỉ bản ghi đổi mới bị `DELETE`+`INSERT`; bản không đổi ⇒ 0 ghi.

Ba vế của testcases §2: sửa 1 trong N bài ⇒ chỉ chunk của bài đó tính lại · `updated_at`
đổi nhưng thân Y HỆT (sha_than bằng) ⇒ 0 ghi (không tin mốc thời gian một mình) · bảng
thường và FTS phải CÙNG số hàng — đo bằng đếm hai bên (và `integrity-check` của FTS5),
không bằng đọc mã (xoá FTS sai cách là hỏng IM LẶNG).

Đo "ghi" bằng `sqlite3.Connection.total_changes` — số máy, không phải lời khai.

ĐỎ_KHI  sửa 1 bài mà chunk bài khác cũng bị ghi lại · thân y hệt mà vẫn ghi · count(chunks) ≠ count(chunks_fts)
XANH_KHI ba vế đúng
--tu-kiem: phép đếm chunk-bị-tính-lại trên hai snapshot cố tình lệch phải nêu đúng slug.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_reindex_tang_dan.py"
SNAP = "SELECT doc_id, id FROM chunks ORDER BY doc_id, id"


def doi_theo_doc(truoc, sau):
    """{doc_id: 'moi'|'mat'|'giu'} từ hai snapshot (doc_id, rowid). rowid đổi = đã DELETE+INSERT."""
    t = {}
    for d, i in truoc:
        t.setdefault(d, set()).add(i)
    s = {}
    for d, i in sau:
        s.setdefault(d, set()).add(i)
    ra = {}
    for d in set(t) | set(s):
        if d not in s:
            ra[d] = "mat"
        elif d not in t or t[d] != s[d]:
            ra[d] = "moi"
        else:
            ra[d] = "giu"
    return ra


if K.TU_KIEM:
    print("\ntu-kiem · phép so snapshot phải ĐỎ ĐƯỢC\n")
    truoc = [("a", 1), ("a", 2), ("b", 3)]
    K.kiem(doi_theo_doc(truoc, [("a", 1), ("a", 2), ("b", 9)]) == {"a": "giu", "b": "moi"}, "rowid của b đổi ⇒ b 'moi', a 'giu'")
    K.kiem(doi_theo_doc(truoc, [("a", 1), ("a", 2)])["b"] == "mat", "b biến mất ⇒ 'mat'")
    K.kiem(all(v == "giu" for v in doi_theo_doc(truoc, list(truoc)).values()), "y hệt ⇒ toàn 'giu' (không đỏ oan)")
    K.tu_kiem_xong(CONG, 3)

try:
    indexer, db = _nap.nap("indexer", "db")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-2")

with K.tam("gn_m13_tangdan_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            snap0 = con.execute(SNAP).fetchall()

            print("\n1 · sửa MỘT bài ⇒ chỉ chunk bài đó DELETE+INSERT, bài khác 0 ghi\n")
            loi.kho["pipeline-basics"]["body"] += "\n## Thêm\n\nĐoạn mới để đổi sha.\n"
            loi.kho["pipeline-basics"]["updated_at"] = "2026-09-10T00:00:00Z"
            indexer.reindex(con)
            snap1 = con.execute(SNAP).fetchall()
            doi = doi_theo_doc(snap0, snap1)
            K.kiem(doi.get("pipeline-basics") == "moi", "`pipeline-basics` được tính lại", str(doi))
            khac = [d for d, v in doi.items() if d != "pipeline-basics" and v != "giu"]
            K.kiem(not khac, "mọi bài KHÁC giữ nguyên rowid (0 ghi)", str(khac))

            print("\n2 · updated_at đổi nhưng thân Y HỆT ⇒ 0 ghi (sha_than bằng — không tin mốc một mình)\n")
            loi.kho["huong-dan-cai-dat"]["updated_at"] = "2026-09-10T01:00:00Z"
            tc = con.total_changes
            indexer.reindex(con)
            snap2 = con.execute(SNAP).fetchall()
            K.kiem(doi_theo_doc(snap1, snap2).get("huong-dan-cai-dat") == "giu", "chunk của bài đó KHÔNG bị ghi lại", str(doi_theo_doc(snap1, snap2)))
            ghi_chunks = con.execute("SELECT count(*) FROM chunks").fetchone()[0]
            K.kiem(con.total_changes - tc <= 1, "≤1 thay đổi (chỉ metadata tai_lieu.updated_at), 0 dòng chunk", f"total_changes +{con.total_changes - tc}")

            print("\n3 · kho không đổi ⇒ 0 ghi tuyệt đối\n")
            tc = con.total_changes
            indexer.reindex(con)
            K.kiem(con.total_changes == tc, "re-index trên kho không đổi ⇒ total_changes không tăng", f"+{con.total_changes - tc}")

            print("\n4 · bảng thường và FTS cùng số hàng — đo, không đọc mã\n")
            n1 = con.execute("SELECT count(*) FROM chunks").fetchone()[0]
            n2 = con.execute("SELECT count(*) FROM chunks_fts").fetchone()[0]
            K.kiem(n1 == n2 and n1 == ghi_chunks, "count(chunks) == count(chunks_fts)", f"{n1} vs {n2}")
            try:
                con.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('integrity-check')")
                K.kiem(True, "FTS5 integrity-check qua")
            except Exception as e:  # noqa: BLE001
                K.kiem(False, "FTS5 integrity-check qua", f"{type(e).__name__}: {e}")
        finally:
            con.close()

K.chot("chỉ bài đổi mới tính lại · thân y hệt ⇒ 0 ghi · FTS khớp bảng thường")
