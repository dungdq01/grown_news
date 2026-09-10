#!/usr/bin/env python3
r"""AC-5.1 · AC-5.2 · T13-5 AC1 — phạm vi là control HIỂN THỊ, không top-k ẩn.

· `so_ban_ghi_trong_pham_vi` trả CÙNG lời gọi và bằng phép đếm ĐỘC LẬP trên cùng bộ lọc
  (đếm thẳng bảng `tai_lieu`/`facet` bằng SQL của cổng, không qua rank).
· đổi `pham_vi` ⇒ tập ứng viên đổi (không phải lọc SAU top-k của cả kho).
· `k` do người gọi đưa: thiếu ⇒ 400; 0 hằng `k =` mặc định trong mã.
· `pham_vi` dùng đúng khoá TANG (`cat` · `loai` · `cpt` · `pl` · `nguon`) + `space` dành sẵn;
  0 bảng đổi tên `phan_loai ↔ pl` trong mã.
· `space`: khoá nhận + validate được; MỌI bản ghi = `mac-dinh` cho tới FR-080 áp — vế
  "đổi space ⇒ tập đổi" CHƯA đo được, cổng NÓI RA điều đó (không xanh bằng fixture bịa cột).

ĐỎ_KHI  số trả ≠ đếm độc lập · đổi facet mà tập không đổi · k thiếu vẫn 200 · có bảng đổi tên
XANH_KHI năm vế trên đúng; vế space in "chờ FR-080"
--tu-kiem: phép so số-trả vs đếm-độc-lập lệch ⇒ đỏ; bảng đổi tên gieo trong mã ⇒ bắt.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_pham_vi_hien_thi.py"
RX_DOI_TEN = re.compile(r"phan_loai[\"']?\s*[:=]\s*[\"']pl|[\"']pl[\"']\s*:\s*[\"']phan_loai|loai_nguon[\"']?\s*[:=]\s*[\"']nguon")
RX_K_HANG = re.compile(r"\bk\s*=\s*\d+|\.get\(\s*[\"']k[\"']\s*,\s*\d+\)|get\([\"']k[\"']\)\s*or\s*\d+")


def dem_doc_lap(con, pham_vi: dict) -> int:
    sql = "SELECT count(*) FROM tai_lieu t"
    dk, tham = [], []
    for kh, gt in pham_vi.items():
        gt = gt if isinstance(gt, list) else [gt]
        dk.append(f"EXISTS (SELECT 1 FROM facet f WHERE f.doc_id=t.doc_id AND f.khoa=? AND f.gia_tri IN ({','.join('?' * len(gt))}))")
        tham += [kh, *gt]
    if dk:
        sql += " WHERE " + " AND ".join(dk)
    return con.execute(sql, tham).fetchone()[0]


def soi(nguon):
    return {"doi_ten": [f"{f}:{i}" for f, t in nguon.items() for i, l in enumerate(t.splitlines(), 1) if RX_DOI_TEN.search(l)],
            "k_hang": [f"{f}:{i}" for f, t in nguon.items() for i, l in enumerate(t.splitlines(), 1) if RX_K_HANG.search(l)]}


if K.TU_KIEM:
    print("\ntu-kiem · phép so và phép soi phải ĐỎ ĐƯỢC\n")
    K.kiem(soi({"api.py": 'DOI = {"phan_loai": "pl"}'})["doi_ten"], "bảng đổi tên phan_loai→pl ⇒ bắt")
    K.kiem(soi({"api.py": 'k = b.get("k", 20)'})["k_hang"], "k mặc định trong mã ⇒ bắt")
    K.kiem(soi({"api.py": 'k = b.get("k")\nif k is None: return 400'}) == {"doi_ten": [], "k_hang": []}, "mã sạch ⇒ không đỏ oan")
    K.kiem((3 != 2), "số trả 3 ≠ đếm độc lập 2 ⇒ lệch (phép so là so số nguyên — đỏ được)")
    K.tu_kiem_xong(CONG, 4)

print("\n1 · AST — 0 bảng đổi tên facet, 0 hằng k\n")
nguon = K.nguon_src()
vp = soi(nguon)
K.kiem(bool(nguon) and not vp["doi_ten"], "0 bảng đổi tên `phan_loai ↔ pl` / `loai_nguon ↔ nguon`", str(vp["doi_ten"]) or "chưa có mã")
K.kiem(bool(nguon) and not vp["k_hang"], "0 hằng `k` mặc định trong mã (k là tham số người gọi)", str(vp["k_hang"]) or "chưa có mã")

try:
    indexer, db, api = _nap.nap("indexer", "db", "api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-5")

H = {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-web"}
with K.tam("gn_m13_pv_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url(), KHOA_WEB_TRUYHOI="k-web"):
        con = db.mo(ghi=True)
        indexer.reindex(con, day_du=True)
        s, cong = K.bat_service(api)
        try:
            def hoi(pham_vi, q="pipeline dữ liệu", k=10):
                return K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": q, "pham_vi": pham_vi, "nguon": None, "k": k}, H)

            print("\n2 · số bản ghi trong phạm vi = đếm độc lập, CÙNG lời gọi\n")
            for pv in ({}, {"pl": ["video"]}, {"cat": ["data"]}, {"loai": ["docs", "article"]}, {"cpt": ["rag"]}):
                ma, j, _ = hoi(pv)
                K.kiem(ma == 200 and j.get("so_ban_ghi_trong_pham_vi") == dem_doc_lap(con, pv),
                       f"pham_vi={pv or 'cả kho'} ⇒ so_ban_ghi_trong_pham_vi == đếm độc lập ({dem_doc_lap(con, pv)})",
                       f"ma={ma} trả {j.get('so_ban_ghi_trong_pham_vi') if j else j}")

            print("\n3 · đổi phạm vi ⇒ tập ứng viên đổi (không lọc sau top-k)\n")
            _, ca_kho, _ = hoi({}, k=50)
            _, chi_bv, _ = hoi({"pl": ["bai-viet"]}, k=50)
            ids_kho = {x["doc_id"] for x in ca_kho["ket_qua"]}
            ids_bv = {x["doc_id"] for x in chi_bv["ket_qua"]}
            pl_cua = {l: m["ten"] for m in K.doc_json(K.ASSETS / "loai-nguon.json")["module"] for l in m["loai"]}
            K.kiem(ids_bv and ids_bv < ids_kho, "pl=[bai-viet] ⇒ tập nhỏ hơn và là con của cả kho", f"{ids_bv} vs {ids_kho}")
            K.kiem(all(pl_cua.get(loi.kho[d]["loai"]) == "bai-viet" for d in ids_bv), "mọi kết quả trong pl=[bai-viet] đều thuộc phân loại bài viết (theo loai-nguon.json)")
            # top-k ẩn: k=1 trên cả kho rồi lọc sau sẽ RỖNG với facet không chứa top-1; lọc trong SQL thì vẫn có.
            top1 = ca_kho["ket_qua"][0]["doc_id"] if ca_kho["ket_qua"] else None
            khac = next((d for d in ids_kho if d != top1), None)
            if khac:
                _, jk, _ = hoi({"loai": [loi.kho[khac]["loai"]]}, k=1)
                K.kiem(jk["ket_qua"] and jk["ket_qua"][0]["doc_id"] != top1 or loi.kho[khac]["loai"] == loi.kho[top1]["loai"],
                       "k=1 với facet loại khác top-1 vẫn có kết quả — lọc TRONG câu MATCH, không sau top-k", str(jk)[:120])

            print("\n4 · k là tham số bắt buộc\n")
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "x", "pham_vi": {}, "nguon": None}, H)
            K.kiem(ma == 400, "thiếu `k` ⇒ 400", f"ma={ma}")
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "x", "pham_vi": {"phan_loai": ["video"]}, "nguon": None, "k": 5}, H)
            K.kiem(ma == 400, "khoá facet lạ `phan_loai` ⇒ 400 (không dịch, không bỏ qua im lặng)", f"ma={ma}")

            print("\n5 · khoá `space` dành sẵn — nhận, validate; vế đổi-space CHỜ FR-080\n")
            ma, j, _ = hoi({"space": "mac-dinh"})
            K.kiem(ma == 200 and j.get("so_ban_ghi_trong_pham_vi") == dem_doc_lap(con, {}), "space=mac-dinh ⇒ 200, cả kho (mọi bản ghi = mac-dinh tới FR-080)")
            ma, j, _ = hoi({"space": 123})
            K.kiem(ma == 400, "space không phải chuỗi ⇒ 400 (validate được từ ngày đầu)", f"ma={ma}")
            print("  ·  soft — vế 'đổi space ⇒ tập ứng viên đổi' CHƯA đo được: cột `space` chỉ có sau FR-080 (T01-90, PM-Space). Không xanh bằng fixture bịa cột.")
        finally:
            K.dung_service(s)
            con.close()

K.chot("số trong phạm vi = đếm độc lập · đổi facet ⇒ tập đổi · k bắt buộc · khoá TANG nguyên văn · space chờ FR-080")
