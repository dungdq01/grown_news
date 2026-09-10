#!/usr/bin/env python
"""WO-094 · T12-39 — Bản MÁY sinh không bị ép khung 5 mục; bản NGƯỜI vẫn bị.

Chủ dự án 2026-09-10: *"Tôi chỉ cần ko áp phan-tich (ép 5 mục) cho chưng cất,
mọi thứ để tự nhiên — người và model LLM quyết."*

── Vì sao vế 2 nặng NHẤT ở đây ─────────────────────────────────────────────
Đây là một cổng đang bị NỚI. Cách nới sai là bỏ luôn phép kiểm cho mọi bản —
lúc đó không phải "nới cổng", mà là "bỏ cổng", và không ai nhận ra cho tới khi
một bài người viết tay thiếu ba mục lọt vào kho.

Nên vế 2 gieo đúng một bản `origin: manual` thiếu mục và đòi nó VẪN TRƯỢT. Nếu
chỉ có vế 1, một `return []` ở đầu hàm cũng làm cổng xanh.

── Vì sao CHẠY validate thật ───────────────────────────────────────────────
`grep "pipeline"` xanh cả khi nhánh viết ngược. Cổng này gọi `validate` thật
trên frontmatter thật.
"""
from __future__ import annotations

import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "core" / "src"))

loi = 0
NL = chr(10)


def ok(d, chu, them=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {chu}" + ("" if d else f"  <- {them}"))
    if not d:
        loi += 1


from source_distiller import validate as V  # noqa: E402

print("\nWO-094 · máy sinh không bị ép khung; người viết vẫn bị\n")


def fm_goc(origin):
    """Frontmatter tối thiểu HỢP LỆ — chỉ khác nhau ở `origin`."""
    return {
        "id": "src_thunghiem01", "slug": "phan-tich-thu-nghiem",
        "source_type": "article", "ho_so": "phan-tich",
        "url": "kho://article/phan-tich-thu-nghiem",
        "url_normalized": "article/phan-tich-thu-nghiem",
        "protocol_version": "2.0", "analyzed_at": "2026-09-10",
        "one_liner": "Một câu tóm tắt.",
        "credibility_max": "claimed", "conformance": "C",
        "review_status": "draft", "origin": origin,
        "category": [], "concepts": [],
    }


# Thân THIẾU MỤC: chỉ có §1, không có §2..§5.
THAN_THIEU = ("## 1. Overview" + NL * 2
              + "Tài liệu nói về một buổi chia sẻ kỹ thuật." + NL * 2
              + "## Ghi chú thêm" + NL * 2
              + "Model tự đặt mục này." + NL)


import json as _json          # noqa: E402
import tempfile                  # noqa: E402

SCHEMA = _json.loads((R / "core" / "assets" / "frontmatter.schema.json")
                     .read_text(encoding="utf-8"))
TAM = Path(tempfile.mkdtemp(prefix="gn-khung-"))


def chay(origin, than=THAN_THIEU, khai_niem=None, chu_de=None):
    """Gọi `check()` THẬT trên một file thật — nó đọc `path`, không nhận chuỗi."""
    import yaml
    fm = fm_goc(origin)
    f = TAM / f"{origin}-{abs(hash(than)) % 10**8}.md"
    f.write_text("---" + NL + yaml.safe_dump(fm, allow_unicode=True)
                 + "---" + NL * 2 + than, encoding="utf-8")
    errs, _ = V.check(f, SCHEMA, khai_niem, chu_de)
    return [str(e) for e in (errs or [])]


# ── 1 · pipeline ⇒ KHÔNG còn "Thiếu mục" ─────────────────────────────────
print("1 · Bản MÁY sinh (`origin: pipeline`)\n")

e1 = chay("pipeline")
ok(not any("Thiếu mục" in e for e in e1),
   "1 · `origin: pipeline` thiếu mục ⇒ KHÔNG báo 'Thiếu mục'",
   f"còn: {[e for e in e1 if 'Thiếu mục' in e]}")
ok(not any("dẫn nhập" in e for e in e1),
   "1a · và không báo trần dẫn nhập",
   "phép ấy đo TỈ LỆ GIỮA CÁC MỤC — không còn mục bắt buộc thì nó vô nghĩa; "
   f"còn: {[e for e in e1 if 'dẫn nhập' in e]}")

# ── 2 · ÂM · manual vẫn bị ép ────────────────────────────────────────────
print("\n2 · ÂM · Bản NGƯỜI viết (`origin: manual`) VẪN bị ép\n")

e2 = chay("manual")
ok(any("Thiếu mục" in e for e in e2),
   "2 · `origin: manual` thiếu mục ⇒ VẪN TRƯỢT",
   "nới cho cả hai thì đây không phải nới cổng, là BỎ cổng — và một bài người "
   f"viết tay thiếu ba mục sẽ lọt vào kho mà không ai biết. Nhận được: {e2}")

# ── 3 · pipeline KHÔNG phải đường vòng qua mọi phép kiểm ─────────────────
print("\n3 · `pipeline` chỉ miễn HÌNH DẠNG, không miễn thứ khác\n")

_goc = fm_goc


def fm_goc(origin):                                   # noqa: F811
    d = _goc(origin)
    d["concepts"] = ["mot-khai-niem-khong-co-that"]
    return d


e3 = chay("pipeline", khai_niem=["khai-niem-that"], chu_de=["chu-de-that"])
fm_goc = _goc                                          # trả lại nguyên trạng
ok(any("concepts" in e for e in e3),
   "3 · nhãn ngoài danh mục VẪN bị chặn với `pipeline`",
   f"nhận được: {e3}")

# Trần từ vẫn phải chặn.
dai = "## 1. Overview" + NL * 2 + ("từ " * 40000)
e4 = chay("pipeline", dai)
ok(any("từ" in e and ("trần" in e or "tran" in e) for e in e4),
   "3a · trần từ VẪN chặn với `pipeline`",
   f"một bản 40k từ phải bị chặn; nhận được: {e4[:3]}")

if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — máy sinh tự do hình dạng, người viết vẫn theo khung{NL}")
