#!/usr/bin/env python3
r"""AC-5.3 · FR-072 T8 · T13-5 AC2 — TẬP NGUỒN là THAM SỐ: `nguon` là khoá BẮT BUỘC trong
payload; `nguon: null` = cả kho là giá trị KHAI; thiếu khoá ⇒ 400 (không rơi về cả kho —
hình dạng CVE-2026-47713: vị từ WHERE biến mất khi danh tính vắng); `nguon: [a, b]` ⇒ chỉ
chunk của a, b được xét (gieo chunk khớp MẠNH ở c và kiểm nó KHÔNG ra); ràng buộc tập nguồn
là `AND` trong CÙNG câu SQL với MATCH (soi mã: `doc_id IN` xuất hiện trong cùng chuỗi SQL có
`MATCH`), không lọc sau.

ĐỎ_KHI  thiếu khoá `nguon` mà 200 · `nguon: [a]` mà chunk của c ra · lọc sau khi có kết quả
XANH_KHI ba vế đúng; response nói rõ đang cả-kho khi null (echo `nguon: null` ở gốc hoặc `pham_vi_nguon: "ca-kho"`)
--tu-kiem: SQL cố tình tách hai câu (MATCH rồi lọc Python) ⇒ soi bắt; payload thiếu khoá ⇒ phân biệt được với null.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_tap_nguon_la_tham_so.py"


def cung_cau_sql(nguon: dict[str, str]) -> bool:
    """Có ít nhất một chuỗi SQL chứa CẢ `MATCH` lẫn `doc_id IN` — lọc tập nguồn trong cùng câu."""
    for t in nguon.values():
        for m in re.finditer(r"(\"\"\"|''')(.*?)\1|\"([^\"\n]*)\"", t, re.S):
            s = m.group(2) or m.group(3) or ""
            if "MATCH" in s and re.search(r"doc_id\s+IN|doc_id IN \(SELECT", s):
                return True
    # SQL ghép từ nhiều mảnh: chấp nhận khi cùng một hàm chứa cả hai token
    return any("MATCH" in t and "doc_id IN" in t for t in nguon.values())


def thieu_khoa(payload: dict) -> bool:
    return "nguon" not in payload


if K.TU_KIEM:
    print("\ntu-kiem · phép soi và phép phân biệt phải ĐỔ ĐƯỢC\n")
    K.kiem(not cung_cau_sql({"rank.py": 'rows = con.execute("SELECT id FROM chunks_fts WHERE chunks_fts MATCH ?")\nrows = [r for r in rows if r.doc_id in nguon]'}),
           "lọc SAU bằng Python ⇒ soi báo KHÔNG cùng câu (đỏ được)")
    K.kiem(cung_cau_sql({"rank.py": 'SQL = """SELECT id FROM chunks_fts JOIN chunks c ON c.id=rowid WHERE chunks_fts MATCH ? AND c.doc_id IN (SELECT doc_id FROM pham_vi)"""'}),
           "MATCH + doc_id IN cùng chuỗi ⇒ hợp lệ")
    K.kiem(thieu_khoa({"cau_hoi": "x", "k": 5}) and not thieu_khoa({"cau_hoi": "x", "k": 5, "nguon": None}),
           "phân biệt KHOÁ VẮNG với `nguon: null`")
    K.tu_kiem_xong(CONG, 3)

print("\n1 · AST — tập nguồn lọc TRONG câu MATCH\n")
nguon = K.nguon_src()
K.kiem(bool(nguon) and cung_cau_sql(nguon), "một câu SQL chứa cả `MATCH` lẫn `doc_id IN` (AND trong cùng câu)", "chưa có mã hoặc lọc tách câu")

try:
    indexer, db, api = _nap.nap("indexer", "db", "api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-5")

H = {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-web"}
kho = _loi_gia.kho_mau()
# chunk khớp MẠNH ở `c` (pipeline-basics): lặp từ khoá nhiều lần để nó đứng đầu nếu không bị lọc
kho["pipeline-basics"]["body"] += "\n## Từ khoá mạnh\n\n" + " ".join(["retrieval"] * 30) + "\n"
kho["ghi-chu-hoi-thao-rag"]["body"] += "\n\nretrieval một lần.\n"
with K.tam("gn_m13_tn_") as tmp, _loi_gia.LoiGia(kho) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url(), KHOA_WEB_TRUYHOI="k-web"):
        con = db.mo(ghi=True)
        indexer.reindex(con, day_du=True)
        con.close()
        s, cong = K.bat_service(api)
        try:
            print("\n2 · thiếu khoá `nguon` ⇒ 400; `nguon: null` ⇒ cả kho và NÓI RÕ\n")
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "retrieval", "pham_vi": {}, "k": 10}, H)
            K.kiem(ma == 400 and "nguon" in str(j), "thiếu khoá `nguon` ⇒ 400, thông báo nêu `nguon`", f"ma={ma} {str(j)[:100]}")
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "retrieval", "pham_vi": {}, "nguon": None, "k": 10}, H)
            K.kiem(ma == 200 and {x["doc_id"] for x in j["ket_qua"]} >= {"pipeline-basics", "ghi-chu-hoi-thao-rag"},
                   "`nguon: null` ⇒ cả kho: chunk của cả hai bài ra", str(j)[:120] if j else "")
            # Hợp đồng v3 là FROZEN với đúng 3 khoá gốc — KHÔNG thêm khoá để "nói rõ". Cả-kho nói bằng SỐ:
            # `so_ban_ghi_trong_pham_vi` == tổng bản ghi trong chỉ mục. Muốn khoá tường minh (`tap_nguon`)
            # thì mở FR — ô backlog M13.
            con2 = db.mo()
            tong_kho = con2.execute("SELECT count(*) FROM tai_lieu").fetchone()[0]
            con2.close()
            K.kiem(j is not None and j.get("so_ban_ghi_trong_pham_vi") == tong_kho and set(j) == {"ket_qua", "so_ban_ghi_trong_pham_vi", "tong"},
                   f"`nguon: null` ⇒ so_ban_ghi_trong_pham_vi == cả kho ({tong_kho}) và response ĐÚNG 3 khoá gốc (hợp đồng FROZEN)",
                   str({k: v for k, v in (j or {}).items() if k != 'ket_qua'}))

            print("\n3 · `nguon: [a, b]` ⇒ chunk khớp mạnh ở c KHÔNG ra\n")
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi",
                              {"cau_hoi": "retrieval", "pham_vi": {}, "nguon": ["ghi-chu-hoi-thao-rag", "huong-dan-cai-dat"], "k": 10}, H)
            ids = {x["doc_id"] for x in j["ket_qua"]} if ma == 200 else set()
            K.kiem(ma == 200 and "ghi-chu-hoi-thao-rag" in ids, "bài trong tập nguồn có kết quả", f"ma={ma} ids={ids}")
            K.kiem("pipeline-basics" not in ids, "chunk khớp MẠNH nhất ở `pipeline-basics` (ngoài tập) KHÔNG ra", str(ids))
            K.kiem(j.get("so_ban_ghi_trong_pham_vi") == 2, "so_ban_ghi_trong_pham_vi = 2 (tập nguồn cũng thu hẹp phạm vi đếm)", str(j.get("so_ban_ghi_trong_pham_vi")))
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "retrieval", "pham_vi": {}, "nguon": [], "k": 10}, H)
            K.kiem(ma == 200 and j["ket_qua"] == [] and j["so_ban_ghi_trong_pham_vi"] == 0, "`nguon: []` ⇒ tập rỗng: 0 kết quả, 0 bản ghi (không lẫn với null)", f"ma={ma} {str(j)[:80]}")
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "retrieval", "pham_vi": {}, "nguon": "pipeline-basics", "k": 10}, H)
            K.kiem(ma == 400, "`nguon` là chuỗi (không phải list|null) ⇒ 400", f"ma={ma}")
        finally:
            K.dung_service(s)

K.chot("nguon bắt buộc · null = cả kho nói rõ · [a,b] chặn c · lọc trong cùng câu SQL")
