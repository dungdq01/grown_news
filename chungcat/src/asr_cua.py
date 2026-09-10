"""ASR QUA CỬA — lối `dich_vu` của `nguon-transcript.json`.

**File RIÊNG, không phải một nhánh trong `asr.py`.** `M12-R8` đòi đường ASR
local có **0 lời gọi mạng**, và cổng quét nó bằng AST. Lối này thì audio của ta
**RỜI MÁY** — gộp hai lối vào một file là làm cột `tieu_egress` thành một lời
khai, vì không phép đo nào phân biệt được đường nào vừa chạy.

`uu_tien: 1` (chủ dự án 2026-09-04): cửa có model nhận audio ⇒ 0 gói mới, 0
model tải về. Đánh đổi phải hiện cho người bấm: **audio đi ra ngoài**.
"""

from __future__ import annotations

import base64
import json
import os
import re
import shutil
import subprocess
import time
import sys
import tempfile
from pathlib import Path

import egress
from adapter import hop_dong

R = Path(__file__).resolve().parent.parent.parent
BANG_NGUON = R / "chungcat" / "assets" / "nguon-transcript.json"

_YEU_CAU = (
    "Phiên âm audio này. Trả JSON: "
    '{"doan": [{"tu": giây_bắt_đầu, "den": giây_kết_thúc, "text": "..."}]}. '
    "`tu`/`den` là SỐ GIÂY (số thực), không phải chuỗi mốc. Chỉ trả JSON.")


class QuaLonChoCua(Exception):
    """Audio vượt trần THÂN REQUEST của cửa — chặn trước khi gửi.

    Lớp riêng, không dùng `egress.VuotTran`: `VuotTran` là trần của TA (chính
    sách egress, `AC-6.4`), còn cái này là trần của BÊN KIA. Hai nguyên nhân,
    hai cách sửa — gộp lại là đẩy người sửa đi nới trần của mình cho một giới
    hạn không thuộc mình.
    """


class KhongCoFfmpeg(Exception):
    """`ffmpeg` không có trên máy — nói ra, không để `FileNotFoundError` trần trụi.

    `yt-dlp` đã mắc đúng lỗi này một lần: gói cài rồi nhưng không có shim, và
    người nhận được `WinError 2` — một câu không chỉ ai đi cài gì.
    """


class PhienAmCut(Exception):
    """Mot doan ve KHONG phu het chinh no — cua tra ban phien am cut.

    Do tren hai ban ghi that cua chu du an 2026-09-08:

        cai-dat (31 phut)          hermes (50 phut)
         doan 0:  9:47 / 10:00      doan 0:  0:00 / 10:00
         doan 1:  2:06 / 10:00      doan 1:  6:47 / 10:00
         doan 2:  1:37 / 10:00      doan 2:  2:03 / 10:00
         doan 3:  1:31 / 10:00      doan 3:  0:18 / 10:00

    `cat_doan` cat DUNG va `_phien_am_mot_doan` cong `moc` DUNG — ca hai da do.
    Hong o cho khac: model tra ban phien am CUT cho tung doan, va ma nhan no
    nhu mot ket qua du.

    Vi sao NEM chu khong tra ve phan doc duoc: `.vtt` cut van hop le, van mo
    duoc, va viec van bao `xong`. Nguoi duy nhat phat hien la nguoi NGHE LAI.
    Moi thu sau no — chung cat, trich dan — se dung tren mot nguon khuyet ma
    khong ai khai. Mot loi on ao tot hon mot ket qua sai im lang.
    """


# Ti le phu toi thieu cua MOT doan. 0.85 chu khong 1.0: cue cuoi ket thuc
# truoc het doan la binh thuong khi doan ket bang mot khoang lang, va doi
# tuyet doi se nem oan cho moi video co nhac cuoi.
TI_LE_PHU_TOI_THIEU = 0.85


class CuaKhongNhanAudio(Exception):
    """Model đang chọn không nhận audio — chặn TRƯỚC khi gửi."""


def doc_nguon(duong=None) -> dict:
    return json.loads(Path(duong or BANG_NGUON).read_text(encoding="utf-8"))


def _dinh_dang(ten: str) -> str:
    d = Path(ten).suffix.lower().lstrip(".")
    return d or "mp3"


# ── NÉN TRƯỚC KHI GỬI (T12-21 · WO-054) ──────────────────────────────────
#
# `KENH`/`TAN_SO` không phải để tiết kiệm cho vui: ASR hạng whisper HẠ MẪU về
# đúng mono 16 kHz trước khi nghe. Gửi stereo 44.1 kHz là trả tiền mạng cho
# phần dữ liệu bên nhận vứt đi ngay ở bước đầu.
#
# `mp3` chứ không `opus`: đo được opus 24k nhỏ hơn (4.6 MB so với 6.0 MB trên
# cùng nguồn 19 phút), nhưng `beeknoee-api-guide.md` §4.3 CHỈ khai
# `format: "mp3"`. Đổi 1.4 MB lấy một giả định về thứ bên kia nhận là sai
# chiều — nhất là khi cửa này từ chối ÂM THẦM (200 + stream rỗng).

