#!/usr/bin/env python3
r"""Định tuyến — GỢI Ý mặc định, và bốn phép chặn trước khi tiêu token.

`FR-053` đổi vai bảng khai: từ **bộ chọn** thành **danh mục năng lực**. Hàng tra
`(tac_vu × ngon_ngu)` tụt xuống **gợi ý**, và **người chọn thắng gợi ý**.

Nhưng một luật giữ nguyên văn (`spec §4` luật 2): **ngôn ngữ do MÁY ĐẾM**, không
do model tự khai. Model tự khai ngôn ngữ rồi tự được chọn theo lời khai đó là nó
cầm bút ghi vào thứ nó bị chấm — luật gốc cấm.

Và đếm theo **TỈ LỆ**, không theo *"có chữ Hán hay không"*: một bài 80% tiếng
Việt kèm một trích đoạn tiếng Trung **không** được đẩy sang nhà tiếng Trung.
Ngưỡng là **số trong bảng khai**, không giấu trong mã.
"""

from __future__ import annotations

import unicodedata

from bang_khai import BangKhaiHong, duoc_phep, goi_y

# Dải ký tự Hán. Đây là bản ĐANG CHỜ CHỦ: `model_flow §5` khai nợ *"`chuan_hoa()`
# dùng chung với M13 — dải ký tự Hán phải là MỘT bảng khai, không hai regex.
# M13 định nghĩa; M12 đọc"*. M13 chưa tồn tại, nên dải nằm tạm ở đây và phải
# chuyển sang bảng khai chung khi M13 dựng. Hai bản regex là đúng lớp lỗi đang
# làm `check_danh_muc` đỏ.
_DAI_HAN = (
    (0x3400, 0x4DBF),    # CJK Ext A
    (0x4E00, 0x9FFF),    # CJK Unified Ideographs
    (0xF900, 0xFAFF),    # CJK Compatibility Ideographs
    (0x20000, 0x2A6DF),  # CJK Ext B
)


def _la_han(ch: str) -> bool:
    m = ord(ch)
    return any(a <= m <= b for a, b in _DAI_HAN)


def ti_le_han(text: str) -> float:
    """Tỉ lệ ký tự Hán trên tổng ký tự CÓ NGHĨA (bỏ khoảng trắng, dấu câu).

    Bỏ dấu câu và khoảng trắng vì chúng chung cho mọi ngôn ngữ — để chúng vào
    mẫu số làm mọi tỉ lệ tụt xuống theo cách không nói lên gì.
    """
    co_nghia = [c for c in text if not c.isspace()
                and not unicodedata.category(c).startswith("P")]
    if not co_nghia:
        return 0.0
    return sum(1 for c in co_nghia if _la_han(c)) / len(co_nghia)


def goi_y_mac_dinh(bang: dict, tac_vu: str, text: str) -> dict | None:
    """Dòng bảng khai được bày sẵn trong bộ chọn của `web/`. KHÔNG phải quyết định."""
    nguong = bang.get("nguong_han")
    if nguong is None:
        raise BangKhaiHong("bảng khai thiếu `nguong_han` — ngưỡng không được ở trong mã")
    ngon_ngu = "zh" if ti_le_han(text) >= float(nguong) else "vi"
    return goi_y(bang, tac_vu, ngon_ngu) or goi_y(bang, tac_vu, "vi")


def quyet_dinh(bang: dict, tac_vu: str, text: str, *, model_nguoi_chon=None,
               co_khoa: bool = True, _dau_vet_goi=None) -> dict:
    """Chốt dòng bảng khai sẽ dùng. Chặn TRƯỚC khi bất kỳ token nào bị tiêu.

    Bốn phép chặn của `FR-053 §1.3` — cả bốn xảy ra ở đây, tức trước lời gọi:
      a. `model` không có trong bảng khai
      b. nhà đó chưa có adapter
      c. `can_key: true` mà env thiếu khoá
      d. `khu_vuc` khác khu vực của gợi ý mặc định  →  chỉ CẢNH BÁO ở tầng này;
         hiện `khu_vuc` cho người thấy là việc của `web/` (`FR-053 §1.4`), vì
         quyết định pháp lý phải do NGƯỜI nhìn thấy mà bấm, không do máy chặn hộ.

    `_dau_vet_goi` là móc cho cổng đếm số lần gọi model — nó phải ở **0** sau
    mọi ca bị chặn.
    """
    mac_dinh = goi_y_mac_dinh(bang, tac_vu, text)
    if model_nguoi_chon is None:
        dong = mac_dinh
        if dong is None:
            raise BangKhaiHong(f"không có gợi ý mặc định cho tác vụ `{tac_vu}`")
    else:
        dong = duoc_phep(bang, model_nguoi_chon)          # a

    from adapter import hop_dong                           # b
    # FR-059 · hỏi CỬA, không hỏi NHÀ. Cửa của dự án nói một hợp đồng
    # OpenAI-compatible ⇒ mọi model một adapter; hỏi theo nhà thì hầu hết model
    # bị chặn oan. Tên cửa đọc TỪ BẢNG KHAI (M12-R4), thiếu thì ném.
    ten_cua = bang.get("$adapter_mac_dinh")
    if not ten_cua:
        raise BangKhaiHong("bảng khai thiếu `$adapter_mac_dinh` — tên cửa "
                           "không được ở trong mã")
    ad = hop_dong.adapter_cua(dong, ten_cua)
    if not hop_dong.co_adapter(ad):
        raise BangKhaiHong(
            f"cửa `{ad}` chưa có adapter — đỏ ở cổng khai báo, không thử chạy "
            f"rồi lỗi giữa job")

    if dong.get("can_key") and not co_khoa:               # c
        raise BangKhaiHong(
            f"`{dong['model']}` đòi khoá mà env không có — chặn trước khi dựng "
            f"payload, vì một payload đã dựng là một dòng log egress hỏng")

    if mac_dinh and dong["khu_vuc"] != mac_dinh["khu_vuc"]:   # d
        dong = {**dong, "$canh_bao_khu_vuc": (
            f"khác khu vực gợi ý mặc định ({mac_dinh['khu_vuc']}) — `web/` phải "
            f"HIỆN điều này cho người chọn thấy, FR-053 §1.4")}
    return dong
