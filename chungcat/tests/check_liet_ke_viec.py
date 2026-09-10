#!/usr/bin/env python3
r"""Cổng LIỆT KÊ VIỆC — `T12-10`, đường mà màn `/chung-cat/` sống bằng.

VÌ SAO CỔNG NÀY TỒN TẠI
`GET /viec/<id>` đã có; **liệt kê thì chưa**, và `T03-93` khai sống bằng nó.
Ba tính chất dễ cài sai theo cách không ai thấy:

    1  QUYỀN — danh sách việc mang `slug` của nguồn, tức nó lộ **cái gì đang
       có trong kho**. `/model` mở được vì nó chỉ có tên model; đường này thì
       không. Một danh sách mở là một mục lục kho cho người ngoài.
    2  THỨ TỰ — sắp theo `mtime` "chạy đúng" trên máy dev rồi lệch sau một lần
       `git checkout`/copy thư mục. ULID mang thời điểm TRONG chính nó.
    3  TRẦN — `n` không có trần thì một kho 10k việc trả 10k bản ghi, và người
       đầu tiên gặp điều đó là người dùng.

ĐỎ_KHI  liệt kê được khi thiếu khoá · thứ tự đổi theo `mtime` · `n` bị bỏ qua
        hoặc vượt trần · một file JSON hỏng làm sập cả danh sách · lọc trạng
        thái bị bỏ qua (trả hết thay vì trả rỗng)
XANH_KHI đòi khoá · sắp theo ULID · `n` là trần có khai · file hỏng bị bỏ qua
"""

import json
import os
import sys
import tempfile
import threading
import urllib.error
import urllib.request
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
    api = _nap.nap("api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_liet_ke_viec.py", "T12-10")

KHOA = "khoa-liet-ke-fixture"
os.environ[api.BIEN_KHOA] = KHOA
os.environ["CHUNGCAT_KHOA_MODEL"] = "co"

