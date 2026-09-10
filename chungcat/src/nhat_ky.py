#!/usr/bin/env python3
"""NHẬT KÝ VẬN HÀNH — một dòng JSON cho mỗi việc đáng đo.

Chỉ đạo chủ dự án 2026-09-05: *"bật logging để đo timeout, workload và debug"*,
và *"chứ không phải mỗi lần test lại chạy 1 file"* — tức nhật ký phải SỐNG cùng
dịch vụ, không phải một lần chạy tay để lấy số.

VÌ SAO JSONL, KHÔNG PHẢI DÒNG CHỮ
Số phải do MÁY tổng hợp từ nguồn (`#tự-khai`). Một dòng chữ người đọc được
nhưng `p95` thì phải parse bằng regex, và regex đó lệch ngay lần ai đó thêm một
trường. JSONL: mỗi dòng một object, thêm trường không phá bên đọc.

VÌ SAO KHÔNG DÙNG `logging` CỦA PYTHON
Nó có cấu hình toàn cục, và cấu hình toàn cục trong một tiến trình cũng là nơi
`import` của bên thứ ba đổi được mức log của TA. Ở đây cần đúng ba việc: mở
file, ghi một dòng, đóng. Ba mươi dòng, không phụ thuộc, không trạng thái ẩn.

VÌ SAO KHÔNG `fsync` MỖI DÒNG
`egress.jsonl` fsync vì mất một dòng ở đó là mất bằng chứng một lần dữ liệu rời
máy (`AC-6.2`). Nhật ký vận hành thì khác: mất dòng cuối lúc máy sập là chấp
nhận được, còn fsync mỗi request là một lần ghi đĩa trên đường NÓNG — nó sẽ đo
chính cái nó làm chậm. `line_buffering` cho `tail -f` thấy ngay là đủ.

CẤM: khoá vào nhật ký. `ADR-06` cấm khoá rời khỏi env, và một file được `tail`,
`cat`, dán vào issue là chỗ tệ nhất để nó rò. `_lot()` chặn theo TÊN TRƯỜNG và
theo HÌNH DẠNG giá trị — tên trường một mình không đủ, vì khoá đi lẫn trong một
dict `headers` lồng.
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

BIEN_DIR = "GN_LOG_DIR"

_GOC = Path(__file__).resolve().parent.parent.parent

# Tên trường hay mang bí mật. Lột theo TÊN là lớp thứ nhất.
_TEN_MAT = re.compile(
    r"khoa|key|token|secret|auth|password|matkhau|bearer|cookie", re.I)

# Hình dạng khoá của các cửa đang dùng. Lớp thứ hai, cho lúc bí mật đi dưới một
# tên vô hại (`gia_tri`, `than`, một phần tử mảng).
_HINH_MAT = re.compile(
    r"(sk-[A-Za-z0-9_\-]{6,}|Bearer\s+\S+|AIza[A-Za-z0-9_\-]{10,})")

_MAT = "<đã-lột>"


_BAT = False


def bat(ten: str = "") -> None:
    """BẬT nhật ký. Gọi từ ĐIỂM VÀO của dịch vụ, không từ `import`.

    Vì sao opt-in chứ không mặc định — đo được 2026-09-05, và nó làm hỏng đúng
    thứ nhật ký sinh ra để đo:

        ── worker · 28 dòng
          viec_loai=thu-cho-cong    2    4.3 …
          viec_loai=thu-hong        2    2.8 …    ← của CỔNG KIỂM, không của ai dùng

    Cổng kiểm gọi `dat_giai_doan()` trên hàng đợi fixture, và mỗi lời gọi đó
    thành một dòng trong nhật ký THẬT. `npm test` + `pytest` chạy vài chục lần
    một ngày, nên *"workload"* đo được là workload của chính phép đo. Người đọc
    bảng tổng hợp không có cách nào biết dòng nào là việc thật.

    Opt-in ở điểm vào giải quyết dứt: `api.py`/`worker.py` gọi `bat()`, còn cổng
    kiểm chỉ `import` module — không dòng nào ghi ra. Cổng nào MUỐN đo nhật ký
    thì tự đặt `GN_LOG_DIR` vào thư mục tạm (`check_nhat_ky.py` làm vậy).
    """
    global _BAT
    _BAT = True
    if not ten:
        return
    # FILE PID — để `chay.sh` dừng đúng tiến trình này ở lần chạy sau.
    #
    # Dịch vụ TỰ ghi, không để shell ghi hộ: đo được 2026-09-05 — `$!` của Git
    # Bash trả PID của JOB trong bash (MSYS), không phải PID của `python.exe`
    # trên Windows, nên `taskkill //PID $!` không giết gì và BỐN worker sống sót
    # qua ba lần chạy script, cùng ăn một hàng đợi. `os.getpid()` thì luôn là
    # PID thật của tiến trình này.
    try:
        d = duong_goc()
        d.mkdir(parents=True, exist_ok=True)
        duong_pid(ten).write_text(str(os.getpid()), encoding="utf-8")
    except OSError:
        pass


def duong_goc() -> Path:
    """Thư mục nhật ký. `GN_LOG_DIR` thắng; không có thì `<repo>/log/`.

    MỘT phép phân giải cho mọi bên — cùng lý do `vong.goc_mac_dinh()` tồn tại:
    hai bên tự phân giải là hai bên ghi vào hai chỗ, rồi công cụ đọc thấy một
    nửa và không nói là mình chỉ thấy một nửa.
    """
    d = os.environ.get(BIEN_DIR)
    return Path(d) if d else _GOC / "log"


def duong_tep(loai: str) -> Path:
    """Một file cho mỗi thành phần: `api-tho` · `worker` · `api-loi`.

    Tách file chứ không một file chung: `tail -f log/worker.jsonl` là thao tác
    người thật làm lúc đang tìm lỗi, và trong một file chung thì dòng của bên
    mình lẫn giữa dòng của bên khác. Công cụ tổng hợp gộp lại được — chiều gộp
    dễ, chiều tách thì cần một trường ai cũng phải nhớ đặt đúng.

    Và với `worker` thì "mỗi thành phần" nghĩa là **mỗi TIẾN TRÌNH worker**, vì
    từ 2026-09-07 `chay.sh` dựng hai bản (`nguong.json → song_song.tien_trinh`).
    Hai bên cùng ghi một file KHÔNG chỉ là lẫn dòng — nó phá trần và phép xoay:
    `_tep()` đo độ đầy bằng `f.tell()` trên handle của CHÍNH MÌNH, nên mỗi bên
    chỉ đếm phần mình ghi (trần 8 MiB thành ~16), và bên nào xoay trước thì bên
    kia giữ handle cũ, ghi tiếp vào `.1` — đúng file mà lần xoay sau `unlink()`.
    Dòng mất, không ai báo. Cùng lý lẽ đã chọn cho sổ egress
    (`egress.<id>.jsonl`, xem `chungcat/README.md`).

    Vắng `CHUNGCAT_WORKER_ID` ⇒ giữ `worker.jsonl`: một người chạy tay
    `worker.py --vong` không phải học một cái tên mới.
    """
    if loai == "worker":
        w = (os.environ.get("CHUNGCAT_WORKER_ID") or "").strip()
        if w:
            # Lọc tên file: một định danh chứa `/` hay `..` sẽ ghi nhật ký ra
            # ngoài thư mục log, và đường ghi là thứ không bao giờ nhận chuỗi
            # thô từ môi trường.
            an = "".join(c for c in w if c.isalnum() or c in "-_")[:32]
            if an:
                return duong_goc() / f"worker-{an}.jsonl"
    return duong_goc() / f"{loai}.jsonl"


def duong_pid(loai: str) -> Path:
    """File PID của một thành phần. **Cùng thân tên với file nhật ký của nó.**

    Vì sao một hàm chứ không hai chỗ gõ tên: đo 2026-09-07 — `bat()` ghi
    `log/worker.pid` trong khi `worker._giu_khoa()` ĐỌC
    `log/worker-<id>.pid`. Hai nửa của MỘT cơ chế gọi nhau bằng hai tên, nên
    file khoá **không bao giờ được ghi**, phép đọc luôn thấy rỗng và luôn cho
    qua. Khoá chống worker mồ côi — thứ được viết ra SAU KHI một worker mồ côi
    gây đúng lỗi *"việc xong mà thiếu `ket_qua`"* — chưa từng chặn ai.

    Một cơ chế im lặng không làm gì tệ hơn không có cơ chế: người ta đã tin nó.
    """
    return duong_tep(loai).with_suffix(".pid")


_MO: dict[str, object] = {}


def dat_lai() -> None:
    """Đóng mọi file đang mở. Cần cho phép kiểm: nó đổi `GN_LOG_DIR` giữa các
    ca, và một handle còn mở sẽ ghi tiếp vào thư mục CŨ mà không báo gì."""
    for f in _MO.values():
        try:
            f.close()          # type: ignore[attr-defined]
        except OSError:
            pass
    _MO.clear()


# ── XOAY FILE ──────────────────────────────────────────────────────────────
#
# Nhật ký không có phép xoay là một nhật ký lớn mãi tới lúc đầy đĩa, và lúc đó
# nó làm sập đúng thứ nó quan sát.
#
# MỘT bản `.1` duy nhất, không phải `.1 .2 .3 …`: bản `.1` trả lời câu hỏi thật
# ("chuyện gì vừa xảy ra trước lúc nó hỏng"), còn giữ mười bản là giữ dữ liệu
# không ai đọc và phải viết thêm luật xoá. Trần dưới đây cho ~50k dòng — đủ cho
# nhiều ngày dùng thật (đo: ~30 KB/giờ).
TRAN_BYTE = 8 * 1024 * 1024


def _xoay(d: Path) -> None:
    """`x.jsonl` → `x.jsonl.1`, ghi đè bản `.1` cũ. Lỗi thì BỎ QUA.

    Không ném: một phép xoay hỏng (file đang bị mở bởi `tail`, quyền, đĩa) sẽ
    chỉ làm file lớn thêm — còn ném ở đây là để nhật ký giết dịch vụ, đúng thứ
    `ghi()` đã quyết không làm.
    """
    try:
        cu_ = d.with_suffix(d.suffix + ".1")
        if cu_.exists():
            cu_.unlink()
        d.rename(cu_)
    except OSError:
        pass


def _tep(loai: str):
    f = _MO.get(loai)
    if f is not None:
        # Kiểm trần trên handle ĐANG MỞ, không `stat()` mỗi dòng: `tell()` là
        # một phép đọc con trỏ trong bộ nhớ, còn `stat()` là một lần đi đĩa —
        # trên đường nóng thì khác nhau thật.
        try:
            if f.tell() >= TRAN_BYTE:
                f.close()
                _MO.pop(loai, None)
                _xoay(duong_tep(loai))
                f = None
        except (OSError, ValueError):
            _MO.pop(loai, None)
            f = None
    if f is None:
        d = duong_goc()
        d.mkdir(parents=True, exist_ok=True)
        t = duong_tep(loai)
        # Và kiểm một lần lúc MỞ: tiến trình vừa khởi động có thể gặp một file
        # đã quá trần từ lần chạy trước, và `tell()` chưa có gì để nói.
        try:
            if t.exists() and t.stat().st_size >= TRAN_BYTE:
                _xoay(t)
        except OSError:
            pass
        # `buffering=1` (theo dòng) — `tail -f` thấy ngay. Không `fsync`: xem
        # ghi chú đầu file, nó là đường NÓNG.
        f = open(t, "a", encoding="utf-8", buffering=1)
        _MO[loai] = f
    return f


def _lot(v):
    """Lột bí mật, đệ quy. Trả về bản đã sạch — KHÔNG sửa vật gốc."""
    if isinstance(v, dict):
        return {k: (_MAT if _TEN_MAT.search(str(k)) else _lot(x))
                for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [_lot(x) for x in v]
    if isinstance(v, str):
        return _HINH_MAT.sub(_MAT, v)
    return v


def ghi(loai: str, **truong) -> None:
    """Một dòng nhật ký. KHÔNG NÉM — nhật ký hỏng không được giết việc thật.

    Đó là lựa chọn có giá: một lỗi ghi log biến mất im lặng. Đánh đổi ngược lại
    tệ hơn nhiều — đĩa đầy làm sập cả worker giữa một job đã tiêu tiền.
    """
    # Chưa `bat()` và không có `GN_LOG_DIR` ⇒ KHÔNG ghi. Xem `bat()`.
    if not _BAT and not os.environ.get(BIEN_DIR):
        return
    try:
        d = {"t": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
             "loai": loai, "pid": os.getpid(),
             **{k: _lot(v) for k, v in truong.items()}}
        _tep(loai).write(json.dumps(d, ensure_ascii=False) + "\n")
    except Exception:                                  # noqa: BLE001
        pass


class Dong:
    """Đo một quãng rồi ghi. `qua_han` tính từ `han_ms` được khai.

    Dùng:
        with nhat_ky.Dong("worker", viec=ulid, han_ms=600_000) as d:
            d.them(giai_doan="dang-goi-model")
            …

    `han_ms` là điều làm *"đo timeout"* thành đo được: không có ngưỡng khai
    trước thì một con số `ms` chỉ là một con số, và không ai nói được nó có
    chậm hay không.
    """

    def __init__(self, loai: str, *, han_ms: float | None = None, **truong):
        self.loai = loai
        self.han_ms = han_ms
        self.truong = dict(truong)
        self.t0 = 0.0

    def them(self, **truong) -> "Dong":
        self.truong.update(truong)
        return self

    def __enter__(self) -> "Dong":
        self.t0 = time.perf_counter()
        return self

    def __exit__(self, kieu, gt, tb) -> bool:
        ms = round((time.perf_counter() - self.t0) * 1000, 1)
        d = {**self.truong, "ms": ms}
        if self.han_ms is not None:
            d["han_ms"] = self.han_ms
            d["qua_han"] = ms > self.han_ms
        if kieu is not None:
            # Tên lớp + câu lỗi, KHÔNG traceback: traceback nhiều dòng phá
            # JSONL, và `str(e)` đã đủ để biết đi tìm ở đâu.
            d["loi"] = f"{kieu.__name__}: {gt}"
        ghi(self.loai, **d)
        return False        # không nuốt lỗi — việc thật vẫn phải nổ ra ngoài
