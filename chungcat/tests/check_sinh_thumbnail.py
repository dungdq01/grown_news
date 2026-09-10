#!/usr/bin/env python3
"""WO-071 · T12-30 — job `sinh-thumbnail` cho video URL.

Chủ dự án 2026-09-09: *"reel (url fb) chưa có nền giống youtube hay tiktok"*.

`nenThe` lớp 2 chỉ dựng được ảnh cho YouTube vì `i.ytimg.com/vi/<id>/…` là URL
ĐOÁN ĐƯỢC từ id. Ba host còn lại phải HỎI nền tảng.

── Vì sao `yt-dlp` chứ không oEmbed (đổi thiết kế so với `T12-29` bản soạn) ──
  tiktok  oEmbed công khai
  fb      oEmbed ĐÒI app token từ 10/2020  ⇒ không có token thì tắc
  douyin  không rõ, và `douyin.com` chưa có trong allowlist
`yt-dlp --write-thumbnail --skip-download` có extractor cho CẢ BỐN host, 0
token, 0 nhánh per-platform — và nó đã cài, đã qua cửa egress, đã có allowlist.
"""
from __future__ import annotations

import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "tests"))
from _nap import nap  # noqa: E402

tai_nguon = nap("tai_nguon")
worker = nap("worker")

loi = 0


def ok(dk, ten, ct=""):
    global loi
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"\n       {ct}"))
    if not dk:
        loi += 1


print("\nWO-071 · thumbnail cho video URL\n")

bang = tai_nguon.doc_bang()

# ── AC2 · douyin vào allowlist ─────────────────────────────────────────
ok("douyin.com" in {h.lower() for h in bang["host_cho_phep"]},
   "2 · `douyin.com` có trong `host_cho_phep`",
   f"hiện có: {bang['host_cho_phep']}")

# ── AC1 · lệnh dựng đúng, và KIỂM HOST TRƯỚC ───────────────────────────
ok(hasattr(tai_nguon, "lenh_tai_thumbnail"), "1 · có `lenh_tai_thumbnail`")
if hasattr(tai_nguon, "lenh_tai_thumbnail"):
    l = tai_nguon.lenh_tai_thumbnail("https://www.tiktok.com/@a/video/123456789",
                                     Path("/tmp/x"), bang)
    s = " ".join(str(x) for x in l)
    # WO-075 · `--write-ALL-thumbnails`, và vế này đòi ĐÚNG chữ ấy.
    #
    # Đo trên bản ghi thật: TikTok công bố ba bản — `dynamicCover` · `cover` ·
    # `originCover` — và `--write-thumbnail` lấy bản CUỐI, vốn là một tấm
    # gradient TRỐNG 4 761 byte. Bản thật 28 980 byte. Thẻ hiện một ô đen suốt
    # một ngày mà không cổng nào kêu, vì "có ảnh" là đúng theo mọi phép đo cũ.
    ok("--write-all-thumbnails" in s,
       "1a · lệnh có `--write-all-thumbnails` (KHÔNG phải `--write-thumbnail`)",
       s[:160])
    ok("--skip-download" in s,
       "1b · có `--skip-download` — KHÔNG tải cả video cho một tấm ảnh", s[:140])
    ok("yt_dlp" in s and "-m" in s,
       "1c · gọi `-m yt_dlp` của CHÍNH trình thông dịch, không phụ thuộc shim PATH",
       "bài học 2026-09-05: `.venv/Scripts/yt-dlp.exe` không được sinh")
    # Host NGOÀI allowlist ⇒ ném TRƯỚC khi dựng lệnh (`AC-V4`).
    try:
        tai_nguon.lenh_tai_thumbnail("https://ke-xau.example/v/1", Path("/tmp/x"), bang)
        ok(False, "1d · host ngoài allowlist ⇒ NÉM trước khi dựng lệnh",
           "nó dựng được lệnh — tức phép chặn nằm SAU chỗ cần chặn")
    except tai_nguon.HostKhongKhai:
        ok(True, "1d · host ngoài allowlist ⇒ NÉM trước khi dựng lệnh")

