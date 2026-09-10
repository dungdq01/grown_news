#!/usr/bin/env python3
"""S3 cho các file FROZEN — vá lỗ deny list chỉ chặn tool Write.

Phát hiện ở s7: deny khai Write(./06_modules/**/spec.md) nhưng 14 file trong
06_modules/ và 21 file tổng cộng đã được ghi qua Bash heredoc mà không bị chặn
lần nào. Cùng hành vi, khác đường, và S1 chỉ canh một đường.

S1 (deny) chặn TRƯỚC nhưng chỉ một tool. S3 (script này) hậu kiểm mọi đường:
Write, Bash, editor, script — vì nó so nội dung với baseline đã ký.

Dùng: file frozen đổi mà không bump version trong FROZEN.lock ⇒ đỏ.
"""
import hashlib, json, subprocess, sys
from pathlib import Path

# ── STDOUT PHẢI NHẬN ĐƯỢC TIẾNG VIỆT ───────────────────────────────────────
#
# Trên Windows, console mặc định là `cp1252` và mọi `print` tiếng Việt của file
# này ném `UnicodeEncodeError`. Hệ quả đo được 2026-09-05: script kết luận
# XANH (*"không file frozen nào đổi"*), rồi CHẾT lúc in câu đó ra, và vỏ nhận
# **exit 1**. Cổng nói ĐỎ trong khi vật XANH — `#cổng-đỏ-oan`, và nó chặn đúng
# cái gate mà NGƯỜI phải ký.
#
# Sửa ở đây chứ không bắt người gõ `PYTHONIOENCODING=utf-8`: một cổng chỉ đúng
# khi gọi kèm một biến môi trường là một cổng sẽ đỏ oan lần đầu ai đó quên —
# kể cả CI. `errors="replace"` để cùng lắm mất dấu, không mất exit code.
for _luong in (sys.stdout, sys.stderr):
    try:
        _luong.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass          # luồng bị chuyển hướng kiểu khác — không đáng để chết

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / "FROZEN.lock"

# Path glob → lý do frozen. Đồng bộ với deny list trong .claude/settings.json.
FROZEN = {
    "05_uiux/contracts/*.json":      "hợp đồng G5 — đổi ⇒ FR + bump version",
    "06_modules/*/spec.md":          "spec G6A frozen",
    "06_modules/*/rules.md":         "rules G6A frozen",
    "core/assets/frontmatter.schema.json": "schema là hợp đồng 7 module bám vào",
    # FR-034 — GỠ kb/concepts.yaml: danh mục sống trong bảng `concepts` của
    # kb/_kho.sqlite, file yaml là EXPORT dẫn xuất đổi theo mỗi lần ghi —
    # frozen một file dẫn xuất là vô nghĩa (và là lý do tồn tại kyLaiBaseline()
    # sau mỗi ghi, thứ FR-019 tự nhận là lớp giảm). Răng thật của danh mục:
    # M02-R3 (người khai nhãn) + audit_log chỉ-nối-thêm.
    ".githooks/pre-commit":          "bề mặt S4",
    ".githooks/test-hook.sh":        "THƯỚC ĐO của S4 — sửa nó là sửa thứ dùng để chấm hook",
}

def bam(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]

hien = {}
for glob, ly_do in FROZEN.items():
    for p in sorted(ROOT.glob(glob)):
        hien[str(p.relative_to(ROOT)).replace("\\", "/")] = bam(p)

if "--ky" in sys.argv:
    LOCK.write_text(json.dumps(hien, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"đã ký {len(hien)} file frozen vào FROZEN.lock")
    print("Bump version + FR trước khi ký lại — ký mà không FR là bỏ qua cổng.")
    sys.exit(0)

if not LOCK.exists():
    sys.exit("Chưa có FROZEN.lock. Chạy: python core/tests/check_frozen.py --ky")

cu = json.loads(LOCK.read_text(encoding="utf-8"))
doi = sorted(k for k in hien if k in cu and hien[k] != cu[k])
moi = sorted(set(hien) - set(cu))
mat = sorted(set(cu) - set(hien))

print(f"{len(hien)} file frozen · lock có {len(cu)}\n")
for k in doi: print(f"  ĐỔI  {k}")
for k in moi: print(f"  MỚI  {k}")
for k in mat: print(f"  MẤT  {k}")

if not (doi or moi or mat):
    print("  không file frozen nào đổi")
    print("\npass · mọi file frozen khớp baseline đã ký")
    sys.exit(0)

print(f"\nFAIL · {len(doi)+len(moi)+len(mat)} file frozen lệch baseline.")
print("Đổi hợp lệ thì: mở FR → bump version → chạy lại với --ky.")
print("Không FR mà ký lại là bỏ qua cổng — đúng thứ deny list định chặn.")
sys.exit(1)
