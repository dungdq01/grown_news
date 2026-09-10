#!/usr/bin/env python3
r"""Nạp module của M13, và PHÂN BIỆT hai lý do đỏ. Dùng chung cho mọi cổng.

Chép khuôn `chungcat/tests/_nap.py` (M12) — KHÔNG import chéo: hai THỢ không
được dính vào nhau qua một file test (Z7), và M13 không import mã M12 (M13-R1).

Hai ca đỏ hoàn toàn khác nhau, KHÔNG gộp vào một `except ImportError`:

    thiếu MÃ   → đỏ ĐÚNG ở giai đoạn T13-1 (R5: cổng trước mã). Việc: viết mã.
    thiếu GÓI  → đỏ SAI LÝ DO (exit 3). Việc: cài/pin phụ thuộc ở
                 `truyhoi/pyproject.toml`, không sửa một dòng mã.

`workflow.md §1a` của M13: *"Cổng đỏ vì `ImportError` KHÔNG tính — nó phải đỏ vì
LUẬT."* Phép phân biệt: file mã có tồn tại trên đĩa hay không; `ImportError.name`
cho biết module nào thật sự vắng — khác tên ta xin thì thiếu là GÓI.
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "truyhoi" / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


class ThieuMa(Exception):
    """Module của M13 chưa được viết. Đỏ ĐÚNG ở giai đoạn cổng-trước-mã."""


class ThieuGoi(Exception):
    """Mã có, nhưng một package bên ngoài vắng. Đỏ SAI LÝ DO."""

    def __init__(self, goi: str, cho: str):
        self.goi, self.cho = goi, cho
        super().__init__(f"thiếu package `{goi}` (cần cho `{cho}`)")


def nap(*ten: str):
    """Nạp một hoặc nhiều module trong `truyhoi/src`. Ném `ThieuMa` hoặc `ThieuGoi`."""
    ra = []
    for t in ten:
        goc = t.split(".")[0]
        if not (SRC / f"{goc}.py").exists() and not (SRC / goc).is_dir():
            raise ThieuMa(f"`truyhoi/src/{goc}.py` chưa tồn tại")
        try:
            ra.append(importlib.import_module(t))
        except ImportError as e:
            vang = getattr(e, "name", "") or ""
            if vang and vang.split(".")[0] not in (goc,):
                raise ThieuGoi(vang.split(".")[0], t) from e
            raise ThieuMa(f"`{t}` không nạp được: {e}") from e
    return ra[0] if len(ra) == 1 else tuple(ra)


def bao_do_va_thoat(e: Exception, cong: str, don_vi: str) -> None:
    """In thông điệp ĐÚNG LÝ DO rồi thoát. Hai ca, hai mã thoát, hai việc phải làm."""
    print("\n" + "-" * 62)
    if isinstance(e, ThieuGoi):
        print(f"ĐỎ SAI LÝ DO · THIẾU PACKAGE `{e.goi}`.")
        print(f"   Mã của {don_vi} CÓ trên đĩa — cổng này chưa đo được LUẬT nào.")
        print(f"   Việc phải làm: cài + PIN `{e.goi}` ở chỗ khai")
        print("   (`truyhoi/pyproject.toml`), KHÔNG sửa một dòng mã nào.")
        sys.exit(3)
    print(f"ĐỎ · CHƯA CÓ MÃ — {e}")
    print(f"   Đỏ ĐÚNG ở giai đoạn T13-1 (R5: cổng trước mã). {don_vi} dựng thì")
    print(f"   `{cong}` mới đo được luật.")
    sys.exit(1)
