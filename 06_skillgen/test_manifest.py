#!/usr/bin/env python3
"""AC4 của T06-2 · mọi capability trong manifest có $why giải thích điểm depth.

Vì sao là AC chứ không phải phong cách: depth quyết định verdict, và verdict
quyết định có sinh skill điều khiển agent hay không. Một số depth không có lý do
là một quyết định không ai kiểm lại được — và M06-R5 nói rõ: một loạt NEW đáng
ngờ là dấu hiệu MANIFEST THIẾU, không phải ngưỡng cao. Muốn sửa manifest thì
phải đọc được vì sao nó đang như vậy.
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
d = json.loads((ROOT / "skill-manifest.json").read_text(encoding="utf-8"))
loi = []

n_cap = 0
for s in d["skills"]:
    if not s.get("$why"):
        loi.append(f"skill {s['id']}: thiếu $why")
    for c in s["capabilities"]:
        n_cap += 1
        ten = f"{s['id']}.{c['name']}"
        if not c.get("$why"):
            loi.append(f"{ten}: thiếu $why cho depth {c['depth']}")
        elif len(c["$why"]) < 20:
            loi.append(f"{ten}: $why quá ngắn ({len(c['$why'])} ký tự)")
        if not 1 <= c.get("depth", 0) <= 5:
            loi.append(f"{ten}: depth {c.get('depth')} ngoài thang 1-5")
        if not c.get("aliases"):
            loi.append(f"{ten}: không có aliases — khớp đúng tên chính sẽ bỏ sót")

for khoa in ("$matching", "$out_of_scope", "$depth_scale", "domain"):
    if khoa not in d:
        loi.append(f"thiếu khoá {khoa}")

order = d.get("$matching", {}).get("order", [])
if len(order) != 5:
    loi.append(f"$matching.order có {len(order)} cổng, cần 5")
elif "CỔNG CỨNG" not in order[0]:
    loi.append("cổng đầu tiên KHÔNG phải cổng cứng — M06-R1")

# alias không được trỏ hai capability khác nhau
import re
thay = {}
for s in d["skills"]:
    for c in s["capabilities"]:
        for a in [c["name"], *c.get("aliases", [])]:
            k = re.sub(r"[^a-z0-9]", "", a.lower())
            if k in thay and thay[k] != f"{s['id']}.{c['name']}":
                loi.append(f"alias {a!r} trỏ cả {thay[k]} lẫn {s['id']}.{c['name']}")
            thay[k] = f"{s['id']}.{c['name']}"

print(f"{len(d['skills'])} skill · {n_cap} capability · {len(thay)} tên tra được")
print(f"{len(order)} cổng, cổng 1 = {'cổng cứng' if order and 'CỔNG CỨNG' in order[0] else 'KHÁC'}")
print()
if loi:
    for e in loi:
        print("  FAIL", e)
    sys.exit(f"{len(loi)} lỗi manifest")
print("pass · mọi capability có $why, aliases, depth hợp lệ; không alias nào nhập nhằng")
