#!/usr/bin/env python3
"""WO-065 · `sinh-transcript` phải DÙNG byte đã có trong kho.

Chủ dự án 2026-09-09: job transcript treo, `log/worker-w2.out` báo
`HostKhongKhai: host 'video' không có trong host_cho_phep`.

Gốc: `_chon_loi()` loại lối `file` VÔ ĐIỀU KIỆN rồi chọn theo `uu_tien`, nên
luôn ra một lối TẢI VỀ; `_tai_audio` đọc `url` của bản ghi, gặp
`kho://video/<slug>` (do `FR-075` sinh ra cùng ngày) thì bóc `video` làm
hostname và chặn. Phép chọn lối không bao giờ hỏi *"đã có byte trong kho chưa"*.

`spec §5.0b` tả `doc-byte` đúng là đường đọc-qua-LÕI từ đầu — mã chỉ chưa cắm
nó vào phép chọn lối.

Cổng ĐO HÀM, không đo lời khai: gọi trực tiếp phép chọn với hai hình dạng bản
ghi và đối chiếu lối trả về.
"""
from __future__ import annotations

import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "tests"))
from _nap import nap  # noqa: E402

worker = nap("worker")
tai_nguon = nap("tai_nguon")

loi = 0


def ok(dk, ten, chi_tiet=""):
    global loi
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"\n       {chi_tiet}"))
    if not dk:
        loi += 1


print("\nWO-065 · transcript dùng byte đã có trong kho\n")

bang = tai_nguon.doc_bang()

# ── 1 · phép chọn lối phải NHẬN thông tin về hiện vật ───────────────────
ok(hasattr(worker, "_chon_loi"), "0 · có `_chon_loi`")

import inspect  # noqa: E402

sig = inspect.signature(worker._chon_loi)
ok(len(sig.parameters) >= 2,
   "1 · `_chon_loi` nhận thêm tham số về hiện vật của bản ghi",
   f"chữ ký hiện tại: {sig} — một hàm chỉ nhận bảng khai KHÔNG THỂ biết "
   f"bản ghi đã có byte hay chưa, nên nó luôn chọn một lối tải về")

# ── 2 · CÓ byte trong kho ⇒ lối `file`, KHÔNG tải, KHÔNG kiểm host ──────
HV_VIDEO = [{"sha256": "ab" * 32, "mime": "video/mp4",
             "ten_goc": "on-thi.mp4", "so_byte": 43151}]
HV_AUDIO = [{"sha256": "cd" * 32, "mime": "audio/mpeg",
             "ten_goc": "on-thi.mp3", "so_byte": 12000}]
HV_VTT = [{"sha256": "ef" * 32, "mime": "text/vtt",
           "ten_goc": "on-thi.vtt", "so_byte": 900}]

try:
    l_video = worker._chon_loi(bang, HV_VIDEO)
    l_audio = worker._chon_loi(bang, HV_AUDIO)
    l_vtt = worker._chon_loi(bang, HV_VTT)
    l_rong = worker._chon_loi(bang, [])
except TypeError as e:
    print(f"  FAIL 2 · gọi `_chon_loi(bang, media)` ném TypeError\n       {e}")
    print(f"\n{loi + 1} lỗi\n")
    sys.exit(1)

ok(l_video.get("loai") == "file",
   "2 · hiện vật `video/*` trong kho ⇒ lối `file` (đọc byte qua LÕI)",
   f"được {l_video.get('ten')!r}/{l_video.get('loai')!r} — một lối tải về sẽ "
   f"đọc `url` và chết ở `kho://video/...`")
ok(l_audio.get("loai") == "file",
   "2a · hiện vật `audio/*` cũng ⇒ lối `file`",
   f"được {l_audio.get('ten')!r}/{l_audio.get('loai')!r}")
ok(l_video.get("tieu_egress") is False,
   "2b · lối đó khai `tieu_egress: false` — byte KHÔNG rời máy",
   "`M12-R8`/`AC-V3` đòi cột này phân biệt được hai lối; đọc trong kho là 0 egress")

# ── 3 · `.vtt` KHÔNG phải nguyên liệu audio ────────────────────────────
ok(l_vtt.get("loai") != "file",
   "3 · hiện vật `text/vtt` KHÔNG làm nguồn audio",
   "`.vtt` LÀ transcript rồi — coi nó là audio thì job phiên âm chính bản "
   "phiên âm. Nó là hiện vật DẪN XUẤT, và `chi_dan_xuat` của bảng mime nói thế")

# ── 4 · KHÔNG byte ⇒ giữ nguyên đường cũ ───────────────────────────────
ok(l_rong.get("loai") != "file",
   "4 · kho KHÔNG có byte ⇒ vẫn chọn lối tải về (đường cũ nguyên vẹn)",
   f"được {l_rong.get('ten')!r} — bản ghi đăng ký bằng URL phải đi đường tải")
