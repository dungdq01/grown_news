#!/usr/bin/env python3
"""Sinh SKILL.md dạng NHÁP — thân RỖNG có chủ ý (M06-R2).

Một skill cần hai thứ có độ tin cậy khác hẳn nhau:

  Trigger   máy làm TỐT  — draft_trigger có sẵn, là cụm người dùng thật sẽ gõ
  Nội dung  máy làm DỞ   — sinh từ MỘT nguồn thì chỉ chép lại nguồn đó

Skill thật cần thứ học được sau khi đọc 3 nguồn và va một lần thất bại. Sinh đủ
nội dung tạo ra thứ TRÔNG NHƯ skill mà cài vào làm agent tệ hơn — và người dùng
không phát hiện ngay vì output vẫn trôi chảy.

Nháp gồm đúng bốn phần: frontmatter · "Khi nào dùng" · con trỏ nguồn · thân TRỐNG.

Ghi ra ~/.claude/skills/<name>/ — NGOÀI repo. Không tự cài (M06-R4): máy đề xuất,
người quyết định.
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from verdict import Manifest, cham, sinh_nhap_khong  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
TODO = "<!-- TODO: viết sau khi có nguồn thứ 2 -->"


def nhap(uv, ban_ghi, verdict, target):
    """Bốn phần. KHÔNG có phần thứ năm — thân để trống là điểm của lối này."""
    ten = uv.get("proposed_name") or uv["capability"]
    trigger = uv.get("draft_trigger", "")
    why = uv.get("why_now", "")
    nguon = ban_ghi.get("url") or ban_ghi.get("url_normalized", "")
    slug = ban_ghi.get("slug", "")
    loai = ban_ghi.get("source_type", "")
    p = uv.get("priority")

    # 1 · frontmatter — description LÀ draft_trigger, phần máy làm tốt
    # 2 · Khi nào dùng — từ why_now
    # 3 · con trỏ ngược về nguồn
    # 4 · thân TRỐNG
    return f"""---
name: {ten}
description: >
  {trigger}
---

# {ten}

> **NHÁP do máy sinh — chưa dùng được.** Thân để trống có chủ ý.
>
> Máy chấm được *khi nào cần skill này* (trigger lấy từ cụm bạn thật sự gõ),
> nhưng không viết được *phải làm gì* — nó mới đọc **một** nguồn.
> Skill thật cần thứ học được sau 3 nguồn và một lần va thất bại.

## Khi nào dùng

{why or "(chưa khai why_now)"}

Cụm kích hoạt: `{trigger}`

## Nguồn

| | |
|---|---|
| Bản phân tích | `kb/{loai}/{slug}.md` |
| Nguồn gốc | {nguon} |
| Verdict | `{verdict}`{f" → {target}" if target else ""} |
| priority | {p} |

Mở bản phân tích ở trên, đọc **mục 6 (tinh túy)** — đó là chỗ có phần chuyển giao.

## Cách làm

{TODO}

## Dè chừng

{TODO}
"""


def sinh(analyses, dich=None, mf=None, ghi=False):
    mf = mf or Manifest()
    dich = Path(dich) if dich else Path.home() / ".claude" / "skills"
    ra = []
    for r in analyses:
        if r.get("review_status") != "approved":
            continue
        for uv in r.get("skill_candidates") or []:
            v, _, target = cham(uv, r, mf)
            if not sinh_nhap_khong(uv, v):
                continue
            ten = uv.get("proposed_name") or uv["capability"]
            noi_dung = nhap(uv, r, v, target)
            duong = dich / ten / "SKILL.md"
            if ghi:
                duong.parent.mkdir(parents=True, exist_ok=True)
                duong.write_text(noi_dung, encoding="utf-8")
            ra.append({"name": ten, "path": str(duong), "verdict": v,
                       "priority": uv.get("priority"), "noi_dung": noi_dung})
    return ra


if __name__ == "__main__":
    sample = max((ROOT / "05_uiux/contracts").glob("analyses.sample.v*.json"),
                 key=lambda p: [int(x) for x in p.stem.split(".v")[-1].split(".")])
    A = json.loads(sample.read_text(encoding="utf-8"))["analyses"]
    ghi = "--ghi" in sys.argv
    dich = sys.argv[sys.argv.index("--dich") + 1] if "--dich" in sys.argv else None
    kq = sinh(A, dich, ghi=ghi)
    print(f"{sample.name} → {len(kq)} nháp" + (" (ĐÃ GHI)" if ghi else " (thử, chưa ghi)"))
    for k in kq:
        print(f"  {k['name']:<26} {k['verdict']:<7} p={k['priority']:<6} {k['path']}")
    if not ghi:
        print("\nThêm --ghi để ghi thật. Máy đề xuất, NGƯỜI quyết định cài (M06-R4).")
