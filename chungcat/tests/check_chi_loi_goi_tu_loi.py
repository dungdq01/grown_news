#!/usr/bin/env python3
r"""Cổng CHỈ LÕI GỌI ĐƯỢC — `AC-1.4` · `AC-1.5` · `AC-4.6` · `M12-R7`.

VÌ SAO CỔNG NÀY TỒN TẠI
Bốn dịch vụ THỢ cùng nằm trên `127.0.0.1`, nên `AC-1.2` (*bind loopback*)
**không nói được ai gọi**. Payload job mang `nguon: [slug…]` do người gọi nêu —
đúng hình dạng `CVE-2026-44560` (Open WebUI): *scope identifier do client gửi,
và tên đoán được*.

`FR-047 §2.1` cho ba luật, và cổng này đo hai:

    L1  danh tính do LÕI gán, KHÔNG nhận từ payload
        (`CVE-2026-47713` — cách ly cài thành nhánh điều kiện trên sự CÓ MẶT
         của danh tính, nên vị từ `WHERE` biến mất khi danh tính vắng)
    L2  thiếu danh tính ⇒ **DENY**, không rơi về "cả kho"/"người dùng mặc định"
        (fail-open là hình dạng lỗi lặp lại nhiều nhất trong khảo sát đợt năm)

Và `AC-4.6`: cổng phải gọi **THẲNG `:8790`**, không qua `web/` — nếu không nó
chỉ kiểm bộ chọn của FE, chứ không kiểm dịch vụ.

ĐỎ_KHI  gọi không có khoá LÕI mà được nhận · `nguoi_dung_id` từ payload được
        tin · model ngoài bảng vẫn tạo được job · thiếu khoá mà rơi về mặc định
XANH_KHI mọi lời gọi không mang danh tính LÕI đều bị TỪ CHỐI
"""

import json
import os
import shutil
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
    _nap.bao_do_va_thoat(e, "check_chi_loi_goi_tu_loi.py", "T12-6")

KHOA = "khoa-cua-loi-cho-fixture"
os.environ[api.BIEN_KHOA] = KHOA
# Khoá của CỬA, đọc tên từ `cua.json` — KHÔNG gõ `CHUNGCAT_KHOA_MODEL` (biến
# đó chưa bao giờ tồn tại, và `api.py` từng kiểm nó nên phép chặn (c) từ chối
# cả người ĐÃ đặt khoá thật).
sys.path.insert(0, str(R / "chungcat" / "src"))
from adapter import hop_dong as _hd  # noqa: E402
_bc = _hd.doc_cua()
os.environ[_bc["cua"][_bc["mac_dinh"]]["bien_khoa"]] = "khoa-fixture-cho-cong"

tmp = Path(tempfile.mkdtemp(prefix="m12-authz-"))
try:
    s = api.chay(goc_hang_doi=tmp / "hang-doi", cong=0)
    cong = s.server_address[1]
    t = threading.Thread(target=s.serve_forever, daemon=True)
    t.start()
    goc = f"http://127.0.0.1:{cong}"

    def goi(duong, than=None, khoa=None, nguoi=None, phuong=None):
        """Gọi THẲNG `:{cổng}` — không qua `web/`. Đó là điểm của `AC-4.6`."""
        d = json.dumps(than).encode() if than is not None else None
        rq = urllib.request.Request(goc + duong, data=d,
                                    method=phuong or ("POST" if d else "GET"))
        if d:
            rq.add_header("Content-Type", "application/json")
        if khoa:
            rq.add_header("X-Khoa-Loi", khoa)
        if nguoi:
            rq.add_header("X-Nguoi-Dung", nguoi)
        try:
            with urllib.request.urlopen(rq, timeout=5) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    JOB = {"loai": "chung-cat-mot-nguon", "slug": "x", "mau_text": "một câu tiếng Việt"}

    # ══ L2 · thiếu danh tính ⇒ DENY, không fail-open ═══════════════════════
    ma, _ = goi("/job", JOB)
    kiem(ma == 403, "POST /job KHÔNG có khoá LÕI ⇒ 403 (M12-R7)", f"trả {ma}")
    ma, _ = goi("/job", JOB, khoa="khoa-sai")
    kiem(ma == 403, "khoá SAI ⇒ 403, không rơi về mặc định", f"trả {ma}")
    ma, _ = goi("/viec/khong-co-that", khoa=None)
    kiem(ma == 403, "GET /viec/<id> không có khoá ⇒ 403", f"trả {ma}")

    # `/health` và `/model` mở — chúng là thứ `web/` cần để dựng bộ chọn, và
    # không tiết lộ nội dung kho. Nếu chúng cũng 403 thì bộ chọn không dựng được.
    ma, _ = goi("/health")
    kiem(ma == 200, "`/health` mở (không tiết lộ nội dung kho)", f"trả {ma}")
    ma, than = goi("/model")
    kiem(ma == 200 and "dong" in than, "`/model` mở — `web/` cần nó để dựng bộ chọn")
    kiem(all("dich" not in d for d in than["dong"]),
         "`/model` KHÔNG lộ `dich` (đích egress) — bộ chọn không cần biết gửi tới đâu")

    # ══ AC-1.5 · `nguoi_dung_id` do LÕI gán, payload khai thì BỎ ═══════════
    ma, than = goi("/job", {**JOB, "nguoi_dung_id": 999, "ulid": "01K9ZAUTHZ00000000000001"},
                   khoa=KHOA, nguoi="7")
    kiem(ma == 201, "có khoá LÕI ⇒ 201", f"trả {ma} · {than}")
    v = json.loads((tmp / "hang-doi" / "new" / "01K9ZAUTHZ00000000000001.json")
                   .read_text(encoding="utf-8"))
    kiem(v["payload"]["nguoi_dung_id"] == "7",
         "AC-1.5 · `nguoi_dung_id` lấy từ HEADER của LÕI, không từ payload",
         f"ghi {v['payload']['nguoi_dung_id']!r}, payload khai 999")
    kiem(v["payload"]["nguoi_dung_id"] != 999,
         "AC-1.5 · giá trị 999 trong payload bị BỎ, không được tin")

    # ══ AC-4.6 · model ngoài bảng ⇒ TỪ CHỐI, kiểm THẲNG ở dịch vụ ══════════
    ma, than = goi("/job", {**JOB, "model": "khong-co-trong-bang"}, khoa=KHOA, nguoi="7")
    kiem(ma == 422, "AC-4.6 · model ngoài bảng ⇒ 422 (gọi THẲNG :cổng, không qua web/)",
         f"trả {ma} · {than}")

    # ══ Bất biến: một job bị từ chối KHÔNG để lại việc trong hàng đợi ══════
    con = list((tmp / "hang-doi" / "new").glob("*.json"))
    kiem(len(con) == 1, "chỉ MỘT việc trong hàng đợi — ca bị từ chối không tạo việc",
         f"có {len(con)}")

    s.shutdown()
    s.server_close()
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — AC-1.4/1.5 · M12-R7 chưa có răng")
print("chỉ LÕI gọi được · danh tính từ LÕI · model ngoài bảng bị chặn tại dịch vụ")
