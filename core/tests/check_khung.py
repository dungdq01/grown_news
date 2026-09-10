#!/usr/bin/env python3
"""Cổng khung thân bài — văn xuôi phải khớp `core/assets/khung-than-bai.json`.

VÌ SAO CỔNG NÀY TỒN TẠI
Khung mục có bốn người dùng. Ba trong bốn DẪN XUẤT được từ file khai:
`khung.py` (Python), `readFileSync` (test Node), `esbuild --define __KHUNG__`
(bundle FE). Người thứ tư là VĂN XUÔI — hai file `.md` mẫu và hai `shell.html`
— và văn xuôi không dẫn xuất được. Chỗ không dẫn xuất được là chỗ trôi.

Nó đã trôi thật: khung 9 mục cũ tồn tại thành HAI bộ tên khác nhau
(bộ A ở form/fixture/kb, bộ B ở cả 14 file kb-mock + harness test), và KHÔNG
cổng nào bắt được — vì `validate.py` chỉ ép SỐ mục, không bao giờ đọc tên.

Cổng này đọc tên.

ĐỎ_KHI  tiêu đề trong file mẫu lệch khai báo · shell còn "khung 9 mục" hay
        `id="f-muc9"` · hai shell lệch nhau ở khối nạp
XANH_KHI khai báo + hai .md + hai shell cùng nói một khung
"""

import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "core" / "src"))

from source_distiller.khung import (  # noqa: E402
    CAN_LOCATOR, CON, KHUNG, LA, MUC, SO_MUC, TEN, TEN_CON,
)

loi = []
N = len(MUC)      # số mục `##` trong markdown — nhãn nút "nạp khung N mục"
N_O = len(LA)     # số Ô NHẬP của form — SCR-05 §1: một ràng buộc một ô


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


# ─── 1 · Khai báo tự nhất quán ───────────────────────────────────────────────
print(f"1 · Khai báo — khung v{KHUNG['phien_ban']}, {N} mục\n")
kiem(N >= 3, f"có {N} mục", "một khung dưới 3 mục thì không còn là khung")
kiem(bool(CON), f"§3 có {len(CON.get(3, []))} mục con: {CON.get(3)}")
# WO-038 · mục Tinh túy KHÔNG còn cấu trúc con. Địa chỉ của nó suy TỪ bảng
# khai bằng tên, không gõ "3.4" vào cổng — gõ số vào đây là bản thứ hai.
# `LA` chỉ là danh sách ĐỊA CHỈ; mục lá dạng dict phải gom lại từ `KHUNG`.
LA_DICT = [c for m in MUC for c in (m.get("con") or [m])]
TT = [c for c in LA_DICT if c["ten"] == "Tinh túy"]
kiem(len(TT) == 1, f"bảng khai có đúng một mục lá tên `Tinh túy` ({len(TT)})",
     "0 thì mọi phép dưới đúng vô điều kiện; >1 thì cổng đo thiếu")
TT_SO = TT[0]["so"] if TT else ""
kiem(TT_SO in CAN_LOCATOR,
     f"mục tinh túy ({TT_SO}) VẪN nằm trong danh sách cần locator",
     "bỏ cấu trúc con là bỏ 5 dòng bullet, KHÔNG phải bỏ luật địa chỉ")
kiem(bool(TT) and TT[0].get("nang") is True,
     "mục tinh túy VẪN là mục nặng",
     "nó thôi có cấu trúc con, không hạ cấp")

# ─── 2 · Hai file .md mẫu phải mang ĐÚNG chuỗi tiêu đề ───────────────────────
# Không so cả file: nội dung được phép khác nhau (fixture có `category:` riêng).
# Chỉ so DÃY TIÊU ĐỀ — đó là thứ khung khai, và là thứ trôi.
MAU = [
    R / "core" / "skill-src" / "mau-dat-chuan.md",
    R / "core" / "tests" / "fixtures" / "dat-chuan.md",
]
mong_muc = [f"## {m['so']}. {m['ten']}" for m in MUC]
mong_con = [f"### {s} {TEN_CON[s]}" for ds in CON.values() for s in ds]

