"""Service M13 — `127.0.0.1:<cổng truyhoi trong dich-vu.json>` (spec §1a · AC-1.6 · M13-R6 · T13-4/T13-5).

Khuôn `chungcat/src/api.py` chép lại, không import (Z7): stdlib `ThreadingHTTPServer`, `.env` nạp Ở
`chay()` (không lúc import — cổng import module không được đụng env thật), `cong is not None` (test truyền
0 = OS chọn; `0 or …` sẽ bind nhầm cổng thật), mọi handler bọc try/except → 500 JSON (exception giết
thread phục vụ im lặng).

Hai đường:
  GET  /health      {ok, duong_index, moc_index_gan_nhat, so_tai_lieu, so_chunk, sqlite_version} — KHÔNG health trần
  POST /truy-hoi    hợp đồng FR-072 §1.1 — MỘT hình dạng cho mọi client; đòi `_tu_ai()`

`_tu_ai()` — BÊN NHẬN cưỡng chế (ADR-08 Z9): danh sách người gọi = `goi_duoc` của `truyhoi` trong
`core/assets/dich-vu.json` (đọc như FILE mỗi request; env `TRUYHOI_DICH_VU` để test trỏ bản TẠM) — không
hằng trong mã. Header `x-aud` phải là `truyhoi`; `x-khoa-dich-vu` so `hmac.compare_digest` với env
`KHOA_<TU>_TRUYHOI` của TỪNG `tu` trong `goi_duoc` — suy ra người gọi từ KHOÁ, không tin header tên.
Ngoài mảng · aud sai · thiếu/sai khoá ⇒ 403 (thiếu và sai cùng một mã — fail-closed, không oracle).
"""

from __future__ import annotations

import hmac
import json
import os
import sqlite3
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import db
import rank

R = Path(__file__).resolve().parents[2]
ASSETS = R / "core" / "assets"
TEN = "truyhoi"


def duong_dich_vu() -> Path:
    return Path(os.environ.get("TRUYHOI_DICH_VU") or (ASSETS / "dich-vu.json"))


def _dich_vu_toi() -> dict:
    d = json.loads(duong_dich_vu().read_text(encoding="utf-8"))
    dv = next((x for x in d["dich_vu"] if x["thu_muc"] == TEN), None)
    if not dv:
        raise RuntimeError(f"`{TEN}` không có trong bảng khai dịch vụ ({duong_dich_vu()})")
    return dv


def cong_tu_bang_khai() -> int:
    return int(_dich_vu_toi()["cong"])


def nap_env(duong: Path | None = None) -> list[str]:
    """`.env` gốc repo — chỉ điền biến CHƯA có (env thật thắng file). Trả tên biến đã điền, không trả giá trị."""
    p = duong or (R / ".env")
    da = []
    if not p.exists():
        return da
    for dong in p.read_text(encoding="utf-8", errors="replace").splitlines():
        dong = dong.strip()
        if not dong or dong.startswith("#") or "=" not in dong:
            continue
        k, v = dong.split("=", 1)
        k, v = k.strip(), v.strip().strip("'\"")
        if k and k not in os.environ:
            os.environ[k] = v
            da.append(k)
    return da


