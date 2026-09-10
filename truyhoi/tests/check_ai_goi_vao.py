#!/usr/bin/env python3
r"""AC-1.6 · M13-R6 · FR-072 T6 · ADR-08 Z9 — AI GỌI VÀO: bên NHẬN cưỡng chế.

Danh sách người gọi đọc từ `goi_duoc` của `truyhoi` trong `core/assets/dich-vu.json` — KHÔNG
từ hằng trong mã. Quy ước khoá chiều (PM 2026-09-10): env `KHOA_<TU>_TRUYHOI`, header
`x-khoa-dich-vu` + `x-aud: truyhoi`; bên nhận suy `từ` bằng cách so khoá với từng phần tử
`goi_duoc`, KHÔNG tin header tự khai tên.

Năm ca của testcases §1 AC-1.6:
  happy   `web` và `chatbot` mang khoá đúng chiều + x-aud: truyhoi ⇒ 2xx
  edge    dịch vụ ngoài `goi_duoc` (`artifact`, khoá đúng cú pháp) ⇒ 403, nêu TÊN dịch vụ + đường sửa
  edge 2  `x-aud: chungcat` ⇒ 403 (CVE-2025-41258)
  edge 3  thiếu hẳn khoá ⇒ 403 fail-closed (không "cho qua vì loopback")
  edge 4  hằng danh sách người gọi trong mã ⇒ đỏ (AST)
  + thêm khách = một phần tử vào mảng + một khoá: dich-vu.json TẠM thêm `artifact` ⇒ 2xx, 0 sửa mã.

ĐỎ_KHI  một trong ba ca 403 trả 2xx · happy trả 403 · mã có `["web", "chatbot"]` gõ tay
XANH_KHI năm ca đúng; thêm khách bằng bảng khai thì qua
--tu-kiem (T13-1 AC4): một server GIẢ trả 200 cho cả ba ca ⇒ phép chấm phải ĐỎ cả ba.
"""
import json
import re
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _loi_gia  # noqa: E402
import _nap  # noqa: E402

CONG = "check_ai_goi_vao.py"
THAN = {"cau_hoi": "bất kỳ", "pham_vi": {}, "nguon": None, "k": 5}
RX_HANG = re.compile(r"\[\s*[\"']web[\"']\s*,\s*[\"']chatbot[\"']\s*\]|goi_duoc\s*=\s*\[")


