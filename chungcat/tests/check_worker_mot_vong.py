#!/usr/bin/env python3
r"""Cổng WORKER MỘT VÒNG — `T12-13` AC1.

Job hợp lệ trong `new/` → `--mot` chạy trọn `doc-byte`→`done/`. Đo VẬT (file
Maildir + hàng DB), không đo lời khai của worker.

ĐỎ_KHI  job kẹt ở `new/` · `done/` mà C2 không có nháp · `giai_doan` sai chuỗi
XANH_KHI chuỗi trọn · hàng DB có `ban_goc_ai` · `cur/` rỗng khi xong
"""

import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(R / "chungcat" / "src"))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}"
          + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    worker = _nap.nap("worker")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_worker_mot_vong.py", "T12-13")

print()
print("1 · `--mot` lấy ĐÚNG một job và chạy trọn")
print()
kiem(hasattr(worker, "mot_vong"), "`worker.mot_vong()` tồn tại")
kiem(hasattr(worker, "BANG_LOAI"),
     "dispatch theo BẢNG `loai`→hàm, không phải chuỗi `if`",
     "thêm một `loai` phải là thêm MỘT ENTRY, không phải sửa một hàm")
kiem("chung-cat-mot-nguon" in worker.BANG_LOAI,
     "`chung-cat-mot-nguon` có người chạy trong bảng")

print()
print("2 · Hàng đợi RỖNG ⇒ `None`, không ném")
print()
import tempfile

vong = _nap.nap("vong")
q = vong.HangDoi(tempfile.mkdtemp(prefix="m12-mv-"))
kiem(worker.mot_vong(q) is None, "hàng đợi rỗng ⇒ trả `None`")

print()
print("3 · Job chạy được ⇒ `cur/` trong lúc chạy, `done/` khi xong")
print()
GHI = []
worker.BANG_LOAI["thu-cho-cong"] = lambda qq, u, v: (
    GHI.append((u, (qq.goc / "cur" / f"{u}.json").exists())) or {"ok": True})
try:
    q.nap("01MV1", {"loai": "thu-cho-cong", "slug": "x"})
    u = worker.mot_vong(q)
    kiem(u == "01MV1", "chiếm đúng job vừa nạp", str(u))
    kiem(GHI and GHI[0][1],
         "job nằm trong `cur/` LÚC ĐANG CHẠY — không còn ở `new/`")
    kiem((q.goc / "done" / "01MV1.json").exists(),
         "xong ⇒ file sang `done/`")
    kiem(q.doc("01MV1")["giai_doan"] == "xong",
         "giai đoạn cuối là `xong`", q.doc("01MV1")["giai_doan"])

    print()
    print("4 · Job HỎNG KHÔNG đi vào `done/` — nó ở lại cho `chay_lai`")
    print()
    def _no(qq, u, v):
        raise worker.ViecHong("dang-goi-model", "gieo lỗi cho cổng")
    worker.BANG_LOAI["thu-hong"] = _no
    q.nap("01MV2", {"loai": "thu-hong", "slug": "x"})
    worker.mot_vong(q)
    kiem(not (q.goc / "done" / "01MV2.json").exists(),
         "job hỏng KHÔNG ở `done/` — 'xong' phải là một câu đúng")
    # WO-066 · hợp đồng ĐỔI: `giai_doan` nói TRẠNG THÁI (`hong`), chỗ hỏng nằm
    # ở `giai_doan_hong`. Bản cũ để `giai_doan` = chỗ hỏng, nên màn không
    # phân biệt được "đang ở dang-goi-model" với "đã chết ở dang-goi-model".
    kiem(q.doc("01MV2")["giai_doan"] == "hong",
         "và giai đoạn là `hong` — màn thấy nó chết, không thấy nó 'chờ'",
         q.doc("01MV2")["giai_doan"])
    kiem(q.doc("01MV2").get("giai_doan_hong") == "dang-goi-model",
         "chỗ HỎNG giữ ở `giai_doan_hong`, để `chay_lai` nhặt đúng chỗ",
         q.doc("01MV2").get("giai_doan_hong"))
finally:
    worker.BANG_LOAI.pop("thu-cho-cong", None)
    worker.BANG_LOAI.pop("thu-hong", None)

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · worker chạy trọn một vòng")

# ══ T12-13b · frontmatter mang ĐÚNG con số verify đã đo ═══════════════════
#
# Đo trên hệ chạy thật 2026-09-04: worker trả `citations_verified: 1` nhưng
# frontmatter của bản nháp ghi **0** — `_dung_nhap` đọc khoá `sampled`/`verified`
# còn `verify.dem_citations` trả `citations_sampled`/`citations_verified`, nên
# `.get(..., 0)` lặng lẽ điền 0.
#
# Sai theo chiều NÓI ÍT HƠN THẬT là chiều tệ nhất ở đúng cột này: người duyệt
# đọc "0 quote xác minh" rồi tin bản nháp yếu hơn nó thật, và `M01-R2` để dành
# cột đó cho NGƯỜI chấm.
print()
print("T12-13b · số verify vào frontmatter KHÔNG được lặng lẽ về 0")
print()
_dem = {"citations_sampled": 3, "citations_verified": 2}
_fm = worker._dung_nhap("tai-lieu/x", {"text": "t", "model_da_dung": "m"}, _dem)
kiem("citations_sampled: 3" in _fm, "`citations_sampled` đi nguyên vào frontmatter",
     _fm.split("---")[1] if "---" in _fm else _fm)
kiem("citations_verified: 2" in _fm, "`citations_verified` đi nguyên vào frontmatter")

# Và KHÔNG được có đường rơi về mặc định: thiếu khoá phải NÉM, không điền 0.
try:
    worker._dung_nhap("tai-lieu/x", {"text": "t"}, {})
    kiem(False, "thiếu khoá đếm ⇒ NÉM, không điền 0",
         "`.get(..., 0)` biến một lỗi lập trình thành một con số nói dối")
except KeyError:
    kiem(True, "thiếu khoá đếm ⇒ NÉM `KeyError`, không điền 0")