TRAN_CHU = 65536
KENH = 1
TAN_SO = 16000
BITRATE = "32k"


def nen_cho_cua(duong_audio, *, thu_muc=None):
    """`audio → mp3 mono 16 kHz` trong thư mục TẠM. Trả đường file mới.

    Giảm đúng thứ `M12-R6` bảo vệ — SỐ BYTE RỜI KHỎI MÁY — mà không chạm luật
    nào: vẫn một lần gửi, ít hơn 62% dữ liệu đi ra (đo trên nguồn 19 phút).
    """
    if not shutil.which("ffmpeg"):
        raise KhongCoFfmpeg(
            "cần `ffmpeg` để nén audio trước khi gửi cửa (nguồn thường vượt "
            "trần thân request ở dạng gốc). Cài: `winget install Gyan.FFmpeg` "
            "hoặc `apt install ffmpeg`.")
    goc = Path(duong_audio)
    d = Path(thu_muc or tempfile.mkdtemp(prefix="cc-nen-")) / (goc.stem + ".nen.mp3")
    ra = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(goc),
         "-ac", str(KENH), "-ar", str(TAN_SO),
         "-c:a", "libmp3lame", "-b:a", BITRATE, str(d)],
        capture_output=True, text=True)
    if ra.returncode != 0 or not d.exists():
        raise KhongCoFfmpeg(f"`ffmpeg` nén thất bại: {ra.stderr.strip()[:400]}")
    return d


def _vot_cue_cut(noi: str) -> list[dict]:
    """Cue đọc được trong một mảng `doan` hỏng. Tự BẮT NHỊP LẠI sau chỗ hỏng.

    Cắt theo ranh `}, {` rồi thử parse TỪNG mảnh, thay vì quét ngoặc theo độ
    sâu. Lý do rất cụ thể, đo được trên cửa thật: model đôi khi trả một object
    có chuỗi KHÔNG ĐÓNG —

        {"v": "591.738, "den": 592.548, "text": "Ờ"}

    — và với phép quét theo độ sâu thì dấu nháy thừa đó lật trạng thái
    trong-chuỗi, làm SAI LỆCH mọi object phía sau: đo được 256/294 cue hỏng chỉ
    vì MỘT object xấu ở giữa. Cắt theo ranh thì hỏng nằm gọn trong đúng một
    mảnh; mảnh kế tiếp lại parse được.

    Ranh `}, {` xuất hiện trong `text` thì mảnh đó không parse được và bị bỏ —
    mất một cue, không bịa cue nào. Đó là chiều đánh đổi đúng: cue vắng thì
    thấy được, cue bịa thì đi thẳng vào file `.vtt` mà không ai biết.
    """
    t = noi[noi.index("[") + 1:] if "[" in noi else noi
    t = t.rsplit("]", 1)[0] if "]" in t else t
    ra = []
    for manh in re.split(r"\}\s*,\s*\{", t):
        m = manh.strip().lstrip("{").rstrip("}").strip()
        try:
            x = json.loads("{" + m + "}")
        except ValueError:
            continue
        if isinstance(x, dict):
            ra.append(x)
    return ra


# ── CẮT ĐOẠN cho nguồn dài (T12-22 · FR-065 lối A) ───────────────────────
#
# Chủ dự án chốt 2026-09-05: *"Bản chất là chunk và concat chứ có phải gửi đi
# gửi lại 1 request đâu mà vi phạm"*. `M12-R6` là trần THỬ LẠI — nó cấm vòng
# retry tự động, không cấm một lần thử gồm nhiều mảnh. Đọc nó theo nghĩa "số
# lần ra" thì nó biến thành trần ĐỘ DÀI NGUỒN, thứ nó không bao giờ định là.
#
# Nên: `ghi_nhan_gui` đếm MỘT lần cho cả lần thử; mỗi đoạn vẫn có dòng
# `egress.jsonl` riêng với `sha256` riêng, nên số byte rời máy vẫn đếm đúng
# từng byte (`AC-6.1` không đổi một chữ).

