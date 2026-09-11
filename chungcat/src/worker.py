#!/usr/bin/env python3
"""WORKER — nối hàng đợi → model → verify → cửa C2 của LÕI.

Audit 2026-09-04: mọi mảnh đã có như thư viện (`vong` · `egress` · `verify` ·
adapter · `POST /api/nhap-chung-cat`) nhưng **không dòng nào lấy job từ `new/`
chạy**. `POST /job` hôm nay để lại một job `cho` vĩnh viễn.

    python -m worker --mot    # một job rồi thoát (test/cron)
    python -m worker --vong   # thường trực

DISPATCH THEO BẢNG, không theo chuỗi `if`: thêm một `loai` = thêm MỘT ENTRY.
Một chuỗi `if` thì thêm loại là sửa một hàm, và quên một nhánh không ai báo.
"""

from __future__ import annotations

from collections import deque

import subprocess

import tempfile

import argparse
import contextlib
import json
import re
import os
import threading
import sys
import time
import shutil
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
ASSETS = R / "chungcat" / "assets"
DICH_VU = R / "core" / "assets" / "dich-vu.json"

import bang_khai  # noqa: E402
import tai_nguon  # noqa: E402
import dinh_tuyen  # noqa: E402
import egress  # noqa: E402
import nhat_ky
import vong  # noqa: E402
import verify  # noqa: E402
from adapter import hop_dong  # noqa: E402

# HAI CHIỀU, HAI KHOÁ — đừng trộn.
#   `CHUNGCAT_KHOA_LOI`  LÕI → THỢ. `api.py::_tu_loi()` soi nó ở header
#                        `X-Khoa-Loi`. Worker KHÔNG dùng khoá này.
#   `KHOA_DICH_VU`       THỢ → LÕI. `dungchung.mjs::loiKiemKhoaDichVu` soi nó
#                        ở `x-khoa-dich-vu` + `x-aud: loi` (FR-047).
# Đo 2026-09-04: worker gửi khoá chiều thứ nhất vào cửa chiều thứ hai ⇒ LÕI trả
# 401 "không được phép" ở giai đoạn CUỐI, sau khi đã tiêu một lời gọi model.
# Lần thứ TƯ hôm nay của lớp lỗi "hai tên cho một vai" — và lần này nó đắt nhất:
# job chết SAU khi tốn token.
BIEN_KHOA_DICH_VU = "KHOA_DICH_VU"


class ViecHong(Exception):
    """Job không chạy được. Mang giai đoạn hỏng để `chay_lai` biết chỗ."""

    def __init__(self, giai_doan: str, vi_sao: str):
        super().__init__(f"[{giai_doan}] {vi_sao}")
        self.giai_doan = giai_doan


def goc_hang_doi() -> Path:
    """Gốc Maildir — trả về `vong.goc_mac_dinh()`, KHÔNG một bản thứ hai.

    MỌI test/smoke phải đặt `CHUNGCAT_HANG_DOI` — một hàng đợi trong repo làm
    `git status` bẩn, và công cụ quy chủ mù đi đúng lúc cần nó nhất (`WO-039`).
    """
    return vong.goc_mac_dinh()


def _cua_loi() -> str:
    """Địa chỉ LÕI, đọc từ bảng khai dịch vụ — không gõ số cổng (`Z6`)."""
    d = json.loads(DICH_VU.read_text(encoding="utf-8"))
    for x in (d.get("dich_vu") or d.get("services") or []):
        if x.get("ten") in ("web", "loi", "core"):
            return f"http://127.0.0.1:{x['cong']}"
    raise ViecHong("cho", "bảng khai dịch vụ không có dòng cho LÕI")


def _goi_loi(duong: str, than: dict, nguoi=None) -> dict:
    """POST vào cửa của LÕI. Khoá dịch vụ ở env SERVER, không trong payload."""
    khoa = os.environ.get(BIEN_KHOA_DICH_VU)
    if not khoa:
        raise ViecHong(
            "dang-verify",
            f"thiếu `{BIEN_KHOA_DICH_VU}` — đây là khoá chiều THỢ→LÕI (FR-047), "
            f"KHÔNG phải `CHUNGCAT_KHOA_LOI` của chiều ngược lại")
    rq = urllib.request.Request(
        _cua_loi() + duong, method="POST",
        data=json.dumps(than, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-khoa-dich-vu": khoa,
                 "x-aud": "loi", **({"X-Nguoi-Dung": nguoi} if nguoi else {})})
    try:
        with urllib.request.urlopen(rq, timeout=30) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise ViecHong("dang-verify",
                       f"LÕI trả {e.code}: {e.read()[:200]!r}") from e


def _doc_nguon(slug: str) -> list[dict]:
    """Đọc nguyên liệu QUA API của LÕI (quyết 1a) — không mở `kb/**`.

    Trả về khối kèm NEO. Neo đi cùng text để model trích được kèm địa chỉ, còn
    vị trí cuối cùng vẫn do `verify.dinh_vi()` của TA tính lại (`AC-3.2`).
    """
    url = f"{_cua_loi()}/api/articles/{slug}"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            d = json.loads(r.read() or b"{}")
    except (urllib.error.URLError, OSError) as e:
        raise ViecHong("dang-doc-nguon", f"không đọc được `{slug}`: {e}") from e
    than = d.get("than") or d.get("body") or ""
    if not than:
        raise ViecHong("dang-doc-nguon", f"bản ghi `{slug}` không có thân")
    # MANG THEO NHÃN (`T12-24`). Lời gọi này đã lấy cả bản ghi rồi vứt hết trừ
    # thân — trong khi `category`/`concepts` mà bản chưng cất cần kế thừa nằm
    # ngay trong phản hồi ấy. Đi lấy lần thứ hai là một request thừa cho một
    # dữ liệu đã nằm trong tay.
    # Nhãn nằm trong `frontmatter`, KHÔNG ở cấp cao nhất.
    #
    # Bản đầu của tôi đọc `d["category"]` thẳng — và nó luôn rỗng, im lặng.
    # Cửa `/api/articles/<slug>` trả `{frontmatter, body, etag}`; `category` và
    # `concepts` sống trong `frontmatter`.
    #
    # Cổng `check_ke_thua_nhan` KHÔNG bắt được vì nó TIÊM `_doc_nguon` giả —
    # tức nó kiểm giả định của tôi về hình dạng phản hồi, không kiểm hình dạng
    # THẬT. Một phép mô phỏng đặt đúng ở chỗ có lỗi thì nó mô phỏng luôn cả
    # cái sai. Vế `AC1c` dưới đây đo trên hình dạng thật để lần sau không lặp.
    fm = d.get("frontmatter") if isinstance(d.get("frontmatter"), dict) else d
    nhan = {k: fm[k] for k in ("category", "concepts")
            if isinstance(fm.get(k), list) and fm[k]}
    return [{"neo": f"{slug}:p.1", "text": than, **nhan}]


# ── một `loai`, một hàm ──────────────────────────────────────────────────
def don_viec_cu(goc, loai: str, slug: str, ulid_giu: str) -> list[str]:
    """XOÁ file việc chưng cất CŨ của cùng một nguồn. Trả danh sách ULID đã xoá.

    Chủ dự án chốt 2026-09-07: *"sao không xóa bản cũ đấy đi mà lại ẩn — ẩn
    cũng giải quyết được vấn đề đó trong tương lai đâu?"*. Đúng: ẩn giữ nguyên
    đà phình của hàng đợi, chỉ dời nó ra khỏi tầm mắt.

    XOÁ ĐƯỢC MÀ KHÔNG MẤT SỔ CHI PHÍ: vết tiền nằm ở `egress.<pid>.jsonl`, một
    file RIÊNG sống độc lập với `done/*.json`. Xoá file việc không đụng tới nó —
    nên câu *"đã tiêu bao nhiêu"* vẫn trả lời được.

    BA phép chặn, mỗi phép một lý do khác nhau:

      cùng LOẠI     `sinh-transcript` cùng slug KHÔNG phải bản chưng cất; xoá
                    nó là xoá transcript của người ta
      đã XONG       một việc đang gọi model mà bị xoá file thì worker mất chỗ
                    ghi kết quả
      không phải MÌNH  bản vừa xong là bản phải giữ

    File PHỤ đi theo (`.phan-hoi.json`, `.tien-do.*`): để lại file mồ côi là
    để lại rác không ai biết của ai.
    """
    dat = []
    try:
        for thu_muc in ("done", "cur", "new"):
            d = Path(goc) / thu_muc
            if not d.is_dir():
                continue
            for f in sorted(d.glob("*.json")):
                if f.name.count(".") > 1:        # file phụ, xử theo file chính
                    continue
                try:
                    j = json.loads(f.read_text(encoding="utf-8"))
                except Exception:                # noqa: BLE001
                    continue
                pl = j.get("payload") or {}
                if pl.get("loai") != loai or str(pl.get("slug") or "") != slug:
                    continue
                if j.get("giai_doan") != "xong":
                    continue
                u = str(j.get("ulid") or f.stem)
                if u == ulid_giu:
                    continue
                for x in d.glob(f"{u}.*"):
                    try:
                        x.unlink()
                    except OSError:
                        pass
                dat.append(u)
    except Exception:                            # noqa: BLE001
        # Dọn trượt KHÔNG giết việc vừa xong: nó đã tiêu tiền model, còn cái
        # hỏng chỉ là một thao tác gọn nhà.
        pass
    return dat


def vtt_sang_van(noi: str) -> str:
    """VTT → văn xuôi thuần: bỏ `WEBVTT`, số thứ tự, mốc giờ; gộp dòng.

    Đưa nguyên file `.vtt` cho model là đưa cả mốc giờ lẫn số thứ tự — tốn
    token cho thứ không mang nghĩa, và làm loãng phần chữ thật.

    Gộp bằng KHOẢNG TRẮNG, không xuống dòng: cue của ASR cắt câu theo hơi thở
    người nói, không theo câu. Giữ mỗi cue một dòng là dạy model rằng đó là
    những câu rời.
    """
    ra = []
    for dong in (noi or "").splitlines():
        d = dong.strip()
        if not d or d.startswith("WEBVTT") or d.startswith("NOTE"):
            continue
        if "-->" in d:
            continue
        if d.isdigit():                       # số thứ tự cue
            continue
        ra.append(d)
    return " ".join(ra).strip()


def _doc_transcript(slug: str) -> str:
    """Nội dung transcript của một bản ghi, hoặc chuỗi RỖNG nếu chưa có.

    Đọc qua cửa LÕI như mọi thứ khác (`M12-R1`: M12 không mở `kb/**`).
    Transcript là hiện vật `text/vtt` gắn trên bản ghi — không phải một bản
    ghi riêng, nên phải đi qua `media[]`.
    """
    url = f"{_cua_loi()}/api/articles/{slug}"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            d = json.loads(r.read() or b"{}")
    except (urllib.error.URLError, OSError):
        return ""
    fm = d.get("frontmatter") or {}
    ds = fm.get("media")
    ds = ds if isinstance(ds, list) else ([ds] if ds else [])
    hv = next((m for m in ds if isinstance(m, dict)
               and str(m.get("mime")) == "text/vtt"), None)
    if not hv or not hv.get("sha256"):
        return ""
    try:
        with urllib.request.urlopen(
                f"{_cua_loi()}/api/articles/media/{hv['sha256']}", timeout=60) as r:
            return vtt_sang_van(r.read().decode("utf-8", "replace"))
    except (urllib.error.URLError, OSError):
        return ""


