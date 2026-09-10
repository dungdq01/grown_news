#!/usr/bin/env python3
"""WO-066 · việc HỎNG phải mang nhãn `hong`, không mang nhãn `cho`.

Chủ dự án hỏi ba lần trong một buổi 2026-09-09: *"sao vẫn trạng thái chờ"*,
*"tự back lại trạng thái chờ à"*. Đo: việc đã HỎNG từ lâu, nhưng
`except Exception` đặt `giai_doan = "cho"` — màn đọc `giai_doan` ⇒ "chờ" mãi,
sự thật nằm ở nhật ký `ket: hong-la` chỗ màn không đọc.

Ba vế, đo bằng CHẠY, không bằng grep:
  A · hỏng (cả ViecHong lẫn ngoại lệ lạ) ⇒ `giai_doan == "hong"`, có
      `giai_doan_hong` + `loi`; `chay_lai` xoá vết; lease KHÔNG tự nhặt lại.
  B · `PhienAmCut` từ cửa ASR ⇒ là `ViecHong` ở `dang-goi-model`, không "lạ".
  C · vòng ASR không tiến ⇒ gửi lại đoạn đó MỘT lần rồi mới phanh.
"""
from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "tests"))
from _nap import nap  # noqa: E402

vong = nap("vong")
worker = nap("worker")
asr_cua = nap("asr_cua")

loi = 0


def ok(dk, ten, ct=""):
    global loi
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"\n       {ct}"))
    if not dk:
        loi += 1


print("\nWO-066 · việc hỏng không mang nhãn `cho`\n")

ok("hong" in vong.GIAI_DOAN, "0 · `GIAI_DOAN` có `hong`",
   f"{vong.GIAI_DOAN} — không có nhãn cho 'đã hỏng' thì mọi việc hỏng phải nói dối")

# ── A · chạy một vòng worker với hàm việc GIẢ ném hai kiểu ──────────────
q = vong.HangDoi(tempfile.mkdtemp(prefix="gn-wo066-"))
_bang_goc = dict(worker.BANG_LOAI)


def _viec_hong(q_, ulid, viec):
    q_.dat_giai_doan(ulid, "dang-goi-model")
    raise worker.ViecHong("dang-goi-model", "phanh cố ý")


def _viec_la(q_, ulid, viec):
    q_.dat_giai_doan(ulid, "dang-doc-nguon")
    raise KeyError("thiếu khoá lạ")


try:
    worker.BANG_LOAI["thu-hong"] = _viec_hong
    worker.BANG_LOAI["thu-la"] = _viec_la
    u1, _ = q.nap("a" * 32, {"loai": "thu-hong", "slug": "x/y"})
    worker.mot_vong(q)
    v1 = q.doc(u1)
    ok(v1.get("giai_doan") == "hong",
       "A1 · ViecHong ⇒ `giai_doan == hong`", f"được {v1.get('giai_doan')!r}")
    ok(v1.get("giai_doan_hong") == "dang-goi-model",
       "A1b · giữ chỗ hỏng ở `giai_doan_hong`", f"được {v1.get('giai_doan_hong')!r}")
    ok("phanh" in str(v1.get("loi", "")), "A1c · giữ lý do ở `loi`")

    u2, _ = q.nap("b" * 32, {"loai": "thu-la", "slug": "x/z"})
    worker.mot_vong(q)
    v2 = q.doc(u2)
    ok(v2.get("giai_doan") == "hong",
       "A2 · ngoại lệ LẠ ⇒ cũng `hong`, KHÔNG về `cho`",
       f"được {v2.get('giai_doan')!r} — đây đúng là bug 'sao vẫn chờ'")
    ok(v2.get("giai_doan_hong") == "dang-doc-nguon",
       "A2b · chỗ hỏng = giai đoạn đang đứng lúc ném",
       f"được {v2.get('giai_doan_hong')!r}")
    ok("KeyError" in str(v2.get("loi", "")), "A2c · `loi` mang tên lớp lỗi")

    # Lease: việc `hong` KHÔNG được worker tự nhặt lại dù hết hạn.
    v2["nhan_luc"] = time.time() - 10 ** 6
    q._ghi_nguyen_tu(u2, v2)
    ok(q.nhan_viec() is None,
       "A3 · việc `hong` hết lease KHÔNG bị nhặt lại tự động",
       "để worker nhặt lại là biến phanh cố ý thành vòng thử lại vô hạn có hoá đơn")

    # chay_lai xoá vết hỏng.
    v3 = q.chay_lai(u1, tu_giai_doan="dang-verify")
    ok(v3.get("giai_doan") == "dang-verify" and "loi" not in v3
       and "giai_doan_hong" not in v3,
       "A4 · `chay_lai` xoá `loi` + `giai_doan_hong`",
       f"còn: {[k for k in ('loi', 'giai_doan_hong') if k in v3]}")