def _nguong() -> dict:
    """Bang khai nguong. Doc moi lan goi — van mot con so, va van mot chu."""
    try:
        # `BANG_NGUON.parent` — cùng thư mục `assets/`, không dựng một đường
        # thứ hai. Một hằng đường dẫn thứ hai là chỗ hai bên trỏ hai nơi.
        return json.loads(
            (BANG_NGUON.parent / "nguong.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def giay_moi_doan_mac_dinh() -> int:
    """Do dai moi doan, tu BANG KHAI (`giay_moi_doan_asr`).

    Loi A cua chu du an 2026-09-08: 600 -> 300. Con so o bang khai chu khong
    trong ma vi day la mot num CHI PHI — moi doan la mot loi goi, va nguoi tra
    tien phai van duoc no ma khong sua mot dong ma nao.
    """
    return int(_nguong().get("giay_moi_doan_asr", 300))


def tran_vong_asr() -> int:
    """So VONG toi da cho mot nguon. Xem `$vi_sao_tran_vong_asr`."""
    return int(_nguong().get("tran_vong_asr", 24))


def tran_thu_lai_cua() -> int:
    """Số lần THỬ LẠI NGẦM cho MỘT chunk. Xem `$vi_sao_tran_thu_lai_cua`."""
    return int(_nguong().get("tran_thu_lai_cua", 3))


def giay_giai_cach_thu_lai() -> list:
    """Giãn cách giữa các lần thử lại, giây. Tăng dần."""
    x = _nguong().get("giay_giai_cach_thu_lai")
    return list(x) if isinstance(x, list) and x else [2, 5, 12]


def loi_tam_thoi(e: BaseException) -> bool:
    """Lỗi này thử lại có nghĩa không?

    CÓ: 5xx (cửa hoặc hạ tầng trước cửa), 429 (bị bóp), lỗi mạng/timeout — cùng
    một request gửi lại có cơ hội thật.

    KHÔNG: 4xx còn lại (401 khoá sai, 403 chặn, 422 thân sai). Thử lại một lỗi
    cấu hình là đốt egress để nhận lại đúng câu trả lời ấy, ba lần — và nó im
    lặng, vì mỗi lần vẫn là một dòng log hợp lệ.

    Đọc `status_code` qua `getattr` chứ không `isinstance(httpx.HTTPStatusError)`:
    `egress` nạp `httpx` LƯỜI (để cổng chạy được khi vắng gói), nên import nó ở
    đây là kéo ngược một phụ thuộc mà chính module kia đã cố tránh.
    """
    ma = getattr(getattr(e, "response", None), "status_code", None)
    if isinstance(ma, int):
        return ma >= 500 or ma == 429
    # Không có `status_code` ⇒ chưa tới được cửa: đứt mạng, timeout, DNS.
    # `QuaLonChoCua`/`ValueError` là lỗi của TA, không phải của đường truyền.
    ten = type(e).__name__.lower()
    return any(k in ten for k in ("timeout", "connect", "network", "read",
                                  "remoteprotocol", "pool"))


def thoi_luong(duong) -> float:
    """Số giây của một file media, đọc bằng `ffprobe`."""
    ra = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(duong)],
        capture_output=True, text=True)
    try:
        return float(ra.stdout.strip())
    except ValueError:
        raise KhongCoFfmpeg(
            f"`ffprobe` không đọc được thời lượng của {duong}: "
            f"{ra.stderr.strip()[:200]}") from None


def _cat_mot(duong_audio, *, bat: float, dai: float, thu_muc):
    """Cat DUNG MOT manh [bat, bat+dai) va nen san. Tra duong file.

    Khac `cat_doan`: nó quyet TRUOC moi ranh, con o day ranh do KET QUA
    quyet — moc bat dau la cho cue cuoi cua vong truoc dung lai. Do la ca diem
    cua loi *tiep tu cho dut*.
    """
    if not shutil.which("ffmpeg"):
        raise KhongCoFfmpeg("can `ffmpeg` de cat audio truoc khi gui cua")
    d = Path(thu_muc) / f"manh{int(bat):07d}.mp3"
    r = subprocess.run(
        # `-ss` TRUOC `-i` de ffmpeg nhay thang, khong giai ma phan bo di.
        ["ffmpeg", "-v", "error", "-y", "-ss", str(bat), "-t", str(dai),
         "-i", str(duong_audio), "-ac", str(KENH), "-ar", str(TAN_SO),
         "-c:a", "libmp3lame", "-b:a", BITRATE, str(d)],
        capture_output=True, text=True)
    if r.returncode != 0 or not d.exists():
        raise KhongCoFfmpeg(f"cat manh tai {int(bat)}s that bai: "
                            f"{r.stderr.strip()[:300]}")
    return d


