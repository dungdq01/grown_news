#!/usr/bin/env python
"""WO-084 · T12-38 — Phản hồi BỊ CẮT phải nói nó bị cắt.

Job thật của chủ dự án, hỏng HAI lượt trên cùng bản ghi
(`video/mo-mang-tam-mat-sau-khi-xem-chi-lauren-xai-ai`):

    HinhDangSai: [chung-cat] phản hồi không phải JSON sau khi gỡ khung:
    '{\\n  "text": "## 1. Overview\\nTài liệu ghi lại buổi chia sẻ … Khi mớ'

Câu ấy gửi người sửa đi sai hướng. `_boc` đòi đúng `{"text", "quotes"}`, nên
`{"text": …}` **chính là** hình dạng hợp đồng; và 300 ký tự đầu là JSON hợp lệ.
Chỗ vỡ ở CUỐI — chuỗi bị cắt trước khi `"` đóng và trước khi `quotes` xuất
hiện. Tức phản hồi **hết token**, không sai hình dạng.

── Vì sao vế 3 nặng ngang vế 2 ─────────────────────────────────────────────
Sửa quá tay thì mọi `JSONDecodeError` đều bị quy cho "bị cắt", và lần sau khi
cửa trả một phản hồi hỏng THẬT (JSON sai dấu, hay một trang HTML lỗi) thì câu
báo lại chỉ sai hướng theo chiều ngược. Một chẩn đoán chỉ có giá trị khi nó
biết nói KHÔNG.

── Vì sao CHẠY, không grep ─────────────────────────────────────────────────
`grep "finish_reason"` xanh ngay cả khi mã đọc rồi bỏ đấy. Cổng này bơm phản
hồi GIẢ qua `_gui` — đúng khuôn `check_thu_lai_ngam.py` — rồi đọc CÂU đi ra.
0 mạng · 0 model.
"""
from __future__ import annotations

import json
import os
import sys
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


from adapter import hop_dong  # noqa: E402
from adapter import openai as ad_openai  # noqa: E402

print("\nWO-084 · phản hồi bị cắt phải NÓI nó bị cắt\n")

NG = json.loads((R / "chungcat" / "assets" / "nguong.json")
                .read_text(encoding="utf-8"))
SRC_OA = (R / "chungcat" / "src" / "adapter" / "openai.py").read_text(encoding="utf-8")
SRC_GG = (R / "chungcat" / "src" / "adapter" / "google.py").read_text(encoding="utf-8")

# ── 1 · Trần chữ KHAI Ở BẢNG, cả hai adapter cùng đọc ────────────────────
print("1 · Trần chữ của lối chưng cất khai ở bảng, không gõ trong mã\n")

tran = NG.get("tran_chu_chung_cat")
ok(isinstance(tran, int) and tran >= 4096,
   f"1 · `nguong.json` khai `tran_chu_chung_cat` (được {tran!r})",
   "lối transcript khai `TRAN_CHU = 65536` từ lâu; lối chưng cất chưa bao giờ "
   "gửi `max_tokens` — nó nhận mặc định của cửa, im lặng")
ok(bool(str(NG.get("$vi_sao_tran_chu_chung_cat", "")).strip()),
   "1a · và khai VÌ SAO con số ấy",
   "một trần không có lý lẽ là một trần không ai dám sửa")

import re  # noqa: E402

for ten, src in (("openai", SRC_OA), ("google", SRC_GG)):
    # Bỏ chú thích trước khi đo: một câu văn xuôi nhắc `max_tokens` không phải
    # một lời gọi, và một vế đo cả chú thích là một vế xanh oan.
    ma = re.sub(r"#.*", "", src)
    ok("max_tokens" in ma,
       f"1b · adapter `{ten}` GỬI `max_tokens`",
       "sót một adapter là đúng lỗi `go_khung` đã ghi: hai bản của một phép "
       "là hai bản sẽ lệch")
    # Neo vào một trong hai đường ĐỌC BẢNG — khoá trực tiếp, hoặc cửa chung
    # `hop_dong.tran_chu()`. Cửa chung là đường tốt hơn, nên vế không được
    # cấm nó.
    ok("tran_chu_chung_cat" in ma or "tran_chu()" in ma,
       f"1b2 · và lấy trần TỪ BẢNG, không tự nghĩ ra",
       "gõ số ở đây là dựng lại đúng cái bệnh: một trần không ai khai")
    # Và phải KHÔNG gõ số — đây là vế làm hai vế trên có răng.
    ok(not re.search(r'"max_tokens"\s*:\s*\d', ma),
       f"1b3 · KHÔNG gõ cứng con số cho `{ten}`",
       "một số gõ trong mã là một trần không sửa được mà không sửa mã")

# ── 2 · `finish_reason: length` ⇒ nói BỊ CẮT ─────────────────────────────
print("\n2 · Cửa báo `length` ⇒ câu lỗi nói phản hồi bị CẮT\n")

CAT = ('{' + NL + '  "text": "## 1. Overview' + chr(92) + 'nTài liệu ghi lại '
       'buổi chia sẻ kỹ thuật của một kỹ sư tại Cursor về hành trình tiến hoá '
       'từ việc viết code thủ công cho tới các agent tự merge PR hàng loạt.'
       + chr(92) + 'n' + chr(92) + 'n## 2. Bối cảnh' + chr(92) + 'nKhi mớ')


