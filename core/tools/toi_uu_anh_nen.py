#!/usr/bin/env python3
"""Toi uu anh nen trong public/ — cho crossfade muot.

VI SAO CAN: do that tren 11 file trong public/ (2026-08-24):
    tong 17.7 MB · file lon nhat 8.4 MB (9783x5503) · 2 cap TRUNG anh
Anh 3 MB lam crossfade GIAT: trinh duyet phai giai ma lai ca khung khi doi
opacity, va `backdrop-filter` phia tren buoc no chup lai nen moi frame.

BA VIEC, moi viec mot ly do do duoc:

  1 THU NHO ve canh dai <= 2560px.
    Anh bi `.mist` (veil) + `blur(22px)` cua panel phu len, nen chi tiet duoi
    2560px khong ai thay. 9783px la 3.8x thua.

  2 NEN ve <= 400 KB, chat luong giam dan tu 82 den khi dat nguong.
    Khong ha duoi 60: duoi do thay khoi bet (banding) tren vung troi phang —
    thu quan trong voi anh phong canh.

  3 BO FILE TRUNG. `light-6 copy.jpg` trung BYTE voi `light-6.jpg` (cung
    sha256). `pexels-...38543670 (1).jpg` la ban thu nho cua ban 8.4 MB —
    so pixel lech 0.97/255, tuc CUNG anh. Giu ban NHO, bo ban to.

KHONG lam: khong sua do sang/tuong phan cua anh. Vung giua qua sang thi xu ly
bang veil trong CSS (`--veil`), khong dot vao pixel — de con doi y duoc.

Dung:
    python core/tools/toi_uu_anh_nen.py --xem     # chi in, khong ghi
    python core/tools/toi_uu_anh_nen.py           # lam that
"""
import hashlib
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageStat

R = Path(__file__).resolve().parents[2]
PUB = R / "public"

CANH_TOI_DA = 2560       # canh dai; anh bi blur+veil phu nen hon la thua
TRAN_KB = 400            # moi file; 10 anh x 400 = 4 MB tong, tai duoc
CL_DAU, CL_MIN = 82, 60  # chat luong JPEG: giam dan, khong duoi 60 (banding)


