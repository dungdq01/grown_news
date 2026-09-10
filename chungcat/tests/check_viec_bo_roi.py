#!/usr/bin/env python3
"""VIỆC BỎ RƠI trong `cur/` — nhận lại được, và màn quản lý KHÔNG gọi nó là
"đang chạy".

Chỉ đạo chủ dự án 2026-09-05: *"còn nợ gì thì fix luôn"*, sau khi `WO-048 §2`
đo được:

    %TEMP%/hd-e2e     new 1 · cur 13 · done 4
    KPI màn chưng cất: "ĐANG CHẠY 6"      ← không tiến trình nào giữ việc nào

`cur/` nghĩa là *"đã lấy ra xử lý"*. Worker chết giữa việc thì việc ở lại đó
**vĩnh viễn**: không ai nhận lại, không ai báo. Và `liet_ke()` đọc `new`+`cur`
nên KPI cộng chúng vào "đang chạy" — một con số NÓI SAI, không phải một con số
chưa đẹp. Người đọc màn kết luận *"hệ đang làm việc"* trong khi hệ đang đứng.

HAI mệnh đề, và mệnh đề thứ hai mới là chỗ dễ trượt:

  ① việc bỏ rơi PHẢI nhận lại được — không thì hàng đợi tự rò rỉ
  ② việc ĐANG CHẠY THẬT phải KHÔNG bị cướp — một lease quá ngắn biến hai worker
     thành hai lần gửi cho một việc, tức tiền tiêu đôi và `M12-R6` bị lách

`nhan_luc` làm nhịp tim: `dat_giai_doan` chạm nó mỗi lần đổi giai đoạn, nên một
việc còn tiến triển thì lease luôn tươi.

ĐỎ_KHI  không nhận lại được việc quá hạn · CƯỚP việc còn tươi · `/viec` không
        nói được việc nào đang thật sự được giữ · `nhan_luc` không cập nhật
XANH_KHI bốn vế trên đo được trên hàng đợi THẬT ở thư mục tạm
"""
from __future__ import annotations

import json
import sys
import tempfile
import time
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import vong  # noqa: E402

loi: list[str] = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


def dat(q: vong.HangDoi, ulid: str) -> Path:
    d = q.goc / "new" / f"{ulid}.json"
    d.write_text(json.dumps({
        "ulid": ulid, "giai_doan": "cho", "lan_gui": 0,
        "payload": {"loai": "chung-cat-mot-nguon", "slug": "x"},
    }), encoding="utf-8")
    return d


