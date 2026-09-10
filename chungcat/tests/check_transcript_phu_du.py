# -*- coding: utf-8 -*-
"""Một đoạn phiên âm phải PHỦ gần trọn đoạn ấy — cụt là LỖI, không phải kết quả.

ĐỎ_KHI   cue cuối của một đoạn kết thúc quá sớm so với độ dài đoạn mà mã vẫn
         trả về như bình thường · `finish_reason` không được kiểm
XANH_KHI thiếu phủ ⇒ NÉM một lỗi nói rõ phủ bao nhiêu / cần bao nhiêu

VÌ SAO — đo trên hai bản ghi THẬT của chủ dự án 2026-09-08:

    cai-dat (31 phút)          hermes (50 phút)
     đoạn 0:  9:47 / 10:00      đoạn 0:  0:00 / 10:00   ← 1 cue duy nhất
     đoạn 1:  2:06 / 10:00      đoạn 1:  6:47 / 10:00
     đoạn 2:  1:37 / 10:00      đoạn 2:  2:03 / 10:00
     đoạn 3:  1:31 / 10:00      đoạn 3:  0:18 / 10:00
                                đoạn 4:  1:56 / 10:00
    phủ ~48%                    đoạn 5:  0:21 / 10:00

Chủ dự án báo: *"video 7 phút nhưng transcript chỉ chạy 2 phút; video 29 phút
thì chỉ transcript được 21 phút"*.

`cat_doan` cắt ĐÚNG và `_phien_am_mot_doan` cộng `moc` ĐÚNG — tôi đã đo cả hai.
Hỏng ở chỗ khác: **model trả bản phiên âm CỤT cho từng đoạn, và mã nhận nó như
một kết quả đủ.** `finish_reason` có trong phản hồi và KHÔNG ai đọc nó.

Đây là lớp lỗi đắt nhất của hệ này: một kết quả sai IM LẶNG. Việc chạy xong,
`.vtt` hợp lệ, `.vtt` mở được, thẻ báo `xong` — và một nửa video biến mất.
Chỉ người NGHE lại mới biết.

⇒ Bất biến: **phủ hoặc ném.** Một bản phiên âm nửa vời không được đi tiếp,
vì mọi thứ sau nó (chưng cất, trích dẫn) sẽ đứng trên một nguồn khuyết mà
không ai khai.
"""
import ast
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src" / "asr_cua.py"
ma = SRC.read_text(encoding="utf-8")
cay = ast.parse(ma)
loi = 0


def kiem(dat, cau, vi_sao=""):
    global loi
    print(f"  {'ok  ' if dat else 'FAIL'} {cau}")
    if not dat:
        if vi_sao:
            print(f"       {vi_sao}")
        loi += 1


print("\ntranscript phải PHỦ đủ đoạn\n")

# ── 1 · `finish_reason` phải được ĐỌC ────────────────────────────────────
kiem('finish_reason' in ma.replace("#", "\x00").split("\x00")[0] or
     any('finish_reason' in ast.unparse(n) for n in ast.walk(cay)
         if isinstance(n, (ast.Subscript, ast.Call, ast.Compare))),
     "1 · `finish_reason` được ĐỌC trong mã, không chỉ nhắc trong chú thích",
     "cửa nói thẳng nó cắt vì hết token, và ta không nghe")

# ── 2 · có phép đo ĐỘ PHỦ ───────────────────────────────────────────────
ten_ham = {n.name for n in ast.walk(cay)
           if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
kiem("kiem_phu" in ten_ham or "do_phu" in ten_ham,
     "2 · có hàm đo độ phủ của một đoạn",
     "không đo thì không biết thiếu — và cụt trông y hệt đủ")

# ── 3 · thiếu phủ ⇒ NÉM, không trả về im lặng ───────────────────────────
{
}
than_kiem = ""
for n in ast.walk(cay):
    if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and \
            n.name in ("kiem_phu", "do_phu"):
        than_kiem = ast.unparse(n)
kiem("raise" in than_kiem,
     "3 · thiếu phủ thì NÉM",
     "trả về một bản nửa vời là để mọi thứ sau nó đứng trên một nguồn khuyết "
     "mà không ai khai")

# ── 4 · và câu lỗi phải nói RA CON SỐ ───────────────────────────────────
kiem(any(k in than_kiem for k in ("phu", "giay", "%")),
     "4 · câu lỗi mang con số phủ được / cần",
     "*'phiên âm cụt'* không nói cho ai biết vặn chỗ nào; *'phủ 2:06 / 10:00'* "
     "thì nói")

# ── 5 · `_phien_am_mot_doan` GỌI phép kiểm ấy ───────────────────────────
than_doan = ""
for n in ast.walk(cay):
    if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and \
            n.name == "_phien_am_mot_doan":
        than_doan = ast.unparse(n)
kiem(any(k in than_doan for k in ("kiem_phu(", "do_phu(")),
     "5 · `_phien_am_mot_doan` gọi phép kiểm phủ",
     "một hàm kiểm không ai gọi là một hàm không kiểm gì")

print()
if loi:
    sys.exit(f"ĐỎ — {loi} vế")
print("pass · phủ hoặc ném; không có bản phiên âm cụt đi tiếp im lặng")
