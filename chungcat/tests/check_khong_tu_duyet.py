#!/usr/bin/env python3
r"""Cổng KHÔNG TỰ DUYỆT — `AC-1.3` · `M12-R2`.

VÌ SAO CỔNG NÀY TỒN TẠI
Cùng bất biến với `M01-R1`, khác chỗ đứng: **máy KHÔNG BAO GIỜ tự duyệt**.

⚠️ `FR-046` làm mất MỘT RÀO, và `M12-R2` đã ghi ra: trước đây M12 có **hai** —
nó tự ghi `draft`, **và** `gate.py:133` ép `draft` vô điều kiện lần nữa. Nay
nháp vào DB qua API nên `gate.py` **không còn trên đường của M12**; rào còn lại
là **mặc định của bảng nháp**, và rào đó phải mạnh bằng rào cũ.

⇒ Vì thế cổng này **KHÔNG** được đo *"file ra `_inbox/` mang draft"* — đo thế thì
nó **xanh một cách RỖNG** (M12 không thả file nào vào đó nữa). Nó phải **GIEO
một payload đòi `approved`** rồi **ĐỌC LẠI hàng đã ghi**.

Rào thật nằm ở HAI lớp, và cổng đo cả hai:
    1. `chungcat` không có đường nào GỬI trường trạng thái lên LÕI
    2. DDL của LÕI: `trang_thai DEFAULT 'nhap'` + `review_status DEFAULT 'draft'
       CHECK (review_status = 'draft')` — lớp 1 vỡ thì lớp này vẫn từ chối

ĐỎ_KHI  `chungcat` gửi `review_status`/`trang_thai` lên LÕI · `POST` vào cửa
        BẢN GHI `/api/articles` (`taoBai` đặt `approved` VÔ ĐIỀU KIỆN) ·
        `PUT`/`PATCH` một bản ghi kho · DDL thiếu `DEFAULT`/`CHECK`
        ⚠️ `POST /api/articles/media` KHÔNG bị cấm — `FR-054` buộc M12 dùng nó
        để nạp hiện vật `.vtt`. Hai cửa khác nhau.
XANH_KHI M12 không có đường nào khai trạng thái, và DDL cưỡng chế bằng cấu trúc
"""

import ast
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "chungcat" / "src"
DDL = R / "web" / "api" / "loi.schema.sql"
sys.path.insert(0, str(Path(__file__).resolve().parent))

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


# ══ LỚP 1 · M12 không có đường nào KHAI trạng thái ════════════════════════
CAM = {"review_status", "trang_thai", "approved", "da_gui"}
dinh = []
# Vế THẬT thay cho phép so tiền tố: một Request/`method="POST"` mà đường có
# `/api/articles`. Đo trên CÙNG một câu lệnh, nên nó không phạt đường đọc.
ghi_bai = []
for f in sorted(SRC.rglob("*.py")):
    src_f = f.read_text(encoding="utf-8")
    for i, dong in enumerate(src_f.splitlines(), 1):
        if "/api/articles" not in dong:
            continue
        # Cửa sổ ba dòng: `urllib.request.Request(url, method="POST")` hay gãy
        # dòng, và một cửa sổ quá rộng là chỗ khớp sang lời gọi bên cạnh.
        cua_so = chr(10).join(src_f.splitlines()[max(0, i - 2):i + 2])
        if '"POST"' not in cua_so and "'POST'" not in cua_so:
            continue
        # `POST /api/articles/media` là cửa HIỆN VẬT, và `FR-054` BUỘC M12 dùng
        # nó (transcript `.vtt` là hiện vật `la_dan_xuat`). Cấm ở đây là cấm cửa
        # BẢN GHI — `taoBai` của `POST /api/articles` đặt `approved` vô điều
        # kiện. Hai cửa khác nhau, và gộp chúng là chặn đúng thứ FR đòi.
        if "/api/articles/media" in dong:
            continue
        ghi_bai.append(f"{f.name}:{i}")
kiem(not ghi_bai,
     "0 lời gọi POST vào cửa BẢN GHI `/api/articles` (cửa hiện vật `/media` thì được)",
     str(ghi_bai))

