"""T12-24 · bản chưng cất kế thừa `category` + `concepts` của bài gốc.

0 mạng, 0 model: tiêm `_doc_nguon` giả, gọi thẳng `_dung_nhap`.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import worker                                                   # noqa: E402

loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


def _fm(ban: str) -> dict:
    """Frontmatter của bản nháp — đọc thô, không cần yaml."""
    d, than = {}, ban.split("---", 2)[1]
    for dong in than.splitlines():
        m = re.match(r"^([a-z_]+):\s*(.*)$", dong)
        if m:
            d[m.group(1)] = m.group(2).strip()
    return d


KQ = {"text": "## 1. Mở đầu\n\nMột câu.", "model_da_dung": "gia/model"}
DEM = {"sampled": 0, "verified": 0}


def main() -> int:
    print("T12-24 · kế thừa nhãn từ bài gốc")
    cu = worker._doc_nguon

    def gia(nhan):
        def f(slug):
            return [{"neo": f"{slug}:p.1", "text": "thân", **nhan}]
        return f

    try:
        # ── AC1 · chép đúng nhãn của gốc ─────────────────────────────────
        worker._doc_nguon = gia({"category": ["hoc-may", "kinh-te"],
                                 "concepts": ["xgboost", "taylor"]})
        ban = worker._dung_nhap("tai-lieu/linux-foundation", KQ, DEM,
                                nguon=worker._doc_nguon("tai-lieu/linux-foundation"))
        fm = _fm(ban)
        bao(fm.get("category") == "[hoc-may, kinh-te]",
            "AC1 · `category` khớp gốc", repr(fm.get("category")))
        bao(fm.get("concepts") == "[xgboost, taylor]",
            "AC1 · `concepts` khớp gốc", repr(fm.get("concepts")))

        # ── AC3 · `nguon` mang TIỀN TỐ LOẠI (FR-067) ─────────────────────
        bao(fm.get("nguon") == "[tai-lieu/linux-foundation]",
            "AC3 · `nguon` giữ tiền tố loại", repr(fm.get("nguon")))

        # ── AC2 · gốc vắng nhãn ⇒ nháp vắng, KHÔNG bịa ───────────────────
        #
        # Bịa một mảng rỗng thì bài trông "đã có nhãn" trên mọi phép kiểm, và
        # người sửa sau không phân biệt được "chưa gán" với "gán rồi, rỗng".
        worker._doc_nguon = gia({})
        ban2 = worker._dung_nhap("video/abc", KQ, DEM,
                                 nguon=worker._doc_nguon("video/abc"))
        fm2 = _fm(ban2)
        bao("category" not in fm2 and "concepts" not in fm2,
            "AC2 · gốc vắng nhãn ⇒ nháp KHÔNG bịa",
            f"category={fm2.get('category')!r} concepts={fm2.get('concepts')!r}")

        # ── AC3b · qua được schema FR-067 ────────────────────────────────
        try:
            import jsonschema
            S = json.loads((R / "core/assets/frontmatter.schema.json")
                           .read_text(encoding="utf-8"))
            import yaml
            # `safe_load` biến `2026-09-05` thành `datetime.date`, và schema
            # đòi chuỗi — đó là hành vi của phép ĐỌC ở đây, không phải khuyết
            # tật của bản nháp. `validate.py` đọc bằng đường khác. Ép về chuỗi
            # để cổng nói về đúng thứ nó định đo.
            import datetime
            y = {k: (v.isoformat() if isinstance(v, (datetime.date,
                                                     datetime.datetime)) else v)
                 for k, v in yaml.safe_load(ban.split("---", 2)[1]).items()}
            e = [x.message for x in
                 jsonschema.Draft202012Validator(S).iter_errors(y)]
            bao(not e, "AC3b · bản nháp qua schema `FR-067`", "; ".join(e[:2]))
        except ImportError:
            print("  (bỏ qua AC3b — thiếu jsonschema/yaml)")
    finally:
        worker._doc_nguon = cu

    # ── AC1c · đọc nhãn từ HÌNH DẠNG THẬT của cửa ───────────────────────
    #
    # Cửa `/api/articles/<slug>` trả `{frontmatter, body, etag}`. Bản đầu của
    # tôi đọc `d["category"]` ở cấp cao nhất — luôn rỗng, im lặng, và bản chưng
    # cất lên site với nhãn trống. Đo được trên bản ghi thật 2026-09-06.
    #
    # Vế này gọi `_doc_nguon` THẬT với một phản hồi đúng khuôn cửa, thay vì
    # tiêm một hàm giả: mô phỏng đặt đúng chỗ có lỗi thì nó mô phỏng luôn cả
    # cái sai.
    import urllib.request
    goc_open = urllib.request.urlopen

    class _Gia:
        def __init__(self, b): self._b = b
        def read(self): return self._b
        def __enter__(self): return self
        def __exit__(self, *a): return False

    urllib.request.urlopen = lambda *a, **k: _Gia(json.dumps({
        "frontmatter": {"category": ["hoc-may"], "concepts": ["xgboost"]},
        "body": "thân bài", "etag": "x"}, ensure_ascii=False).encode())
    try:
        khoi = worker._doc_nguon("tai-lieu/y")
        bao(khoi and khoi[0].get("category") == ["hoc-may"],
            "AC1c · `_doc_nguon` đọc nhãn từ `frontmatter` (hình dạng THẬT)",
            f"được {khoi[0] if khoi else None}")
        bao(khoi and khoi[0].get("concepts") == ["xgboost"],
            "AC1c · `concepts` cũng vậy")
    finally:
        urllib.request.urlopen = goc_open

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
