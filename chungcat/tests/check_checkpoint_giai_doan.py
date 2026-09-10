#!/usr/bin/env python3
r"""Cổng CHECKPOINT THEO GIAI ĐOẠN — `AC-5.4`.

VÌ SAO CỔNG NÀY TỒN TẠI
`FR-046 §2.1` hứa *"chạy lại mặc định từ giai-đoạn-hỏng (đỡ phí token)"*. Lời
hứa đó **chỉ đúng nếu phản hồi model được LƯU**. Job hỏng ở `dang-verify` mà
không có bản lưu thì chạy lại **phải gọi model lại** — tức tốn đúng cái nó hứa
tiết kiệm. Đó là lỗ `FR-046` không nêu, và `spec §5.1` đã ghi ra.

Bản lưu nằm **CẠNH job trong Maildir**, không ở LÕI: trạng thái của THỢ thuộc
THỢ (`decisions.md` 2026-09-02 — *"hàng đợi việc GIỮ Maildir của THỢ"*).

ĐỎ_KHI  phản hồi không lưu được / đọc lại sai · chạy lại từ `dang-verify` mà
        `lan_gui` tăng · giai đoạn lạ được nhận
XANH_KHI chạy lại từ sau-model ⇒ 0 lần gửi thêm và bản lưu còn nguyên
"""

import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(R / "chungcat" / "src"))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    vong = _nap.nap("vong")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_checkpoint_giai_doan.py", "T12-6")

tmp = Path(tempfile.mkdtemp(prefix="m12-ckpt-"))
try:
    q = vong.HangDoi(tmp / "hd")
    u = q.nap("01K9ZCKPT0000000000000001", {"loai": "chung-cat-mot-nguon"})[0]
    kiem(q.doc(u)["giai_doan"] == vong.GIAI_DOAN[0],
         f"việc mới ở giai đoạn đầu (`{vong.GIAI_DOAN[0]}`)")

    q.ghi_nhan_gui(u)
    phan_hoi = {"text": "bản model tốn token để tạo", "quotes": ["a"]}
    q.luu_phan_hoi(u, phan_hoi)

    # `AC-5.4` · bản lưu nằm CẠNH job, và đọc lại NGUYÊN VẸN.
    kiem(q.doc_phan_hoi(u) == phan_hoi, "phản hồi model đọc lại nguyên vẹn từ Maildir")
    canh = list((tmp / "hd").rglob("*phan-hoi*"))
    kiem(bool(canh), "bản lưu nằm TRONG thư mục hàng đợi của THỢ, không ở LÕI",
         f"tìm thấy {canh}")

    truoc = q.doc(u)["lan_gui"]
    q.chay_lai(u, tu_giai_doan="dang-verify")
    kiem(q.doc(u)["giai_doan"] == "dang-verify", "chạy lại đặt đúng giai đoạn")
    kiem(q.doc(u)["lan_gui"] == truoc,
         "chạy lại từ `dang-verify` ⇒ `lan_gui` KHÔNG tăng (0 egress)")
    kiem(q.doc_phan_hoi(u) is not None,
         "và bản lưu CÒN — nên chạy lại không phải gọi model (AC-5.4)")

    # Giai đoạn lạ ⇒ ném. Nhận một chuỗi bất kỳ là mở đường cho trạng thái ma:
    # một việc ở giai đoạn không có trong bảng thì không vòng lặp nào xử lý nó,
    # và nó nằm đó im lặng.
    try:
        q.chay_lai(u, tu_giai_doan="giai-doan-khong-ton-tai")
        kiem(False, "giai đoạn LẠ bị từ chối")
    except Exception as e:
        kiem(True, "giai đoạn LẠ bị từ chối", f"ném {type(e).__name__}")

    kiem("dang-goi-model" in vong.GIAI_DOAN,
         "bảng giai đoạn có `dang-goi-model` — giai đoạn DUY NHẤT tiêu egress")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-5.4 chưa có răng")
print("phản hồi lưu cạnh job · chạy lại từ verify tốn 0 lần gửi")
