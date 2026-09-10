#!/usr/bin/env python3
r"""Cổng DỰ PHÒNG CÙNG KHU VỰC — `AC-4.3` · `AC-4.4` · `M12-R5`.

VÌ SAO CỔNG NÀY TỒN TẠI
Chủ dự án chọn rơi tự động, và chỗ nó chỏi đã được nói ra: **đích gửi RA đổi khu
vực pháp lý mà không ai duyệt**. `NĐ 356/2025` Điều 14 đòi hồ sơ chuyển dữ liệu
xuyên biên giới, và nó **đã kích hoạt** từ khi `FR-045` thêm 5 tài khoản đồng
nghiệp. Luật này không cản việc dùng — nó buộc việc đổi khu vực phải là **một
dòng khai đọc được**, không phải một nhánh fallback trong đầu người viết mã.

`FR-053 §1.5` thêm một vế **ngược chiều**: khi NGƯỜI chọn model tường minh,
`du_phong` **KHÔNG được rơi**. Rơi tự động là âm thầm đảo quyết định của người,
và nếu khác `khu_vuc` thì đảo luôn quyết định pháp lý.

⚠️ Và cổng này phải khai chỗ nó **MẤT RĂNG**: khi mọi model đi qua **cùng một
gateway**, mọi `khu_vuc` bằng nhau ⇒ phép so *"cùng khu vực"* luôn đúng mà không
kiểm gì. Một cổng xanh vì không có gì để so là một cổng xanh **rỗng**.

ĐỎ_KHI  `du_phong` khác `khu_vuc` mà thiếu cờ tường minh · `du_phong` trỏ hư
        không · người chọn tường minh mà vẫn rơi · một gateway mà bảng khai
        KHÔNG nói ra chuyện mất răng
XANH_KHI mọi cặp (model, du_phong) hợp lệ, và giới hạn của cổng được khai
"""

import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
ASSETS = R / "chungcat" / "assets"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(R / "chungcat" / "src"))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


try:
    bang_khai, dinh_tuyen = _nap.nap("bang_khai", "dinh_tuyen")
    hop_dong = _nap.nap("adapter.hop_dong")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_du_phong_cung_khu_vuc.py", "T12-1")

bang = bang_khai.doc_model(ASSETS / "model.json")
theo = {d["model"]: d for d in bang["dong"]}

# ══ M12-R5 · mọi cặp hợp lệ trên bảng THẬT ════════════════════════════════
for d in bang["dong"]:
    dp = d.get("du_phong")
    if dp is None:
        kiem(True, f"`{d['model']}` không khai `du_phong` — hợp lệ, không rơi")
        continue
    kiem(dp in theo, f"`du_phong` của `{d['model']}` trỏ dòng CÓ THẬT")
    if dp in theo:
        kiem(theo[dp]["khu_vuc"] == d["khu_vuc"] or d.get("cho_phep_cheo_khu_vuc") is True,
             f"`{d['model']}` → `{dp}`: cùng `khu_vuc` hoặc có cờ tường minh")