# ── AC3 · job gắn với cờ THAY ──────────────────────────────────────────
ok("sinh-thumbnail" in worker.BANG_LOAI, "3 · `sinh-thumbnail` có trong `BANG_LOAI`")
src = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
# Cửa sổ đo = CẢ VÙNG thumbnail (`chien_luoc_anh_bia` → `BANG_LOAI`), không một
# hàm: WO-072 tách `_gan_anh_bia`/`_anh_bia_tu_url` ra khỏi `chay_sinh_thumbnail`,
# và một cửa sổ neo vào MỘT tên hàm đỏ oan ngay khi ai đó tách hàm.
i = src.find("def chien_luoc_anh_bia")
than = src[i:src.index("BANG_LOAI = {", i)] if i >= 0 else ""
ok(i >= 0 and "def chay_sinh_thumbnail" in than, "3a · có `chay_sinh_thumbnail`")
ok('"la_thumbnail"' in than, "3b · gắn với `kieu_moc: la_thumbnail`")
ok("thay_kieu_moc" in than,
   "3c · truyền cờ `thay_kieu_moc` — SINH LẠI phải THAY, không THÊM",
   "thiếu cờ thì mỗi lần chạy lại đẻ một entry, và `nenThe` lấy cái ĐẦU = cái CŨ "
   "(đúng bug append của transcript, backlog 2026-09-08)")

# ── AC4 · con trỏ sản phẩm ─────────────────────────────────────────────
ok("ghi_ket_qua" in than and "sha256" in than,
   "4 · để lại `ket_qua` mang `sha256` (`FR-070 §3`)",
   "một việc không để lại con trỏ tới sản phẩm là việc không ai kiểm được")

# ── AC5 · thiếu công cụ ⇒ nói ĐÚNG thứ thiếu ───────────────────────────
ok("yt_dlp" in than or "cong cu" in than.lower() or "công cụ" in than,
   "5 · câu lỗi thiếu công cụ nêu tên công cụ",
   "`FileNotFoundError: [WinError 2]` không nói file nào — bài học 2026-09-05")

# ── 6 · CHẠY THẬT `chay_sinh_thumbnail` với LÕI giả + yt-dlp giả ───────────
#
# LỖ CỦA BẢN ĐẦU CỔNG NÀY: năm vế trên đọc NGUỒN. Một lời gọi
# `egress.gui(..., _chay=_chay)` sai TÊN THAM SỐ (đúng là `chuyen=`) đi lọt cả
# năm vế, rồi chết trên job THẬT của chủ dự án với
# `TypeError: Object of type function is not JSON serializable` — vì tên lạ rơi
# vào `**kw` và `**kw` đi thẳng vào dòng log JSON.
# Cùng bài học `check_transcript_dung_byte_kho` §6: đo phép CHỌN không nói gì
# về phép CHẠY.
import http.server                                                  # noqa: E402
import json as _json                                                # noqa: E402
import tempfile                                                     # noqa: E402
import threading                                                    # noqa: E402

vong = nap("vong")
egress = nap("egress")

ANH = b"\xff\xd8\xff\xe0" + b"\x22" * 128
SLUG = "video/thu-thumb"
SHA = "cd" * 32
FM = {"slug": "thu-thumb", "url": "https://www.tiktok.com/@a/video/123456789",
      "media": []}
da_gan = {}


class _Loi(http.server.BaseHTTPRequestHandler):
    def _tra(self, o):
        b = _json.dumps(o).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):                                       # noqa: N802
        self._tra({"frontmatter": FM})

    def do_POST(self):                                      # noqa: N802
        n = int(self.headers.get("Content-Length") or 0)
        than = self.rfile.read(n)
        if self.path.endswith("/hien-vat"):
            da_gan.update(_json.loads(than or b"{}"))
            self._tra({"media": [{"sha256": SHA, "mime": "image/jpeg"}]})
        else:
            self._tra({"sha256": SHA, "so_byte": len(than)})

    def log_message(self, *a):
        pass