class Cua(BaseHTTPRequestHandler):
    server_version = "truyhoi"

    def log_message(self, *a):  # noqa: D401
        pass

    # ── trả ────────────────────────────────────────────────────────────────
    def _tra(self, ma: int, than: dict) -> None:
        b = json.dumps(than, ensure_ascii=False).encode("utf-8")
        self.send_response(ma)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    # ── ai gọi vào ─────────────────────────────────────────────────────────
    def _tu_ai(self) -> str | None:
        """Tên dịch vụ gọi vào nếu hợp lệ; None ⇒ handler đã trả 403."""
        goi_duoc = list(_dich_vu_toi().get("goi_duoc") or [])
        aud = self.headers.get("x-aud", "")
        if aud != TEN:
            self._tra(403, {"loi": f"`x-aud` là `{aud or '(trống)'}`, không phải `{TEN}` — "
                                   "một khoá dùng được ở nhiều đích thì đích nào cũng nhận (M13-R6)"})
            return None
        khoa = self.headers.get("x-khoa-dich-vu", "")
        for tu in goi_duoc:
            mong = os.environ.get(f"KHOA_{tu.upper()}_{TEN.upper()}")
            if mong and khoa and hmac.compare_digest(khoa, mong):
                return tu
        tu_khai = self.headers.get("x-tu") or "dịch vụ gọi"
        self._tra(403, {"loi": f"`{tu_khai}` không có trong `goi_duoc` của dịch vụ `{TEN}` "
                               f"(core/assets/dich-vu.json) hoặc khoá chiều không khớp. Thêm khách = một phần tử "
                               f"vào mảng `goi_duoc` + một khoá `KHOA_<TU>_{TEN.upper()}`, không sửa mã."})
        return None

    # ── GET ────────────────────────────────────────────────────────────────
    def do_GET(self):
        try:
            if self.path.split("?")[0] == "/health":
                con = db.mo()
                try:
                    return self._tra(200, {
                        "ok": True,
                        "duong_index": str(db.duong_index()),
                        "moc_index_gan_nhat": db.moc_gan_nhat(con),
                        "so_tai_lieu": con.execute("SELECT count(*) FROM tai_lieu").fetchone()[0],
                        "so_chunk": con.execute("SELECT count(*) FROM chunks").fetchone()[0],
                        "sqlite_version": sqlite3.sqlite_version,
                    })
                finally:
                    con.close()
            return self._tra(404, {"loi": "không có đường này"})
        except Exception as e:  # noqa: BLE001 — không để exception giết thread phục vụ
            return self._tra(500, {"loi": f"{type(e).__name__}: {e}"})

    # ── POST ───────────────────────────────────────────────────────────────
    def _doc_than(self) -> dict:
        n = int(self.headers.get("content-length") or 0)
        if n > 1024 * 1024:
            raise ValueError("thân quá lớn (>1 MB)")
        tho = self.rfile.read(n) if n else b""
        b = json.loads(tho.decode("utf-8") or "{}")
        if not isinstance(b, dict):
            raise ValueError("thân phải là JSON object")
        return b

    def _kiem_truy_hoi(self, b: dict) -> tuple[str | None, dict]:
        """(lỗi 400 | None, tham số sạch). Hợp đồng FR-072 §1.1 — khoá vắng là câu chưa nói, không mặc định."""
        cau_hoi = b.get("cau_hoi")
        if not isinstance(cau_hoi, str) or not cau_hoi.strip():
            return "`cau_hoi` bắt buộc, chuỗi khác rỗng", {}
        if "k" not in b:
            return "thiếu khoá `k` — `k` là tham số người gọi đưa, M13 không mặc định (AC-5.2)", {}
        k = b["k"]
        tran_k = int(rank.doc_nguong().get("tran_k", 200))
        if not isinstance(k, int) or isinstance(k, bool) or k < 1 or k > tran_k:
            return f"`k` phải là số nguyên 1..{tran_k}", {}
        if "nguon" not in b:
            return ("thiếu khoá `nguon`. Cả kho thì gửi `nguon: null` — mặc định phải TƯỜNG MINH trong "
                    "payload, không phải một nhánh vắng (AC-5.3)"), {}
        nguon = b["nguon"]
        if nguon is not None and not (isinstance(nguon, list) and all(isinstance(x, str) for x in nguon)):
            return "`nguon` phải là null hoặc danh sách slug (chuỗi)", {}
        pham_vi = b.get("pham_vi", {})
        if pham_vi is None:
            pham_vi = {}
        if not isinstance(pham_vi, dict):
            return "`pham_vi` phải là object", {}
        sach = {}
        for kh, gt in pham_vi.items():
            if kh not in rank.KHOA_PHAM_VI:
                return (f"khoá facet lạ `{kh}` — chỉ nhận khoá TANG của FE {list(rank.TANG)} + `space`; "
                        "không có bảng đổi tên (AC-5.2)"), {}
            if kh == "space":
                if not isinstance(gt, str) or not gt.strip():
                    return "`space` phải là một chuỗi (khoá dành sẵn — mọi bản ghi = `mac-dinh` cho tới FR-080)", {}
                sach[kh] = [gt]
                continue
            if isinstance(gt, str):
                gt = [gt]
            if not isinstance(gt, list) or not all(isinstance(x, str) for x in gt):
                return f"`pham_vi.{kh}` phải là danh sách chuỗi", {}
            if gt:
                sach[kh] = gt
        return None, {"cau_hoi": cau_hoi, "pham_vi": sach, "nguon": nguon, "k": k}

    def do_POST(self):
        try:
            duong = self.path.split("?")[0]
            if duong != "/truy-hoi":
                return self._tra(404, {"loi": "không có đường này"})
            if self._tu_ai() is None:
                return None
            try:
                b = self._doc_than()
            except (ValueError, json.JSONDecodeError) as e:
                return self._tra(400, {"loi": f"thân request không đọc được: {e}"})
            loi, ts = self._kiem_truy_hoi(b)
            if loi:
                return self._tra(400, {"loi": loi})
            con = db.mo()
            try:
                try:
                    kq = rank.truy_hoi(con, **ts)
                except ValueError as e:
                    return self._tra(400, {"loi": str(e)})
                return self._tra(200, kq)
            finally:
                con.close()
        except Exception as e:  # noqa: BLE001
            return self._tra(500, {"loi": f"{type(e).__name__}: {e}"})


def chay(cong: int | None = None) -> ThreadingHTTPServer:
    """Bind LOOPBACK. `cong=0` (test) hợp lệ — vì thế `is not None`, không `or`."""
    nap_env()
    return ThreadingHTTPServer(("127.0.0.1", cong if cong is not None else cong_tu_bang_khai()), Cua)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    s = chay()
    print(f"truyhoi nghe {s.server_address[0]}:{s.server_address[1]} · index {db.duong_index()}")
    s.serve_forever()