def cat_doan(duong_audio, *, giay_moi_doan: int | None = None, thu_muc=None):
    """`[(đường_đoạn, giây_bắt_đầu)]`. Nguồn ngắn ⇒ đúng một phần tử, 0 cắt.

    KHÔNG chồng lấn giữa hai đoạn. Chồng lấn thì phần chồng được phiên âm hai
    lần và ta phải khử trùng — mà khử trùng trên văn bản model sinh là đoán,
    còn đoán sai thì XOÁ chữ thật. Không chồng lấn thì cái mất là cùng lắm một
    từ nằm vắt ngang ranh, và đó là mất TẠI CHỖ ĐOÁN TRƯỚC ĐƯỢC.
    """
    giay_moi_doan = giay_moi_doan or giay_moi_doan_mac_dinh()
    tong = thoi_luong(duong_audio)
    if tong <= giay_moi_doan:
        return [(Path(duong_audio), 0.0)]
    thu = Path(thu_muc or tempfile.mkdtemp(prefix="cc-doan-"))
    ra = []
    for k in range(int(tong // giay_moi_doan) + (1 if tong % giay_moi_doan else 0)):
        bat = k * giay_moi_doan
        d = thu / f"doan{k:03d}.mp3"
        # `-ss` TRƯỚC `-i` để ffmpeg nhảy thẳng, không giải mã phần bỏ đi.
        r = subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(bat), "-t",
             str(giay_moi_doan), "-i", str(duong_audio),
             "-ac", str(KENH), "-ar", str(TAN_SO),
             "-c:a", "libmp3lame", "-b:a", BITRATE, str(d)],
            capture_output=True, text=True)
        if r.returncode != 0 or not d.exists():
            raise KhongCoFfmpeg(f"cắt đoạn {k} thất bại: {r.stderr.strip()[:300]}")
        ra.append((d, float(bat)))
    return ra


