#!/usr/bin/env python3
r"""Đọc + kiểm ba bảng khai lúc khởi động. `M12-R4` · `M12-R5` · `AC-4.1`.

Vì sao kiểm LÚC ĐỌC chứ không lúc dùng: một bảng thiếu cột mà chỉ vỡ khi chạy
tới dòng đó nghĩa là nó vỡ **giữa một job đã tiêu token**. Đọc là lúc rẻ nhất
để đỏ, và là lúc duy nhất chưa có gì rời khỏi máy.

Module này KHÔNG chứa tên model hay tên nhà cung cấp nào — đó là toàn bộ điểm
của `M12-R4`. Cổng quét bằng AST nên một chuỗi trong chú thích cũng không cứu
được, và điều đó là cố ý.
"""

from __future__ import annotations

import json
from pathlib import Path

COT_BAT_BUOC = (
    "tac_vu", "ngon_ngu", "nha_cung_cap", "model", "dich", "khu_vuc",
    "du_phong", "can_key", "kieu_structured", "nguong_lech_schema", "che_do",
)


class BangKhaiHong(Exception):
    """Bảng khai thiếu cột, hoặc `du_phong` trỏ vào hư không / khác khu vực."""


def doc_model(duong) -> dict:
    """Đọc bảng khai model. Ném ngay nếu bảng không dùng được."""
    d = json.loads(Path(duong).read_text(encoding="utf-8"))
    dong = d.get("dong")
    if not isinstance(dong, list) or not dong:
        raise BangKhaiHong("bảng khai không có dòng nào")

    for i, r in enumerate(dong):
        thieu = [c for c in COT_BAT_BUOC if c not in r]
        if thieu:
            raise BangKhaiHong(f"dòng {i} thiếu cột: {thieu}")

    ten = {r["model"] for r in dong}
    for r in dong:
        dp = r.get("du_phong")
        if dp is None:
            continue
        if dp not in ten:
            raise BangKhaiHong(
                f"`du_phong` của `{r['model']}` trỏ `{dp}` — không có dòng đó")
        cung_khu = next(x for x in dong if x["model"] == dp)["khu_vuc"] == r["khu_vuc"]
        if not cung_khu and r.get("cho_phep_cheo_khu_vuc") is not True:
            raise BangKhaiHong(
                f"`{r['model']}` rơi sang `{dp}` khác `khu_vuc` mà không có cờ "
                f"tường minh — M12-R5, NĐ 356/2025 Điều 14")
    return d


def doc_nguong(duong) -> float:
    """Ngưỡng fuzzy cho `verify.dinh_vi`. Một số, một chỗ, có số đo kèm theo."""
    return float(json.loads(Path(duong).read_text(encoding="utf-8"))["nguong_fuzzy"])


def doc_tran_payload(duong) -> int:
    """Trần byte cho payload rời máy — `AC-6.4`, cửa `egress.gui`.

    KHÔNG có default. Một default ở đây là cách trần 32 MB im lặng thành một số
    khác khi bảng khai mất khoá: `egress.gui` sẽ vẫn chạy, vẫn chặn, vẫn xanh —
    chỉ chặn ở một ngưỡng không ai khai. `KeyError` là câu trả lời đúng.
    """
    return int(json.loads(Path(duong).read_text(encoding="utf-8"))["tran_payload_byte"])


def goi_y(bang: dict, tac_vu: str, ngon_ngu: str) -> dict | None:
    """GỢI Ý mặc định — **không** phải quyết định.

    `FR-053 §1.1`: người chọn thắng gợi ý. Hàng tra này chỉ dựng thứ bày sẵn
    trong bộ chọn của `web/`; nó không được là đường duy nhất tới một model.
    """
    hop = [r for r in bang["dong"]
           if r["tac_vu"] == tac_vu and r["ngon_ngu"] == ngon_ngu]
    # `la_mac_dinh` THẮNG thứ tự dòng. Trước T12-11 bảng có mỗi nhà một model
    # nên "dòng đầu khớp" tình cờ đúng; với 8 dòng thì nó thành gợi ý CHỌN THEO
    # VỊ TRÍ TRONG FILE — một cú sắp xếp lại đổi mặc định mà không ai khai.
    return next((r for r in hop if r.get("la_mac_dinh")), hop[0] if hop else None)


def duoc_phep(bang: dict, model: str) -> dict:
    """Xác thực lựa chọn của NGƯỜI — `FR-053 §1.3`, chặn TRƯỚC khi tiêu token.

    Đây là câu hỏi **NĂNG LỰC** (*M12 gọi được model đó không*), khác hẳn câu
    hỏi **AUTHZ** của `nguon[]` (*người này được đọc slug đó không* — LÕI trả
    lời, `AC-1.5`). Gộp hai loại câu hỏi là cách một trong hai mất chỗ đứng:
    LÕI không cầm bảng này, còn M12 không cầm phiên của người dùng.

    Gọi ở `POST /job` — nhịp ba của `FR-053 §1.2`. Bỏ nhịp này thì bộ chọn của
    `web/` **là** lớp xác thực, và một `curl` thẳng vào `:8790` đi qua nó.
    """
    for r in bang["dong"]:
        if r["model"] == model:
            return r
    raise BangKhaiHong(f"`{model}` không có trong bảng khai — không tạo job")


def doc_han_ms(duong) -> int:
    """Ngưỡng `qua_han` của nhật ký vận hành — `nguong.json#han_ms_cua_tho`.

    Khác `doc_tran_payload`: ở đây `KeyError` KHÔNG phải câu trả lời đúng, nên
    có default. Lý do là hậu quả khác nhau hoàn toàn — trần payload mất khoá
    thì cửa egress chặn ở một ngưỡng không ai khai (một lỗ bảo mật im lặng),
    còn ngưỡng này mất khoá thì cùng lắm một cột `qua_han` sai. Để nó ném là
    để nhật ký giết được cả dịch vụ, và một cơ chế quan sát làm sập thứ nó quan
    sát là cơ chế tệ hơn không có.
    """
    d = json.loads(Path(duong).read_text(encoding="utf-8"))
    return int(d.get("han_ms_cua_tho", 2000))
