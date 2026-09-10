#!/usr/bin/env python3
"""AC-2.5.1 · sample phải phủ đủ 4 verdict + ít nhất 1 ca priority < 25.

Chặng B kiểm M06 trên sample. Sample thiếu một verdict nghĩa là nhánh đó không
bao giờ chạy trong lúc kiểm — và lỗi ở nhánh đó chỉ lộ ra khi gặp dữ liệu thật.

NEW là nhánh CHÍNH của module (năng lực chưa có ⇒ sinh nháp).
"""
import collections, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Bám vào contract MỚI NHẤT, không hardcode v2 — nếu không thì mỗi lần bump
# version phải nhớ sửa script, và quên là script kiểm nhầm file cũ.
SAMPLE = max(ROOT.glob("05_uiux/contracts/analyses.sample.v*.json"),
             key=lambda p: [int(x) for x in p.stem.split(".v")[-1].split(".")])

d = json.loads(SAMPLE.read_text(encoding="utf-8"))
recs = d["analyses"]

verdicts, prios, by_status = collections.Counter(), [], collections.Counter()
for r in recs:
    by_status[r.get("review_status")] += 1
    for c in r.get("skill_candidates") or []:
        verdicts[c.get("verdict")] += 1
        if c.get("priority") is not None:
            prios.append(c["priority"])

CAN = {"NEW", "DEEPEN", "OVERLAP", "OUT_OF_SCOPE"}
thieu = sorted(CAN - set(verdicts))
duoi_nguong = [p for p in prios if p < 25]

print(f"file      {SAMPLE.relative_to(ROOT)}")
print(f"bản ghi   {len(recs)}  ({dict(by_status)})")
print(f"verdict   {dict(verdicts)}")
print(f"priority  {sorted(prios)}")

fails = []
if thieu:
    fails.append(f"thiếu verdict: {', '.join(thieu)}")
if not duoi_nguong:
    fails.append("không có ca nào priority < 25 — nhánh 'dưới ngưỡng, không sinh' "
                 "không bao giờ chạy khi kiểm")

if not fails:
    print("\npass · sample phủ đủ 4 verdict và có ca dưới ngưỡng")
    sys.exit(0)

print("\nFAIL · " + " · ".join(fails))
print("\nSửa: bổ sung bản ghi vào analyses.sample.v2.json.")
print("Đây là contract G5 đã frozen ⇒ FR + bump v3, KHÔNG sửa tại chỗ.")
print("Chủ sở hữu drift: PM (05_uiux/README.md).")
sys.exit(1)
