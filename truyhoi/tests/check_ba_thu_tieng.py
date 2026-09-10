#!/usr/bin/env python3
r"""AC-3.2 · AC-3.3 — bộ 10 truy vấn BA THỨ TIẾNG đúng 10/10 trên kho tạm; mỗi ca có RĂNG
(bỏ chuan_hoa_tim ở phía query ⇒ ca đó trượt); `remove_diacritics` là 2, không phải 1.

Kho tạm = `kho_mau_zh()` — có hai bản ghi chữ Hán ĐỂ ĐO TOKENIZER (AC-3.2 cho phép).
KHÔNG dùng để xanh AC-6.3: vế đó phải đếm trên kho THẬT (check_golden_du_ca).

Mười ca: vi có dấu · vi không dấu · đ→d hai chiều (gõ `d` tìm `đ`, gõ `đ` tìm `đ`) · en ·
zh 1 chữ · zh 2 chữ · zh 4 chữ · câu TRỘN Việt+Trung.

ĐỎ_KHI  <10/10 · một ca vẫn ra khi bỏ chuẩn hoá phía query (ca thừa, không răng) ·
        tokenizer khai `remove_diacritics 1` (trượt cả `hướng` lẫn `phần`)
XANH_KHI 10/10 · mỗi ca đều phụ thuộc chuan_hoa_tim phía query ít nhất ở ca đ/zh · DDL khai 2
--tu-kiem: bảng đếm 10 ca với một ca trượt phải đỏ; DDL `remove_diacritics 1` phải bị bắt
           và thông báo nêu cả `hướng` lẫn `phần`.
"""
import re
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_ba_thu_tieng.py"
MUOI = [
    ("vi có dấu", "đường ống dữ liệu", "huong-dan-cai-dat"),
    ("vi không dấu", "huong dan cai dat", "huong-dan-cai-dat"),
    ("đ→d chiều gõ d", "duong ong", "huong-dan-cai-dat"),
    ("đ→d chiều gõ đ", "đường ống", "huong-dan-cai-dat"),
    ("en", "reproducible pipeline", "pipeline-basics"),
    ("zh 1 chữ", "線", "zi-liao-guan-xian"),
    ("zh 2 chữ", "資料", "zi-liao-guan-xian"),
    ("zh 4 chữ", "記憶體最佳化", "zi-liao-guan-xian"),
    ("zh giản thể 2 chữ", "数据", "shu-ju-jian-ti"),
    ("trộn Việt+Trung", "Kết hợp 資料管線 với pipeline", "zi-liao-guan-xian"),
]


def dem_dat(ket_qua: dict[str, list[str]], bo=MUOI):
    """{tên ca: [doc_id trong top-k]} ⇒ (số đạt, danh sách ca trượt)."""
    truot = [ten for ten, _q, mong in bo if mong not in ket_qua.get(ten, [])]
    return len(bo) - len(truot), truot


def soi_ddl(ddl: str):
    m = re.search(r"remove_diacritics\s+(\d)", ddl)
    if not m:
        return "DDL không khai remove_diacritics"
    if m.group(1) != "2":
        return (f"remove_diacritics {m.group(1)} — phải là 2: mức 1 trượt cả `hướng` (ư+ớ) lẫn `phần` (â+`), "
                "không chỉ ký tự hai dấu")
    return None


if K.TU_KIEM:
    print("\ntu-kiem · phép đếm và phép soi DDL phải ĐỎ ĐƯỢC\n")
    du = {ten: [mong] for ten, _q, mong in MUOI}
    K.kiem(dem_dat(du) == (10, []), "10 ca đủ ⇒ 10/10")
    thieu = dict(du)
    thieu["zh 2 chữ"] = ["khac"]
    n, truot = dem_dat(thieu)
    K.kiem(n == 9 and truot == ["zh 2 chữ"], "một ca trượt ⇒ 9/10, NÊU TÊN ca", str(truot))
    loi1 = soi_ddl("tokenize='unicode61 remove_diacritics 1'")
    K.kiem(loi1 and "hướng" in loi1 and "phần" in loi1, "DDL khai 1 ⇒ đỏ, nêu cả `hướng` lẫn `phần`", str(loi1))
    K.kiem(soi_ddl("tokenize='unicode61 remove_diacritics 2'") is None, "DDL khai 2 ⇒ không đỏ oan")
    K.tu_kiem_xong(CONG, 4)

