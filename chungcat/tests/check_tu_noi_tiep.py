#!/usr/bin/env python
"""WO-080 · T12-36 — Tự tạo việc NỐI TIẾP khi có tiến, và chỉ khi có tiến.

Chủ dự án 2026-09-09: *"làm, và phải hiển thị rõ trên UI — để còn biết hỏng tại
đâu, chạy lại từ đâu ra sao"*.

Giờ mới làm được: `WO-078` cho việc mới thấy tiến độ việc cũ, `WO-079` cho chunk
thử lại ngầm. Trước hai cái đó, "tự tạo việc tiếp" chỉ là tự động hoá một sự
lãng phí (việc mới chạy lại từ giây 0).

── Vế ÂM là cả thiết kế ────────────────────────────────────────────────────
Điều kiện **CÓ TIẾN** không phải một phép tối ưu — nó là cái chặn duy nhất giữa
"tự nối tiếp" và "vòng lặp có hoá đơn". Một job chết ở giây 0 mà vẫn đẻ job con
thì mỗi lần cửa ốm là một chuỗi việc vô tận, và mỗi việc đều gửi byte thật.
Đây đúng là bất biến `WO-069` đã dựng để đóng vòng lặp vô hạn — nay dùng lại
làm điều kiện cho một vòng lặp CÓ ÍCH.

Nên vế 2 (không tiến ⇒ KHÔNG đẻ) nặng ngang vế 1.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

loi = 0
NL = chr(10)


def ok(d, chu, them=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {chu}" + ("" if d else f"  <- {them}"))
    if not d:
        loi += 1


import vong  # noqa: E402
import worker  # noqa: E402

print("\nWO-080 · tự nối tiếp khi CÓ TIẾN — và chỉ khi có tiến\n")

ng = json.loads((R / "chungcat" / "assets" / "nguong.json")
                .read_text(encoding="utf-8"))
TRAN = ng.get("tran_noi_tiep_tu_dong")
ok(isinstance(TRAN, int) and TRAN >= 1,
   f"0 · bảng khai có `tran_noi_tiep_tu_dong` (được {TRAN!r})",
   "trần chuỗi gõ trong mã là một con số không ai sửa được mà không sửa mã")

ham = getattr(worker, "xep_viec_noi_tiep", None)
ok(callable(ham), "0a · có hàm `xep_viec_noi_tiep`")
if not callable(ham):
    # KHÔNG bỏ qua các vế dưới. `if callable(ham):` quanh mỗi khối làm cổng
    # chỉ báo 2 lỗi khi hàm chưa tồn tại — 9 vế còn lại IM LẶNG, và một cổng
    # im lặng đọc như một cổng xanh. Thay bằng một hàm rỗng: vế DƯƠNG ("phải
    # đẻ") đỏ đúng, vế ÂM ("không được đẻ") vẫn xanh — và chúng xanh thật, vì
    # một hàm rỗng đúng là không đẻ gì.
    def ham(*a, **k):  # noqa: ARG001
        return None

SLUG = "video/thu-noi-tiep"


def _moi():
    tam = Path(tempfile.mkdtemp(prefix="gn-nt-"))
    return vong.HangDoi(str(tam))


def _viec(q, u, *, cue_den=None, lan=0, loai="sinh-transcript", slug=SLUG):
    pl = {"loai": loai, "slug": slug}
    if lan:
        pl["lan_noi_tiep"] = lan
    q.nap(u, pl)
    q.dat_giai_doan(u, "dang-goi-model")
    if cue_den is not None:
        q.ghi_tien_do(u, [{"tu": 0.0, "den": float(cue_den), "text": "x"}])
    return q.doc(u)


# Cửa THỢ giả: ghi lại mọi việc được xếp, không mở socket nào.
class _Cua:
    def __init__(self):
        self.xep = []

    def __call__(self, duong, than=None, **kw):
        self.xep.append({"duong": duong, "than": than})
        return {"ok": True, "ulid": "moi" + str(len(self.xep))}


# ── 1 · CÓ TIẾN ⇒ đẻ việc nối tiếp ───────────────────────────────────────
print("1 · Hỏng ở chặng nối tiếp được, ĐÃ tiến ⇒ tạo việc kế\n")

if True:
    q = _moi()
    U = "aa" * 16
    v = _viec(q, U, cue_den=642.0)
    cua = _Cua()
    ham(q, U, v, "dang-goi-model", bat_dau_luot=0.0, _xep=cua)
    ok(len(cua.xep) == 1, f"1 · đã xếp MỘT việc kế (được {len(cua.xep)})")
    than = (cua.xep[0]["than"] if cua.xep else {}) or {}
    ok(than.get("slug") == SLUG, "1a · cùng `slug`", str(than)[:120])
    ok(than.get("loai") == "sinh-transcript", "1b · cùng loại việc")
    ok(int(than.get("lan_noi_tiep") or 0) == 1,
       f"1c · đánh số chuỗi `lan_noi_tiep` = 1 (được {than.get('lan_noi_tiep')!r})",
       "không đánh số thì trần chuỗi không đếm được, và UI không nói được n/N")
    ok(str(than.get("noi_tiep_tu") or "") == U,
       "1d · trỏ NGƯỢC về việc cha — UI cần nó để nói 'chạy lại từ việc nào'")
    ok(abs(float(than.get("tiep_tu_giay") or 0) - 642.0) < 0.01,
       f"1e · mang theo giây đã tới (được {than.get('tiep_tu_giay')!r})",
       "UI phải trả lời 'hỏng tại đâu' bằng một con số, không bằng chữ 'giữa chừng'")

# ── 2 · KHÔNG tiến ⇒ KHÔNG đẻ (cái chặn) ─────────────────────────────────
print("\n2 · KHÔNG tiến ⇒ KHÔNG đẻ — chặn vòng lặp có hoá đơn\n")

if True:
    q = _moi()
    U = "bb" * 16
    v = _viec(q, U, cue_den=100.0)
    cua = _Cua()
    # Lượt này bắt đầu ở 100s và cũng dừng ở 100s ⇒ 0 giây mua được.
    ham(q, U, v, "dang-goi-model", bat_dau_luot=100.0, _xep=cua)
    ok(len(cua.xep) == 0, f"2 · 0 việc kế (được {len(cua.xep)})",
       "đẻ ở đây là mỗi lần cửa ốm thành một chuỗi việc vô tận, mỗi việc gửi "
       "byte thật — đúng vòng lặp WO-069 đã đóng")

    q = _moi()
    U2 = "cc" * 16
    v2 = _viec(q, U2)                       # chưa phiên âm được giây nào
    cua2 = _Cua()
    ham(q, U2, v2, "dang-goi-model", bat_dau_luot=0.0, _xep=cua2)
    ok(len(cua2.xep) == 0, "2a · chết ở giây 0 ⇒ cũng KHÔNG đẻ")

# ── 3 · Trần chuỗi có răng ───────────────────────────────────────────────
print("\n3 · Hết trần chuỗi ⇒ dừng, để NGƯỜI quyết\n")

if isinstance(TRAN, int):
    q = _moi()
    U = "dd" * 16
    v = _viec(q, U, cue_den=642.0, lan=TRAN)
    cua = _Cua()
    ham(q, U, v, "dang-goi-model", bat_dau_luot=0.0, _xep=cua)
    ok(len(cua.xep) == 0,
       f"3 · `lan_noi_tiep` = trần ({TRAN}) ⇒ KHÔNG đẻ nữa (được {len(cua.xep)})")

    q = _moi()
    U2 = "ee" * 16
    v2 = _viec(q, U2, cue_den=642.0, lan=TRAN - 1)
    cua2 = _Cua()
    ham(q, U2, v2, "dang-goi-model", bat_dau_luot=0.0, _xep=cua2)
    ok(len(cua2.xep) == 1, f"3a · còn một nấc thì VẪN đẻ (được {len(cua2.xep)})")
    ok(bool(cua2.xep) and int(((cua2.xep[0]['than'] or {}).get('lan_noi_tiep')) or 0) == TRAN,
       "3b · và số chuỗi tăng đúng một nấc")

# ── 4 · Chặng / loại việc KHÔNG nối tiếp được ⇒ không đẻ ─────────────────
print("\n4 · Chỉ nối tiếp thứ nối tiếp ĐƯỢC\n")

if True:
    q = _moi()
    U = "ff" * 16
    v = _viec(q, U, cue_den=642.0)
    cua = _Cua()
    ham(q, U, v, "dang-verify", bat_dau_luot=0.0, _xep=cua)
    ok(len(cua.xep) == 0, "4 · hỏng ở `dang-verify` ⇒ không đẻ",
       "verify hỏng là lỗi của KẾT QUẢ, gửi lại nguồn không chữa được")

    q = _moi()
    U2 = "1a" * 16
    v2 = _viec(q, U2, cue_den=642.0, loai="chung-cat-mot-nguon")
    cua2 = _Cua()
    ham(q, U2, v2, "dang-goi-model", bat_dau_luot=0.0, _xep=cua2)
    ok(len(cua2.xep) == 0, "4a · loại việc khác ⇒ không đẻ",
       "chỉ `sinh-transcript` mới có checkpoint theo giây để nối")

# ── 5 · Worker THẬT gọi phép ấy, và `M12-R6` không đổi ───────────────────
print("\n5 · Nối vào worker, và `lan_gui` giữ nguyên\n")

wsrc = (R / "chungcat" / "src" / "worker.py").read_text(encoding="utf-8")
# Đo ĐÚNG hai mắt xích, không đo "tên xuất hiện sau chỗ định nghĩa" — phép ấy
# là một proxy, và nó đỏ oan ngay khi hàm bọc được đặt TRƯỚC hàm được bọc.
# Mắt xích 1: cả hai nhánh `except` của `chay_mot_viec` gọi `_tu_noi_tiep`.
i_cmv = wsrc.find("def mot_vong")
than_cmv = wsrc[i_cmv:wsrc.index(NL + "def ", i_cmv + 10)] if i_cmv >= 0 else ""
ok(than_cmv.count("_tu_noi_tiep(") >= 2,
   f"5 · CẢ HAI nhánh `except` gọi `_tu_noi_tiep` (đếm {than_cmv.count('_tu_noi_tiep(')})",
   "chỉ nối một nhánh thì lỗi không-phân-loại vẫn mất chuỗi nối tiếp")
# Mắt xích 2: hàm bọc thật sự gọi hàm thật.
i_bọc = wsrc.find("def _tu_noi_tiep")
than_boc = wsrc[i_bọc:wsrc.index(NL + "def ", i_bọc + 10)] if i_bọc >= 0 else ""
ok("xep_viec_noi_tiep(" in than_boc,
   "5a · và `_tu_noi_tiep` gọi `xep_viec_noi_tiep`",
   "viết hàm mà không ai gọi thì cổng trên xanh mà màn không đổi gì")

vsrc = (R / "chungcat" / "src" / "vong.py").read_text(encoding="utf-8")
ok("TRAN_GUI = 2" in vsrc, "5b · `TRAN_GUI` vẫn 2 — `M12-R6` không đổi")

if True:
    q = _moi()
    U = "2b" * 16
    v = _viec(q, U, cue_den=642.0)
    cua = _Cua()
    ham(q, U, v, "dang-goi-model", bat_dau_luot=0.0, _xep=cua)
    ok("lan_gui" not in ((cua.xep[0]["than"] or {}) if cua.xep else {}),
       "5c · việc kế KHÔNG mang `lan_gui` — nó bắt đầu từ 0 như mọi việc mới")

# ── 6 · UI trả lời ĐÚNG ba câu chủ dự án hỏi ─────────────────────────────
print(f"{NL}6 · Màn nói: hỏng tại đâu · chạy lại từ đâu · ra sao{NL}")

fe = (R / "web" / "plugins" / "chungcat" / "src" / "chungcat.inline.ts").read_text(
    encoding="utf-8")

# "ra sao" — dải chuỗi, và nó phải nằm trên CẢ HAI thẻ (đang chạy và trong rác).
ok("function ccDaiChuoi" in fe, "6 · có dải chuỗi `ccDaiChuoi`")
ok(fe.count("ccDaiChuoi(v)") >= 2,
   f"6a · dải chuỗi hiện trên CẢ HAI thẻ (đếm {fe.count('ccDaiChuoi(v)')})",
   "chỉ một thẻ thì người mất dấu chuỗi ở đúng nửa còn lại")

# "hỏng tại đâu" — phải là CON SỐ, không phải chữ "giữa chừng".
i_rac = fe.find("function ccTheRac")
than_rac = fe[i_rac:fe.index(NL + "function ", i_rac + 10)] if i_rac >= 0 else ""
ok("tien_toi_giay" in than_rac and "ccGiay" in than_rac,
   "6b · thẻ rác hiện `đã phiên âm tới mm:ss`",
   "'giữa chừng' không nói được đã mua bao nhiêu giây — mà đó chính là thứ "
   "quyết định có đáng chạy tiếp không")

# "chạy lại từ đâu" — con trỏ XUÔI, và câu cũ phải nhường chỗ.
ok("da_noi_tiep" in than_rac,
   "6c · thẻ rác nói ĐÃ tự tạo việc nối tiếp nào")
ok("hết 2 lần gửi" in than_rac and "da_noi_tiep" in than_rac.split("hết 2 lần gửi")[0],
   "6d · câu 'hết 2 lần gửi — tạo việc mới' chỉ hiện khi CHƯA tự nối tiếp",
   "để nguyên câu ấy khi máy đã làm hộ là đẩy người tạo một việc trùng lặp")

# Con trỏ xuôi phải được THỢ ghi thật, không chỉ FE mong có.
ok("da_noi_tiep" in wsrc and "tien_toi_giay" in wsrc,
   "6e · THỢ ghi `da_noi_tiep` + `tien_toi_giay` vào việc cha",
   "FE đọc một trường không ai ghi thì màn im lặng đúng như trước khi sửa")


# ── 7 · Panel transcript: THỨ TỰ dựng, và vì sao nó là một vế ────────────
print(f"{NL}7 · Panel transcript xong: transcript trước, nút sau, mỗi cái một try{NL}")

fe2 = (R / "web" / "plugins" / "cctab" / "src" / "cctab.inline.ts").read_text(
    encoding="utf-8")
i_kq = fe2.find("async function veKetQua")
than_kq = fe2[i_kq:fe2.index(NL + "async function ", i_kq + 10)] if i_kq >= 0 else ""

i_try = than_kq.find("try {")
i_nut = than_kq.find("veNutChungCatTuTranscript(doc, sl)")
i_doc = than_kq.find("docTranscriptTheoSlug(sl)")
ok(i_try >= 0 and i_doc > i_try,
   "7 · phần đọc transcript nằm TRONG `try`", f"try@{i_try} doc@{i_doc}")
ok(i_nut > i_doc,
   "7a · nút dựng SAU transcript, không phải trước",
   "đặt nút trước là để một lỗi ở phần THÊM giết phần người đang chờ — chủ dự "
   "án đã chụp đúng hậu quả: panel đứng ở 'Đang đọc transcript…' vĩnh viễn")

# Vì sao im lặng: lời gọi `veKetQua` nằm trong một `try` viết cho ca MẤT LIÊN
# LẠC. Mọi lỗi trong panel rơi vào đó và bị nuốt — không một dòng console.
# Nên panel KHÔNG được phép dựa vào việc lỗi sẽ nổi lên đâu đó.
i_goi = fe2.find("await veKetQua(doc, v, ulid)")
truoc = fe2[:i_goi]
ok(truoc.rfind("try {") > truoc.rfind(NL + "async function "),
   "7b · lời gọi `veKetQua` NẰM TRONG một `try` của người khác — panel phải tự "
   "bắt lỗi của mình",
   "nếu vế này đỏ thì giả định ở 7a đã hết đúng, đọc lại trước khi sửa")


if loi:
    print(f"{NL}{loi} lỗi{NL}")
    sys.exit(1)
print(f"{NL}Đủ vế — nối tiếp khi có tiến, dừng khi không, trần chuỗi có răng{NL}")