print("\n2 · File mẫu mang đúng dãy tiêu đề\n")
for p in MAU:
    ten = p.relative_to(R).as_posix()
    if not p.exists():
        kiem(False, f"{ten} tồn tại")
        continue
    t = p.read_text(encoding="utf-8")
    thay_muc = re.findall(r"^##\s+\d+\.\s+.+$", t, re.M)
    thay_con = re.findall(r"^###\s+\d+\.\d+\s+.+$", t, re.M)
    kiem([x.strip() for x in thay_muc] == mong_muc, f"{ten}: dãy `## n.` khớp khai báo",
         f"khai {mong_muc} · thấy {[x.strip() for x in thay_muc]}")
    kiem([x.strip() for x in thay_con] == mong_con, f"{ten}: dãy `### n.m` khớp khai báo",
         f"khai {mong_con} · thấy {[x.strip() for x in thay_con]}")

# ─── 3 · Hai shell.html — số ô, nhãn nút, id khối ────────────────────────────
# `web/render/shell.html` là bản SỐNG (render/trang.mjs đọc nó).
# `web/plugins/home-pages/shell.html` chết với SSR nhưng NĂM file test đọc nó,
# và không test nào ép hai bản giống nhau — nên chúng trôi được trong im lặng.
SHELL = [
    R / "web" / "render" / "shell.html",
    R / "web" / "plugins" / "home-pages" / "shell.html",
]
print(f"\n3 · Hai shell.html nói khung {N} mục / {N_O} ô nhập\n")
than = {}
for p in SHELL:
    ten = p.relative_to(R).as_posix()
    if not p.exists():
        kiem(False, f"{ten} tồn tại")
        continue
    t = p.read_text(encoding="utf-8")
    # WO-037 · phép kiểm `>{N_O} ô<` ĐÃ BỎ, không phải đổi số.
    #
    # Nó tồn tại để bắt một bản gõ tay thứ hai của số mục lá: shell viết `8 ô`
    # còn bảng khai nói 8, và hai nơi trôi được. Người dùng chốt bỏ chế độ soạn
    # thô nên nút đó gỡ khỏi cả hai shell — nay shell KHÔNG nói con số ấy ở đâu
    # nữa, `dungKhung()` dựng ô từ bảng khai lúc chạy. Bản sao đã biến mất; canh
    # tiếp là canh một cái bóng, và cổng canh cái bóng thì chỉ đỏ oan được.
    #
    # Số mục lá VẪN được canh, ở chỗ nó còn sống: `web/test/form-van-xuoi.test.js`
    # §1 dựng form THẬT rồi đếm ô, và `khung-8-o.test.js` so với bảng khai.
    kiem(f"nạp khung {N} mục" in t, f"{ten}: nút nạp khung ghi `{N} mục`",
         f"còn: {re.findall(r'nạp khung (\\d+) mục', t)}")
    # id KHÔNG mang số: một id như `f-muc9` là một tập gõ tay nữa, và lần đổi
    # khung sau lại phải rename id ở shell + CSS + test.
    kiem('id="f-o-muc"' in t, f"{ten}: khối ô mang `id=\"f-o-muc\"` (không số)",
         f"còn: {re.findall(r'id=.(f-muc[0-9]*|f-o-muc).', t)}")
    m = re.search(r'<fieldset class="f-nhom f-nhom-than">.*?</fieldset>', t, re.S)
    than[ten] = m.group(0) if m else None
    kiem(m is not None, f"{ten}: tìm được fieldset `f-nhom-than`")

if len(than) == 2 and all(than.values()):
    a, b = list(than.values())
    kiem(a == b, "hai shell.html giống nhau ở khối nạp nội dung",
         "hai bản lệch nhau: bản sống render một khung, năm file test đọc khung khác")

# ─── 4 · Thân mẫu do khai báo sinh ra phải đi qua chính cổng của nó ───────────
# Đây là chiều ngược của §2: §2 hỏi "văn xuôi có khớp khai báo", §4 hỏi
# "khai báo có sinh ra được thứ hợp lệ". Thiếu §4 thì một khai báo vô nghĩa
# (mục cần locator mà `than_mau` không chèn locator) vẫn xanh.
print("\n3b · Tinh túy là MỘT ô văn xuôi — không cấu trúc con\n")

# Người dùng, nguyên văn: *"chỉ cần 1 header duy nhất là tinh túy, sau đó tất
# cả là text văn bản gõ vào, giống các ô khác… các fields như 'chuyển giao',
# 'tin cậy' → bỏ hết"*. Bảng khai là chỗ ĐÚNG để canh: FE, Python và văn xuôi
# đều dẫn xuất từ đó, nên canh ở đây là canh cả ba cùng lúc.
kiem("tinh_tuy" not in KHUNG,
     "bảng khai không còn khối `tinh_tuy` (toi_da + bullets)",
     f"còn: {list((KHUNG.get('tinh_tuy') or {}).keys())}")
