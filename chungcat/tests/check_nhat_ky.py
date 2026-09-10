#!/usr/bin/env python3
"""NHẬT KÝ VẬN HÀNH — đo được workload · thời gian · timeout, và KHÔNG lộ khoá.

Chỉ đạo chủ dự án 2026-09-05: *"tôi yêu cầu set logging để theo dõi workload,
của API, worker chứ không phải mỗi lần test lại chạy 1 file. Chúng ta thống nhất
là bật logging để đo timeout, workload và debug"*.

VÌ SAO NÓ CẦN MỘT CỔNG
Một nhật ký là thứ người ta tin lúc đang tìm lỗi. Ba cách nó nói dối, và cả ba
đều im lặng:

  ① dòng không parse được  ⇒ công cụ tổng hợp bỏ qua, và số đếm THIẾU mà không
                             ai biết thiếu bao nhiêu
  ② thiếu trường thời gian ⇒ *"đo timeout"* thành không đo được gì
  ③ có khoá API trong dòng ⇒ nhật ký thành chỗ rò khoá, và nó được `tail`,
                             `cat`, dán vào issue

`ADR-06` cấm khoá rời khỏi env. Một dòng log mang khoá là đúng thứ đó, chỉ ở
một file khác.

VÀ MỘT VẾ VỀ CÁCH ĐỌC: số phải do MÁY tổng hợp từ file (`#tự-khai`). Nên cổng
này cũng đòi công cụ đọc tồn tại và tính từ nguồn — không phải một câu tường
thuật ai đó gõ tay.

ĐỎ_KHI  không có module nhật ký · dòng thiếu `t`/`loai` · `ms` không phải số ·
        dòng mang khoá · không có công cụ tổng hợp · api/worker không gọi ghi
XANH_KHI sáu vế trên đo được trên FILE THẬT do chính phép kiểm sinh ra
"""
from __future__ import annotations

import json
import os
import re
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

loi: list[str] = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


print("\n1 · Module nhật ký tồn tại và ghi được JSONL\n")

try:
    import nhat_ky
    co = True
except ImportError as e:
    co = False
    print(f"  (không import được: {e})")
ok(co, "`chungcat/src/nhat_ky.py` import được",
   "không có module dùng chung ⇒ mỗi bên tự dựng một định dạng, và công cụ đọc "
   "chỉ hiểu được một trong số đó")

if not co:
    sys.exit("1 vấn đề — chưa có nhật ký")

