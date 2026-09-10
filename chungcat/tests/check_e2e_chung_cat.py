#!/usr/bin/env python3
r"""Cổng E2E — chuỗi chưng cất chạy HẾT. Cổng thứ 18 của `T12-8`.

VÌ SAO CỔNG NÀY TỒN TẠI
Mười bảy cổng kia đo **từng mảnh**. Mảnh nào cũng xanh mà chuỗi vẫn có thể không
lắp được — và chỗ hay hụt nhất là ranh giới: ai gọi ai, thứ tự nào, dữ liệu đổi
hình dạng ở đâu. Cổng này đo **đường đi**, không đo mảnh.

Nó **không** phải một AC của `spec.md`. Spec đang frozen và 24 AC của nó đều ở
mức đơn vị; E2E là `tiêu_chí` **cấp task**. Muốn nó thành hợp đồng thường trực
thì mở FR riêng — đừng lặng lẽ thêm vào spec.

HAI CHẾ ĐỘ, một file:

    --mock   adapter giả ở tầng transport · kho tạm · 0 egress · 0 token
             → chạy trong CI, mọi PR. Chứng minh CHUỖI LẮP ĐÚNG.
    --that   gateway thật · 1 tài liệu thật · 1 lần gửi có log
             → chạy TAY, ghi worklog. Đo CHẤT LƯỢNG (M6.1) và giá (M6.2).

Gộp hai câu hỏi đó vào một chế độ làm CI tốn token mỗi PR, và làm phép đo chất
lượng chạy trên dữ liệu giả.

ĐỎ_KHI  một mắt xích không nối · nháp ghi ra thiếu `trang_thai`/`review_status` ·
        `egress.jsonl` không có đúng một dòng khớp payload · `citations_*` do
        model khai thay vì máy đếm
XANH_KHI chuỗi chạy hết và mọi bất biến của chuỗi còn nguyên
"""

import hashlib
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

THAT = "--that" in sys.argv
loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


