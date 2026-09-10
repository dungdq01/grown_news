#!/usr/bin/env python3
"""XEM NHẬT KÝ — số do MÁY tổng hợp từ file, không ai gõ tay.

    python chungcat/tools/xem_nhat_ky.py                 # tất cả, từ đầu
    python chungcat/tools/xem_nhat_ky.py --loai worker    # một thành phần
    python chungcat/tools/xem_nhat_ky.py --tu 30          # 30 phút gần đây
    python chungcat/tools/xem_nhat_ky.py --loi            # chỉ dòng có lỗi
    python chungcat/tools/xem_nhat_ky.py --theo-doi       # tail -f, có tổng kết

VÌ SAO PHÂN VỊ, KHÔNG TRUNG BÌNH
Trung bình che đúng thứ đang tìm. Một request 30 giây lẫn trong 999 request 5ms
đổi trung bình từ 5.0 lên 5.03 — mà nó chính là cái làm người dùng bỏ đi. `p95`
và `max` nói ra nó; trung bình thì không.

`p99` KHÔNG in khi mẫu < 100: `p99` của 20 dòng là chính `max`, và in nó dưới
một cái tên khác là nói rằng ta biết một điều ta không biết.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import nhat_ky  # noqa: E402


def phan_vi(ds: list[float], p: float) -> float:
    """Phân vị NEAREST-RANK. Không nội suy: nội suy sinh ra một con số **không
    có dòng log nào tương ứng**, và lúc đi tìm dòng chậm nhất thì một con số
    không trỏ về dòng nào là một con số vô dụng."""
    if not ds:
        return 0.0
    x = sorted(ds)
    k = max(0, min(len(x) - 1, int(round(p / 100 * len(x) + 0.5)) - 1))
    return x[k]


def doc(duong: Path, tu_giay: float | None):
    """Đọc JSONL, đếm CẢ dòng hỏng.

    Trả `(dòng tốt, số dòng hỏng)`. Bỏ qua im lặng là cách một bản tổng hợp
    đếm thiếu mà không nói mình thiếu bao nhiêu.
    """
    tot, hong = [], 0
    if not duong.exists():
        return tot, hong
    for l in duong.read_text(encoding="utf-8", errors="replace").splitlines():
        if not l.strip():
            continue
        try:
            d = json.loads(l)
        except ValueError:
            hong += 1
            continue
        if tu_giay is not None:
            try:
                mo = time.mktime(time.strptime(d["t"][:19], "%Y-%m-%dT%H:%M:%S"))
                if mo < tu_giay:
                    continue
            except (KeyError, ValueError):
                pass          # dòng không có mốc đọc được thì GIỮ, đừng bỏ
        tot.append(d)
    return tot, hong


def khoa_nhom(d: dict) -> str:
    """Gộp theo thứ ĐÁNG so với nhau.

    `duong` cho request, `giai_doan` cho job. Không gộp theo `viec` (ULID) — mỗi
    ULID một nhóm nghĩa là mọi nhóm có đúng một mẫu, và phân vị của một mẫu là
    chính nó.
    """
    for k in ("duong", "giai_doan", "viec_loai", "ten"):
        if d.get(k):
            return f"{k}={d[k]}"
    return "(không nhóm)"


def bang(ten: str, ds: list[dict], hong: int) -> None:
    print(f"\n── {ten} · {len(ds)} dòng"
          + (f" · ⚠ {hong} dòng HỎNG không parse được" if hong else ""))
    if not ds:
        return

    nhom: dict[str, list[dict]] = {}
    for d in ds:
        nhom.setdefault(khoa_nhom(d), []).append(d)

    print(f"  {'nhóm':<40} {'n':>5} {'p50':>8} {'p95':>8} {'max':>8} "
          f"{'lỗi':>4} {'quá hạn':>8}")
    for k, v in sorted(nhom.items(), key=lambda x: -len(x[1])):
        ms = [float(x["ms"]) for x in v if isinstance(x.get("ms"), (int, float))]
        so_loi = sum(1 for x in v if x.get("loi") or (
            isinstance(x.get("ma"), int) and x["ma"] >= 400))
        qh = sum(1 for x in v if x.get("qua_han"))
        print(f"  {k[:40]:<40} {len(v):>5} {phan_vi(ms, 50):>8.1f} "
              f"{phan_vi(ms, 95):>8.1f} {max(ms or [0]):>8.1f} "
              f"{so_loi:>4} {qh:>8}")

    tong_ms = [float(x["ms"]) for x in ds
               if isinstance(x.get("ms"), (int, float))]
    if len(tong_ms) >= 100:
        print(f"  {'(tất cả · p99)':<40} {len(tong_ms):>5} "
              f"{'':>8} {'':>8} {phan_vi(tong_ms, 99):>8.1f}")
    else:
        print(f"  ({len(tong_ms)} mẫu — chưa in `p99`: dưới 100 mẫu thì `p99` "
              "chính là `max`)")

    # WORKLOAD theo phút — trả lời *"lúc nào đông"*, thứ p95 không nói.
    theo_phut: dict[str, int] = {}
    for d in ds:
        theo_phut[str(d.get("t", ""))[:16]] = theo_phut.get(
            str(d.get("t", ""))[:16], 0) + 1
    if len(theo_phut) > 1:
        dinh = max(theo_phut.items(), key=lambda x: x[1])
        print(f"  workload: {len(theo_phut)} phút có việc · đỉnh {dinh[1]}"
              f" dòng/phút lúc {dinh[0]}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--loai", help="chỉ một thành phần (api-tho · worker · api-loi)")
    ap.add_argument("--tu", type=float, metavar="PHÚT",
                    help="chỉ N phút gần đây")
    ap.add_argument("--loi", action="store_true", help="chỉ dòng có lỗi/quá hạn")
    ap.add_argument("--theo-doi", action="store_true",
                    help="in dòng mới liên tục (như `tail -f`)")
    a = ap.parse_args()

    goc = nhat_ky.duong_goc()
    if not goc.exists():
        print(f"chưa có {goc} — dịch vụ chưa chạy, hoặc `GN_LOG_DIR` trỏ chỗ khác")
        return 2

    # Gộp cả bản đã XOAY (`*.jsonl.1`): nó chứa đúng đoạn "trước lúc nó hỏng",
    # tức đoạn người ta đi tìm. Bỏ nó là bỏ nửa dữ liệu ngay lúc cần nhất.
    teps = sorted(goc.glob("*.jsonl")) + sorted(goc.glob("*.jsonl.1"))
    if a.loai:
        teps = [t for t in teps if t.name.split(".")[0] == a.loai]
    if not teps:
        print(f"không file nào khớp trong {goc}")
        return 2

    if a.theo_doi:
        return theo_doi(teps)

    tu = time.time() - a.tu * 60 if a.tu else None
    for t in teps:
        ds, hong = doc(t, tu)
        if a.loi:
            ds = [d for d in ds if d.get("loi") or d.get("qua_han")
                  or (isinstance(d.get("ma"), int) and d["ma"] >= 400)]
        bang(t.name, ds, hong)
        if a.loi:
            for d in ds[-20:]:
                print("   ", json.dumps(d, ensure_ascii=False)[:300])
    print()
    return 0


def theo_doi(teps: list[Path]) -> int:
    """`tail -f` nhiều file. Bắt đầu từ CUỐI file, không in lại lịch sử."""
    vt = {t: (t.stat().st_size if t.exists() else 0) for t in teps}
    print(f"theo dõi {len(teps)} file — Ctrl-C để dừng\n")
    try:
        while True:
            for t in list(vt):
                if not t.exists():
                    continue
                kt = t.stat().st_size
                if kt <= vt[t]:
                    vt[t] = kt          # file bị cắt/xoay ⇒ theo từ đầu lại
                    continue
                with open(t, "r", encoding="utf-8", errors="replace") as f:
                    f.seek(vt[t])
                    for l in f:
                        if l.strip():
                            print(f"[{t.stem}] {l.rstrip()}")
                    vt[t] = f.tell()
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n— dừng —")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