sv = http.server.HTTPServer(("127.0.0.1", 0), _Loi)
threading.Thread(target=sv.serve_forever, daemon=True).start()
_cua, _tam = worker._cua_loi, worker.duong_xuat_tam
_lenh = tai_nguon.lenh_tai_thumbnail
tmp = Path(tempfile.mkdtemp(prefix="gn-thumb-"))
try:
    worker._cua_loi = lambda: "http://127.0.0.1:%d" % sv.server_address[1]
    worker.duong_xuat_tam = lambda: tmp
    import os
    os.environ.setdefault("KHOA_DICH_VU", "khoa-thu")
    # `yt-dlp` GIẢ: một lệnh Python ghi ra tệp ảnh, không gọi mạng.
    def _gia(url, ra, bang=None):
        tai_nguon.kiem_host(url, bang)          # giữ nguyên phép chặn thật
        return [sys.executable, "-c",
                "import sys,pathlib;pathlib.Path(sys.argv[1]).write_bytes("
                "bytes.fromhex('ffd8ffe0') + b'x' * 128)", str(ra) + ".jpg"]
    tai_nguon.lenh_tai_thumbnail = _gia

    q = vong.HangDoi(tempfile.mkdtemp(prefix="gn-thumbq-"))
    u, _ = q.nap("ab" * 16, {"loai": "sinh-thumbnail", "slug": SLUG})
    q.nhan_viec()
    try:
        kq = worker.chay_sinh_thumbnail(q, u, q.doc(u))
        nem = None
    except Exception as e:                                  # noqa: BLE001
        kq, nem = None, "%s: %s" % (type(e).__name__, e)

    ok(nem is None, "6 · `chay_sinh_thumbnail` CHẠY XONG, không ném",
       "ném %s" % nem)
    if kq is not None:
        ok(kq.get("sha256") == SHA, "6a · trả `sha256` của hiện vật đã nạp")
        ok(da_gan.get("kieu_moc") == "la_thumbnail",
           "6b · gắn với `kieu_moc: la_thumbnail`", _json.dumps(da_gan)[:120])
        ok(da_gan.get("thay_kieu_moc") is True,
           "6c · và CÓ cờ `thay_kieu_moc` trong thân request THẬT",
           "đọc nguồn thấy chữ `thay_kieu_moc` không bằng nó tới được cửa")
        ok(q.doc(u).get("ket_qua", {}).get("sha256") == SHA,
           "6d · để lại con trỏ `ket_qua.sha256`")
        ok(not list(tmp.glob("*thumb*")),
           "6e · tệp ảnh tạm đã DỌN — nó là byte nặng nhất còn sót lại",
           "còn: %s" % [p.name for p in tmp.glob('*')])
finally:
    worker._cua_loi, worker.duong_xuat_tam = _cua, _tam
    tai_nguon.lenh_tai_thumbnail = _lenh
    sv.shutdown()


