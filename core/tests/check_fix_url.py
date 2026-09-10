#!/usr/bin/env python3
"""C6b — `--fix` điền `url_normalized`, và KHÔNG ghi đè lời khai đã có.

VÌ SAO Ở PYTHON, KHÔNG Ở FE: `validate.py:289` đòi video hồ sơ `thu-vien` khai
`url_normalized`, nên đường nạp video ở FE phải có trường đó. Tính nó bằng JS là
bản THỨ HAI của `normalize_url()` — đúng lớp lỗi "hai công thức, không ai đối
chiếu" đã trúng ở `dongBoThe` (`nut-song.test.js` §6 kể cả câu chuyện: hai bên
dựng tiêu đề bằng hai đường, bài không có `title` thì fallback lệch, và thẻ bị
nhân đôi).

`--fix` đã tự điền `word_count` theo cùng nguyên tắc "dữ liệu dẫn xuất", và
`ghiSauValidate` gọi `validate.py` với `--fix`. Nên một công thức, chạy một nơi.

VẾ NẶNG LÀ CHIỀU ÂM. "Điền khi vắng" xanh cả với một cài đặt GHI ĐÈ mọi lúc — và
cài đặt đó phá cổng 9 (`validate.py:383`), thứ duy nhất bắt lời khai LỆCH hàm
tính. Sau khi ghi đè, cổng 9 không bao giờ đỏ được nữa.

Chạy trên thư mục TẠM (CẤM "sửa file thật để thử một cổng").
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parents[2]
VAL = R / "core" / "src" / "source_distiller" / "validate.py"

loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


def fm(**them):
    d = {
        "id": '"src_vidtest1"', "slug": '"thu-video"',
        "source_type": '"video"', "protocol_version": '"2.0"',
        "analyzed_at": '"2026-08-28"', "one_liner": '"Ban thu nap video"',
        "credibility_max": '"plausible"', "review_status": '"approved"',
        "origin": '"manual"', "conformance": '"B"', "ho_so": '"thu-vien"',
        "concepts": "[]",
    }
    d.update(them)
    return "---\n" + "\n".join(f"{k}: {v}" for k, v in d.items()) + "\n---\n\nNoi dung ngan.\n"


def chay(kho, *co):
    r = subprocess.run([sys.executable, str(VAL), str(kho), *co],
                       capture_output=True,
                       env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    return r.returncode, (r.stdout + r.stderr).decode("utf-8", "replace")


def doc_fm(f):
    t = f.read_text(encoding="utf-8")
    m = re.search(r"^url_normalized:\s*(.+)$", t, re.M)
    return m.group(1).strip().strip('"') if m else None


d = tempfile.mkdtemp(prefix="gn-fixurl-")
try:
    kho = Path(d) / "kb"
    (kho / "video").mkdir(parents=True)
    # Danh muc CHEP tu kho that — hinh dang phai dung, khong thi `validate.py`
    # nem `TypeError` o cho doc `c["id"]` va cong CHET thay vi bao. Ban dau cua
    # toi viet `concepts: []` va trung dung cai do.
    for f in ("concepts.yaml", "categories.yaml"):
        shutil.copy(R / "kb" / f, kho / f)

    print("\n1 · VẮNG `url_normalized` ⇒ `--fix` ĐIỀN\n")

    f1 = kho / "video" / "thu-video.md"
    f1.write_text(fm(url='"https://youtu.be/abc123nhom1"'), encoding="utf-8")
    chay(kho, "--fix")
    co = doc_fm(f1)
    ok(co == "youtube.com/watch?v=abc123nhom1",
       f"điền `url_normalized` = {co!r}",
       "chưa điền ⇒ FE phải tự tính, tức bản thứ hai của normalize_url()")

    print("\n2 · CHIỀU ÂM — ĐÃ CÓ mà LỆCH ⇒ KHÔNG ghi đè, cổng 9 vẫn ĐỎ\n")

    f2 = kho / "video" / "thu-video.md"
    f2.write_text(fm(url='"https://youtu.be/abc123nhom1"',
                     url_normalized='"co-tinh-khai-sai"'), encoding="utf-8")
    chay(kho, "--fix")
    con = doc_fm(f2)
    ok(con == "co-tinh-khai-sai",
       f"lời khai đã có KHÔNG bị ghi đè (còn {con!r})",
       "ghi đè ⇒ cổng 9 không bao giờ đỏ được nữa, và nó là thứ duy nhất bắt "
       "lời khai lệch hàm tính")
    ma, ra = chay(kho, "--strict")
    ok(ma != 0 and ("url_normalized" in ra),
       "cổng 9 VẪN ĐỎ trên lời khai lệch",
       f"exit {ma} — nếu xanh thì `--fix` đã xoá bằng chứng")

    print("\n3 · Host NGOÀI whitelist ⇒ không điền chuỗi rỗng\n")

    f3 = kho / "video" / "thu-video.md"
    f3.write_text(fm(url='"https://khong-co-trong-whitelist.example/v/1"'),
                  encoding="utf-8")
    chay(kho, "--fix")
    lai = doc_fm(f3)
    ok(lai is None or lai != "",
       f"không ghi trường rỗng (được {lai!r})",
       "khai một trường không có nội dung là khai một lời rỗng")

    print("\n4 · KHÔNG hồi quy — `word_count` vẫn được điền\n")

    f4 = kho / "video" / "thu-video.md"
    f4.write_text(fm(url='"https://youtu.be/abc123nhom1"'), encoding="utf-8")
    _, ra2 = chay(kho, "--fix")
    ok("word_count" in ra2 or re.search(r"^word_count:", f4.read_text(encoding="utf-8"), re.M),
       "`word_count` vẫn được `--fix` điền", ra2.strip()[-200:])
finally:
    shutil.rmtree(d, ignore_errors=True)

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — `--fix` chưa đúng")
print("pass · một công thức: --fix điền url_normalized, không ghi đè lời khai")