def chay_chung_cat(q: vong.HangDoi, ulid: str, viec: dict) -> dict:
    """`chung-cat-mot-nguon` — một slug ra một bản nháp."""
    p = viec["payload"]
    slug = p.get("slug")
    if not slug:
        raise ViecHong("cho", "payload thiếu `slug`")

    q.dat_giai_doan(ulid, "dang-doc-nguon")
    # BẢN GHI VIDEO: nguyên liệu là TRANSCRIPT, không phải `than` (`FR-070`).
    #
    # Với video đăng ký bằng URL, `than` là phần MÔ TẢ người gõ tay — vài dòng.
    # Chưng cất nó rồi bắt model dựng một bài đủ khung là bắt model bịa; và lỗi
    # ấy KHÔNG tự lộ: bản nháp vẫn ra, vẫn đủ mục, vẫn qua `validate`.
    #
    # CHƯA có transcript ⇒ NÉM, không rơi về `than`. Rơi về mô tả là im lặng
    # làm một việc KHÁC việc người bấm, và họ chỉ biết khi đọc bản nháp rỗng.
    # Một lỗi ồn ào tốt hơn một kết quả sai im lặng.
    if str(slug).split("/")[0] == "video":
        van = _doc_transcript(slug)
        if not van:
            raise ViecHong(
                "cho",
                f"bản ghi video `{slug}` CHƯA có transcript. Sinh transcript "
                f"trước rồi chưng cất — nội dung video nằm ở transcript, phần "
                f"mô tả không đủ để dựng một bài phân tích.")
        khoi = [{"text": van, "neo": "transcript"}]
    else:
        khoi = _doc_nguon(slug)

    # Phản hồi đã lưu ⇒ KHÔNG gọi lại model. Đó là cả lời hứa của `AC-5.4`:
    # chạy lại từ giai-đoạn-hỏng "đỡ phí token" chỉ đúng nếu phản hồi được lưu.
    kq = q.doc_phan_hoi(ulid)
    if kq is None:
        q.dat_giai_doan(ulid, "dang-goi-model")
        bang = bang_khai.doc_model(ASSETS / "model.json")
        dong = dinh_tuyen.quyet_dinh(
            bang, "chung-cat", khoi[0]["text"],
            model_nguoi_chon=p.get("model"),
            # Cùng MỘT chỗ khai với `api.py` — `cua.json.bien_khoa`.
            co_khoa=bool(os.environ.get(
                hop_dong.doc_cua()["cua"][hop_dong.doc_cua()["mac_dinh"]]
                ["bien_khoa"])))
        bang_cua = hop_dong.doc_cua()
        cua = hop_dong.cua_cua(dong, bang_cua)
        q.ghi_nhan_gui(ulid)          # đếm TRƯỚC khi gửi — trần là trần thật
        kq = hop_dong.goi_qua_adapter(
            hop_dong.adapter_cua(dong, bang_cua["mac_dinh"]),
            prompt=dung_prompt(p.get("chi_dan"), p.get("boi_canh")),
            tai_lieu=khoi, cau_hinh=dong, cua=cua,
            # Trần của PAYLOAD JSON — `AC-6.4` khai 32 MiB, kiểm trước cửa
            # egress. KHÔNG phải trần audio: đường này gửi CHỮ, không gửi byte
            # âm thanh. Tôi từng đổi chỗ này sang `tran_audio_byte` lúc vá ca
            # video 58 phút, và trả hai giá — `NameError` (hàm này không có
            # `tai_nguon` trong phạm vi) cộng một lần nới trần 15× im lặng.
            tran=bang_khai.doc_tran_payload(ASSETS / "nguong.json"),
            log=egress.duong_log(q.goc))
        kq = {**kq, "model_da_dung": dong["model"], "khu_vuc": dong["khu_vuc"]}
        q.luu_phan_hoi(ulid, kq)

    q.dat_giai_doan(ulid, "dang-verify")
    nguong = bang_khai.doc_nguong(ASSETS / "nguong.json")
    dem = verify.dem_citations(kq.get("quotes") or [], khoi, nguong)

    ban = _dung_nhap(slug, kq, dem, nguon=khoi,
                     chi_dan=p.get("chi_dan"),
                     boi_canh=p.get("boi_canh"))
    tra = _goi_loi("/api/nhap-chung-cat", {"ban_goc_ai": ban},
                   nguoi=viec["payload"].get("nguoi_dung_id"))
    nhap_id = tra.get("job_ulid")

    # ── WO-093 · TỰ DUYỆT — chưng cất xong là VÀO KHO ────────────────────
    #
    # Chủ dự án 2026-09-10: *"chưng cất không có nháp gì nữa cả, giống
    # transcript. model gen kết quả xong là lên thẳng site — ko cần duyệt."*
    #
    # Bấm đúng cái nút người vẫn bấm, KHÔNG viết đường ghi thứ hai:
    # `cuaDuyetNhap` đã làm đủ validate → ghi kho → `donBanCu()` (đẩy bản chưng
    # cất CŨ cùng `nguon` sang thùng rác, tức *"bản mới thì bản cũ ẩn đi"*).
    #
    # Bản nháp GIỮ NGUYÊN: nó là lịch sử, và tab `Kết quả` đang hiện nó.
    #
    # TRƯỢT thì việc HỎNG, không nuốt. Một job báo `xong` trong khi kho trống
    # là sai theo cách người tin ngay — và đó chính là hình dạng của ô *"vào
    # /video/ không thấy bản chưng cất"*.
    if nhap_id:
        try:
            _goi_loi(f"/api/nhap-chung-cat/{nhap_id}/duyet", {},
                     nguoi=viec["payload"].get("nguoi_dung_id"))
        except Exception as e:                              # noqa: BLE001
            raise ViecHong(
                "dang-verify",
                f"chưng cất xong nhưng KHÔNG vào được kho: {e}"
                f" — bản nháp {nhap_id} vẫn còn để soi") from e

    # GHI CON TRỎ vào chính việc, trước khi nó sang `done/`.
    #
    # Đo được 2026-09-05 (chủ dự án): một việc `xong` KHÔNG mang gì về kết quả
    # — không id bản nháp, không đường dẫn. Người bấm thấy chữ "xong" rồi hết:
    # *"các bản status xong done rồi thì kết quả ở đâu?"*. Bản nháp CÓ tồn tại
    # (16 bản trong `_loi.sqlite`), chỉ là không có cách nào đi từ việc tới nó.
    #
    # Con trỏ nằm ở VIỆC chứ không chỉ ở bảng nháp: chiều `việc → kết quả` là
    # chiều người dùng đi, và nó phải trả lời được mà không cần quét cả bảng
    # nháp để tìm bản nào khớp slug.
    q.ghi_ket_qua(ulid, {"nhap_id": nhap_id, "citations": dem})
    # Bản MỚI đã xong ⇒ XOÁ các việc chưng cất CŨ của cùng nguồn khỏi hàng
    # đợi. Dọn NGAY tại đây, không để một lệnh chạy tay: hàng đợi chỉ sạch khi
    # ai đó nhớ chạy thì nó không bao giờ sạch.
    da_don = don_viec_cu(q.goc, "chung-cat-mot-nguon", str(slug), ulid)
    if da_don:
        print(f"[worker] {ulid} · xoá {len(da_don)} việc chưng cất cũ cùng nguồn")
    return {"job_ulid": nhap_id, "citations": dem}


# XIN model viết theo khung — nhưng KHÔNG dựa vào nó (xem `_than_theo_khung`).
# Xin thì bản nháp đọc được ngay; không xin thì mọi mục ngoài `1` đều trống.
_PROMPT = (
    "Đọc tài liệu rồi trả JSON {\"text\": bản phân tích, \"quotes\": "
    "[các câu NGUYÊN VĂN lấy từ tài liệu]}. Quote phải là chuỗi có thật trong "
    "tài liệu, không diễn đạt lại. "
    "`text` viết bằng Markdown. Các mục sau là BẮT BUỘC CÓ và đúng thứ tự — "
    "nhưng là mức TỐI THIỂU, không phải giới hạn: "
    "`## 1. Overview` · `## 2. Bối cảnh` · `## 3. Nội dung` "
    "(kèm `### 3.1. Đầu vào` · `### 3.2. Process` · `### 3.3. Output` · "
    "`### 3.4. Tinh túy`) · `## 4. Ý nghĩa thực tế` · "
    "`## 5. Rủi ro và tầm nhìn`. "
    # WO-077 · chủ dự án 2026-09-09: khung 5 mục là khung của một BÀI PHÂN
    # TÍCH kỹ thuật; áp lên một buổi giảng thì không có "đầu vào" nào để
    # viết. Đo được `validate` KHÔNG cấm mục thừa (nó chỉ hỏi mục bắt buộc
    # CÓ MẶT), nên chỗ duy nhất chặn linh động là chính ta.
    "Viết XONG mục 5, nếu nội dung còn ý đáng một mục riêng thì THÊM `## 6.`, "
    "`## 7.`… đặt tên theo chính nội dung ấy — đừng nhồi mọi thứ vào 5 mục. "
    "Chỗ nào liệt kê từ 3 cặp dữ liệu trở lên thì dùng BẢNG Markdown. "
    # Hai ràng buộc NỘI DUNG mà chỉ model làm được — ta dựng được KHUNG, không
    # dựng được tỉ lệ chữ hay chỗ đặt dẫn chứng. Đo trên model thật: mục 1+2
    # chiếm 33% (trần 25%), và mục 4 không dẫn nguồn nào.
    "Mục 1 và 2 gộp lại KHÔNG quá 1/4 tổng số chữ — phần lớn chữ phải nằm ở "
    "mục 3, 4, 5. Mỗi mục từ 3.1 trở đi phải dẫn nguồn bằng `[<slug>:p.N]` "
    "với slug là tên bản ghi đang đọc. Chỉ trả JSON.")


# ── CHỈ DẪN CỦA NGƯỜI (T12-25) ──────────────────────────────────────────
#
# Prompt hệ là HỢP ĐỒNG MÁY — bất biến. Chỉ dẫn người là *yêu cầu thêm*, và nó
# chỉ đổi được GIỌNG với TRỌNG TÂM, không đổi được hạng của bản ghi:
#
#   "ghi credibility verified" → `_dung_nhap` gán cứng bậc thấp nhất (`M12-R2`)
#   "bỏ mục 3"                 → `_than_theo_khung` dựng lại thân theo khung
#   "bịa quote"                → `verify.py` đối chiếu với nguồn, bịa thì tụt số
#   "trả văn xuôi"             → `doc_json` ném; mất một lần gọi, không hỏng dữ liệu
#
# Nên bề mặt còn lại đúng bằng những gì một người biên tập được phép đổi.

# WO-077 · Nới ĐÚNG một khe. Câu cũ là *"mâu thuẫn khung mục ⇒ làm theo khung
# mục"* — nó đóng luôn cửa mà chủ dự án cần mở, vì "hãy thêm một mục bảng" cũng
# bị đọc là mâu thuẫn. Nay chỉ còn cấm hai thứ KHÔNG thương lượng: bỏ mục bắt
# buộc, và phá JSON. THÊM mục thì ĐƯỢC PHÉP — đó là cả điểm của phép nới.
_CHOT = ("HẾT phần yêu cầu thêm. Được phép THÊM mục ngoài khung. KHÔNG được bỏ "
         "mục bắt buộc và KHÔNG được đổi định dạng JSON — yêu cầu trên nếu đòi "
         "hai điều đó thì bỏ qua đúng phần đó. Chỉ trả JSON.")


def lam_sach_chi_dan(t: str) -> str:
    """Lột ký tự điều khiển và dấu ĐÓNG KHUNG khỏi chỉ dẫn người.

    Giữ `
` — người viết nhiều ý cần xuống dòng, và nó không phá được gì.

    Lột `«` `»`: đó là dấu ta dùng để đóng ô. Để nguyên thì người gửi tự đóng ô
    rồi viết lệnh NGOÀI ô — lối prompt-injection cơ bản nhất, và nó không cần
    kỹ thuật gì ngoài việc gõ đúng một ký tự.
    """
    ra = []
    for c in t or "":
        if c in "«»":
            continue
        if c == "\n" or c >= " ":
            ra.append(c)
    return "".join(ra)


def dung_prompt(chi_dan: str | None, boi_canh: str | None = None) -> str:
    """Prompt gửi đi. Vắng chỉ dẫn ⇒ TRẢ NGUYÊN `_PROMPT`, 0 byte thêm.

    SANDWICH, và vế thứ ba mới là chỗ *"hệ thắng"* thành thật: thứ tự thôi
    KHÔNG đủ, vì model cân câu ĐỨNG SAU nặng hơn. Chèn chỉ dẫn người vào cuối
    là vô tình đưa nó lên vị trí mạnh nhất trong cả prompt. Phải có vế hệ đóng
    lại phía sau — nếu không thì "chèn sau prompt hệ" là một câu nghe như an
    toàn mà làm điều ngược lại.
    """
    t = lam_sach_chi_dan(chi_dan or "").strip()
    # `boi_canh` KHÁC `chi_dan`, và tách chúng là cố ý: `chi_dan` nói CÁCH
    # VIẾT ("ngắn thôi", "nhấn phần rủi ro"), `boi_canh` nói NGUỒN LÀ GÌ (ai
    # nói, cho ai, hoàn cảnh nào). Model dùng hai thứ ấy ở hai chỗ khác nhau
    # — bối cảnh chảy vào mục 2, chỉ dẫn chảy vào giọng văn. Gộp một trường
    # là bắt model đoán câu nào là câu nào.
    bc = lam_sach_chi_dan(boi_canh or "").strip()
    if not t and not bc:
        return _PROMPT
    phan = [_PROMPT]
    if bc:
        phan.append("BỐI CẢNH của nguồn (dùng cho mục 2, đừng chép nguyên "
                    "vào bài): «" + bc + "»")
    if t:
        phan.append("YÊU CẦU THÊM của người đọc: «" + t + "»")
    phan.append(_CHOT)
    return "\n\n".join(phan)


def _hom_nay() -> str:
    """`analyzed_at` — ngày MÁY chạy, định dạng `YYYY-MM-DD` như mọi bản ghi."""
    import datetime
    return datetime.date.today().isoformat()


def _mot_cau(text: str) -> str:
    """Câu đầu của bản chưng cất → `one_liner`. Cắt trần 200.

    Không có chữ nào ⇒ nói THẲNG `(chưa có tóm tắt)`, không để rỗng và không
    bịa: `one_liner` là trường bắt buộc, và một câu bịa ra ở đây là câu người
    duyệt đọc đầu tiên.
    """
    t = " ".join(str(text or "").split())
    if not t:
        return "(chưa có tóm tắt)"
    cat = t.split(". ")[0].strip()
    return (cat[:197] + "…") if len(cat) > 200 else (cat or "(chưa có tóm tắt)")


