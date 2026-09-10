"""TẢI nguồn từ URL — `T12-17` + `AC-V4`.

`tai_ve` VẪN là lời gọi ra Internet dù không gửi byte của ta đi. Nên nó vẫn đi
qua **cửa egress duy nhất** (`M12-R3`), host vẫn phải trong allowlist — chỉ khác
là dòng log ghi `tieu_egress: false`. Trộn hai nghĩa của chữ *egress* vào một
cột là cách con số này bắt đầu nói dối (`FR-054 §1.5`).

Không gọi `yt_dlp.download()` trực tiếp: nó tự mở socket, và `M12-R3` đòi đúng
một hàm ra Internet. Hàm này **chuẩn bị + xin phép**, rồi trả về lệnh tải để
`egress.gui()` là chỗ đếm và log.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

R = Path(__file__).resolve().parent.parent.parent
BANG = R / "chungcat" / "assets" / "nguon-transcript.json"


class HostKhongKhai(Exception):
    """Host ngoài allowlist. Chặn TRƯỚC request (`AC-V4`)."""


class VuotTran(Exception):
    """Nhịp MỘT của `M12-R9` — byte đo ở cửa."""


def doc_bang(duong=None) -> dict:
    return json.loads(Path(duong or BANG).read_text(encoding="utf-8"))


BANG_NGUONG = R / "chungcat" / "assets" / "nguong.json"


def bac_chat_luong(duong=None) -> list:
    """Bậc chất lượng được phép — đọc từ `nguong.json`, KHÔNG từ `nguon-transcript.json`.

    Hai bảng, hai chủ, và trộn chúng là cách một bảng bắt đầu chứa thứ không
    phải việc của nó: `nguon-transcript.json` khai NGUỒN (host nào được đọc,
    trần byte); `nguong.json` khai NGƯỠNG VẬN HÀNH (fuzzy, song song, và nay là
    bậc chất lượng + hạn dọn file tạm).
    """
    import json as _json
    return _json.loads(Path(duong or BANG_NGUONG).read_text(encoding="utf-8")
                       ).get("chat_luong") or []


def kiem_host(url: str, bang: dict | None = None) -> str:
    """Host của `url` phải nằm trong `host_cho_phep`. Trả host nếu qua.

    Đo trên **HOST**, không trên URL đầy đủ: URL có query, có redirect, và so
    khớp URL là so khớp một thứ đổi mỗi lần. `AC-V4` đòi chặn TRƯỚC request —
    nên phép so phải làm được trên cái có ngay lúc phân giải URL.
    """
    b = bang or doc_bang()
    host = (urlsplit(url).hostname or "").lower()
    cho = {h.lower() for h in b["host_cho_phep"]}
    if host not in cho:
        raise HostKhongKhai(
            f"host `{host}` không có trong `host_cho_phep` của bảng khai. "
            f"Thêm một nền tảng là thêm MỘT DÒNG bảng khai, không sửa mã.")
    return host


def kiem_byte(so_byte: int, *, la_video: bool, bang: dict | None = None) -> int:
    """Nhịp MỘT của `M12-R9` — byte, đo ở CỬA NHẬN JOB.

    Nhịp hai (thời lượng) ở `asr.thoi_luong_giay`, và nó chạy sau khi đọc
    metadata nhưng TRƯỚC giây ASR đầu tiên.
    """
    b = bang or doc_bang()
    tran = b["tran_video_byte"] if la_video else b["tran_audio_byte"]
    if so_byte > tran:
        raise VuotTran(
            f"{so_byte} byte > trần {tran}. Đường đúng cho nguồn lớn là ĐĂNG KÝ "
            f"URL (`FR-037`), không phải nới trần.")
    return so_byte


def lenh_tai(url: str, ra: Path, bang: dict | None = None) -> list[str]:
    """Lệnh `yt-dlp` để TẢI AUDIO — dựng, KHÔNG chạy.

    Trả lệnh thay vì tải: `M12-R3` đòi đúng một hàm ra Internet, và người gọi
    đưa lệnh này qua đường egress để có `seq` + dòng log `tieu_egress: false`.

    `-x` (chỉ audio): `FR-054 §1.1` chốt không lưu byte video, và tải cả video
    rồi bỏ hình là tải gấp mười lần thứ cần.
    """
    kiem_host(url, bang)
    # `sys.executable -m yt_dlp`, KHÔNG phải lệnh `yt-dlp`.
    #
    # Đo được 2026-09-05 trên máy thật: gói `yt-dlp 2026.8.19` ĐÃ cài trong
    # venv, nhưng `.venv/Scripts/yt-dlp.exe` **không tồn tại** — shim không được
    # sinh. `subprocess` báo `FileNotFoundError: [WinError 2] The system cannot
    # find the file specified`, và câu đó không nói gì về việc thiếu shim: job
    # transcript chết ở `dang-doc-nguon` với một lỗi không ai đọc ra được.
    #
    # `-m` gọi module trong CHÍNH trình thông dịch đang chạy ⇒ không phụ thuộc
    # PATH, không phụ thuộc shim, và luôn là cùng môi trường với worker.
    return [sys.executable, "-m", "yt_dlp",
            "-x", "--audio-format", "mp3", "--no-playlist",
            "-o", str(ra), url]

def lenh_tai_thumbnail(url: str, ra: Path, bang: dict | None = None) -> list[str]:
    """Lệnh `yt-dlp` để lấy ẢNH BÌA — dựng, KHÔNG chạy.

    `--skip-download`: một tấm ảnh không đáng một lần tải cả video. Khác
    `lenh_tai` (`-x`, bóc audio) và `lenh_tai_video` (tải hình) ở đúng chỗ đó.

    Vì sao `yt-dlp` chứ không oEmbed: oEmbed của Facebook ĐÒI app token từ
    10/2020, còn `yt-dlp` có extractor cho cả bốn host — 0 token, 0 nhánh
    per-platform, và nó đã đi qua cửa egress sẵn có.

    `kiem_host` TRƯỚC khi dựng (`AC-V4`): chặn phải xảy ra trước request, và
    một lệnh đã dựng là một request sắp xảy ra.

    `-m yt_dlp` chứ không lệnh `yt-dlp`: shim `.venv/Scripts/yt-dlp.exe` KHÔNG
    được sinh (đo 2026-09-05), và `FileNotFoundError: [WinError 2]` không nói
    file nào thiếu.
    """
    kiem_host(url, bang)
    # `--write-all-thumbnails`, KHÔNG `--write-thumbnail`. Đo 2026-09-09 trên
    # bản ghi thật: TikTok công bố ba bản — `dynamicCover` · `cover` ·
    # `originCover` — và `--write-thumbnail` lấy bản CUỐI (`originCover`), vốn
    # là một tấm gradient TRỐNG 4 761 byte. Bản `cover` mới là ảnh thật
    # (220 262 byte). Thẻ hiện một ô đen, và không cổng nào kêu vì "có ảnh".
    #
    # Không gõ tên bản nào ở đây: mỗi nền tảng đặt tên khác nhau, và một danh
    # sách ưu tiên theo tên là thứ phải sửa mỗi lần host đổi. Người gọi chọn
    # theo SỐ BYTE — ảnh trống nén lại gần như bằng không, nên phép so ấy đúng
    # ở mọi nền tảng mà không cần biết tên bản nào.
    return [sys.executable, "-m", "yt_dlp",
            "--write-all-thumbnails", "--skip-download",
            "--convert-thumbnails", "jpg", "--no-playlist",
            "-o", str(ra), url]


def lenh_tai_video(url: str, ra: Path, chat_luong, bang: dict | None = None,
                   bac=None) -> list[str]:
    """Lệnh `yt-dlp` để TẢI VIDEO ở một bậc chất lượng — dựng, KHÔNG chạy.

    Khác `lenh_tai` ở đúng một chỗ, và chỗ ấy là cả sự khác nhau: `lenh_tai`
    có `-x` (bóc audio cho ASR), hàm này KHÔNG — người chọn 480p mà nhận về
    một file `.mp3` là nhận một thứ khác hẳn thứ họ bấm.

    Bậc là THẬT: host giữ sẵn các bậc, `-f` chỉ CHỌN. Ta không transcode —
    transcode ở phía ta ra một file không phải thứ nguồn có, mà vẫn mang tên
    nguồn.

    `bv*[height<=H]+ba/b[height<=H]`: ưu tiên luồng hình + luồng tiếng rời
    (chất lượng cao hơn ở cùng bậc), rơi về luồng ghép sẵn nếu không có. Đây
    là khuôn `yt-dlp` khuyến nghị, không phải phát minh của ta.
    """
    b = bang or doc_bang()
    bac = list(bac_chat_luong() if bac is None else bac)
    if chat_luong not in bac:
        raise ValueError(
            f"bậc {chat_luong!r} không có trong bảng khai. Bậc được phép: "
            f"{', '.join(str(x) for x in bac)}.")
    kiem_host(url, b)                     # chặn TRƯỚC khi dựng lệnh (AC-V4)
    dinh = ["-f", "bv*+ba/b"] if chat_luong == "goc" else [
        "-f", f"bv*[height<={chat_luong}]+ba/b[height<={chat_luong}]"]
    # `--newline`: yt-dlp mặc định ghi đè MỘT dòng bằng ký tự về-đầu-dòng
    # terminal — nhưng bên đọc từng dòng thì thấy một dòng dài vô tận và
    # không bao giờ có tiến độ. `--newline` đổi nó thành mỗi nhịp một dòng.
    return [sys.executable, "-m", "yt_dlp", *dinh,
            "--newline", "--merge-output-format", "mp4", "--no-playlist",
            "-o", str(ra), url]
