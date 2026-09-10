"""`chuan_hoa_tim` — MỘT hàm chuẩn hoá cho CẢ cột index lẫn câu hỏi (spec §3 · M13-R1 · T13-3).

    NFC → lower → đ→d → chèn dấu cách quanh MỖI chữ Hán → gom khoảng trắng

Vì sao từng bước (research §13.1, đo trên máy này):
  · `đ` (U+0111) KHÔNG fold được bằng tokenizer nào — unicode61 lẫn trigram — nên đ→d ở tầng ứng dụng.
  · unicode61 cắt câu 15 chữ Hán thành ĐÚNG MỘT token ⇒ mọi truy vấn tiếng Trung trả 0; chèn cách
    quanh mỗi chữ biến mỗi chữ thành một token.
  · Hai phía (index · query) đi qua CÙNG hàm này — hai hàm là lớp lỗi âm thầm nhất: hệ không báo,
    chỉ trả ÍT kết quả hơn.

Dải chữ Hán đọc từ BẢNG KHAI `core/assets/dai-han.json` (chủ M01, FR-077) NHƯ MỘT FILE — không
import mã core/, không gõ một số nào ở đây (H3). Thiếu bảng ⇒ ném NGAY lúc nạp, nêu tên file,
KHÔNG rơi về dải mặc định (H5). Đường bảng khai ghi đè được bằng env `TRUYHOI_DAI_HAN` — cho test
chứng minh vế H5 trên một đường không tồn tại mà không đụng file thật.

KHÔNG phải `chungcat.verify.chuan_hoa` (NFKC · ligature · casefold — để so khớp quote): hai hàm,
hai mục đích; thứ dùng chung là bảng khai. Cổng đối chiếu: `truyhoi/tests/check_doi_chieu_chuan_hoa.py`.
"""

from __future__ import annotations

import json
import os
import re
import unicodedata
from pathlib import Path

R = Path(__file__).resolve().parents[2]


def duong_dai_han() -> Path:
    return Path(os.environ.get("TRUYHOI_DAI_HAN") or (R / "core" / "assets" / "dai-han.json"))


def _doc_dai(p: Path) -> list[tuple[int, int]]:
    if not p.exists():
        raise FileNotFoundError(
            f"thiếu bảng khai dải Hán `{p}` — core/assets/dai-han.json (FR-077). "
            "Không có dải mặc định: thiếu bảng thì đỏ, không đoán (H5).")
    d = json.loads(p.read_text(encoding="utf-8"))
    dai = [(int(x["tu"]), int(x["den"])) for x in d["dai"]]
    if not dai or any(a > b for a, b in dai):
        raise ValueError(f"bảng khai `{p}` hỏng: dải rỗng hoặc đầu > cuối")
    return dai


_DAI = _doc_dai(duong_dai_han())
# Lớp regex dựng TỪ SỐ của bảng khai — bên đọc tự dựng phép kiểm từ số (FR-077 $comment_dai).
_LOP_HAN = re.compile("[" + "".join(f"{chr(a)}-{chr(b)}" for a, b in _DAI) + "]")
_KHOANG = re.compile(r"\s+")


def co_han(s: str) -> bool:
    """Chuỗi có ít nhất một chữ Hán theo bảng khai."""
    return bool(_LOP_HAN.search(str(s)))


def chuan_hoa_tim(s: str) -> str:
    """Bản duy nhất. Gọi ở đúng hai chỗ: dựng chỉ mục (`indexer`) và nhận truy vấn (`rank`)."""
    s = unicodedata.normalize("NFC", str(s)).lower().replace("đ", "d")
    s = _LOP_HAN.sub(lambda m: f" {m.group(0)} ", s)
    return _KHOANG.sub(" ", s).strip()