ok(l_rong.get("uu_tien") == min(n["uu_tien"] for n in bang["nguon"]
                                if n["loai"] != "file"),
   "4a · và vẫn theo `uu_tien` nhỏ nhất của các lối chạy được")

# ── 5 · `kho://` KHÔNG BAO GIỜ được đưa qua `kiem_host` ────────────────
#
# Vế này canh đúng câu lỗi người dùng gặp. Nếu ai đó sau này bỏ nhánh `file`
# mà vẫn để đường tải chạy trên một `kho://` url thì đây là chỗ đỏ.
try:
    tai_nguon.kiem_host("kho://video/on-thi-chi-yen", bang)
    ok(False, "5 · `kho://` bị `kiem_host` TỪ CHỐI (đúng — nó không phải url mạng)",
       "nó lại ĐI QUA, tức allowlist đã bị nới cho một scheme nội bộ")
except tai_nguon.HostKhongKhai:
    ok(True, "5 · `kho://` bị `kiem_host` từ chối — nên đường tải KHÔNG được nhận nó")

# ── 6 · CHẠY THẬT nhánh `file` của `_tai_audio` ─────────────────────────
#
# LỖ CỦA BẢN ĐẦU CỔNG NÀY, và nó lộ ra bằng một job hỏng của chủ dự án: năm vế
# trên chỉ đo phép CHỌN lối, không CHẠY lối. Nên một
# `nhat_ky.ghi("worker", "doc-byte-trong-kho", …)` sai arity nằm NGAY SAU phép
# đọc byte vẫn đi qua cổng, rồi giết job SAU KHI đã đọc xong file.
#
# ⚠️ Nó lộ thêm một điều: `nhat_ky.ghi` tự hứa *"KHÔNG NÉM — nhật ký hỏng không
# được giết việc thật"*, nhưng `try` của nó nằm TRONG thân hàm, còn `TypeError`
# của một lời gọi sai arity ném ở chỗ RÀNG BUỘC THAM SỐ — trước cả `try`. Lời
# hứa đó không che được lớp lỗi này, nên chỉ một vế CHẠY THẬT bắt được.
import http.server                                                  # noqa: E402
import json as _json                                                # noqa: E402
import tempfile                                                     # noqa: E402
import threading                                                    # noqa: E402

vong = nap("vong")

BYTE = b"\x00\x00\x00 ftyp" + b"\x11" * 64
SHA = "ab" * 32
SLUG = "video/on-thi-chi-yen"
FM = {"slug": "on-thi-chi-yen", "url": "kho://" + SLUG,
      "media": [{"sha256": SHA, "mime": "video/mp4",
                 "ten_goc": "on thi.mp4", "so_byte": len(BYTE)}]}


class _Loi(http.server.BaseHTTPRequestHandler):
    """LÕI giả — đúng hai đường mà `doc-byte` cần (quyết 1a)."""

    def do_GET(self):                                       # noqa: N802
        if self.path.endswith(SHA):
            self.send_response(200)
            self.send_header("content-type", "video/mp4")
            self.send_header("content-length", str(len(BYTE)))
            self.end_headers()
            self.wfile.write(BYTE)
            return
        if self.path.startswith("/api/articles/"):
            b = _json.dumps({"frontmatter": FM}).encode()
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(b)))
            self.end_headers()
            self.wfile.write(b)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *a):
        pass


sv = http.server.HTTPServer(("127.0.0.1", 0), _Loi)
threading.Thread(target=sv.serve_forever, daemon=True).start()
_cua_that = worker._cua_loi
worker._cua_loi = lambda: "http://127.0.0.1:%d" % sv.server_address[1]
try:
    tam = tempfile.mkdtemp(prefix="gn-wo065-")
    q = vong.HangDoi(tam)
    u = "0" * 32
    loi_file = worker._chon_loi(bang, FM["media"])
    try:
        ra = worker._tai_audio(q, u, SLUG, loi_file, bang, FM)
        nem = None
    except Exception as e:                                  # noqa: BLE001
        ra, nem = None, "%s: %s" % (type(e).__name__, e)

    ok(nem is None,
       "6 · `_tai_audio` nhánh `file` CHẠY XONG, không ném",
       "ném %s — đúng lớp lỗi giết job SAU khi đã đọc byte" % nem)
    if ra is not None:
        ok(ra.exists() and ra.read_bytes() == BYTE,
           "6a · byte ghi vào Maildir CỦA JOB, khớp từng byte với kho",
           "đọc được %d/%d byte" % (ra.stat().st_size if ra.exists() else 0, len(BYTE)))
        ok(ra.parent.name == "cur" and str(tam) in str(ra),
           "6b · audio nằm Maildir của job, KHÔNG trong `kb/**` (`AC-V2`)",
           "đường: %s" % ra)
finally:
    worker._cua_loi = _cua_that
    sv.shutdown()


print(f"\n{loi} lỗi\n" if loi else "\nĐủ vế — transcript dùng byte trong kho\n")
sys.exit(1 if loi else 0)