try:
    indexer, db, rank, chuan_hoa = _nap.nap("indexer", "db", "rank", "chuan_hoa")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-3")

print("\n1 · DDL: remove_diacritics là 2\n")
K.kiem(soi_ddl(db.DDL) is None, "DDL khai `unicode61 remove_diacritics 2`", str(soi_ddl(db.DDL)))
c = sqlite3.connect(":memory:")
c.execute("CREATE VIRTUAL TABLE t USING fts5(x, tokenize='unicode61 remove_diacritics 2')")
c.execute("INSERT INTO t VALUES('hướng dẫn phần đầu')")
K.kiem(c.execute("SELECT count(*) FROM t WHERE t MATCH 'huong'").fetchone()[0] == 1
       and c.execute("SELECT count(*) FROM t WHERE t MATCH 'phan'").fetchone()[0] == 1,
       "đo thật: mức 2 fold được `hướng` và `phần`")

with K.tam("gn_m13_3tt_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau_zh()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url()):
        con = db.mo(ghi=True)
        try:
            indexer.reindex(con, day_du=True)
            print("\n2 · bộ 10 truy vấn ⇒ 10/10\n")
            kq = {}
            for ten, q, _m in MUOI:
                r = rank.truy_hoi(con, cau_hoi=q, pham_vi={}, nguon=None, k=10)
                kq[ten] = [x["doc_id"] for x in r["ket_qua"]]
            n, truot = dem_dat(kq)
            K.kiem(n == 10, f"{n}/10 — ca trượt: {truot or 'không'}", str({t: kq[t] for t in truot}))

            print("\n3 · mỗi ca có RĂNG: bỏ chuan_hoa_tim phía query ⇒ ca đ/zh phải trượt\n")
            # Bỏ chuẩn hoá phía query = MATCH thẳng chuỗi thô (mô phỏng bản lỗi), so với bộ chuẩn.
            def tho(q):
                tok = [t for t in re.split(r"\s+", q.strip()) if t]
                match = " OR ".join('"' + t.replace('"', '""') + '"' for t in tok)
                rows = con.execute("SELECT c.doc_id FROM chunks_fts JOIN chunks c ON c.id = chunks_fts.rowid WHERE chunks_fts MATCH ? LIMIT 10", (match,)).fetchall()
                return [r[0] for r in rows]
            kq_tho = {ten: tho(q) for ten, q, _m in MUOI}
            n_tho, truot_tho = dem_dat(kq_tho)
            K.kiem(n_tho < 10, f"không chuẩn hoá query ⇒ {n_tho}/10 (<10) — bộ ca có răng", str(truot_tho))
            K.kiem(any("zh" in t for t in truot_tho), "ca zh nằm trong tập trượt khi bỏ chuẩn hoá (chữ Hán không được chèn cách)", str(truot_tho))
            # Ca `đ` đo bằng MỘT token: với OR, `đường ống` vẫn ra nhờ `ống`→`ong`; nên so đúng token có đ.
            K.kiem("huong-dan-cai-dat" not in tho("đường") and "huong-dan-cai-dat" in
                   [x["doc_id"] for x in rank.truy_hoi(con, cau_hoi="đường", pham_vi={}, nguon=None, k=10)["ket_qua"]],
                   "token `đường` thô KHÔNG tìm được (tokenizer không fold đ) — qua chuan_hoa_tim thì tìm được")
        finally:
            con.close()

K.chot("10/10 ba thứ tiếng · bộ ca có răng · remove_diacritics 2")
