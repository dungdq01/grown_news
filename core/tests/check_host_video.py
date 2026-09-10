#!/usr/bin/env python3
"""Cổng whitelist nơi phát video — M09-R3 phải đúng bằng CẤU TRÚC, không bằng lời.

VÌ SAO CỔNG NÀY TỒN TẠI
`src` của iframe video được dựng bằng `nhung + id`. `nhung` là hằng trong bảng
khai; `id` đến từ URL NGƯỜI DÙNG DÁN. Luật M09-R3 nói `src` chỉ được dựng từ
whitelist + regex id — nhưng câu đó chỉ là lời hứa cho tới khi có ai chứng minh
**không id hợp lệ nào thoát ra khỏi vị trí của nó trong URL**.

Đây là chỗ đọc-bằng-mắt thất bại. `[0-9]{6,24}` trông vô hại; thiếu neo `^…$` thì
nó khớp phần giữa của `9999999/../evil` và `id` mang theo dấu gạch chéo. Nên cổng
này **sinh chuỗi tấn công rồi thử**, không đọc regex.

Và WO-022 vừa cho một bài học kề bên: `id_mau` hỏi *"đúng HÌNH DẠNG không"*, nên
nó không phân biệt được id đúng với id sai. Ở đây cũng vậy — §4 đối chiếu `id_tu`
với `id_mau` trên một url thật, chứ không tin từng cái một mình.

ĐỎ_KHI   thiếu nơi phát người dùng kể · `id_mau` cho lọt ký tự thoát URL ·
         `nhung` trỏ ra ngoài host nhúng · `id_tu` bắt ra thứ `id_mau` từ chối
XANH_KHI bốn nơi phát, mỗi cái đi trọn vòng url-chia-sẻ → id → src
"""

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
BANG = R / "core" / "assets" / "media-mime.json"

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


HOST = json.loads(BANG.read_text(encoding="utf-8")).get("video_host", [])
CO = {h.get("nhan") for h in HOST}

# Người dùng kể đúng bốn nơi (WO-019): "youtube, tiktok, fb, douyin…"
PHAI_CO = ["youtube", "tiktok", "fb", "douyin"]