def cham_ba_ca(goi_fn) -> list[str]:
    """goi_fn(headers) -> mã. Trả danh sách ca SAI màu (rỗng = đúng)."""
    sai = []
    ca = [
        ("ngoài goi_duoc (artifact)", {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-artifact", "x-tu": "artifact"}, 403),
        ("x-aud sai (chungcat)", {"x-aud": "chungcat", "x-khoa-dich-vu": "k-web"}, 403),
        ("thiếu khoá", {"x-aud": "truyhoi"}, 403),
        ("web đúng khoá", {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-web"}, 200),
        ("chatbot đúng khoá", {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-chatbot"}, 200),
    ]
    for ten, h, mong in ca:
        ma = goi_fn(h)
        if (mong == 403 and not (400 <= ma < 500)) or (mong == 200 and not (200 <= ma < 300)):
            sai.append(f"{ten}: mong {mong}, được {ma}")
    return sai


def soi_hang(nguon: dict[str, str]) -> list[str]:
    return [f"{f}:{i}" for f, t in nguon.items() for i, l in enumerate(t.splitlines(), 1) if RX_HANG.search(l)]


if K.TU_KIEM:
    print("\ntu-kiem · server GIẢ trả 200 cho mọi ca ⇒ phép chấm phải ĐỔ ba ca 403\n")

    class ChoQua(BaseHTTPRequestHandler):
        def log_message(self, *a): pass

        def do_POST(self):
            self.rfile.read(int(self.headers.get("content-length") or 0))
            b = json.dumps({"ket_qua": [], "so_ban_ghi_trong_pham_vi": 0, "tong": 0}).encode()
            self.send_response(200); self.send_header("content-length", str(len(b))); self.end_headers(); self.wfile.write(b)

    s = ThreadingHTTPServer(("127.0.0.1", 0), ChoQua)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    sai = cham_ba_ca(lambda h: K.goi(s.server_address[1], "POST", "/truy-hoi", THAN, h)[0])
    s.shutdown()
    K.kiem(len(sai) == 3 and all("mong 403" in x for x in sai), "server cho-qua ⇒ đúng BA ca 403 bị chấm sai, hai ca happy không", " · ".join(sai))
    K.kiem(soi_hang({"api.py": 'GOI_DUOC = ["web", "chatbot"]'}) == ["api.py:1"], "hằng danh sách người gọi trong mã ⇒ bắt")
    K.kiem(soi_hang({"api.py": 'goi_duoc = dv.get("goi_duoc") or []'}) == [], "đọc từ bảng khai ⇒ sạch")
    K.tu_kiem_xong(CONG, 3)

print("\n1 · AST — 0 hằng danh sách người gọi trong truyhoi/src\n")
nguon = K.nguon_src()
vp = soi_hang(nguon)
K.kiem(bool(nguon) and not vp, "danh sách người gọi KHÔNG gõ trong mã (đọc goi_duoc từ dich-vu.json)", " · ".join(vp) or "chưa có mã")

try:
    indexer, db, api = _nap.nap("indexer", "db", "api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

with K.tam("gn_m13_ai_") as tmp, _loi_gia.LoiGia(_loi_gia.kho_mau()) as loi:
    # dich-vu.json TẠM: bản sao của bảng thật (không sửa file thật) — để thử "thêm khách".
    dv_that = K.doc_json(K.ASSETS / "dich-vu.json")
    dv_tam = tmp / "dich-vu.json"
    dv_tam.write_text(json.dumps(dv_that, ensure_ascii=False), encoding="utf-8")
    with K.env_tam(TRUYHOI_INDEX=str(tmp / "index.sqlite"), TRUYHOI_LOI_URL=loi.url(), TRUYHOI_DICH_VU=str(dv_tam),
                   KHOA_WEB_TRUYHOI="k-web", KHOA_CHATBOT_TRUYHOI="k-chatbot", KHOA_ARTIFACT_TRUYHOI="k-artifact"):
        con = db.mo(ghi=True); indexer.reindex(con, day_du=True); con.close()
        s, cong = K.bat_service(api)
        try:
            print("\n2 · ba ca 403 · hai ca 2xx\n")
            sai = cham_ba_ca(lambda h: K.goi(cong, "POST", "/truy-hoi", THAN, h)[0])
            K.kiem(not sai, "artifact ⇒ 403 · x-aud chungcat ⇒ 403 · thiếu khoá ⇒ 403 · web/chatbot đúng khoá ⇒ 2xx", " · ".join(sai))
            ma, j, _ = K.goi(cong, "POST", "/truy-hoi", THAN, {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-artifact", "x-tu": "artifact"})
            K.kiem(ma == 403 and "artifact" in str(j) and "goi_duoc" in str(j), "403 nêu TÊN dịch vụ + đường sửa (`goi_duoc`), không 'unauthorized' chung chung", str(j)[:160])
            ma2, _, _ = K.goi(cong, "POST", "/truy-hoi", THAN, {"x-aud": "truyhoi", "x-khoa-dich-vu": "sai-hoan-toan"})
            K.kiem(ma2 == 403, "khoá sai ⇒ 403 (cùng mã với thiếu khoá — fail-closed, không lộ oracle)", str(ma2))
            ma3, _, _ = K.goi(cong, "GET", "/health")
            K.kiem(ma3 == 200, "/health KHÔNG đòi khoá")

            print("\n3 · thêm khách = một phần tử vào mảng + một khoá, 0 sửa mã\n")
        finally:
            K.dung_service(s)
        for dv in dv_that["dich_vu"]:
            if dv["thu_muc"] == "truyhoi":
                dv["goi_duoc"] = list(dv.get("goi_duoc", [])) + ["artifact"]
        dv_tam.write_text(json.dumps(dv_that, ensure_ascii=False), encoding="utf-8")
        s, cong = K.bat_service(api)
        try:
            ma, _, _ = K.goi(cong, "POST", "/truy-hoi", THAN, {"x-aud": "truyhoi", "x-khoa-dich-vu": "k-artifact"})
            K.kiem(200 <= ma < 300, "sau khi thêm `artifact` vào goi_duoc (bảng tạm) ⇒ 2xx — bảng khai là nguồn, không phải mã", str(ma))
        finally:
            K.dung_service(s)

K.chot("ba ca 403 · hai ca 2xx · danh sách người gọi từ bảng khai · thêm khách không sửa mã")