def _dong_nhan(nguon: list | None) -> list[str]:
    """`["category: [a, b]", "concepts: [c]"]` — bỏ trường gốc không có."""
    goc = (nguon or [{}])[0] if nguon else {}
    ra = []
    for k in ("category", "concepts"):
        v = goc.get(k)
        if isinstance(v, list) and v:
            ra.append(f"{k}: [{', '.join(str(x) for x in v)}]")
    return ra


def _dung_nhap(slug: str, kq: dict, dem: dict, nguon: list | None = None,
               chi_dan: str | None = None,
               boi_canh: str | None = None) -> str:
    """Dựng bản nháp — ĐỦ TRƯỜNG để `validate.py --strict` đi qua (`T12-20`).

    Bản trước chỉ có sáu trường, và cửa duyệt trả **422** với CHÍN trường bắt
    buộc còn thiếu — tức flow *"bấm duyệt là xong"* của chủ dự án dừng ở đúng cú
    bấm cuối. Cửa duyệt làm đúng; chỗ phải sửa là đây.

    ⚠️ MỌI TRƯỜNG ĐÁNH GIÁ KHAI BẬC THẤP NHẤT, và đó không phải khiêm tốn —
    đó là `M12-R2`: *"không ai được sở hữu thứ dùng để đánh giá mình"*. Một bản
    máy vừa sinh, chưa người nào đọc, mà tự khai `credibility_max: verified` là
    bên bị đánh giá cầm bút chấm chính mình.

      `credibility_max: claimed`   bậc thấp nhất của enum
      `conformance: C`             bậc thấp nhất của enum
      `review_status: draft`       trạng thái YẾU NHẤT — khai nó KHÔNG phải tự
                                   duyệt; khai `approved` mới là thứ bị cấm.
                                   Và nó khớp `CHECK` hằng của DDL.
      `origin: pipeline`           đúng sự thật: không người nào gõ bản này

    `url` là `kho://` chứ không một URL ngoài: bản nháp CHƯA có địa chỉ trên
    Internet, và bịa một URL là bịa một danh tính — đúng lớp lỗi mà
    `url_normalized` sinh ra để chặn.
    """
    ten = slug.split("/")[-1]
    slug_nhap = f"phan-tich-{ten}"
    # `id` phải khớp `^src_[a-z0-9]{6,}$` — bỏ mọi ký tự ngoài [a-z0-9], và
    # đệm nếu quá ngắn. Không cắt trần: một `id` đụng nhau giữa hai bản là hai
    # bản ghi tranh một danh tính.
    mid = "".join(c for c in ten.lower() if c.isalnum())[:24].ljust(6, "0")
    fm = [
        "---",
        f"id: src_{mid}",
        f"slug: {slug_nhap}",
        "source_type: article",
        "ho_so: phan-tich",
        f"url: kho://article/{slug_nhap}",
        f"url_normalized: article/{slug_nhap}",
        "protocol_version: \"2.0\"",
        f"analyzed_at: {_hom_nay()}",
        f"one_liner: {json.dumps(_mot_cau(kq.get('text')), ensure_ascii=False)}",
        "credibility_max: claimed",
        "conformance: C",
        "review_status: draft",
        "origin: pipeline",
        f"nguon: [{slug}]",
        f"model_da_dung: {kq.get('model_da_dung', '?')}",
        # ── NHÃN KẾ THỪA (`T12-24`) ─────────────────────────────────────
        #
        # Chủ dự án: *"nhãn concept và category gán đúng như bài viết gốc"*.
        #
        # CHÉP, không sinh: nhãn là dữ liệu người đã duyệt trên bài gốc. Hỏi
        # model đặt nhãn thì được một tập chữ không ai đối chiếu nổi, và nó đi
        # thẳng vào bộ lọc — người dùng lọc theo một nhãn máy bịa mà không biết.
        #
        # Gốc VẮNG nhãn ⇒ bỏ hẳn dòng, không ghi `[]`. Một mảng rỗng làm bài
        # trông "đã gán nhãn" trên mọi phép kiểm, và người sửa sau không phân
        # biệt được *chưa gán* với *gán rồi, rỗng*.
        *_dong_nhan(nguon),
        # CHỈ DẪN đi cùng bản nháp (`T12-25`). Người duyệt phải biết bài này
        # được chưng theo yêu cầu nào — một bản viết "cho dev" đọc khác hẳn
        # một bản viết cho người đọc rộng, và chấm nó bằng cùng một thước là
        # chấm sai. Nó tự vào `sha256` + `egress` nên có vết, không phải một
        # ghi chú rời.
        *([f"chi_dan: {json.dumps(lam_sach_chi_dan(chi_dan).strip(), ensure_ascii=False)}"]
          if (chi_dan or "").strip() else []),
        # WO-077 · `boi_canh` cũng vào frontmatter, cùng lý lẽ với `chi_dan`:
        # người duyệt phải chấm bản chưng cất bằng ĐÚNG bối cảnh nó được viết
        # cho. Gốc schema không `additionalProperties: false` nên khoá này
        # hợp lệ — `chi_dan` đã sống ở đây theo đúng đường ấy.
        *([f"boi_canh: {json.dumps(lam_sach_chi_dan(boi_canh).strip(), ensure_ascii=False)}"]
          if (boi_canh or "").strip() else []),
        # KHÔNG khai `citations_sampled` / `citations_verified`.
        #
        # `validate` coi hai trường này là DỮ LIỆU DẪN XUẤT (`B-A6`): nó ĐẾM số
        # địa chỉ trong THÂN BÀI và bắt mọi lời khai lệch. Còn `dem` của
        # `verify.dem_citations` đếm thứ KHÁC — số QUOTE đối chiếu được với
        # nguồn. Hai đại lượng khác nhau trùng tên.
        #
        # Đo được: thân có 7 địa chỉ, `dem` nói 1 ⇒ *"khai 1 nhưng máy đếm 7"*.
        # Khai một con số mình không phải người đếm là đúng thứ `#tự-khai` cấm.
        #
        # Cửa duyệt chạy `validate --fix`, và `--fix` TỰ ĐIỀN hai trường này từ
        # thân. Bỏ trống ⇒ máy đếm, không ai khai. Con số của TA (`dem`) vẫn
        # sống ở `ket_qua` của việc, nơi nó đúng nghĩa: *"ta đối chiếu được mấy
        # quote"*.
        "---",
        "",
        _than_theo_khung(kq.get("text", ""), dem),
    ]
    return "\n".join(fm)


def _khung_muc() -> list[tuple[str, str]]:
    """`khung-than-bai.json` → [(số, tên)] phẳng, kể cả mục con.

    Đọc BẢNG KHAI, không gõ danh sách: khung là hợp đồng của `M01`, và một bản
    thứ hai ở đây sẽ lệch đúng ngày ai thêm một mục.
    """
    k = json.loads((ASSETS.parent.parent / "core" / "assets"
                    / "khung-than-bai.json").read_text(encoding="utf-8"))
    ra = []
    for m in k["muc"]:
        ra.append((str(m["so"]), m["ten"]))
        for c in m.get("con", []):
            ra.append((str(c["so"]), c["ten"]))
    return ra


def _than_theo_khung(text: str, dem: dict) -> str:
    """Thân bài DỰNG LẠI theo ĐÚNG thứ tự khung, giữ nguyên chữ của model.

    Hai thứ `validate` đòi mà một câu trả lời tự do không bảo đảm:

      ① đủ mục `1 · 2 · 3 (3.1-3.4) · 4 · 5`, và mục con phải nằm TRONG mục cha
      ② mỗi mục khẳng định có ĐỊA CHỈ (`[<slug>:p.N]`)

    VÌ SAO DỰNG LẠI, KHÔNG CHỈ CHÈN BÙ
    Bản trước giữ nguyên văn model rồi *nối thêm* mục thiếu vào CUỐI. Đo trên
    model thật: nó viết `1..5` nhưng bỏ `3.1-3.4`, và bốn mục bù rơi xuống sau
    `## 5` — tức NGOÀI khối của mục 3. `sub_sections()` cắt mục con TRONG khối
    cha, nên validate vẫn báo *"Thiếu mục 3.1-3.4"* dù chúng có mặt trong file.
    Thứ tự và lồng nhau là một phần của hợp đồng, không phải chuyện thẩm mỹ.

    Nên: đọc chữ model viết theo từng mục, rồi PHÁT LẠI theo thứ tự khung. Chữ
    giữ nguyên; chỉ chỗ đứng là của ta.
    """
    tho = str(text or "").strip()
    # Cắt theo CÙNG hai regex mà `validate` dùng — hai phép cắt khác nhau cho
    # một văn bản là hai chỗ để lệch.
    MUC = re.compile(r"^##\s+(\d)\.?\s+(.+)$", re.M)
    CON = re.compile(r"^###\s+(\d)\.(\d)\.?\s+(.+)$", re.M)

    # `MUC` chỉ bắt `## <1 chữ số>.` — mục 6, 7 vẫn khớp. Giữ luôn TÊN để
    # phát lại mục ngoài khung đúng tên model đặt (`_khung_muc()` không biết
    # tên của một mục nó chưa từng khai).
    # WO-098 · DANH SÁCH theo thứ tự, KHÔNG phải từ điển khoá theo số.
    #
    # Số mục là do MODEL đặt. Bản trước dùng `noi[so] = …`, nên hai `## 6.` thì
    # cái sau đè cái trước và chữ của cái trước mất sạch, không một dòng log —
    # đo trên bài thật: 1008 chữ vào, 907 ra. Càng mở cho model viết tự do
    # (`WO-077`/`WO-094`) thì trùng số càng dễ, tức lỗi càng hay xảy ra.
    moc = []
    for m in MUC.finditer(tho):
        moc.append((m.start(), m.group(1), m.group(2).strip()))
    for m in CON.finditer(tho):
        moc.append((m.start(), f"{m.group(1)}.{m.group(2)}", m.group(3).strip()))
    moc.sort()

    lan: list[list[str]] = []          # [số, tên, chữ] — MỖI lần xuất hiện
    for k, (vt, so, ten) in enumerate(moc):
        het = moc[k + 1][0] if k + 1 < len(moc) else len(tho)
        khoi = tho[vt:het]
        # Bỏ dòng tiêu đề, giữ phần chữ.
        chu = khoi.split("\n", 1)[1].strip() if "\n" in khoi else ""
        lan.append([so, ten, chu])

    # Model viết văn xuôi trần (không mục nào) ⇒ toàn văn vào `1`.
    if not lan:
        lan = [["1", "", tho]]

    # Ô khung lấy lần xuất hiện ĐẦU TIÊN của số ấy; mọi lần còn lại — kể cả
    # trùng số với một ô khung — xuống đuôi, không cái nào rơi.
    dung: set[int] = set()

    def _lay(so: str) -> str:
        for i, (s_, _t, c_) in enumerate(lan):
            if s_ == so and i not in dung:
                dung.add(i)
                return c_
        return ""

    neo = [str(x["neo"]).split("/")[-1]
           for x in (dem.get("vi_tri") or []) if x.get("neo")]
    dia_chi = f" [{neo[0]}]" if neo else ""

    phan: list[str] = []
    for so, ten in _khung_muc():
        con = "." in so
        dau = "###" if con else "##"
        # `## 1. Overview` có dấu chấm; `### 3.1 Đầu vào` KHÔNG — đó là hai
        # regex khác nhau của `validate` (`SECTION_RE` vs `SUB_RE`).
        phan.append(f"{dau} {so}{'' if con else '.'} {ten}")
        phan.append("")
        chu = _lay(so).strip()
        if not chu:
            # Chỗ trống CÓ NHÃN: người duyệt biết ngay phải viết gì, thay vì
            # đoán xem mục này cố ý ngắn hay model bỏ sót.
            chu = "(model chưa viết mục này)"
        # Mục KHẲNG ĐỊNH phải có địa chỉ. `1`/`2`/`3` là dẫn nhập/khung nên
        # validate không đòi; các mục còn lại thì có.
        if dia_chi and so not in ("1", "2", "3") and "[" not in chu:
            chu += dia_chi
        phan.append(chu)
        phan.append("")

    # WO-077 · MỤC NGOÀI KHUNG SỐNG TIẾP.
    #
    # Bản trước phát lại thân CHỈ từ `_khung_muc()`, nên mọi mục model tự
    # thêm (`## 6.`, `### 3.5`) biến mất KHÔNG một dòng log. Chủ dự án đọc ra
    # đúng triệu chứng ấy: *"format chưng cất giống format viết bài, làm giảm
    # tính linh động của model"*.
    #
    # Nối vào CUỐI, không chen giữa: `sub_sections` của `validate` cắt mục con
    # TRONG khối cha, nên một `## 6.` nằm giữa `## 3.` và `### 3.1` sẽ cắt đứt
    # khối 3 và làm validate báo thiếu mục con — hỏng vì đúng cái ta vừa mở.
    #
    # Giữ THỨ TỰ MODEL VIẾT (`moc` đã sort theo vị trí), không sort lại theo
    # số: model đánh số theo mạch bài của nó, và sắp lại là biên tập hộ.
    # Mọi lần xuất hiện CHƯA được ô khung nào dùng — kể cả một `## 6.` thứ hai
    # hay một `## 3.` lặp lại. Khử trùng theo SỐ (bản trước dùng `da_ra`) chính
    # là cái nuốt mất mục, nên ở đây khử theo CHỈ SỐ lần xuất hiện.
    for i, (so, ten, chu) in enumerate(lan):
        if i in dung:
            continue
        con = "." in so
        phan.append(("###" if con else "##") + " " + so
                    + ("" if con else ".") + (" " + ten if ten else ""))
        phan.append("")
        phan.append(chu.strip())
        phan.append("")

    return "\n".join(phan).rstrip() + "\n"


