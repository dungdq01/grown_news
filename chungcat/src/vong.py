#!/usr/bin/env python3
r"""Hàng đợi việc của THỢ — Maildir. `AC-5.1` … `AC-5.5` · `M12-R6`.

`spec §5` trả ba câu `build_order` bỏ ngỏ:

    job chạy hai lần?          ULID trong tên file LÀ khoá idempotency
    thợ chết giữa chừng?       `tmp/ → new/`; đích LUÔN duy nhất nên không đè
    giới hạn thử lại?          trần 2 lần GỬI, và `lan_gui` KHÔNG BAO GIỜ reset

⚠️ Câu thứ hai KHÔNG dựa trên *"`os.replace` nguyên tử"* nữa. `FR-053 §4` đo
được mệnh đề đó **sai trên Windows**: `os.replace` gọi `MoveFileEx`, thứ không
được bảo đảm nguyên tử và *"may silently fall back to a non-atomic `CopyFile()`"*.
Cách chữa **không phải** đổi hàng đợi — mà là làm cho nhánh rủi ro **hết cửa**:
tên đích trong `new/` là `<ULID>.json`, **duy nhất theo cấu tạo**, nên phép ghi
luôn đi đường *rename-không-đè*, và fallback `CopyFile` (chỉ liên quan khi phải
THAY một file đang có) không bao giờ được chọn.

⚠️ `lan_gui` ở ĐÂY là số lần payload **RỜI KHỎI MÁY** — con số egress của
`FR-043` bậc 4. Nó KHÁC cột `lan_gui_duyet` của LÕI (số lần nháp gửi đi duyệt).
Hai số cùng tên là cách báo cáo egress bắt đầu nói dối, nên tên đã tách ở
`web/api/loi.schema.sql` (quyết định 2026-09-03).

CHỈ MỘT giai đoạn tiêu egress:

    cho · dang-doc-nguon    chạy lại từ đây: KHÔNG tốn gửi
    dang-goi-model          chạy lại từ đây: TỐN, đúng một lần
    dang-verify             KHÔNG tốn — VỚI ĐIỀU KIỆN phản hồi model đã lưu
"""

from __future__ import annotations

import json
import os
import threading
import time
from pathlib import Path

# `hong` — WO-066 (2026-09-09). Trước đó KHÔNG có nhãn cho "đã hỏng", nên một
# việc hỏng buộc phải mang một trong năm nhãn kia, và `cho` được chọn: màn đọc
# `giai_doan` ⇒ "chờ" vĩnh viễn, trong khi sự thật nằm ở nhật ký `ket: hong-la`
# — chỗ màn không đọc. Chủ dự án gặp ba lần trong một buổi.
# Vị trí hỏng giữ ở `giai_doan_hong` để `chay_lai` biết chạy lại từ đâu.
def _bay_gio() -> str:
    """Thời điểm UTC dạng ISO — sắp được bằng phép so chuỗi."""
    import datetime as _dt
    return _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="milliseconds")


GIAI_DOAN = ("cho", "dang-doc-nguon", "dang-goi-model", "dang-verify", "xong", "hong")
TRAN_GUI = 2


class TranGui(Exception):
    """Chạm trần số lần payload rời khỏi máy."""


BIEN_HANG_DOI = "CHUNGCAT_HANG_DOI"

# ── LEASE của một việc đã chiếm (WO-048 §2 · chỉ đạo 2026-09-05) ───────────
#
# `cur/` nghĩa là *"đã lấy ra xử lý"*. Trước bản này, worker chết giữa việc thì
# việc ở lại đó VĨNH VIỄN — không ai nhận lại, không ai báo, và `liet_ke()` cộng
# nó vào "đang chạy". Đo được: `cur/` 13 việc, KPI *"ĐANG CHẠY 6"*, 0 tiến trình.
#
# 30 PHÚT, và con số này là một ĐÁNH ĐỔI hai chiều phải nói ra:
#   quá NGẮN ⇒ cướp việc đang chạy thật ⇒ HAI worker gửi cho MỘT việc ⇒ tiền
#              tiêu đôi, và `M12-R6` (trần 2 lần gửi) bị lách vì mỗi worker đếm
#              riêng. Đây là chiều ĐẮT.
#   quá DÀI  ⇒ một việc chết phải chờ lâu mới nhận lại. Chỉ tốn thời gian.
# ⇒ Nghiêng về DÀI. Và `dat_giai_doan` làm NHỊP TIM (chạm `nhan_luc` mỗi lần đổi
#   giai đoạn), nên 30 phút là trần cho MỘT GIAI ĐOẠN, không cho cả việc — một
#   job ASR 2 tiếng vẫn an toàn miễn nó còn tiến triển.
HAN_TREO_GIAY = 1800

# WO-069 · TRẦN SỐ LẦN MỘT VIỆC ĐƯỢC NHẶT LẠI.
#
# `lan_gui` chỉ chặn việc đã tới bước GỬI. Một việc giết chết TIẾN TRÌNH worker
# trước đó (hết RAM lúc đọc 80 MB, bị `kill`, ffmpeg sập) KHÔNG ném ngoại lệ
# nào, nên `danh_hong` không bao giờ chạy: việc nằm lại `cur/` với lease của một
# PID đã chết, `_nhan_lai_bo_roi` nhặt lại, worker chết lại — VÔ HẠN.
# Đo 2026-09-09: nhặt lại 12 lần liên tiếp, `lan_gui` đứng nguyên 0.
# Mỗi vòng đọc lại 80 MB qua LÕI; với lối `tai_ve` thì mỗi vòng là một lần tải
# THẬT từ Internet — và lối đó khai `tieu_egress: false` nên nó không chạm
# trần gửi nào. Một vòng lặp không có cận, và nó im lặng.
TRAN_LAN_NHAN = 3



def goc_mac_dinh() -> Path:
    """Gốc Maildir — MỘT phép phân giải cho MỌI bên.

    `CHUNGCAT_HANG_DOI` thắng; không có thì `chungcat/hang-doi/` trong repo.

    Vì sao ở đây chứ không ở mỗi bên: `api.py::chay()` từng gõ
    `R / "chungcat" / "hang-doi"` cứng, trong khi `worker.py` đọc env. Hệ quả đo
    được 2026-09-04 — cửa NHẬN job vào thư mục repo, worker TÌM ở thư mục env,
    và hai nửa của một hệ im lặng không thấy nhau: `POST /job` trả 201,
    `worker --mot` trả 3 (*"hàng đợi rỗng"*), không ai báo gì.
    Đúng lớp lỗi "hai bản một thứ" mà `check_danh_muc` sinh ra để dẹp.
    """
    import os
    d = os.environ.get(BIEN_HANG_DOI)
    return Path(d) if d else Path(__file__).resolve().parent.parent.parent / "chungcat" / "hang-doi"


