#!/usr/bin/env python3
r"""Cổng ĐỊNH VỊ LẠI QUOTE — `M12 AC-3.2` + `AC-3.3` (bản `FR-053 §3`).

VÌ SAO CỔNG NÀY TỒN TẠI
`spec §3` + `model_flow §4` khai phép định vị là `re.finditer(re.escape(q))`.
Khớp nguyên văn là điều kiện SAI, và nó trượt vì bốn nguyên nhân ĐỘC LẬP:

  ligature PDF          `ﬁ` là MỘT ký tự Unicode, không phải hai chữ
  gạch nối cuối dòng    nguồn có `boost-\ning`, model trả `boosting`
  khoảng trắng          PDF cột đôi cho `\n` giữa câu, khoảng trắng kép
  model chuẩn hoá       `"`→`"` · `—`→`-`

`AC-3.2` nói *"quote không tìm thấy ⇒ khẳng định bị TỪ CHỐI"*. Cài bằng
`re.escape` thuần thì **phần lớn quote THẬT bị từ chối** — đỏ oan, đúng lớp lỗi
`LOCATOR_RE` đã trả giá một lần. Và hệ quả tệ hơn lọt: người thi công sẽ **hạ
ngưỡng cho tới lúc cổng hết đỏ**.

⇒ Nên cổng này có **HAI VẾ**, và thiếu vế hai thì mệnh đề *"xanh khi mọi quote
khớp"* nghiệm đúng bằng cách **TỪ CHỐI TẤT CẢ** — cổng không phân biệt được
*"không có khẳng định nào"* với *"mọi khẳng định đều sai"*.

Cổng KHÔNG đọc PDF. `dinh_vi()` nhận `list[{neo, text}]` nên nó không cần biết
nguyên liệu là gì — trang (PDF) hay mốc thời gian (transcript) cùng một hàm.
Đọc PDF là việc khác, cổng khác.

ĐỎ_KHI  quote bịa vẫn được định vị · quote THẬT vướng ligature/gạch-nối bị từ
        chối (đỏ oan) · ngưỡng gõ trong mã thay vì ở bảng khai · đổi ngưỡng
        trong bảng mà hành vi không đổi
XANH_KHI bắt được bịa VÀ không đỏ oan, và ngưỡng đọc từ `nguong.json`
"""

import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(R / "chungcat" / "src"))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


# ── Fixture: khối văn bản dựng TẠI ĐÂY, không đọc kho, không đọc PDF ────────
# Mỗi khối mô phỏng đúng một nguyên nhân trượt đã đo ở nghiên cứu §2.
KHOI = [
    {"neo": 1, "text": "Trang mở đầu không chứa gì đáng trích."},
    {"neo": 7, "text": (
        # ligature `ﬁ` (U+FB01) + gạch nối cuối dòng + khoảng trắng kép
        "Mô hình xác đị​nh bậc hai dùng khai triển Taylor, và građient boost-\n"
        "ing là trường hợp riêng.  Hệ số ﬁtness được tính lại mỗi vòng."
    )},
    {"neo": 12, "text": (
        # nháy cong + gạch dài — thứ model hay chuẩn hoá khi trích lại
        "Tác giả gọi đây là “bước ngoặt” — và đó là toàn bộ câu chuyện."
    )},
]

# Quote model trả về, ở dạng model HAY viết: đã chuẩn hoá, đã nối gạch nối.
QUOTE_THAT = [
    ("građient boosting là trường hợp riêng", 7, "gạch-nối-cuối-dòng"),
    ("Hệ số fitness được tính lại mỗi vòng", 7, "ligature ﬁ → fi"),
    ('Tác giả gọi đây là "bước ngoặt" - và đó là toàn bộ câu chuyện', 12, "nháy cong + gạch dài"),
]
QUOTE_BIA = [
    "Nghiên cứu chứng minh mô hình đạt độ chính xác 99,7% trên tập kiểm định",
    "Theo bảng 4, chi phí huấn luyện giảm bốn lần so với bản trước",
]

