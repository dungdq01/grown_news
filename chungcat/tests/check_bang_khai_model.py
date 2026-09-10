#!/usr/bin/env python3
r"""Cổng BẢNG KHAI MODEL — `M12-R4` · `M12-R5` · `AC-4.1` · `AC-4.3` · `AC-7.1`.

VÌ SAO CỔNG NÀY TỒN TẠI
Chỉ đạo: gọi được model của mọi nhà, tuỳ tác vụ và tuỳ ngôn ngữ. Gõ tên trong
mã thì mỗi lần đổi nhà phải sửa N chỗ, và chỗ thứ N+1 sẽ lệch — cùng lớp lỗi đã
trúng ở `LOAI` gõ tay bốn nơi (`FR-038/C1`) và ở hai bản schema đang làm
`check_danh_muc` đỏ. Bảng khai còn cho một thứ mã không cho: **ĐẾM ĐƯỢC hôm nay
gửi tới đâu**.

`M12-R5` (dự phòng cùng `khu_vuc`) có một chỗ MẤT RĂNG phải khai: khi mọi model
đi qua **cùng một gateway**, mọi `khu_vuc` bằng nhau ⇒ cổng luôn xanh mà không
kiểm gì. Cổng này bắt điều đó và nói ra, thay vì xanh giả.

ĐỎ_KHI  thiếu cột · `du_phong` trỏ dòng khác `khu_vuc` mà không có cờ tường
        minh · tên model/nhà gõ trong mã · thư viện PDF thiếu `giay_phep` ·
        `PyMuPDF` xuất hiện ở bất kỳ đâu (AGPL)
XANH_KHI bảng đủ cột, đổi một dòng là đổi hành vi, và 0 tên model trong mã
"""

import ast
import json
import re
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

COT_BAT_BUOC = {
    "tac_vu", "ngon_ngu", "nha_cung_cap", "model", "dich", "khu_vuc",
    "du_phong", "can_key", "kieu_structured", "nguong_lech_schema", "che_do",
}


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