def phien_am(duong_audio, *, dong_model: dict, log, tran: int,
             ghi_nhan=None, giay_moi_doan: int | None = None,
             _gui=None, bat_dau: float = 0.0) -> list[dict]:
    """`audio → [{tu, den, text}]` qua cửa LLM. Mọi byte qua `egress.gui()`.

    `dong_model` là một dòng `model.json`. Nó **phải** khai `ho_tro_audio` —
    gửi audio tới model không nhận nó thì *"phần media bị bỏ qua ÂM THẦM"*
    (`beeknoee-api-guide.md` §2.5), tức ta trả tiền cho một lời gọi trả về một
    bản phiên âm bịa từ prompt. Nên chặn ở đây, trước khi gửi.
    """
    if not dong_model.get("ho_tro_audio"):
        raise CuaKhongNhanAudio(
            f"`{dong_model['model']}` không khai `ho_tro_audio`. Cửa BỎ QUA phần "
            f"media âm thầm, nên lời gọi vẫn trả về một thứ trông như phiên âm — "
            f"chọn một model có `ho_tro_audio: true`.")

    # KHÔNG so CẢ FILE với `tran`.
    #
    # `tran` là trần của MỘT LỜI GỌI. Cả file không bao giờ đi trong một lời
    # gọi — các ĐOẠN mới đi, và `cat_doan` ngay bên dưới sinh ra chúng. Phép
    # so cũ ở đây phủ định đúng cơ chế đứng sau nó hai dòng.
    #
    # Đo trên máy chủ dự án 2026-09-07: video 58 phút ⇒
    #   `VuotTran: audio 37028349 byte > trần 33554432`
    # trong khi cắt ra 6 đoạn 10 phút thì mỗi thân chỉ ~3 MB, lọt trần 8 MB
    # của cửa rất thoải mái. Một tính năng có sẵn bị một dòng chặn sai chỗ
    # khoá lại.
    #
    # Phép chặn ĐÚNG vẫn còn nguyên ở `_phien_am_mot_doan`: nó so TỪNG ĐOẠN
    # (sau nén, sau base64) với `tran_than_cua_byte` — trần của CỬA, thứ ta
    # không nới được.

    # CẮT ĐOẠN rồi lặp. `cat_doan` đã nén sẵn từng đoạn (cùng tham số
    # `nen_cho_cua`), nên nguồn dài không bao giờ đi qua một lời gọi khổng lồ.
    tam = tempfile.mkdtemp(prefix="cc-doan-")
    try:
        # ═══ TIEP TU CHO DUT — chu du an chot 2026-09-08 ═══════════════
        #
        # *"Neu model dung: note ban da transcript vao tmp, tu dong gui lai
        # request voi thoi gian tu luc bi ngat… tuan tu nhu vay va dung khi
        # transcript end time."*
        #
        # Ban truoc cat SAN moi ranh (`for … in doan`) roi thu lai ca doan khi
        # cut. Hai cai gia:
        #   · TRA TIEN LAI cho phan da phien am dung
        #   · boc lai xuc xac tren cung mot quang — khong co gi bao dam lan sau
        #     hon lan truoc
        #
        # Loi nay quyet ranh bang KET QUA: cue cuoi dung o dau thi vong sau bat
        # dau tu do. Nen mot doan ve cut khong con la LOI — no thanh tin hieu
        # dieu khien, va moi loi goi deu TIEN TOI.
        #
        # Hai can, vi mot vong lap goi model ma khong co can la mot hoa don
        # khong co can:
        #   · `tran_vong_asr` — so vong toi da
        #   · vong khong tien them giay nao ⇒ NEM ngay
        #
        # `M12-R6` khong bi dung: luat viet san *mot lan THU = mot luot phien
        # am tron nguon, chia bao nhieu DOAN cung tinh MOT*.
        # GIAI `None` NGAY. Bug 2026-09-08, do tren job that cua chu du an:
        #   `TypeError: '<' not supported between 'float' and 'NoneType'`
        # Toi doi chu ky sang `giay_moi_doan: int | None = None` va giai no
        # trong `cat_doan` — nhung vong moi khong con goi `cat_doan` nua, nen
        # `min(None, …)` o duoi no. Doi mot mac dinh ma quen mot trong hai
        # nguoi doc no.
        giay_moi_doan = giay_moi_doan or giay_moi_doan_mac_dinh()
        tong = thoi_luong(duong_audio)
        ra: list[dict] = []
        # WO-067 · `bat_dau` — tiếp từ giây đã có, không từ 0. Job hỏng ở
        # 13:22 rồi chạy lại từ 0 là trả tiền lại 13 phút và bốc lại xúc xắc
        # trên đúng quãng đã đúng. Cue đã có nằm ở file tiến độ; người gọi
        # ghép chúng vào trước, hàm này chỉ cần biết bắt đầu từ đâu.
        moc = max(0.0, float(bat_dau or 0.0))
        vong = 0
        con = max(1, tran_vong_asr())
        # WO-066 · thử lại đúng MỘT lần khi một đoạn không tiến.
        #
        # Đo trên job thật 2026-09-09 (video 28+ phút): vòng 9 tại 1694s cửa
        # trả 37 cue mà cue nào cũng THIẾU `tu`/`den` — nội dung có, mốc không.
        # Đó là lỗi ĐỊNH DẠNG của một phản hồi, không phải "hết tiếng". Phanh cũ
        # ném ngay ⇒ mất phần còn lại của video vì một lần model quên số.
        # Một lần gửi lại cùng đoạn nằm trong cùng một lượt THỬ (`M12-R6` đếm
        # THỬ theo lượt trọn nguồn, không theo đoạn) và có cận trên là `con`.
        da_thu_lai_tai = None
        while moc < tong - 1.0:
            vong += 1
            if vong > con:
                raise PhienAmCut(
                    f"da {con} vong ma moi phien am toi {int(moc)}s / "
                    f"{int(tong)}s. Nguon nay bi cua tra ve cut lien tuc — "
                    f"noi `tran_vong_asr` hoac doi model khac.")
            dai = min(giay_moi_doan, tong - moc)
            manh = _cat_mot(duong_audio, bat=moc, dai=dai, thu_muc=tam)
            cue = _phien_am_mot_doan(
                manh, moc=moc, dong_model=dong_model, log=log, tran=tran,
                ghi_nhan=ghi_nhan, _gui=_gui, kiem=False)
            het = max((float(c["den"]) for c in cue), default=moc)
            if het <= moc + 1.0:
                if da_thu_lai_tai != moc:
                    da_thu_lai_tai = moc
                    print(f"[cua-asr] vong {vong} tai {int(moc)}s khong tien "
                          f"(nhan {len(cue)} cue co moc) — gui lai doan nay "
                          f"MOT lan", file=sys.stderr)
                    continue
                # KHONG TIEN lan THU HAI tren cung mot moc. Quay tiep la vong
                # lap vo han co hoa don — va no im lang, vi moi vong van tra 200.
                raise PhienAmCut(
                    f"vong {vong} tai {int(moc)}s khong phien am them giay nao "
                    f"(nhan {len(cue)} cue). Dung de khoi dot them.")
            ra += cue
            moc = het
        return ra
    finally:
        shutil.rmtree(tam, ignore_errors=True)