# ── 7 · WO-072 · MỘT phép quyết cho CẢ HAI bên, và luật "chỉ khi CHƯA có nền"
#
# Chỉ đạo chủ dự án: *"video/url loại nào ko có nền mới áp dụng"*.
# Chỗ dễ sai: LÕI quyết có xếp việc không, THỢ quyết chạy nhánh nào — hai bên
# tự quyết thì chúng LỆCH, và lệch ở đây nghĩa là gọi ra Internet cho một bản
# ghi ĐÃ CÓ ảnh: tốn một lời gọi, và ghi đè một tấm ảnh đang đúng.
ok(hasattr(worker, "chien_luoc_anh_bia"), "7 · có `chien_luoc_anh_bia`")
if hasattr(worker, "chien_luoc_anh_bia"):
    cl = worker.chien_luoc_anh_bia
    ANH = [{"sha256": "ab" * 32, "mime": "image/jpeg", "ten_goc": "x.jpg", "so_byte": 9}]
    MP4 = [{"sha256": "cd" * 32, "mime": "video/mp4", "ten_goc": "x.mp4", "so_byte": 9}]
    PDF = [{"sha256": "ef" * 32, "mime": "application/pdf", "ten_goc": "x.pdf", "so_byte": 9}]
    VTT = [{"sha256": "12" * 32, "mime": "text/vtt", "ten_goc": "x.vtt", "so_byte": 9}]
    CA = [
        # (mô tả, frontmatter, kỳ vọng)
        ("đã có ảnh trong kho ⇒ KHÔNG đụng",
         {"source_type": "video", "url": "https://www.tiktok.com/@a/video/12345",
          "media": ANH}, None),
        ("YouTube ⇒ KHÔNG xếp (ytimg đã cho ảnh, 0 lời gọi)",
         {"source_type": "video", "url": "https://youtu.be/dQw4w9WgXcQ"}, None),
        ("tiktok ⇒ lối `url`",
         {"source_type": "video", "url": "https://www.tiktok.com/@a/video/12345"}, "url"),
        ("facebook ⇒ lối `url`",
         {"source_type": "video", "url": "https://www.facebook.com/reel/2020621438895108"}, "url"),
        # WO-074 · ĐẢO so với bản T12-30. Đo 2026-09-09 trên URL THẬT: `yt-dlp`
        # có extractor [Douyin] nhưng đòi cookie phiên ("Fresh cookies … are
        # needed") kể cả với dạng `/video/<id>` và đã có curl_cffi. Trả `"url"`
        # ở đây nghĩa là LÕI xếp một job CHẮC CHẮN hỏng — mỗi bản ghi douyin
        # để lại một việc trong thùng rác.
        ("douyin ⇒ KHÔNG (yt-dlp đòi cookie phiên — bảng khai loại trừ)",
         {"source_type": "video", "url": "https://www.douyin.com/video/7300000000000000000"}, None),
        ("douyin dạng `?modal_id=` (URL thật chủ dự án) ⇒ cũng KHÔNG",
         {"source_type": "video",
          "url": "https://www.douyin.com/jingxuan/course?modal_id=7543503016624655654"}, None),
        ("host NGOÀI allowlist ⇒ KHÔNG (AC-V4 cấm gọi host chưa khai)",
         {"source_type": "video", "url": "https://ke-xau.example/v/1"}, None),
        ("video có mp4 BYTE trong kho ⇒ lối `khung`",
         {"source_type": "video", "url": "kho://video/x", "media": MP4}, "khung"),
        ("tài liệu PDF ⇒ lối `pdf`",
         {"source_type": "tai-lieu", "url": "kho://tai-lieu/x", "media": PDF}, "pdf"),
        ("tài liệu md/txt ⇒ KHÔNG có gì render thành ảnh",
         {"source_type": "tai-lieu", "url": "kho://tai-lieu/x",
          "media": [{"sha256": "34" * 32, "mime": "text/markdown", "ten_goc": "x.md",
                     "so_byte": 9}]}, None),
        ("bài viết ⇒ KHÔNG có hiện vật nào",
         {"source_type": "article", "url": "https://vd.example/bai"}, None),
        ("video chỉ có .vtt ⇒ KHÔNG (transcript không phải ảnh)",
         {"source_type": "video", "url": "kho://video/x", "media": VTT}, None),
    ]
    for mo, fm, mong in CA:
        duoc = cl(fm)
        ok(duoc == mong, f"7 · {mo}",
           f"kỳ vọng {mong!r}, được {duoc!r}")

    # 7g · Phép loại trừ đọc TỪ BẢNG, không gõ tên host trong .py. `M12-R1`:
    # thêm một nền tảng là thêm MỘT DÒNG bảng khai, không sửa mã.
    src_cl = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
    i_cl = src_cl.find("def chien_luoc_anh_bia")
    than_cl = src_cl[i_cl:src_cl.index("\ndef ", i_cl + 10)] if i_cl >= 0 else ""
    ok("host_khong_lay_anh_bia" in than_cl,
       "7g · loại trừ đọc từ khoá bảng `host_khong_lay_anh_bia`",
       "không có ⇒ hoặc chưa cài, hoặc cài bằng cách gõ `douyin` vào mã")
    ok("douyin" not in than_cl.lower(),
       "7g2 · KHÔNG gõ cứng tên host nào trong `chien_luoc_anh_bia`",
       "gõ cứng thì bảng khai thành trang trí")

    # 7h · `curl_cffi` — TikTok chặn client không giả dạng TLS fingerprint.
    # Đo CẢ HAI phía: khai trong bảng, VÀ có thật trong môi trường. Chỉ đo một
    # phía thì hoặc máy này chạy được mà máy sau đỏ, hoặc bảng đúng mà môi
    # trường thiếu — và câu lỗi yt-dlp không nói gói nào vắng.
    khai = (R / "chungcat" / "pyproject.toml").read_text(encoding="utf-8")
    ok("curl_cffi" in khai, "7h · `curl_cffi` khai trong `pyproject.toml`",
       "cài tay trong .venv là để máy tiếp theo đỏ với cùng câu lỗi dẫn sai đường")
    try:
        import curl_cffi as _cc
        co_cc = True
    except Exception:
        co_cc = False
    ok(co_cc, "7h2 · `curl_cffi` có trong môi trường đang chạy",
       "vắng ⇒ yt-dlp trả 'Unexpected response from webpage request' cho TikTok")

    # Và THỢ phải DÙNG chính phép đó, không tự quyết lại.
    src7 = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
    i7 = src7.find("def chay_sinh_thumbnail")
    than7 = src7[i7:src7.index("\ndef ", i7 + 10)] if i7 >= 0 else ""
    ok("chien_luoc_anh_bia" in than7,
       "7b · `chay_sinh_thumbnail` GỌI phép quyết chung, không tự suy lại",
       "hai bên tự quyết là hai chỗ để lệch, và lệch ở đây là một lời gọi ra "
       "Internet cho bản ghi đã có ảnh")
    tho_cua = (R / "web" / "api" / "tho-cua.mjs").read_text(encoding="utf-8")
    # Neo vào TÍNH CHẤT, không vào chi tiết cài đặt: LÕI loại YouTube bằng một
    # DANH SÁCH CHO PHÉP (không có `youtube` trong đó) chứ không bằng một phép
    # loại trừ có chữ "youtu". Bản đầu của vế này đòi thấy chữ ấy — nó tố oan
    # một cài đặt đúng hơn.
    ok("image/" in tho_cua, "7c · LÕI bỏ qua bản ghi ĐÃ CÓ `image/*`")
    import re as _re
    m = _re.search(r"HOST_TU_XEP\s*=\s*\[([^\]]*)\]", tho_cua)
    ok(bool(m) and "youtu" not in m.group(1),
       "7d · danh sách host LÕI tự xếp KHÔNG chứa YouTube",
       f"được: {m.group(1) if m else '(không thấy HOST_TU_XEP)'}")
    # 7e · WO-074 · HAI NƠI, MỘT LUẬT — và cổng là thứ giữ cho chúng khớp.
    #
    # `HOST_TU_XEP` (JS, LÕI) và `chien_luoc_anh_bia` (Python, THỢ) trả lời cùng
    # một câu: host nào tải được ảnh bìa. Bản đầu của vế này liệt kê thẳng ba
    # tên `tiktok · facebook · douyin` — nên khi bảng khai loại douyin ra
    # (yt-dlp đòi cookie phiên), vế vẫn XANH trong lúc LÕI xếp một job CHẮC
    # CHẮN hỏng cho mỗi bản ghi douyin. Một vế chép danh sách là một bản thứ
    # BA của cùng danh sách.
    #
    # Nay TÍNH kỳ vọng TỪ BẢNG: cho phép − youtube − không-lấy-được-ảnh. Thêm
    # hay bớt một nền tảng là sửa MỘT DÒNG bảng, và cả ba nơi đi theo.
    mong_host = {h.lower().removeprefix("www.")
                 for h in bang["host_cho_phep"]} - {"youtube.com", "youtu.be"}
    mong_host -= {h.lower().removeprefix("www.")
                  for h in (bang.get("host_khong_lay_anh_bia") or [])}
    co = m.group(1) if m else ""
    thieu = sorted(h for h in mong_host if h not in co)
    thua = sorted(h for h in ({"douyin.com"} | {x.lower().removeprefix("www.")
                  for x in (bang.get("host_khong_lay_anh_bia") or [])})
                  if h in co)
    ok(bool(m) and not thieu and not thua,
       "7e · `HOST_TU_XEP` của LÕI khớp ĐÚNG thứ bảng khai cho phép lấy ảnh",
       f"thiếu={thieu} thừa={thua} · được: {co.strip()}")


