"""Nguồn DÀI phải cắt đoạn được — không bị chặn bởi một trần đặt sai chỗ.

Chủ dự án 2026-09-07, sau khi test E2E một video 58 phút:
*"video có 1 tiếng mà không xử lý được thì vứt"*.

BUG ĐO ĐƯỢC trên máy thật:

    [worker] c47f2bb1… · HỎNG · VuotTran: audio 37028349 byte > trần 33554432

`phien_am()` CẮT ĐOẠN ngay hai dòng bên dưới — nhưng trước đó nó so **cả
file** với `tran`, mà `tran` là trần của MỘT LỜI GỌI. Cả file không bao giờ đi
trong một lời gọi; các ĐOẠN mới đi. Nên phép so ấy phủ định đúng cái cơ chế
đứng ngay sau nó.

`_phien_am_mot_doan` đã chặn ĐÚNG rồi: nó so từng đoạn (sau nén, sau base64)
với `tran_than_cua_byte`. Đó là chỗ duy nhất phép so ấy có nghĩa.

HAI TRẦN, HAI CHỦ — và chỉ một cái nới được:

    tran_video_byte · tran_audio_byte · tran_giay   ⇒ CỦA TA, nới được
    tran_than_cua_byte (8 MiB)                      ⇒ CỦA CỬA, nới KHÔNG được

Nới số 8 MiB trong bảng khai của ta không làm cửa họ nhận thêm; nó chỉ khiến
ta gửi đi rồi bị từ chối, và mất một lần `lan_gui`.

0 mạng · 0 model · 0 ffmpeg (dùng file giả).
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


print("\nnguồn dài · cắt đoạn\n")

import asr_cua  # noqa: E402

# ── 1 · KHÔNG so cả file với trần MỘT LỜI GỌI ───────────────────────────
ma = inspect.getsource(asr_cua.phien_am)
ok("goc_byte > tran" not in ma,
   "1 · `phien_am` KHÔNG chặn cả file bằng trần một-lời-gọi",
   "cả file không bao giờ đi trong một lời gọi — các ĐOẠN mới đi; phép so ấy "
   "phủ định đúng cơ chế cắt đoạn đứng ngay sau nó")

# ── 2 · phép chặn ĐÚNG vẫn còn: theo TỪNG ĐOẠN ──────────────────────────
ma1 = inspect.getsource(asr_cua._phien_am_mot_doan)
ok("tran_than_cua_byte" in ma1,
   "2 · từng ĐOẠN vẫn bị chặn bằng trần thân của CỬA",
   "bỏ luôn phép chặn là gửi một thân 18 MB rồi ăn từ chối và mất một `lan_gui`")

# ── 3 · một video 58 phút CẮT ĐƯỢC thành đoạn lọt trần ──────────────────
#
# Tính bằng số, không cần ffmpeg: `cat_doan` cắt mỗi `GIAY_MOI_DOAN` giây và
# nén mono 16 kHz 32 kbps. Nếu phép tính này không lọt thì cắt đoạn vô nghĩa.
PHUT = 58.4
tran_than = json.loads(
    (GOC / "chungcat/assets/nguon-transcript.json").read_text(encoding="utf-8")
)["tran_than_cua_byte"]
# Doc tu BANG KHAI, khong tu mot hang trong ma: chu du an van con so nay o
# `nguong.json` (loi A, 600 -> 300), va mot cong doc hang cu se xanh trong khi
# he chay mot con so khac.
giay_doan = asr_cua.giay_moi_doan_mac_dinh()
so_doan = int(PHUT * 60 // giay_doan) + 1
byte_doan = giay_doan * 32_000 // 8              # 32 kbps
than_doan = byte_doan * 4 // 3 + 2048            # base64 + bao JSON
ok(than_doan < tran_than,
   f"3 · đoạn {giay_doan // 60} phút ⇒ thân ~{than_doan // 1048576} MB "
   f"< trần {tran_than // 1048576} MB",
   "nếu một đoạn cũng không lọt thì `GIAY_MOI_DOAN` đang đặt sai")
ok(so_doan <= 12,
   f"3b · video {PHUT} phút ra {so_doan} đoạn — số lời gọi còn hợp lý")

# ── 4 · trần CỦA TA đủ rộng cho một video một tiếng ─────────────────────
b = json.loads((GOC / "chungcat/assets/nguon-transcript.json").read_text(encoding="utf-8"))
ok(b["tran_giay"] >= 3600, f"4 · `tran_giay` ≥ 60 phút ({b['tran_giay']}s)")
ok(b["tran_audio_byte"] >= 100 * 1048576,
   f"4b · `tran_audio_byte` ≥ 100 MB ({b['tran_audio_byte'] // 1048576} MB)",
   "audio 58 phút chưa nén là ~37 MB — trần phải rộng hơn thứ nó chặn")

# ── 5 · trần truyền vào `phien_am` KHÔNG được là trần payload chung ─────
#
# `nguong.json.tran_payload_byte` (32 MiB) là trần payload JSON của chưng cất.
# Mượn nó cho audio là mượn số của một bài toán khác — và nó chính là con số
# đã chặn video 58 phút của chủ dự án.
maw = (GOC / "chungcat/src/worker.py").read_text(encoding="utf-8")
i = maw.find("asr_cua.phien_am(")
than = maw[i:i + 500] if i > 0 else ""
ok("doc_tran_payload" not in than,
   "5 · worker KHÔNG truyền `tran_payload_byte` làm trần audio",
   "32 MiB ấy là trần payload JSON của chưng cất; nó đã chặn đúng video 58 "
   "phút của chủ dự án bằng một con số của bài toán khác")

print(f"\n{'ĐỎ — %d vế' % loi if loi else 'pass · nguồn dài cắt được, trần chặn đúng chỗ'}")
sys.exit(1 if loi else 0)