tmp = Path(tempfile.mkdtemp(prefix="m12-bangkhai-"))
try:
    try:
        bang_khai = _nap.nap("bang_khai")
    except (_nap.ThieuMa, _nap.ThieuGoi) as e:
        _nap.bao_do_va_thoat(e, "check_bang_khai_model.py", "T12-1")


    # ══ AC-4.1 · bảng thật đủ cột ═════════════════════════════════════════
    b = bang_khai.doc_model(ASSETS / "model.json")
    kiem(len(b["dong"]) >= 1, "bảng khai có ít nhất một dòng")
    thieu_cot = {c for d in b["dong"] for c in COT_BAT_BUOC if c not in d}
    kiem(not thieu_cot, "mọi dòng đủ cột bắt buộc", f"thiếu: {sorted(thieu_cot)}")
    kiem("thu_vien_pdf" in b and "giay_phep" in b["thu_vien_pdf"],
         "khai `thu_vien_pdf` kèm `giay_phep` — giấy phép là thứ KHÔNG cổng nào bắt được")

    # ══ Thiếu cột ⇒ ĐỎ LÚC KHỞI ĐỘNG (fixture, không đụng file thật) ══════
    xau = tmp / "thieu-cot.json"
    d0 = dict(b["dong"][0]); d0.pop("khu_vuc", None)
    xau.write_text(json.dumps({**b, "dong": [d0]}, ensure_ascii=False), encoding="utf-8")
    try:
        bang_khai.doc_model(xau)
        kiem(False, "bảng thiếu cột ⇒ ĐỎ ngay lúc đọc, không đợi lúc chạy")
    except Exception as e:
        kiem(True, "bảng thiếu cột ⇒ ĐỎ ngay lúc đọc", f"ném {type(e).__name__}")

    # ══ M12-R5 · du_phong phải CÙNG khu_vuc, hoặc có cờ tường minh ════════
    theo_ten = {d["model"]: d for d in b["dong"]}
    for d in b["dong"]:
        dp = d.get("du_phong")
        if not dp:
            continue
        kiem(dp in theo_ten, f"`du_phong` của `{d['model']}` trỏ một dòng CÓ THẬT", f"trỏ `{dp}`")
        if dp in theo_ten:
            cung = theo_ten[dp]["khu_vuc"] == d["khu_vuc"]
            kiem(cung or d.get("cho_phep_cheo_khu_vuc") is True,
                 f"`{d['model']}` → `{dp}`: cùng khu_vuc, hoặc có cờ tường minh")

    # ══ M12-R5 MẤT RĂNG khi một gateway — cổng phải NÓI RA, không xanh giả ═
    khu = {d["khu_vuc"] for d in b["dong"]}
    dich = {d["dich"] for d in b["dong"]}
    if len(dich) == 1 and len(khu) == 1:
        kiem(b.get("$canh_bao_mot_gateway") is not None,
             "một gateway ⇒ M12-R5 mất răng, và bảng khai PHẢI nói ra điều đó",
             "thiếu khoá `$canh_bao_mot_gateway`")

    # ══ AC-4.1 · 0 tên model/nhà trong MÃ (AST, chú thích không tính) ══════
    ten = {t.lower() for d in b["dong"] for t in (d["model"], d["nha_cung_cap"])}
    dinh = []
    for f in SRC.rglob("*.py"):
        cay = ast.parse(f.read_text(encoding="utf-8"))
        for n in ast.walk(cay):
            if isinstance(n, ast.Constant) and isinstance(n.value, str):
                if n.value.lower() in ten:
                    dinh.append(f"{f.relative_to(R)}:{n.lineno} → {n.value}")
    kiem(not dinh, "0 tên model/nhà cung cấp gõ trong MÃ", f"thấy: {dinh}")

    # ══ Giấy phép · PyMuPDF là bẫy AGPL, cấm ở mọi nơi ════════════════════
    agpl = [str(f.relative_to(R)) for f in SRC.rglob("*.py")
            if "pymupdf" in f.read_text(encoding="utf-8").lower()
            or "import fitz" in f.read_text(encoding="utf-8")]
    kiem(not agpl, "KHÔNG `PyMuPDF`/`fitz` ở bất kỳ đâu (AGPL — xem nghiên cứu §1)", f"{agpl}")

    # ══ AC-7.1 · đổi MỘT dòng bảng ⇒ đổi hành vi, 0 dòng mã ═══════════════
    # Ca AC-7.1 CHUẨN của dự án: bật `batch` là đổi MỘT dòng.
    # Bản đầu của cổng đổi `model` — và bảng ĐỎ ĐÚNG, vì `du_phong` của dòng
    # khác trỏ tên cũ. Fixture sai, không phải mã sai: một bảng khai có tham
    # chiếu chéo thì "đổi một dòng" phải chọn ô KHÔNG ai trỏ tới.
    khac = tmp / "doi-mot-dong.json"
    d1 = [dict(x) for x in b["dong"]]
    d1[0]["che_do"] = "batch" if d1[0]["che_do"] != "batch" else "sync"
    khac.write_text(json.dumps({**b, "dong": d1}, ensure_ascii=False), encoding="utf-8")
    b2 = bang_khai.doc_model(khac)
    kiem(b2["dong"][0]["che_do"] != b["dong"][0]["che_do"],
         "đổi MỘT dòng bảng ⇒ phép đọc trả giá trị mới, 0 dòng mã phải sửa (AC-7.1)")

    # Và ca ngược: đổi `model` mà quên `du_phong` trỏ nó ⇒ PHẢI đỏ. Không có vế
    # này thì "bảng khai đọc được" không phân biệt được với "bảng khai đúng".
    hong = tmp / "du-phong-tro-hut.json"
    d2 = [dict(x) for x in b["dong"]]
    # Dựng cặp trỏ TƯỜNG MINH trước khi đổi tên. Bản đầu chỉ đổi `model` của
    # d[0] và tin rằng có ai đó đang trỏ tới nó — đúng với bảng chỗ-giữ cũ, sai
    # khi bảng đổi. Không có dòng này thì phép thử "trỏ hụt" nghiệm đúng bằng
    # cách KHÔNG CÓ AI TRỎ — cổng xanh rỗng.
    d2[1]["du_phong"] = d2[0]["model"]
    d2[1].pop("cho_phep_cheo_khu_vuc", None)
    d2[1]["khu_vuc"] = d2[0]["khu_vuc"]        # cùng khu vực ⇒ chỉ còn lỗi TRỎ HỤT
    d2[0]["model"] = "ten-moi-khong-ai-tro-toi"
    hong.write_text(json.dumps({**b, "dong": d2}, ensure_ascii=False), encoding="utf-8")
    try:
        bang_khai.doc_model(hong)
        kiem(False, "đổi tên model mà `du_phong` trỏ hụt ⇒ ĐỎ")
    except Exception as e:
        kiem(True, "đổi tên model mà `du_phong` trỏ hụt ⇒ ĐỎ", f"ném {type(e).__name__}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — M12-R4/R5 chưa có răng")
