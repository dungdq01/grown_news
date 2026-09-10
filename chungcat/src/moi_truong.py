#!/usr/bin/env python3
"""Nạp `.env` ở gốc repo vào `os.environ` — chỉ điền biến CHƯA CÓ.

Vì sao cần: khoá cửa LLM sống ở `.env` (gitignore), nhưng `os.environ` không tự
đọc file đó. Không thêm phụ thuộc (`python-dotenv`) cho ba chục dòng.

Vì sao chỉ điền biến CHƯA CÓ: env thật phải THẮNG file. Không thì một `.env` cũ
nằm trong thư mục lặng lẽ đè giá trị mà người vận hành vừa export, và họ không
có cách nào biết mình đang chạy với khoá nào.

Gọi MỘT LẦN lúc khởi động tiến trình (`api.py`), không gọi trong đường nóng:
đọc file mỗi lần cần một biến là một lần I/O cho một thứ không đổi.
"""

from __future__ import annotations

import os
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent.parent


def nap(duong=None) -> list[str]:
    """Đọc `.env`, trả tên các biến ĐÃ ĐIỀN (để log/kiểm, không trả giá trị)."""
    p = Path(duong or GOC / ".env")
    if not p.exists():
        return []
    da = []
    for dong in p.read_text(encoding="utf-8").splitlines():
        d = dong.strip()
        if not d or d.startswith("#") or "=" not in d:
            continue
        ten, _, gia = d.partition("=")
        ten, gia = ten.strip(), gia.strip()
        # Bỏ nháy bọc nếu có — `KEY="abc"` và `KEY=abc` phải cho cùng giá trị.
        if len(gia) >= 2 and gia[0] == gia[-1] and gia[0] in "\"'":
            gia = gia[1:-1]
        if ten and ten not in os.environ:
            os.environ[ten] = gia
            da.append(ten)
    return da
