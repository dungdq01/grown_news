"""T12-27 · TIẾN ĐỘ tải video — người phải THẤY, không chỉ nhận một toast.

Chủ dự án 2026-09-06: *"phải có tab hiển thị tiến trình tải chứ chỉ hiện thông
báo như trên thì sao biết tải về được hay chưa?"*.

Một câu *"đang tải…"* rồi im lặng năm phút là một màn không phân biệt được với
một màn đã chết. Với file hàng trăm MB, khoảng im lặng ấy đủ dài để người bấm
lại lần nữa — và lần bấm ấy tạo một job thứ hai tải cùng một thứ.

0 mạng · 0 model.
"""
from __future__ import annotations

import inspect
import json
import sys
import tempfile
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "chungcat" / "src"))

loi = 0


def ok(d, cau, vs=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {cau}" + ("" if d or not vs else f"  {vs}"))
    if not d:
        loi += 1


print("\nT12-27 · tiến độ tải video\n")

import vong  # noqa: E402
import worker  # noqa: E402

# ── 1 · đọc được TỪNG DÒNG, không đợi xong mới biết ──────────────────────
#
# `subprocess.run(capture_output=True)` gom hết output rồi mới trả — nghĩa là
# tiến độ chỉ có SAU KHI tải xong, tức không còn là tiến độ.
ma = inspect.getsource(worker.chay_tai_video)
ok("Popen" in ma, "1 · chạy `yt-dlp` bằng `Popen` — đọc được từng dòng",
   "`subprocess.run` gom hết output rồi mới trả: tiến độ chỉ có SAU KHI xong")
# Cờ nằm ở nơi DỰNG LỆNH (`tai_nguon`), không ở nơi CHẠY lệnh (`worker`) —
# bản đầu của vế này soi nhầm module rồi đỏ oan một mã đúng.
import tai_nguon  # noqa: E402

ok("--newline" in inspect.getsource(tai_nguon.lenh_tai_video),
   "1b · lệnh mang `--newline` để yt-dlp xuống dòng mỗi nhịp",
   "không có nó thì yt-dlp ghi đè một dòng bằng CR và bên đọc thấy MỘT dòng dài")

# ── 2 · phân tích được dòng tiến độ THẬT của yt-dlp ─────────────────────
ok(hasattr(worker, "doc_dong_tien_do"), "2 · có `doc_dong_tien_do`")
if hasattr(worker, "doc_dong_tien_do"):
    d = worker.doc_dong_tien_do(
        "[download]  12.3% of  45.67MiB at    1.20MiB/s ETA 00:30")
    ok(isinstance(d, dict) and abs((d or {}).get("phan_tram", 0) - 12.3) < 0.01,
       f"2b · đọc đúng phần trăm ({(d or {}).get('phan_tram')})")
    ok((d or {}).get("tong") and (d or {}).get("toc_do"),
       f"2c · đọc cả cỡ file và tốc độ ({(d or {}).get('tong')} · {(d or {}).get('toc_do')})",
       "phần trăm một mình không nói được *còn bao lâu*")
    ok(worker.doc_dong_tien_do("[youtube] Extracting URL: https://…") is None,
       "2d · dòng KHÔNG phải tiến độ ⇒ trả `None`, không đoán bừa")

# ── 3 · ghi tiến độ NGUYÊN TỬ, và lỗi ghi KHÔNG giết job ────────────────
ok(hasattr(vong.HangDoi, "ghi_tien_do_tai"), "3 · `HangDoi.ghi_tien_do_tai`")
if hasattr(vong.HangDoi, "ghi_tien_do_tai"):
    src = inspect.getsource(vong.HangDoi.ghi_tien_do_tai)
    ok("os.replace" in src or "replace(" in src,
       "3b · ghi NGUYÊN TỬ (`os.replace`)",
       "người đang NHÌN màn trong lúc file được ghi lại mỗi nhịp; ghi thẳng "
       "vào đích thì có khoảnh khắc file chỉ có nửa nội dung")
    ok("except" in src,
       "3c · ghi trượt KHÔNG giết job",
       "làm chết một job đã tiêu băng thông vì không ghi được một file HIỂN "
       "THỊ là đánh đổi sai chiều")

    with tempfile.TemporaryDirectory() as tmp:
        q = vong.HangDoi(Path(tmp))
        q.ghi_tien_do_tai("01M1TESTULID0000000000000A", {"phan_tram": 42.0})
        d2 = q.doc_tien_do("01M1TESTULID0000000000000A")
        ok(isinstance(d2, dict) and d2.get("phan_tram") == 42.0,
           "3d · ghi rồi đọc lại ra đúng số")

# ── 4 · cửa `/viec/<id>` trả tiến độ cho `tai-video` ───────────────────
api = (GOC / "chungcat/src/api.py").read_text(encoding="utf-8")
ok('"tai-video"' in api,
   "4 · `api.py` gắn `tien_do` cho việc `tai-video`",
   "`T12-19` chỉ mở cho `sinh-transcript`; FE không đọc được thứ không ai trả")

# ── 5 · giai đoạn phải nằm trong TỪ VỰNG ĐÃ KHAI ────────────────────────
#
# Bug thật 2026-09-06: tôi đặt `giai_doan="tai"`, `dat_giai_doan` ném
# `ValueError: giai đoạn lạ: tai`, và job CHẾT NGAY ở nhịp đầu — mà mọi cổng
# vẫn xanh vì không vế nào chạm tới đó. Một chuỗi giai đoạn tự nghĩ là một
# hợp đồng tự viết cho mình.
import re as _re  # noqa: E402

_dung = set(_re.findall(r'dat_giai_doan\(ulid, "([a-z-]+)"\)', ma)) \
    | set(_re.findall(r'ViecHong\("([a-z-]+)"', ma))
for g in sorted(_dung):
    ok(g in vong.GIAI_DOAN, f"5 · giai đoạn `{g}` có trong `GIAI_DOAN`",
       "từ vựng đã khai: " + " · ".join(vong.GIAI_DOAN))

print(f"\n{'ĐỎ — %d vế' % loi if loi else 'pass · tiến độ tải nhìn thấy được'}")
sys.exit(1 if loi else 0)
