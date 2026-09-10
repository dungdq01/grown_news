#!/usr/bin/env python3
"""Khung thân bài — đọc từ core/assets/khung-than-bai.json.

Vì sao có module này: khung 9 mục cũ được GÕ TAY ở sáu nơi, và đã trôi thành
HAI bộ tên khác nhau mà không cổng nào bắt được (validator chỉ ép SỐ mục, không
đọc tên). Đây là đường dẫn xuất duy nhất cho phía Python — `validate.py` và
`core/tools/sinh_kb_mock.py` import từ đây, không khai lại.

Không có hàm nào ở đây PHÁN QUYẾT. Nó chỉ đọc và trình bày lại khai báo; cổng
nằm ở `validate.py`, và `core/tests/check_khung.py` canh phần văn xuôi.
"""

import json
from pathlib import Path

# HAI layout, cùng một file khai:
#   repo   core/src/source_distiller/khung.py  ->  core/assets/
#   bundle <skill>/scripts/khung.py            ->  <skill>/assets/
#
# Bản `source-distiller` cài ở `~/.claude/skills/` là một BẢN SAO của bộ này, và
# nó là thứ THẬT SỰ viết ra bài. Nếu `khung.py` chỉ biết layout repo thì bản
# bundle nổ lúc import — và nổ ở chỗ người dùng, không ở CI.
_HERE = Path(__file__).resolve().parent
_UNG_VIEN = [
    _HERE.parent.parent / "assets" / "khung-than-bai.json",   # repo
    _HERE.parent / "assets" / "khung-than-bai.json",          # bundle skill
]
KHUNG_PATH = next((p for p in _UNG_VIEN if p.exists()), _UNG_VIEN[0])

with KHUNG_PATH.open(encoding="utf-8") as f:
    KHUNG = json.load(f)

MUC = KHUNG["muc"]
SO_MUC = [m["so"] for m in MUC]                          # [1,2,3,4,5]
TEN = {m["so"]: m["ten"] for m in MUC}
CON = {m["so"]: [c["so"] for c in m.get("con", [])] for m in MUC if m.get("con")}
TEN_CON = {c["so"]: c["ten"] for m in MUC for c in m.get("con", [])}

# MỤC LÁ — đơn vị NHẬP. Mục có con thì con là lá; không có con thì chính nó.
# Đây là con số form phải theo: SCR-05 §1 khai "mỗi ràng buộc của cổng phải có
# một ô nhập tương ứng". Cổng đòi 8 lá ⇒ form 8 ô, và không nơi nào gõ số 8.
LA = [c["so"] for m in MUC for c in (m.get("con") or [{"so": str(m["so"])}])]
TEN_LA = {**{str(m["so"]): m["ten"] for m in MUC if not m.get("con")},
          **{c["so"]: c["ten"] for m in MUC for c in m.get("con", [])}}

TRAN_TU_THU_VIEN = KHUNG["tran_tu_thu_vien"]
TRAN_TU_MEM = KHUNG["tran_tu_mem"]
TRAN_TU_CUNG = KHUNG["tran_tu_cung"]
TRAN_DAN_NHAP = KHUNG["tran_dan_nhap"]
DAN_NHAP = [m["so"] for m in MUC if m.get("dan_nhap")]    # [1,2]


# Mục nào PHẢI có locator, theo ĐỊA CHỈ ("3.2" hay "4"), không theo số nguyên —
# vì sau refactor 9→5 thì mục cần locator nằm cả ở cấp mục con.
CAN_LOCATOR = (
    [c["so"] for m in MUC for c in m.get("con", []) if c.get("locator")]
    + [str(m["so"]) for m in MUC if m.get("locator")]
)

# WO-038 · `TINH_TUY_O` / `TINH_TUY_MAX` / `TINH_TUY_BULLETS` ĐÃ BỎ.
#
# Mục tinh túy thôi có cấu trúc con: nó là một ô văn xuôi như mọi mục lá
# khác. Ba hằng trên chỉ tồn tại để phục vụ regex `#### 3.4.x` và phép đòi
# đủ 5 dòng bullet — cả hai đã bỏ khỏi `validate.py`.
#
# Mục vẫn là mục NẶNG và vẫn cần locator; hai điều đó khai bằng `nang` và
# `locator` như mọi mục khác, nên không cần hằng riêng.


LOCATOR_MAU = "[nguon.md:1-2]"


def than_mau(noi_dung: dict | None = None, dai: str = "—") -> str:
    """Thân bài TỐI THIỂU đi qua được mọi cổng hình dạng.

    Dùng cho `core/tools/sinh_kb_mock.py`, `05_intake/test_gate.py`, và harness
    `web/test/_api.mjs` / `_seed.mjs`. BỐN chỗ đó trước đây mỗi chỗ gõ một thân
    bài riêng — và đó chính là cách bộ tên mục thứ hai sinh ra rồi trôi mà
    không cổng nào bắt được.

    `noi_dung` là {địa_chỉ: chữ} — `{"1": "...", "3.2": "..."}`. Địa chỉ vắng
    thì dùng `dai`. Mục nào `CAN_LOCATOR` đòi mà chữ truyền vào không có
    `[...]` thì locator mẫu được CHÈN THÊM: người gọi không phải nhớ mục nào
    cần địa chỉ, và một override vô tình sẽ không làm đỏ cổng 7.
    """
    noi_dung = noi_dung or {}

    def chu(dc: str) -> str:
        t = str(noi_dung.get(dc, dai)).strip() or dai
        if dc in CAN_LOCATOR and "[" not in t:
            t += " " + LOCATOR_MAU
        return t

    khoi = []
    for m in MUC:
        khoi.append(f"## {m['so']}. {m['ten']}")
        con = m.get("con") or []
        if not con:
            khoi.append(chu(str(m["so"])))
            continue
        for c in con:
            khoi.append(f"### {c['so']} {c['ten']}")
            khoi.append(chu(c["so"]))
    return "\n\n".join(khoi) + "\n"


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"khung v{KHUNG['phien_ban']} · {len(MUC)} mục · "
          f"con của §3: {CON.get(3)} · locator: {CAN_LOCATOR} · tinh túy ở {TINH_TUY_O}")
    print()
    print(than_mau())