def con_song(pid: int) -> bool:
    """`pid` này còn chạy không. KHÔNG chắc ⇒ `True` (coi như còn giữ).

    Mặc định thận trọng có lý do một chiều: đoán nhầm "còn sống" thì việc nằm
    chờ hết lease (chậm); đoán nhầm "đã chết" thì CƯỚP một việc đang chạy —
    hai worker cùng một job, và `M12-R6` chỉ chặn được thiệt hại chứ không
    chặn được cuộc đua.

    Windows KHÔNG dùng `os.kill(pid, 0)` được: đo 2026-09-05, một pid không
    tồn tại ném `OSError [WinError 87] tham số không đúng` — cùng mã lỗi với
    một tham số thật sự sai, nên không phân biệt được "chết" với "gọi hỏng".
    `OpenProcess` + `GetExitCodeProcess` phân biệt được cả ba ca đã đo:

        pid của chính mình  → handle mở được, exit code 259 (STILL_ACTIVE)
        pid bịa 999999      → handle NULL, GetLastError 87
        pid VỪA chết        → handle mở được, exit code 0 ⇒ đã thoát

    Ca thứ ba là lý do phải đọc exit code chứ không chỉ xem handle có mở được:
    một tiến trình đã thoát vẫn còn handle cho tới khi mọi tham chiếu đóng.
    """
    if not isinstance(pid, int) or pid <= 0:
        return True
    if os.name != "nt":
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return False
        except OSError:
            return True                      # PermissionError ⇒ sống, khác quyền
        return True
    import ctypes
    k = ctypes.windll.kernel32
    h = k.OpenProcess(0x1000, False, pid)     # PROCESS_QUERY_LIMITED_INFORMATION
    if not h:
        return k.GetLastError() != 87         # 87 ⇒ pid không tồn tại
    ma = ctypes.c_ulong()
    ok = k.GetExitCodeProcess(h, ctypes.byref(ma))
    k.CloseHandle(h)
    return (ma.value == 259) if ok else True  # 259 = STILL_ACTIVE


def _doi_ten_ben_bi(nguon, dich, *, lan: int = 20, nghi: float = 0.02) -> None:
    """`os.replace` có THỬ LẠI ngắn khi Windows báo đụng handle.

    `WinError 32` (*file đang bị tiến trình khác dùng*) trên Windows KHÔNG có
    nghĩa là sai logic: chỉ cần một luồng khác đang `read_text` file việc trong
    lúc quét `cur/` là handle mở, và trên Windows một handle mở CHẶN rename —
    khác POSIX, nơi rename luôn thành công.

    Đo được (`T12-23`, 4 luồng · 8 việc): một job CHẠY XONG bị báo *"HỎNG
    (không phân loại)"* chỉ vì lúc chuyển `cur/ → done/` có bên đang đọc. Đó là
    kiểu sai tệ nhất — hệ thống nói dối về một việc nó làm ĐÚNG.

    Thử lại có TRẦN (20 lần × 20ms ≈ 0,4s) rồi mới ném: đụng handle là chuyện
    mili-giây; thử mãi thì một lỗi thật sẽ treo im lặng thay vì nổ ra.
    """
    for i in range(lan):
        try:
            os.replace(nguon, dich)
            return
        except PermissionError:
            if i == lan - 1:
                raise
            time.sleep(nghi)


HAN_DAU_GIAY = 120          # dấu chiếm cũ hơn ngần này ⇒ chủ đã chết giữa chừng


