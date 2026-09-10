#!/usr/bin/env python3
r"""Nạp module của M12, và PHÂN BIỆT hai lý do đỏ. Dùng chung cho mọi cổng.

VÌ SAO FILE NÀY TỒN TẠI
PM bắt được (giám sát 2026-09-03): `check_quote_co_that` đỏ với thông điệp
*"verify.py chưa tồn tại (No module named 'rapidfuzz')"* — trong khi `verify.py`
**có**, và lý do thật là **thiếu package**. Hai ca hoàn toàn khác nhau bị gộp
vào một nhánh `except ImportError`:

    thiếu MÃ   → đỏ ĐÚNG ở giai đoạn T12-8 (R5: cổng trước mã). Việc: viết mã.
    thiếu GÓI  → đỏ SAI LÝ DO. Việc: cài/pin phụ thuộc, không sửa một dòng mã.

`workshop §1a` của M12 cấm đúng chuyện này: *"Cổng đỏ vì `ImportError` KHÔNG
tính là đỏ đúng — nó phải đỏ vì LUẬT."* Một cổng chẩn sai lý do đỏ khiến người
đọc đi sửa nhầm chỗ, và đó là cách một cổng làm hại nhiều hơn giúp.

Phép phân biệt: file mã **có tồn tại trên đĩa** hay không. `ImportError.name`
cho biết module nào thật sự vắng — nếu nó khác tên ta xin, thì thiếu là **gói**.
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "chungcat" / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


class ThieuMa(Exception):
    """Module của M12 chưa được viết. Đỏ ĐÚNG ở giai đoạn cổng-trước-mã."""


class ThieuGoi(Exception):
    """Mã có, nhưng một package bên ngoài vắng. Đỏ SAI LÝ DO."""

    def __init__(self, goi: str, cho: str):
        self.goi, self.cho = goi, cho
        super().__init__(f"thiếu package `{goi}` (cần cho `{cho}`)")


def nap(*ten: str):
    """Nạp một hoặc nhiều module. Ném `ThieuMa` hoặc `ThieuGoi` — không gộp."""
    ra = []
    for t in ten:
        goc = t.split(".")[0]
        duong = SRC / Path(*goc.split(".")) if "." in goc else SRC / f"{goc}.py"
        if not (SRC / f"{goc}.py").exists() and not (SRC / goc).is_dir():
            raise ThieuMa(f"`chungcat/src/{goc}.py` chưa tồn tại")
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
        print("   (`chungcat/pyproject.toml`), KHÔNG sửa một dòng mã nào.")
        sys.exit(3)
    print(f"ĐỎ · CHƯA CÓ MÃ — {e}")
    print(f"   Đỏ ĐÚNG ở giai đoạn T12-8 (R5: cổng trước mã). {don_vi} dựng thì")
    print(f"   `{cong}` mới đo được luật.")
    sys.exit(1)
