"""T12-21 · nén audio trước khi gửi cửa — `WO-054`.

0 mạng, 0 model. Dùng audio THẬT đã tải trong `hang-doi/`; vắng thì dựng một
file 19 phút bằng `ffmpeg` (nguồn `sine`) — cùng độ dài, cùng bài toán.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import asr_cua                                                  # noqa: E402

GIAY_THAT = 1133.0            # độ dài ba file audio đã tải — WO-054
loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


def _nguon(tmp: Path) -> Path:
    """Audio ĐÚNG `GIAY_THAT` giây, LUÔN tự dựng. Không mượn file trong kho.

    Bản trước lấy `hang-doi/**/*.audio.mp3` đầu tiên nếu có — *"file thật nếu
    có"*. Nghe hợp lý và nó làm cổng này thành một phép đo **may rủi**:

    Đo 2026-09-08 — một job của chủ dự án để lại `*.audio.mp3` dài **29.4
    phút**, trong khi cổng khai `GIAY_THAT` ~19 phút. Bản nén ra 7,0 MB, base64
    thành ~9,4 MB, vượt trần thân 8 MiB ⇒ `AC1` ĐỎ. Không dòng mã nào sai; chỉ
    là thư mục có một file khác hôm qua.

    Một cổng đổi phán quyết theo rác đang nằm trong thư mục là cổng người ta
    học cách bỏ qua — và bỏ qua đúng lúc nó đỏ THẬT.

    Nguồn phải do CHÍNH cổng dựng, độ dài do CHÍNH nó khai.
    """
    d = tmp / "nguon.mp3"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
         f"sine=frequency=440:duration={int(GIAY_THAT)}",
         "-ac", "2", "-ar", "44100", "-b:a", "96k", str(d)],
        check=True)
    return d


def _ffprobe(d: Path) -> dict:
    ra = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=channels,sample_rate", "-of", "json", str(d)],
        capture_output=True, text=True, check=True)
    return json.loads(ra.stdout)["streams"][0]


def main() -> int:
    if not shutil.which("ffmpeg"):
        print("BỎ QUA — máy không có `ffmpeg`")
        return 0
    tran = asr_cua.doc_nguon()["tran_than_cua_byte"]
    print(f"T12-21 · nén audio (trần thân {tran // 1048576} MiB)")

    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        g = _nguon(tmp)
        goc = g.stat().st_size
        print(f"  nguồn: {g.name}  {goc} byte  ⇒ base64 ~{goc * 4 // 3}")
        bao(goc * 4 // 3 > tran, "nguồn GỐC vượt trần — nếu không thì bài toán "
                                 "này không tồn tại và cổng đang đo nhầm")

        # ── AC1 · nén xong lọt trần ───────────────────────────────────────
        n = asr_cua.nen_cho_cua(g, thu_muc=tmp)
        by = Path(n).stat().st_size
        bao(by * 4 // 3 + 2048 < tran, "AC1 · bản nén lọt trần thân",
            f"{by} byte ⇒ base64 ~{by * 4 // 3}")

        # ── AC2 · mono 16 kHz, đọc bằng ffprobe ───────────────────────────
        s = _ffprobe(Path(n))
        bao(int(s["channels"]) == 1, "AC2 · mono", f"channels={s['channels']}")
        bao(int(s["sample_rate"]) == 16000, "AC2 · 16 kHz",
            f"sample_rate={s['sample_rate']}")

    # ── AC3 · trần vẫn kiểm SAU nén; câu lỗi nói được số phút lọt ─────────
    src = (R / "chungcat" / "src" / "asr_cua.py").read_text(encoding="utf-8")
    i = src.index("def phien_am")
    than = src[i:]
    bao(than.index("nen_cho_cua") < than.index("QuaLonChoCua("),
        "AC3 · nén CHẠY TRƯỚC phép kiểm trần, không thay thế nó")
    bao("phút" in than[than.index("QuaLonChoCua("):][:900],
        "AC3 · câu `QuaLonChoCua` nói được số phút lọt được")

    # ── AC4 · ffmpeg vắng ⇒ câu đọc được ─────────────────────────────────
    bao("ffmpeg" in src and "KhongCoFfmpeg" in src,
        "AC4 · có lớp lỗi riêng cho `ffmpeg` vắng")

    # ── HÌNH DẠNG REQUEST · năm phát hiện đo trên cửa thật 2026-09-05 ────
    #
    # Cả năm đều là thứ ĐẢO NGƯỢC ĐƯỢC bằng một lần "dọn dẹp cho gọn", và mỗi
    # cái đã tốn một vòng chẩn đoán. Khoá lại ở đây.

    # 1 · base64 TRẦN. Data-URI ⇒ 502 + HTML Cloudflare, chưa tới model.
    bao("data:audio" not in than or "KHÔNG bọc" in than,
        "REQ1 · gửi base64 trần, không bọc `data:` URI")
    bao('"data": base64.b64encode(b).decode()' in than,
        "REQ1b · trường `data` là base64 thuần")

    # 2 · `max_tokens`. Vắng ⇒ cửa cắt giữa mảng JSON, mất sạch bản đã trả tiền.
    bao("max_tokens" in than, "REQ2 · có `max_tokens` cho phản hồi dài")

    # 3 · KHÔNG stream. Stream cắt ở ~175 giây transcript với mọi độ dài nguồn.
    bao('than["stream"] = True' not in than,
        "REQ3 · lối ASR không stream (cửa bỏ qua `max_tokens` khi stream)")

    # 4 · vớt phải TỰ BẮT NHỊP LẠI sau một object hỏng.
    cut = ('{"doan": [{"tu": 1, "den": 2, "text": "a"}, '
           '{"v": "3, "den": 4, "text": "hỏng"}, '
           '{"tu": 5, "den": 6, "text": "b"}, {"tu": 7, "den": 8, "text": "c"}]}')
    v = asr_cua._vot_cue_cut(cut)
    du = [x for x in v if "tu" in x and "den" in x]
    bao(len(du) >= 3, "REQ4 · vớt bắt nhịp lại sau object hỏng",
        f"{len(du)} cue đọc được / 3 cue lành")

    # 5 · nhánh KHÔNG-stream của egress phải mang `headers` và trả dict.
    eg = (R / "chungcat" / "src" / "egress.py").read_text(encoding="utf-8")
    i2 = eg.index("def _httpx_post")
    nhanh = eg[i2:i2 + 1400]
    bao("headers=kw.get(\"headers\")" in nhanh,
        "REQ5 · nhánh không-stream mang `headers` (nếu không: mất Authorization)")
    bao("r.json()" in nhanh, "REQ5b · nhánh không-stream trả dict, không `Response`")
    bao("so_chunk += 1" in eg, "REQ5c · `so_chunk` tăng thật, không nói dối chunk=0")

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