print("bảng đủ cột · du_phong cùng khu_vuc · 0 tên model trong mã — M12-R4/R5 có răng")

# ══ T12-19 · MODEL BÀY CHO CHƯNG CẤT PHẢI LÀ MODEL VĂN BẢN ════════════════
#
# PM đo 2026-09-04: bảng nhập nguyên catalog gateway (112 dòng), lẫn `dall-e-3`
# · `sora-2` · `whisper-1` · `web-search`. Cổng này VẪN XANH lúc đó vì nó không
# đo `tac_vu` — một cổng xanh trong khi bộ chọn bày 12 lựa chọn bấm vào sẽ chết.
print()
print("T12-19 · tác vụ của model — bày cho chưng cất chỉ được là văn bản")
print()
b2 = bang_khai.doc_model(ASSETS / "model.json")
kiem("$tac_vu_theo_mau" in b2, "bảng khai có `$tac_vu_theo_mau` (phép phân loại)")
kiem("$tac_vu_cho_chung_cat" in b2, "bảng khai có `$tac_vu_cho_chung_cat`")
thieu_tv = [r["model"] for r in b2["dong"] if "tac_vu_model" not in r]
kiem(not thieu_tv, "mọi dòng có `tac_vu_model`", str(thieu_tv[:5]))

# KHÔNG xoá dòng phi-văn-bản: catalog đầy đủ có ích cho `sinh-transcript`
# (`whisper-*` là ứng viên lối `dich_vu`). Nên vế đo là "CÓ phân loại", không
# phải "không có dòng nào khác".
phi = [r["model"] for r in b2["dong"] if r.get("tac_vu_model") != "van-ban"]
kiem(bool(phi),
     f"catalog GIỮ {len(phi)} dòng phi-văn-bản (whisper/dall-e/sora/web-search)",
     "xoá chúng là mất ứng viên cho `sinh-transcript` lối `dich_vu`")

# Cửa `/model` phải LỌC. Đo trên mã cửa, không trên bảng: bảng giữ đủ, cửa lọc.
ma_api = (SRC / "api.py").read_text(encoding="utf-8")
kiem("$tac_vu_cho_chung_cat" in ma_api,
     "`GET /model` đọc `$tac_vu_cho_chung_cat` từ bảng khai",
     "lọc bằng một danh sách gõ trong mã là chỗ nó lạc hậu im lặng")

# ══ T12-19 · TÊN BIẾN KHOÁ ở MỘT chỗ khai ═════════════════════════════════
#
# PM quy chủ 2026-09-04 từ báo lỗi thật: `.env` CÓ `BEEKNOEE_API_KEY`, nhưng
# `api.py` kiểm `CHUNGCAT_KHOA_MODEL` (biến KHÔNG TỒN TẠI) trong khi `worker.py`
# kiểm `BEEKNOEE_API_KEY` ⇒ người dùng đã làm đúng vẫn bị chặn.
print()
print("T12-19 · tên biến khoá — MỘT chỗ khai, hai người đọc")
print()
ma_wk = (SRC / "worker.py").read_text(encoding="utf-8")

# Đo MÃ, không đo CHÚ THÍCH. `api.py` giải thích ngay tại chỗ vì sao tên cũ sai
# — và một cổng đọc chính câu giải thích rồi tố nó là cổng dạy người ta đừng
# viết lý do. Cùng bài học `nap-video.test.js` và `check_mot_hop_dong`.
def chi_ma(x):
    x = re.sub(r'"""[\s\S]*?"""', "", x)
    return chr(10).join(d.split("#")[0] for d in x.splitlines())

kiem("CHUNGCAT_KHOA_MODEL" not in chi_ma(ma_api),
     "`api.py` KHÔNG còn GÕ `CHUNGCAT_KHOA_MODEL` (biến không tồn tại)")
for ten, ma in (("api.py", ma_api), ("worker.py", ma_wk)):
    kiem("bien_khoa" in ma,
         f"`{ten}` đọc tên biến từ `cua.json.bien_khoa`",
         "gõ tên biến ở hai chỗ là cách hai chỗ trôi khỏi nhau")