finally:
    worker.BANG_LOAI.clear()
    worker.BANG_LOAI.update(_bang_goc)

# ── B · PhienAmCut trong chay_sinh_transcript ⇒ ViecHong ─────────────────
src = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
i = src.index("def chay_sinh_transcript")
than = src[i:src.index("\ndef ", i + 10)]
ok("except asr_cua.PhienAmCut" in than and 'ViecHong("dang-goi-model"' in than,
   "B · `PhienAmCut` được đổi thành `ViecHong(\"dang-goi-model\")` ngay tại chỗ gọi",
   "để nó rơi vào `except Exception` là in một phanh CỐ Ý thành 'không phân loại'")

# ── C · vòng ASR: không tiến ⇒ gửi lại MỘT lần rồi mới phanh ─────────────
goi = {"n": 0}
# `phien_am` chặn model không khai `ho_tro_audio` TRƯỚC vòng lặp — đúng, và
# fixture phải đi qua phép chặn đó chứ không né nó.
DM = {"model": "thu/asr", "ho_tro_audio": True, "nha_cung_cap": "thu",
      "khu_vuc": "tai-cho"}


def _cat(duong, *, bat, dai, thu_muc):
    return Path(thu_muc) / f"doan-{int(bat)}.mp3"


def _doan_lan_dau_rong(manh, *, moc, **kw):
    goi["n"] += 1
    # Lần ĐẦU tại mốc 0: trả cue THIẾU mốc (bị lọc ⇒ 0 cue). Lần sau: đủ.
    if goi["n"] == 1:
        return []
    return [{"tu": moc, "den": moc + 100.0, "text": "ok"}]


_g = (asr_cua._cat_mot, asr_cua.thoi_luong, asr_cua._phien_am_mot_doan,
      asr_cua.tran_vong_asr, asr_cua.giay_moi_doan_mac_dinh)
try:
    asr_cua._cat_mot = _cat
    asr_cua.thoi_luong = lambda d: 100.0
    asr_cua._phien_am_mot_doan = _doan_lan_dau_rong
    asr_cua.tran_vong_asr = lambda: 5
    asr_cua.giay_moi_doan_mac_dinh = lambda: 100
    try:
        cue = asr_cua.phien_am("x.mp3", dong_model=DM, log=None, tran=10 ** 9)
        ok(len(cue) == 1 and goi["n"] == 2,
           "C1 · đoạn rỗng lần đầu ⇒ gửi lại MỘT lần và đi tiếp",
           f"gọi {goi['n']} lần, {len(cue)} cue")
    except asr_cua.PhienAmCut as e:
        ok(False, "C1 · đoạn rỗng lần đầu ⇒ gửi lại MỘT lần và đi tiếp",
           f"phanh ngay lần đầu: {e}")

    # Rỗng CẢ HAI lần ⇒ phanh, và chỉ đúng 2 lời gọi (không vô hạn).
    goi["n"] = 0
    asr_cua._phien_am_mot_doan = lambda *a, **k: (goi.__setitem__("n", goi["n"] + 1) or [])
    try:
        asr_cua.phien_am("x.mp3", dong_model=DM, log=None, tran=10 ** 9)
        ok(False, "C2 · rỗng CẢ HAI lần ⇒ phanh", "không phanh")
    except asr_cua.PhienAmCut:
        ok(goi["n"] == 2, "C2 · rỗng CẢ HAI lần ⇒ phanh sau ĐÚNG 2 lời gọi",
           f"gọi {goi['n']} lần")
finally:
    (asr_cua._cat_mot, asr_cua.thoi_luong, asr_cua._phien_am_mot_doan,
     asr_cua.tran_vong_asr, asr_cua.giay_moi_doan_mac_dinh) = _g

