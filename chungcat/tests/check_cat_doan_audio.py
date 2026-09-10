"""T12-22 · nguồn dài: cắt đoạn → gửi từng đoạn → gộp lại.

Chủ dự án chốt 2026-09-05: *"Bản chất là chunk và concat chứ có phải gửi đi gửi
lại 1 request đâu mà vi phạm"* — `M12-R6` là trần THỬ LẠI, không phải trần số
mảnh của một lần thử. Cổng này canh đúng ranh giới đó.

0 mạng, 0 model: `phien_am` nhận `_gui` tiêm vào để giả cửa.
"""

from __future__ import annotations

import shutil
import subprocess
import re
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import asr_cua                                                  # noqa: E402

loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


def _dung_audio(tmp: Path, giay: int) -> Path:
    d = tmp / f"n{giay}.mp3"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
         f"sine=frequency=440:duration={giay}", "-ac", "2", "-ar", "44100",
         "-b:a", "96k", str(d)], check=True)
    return d


def main() -> int:
    if not shutil.which("ffmpeg"):
        print("BỎ QUA — máy không có `ffmpeg`")
        return 0
    print("T12-22 · cắt đoạn + gộp")

    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)

        # ── AC1 · cắt đúng số đoạn theo trần thời lượng ───────────────────
        g = _dung_audio(tmp, 1500)                 # 25 phút
        doan = asr_cua.cat_doan(g, giay_moi_doan=600, thu_muc=tmp)
        bao(len(doan) == 3, "AC1 · 25 phút / 10 phút ⇒ 3 đoạn",
            f"{len(doan)} đoạn")
        bao([round(x[1]) for x in doan] == [0, 600, 1200],
            "AC1b · mốc bắt đầu mỗi đoạn đúng",
            str([round(x[1]) for x in doan]))

        # ── AC2 · nguồn ngắn KHÔNG bị cắt ────────────────────────────────
        ng = _dung_audio(tmp, 120)
        bao(len(asr_cua.cat_doan(ng, giay_moi_doan=600, thu_muc=tmp)) == 1,
            "AC2 · nguồn ngắn hơn một đoạn ⇒ 1 đoạn, không cắt vô ích")

        # ── AC3 · mốc cue được DỜI theo vị trí đoạn ──────────────────────
        #
        # Đây là vế dễ sai nhất và sai thì KHÔNG AI THẤY: mỗi đoạn về từ cửa
        # với mốc đếm từ 0 của CHÍNH NÓ. Quên cộng offset thì bản transcript
        # 25 phút có ba lần chạy lại từ 0 giây — file `.vtt` vẫn hợp lệ, vẫn
        # mở được, và sai hoàn toàn.
        goi: list[Path] = []

        def gui_gia(than, url, **kw):
            # Cue PHU gan tron doan. Ban truoc tra 2 cue o giay 1-4 cho mot
            # doan 10 PHUT — tuc no mo phong dung ca HONG ma chu du an vua
            # bao (video 29 phut chi transcript 21 phut), roi khang dinh phep
            # lap dung. Tu 2026-09-08 `kiem_phu` nem cho ca ay, va no nem ca
            # cho fixture nay — DUNG.
            #
            # Fixture nay do phep DOI MOC, khong do do phu. Nen no phai la
            # mot phan hoi THUC TE: cue dau va cue GAN CUOI doan.
            goi.append(url)
            return {"choices": [{"message": {"content":
                    '{"doan": [{"tu": 1.0, "den": 2.0, "text": "a"},'
                    ' {"tu": 590.0, "den": 596.0, "text": "b"}]}'}}]}

        # Khoá GIẢ. Cổng này đo phép LẮP (cắt · dời mốc · gộp), và phép chặn
        # "thiếu khoá" nằm trước chỗ `_gui` được tiêm. Đặt một khoá giả ở đây
        # KHÔNG nới phép chặn nào: `_gui` thay `egress.gui`, nên không byte nào
        # rời máy dù khoá có thật hay không.
        import os
        cua_bk = asr_cua.hop_dong.cua_cua(
            {"model": "gia/model"}, asr_cua.hop_dong.doc_cua())
        os.environ.setdefault(cua_bk["bien_khoa"], "khoa-gia-cho-cong")

        dong = {"model": "gia/model", "nha_cung_cap": "gia",
                "khu_vuc": "tai-cho", "ho_tro_audio": True}
        cue = asr_cua.phien_am(g, dong_model=dong, log=tmp / "e.jsonl",
                               tran=10 ** 9, giay_moi_doan=600, _gui=gui_gia)
        moc = [c["tu"] for c in cue]
        # Tu 2026-09-08 ranh do KET QUA quyet, khong con la 0/600/1200 cung.
        # Fixture tra cue cuoi ket thuc o 596s, nen vong sau bat tu 596 —
        # va do CHINH LA thiet ke *tiep tu cho dut* chay dung. Khoa con so
        # tuyet doi o day la khoa mot ranh ma he khong con dung.
        #
        # Bat bien con lai, va no van la bat bien cu: moc duoc DOI theo vi tri
        # doan, va moi doan bat dau tu cho doan truoc dung.
        bao(len(moc) == 6 and moc[0] == 1.0 and moc[2] > 590.0
            and moc[4] > moc[3],
            "AC3 · mốc cue dời theo offset, và đoạn sau nối chỗ đoạn trước dừng",
            str(moc))
        bao(moc == sorted(moc), "AC3b · dòng thời gian TĂNG DẦN sau khi gộp")

        # ── AC4 · mỗi đoạn một lời gọi ───────────────────────────────────
        bao(len(goi) == 3, "AC4 · 3 đoạn ⇒ 3 lời gọi cửa", f"{len(goi)} lời gọi")

        # ── AC6 · gọi KHÔNG truyền `giay_moi_doan` cũng phải chạy ────────
        #
        # Bug thật 2026-09-08 trên job của chủ dự án:
        #     TypeError: '<' not supported between 'float' and 'NoneType'
        #
        # Mặc định đổi sang `None` (đọc bảng khai), và `phien_am` quên giải nó
        # — `min(None, …)` nổ. Nó LỌT qua mọi cổng vì cả ba lời gọi ở trên đều
        # truyền `giay_moi_doan=600` tường minh, tức KHÔNG cổng nào đi qua
        # đường mặc định — mà đường mặc định chính là đường worker đi.
        #
        # Một tham số có mặc định mà không phép kiểm nào dùng mặc định ấy là
        # một nhánh chưa từng chạy.
        goi.clear()
        try:
            cue2 = asr_cua.phien_am(ng, dong_model=dong, log=tmp / "e2.jsonl",
                                    tran=10 ** 9, _gui=gui_gia)
            bao(len(cue2) > 0, "AC6 · gọi theo MẶC ĐỊNH (đường worker đi) chạy được",
                f"{len(cue2)} cue")
        except TypeError as e:
            bao(False, "AC6 · gọi theo MẶC ĐỊNH (đường worker đi) chạy được",
                f"TypeError: {e}")

        # ── AC5 · một lần THỬ = một `lan_gui`, không phải một đoạn một ────
        #
        # Ranh giới chủ dự án chốt. Đếm theo đoạn thì nguồn 60 phút tự chạm
        # trần 2 ngay lần thử ĐẦU TIÊN, và `M12-R6` biến thành trần độ dài
        # nguồn — thứ nó không bao giờ định là.
        src = (R / "chungcat" / "src" / "asr_cua.py").read_text(encoding="utf-8")
        i = src.index("def phien_am")
        than = src[i:]
        j = than.index("for ")
        # BO COMMENT truoc khi do: bat bien la *khong co loi GOI* trong vong lap,
        # khong phai *chu ay khong xuat hien*. Comment giai thich chinh co che
        # nay co nhac ten no, va mot loi giai thich TOT khong duoc lam cong do.
        bao("ghi_nhan_gui(" not in re.sub(r"#.*", "", than[j:]),
            "AC5 · KHÔNG đếm `lan_gui` bên trong vòng lặp đoạn")

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
