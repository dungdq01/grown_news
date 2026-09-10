#!/usr/bin/env python3
r"""Cổng TRẦN HAI NHỊP — `M12-R9` + `AC-V4`.

Byte biết ở CỬA; thời lượng chỉ biết SAU khi đọc metadata. Đo một nhịp thì
hoặc chặn quá muộn (đã tốn 8 phút ASR), hoặc chặn bằng một con số đoán từ
byte — mà bitrate biến thiên hàng chục lần.

ĐỎ_KHI  job 2GB vào được hàng đợi · video 2 tiếng chạy ASR rồi mới dừng · số trần gõ trong mã
XANH_KHI byte chặn ở cửa · thời lượng chặn trước giây ASR đầu · ba số đọc từ bảng khai
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


import ast
import json

print()
print("1 · Ba số TRẦN ở BẢNG KHAI, không trong mã")
print()
bk = R / "chungcat" / "assets" / "nguon-transcript.json"
kiem(bk.exists(), "bảng khai `nguon-transcript.json` tồn tại")
if bk.exists():
    d = json.loads(bk.read_text(encoding="utf-8"))
    for k in ("tran_video_byte", "tran_audio_byte", "tran_giay"):
        kiem(k in d, f"bảng khai có `{k}`", str(sorted(d)))
    # `tran_giay` = 3600 CỐ Ý ngoài phép quét: 3600 là số GIÂY TRONG MỘT GIỜ,
    # và nó xuất hiện hợp lệ trong mọi phép đổi mốc thời gian (`vtt._giay`,
    # `vtt._moc`). Quét nó thì cổng tố một phép chia là một trần gõ cứng — đỏ
    # oan, và người sửa sẽ đi viết `60 * 60` để lách chứ không sửa gì thật.
    # Hai số byte thì ĐẶC TRƯNG: chúng không trùng với bất kỳ hằng số học nào.
    so = {d[k] for k in ("tran_video_byte", "tran_audio_byte") if k in d}
    SRC = R / "chungcat" / "src"
    goc = [f"{f.relative_to(R)}:{n.lineno}" for f in SRC.rglob("*.py")
           for n in ast.walk(ast.parse(f.read_text(encoding="utf-8")))
           if isinstance(n, ast.Constant) and n.value in so]
    kiem(not goc, "không số trần BYTE nào gõ cứng trong `chungcat/src/**`", str(goc))

    print()
    print("2 · Nhịp HAI đo THỜI LƯỢNG, và nó DỪNG khi không đọc được")
    print()
    asr = _nap.nap("asr")
    kiem(hasattr(asr, "thoi_luong_giay"), "`asr.thoi_luong_giay()` tồn tại")
    ma_asr = (R / "chungcat" / "src" / "asr.py").read_text(encoding="utf-8")
    kiem("MetadataHong" in ma_asr,
         "không đọc được thời lượng ⇒ NÉM, không đoán từ byte",
         "bitrate biến thiên hàng chục lần — đoán sai theo cả hai chiều")

    print()
    print("3 · Nhịp MỘT đo BYTE ở CỬA, và nó đọc số từ bảng khai")
    print()
    tn = _nap.nap("tai_nguon")
    kiem(hasattr(tn, "kiem_byte"), "`tai_nguon.kiem_byte()` tồn tại")
    try:
        tn.kiem_byte(d["tran_video_byte"] + 1, la_video=True)
        kiem(False, "byte vượt trần ⇒ NÉM")
    except Exception as e:
        kiem(type(e).__name__ == "VuotTran", "byte vượt trần ⇒ `VuotTran`",
             type(e).__name__)
    kiem(tn.kiem_byte(1024, la_video=True) == 1024, "byte trong trần ⇒ qua")

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · trần hai nhịp · số ở bảng khai")