# ── D · WO-067 · CHẠY LẠI phải có ĐƯỜNG, và phải TIẾP từ chỗ đã có ─────────
#
# `hong` hiện đúng trên màn kèm câu "chạy lại tiếp từ chỗ hỏng" — mà không có
# đường nào làm điều đó: THỢ chỉ có POST /job, FE không có nút. Và kể cả có
# đường, `phien_am` chạy từ 0 ⇒ trả tiền lại 13 phút đã đúng.
q2 = vong.HangDoi(tempfile.mkdtemp(prefix="gn-wo067-"))
u9, _ = q2.nap("d" * 32, {"loai": "thu", "slug": "x/q"})
q2.dat_giai_doan(u9, "dang-goi-model")
v9 = q2.doc(u9); v9["nhan_luc"] = time.time(); v9["nhan_pid"] = 4242
q2._ghi_nguyen_tu(u9, v9)
q2.danh_hong(u9, "dang-goi-model", "502 thử")
v9 = q2.chay_lai(u9, tu_giai_doan="dang-goi-model")
ok("nhan_luc" not in v9 and "nhan_pid" not in v9,
   "D1 · `chay_lai` XOÁ lease — không thì PID worker cũ còn sống giữ việc suốt HAN_TREO",
   f"còn: {[k for k in ('nhan_luc', 'nhan_pid') if k in v9]}")
ok(v9.get("giai_doan") == "dang-goi-model", "D1b · về đúng chặng hỏng")

api_src = (R / "chungcat" / "src" / "api.py").read_text(encoding="utf-8")
ok('endswith("/lai")' in api_src and "chay_lai(" in api_src,
   "D2 · THỢ có `POST /viec/<ulid>/lai` gọi `chay_lai`")
ok('!= "hong"' in api_src and "409" in api_src,
   "D2b · chỉ chạy lại việc `hong`; khác ⇒ 409, không im lặng")
tho_cua = (R / "web" / "api" / "tho-cua.mjs").read_text(encoding="utf-8")
ok("cuaChayLaiViec" in tho_cua and '"/lai"' in tho_cua,
   "D3 · LÕI có cửa `cuaChayLaiViec` chuyển tiếp `/lai`")
router = (R / "web" / "api" / "router.mjs").read_text(encoding="utf-8")
ok("cuaChayLaiViec" in router, "D3b · router LÕI nối cửa đó (POST /api/viec/<id>/lai)")
tab = (R / "web" / "plugins" / "cctab" / "src" / "cctab.inline.ts").read_text(encoding="utf-8")
ok("data-cclai" in tab and "/lai" in tab, "D4 · FE có nút chạy lại và gọi đúng đường")

# bat_dau: ASR bắt đầu từ giây đã có, KHÔNG từ 0.
goi2 = {"moc": []}
_g2 = (asr_cua._cat_mot, asr_cua.thoi_luong, asr_cua._phien_am_mot_doan,
       asr_cua.tran_vong_asr, asr_cua.giay_moi_doan_mac_dinh)
try:
    asr_cua._cat_mot = lambda d, *, bat, dai, thu_muc: Path(thu_muc) / f"d-{int(bat)}.mp3"
    asr_cua.thoi_luong = lambda d: 300.0
    asr_cua.tran_vong_asr = lambda: 9
    asr_cua.giay_moi_doan_mac_dinh = lambda: 100
    def _doan(manh, *, moc, **kw):
        goi2["moc"].append(moc)
        return [{"tu": moc, "den": moc + 100.0, "text": "ok"}]
    asr_cua._phien_am_mot_doan = _doan
    cue = asr_cua.phien_am("x.mp3", dong_model=DM, log=None, tran=10 ** 9, bat_dau=200.0)
    ok(goi2["moc"] and min(goi2["moc"]) >= 200.0,
       "D5 · `bat_dau=200` ⇒ KHÔNG gọi lại đoạn nào trước 200s",
       f"các mốc đã gọi: {goi2['moc']}")
    ok(len(goi2["moc"]) == 1, "D5b · nguồn 300s, đã có 200s ⇒ đúng MỘT lời gọi còn lại",
       f"gọi {len(goi2['moc'])} lần")
finally:
    (asr_cua._cat_mot, asr_cua.thoi_luong, asr_cua._phien_am_mot_doan,
     asr_cua.tran_vong_asr, asr_cua.giay_moi_doan_mac_dinh) = _g2

