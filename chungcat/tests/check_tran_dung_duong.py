# -*- coding: utf-8 -*-
"""Mỗi đường gửi dùng ĐÚNG trần của nó, và mọi tên dùng đều import được.

ĐỎ_KHI   `chay_chung_cat` dùng trần AUDIO cho payload JSON · một hàm dùng
         `tai_nguon` mà không có nó trong phạm vi · `import` lặp trong hàm
XANH_KHI chưng cất → `doc_tran_payload` · ASR/tải → trần của `tai_nguon` ·
         `tai_nguon` import MỘT lần ở tầng module

VÌ SAO — đây là hoá đơn của một lần tôi sửa hai chỗ khi chỉ được sửa một:

Bản đã commit (`b7ab3f8`) dùng ĐÚNG:
    chay_chung_cat      tran=bang_khai.doc_tran_payload(...)   ← 32 MiB, AC-6.4
    chay_sinh_transcript tran=bang_khai.doc_tran_payload(...)  ← SAI cho audio

Tôi vá ca thứ hai (video 58 phút vượt trần payload) và đổi **CẢ HAI** thành
`tai_nguon.doc_bang()["tran_audio_byte"]`. Hai hậu quả trên đường chưng cất:

  1. `NameError: name 'tai_nguon' is not defined` — `chay_chung_cat` KHÔNG có
     `import tai_nguon` (ba hàm khác import CỤC BỘ, hàm này không).
  2. Kể cả import được thì trần AUDIO (500 MB) áp cho một payload JSON, trong
     khi `AC-6.4` khai 32 MiB. Nới 15 lần, im lặng.

Và nó đắt đúng theo cách khó thấy nhất: `ghi_nhan_gui()` đếm TRƯỚC khi gửi
(cố ý — "trần là trần thật"), còn `NameError` nổ lúc DỰNG THAM SỐ, tức trước cả
lời gọi. Nên một việc thật của chủ dự án tiêu hết `lan_gui 2/2` với **0 dòng
egress**, rồi nằm ở `cho` vĩnh viễn. Đo được: `egress.*.jsonl` không có dòng
nào mang ULID ấy.

⇒ Import ở TẦNG MODULE, một lần. `import` cục bộ rải trong hàm là cách để lỗi
này quay lại: người thêm một chỗ dùng thứ tư sẽ lại quên.
"""
import ast
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
SRC = GOC / "src" / "worker.py"

loi = 0


def kiem(dat: bool, cau: str, vi_sao: str = "") -> None:
    global loi
    print(f"  {'ok  ' if dat else 'FAIL'} {cau}")
    if not dat:
        if vi_sao:
            print(f"       {vi_sao}")
        loi += 1


print("\ntrần đúng đường · tên import được\n")

cay = ast.parse(SRC.read_text(encoding="utf-8"))

# ── 1 · `tai_nguon` import MỘT lần, ở tầng module ─────────────────────────
mo_module = {a.name for n in cay.body if isinstance(n, ast.Import)
             for a in n.names}
kiem("tai_nguon" in mo_module,
     "1 · `tai_nguon` import ở TẦNG MODULE",
     "import cục bộ rải trong hàm ⇒ hàm thứ tư dùng nó sẽ lại NameError")

cuc_bo = [n.lineno for n in ast.walk(cay)
          if isinstance(n, ast.Import)
          and any(a.name == "tai_nguon" for a in n.names)
          and n not in cay.body]
kiem(not cuc_bo,
     "1b · KHÔNG còn `import tai_nguon` cục bộ",
     f"còn ở dòng {cuc_bo} — hai nguồn cho một tên là hai chỗ để lệch")

# ── 2 · vì sao KHÔNG tự viết phép phân giải tên ─────────────────────────
#
# Lượt đầu tôi viết một phép quét `ast` hỏi *"mọi tên trong hàm này có giải
# được không"*. Nó ĐỎ OAN 8 hàm: nó không biết biến của comprehension, `global`,
# hàm lồng, `:=`, `except as`. Tức nó là **bản thứ hai của chính cơ chế tên của
# Python** — và bản thứ hai bao giờ cũng là bản sai trước.
#
# Đỏ oan tệ hơn thiếu một vế: nó dạy người đọc bỏ qua màu đỏ, mà màu đỏ là thứ
# duy nhất cổng có. Đo 2026-09-07: `pyflakes` · `ruff` · `flake8` đều CHƯA CÀI
# trong `.venv`, nên không có công cụ thật để hỏi câu ấy.
#
# ⇒ Vế 1 đã bảo đảm đúng điều cần: `tai_nguon` ở tầng module thì MỌI hàm thấy
# nó, và không còn `import` cục bộ nào để ai đó quên. Đó là phép chặn tại
# NGUYÊN NHÂN, không phải một phép quét đoán hậu quả.
#
# Muốn vế "mọi tên giải được" thật thì cài `ruff` rồi gọi
# `ruff check --select F821` — một dòng, và nó đúng vì nó không phải bản thứ hai.

# ── 3 · trần đúng đường ──────────────────────────────────────────────────
DUNG = {
    "chay_chung_cat": ("doc_tran_payload",
                       "payload JSON của chưng cất — `AC-6.4` khai 32 MiB"),
    "chay_sinh_transcript": ("tran_audio_byte",
                             "byte AUDIO, không phải payload JSON"),
}
for f in [x for x in cay.body if isinstance(x, ast.FunctionDef)]:
    if f.name not in DUNG:
        continue
    can, vi_sao = DUNG[f.name]
    goi = [n for n in ast.walk(f) if isinstance(n, ast.keyword) and n.arg == "tran"]
    kiem(bool(goi), f"3 · `{f.name}` truyền `tran=`")
    txt = " ".join(ast.unparse(g.value) for g in goi)
    kiem(can in txt, f"3b · `{f.name}` dùng `{can}`",
         f"{vi_sao} — đang dùng: {txt[:70]}")

print()
if loi:
    sys.exit(f"ĐỎ — {loi} vế")
print("pass · mỗi đường một trần đúng, và mọi tên giải được")
