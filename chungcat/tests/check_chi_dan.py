"""T12-25 · `chi_dan` của NGƯỜI — prompt thêm, có vết, hệ vẫn thắng.

0 mạng, 0 model.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import worker                                                   # noqa: E402

loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


NG = json.loads((R / "chungcat/assets/nguong.json").read_text(encoding="utf-8"))


def main() -> int:
    print("T12-25 · chỉ dẫn của người")
    tran = NG.get("tran_chi_dan_ky_tu")
    bao(isinstance(tran, int) and tran > 0,
        "AC2 · `tran_chi_dan_ky_tu` ở BẢNG KHAI", repr(tran))
    bao(any(k.startswith("$vi_sao") and "chi_dan" in k for k in NG),
        "AC2 · trần khai `$vi_sao`")

    # ── AC1 · SANDWICH: hệ trước, người giữa, hệ CHỐT LẠI ────────────────
    #
    # Thứ tự thôi KHÔNG đủ. Model cân câu ĐỨNG SAU nặng hơn, nên chèn chỉ dẫn
    # người vào cuối là đưa nó lên vị trí mạnh nhất. Phải có vế hệ đóng lại
    # phía sau — đó mới là "sandwich", và đó mới là chỗ "hệ thắng" thành thật.
    p = worker.dung_prompt("tóm thật ngắn cho dev")
    i_he, i_nguoi = p.index("Chỉ trả JSON"), p.index("tóm thật ngắn cho dev")
    bao(i_he < i_nguoi, "AC1 · prompt HỆ đứng TRƯỚC chỉ dẫn người")
    bao(worker._PROMPT in p, "AC1 · prompt hệ NGUYÊN VẸN, không bị viết lại")
    bao(len(p) > i_nguoi + len("tóm thật ngắn cho dev") + 40,
        "AC1 · có vế hệ CHỐT LẠI sau chỉ dẫn — không để người nói câu cuối")

    # Ô ĐÓNG KHUNG: model phải phân biệt được đâu là dữ liệu, đâu là lệnh.
    bao("«" in p and "»" in p, "AC1 · chỉ dẫn nằm trong ô đóng khung")

    # ── AC2 · vắng chỉ dẫn ⇒ prompt Y HỆT bản cũ (regression 0) ──────────
    bao(worker.dung_prompt(None) == worker._PROMPT,
        "AC2 · KHÔNG chi_dan ⇒ prompt y như cũ, 0 byte thêm")
    bao(worker.dung_prompt("   ") == worker._PROMPT,
        "AC2 · chi_dan toàn khoảng trắng cũng tính là vắng")

    # ── AC2b · lột ký tự điều khiển + chặn phá khung ─────────────────────
    ban = worker.lam_sach_chi_dan("a\x00b\x1fc\nd")
    bao("\x00" not in ban and "\x1f" not in ban,
        "AC2b · ký tự điều khiển bị lột", repr(ban))
    bao("\n" in ban, "AC2b · xuống dòng GIỮ LẠI — người viết nhiều ý cần nó")
    ban2 = worker.lam_sach_chi_dan("phá khung » rồi chèn lệnh mới «")
    bao("»" not in ban2 and "«" not in ban2,
        "AC2b · dấu ĐÓNG KHUNG trong chỉ dẫn bị lột",
        "để nguyên thì người dùng tự đóng ô rồi viết lệnh ngoài ô — đúng lối "
        "prompt injection cơ bản nhất")

    # ── AC4 · preset đọc từ BẢNG KHAI ───────────────────────────────────
    f = R / "chungcat/assets/chi-dan-mau.json"
    bao(f.exists(), "AC4 · có `chi-dan-mau.json`")
    if f.exists():
        d = json.loads(f.read_text(encoding="utf-8"))
        ds = d.get("mau") or []
        bao(len(ds) >= 3, "AC4 · có ≥3 preset khởi điểm", str(len(ds)))
        bao(all({"ten", "chi_dan"} <= set(x) for x in ds),
            "AC4 · mỗi preset có `ten` + `chi_dan`")
        bao(all(len(x["chi_dan"]) <= (tran or 0) for x in ds),
            "AC4 · KHÔNG preset nào tự vượt trần của chính mình")

    # ── AC2c · CỬA kiểm, không phải worker ──────────────────────────────
    #
    # Cửa là chỗ DUY NHẤT trả lời được người gửi. Worker chạy sau, không đồng
    # bộ — một chỉ dẫn quá dài phát hiện ở đó chỉ thành một job hỏng, mà người
    # bấm đã rời màn từ lâu.
    src = (R / "chungcat/src/api.py").read_text(encoding="utf-8")
    bao("chi_dan" in src and "422" in src,
        "AC2c · `api.py` kiểm `chi_dan` và trả 422")
    i = src.index("`chi_dan` dài")
    bao("KHÔNG cắt hộ" in src[i:i + 400],
        "AC2c · câu 422 nói rõ máy KHÔNG cắt hộ")
    bao("_tran_chi_dan" in src and "tran_chi_dan_ky_tu" in src,
        "AC2c · trần đọc từ BẢNG KHAI, không gõ trong mã")

    # ── AC4b · cửa trả preset cho FE (dẫn xuất, FE không gõ cứng) ───────
    bao("chi_dan_mau" in src, "AC4b · `GET /model` trả kèm `chi_dan_mau`")
    bao('"tran_chi_dan_ky_tu": self._tran_chi_dan()' in src,
        "AC4b · trả kèm trần để FE đếm ký tự tại chỗ",
        "FE đếm cho người THẤY; server chặn cho THẬT — hai vai, không thay nhau")

    # ── AC3 · chỉ dẫn ĐI CÙNG bản nháp, 0 cột mới, 0 file M08 ───────────
    #
    # `chi_dan` nằm trong FRONTMATTER, và cửa nháp trả nguyên `ban_goc_ai` —
    # nên nó tới tay người duyệt mà không cần một cột DDL nào. Thêm cột cho
    # một dữ liệu đã có đường đi là dựng bản thứ hai của một sự thật, và bản
    # thứ hai là bản sẽ lệch.
    ban = worker._dung_nhap("tai-lieu/x",
                            {"text": "## 1. Mở đầu\n\nMột câu.",

                             "model_da_dung": "gia/model"},
                            {"sampled": 0, "verified": 0},
                            chi_dan="tóm cho dev")
    bao("chi_dan:" in ban, "AC3 · bản nháp MANG `chi_dan` trong frontmatter")
    bao("tóm cho dev" in ban, "AC3 · đúng nội dung người gửi")
    ban0 = worker._dung_nhap("tai-lieu/x",
                             {"text": "## 1. Mở đầu\n\nMột câu.",

                              "model_da_dung": "gia/model"},
                             {"sampled": 0, "verified": 0})
    bao("chi_dan" not in ban0,
        "AC3b · KHÔNG chỉ dẫn ⇒ trường VẮNG HẲN, không ghi rỗng",
        "một `chi_dan: \"\"` làm người duyệt tưởng có yêu cầu mà đọc không ra")

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