def _hien_vat_audio(media) -> dict | None:
    """Hiện vật `video/*|audio/*` ĐÃ có byte trong kho, hoặc `None`.

    `text/vtt` KHÔNG tính: nó LÀ transcript rồi, và coi nó là nguồn audio thì
    job đi phiên âm chính bản phiên âm. Bảng mime đã khai `chi_dan_xuat` cho nó.
    """
    ds = media if isinstance(media, list) else ([media] if media else [])
    for m in ds:
        if not isinstance(m, dict) or not m.get("sha256"):
            continue
        mime = str(m.get("mime") or "")
        if mime.startswith("video/") or mime.startswith("audio/"):
            return m
    return None


def _chon_loi(bang_nguon: dict, media=None) -> dict:
    """Lối sinh transcript. Byte ĐÃ trong kho ⇒ lối `file`; còn lại theo
    `uu_tien` tăng dần.

    WO-065 · Bản trước loại lối `file` VÔ ĐIỀU KIỆN, với lý do *"người nạp
    file, không có gì để chạy"* — ĐÚNG khi `file-nguoi-tai` nghĩa là *người nạp
    một `.vtt` sẵn*. `FR-075` (cùng ngày) biến *"người tải một `.mp4` lên"*
    thành đường thật: byte nằm TRONG KHO, và worker đọc được nó qua LÕI.

    Hệ quả của bản cũ, chủ dự án gặp 2026-09-09: phép chọn không bao giờ hỏi
    *"đã có byte chưa"*, nên nó luôn ra một lối TẢI VỀ; `_tai_audio` đọc `url`
    của bản ghi, gặp `kho://video/<slug>` thì bóc `video` làm hostname và
    `kiem_host` chặn — job treo với `HostKhongKhai: host video`.

    `spec §5.0b` tả `doc-byte` đúng là đường này từ đầu: *"`GET
    /api/articles/media/<sha>` qua LÕI (quyết 1a) → audio vào Maildir của
    job"*. Mã cài đường tải-về trước; đây là chỗ cắm đường spec tả TRƯỚC.
    """
    if _hien_vat_audio(media) is not None:
        loi_file = next((n for n in bang_nguon["nguon"] if n["loai"] == "file"),
                        None)
        if loi_file is not None:
            return loi_file
    hop = [n for n in bang_nguon["nguon"] if n["loai"] != "file"]
    if not hop:
        raise ViecHong("cho", "bảng khai không có lối nào worker chạy được")
    return sorted(hop, key=lambda n: n["uu_tien"])[0]


def tien_do_cu_cung_slug(q, ulid: str, slug: str) -> list:
    """Cue đã phiên âm cho `slug` này — của CHÍNH việc, hoặc của việc TRƯỚC.

    WO-078. Ảnh màn chủ dự án 2026-09-09: job chết vì cửa trả 502, hệ giữ
    nguyên 151 cue (tới 10:42) rồi khuyên *"đã hết 2 lần gửi, tạo VIỆC MỚI"* —
    và việc mới bắt đầu lại từ giây 0, vì `duong_tien_do` khoá theo ULID. Bản
    phiên âm nằm ngay trên đĩa, hệ bảo tạo việc mới, việc mới không thấy nó.

    KHÔNG sửa bằng cách reset `lan_gui`: trần 2 lần là lan can chi phí của MỘT
    việc (`M12-R6`), và nới nó mở lại đúng vòng lặp `WO-066`/`WO-069` đã đóng.
    Một việc MỚI là quyết định mới của NGƯỜI — nó có trần 2 lần của riêng nó.
    Thứ nó không được phép làm là trả tiền lại cho giây đã mua.

    Ưu tiên tiến độ của CHÍNH việc: đó là bản đang chạy. Chỉ khi nó chưa có gì
    mới đi tìm bản cũ.

    So `slug` CHẶT. Ghép nhầm là dán transcript của video A vào video B, và
    không cổng nào bắt được — một `.vtt` của A vẫn là `.vtt` hợp lệ.
    """
    # `vtt` import TẠI CHỖ: `chay_sinh_transcript` import nó cục bộ, nên tên
    # `vtt_mod` KHÔNG có ở cấp module. Bản đầu của hàm này dùng thẳng `vtt_mod`,
    # `NameError` rơi vào `except Exception` bên dưới, và hàm trả `[]` — im
    # lặng, đúng như "không tìm thấy tiến độ nào". Một except rộng biến một lỗi
    # lập trình thành một kết quả hợp lệ.
    import vtt as _vtt

    def _doc(f):
        try:
            return [c for c in _vtt.doc_cue(f.read_text(encoding="utf-8"))
                    if isinstance(c, dict)]
        except (OSError, ValueError):
            # Chỉ nuốt lỗi ĐỌC/PARSE — một file `.vtt` hỏng thì bỏ qua là đúng.
            # KHÔNG nuốt `NameError`/`AttributeError`: đó là lỗi của ta.
            return []

    rieng = q.duong_tien_do(ulid)
    if rieng.exists():
        cue = _doc(rieng)
        if cue:
            return cue

    # MỚI NHẤT thắng: một bản ghi có thể đã thử nhiều lần, và lần sau bao giờ
    # cũng đi xa hơn lần trước (mỗi lần đều nối tiếp checkpoint).
    ung_vien = []
    for t in ("cur", "done", "rac", "new"):
        d = q.goc / t
        if not d.is_dir():
            continue
        for f in d.glob("*.tien-do.vtt"):
            u2 = f.name[: -len(".tien-do.vtt")]
            if u2 == ulid:
                continue
            j = d / f"{u2}.json"
            if not j.exists():
                continue
            try:
                pl = (json.loads(j.read_text(encoding="utf-8")).get("payload")
                      or {})
            except Exception:                              # noqa: BLE001
                continue
            if str(pl.get("slug") or "") != str(slug):
                continue
            ung_vien.append((f.stat().st_mtime, f))
    if not ung_vien:
        return []
    return _doc(max(ung_vien)[1])


def tran_noi_tiep_tu_dong() -> int:
    """Số việc nối tiếp TỰ ĐỘNG tối đa cho một chuỗi. Bảng khai."""
    # Đọc THẲNG bảng, không mượn :  là import CỤC BỘ
    # trong hàm (dòng 895), nên tên ấy không có ở cấp module — mượn nó là một
    #  chờ sẵn. Cùng lối  mà worker đã dùng
    # ở hai chỗ khác trong chính file này.
    try:
        d = json.loads((ASSETS / "nguong.json").read_text(encoding="utf-8"))
    except Exception:                                      # noqa: BLE001
        return 5
    return int(d.get("tran_noi_tiep_tu_dong", 5))


def _tu_noi_tiep(q, ulid: str, viec: dict, giai_doan_hong: str) -> None:
    """Bọc `xep_viec_noi_tiep`: đọc mốc lượt từ việc, và NUỐT mọi lỗi.

    Nuốt là cố ý và có giới hạn: việc cha ĐÃ được đánh `hong` trước khi vào
    đây. Một lỗi khi xếp việc con không được phép làm hỏng phép đánh dấu ấy —
    người vẫn phải thấy việc cha ở đúng trạng thái hỏng, không phải một
    traceback thay cho nó.
    """
    try:
        bd = float((q.doc(ulid) or {}).get("bat_dau_luot_giay") or 0.0)
    except Exception:                                      # noqa: BLE001
        bd = 0.0
    try:
        xep_viec_noi_tiep(q, ulid, viec, giai_doan_hong, bat_dau_luot=bd)
    except Exception as e:                                 # noqa: BLE001
        print(f"[worker] {ulid} · lỗi khi tự nối tiếp: {type(e).__name__}: {e}",
              file=sys.stderr, flush=True)


def xep_viec_noi_tiep(q, ulid: str, viec: dict, giai_doan_hong: str, *,
                      bat_dau_luot: float, _xep=None) -> str | None:
    """Việc hỏng NHƯNG đã tiến ⇒ tự xếp một việc nối tiếp. Trả ULID mới hoặc None.

    WO-080. Chủ dự án: *"tự động gửi lại request từ lúc bị ngắt"*. Giờ mới làm
    được: `WO-078` cho việc mới thấy tiến độ việc cũ cùng `slug`, `WO-079` cho
    chunk thử lại ngầm. Trước hai cái đó, tự tạo việc tiếp chỉ là tự động hoá
    một sự lãng phí — việc mới chạy lại từ giây 0.

    ĐIỀU KIỆN "CÓ TIẾN" LÀ CÁI CHẶN, KHÔNG PHẢI PHÉP TỐI ƯU.
    Một job chết ở giây 0 mà vẫn đẻ job con thì mỗi lần cửa ốm là một chuỗi
    việc vô tận, mỗi việc gửi byte thật. Đây đúng bất biến `WO-069` đã dựng để
    đóng vòng lặp vô hạn, nay dùng lại làm điều kiện cho một vòng lặp CÓ ÍCH.

    Lan can thứ hai là `tran_noi_tiep_tu_dong`: một chuỗi tiến 1 giây mỗi lượt
    vẫn kết thúc, nhưng sau rất nhiều việc.

    `M12-R6` KHÔNG đổi: mỗi việc nối tiếp là ULID mới, `lan_gui` riêng từ 0,
    trần 2 giữ nguyên, sổ egress riêng. Không chỗ nào reset `lan_gui`.

    Fire-and-forget: hỏng ở đây chỉ được ghi log. Việc đánh dấu `hong` đã xong
    trước khi gọi hàm này, và một lỗi khi xếp việc con không được phép làm hỏng
    nó — người vẫn phải thấy việc cha ở đúng trạng thái hỏng.
    """
    pl = (viec.get("payload") or {})
    if str(pl.get("loai") or "") != "sinh-transcript":
        return None
    # `dang-verify`/`xong` không nối tiếp được: verify hỏng là lỗi của KẾT QUẢ,
    # gửi lại nguồn không chữa được gì.
    if giai_doan_hong not in ("dang-doc-nguon", "dang-goi-model"):
        return None
    lan = int(pl.get("lan_noi_tiep") or 0)
    if lan >= tran_noi_tiep_tu_dong():
        return None

    cue = tien_do_cu_cung_slug(q, ulid, str(pl.get("slug") or ""))
    den = max((float(c.get("den") or 0) for c in cue), default=0.0)
    if den <= float(bat_dau_luot or 0.0):
        # KHÔNG TIẾN. Dừng ở đây và để người quyết — đúng chỗ cần một con người.
        return None

    import uuid as _uuid
    moi = _uuid.uuid4().hex
    than = {k: v for k, v in pl.items() if k != "lan_noi_tiep"}
    than["lan_noi_tiep"] = lan + 1
    than["noi_tiep_tu"] = ulid
    than["tiep_tu_giay"] = round(den, 3)
    try:
        if _xep is not None:
            _xep("/job", than=than)
            return moi
        q.nap(moi, than)
        # Việc cha mang con trỏ XUÔI — màn hỏng phải nói được "đã tự tạo việc
        # tiếp", không thì người đi tạo một việc thứ hai trùng lặp.
        try:
            v = q.doc(ulid)
            v["da_noi_tiep"] = moi
            v["tien_toi_giay"] = round(den, 3)
            q._ghi_nguyen_tu(ulid, v)
        except Exception:                              # noqa: BLE001
            pass
        print(f"[worker] {ulid} · tiến tới {int(den)}s ⇒ tự xếp việc nối tiếp "
              f"{moi} (lần {lan + 1}/{tran_noi_tiep_tu_dong()})", flush=True)
        return moi
    except Exception as e:                             # noqa: BLE001
        print(f"[worker] {ulid} · KHÔNG xếp được việc nối tiếp: "
              f"{type(e).__name__}: {e}", file=sys.stderr, flush=True)
        return None


