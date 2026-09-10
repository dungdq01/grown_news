#!/usr/bin/env python3
r"""Cổng TRẦN THỬ LẠI — `AC-5.3` · `AC-5.5` · `M12-R6`.

VÌ SAO CỔNG NÀY TỒN TẠI
Trần ở đây **KHÔNG phải chuyện chịu lỗi** — nó là trần cho **số lần dữ liệu đi
ra**. Một vòng retry *"cho chắc"* biến một job thành N lần gửi, và nếu chỉ log
lần cuối thì con số trong báo cáo egress **nhỏ hơn sự thật**.

`AC-5.5`: `lan_gui` phải **bền qua mọi lần chạy lại**. Reset nó thì người bấm
mười lần là tài liệu đi ra mười lần, và trần thành **trang trí**.

Và một chi tiết `spec §5.3` đòi tường minh: **hai payload y hệt nhau vẫn phải ra
HAI dòng log**. Log đếm **LẦN GỬI**, không đếm nội dung — gộp theo `sha256` là
cách con số egress tụt xuống mà trông vẫn hợp lý.

ĐỎ_KHI  đếm được ≥3 lần gửi · hai lần gửi mà log một dòng · chạy lại làm
        `lan_gui` giảm · chạy-lại-từ-đầu khi chạm trần mà vẫn gửi
XANH_KHI đúng 2 lần gửi, đúng 2 dòng log, kể cả khi hai payload y hệt nhau
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


try:
    vong, egress = _nap.nap("vong", "egress")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_tran_thu_lai.py", "T12-6")

tmp = Path(tempfile.mkdtemp(prefix="m12-tran-"))
try:
    q = vong.HangDoi(tmp / "hd")
    LOG = tmp / "egress.jsonl"
    u = q.nap("01K9ZTRAN0000000000000001", {"loai": "chung-cat-mot-nguon"})[0]

    # Giả lập model lỗi liên tục: mỗi vòng là MỘT LẦN GỬI THẬT.
    lan = 0
    for _ in range(5):
        try:
            q.ghi_nhan_gui(u)
        except Exception:
            break
        lan += 1
        # HAI payload Y HỆT NHAU — `spec` đòi vẫn phải ra HAI dòng log.
        egress.gui({"a": 1}, "https://x.vd/v1", allowlist=["x.vd"],
                   tran=10_000, log=LOG, chuyen=lambda *_a, **_k: None)
    kiem(lan == 2, "đúng HAI lần gửi rồi dừng — lần thứ ba bị chặn", f"đếm {lan}")

    d = [x for x in LOG.read_text(encoding="utf-8").splitlines() if x.strip()]
    kiem(len(d) == 2, "đúng HAI dòng log, kể cả khi hai payload Y HỆT NHAU",
         f"có {len(d)} dòng")
    seq = [json.loads(x)["seq"] for x in d]
    kiem(len(set(seq)) == 2, "hai dòng mang `seq` KHÁC nhau — không dòng nào bị gộp",
         f"seq {seq}")
    # Hai payload đầu vào Y HỆT nhau, nhưng `sha256` KHÁC — vì `egress.gui` gắn
    # `_seq` vào payload TRƯỚC khi băm, và `AC-6.2` đòi băm **thứ ĐÃ GỬI** chứ
    # không phải thứ người gọi đưa vào.
    #
    # Bản đầu của cổng này khẳng định ngược (`sha256` phải y hệt) và ĐỎ — kỳ vọng
    # của tôi sai, không phải mã sai. Và tính chất thật còn đáng hơn: vì hash đã
    # khác nhau, **không ai dedupe được `egress.jsonl` theo `sha256`**. Một tối ưu
    # kiểu *"cái này gửi rồi, bỏ dòng trùng"* sẽ không có chỗ bám — và đó đúng là
    # thứ giữ cho con số egress không âm thầm tụt xuống.
    sha = [json.loads(x)["sha256"] for x in d]
    kiem(len(set(sha)) == 2,
         "hai lần gửi ⇒ hai `sha256` KHÁC nhau (vì `_seq` nằm trong payload đã gửi) "
         "⇒ không thể dedupe log theo nội dung",
         f"sha {[x[:12] for x in sha]}")

    # `AC-5.5` · bền qua chạy lại
    for _ in range(5):
        q.chay_lai(u, tu_giai_doan="dang-verify")
    kiem(q.doc(u)["lan_gui"] == 2, "chạy lại 5 lần từ `dang-verify` ⇒ `lan_gui` vẫn 2")
    try:
        q.chay_lai(u, tu_giai_doan="cho")
        kiem(False, "chạy-lại-TỪ-ĐẦU khi chạm trần ⇒ TỪ CHỐI")
    except Exception as e:
        kiem("lan_gui" in str(e) or "job" in str(e).lower(),
             "chạy-lại-TỪ-ĐẦU khi chạm trần ⇒ TỪ CHỐI **kèm lý do và cách đi tiếp**",
             f"{e}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — M12-R6 chưa có răng")
print("trần 2 lần gửi · 2 dòng log · lan_gui bền qua chạy lại")
