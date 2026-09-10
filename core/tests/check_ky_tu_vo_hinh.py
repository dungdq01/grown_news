"""WO-063 · Không ký tự ĐIỀU KHIỂN vô hình trong mã nguồn.

Ba lần trong một phiên, cùng một bẫy: viết `\b` (ranh giới từ) qua một chuỗi
KHÔNG-raw, nên nó thành ký tự BACKSPACE thật (0x08) nằm trong regex. Hậu quả
mỗi lần:

  `check_g6b`     phép kiểm phụ thuộc treo IM LẶNG thành mù
  `no-write-path` cổng AN NINH `mkdir|rm|unlink` mù hoàn toàn
  `tab-theo-doi`  phép kiểm animation-layout mù

Không lần nào cổng nào đỏ. Nhìn bằng mắt thì dòng hỏng đọc Y HỆT dòng đúng —
`repr()` mới lộ. Đó là lý do phép kiểm này tồn tại: nó rẻ, và nó bắt một thứ
mắt người không bắt được.
"""

from __future__ import annotations

import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
DUOI = {".py", ".js", ".mjs", ".ts", ".json", ".css", ".html", ".yaml", ".yml"}
BO_QUA = {"node_modules", ".git", ".venv", "_recycle", ".playwright-mcp"}

# Ký tự điều khiển KHÔNG bao giờ hợp lệ trong mã nguồn. `\t` `\n` `\r` hợp lệ;
# `\f` (0x0C) hiếm nhưng có thật trong vài mã cũ nên cũng tha.
XAU = {i for i in range(0x20)} - {0x09, 0x0A, 0x0C, 0x0D}
XAU.add(0x7F)


def main() -> int:
    dinh = []
    for p in R.rglob("*"):
        if not p.is_file() or p.suffix not in DUOI:
            continue
        if BO_QUA & set(p.parts):
            continue
        try:
            b = p.read_bytes()
        except OSError:
            continue
        xau = {c for c in b if c in XAU}
        if xau:
            dinh.append((p.relative_to(R), sorted(hex(c) for c in xau),
                         sum(b.count(bytes([c])) for c in xau)))

    print("WO-063 · ký tự điều khiển vô hình trong mã")
    for f, ma, n in dinh:
        print(f"  FAIL {f} — {n} ký tự {' '.join(ma)}")
    if not dinh:
        print("  ok   0 file dính")
        print("\npass · không ký tự vô hình nào trong mã nguồn")
        return 0
    print(f"\nĐỎ — {len(dinh)} file.\n"
          "Gần như luôn là `\b`/`\f` viết qua một chuỗi KHÔNG-raw. Sửa: dùng\n"
          "chuỗi raw, hoặc ghi bằng phép chỉnh DÒNG thay vì phép thay chuỗi.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
