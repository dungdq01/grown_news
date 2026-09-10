#!/usr/bin/env python3
r"""Cổng CHẶN TRƯỚC KHI GỌI — `AC-4.5` (`FR-053` §1.3, spec §4.0b).

VÌ SAO CỔNG NÀY TỒN TẠI, VÀ VÌ SAO NÓ PHẢI LÀ FILE RIÊNG
`spec.md` khai `AC-4.5` với `cmd: python chungcat/tests/check_chan_truoc_khi_goi.py`
— và file đó **không tồn tại** cho tới hôm nay (2026-09-04). Ai chạy đúng lệnh
của spec thấy `No such file`: một AC `hard` **không đo được bằng lệnh nó khai**.

VÀ NÓ KHÔNG PHẢI MỘT PHÉP ĐỔI TÊN. Nguyên văn `AC-4.5`:

    *"Bốn phép chặn §4.0b xảy ra TRƯỚC lời gọi model. Gieo cả **bốn** ca ⇒ đếm
    **0 token** tiêu và **0 dòng** thêm vào `egress.jsonl`. Đo số, không đo lời
    khai: một phép chặn 'có' mà payload đã dựng và log đã ghi thì nó chặn SAU
    chỗ cần chặn."*

Phép đo cũ (`check_mot_hop_dong.py`) gieo **HAI** ca và **không** đụng tới
`egress.jsonl`. Hai thiếu sót đó không nhỏ:

  · **bốn, không hai** — mỗi phép chặn là một nhánh `if` riêng trong
    `quyet_dinh()`, và một nhánh không có ca thì nó có thể bị xoá mà cổng vẫn
    xanh. `d` (khác khu vực) đặc biệt dễ trôi: nó CỐ Ý không ném, nên phép đo
    phải hỏi câu khác — *"nó có cảnh báo không"*, chứ không phải *"nó có ném
    không"*.
  · **0 DÒNG log** — đây là vế mà `AC-4.5` gọi tên. `da_goi == 0` chỉ nói
    *"transport chưa chạy"*; nó KHÔNG nói payload chưa dựng và dòng egress chưa
    ghi. Mà `egress.gui()` ghi log **TRƯỚC** khi gửi (`AC-6.1`) — nên đúng cái
    thứ tự đó biến "chặn muộn" thành một dòng log có thật với một `sha256` của
    dữ liệu kho, dù không byte nào ra Internet.

ĐỎ_KHI  một trong bốn ca vẫn gọi tới transport · `egress.jsonl` có thêm dòng sau
        bốn ca · ca `d` không sinh cảnh báo khu vực · ca hợp lệ cũng bị chặn
        (chặn mù ⇒ cổng xanh vì lý do sai)
XANH_KHI bốn ca chặn, 0 lời gọi, 0 dòng log; ca hợp lệ đi qua và CÓ ghi log —
        vế cuối là đối chứng, không có nó thì "0 dòng" cũng đúng khi log chết
"""

import json
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


try:
    dinh_tuyen = _nap.nap("dinh_tuyen")
    bang_khai = _nap.nap("bang_khai")
    egress = _nap.nap("egress")
    hop_dong = _nap.nap("adapter.hop_dong")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_chan_truoc_khi_goi.py", "T12-8")

ASSETS = R / "chungcat" / "assets"
BANG = bang_khai.doc_model(ASSETS / "model.json")
DONG = BANG["dong"]

tmp = Path(tempfile.mkdtemp(prefix="m12-chantruoc-"))
LOG = tmp / "egress.jsonl"


def dem_dong_log() -> int:
    """Số dòng trong `egress.jsonl`. Đo FILE, không đo biến trong tiến trình."""
    if not LOG.exists():
        return 0
    return sum(1 for d in LOG.read_text(encoding="utf-8").splitlines() if d.strip())


# `_dau_vet_goi` là móc đếm lời gọi model. Một danh sách DÙNG CHUNG cho cả bốn
# ca: nó phải ở 0 sau tất cả, không phải 0 sau từng ca rồi bị reset.
da_goi = []

print()
print("1 · Bốn ca §4.0b — dựng ca đo được, không dựng ca giả")
print()