# ── 8 · CHẠY THẬT hai nhánh mới: mp4 → khung hình · PDF → trang 1 ─────────
#
# Vế đọc-nguồn không nói gì về việc ffmpeg/pypdfium2 có RA ẢNH hay không. Bài
# học WO-071: một `egress.gui(_chay=)` sai tên tham số đi lọt mọi vế đọc-nguồn
# rồi chết trên job thật.
import subprocess as _sp                                           # noqa: E402
import shutil as _sh                                               # noqa: E402

_tam8 = Path(tempfile.mkdtemp(prefix="gn-anh8-"))
# mp4 THẬT bằng ffmpeg — 2 giây, để `-ss 1` có khung để lấy.
_co_ff = bool(_sh.which("ffmpeg"))
if _co_ff:
    _mp4 = _tam8 / "n.mp4"
    _sp.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
             "-i", "testsrc=size=320x240:rate=10:duration=2",
             "-pix_fmt", "yuv420p", str(_mp4)], capture_output=True)
    try:
        b8 = worker._frame_mp4(_mp4.read_bytes(), _tam8)
        ok(b8[:3] == b"\xff\xd8\xff",
           "8 · `_frame_mp4` ra JPEG THẬT (magic ffd8ff)",
           f"nhận {b8[:4]!r}")
        ok(len(b8) > 500, f"8a · và có nội dung ({len(b8)} byte)")
    except Exception as e:                                          # noqa: BLE001
        ok(False, "8 · `_frame_mp4` ra JPEG thật", f"{type(e).__name__}: {e}")
else:
    print("  bỏ qua 8 · không có `ffmpeg` trên máy này")

