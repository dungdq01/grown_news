#!/usr/bin/env python3
"""Trạm m-ba, phần máy kiểm được. Chạy ở đầu s7 cho mọi module.

Ba câu hỏi của skill m-ba mà máy trả lời được:
  1 · rule khai bề mặt S3 có trỏ một lệnh cụ thể không?
      (S3 = toolchain/CI. Không trỏ lệnh thì nó là kỷ luật, không phải cơ chế)
  2 · trường data_flow khai đọc có tồn tại trong schema không?
  3 · module có tự nhận sở hữu entity mà project_map giao cho module khác không?

Phép kiểm 3 đọc project_map, KHÔNG parse cột bảng markdown: lượt đầu tôi viết
regex đọc cột "chủ sở hữu" nhưng M02/M06 dùng bảng có cột nguồn/đích, nên nó báo
sai trên spec đúng. Nguồn chân lý của quyền sở hữu là map.

Phần đọc-hiểu (AC có đúng một nghĩa không, edge case nào thiếu) làm bằng mắt.
"""
import json, re, sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
MODS = ROOT / "06_modules"
mp = yaml.safe_load((ROOT / "project_map.yaml").read_text(encoding="utf-8"))
truong_schema = set(json.loads(
    (ROOT / "core/assets/frontmatter.schema.json").read_text(encoding="utf-8"))["properties"])
treo = []
mods = sorted(d for d in MODS.iterdir() if d.is_dir())

print("1 · rule bề mặt S3 có trỏ lệnh cụ thể không\n")
for d in mods:
    thieu = []
    for blk in re.split(r"(?=^- id:)", (d / "rules.md").read_text(encoding="utf-8"), flags=re.M):
        m = re.match(r"- id:\s*(\S+)", blk)
        bm = re.search(r"bề_mặt:\s*(S\d)(.*)$", blk, re.M) if m else None
        if bm and bm.group(1) == "S3" and not re.search(
                r"(test_\w+|check_\w+|\.test\.js|pytest|schema|allOf)", bm.group(2) + blk):
            thieu.append(m.group(1))
    print(f"  {'ok  ' if not thieu else 'TREO'} {d.name:<14}" + (f"  {', '.join(thieu)}" if thieu else ""))
    treo += [f"{d.name}: rule S3 {x} không trỏ lệnh nào — là kỷ luật, không phải cơ chế"
             for x in thieu]

print("\n2 · trường data_flow khai đọc có trong schema không\n")
for d in mods:
    khai = {k.split("[")[0].split(".")[0] for k in re.findall(
        r"^\|\s*`([a-z_]+(?:\[\])?(?:\.[a-z_]+)?)`",
        (d / "data_flow.md").read_text(encoding="utf-8"), re.M)}
    la = sorted(k for k in khai if k not in truong_schema)
    print(f"  {'ok  ' if not la else 'TREO'} {d.name:<14} đọc {len(khai)} trường"
          + (f"  KHÔNG có trong schema: {', '.join(la)}" if la else ""))
    treo += [f"{d.name}: trường {x} không có trong schema" for x in la]

print("\n3 · có module nào tự nhận sở hữu entity của module khác không\n")
for d in mods:
    mf = (d / "model_flow.md").read_text(encoding="utf-8")
    loi = [f"{e} (owner: {v['owner']})" for e, v in mp["entities"].items()
           if v["owner"] != d.name
           and re.search(rf"\*\*sở hữu\*\*\s*`?{e}`?|sở hữu entity `{e}`", mf)]
    print(f"  {'ok  ' if not loi else 'TREO'} {d.name:<14}" + (f"  {', '.join(loi)}" if loi else ""))
    treo += [f"{d.name}: tự nhận sở hữu {x}" for x in loi]

print("\n" + "-" * 52)
if treo:
    for t in treo:
        print("  -", t)
    sys.exit(f"m-ba: {len(treo)} điểm treo — theo skill m-ba, module có điểm treo thì DỪNG")
print("m-ba (phần máy): sạch — không điểm treo nào")