def kiem_phu(cue: list, *, dai_doan: float, moc: float, ly_do: str = ""):
    """Cue cua MOT doan co phu gan tron doan ay khong? Thieu ⇒ NEM.

    `dai_doan` la do dai THAT cua file doan, khong phai `GIAY_MOI_DOAN`: doan
    cuoi bao gio cung ngan hon, va so voi hang se nem oan dung mot lan moi job.

    Cau loi mang CON SO — *"phien am cut"* khong noi cho ai biet van cho nao,
    *"phu 2:06 / 10:00"* thi noi.
    """
    if dai_doan <= 0:
        return
    het = max((float(c.get("den") or 0) for c in cue), default=0.0) - moc
    ti = het / dai_doan
    if ti >= TI_LE_PHU_TOI_THIEU:
        return
    mm = lambda g: f"{int(g) // 60}:{int(g) % 60:02d}"
    raise PhienAmCut(
        f"doan tai {mm(moc)} chi phu {mm(max(het, 0))} / {mm(dai_doan)} "
        f"({ti * 100:.0f}%, can >= {TI_LE_PHU_TOI_THIEU * 100:.0f}%)"
        + (f" — cua bao `finish_reason: {ly_do}`" if ly_do else "")
        + ". Ban phien am cut KHONG duoc di tiep: moi thu sau no se dung tren "
          "mot nguon khuyet ma khong ai khai. Vặn `GIAY_MOI_DOAN` xuong, hoac "
          "chon model khac.")


