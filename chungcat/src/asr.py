#!/usr/bin/env python3
"""ASR LOCAL — byte audio → cue. `M12-R8`: **0 lời gọi mạng ở đây.**

Không import `egress`, và cổng `check_asr_khong_egress.py` quét bằng AST để
chứng minh. Lối `dich_vu` (gửi audio tới cửa LLM) là một module KHÁC — gộp hai
lối vào một file là làm cột `tieu_egress` của `nguon-transcript.json` thành một
lời khai, vì không phép đo nào phân biệt được đường nào vừa chạy.

`faster-whisper` (MIT, CTranslate2) INT8 — **không** WhisperX, **không** pyannote:
`[t=03:15]` là độ phân giải GIÂY, còn Whisper mức-đoạn lệch hàng trăm ms, tức
**vô hình** ở độ phân giải đó. WhisperX mua <100 ms bằng một model wav2vec2 nữa
cộng một model **gated cần token HuggingFace**.

Model tải vào `CHUNGCAT_MODEL_DIR` — **ngoài repo**. Trong repo thì một lần
`git status` thấy 500 MB, và công cụ quy chủ mù đi (`WO-039`).
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

BIEN_MODEL_DIR = "CHUNGCAT_MODEL_DIR"
BIEN_MODEL = "CHUNGCAT_ASR_MODEL"


class ThieuAsr(Exception):
    """Gói ASR chưa cài. Đỏ vì THIẾU GÓI, không vì thiếu mã — hai việc khác nhau."""


class MetadataHong(Exception):
    """Không đọc được thời lượng. `M12-R9` nhịp hai không đo được ⇒ DỪNG."""


def thoi_luong_giay(duong) -> float:
    """Thời lượng nguồn, đọc bằng `ffprobe`.

    Nhịp HAI của `M12-R9`, và nó phải chạy **trước giây ASR đầu tiên**. Không
    đọc được thì **DỪNG**, không đoán từ byte: bitrate biến thiên hàng chục lần,
    nên một phép đoán sai theo cả hai chiều — chặn oan một video hợp lệ, hoặc
    cho qua một video hai tiếng.
    """
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(duong)],
            capture_output=True, text=True, timeout=60, check=True)
    except (OSError, subprocess.SubprocessError) as e:
        raise MetadataHong(
            f"không đọc được thời lượng của `{duong}`: {e}. KHÔNG đoán từ byte — "
            f"bitrate biến thiên hàng chục lần.") from e
    try:
        return float(r.stdout.strip())
    except ValueError as e:
        raise MetadataHong(f"`ffprobe` trả thứ không phải số: {r.stdout!r}") from e


def _model():
    """Nạp model. Thiếu gói ⇒ `ThieuAsr`, KHÔNG `ImportError` trần: cổng phải
    phân biệt được *thiếu gói* với *thiếu mã* (`chungcat/tests/_nap.py`)."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise ThieuAsr(
            "chưa cài `faster-whisper`. Đây là THIẾU GÓI, không phải thiếu mã: "
            "`pip install faster-whisper`") from e
    ten = os.environ.get(BIEN_MODEL, "small")
    thu_muc = os.environ.get(BIEN_MODEL_DIR)
    if not thu_muc:
        raise ThieuAsr(
            f"thiếu `{BIEN_MODEL_DIR}` — model ~500MB phải nằm NGOÀI repo. "
            f"Trong repo thì `git status` thấy nó, và quy chủ mù đi.")
    return WhisperModel(ten, device="cpu", compute_type="int8",
                        download_root=thu_muc)


def phien_am(duong, *, moc_bat_dau: float = 0.0, ghi_nhan=None) -> list[dict]:
    """`byte audio → [{tu, den, text}]`, cue theo GIÂY.

    `moc_bat_dau` + `ghi_nhan` là móc CHECKPOINT theo block: `T12-16` khai
    *"resume không chạy lại block xong"*, và với 8 phút ASR cho một video 60
    phút thì lời hứa đó phải thật. Người gọi lưu cue đã có rồi truyền mốc cuối
    vào `moc_bat_dau` — hàm này không tự quản checkpoint, `vong.py` quản.
    """
    m = _model()
    doan, _ = m.transcribe(str(duong), vad_filter=True,
                           without_timestamps=False)
    ra = []
    for d in doan:
        if d.end <= moc_bat_dau:
            continue                      # block đã xong ở lượt trước
        cue = {"tu": float(d.start), "den": float(d.end),
               "text": (d.text or "").strip()}
        ra.append(cue)
        if ghi_nhan:
            ghi_nhan(cue)                 # checkpoint sau TỪNG block
    return ra


def ten_model() -> str:
    """Tên model đã dùng — vào `kieu_moc`/frontmatter của hiện vật (`AC-V1`).

    `AC-V7` đòi bản phân tích dẫn xuất phải mang được sự phân biệt *"quote có
    trong transcript CỦA TA"* với *"người trong video đã nói thế"*. Không ghi
    model thì sự phân biệt đó không có chỗ đứng.
    """
    return os.environ.get(BIEN_MODEL, "small")