def bam(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def giong_nhau(a: Path, b: Path, nguong: float = 6.0) -> bool:
    """Hai anh CUNG noi dung? So o co 160x90 — du de bat ban thu nho."""
    ia = Image.open(a).convert("RGB").resize((160, 90))
    ib = Image.open(b).convert("RGB").resize((160, 90))
    lech = sum(abs(x - y) for pa, pb in zip(ia.getdata(), ib.getdata())
               for x, y in zip(pa, pb)) / (160 * 90 * 3)
    return lech < nguong


def do(p: Path) -> tuple:
    """(KB, w, h, sang_vung_giua, do_lech). Vung giua la cho chu de len."""
    im = Image.open(p)
    w, h = im.size
    g = im.convert("L").crop((int(w * .25), int(h * .15), int(w * .85), int(h * .75)))
    s = ImageStat.Stat(g)
    return p.stat().st_size // 1024, w, h, s.mean[0], s.stddev[0]


def nen(p: Path, xem: bool) -> tuple:
    """Thu nho + nen tai cho. Tra (kb_truoc, kb_sau, ghi_chu)."""
    kb0, w, h, _, _ = do(p)
    im = Image.open(p)
    if im.mode != "RGB":
        im = im.convert("RGB")

    ghi = []
    if max(w, h) > CANH_TOI_DA:
        ti = CANH_TOI_DA / max(w, h)
        im = im.resize((round(w * ti), round(h * ti)), Image.LANCZOS)
        ghi.append(f"{w}x{h}->{im.width}x{im.height}")

    if kb0 <= TRAN_KB and not ghi:
        return kb0, kb0, "da dat, khong doi"

    # Giam chat luong den khi dat tran. `optimize` + `progressive`: progressive
    # JPEG hien dan tu mo den net, nen luc tai nguoi thay ANH SOM hon.
    #
    # `range` phai PHU toi CL_MIN: buoc -4 tu 82 cho 82,78,...,62 roi DUNG —
    # 60 khong bao gio duoc thu, nen anh 3 MB thoat vong lap ma khong ghi gi
    # (bug that: ban dau tra "?" cho light-1-2.jpg). Dung danh sach tuong minh.
    from io import BytesIO
    muc = [c for c in range(CL_DAU, CL_MIN - 1, -4)]
    if muc[-1] != CL_MIN:
        muc.append(CL_MIN)
    for cl in muc:
        b = BytesIO()
        im.save(b, "JPEG", quality=cl, optimize=True, progressive=True)
        kb = b.tell() // 1024
        if kb <= TRAN_KB or cl == muc[-1]:
            if not xem:
                p.write_bytes(b.getvalue())
            ghi.append(f"q{cl}")
            # Cham san chat luong ma VAN vuot tran thi NOI RA. Im lang vuot tran
            # la cach tran mat nghia — anh nay se nang mai ma khong ai biet.
            if kb > TRAN_KB:
                ghi.append(f"!! con {kb}KB > {TRAN_KB} (san q{CL_MIN})")
            return kb0, kb, " · ".join(ghi)
    return kb0, kb0, "?"


def main() -> int:
    xem = "--xem" in sys.argv
    if not PUB.exists():
        sys.exit(f"khong co {PUB}")

    files = sorted(PUB.glob("*.jpg")) + sorted((PUB / "light").glob("*.jpg"))
    print(f"\n{'XEM THU' if xem else 'LAM THAT'} · {len(files)} file · "
          f"{sum(f.stat().st_size for f in files) // 1024} KB\n")

    # ── 1 · bo file trung ────────────────────────────────────────────────
    print("1 · Bo file trung\n")
    theo_bam: dict[str, Path] = {}
    bo: list[Path] = []
    for f in files:
        b = bam(f)
        if b in theo_bam:
            print(f"  trung BYTE  {f.name}  (= {theo_bam[b].name})")
            bo.append(f)
        else:
            theo_bam[b] = f

    con = [f for f in files if f not in bo]
    # Cap CUNG anh khac byte: giu ban NHO hon
    i = 0
    while i < len(con):
        j = i + 1
        while j < len(con):
            a, c = con[i], con[j]
            if a in bo or c in bo:
                j += 1
                continue
            if giong_nhau(a, c):
                to = a if a.stat().st_size > c.stat().st_size else c
                nho = c if to is a else a
                print(f"  CUNG anh    {to.name}  (bo, giu {nho.name} nho hon)")
                bo.append(to)
            j += 1
        i += 1

    if not bo:
        print("  (khong co file trung)")
    for f in bo:
        if not xem:
            f.unlink()

    # ── 2 · thu nho + nen ────────────────────────────────────────────────
    print("\n2 · Thu nho + nen\n")
    con = [f for f in files if f not in bo]
    t0 = t1 = 0
    for f in con:
        a, b, g = nen(f, xem)
        t0 += a
        t1 += b
        dau = "  " if a == b else "->"
        print(f"  {dau} {a:5} KB -> {b:5} KB  {g:28} {f.name[:40]}")

    print(f"\n  tong {t0} KB -> {t1} KB  (giam {100 - t1 * 100 // max(t0, 1)}%)")

    # ── 3 · canh bao vung giua qua sang ──────────────────────────────────
    print("\n3 · Vung giua — cho chu de len (ui_guide §11: anh toi <=110)\n")
    for f in con:
        if xem:
            break
        _, _, _, sg, lech = do(f)
        co = "  " if sg <= 130 else "!!"
        print(f"  {co} sang={sg:6.1f}  lech={lech:5.1f}  {f.name[:44]}")
    if not xem:
        print("\n  `!!` = veil phai dac hon o vung do. Xu ly bang --veil trong")
        print("  CSS, KHONG dot vao pixel — de con doi y duoc.")

    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