def _phien_am_mot_doan(duong_gui, *, moc: float, dong_model: dict, log,
                       tran: int, ghi_nhan=None, _gui=None,
                       kiem: bool = True) -> list[dict]:
    """Một đoạn → cue, mốc đã DỜI về dòng thời gian của NGUỒN.

    `moc` là chỗ dễ sai nhất và sai thì không ai thấy: mỗi đoạn về từ cửa với
    mốc đếm từ 0 của chính nó. Quên cộng `moc` thì bản 25 phút có ba lần chạy
    lại từ 0 giây — file `.vtt` vẫn hợp lệ, vẫn mở được, và sai hoàn toàn.
    """
    b = Path(duong_gui).read_bytes()

    # ── TRẦN THÂN REQUEST, kiểm TRƯỚC khi dựng payload ────────────────────
    #
    # `tran` ở trên là trần của FILE trên đĩa. Thân request thì khác: base64
    # phình 4/3, và cửa LLM có trần thân riêng — nhỏ hơn nhiều.
    #
    # Đo được 2026-09-05: audio 12 phút → 17.075.860 byte trong một thân JSON,
    # và cửa trả 200 + stream RỖNG kèm `server_error / Http Exception`. Tức nó
    # từ chối ở tầng hạ tầng và KHÔNG nói vì sao — sau khi ta đã tải 18 giây và
    # đẩy 17 MB lên mạng.
    #
    # Chặn ở đây biến một lỗi mù thành một câu nói được, và tiết kiệm đúng cái
    # đắt nhất: một lượt egress vô ích.
    tran_than = int(doc_nguon().get("tran_than_cua_byte", 8 * 1024 * 1024))
    uoc = len(b) * 4 // 3 + 2048          # base64 + phần bao JSON
    if uoc > tran_than:
        # Tới đây thì MỘT ĐOẠN đã vượt trần — tức `GIAY_MOI_DOAN` đang đặt
        # quá dài cho mức nén hiện tại, chứ không phải nguồn quá dài. Câu lỗi
        # phải nói ra đúng chỗ vặn, không đẩy người đi cắt nguồn bằng tay.
        gio = (tran_than - 2048) * 3 // 4        # byte mp3 lọt được
        phut = gio * 8 // (32 * 1000) // 60      # BITRATE 32 kbps
        raise QuaLonChoCua(
            f"một ĐOẠN nén còn {len(b) // 1048576} MB ⇒ thân request "
            f"~{uoc // 1048576} MB, vượt trần {tran_than // 1048576} MB của cửa. "
            f"Ở mức nén này một đoạn chỉ được ~{phut} phút, mà "
            f"`GIAY_MOI_DOAN` đang là {GIAY_MOI_DOAN // 60} phút — hạ nó xuống.")
    # Bản gửi LUÔN là mp3 sau khi nén — không suy từ đuôi file NGUỒN nữa.
    dinh = "mp3"
    bang_cua = hop_dong.doc_cua()
    cua = hop_dong.cua_cua(dong_model, bang_cua)
    khoa = os.environ.get(cua["bien_khoa"])
    if not khoa:
        raise RuntimeError(f"thiếu biến môi trường `{cua['bien_khoa']}`")

    than = {
        "model": dong_model["model"],
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": _YEU_CAU},
            # BASE64 TRẦN — KHÔNG bọc `data:audio/mpeg;base64,`.
            #
            # `beeknoee-api-guide.md` §4.3 viết `data:audio/mpeg;base64,{audio}`
            # và **cửa này từ chối đúng cái đó**. Đo 2026-09-05, cùng một clip
            # 8 giây, chỉ đổi một biến:
            #
            #   data-uri, `audio/mpeg` → 502, thân là trang lỗi HTML Cloudflare
            #   data-uri, `audio/mp3`  → 502, y hệt
            #   base64 TRẦN            → 200 + bản phiên âm THẬT
            #
            # 502 kèm HTML nghĩa là request chết ở tầng HẠ TẦNG, chưa tới model
            # — nên không có thông báo nào của API nói ta sai chỗ nào. Đây cũng
            # là thứ trước nay bị đọc nhầm thành "thân request quá lớn": lỗi
            # xuất hiện ở audio 19 phút, và không ai thử lại với clip 8 giây.
            {"type": "input_audio", "input_audio": {
                "data": base64.b64encode(b).decode(), "format": dinh}},
        ]}],
        "response_format": {"type": "json_object"},
        # Bản phiên âm DÀI hơn mọi phản hồi khác cửa này trả: 19 phút audio ra
        # ~27.000 ký tự JSON. Mặc định của cửa cắt cụt giữa chừng, và một mảng
        # JSON cụt thì `json.loads` ném — mất SẠCH bản phiên âm đã trả tiền.
        "max_tokens": TRAN_CHU,
    }
    # KHÔNG stream lối này — dù `cua.json` khai `stream: true` cho lối chưng cất.
    #
    # Đo 2026-09-05, cùng audio, đổi mỗi biến này:
    #
    #   stream: true   → nội dung CỤT ở ~175 giây transcript, với MỌI độ dài
    #                    nguồn (thử 5 phút và 10 phút, cùng ra ~175s). Cửa
    #                    không tôn trọng `max_tokens` trên lối stream.
    #   không stream   → `finish_reason: stop`, 14.382 completion token, phủ
    #                    trọn 1176s của nguồn 19 phút.
    #
    # Và ta không mất gì khi bỏ stream: phản hồi ở đây là MỘT tài liệu JSON,
    # nửa tài liệu không parse được, nên ta vẫn phải đợi hết rồi mới đọc. Tiến
    # độ từng phần (`T12-19`) đến từ `ghi_nhan` theo cue, không từ chunk SSE.
    #
    # Đánh đổi phải nói ra: lối không-stream thỉnh thoảng ăn `502` từ hạ tầng
    # trước cửa (kết nối im lặng hàng chục giây trong lúc model sinh). Đó là
    # một lần GỬI hỏng, và `M12-R6` cho đúng 2 lần — job thử lại một lần rồi
    # dừng, không có vòng retry nào ở đây.

    # WO-079 · THỬ LẠI NGẦM cho CHÍNH chunk này.
    #
    # Trước đây một 502 bay thẳng ra khỏi vòng chunk ⇒ cả job hỏng, dù phần đã
    # phiên âm vẫn đúng. Cửa Beeknoee chập chờn (đo 09-05: 3 gọi, 1 thành công),
    # nên đó là ca THƯỜNG GẶP NHẤT chứ không phải ca hiếm.
    #
    # Đây KHÁC `lan_gui` (`M12-R6`): cái đó đếm LƯỢT JOB và vẫn là 2. Chủ dự án
    # đề xuất nới nó lên 5–10; đo ra `ghi_nhan_gui` gọi một lần cho cả job
    # (`worker.py:845`), nên nới chỉ cho khởi động lại nhiều lượt hơn — mỗi lượt
    # vẫn chết ở đúng chunk ấy. Sửa đúng chỗ thì không phải nới.
    #
    # Mỗi lần thử VẪN đi qua `egress.gui()` ⇒ vẫn một dòng sổ, vẫn tính byte.
    # Thử lại ngầm không được phép là egress vô hình.
    _lan = max(1, tran_thu_lai_cua())
    _cach = giay_giai_cach_thu_lai()
    for _i in range(_lan):
        try:
            tra = (_gui or egress.gui)(
                than, f"https://{cua['host']}{cua['duong_chat']}",
                allowlist=[cua["host"]], tran=tran, log=log,
                headers={"Authorization": f"Bearer {khoa}"},
                # `tieu_egress: true` — lối này audio RỜI MÁY. Dòng log phải nói
                # ra, không thì con số egress trộn lối local với lối gửi-ra
                # (`AC-V3`).
                tieu_egress=True, loi_dung="cua-asr",
                nha_cung_cap=dong_model["nha_cung_cap"],
                model=dong_model["model"], khu_vuc=dong_model["khu_vuc"])
            break
        except Exception as e:                             # noqa: BLE001
            if _i + 1 >= _lan or not loi_tam_thoi(e):
                raise
            _cho = _cach[min(_i, len(_cach) - 1)]
            print(f"[cua-asr] doan tai {int(moc)}s: {type(e).__name__} "
                  f"({str(e)[:60]}) — thu lai {_i + 2}/{_lan} sau {_cho}s",
                  file=sys.stderr, flush=True)
            time.sleep(_cho)

    # `finish_reason` — cua NOI THANG no cat vi het token, va truoc 2026-09-08
    # khong ai doc. Giu lai de cau loi cua `kiem_phu` noi duoc VI SAO cut.
    ly_do_dung = ""
    if isinstance(tra, dict):
        try:
            ly_do_dung = str(tra["choices"][0].get("finish_reason") or "")
        except (KeyError, IndexError, TypeError):
            ly_do_dung = ""
    noi = tra["choices"][0]["message"]["content"] if isinstance(tra, dict) else tra
    # `hop_dong.doc_json` — CÙNG phép gỡ khung với `openai.py`. Model trả
    # ```json … ``` dù request khai `json_object`, và bản đầu chỉ sửa ở adapter
    # chưng cất nên lối transcript chết đúng cùng một lỗi.
    try:
        d = hop_dong.doc_json(noi, cho="cua-asr")
        doan = d["doan"]
    except Exception:                                   # noqa: BLE001
        # VỚT bản cụt. Phản hồi bị cắt giữa chừng vẫn chứa hàng trăm cue ĐÚNG
        # và ta đã trả tiền cho tất cả — ném hết đi để lấy một `HinhDangSai`
        # sạch sẽ là đánh đổi sai chiều.
        #
        # Vớt chứ không vá: chỉ lấy những object ĐÓNG NGOẶC đủ. Object cuối
        # dang dở bị bỏ, không đoán phần thiếu — một cue bịa nửa câu tệ hơn
        # một cue vắng, vì nó vào thẳng hiện vật.
        doan = _vot_cue_cut(noi)
        if not doan:
            raise
    ra, bo = [], 0
    for x in doan:
        # BỎ cue thiếu mốc, không đoán mốc thay nó. Model thỉnh thoảng trả một
        # phần tử khuyết `tu`/`den`; suy mốc từ cue liền trước là bịa một con
        # số đi thẳng vào file `.vtt`, và không ai đọc file đó biết nó là số
        # bịa. Bỏ một cue thì mất một câu — thấy được; đoán một cue thì sai
        # lệch cả phần còn lại của dòng thời gian.
        try:
            tu, den = float(x["tu"]), float(x["den"])
        except (KeyError, TypeError, ValueError):
            bo += 1
            continue
        # WO-079 · BỎ luôn cue ĐẢO MỐC — cùng lý lẽ, cùng cách xử.
        #
        # Đo trên job thật 2026-09-09: model trả một cue `tu=743.8 den=687.8`,
        # tức kết thúc TRƯỚC lúc bắt đầu. `vtt.dung()` từ chối cả file ⇒ job
        # hỏng và **172 cue tốt bị vứt**. Một phần tử rác không được quyền giết
        # cả lượt phiên âm — đúng điều dòng chú thích ngay trên đã nói cho ca
        # "thiếu mốc", chỉ là chưa ai áp cho ca "mốc đảo".
        #
        # `den <= tu`, không phải `<`: một cue dài 0 giây cũng không dựng được
        # thành `.vtt` hợp lệ, và nó không mang thông tin nào.
        if den <= tu:
            bo += 1
            continue
        # CỘNG `moc` — đưa mốc của đoạn về dòng thời gian của NGUỒN.
        cue = {"tu": tu + moc, "den": den + moc,
               "text": str(x.get("text", "")).strip()}
        ra.append(cue)
        if ghi_nhan:
            ghi_nhan(cue)
    if bo:
        print(f"[cua-asr] bỏ {bo} cue thiếu mốc hoặc đảo mốc", file=sys.stderr)
    # PHỦ HOẶC NÉM. Đây là phép chặn duy nhất đứng giữa *"model trả bản cụt"*
    # và *"một `.vtt` hợp lệ, mở được, và thiếu một nửa video"*.
    #
    # Đo độ dài THẬT của file đoạn, không dùng hằng `GIAY_MOI_DOAN`: đoạn cuối
    # bao giờ cũng ngắn hơn, và so với hằng sẽ ném oan đúng một lần mỗi job.
    #  khi nguoi goi la vong  cua : o do do phu
    # KHONG con la mot phep chan, no la TIN HIEU dieu khien — cut thi vong sau
    # bat dau som hon, chu khong phai mot loi. Giu phep chan cho moi nguoi goi
    # KHAC, de mot duong goi thang khong lang le nhan ban cut.
    if kiem:
        kiem_phu(ra, dai_doan=thoi_luong(duong_gui), moc=moc, ly_do=ly_do_dung)
    return ra


def ten_model(dong_model: dict) -> str:
    """Model đã dùng — vào `kieu_moc`/frontmatter của hiện vật (`AC-V1`)."""
    return dong_model["model"]