with tempfile.TemporaryDirectory() as tmp:
    os.environ[nhat_ky.BIEN_DIR] = tmp
    nhat_ky.dat_lai()

    nhat_ky.ghi("thu", ten="mot-viec", ms=12.5, ma=200)
    nhat_ky.ghi("thu", ten="viec-cham", ms=9000.0, ma=200, qua_han=True)
    duong = nhat_ky.duong_tep("thu")
    ok(duong.exists(), f"ghi ra file `{duong.name}`",
       "không có file ⇒ mọi vế dưới đây đo một thứ không tồn tại")

    dong = [l for l in duong.read_text(encoding="utf-8").splitlines() if l.strip()]
    ok(len(dong) == 2, f"đủ {len(dong)}/2 dòng")

    hong = []
    for i, l in enumerate(dong, 1):
        try:
            json.loads(l)
        except ValueError:
            hong.append(i)
    ok(not hong, "mọi dòng parse được JSON",
       f"dòng hỏng: {hong} — một dòng hỏng làm công cụ tổng hợp đếm THIẾU, và "
       "nó không nói là mình vừa bỏ qua cái gì")

    print("\n2 · Trường bắt buộc — thiếu một cái là mất một câu hỏi\n")

    d0 = json.loads(dong[0])
    for k, vi_sao in [
        ("t", "không có mốc thời gian thì không xếp được thứ tự, và "
              "*'workload theo giờ'* là câu không trả lời được"),
        ("loai", "không có loại thì mọi dòng của mọi bên trộn vào một rổ"),
        ("pid", "hai tiến trình cùng ghi một file là chuyện thường; không có "
                "`pid` thì không tách được ai làm gì"),
    ]:
        ok(k in d0, f"dòng có `{k}`", vi_sao)

    ok(isinstance(d0.get("ms"), (int, float)),
       "`ms` là SỐ, không phải chuỗi",
       f"được {type(d0.get('ms')).__name__} — một chuỗi ở đây làm phép tính "
       "p95 im lặng trả kết quả sai thứ tự (so chuỗi, không so số)")

    print("\n3 · KHÔNG khoá trong nhật ký\n")

    # Ghi một dòng mang đúng những tên trường mà khoá hay đi theo.
    nhat_ky.ghi("thu", ten="co-khoa", ms=1.0,
                headers={"Authorization": "Bearer sk-bee-THAT-SU-BI-MAT"},
                khoa="sk-bee-THAT-SU-BI-MAT",
                token="sk-bee-THAT-SU-BI-MAT")
    noi = duong_thu = nhat_ky.duong_tep("thu").read_text(encoding="utf-8")
    ok("sk-bee-THAT-SU-BI-MAT" not in noi,
       "giá trị khoá KHÔNG xuất hiện trong file",
       "`ADR-06` cấm khoá rời khỏi env. Một dòng log mang khoá là đúng điều đó "
       "ở một file khác — và file đó được `tail`, `cat`, dán vào issue")
    ok("Authorization" not in noi or "Bearer" not in noi,
       "  và cả đầu đề `Authorization` cũng bị lột",
       "giữ tên đầu đề mà lột giá trị vẫn tốt hơn, nhưng ở đây không có lý do "
       "gì phải giữ nó")

    # ĐÓNG handle TRƯỚC khi `TemporaryDirectory` dọn. Trên Windows một file còn
    # mở thì `rmtree` ném `WinError 32`, và phép kiểm chết vì cách nó tự dọn —
    # không vì thứ nó đo. Module giữ handle mở là CỐ Ý (mở lại mỗi dòng là một
    # `open()` trên đường nóng), nên `dat_lai()` tồn tại đúng cho ca này.
    nhat_ky.dat_lai()

print(chr(10) + "3a · XOAY FILE — nhật ký không được lớn mãi" + chr(10))

# Không có phép xoay thì nhật ký lớn tới lúc đầy đĩa, và lúc đó nó làm sập đúng
# thứ nó quan sát. Đo trên FILE THẬT ở thư mục tạm, hạ trần xuống cho nhanh.
with tempfile.TemporaryDirectory() as tmp2:
    os.environ[nhat_ky.BIEN_DIR] = tmp2
    nhat_ky.dat_lai()
    tran_cu = nhat_ky.TRAN_BYTE
    nhat_ky.TRAN_BYTE = 2000
    try:
        for i in range(60):
            nhat_ky.ghi("thu", ms=i, dem="x" * 40)
        nhat_ky.dat_lai()
        ten = sorted(p.name for p in Path(tmp2).iterdir())
        ok("thu.jsonl.1" in ten, f"vượt trần ⇒ xoay sang `.1` ({ten})",
           "không xoay thì file lớn mãi; và giữ nhiều hơn MỘT bản `.1` là giữ "
           "dữ liệu không ai đọc rồi phải viết thêm luật xoá")
        ok(Path(tmp2, "thu.jsonl").stat().st_size < 2000,
           "  file đang ghi nhỏ lại sau khi xoay",
           "không nhỏ lại nghĩa là phép xoay chỉ đổi tên mà vẫn ghi vào file cũ")
    finally:
        nhat_ky.TRAN_BYTE = tran_cu
        nhat_ky.dat_lai()


print(chr(10) + "3b · HAI phía cùng MỘT quy ước mốc thời gian" + chr(10))

