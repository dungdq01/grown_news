#!/usr/bin/env python3
"""AC-2.1.1 · CI phải ĐỎ ĐƯỢC.

Một CI không bao giờ đỏ thì không phải cổng, là trang trí. Script này phá từng
luật trong bộ nhớ và khẳng định check() trả lỗi — không đợi một PR thật để biết.

Khác test_gates.py ở mục đích: test_gates hỏi "luật này có hiệu lực không";
file này hỏi "bộ luật có đủ răng để CI đỏ không". Cùng cơ chế, khác câu hỏi.
"""
import json, sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from source_distiller.validate import SCHEMA_PATH, check  # noqa: E402

GOOD = Path(__file__).parent / "fixtures" / "dat-chuan.md"
schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
concepts = {"data-leakage", "walk-forward-validation"}

# (tên luật, thay thế, chuỗi phải xuất hiện trong lỗi)
PHA = [
    ("word_count khai sai",      [("word_count: 202", "word_count: 260")],           "word_count"),
    # WO-094 · HAI ca này kèm `origin: manual`.
    #
    # `dat-chuan.md` khai `origin: pipeline`, và từ `WO-094` bản MÁY SINH không
    # còn bị ép khung 5 mục (`FR-036a`, chủ dự án duyệt và thu hẹp). Nên trên
    # fixture nguyên trạng, hai răng dưới đây KHÔNG CÒN CẮN — không phải vì cổng
    # hỏng, mà vì luật đã đổi PHẠM VI.
    #
    # Răng còn lại đúng là: *một bản NGƯỜI VIẾT thiếu mục thì bị chặn*. Nên ca
    # phải dựng đúng bản ấy. Chiều ngược lại (`pipeline` thiếu mục ⇒ PASS) do
    # `chungcat/tests/check_khong_ep_khung.py` vế 1 canh.
    #
    # Đổi ở ĐÂY chứ không sửa fixture: sáu cổng khác đang dùng chung nó.
    ("thiếu một mục",            [("origin: pipeline", "origin: manual"),
                                  ("## 5. Rủi ro và tầm nhìn", "## 55. Rủi ro và tầm nhìn")], "Thiếu mục"),
    ("thiếu một mục con",        [("origin: pipeline", "origin: manual"),
                                  ("### 3.3 Output", "### 3.9 Output")],             "Thiếu mục"),
    # FR-036/B2 — mot dong frontmatter KHONG duoc mien het cong hinh dang.
    # `ho_so: thu-vien` tren mot ban PHAN TICH (than 202 tu) phai bi chan.
    ("ho so thu-vien dat sai",
     [("review_status: draft", "ho_so: thu-vien\nreview_status: draft")], "thu-vien"),
    ("khái niệm tự bịa",         [("data-leakage]", "khai-niem-tu-bia]")],           "khai-niem-tu-bia"),
    ("rejected thiếu lý do",     [("review_status: draft", "review_status: rejected")], "reject_reason"),
    ("external thiếu spot-check", [("origin: pipeline", "origin: external")],        "citations_sampled"),
]

def run(reps):
    text = GOOD.read_text(encoding="utf-8")
    for old, new in reps:
        if old not in text:
            return None, f"fixture không chứa {old!r} — script lạc hậu so với fixture"
        text = text.replace(old, new)
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "t.md"
        p.write_text(text, encoding="utf-8")
        return check(p, schema, concepts)[0], None

fails = []

errs, err = run([])
if err:
    fails.append(err)
elif errs:
    fails.append(f"bản đạt chuẩn phải SẠCH (nếu không CI đỏ giả và người ta bỏ qua): {errs}")
else:
    print("ok   bản đạt chuẩn: sạch — CI không đỏ giả")

for ten, reps, phai_co in PHA:
    errs, err = run(reps)
    if err:
        fails.append(err); print(f"FAIL {ten}: {err}"); continue
    if any(phai_co in e for e in errs):
        print(f"ok   {ten}: CI đỏ đúng chỗ")
    else:
        fails.append(f"{ten}: phá luật mà CI KHÔNG đỏ (chờ {phai_co!r}, được {errs})")
        print(f"FAIL {ten}: không đỏ")

# FR-034 — cổng 5b (category ngoài danh mục chủ đề). Không nằm trong PHA vì
# fixture không khai category (di sản enum rỗng): phải CHÈN rồi mới phá được.
_txt = GOOD.read_text(encoding="utf-8").replace(
    "concepts_proposed: []", "concepts_proposed: []\ncategory: [chu-de-thu]")
with tempfile.TemporaryDirectory() as _d:
    _p = Path(_d) / "t.md"
    _p.write_text(_txt, encoding="utf-8")
    _errs = check(_p, schema, concepts, categories=set())[0]
if any("category" in e and "chu-de-thu" in e for e in _errs):
    print("ok   chủ đề ngoài danh mục: CI đỏ đúng chỗ")
else:
    fails.append(f"chủ đề ngoài danh mục: phá mà CI KHÔNG đỏ (được {_errs})")
    print("FAIL chủ đề ngoài danh mục: không đỏ")

print()
if fails:
    for f in fails:
        print("  -", f)
    sys.exit(f"{len(fails)}/{len(PHA)+1} — CI CHƯA đủ răng")
print(f"pass · {len(PHA)} luật phá đều đỏ, bản sạch vẫn xanh — S3 có răng")
