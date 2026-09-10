"""Tín hiệu VẬN HÀNH — điểm rẽ sang vector là SỐ MÁY ĐẾM, không phải số bài (spec §7 · AC-7.1 · T13-6).

Hai bộ đếm, ghi FILE cạnh `index.sqlite` (không ở kb/, không ở RAM — phải sống qua khởi động lại):
  truy_van_0_ket_qua   một truy vấn trả `tong == 0`
  go_lai               một phiên gõ ≥3 câu KHÁC NHAU trong 120 giây (người gõ lại vì chưa thấy)

`tin-hieu.json` = số hiện tại (ghi nguyên tử: tmp + os.replace); `tin-hieu.jsonl` = từng sự kiện, một dòng.
Không ghi câu hỏi nguyên văn vào jsonl — chỉ độ dài và phiên: tín hiệu là ĐẾM, không phải nhật ký nội dung.
Cửa sổ gõ-lại sống trong tiến trình (mất khi restart là chấp nhận được — bộ đếm thì không mất).
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

HAI = ("truy_van_0_ket_qua", "go_lai")
CUA_SO_GIAY = 120
SO_CAU_GO_LAI = 3
# Cửa sổ gõ-lại ở mức TIẾN TRÌNH (một request = một instance TinHieu, nên không giữ ở instance).
_CUA_SO: dict[str, list[tuple[str, float]]] = {}


class TinHieu:
    def __init__(self, thu_muc: Path | str):
        self.thu_muc = Path(thu_muc)
        self.p = self.thu_muc / "tin-hieu.json"
        self.log = self.thu_muc / "tin-hieu.jsonl"
        self._phien = _CUA_SO

    # ── đọc / ghi ─────────────────────────────────────────────────────────
    def doc(self) -> dict:
        if not self.p.exists():
            return {k: 0 for k in HAI}
        try:
            d = json.loads(self.p.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {k: 0 for k in HAI}
        return {k: int(d.get(k, 0)) for k in HAI}

    def _ghi(self, d: dict) -> None:
        self.thu_muc.mkdir(parents=True, exist_ok=True)
        tmp = self.p.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, self.p)

    def _su_kien(self, loai: str, phien: str, cau_hoi: str) -> None:
        with self.log.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"luc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "loai": loai,
                                "phien": phien, "dai_cau_hoi": len(cau_hoi)}, ensure_ascii=False) + "\n")

    def _tang(self, khoa: str, phien: str, cau_hoi: str) -> None:
        d = self.doc()
        d[khoa] += 1
        self._ghi(d)
        self._su_kien(khoa, phien, cau_hoi)

    # ── hai tín hiệu ───────────────────────────────────────────────────────
    def ghi_0_ket_qua(self, cau_hoi: str, phien: str) -> None:
        self._tang("truy_van_0_ket_qua", phien, cau_hoi)

    def ghi_truy_van(self, cau_hoi: str, phien: str) -> bool:
        """Ghi một truy vấn vào cửa sổ của phiên; trả True nếu vừa đếm một lần gõ lại."""
        bay_gio = time.time()
        chuoi = " ".join(str(cau_hoi).lower().split())
        ds = [(q, t) for q, t in self._phien.get(phien, []) if bay_gio - t <= CUA_SO_GIAY]
        if chuoi not in {q for q, _ in ds}:
            ds.append((chuoi, bay_gio))
        self._phien[phien] = ds
        if len(ds) >= SO_CAU_GO_LAI:
            self._phien[phien] = []          # đếm một lần cho cửa sổ này, rồi mở cửa sổ mới
            self._tang("go_lai", phien, cau_hoi)
            return True
        return False