with tempfile.TemporaryDirectory() as tmp:
    q = vong.HangDoi(Path(tmp))

    print("\n1 · `nhan_luc` đóng dấu lúc CHIẾM\n")

    dat(q, "01AAA0000000000000000000A1")
    u = q.nhan_viec()
    ok(u == "01AAA0000000000000000000A1", f"chiếm được việc ({u})")
    v = q.doc(u)
    ok(isinstance(v.get("nhan_luc"), (int, float)),
       "việc đã chiếm mang `nhan_luc` là SỐ",
       "không có dấu thời gian thì không cách nào phân biệt *đang chạy* với "
       "*bỏ rơi từ hôm qua* — và đó là cả gốc của con số nói sai")

    print("\n2 · Việc còn TƯƠI thì KHÔNG bị cướp\n")

    # Hàng đợi rỗng ở `new/`, và việc duy nhất trong `cur/` vừa được chiếm.
    ok(q.nhan_viec() is None,
       "`nhan_viec()` KHÔNG trả việc đang chạy",
       "cướp một việc còn tươi là hai worker gửi cho MỘT việc — tiền tiêu đôi, "
       "và `M12-R6` (trần 2 lần gửi) bị lách vì mỗi worker đếm riêng")

    print("\n3 · Việc QUÁ HẠN thì nhận lại được\n")

    # Lùi `nhan_luc` về quá khứ — mô phỏng một worker đã chết.
    d = q._duong(u)
    x = json.loads(d.read_text(encoding="utf-8"))
    x["nhan_luc"] = time.time() - vong.HAN_TREO_GIAY - 60
    d.write_text(json.dumps(x), encoding="utf-8")

    lai = q.nhan_viec()
    ok(lai == u, f"nhận lại được việc bỏ rơi ({lai})",
       "không nhận lại thì mỗi lần worker chết là một việc mất vĩnh viễn, và "
       "hàng đợi tự rò rỉ — 13 việc đo được ở `WO-048 §2` chính là nó")
    ok(q.doc(u)["nhan_luc"] > time.time() - 60,
       "  và `nhan_luc` được đóng dấu LẠI",
       "không đóng dấu lại thì việc vừa nhận vẫn 'quá hạn', và worker thứ hai "
       "cướp nó ngay — hai worker chạy một việc")

    print("\n4 · Nhịp tim: `dat_giai_doan` làm lease TƯƠI lại\n")

    truoc = q.doc(u)["nhan_luc"]
    time.sleep(0.05)
    q.dat_giai_doan(u, "dang-goi-model")
    ok(q.doc(u)["nhan_luc"] > truoc,
       "`dat_giai_doan` cập nhật `nhan_luc`",
       "không có nhịp tim thì một việc chạy lâu hơn lease bị cướp giữa đường — "
       "và một lời gọi model 20 phút là chuyện thường với audio")

    print("\n5 · `liet_ke` nói được việc nào ĐANG THẬT SỰ được giữ\n")

    ds = q.liet_ke()["dong"]
    m = next((x for x in ds if x["ulid"] == u), None)
    ok(m is not None, "việc có trong danh sách")
    ok(isinstance(m.get("dang_giu"), bool),
       "mỗi dòng mang `dang_giu` (bool)",
       "không có cột này thì màn quản lý chỉ biết `giai_doan`, và một việc bỏ "
       "rơi mang `dang-goi-model` trông y hệt một việc đang gọi model")
    ok(m["dang_giu"] is True, "  việc vừa chạm nhịp tim ⇒ `dang_giu: true`")

    # Lùi lại lần nữa ⇒ phải thành `false`.
    x = json.loads(q._duong(u).read_text(encoding="utf-8"))
    x["nhan_luc"] = time.time() - vong.HAN_TREO_GIAY - 60
    q._duong(u).write_text(json.dumps(x), encoding="utf-8")
    m2 = next(x for x in q.liet_ke()["dong"] if x["ulid"] == u)
    ok(m2["dang_giu"] is False,
       "  việc quá hạn ⇒ `dang_giu: false`",
       "vế này là cả lý do cột đó tồn tại: KPI phải đếm được *đang chạy thật*")

    print("\n6 · Việc ở `new/` chưa ai giữ ⇒ `dang_giu: false`\n")

    dat(q, "01AAA0000000000000000000B2")
    m3 = next(x for x in q.liet_ke()["dong"]
              if x["ulid"] == "01AAA0000000000000000000B2")
    ok(m3["dang_giu"] is False,
       "việc chờ trong `new/` KHÔNG phải đang chạy",
       "gộp `new` vào 'đang chạy' là con số nói sai theo chiều lạc quan — "
       "đúng chiều mà `WO-048 §2` đã bắt")

    print(chr(10) + "7 · Việc XONG vẫn phải thấy được — done/ nằm trong danh sách" + chr(10))

    # Chỉ đạo + ảnh chụp 2026-09-05: chưng cất một `.md` chạy XONG, rồi biến
    # mất khỏi `/chung-cat/` và tab của bản ghi nói *"Chưa có việc chưng cất nào
    # cho bản ghi này"*. Ô KPI `XONG` đứng ở **0** trong khi `done/` có 20 việc.
    #
    # Nguyên nhân: `liet_ke()` đọc `new`+`cur`, không đọc `done`. Một việc xong
    # là một việc BIẾN MẤT — và đó là trạng thái người dùng quan tâm NHẤT, vì
    # nó là chỗ có kết quả để đọc.
    xong_ulid = "01AAA0000000000000000000C3"
    dat(q, xong_ulid)
    u2 = q.nhan_viec()
    q.dat_giai_doan(u2, "xong")
    q.dong_viec(u2)
    ok(not (q.goc / "cur" / f"{u2}.json").exists(),
       f"việc đã chuyển sang `done/` ({u2[:10]})")

    ds2 = q.liet_ke()["dong"]
    m4 = next((x for x in ds2 if x["ulid"] == u2), None)
    ok(m4 is not None, "việc XONG có trong `liet_ke()`",
       "không có ⇒ nó biến mất khỏi màn quản lý ngay lúc có kết quả để đọc, "
       "và ô KPI `XONG` không bao giờ khác 0")
    ok(m4 is not None and m4.get("giai_doan") == "xong",
       "  và giữ `giai_doan: xong`")
    ok(m4 is not None and m4.get("dang_giu") is False,
       "  `dang_giu: false` — xong rồi thì không ai giữ nữa",
       "một việc ở `done/` mà `dang_giu: true` sẽ bị KPI đếm là đang chạy")

    print(chr(10) + "8 · THẢ TAY thì XOÁ lease — `cho`/`dung` không phải đang chạy" + chr(10))

    # Ảnh chụp chủ dự án 2026-09-05: KPI nói *"đang chạy 3 · chờ 0"* ngay bên
    # trên BA cái thẻ mang chip `cho`. Hai con số của một việc nói hai điều.
    #
    # Nguyên nhân là bản đầu của chính nhịp tim: nó làm tươi `nhan_luc` ở MỌI
    # lần đổi giai đoạn, kể cả lần worker THẢ việc (hỏng ⇒ reset về `cho`). Việc
    # bị bỏ mang lease tươi vĩnh viễn ⇒ `dang_giu: true` ⇒ KPI đếm là đang chạy.
    tha = "01AAA0000000000000000000D4"
    dat(q, tha)
    u3 = q.nhan_viec()
    q.dat_giai_doan(u3, "dang-goi-model")
    ok(q.doc(u3).get("nhan_luc") is not None, "đang `dang-*` ⇒ CÓ lease")

    truoc3 = q.doc(u3)["nhan_luc"]
    time.sleep(0.05)
    q.dat_giai_doan(u3, "cho")          # worker hỏng, thả việc
    ok(q.doc(u3).get("nhan_luc") == truoc3,
       "thả về `cho` ⇒ lease KHÔNG làm tươi (và cũng không xoá)",
       "làm tươi thì việc không bao giờ được nhặt lại; XOÁ thì nó thành 'bỏ "
       "rơi' NGAY và vòng sau nhặt lại — đo được: 24 lượt chiếm cho 5 job")
    m5 = next(x for x in q.liet_ke()["dong"] if x["ulid"] == u3)
    ok(m5["dang_giu"] is False,
       "  ⇒ `dang_giu: false`, KPI không đếm nó là đang chạy",
       "đây chính là con số chủ dự án thấy sai trên ảnh chụp")
    # `nhan_viec()` ưu tiên `new/` trước, và hàng đợi thử nghiệm còn việc chờ ở
    # đó — nên phép kiểm là *"nhận lại được"*, không phải *"nhận ngay lượt sau"*.
    # Khai đúng thứ mình đo: một vế đòi thứ tự mà `nhan_viec` không hứa là một
    # vế sẽ đỏ vì lý do không liên quan.
    nhan = set()
    for _ in range(6):
        x = q.nhan_viec()
        if x is None:
            break
        nhan.add(x)
        if x != u3:                      # giữ chỗ để vòng sau nhặt việc khác
            q.dat_giai_doan(x, "dang-doc-nguon")
    ok(u3 not in nhan,
       "  và KHÔNG bị nhặt lại ngay — nó chờ hết hạn treo",
       "nhặt lại ngay là vòng lặp nóng: thả ⇒ nhặt ⇒ thả, đốt CPU mà không "
       "tiến triển. Đó là giá của việc chặn vòng lặp, và nó rẻ hơn.")

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — việc bỏ rơi CHƯA nhận lại được")
print("pass · lease + nhịp tim: nhận lại việc bỏ rơi, không cướp việc đang chạy")