# ══ Cổng CÓ ĐỎ ĐƯỢC — gieo hai ca xấu ở thư mục tạm ═══════════════════════
tmp = Path(tempfile.mkdtemp(prefix="m12-duphong-"))
try:
    def thu(sua, ten):
        d = [dict(x) for x in bang["dong"]]
        sua(d)
        p = tmp / f"{ten}.json"
        p.write_text(json.dumps({**bang, "dong": d}, ensure_ascii=False), encoding="utf-8")
        try:
            bang_khai.doc_model(p)
            return None
        except Exception as e:
            return e

    def cheo(d):
        d[0]["khu_vuc"] = "vn"
        d[0]["du_phong"] = d[1]["model"]        # dòng 1 vẫn khu_vuc cũ ⇒ chéo
        d[0].pop("cho_phep_cheo_khu_vuc", None)
    kiem(thu(cheo, "cheo") is not None,
         "`du_phong` CHÉO khu vực mà thiếu cờ ⇒ ĐỎ ngay lúc đọc bảng")

    def cheo_co_co(d):
        # Bảng khai có tham chiếu CHÉO NHAU (0→1 và 1→0). Đổi `khu_vuc` của một
        # dòng làm CẢ HAI cặp thành chéo, nên đặt cờ cho một chiều là không đủ —
        # chiều còn lại vẫn thiếu cờ và bảng ĐỎ ĐÚNG. Bản đầu của fixture này
        # quên điều đó và tôi đọc nó như một lỗi của mã.
        # ⇒ Cắt chiều ngược để phép thử chỉ đo MỘT điều: cờ có tác dụng không.
        d[0]["khu_vuc"] = "vn"
        d[0]["du_phong"] = d[1]["model"]
        d[0]["cho_phep_cheo_khu_vuc"] = True
        d[1]["du_phong"] = None
    kiem(thu(cheo_co_co, "cheo-co-co") is None,
         "chéo khu vực CÓ cờ tường minh ⇒ qua — luật buộc KHAI, không buộc cấm")

    def cheo_co_co_mot_chieu(d):
        # Và vế ngược của chính nó: cờ chỉ cứu ĐÚNG dòng nó nằm trên. Không có
        # phép thử này thì `cho_phep_cheo_khu_vuc` có thể là một cờ toàn cục ngầm.
        d[0]["khu_vuc"] = "vn"
        d[0]["du_phong"] = d[1]["model"]
        d[0]["cho_phep_cheo_khu_vuc"] = True
        # d[1] trỏ NGƯỢC về d[0] và KHÔNG có cờ ⇒ phải ĐỎ.
        #
        # Đặt TƯỜNG MINH, không dựa vào hình dạng bảng đang ship. Bản đầu chỉ
        # sửa d[0] và tin rằng d[1] đã trỏ về d[0] — đúng với bảng chỗ-giữ cũ,
        # SAI ngay khi bảng đổi (`du_phong` của d[1] thành `None`), và lúc đó
        # cổng XANH mà không kiểm gì: nó nghiệm đúng vì không có cặp nào để so.
        d[1]["du_phong"] = d[0]["model"]
        d[1].pop("cho_phep_cheo_khu_vuc", None)
    kiem(thu(cheo_co_co_mot_chieu, "cheo-mot-chieu") is not None,
         "cờ chỉ cứu ĐÚNG dòng nó nằm trên — chiều ngược thiếu cờ vẫn ĐỎ")

    def hu_khong(d):
        d[0]["du_phong"] = "khong-ton-tai-bao-gio"
    kiem(thu(hu_khong, "hu-khong") is not None,
         "`du_phong` trỏ hư không ⇒ ĐỎ")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ══ FR-053 §1.5 · người chọn tường minh ⇒ KHÔNG rơi ═══════════════════════
co_ad = [d for d in bang["dong"]
         if hop_dong.co_adapter(
             hop_dong.adapter_cua(d, bang["$adapter_mac_dinh"]))]   # FR-059
if co_ad:
    chon = co_ad[0]["model"]
    ra = dinh_tuyen.quyet_dinh(bang, "chung-cat", "một câu tiếng Việt",
                               model_nguoi_chon=chon)
    kiem(ra["model"] == chon,
         "người chọn tường minh ⇒ trả ĐÚNG model đó, không rơi sang `du_phong`",
         f"trả {ra['model']}")

# ══ Cổng khai GIỚI HẠN của chính nó ═══════════════════════════════════════
khu = {d["khu_vuc"] for d in bang["dong"]}
dich = {d["dich"] for d in bang["dong"]}
if len(dich) == 1 and len(khu) == 1:
    kiem(bang.get("$canh_bao_mot_gateway") is not None,
         "một gateway ⇒ phép so `khu_vuc` MẤT RĂNG, và bảng khai NÓI RA điều đó "
         "(cổng xanh vì không có gì để so là cổng xanh RỖNG)")
    kiem(khu == {"khong-xac-dinh"},
         "và `khu_vuc` khai `khong-xac-dinh` — sự thật, không phải chỗ trống: "
         "ta KHÔNG biết gateway route đi đâu", f"khai {khu}")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — M12-R5 chưa có răng")
print("du_phong cùng khu vực hoặc có cờ · người chọn không bị rơi · giới hạn được khai")
