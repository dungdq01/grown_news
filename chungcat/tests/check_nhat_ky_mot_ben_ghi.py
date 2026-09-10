# -*- coding: utf-8 -*-
"""MỘT file nhật ký, MỘT bên ghi.

ĐỎ_KHI   hai worker khác `CHUNGCAT_WORKER_ID` cùng trỏ về một file `.jsonl`
XANH_KHI mỗi định danh worker một file, và `api-tho`/`api-loi` giữ tên cũ

VÌ SAO — đây không phải chuyện gọn gàng, nó là mất dữ liệu im lặng:

`nhat_ky._tep()` giữ trần bằng `f.tell()` trên handle ĐANG MỞ của **chính tiến
trình mình**. Hai bên cùng ghi một file thì mỗi bên chỉ đếm phần mình ghi:

  · trần 8 MiB thành ~16 MiB — mỗi bên tưởng file bằng một nửa cỡ thật
  · bên nào chạm trần trước thì `d.rename()` file sang `.1`, còn bên kia GIỮ
    handle cũ và ghi tiếp vào `.1` — tức ghi vào đúng file mà lần xoay sau
    `unlink()`. Dòng mất, không ai báo.

Và `nhat_ky` mở đầu bằng câu *"không nói là mình chỉ thấy một nửa"*. Một nhật
ký nói dối về độ đầy đủ của chính nó là thứ tệ hơn không có nhật ký.

`chungcat/README.md` đã chọn đúng lối này cho **sổ egress**
(`egress.<id>.jsonl`, *"N bên cùng ghi một file là cuộc đua trên chính phép
cấp số"*). Cùng lý lẽ, cùng lối — nhật ký không có lý do nào để khác.

`chay.sh` dựng HAI worker từ 2026-09-07 (`nguong.json → song_song.tien_trinh:
2`), nên vế này chuyển từ giả thuyết sang đường mặc định.
"""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import importlib

nhat_ky = importlib.import_module("chungcat.src.nhat_ky")

loi = 0


def kiem(dat: bool, cau: str, vi_sao: str = "") -> None:
    global loi
    print(f"  {'ok  ' if dat else 'FAIL'} {cau}")
    if not dat:
        if vi_sao:
            print(f"       {vi_sao}")
        loi += 1


print("\nnhật ký · một file một bên ghi\n")

with tempfile.TemporaryDirectory() as d:
    cu_dir = os.environ.get(nhat_ky.BIEN_DIR)
    cu_id = os.environ.get("CHUNGCAT_WORKER_ID")
    os.environ[nhat_ky.BIEN_DIR] = d
    try:
        # ── 1 · hai định danh ⇒ hai file ────────────────────────────────
        duong = {}
        for w in ("w1", "w2"):
            os.environ["CHUNGCAT_WORKER_ID"] = w
            nhat_ky.dat_lai()
            duong[w] = nhat_ky.duong_tep("worker")
        kiem(duong["w1"] != duong["w2"],
             "hai `CHUNGCAT_WORKER_ID` ⇒ HAI file khác nhau",
             f"cả hai trỏ về {duong['w1'].name}")
        kiem(all("w1" in duong["w1"].name for _ in [0])
             and "w2" in duong["w2"].name,
             "tên file mang định danh worker")

        # ── 2 · vắng định danh ⇒ giữ tên cũ, không đổi hợp đồng ─────────
        os.environ.pop("CHUNGCAT_WORKER_ID", None)
        nhat_ky.dat_lai()
        kiem(nhat_ky.duong_tep("worker").name == "worker.jsonl",
             "vắng định danh ⇒ vẫn là `worker.jsonl`",
             "một người chạy tay `worker.py --vong` không phải học tên mới")

        # ── 3 · api-tho / api-loi KHÔNG đổi ────────────────────────────
        os.environ["CHUNGCAT_WORKER_ID"] = "w1"
        nhat_ky.dat_lai()
        for ten in ("api-tho", "api-loi"):
            kiem(nhat_ky.duong_tep(ten).name == f"{ten}.jsonl",
                 f"`{ten}` giữ tên cũ dù có định danh worker",
                 "định danh worker chỉ nói về worker; một tiến trình duy nhất "
                 "không được đổi tên vì biến của bên khác")

        # ── 4 · viewer vẫn gộp được: nó glob `*.jsonl` ──────────────────
        nhat_ky.dat_lai()
        os.environ["CHUNGCAT_WORKER_ID"] = "w1"
        nhat_ky.ghi("worker", giai_doan="thu")
        nhat_ky.dat_lai()
        os.environ["CHUNGCAT_WORKER_ID"] = "w2"
        nhat_ky.ghi("worker", giai_doan="thu")
        nhat_ky.dat_lai()
        thay = sorted(p.name for p in Path(d).glob("*.jsonl"))
        kiem(len(thay) == 2,
             f"hai bên ghi ⇒ hai file trên đĩa: {thay}",
             "gộp là việc của `xem_nhat_ky.py` (nó đã `glob('*.jsonl')`); "
             "tách là việc không ai làm được sau")

        # ── 5 · FILE PID: bên GHI và bên ĐỌC phải cùng một tên ──────────
        #
        # Đo 2026-09-07 — hai nửa của MỘT cơ chế gọi nhau bằng hai tên:
        #
        #   nhat_ky.bat("worker")     GHI  log/worker.pid
        #   worker._giu_khoa()        ĐỌC  log/worker-<wid>.pid
        #
        # ⇒ File khoá KHÔNG BAO GIỜ được ghi, nên phép đọc luôn thấy rỗng và
        #   luôn `return True`. Khoá chống **worker mồ côi** — thứ được viết ra
        #   sau khi nó gây đúng lỗi *"việc xong mà thiếu `ket_qua`"* (ghi chú
        #   ở `worker.py:1190`) — chưa bao giờ chặn một tiến trình nào.
        #
        # Và với hai worker, cả hai ghi chung `worker.pid`: bản sau đè bản
        # trước, nên `chay.sh` chỉ dừng được MỘT. Một cơ chế im lặng không làm
        # gì là thứ tệ hơn không có cơ chế: người ta tin nó rồi.
        import importlib as _il
        w = _il.import_module("chungcat.src.worker")
        for wid in ("w1", "w2"):
            os.environ["CHUNGCAT_WORKER_ID"] = wid
            nhat_ky.dat_lai()
            nhat_ky.bat("worker")
            doc = w.duong_khoa() if hasattr(w, "duong_khoa") else None
            kiem(doc is not None,
                 f"[{wid}] `worker` có MỘT hàm trả đường file khoá",
                 "hai nửa tự dựng tên riêng thì không cổng nào so được")
            if doc is not None:
                kiem(doc.exists(),
                     f"[{wid}] đường bên ĐỌC ({doc.name}) đã được bên GHI tạo",
                     "bên ghi dùng một tên khác ⇒ phép khoá đọc một file "
                     "không tồn tại và luôn cho qua")
    finally:
        nhat_ky.dat_lai()
        for b, v in ((nhat_ky.BIEN_DIR, cu_dir), ("CHUNGCAT_WORKER_ID", cu_id)):
            if v is None:
                os.environ.pop(b, None)
            else:
                os.environ[b] = v

print()
if loi:
    sys.exit(f"ĐỎ — {loi} vế")
print("pass · mỗi bên ghi một file; trần và phép xoay lại đúng nghĩa")