# worker seed: đọc file tiến độ ⇒ bat_dau + ghép cue cũ vào trước.
wsrc = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
j0 = wsrc.index("def chay_sinh_transcript"); wthan = wsrc[j0:wsrc.index("\ndef ", j0 + 10)]
# WO-078 · phép ĐỌC tiến độ dời sang `tien_do_cu_cung_slug` (việc mới phải
# thấy được tiến độ của việc CŨ cùng slug, không chỉ của chính nó). Tính chất
# D6 canh — *resume từ checkpoint* — KHÔNG đổi, chỉ đổi CHỖ. Nên phép đo đi
# theo, không nới ra: vẫn đòi thấy đủ ba mảnh, chỉ là ở hai hàm.
j1 = wsrc.index("def tien_do_cu_cung_slug")
wthan_td = wsrc[j1:wsrc.index("\ndef ", j1 + 10)]
ok("tien_do_cu_cung_slug" in wthan and "bat_dau=bat_dau" in wthan
   and "duong_tien_do" in wthan_td and "doc_cue" in wthan_td,
   "D6 · đọc file tiến độ, ghép cue cũ, truyền `bat_dau` cho ASR",
   f"goi={'tien_do_cu_cung_slug' in wthan} bat_dau={'bat_dau=bat_dau' in wthan} "
   f"doc={'duong_tien_do' in wthan_td and 'doc_cue' in wthan_td}")


# ── E · WO-068 · việc HỎNG tự vào THÙNG RÁC, và khôi phục được ─────────────
#
# Chủ dự án: *"bản nào trạng thái hỏng tự động chuyển vào thùng rác"*. Thùng rác
# ở đây là DỜI THẬT sang ngăn `rac/`, không phải "ẩn" — lối ẩn đã bị bác
# 2026-09-07 (*"ẩn cũng giải quyết được vấn đề đó trong tương lai đâu"*).
# Ràng buộc đi kèm, và nó là chỗ dễ làm hỏng nhất: file TIẾN ĐỘ phải đi theo,
# nếu không thì "chạy lại từ chỗ hỏng" mất 13 phút đã trả tiền.
q3 = vong.HangDoi(tempfile.mkdtemp(prefix="gn-wo068-"))
u8, _ = q3.nap("e" * 32, {"loai": "thu", "slug": "x/r"})
q3.dat_giai_doan(u8, "dang-goi-model")
q3.ghi_tien_do(u8, [{"tu": 0.0, "den": 12.0, "text": "đã có"}])
q3.luu_phan_hoi(u8, {"cue": [{"tu": 0.0, "den": 12.0, "text": "đã có"}]})
q3.danh_hong(u8, "dang-goi-model", "502 thử")

ok((q3.goc / "rac" / f"{u8}.json").exists(),
   "E1 · việc `hong` NẰM Ở ngăn `rac/`",
   f"còn ở: {[t for t in ('new', 'cur', 'done', 'rac') if (q3.goc / t / (u8 + '.json')).exists()]}")
ok(q3.doc(u8).get("giai_doan") == "hong", "E1b · `doc()` vẫn đọc được từ `rac/`")
ok(q3.duong_tien_do(u8).exists(),
   "E2 · FILE TIẾN ĐỘ đi THEO vào rác — không mất phần đã phiên âm",
   "bỏ nó lại ngăn cũ là để một con trỏ mồ côi ở chỗ không ai tra")
ok(q3.doc_phan_hoi(u8) is not None, "E2b · phản hồi model cũng đi theo")

# Danh sách CHÍNH không kể rác; `rac=True` kể ĐÚNG nó.
ok(all(v["ulid"] != u8 for v in q3.liet_ke()["dong"]),
   "E3 · `liet_ke()` mặc định KHÔNG kể việc trong rác")
ok(any(v["ulid"] == u8 for v in q3.liet_ke(rac=True)["dong"]),
   "E3b · `liet_ke(rac=True)` kể đúng việc đó")

# Worker KHÔNG tự nhặt việc trong rác.
v8 = q3.doc(u8); v8["nhan_luc"] = time.time() - 10 ** 6
q3._ghi_nguyen_tu(u8, v8)
ok(q3.nhan_viec() is None, "E4 · worker KHÔNG nhặt việc nằm trong `rac/`")