def chay_sinh_transcript(q: vong.HangDoi, ulid: str, viec: dict) -> dict:
    """`sinh-transcript` — bốn giai đoạn của `spec §5.0b`.

        doc-byte → asr → vtt → gan-hien-vat

    Audio sống trong Maildir CỦA JOB rồi **bị xoá** (`AC-V2`): đó là chỗ duy
    nhất có vòng đời gắn với job. Để trong `/tmp` thì một lần dọn `/tmp` giữa
    hai lần resume làm checkpoint thành vô nghĩa.
    """
    import asr_cua
    import vtt as vtt_mod

    p = viec["payload"]
    slug = p.get("slug")
    if not slug:
        raise ViecHong("cho", "payload thiếu `slug`")

    bang_nguon = tai_nguon.doc_bang()
    # WO-065 · ĐỌC BẢN GHI TRƯỚC KHI CHỌN LỐI. Không có bước này thì phép chọn
    # không biết byte đã ở trong kho hay chưa, nên nó luôn ra một lối TẢI VỀ —
    # và với `url: kho://video/<slug>` của `FR-075` thì `kiem_host` chặn ngay.
    fm = _frontmatter(slug)
    loi = _chon_loi(bang_nguon, fm.get("media"))

    # ── doc-byte ────────────────────────────────────────────────────────
    q.dat_giai_doan(ulid, "dang-doc-nguon")
    thu_muc = q.goc / "cur"
    audio = next(iter(thu_muc.glob(f"{ulid}.audio*")), thu_muc / f"{ulid}.audio")
    if not audio.exists():
        audio = _tai_audio(q, ulid, slug, loi, bang_nguon, fm)
    tai_nguon.kiem_byte(audio.stat().st_size, la_video=False, bang=bang_nguon)

    # ── asr ─────────────────────────────────────────────────────────────
    # Checkpoint theo cue: cue đã lưu thì không phiên âm lại đoạn đó.
    da = q.doc_phan_hoi(ulid) or {"cue": []}
    if not da["cue"]:
        q.dat_giai_doan(ulid, "dang-goi-model")
        bang = bang_khai.doc_model(ASSETS / "model.json")
        # GỢI Ý phải là model NHẬN AUDIO. `quyet_dinh` gợi ý theo tác vụ
        # `chung-cat`, và mặc định đó (`gemini-2.5-flash-lite`) KHÔNG khai
        # `ho_tro_audio` ⇒ mọi job transcript chết ở phép chặn của `asr_cua`.
        # `FR-053 §1.1` vẫn đứng: NGƯỜI chọn thắng gợi ý — nhưng lựa chọn của
        # người cũng bị kiểm cùng một phép, và câu từ chối nói ra vì sao.
        # `model_nguoi_chon` chứ không `model`: `model` là thứ CỬA phân giải
        # theo tác vụ `chung-cat`, và nó luôn có giá trị nên `or` không bao giờ
        # chạy tới nhánh gợi ý audio.
        chon = p.get("model_nguoi_chon") or _goi_y_audio(bang)
        dong = dinh_tuyen.quyet_dinh(
            bang, "chung-cat", "", model_nguoi_chon=chon, co_khoa=True)
        # MỘT lần THỬ, đếm ở đây — trước khi gửi, và KHÔNG đếm lại bên trong
        # vòng lặp đoạn của `phien_am` (`M12-R6`, chữ mới `FR-065` 2026-09-05).
        # Một lượt phiên âm trọn nguồn là một lần thử, chia bao nhiêu đoạn cũng
        # vậy; đếm theo đoạn thì nguồn 60 phút chạm trần ngay lần thử đầu.
        q.ghi_nhan_gui(ulid)
        # `ghi_nhan` — checkpoint SAU TỪNG CUE ra file tiến độ (`T12-19`).
        #
        # Chỉ đạo: *"nó sinh chữ tới đâu thì show tới đó"*. Móc này `asr` đã
        # có sẵn cho checkpoint resume; đơn vị này chỉ nối nó vào một file mà
        # `/viec/<id>` đọc được.
        #
        # Gom vào một list rồi ghi TOÀN BỘ mỗi lần: `vtt.dung()` tự kiểm tính
        # hợp lệ của cả file, nên ghi từng dòng nối đuôi sẽ bỏ qua phép kiểm đó.
        # WO-067 · TIẾP TỪ CHỖ ĐÃ CÓ. File tiến độ (`T12-19`) là checkpoint
        # theo cue; trước đó `da_co = []` và `phien_am` chạy từ 0 ⇒ "chạy lại"
        # là trả tiền lại cho phần đã đúng. Đọc cue đã có, ghép vào trước, và
        # bảo ASR bắt đầu từ giây cuối cùng đã có.
        # WO-078 · tìm cả tiến độ của việc TRƯỚC cùng `slug`, không chỉ của
        # chính mình — xem `tien_do_cu_cung_slug`.
        da_co = tien_do_cu_cung_slug(q, ulid, str(slug))
        # WO-080 · ghi mốc VÀO VIỆC. Phép "có tiến" so giây cuối lúc HỎNG với
        # giây lúc lượt này BẮT ĐẦU — mà chỗ bắt lỗi (`chay_mot_viec`) không có
        # biến ấy trong tầm. Ghi ra file là cách duy nhất hai chỗ cùng đọc được
        # một sự thật, và nó sống qua cả một worker bị giết giữa chừng.
        try:
            _v = q.doc(ulid)
            _v["bat_dau_luot_giay"] = round(
                max((float(c.get("den") or 0) for c in da_co), default=0.0), 3)
            q._ghi_nguyen_tu(ulid, _v)
        except Exception:                                  # noqa: BLE001
            pass
        bat_dau = max((float(c.get("den") or 0) for c in da_co), default=0.0)
        if da_co:
            print(f"[worker] {ulid} · tiếp từ {int(bat_dau)}s ({len(da_co)} cue đã có)", flush=True)

        def _moc(c):
            da_co.append(c)
            q.ghi_tien_do(ulid, da_co)

        # WO-066 · `PhienAmCut` là PHANH CỐ Ý của cửa ASR — thứ được phân loại
        # rõ nhất trong hệ — mà trước đây rơi vào `except Exception` và bị in
        # là "HỎNG (không phân loại)". Đổi nó thành `ViecHong` ở đúng giai đoạn
        # để `chay_lai` resume từ `dang-goi-model` với cue đã checkpoint.
        try:
          cue = asr_cua.phien_am(
            audio, dong_model=dong, log=egress.duong_log(q.goc),
            # Trần của AUDIO, không phải trần payload JSON của chưng cất.
            #
            # `tran_payload_byte` (32 MiB) là số của một bài toán khác — nó đo
            # thân JSON gửi model lúc chưng cất. Mượn nó cho audio đã chặn
            # đúng video 58 phút của chủ dự án 2026-09-07:
            #   `VuotTran: audio 37028349 byte > trần 33554432`
            #
            # Trần thật của một LỜI GỌI là `tran_than_cua_byte`, và
            # `_phien_am_mot_doan` đã đo nó theo TỪNG ĐOẠN. Con số truyền vào
            # đây chỉ còn là lan can cho cả file trên đĩa.
            tran=tai_nguon.doc_bang()["tran_audio_byte"],
            ghi_nhan=_moc, bat_dau=bat_dau)
        except asr_cua.PhienAmCut as e:
            raise ViecHong("dang-goi-model", str(e)) from e
        # `cue` là phần MỚI; `da_co` đã gồm cả cũ lẫn mới (qua `_moc`).
        cue = da_co if da_co else cue
        da = {"cue": cue, "model_asr": asr_cua.ten_model(dong)}
        q.luu_phan_hoi(ulid, da)

    # ── vtt ─────────────────────────────────────────────────────────────
    q.dat_giai_doan(ulid, "dang-verify")
    noi = vtt_mod.dung(da["cue"])

    # ── gan-hien-vat ────────────────────────────────────────────────────
    # Nạp `.vtt` qua CỬA HIỆN VẬT (`POST /api/articles/media`) — `FR-054` buộc
    # đường này. Audio tạm xoá NGAY sau khi hiện vật đã nạp: nó là thứ nặng
    # nhất trong hệ, và một job hỏng giữa chừng để lại nó (`AC-V2`).
    ten_goc = f"{slug.split('/')[-1]}.vtt"
    sha = _nap_hien_vat(noi.encode("utf-8"), "text/vtt", ten_goc)
    # Gắn qua CỬA HẸP `T08-30` (chủ dự án chọn lối 1): nó chỉ thêm một con trỏ
    # vào `media[]`. Không dùng `PUT` — cửa đó nhận cả frontmatter và thân, tức
    # một THỢ gọi được nó ghi được cả `credibility_max` (`M01-R2` cấm).
    q.dat_giai_doan(ulid, "dang-verify")
    gan = _goi_loi(f"/api/articles/{slug}/hien-vat", {
        "sha256": sha, "mime": "text/vtt", "ten_goc": ten_goc,
        "kieu_moc": "la_asr",
    })
    audio.unlink(missing_ok=True)
    # CON TRỎ tới sản phẩm — thiếu nó thì không ai tra lại được, và chưng cất
    # không lấy được transcript để dùng (`FR-070 §3`).
    q.ghi_ket_qua(ulid, {"sha256": sha, "so_cue": len(da["cue"]), "slug": slug})
    return {"sha256": sha, "cue": len(da["cue"]), "model_asr": da.get("model_asr"),
            "media": len(gan.get("media") or [])}


def _goi_y_audio(bang: dict) -> str:
    """Model NHẬN AUDIO để gợi ý cho `sinh-transcript`.

    Ưu tiên model MIỄN PHÍ nếu có — ví của dự án đo được 16.28 VND, nên một job
    20 phút audio qua model trả tiền là một job chết vì hết tiền, và người bấm
    chỉ biết sau khi đã bấm.

    Không có model nào vừa free vừa nhận audio thì trả model audio ĐẦU TIÊN và
    để `dich_vu` chạy — nhưng câu từ chối của `asr_cua` sẽ nói rõ nếu hết tiền.
    Lối `ytdlp-asr-local` (`uu_tien: 3`) là đường 0 đồng, và bảng khai đã có nó.
    """
    au = [r for r in bang["dong"]
          if r.get("ho_tro_audio") and r.get("tac_vu_model", "van-ban") == "van-ban"]
    if not au:
        raise ViecHong(
            "dang-goi-model",
            "bảng khai KHÔNG có model nào `ho_tro_audio` — lối `dich_vu` không "
            "chạy được. Dùng lối `ytdlp-asr-local` (cài nhóm `asr`).")
    return next((r["model"] for r in au if r.get("mien_phi")), au[0]["model"])


def _tai_audio(q: vong.HangDoi, ulid: str, slug: str, loi: dict,
               bang_nguon: dict, fm: dict | None = None) -> Path:
    """Lấy audio về Maildir CỦA JOB. Lối `file` thì KHÔNG tải — người nạp.

    Mọi byte đi qua `egress.gui()` (`M12-R3`) kể cả lối `tai_ve`: nó **tải VỀ**
    nên `tieu_egress: false`, nhưng nó VẪN là một lời gọi ra Internet, host vẫn
    phải trong allowlist (`AC-V4`). Trộn hai nghĩa của chữ *egress* vào một cột
    là cách con số này bắt đầu nói dối (`FR-054 §1.5`).
    """
    if loi["loai"] == "file":
        # WO-065 · BYTE ĐÃ TRONG KHO ⇒ đọc nó, không ném.
        #
        # Bản trước ném vô điều kiện ở đây với câu *"đòi NGƯỜI nạp file
        # transcript"* — đúng khi lối `file` chỉ nghĩa là *người nạp một `.vtt`
        # sẵn*. `FR-075` biến *người tải một `.mp4` lên* thành đường thật, và
        # `spec §5.0b` tả `doc-byte` đúng là đường này: `GET
        # /api/articles/media/<sha>` qua LÕI (quyết 1a) → audio vào Maildir
        # CỦA JOB, không vào `kb/**`.
        #
        # KHÔNG qua `egress.gui()`: đây là 127.0.0.1, không phải Internet.
        # `M12-R3` đếm lần dữ liệu RỜI MÁY; gọi LÕI không phải một lần đó, và
        # `_doc_transcript` đã lập tiền lệ cho đúng phép đọc này.
        hv = _hien_vat_audio((fm or _frontmatter(slug)).get("media"))
        if hv is None:
            raise ViecHong(
                "dang-doc-nguon",
                f"lối `{loi['ten']}` cần một hiện vật `video/*|audio/*` trong "
                f"kho, mà bản ghi `{slug}` không có. Tải file lên ở màn Đăng ký "
                f"video, hoặc đăng ký bằng URL để dùng lối tải về.")
        # Nhịp MỘT của `M12-R9`: chặn byte NGAY ở cửa, trước khi đọc.
        tai_nguon.kiem_byte(int(hv.get("so_byte") or 0),
                            la_video=str(hv.get("mime", "")).startswith("video/"),
                            bang=bang_nguon)
        ra = q.goc / "cur" / f"{ulid}.audio"
        try:
            with urllib.request.urlopen(
                    f"{_cua_loi()}/api/articles/media/{hv['sha256']}",
                    timeout=600) as r:
                ra.write_bytes(r.read())
        except (urllib.error.URLError, OSError) as e:
            raise ViecHong(
                "dang-doc-nguon",
                f"không đọc được hiện vật `{hv['sha256'][:12]}…` qua LÕI: {e}"
            ) from e
        nhat_ky.ghi("worker", su_kien="doc-byte-trong-kho", viec=ulid, slug=slug,
                    sha256=hv["sha256"], so_byte=ra.stat().st_size,
                    loi_nguon=loi["ten"], tieu_egress=False)
        return ra

    url = _url_nguon(slug, fm)
    host = tai_nguon.kiem_host(url, bang_nguon)          # chặn TRƯỚC request
    ra = q.goc / "cur" / f"{ulid}.audio"
    lenh = tai_nguon.lenh_tai(url, ra, bang_nguon)

    def _chay(_dich, _than, **kw):
        """Transport của lối `tai_ve`: chạy `yt-dlp`, KHÔNG mở socket ở đây.

        `egress.gui` là chỗ cấp `seq` và ghi log TRƯỚC khi gọi — nên hàm này
        chạy SAU dòng log, đúng thứ tự `AC-6.1` đòi.
        """
        import subprocess
        try:
            r = subprocess.run(lenh, capture_output=True, text=True,
                               timeout=1800)
        except FileNotFoundError as e:
            # `FileNotFoundError: [WinError 2] The system cannot find the file
            # specified` là câu KHÔNG NÓI GÌ: nó không cho biết file nào, và
            # người đọc đi tìm một file đầu vào trong khi thứ thiếu là công cụ.
            # Đo được 2026-09-05: job transcript chết ở đây, và phải mở
            # `chay.sh` + `which yt-dlp` + `pip show` mới ra nguyên nhân.
            raise ViecHong(
                "dang-doc-nguon",
                f"không chạy được công cụ tải: {lenh[0]!r} -m {lenh[2]!r}. "
                f"Cài bằng `pip install -e ./chungcat` (gói `yt-dlp` nằm trong "
                f"`dependencies`), rồi chạy lại. Lỗi gốc: {e}") from e
        except subprocess.TimeoutExpired as e:
            # Phân biệt TREO với TRẢ LỖI: 1800s trôi qua mà không có gì là một
            # triệu chứng khác hoàn toàn với `yt-dlp` trả mã lỗi, và gộp hai
            # cái vào một câu là bỏ mất thông tin đắt nhất.
            raise ViecHong("dang-doc-nguon",
                           f"tải nguồn TREO quá {e.timeout}s — nguồn chặn, "
                           f"mạng đứt, hoặc video quá dài") from e
        if r.returncode != 0:
            raise ViecHong("dang-doc-nguon",
                           f"`yt-dlp` trả {r.returncode}: {r.stderr[-300:]}")
        return {"ok": True}

    q.ghi_nhan_gui(ulid)          # đếm TRƯỚC khi ra Internet
    egress.gui({"url": url, "loi": loi["ten"]}, f"https://{host}/",
               allowlist=[host],
               tran=bang_nguon["tran_video_byte"],
               log=egress.duong_log(q.goc), chuyen=_chay,
               # `tieu_egress: false` — TẢI VỀ, không gửi dữ liệu của ta đi.
               tieu_egress=False, loi_dung=loi["ten"])
    got = next(iter((q.goc / "cur").glob(f"{ulid}.audio*")), None)
    if got is None:
        raise ViecHong("dang-doc-nguon",
                       f"`yt-dlp` báo xong mà không có file `{ulid}.audio*`")
    return got