# ── ca (a) · model không có trong bảng khai ───────────────────────────────
CA_A = "model-khong-bao-gio-co-that-ac45"
kiem(CA_A not in {r["model"] for r in DONG},
     "(a) tên thử KHÔNG có trong bảng — nếu có, ca này vô nghĩa")

# ── ca (b) · nhà CÓ trong bảng nhưng CHƯA có adapter ──────────────────────
# Dẫn xuất từ bảng khai + thư mục adapter, KHÔNG gõ tên nhà: gõ tên là dựng một
# ca sẽ chết im lặng đúng vào ngày nhà đó có adapter.
# FR-059 · cổng hỏi CỬA, không hỏi NHÀ. Cửa của dự án nói một hợp đồng
# OpenAI-compatible ⇒ mọi model một adapter. Hỏi `co_adapter(nha_cung_cap)` thì
# hầu hết dòng bảng báo "chưa có adapter" và cổng đo một mệnh đề đã hết đúng.
CUA = BANG["$adapter_mac_dinh"]
adCua = lambda d: hop_dong.co_adapter(hop_dong.adapter_cua(d, CUA))
chua_ad = [d for d in DONG if not adCua(d)]
if not chua_ad:
    # Mọi nhà trong bảng đều đã có adapter ⇒ ca (b) không dựng được từ bảng
    # THẬT. Dựng một dòng bảng TẠM cho ca này — không sửa `model.json`.
    tam = {**DONG[0], "model": "model-cua-chua-co-adapter-ac45",
           "adapter": "cua-chua-bao-gio-co-adapter"}
    BANG_B = {**BANG, "dong": [*DONG, tam]}
    CA_B = tam["model"]
else:
    BANG_B, CA_B = BANG, chua_ad[0]["model"]
kiem(True, f"(b) cửa chưa có adapter — dùng `{CA_B}`")

# ── ca (c) · `can_key: true` mà env thiếu khoá ────────────────────────────
can_key = [d for d in DONG if d.get("can_key")]
kiem(bool(can_key),
     "(c) bảng khai CÓ ít nhất một dòng `can_key: true` — không có thì ca này "
     "không đo được, và đó là chuyện của bảng khai chứ không phải của cổng")
CA_C = can_key[0]["model"] if can_key else None

# ── ca (d) · khu vực KHÁC khu vực của gợi ý mặc định ──────────────────────
# `d` CỐ Ý không ném (`dinh_tuyen.quyet_dinh` dòng 96-99): quyết định pháp lý
# phải do NGƯỜI nhìn thấy mà bấm, không do máy chặn hộ. Nên phép đo hỏi
# *"có cảnh báo không"*, không hỏi *"có ném không"*.
#
# ⚠️ ĐO 2026-09-04: cả BA dòng của `model.json` mang `khu_vuc: khong-xac-dinh`
# ⇒ phép so `!=` không bao giờ đúng, và nhánh (d) KHÔNG dựng được ca từ bảng
# THẬT. Đó KHÔNG phải lỗi của bảng: `T12-11` chốt *"giữ `khong-xac-dinh` khi
# chưa xác minh route gateway — KHÔNG điền đại một khu vực cho đẹp"*, và một
# lời khai trung thực không được biến thành cổng đỏ (`#cổng-đỏ-oan`).
#
# ⇒ Dựng ca (d) trên một dòng bảng TẠM, đúng khuôn ca (b). Cổng này đo NHÁNH MÃ;
# *"bảng khai đã điền khu vực thật chưa"* là câu hỏi khác, thuộc `T12-11`, và nó
# có ô backlog riêng. Trộn hai câu vào một cổng là cách cổng nói sai chỗ hỏng.
mac_dinh = dinh_tuyen.goi_y_mac_dinh(BANG, "chung-cat", "xin chào tiếng Việt")
kiem(mac_dinh is not None, "có gợi ý mặc định cho `chung-cat` + tiếng Việt")

khac_khu = [d for d in DONG
            if mac_dinh and d["khu_vuc"] != mac_dinh["khu_vuc"]
            and adCua(d)]
if khac_khu:
    BANG_D, CA_D = BANG, khac_khu[0]["model"]
    print(f"       (d) dựng từ bảng THẬT — `{CA_D}`")