co_co = [c["so"] for c in LA_DICT if c.get("tinh_tuy")]
kiem(not co_co, "không mục nào còn cờ `tinh_tuy: true`", f"còn ở: {co_co}")

# GỢI Ý phải là văn xuôi. `goi_y` đi thẳng vào `placeholder` của ô nhập, nên
# một gợi ý chứa `####` là đúng thứ người dùng bảo bỏ — và nó còn là byte chết
# trong bundle FE.
MD_XAU = [("####", "heading"), ("- **", "bullet đậm"), ("## ", "heading")]
for c in LA_DICT:
    gy = c.get("goi_y") or ""
    xau = [ten for dau, ten in MD_XAU if dau in gy]
    if xau:
        kiem(False, f"gợi ý của mục {c['so']} là văn xuôi",
             f"chứa {', '.join(xau)}: {gy[:48]!r}")
kiem(all(not any(d in (c.get("goi_y") or "") for d, _ in MD_XAU) for c in LA_DICT),
     f"cả {len(LA_DICT)} gợi ý đều là văn xuôi, không dấu markdown")

print("\n4 · `than_mau()` từ khai báo đi qua cổng hình dạng\n")
try:
    from source_distiller.khung import than_mau
    # C1/T01-43: `LOCATOR_RE` (khớp mọi ngoặc vuông) đã bỏ. `tach_dia_chi`
    # đọc dạng từ `core/assets/dia-chi.json` — nên cổng này nay đòi mẫu
    # sinh ra địa chỉ THẬT, không phải một dấu ngoặc bất kỳ.  
    from source_distiller.validate import tach_dia_chi
    tm = than_mau()
    thay = [x.strip() for x in re.findall(r"^##\s+\d+\.\s+.+$", tm, re.M)]
    kiem(thay == mong_muc, "`than_mau()` sinh đủ dãy `## n.`", f"thấy {thay}")
    # Chiều ngược của mục 3b: bảng khai sạch mà `than_mau()` vẫn gõ tay
    # `####` thì bài mẫu dạy người viết đúng thứ vừa bỏ.
    ban = [d for d in tm.splitlines() if d.startswith("####") or d.startswith("- **")]
    kiem(not ban, "`than_mau()` sinh mục tinh túy là văn xuôi",
         f"còn {len(ban)} dòng markdown: {ban[:2]}")
    # Cắt block theo ĐÚNG ngữ nghĩa cổng 7 sẽ dùng: một mục con `### n.m` chạy
    # tới `### n.m` kế tiếp hoặc `## n.` kế tiếp — mục `#### n.m.k` nằm TRONG nó.
    #
    # Bản đầu của phép kiểm này cắt bằng `split("\n##")` và nó báo động giả cho
    # `3.4` lẫn `4`: `"\n##"` khớp luôn `"\n####"`, nên nó cắt mất đúng chỗ có
    # locator. Cửa sổ đo rộng/hẹp sai là lớp lỗi đắt nhất của repo này — một
    # phép kiểm đỏ oan là một phép kiểm sẽ bị tắt.
    def block(dc):
        neo = rf"^###\s+{re.escape(dc)}\s" if "." in dc else rf"^##\s+{re.escape(dc)}\.\s"
        m0 = re.search(neo, tm, re.M)
        if not m0:
            return ""
        sau = tm[m0.end():]
        m1 = re.search(r"^(?:##\s+\d+\.|###\s+\d+\.\d+\s)", sau, re.M)
        return sau[:m1.start()] if m1 else sau

    thieu_loc = [d for d in CAN_LOCATOR if not tach_dia_chi(block(d))]
    kiem(not thieu_loc, "mọi mục cần locator đều có locator trong `than_mau()`",
         f"thiếu ở: {thieu_loc}")
except Exception as e:
    kiem(False, "`than_mau()` chạy được", f"{type(e).__name__}: {e}")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ lệch khung thân bài — sửa ở core/assets/khung-than-bai.json "
             f"hoặc ở chỗ lệch, KHÔNG sửa cổng")
print(f"khung {N} mục: khai báo · 2 file mẫu · 2 shell.html cùng nói một khung")
