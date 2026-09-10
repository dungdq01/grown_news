#!/usr/bin/env python
"""WO-079 · T12-35 — Cue đảo mốc bị bỏ qua; chunk gặp 502 thử lại NGẦM.

Hai lỗ đo trên job thật của chủ dự án 2026-09-09:

  1 `VttHong: cue 172: den (687.841) trước tu (743.8)` — model trả một cue kết
    thúc TRƯỚC lúc bắt đầu. `vtt.dung()` từ chối cả file ⇒ job hỏng, **172 cue
    tốt bị vứt**. Ngay phía trên chỗ đó, mã đã bỏ qua cue THIẾU mốc với đúng lý
    lẽ *"bỏ một cue thì mất một câu — thấy được"*. Cùng loại rác, hai cách xử.
  2 `502 Bad Gateway` giữa chừng bay thẳng ra khỏi vòng chunk ⇒ job hỏng, dù
    vòng ấy ĐÃ có cơ chế thử lại (chỉ dùng cho ca *"đoạn không tiến"*).

Chủ dự án đề xuất nới `lan_gui` lên 5–10. Đo ra: `ghi_nhan_gui` gọi MỘT lần cho
cả job (`worker.py:845`), nên nới nó chỉ cho khởi động lại nhiều lượt hơn —
mỗi lượt vẫn chết ở đúng chunk ấy. Đòn đúng là thử lại CHÍNH CHUNK.

── Vế 3 nặng ngang vế 2 ────────────────────────────────────────────────────
Thử lại một 401/422 là đốt egress để nhận lại đúng câu trả lời ấy, ba lần. Một
cơ chế retry không phân biệt hai loại lỗi thì nó không phải retry — nó là một
vòng lặp có hoá đơn.

── Vì sao CHẠY THẬT, không grep ────────────────────────────────────────────
Grep `"den <= tu"` xanh ngay cả khi phép so viết ngược. Cổng này bơm phản hồi
GIẢ qua `_gui` — đúng khuôn `check_cat_doan_audio.py` — rồi đọc cue thật đi ra.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

loi = 0
NL = chr(10)


def ok(d, chu, them=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {chu}" + ("" if d else f"  <- {them}"))
    if not d:
        loi += 1


import asr_cua  # noqa: E402

print("\nWO-079 · cue đảo mốc bỏ qua · chunk 502 thử lại ngầm\n")

tmp = Path(tempfile.mkdtemp(prefix="gn-thulai-"))
DONG = {"model": "gia/model", "nha_cung_cap": "gia",
        "khu_vuc": "tai-cho", "ho_tro_audio": True}
import os  # noqa: E402
_cua = asr_cua.hop_dong.cua_cua({"model": "gia/model"}, asr_cua.hop_dong.doc_cua())
os.environ.setdefault(_cua["bien_khoa"], "khoa-gia-cho-cong")


def _wav(giay: float) -> Path:
    """Một file audio THẬT dài `giay` giây — ffmpeg, không giả bằng byte rỗng."""
    f = tmp / f"a{int(giay)}.mp3"
    if not f.exists():
        subprocess.run(
            ["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r=16000:cl=mono",
             "-t", str(giay), "-b:a", "32k", str(f)],
            capture_output=True, check=True)
    return f


try:
    AUDIO = _wav(20)
except Exception as e:                                     # noqa: BLE001
    AUDIO = None
    ok(False, "0 · dựng được file audio thật bằng ffmpeg", str(e)[:120])

# ── 1 · Cue đảo mốc bị BỎ QUA, phần còn lại vẫn về ───────────────────────
print("1 · Cue `den <= tu` bị bỏ qua, cue tốt vẫn giữ\n")

if AUDIO:
    def gui_dao(than, dich, **kw):
        """Cửa giả: ba cue, cue GIỮA đảo mốc (`den` < `tu`)."""
        return {"choices": [{"message": {"content": json.dumps({"doan": [
            {"tu": 0.0, "den": 5.0, "text": "Câu tốt một."},
            {"tu": 12.0, "den": 6.0, "text": "CUE ĐẢO MỐC."},
            {"tu": 6.0, "den": 19.5, "text": "Câu tốt hai."},
        ]})}}]}

    try:
        cue = asr_cua.phien_am(AUDIO, dong_model=DONG, log=tmp / "e1.jsonl",
                               tran=10 ** 9, giay_moi_doan=600, _gui=gui_dao)
        nem = None
    except Exception as e:                                 # noqa: BLE001
        cue, nem = [], f"{type(e).__name__}: {e}"

    ok(nem is None, "1 · KHÔNG ném — một cue rác không được giết cả lượt",
       nem or "")
    ok(all("ĐẢO MỐC" not in str(c.get("text", "")) for c in cue),
       "1a · cue đảo mốc KHÔNG có mặt trong kết quả",
       f"được: {[c.get('text') for c in cue]}")
    ok(len(cue) == 2, f"1b · hai cue tốt VẪN về (được {len(cue)})",
       "bỏ cue rác mà bỏ luôn cue tốt là chữa bệnh bằng cách giết bệnh nhân")
    ok(all(float(c["den"]) > float(c["tu"]) for c in cue),
       "1c · mọi cue đi ra đều `den` > `tu` — `.vtt` dựng được")

# ── 2 · Lỗi TẠM THỜI ⇒ thử lại chính chunk ấy ────────────────────────────
print("\n2 · 502 giữa chừng ⇒ thử lại chunk, không giết job\n")

ng = {}
try:
    ng = json.loads((R / "chungcat" / "assets" / "nguong.json")
                    .read_text(encoding="utf-8"))
except Exception as e:                                     # noqa: BLE001
    ok(False, "2 · đọc được `nguong.json`", str(e))
ok(isinstance(ng.get("tran_thu_lai_cua"), int) and ng["tran_thu_lai_cua"] >= 1,
   f"2 · bảng khai có `tran_thu_lai_cua` (được {ng.get('tran_thu_lai_cua')!r})",
   "trần thử lại gõ trong mã là một con số không ai sửa được mà không sửa mã")

src = (R / "chungcat" / "src" / "asr_cua.py").read_text(encoding="utf-8")
ok("tran_thu_lai_cua" in src, "2a · mã ĐỌC trần ấy từ bảng")

if AUDIO:
    class _Loi502(Exception):
        def __init__(self):
            super().__init__("Server error '502 Bad Gateway' for url ...")
            self.response = type("r", (), {"status_code": 502})()

    dem = {"n": 0}

    def gui_502_roi_ok(than, dich, **kw):
        """Hai lần đầu 502, lần ba trả cue thật — đúng hình cửa đang ốm."""
        dem["n"] += 1
        if dem["n"] <= 2:
            raise _Loi502()
        return {"choices": [{"message": {"content": json.dumps({"doan": [
            {"tu": 0.0, "den": 19.5, "text": "Về được sau hai lần 502."},
        ]})}}]}

    try:
        cue2 = asr_cua.phien_am(AUDIO, dong_model=DONG, log=tmp / "e2.jsonl",
                                tran=10 ** 9, giay_moi_doan=600,
                                _gui=gui_502_roi_ok)
        nem2 = None
    except Exception as e:                                 # noqa: BLE001
        cue2, nem2 = [], f"{type(e).__name__}: {str(e)[:110]}"

    ok(nem2 is None, "2b · hai lần 502 rồi thành công ⇒ KHÔNG ném", nem2 or "")
    ok(len(cue2) == 1 and "Về được" in str(cue2[0].get("text", "")),
       f"2c · và cue thật về đủ (được {len(cue2)})")
    ok(dem["n"] == 3, f"2d · đã gọi cửa đúng 3 lần (được {dem['n']})",
       "ít hơn ⇒ không thử lại; nhiều hơn ⇒ trần không có tác dụng")

    # Trần phải CÓ RĂNG: 502 mãi thì phải dừng, không quay vô hạn.
    dem2 = {"n": 0}

    def gui_502_mai(than, dich, **kw):
        dem2["n"] += 1
        raise _Loi502()

    try:
        asr_cua.phien_am(AUDIO, dong_model=DONG, log=tmp / "e3.jsonl",
                         tran=10 ** 9, giay_moi_doan=600, _gui=gui_502_mai)
        nem3 = None
    except Exception as e:                                 # noqa: BLE001
        nem3 = f"{type(e).__name__}"
    ok(nem3 is not None, "2e · 502 mãi ⇒ VẪN ném, không quay vô hạn", "")
    tr = ng.get("tran_thu_lai_cua") or 0
    ok(dem2["n"] <= tr + 1,
       f"2f · và dừng đúng trần (gọi {dem2['n']}, trần {tr})",
       "quá trần nghĩa là một vòng lặp có hoá đơn — đúng thứ WO-069 đã đóng")

# ── 3 · Lỗi KHÔNG tạm thời ⇒ ném NGAY ────────────────────────────────────
print("\n3 · 401/422 KHÔNG thử lại — thử lại một lỗi cấu hình là đốt tiền\n")

if AUDIO:
    dem3 = {"n": 0}

    class _Loi401(Exception):
        def __init__(self):
            super().__init__("Client error '401 Unauthorized' for url ...")
            self.response = type("r", (), {"status_code": 401})()

    def gui_401(than, dich, **kw):
        dem3["n"] += 1
        raise _Loi401()

    try:
        asr_cua.phien_am(AUDIO, dong_model=DONG, log=tmp / "e4.jsonl",
                         tran=10 ** 9, giay_moi_doan=600, _gui=gui_401)
    except Exception:                                      # noqa: BLE001
        pass
    ok(dem3["n"] == 1, f"3 · 401 ⇒ gọi ĐÚNG một lần (được {dem3['n']})",
       "thử lại một lỗi khoá là nhận lại cùng câu trả lời, ba lần, có hoá đơn")

# ── 4 · `M12-R6` KHÔNG bị nới nhân dịp này ───────────────────────────────
print("\n4 · `lan_gui` và trần 2 giữ nguyên\n")

vsrc = (R / "chungcat" / "src" / "vong.py").read_text(encoding="utf-8")
ok("TRAN_GUI = 2" in vsrc.replace(" ", " "),
   "4 · `TRAN_GUI` vẫn là 2",
   "chủ dự án đề xuất nới lên 5-10; đo ra nó đếm LƯỢT JOB nên nới không cứu "
   "được 502 giữa chừng — sửa đúng chỗ thì không phải nới")
wsrc = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
ok(wsrc.count("q.ghi_nhan_gui(ulid)") >= 1,
   "4a · `ghi_nhan_gui` vẫn được gọi — thử lại ngầm không được giấu egress")

if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — cue rác bỏ qua, 502 thử lại có trần, 401 ném ngay{NL}")
