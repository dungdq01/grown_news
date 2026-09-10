#!/usr/bin/env python3
"""Cổng `<map-check>` — `project_map.yaml` khớp thư mục thật, HAI CHIỀU.

VÌ SAO CỔNG NÀY TỒN TẠI
`CLAUDE.md` khai tám lệnh kiểm và nói thẳng: *"Chưa cài ⇒ vế gate đó không tồn
tại và không ai báo."* Quét lại tám lệnh đó — bản 2026-08-29 nói `<worklog-check>`
"đã có", và **câu đó SAI**; sửa 2026-09-01 sau khi đo lại từng cái:

    <freeze-check>        check_frozen.py           ĐÃ CÓ
    <rule-surface-check>  check_rule_surfaces.py    ĐÃ CÓ
    <pin-check>           check_version_pin.py      ĐÃ CÓ
    <map-check>           check_map.py (file này)   ĐÃ CÓ
    <docs-sync>           —                         KHÔNG ÁP DỤNG
    <scope-check>         —                         CHƯA CÀI (cấu trúc)
    <backlog-check>       —                         CHƯA CÀI (cấu trúc)
    <worklog-check>       —                         CHƯA CÀI  ← câu cũ nói sai

`check_worklog.py` KHÔNG phải `<worklog-check>`: nó canh `web/**/WORKLOG.md`
(tài liệu — số dòng CSS, số test), và **không đọc `.factory/worklog/*.yaml`
một dòng nào**. Trùng tên, khác việc — nên nhìn qua tưởng đã có cổng.

Hậu quả đã đo: 121 file `.factory/worklog/*.yaml` — **7 không parse được YAML,
48 thiếu khoá `object`**. Ba ô chưa cài ghi ở `06_modules/M01_core/backlog.md`.

Bài học của chính dòng này: một **khẳng định chưa kiểm nằm trong phần giải
thích của một cổng** nguy hiểm hơn thiếu cổng — ai đọc nó để biết cổng nào đã
có sẽ tin nhầm.

`project_map` là thứ `check_g6b` dùng để phán một `phạm_vi_ghi` có nằm trong
boundary hay không. Nếu map lệch thư mục thật thì **mọi phán quyết R1 đứng trên
nền sai**, và nó sai IM LẶNG: một module khai `be: 06_skillgen/**` cho một thư
mục không tồn tại vẫn cho mọi task của nó đi qua.

HAI CHIỀU, vì một chiều không đủ:
  map → đĩa   bắt boundary trỏ vào hư không
  đĩa → map   bắt một thư mục module mới không ai khai (đúng lỗ `kb-mock/**`
              từng có: `check_g6b` không đo được ai sinh lại kho mock)

ĐỎ_KHI   map khai một module/boundary mà đĩa không có · đĩa có thư mục module mà
         map không khai · một `06_modules/<M>/` thiếu artifact bắt buộc
XANH_KHI mọi module trong map có thư mục, mọi thư mục có mục trong map
"""

import sys
from pathlib import Path

import yaml

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
MAP = R / "project_map.yaml"
MODS = R / "06_modules"

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


m = yaml.safe_load(MAP.read_text(encoding="utf-8"))
mods = m.get("modules") or {}

print("\n0 · TỰ KIỂM vật liệu — trước khi tin bất cứ kết luận nào\n")

# Một cổng đọc được file rỗng rồi báo "không lệch gì" là cổng nói dối.
kiem(len(mods) > 0, f"đọc được {len(mods)} module từ `project_map.yaml`",
     "0 module ⇒ mọi phép dưới đúng vô điều kiện")
tren_dia = sorted(d.name for d in MODS.iterdir() if d.is_dir()) if MODS.is_dir() else []
kiem(len(tren_dia) > 0, f"thấy {len(tren_dia)} thư mục trong `06_modules/`",
     "không thấy gì ⇒ chiều đĩa→map đúng vô điều kiện")

print("\n1 · map → đĩa: mọi module khai ra phải CÓ THẬT\n")

for ten in sorted(mods):
    kiem((MODS / ten).is_dir(), f"`{ten}` có thư mục `06_modules/{ten}/`",
         "map khai một module không có trên đĩa ⇒ mọi phán quyết R1 của nó "
         "đứng trên nền sai")

print("\n2 · map → đĩa: mọi ĐƯỜNG trong boundary phải CÓ THẬT\n")

for ten, v in sorted(mods.items()):
    duong = []
    for khoa in ("be", "fe"):
        x = (v or {}).get(khoa)
        if not x:
            continue
        duong += x if isinstance(x, list) else [x]
    for d in duong:
        # `a/b/**` → gốc là `a/b`; một đường không glob thì chính nó là gốc.
        goc = d.split("/**")[0].rstrip("/")
        kiem((R / goc).exists(), f"  `{ten}` · `{d}` — gốc `{goc}` tồn tại",
             "boundary trỏ vào hư không: task khai `phạm_vi_ghi` trong đó vẫn "
             "đi qua `check_g6b` mà không ai báo")

print("\n3 · đĩa → map: mọi thư mục module phải ĐƯỢC KHAI\n")

for d in tren_dia:
    kiem(d in mods, f"`06_modules/{d}/` có mục trong map",
         "một module không ai khai thì không boundary nào chặn nó, và "
         "`check_g6b` không đo được ai sinh ra thứ trong đó")

print("\n4 · mỗi module có đủ artifact s6\n")

# Đọc từ chính map thay vì gõ tay: `spec` là khoá map đã dùng.
for ten, v in sorted(mods.items()):
    sp = (v or {}).get("spec")
    if sp:
        kiem((R / sp).exists(), f"`{ten}` · spec `{sp}` tồn tại",
             "map trỏ tới một spec không có ⇒ G6A chấm trên một hợp đồng vắng mặt")
    else:
        kiem((MODS / ten / "spec.md").exists(), f"`{ten}` có `spec.md`",
             "module không spec thì không có hợp đồng để chấm")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ `project_map.yaml` lệch thư mục thật — "
             "sửa MAP hoặc sửa ĐĨA, không sửa cổng")
print(f"project_map khớp thư mục thật hai chiều: {len(mods)} module · "
      f"{len(tren_dia)} thư mục")
