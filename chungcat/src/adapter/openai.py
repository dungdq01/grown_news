#!/usr/bin/env python3
"""Adapter cho MỌI cửa nói `phuong_ngu: openai` — `POST /v1/chat/completions`.

Đây KHÔNG phải adapter của một nhà, cũng không của một gateway cụ thể. Nó là
adapter của một PHƯƠNG NGỮ, và `chungcat/assets/cua.json` nói cửa nào dùng nó.
Hôm nay: `beeknoee` (gateway trung gian) và `openai` (API gốc) — cùng file, 0
dòng khác nhau trong mã. Thêm một gateway nói tiếng OpenAI = 1 dòng bảng khai.

Mọi thứ RIÊNG của cửa đọc từ bảng khai, không gõ ở đây: host · đường · tên biến
môi trường của khoá · kiểu auth · có gửi sampling không · có stream không. Một
tên cửa trong file này là đúng thứ `M12-R4` cấm.

Không tự mở socket — mọi byte qua `egress.gui()` (`M12-R3`).
"""

from __future__ import annotations

import json
import os

import egress
from adapter import hop_dong




def _dung_prompt(prompt: str, tai_lieu: list[dict]) -> str:
    """Ghép tài liệu theo NEO. Vị trí cuối cùng vẫn do `verify.dinh_vi()` tính."""
    khoi = "\n\n".join(f"[{k['neo']}]\n{k['text']}" for k in tai_lieu)
    return f"{prompt}\n\n--- TÀI LIỆU ---\n{khoi}"


def goi(*, prompt, tai_lieu, cau_hinh, cua, allowlist=None, log=None, tran,
        **kw) -> dict:
    """`(prompt, tai_lieu, cau_hinh, cua) → {text, quotes[]}`.

    `cua` là một dòng của `cua.json`. Thiếu khoá ⇒ ném TẠI ĐÂY, không để cửa
    trả 401 sau khi payload đã dựng và `egress.jsonl` đã ghi một lần gửi hỏng —
    cùng lập luận phép chặn (c) của §4.0b.
    """
    bien = cua["bien_khoa"]
    khoa = os.environ.get(bien)
    if not khoa:
        raise RuntimeError(f"thiếu biến môi trường `{bien}` cho cửa này")
    # Khoá còn hình dạng ví dụ ⇒ chặn TẠI ĐÂY. Không có phép này thì lời gọi
    # đầu tiên trả 401 từ cửa, và nguyên nhân nằm cách đó ba tầng — người sửa đi
    # tìm ở adapter, ở allowlist, ở egress trước khi nghĩ tới `.env`.
    if "YOUR" in khoa.upper() or khoa.endswith("..."):
        raise RuntimeError(f"`{bien}` còn là khoá VÍ DỤ — điền khoá thật vào `.env`")
    than = {
        "model": cau_hinh["model"],
        "messages": [{"role": "user", "content": _dung_prompt(prompt, tai_lieu)}],
        "response_format": _hinh_dang(cau_hinh["kieu_structured"]),
        # WO-084 · Trần chữ ĐỌC TỪ BẢNG (`tran_chu_chung_cat`). Trước đợt này
        # khoá này VẮNG, nên trần thật là mặc định của cửa — một con số không
        # nằm trong repo. Nó đã cắt job của chủ dự án 2026-09-10 giữa chuỗi,
        # và câu báo lỗi lúc ấy nói "không phải JSON".
        "max_tokens": hop_dong.tran_chu(),
    }
    if cua.get("stream"):
        than["stream"] = True
    host = cua["host"]
    tra = egress.gui(
        than, f"https://{host}{cua['duong_chat']}",
        allowlist=allowlist or [host],
        tran=tran, log=log,
        headers=_auth(cua, khoa),
        nha_cung_cap=cau_hinh["nha_cung_cap"], model=cau_hinh["model"],
        khu_vuc=cau_hinh["khu_vuc"], **kw,
    )
    return _boc(tra)


def _auth(cua: dict, khoa: str) -> dict:
    """Header auth theo `kieu_auth` của bảng khai. Kiểu lạ ⇒ ném, KHÔNG rơi về
    `bearer`: rơi im lặng nghĩa là gửi khoá theo cách cửa không nhận, và câu trả
    lời là một 401 không ai đoán được vì sao."""
    kieu = cua["kieu_auth"]
    if kieu == "bearer":
        return {"Authorization": f"Bearer {khoa}"}
    if kieu == "x-api-key":
        return {"x-api-key": khoa}
    raise RuntimeError(f"`kieu_auth` lạ: {kieu}")


def _hinh_dang(kieu: str) -> dict:
    """`kieu_structured` → `response_format`. `json_schema` mà không kèm schema
    thì cửa đối xử như `json_object`; khai schema đầy đủ là việc của đơn vị sau,
    khi đo được tỉ lệ lệch thật."""
    return {"type": "json_object"}


def _boc(tra) -> dict:
    """Bóc về đúng hợp đồng. Thiếu khoá ⇒ ném, KHÔNG điền mặc định — một
    `quotes: []` tự sinh làm `citations_verified` ra 0 mà trông như model không
    trích gì, thay vì như một phản hồi hỏng."""
    noi = tra["choices"][0]["message"]["content"] if isinstance(tra, dict) else tra
    # `ly_do` = `finish_reason`. Cửa NÓI THẲNG nó cắt vì hết token; không đọc
    # trường ấy thì ta tự đoán lại một thứ đã được nói ra — và đoán sai.
    d = hop_dong.doc_json(noi, cho="chung-cat", ly_do=hop_dong.ly_do_dung(tra))
    return {"text": d["text"], "quotes": list(d["quotes"])}