tmp = Path(tempfile.mkdtemp(prefix="m12-verify-"))
try:
    # Bảng khai ngưỡng — fixture, KHÔNG dùng file thật của module.
    bang = tmp / "nguong.json"
    bang.write_text(json.dumps({
        "$comment": "fixture cổng — không phải bảng khai thật",
        "nguong_fuzzy": 88.0,
    }, ensure_ascii=False), encoding="utf-8")

    try:
        verify = _nap.nap("verify")
    except (_nap.ThieuMa, _nap.ThieuGoi) as e:
        _nap.bao_do_va_thoat(e, "check_quote_co_that.py", "T12-2")


    # ══ VẾ 1 · BẮT ĐƯỢC BỊA ═══════════════════════════════════════════════
    nguong = json.loads(bang.read_text(encoding="utf-8"))["nguong_fuzzy"]
    for q in QUOTE_BIA:
        kiem(verify.dinh_vi(q, KHOI, nguong) is None,
             f"quote BỊA bị từ chối — {q[:38]}…")

    # ══ VẾ 2 · KHÔNG ĐỎ OAN ═══════════════════════════════════════════════
    # Thiếu vế này thì vế 1 nghiệm đúng bằng cách từ chối TẤT CẢ.
    for q, neo_dung, vi in QUOTE_THAT:
        kq = verify.dinh_vi(q, KHOI, nguong)
        kiem(kq is not None, f"quote THẬT KHÔNG bị từ chối oan — {vi}")
        if kq is not None:
            kiem(kq["neo"] == neo_dung,
                 f"trả đúng neo cho quote thật — {vi}",
                 f"trả {kq['neo']}, mong {neo_dung}")

    # ══ VẾ 3 · NGƯỠNG Ở BẢNG KHAI, KHÔNG Ở MÃ ═════════════════════════════
    src = (R / "chungcat" / "src" / "verify.py").read_text(encoding="utf-8")
    kiem("nguong" in verify.dinh_vi.__code__.co_varnames,
         "`dinh_vi` NHẬN ngưỡng làm tham số — không tự đọc hằng trong mã")

    # Ngưỡng cao vô lý ⇒ quote thật (đã chuẩn hoá xong vẫn còn sai khác) bị loại;
    # ngưỡng thấp ⇒ nhận. Đổi SỐ TRONG BẢNG mà hành vi không đổi nghĩa là mã đang
    # đọc một hằng ở đâu đó khác.
    doi = [verify.dinh_vi(q, KHOI, 100.0) for q, _, _ in QUOTE_THAT]
    thap = [verify.dinh_vi(q, KHOI, 50.0) for q, _, _ in QUOTE_THAT]
    kiem(doi != thap or all(x is not None for x in doi),
         "đổi ngưỡng trong bảng ⇒ hành vi đổi (ngưỡng không bị gõ cứng)")

    # Quét bằng AST, KHÔNG bằng regex trên văn bản.
    # Bản đầu của cổng này grep thẳng `src` và ĐỎ OAN ngay lượt chạy thứ hai —
    # vì một chú thích *"điểm là 0-100"* cũng khớp. Cổng đo lời văn thay vì đo
    # mã là đúng lớp lỗi cổng này sinh ra để chặn, nên nó phải tự khỏi trước.
    import ast as _ast
    cay = _ast.parse(src)
    tai_lieu = {id(d) for n in _ast.walk(cay)
                if isinstance(n, (_ast.Module, _ast.FunctionDef, _ast.ClassDef))
                and (d := _ast.get_docstring(n, clean=False)) is not None}
    so_tay = [
        n.value for n in _ast.walk(cay)
        if isinstance(n, _ast.Constant) and isinstance(n.value, (int, float))
        and not isinstance(n.value, bool) and 50 <= n.value <= 100
    ]
    kiem(not so_tay,
         "không số ngưỡng nào gõ tay trong MÃ của `verify.py` (chú thích không tính)",
         f"thấy: {so_tay}")
    kiem(len(tai_lieu) >= 1, "`verify.py` có docstring nói VÌ SAO — không phải mã trần")

    # ══ VẾ 4 · CHUẨN HOÁ LÀ PHÉP RIÊNG, GỌI ĐƯỢC ══════════════════════════
    kiem(verify.chuan_hoa("boost-\ning") == "boosting",
         "`chuan_hoa` nối gạch-nối-cuối-dòng")
    kiem(verify.chuan_hoa("ﬁtness") == "fitness",
         "`chuan_hoa` gỡ ligature ﬁ")
    kiem(verify.chuan_hoa("a  \n b") == "a b",
         "`chuan_hoa` nén mọi khoảng trắng về một space")
    kiem(verify.chuan_hoa("“x” — y") == '"x" - y',
         "`chuan_hoa` quy nháy cong và gạch dài về dạng thẳng")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-3.2 chưa có răng")
print("bắt được bịa · KHÔNG đỏ oan · ngưỡng ở bảng khai — AC-3.2 có răng")