# `chay_lai` kéo nó RA — không thì nút bấm xong mà không ai chạy.
q3.chay_lai(u8, tu_giai_doan="dang-goi-model")
ok((q3.goc / "cur" / f"{u8}.json").exists() and not (q3.goc / "rac" / f"{u8}.json").exists(),
   "E5 · `chay_lai` đưa việc RA khỏi rác về `cur/`",
   "`nhan_viec` chỉ quét `new/`+`cur/`; để nó ở rác là một nút không làm gì")
ok(q3.duong_tien_do(u8).exists(), "E5b · và tiến độ theo về cùng")
ok(q3.nhan_viec() == u8, "E5c · sau khi khôi phục thì worker NHẶT ĐƯỢC")

api_e = (R / "chungcat" / "src" / "api.py").read_text(encoding="utf-8")
ok("rac=" in api_e and '"rac"' in api_e, "E6 · THỢ nhận `?rac=1` cho màn thùng rác")
ok('"rac"' in (R / "web" / "api" / "tho-cua.mjs").read_text(encoding="utf-8"),
   "E6b · LÕI chuyển tiếp tham số `rac`")


# ── F · WO-069 · KHÔNG có vòng lặp vô hạn khi worker CHẾT giữa chừng ───────
#
# `lan_gui` (trần 2) chỉ chặn việc đã tới bước GỬI. Một việc giết chết TIẾN
# TRÌNH worker trước đó không ném ngoại lệ nào ⇒ `danh_hong` không chạy ⇒ việc
# nằm lại `cur/` với lease của PID đã chết ⇒ nhặt lại ⇒ chết lại.
# Đo 2026-09-09 TRƯỚC khi vá: nhặt lại 12 lần liên tiếp, `lan_gui` = 0.
q4 = vong.HangDoi(tempfile.mkdtemp(prefix="gn-wo069-"))
u7, _ = q4.nap("f" * 32, {"loai": "sinh-transcript", "slug": "x/loop"})
ok(q4.nhan_viec() == u7, "F0 · nhận việc lần đầu (không tính vào trần nhặt lại)")

lan = 0
for _ in range(vong.TRAN_LAN_NHAN + 6):
    v7 = q4.doc(u7)
    if v7.get("giai_doan") == "hong":
        break
    # Mô phỏng TIẾN TRÌNH CHẾT: lease còn tươi nhưng PID không tồn tại.
    v7["nhan_pid"] = 999999
    v7["nhan_luc"] = time.time()
    q4._ghi_nguyen_tu(u7, v7)
    if q4.nhan_viec() != u7:
        break
    lan += 1

ok(lan <= vong.TRAN_LAN_NHAN,
   f"F1 · nhặt lại BỊ CHẶN sau ≤ {vong.TRAN_LAN_NHAN} lần (được {lan})",
   "không cận thì mỗi vòng đọc lại 80 MB, và lối `tai_ve` tải THẬT từ Internet")
ok(q4.doc(u7).get("giai_doan") == "hong",
   "F2 · chạm trần ⇒ việc thành `hong`, không quay vòng nữa",
   f"được {q4.doc(u7).get('giai_doan')!r}")
ok((q4.goc / "rac" / f"{u7}.json").exists(), "F2b · và nằm trong thùng rác")
ok("nhặt lại" in str(q4.doc(u7).get("loi", "")),
   "F3 · câu lỗi nói ĐÚNG nguyên nhân (worker chết), không đổ cho model",
   f"được: {str(q4.doc(u7).get('loi', ''))[:90]}")
ok(q4.nhan_viec() is None, "F4 · sau đó KHÔNG ai nhặt nó nữa")

# Đường `new/` KHÔNG bị tính vào trần — một việc mới phải được chạy.
q5 = vong.HangDoi(tempfile.mkdtemp(prefix="gn-wo069b-"))
u6, _ = q5.nap("a1" * 16, {"loai": "thu", "slug": "x/moi"})
ok(q5.nhan_viec() == u6 and int(q5.doc(u6).get("so_lan_nhan") or 0) == 0,
   "F5 · lần chiếm ĐẦU từ `new/` không tính vào trần nhặt lại",
   "tính nó là cắt mất một lượt chạy hợp lệ của mọi việc mới")


print(f"\n{loi} lỗi\n" if loi else "\nĐủ vế — việc hỏng mang nhãn hong\n")
sys.exit(1 if loi else 0)
