#!/usr/bin/env python3
"""WebVTT — dựng, đọc, kiểm. `AC-V7` (magic) + `AC-V3` (cue tăng dần).

Không import `egress`: đây là phép biến đổi chữ, không có gì rời máy (`M12-R8`).

`WEBVTT` = `5745425654` là magic THẬT, 6 byte, chuẩn W3C. Đó là lý do
`FR-054 §1.2` chọn `text/vtt` thay `application/json`: JSON không có magic (`{`
là một byte) nên nó sẽ là mục đầu tiên trong bảng mime làm YẾU lớp thứ sáu của
intake — lớp duy nhất soi byte.
"""

from __future__ import annotations

import re

MAGIC = b"WEBVTT"
_CUE = re.compile(
    r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*"
    r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})")


class VttHong(Exception):
    """File dán nhãn `text/vtt` mà nội dung không phải WebVTT."""


def _giay(gio: str, phut: str, giay: str, ms: str) -> float:
    return int(gio) * 3600 + int(phut) * 60 + int(giay) + int(ms) / 1000


def doc_cue(noi: str | bytes) -> list[dict]:
    """Mọi cue trong file, theo thứ tự xuất hiện. `{tu, den, text}`."""
    if isinstance(noi, bytes):
        noi = noi.decode("utf-8", "replace")
    ra = []
    dong = noi.splitlines()
    for i, d in enumerate(dong):
        m = _CUE.search(d)
        if not m:
            continue
        g = m.groups()
        # Text của cue = các dòng tới dòng trống kế tiếp.
        than = []
        for k in range(i + 1, len(dong)):
            if not dong[k].strip():
                break
            than.append(dong[k])
        ra.append({"tu": _giay(*g[:4]), "den": _giay(*g[4:]),
                   "text": "\n".join(than)})
    return ra


def kiem_hop_le(noi: str | bytes, *, thoi_luong: float | None = None) -> list[dict]:
    """Ném `VttHong` nếu không hợp lệ; trả danh sách cue nếu hợp lệ.

    Ba phép, và cả ba đo được:
      1. magic `WEBVTT` ở ĐẦU file — `AC-V7`;
      2. cue TĂNG DẦN, không chồng nhau — `AC-V3`. Cue lùi làm `[t=..]` trỏ vào
         hai chỗ, và địa chỉ trỏ hai chỗ thì nó không phải địa chỉ;
      3. mốc cuối không vượt `thoi_luong` (khi biết) — một mốc quá thời lượng là
         một mốc bịa, và `verify.dinh_vi()` sẽ "xác nhận" nó.
    """
    b = noi.encode("utf-8") if isinstance(noi, str) else noi
    if not b.startswith(MAGIC):
        raise VttHong(
            f"thiếu magic `WEBVTT` — byte mở đầu là {b[:6]!r}. Đây là lớp duy "
            f"nhất soi byte; qua được nó thì mọi lớp sau tin nhầm.")
    cue = doc_cue(b)
    if not cue:
        raise VttHong("không cue nào — một transcript rỗng không phải transcript")
    truoc = -1.0
    for i, c in enumerate(cue):
        if c["den"] < c["tu"]:
            raise VttHong(f"cue {i}: `den` ({c['den']}) trước `tu` ({c['tu']})")
        if c["tu"] < truoc:
            raise VttHong(
                f"cue {i} bắt đầu ở {c['tu']}s, sau một cue đã tới {truoc}s — "
                f"cue phải TĂNG DẦN, không chồng nhau")
        truoc = c["den"]
    if thoi_luong is not None and cue[-1]["den"] > thoi_luong + 1.0:
        raise VttHong(
            f"mốc cuối {cue[-1]['den']}s vượt thời lượng nguồn {thoi_luong}s — "
            f"một mốc quá thời lượng là một mốc bịa")
    return cue


def _moc(giay: float) -> str:
    g, con = divmod(float(giay), 3600)
    p, s = divmod(con, 60)
    return f"{int(g):02d}:{int(p):02d}:{s:06.3f}"


def dung(doan: list[dict]) -> str:
    """`[{tu, den, text}] → chuỗi WebVTT`. Kiểm lại chính thứ mình vừa dựng.

    Tự kiểm ở đây chứ không để người gọi nhớ: một hàm dựng ra file hỏng mà không
    ai biết là chỗ file hỏng đi tiếp vào kho.
    """
    ra = ["WEBVTT", ""]
    for d in doan:
        ra.append(f"{_moc(d['tu'])} --> {_moc(d['den'])}")
        ra.append(str(d.get("text", "")).strip())
        ra.append("")
    noi = "\n".join(ra)
    kiem_hop_le(noi)
    return noi
