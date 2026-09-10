"""T12-23 · worker song song — N tiến trình × M luồng, trần theo LOẠI job.

0 mạng, 0 model: `BANG_LOAI` bị thay bằng hàm mock có `sleep` cố định, nên
phép đo tăng tốc là phép đo THẬT trên đồng hồ, không phải một cờ tự khai.
"""

from __future__ import annotations

import json
import sys
import tempfile
import threading
import time
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import vong                                                     # noqa: E402
import worker                                                   # noqa: E402

NGHI = 0.30           # một job mock "tốn" 0,3 giây
loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


def _hang_doi(tmp: Path, n: int, loai_asr: int = 0) -> vong.HangDoi:
    q = vong.HangDoi(tmp)
    for i in range(n):
        loai = "sinh-transcript" if i < loai_asr else "chung-cat-mot-nguon"
        # ULID giả tăng dần — `nhan_viec` sắp theo tên, nên thứ tự phải xác định
        q.nap(f"01TEST{i:020d}", {"loai": loai, "slug": f"s{i}"})
    return q


def main() -> int:
    print("T12-23 · worker song song")
    ng = json.loads((R / "chungcat" / "assets" / "nguong.json")
                    .read_text(encoding="utf-8"))

    # ── AC0 · trần nằm ở BẢNG KHAI, không gõ cứng trong mã ────────────────
    ss = ng.get("song_song")
    bao(isinstance(ss, dict), "AC0 · `nguong.json` có khối `song_song`")
    if isinstance(ss, dict):
        for k in ("tien_trinh", "luong_moi_tien_trinh", "tran_asr_dong_thoi"):
            bao(isinstance(ss.get(k), int) and ss[k] >= 1, f"AC0 · `{k}` là số ≥ 1",
                repr(ss.get(k)))
        bao(any(k.startswith("$vi_sao") for k in ss),
            "AC0 · khối khai `$vi_sao` — con số phải nói được vì sao")

    dem: dict[str, int] = {}
    khoa = threading.Lock()
    dang_asr, dinh_asr = 0, 0

    def mock(q, ulid, viec):
        nonlocal dang_asr, dinh_asr
        asr = (viec.get("payload") or {}).get("loai") == "sinh-transcript"
        with khoa:
            dem[ulid] = dem.get(ulid, 0) + 1
            if asr:
                dang_asr += 1
                dinh_asr = max(dinh_asr, dang_asr)
        time.sleep(NGHI)
        if asr:
            with khoa:
                dang_asr -= 1
        return {"ket_qua": "mock"}

    cu = dict(worker.BANG_LOAI)
    worker.BANG_LOAI.update({k: mock for k in cu})

    try:
        # ── AC1 · 8 job, 4 luồng ⇒ nhanh hơn hẳn tuần tự ─────────────────
        with tempfile.TemporaryDirectory() as t:
            q = _hang_doi(Path(t), 8)
            t0 = time.monotonic()
            worker.chay_song_song(q, luong=4, tran_asr=1)
            hết = time.monotonic() - t0
        tuan_tu = 8 * NGHI
        bao(hết < tuan_tu / 3, "AC1 · song song THẬT (nhanh hơn tuần tự ≥3×)",
            f"{hết:.2f}s so với ~{tuan_tu:.1f}s tuần tự")

        # ── AC2 · mỗi job đúng MỘT lần ──────────────────────────────────
        bao(len(dem) == 8, "AC2 · đủ 8 job được chạy", f"{len(dem)}")
        bao(all(v == 1 for v in dem.values()),
            "AC2 · mỗi job đúng MỘT lần chạy",
            str({k: v for k, v in dem.items() if v != 1}) or "không job nào lặp")

        # ── AC4 · ASR bị semaphore chặn; chung-cat KHÔNG bị chặn theo ────
        dem.clear(); dinh_asr = 0
        with tempfile.TemporaryDirectory() as t:
            q = _hang_doi(Path(t), 8, loai_asr=3)
            worker.chay_song_song(q, luong=4, tran_asr=1)
        bao(dinh_asr <= 1, "AC4 · ASR chạy tối đa `tran_asr_dong_thoi` cùng lúc",
            f"đỉnh đo được {dinh_asr}")
        bao(len(dem) == 8, "AC4 · chung-cat không bị ASR chặn — cả 8 job xong",
            f"{len(dem)}")
    finally:
        worker.BANG_LOAI.clear()
        worker.BANG_LOAI.update(cu)

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