# URL chia sẻ mẫu + id kỳ vọng. Đây là hợp đồng của §4: không phải "regex có
# chạy không" mà "dán đúng thứ người ta copy từ nơi phát thì ra đúng id nào".
MAU = {
    "youtube": ("youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    "tiktok": ("tiktok.com/@ai/video/7234567890123456789", "7234567890123456789"),
    "fb": ("facebook.com/watch/?v=1234567890123456", "1234567890123456"),
    "douyin": ("douyin.com/video/7234567890123456789", "7234567890123456789"),
}

# Host được phép đứng trong `nhung`. Một `nhung` gõ sai host là iframe trỏ ra
# ngoài whitelist — đúng thứ M09-R3 sinh ra để chặn, và nó KHÔNG lộ ra ở bất kỳ
# phép kiểm nào khác vì URL vẫn hợp lệ.
NHUNG_CHO = {
    "youtube": "www.youtube-nocookie.com",
    "tiktok": "www.tiktok.com",
    "fb": "www.facebook.com",
    "douyin": "open.douyin.com",
}

print("\n1 · Đủ bốn nơi phát người dùng kể\n")

for n in PHAI_CO:
    kiem(n in CO, f"whitelist có `{n}`", "người dùng kể: youtube, tiktok, fb, douyin")

print("\n2 · `id_mau` không cho lọt ký tự thoát URL (M09-R3)\n")

# Sinh chuỗi tấn công rồi THỬ. Mỗi ký tự dưới đây, nếu lọt vào `id`, đưa `src` ra
# khỏi vị trí bảng khai định: `/` `?` `#` đổi đường · `&` thêm tham số · `%` mở
# lại một lớp giải mã · `:` `@` đổi cả host · dấu cách và `\` là lối vòng.
XAU = ["/", "?", "#", "&", "%", ":", "@", "\\", " ", ".", '"', "'", "<", ">"]

for h in HOST:
    n = h.get("nhan", "?")
    mau = h.get("id_mau", "")
    kiem(mau.startswith("^") and mau.endswith("$"),
         f"`{n}`.id_mau neo hai đầu",
         f"{mau!r} — thiếu neo thì nó khớp phần GIỮA của một chuỗi dài hơn")
    try:
        rx = re.compile(mau)
    except re.error as e:
        kiem(False, f"`{n}`.id_mau biên dịch được", str(e))
        continue
    # Lấy một id thật của chính host này rồi chèn ký tự xấu vào giữa.
    goc = MAU.get(n, ("", "x" * 11))[1] or "1234567890123456"
    lot = [c for c in XAU
           if rx.fullmatch(goc[: len(goc) // 2] + c + goc[len(goc) // 2:])
           or rx.match(goc[: len(goc) // 2] + c + goc[len(goc) // 2:])]
    kiem(not lot, f"  `{n}` từ chối mọi ký tự thoát URL",
         f"lọt: {' '.join(repr(c) for c in lot)}")

print("\n3 · `nhung` là https, đúng host nhúng, và id ghép vào CUỐI\n")

# ── WO-074 · `nhung: null` là một GIÁ TRỊ, không phải một ô bỏ trống ──────
#
# Douyin KHÔNG nhúng được — đo 2026-09-09, cả ba đường: `douyin.com/video/<id>`
# và `iesdouyin.com/share/video/<id>` đặt `frame-ancestors` về miền ByteDance;
# `open.douyin.com/player` thì khung được, nhưng `aweme/detail` bên trong trả
# `403 Blocked by ArgusSecurityPlugin Uifid Not Found` — chứng thực THIẾT BỊ,
# không phải đăng nhập (thử ở tầng cao nhất với cookie đầy đủ, nên cũng không
# phải phân vùng cookie bên thứ ba).
#
# Nên bảng khai `nhung: null`. Vế cũ đòi MỌI host có một `nhung` https, nên nó
# đỏ vì bảng nói ĐÚNG SỰ THẬT — đỏ oan.
#
# Nhưng "bỏ qua host nào không có nhung" thì mất luôn vế đang giữ M09-R3. Nên
# vế mới đòi CẢ HAI CHIỀU:
#   · có `nhung`   ⇒ https, đúng host whitelist, là tiền tố (y như cũ)
#   · `nhung` null ⇒ phải khai `$vi_sao_nhung_null`
# Một host mất `nhung` vì ai đó xoá nhầm vẫn đỏ, ở vế thứ hai.
for h in HOST:
    n = h.get("nhan", "?")
    nh = h.get("nhung")
    if nh is None:
        kiem(bool(str(h.get("$vi_sao_nhung_null", "")).strip()),
             f"`{n}`.nhung = null thì phải khai `$vi_sao_nhung_null`",
             "một ô rỗng không nói được nó rỗng vì ĐO hay vì QUÊN")
        continue
    p = urlsplit(nh)
    kiem(p.scheme == "https", f"`{n}`.nhung dùng https", nh)
    cho = NHUNG_CHO.get(n)
    kiem(cho is None or p.netloc == cho,
         f"  `{n}`.nhung trỏ đúng `{cho}`",
         f"nhận được {p.netloc!r} — iframe sẽ trỏ ra ngoài whitelist")
    kiem("__" not in nh and not nh.endswith("&"),
         f"  `{n}`.nhung là tiền tố, id ghép vào cuối",
         "bảng khai không có chỗ giữ chỗ; id LUÔN nối vào đuôi")

print("\n4 · Vòng thật: url chia sẻ → id_tu → id_mau → src\n")

for h in HOST:
    n = h.get("nhan", "?")
    if n not in MAU:
        kiem(False, f"`{n}` có url mẫu trong cổng",
             "thêm host mà không thêm mẫu ⇒ host đó không ai đi thử")
        continue
    url, cho_id = MAU[n]
    try:
        rt = re.compile(h.get("id_tu", ""), re.I)
    except re.error as e:
        kiem(False, f"`{n}`.id_tu biên dịch được", str(e))
        continue
    kiem(rt.groups == 1, f"`{n}`.id_tu có ĐÚNG một nhóm bắt",
         f"có {rt.groups} — `idVideo` chỉ đọc `m[1]`")
    m = rt.search(url)
    kiem(m is not None, f"  `{n}` bóc được id từ {url}")
    if not m:
        continue
    kiem(m.group(1) == cho_id, f"  `{n}` bóc ra đúng id",
         f"kỳ vọng {cho_id!r}, nhận {m.group(1)!r}")
    # Hai regex không đối chiếu nhau là hai công thức cho một sự thật.
    kiem(re.fullmatch(h.get("id_mau", ""), m.group(1)) is not None,
         f"  `{n}`: thứ `id_tu` bắt được ĐI QUA `id_mau`",
         "id_tu rộng hơn id_mau ⇒ dán url thật vào thì màn báo lỗi")
    if h.get("nhung") is None:
        # Không nhúng được thì không có `src` để kiểm — nhưng `id_tu` ở trên
        # vẫn phải đúng: id ấy là thứ FE dùng dựng LINK RA NGUỒN.
        continue
    src = h.get("nhung", "") + m.group(1)
    kiem(urlsplit(src).netloc == NHUNG_CHO.get(n, urlsplit(src).netloc),
         f"  `{n}`: src cuối cùng vẫn ở đúng host", src)

print("\n5 · Ca âm — url host A không cho ra id dưới luật host B\n")

for h in HOST:
    n = h.get("nhan", "?")
    if n not in MAU:
        continue
    try:
        rt = re.compile(h.get("id_tu", ""), re.I)
        rm = re.compile(h.get("id_mau", ""))
    except re.error:
        continue
    # `id_tu` cố tình chỉ tả phần ĐƯỜNG DẪN, nên nó KHỚP url của host khác là
    # bình thường — cái chặn là phép so tên miền ở `idVideo`/`hostVideoHopLe`.
    # Điều phải đúng ở đây hẹp hơn: một chuỗi RÕ RÀNG không phải id thì không
    # được đi qua cả hai lớp.
    for xau in [f"{n}.com/video/../../etc/passwd", "youtube.com/watch?v=", "x"]:
        m = rt.search(xau)
        qua = m is not None and rm.fullmatch(m.group(1)) is not None
        kiem(not qua, f"`{n}` từ chối {xau!r}",
             f"bắt ra {m.group(1)!r} và nó đi qua id_mau" if m else "")

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề ở whitelist nơi phát — sửa BẢNG KHAI, không sửa cổng")
print(f"whitelist nơi phát: {len(HOST)} host, mỗi host đi trọn vòng url → id → src")
