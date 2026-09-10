"""Anchor của heading — bản Python THỨ HAI của luật `slugGoiY()` (FE), chép TỪNG BƯỚC (spec §2 · M13-R2 · T13-2).

    lower → NFD → bỏ dấu kết hợp U+0300–036F → đ→d → [^a-z0-9]+ → '-' → bỏ MỘT '-' đầu/cuối → cắt 60

Nguồn luật: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` `slugGoiY`. Thứ tự QUAN
TRỌNG: cắt 60 SAU khi bỏ '-' đầu/cuối (đúng bản JS), nên anchor có thể kết thúc bằng '-'.
Cổng đối chiếu hai bản chạy JS THẬT: `truyhoi/tests/check_anchor_mot_luat.py` (AC-2.2).

Dedup kiểu github-slugger (FR-073 §1 `$dedup`): `BoAnchor` giữ `occurrences`, vòng WHILE (một
heading thật tên `foo-1` đã chiếm chỗ cũng không va), state THEO FILE — mỗi file một instance,
renderer và indexer phải đi qua cùng thứ tự heading.

Đây KHÔNG phải `chuan_hoa_tim` (NFC, để tokenize): hai luật, hai mục đích.
"""

from __future__ import annotations

import re
import unicodedata

_DAU_KET_HOP = re.compile("[̀-ͯ]")
_KHONG_SLUG = re.compile(r"[^a-z0-9]+")
_GACH_BIEN = re.compile(r"^-|-$")
CAT = 60


def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s).lower())
    s = _DAU_KET_HOP.sub("", s).replace("đ", "d")
    s = _KHONG_SLUG.sub("-", s)
    s = _GACH_BIEN.sub("", s)
    return s[:CAT]


class BoAnchor:
    """Một instance = một file. `sinh()` trả anchor duy nhất trong file theo thứ tự heading."""

    def __init__(self) -> None:
        self._dem: dict[str, int] = {}

    def sinh(self, heading: str) -> str:
        goc = slug(heading)
        a = goc
        while a in self._dem:
            self._dem[goc] = self._dem.get(goc, 0) + 1
            a = f"{goc}-{self._dem[goc]}"
        self._dem[a] = 0
        return a
