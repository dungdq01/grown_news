#!/usr/bin/env python3
r"""AC-7.1 · T13-6 AC2 — hai tín hiệu VẬN HÀNH được ĐẾM và GHI: truy vấn 0 kết quả ·
người gõ lại ≥2 lần trong một phiên. Điểm rẽ sang vector là SỐ MÁY ĐẾM, không phải cảm giác.
Hai số phải SỐNG QUA khởi động lại tiến trình (không ở RAM).

ĐỔ_KHI  0-kết-quả không +1 · gõ lại không +1 · khởi động lại mất số · không có dòng ghi
XANH_KHI cả ba vế đúng, và có file ghi cạnh index (trong KB_DIR tạm, không ở kb/)
--tu-kiem: phép đọc-so bộ đếm trên file cố tình ghi thiếu khoá ⇒ đỏ.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_tin_hieu_van_hanh.py"
HAI = ("truy_van_0_ket_qua", "go_lai")


def soi_bo_dem(d: dict) -> list[str]:
    return [f"thiếu bộ đếm `{k}`" for k in HAI if not isinstance(d.get(k), int)]


if K.TU_KIEM:
    print("\ntu-kiem · phép soi bộ đếm phải ĐỎ ĐƯỢC\n")
    K.kiem(soi_bo_dem({"truy_van_0_ket_qua": 1}) == ["thiếu bộ đếm `go_lai`"], "thiếu go_lai ⇒ nêu tên")
    K.kiem(soi_bo_dem({"truy_van_0_ket_qua": "1", "go_lai": 0}), "giá trị không phải số ⇒ đỏ")
    K.kiem(soi_bo_dem({"truy_van_0_ket_qua": 0, "go_lai": 0}) == [], "đủ hai số ⇒ sạch")
    K.tu_kiem_xong(CONG, 3)

try:
    indexer, db, api, tin_hieu = _nap.nap("indexer", "db", "api", "tin_hieu")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-6")

H = {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-web", "x-phien": "phien-A"}
with K.tam("gn_m13_th_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url(), KHOA_WEB_TRUYHOI="k-web"):
        con = db.mo(ghi=True)
        indexer.reindex(con, day_du=True)
        con.close()

        def doc_so():
            return tin_hieu.TinHieu(Path(db.duong_index()).parent).doc()

        s, cong = K.bat_service(api)
        try:
            print("\n1 · truy vấn 0 kết quả ⇒ bộ đếm +1 và có dòng ghi\n")
            t0 = doc_so()
            K.kiem(soi_bo_dem(t0) == [], "đọc được hai bộ đếm ban đầu", str(t0))
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": "zzzz-khong-co-trong-kho", "pham_vi": {}, "nguon": None, "k": 5}, H)
            K.kiem(ma == 200 and j["tong"] == 0, "truy vấn lạ ⇒ 200, tong 0", f"ma={ma}")
            t1 = doc_so()
            K.kiem(t1["truy_van_0_ket_qua"] == t0["truy_van_0_ket_qua"] + 1, "truy_van_0_ket_qua +1", f"{t0} → {t1}")
            files = list(Path(db.duong_index()).parent.glob("tin-hieu*"))
            K.kiem(files, "có file ghi tín hiệu cạnh index (không ở kb/)", str(list(Path(db.duong_index()).parent.iterdir())))

            print("\n2 · gõ lại ≥2 lần trong một phiên ⇒ go_lai +1\n")
            for q in ("pipeline tái tạo", "pipeline tai tao lai", "pipeline reproducible"):
                K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": q, "pham_vi": {}, "nguon": None, "k": 5}, H)
            t2 = doc_so()
            K.kiem(t2["go_lai"] >= t1["go_lai"] + 1, "ba câu khác nhau liên tiếp cùng phiên ⇒ go_lai +1", f"{t1['go_lai']} → {t2['go_lai']}")
            for q in ("đường ống", "đường ống"):
                K.goi(cong, "POST", "/truy-hoi", {"cau_hoi": q, "pham_vi": {}, "nguon": None, "k": 5}, {**H, "x-phien": "phien-B"})
            t3 = doc_so()
            K.kiem(t3["go_lai"] == t2["go_lai"], "gõ LẠI Y CÂU CŨ ở phiên khác không tính là gõ lại", f"{t2['go_lai']} → {t3['go_lai']}")
        finally:
            K.dung_service(s)

        print("\n3 · khởi động lại tiến trình ⇒ hai số VẪN CÒN\n")
        s2, cong2 = K.bat_service(api)
        try:
            t4 = doc_so()
            K.kiem(t4["truy_van_0_ket_qua"] == t3["truy_van_0_ket_qua"] and t4["go_lai"] == t3["go_lai"],
                   "sau khởi động lại: hai số bằng trước", f"{t3} → {t4}")
            ma, j, _ = K.goi(cong2, "GET", "/health")
            K.kiem(ma == 200 and isinstance(j, dict), "/health sống sau khởi động lại")
        finally:
            K.dung_service(s2)

K.chot("0-kết-quả đếm được · gõ lại đếm được · số sống qua khởi động lại")
