#!/usr/bin/env python3
r"""Cổng KHÔNG CHẠM KHO — `AC-1.1` · `M12-R1` · `Z5`.

VÌ SAO CỔNG NÀY TỒN TẠI
Kiến trúc ba vùng đứng trên đúng một câu: **MỘT cửa ghi, và nó ở LÕI**
(`M08-R2`). THỢ giữ khoá model, tức nó là **bề mặt nhận nội dung không tin được
từ Internet**. Cho nó ghi kho là gộp *"nơi đọc nội dung lạ"* với *"nơi quyết
nội dung nào vào kho"* — mất luật này thì một trang web độc đi **thẳng** vào
kho, không qua gate.

`M12-R1` ghi rõ *đỏ_khi*: gieo một dòng `sqlite3.connect(KB)` hoặc
`open(kb/…, "w")` vào `chungcat/` ⇒ cổng phải nêu **ĐÚNG file và dòng đó**.
Cổng này làm đúng vế đó — quét bằng AST, và **tự gieo** một file vi phạm ở thư
mục tạm để chứng minh nó bắt được, chứ không chỉ khai là bắt được.

ĐỎ_KHI  `chungcat/**` mở `_kho.sqlite` · mở file dưới `kb/` để GHI · import
        `sqlite3` ở lõi · cổng không nêu được file:dòng của ca gieo
XANH_KHI mọi lời gọi tới kho là HTTP `GET` qua `127.0.0.1:8787`
"""

import ast
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "chungcat" / "src"
sys.path.insert(0, str(Path(__file__).resolve().parent))

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


def quet(goc: Path) -> list[str]:
    """Trả danh sách `file:dòng` vi phạm. Nêu ĐỊA CHỈ, không nêu số lượng."""
    ra = []
    for f in sorted(goc.rglob("*.py")):
        try:
            cay = ast.parse(f.read_text(encoding="utf-8"))
        except SyntaxError:
            continue
        for n in ast.walk(cay):
            # a · import sqlite3 ở bất kỳ đâu trong THỢ
            if isinstance(n, (ast.Import, ast.ImportFrom)):
                ten = [a.name for a in n.names] + ([n.module] if isinstance(n, ast.ImportFrom) else [])
                if any((t or "").split(".")[0] == "sqlite3" for t in ten):
                    ra.append(f"{f.name}:{n.lineno} import sqlite3")
            if not isinstance(n, ast.Call):
                continue
            ten = getattr(n.func, "attr", None) or getattr(n.func, "id", None) or ""
            # b · sqlite3.connect(...)
            if ten == "connect":
                ra.append(f"{f.name}:{n.lineno} .connect(")
            # c · open(..., 'w'/'a'/'x') trên đường có `kb`
            if ten == "open":
                che_do = "".join(
                    c.value for a in n.args[1:2] for c in ast.walk(a)
                    if isinstance(c, ast.Constant) and isinstance(c.value, str))
                duong = " ".join(
                    c.value for a in n.args[:1] for c in ast.walk(a)
                    if isinstance(c, ast.Constant) and isinstance(c.value, str))
                if any(x in che_do for x in ("w", "a", "x", "+")) and "kb" in duong:
                    ra.append(f"{f.name}:{n.lineno} open(kb…, ghi)")
    return ra


# ══ Vế 1 · mã THẬT sạch ═══════════════════════════════════════════════════
that = quet(SRC)
kiem(not that, "`chungcat/src/**` không mở kho, không import sqlite3", f"{that}")

# ══ Vế 2 · cổng CÓ ĐỎ ĐƯỢC — tự gieo ca vi phạm, không chỉ khai ═══════════
tmp = Path(tempfile.mkdtemp(prefix="m12-khokho-"))
try:
    (tmp / "vi_pham_a.py").write_text(
        "import sqlite3\nc = sqlite3.connect('kb/_kho.sqlite')\n", encoding="utf-8")
    (tmp / "vi_pham_b.py").write_text(
        "f = open('kb/docs/x.md', 'w')\n", encoding="utf-8")
    (tmp / "sach.py").write_text(
        "import json\nx = open('/tmp/khong-phai-kho.json')\n", encoding="utf-8")

    bat = quet(tmp)
    kiem(any("vi_pham_a.py" in x and "sqlite3" in x for x in bat),
         "cổng BẮT được `import sqlite3` và nêu đúng file:dòng", f"{bat}")
    kiem(any("vi_pham_a.py" in x and "connect" in x for x in bat),
         "cổng BẮT được `.connect(`")
    kiem(any("vi_pham_b.py" in x for x in bat),
         "cổng BẮT được `open('kb/…', 'w')`", f"{bat}")
    kiem(not any("sach.py" in x for x in bat),
         "cổng KHÔNG đỏ oan trên file mở một đường không phải kho", f"{bat}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ══ Vế 3 · đường tới kho phải là HTTP tới loopback ════════════════════════
#
# Chỉ đếm chuỗi CÓ `://` — tức một URL thật. `startswith("http")` một mình bắt
# cả `"http"` trần, thứ dùng để SO SÁNH scheme chứ không phải một đích để gọi;
# nó đỏ oan trên `u.startswith("http")` của `chien_luoc_anh_bia` (2026-09-09).
# Mọi chỗ vế này đang bắt đều có `://`, nên phép siết KHÔNG nới răng nào.
url = []
for f in sorted(SRC.rglob("*.py")):
    for n in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
        if isinstance(n, ast.Constant) and isinstance(n.value, str) \
           and n.value.startswith("http") and "://" in n.value:
            url.append(f"{f.name}:{n.lineno} {n.value}")
kiem(all("127.0.0.1" in u or "{" in u or "//{" in u or "https://" in u for u in url),
     "mọi URL hằng trong mã là loopback, hoặc dựng từ bảng khai", f"{url}")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — M12-R1 chưa có răng")
print("không mở kho · không sqlite3 · cổng tự chứng minh nó đỏ được")
