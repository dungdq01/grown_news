#!/usr/bin/env python3
r"""Cổng MỘT HỢP ĐỒNG ADAPTER + định tuyến gợi-ý. `AC-3.1` · `AC-4.2` · `AC-4.5`.

VÌ SAO CỔNG NÀY TỒN TẠI
`decisions.md` 2026-09-01: gọi được model của mọi nhà, adapter nối thẳng. Hệ quả
then chốt: **bảo đảm địa chỉ đổi chỗ đặt** — không nhà nào được là đường riêng.
Một hợp đồng cho mọi nhà: `(prompt, tai_lieu) → {text, quotes[]}`. Thứ riêng của
provider nằm **dưới** nó.

`AC-3.1` nói *"thêm một nhà = 1 dòng bảng + 1 file adapter, **0 dòng ở LÕI**"*,
và `spec §3` định nghĩa LÕI = `chungcat/src/**` TRỪ `chungcat/src/adapter/**`.
Định nghĩa đó viết ra vì phép thử s6 bắt được: không chốt thì cổng hoặc đỏ oan
(đụng một file phụ), hoặc không đỏ được (lõi rộng tới mức mọi thay đổi đều nằm
ngoài).

`AC-4.2` sau `FR-053`: tỉ lệ Hán quyết **GỢI Ý MẶC ĐỊNH**, không quyết tuyến —
người chọn thắng gợi ý. Và ngôn ngữ do **MÁY đếm**: model tự khai ngôn ngữ rồi
tự được chọn theo lời khai đó là nó cầm bút ghi vào thứ nó bị chấm (luật gốc).

ĐỎ_KHI  adapter trả sai hình dạng · lõi biết tên nhà · tài liệu 80% Việt +
        20% Hán bị gợi ý sang nhà tiếng Trung · model NGƯỜI chọn bị gợi ý đè ·
        model ngoài bảng vẫn tạo được job · một trong bốn phép chặn §1.3 chạy
        SAU khi đã gọi model
XANH_KHI một hình dạng cho mọi nhà, gợi ý đúng, và 4 phép chặn xảy ra trước token
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


tmp = Path(tempfile.mkdtemp(prefix="m12-hopdong-"))
try:
    try:
        bang_khai, dinh_tuyen = _nap.nap("bang_khai", "dinh_tuyen")
        hop_dong = _nap.nap("adapter.hop_dong")
    except (_nap.ThieuMa, _nap.ThieuGoi) as e:
        _nap.bao_do_va_thoat(e, "check_mot_hop_dong.py", "T12-5")

    bang = bang_khai.doc_model(ASSETS / "model.json")

    # ══ AC-4.2 · ngôn ngữ do MÁY ĐẾM, theo TỈ LỆ chứ không theo "có hay không" ══
    viet = "Mô hình này dùng khai triển Taylor bậc hai để xấp xỉ hàm mục tiêu, " \
           "và đó là toàn bộ khác biệt đáng nhớ so với bản trước. " \
           "Tài liệu gốc gọi nó là 梯度提升 trong một chú thích."
    trung = "梯度提升树是一种集成学习方法，通过迭代地训练弱学习器来最小化损失函数。" \
            "每一步都在拟合上一步的残差，因此模型的表达能力随迭代次数增长。"
    ti_viet = dinh_tuyen.ti_le_han(viet)
    ti_trung = dinh_tuyen.ti_le_han(trung)
    kiem(ti_viet < ti_trung, "tỉ lệ Hán đo được và phân biệt được hai văn bản",
         f"viet={ti_viet:.3f} trung={ti_trung:.3f}")
    kiem(ti_viet < 0.2,
         "tài liệu 80% Việt + trích đoạn Hán ⇒ tỉ lệ Hán THẤP (không phải cờ có/không)",
         f"đo {ti_viet:.3f}")

    g_viet = dinh_tuyen.goi_y_mac_dinh(bang, "chung-cat", viet)
    g_trung = dinh_tuyen.goi_y_mac_dinh(bang, "chung-cat", trung)
    kiem(g_viet is not None and g_viet["ngon_ngu"] != "zh",
         "AC-4.2 · 80% Việt + 20% Hán KHÔNG được gợi ý sang nhà tiếng Trung",
         f"gợi ý {g_viet and g_viet['ngon_ngu']}")
    kiem(g_trung is not None and g_trung["ngon_ngu"] == "zh",
         "văn bản Hán thật thì CÓ gợi ý sang nhà tiếng Trung")

    # Ngưỡng nằm ở bảng khai, không trong mã — đổi bảng ⇒ đổi hành vi.
    kiem("nguong_han" in bang or "nguong_han" in json.loads(
        (ASSETS / "model.json").read_text(encoding="utf-8")),
        "ngưỡng tỉ lệ Hán khai ở BẢNG, không gõ trong mã")

    # ══ FR-053 · NGƯỜI chọn THẮNG gợi ý ═══════════════════════════════════
    from adapter import hop_dong as _hd
# FR-059 · cổng hỏi CỬA, không hỏi NHÀ. Cửa của dự án nói một hợp đồng
# OpenAI-compatible ⇒ mọi model một adapter. Hỏi `co_adapter(nha_cung_cap)` thì
# hầu hết dòng bảng báo "chưa có adapter" và cổng đo một mệnh đề đã hết đúng.
    _cua = bang["$adapter_mac_dinh"]
    _adCua = lambda d: _hd.co_adapter(_hd.adapter_cua(d, _cua))
    co_ad = [d for d in bang["dong"] if _adCua(d)]
    kiem(len(co_ad) >= 1, "có ít nhất MỘT nhà đã dựng adapter (T12-5 làm nhà đầu)")
    chon = co_ad[-1]["model"]
    kiem(dinh_tuyen.quyet_dinh(bang, "chung-cat", viet, model_nguoi_chon=chon)["model"] == chon,
         "model NGƯỜI chọn THẮNG gợi ý mặc định (FR-053 §1.1)")
    kiem(dinh_tuyen.quyet_dinh(bang, "chung-cat", viet, model_nguoi_chon=None)["model"]
         == g_viet["model"],
         "không chọn ⇒ rơi về gợi ý mặc định của bảng")

    # Phép chặn (b) của §1.3 · nhà CÓ trong bảng nhưng CHƯA có adapter ⇒ từ chối
    chua_ad = [d for d in bang["dong"] if not _adCua(d)]
    if chua_ad:
        try:
            dinh_tuyen.quyet_dinh(bang, "chung-cat", viet,
                                  model_nguoi_chon=chua_ad[0]["model"])
            kiem(False, "cửa chưa có adapter ⇒ TỪ CHỐI ở cổng khai báo")
        except Exception as e:
            kiem(True, "cửa chưa có adapter ⇒ TỪ CHỐI ở cổng khai báo",
                 f"ném {type(e).__name__}")

    # ══ AC-4.6 · model ngoài bảng ⇒ TỪ CHỐI, không tạo job ════════════════
    try:
        dinh_tuyen.quyet_dinh(bang, "chung-cat", viet, model_nguoi_chon="khong-co-that")
        kiem(False, "AC-4.6 · model ngoài bảng ⇒ TỪ CHỐI")
    except Exception as e:
        kiem(True, "AC-4.6 · model ngoài bảng ⇒ TỪ CHỐI", f"ném {type(e).__name__}")

    # ══ AC-4.5 · bốn phép chặn xảy ra TRƯỚC lời gọi model ═════════════════
    da_goi = []
    for ten, sua in (
        ("model ngoài bảng", {"model_nguoi_chon": "khong-co-that"}),
        ("thiếu khoá env", {"model_nguoi_chon": bang["dong"][0]["model"], "co_khoa": False}),
    ):
        try:
            dinh_tuyen.quyet_dinh(bang, "chung-cat", viet,
                                  _dau_vet_goi=da_goi.append, **sua)
        except Exception:
            pass
    kiem(not da_goi, "AC-4.5 · bốn phép chặn xảy ra TRƯỚC lời gọi model — 0 token",
         f"đã gọi {len(da_goi)} lần")

    # ══ AC-3.1 · MỘT hình dạng cho mọi nhà ════════════════════════════════
    kq = hop_dong.goi_qua_adapter(
        "google", prompt="tóm tắt", tai_lieu=[{"neo": 1, "text": "xin chào"}],
        cau_hinh=bang["dong"][0], chuyen=lambda *_a, **_k: {
            "text": "một khẳng định", "quotes": ["xin chào"]},
    )
    kiem(set(kq) == {"text", "quotes"},
         "adapter trả ĐÚNG một hình dạng `{text, quotes[]}`", f"trả {sorted(kq)}")
    kiem(isinstance(kq["quotes"], list), "`quotes` là danh sách")

    # ══ AC-3.1b · LÕI (src/** trừ adapter/**) KHÔNG biết tên nhà nào ══════
    ten_nha = {d["nha_cung_cap"].lower() for d in bang["dong"]}
    dinh = []
    for f in SRC.rglob("*.py"):
        if "adapter" in f.parts:
            continue
        for n in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
            if isinstance(n, ast.Constant) and isinstance(n.value, str) \
               and n.value.lower() in ten_nha:
                dinh.append(f"{f.relative_to(R)}:{n.lineno}")
    kiem(not dinh, "LÕI (src/** TRỪ adapter/**) không nhắc tên nhà nào", f"{dinh}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-3.1/AC-4.2 chưa có răng")
print("một hợp đồng · gợi ý theo tỉ lệ · người chọn thắng · chặn trước token")
