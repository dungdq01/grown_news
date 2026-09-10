"""Hiện vật văn bản → chunk (FR-072 §1.3 · spec §2a · AC-2.5 · AC-2.6 · T13-7).

M13 ĐỌC hiện vật qua API của LÕI (`GET /api/articles/media/<sha>` — byte GỐC, giữ mốc; KHÔNG qua
`?dang=txt` vì `vttSangTxt` bỏ mốc), KHÔNG mở `kb/_media/**` (M13-R3 vế ĐỌC trực tiếp).

  transcript `text/vtt` · `.srt`   ⇒ cắt theo CUE (gộp ≤ `cue_moi_chunk` cue liền nhau, không cắt giữa
                                     một cue); neo `slug:t=mm:ss` (dạng `slug-moc` đã khai trong dia-chi.json);
                                     ba khoá `anchor` · `line_start` · `line_end` = None TƯỜNG MINH (khoá có mặt,
                                     giá trị null — một câu đã nói); `nguon_van_ban = hien-vat:text/vtt`
  `.md` · `.txt` người tải          ⇒ chunk theo ##/### như `than` (indexer.chunk_markdown), file
                                     `kb/_media/<sha><đuôi>`, `nguon_van_ban = hien-vat:text/plain`
  PDF                               ⇒ KHÔNG — text PDF là nợ M12 (FR-079); khi M12 sinh hiện vật text/plain
                                     `la_dan_xuat` thì đơn vị này thấy qua cùng cửa, 0 dòng mã mới

`doc_cue` là MỘT hàm cho cả .vtt lẫn .srt (đảo của `vttSangSrt` bên web: cùng mốc, khác dấu `.`/`,` và
số thứ tự) — hai bản chuyển đổi là hai chỗ lệch (AC-2.5 edge 3). Chép khuôn `chungcat/src/vtt.py:doc_cue`,
không import (Z7). Mốc vượt thời lượng ⇒ TỪ CHỐI nêu mốc + thời lượng (AC-2.5 edge 2).

KHÔNG gọi `chuan_hoa_tim` ở đây — `title`/`tim` do indexer điền ở MỘT chỗ (M13-R1: đúng hai call-site
trong toàn `truyhoi/src`).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

R = Path(__file__).resolve().parents[2]
NGUONG = R / "truyhoi" / "assets" / "nguong.json"
MEDIA = json.loads((R / "core" / "assets" / "media-mime.json").read_text(encoding="utf-8"))

MIME_CUE = ("text/vtt", "application/x-subrip", "text/srt")
MIME_MD = ("text/markdown", "text/plain")
_MOC = re.compile(r"(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})")
_DONG_CUE = re.compile(r"^\s*((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})")


def _giay(moc: str) -> float:
    m = _MOC.match(moc.strip())
    if not m:
        raise ValueError(f"mốc `{moc}` không đọc được")
    h, mi, s, ms = m.groups()
    return int(h or 0) * 3600 + int(mi) * 60 + int(s) + int(ms.ljust(3, "0")) / 1000


def doc_cue(text: str | bytes) -> list[dict]:
    """[{tu, den, text}] theo thứ tự file — nhận cả WEBVTT lẫn SRT (dấu `.` hay `,`, có/không số thứ tự)."""
    if isinstance(text, bytes):
        text = text.decode("utf-8", errors="replace")
    dong = text.replace("\r\n", "\n").split("\n")
    ra, i = [], 0
    while i < len(dong):
        m = _DONG_CUE.match(dong[i])
        if not m:
            i += 1
            continue
        tu, den = _giay(m.group(1)), _giay(m.group(2))
        i += 1
        than = []
        while i < len(dong) and dong[i].strip():
            than.append(dong[i].strip())
            i += 1
        ra.append({"tu": tu, "den": den, "text": " ".join(than)})
    return ra


def moc(giay: float) -> str:
    """Giây → `mm:ss` (hoặc `h:mm:ss` khi ≥ 1 giờ) — khớp mẫu `slug-moc` của dia-chi.json."""
    g = int(giay)
    h, mi, s = g // 3600, (g % 3600) // 60, g % 60
    return f"{h}:{mi:02d}:{s:02d}" if h else f"{mi:02d}:{s:02d}"


def cue_moi_chunk() -> int:
    return int(json.loads(NGUONG.read_text(encoding="utf-8")).get("cue_moi_chunk", 3))


def chunk_cue(cues: list[dict], *, doc_id: str, file: str, title: str, thoi_luong: float | None = None,
              thu_tu_dau: int = 0) -> list[dict]:
    """Chunk THÔ (chưa có title/tim). Cue phải đơn điệu và nằm trong thời lượng — sai ⇒ ném, nêu mốc."""
    if thoi_luong is None and cues:
        thoi_luong = max(c["den"] for c in cues)
    truoc = -1.0
    for c in cues:
        if c["tu"] < truoc or c["den"] < c["tu"]:
            raise ValueError(f"cue không đơn điệu tại mốc {moc(c['tu'])}")
        if thoi_luong is not None and c["tu"] > thoi_luong:
            raise ValueError(f"mốc {moc(c['tu'])} vượt thời lượng {thoi_luong:.0f}s của `{doc_id}`")
        truoc = c["tu"]
    n = max(1, cue_moi_chunk())
    ra = []
    for k in range(0, len(cues), n):
        nhom = cues[k:k + n]
        ra.append({
            "doc_id": doc_id, "file": file, "anchor": None, "line_start": None, "line_end": None,
            "dia_chi": f"{doc_id}:t={moc(nhom[0]['tu'])}", "heading_path": f"{title} › transcript",
            "body": "\n".join(c["text"] for c in nhom if c["text"]), "nguon_van_ban": "hien-vat:text/vtt",
            "thu_tu": thu_tu_dau + k // n,
        })
    return ra


def duoi_cua(mime: str) -> str:
    l = next((x for x in MEDIA["loai"] if x.get("mime") == mime), None)
    return l["duoi"] if l else {"text/markdown": ".md", "text/plain": ".txt", "text/vtt": ".vtt"}.get(mime, MEDIA["mac_dinh"]["duoi"])


def chon_hien_vat(fm: dict) -> list[dict]:
    """Hiện vật VĂN BẢN có sha256; `text/vtt` chỉ giữ bản CUỐI (cùng lối `xuat-cua.mjs`)."""
    m = fm.get("media")
    ds = [m] if isinstance(m, dict) else [x for x in (m or []) if isinstance(x, dict)]
    van_ban = [x for x in ds if x.get("sha256") and str(x.get("mime", "")) in MIME_CUE + MIME_MD]
    vtt = [x for x in van_ban if str(x.get("mime")) in MIME_CUE]
    khac = [x for x in van_ban if str(x.get("mime")) in MIME_MD]
    return (vtt[-1:] if vtt else []) + khac
