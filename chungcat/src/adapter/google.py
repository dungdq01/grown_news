#!/usr/bin/env python3
r"""Adapter nhà thứ NHẤT. `AC-3.1` — ~30 dòng, và đây là toàn bộ bề mặt riêng.

Mọi thứ riêng của nhà này sống trong file này. LÕI (`chungcat/src/**` TRỪ
`adapter/**`) không biết tên nó — cổng `check_mot_hop_dong.py` quét bằng AST.

Thêm một nhà = **một dòng bảng khai + một file như file này**, và `AC-3.1` là
phép đo thật của mệnh đề đó. `T12-7` (nhà thứ hai) tồn tại chỉ để đo nó, như
`C9` đo `M8.2`.

Nó **không** tự mở socket. Mọi byte đi ra qua `egress.gui()` — cửa duy nhất,
nơi `seq` được cấp và log ghi TRƯỚC khi gửi (`M12-R3`).

⚠️ CHƯA CHẠY THẬT. `dich` trong bảng khai là gateway của chủ dự án và **tên
định danh model mà gateway nhận chưa được xác minh** — mỗi gateway đặt tên một
kiểu. Hình dạng request/response dưới đây là hình dạng OpenAI-compatible, thứ
phần lớn gateway nói được; **chốt lại khi có lời gọi đầu tiên chạy thật**.
"""

from __future__ import annotations

import json

import egress

from . import hop_dong


def _dung_prompt(prompt: str, tai_lieu: list[dict]) -> str:
    """Ghép tài liệu theo NEO. Neo đi cùng text để model trích được kèm địa chỉ —
    nhưng vị trí cuối cùng vẫn do `verify.dinh_vi()` của TA tính lại."""
    khoi = "\n\n".join(f"[{k['neo']}]\n{k['text']}" for k in tai_lieu)
    return f"{prompt}\n\n--- TÀI LIỆU ---\n{khoi}"


def goi(*, prompt, tai_lieu, cau_hinh, allowlist=None, log=None, tran, **kw) -> dict:
    """`(prompt, tai_lieu, cau_hinh) → {text, quotes[]}` — hợp đồng, không hơn."""
    than = {
        "model": cau_hinh["model"],
        "messages": [{"role": "user", "content": _dung_prompt(prompt, tai_lieu)}],
        # Hợp đồng đòi structured output. `kieu_structured` của bảng khai quyết
        # cách yêu cầu; nhà chỉ có `json_mode` thì schema phải PHẲNG — lồng sâu
        # là chỗ tỉ lệ lệch schema 5-12% biến thành job chết (xem bảng khai).
        "response_format": {"type": "json_object"},
        # WO-084 · cùng nguồn trần với `openai.py` — `hop_dong.tran_chu()`.
        "max_tokens": hop_dong.tran_chu(),
    }
    tra = egress.gui(
        than, f"https://{cau_hinh['dich']}/v1/chat/completions",
        allowlist=allowlist or [cau_hinh["dich"]],
        tran=tran, log=log,
        nha_cung_cap=cau_hinh["nha_cung_cap"], model=cau_hinh["model"],
        khu_vuc=cau_hinh["khu_vuc"], **kw,
    )
    return _boc(tra)


def _boc(tra) -> dict:
    """Bóc phản hồi về đúng hợp đồng. Thiếu khoá ⇒ ném, KHÔNG điền mặc định.

    Điền mặc định ở đây là bịa: một `quotes: []` tự sinh làm `citations_verified`
    ra 0 mà trông như model không trích gì, thay vì như một phản hồi hỏng.
    """
    noi = tra["choices"][0]["message"]["content"] if isinstance(tra, dict) else tra
    # WO-084 · Trước đợt này chỗ này dùng `json.loads` TRẦN — nó chưa từng đi
    # qua `doc_json`, nên một phản hồi hỏng ở lối `google` chỉ nói *"Expecting
    # value line 1 column 1"*. Đúng thứ `go_khung` đã cảnh báo: hai bản của một
    # phép là hai bản sẽ lệch.
    d = hop_dong.doc_json(noi, cho="chung-cat", ly_do=hop_dong.ly_do_dung(tra))
    return {"text": d["text"], "quotes": list(d["quotes"])}