def _frontmatter(slug: str) -> dict:
    """Frontmatter của một bản ghi, đọc QUA API của LÕI (quyết 1a · `M12-R1`).

    Một hàm cho cả `url` lẫn `media`: hai lời gọi cho cùng một bản ghi là hai
    chỗ để thấy hai trạng thái khác nhau, và giữa chúng có một khoảng để bản
    ghi đổi.
    """
    try:
        with urllib.request.urlopen(f"{_cua_loi()}/api/articles/{slug}",
                                    timeout=30) as r:
            d = json.loads(r.read() or b"{}")
    except (urllib.error.URLError, OSError) as e:
        raise ViecHong("dang-doc-nguon", f"không đọc được `{slug}`: {e}") from e
    return d.get("frontmatter") or d or {}


def _url_nguon(slug: str, fm: dict | None = None) -> str:
    """URL của bản ghi video."""
    d = {"frontmatter": fm} if fm is not None else {"frontmatter": _frontmatter(slug)}
    url = (d.get("frontmatter") or {}).get("url") or d.get("url")
    if not url:
        raise ViecHong("dang-doc-nguon",
                       f"bản ghi `{slug}` không có `url` — không biết tải ở đâu")
    return url


def _nap_hien_vat(byte: bytes, mime: str, ten_goc: str) -> str:
    """`POST /api/articles/media` — cửa HIỆN VẬT, không phải cửa bản ghi.

    Phân biệt này là cả luật: `POST /api/articles` (`taoBai`) đặt `approved`
    VÔ ĐIỀU KIỆN và `M12-R2` cấm M12 đi qua đó. Cửa `/media` chỉ nhận byte và
    trả `sha256`.
    """
    rq = urllib.request.Request(
        _cua_loi() + "/api/articles/media", method="POST", data=byte,
        headers={"Content-Type": mime, "X-Ten-Goc": ten_goc})
    try:
        with urllib.request.urlopen(rq, timeout=60) as r:
            d = json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise ViecHong("dang-verify",
                       f"cửa hiện vật trả {e.code}: {e.read()[:200]!r}") from e
    sha = d.get("sha256") or d.get("sha")
    if not sha:
        raise ViecHong("dang-verify", f"cửa hiện vật không trả sha256: {d}")
    return sha


# ═══ T12-26 · TẢI VIDEO THEO CHẤT LƯỢNG ═══════════════════════════════════

# Khuôn tên file tạm: `<viec_id 32 hex>-<bậc>p.mp4`. Việc dọn LỌC theo khuôn
# này, không dọn theo tuổi trần: `%TEMP%` là nhà chung của cả máy, và một
# lệnh "xoá mọi file cũ hơn N giờ trong thư mục tạm" là lệnh phá hoại.
#
# `{32}` chứ không `{26}`: id việc là `uuid.uuid4().hex` (`api.py:280`),
# không phải ULID. Bản đầu khai `{26}` nên `don_xuat_tam` chưa bao giờ xoá
# được gì — mà cổng vẫn xanh vì fixture của tôi cũng dùng ULID giả.
_KHUON_TAM = re.compile(r"^[0-9a-fA-F]{32}-(\d{3,4}|goc)p?\.mp4$")


def duong_xuat_tam() -> Path:
    """Thư mục file video tải về — NGOÀI repo, luôn luôn.

    Một video là hàng trăm MB. Nhét vào kho là đầy lfs sau vài lần bấm, và
    `FR-054 §9.3` đã trả giá cho bài học ấy một lần rồi. Env
    `CHUNGCAT_XUAT_TAM` cho người đổi chỗ; mặc định là `%TEMP%/gn-xuat-tam`.
    """
    d = os.environ.get("CHUNGCAT_XUAT_TAM")
    ra = Path(d) if d else Path(tempfile.gettempdir()) / "gn-xuat-tam"
    ra.mkdir(parents=True, exist_ok=True)
    return ra


def don_xuat_tam(thu_muc: Path, tran_gio: int) -> int:
    """Dọn file tạm QUÁ HẠN. Trả số file đã dọn.

    Hai bộ lọc, và cả hai đều bắt buộc:
      tuổi  — quá `tran_gio` giờ tính từ mtime
      TÊN   — khớp `_KHUON_TAM`, tức đúng file do job này sinh

    Bỏ bộ lọc tên thì hàm này xoá file của người khác trong cùng thư mục tạm,
    và nó làm thế im lặng.

    Nuốt lỗi từng file: một file đang bị trình duyệt giữ (WinError 32) không
    được phép làm chết cả vòng worker — lần dọn sau sẽ tới lượt nó.
    """
    han = time.time() - tran_gio * 3600
    dem = 0
    for f in thu_muc.glob("*"):
        if not f.is_file() or not _KHUON_TAM.match(f.name):
            continue
        try:
            if f.stat().st_mtime < han:
                f.unlink()
                dem += 1
        except OSError:
            continue
    return dem


# Dòng tiến độ của `yt-dlp`, khuôn thật:
#   [download]  12.3% of  45.67MiB at    1.20MiB/s ETA 00:30
#
# Đọc bằng MỘT regex thay vì tách chuỗi theo vị trí: khoảng trắng giữa các cột
# thay đổi theo độ dài số, và cắt theo cột là cách nó im lặng đọc sai.
_RE_TIEN_DO = re.compile(
    r"\[download\]\s+(?P<pt>\d+(?:\.\d+)?)%\s+of\s+~?\s*(?P<tong>[\d.]+\s*[KMGT]?i?B)"
    r"(?:\s+at\s+(?P<toc>[\d.]+\s*[KMGT]?i?B/s|Unknown\s*B/s))?"
    r"(?:\s+ETA\s+(?P<eta>[\d:]+))?")


def doc_dong_tien_do(dong: str) -> dict | None:
    """Một dòng yt-dlp → bản ghi tiến độ, hoặc `None` nếu không phải.

    Trả `None` cho mọi dòng khác — KHÔNG đoán bừa. Một hàm phân tích mà đoán
    thì nó biến `[youtube] Extracting URL` thành một tiến độ 0%, và màn hiện
    một thanh chạy cho một việc chưa bắt đầu.
    """
    m = _RE_TIEN_DO.search(dong or "")
    if not m:
        return None
    return {
        "phan_tram": float(m.group("pt")),
        "tong": (m.group("tong") or "").strip(),
        "toc_do": (m.group("toc") or "").strip(),
        "con_lai": (m.group("eta") or "").strip(),
    }


def chay_tai_video(q: vong.HangDoi, ulid: str, viec: dict) -> dict:
    """Tải video của một bản ghi URL về thư mục tạm, ở bậc người chọn."""
    pl = viec.get("payload") or {}
    slug = str(pl.get("slug") or "")
    if not slug:
        raise ViecHong("dang-doc-nguon", "thiếu `slug` — không biết tải bản ghi nào")
    bang = tai_nguon.doc_bang()               # nguồn: host + trần byte
    bac = tai_nguon.bac_chat_luong()          # ngưỡng: bậc chất lượng
    cl = pl.get("chat_luong", "goc")
    if cl not in bac:
        raise ViecHong(
            "dang-doc-nguon",
            f"bậc {cl!r} không có trong bảng khai. Bậc được phép: "
            f"{', '.join(str(x) for x in bac)}.")

    # Dùng ĐÚNG từ vựng đã khai (`GIAI_DOAN`), không đẻ giai đoạn mới.
    # Bản đầu tôi đặt "tai" và `dat_giai_doan` ném `ValueError: giai đoạn lạ`
    # — job chết ngay, đo được trên máy 2026-09-06. Tải một video LÀ đọc
    # nguồn; thêm một nấc thứ sáu chỉ để một loại việc dùng là bắt mọi bên
    # đọc pipeline phải học thêm một chữ.
    q.dat_giai_doan(ulid, "dang-doc-nguon")
    url = _url_nguon(slug)
    host = tai_nguon.kiem_host(url, bang)          # chặn TRƯỚC request
    ra = duong_xuat_tam() / f"{ulid}-{cl}p.mp4"
    lenh = tai_nguon.lenh_tai_video(url, ra, cl, bang)

    def _chay(_dich, _than, **kw):
        """Chạy `yt-dlp` và ĐỌC TỪNG DÒNG để phát tiến độ.

        `subprocess.run(capture_output=True)` gom hết output rồi mới trả —
        nghĩa là tiến độ chỉ có SAU KHI tải xong, tức không còn là tiến độ.
        Với một file hàng trăm MB, khoảng im lặng ấy đủ dài để người bấm lại
        lần nữa, và lần bấm ấy tạo một job thứ hai tải cùng một thứ.
        """
        try:
            pr = subprocess.Popen(
                lenh, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, bufsize=1, encoding="utf-8", errors="replace")
        except FileNotFoundError as e:
            raise ViecHong(
                "tai", f"không chạy được công cụ tải: {lenh[0]!r} -m {lenh[2]!r}. "
                f"Cài bằng `pip install -e ./chungcat`. Lỗi gốc: {e}") from e

        duoi = deque(maxlen=12)          # giữ ĐUÔI để kể lỗi, không giữ cả log
        t0 = time.time()
        try:
            for dong in pr.stdout or ():
                duoi.append(dong.rstrip())
                td = doc_dong_tien_do(dong)
                if td:
                    q.ghi_tien_do_tai(ulid, {**td, "chat_luong": cl})
                if time.time() - t0 > 3600:
                    pr.kill()
                    raise ViecHong("dang-doc-nguon", "tải TREO quá 3600s — video quá dài, "
                                          "nguồn chặn, hoặc mạng đứt")
        finally:
            try:
                pr.wait(timeout=30)
            except Exception:                            # noqa: BLE001
                pr.kill()
        if pr.returncode != 0:
            raise ViecHong("dang-doc-nguon",
                           f"`yt-dlp` trả {pr.returncode}: " + " | ".join(duoi)[-300:])
        q.ghi_tien_do_tai(ulid, {"phan_tram": 100.0, "chat_luong": cl, "xong": True})
        return {"ok": True}

    q.ghi_nhan_gui(ulid)          # đếm TRƯỚC khi ra Internet
    egress.gui({"url": url, "chat_luong": cl}, f"https://{host}/",
               allowlist=[host], tran=bang["tran_video_byte"],
               log=egress.duong_log(q.goc), chuyen=_chay,
               # TẢI VỀ — không gửi dữ liệu của ta đi (`FR-054 §1.5`).
               tieu_egress=False, loi_dung="tai-video")

    got = ra if ra.exists() else next(
        iter(duong_xuat_tam().glob(f"{ulid}-{cl}p.*")), None)
    if got is None:
        raise ViecHong("dang-doc-nguon", f"`yt-dlp` báo xong mà không có file `{ulid}-{cl}p.*`")
    kq = {
        "tep_tam": got.name,
        # Thư mục đi KÈM, không để web đoán lại. Hai chỗ tự phân giải cùng một
        # đường (một Python, một Node) là hai chỗ để lệch, và ngày env đổi thì
        # chỉ một trong hai biết.
        "thu_muc": str(got.parent),
        "so_byte": got.stat().st_size,
        "chat_luong": cl,
        "slug": slug,
    }
    q.ghi_ket_qua(ulid, kq)
    return kq