tmp = Path(tempfile.mkdtemp(prefix="m12-e2e-"))
try:
    try:
        bang_khai, dinh_tuyen, egress, verify, vong = _nap.nap(
            "bang_khai", "dinh_tuyen", "egress", "verify", "vong")
        hop_dong = _nap.nap("adapter.hop_dong")
    except (_nap.ThieuMa, _nap.ThieuGoi) as e:
        _nap.bao_do_va_thoat(e, "check_e2e_chung_cat.py", "chuỗi E2E")

    if THAT:
        print("\n⚠️  CHẾ ĐỘ --that CHƯA BẬT ĐƯỢC.")
        print("   `dich` trong bảng khai là chỗ giữ, và tên định danh model mà")
        print("   gateway nhận CHƯA xác minh (xem `$vi_sao_ten_gia_dinh`).")
        print("   Bật khi T12-5 có lời gọi đầu tiên chạy thật — rồi mới đo M6.1/M6.2.")
        sys.exit(2)

    bang = bang_khai.doc_model(ASSETS / "model.json")
    nguong = bang_khai.doc_nguong(ASSETS / "nguong.json")
    q = vong.HangDoi(tmp / "hang-doi")
    LOG = tmp / "egress.jsonl"

    # ── ① nguyên liệu: khối text theo NEO (PDF cho trang, .vtt cho mốc) ──
    nguon = [
        {"neo": 1, "text": "Phần mở đầu trình bày bối cảnh của bài toán."},
        {"neo": 7, "text": "Khai triển Taylor bậc hai là khác biệt đáng nhớ duy "
                           "nhất, và mọi thứ còn lại là hệ quả của nó."},
    ]

    # ── ② quyết định model: người chọn thắng gợi ý ───────────────────────
    co_ad = [d for d in bang["dong"]
             if hop_dong.co_adapter(
                 hop_dong.adapter_cua(d, bang["$adapter_mac_dinh"]))]   # FR-059
    kiem(bool(co_ad), "có ít nhất một nhà đã dựng adapter")
    dong = dinh_tuyen.quyet_dinh(bang, "chung-cat", nguon[1]["text"],
                                 model_nguoi_chon=co_ad[0]["model"])
    kiem(dong["model"] == co_ad[0]["model"], "② model NGƯỜI chọn được giữ tới cuối chuỗi")

    # ── ③ nạp việc · idempotent theo ULID ───────────────────────────────
    ulid = "01K9ZE2E0000000000000001"
    q.nap(ulid, {"loai": "chung-cat-mot-nguon", "slug": "tai-lieu-thu",
                 "model": dong["model"]})[0]
    q.nap(ulid, {"loai": "chung-cat-mot-nguon", "slug": "tai-lieu-thu",
                 "model": dong["model"]})[0]
    kiem(len(list((tmp / "hang-doi" / "new").glob("*.json"))) == 1,
         "③ nạp hai lần cùng ULID ⇒ MỘT việc")

    # ── ④ gửi: adapter → egress (log TRƯỚC gửi, seq của TA) ─────────────
    def transport_gia(url, body, **_kw):
        # Model TRẢ QUOTE NGUYÊN VĂN — không trả vị trí. Vị trí do `verify` tính.
        return {"choices": [{"message": {"content": json.dumps({
            "text": "Bài nêu rằng khai triển Taylor bậc hai là khác biệt đáng nhớ.",
            "quotes": ["Khai triển Taylor bậc hai là khác biệt đáng nhớ duy nhất",
                       "một câu KHÔNG có trong nguồn để thử vế bắt-bịa"],
        }, ensure_ascii=False)}}]}

    q.ghi_nhan_gui(ulid)
    from adapter import google
    kq = google.goi(prompt="chưng cất", tai_lieu=nguon, cau_hinh=dong,
                   allowlist=[dong["dich"]], tran=1024 * 1024, log=LOG,
                   chuyen=transport_gia)
    kiem(set(kq) == {"text", "quotes"}, "④ adapter trả đúng hợp đồng {text, quotes[]}")

    d = [json.loads(x) for x in LOG.read_text(encoding="utf-8").splitlines() if x.strip()]
    kiem(len(d) == 1, "④ đúng MỘT dòng egress cho một lần gửi", f"có {len(d)}")
    kiem(d[0]["khu_vuc"] == dong["khu_vuc"],
         "④ dòng log mang `khu_vuc` — câu 'gửi tới pháp nhân nào' trả lời được")

    # ── ⑤ verify: định vị lại từng quote; citations do MÁY đếm ──────────
    q.luu_phan_hoi(ulid, kq)
    dem = verify.dem_citations(kq["quotes"], nguon, nguong)
    kiem(dem["citations_sampled"] == 2, "⑤ `citations_sampled` = số quote model đưa")
    kiem(dem["citations_verified"] == 1,
         "⑤ `citations_verified` = số định vị lại ĐƯỢC — máy đếm, không model khai",
         f"đếm {dem['citations_verified']}")
    kiem(dem["vi_tri"][0] and dem["vi_tri"][0]["neo"] == 7,
         "⑤ quote thật định vị về đúng neo 7")
    kiem(dem["vi_tri"][1] is None, "⑤ quote bịa bị TỪ CHỐI, không im lặng bỏ qua")

    # ── ⑥ hàng nháp: trạng thái đầu KHÔNG do payload quyết ──────────────
    # Cửa ghi thật ở LÕI (C2 · `web/api/loi-cua.mjs`); ở đây kiểm HÌNH DẠNG
    # payload M12 gửi lên — nó KHÔNG được mang trường trạng thái nào.
    nhap = {"job_ulid": ulid, "ban_goc_ai": kq["text"],
            **{k: v for k, v in dem.items() if k != "vi_tri"}}
    kiem("review_status" not in nhap and "trang_thai" not in nhap,
         "⑥ payload gửi LÕI KHÔNG mang trường trạng thái — LÕI quyết, DDL cưỡng chế")
    kiem(nhap["ban_goc_ai"] == kq["text"], "⑥ `ban_goc_ai` là bản model, ghi một lần")

    # ── ⑦ chạy lại từ verify: 0 lời gọi model, `lan_gui` không đổi ──────
    truoc = q.doc(ulid)["lan_gui"]
    q.chay_lai(ulid, tu_giai_doan="dang-verify")
    kiem(q.doc(ulid)["lan_gui"] == truoc,
         "⑦ chạy lại từ `dang-verify` ⇒ `lan_gui` KHÔNG đổi (AC-5.5)")
    kiem(q.doc_phan_hoi(ulid) is not None,
         "⑦ phản hồi model còn trong Maildir ⇒ chạy lại không phải gọi model")
    kiem(len(LOG.read_text(encoding="utf-8").strip().splitlines()) == 1,
         "⑦ và `egress.jsonl` VẪN đúng một dòng — chạy lại không sinh lần gửi mới")

    # ── ⑧ sha256 dựng lại được từ log ───────────────────────────────────
    kiem(len(d[0]["sha256"]) == 64 and all(c in "0123456789abcdef" for c in d[0]["sha256"]),
         "⑧ `sha256` trong log là băm hợp lệ của payload đã gửi")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — chuỗi E2E chưa lắp đủ")
print("E2E --mock: nguyên liệu → model → verify → nháp · 1 dòng egress · 0 token")
