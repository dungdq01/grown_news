#!/usr/bin/env python3
"""Điều kiện đóng G6A, kiểm bằng máy thay vì tự khai.

  1 · mỗi module có đủ 6 artifact
  2 · rules.md tồn tại VÀ không trống
  3 · mỗi rule đủ 4 field (id, vi_phạm, bề_mặt, why) và bề mặt thuộc S1-S4
  4 · mỗi AC có nhãn hard|soft
  5 · mỗi AC hard có dòng cmd
  6 · module trong project_map == thư mục trong 06_modules

PHẠM VI: sáu artifact ở `CAN` là điều kiện của MỌI module. Ba artifact còn lại
của bộ chín — `testcases.md` · `workflow.md` · `backlog.md` — **nay có ở CẢ 18
module** (2026-09-03).

  Chủ dự án đảo quyết định cũ: *"hoàn thiện đến s6 cho tất cả module"*.
  Quyết định trước đó (2026-09-02, nhắc hai lần) là *"module đợt hai thôi,
  M1 - M11 không cần làm quá kỹ vì cơ bản phase 1 triển khai khá ổn"* — giữ lại
  ở đây làm hồ sơ, KHÔNG còn hiệu lực.

  Và phép thử s6 trên M01–M11 **có giá trị**, ngược với điều đoạn dưới dự đoán:
  nó tìm ra 8 con số tự-khai lệch thực tế · 4 spec dùng tên bảng KHÔNG CÒN TỒN
  TẠI · M09 §1 lập luận NGƯỢC với kiến trúc đã thi công · và một lỗ trong CHÍNH
  file này (xem `06_modules/M03_web/backlog.md` ô đầu: cổng đo *"AC có viết chữ
  cmd"* thay vì *"lệnh có chạy được"* — R3 đòi vế thứ hai).

Lý do đo được: M01–M11 **đã thi công và đang chạy** (M02/M03 `as-built`, 84 test
web + 45 pytest canh chúng). Viết testcase NGƯỢC cho mã đã chạy là **mô tả cái
đã có**, không phải một phép thử — và giá trị của phép thử s6 nằm ở chỗ nó chạy
**TRƯỚC** khi có mã. Phép thử đó đã bắt 11/123 AC mơ hồ ở M12–M17 và 3/18 ở M18,
đúng vì lúc đó chưa có mã nào để đọc đáp án từ đó.

⇒ Đừng đọc "7/18 module có testcases.md" là một khoảng trống. Nó là ranh giới
có chủ ý giữa phase 1 (đã chạy, có test thật canh) và đợt hai (chưa có mã).
"""
import re, sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
MODS = ROOT / "06_modules"
CAN = ["spec.md", "rules.md", "diagram_flow.md", "data_flow.md", "ui_flow.md", "model_flow.md"]
fails = []

khai = set(yaml.safe_load((ROOT / "project_map.yaml").read_text(encoding="utf-8"))["modules"])
co = {p.name for p in MODS.iterdir() if p.is_dir()}
if khai != co:
    for m in sorted(khai - co): fails.append(f"map khai {m} nhưng không có thư mục")
    for m in sorted(co - khai): fails.append(f"có thư mục {m} nhưng map không khai")
print(f"module  map={len(khai)}  thư mục={len(co)}  {'khớp' if khai==co else 'LỆCH'}\n")

for m in sorted(co):
    d, loi = MODS / m, []
    thieu = [f for f in CAN if not (d / f).exists()]
    if thieu: loi.append(f"thiếu artifact: {', '.join(thieu)}")

    rp = d / "rules.md"
    if rp.exists():
        rt = rp.read_text(encoding="utf-8")
        if len(rt.strip()) < 50:
            loi.append("rules.md trống — phải ghi 'không có — vì <lý do>'")
        ids = re.findall(r"^\s*-\s*id:\s*(\S+)", rt, re.M)
        for f in ("vi_phạm", "bề_mặt", "why"):
            n = len(re.findall(rf"^\s*{f}:", rt, re.M))
            if n != len(ids):
                loi.append(f"{len(ids)} rule nhưng {n} field {f}")
        for s in re.findall(r"^\s*bề_mặt:\s*(\S+)", rt, re.M):
            if s not in ("S1", "S2", "S3", "S4"):
                loi.append(f"bề_mặt {s!r} không thuộc S1-S4")

    sp = d / "spec.md"
    nh = ns = 0
    if sp.exists():
        st = sp.read_text(encoding="utf-8")
        for blk in re.findall(r"^> \*\*AC-[\d.]+\*\*.*?(?=\n(?!>)|\Z)", st, re.M | re.S):
            ac = re.search(r"AC-[\d.]+", blk).group(0)
            # Nhãn là token ĐẦU của dòng "> `hard` ..." — không phải chữ `hard`
            # xuất hiện đâu đó trong văn bản giải thích. Lượt đầu script bắt sai
            # hai AC vì đếm cả chữ trong câu "chuyển thành `hard` khi...".
            nhan = re.search(r"^>\s*`(hard|soft)`", blk, re.M)
            h = bool(nhan and nhan.group(1) == "hard")
            s = bool(nhan and nhan.group(1) == "soft")
            if not nhan: h = s = False
            if not (h or s): loi.append(f"{ac}: không có nhãn hard|soft")
            elif h and not re.search(r"cmd:|cùng lệnh", blk):
                loi.append(f"{ac}: hard nhưng KHÔNG có cmd — theo R3 nó là soft")
            nh, ns = nh + h, ns + (s and not h)

    print(f"{'ok  ' if not loi else 'FAIL'} {m:<14} {len(CAN)-len(thieu)}/6 artifact · "
          f"{len(ids) if rp.exists() else 0} rule · AC {nh} hard/{ns} soft")
    for e in loi: print(f"       - {e}"); fails.append(f"{m}: {e}")

print()
if fails: sys.exit(f"G6A CHƯA ĐÓNG — {len(fails)} lỗi")
# Con số này TỪNG gõ cứng là "7" — và nó nói dối từ lúc dự án có module thứ 8.
# Vòng lặp trên chạy trên MỌI thư mục trong 06_modules, nên phải in số THẬT.
# Đúng thứ CLAUDE.md cấm: "đếm tay rồi chép số".
print(f"G6A: 6 điều kiện đạt trên cả {len(co)} module")
