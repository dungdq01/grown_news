#!/usr/bin/env python3
"""FR-039 — nhận MỌI định dạng tài liệu, nhưng KHÔNG bỏ mọi phép kiểm.

Người dùng chốt bỏ **cửa nhận** (whitelist định dạng). FR-039 §0 ghi rõ điều đó
gỡ lớp magic-byte, và §1 quyết rằng bảng `media-mime.json` **đổi vai** chứ không
bị xoá: nó thôi làm cổng NHẬN và thành bảng RENDER.

CHIỀU DƯƠNG ở đây là vế dễ — "schema nhận một mime lạ" xanh ngay cả khi ai đó
đổi `media.mime` thành `type: string` trần. Vế nặng là CHIỀU ÂM:

  `mime` đi THẲNG vào đầu đề `content-type` của endpoint phục vụ hiện vật. Một
  chuỗi mang `\\r\\n` ở đó là tách đầu đề — không phải lỗi hình thức, là một lỗ.
  Bỏ enum nghĩa là đổi phép kiểm từ *"nằm trong danh sách"* sang *"đúng hình
  dạng"*, KHÔNG phải bỏ phép kiểm.

Cộng: bảng phải GIỮ đủ 5 định dạng đã biết kèm `magic` + `xem_truoc` — bỏ sót một
cái là PDF mất xem trước, tức xoá một tính năng người dùng không xin xoá.
"""
import json
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((R / "core" / "assets" / "frontmatter.schema.json")
                    .read_text(encoding="utf-8"))
BANG = json.loads((R / "core" / "assets" / "media-mime.json").read_text(encoding="utf-8"))

loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


print("\n1 · `media.mime` — mở hình dạng, KHÔNG mở tự do\n")

# FR-052 · `media` la MANG => `mime` xuong mot tang: media.items.properties.
# Doc CA HAI tang: ban truoc FR-052 van doc duoc trong luc di tru.
_md = (SCHEMA.get("properties", {}).get("media", {}) or {})
mime = ((_md.get("items", {}) or {}).get("properties", {})
        or _md.get("properties", {}) or {}).get("mime", {}) or {}
ok(bool(mime), "schema có `media.mime`")
ok("enum" not in mime, "`media.mime` KHÔNG còn `enum` đóng",
   f"còn enum {len(mime.get('enum', []))} giá trị — cửa nhận chưa mở")
mau = mime.get("pattern")
ok(bool(mau), "`media.mime` có `pattern`",
   "bỏ enum mà không đặt pattern là thả tự do — một mime mang \\r\\n đi thẳng "
   "vào content-type")

if mau:
    rx = re.compile(mau)
    NHAN = ["application/pdf", "application/octet-stream",
            "application/vnd.la+xyz", "text/csv", "image/webp",
            "application/x-7z-compressed"]
    for m in NHAN:
        ok(bool(rx.fullmatch(m)), f"  nhận `{m}`",
           "định dạng lạ hợp lệ mà bị chặn ⇒ cửa nhận vẫn đóng")

    # CHIỀU ÂM — mỗi chuỗi dưới đây là một cách tách đầu đề hoặc một mime vô nghĩa
    CHAN = {
        "application/pdf\r\nX-Bad: 1": "xuống dòng CRLF — tách đầu đề",
        "application/pdf\nX-Bad: 1": "xuống dòng LF — tách đầu đề",
        "application/pdf; charset=x": "dấu chấm phẩy — nối tham số vào đầu đề",
        "application/ pdf": "dấu cách",
        "application/pdf\x00": "ký tự NUL",
        "khongcogach": "thiếu `/` — không phải type/subtype",
        "application/": "thiếu subtype",
        "/pdf": "thiếu type",
    }
    for m, vs in CHAN.items():
        ok(not rx.fullmatch(m), f"  CHẶN {vs}",
           f"khớp: {m!r} — chuỗi này đi thẳng vào `content-type`")

print("\n2 · Bảng mime GIỮ vai RENDER — không bị xoá\n")

loai = {l["mime"]: l for l in BANG.get("loai", [])}
CAN = ["application/pdf",
       "application/vnd.openxmlformats-officedocument.presentationml.presentation",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
       "application/vnd.ms-powerpoint", "application/msword"]
