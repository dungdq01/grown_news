#!/usr/bin/env python3
r"""AC-2.1 · AC-2.2 · M13-R2 — MỘT luật anchor, HAI bản cài (Python của M13 ↔ `slugGoiY()`
của FE), khớp TỪNG KÝ TỰ trên MỌI heading THẬT của kho; dedup `-1`/`-2` ổn định.

Bản JS được CHẠY THẬT bằng `node -e` — thân hàm trích từ `multiwindow.inline.ts`,
không phải một bảng giá trị viết tay (data_flow §5: so với bảng tay thì cả hai cùng
trôi mà cổng vẫn xanh).

Fixture heading (PM chốt 2026-09-10, Q2): CHỈ heading kho thật — mọi `##`/`###` trong
`kb/*/*.md` (export của DB chân lý). Hôm nay kho có ~9 heading; cổng IN SỐ THẬT và
nói ngưỡng 50 của AC-2.2 chưa đạt; đủ 50 thì ngưỡng tự lật. Bốn ca của testcases
AC-2.1 (`đ` · 200 ký tự · trùng · chỉ Hán) là ca RIÊNG, không tính vào N.

ĐỎ_KHI  một heading cho hai anchor khác nhau ở hai bản (nêu heading) · dedup đổi giữa hai lần
XANH_KHI N heading thật + 4 ca riêng khớp từng ký tự; dedup ổn định, state theo file
--tu-kiem: bản JS sửa `slice(0, 60)` → `80` ⇒ heading dài phải lệch và được NÊU TÊN.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _nap  # noqa: E402

CONG = "check_anchor_mot_luat.py"
TS = K.R / "web" / "plugins" / "multiwindow" / "src" / "scripts" / "multiwindow.inline.ts"
CA_RIENG = ["Hướng dẫn cài đặt", "Đường ống dữ liệu", "Hướng " * 40, "資料管線", "Hướng dẫn cài đặt"]


def than_js():
    m = re.search(r"function slugGoiY\(cau: string\): string \{(.*?)\n\}", TS.read_text(encoding="utf-8"), re.S)
    if not m:
        raise RuntimeError(f"không trích được slugGoiY từ {TS}")
    return m.group(1)


def chay_js(than: str, headings: list[str]) -> list[str]:
    ma = "function slugGoiY(cau){" + than + "}\nconst h=JSON.parse(require('fs').readFileSync(0,'utf8'));" \
         "process.stdout.write(JSON.stringify(h.map(slugGoiY)))"
    r = subprocess.run(["node", "-e", ma], input=json.dumps(headings, ensure_ascii=False), capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise RuntimeError(r.stderr[:300])
    return json.loads(r.stdout)


def so_hai_ban(headings, py, js):
    return [f"`{h[:40]}` py={p!r} js={j!r}" for h, p, j in zip(headings, py, js) if p != j]


def heading_kho_that():
    ra = []
    for p in sorted((K.R / "kb").glob("*/*.md")):
        if p.name.startswith("_") or ".v" in p.name:
            continue
        for l in p.read_text(encoding="utf-8", errors="replace").splitlines():
            m = re.match(r"^#{2,3}\s+(.+?)\s*#*\s*$", l)
            if m:
                ra.append(m.group(1))
    return ra


if K.TU_KIEM:
    print("\ntu-kiem · bản JS sửa một bước ⇒ phải NÊU heading lệch\n")
    goc = than_js()
    hs = ["Hướng dẫn", "Hướng " * 40]
    js_goc = chay_js(goc, hs)
    js_80 = chay_js(goc.replace("slice(0, 60)", "slice(0, 80)"), hs)
    lech = so_hai_ban(hs, js_goc, js_80)
    K.kiem(len(lech) == 1 and "Hướng Hướng" in lech[0], "cắt 80 thay 60 ⇒ đúng heading dài bị nêu, heading ngắn không", " · ".join(lech))
    js_khong_d = chay_js(goc.replace('.replace(/đ/g, "d")', ""), ["Đường đi"])
    K.kiem(so_hai_ban(["Đường đi"], js_goc[:0] + chay_js(goc, ["Đường đi"]), js_khong_d), "bỏ bước đ→d ⇒ lệch được nêu")
    K.kiem(so_hai_ban(hs, js_goc, js_goc) == [], "hai bản y hệt ⇒ 0 lệch (không đỏ oan)")
    K.tu_kiem_xong(CONG, 3)

try:
    anchor = _nap.nap("anchor")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-2")

print("\n1 · heading THẬT của kho — hai bản khớp từng ký tự\n")
hs = heading_kho_that()
n = len(hs)
print(f"  ·  N = {n} heading thật trong kb/*/*.md" + (" — ngưỡng 50 của AC-2.2 CHƯA đạt, so trên toàn bộ N" if n < 50 else " (≥50, đủ ngưỡng AC-2.2)"))
K.kiem(n > 0, "kho có ít nhất một heading để so", "kho rỗng heading — không đo được")
js = chay_js(than_js(), hs)
py = [anchor.slug(h) for h in hs]
lech = so_hai_ban(hs, py, js)
K.kiem(not lech, f"{n}/{n} heading thật: anchor_py == slugGoiY từng ký tự", " · ".join(lech[:3]))

print("\n2 · bốn ca riêng của AC-2.1 — đ · 200 ký tự · trùng · chỉ Hán\n")
js2 = chay_js(than_js(), CA_RIENG)
py2 = [anchor.slug(h) for h in CA_RIENG]
lech2 = so_hai_ban(CA_RIENG, py2, js2)
K.kiem(not lech2, "4 ca riêng khớp (đ→d · cắt 60 · trùng · chỉ Hán ⇒ chuỗi rỗng ở cả hai)", " · ".join(lech2))
K.kiem(py2[0] == "huong-dan-cai-dat" and py2[1] == "duong-ong-du-lieu", "`Hướng dẫn cài đặt` ⇒ huong-dan-cai-dat · `Đường ống dữ liệu` ⇒ duong-ong-du-lieu", str(py2[:2]))
K.kiem(len(py2[2]) == 60, "heading 200+ ký tự ⇒ cắt ở 60", f"dài {len(py2[2])}")

print("\n3 · dedup -1/-2 kiểu github-slugger — ổn định, state theo FILE\n")
bo = anchor.BoAnchor()
a = [bo.sinh(h) for h in ["Foo 1", "Foo", "Foo", "資料管線", "資料管線"]]
bo2 = anchor.BoAnchor()
b = [bo2.sinh(h) for h in ["Foo 1", "Foo", "Foo", "資料管線", "資料管線"]]
K.kiem(a == b, "hai lần dựng cùng thứ tự ⇒ cùng hậu tố", f"{a} ≠ {b}")
K.kiem(a[:3] == ["foo-1", "foo", "foo-2"], "`Foo 1 · Foo · Foo` ⇒ foo-1 · foo · foo-2 (vòng while)", str(a[:3]))
K.kiem(a[3] == "" and a[4] == "-1", "hai heading chỉ Hán fold rỗng ⇒ '' rồi '-1' (luật khử trùng vẫn xử)", str(a[3:]))
K.kiem(anchor.BoAnchor().sinh("Foo") == "foo", "instance mới (file khác) ⇒ không mang hậu tố của file trước")

K.chot(f"anchor một luật · {n} heading thật + 4 ca riêng khớp JS · dedup ổn định")