def _lay_dau(gach: Path) -> bool:
    """Lấy dấu chiếm bằng `O_CREAT|O_EXCL`. `False` ⇒ người khác đang giữ.

    MỘT primitive cho CẢ HAI đường chiếm (`new/` và nhặt-lại `cur/`), và lấy
    TRƯỚC mọi thay đổi trạng thái. Hai primitive khác nhau thì không loại trừ
    được nhau — đo được: `rename` thắng ở `new/` rồi mới tạo dấu, và giữa hai
    bước đó một luồng nhặt-lại chen vào chiếm cùng việc. Kết quả là hai luồng
    ôm một job, lộ ra ở `WinError 2` lúc đóng (bên kia đã chuyển file đi rồi).

    Dấu QUÁ HẠN thì gỡ: chủ chết giữa lúc giữ dấu sẽ khoá việc vĩnh viễn, mà
    một khoá không bao giờ nhả thì tệ hơn một cuộc đua hiếm.
    """
    try:
        os.close(os.open(gach, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
        return True
    except FileExistsError:
        try:
            if time.time() - gach.stat().st_mtime > HAN_DAU_GIAY:
                gach.unlink()
                os.close(os.open(gach, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
                return True
        except OSError:
            pass
        return False
    except OSError:
        return False


class HangDoi:
    """Maildir ba thư mục. `tmp/` là nơi ghi dở; `new/` chỉ chứa file HOÀN CHỈNH."""

    def __init__(self, goc):
        self.goc = Path(goc)
        # `rac` — WO-068. Việc HỎNG rời danh sách chính nhưng KHÔNG mất:
        # nó giữ nguyên file tiến độ, nên "chạy lại từ chỗ hỏng" vẫn làm được
        # từ trong thùng rác. Chủ dự án 2026-09-07 đã bác lối "ẩn": ẩn giữ
        # nguyên đà phình, chỉ dời khỏi tầm mắt. Đây là DỜI THẬT.
        for t in ("tmp", "new", "cur", "done", "rac"):
            (self.goc / t).mkdir(parents=True, exist_ok=True)

    # ── đường ghi ────────────────────────────────────────────────────────
    def _duong(self, ulid: str) -> Path:
        """Đường của một việc — tìm qua CẢ BỐN thư mục.

        `T12-13`: worker claim job bằng `rename` sang `cur/`, và xong thì sang
        `done/`. Bản đầu của hàm này trỏ cứng vào `new/`, nên `doc()` của một
        việc đang chạy ném `FileNotFoundError` — tức mọi hàm ở dưới (đếm egress,
        đổi giai đoạn) chết ngay sau nhịp claim đầu tiên.

        `new/` trước: đó là chỗ file mới nạp, và tra ở đó rẻ nhất.
        """
        for t in ("new", "cur", "done", "rac"):
            d = self.goc / t / f"{ulid}.json"
            if d.exists():
                return d
        return self.goc / "new" / f"{ulid}.json"

    def _ghi_nguyen_tu(self, ulid: str, viec: dict, *, den=None) -> None:
        """Ghi qua `tmp/` rồi chuyển. `fsync` TRƯỚC khi chuyển — không có nó thì
        `new/` có thể nhận một file mà nội dung còn trong buffer."""
        # Tên file tạm phải DUY NHẤT cho từng lần ghi (`T12-23`).
        #
        # Bản trước dùng `tmp/<ulid>.json` — một tên CHUNG cho mọi lần ghi của
        # cùng một việc. Với một worker tuần tự thì không bao giờ trùng. Với
        # nhiều luồng/tiến trình thì hai bên ghi cùng lúc vào đúng một file
        # tạm, và trên Windows nó nổ `WinError 32` (file đang bị tiến trình
        # khác dùng) ngay giữa một phép được đặt tên là "ghi NGUYÊN TỬ".
        #
        # Một file tạm dùng chung thì phép ghi không còn nguyên tử: cái làm nên
        # tính nguyên tử là `os.replace` từ một bản nháp KHÔNG ai khác chạm.
        t = (self.goc / "tmp" /
             f"{ulid}.{os.getpid()}.{threading.get_ident()}.tmp")
        with open(t, "w", encoding="utf-8") as f:
            json.dump(viec, f, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        # Ghi VỀ ĐÚNG CHỖ file đang nằm, không luôn về `new/`: một việc đang
        # trong `cur/` mà bị ghi về `new/` là một việc xuất hiện HAI LẦN, và
        # worker thứ hai nhặt bản ở `new/`.
        _doi_ten_ben_bi(t, Path(den) if den else self._duong(ulid))

    def nap(self, ulid: str, payload: dict) -> tuple[str, bool]:
        """Nạp một việc. Trả `(ulid, da_co)`. Cùng ULID ⇒ KHÔNG việc thứ hai.

        `da_co=True` nghĩa *"việc này đã có, tôi không tạo gì"* — `FR-071`.

        Vì sao trả thêm một cờ chứ không để cửa tự tra: một hàm `da_co(ulid)`
        riêng là hai lời gọi cho một câu hỏi, và giữa hai lời gọi có một khoảng
        để trạng thái đổi — đúng lớp lỗi kiểm-rồi-mới-làm mà `_ghi_nguyen_tu`
        được viết ra để tránh. Sự thật *"tôi vừa tạo hay không"* chỉ bên GHI
        biết chắc, nên nó phải đi cùng phép ghi.

        Phép idempotent KHÔNG đổi một chút nào (`AC-5.1`): payload lần hai vẫn
        bị bỏ, hàng đợi vẫn đúng một việc. Đổi là thứ hàm này NÓI, không phải
        thứ nó LÀM.
        """
        if self._duong(ulid).exists():
            return ulid, True                # AC-5.1 — idempotent, im lặng
        self._ghi_nguyen_tu(ulid, {
            "ulid": ulid,
            "payload": payload,
            "giai_doan": GIAI_DOAN[0],
            "lan_gui": 0,
            # WO-081 · THỜI ĐIỂM TẠO, nằm TRONG file.
            #
            # Chú thích cũ của `liet_ke` lập luận rất kỹ rằng không được sắp
            # theo `mtime` — `git checkout`, một lần copy thư mục hay một lần
            # `touch` đều đổi nó. Lập luận ấy ĐÚNG. Nhưng nó kết luận "vậy sắp
            # theo ULID, vì ULID mang thời điểm trong chính nó" — và id ở đây
            # là `uuid.uuid4().hex` (`api.py`), NGẪU NHIÊN hoàn toàn.
            #
            # `tao_luc` là thứ chú thích ấy thật sự muốn: một thời điểm ở trong
            # file, không thao tác tệp nào đổi được.
            "tao_luc": _bay_gio(),
        })
        return ulid, False

    def doc(self, ulid: str) -> dict:
        return json.loads(self._duong(ulid).read_text(encoding="utf-8"))

    # Trần cứng của MỘT lần liệt kê. Không phải tuỳ chọn: `GET /viec` không
    # có trần thì một kho 10k việc trả 10k bản ghi trong một response, và
    # người đầu tiên gặp điều đó là người dùng, không phải cổng.
    TRAN_LIET_KE = 200

    def liet_ke(self, *, giai_doan: str | None = None, n: int = 50,
                rac: bool = False) -> dict:
        """Danh sách việc, MỚI NHẤT TRƯỚC.

        Sắp theo **`tao_luc` giảm dần**, KHÔNG theo `mtime` và KHÔNG theo id.

        `mtime` thì `git checkout`, một lần copy thư mục hay một lần `touch`
        đều đổi được — thứ tự hiển thị không được phụ thuộc thao tác tệp.

        ⚠️ Bản trước sắp theo **id**, với lý lẽ *"ULID mang thời điểm trong
        chính nó"*. Lý lẽ đúng, tiền đề sai: id ở đây là `uuid.uuid4().hex`
        (`api.py`), **ngẫu nhiên hoàn toàn**. Hệ quả đo 2026-09-09 — API trả 18
        việc, màn vẽ 8 ô đầu, và một việc VỪA CHẠY XONG không lên màn vì id nó
        bắt đầu bằng `9`, xếp dưới `a…`–`d…`.

        Tham số tên `giai_doan`, KHÔNG `trang_thai`: `trang_thai` là từ vựng
        của **trạng thái DUYỆT** (`review_status`), và `M12-R2` cấm M12 chạm
        vào nó — cổng `check_khong_tu_duyet` quét mọi chuỗi trạng thái trong
        `chungcat/src/**` và bắt đúng chỗ đó. Đây là phép lọc theo **giai đoạn
        VIỆC**, một thứ khác hoàn toàn, nên nó phải mang tên khác.

        Đọc `new/` VÀ `cur/`: `cur/` là việc đã lấy ra xử lý, và một màn quản lý
        mà không thấy việc đang chạy thì nó không phải màn quản lý.
        """
        ds = []
        # `done` NẰM TRONG danh sách. Đo được 2026-09-05 (ảnh chụp chủ dự án):
        # chưng cất một `.md` chạy XONG rồi BIẾN MẤT khỏi `/chung-cat/`, tab của
        # bản ghi nói *"chưa có việc chưng cất nào"*, và ô KPI `XONG` đứng ở 0
        # trong khi `done/` có 20 việc.
        #
        # Trạng thái `xong` là trạng thái người dùng quan tâm NHẤT — nó là chỗ
        # có kết quả để đọc. Một màn quản lý ẩn nó đi thì không phải màn quản lý.
        #
        # `done/` lớn mãi, nên đọc theo TÊN GIẢM DẦN và dừng ở `TRAN_LIET_KE`:
        # ULID mang thời điểm, nên tên giảm dần = mới nhất trước, và ta không
        # phải đọc 10.000 file để hiện 50 dòng.
        for t in ("new", "cur"):
            for f in (self.goc / t).glob("*.json"):
                # `*.phan-hoi.json` nằm CẠNH job và cũng khớp `*.json`. Không
                # loại nó thì mỗi việc đã gọi model đếm thành HAI, và badge
                # "N việc" nói dối đúng gấp đôi ở chỗ dễ tin nhất.
                if f.name.endswith(".phan-hoi.json"):
                    continue
                try:
                    v = json.loads(f.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    # File dở dang trong `cur/` không được làm sập cả danh sách.
                    # Đếm riêng thì tốt hơn, nhưng đếm ở đây là đoán: file dở có
                    # thể là việc đang ghi. Bỏ qua và để `tong` nói ít hơn thật.
                    continue
                # `dang_giu` — việc này CÓ AI ĐANG GIỮ không. Thêm cột chứ
                # không sửa `giai_doan`: `giai_doan` là trạng thái công việc
                # (*"đã tới đâu"*), `dang_giu` là trạng thái vận hành (*"có ai
                # đang làm"*). Nhập hai thứ đó vào một cột là mất một trong hai,
                # và cái mất sẽ là cái người ta cần lúc đang tìm lỗi.
                v["dang_giu"] = t == "cur" and self.dang_lam(v)
                ds.append(v)
        # `done/`: chỉ đọc phần MỚI NHẤT, đủ để lấp danh sách.
        d_done = sorted((self.goc / "done").glob("*.json"),
                        key=lambda x: x.name, reverse=True)
        for f in d_done:
            if f.name.endswith(".phan-hoi.json"):
                continue
            if len(ds) >= self.TRAN_LIET_KE * 2:
                break
            try:
                v = json.loads(f.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            # Xong rồi thì KHÔNG ai giữ — dù `nhan_luc` còn tươi. Không có dòng
            # này thì một việc vừa xong bị KPI đếm là "đang chạy" thêm 30 phút.
            v["dang_giu"] = False
            ds.append(v)
        if giai_doan:
            ds = [v for v in ds if v.get("giai_doan") == giai_doan]
        # `rac/` — WO-068. MẶC ĐỊNH KHÔNG kể: đó là cả điểm của thùng rác.
        # `rac=True` thì kể ĐÚNG nó, không trộn — một màn thùng rác trộn việc
        # sống vào là một màn không ai dám bấm xoá.
        if rac:
            ds = []
            for f in sorted((self.goc / "rac").glob("*.json"),
                            key=lambda x: x.name, reverse=True):
                if f.name.endswith(".phan-hoi.json"):
                    continue
                try:
                    v = json.loads(f.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                v["dang_giu"] = False
                ds.append(v)
        # MỚI NHẤT TRƯỚC theo `tao_luc`. Việc CŨ chưa có trường ⇒ rơi về id,
        # không vỡ và không biến mất — chúng chỉ xếp cuối, đúng chỗ của thứ
        # không khai được mình sinh lúc nào.
        ds.sort(key=lambda v: (str(v.get("tao_luc") or ""),
                               str(v.get("ulid", ""))), reverse=True)
        gioi = max(1, min(int(n), self.TRAN_LIET_KE))
        return {"dong": ds[:gioi], "tong": len(ds), "tran": self.TRAN_LIET_KE}

    # ── CLAIM · giai đoạn · đóng việc (T12-13) ───────────────────────────
    def nhan_viec(self) -> str | None:
        """Nhặt một việc từ `new/` và CHIẾM nó bằng `rename` sang `cur/`.

        `rename` là phép chiếm nguyên tử của Maildir: hai worker cùng gọi thì
        đúng một cái thành công, cái kia nhận `OSError` và **đi tiếp** — không
        ném, vì thua một lượt chiếm không phải lỗi.

        Cũ nhất trước, theo **`tao_luc` tăng dần**. Không dùng `mtime` (thao
        tác tệp đổi được) và không dùng id — cùng tiền đề sai đã sửa ở
        `liet_ke`: id là `uuid4`, nên "nhặt theo id tăng dần" là nhặt NGẪU
        NHIÊN. Ở đây hậu quả nhẹ hơn màn hình (việc nào cũng sẽ chạy), nhưng
        nó phá hàng đợi FIFO: một việc xếp trước có thể chờ sau mọi việc xếp
        sau nó.
        """
        def _cu_nhat(x):
            try:
                return (json.loads(x.read_text(encoding="utf-8")).get("tao_luc")
                        or "", x.name)
            except (OSError, json.JSONDecodeError):
                return ("", x.name)

        for f in sorted((self.goc / "new").glob("*.json"), key=_cu_nhat):
            dich = self.goc / "cur" / f.name
            gach = dich.with_suffix(".dang-nhan")
            # DẤU TRƯỚC, rename SAU. Thứ tự này là cả phép chiếm: ai cầm dấu
            # thì mới được đụng vào việc, nên đường `new/` và đường nhặt-lại
            # loại trừ được nhau.
            if not _lay_dau(gach):
                continue          # người khác đang chiếm việc này
            try:
                try:
                    os.rename(f, dich)
                except OSError:
                    continue      # thua lượt chiếm — không phải lỗi
                self._dong_dau_nhan(f.stem)
                return f.stem
            finally:
                try:
                    gach.unlink()
                except OSError:
                    pass
        return self._nhan_lai_bo_roi()

    def _dong_dau_nhan(self, ulid: str) -> None:
        """Đóng dấu `nhan_luc` + `nhan_pid` — nhịp tim của lease.

        `nhan_pid` chỉ để ĐỌC lúc tìm lỗi ("ai đang giữ?"), KHÔNG dùng làm phép
        kiểm còn-sống: pid được hệ điều hành cấp lại, nên một pid trùng của một
        tiến trình khác sẽ nói "còn sống" cho một việc đã chết. Thời gian là
        thứ duy nhất không nói dối ở đây.
        """
        d = self._duong(ulid)
        try:
            v = json.loads(d.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        v["nhan_luc"] = time.time()
        v["nhan_pid"] = os.getpid()
        self._ghi_nguyen_tu(ulid, v, den=d)

    def _qua_tran_nhan(self, ulid: str) -> bool:
        """Tăng `so_lan_nhan`; quá `TRAN_LAN_NHAN` ⇒ đánh hỏng và trả `True`.

        Chỉ gọi ở đường NHẶT LẠI (`cur/`), không ở đường `new/`: lần chiếm đầu
        tiên của một việc mới không phải một lần *nhặt lại*, và tính nó vào
        trần là cắt mất một lượt chạy hợp lệ.
        """
        try:
            v = self.doc(ulid)
        except (FileNotFoundError, json.JSONDecodeError):
            return False
        n = int(v.get("so_lan_nhan") or 0) + 1
        v["so_lan_nhan"] = n
        self._ghi_nguyen_tu(ulid, v)
        if n > TRAN_LAN_NHAN:
            self.danh_hong(
                ulid, v.get("giai_doan") or "cho",
                f"Bị nhặt lại {n} lần mà chưa lần nào chạy xong — worker chết "
                f"giữa chừng (hết RAM, bị kill, hay công cụ ngoài sập) chứ không "
                f"phải một lỗi bắt được. Dừng để khỏi quay vòng; xem "
                f"`log/worker-*.out` rồi bấm chạy lại nếu đã sửa nguyên nhân.")
            return True
        return False


    def con_giu(self, v: dict) -> bool:
        """Việc này có đang THẬT SỰ được giữ không.

        Ở `new/` ⇒ không (chưa ai chiếm). Ở `cur/` mà `nhan_luc` quá `HAN_TREO`
        ⇒ không (bỏ rơi). Vắng `nhan_luc` ⇒ **không** — đó là việc đã chiếm bởi
        bản worker CŨ, trước khi có lease; coi nó là bỏ rơi mới đúng, vì không
        có bản worker nào còn sống mà không đóng dấu.
        """
        t = v.get("nhan_luc")
        if not isinstance(t, (int, float)):
            return False
        if (time.time() - t) > HAN_TREO_GIAY:
            return False
        # PID CHẾT là bằng chứng MẠNH HƠN đồng hồ (`T12-23`).
        #
        # Với một worker, chờ hết `HAN_TREO_GIAY` chỉ tốn thời gian. Với 2×4
        # luồng thì một tiến trình chết lúc tám việc đang chạy KHOÁ CẢ TÁM
        # trong nửa tiếng — và người dùng nhìn màn thấy tám việc "đang chạy"
        # mà không có gì nhúc nhích.
        #
        # `os.kill(pid, 0)` hỏi hệ điều hành *"pid này còn sống không"* mà
        # không gửi tín hiệu nào. Vắng `nhan_pid` ⇒ giữ nguyên phép cũ theo
        # đồng hồ: không biết chủ là ai thì không được kết luận chủ đã chết.
        pid = v.get("nhan_pid")
        if isinstance(pid, int) and pid > 0 and not con_song(pid):
            return False                     # chủ đã chết ⇒ bỏ rơi
        return True

    def dang_lam(self, v: dict) -> bool:
        """Có ai đang THẬT SỰ làm việc này — câu của MÀN QUẢN LÝ.

        KHÁC `con_giu`, và hai hàm chứ không một vì chúng trả lời hai câu:

          `con_giu`  — *"có ai đang GIỮ?"* → an toàn khi CHIẾM. Chỉ xét lease.
                       Một việc vừa chiếm còn ở giai đoạn `cho` (chưa kịp sang
                       `dang-*`) vẫn phải tính là ĐANG GIỮ, không thì worker thứ
                       hai cướp nó ngay — hai lần gửi cho một việc.
          `dang_lam` — *"có ai đang LÀM?"* → con số trên màn. Đòi giai đoạn
                       `dang-*`: `cho` nghĩa là đang chờ, và gọi nó là "đang
                       chạy" là đúng con số chủ dự án bắt được trên ảnh chụp.

        Gộp hai câu vào một hàm là chọn một trong hai để nói sai. Bản trước tôi
        gộp, rồi phải chọn: siết thì cổng "không cướp việc đang chạy" đỏ, nới
        thì màn nói dối.
        """
        return str(v.get("giai_doan", "")).startswith("dang-") and self.con_giu(v)

    def _nhan_lai_bo_roi(self) -> str | None:
        """Nhận lại MỘT việc bỏ rơi trong `cur/`. `None` nếu không có.

        Chạy SAU khi `new/` đã cạn: việc mới quan trọng hơn việc đã chết, và
        đảo thứ tự là để một hàng đợi đầy xác cũ chặn việc vừa nhận.

        Không `rename` — việc đã ở `cur/` rồi. Phép chiếm ở đây là ghi
        `nhan_luc` mới, và nó KHÔNG nguyên tử theo nghĩa của `rename`: hai
        worker cùng đọc một việc quá hạn thì cả hai có thể ghi. Nói ra thay vì
        che: cửa sổ đua là một lần đọc-ghi file (~ms) trên một việc đã đứng ≥30
        phút, nên xác suất thực tế rất thấp — còn phép chặn thật là `M12-R6`
        (trần 2 lần gửi, đếm trong CHÍNH file việc), nó chặn thiệt hại chứ
        không chặn cuộc đua.
        """
        for f in sorted((self.goc / "cur").glob("*.json"), key=lambda x: x.name):
            if f.name.endswith(".phan-hoi.json"):
                continue
            try:
                v = json.loads(f.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if self.con_giu(v):
                continue
            # WO-066 · việc `hong` KHÔNG tự chạy lại. Nó ở `cur/` để NGƯỜI bấm
            # `chay_lai`; để worker nhặt lại sau `HAN_TREO` là biến một phanh cố
            # ý thành một vòng thử lại vô hạn, mỗi vòng có hoá đơn.
            if v.get("giai_doan") == "hong":
                continue
            gach = f.with_suffix(".dang-nhan")
            # CHIẾM bằng CÙNG dấu mà đường `new/` dùng (`T12-23 AC5d`).
            #
            # Bản trước nói thẳng rằng phép chiếm ở đây KHÔNG nguyên tử và
            # chấp nhận cửa sổ đua ~ms trên một việc đã đứng 30 phút. Lời miễn
            # trừ đó đúng với MỘT worker; nó không còn đúng với 2×4 luồng cùng
            # quét `cur/` mỗi vòng.
            if not _lay_dau(gach):
                continue
            try:
                # ĐỌC LẠI sau khi cầm dấu: giữa lần đọc trên và lúc này, người
                # cầm dấu trước có thể vừa nhả và đã đóng dấu lease mới.
                try:
                    v = json.loads(f.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                if self.con_giu(v):
                    continue
                # WO-069 · đếm TRƯỚC khi giao lại. Việc nào chết tiến trình
                # đủ số lần thì vào rác, không quay vòng nữa.
                if self._qua_tran_nhan(f.stem):
                    continue
                self._dong_dau_nhan(f.stem)
            finally:
                try:
                    gach.unlink()
                except OSError:
                    pass
            return f.stem
        return None

    def dat_giai_doan(self, ulid: str, giai_doan: str) -> dict:
        """Ghi giai đoạn hiện tại. KHÔNG chạm `lan_gui` (`AC-5.5`).

        NHẬT KÝ ở ĐÂY, không ở từng chỗ gọi (chỉ đạo 2026-09-05). Đây là phễu
        DUY NHẤT mọi giai đoạn của mọi loại việc đi qua, nên một dòng log ở đây
        đo được *"giai đoạn nào chậm"* cho cả `chung-cat-mot-nguon` lẫn
        `sinh-transcript` — và một loại việc thêm sau này tự có mặt trong số
        liệu, không phải nhớ đi thêm một lời gọi.

        `ms` là quãng của giai đoạn TRƯỚC, không phải của lời gọi này: lúc gọi
        `dat_giai_doan("dang-verify")` thì việc vừa xong `dang-goi-model`, và
        đó chính là con số cần.
        """
        if giai_doan not in GIAI_DOAN:
            raise ValueError(f"giai đoạn lạ: {giai_doan}")
        d = self._duong(ulid)
        v = json.loads(d.read_text(encoding="utf-8"))
        truoc = v.get("giai_doan")
        v["giai_doan"] = giai_doan
        # NHỊP TIM — nhưng CHỈ khi việc TIẾN TRIỂN.
        #
        # `dang-*` là đang làm ⇒ nhịp tim, để `HAN_TREO` là trần cho MỘT GIAI
        # ĐOẠN chứ không cho cả việc (một job ASR 2 tiếng vẫn an toàn).
        #
        # `cho` · `dung` · `xong` là THẢ TAY: worker đã bỏ (hỏng, reset) hoặc
        # đã xong. Không ai đang làm nữa ⇒ XOÁ lease.
        #
        # Đo được 2026-09-05 (ảnh chụp chủ dự án): bản đầu tôi làm tươi lease ở
        # MỌI lần đổi giai đoạn, nên một việc hỏng-reset-về-`cho` mang lease
        # tươi vĩnh viễn. Thẻ hiện chip `cho` trong khi KPI đếm nó là *"đang
        # chạy"* — hai con số của một việc nói hai điều, và người đọc thấy
        # *"đang chạy 3 · chờ 0"* bên trên ba cái thẻ `cho`.
        if str(giai_doan).startswith("dang-"):
            v["nhan_luc"] = time.time()
        # KHÔNG xoá lease ở nhánh còn lại — chỉ THÔI làm tươi.
        #
        # Bản đầu tôi xoá. Đo được ngay: `check_worker_song_song` đỏ với **24
        # lượt chiếm cho 5 job**. Worker gặp một `loai` không ai chạy được thì
        # thả việc về `cho`; lease bị xoá ⇒ việc thành "bỏ rơi" ngay lập tức ⇒
        # vòng sau nhặt lại ⇒ vòng lặp nóng, đốt CPU và không tiến triển.
        #
        # Không cần xoá nữa: `dang_lam()` đã đòi giai đoạn `dang-*`, nên MÀN
        # không còn gọi một việc `cho` là "đang chạy" dù lease còn. Lease cũ chỉ
        # còn một việc: giữ nhịp cho `HAN_TREO`, để một việc vừa thả chờ hết hạn
        # rồi mới được nhặt lại — đúng thứ chặn vòng lặp nóng.
        self._ghi_nguyen_tu(ulid, v, den=d)
        self._ghi_moc(ulid, truoc, giai_doan)
        return v

    # Mốc thời gian của giai đoạn đang chạy, theo ULID. Trong BỘ NHỚ, không
    # trong file việc: file việc là hợp đồng với LÕI (`/viec` trả nguyên nó),
    # và nhồi số đo vận hành vào đó là đổi hợp đồng để tiện cho nhật ký.
    _moc: dict = {}

    def _ghi_moc(self, ulid: str, truoc, sau: str) -> None:
        import time
        try:
            import nhat_ky
        except ImportError:
            return          # nhật ký là thứ thêm vào; vắng nó việc vẫn chạy
        bay = time.perf_counter()
        t0 = self._moc.get(ulid)
        self._moc[ulid] = bay
        nhat_ky.ghi(
            "worker", viec=ulid, giai_doan=truoc or "(bắt đầu)", sang=sau,
            ms=round((bay - t0) * 1000, 1) if t0 else 0.0,
            # `han_ms` cho `qua_han` có nghĩa. 10 phút: một lời gọi model dài
            # nhất đo được là ~2 phút, nên 10 phút là *"chắc chắn treo"* chứ
            # không phải *"hơi chậm"*. Không cưỡng chế gì — chỉ để nhật ký nói.
            han_ms=600_000,
            qua_han=bool(t0 and (bay - t0) * 1000 > 600_000))

    def ghi_ket_qua(self, ulid: str, ket_qua: dict) -> None:
        """Con trỏ tới KẾT QUẢ của việc. Ghi TRƯỚC `dong_viec`.

        Không ghi kết quả VÀO đây — chỉ con trỏ. Bản nháp sống ở bảng của LÕI
        (`M12-R2`: M12 không sở hữu trạng thái duyệt), và nhân đôi nội dung vào
        file việc là hai bản của một thứ, rồi một bản mục.
        """
        d = self._duong(ulid)
        try:
            x = json.loads(d.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        x["ket_qua"] = ket_qua
        self._ghi_nguyen_tu(ulid, x, den=d)

    # ── TIẾN ĐỘ transcript từng phần (T12-19) ────────────────────────────
    #
    # Chỉ đạo: *"nó sinh chữ tới đâu thì show tới đó"*. `asr` đã checkpoint
    # theo block; ba hàm dưới đây chỉ mở đường ĐỌC cho cue đã sinh.
    #
    # File nằm CẠNH job (`<ulid>.tien-do.vtt`), cùng khuôn `<ulid>.phan-hoi.json`:
    # nó đi theo job khi job chuyển thư mục, và nó chết cùng job.

    def duong_tien_do(self, ulid: str) -> Path:
        """Đường file tiến độ — CẠNH job, tìm ở cùng ba thư mục."""
        d = self._duong(ulid)
        return d.parent / f"{ulid}.tien-do.vtt"

    def ghi_tien_do(self, ulid: str, cue: list) -> None:
        """Ghi NGUYÊN TỬ bản VTT của phần đã phiên âm. GHI ĐÈ, không nối.

        Nguyên tử vì lý do rất cụ thể: người đang NHÌN màn hình trong lúc file
        này được ghi lại mỗi block. Ghi thẳng vào file đích thì có một khoảnh
        khắc nó chỉ có nửa nội dung, và FE đọc đúng lúc đó sẽ render nửa câu
        rồi ném. `os.replace` không có khoảnh khắc ấy.

        GHI ĐÈ chứ không nối đuôi: `phien_am` trả TOÀN BỘ cue từ đầu tới block
        vừa xong (nó bỏ qua block cũ bằng `moc_bat_dau`), nên nối đuôi là nhân
        đôi cue sau mỗi lần resume.

        Lỗi ⇒ BỎ QUA. Tiến độ là thứ để NHÌN; làm chết một job đã tiêu tiền vì
        không ghi được một file hiển thị là đánh đổi sai chiều.
        """
        try:
            import vtt as _vtt
            noi = _vtt.dung(cue)
            d = self.duong_tien_do(ulid)
            t = self.goc / "tmp" / f"{ulid}.tien-do.vtt"
            t.write_text(noi, encoding="utf-8")
            _doi_ten_ben_bi(t, d)
        except Exception:                                  # noqa: BLE001
            pass

    def ghi_tien_do_tai(self, ulid: str, d: dict) -> None:
        """Ghi NGUYÊN TỬ tiến độ TẢI FILE (phần trăm · cỡ · tốc độ).

        Khác `ghi_tien_do` (VTT của phiên âm) ở chỗ nó ghi một bản ghi SỐ, và
        khác ở nhịp: yt-dlp phát tiến độ vài lần một giây, còn ASR phát mỗi
        block. Chung nhau đúng hai điều, và cả hai đều là lý do có mặt của
        hàm này chứ không phải trang trí:

          NGUYÊN TỬ — người đang NHÌN màn trong lúc file bị ghi lại. Ghi thẳng
          vào đích thì có một khoảnh khắc file chỉ có nửa nội dung, và FE đọc
          đúng lúc ấy sẽ ném.

          LỖI GHI KHÔNG GIẾT JOB — tiến độ là thứ để NHÌN. Làm chết một job đã
          tiêu băng thông vì không ghi nổi một file hiển thị là đánh đổi sai
          chiều.
        """
        try:
            duong = self.duong_tien_do(ulid)
            duong.parent.mkdir(parents=True, exist_ok=True)
            tam = duong.with_suffix(duong.suffix + f".{os.getpid()}.tam")
            tam.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
            os.replace(tam, duong)
        except Exception:                                # noqa: BLE001
            pass

    def doc_tien_do(self, ulid: str) -> dict | None:
        """`{cue_xong, giay_xong, vtt_tung_phan}` — `None` khi chưa có gì.

        `vtt_tung_phan` cắt trần 64 KB CUỐI: đủ để hiện, và không phình phản
        hồi của `/viec/<id>` lên vài MB cho một video dài.
        """
        d = self.duong_tien_do(ulid)
        try:
            noi = d.read_text(encoding="utf-8")
        except OSError:
            return None
        # HAI hình dạng đi chung một file: VTT (phiên âm, `T12-19`) và JSON
        # (tải video, `T12-27`). Nhận ra bằng NỘI DUNG chứ không bằng tên
        # việc: hàm này không biết việc nào gọi nó, và đoán theo tên là thêm
        # một chỗ để lệch.
        if noi.lstrip().startswith("{"):
            try:
                return json.loads(noi)
            except Exception:                              # noqa: BLE001
                return None
        try:
            import vtt as _vtt
            cue = _vtt.doc_cue(noi)
        except Exception:                                  # noqa: BLE001
            cue = []
        return {
            "cue_xong": len(cue),
            "giay_xong": float(cue[-1]["den"]) if cue else 0.0,
            "vtt_tung_phan": noi if len(noi) <= 65536 else noi[-65536:],
        }

    def dong_viec(self, ulid: str) -> Path:
        """Chuyển việc sang `done/`. Giai đoạn cuối ghi TRƯỚC khi chuyển —
        đảo lại là để một file ở `done/` mà giai đoạn còn dở."""
        # `"xong"` bằng TÊN, không `GIAI_DOAN[-1]`. WO-066 nối `hong` vào cuối
        # tuple và mọi việc THÀNH CÔNG lập tức được đánh "hong" — không một
        # cổng nào nói vì sao, vì `loi` rỗng. Một vị trí trong tuple không phải
        # một ý nghĩa; đây là chỗ nó đã nói dối một lần.
        self.dat_giai_doan(ulid, "xong")
        # Phản hồi model đi THEO job. Đo được: chuyển mình file job thì
        # `doc_phan_hoi` nói KHÔNG CÓ cho một việc vừa chạy xong, và
        # `AC-5.4` (chạy lại không gọi model) mất chỗ dựa.
        ph = self._duong_phan_hoi(ulid)
        td = self.duong_tien_do(ulid)
        d = self._duong(ulid)
        dich = self.goc / "done" / f"{ulid}.json"
        # Chính chỗ này nổ `WinError 32` trong phép đo 4 luồng: một job CHẠY
        # XONG bị báo HỎNG vì có bên đang đọc file lúc chuyển sang `done/`.
        _doi_ten_ben_bi(d, dich)
        if ph.exists():
            _doi_ten_ben_bi(ph, self.goc / "done" / ph.name)
        # DỌN file tiến độ: bản chính đã thành hiện vật `.vtt` trong kho. Giữ
        # thêm một bản dở là giữ hai nguồn cho một thứ, và bản dở là bản sẽ bị
        # đọc nhầm.
        try:
            td.unlink()
        except OSError:
            pass
        return dich

    # ── bộ đếm EGRESS ────────────────────────────────────────────────────
    def ghi_nhan_gui(self, ulid: str) -> int:
        """Đếm MỘT lần payload rời máy. Gọi ở đúng chỗ `egress.gui()` được gọi.

        Trần là trần cho **vòng lặp TỰ ĐỘNG**, không phải quota của người: người
        thật sự cần gửi lần thứ ba thì tạo **job mới** — ULID mới, log riêng, nên
        con số egress vẫn ĐÚNG. Máy không được tự quyết gửi lần thứ ba.
        """
        v = self.doc(ulid)
        if v["lan_gui"] >= TRAN_GUI:
            raise TranGui(
                f"`lan_gui` đã {v['lan_gui']}/{TRAN_GUI} — không gửi nữa. Cần gửi "
                f"thêm thì tạo JOB MỚI (ULID mới, log riêng), đừng nới trần.")
        v["lan_gui"] += 1
        self._ghi_nguyen_tu(ulid, v)
        return v["lan_gui"]

    def chay_lai(self, ulid: str, *, tu_giai_doan: str) -> dict:
        """Đặt lại giai đoạn. **KHÔNG** chạm `lan_gui` — đó là cả luật (`AC-5.5`).

        Reset bộ đếm ở đây thì người bấm mười lần là tài liệu đi ra mười lần, và
        trần thành trang trí — đúng thứ `M12-R6` sinh ra để chặn.
        """
        if tu_giai_doan not in GIAI_DOAN:
            raise ValueError(f"giai đoạn lạ: {tu_giai_doan}")
        v = self.doc(ulid)
        # "Chạy lại TỪ ĐẦU" CÓ gửi lại. Chạm trần thì phải TỪ CHỐI kèm lý do,
        # không im lặng không làm gì — người bấm phải biết vì sao không có gì xảy ra.
        if tu_giai_doan in ("cho", "dang-doc-nguon", "dang-goi-model") \
           and v["lan_gui"] >= TRAN_GUI:
            raise TranGui(
                f"chạy lại từ `{tu_giai_doan}` sẽ GỬI LẠI, mà `lan_gui` đã "
                f"{v['lan_gui']}/{TRAN_GUI}. Tạo job mới nếu thật sự cần.")
        v["giai_doan"] = tu_giai_doan
        # Chạy lại là RỜI trạng thái hỏng: xoá vết để màn không còn hiện lý do cũ
        # cạnh một việc đang chạy.
        v.pop("giai_doan_hong", None)
        v.pop("loi", None)
        # XOÁ LEASE. PID worker cũ thường CÒN SỐNG (nó chỉ hỏng một việc, không
        # chết), nên `con_giu` sẽ nói "đang giữ" và không ai nhặt việc này
        # trong `HAN_TREO`. Chạy lại mà không ai nhặt là một nút bấm không làm gì.
        v.pop("nhan_luc", None)
        v.pop("nhan_pid", None)
        self._ghi_nguyen_tu(ulid, v)
        # RA KHỎI THÙNG RÁC: việc sắp chạy không được nằm ở ngăn `rac/`, và
        # `nhan_viec` chỉ quét `new/`+`cur/`.
        self._doi_ngan(ulid, "cur")
        return self.doc(ulid)

    def danh_hong(self, ulid: str, giai_doan_hong: str, loi: str) -> dict:
        """Đánh dấu việc HỎNG: `giai_doan = "hong"`, giữ chỗ hỏng + lý do.

        KHÔNG đặt lại `cho`: `cho` nghĩa là *sắp chạy*, và một việc hỏng mang
        nhãn ấy là một câu nói dối mà màn tin. Việc ở lại `cur/` để `chay_lai`
        nhặt bằng `giai_doan_hong`; nó KHÔNG được worker tự nhặt lại.
        """
        v = self.dat_giai_doan(ulid, "hong")
        v = self.doc(ulid) if not isinstance(v, dict) or "ulid" not in v else v
        v["giai_doan_hong"] = giai_doan_hong
        v["loi"] = str(loi)[:2000]
        # LEASE bỏ ngay: chủ cũ không còn làm gì việc này nữa.
        v.pop("nhan_luc", None)
        v.pop("nhan_pid", None)
        self._ghi_nguyen_tu(ulid, v)
        self._doi_ngan(ulid, "rac")
        return self.doc(ulid)

    def _doi_ngan(self, ulid: str, ngan: str) -> Path:
        """Dời file việc + hai file đi kèm sang một ngăn Maildir khác.

        File tiến độ đi THEO: nó là 13 phút transcript đã trả tiền, và bỏ nó
        lại một ngăn khác là để một con trỏ mồ côi ở chỗ không ai tra.
        """
        d = self._duong(ulid)
        dich = self.goc / ngan / f"{ulid}.json"
        if d.resolve() == dich.resolve():
            return dich
        (self.goc / ngan).mkdir(parents=True, exist_ok=True)
        # TÍNH ĐƯỜNG HAI FILE PHỤ TRƯỚC KHI DỜI VIỆC.
        #
        # `duong_tien_do`/`_duong_phan_hoi` SUY từ vị trí file việc. Dời việc
        # trước rồi mới hỏi chúng thì chúng trỏ vào ngăn MỚI — chỗ chưa có gì —
        # nên `.exists()` sai và hai file ở lại ngăn cũ thành mồ côi. Cổng
        # `E2`/`E5b` bắt đúng chỗ này: mất file tiến độ là mất 13 phút đã trả
        # tiền, và "chạy lại từ chỗ hỏng" âm thầm thành "chạy lại từ đầu".
        phu = [x for x in (self._duong_phan_hoi(ulid), self.duong_tien_do(ulid))
               if x.exists()]
        _doi_ten_ben_bi(d, dich)
        for x in phu:
            _doi_ten_ben_bi(x, self.goc / ngan / x.name)
        return dich

    def xoa_han(self, ulid: str) -> int:
        """XOÁ file việc + file đi kèm khỏi `rac/`. Trả số file đã xoá.

        KHÔNG đụng `egress.*.jsonl`: vết tiền là một sổ RIÊNG, và xoá một việc
        không được xoá bằng chứng nó đã tiêu bao nhiêu.
        """
        n = 0
        for f in sorted((self.goc / "rac").glob(f"{ulid}*")):
            try:
                f.unlink()
                n += 1
            except OSError:
                pass
        return n

    def khoi_phuc(self, ulid: str) -> dict:
        """Đưa một việc từ `rac/` về `cur/` — cho `chay_lai` nhặt được."""
        self._doi_ngan(ulid, "cur")
        return self.doc(ulid)

    # ── checkpoint · phản hồi model lưu CẠNH job ─────────────────────────
    def _duong_phan_hoi(self, ulid: str) -> Path:
        """`cur/` hoặc `done/` — **KHÔNG BAO GIỜ** `new/`.

        `§5.0` giữ một bất biến: *`new/` chỉ chứa file HOÀN CHỈNH*, tức mỗi file
        `.json` trong đó là MỘT việc. Bản trước của hàm này đặt phản hồi cạnh
        file job, nên với một job chưa bị chiếm nó rơi vào `new/` và
        `check_idempotency` đếm HAI việc sau một lần nạp — cổng bắt đúng.

        Đọc `done/` nữa vì `dong_viec` chuyển phản hồi theo job: không đọc thì
        `doc_phan_hoi` nói KHÔNG CÓ cho một việc vừa chạy xong.

        `rac/` thêm 2026-09-09 (WO-068) — cùng lý lẽ: `danh_hong` chuyển phản
        hồi theo việc, và không tra ở đó thì `chay_lai` một việc trong rác gọi
        model LẠI cho phần đã trả tiền (`AC-5.4` mất chỗ dựa).
        """
        ten = f"{ulid}.phan-hoi.json"
        for t in ("done", "rac"):
            d = self.goc / t / ten
            if d.exists():
                return d
        return self.goc / "cur" / ten

    def luu_phan_hoi(self, ulid: str, phan_hoi: dict) -> None:
        """`AC-5.4`. `FR-046 §2.1` hứa *"chạy lại từ giai-đoạn-hỏng đỡ phí token"*
        — lời hứa đó chỉ đúng NẾU phản hồi được lưu. Không lưu thì chạy lại từ
        `dang-verify` vẫn phải gọi model, tức tốn đúng cái nó hứa tiết kiệm."""
        p = self._duong_phan_hoi(ulid)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(phan_hoi, f, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())

    def doc_phan_hoi(self, ulid: str) -> dict | None:
        p = self._duong_phan_hoi(ulid)
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None
