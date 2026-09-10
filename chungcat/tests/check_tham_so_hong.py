"""Tham số truy vấn HỎNG không được giết một request.

Ô backlog M12 (dòng 736, *"(nhỏ)"*): `GET /viec?n=abc` ⇒ `int()` ném ⇒
handler sập. Đo lại 2026-09-07 — **vẫn còn đúng**: thợ đóng kết nối không trả
gì (`RemoteDisconnected`), và cửa web dịch thành `502 · TypeError`.

Vì sao một ô "(nhỏ)" đáng có cổng: đây là `http.server`, và một ngoại lệ
không bắt trong handler làm **chết luồng đang phục vụ**. Một ký tự gõ nhầm
trong thanh địa chỉ không được phép là một sự cố phía máy chủ.

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


print("\nM12 · tham số hỏng không giết request\n")

import api  # noqa: E402

# ── 1 · có hàm đọc số AN TOÀN, không `int()` trần ─────────────────────
ok(hasattr(api, "doc_so"), "1 · có `doc_so` — đọc số có mặc định")
if hasattr(api, "doc_so"):
    ok(api.doc_so("abc", 50) == 50, "1b · chuỗi không phải số ⇒ trả mặc định")
    ok(api.doc_so("7", 50) == 7, "1c · số hợp lệ ⇒ trả đúng số")
    ok(api.doc_so(None, 50) == 50, "1d · thiếu tham số ⇒ mặc định")
    ok(api.doc_so("-3", 50) == 50,
       "1e · số ÂM ⇒ mặc định",
       "một `n` âm không có nghĩa, và để nó đi tiếp là đẩy chỗ hỏng xuống sâu hơn")
    ok(api.doc_so("999999", 50, tran=500) == 500,
       "1f · số quá lớn bị CẮT TRẦN",
       "`n=999999` bắt thợ đọc cả hàng đợi vào bộ nhớ để trả cho một lời gọi")

# ── 2 · `int()` trần KHÔNG còn trên đường xử lý tham số ───────────────
ma = inspect.getsource(api)
ok('n=int((q.get("n")' not in ma,
   "2 · không còn `int()` trần cho tham số `n`",
   "`http.server`: ngoại lệ không bắt trong handler giết LUỒNG đang phục vụ")

print(f"\n{'ĐỎ — %d vế' % loi if loi else 'pass · tham số hỏng chỉ làm hỏng câu trả lời, không hỏng máy'}")
sys.exit(1 if loi else 0)