# ═══ WO-071 + WO-072 · SINH THUMBNAIL ════════════════════════════════════

def chien_luoc_anh_bia(fm: dict, ep: bool = False) -> str | None:
    """Bản ghi này lấy ảnh bìa BẰNG LỐI NÀO — hoặc `None` nếu KHÔNG cần/được.

    MỘT phép quyết cho CẢ HAI bên: LÕI dùng nó để biết có xếp việc không, THỢ
    dùng CHÍNH nó để biết chạy nhánh nào. Hai bên tự quyết là hai chỗ để lệch,
    và lệch ở đây nghĩa là một lời gọi ra Internet cho một bản ghi ĐÃ CÓ ảnh —
    tốn lời gọi, và ghi đè một tấm ảnh đang đúng.

    Chỉ đạo chủ dự án 2026-09-09: *"loại nào KHÔNG CÓ NỀN mới áp dụng"*.

        None      đã có ảnh · YouTube (ytimg đoán được từ id) · không có gì
                  render được · host ngoài allowlist
        "url"     host trong `host_cho_phep` mà KHÔNG nằm trong
                  `host_khong_lay_anh_bia`  →  yt-dlp --write-thumbnail
        "khung"   mp4/webm byte trong kho     →  ffmpeg một frame
        "pdf"     application/pdf trong kho   →  pypdfium2 trang 1
    """
    ds = fm.get("media")
    ds = ds if isinstance(ds, list) else ([ds] if ds else [])
    ds = [m for m in ds if isinstance(m, dict) and m.get("sha256")]

    # 1 · ĐÃ CÓ ảnh ⇒ thôi. Sinh lại là việc NGƯỜI bấm, không phải việc tự chạy.
    #
    # `ep` là chính cái "NGƯỜI bấm" ấy, và nó phải tồn tại: WO-075 đo được TikTok
    # trả về một tấm gradient TRỐNG 4 761 byte, và không có cờ này thì bản ghi
    # đó kẹt với ảnh hỏng vĩnh viễn — mọi lần chạy lại đều bị chính luật (1)
    # chặn, kèm câu lỗi "đã có ảnh trong kho" nghe như đang làm đúng.
    if not ep and any(str(m.get("mime", "")).startswith("image/") for m in ds):
        return None

    # 2 · URL — YouTube có ảnh đoán được từ id, nên một job ở đây không mua gì.
    u = str(fm.get("url") or "")
    if u.startswith("http"):
        try:
            host = urllib.parse.urlsplit(u).hostname or ""
        except ValueError:
            host = ""
        host = host.lower()
        if "youtube.com" in host or "youtu.be" in host:
            return None
        # WO-074 · host ĐƯỢC gọi ra nhưng KHÔNG lấy được ảnh bìa. Đọc từ bảng
        # khai, không gõ tên host ở đây: thêm một nền tảng vào diện này là thêm
        # MỘT DÒNG bảng, và `M12-R1` không cho mã biết tên host nào cả.
        bang = tai_nguon.doc_bang()
        if host in {h.lower() for h in bang.get("host_khong_lay_anh_bia") or []}:
            return None
        try:
            tai_nguon.kiem_host(u, bang)
            return "url"
        except tai_nguon.HostKhongKhai:
            return None            # `AC-V4` cấm gọi một host chưa khai

    # 3 · BYTE trong kho. `.vtt` KHÔNG tính — transcript không phải hình.
    for m in ds:
        mi = str(m.get("mime", ""))
        if mi.startswith("video/"):
            return "khung"
        if mi == "application/pdf":
            return "pdf"
    return None


def _frame_mp4(byte: bytes, thu_muc: Path) -> bytes:
    """Một frame của mp4 → jpg. `-ss 1`: giây 0 thường là màn đen/logo."""
    import subprocess
    if not shutil.which("ffmpeg"):
        raise ViecHong("dang-doc-nguon",
                       "cần `ffmpeg` để lấy khung hình — cài rồi chạy lại.")
    vao, ra = thu_muc / "vao.mp4", thu_muc / "ra.jpg"
    vao.write_bytes(byte)
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", "1", "-i", str(vao),
         "-frames:v", "1", "-vf", f"scale={_be_rong_anh()}:-1", str(ra)],
        capture_output=True, text=True, timeout=120)
    if r.returncode != 0 or not ra.exists():
        raise ViecHong("dang-doc-nguon",
                       f"ffmpeg không lấy được khung: {r.stderr.strip()[:200]}")
    return ra.read_bytes()


def _trang_dau_pdf(byte: bytes, thu_muc: Path) -> bytes:
    """Trang 1 của PDF → png. `pypdfium2` đi kèm `pdfplumber`, 0 gói mới."""
    try:
        import pypdfium2
    except ImportError as e:
        raise ViecHong("dang-doc-nguon",
                       "thiếu `pypdfium2` (đi kèm `pdfplumber`) — "
                       "`pip install -e ./chungcat`") from e
    vao = thu_muc / "vao.pdf"
    vao.write_bytes(byte)
    tl = pypdfium2.PdfDocument(str(vao))
    try:
        if len(tl) < 1:
            raise ViecHong("dang-doc-nguon", "PDF không có trang nào")
        # `scale` theo bề rộng mong muốn: trang A4 ở 72 dpi rộng 595 điểm.
        anh = tl[0].render(scale=max(0.5, _be_rong_anh() / 595)).to_pil()
    finally:
        tl.close()
    from io import BytesIO
    bo = BytesIO()
    anh.save(bo, format="PNG")
    return bo.getvalue()