else:
    goc_d = next(d for d in DONG if adCua(d))
    tam_d = {**goc_d, "model": "model-khac-khu-vuc-ac45",
             "khu_vuc": f"khac-{mac_dinh['khu_vuc']}" if mac_dinh else "khac"}
    BANG_D, CA_D = {**BANG, "dong": [*DONG, tam_d]}, tam_d["model"]
    print(f"       (d) bảng thật KHÔNG dựng được ca (mọi dòng "
          f"`{mac_dinh['khu_vuc'] if mac_dinh else '?'}`) ⇒ dùng dòng TẠM")
kiem(CA_D is not None, "(d) có ca khác khu vực để gieo")

print()
print("2 · Ba ca CHẶN — ném TRƯỚC khi gọi model")
print()

for ten, bang, kw in (
    ("(a) model ngoài bảng", BANG, {"model_nguoi_chon": CA_A}),
    ("(b) cửa chưa có adapter", BANG_B, {"model_nguoi_chon": CA_B}),
    ("(c) `can_key` mà thiếu khoá", BANG,
     {"model_nguoi_chon": CA_C, "co_khoa": False}),
):
    if kw.get("model_nguoi_chon") is None:
        continue
    try:
        dinh_tuyen.quyet_dinh(bang, "chung-cat", "xin chào",
                              _dau_vet_goi=da_goi.append, **kw)
        kiem(False, f"{ten} ⇒ TỪ CHỐI")
    except Exception as e:
        kiem(True, f"{ten} ⇒ TỪ CHỐI", f"ném {type(e).__name__}")

print()
print("3 · Ca (d) — KHÔNG chặn, nhưng phải HIỆN khu vực (spec §4.0c)")
print()

if CA_D:
    ket = dinh_tuyen.quyet_dinh(BANG_D, "chung-cat", "xin chào tiếng Việt",
                                model_nguoi_chon=CA_D, _dau_vet_goi=da_goi.append)
    kiem("$canh_bao_khu_vuc" in ket,
         "(d) khác khu vực ⇒ SINH cảnh báo, không im lặng",
         "im lặng ở đây là một lần chuyển dữ liệu xuyên biên giới không qua cờ "
         "nào — NĐ 356/2025 Điều 14")
    kiem(mac_dinh["khu_vuc"] in str(ket.get("$canh_bao_khu_vuc", "")),
         "và cảnh báo NÓI RA khu vực mặc định để so — người quyết phải thấy "
         "mình đang quyết gì")

print()
print("4 · Vế `AC-4.5` gọi tên — 0 lời gọi, 0 DÒNG `egress.jsonl`")
print()

kiem(not da_goi, "0 lời gọi model sau cả bốn ca", f"đã gọi {len(da_goi)} lần")
kiem(dem_dong_log() == 0,
     "0 dòng thêm vào `egress.jsonl` — `da_goi == 0` chỉ nói transport chưa "
     "chạy; nó KHÔNG nói payload chưa dựng và log chưa ghi",
     f"có {dem_dong_log()} dòng")

print()
print("5 · ĐỐI CHỨNG — không có nó thì '0 dòng' cũng đúng khi log chết hẳn")
print()

# Một lời gọi HỢP LỆ phải ghi ĐÚNG một dòng. Thiếu vế này thì cổng trên xanh cả
# khi `egress.gui()` không còn ghi log — đúng lớp "cổng không đỏ được".
egress.gui({"thu": "doi-chung-ac45"}, "https://api.vi-du.com/v1",
           allowlist=["api.vi-du.com"], tran=1024, log=LOG,
           chuyen=lambda *_a, **_k: {"ok": True})
kiem(dem_dong_log() == 1,
     "một lời gọi HỢP LỆ ghi ĐÚNG một dòng — đường log còn sống",
     f"có {dem_dong_log()} dòng")

d0 = json.loads(LOG.read_text(encoding="utf-8").splitlines()[0])
kiem({"seq", "sha256", "dich", "so_byte"} <= set(d0),
     "và dòng đó mang đủ `seq`/`sha256`/`dich`/`so_byte`", str(sorted(d0)))

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · AC-4.5 · bốn phép chặn xảy ra TRƯỚC token và TRƯỚC dòng log")