for m in CAN:
    ok(m in loai, f"giữ định dạng đã biết `{m.split('.')[-1][:28]}`",
       "bỏ một mục là mất `xem_truoc` + magic của nó — PDF mất xem trước")
for m, l in loai.items():
    # VĂN BẢN THUẦN không có magic byte — đó là sự thật về định dạng, không
    # phải một chỗ khai thiếu. `.md`/`.txt` (T03-111) mở đúng ngoại lệ này và
    # ghi lý do ngay trong bảng.
    #
    # Miễn theo TÍNH CHẤT SUY ĐƯỢC (`xem_truoc == "van-ban"`), không theo một
    # danh sách mime chép tay: danh sách chép tay thì mỗi định dạng văn bản mới
    # lại phải sửa cổng, và ai quên sửa thì cổng đỏ oan — đúng vòng vừa xảy ra.
    van_ban = l.get("xem_truoc") == "van-ban"
    ok(bool(l.get("magic")) or van_ban, f"  `{l.get('duoi')}` còn `magic`",
       "định dạng ĐÃ BIẾT vẫn phải qua magic-byte — FR-039 chỉ bỏ cửa cho loại LẠ")
    # Chiều NGƯỢC LẠI, để miễn trừ không thành cửa sau: một dòng khai
    # `van-ban` mà lại có `magic` là khai mâu thuẫn — hoặc nó không phải văn
    # bản thuần, hoặc `magic` đó là số bịa.
    ok(not (van_ban and l.get("magic")),
       f"  `{l.get('duoi')}` khai `van-ban` thì KHÔNG được có `magic`")
    # `tai` là chế độ thứ ba, thêm cùng `.vtt` (T01-45): một text track không
    # xem được trong iframe (trình duyệt không render `.vtt` trần) và cũng
    # không phải một cái thẻ — nó để TẢI hoặc để máy đọc. Bản đầu bỏ nó ngoài
    # enum nên `.vtt` đỏ vì thiếu một chế độ render, chứ không vì hỏng.
    # `van-ban` là chế độ thứ TƯ (T03-111): đổ chữ bằng `textContent`, nội dung
    # không bao giờ thành DOM. Thêm vào enum vì cùng một lý do đã thêm `tai`
    # ở trên — thiếu một chế độ render thì dòng đó đỏ vì cổng chưa biết nó,
    # chứ không vì nó hỏng. Đây là lần thứ HAI cổng này vấp đúng chỗ ấy.
    # WO-064 · `phat` = thẻ gốc `<video>`/`<audio>`; cửa phục vụ trả `inline`.
    ok(l.get("xem_truoc") in ("iframe", "the", "tai", "van-ban", "phat", "anh"),
       f"  `{l.get('duoi')}` có `xem_truoc` hợp lệ",
       f"được {l.get('xem_truoc')!r} — enum là iframe | the | tai | van-ban | phat | anh")

print("\n3 · Khối `mac_dinh` cho định dạng lạ\n")

md = BANG.get("mac_dinh")
ok(isinstance(md, dict), "bảng có khối `mac_dinh`",
   "không có thì `hienVatPhucVu` phải đoán content-type từ tên file — đúng thứ "
   "`nosniff` tồn tại để không tin")
if isinstance(md, dict):
    ok(md.get("mime") == "application/octet-stream",
       "  `mac_dinh.mime` là `application/octet-stream`",
       f"được {md.get('mime')!r}")
    ok(md.get("xem_truoc") != "iframe",
       "  `mac_dinh.xem_truoc` KHÔNG phải `iframe`",
       "iframe ⇒ `content-disposition: inline` ⇒ định dạng lạ render trong gốc "
       "của chính trang — đúng lỗ FR-039 §0 nói sẽ KHÔNG mở")
    ok(bool(md.get("duoi")), "  `mac_dinh.duoi` có giá trị (đuôi file export)",
       "thiếu ⇒ `_media/<sha>.` cụt đuôi, và exporter đặt tên bằng nó")

print("\n4 · Trần dung lượng — thứ NGƯỜI DÙNG chọn làm cổng\n")