def _tra(noi: str, ly_do: str) -> dict:
    return {"choices": [{"message": {"content": noi}, "finish_reason": ly_do}]}


def _cau(noi: str, ly_do: str) -> str:
    """Gọi `_boc` với một phản hồi giả, trả về CÂU lỗi (rỗng nếu không ném)."""
    try:
        ad_openai._boc(_tra(noi, ly_do))
        return ""
    except Exception as e:                                 # noqa: BLE001
        return f"{type(e).__name__}: {e}"


c2 = _cau(CAT, "length")
ok(c2 != "", "2 · vẫn NÉM — một bản chưng cất thiếu không được đi tiếp",
   "đi tiếp nghĩa là ghi vào kho một bản mất §2 trở đi mà không ai biết")
ok("cắt" in c2 or "CẮT" in c2,
   "2a · và câu lỗi nói phản hồi BỊ CẮT",
   f"được: {c2[:150]!r}")
ok("không phải JSON" not in c2,
   "2b · KHÔNG còn nói 'không phải JSON'",
   "đó là câu gửi người sửa đi tìm ở hình dạng, trong khi bệnh ở trần token — "
   "chủ dự án đã đi đúng đường sai ấy: *'do call model lỗi'*")
ok(str(len(CAT)) in c2,
   f"2c · và nói NHẬN ĐƯỢC bao nhiêu ký tự ({len(CAT)})",
   "biết độ dài mới biết trần hiện tại là bao nhiêu và nâng bao nhiêu")

# ── 3 · ÂM · `stop` mà JSON hỏng thật ⇒ VẪN nói không phải JSON ──────────
print("\n3 · ÂM · `stop` + JSON hỏng thật ⇒ vẫn nói 'không phải JSON'\n")

c3 = _cau("<html>502 Bad Gateway</html>", "stop")
ok("không phải JSON" in c3,
   "3 · phản hồi hỏng THẬT vẫn được gọi đúng tên",
   f"được: {c3[:150]!r} — quy mọi lỗi parse cho 'bị cắt' là sửa quá tay, và "
   "lần sau nó lại chỉ sai hướng, chỉ theo chiều ngược")
ok("cắt" not in c3 and "CẮT" not in c3,
   "3a · và KHÔNG quy oan cho việc bị cắt")

# ── 4 · Câu lỗi mang ĐUÔI, không chỉ 300 ký tự ĐẦU ───────────────────────
print("\n4 · Chỗ vỡ ở CUỐI, nên câu lỗi phải mang cả đuôi\n")

DAI = '{"text": "' + ("x" * 900) + "DAU_MOC_CUOI"
c4 = _cau(DAI, "stop")
ok("DAU_MOC_CUOI" in c4,
   "4 · đuôi phản hồi có trong câu lỗi",
   "bản cũ cắt `noi[:300]` — với một chuỗi bị cắt cụt thì 300 ký tự ĐẦU là "
   "cửa sổ vô dụng nhất có thể chọn")
ok(len(c4) < 1400,
   f"4a · nhưng KHÔNG in cả phản hồi ({len(c4)} ký tự)",
   "một câu lỗi 60 KB làm log không đọc được — đầu + đuôi là đủ")

# ── 5 · Phản hồi LÀNH vẫn đi qua ─────────────────────────────────────────
print("\n5 · Chống đỏ oan: phản hồi đủ + `stop` vẫn đi qua\n")

LANH = json.dumps({"text": "## 1. Overview" + chr(92) + "nOK.",
                   "quotes": ["một câu trích"]}, ensure_ascii=False)
try:
    d5 = ad_openai._boc(_tra(LANH, "stop"))
    nem5 = None
except Exception as e:                                     # noqa: BLE001
    d5, nem5 = {}, f"{type(e).__name__}: {e}"
ok(nem5 is None, "5 · KHÔNG ném", nem5 or "")
ok(d5.get("quotes") == ["một câu trích"],
   "5a · và bóc đúng `text` + `quotes` như cũ",
   f"được {d5!r}")

# `finish_reason` VẮNG (cửa không trả) cũng không được làm hỏng đường lành.
try:
    d6 = ad_openai._boc({"choices": [{"message": {"content": LANH}}]})
    nem6 = None
except Exception as e:                                     # noqa: BLE001
    d6, nem6 = {}, f"{type(e).__name__}: {e}"
ok(nem6 is None,
   "5b · cửa KHÔNG trả `finish_reason` ⇒ vẫn đi qua",
   f"{nem6} — không phải cửa nào cũng trả trường ấy; thiếu nó không phải lỗi")

# ── 6 · `hop_dong.doc_json` là chỗ SỬA, không phải mỗi adapter một bản ───
print("\n6 · Phép chung nằm ở `hop_dong`, không chép sang từng adapter\n")

SRC_HD = (R / "chungcat" / "src" / "adapter" / "hop_dong.py").read_text(encoding="utf-8")
ok("cắt" in SRC_HD or "CẮT" in SRC_HD,
   "6 · `hop_dong.py` mang phép nói-bị-cắt",
   "`go_khung` đã ghi lý lẽ: hai bản của một phép gỡ là hai bản sẽ lệch nhau")

if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — bị cắt thì nói bị cắt, hỏng thật thì nói hỏng thật{NL}")