# PDF THẬT tối thiểu, viết tay — không thêm gói nào cho một fixture.
_pdf = (b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF\n")
try:
    b9 = worker._trang_dau_pdf(_pdf, _tam8)
    ok(b9[:4] == b"\x89PNG", "9 · `_trang_dau_pdf` ra PNG THẬT (magic 89504e47)",
       f"nhận {b9[:5]!r}")
    ok(len(b9) > 200, f"9a · và có nội dung ({len(b9)} byte)")
except Exception as e:                                              # noqa: BLE001
    ok(False, "9 · `_trang_dau_pdf` ra PNG thật", f"{type(e).__name__}: {e}")

# Bề rộng đọc từ BẢNG KHAI, không gõ trong mã (`M12-R4`).
import json as _js                                                  # noqa: E402
_ng = _js.loads((R / "chungcat" / "assets" / "nguong.json").read_text(encoding="utf-8"))
ok(isinstance(_ng.get("be_rong_anh_bia"), int),
   "10 · bề rộng ảnh bìa khai ở `nguong.json`, không gõ trong mã",
   f"được {_ng.get('be_rong_anh_bia')!r}")
_src10 = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
ok("640" not in _src10.split("def _be_rong_anh")[1].split("return")[0]
   if "def _be_rong_anh" in _src10 else False,
   "10a · và số đó KHÔNG lặp lại trong thân phép đọc (chỉ ở nhánh dự phòng)")
_sh.rmtree(_tam8, ignore_errors=True)



# ── 11 · WO-075 · CHỌN ảnh theo SỐ BYTE, và cho phép NGƯỜI ép sinh lại ────
src11 = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
i11 = src11.find("def _anh_bia_tu_url")
than11 = src11[i11:src11.index("\ndef ", i11 + 10)] if i11 >= 0 else ""
ok("st_size" in than11 and "reverse=True" in than11,
   "11 · chọn tệp ảnh LỚN NHẤT, không phải tệp đầu theo tên",
   "tên tệp không nói gì về chất lượng; một tấm gradient trống nén xuống vài KB")
ok("unlink" in than11,
   "11a · các bản thumbnail thừa được dọn — `--write-all` để lại nhiều tệp")

# `ep` — không có cờ này thì một bản ghi lỡ dính ảnh hỏng sẽ KẸT vĩnh viễn:
# mọi lần chạy lại đều bị chính luật "đã có ảnh ⇒ thôi" chặn, kèm câu lỗi nghe
# như đang làm đúng. Đây chính là ca đã xảy ra với bản ghi TikTok thật.
i12 = src11.find("def chien_luoc_anh_bia")
than12 = src11[i12:src11.index("\ndef ", i12 + 10)] if i12 >= 0 else ""
ok("ep" in than12.split("(")[1].split(")")[0],
   "11b · `chien_luoc_anh_bia` nhận cờ `ep` để NGƯỜI ép sinh lại")
ok("if not ep and any(" in than12,
   "11c · và cờ ấy CHỈ bỏ qua luật `đã có ảnh`, không bỏ qua luật nào khác",
   "ép mà bỏ qua cả allowlist là mở một cửa gọi ra ngoài không ai khai")
try:
    import importlib
    _w = importlib.import_module("worker")
    _fm = {"source_type": "video", "url": "https://www.tiktok.com/@a/video/12345",
           "media": [{"sha256": "aa" * 32, "mime": "image/jpeg", "ten_goc": "x.jpg",
                      "so_byte": 9}]}
    ok(_w.chien_luoc_anh_bia(_fm) is None,
       "11d · đã có ảnh + KHÔNG ép ⇒ None (tự động vẫn không đụng)")
    ok(_w.chien_luoc_anh_bia(_fm, True) == "url",
       "11e · đã có ảnh + ÉP ⇒ vẫn chạy — đây là đường thoát khỏi một ảnh hỏng")
    _fmd = {"source_type": "video",
            "url": "https://www.douyin.com/video/7300000000000000000"}
    ok(_w.chien_luoc_anh_bia(_fmd, True) is None,
       "11f · ÉP KHÔNG phá loại trừ douyin — cờ chỉ mở đúng một luật",
       "nếu đỏ: `ep` đang bỏ qua cả bảng khai `host_khong_lay_anh_bia`")
except Exception as e:
    ok(False, "11d-f · gọi được `chien_luoc_anh_bia` thật", str(e)[:160])


print(f"\n{loi} lỗi\n" if loi else "\nĐủ vế — thumbnail video URL\n")
sys.exit(1 if loi else 0)
