#!/usr/bin/env python
"""WO-081 · T12-37 — Danh sách việc phải MỚI NHẤT TRƯỚC, theo thời điểm THẬT.

`vong.liet_ke` sắp "ULID giảm dần" và lập luận rất kỹ rằng ULID mang thời điểm
trong chính nó. Lập luận ấy đúng — với ULID thật. Nhưng id ở đây là
`uuid.uuid4().hex` (`api.py:404`): **ngẫu nhiên hoàn toàn**.

Hệ quả đo 2026-09-09: API trả 18 việc, tab Kết quả vẽ 8 ô đầu, và một việc vừa
chạy xong KHÔNG lên màn vì id nó bắt đầu bằng `9` — xếp dưới `a…`–`d…`.

── Vì sao vế 1 gieo id NGƯỢC chiều thời gian ───────────────────────────────
Một vế gieo ba việc rồi hỏi "có đủ ba không" sẽ xanh với mọi phép sắp. Vế dưới
đây đặt việc TẠO SAU mang id NHỎ hơn — tức thứ tự thời gian và thứ tự id đối
nghịch. Chỉ một phép sắp theo thời điểm thật mới qua được.
"""
from __future__ import annotations

import sys
import tempfile
import time
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

print("\nWO-081 · danh sách việc: MỚI NHẤT trước, theo thời điểm THẬT\n")

q = vong.HangDoi(str(Path(tempfile.mkdtemp(prefix="gn-tt-"))))

# Id NGƯỢC chiều thời gian: tạo trước = id LỚN, tạo sau = id NHỎ.
CU = "f" * 32          # tạo TRƯỚC, id lớn nhất
GIUA = "9" * 32
MOI = "1" * 32         # tạo SAU CÙNG, id nhỏ nhất
for u in (CU, GIUA, MOI):
    q.nap(u, {"loai": "sinh-transcript", "slug": "video/thu-" + u[0]})
    time.sleep(0.02)   # để `tao_luc` khác nhau thật

ds = (q.liet_ke(n=10) or {}).get("dong") or []
thu_tu = [str(x.get("ulid") or "")[0] for x in ds]
ok(len(ds) == 3, f"1 · liệt kê đủ 3 việc (được {len(ds)})")
ok(thu_tu[:3] == ["1", "9", "f"],
   f"1a · MỚI NHẤT trước, kể cả khi id ngược chiều (được {thu_tu})",
   "sắp theo `uuid4` là sắp NGẪU NHIÊN — một việc vừa xong có thể không bao "
   "giờ lên 8 ô đầu của màn")

# ── 2 · `tao_luc` nằm TRONG file, không phải `mtime` ─────────────────────
print("\n2 · Thời điểm nằm trong file, không phải `mtime`\n")

v = q.doc(MOI)
ok(bool(v.get("tao_luc")), f"2 · việc mang `tao_luc` (được {v.get('tao_luc')!r})",
   "đó chính là thứ chú thích cũ muốn: một thời điểm KHÔNG bị `touch` hay "
   "`git checkout` đổi được")

# `touch` một file cũ KHÔNG được đẩy nó lên đầu.
import os  # noqa: E402
f_cu = q._duong(CU)
os.utime(f_cu, (time.time() + 9999, time.time() + 9999))
ds2 = (q.liet_ke(n=10) or {}).get("dong") or []
ok([str(x.get("ulid") or "")[0] for x in ds2][:1] == ["1"],
   "2a · `touch` việc cũ KHÔNG đẩy nó lên đầu",
   "nếu đỏ: đã sắp theo `mtime` — đúng thứ chú thích cũ cảnh báo, chỉ là sửa "
   "quá tay sang phía bên kia")

# ── 3 · Việc CŨ không có `tao_luc` vẫn liệt kê được ──────────────────────
print("\n3 · Việc cũ (chưa có trường) không được làm vỡ danh sách\n")

import json  # noqa: E402
u_cu = "a" * 32
q.nap(u_cu, {"loai": "sinh-transcript", "slug": "video/that-cu"})
p = q._duong(u_cu)
j = json.loads(p.read_text(encoding="utf-8"))
j.pop("tao_luc", None)
p.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")

try:
    ds3 = (q.liet_ke(n=10) or {}).get("dong") or []
    nem = None
except Exception as e:                                     # noqa: BLE001
    ds3, nem = [], f"{type(e).__name__}: {e}"
ok(nem is None, "3 · liệt kê KHÔNG ném khi thiếu `tao_luc`", nem or "")
ok(any(str(x.get("ulid")) == u_cu for x in ds3),
   "3a · và việc cũ VẪN có mặt",
   "một trường mới không được làm biến mất dữ liệu đã có")

if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — mới nhất trước, theo thời điểm trong file{NL}")
