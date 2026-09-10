#!/usr/bin/env python
"""WO-078 · T12-34 — Việc MỚI phải thấy tiến độ của việc CŨ cùng `slug`.

Ảnh màn chủ dự án 2026-09-09: job `sinh-transcript` chết ở `dang-goi-model` vì
cửa Beeknoee trả 502. Hệ xử đúng — đánh hỏng, vào rác, giữ nguyên 151 cue đã
phiên âm. Rồi nó khuyên: *"Đã dùng hết 2 lần gửi. Cần nữa thì tạo VIỆC MỚI."*

Và việc mới **bắt đầu lại từ giây 0**, vì `duong_tien_do` khoá theo ULID.

Nên bản phiên âm 10:42 nằm ngay trên đĩa, hệ bảo người tạo việc mới, việc mới
không nhìn thấy nó. Đó là bug — không phải cái 502.

── Vì sao vế 4 (ÂM) quan trọng ngang vế 1 ──────────────────────────────────
Ghép tiến độ theo `slug` là một phép **đọc file của việc khác**. Ghép nhầm một
`slug` khác nghĩa là dán transcript của video A vào video B — và **không cổng
nào bắt được**, vì một `.vtt` của video A vẫn là một `.vtt` hợp lệ. Nên phép
kiểm âm ở đây không phải cho đủ bộ; nó là cái chặn duy nhất.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

loi = 0
NL = chr(10)


def ok(d, chu, them=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {chu}" + ("" if d else f"  <- {them}"))
    if not d:
        loi += 1


import vong  # noqa: E402
import worker  # noqa: E402

print("\nWO-078 · việc MỚI thấy tiến độ của việc CŨ cùng slug\n")

VTT = ("WEBVTT" + NL * 2
       + "00:00:00.000 --> 00:00:05.000" + NL + "Câu một." + NL * 2
       + "00:00:05.000 --> 00:10:42.000" + NL + "Câu cuối tới 10:42." + NL)

tam = Path(tempfile.mkdtemp(prefix="gn-td-"))
q = vong.HangDoi(str(tam))

SLUG = "video/thien-duong-chuot"
CU = "aa" * 16
MOI = "bb" * 16
KHAC = "cc" * 16

# Việc CŨ: đã phiên âm tới 10:42 rồi chết, nằm trong rác.
q.nap(CU, {"loai": "sinh-transcript", "slug": SLUG})
q.dat_giai_doan(CU, "dang-goi-model")
q.ghi_tien_do(CU, [{"tu": 0.0, "den": 5.0, "text": "Câu một."},
                   {"tu": 5.0, "den": 642.0, "text": "Câu cuối tới 10:42."}])
q.danh_hong(CU, "dang-goi-model", "502 Bad Gateway")

# Việc MỚI: cùng slug, chưa có tiến độ nào của riêng nó.
q.nap(MOI, {"loai": "sinh-transcript", "slug": SLUG})

# Việc của bản ghi KHÁC — bẫy cho vế âm.
q.nap(KHAC, {"loai": "sinh-transcript", "slug": "video/mot-video-khac"})

print("1 · Tìm được tiến độ cũ CÙNG slug\n")

ham = getattr(worker, "tien_do_cu_cung_slug", None)
ok(callable(ham), "1 · có hàm `tien_do_cu_cung_slug`",
   "chưa có ⇒ việc mới không có đường nào thấy 151 cue đang nằm trong rác")

if not callable(ham):
    cue_cu = []
else:
    cue_cu = ham(q, MOI, SLUG) or []
ok(len(cue_cu) == 2, f"1a · nạp đủ cue của việc cũ (được {len(cue_cu)})",
   "tiến độ nằm ở `rac/` — phép tìm phải quét CẢ ba ngăn, không chỉ `cur/`")
ok(cue_cu and abs(float(cue_cu[-1].get("den", 0)) - 642.0) < 0.01,
   "1b · giây cuối = 642 (10:42) — đúng chỗ để chạy tiếp",
   f"được {cue_cu[-1].get('den') if cue_cu else '(rỗng)'}")

print("\n2 · KHÔNG lấy tiến độ của bản ghi khác\n")

q.ghi_tien_do(KHAC, [{"tu": 0.0, "den": 999.0, "text": "Của video KHÁC."}])
lay = (ham(q, MOI, SLUG) or []) if callable(ham) else []
ok(all("KHÁC" not in str(c.get("text", "")) for c in lay),
   "2 · slug khác KHÔNG bị ghép vào",
   "dán transcript video A vào video B — và không cổng nào bắt, vì `.vtt` của "
   "A vẫn là một `.vtt` hợp lệ")

print("\n3 · Việc CÓ tiến độ riêng thì dùng của mình\n")

q.ghi_tien_do(MOI, [{"tu": 0.0, "den": 30.0, "text": "Của chính nó."}])
rieng = (ham(q, MOI, SLUG) or []) if callable(ham) else []
ok(len(rieng) == 1 and abs(float(rieng[0].get("den", 0)) - 30.0) < 0.01,
   "3 · tiến độ của CHÍNH nó thắng bản cũ",
   f"được {[c.get('den') for c in rieng]} — bản của mình mới là bản đang chạy")

print("\n4 · Worker THẬT gọi phép ấy\n")

src = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
i = src.find("def chay_sinh_transcript")
than = src[i:src.index(NL + "def ", i + 10)] if i >= 0 else ""
ok("tien_do_cu_cung_slug" in than,
   "4 · `chay_sinh_transcript` GỌI phép tìm tiến độ cũ",
   "viết hàm mà không ai gọi là một hàm chết — cổng phải nối hai đầu")

# Nói ra, không làm lặng lẽ: ghép transcript của một việc khác vào là một
# quyết định người cần biết.
ok("tiếp từ" in than or "tiep tu" in than,
   "4a · và IN RA rằng nó tiếp từ đâu",
   "ghép lặng lẽ thì người không phân biệt được 'chạy nhanh' với 'ghép nhầm'")

print("\n5 · `M12-R6` KHÔNG bị nới\n")

v_moi = q.doc(MOI)
ok(int(v_moi.get("lan_gui", 0)) == 0, "5 · việc mới `lan_gui` = 0",
   "việc mới là quyết định mới của NGƯỜI, có trần 2 lần của riêng nó")

vsrc = (R / "chungcat" / "src" / "vong.py").read_text(encoding="utf-8")
j = vsrc.find("def chay_lai")
than_cl = vsrc[j:vsrc.index(NL + "    def ", j + 10)] if j >= 0 else ""
ok('v["lan_gui"] >= TRAN_GUI' in than_cl,
   "5a · `chay_lai` VẪN chặn khi hết 2 lần gửi",
   "nới chỗ này là mở lại vòng lặp WO-066/WO-069 đã đóng")
ok("lan_gui\"] = 0" not in than_cl and "lan_gui'] = 0" not in than_cl,
   "5b · và KHÔNG chỗ nào reset `lan_gui` về 0")

if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — việc mới tiếp được việc cũ, không ghép nhầm, không nới R6{NL}")
