#!/usr/bin/env python
"""WO-093 · T12-40 — Chưng cất xong là vào kho; bản mới thay bản cũ.

Chủ dự án 2026-09-10: *"chưng cất không có nháp gì nữa cả, giống transcript.
model gen kết quả xong là lên thẳng site — ko cần duyệt. Khi có bản mới thì bản
cũ sẽ bị ẩn đi."*

Đường duyệt ĐÃ làm đủ (validate → ghi kho → `donBanCu` đẩy bản cũ vào rác).
Thiếu đúng hai thứ: một chốt `409` chặn lần chạy thứ hai, và không ai bấm nút.

── Vì sao vế 2 là vế NẶNG NHẤT ─────────────────────────────────────────────
Gỡ `409` cho dễ thì một lượt chưng cất TỰ ĐỘNG sẽ ghi đè lên một bản NGƯỜI đã
sửa tay — mất công người, im lặng, và không cổng nào khác canh. Nên phép thay
chỉ được áp khi bản đang nằm đó là `origin: pipeline`.

── Đo bằng NGUỒN, nói rõ giới hạn ──────────────────────────────────────────
Chạy thật `cuaDuyetNhap` đòi dựng cả kho + DB nháp + schema; `check_e2e_chung_cat`
đã làm việc đó ở tầng của nó. Cổng này đo BA mắt xích trên nguồn, và mỗi vế nêu
đúng chuỗi phải có — nói ra giới hạn thay vì để người đọc tưởng nó chạy E2E.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent

loi = 0
NL = chr(10)


def ok(d, chu, them=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {chu}" + ("" if d else f"  <- {them}"))
    if not d:
        loi += 1


NHAP = (R / "web" / "api" / "nhap-cua.mjs").read_text(encoding="utf-8")
WORKER = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")


def than_ham(src, moc, ket=None):
    """Thân từ `moc` tới MỐC KẾT THÚC, không tới một số ký tự đếm sẵn.

    Cửa sổ cố định là chỗ vế đỏ vì có người viết thêm chú thích: đo được ngay
    trong chính WO này — `/duyet` nằm quá 3200 ký tự sau `def` chỉ vì khối giải
    thích ở giữa. Cắt tới `def`/`export` kế tiếp thì phép đo không phụ thuộc độ
    dài văn xuôi.
    """
    i = src.find(moc)
    if i < 0:
        return ""
    j = src.find(ket or (NL + "def "), i + len(moc))
    return src[i:j] if j > i else src[i:]


print("\nWO-093 · chưng cất xong là vào kho, bản mới thay bản cũ\n")

# ── 1 · Chốt 409 nới ĐÚNG cho bản pipeline ───────────────────────────────
print("1 · Chạy lại lần hai KHÔNG bị chặn\n")

duyet = than_ham(NHAP, "export async function cuaDuyetNhap",
                 NL + "export ")
ok(duyet != "", "1-0 · tìm thấy `cuaDuyetNhap`")
# Bỏ chú thích: một câu văn xuôi nhắc `origin` không phải một nhánh mã.
duyetMa = re.sub(r"/\*.*?\*/", "", duyet, flags=re.S)
duyetMa = re.sub(r"^\s*//.*$", "", duyetMa, flags=re.M)

ok("docBai(type, slug)" in duyetMa,
   "1 · vẫn còn phép hỏi *kho đã có bản này chưa*",
   "bỏ hẳn phép hỏi là mất luôn cả vế 409 cho bản `manual`")
# Hai vế của phép rẽ nằm trên HAI dòng (`origin` đọc ra ở dòng trên, phép so
# `!== "pipeline"` ở dòng dưới), nên mẫu phải bắc qua xuống dòng — `[^\n]` là
# chỗ vế này đỏ oan.
ok(re.search(r'origin[\s\S]{0,240}pipeline', duyetMa) is not None,
   "1a · và nó rẽ theo `origin` — `pipeline` thì THAY, không chặn",
   "không rẽ ⇒ lần chạy thứ hai nhận 409, mà 'chạy lại' chính là cách người "
   "dùng nói *tôi không ưng, làm lại*")

# ── 2 · ÂM · bản NGƯỜI viết KHÔNG bị ghi đè ──────────────────────────────
print("\n2 · ÂM · Bản `manual` cùng slug VẪN bị chặn\n")

ok("409" in duyetMa,
   "2 · nhánh 409 CÒN NGUYÊN cho ca không phải pipeline",
   "gỡ trơn `409` thì một lượt chưng cất tự động ghi đè công người viết — im "
   "lặng, và không cổng nào khác canh")

# ── 3 · Worker tự bấm duyệt ──────────────────────────────────────────────
print("\n3 · Worker tự gọi `/duyet`, và trượt thì việc HỎNG\n")

cc = than_ham(WORKER, "def chay_chung_cat")
ok(cc != "", "3-0 · tìm thấy `chay_chung_cat`")
ccMa = re.sub(r"^\s*#.*$", "", cc, flags=re.M)

ok("/duyet" in ccMa,
   "3 · worker gọi `POST …/duyet` sau khi tạo nháp",
   "dừng ở bản nháp thì kho không có gì, và `/video/` không thấy bản chưng cất "
   "— đúng ô chủ dự án báo")
ok(re.search(r"ViecHong|raise", ccMa[ccMa.find("/duyet"):]) is not None
   if "/duyet" in ccMa else False,
   "3a · duyệt TRƯỢT ⇒ việc HỎNG, không nuốt",
   "nuốt lỗi thì màn báo *xong* trong khi kho trống — sai theo cách người tin "
   "ngay")
ok("nhap_id" in ccMa,
   "3b · và `nhap_id` VẪN được ghi vào kết quả việc",
   "bản nháp là lịch sử; tab `Kết quả` (`WO-090`) đang hiện nó, nên đừng bỏ "
   "đường trỏ tới nó")

# ── 4 · Bảng nháp KHÔNG bị đập ───────────────────────────────────────────
print("\n4 · Giữ bảng nháp — nó là lịch sử\n")

ok("/api/nhap-chung-cat" in WORKER,
   "4 · worker VẪN tạo bản nháp trước khi duyệt",
   "bỏ nháp là bỏ luôn tab `Kết quả` và đường soi khi model trả bản xấu")

if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — vào kho không cần người, bản manual không bị ghi đè{NL}")