tmp = Path(tempfile.mkdtemp(prefix="m12-lietke-"))
s = api.chay(goc_hang_doi=tmp / "hang-doi", cong=0)
try:
    cong = s.server_address[1]
    threading.Thread(target=s.serve_forever, daemon=True).start()
    goc = f"http://127.0.0.1:{cong}"

    def goi(duong, khoa=None):
        rq = urllib.request.Request(goc + duong, method="GET")
        if khoa:
            rq.add_header("X-Khoa-Loi", khoa)
        try:
            with urllib.request.urlopen(rq, timeout=5) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    print()
    print("1 · Danh sách việc LỘ SLUG của kho ⇒ đòi khoá LÕI")
    print()

    ma, _ = goi("/viec")
    kiem(ma == 403, "`GET /viec` KHÔNG khoá ⇒ 403", f"trả {ma}")
    ma, than = goi("/viec", khoa=KHOA)
    kiem(ma == 200 and "dong" in than and "tong" in than,
         "có khoá ⇒ 200 + `{dong, tong}`", f"trả {ma} · {than}")
    kiem(than.get("dong") == [] and than.get("tong") == 0,
         "hàng đợi rỗng ⇒ danh sách RỖNG, không phải lỗi — màn mới mở phải hiện được",
         f"{than}")

    print()
    print("2 · Sắp MỚI NHẤT TRƯỚC theo `tao_luc`, KHÔNG theo id, KHÔNG theo mtime")
    print()

    # ⚠️ WO-081 · vế này TỪNG đòi "sắp theo ULID giảm dần", và nó xanh suốt —
    # nhưng nó mã hoá một TIỀN ĐỀ SAI. Id của việc là `uuid.uuid4().hex`
    # (`api.py`), NGẪU NHIÊN; chỉ vì fixture ở đây tự đặt id `01AAA…`/`01CCC…`
    # tăng dần theo thời gian nên hai phép sắp trùng nhau và không ai thấy.
    # Trên máy thật: 18 việc, màn vẽ 8 ô đầu, việc vừa xong không lên màn.
    #
    # Nay id đặt NGƯỢC chiều thời gian: nạp trước = id LỚN. Chỉ một phép sắp
    # theo thời điểm thật mới qua được — trùng khớp ngẫu nhiên không cứu nổi.
    import time as _t
    hd = api.Cua.hang_doi
    U_A = "01CCC00000000000000000CCC"      # nạp TRƯỚC, id lớn nhất
    U_B = "01BBB00000000000000000BBB"
    U_C = "01AAA00000000000000000AAA"      # nạp SAU cùng, id nhỏ nhất
    for u in (U_A, U_B, U_C):
        hd.nap(u, {"slug": "x-" + u[2:5].lower(), "mau_text": "abc"})
        _t.sleep(0.02)
    ma, than = goi("/viec", khoa=KHOA)
    thu_tu = [v["ulid"] for v in than["dong"]]
    kiem(thu_tu == [U_C, U_B, U_A],
         "mới nhất trước theo `tao_luc`, kể cả khi id ngược chiều", f"{thu_tu}")

    # `touch` việc CŨ NHẤT thành mới nhất theo mtime. Thứ tự PHẢI không đổi.
    os.utime(tmp / "hang-doi" / "new" / f"{U_A}.json", (2 ** 31 - 1, 2 ** 31 - 1))
    ma, than = goi("/viec", khoa=KHOA)
    kiem([v["ulid"] for v in than["dong"]] == thu_tu,
         "`touch` một việc cũ KHÔNG đổi thứ tự — không sắp theo mtime",
         f"{[v['ulid'] for v in than['dong']]}")

    print()
    print("3 · `n` là TRẦN, không phải gợi ý")
    print()

    ma, than = goi("/viec?n=2", khoa=KHOA)
    kiem(len(than["dong"]) == 2 and than["tong"] == 3,
         "`n=2` ⇒ 2 dòng, `tong` vẫn nói 3 — người biết mình đang xem một phần",
         f"{len(than['dong'])} dòng · tong {than['tong']}")
    ma, than = goi("/viec?n=99999", khoa=KHOA)
    kiem(than.get("tran") == hd.TRAN_LIET_KE and len(than["dong"]) <= than["tran"],
         "`n` vượt trần ⇒ chặn về trần, và trần được KHAI trong thân trả về",
         f"tran={than.get('tran')}")
    ma, than = goi("/viec?n=0", khoa=KHOA)
    kiem(len(than["dong"]) >= 1, "`n=0` không làm danh sách rỗng (sàn 1)",
         f"{len(than['dong'])} dòng")

    print()
    print("4 · Lọc trạng thái — bỏ qua lọc thì trả HẾT, và đó là ca phải bắt")
    print()

    ma, than = goi("/viec?giai_doan=khong-co-giai-doan-nay", khoa=KHOA)
    kiem(than["dong"] == [] and than["tong"] == 0,
         "lọc không khớp gì ⇒ rỗng (lọc bị bỏ qua thì `tong` = 3)",
         f"tong {than['tong']}")
    gd = hd.doc(U_A).get("giai_doan")
    ma, than = goi(f"/viec?giai_doan={gd}", khoa=KHOA)
    kiem(than["tong"] == 3, f"lọc đúng `{gd}` ⇒ cả 3 việc", f"tong {than['tong']}")

    print()
    print("5 · File dở dang không làm sập cả danh sách")
    print()

    (tmp / "hang-doi" / "cur" / "hong.json").write_text("{ khong phai json",
                                                        encoding="utf-8")
    ma, than = goi("/viec", khoa=KHOA)
    kiem(ma == 200 and than["tong"] == 3,
         "một JSON hỏng trong `cur/` ⇒ bỏ qua nó, 200 và ba việc kia còn nguyên",
         f"trả {ma} · tong {than.get('tong')}")
finally:
    s.shutdown()
    s.server_close()

if loi:
    print()
    print(f"{len(loi)} lỗi")
    sys.exit(1)
print()
print("-" * 62)
print("liệt kê việc: đòi khoá · sắp theo ULID · `n` là trần · file hỏng không sập")