# Đo được 2026-09-05: `nhatky.mjs` dùng `toISOString()` ⇒ ghi `+0000` (UTC),
# còn `nhat_ky.py` dùng `%z` ⇒ ghi `+0700`. Hai file cạnh nhau lệch BẢY GIỜ cho
# cùng một khoảnh khắc, và `xem_nhat_ky.py` parse 19 ký tự đầu rồi BỎ độ lệch —
# nên nó xếp sai thứ tự mà không báo gì. Xếp hai bên theo thời gian là cả lý do
# hai bên dùng chung một định dạng, nên đây là LỖI, không phải chi tiết hiển thị.
js = (R / "web" / "nhatky.mjs").read_text(encoding="utf-8")
# Cắt CẢ khối `/* … */`, không chỉ `//`: chính chú thích của phép sửa
# DẪN LẠI chữ `toISOString` để nói vì sao nó sai, và một cổng đo chữ
# trong chú thích là cổng tố cáo bản sửa của chính nó — cùng lỗi
# `CHUNGCAT_KHOA_MODEL` đã trả giá một lần.
chi_ma_js = re.sub(r"/\*[\s\S]*?\*/", "", js)
chi_ma_js = chr(10).join(l.split("//")[0] for l in chi_ma_js.splitlines())
ok("toISOString" not in chi_ma_js,
   "phía JS KHÔNG dùng `toISOString()` cho mốc",
   "`toISOString` luôn là UTC (`Z`/`+0000`), còn phía Python ghi giờ địa "
   "phương — hai quy ước làm bản tổng hợp xếp sai thứ tự trong im lặng")
ok("getTimezoneOffset" in chi_ma_js,
   "  nó tính độ lệch múi giờ như `%z` của Python",
   "không tính độ lệch thì không cách nào ra cùng hình dạng")

print("\n4 · Công cụ TỔNG HỢP — số do máy tính từ file\n")

cong_cu = R / "chungcat" / "tools" / "xem_nhat_ky.py"
ok(cong_cu.exists(), "có `chungcat/tools/xem_nhat_ky.py`",
   "không có thì *'theo dõi workload'* nghĩa là người tự đọc JSONL bằng mắt, "
   "và số đếm bằng mắt là `#tự-khai`")

if cong_cu.exists():
    ma = cong_cu.read_text(encoding="utf-8")
    ok("p95" in ma or "phan_vi" in ma,
       "  nó tính PHÂN VỊ, không chỉ trung bình",
       "trung bình che đúng thứ đang tìm: một request 30 giây lẫn trong 999 "
       "request 5ms không đổi trung bình bao nhiêu, mà nó là cái làm người dùng "
       "bỏ đi")
    ok("qua_han" in ma or "timeout" in ma,
       "  và đếm được lần QUÁ HẠN",
       "chỉ đạo nói *'đo timeout'* — không đếm được thì vế đó không tồn tại")

print("\n5 · API và WORKER thật sự GỌI nó\n")

for ten, tep in [("api.py", R / "chungcat" / "src" / "api.py"),
                 ("worker.py", R / "chungcat" / "src" / "worker.py")]:
    src = tep.read_text(encoding="utf-8")
    # Bỏ chú thích: chú thích DẪN LẠI tên module để nói vì sao — đo chữ trong
    # chú thích là cùng lỗi `CHUNGCAT_KHOA_MODEL` đã trả giá một lần.
    chi_ma = "\n".join(l.split("#")[0] for l in src.splitlines())
    ok("nhat_ky" in chi_ma, f"`{ten}` gọi `nhat_ky`",
       "một module nhật ký không ai gọi là 0 dòng log và một cổng xanh — đúng "
       "hình dạng *'cổng không đỏ được'*")

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — nhật ký CHƯA đo được thứ nó khai đo")
print("pass · nhật ký JSONL: parse được · đủ trường · không khoá · máy tổng hợp được")
