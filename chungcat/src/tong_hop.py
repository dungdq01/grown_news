#!/usr/bin/env python3
r"""`tong-hop-chu-de` — loại việc thứ hai. `FR-044` · `AC-2.1` … `AC-2.3`.

MỘT hợp đồng, HAI loại việc (`spec §2`): cùng đường API, khác `loai` trong
payload. Đây là nửa `tong-hop` — N nguồn thành một bản ghi `ho_so: tong-hop`.

VÌ SAO NÓ LÀ MỘT LOẠI VIỆC RIÊNG chứ không phải `phan-tich` với nhiều nguồn
`FR-044 §0`: ở `phan-tich`, câu *"địa chỉ này trỏ đâu"* có **đúng một** đáp án.
Ở `tong-hop` nó có **N** — nên địa chỉ phải **mang tên nguồn**:
`[xgboost-stap-by-step:p.7]`, không phải `[p.7]`. Đó là `T2`, và `FR-044` gọi nó
là *"cổng đắt nhất và là lý do hồ sơ này đáng tồn tại"*.

Ba cổng của `FR-044 §2`:

    T1  `nguon` có ≥2 slug, MỖI slug tồn tại trong kho
    T2  MỌI địa chỉ phân giải về MỘT slug trong `nguon`
    T3  MỖI nguồn được nhắc ít nhất một lần

`T3` bắt một kiểu bịa riêng của tổng hợp: **khai năm nguồn cho oai rồi chỉ đọc
hai**. Không có nó thì `nguon` thành một danh sách trang trí.

⚠️ Phép tách địa chỉ đọc `core/assets/dia-chi.json` như **FILE**, không import
mã của `core/`. `model_flow §2`: `M01-R4` cấm `core/` đọc `web/`; đối xứng, THỢ
import mã của LÕI là dính hai vùng. Cái giá là **hai bản phép tách**, và đó là
nợ đã khai ở `model_flow §5`.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
DIA_CHI = R / "core" / "assets" / "dia-chi.json"


class TongHopHong(Exception):
    """Một trong ba cổng T1–T3 của `FR-044` không qua."""


def _dang() -> list[dict]:
    """Đọc bảng khai dạng địa chỉ. Bảng vắng ⇒ NÉM, không rơi về regex ngầm.

    Rơi về một regex trong mã là tái sinh `LOCATOR_RE` — thứ `FR-046` đã bỏ vì
    nó khớp *ngoặc vuông bất kỳ*, và một công thức toán đi qua cổng.
    """
    if not DIA_CHI.exists():
        raise TongHopHong(
            f"thiếu bảng khai `{DIA_CHI.name}` — KHÔNG rơi về regex trong mã")
    return json.loads(DIA_CHI.read_text(encoding="utf-8"))["dang"]


def tach_dia_chi(than: str) -> list[dict]:
    """Rút mọi `[...]` rồi khớp với bảng khai. Không khớp dạng nào ⇒ **BỎ QUA**.

    Vế *bỏ qua im lặng* là cả một quyết định (`FR-046`/proposal Q5): công thức
    toán trong ngoặc vuông vẫn viết thoải mái, chỉ không được đếm. Cổng chỉ đỏ
    khi một mục **không có** địa chỉ nào hiểu được — nếu không thì cổng đỏ oan,
    và một cổng đỏ oan là cổng bị người tắt.
    """
    ra = []
    for tho in re.findall(r"\[([^\]]{1,120})\]", than):
        for d in _dang():
            m = re.match(d["mau"], tho)
            if m:
                ra.append({"tho": tho, "dang": d["ten"], "nhom": m.groups(),
                           "manh": d["manh"]})
                break
    return ra


def slug_cua(dc: dict) -> str | None:
    """Slug mà một địa chỉ trỏ tới, nếu dạng của nó MANG tên nguồn.

    Dạng không mang tên nguồn (`[p.7]`, `[§II.4]`) trả `None` — và ở `tong-hop`
    thì `None` chính là thứ `T2` phải bắt.
    """
    if dc["dang"].startswith("slug") and dc["nhom"]:
        return dc["nhom"][0]
    return None


def kiem_tong_hop(nguon: list[str], than: str, *, slug_co_that=None) -> dict:
    """Chạy T1–T3. Ném `TongHopHong` ở cổng đầu tiên không qua.

    `slug_co_that` là phép tra kho — **tiêm vào**, không tự gọi: `M12-R1` cấm
    THỢ mở kho, nên phép tra là lời gọi HTTP của người gọi, không phải của hàm
    này. Không tiêm ⇒ T1 chỉ kiểm được HÌNH DẠNG, và hàm nói ra điều đó.
    """
    # ── T1 · ≥2 slug, mỗi slug tồn tại ───────────────────────────────────
    if not isinstance(nguon, list) or len(nguon) < 2:
        raise TongHopHong(
            f"T1 · `nguon` cần ≥2 slug, có {len(nguon or [])} — tổng hợp từ MỘT "
            f"nguồn LÀ một `phan-tich`, và cho phép 1 là mở đường dùng nhầm hồ sơ "
            f"để thoát cổng locator")
    if len(set(nguon)) != len(nguon):
        raise TongHopHong(f"T1 · `nguon` có slug trùng: {nguon}")
    thieu_tra = slug_co_that is None
    if not thieu_tra:
        hu = [s for s in nguon if not slug_co_that(s)]
        if hu:
            raise TongHopHong(f"T1 · slug trỏ vào hư không: {hu}")

    # ── T2 · MỌI địa chỉ phân giải về một slug trong `nguon` ──────────────
    dc = tach_dia_chi(than)
    if not dc:
        raise TongHopHong("T2 · thân bài không có địa chỉ nào máy hiểu được")
    ngoai, khong_ten = [], []
    for d in dc:
        s = slug_cua(d)
        if s is None:
            khong_ten.append(d["tho"])
        elif s not in nguon:
            ngoai.append(d["tho"])
    if khong_ten:
        raise TongHopHong(
            f"T2 · địa chỉ KHÔNG mang tên nguồn: {khong_ten} — ở `tong-hop`, câu "
            f"'địa chỉ này trỏ đâu' có N đáp án, nên `[p.7]` là không đủ")
    if ngoai:
        raise TongHopHong(f"T2 · địa chỉ trỏ RA NGOÀI danh sách `nguon`: {ngoai}")

    # ── T3 · MỖI nguồn được nhắc ít nhất một lần ──────────────────────────
    da_nhac = {slug_cua(d) for d in dc}
    quen = [s for s in nguon if s not in da_nhac]
    if quen:
        raise TongHopHong(
            f"T3 · khai nguồn rồi KHÔNG trích lần nào: {quen} — đây là kiểu bịa "
            f"riêng của tổng hợp (khai năm nguồn cho oai, đọc hai)")

    return {"so_dia_chi": len(dc), "nguon_da_nhac": sorted(da_nhac),
            "t1_chi_kiem_hinh_dang": thieu_tra}


def url_tu_dat(slug: str) -> str:
    """`FR-044 §1.4` — `url` GIỮ bắt buộc, dùng URI tự đặt tên.

    Nó **nói đúng sự thật**: bản ghi này không đến từ đâu cả, hệ thống này làm
    ra nó. `url` của một bản tổng hợp mà trỏ vào một trong các nguồn là nói dối.
    """
    return f"grown://tong-hop/{slug}"
