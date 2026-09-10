#!/usr/bin/env python3
r"""Cổng ĐỊNH TUYẾN THEO NGÔN NGỮ — `AC-4.2` (bản `FR-053`).

VÌ SAO CỔNG NÀY TỒN TẠI
`spec §4` luật 1: định tuyến theo **TỈ LỆ** ký tự Hán, **không** theo *"có chữ
Hán hay không"*. Một bài 80% tiếng Việt kèm một trích đoạn tiếng Trung **không**
được đẩy sang nhà tiếng Trung — vì đẩy nhầm là **gửi tài liệu tới một pháp nhân
khác**, không phải một lựa chọn kém tối ưu.

`spec §4` luật 2: **ngôn ngữ do MÁY ĐẾM**, không do model tự khai. Model tự khai
ngôn ngữ rồi tự được chọn theo lời khai đó là nó **cầm bút ghi vào thứ nó bị
chấm** — luật gốc cấm.

Sau `FR-053`, tỉ lệ Hán quyết **GỢI Ý MẶC ĐỊNH**, không quyết tuyến: người chọn
thắng gợi ý. Nên cổng đo *gợi ý*, và đo cả chuyện *người thắng*.

ĐỎ_KHI  bài 80% Việt bị gợi ý sang nhà tiếng Trung · ngưỡng gõ trong mã · có
        trường nào cho model tự khai ngôn ngữ · gợi ý đè lựa chọn của người
XANH_KHI gợi ý theo tỉ lệ, ngưỡng ở bảng khai, và người chọn thắng
"""

import ast
import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "chungcat" / "src"
ASSETS = R / "chungcat" / "assets"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(SRC))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    bang_khai, dinh_tuyen = _nap.nap("bang_khai", "dinh_tuyen")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_dinh_tuyen_ngon_ngu.py", "T12-5")

bang = bang_khai.doc_model(ASSETS / "model.json")

# ── Ba mẫu, ba tỉ lệ khác nhau ────────────────────────────────────────────
VIET = ("Mô hình dùng khai triển Taylor bậc hai để xấp xỉ hàm mục tiêu, và đó là "
        "toàn bộ khác biệt đáng nhớ. Tài liệu gốc gọi nó là 梯度提升.")
TRUNG = ("梯度提升树是一种集成学习方法，通过迭代地训练弱学习器来最小化损失函数。"
         "每一步都在拟合上一步的残差。")
TRONG = "   \n\t  "

# ══ AC-4.2 · đo TỈ LỆ, không đo có/không ══════════════════════════════════
tv, tt = dinh_tuyen.ti_le_han(VIET), dinh_tuyen.ti_le_han(TRUNG)
kiem(0 < tv < 0.25, "bài 80% Việt + trích đoạn Hán ⇒ tỉ lệ THẤP nhưng KHÁC 0",
     f"đo {tv:.3f}")
kiem(tt > 0.9, "bài Hán thật ⇒ tỉ lệ CAO", f"đo {tt:.3f}")
kiem(dinh_tuyen.ti_le_han(TRONG) == 0.0, "văn bản rỗng ⇒ 0.0, không chia cho 0")

g_v = dinh_tuyen.goi_y_mac_dinh(bang, "chung-cat", VIET)
g_t = dinh_tuyen.goi_y_mac_dinh(bang, "chung-cat", TRUNG)
kiem(g_v["ngon_ngu"] != "zh",
     "AC-4.2 · bài 80% Việt KHÔNG bị gợi ý sang nhà tiếng Trung",
     f"gợi ý {g_v['ngon_ngu']}")
kiem(g_t["ngon_ngu"] == "zh", "bài Hán thật thì CÓ gợi ý sang nhà tiếng Trung")

# ══ Ngưỡng ở BẢNG KHAI — đổi bảng thì hành vi đổi, 0 dòng mã ══════════════
kiem("nguong_han" in bang, "`nguong_han` khai ở bảng")
src = (SRC / "dinh_tuyen.py").read_text(encoding="utf-8")
so = [n.value for n in ast.walk(ast.parse(src))
      if isinstance(n, ast.Constant) and isinstance(n.value, float) and 0 < n.value < 1]
kiem(not so, "không ngưỡng tỉ lệ nào gõ tay trong MÃ", f"thấy {so}")

tmp = Path(tempfile.mkdtemp(prefix="m12-tuyen-"))
try:
    # Hạ ngưỡng xuống dưới tỉ lệ của bài Việt ⇒ chính bài đó phải ĐỔI gợi ý.
    p = tmp / "nguong-thap.json"
    p.write_text(json.dumps({**bang, "nguong_han": max(tv / 2, 0.001)},
                            ensure_ascii=False), encoding="utf-8")
    thap = bang_khai.doc_model(p)
    kiem(dinh_tuyen.goi_y_mac_dinh(thap, "chung-cat", VIET)["ngon_ngu"] == "zh",
         "hạ `nguong_han` trong bảng ⇒ CÙNG bài đổi gợi ý (0 dòng mã)")

    # Thiếu `nguong_han` ⇒ ĐỎ, không rơi về một hằng ngầm.
    d = {k: v for k, v in bang.items() if k != "nguong_han"}
    q = tmp / "thieu-nguong.json"
    q.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    try:
        dinh_tuyen.goi_y_mac_dinh(bang_khai.doc_model(q), "chung-cat", VIET)
        kiem(False, "bảng THIẾU `nguong_han` ⇒ ĐỎ, không rơi về hằng ngầm")
    except Exception as e:
        kiem(True, "bảng THIẾU `nguong_han` ⇒ ĐỎ, không rơi về hằng ngầm",
             f"ném {type(e).__name__}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ══ Luật 2 · KHÔNG trường nào cho model tự khai ngôn ngữ ══════════════════
# Đo THAM SỐ, không đo `co_varnames`. Bản đầu dùng `co_varnames` và ĐỎ OAN:
# nó gộp biến CỤC BỘ với tham số, mà `ngon_ngu` là biến cục bộ — tức đúng cái
# tính chất ta muốn (máy tự tính bên trong). Cổng đo sai chỗ thì nó phạt đúng
# thứ nó lẽ ra phải thưởng.
import inspect  # noqa: E402

for ham in (dinh_tuyen.goi_y_mac_dinh, dinh_tuyen.quyet_dinh):
    tham = list(inspect.signature(ham).parameters)
    kiem("ngon_ngu" not in tham,
         f"`{ham.__name__}` KHÔNG nhận `ngon_ngu` làm THAM SỐ — máy đếm, không ai khai",
         f"tham số: {tham}")

# Và vế ngược: `ngon_ngu` PHẢI là biến cục bộ được TÍNH trong hàm, không phải
# một hằng. Nếu nó là hằng thì "máy đếm" chỉ là lời khai.
kiem("ti_le_han" in dinh_tuyen.goi_y_mac_dinh.__code__.co_names,
     "`goi_y_mac_dinh` GỌI `ti_le_han` — ngôn ngữ được TÍNH, không được gán cứng",
     f"gọi: {dinh_tuyen.goi_y_mac_dinh.__code__.co_names}")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-4.2 chưa có răng")
print("gợi ý theo TỈ LỆ · ngưỡng ở bảng khai · máy đếm, model không khai")
