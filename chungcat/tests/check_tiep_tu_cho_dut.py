# -*- coding: utf-8 -*-
"""Model dừng giữa chừng ⇒ TIẾP TỪ CHỖ ĐỨT, không thử lại cả đoạn.

ĐỎ_KHI   vòng lặp cắt theo ranh CỨNG rồi thử lại nguyên đoạn · không có cận
         số vòng · một vòng không tiến thêm giây nào mà vẫn chạy tiếp
XANH_KHI mốc đoạn sau = chỗ cue cuối DỪNG · có cận vòng ở bảng khai · vòng
         không tiến ⇒ NÉM

VÌ SAO — chủ dự án 2026-09-08:

    *"Nếu model dừng: note bản đã transcript vào /tmp tạm nào đó, tự động gửi
    lại request với thời gian từ lúc bị ngắt… tuần tự như vậy và dừng khi
    transcript end time."*

Lối này hơn hẳn phép thử-lại tôi làm trước đó, và hơn ở chỗ đo được:

  · thử lại cả đoạn = **trả tiền lại** cho phần đã phiên âm đúng, rồi bốc lại
    xúc xắc trên cùng một quãng
  · tiếp từ chỗ đứt = mỗi lời gọi **chỉ trả tiền cho phần chưa có**, và mỗi
    lời gọi đều TIẾN TỚI

Nên truncation thôi là một *lỗi*: nó thành một tín hiệu điều khiển vòng lặp.

`M12-R6` KHÔNG bị đụng, và không cần nới: luật viết sẵn *"một lần THỬ = một
lượt phiên âm trọn nguồn — chia bao nhiêu ĐOẠN cũng tính MỘT"*. Đây đúng là
*"request ngầm"* trong cách gọi của chủ dự án; `lan_gui` vẫn đếm *request của
user*.

Hai cận bắt buộc, vì một vòng lặp gọi model mà không có cận là một hoá đơn
không có cận:
  · `tran_vong_asr` — số vòng tối đa cho MỘT nguồn
  · vòng không tiến thêm giây nào ⇒ NÉM ngay, không quay tiếp
"""
import ast
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
ma = (GOC / "src" / "asr_cua.py").read_text(encoding="utf-8")
bang = json.loads((GOC / "assets" / "nguong.json").read_text(encoding="utf-8"))
loi = 0


def kiem(dat, cau, vi_sao=""):
    global loi
    print(f"  {'ok  ' if dat else 'FAIL'} {cau}")
    if not dat:
        if vi_sao:
            print(f"       {vi_sao}")
        loi += 1


print("\ntiếp từ chỗ đứt · có cận\n")

# ── 1 · cận số vòng ở BẢNG KHAI ─────────────────────────────────────────
kiem("tran_vong_asr" in bang,
     "1 · `nguong.json` khai `tran_vong_asr`",
     "một vòng lặp gọi model mà không có cận là một hoá đơn không có cận")
kiem(isinstance(bang.get("tran_vong_asr"), int)
     and 4 <= bang.get("tran_vong_asr", 0) <= 40,
     f"1b · `tran_vong_asr` trong khoảng 4..40 (đang {bang.get('tran_vong_asr')})",
     "quá nhỏ thì video dài không xong; quá lớn thì một nguồn hỏng đốt tiền")
kiem("tran_vong_asr" in ma, "1c · mã đọc `tran_vong_asr` từ bảng khai")

# Chuyển từ `check_doan_thu_lai` (xoá 2026-09-08 — nó đo thiết kế THỬ LẠI đã
# bị thay bằng *tiếp từ chỗ đứt*). Lối A của chủ dự án vẫn phải giữ, và nó là
# một con số CHI PHÍ nên phải vặn được ở bảng khai.
kiem(bang.get("giay_moi_doan_asr") == 300,
     f"1d · `giay_moi_doan_asr` = 300 — lối A "
     f"(đang {bang.get('giay_moi_doan_asr')})")
kiem("giay_moi_doan_asr" in ma, "1e · mã đọc `giay_moi_doan_asr` từ bảng khai")

# ── 2 · vòng lặp TIẾP TỪ CHỖ ĐỨT ────────────────────────────────────────
i = ma.index("def phien_am")
than = ma[i:ma.index("\ndef ", i + 10)]
than_ma = re.sub(r"#.*", "", than)          # bỏ chú thích trước khi đo

kiem("while" in than_ma,
     "2 · `phien_am` dùng vòng `while` theo mốc, không `for` theo ranh cứng",
     "ranh cứng thì một đoạn cụt để lại một lỗ, và lỗ ấy không ai lấp")
kiem(not re.search(r"for\s+\w+\s*,\s*\w+\s+in\s+doan", than_ma),
     "2b · KHÔNG còn `for … in doan` cắt sẵn toàn bộ",
     "cắt sẵn là quyết trước mọi ranh, trong khi ranh phải do KẾT QUẢ quyết")

# ── 3 · mốc kế tiếp lấy từ CHỖ CUE CUỐI DỪNG ────────────────────────────
kiem(re.search(r"(moc|mốc)\s*=.*(den|het|cuoi)", than_ma) is not None
     or "moc = " in than_ma,
     "3 · mốc vòng sau dẫn từ cue cuối",
     "cộng một hằng là quay lại đúng ranh cứng vừa bỏ")

# ── 4 · KHÔNG TIẾN ⇒ NÉM ────────────────────────────────────────────────
kiem("raise" in than_ma,
     "4 · vòng không tiến thêm giây nào thì NÉM",
     "quay tiếp trên một mốc không đổi là một vòng lặp vô hạn có hoá đơn")

# ── 5 · `M12-R6` giữ nguyên: KHÔNG đếm `lan_gui` trong vòng ────────────
kiem("ghi_nhan_gui(" not in than_ma,
     "5 · vòng ngầm KHÔNG đụng `lan_gui`",
     "`M12-R6` viết sẵn *một lần THỬ = một lượt trọn nguồn, chia bao nhiêu "
     "đoạn cũng tính MỘT* — đếm ở đây là đọc luật ngược")

# ── 6 · tiến độ vẫn được ghi ra file (chủ dự án: *note vào /tmp*) ───────
kiem("ghi_nhan" in than_ma,
     "6 · vẫn truyền `ghi_nhan` — mỗi cue vào file tiến độ ngay",
     "*'note bản đã transcript vào tmp'* đã có sẵn ở `vong.ghi_tien_do`; bỏ "
     "móc này là mất phần đã trả tiền khi vòng sau chết")

print()
if loi:
    sys.exit(f"ĐỎ — {loi} vế")
print("pass · mỗi lời gọi tiến tới, có cận, và M12-R6 không bị đụng")
