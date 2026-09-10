"""T12-23 AC5 · giết một tiến trình giữa job ⇒ tiến trình kia NHẶT LẠI.

Đóng ô backlog "mồ côi cur/". 0 mạng, 0 model.

Không thật sự `taskkill` một tiến trình: ta DỰNG hiện trạng nó để lại — một
việc nằm ở `cur/` mang `nhan_pid` của một pid đã chết và `nhan_luc` cũ. Giết
tiến trình thật thì phép đo phụ thuộc thời điểm hệ điều hành thu dọn, tức
cổng sẽ chớp tắt; dựng hiện trạng thì mỗi lần chạy đo đúng một thứ.
"""

from __future__ import annotations

import json
import sys
import tempfile
import time
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import vong                                                     # noqa: E402

loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


PID_CHET = 999_999          # pid không tồn tại trên Windows lẫn POSIX


def main() -> int:
    print("T12-23 AC5 · nhặt lại việc mồ côi")
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        q = vong.HangDoi(tmp)
        u = "01TEST" + "0" * 20
        q.nap(u, {"loai": "chung-cat-mot-nguon", "slug": "s"})

        # tiến trình A chiếm rồi "chết"
        bao(q.nhan_viec() == u, "chuẩn bị · A chiếm được việc")
        v = q.doc(u)
        v["nhan_pid"] = PID_CHET
        v["nhan_luc"] = time.time() - 5        # MỚI TINH — lease chưa hết hạn
        q._ghi_nguyen_tu(u, v)

        # ── AC5 · B nhặt lại NGAY vì chủ đã chết, không đợi hết 30 phút ──
        #
        # Đây là vế đắt nhất của song song: chờ `HAN_TREO_GIAY` thì một worker
        # chết lúc 8 job đang chạy khoá cả 8 job trong nửa tiếng. Pid chết là
        # bằng chứng MẠNH HƠN đồng hồ — hỏi được hệ điều hành ngay.
        bao(q.nhan_viec() == u,
            "AC5 · chủ pid đã CHẾT ⇒ nhặt lại ngay, không đợi hết hạn lease")
        bao(q.doc(u)["nhan_pid"] != PID_CHET,
            "AC5b · nhãn đổi sang người nhặt mới")

        # ── AC5c · chủ còn SỐNG thì KHÔNG được cướp ─────────────────────
        v = q.doc(u)
        v["nhan_pid"] = __import__("os").getpid()   # pid sống thật
        v["nhan_luc"] = time.time()
        q._ghi_nguyen_tu(u, v)
        bao(q.nhan_viec() is None,
            "AC5c · chủ còn sống + lease còn hạn ⇒ KHÔNG cướp")

        # ── AC5d · một việc chỉ về tay MỘT người nhặt ───────────────────
        #
        # `_nhan_lai_bo_roi` vốn không nguyên tử (bản cũ nói thẳng điều đó).
        # Một worker thì cửa sổ đua hẹp; TÁM LUỒNG thì nó rộng gấp bội, nên
        # song song phải siết chỗ này chứ không kế thừa lời miễn trừ cũ.
        import threading
        v = q.doc(u)
        v["nhan_pid"] = PID_CHET
        v["nhan_luc"] = time.time() - 5
        q._ghi_nguyen_tu(u, v)
        thang: list[str] = []
        khoa = threading.Lock()

        def dua():
            r = q.nhan_viec()
            if r:
                with khoa:
                    thang.append(r)

        ts = [threading.Thread(target=dua) for _ in range(8)]
        for x in ts:
            x.start()
        for x in ts:
            x.join()
        bao(len(thang) == 1, "AC5d · 8 luồng cùng nhặt ⇒ đúng MỘT thắng",
            f"{len(thang)} luồng nhận được việc")

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
