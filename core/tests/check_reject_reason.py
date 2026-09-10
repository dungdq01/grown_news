#!/usr/bin/env python3
"""AC-2.2.2 · rejected mà thiếu reject_reason phải bị chặn.

Không nằm trong test_gates.py vì đây là cổng của M02_kb (hợp đồng), không phải
cổng của giao thức M01. Chạy độc lập để AC của M02 có lệnh riêng.
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from source_distiller.validate import SCHEMA_PATH, check  # noqa: E402

GOOD = Path(__file__).parent / "fixtures" / "dat-chuan.md"
schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
concepts = set()

import tempfile  # noqa: E402

def run(fm_replace):
    text = GOOD.read_text(encoding="utf-8")
    for old, new in fm_replace:
        assert old in text, f"fixture không chứa: {old!r}"
        text = text.replace(old, new)
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "t.md"
        p.write_text(text, encoding="utf-8")
        return check(p, schema, concepts)[0]

fails = []

errs = run([("review_status: draft", "review_status: rejected")])
if not any("reject_reason" in e for e in errs):
    fails.append(f"rejected thiếu reject_reason PHẢI bị chặn, nhưng: {errs}")

errs = run([("review_status: draft",
             "review_status: rejected\nreject_reason: nguồn đã bị rút, không kiểm được")])
if any("reject_reason" in e for e in errs):
    fails.append(f"rejected CÓ lý do phải sạch, nhưng: {errs}")

for f in fails:
    print("FAIL:", f)
print("AC-2.2.2 pass — cổng reject_reason đóng đúng cả hai chiều" if not fails
      else f"{len(fails)} lỗi")
sys.exit(1 if fails else 0)