def _be_rong_anh() -> int:
    """Bề rộng ảnh bìa — BẢNG KHAI, không gõ số (`M12-R4`)."""
    try:
        d = json.loads((ASSETS / "nguong.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 640
    return int(d.get("be_rong_anh_bia") or 640)




def chay_sinh_thumbnail(q: vong.HangDoi, ulid: str, viec: dict) -> dict:
    """Ảnh bìa của một bản ghi video URL → hiện vật `image/jpeg` trong kho.

    `yt-dlp --write-thumbnail --skip-download` thay oEmbed: oEmbed của Facebook
    đòi app token từ 10/2020, còn `yt-dlp` có extractor cho cả bốn host — 0
    token, 0 nhánh per-platform. `WO-071` ghi rõ đánh đổi.

    YouTube KHÔNG cần job này: `nenThe` lớp 2 dựng `i.ytimg.com/vi/<id>/…` từ
    id, một URL đoán được. Job này cho ba host còn lại — nhưng không CHẶN
    YouTube: một ảnh trong kho không hết hạn và không phụ thuộc domain ngoài,
    nên ai muốn vẫn chạy được.
    """
    pl = viec.get("payload") or {}
    slug = str(pl.get("slug") or "")
    if not slug:
        raise ViecHong("dang-doc-nguon", "thiếu `slug` — không biết lấy ảnh của bản ghi nào")

    ep = bool(pl.get("ep"))
    bang = tai_nguon.doc_bang()
    q.dat_giai_doan(ulid, "dang-doc-nguon")
    fm = _frontmatter(slug)

    # WO-072 · MỘT phép quyết cho cả hai bên. THỢ không tự suy lại: LÕI đã dùng
    # đúng hàm này để quyết có xếp việc không, và hai bản của một phép quyết là
    # hai chỗ để lệch.
    loi_anh = chien_luoc_anh_bia(fm, ep)
    if loi_anh is None:
        raise ViecHong(
            "dang-doc-nguon",
            f"bản ghi `{slug}` không cần (hoặc không lấy được) ảnh bìa: đã có "
            f"ảnh trong kho, hoặc là YouTube (ảnh đoán được từ id), hoặc không "
            f"có hiện vật nào render được, hoặc host ngoài allowlist.")

    tam = Path(tempfile.mkdtemp(prefix="cc-anh-"))
    try:
        if loi_anh in ("khung", "pdf"):
            # BYTE ĐÃ TRONG KHO — đọc qua LÕI (quyết 1a), 0 egress, 0 kiểm host.
            ds = fm.get("media")
            ds = ds if isinstance(ds, list) else ([ds] if ds else [])
            hv = next(m for m in ds if isinstance(m, dict) and (
                str(m.get("mime", "")).startswith("video/") if loi_anh == "khung"
                else str(m.get("mime")) == "application/pdf"))
            with urllib.request.urlopen(
                    f"{_cua_loi()}/api/articles/media/{hv['sha256']}",
                    timeout=600) as r:
                byte = r.read()
            anh_byte = (_frame_mp4(byte, tam) if loi_anh == "khung"
                        else _trang_dau_pdf(byte, tam))
            mime_anh = "image/jpeg" if loi_anh == "khung" else "image/png"
            duoi = "jpg" if loi_anh == "khung" else "png"
            nhat_ky.ghi("worker", su_kien="anh-bia-tu-byte-kho", viec=ulid,
                        slug=slug, loi_anh=loi_anh, so_byte=len(anh_byte),
                        tieu_egress=False)
            return _gan_anh_bia(q, ulid, slug, anh_byte, mime_anh, duoi)

        return _anh_bia_tu_url(q, ulid, slug, fm, bang, tam)
    finally:
        shutil.rmtree(tam, ignore_errors=True)


def _gan_anh_bia(q, ulid: str, slug: str, byte: bytes, mime: str, duoi: str) -> dict:
    """Nạp ảnh vào kho rồi GẮN — THAY entry cùng `kieu_moc`, không thêm."""
    q.dat_giai_doan(ulid, "dang-verify")
    ten = f"{slug.split('/')[-1]}.{duoi}"
    sha = _nap_hien_vat(byte, mime, ten)
    gan = _goi_loi(f"/api/articles/{slug}/hien-vat", {
        "sha256": sha, "mime": mime, "ten_goc": ten,
        "kieu_moc": "la_thumbnail", "thay_kieu_moc": True,
    })
    q.ghi_ket_qua(ulid, {"sha256": sha, "slug": slug})
    return {"sha256": sha, "media": len(gan.get("media") or [])}


def _anh_bia_tu_url(q, ulid: str, slug: str, fm: dict, bang: dict, tam: Path) -> dict:
    """Lối `url` — `yt-dlp --write-thumbnail` (WO-071)."""
    url = _url_nguon(slug, fm)
    goc = duong_xuat_tam() / f"{ulid}-thumb"
    lenh = tai_nguon.lenh_tai_thumbnail(url, goc, bang)

    def _chay(_dich, _than, **kw):
        """Transport: chạy `yt-dlp`, KHÔNG mở socket ở đây — `egress.gui` cấp
        `seq` và ghi log TRƯỚC, nên hàm này chạy SAU dòng log (`AC-6.1`)."""
        import subprocess
        try:
            r = subprocess.run(lenh, capture_output=True, text=True, timeout=300)
        except FileNotFoundError as e:
            raise ViecHong(
                "dang-doc-nguon",
                f"không chạy được công cụ tải: {lenh[0]!r} -m {lenh[2]!r} "
                f"(gói `yt_dlp`). Cài bằng `pip install -e ./chungcat`. "
                f"Lỗi gốc: {e}") from e
        except subprocess.TimeoutExpired as e:
            raise ViecHong("dang-doc-nguon",
                           f"lấy ảnh bìa TREO quá {e.timeout}s") from e
        if r.returncode != 0:
            raise ViecHong("dang-doc-nguon",
                           f"`yt-dlp` trả {r.returncode}: {(r.stderr or '')[-300:]}")
        return {"ok": True}

    host = tai_nguon.kiem_host(url, bang)
    egress.gui({"url": url, "loi": "sinh-thumbnail"}, f"https://{host}/",
               allowlist=[host],
               tran=bang["tran_video_byte"], log=egress.duong_log(q.goc),
               chuyen=_chay,
               # TẢI VỀ — không gửi dữ liệu của ta đi (`FR-054 §1.5`).
               tieu_egress=False, loi_dung="sinh-thumbnail")

    # `-o <goc>` + `--convert-thumbnails jpg` ⇒ yt-dlp đặt tên theo khuôn của
    # nó; tìm THEO TIỀN TỐ thay vì đoán đuôi.
    # LỚN NHẤT, không phải đầu tiên theo tên. `--write-all-thumbnails` để lại
    # nhiều tệp; tên chúng không nói gì về chất lượng, còn SỐ BYTE thì có: một
    # tấm gradient trống nén xuống vài KB, ảnh thật thì hàng trăm KB.
    ds = sorted(duong_xuat_tam().glob(f"{ulid}-thumb*"),
                key=lambda f: f.stat().st_size, reverse=True)
    anh = ds[0] if ds else None
    for thua in ds[1:]:
        thua.unlink(missing_ok=True)
    if anh is None or not anh.stat().st_size:
        raise ViecHong("dang-doc-nguon",
                       "`yt-dlp` chạy xong mà không có tệp ảnh nào — nguồn có "
                       "thể không công bố ảnh bìa.")
    byte = anh.read_bytes()
    anh.unlink(missing_ok=True)
    return _gan_anh_bia(q, ulid, slug, byte, "image/jpeg", "jpg")


BANG_LOAI = {
    "chung-cat-mot-nguon": chay_chung_cat,
    "sinh-transcript": chay_sinh_transcript,
    "tai-video": chay_tai_video,
    "sinh-thumbnail": chay_sinh_thumbnail,
}


def mot_vong(q: vong.HangDoi | None = None) -> str | None:
    """Chiếm MỘT job, chạy trọn, chuyển sang `done/`. Trả ULID hoặc `None`.

    Job hỏng KHÔNG đi vào `done/`: nó về giai đoạn hỏng và ở lại `cur/` để
    `chay_lai` nhặt. Đẩy một job hỏng sang `done/` là nói dối cả hai chiều —
    người đọc thấy "xong" và `chay_lai` không tìm ra nó.
    """
    q = q or vong.HangDoi(goc_hang_doi())
    # DỌN trước khi nhận việc, không sau: một vòng có thể kết thúc bằng một
    # ngoại lệ, và phần dọn đặt ở cuối là phần không bao giờ chạy vào đúng
    # những ngày hệ đang hỏng — tức đúng những ngày ổ đĩa đầy nhanh nhất.
    try:
        # `tai_nguon` nay o tang module — bo alias cuc bo `_tn`: mot ten hai
        # nguon la hai cho de lech, va chinh loi nay vua ton cua chu du an mot
        # viec chet o `lan_gui 2/2`.
        _g = json.loads((tai_nguon.BANG_NGUONG).read_text(encoding="utf-8")
                        ).get("tran_xuat_tam_gio")
        if _g:
            don_xuat_tam(duong_xuat_tam(), int(_g))
    except Exception:                                # noqa: BLE001
        # Dọn TRƯỢT không được phép giết một vòng worker: file tạm còn lại là
        # phiền, một worker chết là hỏng việc.
        pass
    ulid = q.nhan_viec()
    if ulid is None:
        return None
    viec = q.doc(ulid)
    loai = (viec.get("payload") or {}).get("loai")
    ham = BANG_LOAI.get(loai)
    if ham is None:
        q.dat_giai_doan(ulid, "cho")
        print(f"[worker] {ulid} · `loai` chưa có người chạy: {loai!r}")
        return ulid
    # Một dòng TỔNG cho mỗi việc, cạnh các dòng theo giai đoạn của
    # `dat_giai_doan`. Hai mức là cố ý: `viec_loai=` trả lời *"loại việc nào
    # tốn thời gian"*, `giai_doan=` trả lời *"tốn ở khúc nào"*, và một mức
    # không suy ra được mức kia.
    with nhat_ky.Dong("worker", viec=ulid, viec_loai=loai,
                      han_ms=1_800_000) as d:
        try:
            with _tran_asr(viec):
                kq = ham(q, ulid, viec)
            q.dong_viec(ulid)
            d.them(ket="xong", **{k: v for k, v in (kq or {}).items()
                                  if k == "citations"})
            print(f"[worker] {ulid} · xong · {kq}")
        except ViecHong as e:
            q.danh_hong(ulid, e.giai_doan, str(e))
            d.them(ket="hong", giai_doan_hong=e.giai_doan, loi=str(e))
            print(f"[worker] {ulid} · HỎNG · {e}", file=sys.stderr)
            _tu_noi_tiep(q, ulid, viec, e.giai_doan)
        except Exception as e:                      # noqa: BLE001
            # WO-066 · KHÔNG đặt lại `cho`. Bản trước làm thế, và màn hiện
            # "chờ" mãi cho một việc đã chết — sự thật chỉ có ở `ket: hong-la`.
            # Chỗ hỏng = giai đoạn đang đứng lúc ném, để `chay_lai` biết đường.
            try:
                gd_luc_nem = q.doc(ulid).get("giai_doan") or "cho"
            except Exception:                       # noqa: BLE001
                gd_luc_nem = "cho"
            q.danh_hong(ulid, gd_luc_nem, f"{type(e).__name__}: {e}")
            _tu_noi_tiep(q, ulid, viec, gd_luc_nem)
            d.them(ket="hong-la", loi=f"{type(e).__name__}: {e}")
            print(f"[worker] {ulid} · HỎNG (không phân loại) · "
                  f"{type(e).__name__}: {e}", file=sys.stderr)
    return ulid


# ── SONG SONG (T12-23) ───────────────────────────────────────────────────
#
# Chỉ đạo: *"2 worker, mỗi worker 4 threads — tối đa 8 request một lúc"*.
#
# Vì sao LUỒNG chứ không tiến trình bên trong một worker: việc `chung-cat` chờ
# MẠNG, và luồng Python nhả GIL trong lúc chờ I/O. Tiến trình con thì mỗi cái
# nạp lại module + `.env` + bảng khai cho một việc chỉ ngồi đợi socket.
#
# Vì sao KHÔNG khoá quanh bước chọn việc: `nhan_viec` chiếm bằng `os.rename`
# (`new/`) và `O_CREAT|O_EXCL` (`cur/`) — cả hai nguyên tử ở tầng hệ điều hành,
# nên chúng đúng cho luồng CÙNG tiến trình y như cho tiến trình khác nhau. Một
# khoá Python thêm vào chỉ đúng TRONG một tiến trình, nên nó tạo cảm giác an
# toàn ở đúng chỗ đã an toàn, và không giúp gì cho ca hai TIẾN TRÌNH.

SEM_ASR: threading.Semaphore | None = None


def _tran_asr(viec: dict):
    """Ngữ cảnh giới hạn ASR đồng thời. Việc khác trả về ngữ cảnh rỗng."""
    if SEM_ASR is not None and (viec.get("payload") or {}).get("loai") == "sinh-transcript":
        return SEM_ASR
    return contextlib.nullcontext()


def chay_song_song(q=None, *, luong: int | None = None,
                   tran_asr: int | None = None, vong_lap_mai: bool = False,
                   nghi: float = 2.0) -> int:
    """Chạy `luong` luồng cùng nhặt việc. Trả số việc đã chạy.

    `vong_lap_mai=False` ⇒ chạy tới khi hàng đợi cạn rồi trả về (chế độ cổng
    kiểm dùng). `True` ⇒ thường trực.
    """
    global SEM_ASR
    ss = _khai_song_song()
    luong = luong or ss["luong_moi_tien_trinh"]
    SEM_ASR = threading.Semaphore(tran_asr or ss["tran_asr_dong_thoi"])
    q = q or vong.HangDoi(goc_hang_doi())
    dem = [0]
    khoa = threading.Lock()
    dung = threading.Event()

    def mot_luong():
        while not dung.is_set():
            if mot_vong(q) is None:
                if not vong_lap_mai:
                    return
                time.sleep(nghi)
                continue
            with khoa:
                dem[0] += 1

    ts = [threading.Thread(target=mot_luong, daemon=True, name=f"cc-{i}")
          for i in range(luong)]
    for t in ts:
        t.start()
    try:
        for t in ts:
            t.join()
    except KeyboardInterrupt:
        dung.set()
    return dem[0]


def _khai_song_song() -> dict:
    """Khối `song_song` của `nguong.json`. Thiếu ⇒ 1 luồng, 1 ASR.

    Mặc định KHÔNG phải 2×4: vắng bảng khai thì ta không biết máy này chịu
    được bao nhiêu, và đoán cao là cách một cổng chập chờn thành một cổng đổ.
    """
    import bang_khai
    ng = json.loads((ASSETS / "nguong.json").read_text(encoding="utf-8"))
    ss = ng.get("song_song") or {}
    return {"tien_trinh": int(ss.get("tien_trinh", 1)),
            "luong_moi_tien_trinh": int(ss.get("luong_moi_tien_trinh", 1)),
            "tran_asr_dong_thoi": int(ss.get("tran_asr_dong_thoi", 1))}


def vong_lap(nghi: float = 2.0) -> None:
    """Chạy thường trực. Hàng đợi rỗng thì NGHỈ, không quay tít."""
    q = vong.HangDoi(goc_hang_doi())
    while True:
        if mot_vong(q) is None:
            time.sleep(nghi)


def duong_khoa():
    """Đường file khoá của worker này — MỘT chỗ, để cổng so được với bên GHI.

    Có hàm này vì thứ nó thay thế đã hỏng im lặng suốt: bên ghi
    (`nhat_ky.bat`) và bên đọc (`chiem_khoa`) mỗi bên tự dựng một tên, nên
    không cổng nào có gì để đối chiếu. Hai nửa cùng gọi một hàm thì lệch được
    nữa cũng không lệch nổi.
    """
    return nhat_ky.duong_pid("worker")


def chiem_khoa() -> bool:
    """MỘT worker cho mỗi hàng đợi. `False` ⇒ đã có người chạy, thoát êm.

    Vì sao cần, đo được 2026-09-05: `chay.sh` dừng theo FILE PID, và một lần
    chạy nào đó không kịp ghi file đã để lại một worker mồ côi. Nó sống qua mọi
    lần restart sau đó, tiếp tục nhặt việc bằng **mã CŨ** — và bug lộ ra ở chỗ
    không ai ngờ: việc chạy xong mà thiếu `ket_qua`, trong khi mã mới rõ ràng có
    ghi. Tôi đã đi kiểm `ghi_ket_qua`, `dong_viec`, `_ghi_nguyen_tu` trước khi
    nghĩ tới chuyện có hai worker.

    Hai worker còn nguy hiểm hơn thế: cùng nhặt một hàng đợi thì `M12-R6` (trần
    2 lần gửi) đếm trong file việc vẫn đúng, nhưng lease và nhật ký thì trộn.

    Khoá là FILE PID của chính `nhat_ky` — không thêm cơ chế thứ hai. `os.kill(pid, 0)`
    hỏi hệ điều hành *"pid này còn sống không"* mà không gửi tín hiệu gì.
    """
    import os
    # KHOÁ THEO ĐỊNH DANH, không phải "một worker cho cả hàng đợi" (`T12-23`).
    #
    # Lý do khoá vẫn nguyên: một worker MỒ CÔI từ lần chạy trước, sống qua mọi
    # restart và nhặt việc bằng mã CŨ — đo được 2026-09-05, và bug lộ ra ở chỗ
    # không ai ngờ (việc xong mà thiếu `ket_qua`).
    #
    # Cái đổi là ĐƠN VỊ khoá: `worker-<id>.pid`. Chạy hai tiến trình thì mỗi
    # cái một `CHUNGCAT_WORKER_ID`, nên khoá vẫn chặn đúng thứ nó sinh ra để
    # chặn — hai bản CÙNG định danh — mà không cấm thứ chủ dự án vừa yêu cầu.
    # Đường lấy từ `nhat_ky.duong_pid` — CÙNG hàm mà `bat()` dùng để ghi.
    # Trước 2026-09-07 chỗ này tự dựng tên `worker-<wid>.pid` trong khi bên ghi
    # dùng `worker.pid`, và cả khoá này là mã chết. Định danh nay nằm trong
    # `duong_tep("worker")`, nên hai nửa không thể lệch nữa.
    d = nhat_ky.duong_pid("worker")
    wid = os.environ.get("CHUNGCAT_WORKER_ID") or "0"
    try:
        cu_pid = int(d.read_text(encoding="utf-8").strip())
    except (OSError, ValueError):
        return True                      # chưa có ai, hoặc file hỏng
    if cu_pid == os.getpid():
        return True
    try:
        os.kill(cu_pid, 0)
    except OSError:
        return True                      # pid đã chết ⇒ khoá mồ côi, cứ chạy
    print(f"[worker] ĐÃ CÓ worker `{wid}` pid {cu_pid} đang chạy — thoát. "
          f"Dừng nó trước (`taskkill /PID {cu_pid} /F`), hoặc chạy bản này với "
          f"`CHUNGCAT_WORKER_ID` KHÁC nếu muốn thêm một tiến trình song song.",
          file=sys.stderr)
    return False


def main() -> int:
    # `.env` nạp ở CỬA VÀO của tiến trình. Worker là tiến trình RIÊNG với
    # `api.py`, nên nó không thừa hưởng lần nạp của cửa — đo được 2026-09-04:
    # job hợp lệ chết với *"đòi khoá mà env không có"* trong khi `.env` CÓ khoá.
    # Lần thứ ba hôm nay của lớp lỗi "hai nửa một hệ": tên biến khoá, gốc hàng
    # đợi, và nay là chính phép nạp `.env`.
    import moi_truong
    moi_truong.nap()
    # BẬT nhật ký ở ĐIỂM VÀO của dịch vụ. Không bật lúc `import`:
    # cổng kiểm cũng `import` module này, và mỗi lời gọi
    # `dat_giai_doan()` của một hàng đợi fixture sẽ thành một dòng
    # trong nhật ký THẬT — rồi "workload" đo được là workload của
    # chính phép đo. Xem `nhat_ky.bat()`.
    nhat_ky.bat("worker")
    if not chiem_khoa():
        return 4
    ap = argparse.ArgumentParser()
    ap.add_argument("--mot", action="store_true", help="một job rồi thoát")
    ap.add_argument("--vong", action="store_true", help="chạy thường trực")
    a = ap.parse_args()
    if a.vong:
        # Thường trực = SONG SONG theo bảng khai (`T12-23`). `vong_lap` một
        # luồng giữ lại cho `--mot` và cho ca bảng khai thiếu (mặc định 1 luồng).
        chay_song_song(vong_lap_mai=True)
        return 0
    if a.mot:
        return 0 if mot_vong() is not None else 3   # 3 = hàng đợi rỗng
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
