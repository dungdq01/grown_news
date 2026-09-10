"""T12-26 · JOB tải video theo CHẤT LƯỢNG — cổng.

Chất lượng ở đây là THẬT, không phải transcode: host giữ sẵn các bậc và
`yt-dlp -f` chọn bậc **lúc tải**. Nên phép kiểm phải bắt được đúng một thứ —
**tham số format có thật sự mang trần chiều cao người chọn không** — chứ không
bắt "có chạy được yt-dlp không" (đó là kiểm mạng, không phải kiểm luật).

0 mạng · 0 model · file về thư mục tạm.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import uuid
import time
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "chungcat" / "src"))

loi = 0


def ok(d, cau, vs=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {cau}" + ("" if d or not vs else f"  {vs}"))
    if not d:
        loi += 1


print("\nT12-26 · tải video theo chất lượng\n")

# ── 1 · bảng khai: bậc và hạn dọn là DỮ LIỆU, không phải số trong mã ──────
bang = json.loads((GOC / "chungcat/assets/nguong.json").read_text(encoding="utf-8"))
# `nguon-transcript.json` là bảng KHÁC (host + trần byte) — hai bảng, hai chủ.
bang_nguon = json.loads(
    (GOC / "chungcat/assets/nguon-transcript.json").read_text(encoding="utf-8"))
ok("chat_luong" in bang, "1 · `nguong.json` khai `chat_luong`",
   "bậc gõ cứng trong mã thì FE và worker có hai danh sách, và ngày chúng "
   "lệch nhau không cổng nào báo")
ok(bang.get("chat_luong") == [360, 480, 720, 1080, "goc"],
   "1b · đúng năm bậc [360,480,720,1080,goc]")
ok(isinstance(bang.get("tran_xuat_tam_gio"), int) and bang["tran_xuat_tam_gio"] > 0,
   "1c · có `tran_xuat_tam_gio` (giờ) — hạn dọn file tạm")
ok(any(k.startswith("$vi_sao") and "chat_luong" in k for k in bang),
   "1d · bảng khai NÓI VÌ SAO", "một con số không kèm lý do là một con số "
   "người sau sẽ đổi bừa")

# ── 2 · format selector MANG trần chiều cao ──────────────────────────────
import tai_nguon  # noqa: E402

ra = Path(tempfile.gettempdir()) / "t1226-thu.mp4"
lenh = tai_nguon.lenh_tai_video("https://www.youtube.com/watch?v=x", ra, 480, bang_nguon)
chuoi = " ".join(lenh)
ok("-f" in lenh, "2 · lệnh có `-f` (chọn định dạng)")
ok("height<=480" in chuoi, "2b · format mang `height<=480`",
   f"đo được: {chuoi[:160]}")
ok("-x" not in lenh, "2c · KHÔNG `-x` — đây là tải VIDEO, không phải bóc audio",
   "`lenh_tai` (T12-17) bóc audio cho ASR; dùng lại nguyên nó ở đây thì người "
   "chọn 480p nhận về một file mp3")
lenh_goc = tai_nguon.lenh_tai_video("https://www.youtube.com/watch?v=x", ra, "goc", bang_nguon)
ok("height<=" not in " ".join(lenh_goc),
   "2d · bậc `goc` KHÔNG áp trần chiều cao nào")

# ── 3 · bậc ngoài bảng bị TỪ CHỐI, và câu từ chối kể bậc được phép ───────
try:
    tai_nguon.lenh_tai_video("https://www.youtube.com/watch?v=x", ra, 4320, bang_nguon)
    ok(False, "3 · bậc ngoài bảng ⇒ ném", "nhận bừa một bậc là hứa một thứ "
       "host không có, và job sẽ chết ở giữa chừng thay vì chết ngay")
except Exception as e:
    ok(True, "3 · bậc ngoài bảng ⇒ ném")
    ok("360" in str(e) and "720" in str(e),
       "3b · câu từ chối KỂ RA bậc được phép", f"đo được: {str(e)[:120]}")

# ── 4 · host ngoài allowlist chặn TRƯỚC request (dùng lại T12-17) ────────
try:
    tai_nguon.lenh_tai_video("https://khong-co-trong-allowlist.example/v", ra, 480, bang_nguon)
    ok(False, "4 · host lạ ⇒ chặn TRƯỚC khi dựng lệnh")
except Exception:
    ok(True, "4 · host lạ ⇒ chặn TRƯỚC khi dựng lệnh")

# ── 5 · thư mục tạm NGOÀI repo ──────────────────────────────────────────
import worker  # noqa: E402

d = worker.duong_xuat_tam()
ok(isinstance(d, Path), "5 · `worker.duong_xuat_tam()` trả một đường")
try:
    d.resolve().relative_to(GOC.resolve())
    trong_repo = True
except ValueError:
    trong_repo = False
ok(not trong_repo, f"5b · và nó NẰM NGOÀI repo ({d})",
   "một video là hàng trăm MB; nhét vào kho là đầy lfs sau vài lần bấm")

# ── 6 · dọn theo TUỔI, và chỉ dọn file của mình ──────────────────────────
with tempfile.TemporaryDirectory() as tmp:
    t = Path(tmp)
    # Id việc do CHÍNH BỘ SINH THẬT tạo ra (`uuid4().hex`), không phải một
    # chuỗi tôi tự bịa cho vừa khuôn. Bản trước dùng ULID giả 26 ký tự và cổng
    # XANH trong khi khuôn thật `{26}` không khớp một file thật nào — fixture
    # sai thì nó chứng minh cái sai.
    cu = t / (uuid.uuid4().hex + "-480p.mp4")
    cu.write_bytes(b"x")
    gia = time.time() - (bang["tran_xuat_tam_gio"] + 1) * 3600
    os.utime(cu, (gia, gia))
    moi = t / (uuid.uuid4().hex + "-720p.mp4")
    moi.write_bytes(b"y")
    nguoi_khac = t / "anh-cua-nguoi-ta.png"
    nguoi_khac.write_bytes(b"z")
    os.utime(nguoi_khac, (gia, gia))

    worker.don_xuat_tam(t, bang["tran_xuat_tam_gio"])
    ok(not cu.exists(), "6 · file QUÁ HẠN bị dọn")
    ok(moi.exists(), "6b · file còn hạn GIỮ NGUYÊN")
    ok(nguoi_khac.exists(),
       "6c · file KHÔNG PHẢI của job này thì KHÔNG đụng",
       "dọn theo tuổi mà không lọc theo khuôn tên là một lệnh xoá thư mục tạm "
       "của cả máy — và `%TEMP%` là nhà chung")

# ── 7 · worker nhận `loai: tai-video` ────────────────────────────────────
ok("tai-video" in worker.BANG_LOAI, "7 · `BANG_LOAI` có `tai-video`")

# ── 8 · khuôn tên phải khớp ID THẬT của hệ ──────────────────────────────
#
# Đo bằng bộ sinh THẬT, không bằng một chuỗi mẫu: đây đúng chỗ bản trước lọt
# — khuôn khai `{26}` (ULID) trong khi `api.py` sinh `uuid4().hex` 32 ký tự,
# nên cửa tải trả 422 cho MỌI file có thật.
for bac in ("360", "720", "goc"):
    ten = f"{uuid.uuid4().hex}-{bac}p.mp4"
    ok(bool(worker._KHUON_TAM.match(ten)),
       f"8 · khuôn khớp tên thật `<id>-{bac}p.mp4`",
       f"đo: {ten} · khuôn: {worker._KHUON_TAM.pattern}")

cua = (GOC / "web/api/tho-cua.mjs").read_text(encoding="utf-8")
ok("[0-9a-fA-F]{32}" in cua,
   "8b · cửa web dùng CÙNG khuôn 32 hex",
   "hai khuôn cho một tên là hai chỗ để lệch — và bên lệch sẽ im lặng 422")

print(f"\n{'ĐỎ — %d vế' % loi if loi else 'pass · bậc là thật, file ngoài repo, dọn có hạn'}")
sys.exit(1 if loi else 0)
