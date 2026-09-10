#!/usr/bin/env python3
"""AC-2.3.1 · python-version trong workflow phải khớp requires-python.

Hai số khác nhau nghĩa là CI kiểm một môi trường, người phát triển chạy môi
trường khác — lỗi chỉ lộ trên CI, chỗ đắt nhất để phát hiện. ADR-02.
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

wf = next((p for n in ("ci.yml", "ci.yml.template")
           if (p := ROOT / ".github" / "workflows" / n).exists()), None)
if wf is None:
    sys.exit("Không tìm thấy workflow nào trong .github/workflows/")

pin = re.search(r"python-version:\s*['\"]?([\d.]+)", wf.read_text(encoding="utf-8"))
req = re.search(r"requires-python\s*=\s*['\"]([^'\"]+)",
                (ROOT / "core" / "pyproject.toml").read_text(encoding="utf-8"))

if not pin:
    sys.exit(f"{wf.name}: không khai python-version")
if not req:
    sys.exit("core/pyproject.toml: không khai requires-python")

pin_v, req_s = pin.group(1), req.group(1).strip()
floor = re.search(r">=\s*([\d.]+)", req_s)
if not floor:
    sys.exit(f"requires-python={req_s!r} — không đọc được sàn '>='")

as_t = lambda s: tuple(int(x) for x in s.split("."))
ok = as_t(pin_v) >= as_t(floor.group(1))
same = as_t(pin_v)[:2] == as_t(floor.group(1))[:2]

print(f"workflow  {wf.name}: python-version = {pin_v}")
print(f"pyproject requires-python = {req_s}  (sàn {floor.group(1)})")

if not ok:
    sys.exit(f"\nFAIL · CI chạy {pin_v} thấp hơn sàn {floor.group(1)}")
if not same:
    sys.exit(f"\nFAIL · CI pin {pin_v} nhưng sàn là {floor.group(1)} — hai môi "
             f"trường khác nhau.\nADR-02 đòi pin CỨNG: sửa requires-python "
             f'thành ">={pin_v}".')
print("\npass · CI và pyproject cùng một môi trường")