"""
Bản đầu gõ `== 26214400`. Nó đúng cho tới `FR-054 §9` (chủ dự án ký) nới trần
lên 1 GiB cho đường `sinh-transcript`, và từ lúc đó nó đỏ **một cách vô ích**:
con số trong cổng không phải một mệnh đề về hệ thống, nó là bản sao thứ hai của
một quyết định — và bản sao thứ hai luôn là bên lệch.

Mệnh đề THẬT, không copy số:

  ① `media-mime.json.tran_byte` **bằng** `frontmatter.schema.json` `so_byte.maximum`
  ② trần vẫn TỒN TẠI và ở trong khoảng dùng được

① là vế đắt nhất. Hai chỗ khai hai trần thì **bên nghiêm hơn thắng một cách vô
hình**: cửa media nhận 200 MB, frontmatter từ chối, và người nạp không có cách
nào biết ai vừa từ chối mình. Đo được hôm nay: bảng đã 1 GiB trong khi schema
còn 25 MiB — tức trần thật vẫn là 25 MiB dù một FR đã ký nới nó.
"""
tran_bang = BANG.get("tran_byte")
tran_schema = ((SCHEMA.get("properties", {}).get("media", {}).get("items", {})
                .get("properties", {}).get("so_byte", {})).get("maximum"))
ok(tran_bang == tran_schema,
   f"trần KHỚP hai chỗ: {tran_bang} byte",
   f"`media-mime.json` nói {tran_bang}, `frontmatter.schema.json` nói "
   f"{tran_schema} — bên NGHIÊM HƠN thắng mà không ai báo")
ok(isinstance(tran_bang, int) and 0 < tran_bang <= 1073741824,
   "  trần còn TỒN TẠI và trong khoảng dùng được (≤ 1 GiB)",
   "bỏ trần hoặc cho nó vượt 1 GiB là bỏ cổng cuối ở cửa nhận: `node:sqlite` "
   "bind cả file thành một BLOB trong một lần, và SQLITE_MAX_LENGTH ~1 GB")

print(chr(10) + "5 · `T01-45` quyết 2 — MP4 không lạc sang bản ghi tài liệu" + chr(10))

"""
Lỗ `MP4-lạc-bảng` (backlog M12): bấy lâu mp4 vào kho qua ô file của TÀI LIỆU,
vốn không lọc gì. Quyết 2 (chủ dự án 2026-09-04): media `video/*`|`audio/*`
thuộc bản ghi **video**; đặt ở `tai-lieu` là ĐỎ.

Đo BẢNG ở đây, đo HÀNH VI ở `validate.py` (ca âm trong `test_gates.py`).
"""
mimes = set(loai)
for m in ("video/mp4", "audio/mpeg"):
    ok(m in mimes, f"bảng có `{m}` — không có thì upload mp4 không có mime để khai",
       "T03-109 mở ô file cho bản ghi video; thiếu dòng này thì mọi mp4 rơi vào "
       "`mac_dinh` = `application/octet-stream`, và quyết 2 không có gì để chặn")

# Magic của mp4/m4a nằm ở OFFSET 4 (`ftyp`), không phải byte mở đầu — bốn byte
# đầu là ĐỘ DÀI box và nó thay đổi theo file. Nên bảng phải khai được độ lệch,
# và bên đọc phải tôn trọng nó; khai `magic` mà bỏ `magic_bu` nghĩa là mọi mp4
# thật đều bị từ chối.
for m, l in loai.items():
    if l.get("magic_bu") is None:
        continue
    ok(isinstance(l["magic_bu"], int) and l["magic_bu"] >= 0,
       f"  `{l.get('duoi')}`: `magic_bu` là số ≥ 0 ({l['magic_bu']})",
       "độ lệch âm hoặc không phải số ⇒ bên đọc so sai chỗ")
ok(loai.get("video/mp4", {}).get("magic_bu") == 4,
   "  `video/mp4` khai `magic_bu: 4` — `ftyp` không nằm ở byte đầu",
   "so từ byte 0 thì MỌI mp4 thật bị 422, vì bốn byte đầu là độ dài box")

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — định dạng mở CHƯA đúng")
print("pass · mime mở hình dạng nhưng không thả tự do; bảng giữ vai render")
