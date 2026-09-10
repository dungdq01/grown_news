#!/usr/bin/env python3
r"""Cổng MODEL NGOÀI BẢNG — `AC-4.6` (`FR-053` §1.6).

VÌ SAO CỔNG NÀY TỒN TẠI, VÀ VÌ SAO NÓ PHẢI LÀ FILE RIÊNG
`spec.md` khai `AC-4.6` với `cmd: python chungcat/tests/check_model_ngoai_bang.py`
— và file đó **không tồn tại** cho tới hôm nay (2026-09-04). Mệnh đề CÓ được đo,
nhưng đo ở `check_mot_hop_dong.py`, nên ai chạy đúng lệnh của spec thấy
`No such file`. Một `cmd` chết là một AC **không đo được bằng lệnh nó khai** —
`<rule-surface-check>` bắt đúng lớp đó.

VÀ NÓ KHÔNG PHẢI MỘT PHÉP ĐỔI TÊN. `AC-4.6` nói rõ:

    *"Cổng phải gọi **THẲNG `:8790`**, không qua `web/` — qua `web/` thì nó chỉ
    kiểm bộ chọn của FE, và một `curl` thẳng vào THỢ đi vòng qua phép kiểm đó."*

Phép đo cũ gọi `dinh_tuyen.quyet_dinh()` **trong tiến trình**. Đó là đo cái
THƯ VIỆN, không đo cái CỬA: `do_POST` có thể quên gọi nó, hoặc nuốt exception,
và phép đo cũ vẫn xanh. Cổng này dựng server thật và bắn HTTP thật vào nó.

ĐỎ_KHI  `POST /job` với model ngoài `model.json` trả 2xx · trả 4xx nhưng VẪN
        nạp một việc vào hàng đợi · model hợp lệ cũng bị từ chối (chặn mù, cổng
        xanh vì lý do sai)
XANH_KHI model ngoài bảng ⇒ 4xx + hàng đợi KHÔNG thêm việc; model trong bảng
        ⇒ 201 — hai vế, vì một cổng chỉ đo vế cấm sẽ xanh cả khi cửa chết hẳn
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
    bang_khai = _nap.nap("bang_khai")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, "check_model_ngoai_bang.py", "T12-8")

ASSETS = R / "chungcat" / "assets"
BANG = bang_khai.doc_model(ASSETS / "model.json")

KHOA = "khoa-model-ngoai-bang-fixture"
os.environ[api.BIEN_KHOA] = KHOA
# `can_key` được thoả để phép chặn (c) KHÔNG bắn — cổng này đo phép chặn (a).
# Không đặt biến này thì ca "model hợp lệ" cũng 422, và cổng xanh vì LÝ DO SAI.
os.environ["CHUNGCAT_KHOA_MODEL"] = "co"

tmp = Path(tempfile.mkdtemp(prefix="m12-ngoaibang-"))
HANG_DOI = tmp / "hang-doi"
s = api.chay(goc_hang_doi=HANG_DOI, cong=0)
try:
    cong = s.server_address[1]
    threading.Thread(target=s.serve_forever, daemon=True).start()
    goc = f"http://127.0.0.1:{cong}"

    def dat_job(than: dict):
        """`POST /job` THẬT qua socket — không gọi hàm trong tiến trình."""
        rq = urllib.request.Request(
            goc + "/job", method="POST",
            data=json.dumps(than, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-Khoa-Loi": KHOA},
        )
        try:
            with urllib.request.urlopen(rq, timeout=5) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    def dem_viec() -> int:
        """Số file trong hàng đợi. Đo VẬT, không đo mã trả về."""
        return sum(1 for _ in HANG_DOI.rglob("*")) if HANG_DOI.exists() else 0

    print()
    print("1 · Cổng gọi THẲNG :8790 — không qua `web/`")
    print()

    ma, _ = dat_job({"tac_vu": "chung-cat", "mau_text": "xin chào"})
    kiem(ma in (200, 201),
         "đường sống: `POST /job` KHÔNG kèm `model` ⇒ 2xx (dùng gợi ý mặc định)",
         f"trả {ma} — cổng dưới sẽ xanh cả khi cửa chết hẳn nếu vế này không đo")

    mot_model = BANG["dong"][0]["model"]
    ma, than = dat_job({"tac_vu": "chung-cat", "mau_text": "xin chào",
                        "model": mot_model})
    kiem(ma in (200, 201),
         f"model CÓ trong bảng (`{mot_model}`) ⇒ 2xx", f"trả {ma} {than}")
    kiem(than.get("model") == mot_model,
         "và trả về ĐÚNG model đã chọn — không im lặng rơi về mặc định",
         f"trả `{than.get('model')}`")

    print()
    print("2 · Model NGOÀI `model.json` ⇒ TỪ CHỐI")
    print()

    truoc = dem_viec()
    LA = "model-khong-bao-gio-co-that-t1208"
    kiem(LA not in {r["model"] for r in BANG["dong"]},
         "tên dùng để thử KHÔNG có trong bảng khai — nếu có, cả mục này vô nghĩa")

    ma, than = dat_job({"tac_vu": "chung-cat", "mau_text": "xin chào", "model": LA})
    kiem(400 <= ma < 500, "model ngoài bảng ⇒ 4xx", f"trả {ma} {than}")
    kiem(LA in json.dumps(than, ensure_ascii=False),
         "và câu lỗi NÓI RA tên bị từ chối — một mã trần không nói được vì sao",
         json.dumps(than, ensure_ascii=False)[:160])

    # Vế NẶNG NHẤT: 4xx mà việc VẪN vào hàng đợi thì phép chặn xảy ra SAU chỗ
    # cần chặn — worker sẽ nhặt nó lên và tiêu token cho một model không có.
    kiem(dem_viec() == truoc,
         "hàng đợi KHÔNG thêm việc nào — chặn TRƯỚC khi nạp, không phải sau",
         f"{truoc} → {dem_viec()}")

    print()
    print("3 · Ca âm — không tin bộ chọn của FE")
    print()

    # `web/` hiện bộ chọn từ `GET /model`; một `curl` thẳng vào THỢ đi vòng qua
    # nó. Nên cửa phải tự kiểm, và phép kiểm đó không được dựa vào header nào
    # do client gửi.
    ma, _ = dat_job({"tac_vu": "chung-cat", "mau_text": "xin chào", "model": LA,
                     "model_da_duyet": True, "bo_qua_kiem": True})
    kiem(400 <= ma < 500,
         "payload tự khai `model_da_duyet`/`bo_qua_kiem` KHÔNG mở được cửa",
         f"trả {ma}")
finally:
    # `shutdown()` TRƯỚC `server_close()`: bỏ nó thì luồng daemon còn đang
    # đọc socket lúc interpreter tắt, và Python chết ở `_enter_buffered_busy`
    # — một cổng XANH mà tiến trình sập là một cổng không đọc được.
    s.shutdown()
    s.server_close()

print()
if loi:
    print(f"ĐỎ — {len(loi)} vế:")
    for x in loi:
        print(f"  · {x}")
    sys.exit(1)
print("XANH · AC-4.6 · model ngoài bảng bị từ chối TẠI CỬA :8790, hàng đợi sạch")
