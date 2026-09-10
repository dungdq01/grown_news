#!/usr/bin/env python3
"""Sinh lai 05_uiux/contracts/contrast-audit.json TU tokens.css. FR-027.

VI SAO CAN SCRIPT NAY: header cua file audit ghi "Sinh lai moi khi token mau
doi — KHONG chinh tay", nhung KHONG CO script nao de sinh. Nen no da duoc viet
tay, va den FR-027 thi no LECH thuc te: audit khai glass_alpha.dark = 0.88
trong khi tokens.css da doi thanh .62.

Mot audit lech thuc te te hon khong co audit: no cho cam giac da kiem trong khi
con so khong con dung. Va `motion-polish.test.js` chi khop ve LIGHT nen ve dark
lech ma khong test nao do.

CACH LAM: doc hex + alpha TU tokens.css (khong go lai), tinh ty le tuong phan
theo WCAG 2.1, ghi ra JSON cung khuon ban 2.0.0.

Dung:
    python core/tools/sinh_contrast_audit.py --xem   # in, khong ghi
    python core/tools/sinh_contrast_audit.py         # ghi that
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

R = Path(__file__).resolve().parents[2]
TOKENS = R / "05_uiux" / "tokens.css"
RA = R / "05_uiux" / "contracts" / "contrast-audit.json"

# 4 loai anh nen GIA DINH, chot tu ban 2.0.0 — GIU de so sanh duoc giua hai ban.
#
# Chung la ca XAU NHAT TREN LY THUYET, khong phai anh dang dung: `#F0F5F7` sang
# 243 va `#0E1216` toi 18, con anh THAT trong public/ chi trong khoang 77-152
# (do vung giua, noi chu de len). Nen giu ca hai nhom:
#   `glass-on-anh *`   — bien ly thuyet, `min` la muc THAM CHIEU
#   `glass-on-that-*`  — anh dang dung, day moi la cai phai PASS
NEN = {
    "anh sang": "#F0F5F7",
    "anh toi": "#0E1216",
    "anh xanh": "#4A7FA8",
    "anh co": "#7FA060",
}
NEN_TEN = {"anh sang": "ảnh sáng", "anh toi": "ảnh tối",
           "anh xanh": "ảnh xanh", "anh co": "ảnh cỏ"}


def nen_that() -> dict:
    """Do vung giua cua ANH DANG DUNG. Tra {mode: {ten: hex}}.

    Vung giua (25-85% ngang, 15-75% doc) la cho panel va chu nam. Do o day thay
    vi ca anh: mot goc troi sang khong lam chu kho doc neu chu khong o do.

    CHIA THEO CHE DO, khong gop. Bug that trong ban dau cua script nay: gop ca
    hai bo lam mot dict phang ⇒ ban SANG bi do tren anh TOI (#4D4D4D), nen no
    "truot" 4.27 tren mot nen no khong bao gio dung. Do thu cong ra 5.05 PASS
    va chenh lech do la thu phoi ra loi.
      public/       -> bo TOI  (backdrop dung khi data-theme=dark)
      public/light/ -> bo SANG
    Anh xa nay khai o backdrop-assets/index.ts:38-39.

    Khong co PIL hoac khong co anh ⇒ tra {} va bo qua nhom nay, khong chet.
    """
    try:
        from PIL import Image, ImageStat
    except ImportError:
        return {}
    ra: dict[str, dict[str, str]] = {"light": {}, "dark": {}}
    for thu_muc, mode in (("public", "dark"), ("public/light", "light")):
        p = R / thu_muc
        if not p.exists():
            continue
        muc = []
        for f in sorted(p.glob("*.jpg")):
            im = Image.open(f).convert("L")
            w, h = im.size
            g = im.crop((int(w * .25), int(h * .15), int(w * .85), int(h * .75)))
            muc.append(ImageStat.Stat(g).mean[0])
        if not muc:
            continue
        for nhan, v in (("nhạt nhất", min(muc)), ("đậm nhất", max(muc))):
            x = round(v)
            ra[mode][f"thật {nhan}"] = "#%02X%02X%02X" % (x, x, x)
    return ra


def lum(h: str) -> float:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

    def f(c: float) -> float:
        return c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


def ty_le(a: str, b: str) -> float:
    la, lb = lum(a), lum(b)
    return round((max(la, lb) + .05) / (min(la, lb) + .05), 2)


def pha(tren: str, alpha: float, duoi: str) -> str:
    """Mot lop mau nua trong suot tren mot lop dac -> mau ket qua."""
    t = [int(tren.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    d = [int(duoi.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    return "#%02X%02X%02X" % tuple(round(t[i] * alpha + d[i] * (1 - alpha))
                                   for i in range(3))


def hue(h: str) -> float:
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return 0.0
    d = mx - mn
    if mx == r:
        x = ((g - b) / d) % 6
    elif mx == g:
        x = (b - r) / d + 2
    else:
        x = (r - g) / d + 4
    return x * 60


def doc_khoi(css: str, mo: str) -> str:
    """Lay than mot rule CSS theo selector."""
    i = css.index(mo)
    j = css.index("{", i)
    sau, k = 1, j + 1
    while k < len(css) and sau:
        if css[k] == "{":
            sau += 1
        elif css[k] == "}":
            sau -= 1
        k += 1
    return css[j + 1:k - 1]


def token(than: str, ten: str) -> str | None:
    m = re.search(rf"--{re.escape(ten)}\s*:\s*([^;]+);", than)
    return m.group(1).strip() if m else None


def hex_va_alpha(gt: str) -> tuple[str, float]:
    """`rgba(14,15,17,.62)` -> ('#0E0F11', 0.62). `#F2F2F0` -> (hex, 1.0)."""
    m = re.match(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)", gt)
    if m:
        r, g, b = (int(m.group(i)) for i in (1, 2, 3))
        a = float(m.group(4)) if m.group(4) else 1.0
        return "#%02X%02X%02X" % (r, g, b), a
    m = re.match(r"#([0-9a-fA-F]{3,8})", gt)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return "#" + h[:6].upper(), 1.0
    raise ValueError(f"khong doc duoc mau: {gt}")


def veil_nhat_nhat(gt: str) -> tuple[str, float]:
    """Chang NHAT NHAT cua gradient veil — truong hop TE NHAT cho tuong phan.

    `--veil` la mot gradient nhieu chang, moi chang mot alpha. Chang nhat nhat
    che anh it nhat, nen chu tren do kho doc nhat. Do o day thi ket luan dung
    cho MOI diem tren man, khong chi diem trung binh.
    """
    mau = re.findall(r"rgba?\([^)]*\)", gt)
    if not mau:
        return "#000000", 0.0
    doc = [hex_va_alpha(m) for m in mau]
    return min(doc, key=lambda x: x[1])


# 12 cap `solid` — ten pair GIU nguyen ban 2.0.0
CAP_SOLID = [
    ("chữ / nền", "fg", "bg", 4.5),
    ("chữ / thẻ", "fg", "card", 4.5),
    ("chữ phụ / nền", "secondary_fg", "bg", 4.5),
    ("chữ mờ / nền", "muted_fg", "bg", 4.5),
    ("chữ mờ / thẻ", "muted_fg", "card", 4.5),
    ("nhấn / nền", "primary", "bg", 4.5),
    ("chữ trên nhấn", "primary_fg", "primary", 4.5),
    ("loại bỏ / nền", "destructive", "bg", 4.5),
    ("đạt / nền", "success", "bg", 4.5),
    ("cảnh báo / nền cảnh báo", "warning", "warning_bg", 4.5),
    ("viền / nền", "border", "bg", 1.35),
    ("vòng focus / nền", "ring", "bg", 3.0),
]
# 3 cap tren KINH, cho tung loai anh nen
CAP_GLASS = [("chữ", "fg", 4.5), ("chữ mờ", "muted_fg", 4.5),
             ("tab active", "primary", 4.5)]


def main() -> int:
    xem = "--xem" in sys.argv
    css = TOKENS.read_text(encoding="utf-8")
    sang = doc_khoi(css, ":root{")
    toi = doc_khoi(css, '[data-theme="dark"]{')

    # Tone toi override MOT PHAN -> thieu thi ke thua tu :root.
    #
    # HAM O NGOAI VONG LAP, nhan `than` la THAM SO. Ban truoc dinh nghia `def gt`
    # BEN TRONG vong lap thu nhat roi dung lai o vong thu HAI — closure van tro
    # vao `than` cua lan lap CUOI, nen vong hai tinh ca hai che do bang veil cua
    # che do TOI. Bug that: nen sang ra #C2C3C3 thay vi #DDDDDD, sinh ra 4 cap
    # "truot" khong co that. Do chenh lech voi phep tinh tay moi phoi ra.
    def gt(than: str, ten: str) -> str:
        return token(than, ten) or token(sang, ten)

    THAN = {"light": sang, "dark": toi}
    ket = {"light": {}, "dark": {}}
    alpha = {}
    for mode, than in (("light", sang), ("dark", toi)):
        def g(ten: str, _t: str = than) -> str:
            return gt(_t, ten)

        bg_hex, bg_a = hex_va_alpha(g("background"))
        alpha[mode] = bg_a
        card_hex, _ = hex_va_alpha(g("card"))
        ket[mode] = {
            "bg": bg_hex, "fg": hex_va_alpha(g("foreground"))[0],
            "card": card_hex,
            "primary": hex_va_alpha(g("primary"))[0],
            "primary_fg": hex_va_alpha(g("primary-foreground"))[0],
            "secondary_fg": hex_va_alpha(g("secondary-foreground"))[0],
            "muted_fg": hex_va_alpha(g("muted-foreground"))[0],
            "accent": hex_va_alpha(g("accent"))[0],
            "accent_fg": hex_va_alpha(g("accent-foreground"))[0],
            "destructive": hex_va_alpha(g("destructive"))[0],
            "destructive_fg": hex_va_alpha(g("destructive-foreground"))[0],
            "success": hex_va_alpha(g("success"))[0],
            "warning": hex_va_alpha(g("warning"))[0],
            "warning_bg": hex_va_alpha(g("warning-bg"))[0],
            "border": hex_va_alpha(g("border"))[0],
            "ring": hex_va_alpha(g("ring"))[0],
        }

    that = nen_that()
    kq = []
    for mode in ("light", "dark"):
        t = ket[mode]
        for ten, fg, bg, mn in CAP_SOLID:
            r = ty_le(t[fg], t[bg])
            kq.append({"mode": mode, "scope": "solid", "pair": ten,
                       "fg": t[fg], "bg": t[bg], "ratio": r,
                       "min": mn, "pass": r >= mn})
        # KINH tren 4 loai anh. BA lop, dung thu tu z-index thuc te:
        #   .sky (-3) anh  ->  .mist (-2) veil  ->  panel kinh
        #
        # Ban 2.0.0 BO LOP VEIL — do la loi do luong, khong phai loi token:
        # `.mist` LUON nam giua anh va panel (prototype.css:65-73), nen bo no
        # cho ty le THAP hon thuc te. Do that: bo veil thi 7 cap "truot", tinh
        # ca veil thi khong cap nao.
        #
        # Lay muc NHAT NHAT cua veil gradient — day la truong hop TE NHAT.
        v_hex, v_a = veil_nhat_nhat(gt(THAN[mode], "veil"))

        # Nhom 1 · nen GIA DINH — bien ly thuyet, ghi de theo doi, KHONG chan.
        for key, anh in NEN.items():
            nen = pha(t["bg"], alpha[mode], pha(v_hex, v_a, anh))
            for ten, fg, mn in CAP_GLASS:
                r = ty_le(t[fg], nen)
                kq.append({"mode": mode, "scope": f"glass-on-{NEN_TEN[key]}",
                           "pair": ten, "fg": t[fg], "bg": nen, "ratio": r,
                           "min": mn, "pass": r >= mn, "tham_chieu": True})

        # Nhom 2 · ANH DANG DUNG cua CHINH che do nay — day moi la cai phai PASS.
        for key, anh in that.get(mode, {}).items():
            nen = pha(t["bg"], alpha[mode], pha(v_hex, v_a, anh))
            for ten, fg, mn in CAP_GLASS:
                r = ty_le(t[fg], nen)
                kq.append({"mode": mode, "scope": f"glass-on-{key}",
                           "pair": ten, "fg": t[fg], "bg": nen, "ratio": r,
                           "min": mn, "pass": r >= mn})
        # hue_gap: canh bao phai tach khoi do bang SAC DO, khong bang do sang
        gap = round(abs(hue(t["warning"]) - hue(t["primary"])), 1)
        kq.append({"mode": mode, "scope": "hue", "pair": "cảnh báo vs nhấn",
                   "fg": t["warning"], "bg": t["primary"], "ratio": gap,
                   "min": 25, "pass": gap >= 25})

    # `tham_chieu` = nen GIA DINH, khong phai anh dang dung. Chung o ngoai
    # khoang do duoc (18 va 243 vs 77-152 that) nen truot o do la thong tin,
    # khong phai loi. Chi nhom anh THAT tinh vao `failures`.
    truot = [r for r in kq if not r["pass"] and not r.get("tham_chieu")]
    truot_tc = [r for r in kq if not r["pass"] and r.get("tham_chieu")]
    ra = {
        "$comment": "Bằng chứng WCAG AA. Sinh lại mỗi khi token màu đổi — "
                    "KHÔNG chỉnh tay. Lệnh: python core/tools/sinh_contrast_audit.py",
        "generated": str(date.today()),
        "version": "3.0.0",
        "supersedes": "2.0.0 — v2 viết tay và đã lệch: khai glass_alpha.dark "
                      "0.88 trong khi tokens.css đổi sang .62 (FR-027)",
        "source": "05_uiux/tokens.css (đọc bằng script, không gõ lại)",
        "standard": "WCAG 2.1 AA — chữ 4.5:1 · UI 3:1 · viền 1.35:1 · hue_gap ≥25°",
        "note": "Nhóm glass-* đo chữ trên panel kính (alpha lấy TỪ "
                "--background) phủ lên 4 loại ảnh nền. Hai chế độ hai alpha: "
                "ảnh sáng làm nền nhạt nên chữ tối cần panel đặc hơn.",
        "tokens": ket,
        "glass_alpha": alpha,
        "backgrounds_tested": {NEN_TEN[k]: v for k, v in NEN.items()},
        "backgrounds_real": that,
        "results": kq,
        "total": len(kq),
        "failures": len(truot),
    }

    print(f"\n{'XEM THU' if xem else 'GHI THAT'} · {len(kq)} cặp · "
          f"{len(truot)} trượt")
    print(f"glass_alpha: light={alpha['light']} dark={alpha['dark']}\n")
    for r in truot:
        print(f"  TRUOT  {r['mode']:5} {r['scope']:26} {r['pair']:24} "
              f"{r['fg']} / {r['bg']}  {r['ratio']} < {r['min']}")
    if not truot:
        print("  (khong cap nao truot tren ANH DANG DUNG)")
    if truot_tc:
        print(f"\n  {len(truot_tc)} cap truot tren nen GIA DINH "
              "(tham chieu, khong tinh la loi):")
        for r in truot_tc:
            print(f"    {r['mode']:5} {r['scope']:26} {r['pair']:24} "
                  f"{r['ratio']} < {r['min']}")

    if not xem:
        RA.write_text(json.dumps(ra, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
        print(f"\nda ghi {RA.relative_to(R)}")
    print()
    return 1 if truot else 0


if __name__ == "__main__":
    sys.exit(main())
