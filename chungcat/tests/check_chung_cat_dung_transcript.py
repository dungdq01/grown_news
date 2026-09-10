"""T12-27 · chưng cất một VIDEO phải dùng TRANSCRIPT, và transcript để lại con trỏ.

Chủ dự án 2026-09-07: *"sau khi có bản transcript rồi thì mới hiển thị button
chưng cất, bấm vào thì bản transcript mới truyền vào làm input"*.

HAI LỖ, MỘT GỐC — đo được cùng ngày:

  1 · `ket_qua` của MỌI việc `sinh-transcript` là **`null`**.
      `chay_sinh_transcript` trả `{sha256, cue, model_asr}` nhưng không gọi
      `ghi_ket_qua`, còn `mot_vong` chỉ giữ khoá `citations`.

  2 · `_doc_nguon` đọc `than` của bản ghi. Với video đăng ký bằng URL, `than`
      là phần MÔ TẢ người gõ tay — vài dòng. Nên "chưng cất video" hôm nay là
      chưng cất phần mô tả, và model được yêu cầu dựng một bài đủ khung từ vài
      dòng: nó chỉ còn cách bịa.

Loại lỗi thứ hai KHÔNG tự lộ: bản nháp vẫn ra, vẫn đủ mục, vẫn qua `validate`.
Chỉ người ĐỌC mới thấy nó rỗng. Đó là lý do cổng này phải tồn tại.

0 mạng · 0 model.
"""
from __future__ import annotations

import inspect
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "chungcat" / "src"))

loi = 0


def ok(d, cau, vs=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {cau}" + ("" if d or not vs else f"  {vs}"))
    if not d:
        loi += 1


print("\nT12-27 · chưng cất video dùng transcript\n")

import worker  # noqa: E402

# ── 1 · transcript ĐỂ LẠI CON TRỎ ────────────────────────────────────────
ma_tr = inspect.getsource(worker.chay_sinh_transcript)
ok("ghi_ket_qua" in ma_tr,
   "1 · `chay_sinh_transcript` ghi `ket_qua`",
   "một việc không để lại con trỏ tới sản phẩm của nó là một việc không ai "
   "kiểm được — và chưng cất không tra được transcript để dùng")
ok("sha256" in ma_tr.split("ghi_ket_qua")[-1][:200] if "ghi_ket_qua" in ma_tr else False,
   "1b · con trỏ mang `sha256`",
   "sha là địa chỉ DUY NHẤT lấy lại được byte; `slug` không đủ vì một bản ghi "
   "phiên âm được nhiều lần")

# ── 2 · có đường đọc transcript làm nguyên liệu ──────────────────────────
ok(hasattr(worker, "_doc_transcript") or hasattr(worker, "doc_transcript"),
   "2 · có hàm đọc NỘI DUNG transcript của một bản ghi")
ok(hasattr(worker, "vtt_sang_van"),
   "2b · có hàm đổi VTT → văn xuôi",
   "đưa nguyên file `.vtt` cho model là đưa cả mốc giờ và số thứ tự — tốn "
   "token cho thứ không mang nghĩa")
if hasattr(worker, "vtt_sang_van"):
    v = worker.vtt_sang_van(
        "WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nXin chào\n\n"
        "2\n00:00:03.000 --> 00:00:05.000\nhôm nay\n")
    ok("Xin chào" in v and "hôm nay" in v, f"2c · giữ đủ chữ ({v[:40]!r})")
    ok("-->" not in v and "WEBVTT" not in v, "2d · bỏ mốc giờ và tiêu đề")

# ── 3 · chưng cất RẼ THEO LOẠI ──────────────────────────────────────────
ma_cc = inspect.getsource(worker.chay_chung_cat)
ok("video" in ma_cc,
   "3 · `chay_chung_cat` biết bản ghi video là ca riêng")
ok("_doc_transcript" in ma_cc or "doc_transcript" in ma_cc,
   "3b · và nó lấy transcript làm nguyên liệu")

# ── 4 · CHƯA có transcript ⇒ NÉM, không rơi về `than` ───────────────────
#
# Rơi về mô tả là im lặng làm một việc KHÁC việc người bấm — và họ chỉ biết
# khi đọc bản nháp rỗng. Một lỗi ồn ào tốt hơn một kết quả sai im lặng.
ok("transcript" in ma_cc and "ViecHong" in ma_cc,
   "4 · chưa có transcript ⇒ NÉM `ViecHong`")
{}
ok(any(t in ma_cc for t in ("sinh transcript trước", "Sinh transcript")),
   "4b · câu ném CHỈ ĐƯỜNG — nói phải sinh transcript trước",
   "một câu lỗi không nói bước tiếp theo bắt người đi đoán")

# ── 5 · bản ghi VĂN BẢN giữ nguyên đường cũ ─────────────────────────────
ok("_doc_nguon" in ma_cc,
   "5 · loại khác vẫn đi `_doc_nguon` (`than`) — KHÔNG đụng đường đã chốt",
   "chủ dự án dặn *chỉ làm thêm, không sửa các tính năng đã chốt*")

print(f"\n{'ĐỎ — %d vế' % loi if loi else 'pass · video chưng cất từ transcript, transcript có con trỏ'}")
sys.exit(1 if loi else 0)