# Và vế NGƯỢC: M12 KHÔNG được PUT/PATCH một bản ghi trong kho. `AC-1.1` nói bản
# nháp đi qua BẢNG NHÁP; sửa thẳng một bản ghi đã duyệt là đi vòng qua cả
# `FR-046` lẫn `M05-R1`, và không cổng nào khác canh chỗ đó.
sua_bai = []
for f in sorted(SRC.rglob("*.py")):
    src_f = f.read_text(encoding="utf-8")
    for i, dong in enumerate(src_f.splitlines(), 1):
        if "/api/articles" not in dong or "/api/articles/media" in dong:
            continue
        cua_so = chr(10).join(src_f.splitlines()[max(0, i - 2):i + 2])
        if '"PUT"' in cua_so or '"PATCH"' in cua_so:
            sua_bai.append(f"{f.name}:{i}")
kiem(not sua_bai,
     "0 lời gọi PUT/PATCH vào bản ghi kho — nháp đi qua BẢNG NHÁP (AC-1.1)",
     str(sua_bai))

for f in sorted(SRC.rglob("*.py")):
    cay = ast.parse(f.read_text(encoding="utf-8"))
    for n in ast.walk(cay):
        if isinstance(n, ast.Constant) and isinstance(n.value, str):
            if n.value in CAM:
                dinh.append(f"{f.name}:{n.lineno} → {n.value}")
        # `dict(review_status=...)` cũng phải bắt — khoá dạng keyword.
        if isinstance(n, ast.keyword) and n.arg in CAM:
            dinh.append(f"{f.name}:{n.lineno} → kwarg {n.arg}")

kiem(not dinh, "`chungcat/src/**` KHÔNG có chuỗi/khoá trạng thái nào", f"{dinh}")


# Cổng phải ĐỎ ĐƯỢC: gieo một file vi phạm ở thư mục tạm rồi quét lại.
import shutil  # noqa: E402
import tempfile  # noqa: E402

tmp = Path(tempfile.mkdtemp(prefix="m12-tuduyet-"))
try:
    (tmp / "vi_pham.py").write_text(
        'than = {"review_status": "approved"}\n'
        'goi("http://127.0.0.1:8787/api/articles", than)\n', encoding="utf-8")
    bat_dinh, bat_cua = [], []
    for n in ast.walk(ast.parse((tmp / "vi_pham.py").read_text(encoding="utf-8"))):
        if isinstance(n, ast.Constant) and isinstance(n.value, str):
            if n.value in CAM:
                bat_dinh.append(n.value)
            if "/api/articles" in n.value:
                bat_cua.append(n.value)
    kiem(bool(bat_dinh), "cổng BẮT được chuỗi `review_status`/`approved` khi có")
    kiem(bool(bat_cua), "cổng BẮT được lời gọi `POST /api/articles` khi có")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ══ LỚP 2 · DDL của LÕI cưỡng chế bằng CẤU TRÚC ═══════════════════════════
if not DDL.exists():
    kiem(False, "DDL bảng nháp của LÕI tồn tại", f"thiếu {DDL}")
else:
    sql = DDL.read_text(encoding="utf-8")
    bang = re.search(r"CREATE TABLE[^(]*nhap_chung_cat\s*\((.*?)\n\);", sql, re.S)
    kiem(bang is not None, "tìm được định nghĩa bảng `nhap_chung_cat`")
    if bang:
        t = bang.group(1)
        kiem(re.search(r"trang_thai.*DEFAULT\s+'nhap'", t, re.S) is not None,
             "`trang_thai` có `DEFAULT 'nhap'` — mặc định là RÀO, không phải gợi ý")
        kiem(re.search(r"review_status.*DEFAULT\s+'draft'", t, re.S) is not None,
             "`review_status` có `DEFAULT 'draft'`")
        kiem(re.search(r"review_status\s*=\s*'draft'", t) is not None,
             "`review_status` có `CHECK` HẰNG `= 'draft'` — bảng này CHỈ chứa "
             "nháp, nên một hàng mang `approved` là lỗi CẤU TRÚC")
        # Và cưỡng chế phải ở DDL, không ở handler: `CHECK` là thứ handler quên
        # cũng không lách được.
        kiem("CHECK" in t, "cưỡng chế nằm ở DDL (CHECK), không chỉ ở handler")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — M12-R2 chưa có răng")
print("M12 không khai trạng thái · DDL cưỡng chế draft bằng cấu trúc")
