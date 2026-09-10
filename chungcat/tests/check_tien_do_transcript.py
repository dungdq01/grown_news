#!/usr/bin/env python3
"""T12-19 — LỘ tiến độ transcript TỪNG PHẦN.

Chỉ đạo chủ dự án 2026-09-05: *"nó sinh chữ tới đâu thì show tới đó"*.

`asr.py` (`T12-16`) đã checkpoint theo block — cue đã sinh nằm sẵn trong tay
worker. Đơn vị này chỉ MỞ CỬA ĐỌC: không đổi cách ASR chạy.

BA VẾ, và vế hai mới là vế đắt:

  ① đang chạy ⇒ `GET /viec/<id>` trả `tien_do` với cue đã xong
  ② ghi NGUYÊN TỬ — kill giữa block thì file tiến độ KHÔNG BAO GIỜ dở dang.
     Một file `.vtt` cụt là thứ FE render ra nửa câu rồi ném, và nó xảy ra
     đúng lúc người đang nhìn.
  ③ job xong ⇒ dọn file tiến độ; bản chính đã là hiện vật trong kho

ĐỎ_KHI  đang chạy mà `tien_do` vắng · file tiến độ parse không được ·
        job xong mà file tiến độ còn nằm lại
XANH_KHI ba vế đo trên hàng đợi THẬT ở thư mục tạm — 0 mạng, 0 model
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import vong  # noqa: E402
import vtt as vtt_mod  # noqa: E402

loi: list[str] = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


CUE = [
    {"tu": 0.0, "den": 3.2, "text": "Câu đầu tiên của video."},
    {"tu": 3.2, "den": 7.9, "text": "Câu thứ hai, block một."},
    {"tu": 7.9, "den": 12.4, "text": "Câu thứ ba, block hai."},
]

with tempfile.TemporaryDirectory() as tmp:
    q = vong.HangDoi(Path(tmp))
    ulid = "01TD00000000000000000000TD"
    (q.goc / "new" / f"{ulid}.json").write_text(json.dumps({
        "ulid": ulid, "giai_doan": "cho", "lan_gui": 0,
        "payload": {"loai": "sinh-transcript", "slug": "video/thu"},
    }), encoding="utf-8")
    q.nhan_viec()

    print("\n1 · Ghi tiến độ TỪNG BLOCK, đọc lại được\n")

    ok(hasattr(q, "ghi_tien_do"), "`HangDoi.ghi_tien_do` tồn tại",
       "không có ⇒ cue đã sinh nằm trong RAM của worker và không ai đọc được")
    if not hasattr(q, "ghi_tien_do"):
        sys.exit("1 vấn đề — chưa có đường ghi tiến độ")

    q.ghi_tien_do(ulid, CUE[:2])
    d = q.doc_tien_do(ulid)
    ok(d is not None, "đọc lại được tiến độ")
    ok(d and d.get("cue_xong") == 2, f"`cue_xong` = 2 (được {d and d.get('cue_xong')})",
       "số cue phải là số THẬT đã sinh, không phải một phần trăm ước")
    ok(d and abs(float(d.get("giay_xong") or 0) - 7.9) < 0.01,
       f"`giay_xong` = mốc cue cuối (được {d and d.get('giay_xong')})",
       "đây là thứ FE dùng để nói *đã phiên âm tới phút mấy*")
    ok(d and str(d.get("vtt_tung_phan", "")).startswith("WEBVTT"),
       "`vtt_tung_phan` là VTT hợp lệ",
       "FE đổ thẳng nó vào khung transcript, nên nó phải parse được NGAY")
    ok(d and "block một" in str(d.get("vtt_tung_phan", "")),
       "  và chứa chữ của block đã xong")

    print("\n2 · GHI NGUYÊN TỬ — không bao giờ có file dở dang\n")

    # Ghi đè bằng bản dài hơn: nếu ghi thẳng vào file đích thì có một khoảnh
    # khắc file chỉ có nửa nội dung. `os.replace` làm phép đổi tên nguyên tử.
    q.ghi_tien_do(ulid, CUE)
    d2 = q.doc_tien_do(ulid)
    ok(d2 and d2.get("cue_xong") == 3, "ghi đè bằng bản MỚI, không nối đuôi",
       "nối đuôi thì cue trùng lặp sau mỗi lần resume")
    ok(vtt_mod.kiem_hop_le(d2["vtt_tung_phan"]),
       "bản sau vẫn là VTT hợp lệ",
       "một file tiến độ hỏng là FE render nửa câu rồi ném — đúng lúc người "
       "đang nhìn")

    ma = (R / "chungcat" / "src" / "vong.py").read_text(encoding="utf-8")
    than = ma[ma.index("def ghi_tien_do"):]
    than = than[:than.index("\n    def ", 10)] if "\n    def " in than[10:] else than
    ok("os.replace" in than or "_ghi_nguyen_tu" in than,
       "ghi qua `os.replace` (hoặc phép ghi nguyên tử sẵn có)",
       "ghi thẳng vào file đích ⇒ kill giữa chừng để lại file cụt")

    print("\n3 · Job XONG ⇒ dọn file tiến độ\n")

    ok(q.duong_tien_do(ulid).exists(), "file tiến độ đang tồn tại")
    q.dat_giai_doan(ulid, "xong")
    q.dong_viec(ulid)
    ok(not q.duong_tien_do(ulid).exists(),
       "`dong_viec` dọn file tiến độ",
       "bản chính đã thành hiện vật `.vtt` trong kho; giữ thêm một bản dở là "
       "giữ hai nguồn cho một thứ, và bản dở là bản sẽ bị đọc nhầm")

print("\n4 · `api.py` LỘ `tien_do` qua `GET /viec/<id>`\n")

api = (R / "chungcat" / "src" / "api.py").read_text(encoding="utf-8")
chi_ma = "\n".join(l.split("#")[0] for l in api.splitlines())
ok("tien_do" in chi_ma, "`api.py` gắn `tien_do` vào phản hồi `/viec/<id>`",
   "không lộ thì cue đã sinh nằm trên đĩa mà FE không có đường đọc")

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — tiến độ transcript CHƯA đọc được")
print("pass · tiến độ ghi nguyên tử, đọc được, dọn khi xong")
