#!/usr/bin/env python3
r"""`V` — ĐỊNH VỊ LẠI quote trong nguồn. `M12 AC-3.2` (bản `FR-053 §3`).

Đây là chỗ **TA** bảo đảm địa chỉ, không phải provider. `model_flow §4` viết
thẳng: *"Trước: provider bảo đảm vị trí. Sau: TA là nơi duy nhất bảo đảm."*
Model chỉ được yêu cầu trả **quote nguyên văn**; vị trí do hàm này tính.

Và đó không phải sở thích — `Luật gốc` cấm: *"không ai được sở hữu thứ dùng để
đánh giá mình — **thước đo của mình**"*. Nếu model vừa đọc tài liệu vừa cấp toạ
độ thì `AC-3.2`/`AC-3.3` không còn gì để so.

BA TẦNG, và tầng 1 là thứ làm tầng 2 gánh được hầu hết ca thật:

    1. chuẩn hoá CẢ HAI vế   NFKC · ligature · gạch-nối-cuối-dòng
                             · nháy/gạch · nén khoảng trắng · casefold
    2. khớp CHÍNH XÁC        ⇒ verified
    3. fuzzy ≥ `nguong`      ⇒ verified, kèm điểm
       dưới ngưỡng           ⇒ TỪ CHỐI khẳng định

`dinh_vi` KHÔNG biết nguyên liệu là gì. Nó nhận `list[{neo, text}]` — `neo` là
số trang (PDF) hay mốc thời gian (transcript `.vtt`). Cùng một hàm, hai đơn vị;
đó là lý do đường video gần như không thêm dòng nào ở chỗ đắt nhất.

`nguong` là THAM SỐ, không phải hằng trong file này — nó sống ở bảng khai
`chungcat/assets/nguong.json` kèm số đo làm bằng chứng chọn ngưỡng. Gõ số vào
đây là dựng một cái thước không ai kiểm được (`M12-R4` cùng lý do).
"""

from __future__ import annotations

import re
import unicodedata

from rapidfuzz import fuzz

# Ligature không nằm trong NFKC của mọi bản Unicode — khai tường minh cho chắc.
# Đây là bốn cái gặp thật trong PDF sinh từ LaTeX/Word.
_LIG = {"ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl"}

# Nháy cong và gạch dài — thứ model chuẩn hoá khi trích lại, nên hai vế phải
# gặp nhau ở cùng một dạng. Quy về dạng THẲNG (ASCII) chứ không ngược lại:
# nguồn PDF có cả hai, output model gần như luôn là dạng thẳng.
_DAU = {
    "“": '"', "”": '"', "„": '"', "«": '"', "»": '"',
    "‘": "'", "’": "'", "‚": "'",
    "—": "-", "–": "-", "−": "-", "‐": "-", "‑": "-",
}

# Gạch nối CUỐI DÒNG: `boost-\ning` → `boosting`. Chỉ khi gạch đứng ngay trước
# xuống dòng — gạch giữa dòng (`ba-mươi`) là gạch thật, giữ nguyên.
_GACH_CUOI_DONG = re.compile(r"-[ \t]*\r?\n[ \t]*")
_KHOANG_TRANG = re.compile(r"\s+")


def chuan_hoa(s: str) -> str:
    """Đưa một chuỗi về dạng so sánh được. Áp cho CẢ HAI vế, không chỉ quote."""
    s = unicodedata.normalize("NFKC", s)
    for k, v in _LIG.items():
        s = s.replace(k, v)
    for k, v in _DAU.items():
        s = s.replace(k, v)
    s = _GACH_CUOI_DONG.sub("", s)          # nối từ bị ngắt dòng
    s = _KHOANG_TRANG.sub(" ", s)
    return s.casefold().strip()


def dinh_vi(quote: str, khoi: list[dict], nguong: float) -> dict | None:
    """Tìm `quote` trong `khoi`. Trả `{neo, diem, tang}` hoặc **None**.

    `None` nghĩa là **TỪ CHỐI khẳng định** — không phải "im lặng bỏ qua".
    `AC-3.2` đòi đúng vế đó: quote không định vị được thì khẳng định mang nó
    bị loại, vì không có cách nào biết nó đến từ đâu.
    """
    q = chuan_hoa(quote)
    if not q:
        return None

    # Tầng 2 · khớp chính xác trên bản đã chuẩn hoá.
    # `diem: None` — KHÔNG phải 100. Điểm là đại lượng của phép fuzzy; ở đây
    # không có phép đo tương đồng nào để mà cho điểm, và gán 100 là bịa ra một
    # con số rồi để người sau tưởng nó so sánh được với điểm fuzzy.
    # (Cổng `check_quote_co_that.py` bắt đúng chỗ này: một literal 0-100 trong
    # file về ngưỡng là thứ không phân biệt được với một ngưỡng gõ tay.)
    for k in khoi:
        if q in chuan_hoa(k["text"]):
            return {"neo": k["neo"], "diem": None, "tang": "chinh-xac"}

    # Tầng 3 · fuzzy. `partial_ratio_alignment` trả CẢ điểm lẫn vị trí, nên nó
    # cho luôn thứ ta cần mà không phải chạy phép thứ hai.
    tot = None
    for k in khoi:
        a = fuzz.partial_ratio_alignment(q, chuan_hoa(k["text"]))
        if a is None or a.score < nguong:
            continue
        if tot is None or a.score > tot["diem"]:
            tot = {"neo": k["neo"], "diem": float(a.score), "tang": "fuzzy"}
    return tot


def dem_citations(quotes: list[str], khoi: list[dict], nguong: float) -> dict:
    """`AC-3.3` — `citations_*` do MÁY đếm, không do model khai.

    Model trả số thì số đó bị bỏ. Hai con số dưới đây là thứ duy nhất được ghi
    vào bản nháp, và chúng đo hai việc khác nhau:
      `sampled`  — số khẳng định model đưa ra kèm quote
      `verified` — số trong đó định vị lại được
    """
    vi_tri = [dinh_vi(q, khoi, nguong) for q in quotes]
    return {
        "citations_sampled": len(quotes),
        "citations_verified": sum(1 for v in vi_tri if v is not None),
        "vi_tri": vi_tri,
    }
