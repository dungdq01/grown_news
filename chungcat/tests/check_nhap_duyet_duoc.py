#!/usr/bin/env python3
"""T12-20 — bản nháp do worker dựng phải DUYỆT ĐƯỢC.

Phát hiện khi nghiệm thu `T03-112 AC3` (2026-09-05): nút "Duyệt vào kho" gọi
đúng cửa duyệt, cửa chạy `validate.py --fix`, và cửa trả **422** với CHÍN
trường bắt buộc còn thiếu. Cửa làm đúng việc của nó — thiếu sót ở phía TẠO.

VÌ SAO KHÔNG NỚI THƯỚC
Cửa duyệt là thước (`validate.py` + `frontmatter.schema.json`). Nới nó để lọt
một bản thiếu trường là bỏ phép kiểm cho **MỌI** đường nạp, không riêng chưng
cất. Bên phải sửa là bên dựng ra vật.

VÌ SAO CỔNG NÀY KHÔNG GỌI MẠNG
`_dung_nhap` là hàm THUẦN: `(slug, kq, dem) → chuỗi markdown`. Đo nó trực tiếp
với một `kq` giả thì không cần model, không cần mạng, không tốn tiền — và nó
đỏ được ngay cả khi ví hết tiền hoặc cửa sập.

ĐỎ_KHI  thiếu bất kỳ trường schema đòi · tự khai mức tin cậy CAO ·
        `review_status` khác `draft`
XANH_KHI `validate.py --strict` xanh trên bản dựng thuần
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import worker  # noqa: E402

loi: list[str] = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + ("" if dk else f"  {ct}"))
    if not dk:
        loi.append(ten)


NEO = "tai-lieu/linux-foundation:p.1"
# Dạng VIẾT RA thân bài: ngữ pháp địa chỉ không nhận tiền tố module.
NEO_VIET = "linux-foundation:p.1"

# Câu trả lời của một model ĐÃ THEO KHUNG — đó là đầu vào THẬT sau khi `_PROMPT`
# xin nó viết theo mục. Cổng này đo phép DỰNG của ta, nên đầu vào phải là thứ ta
# thật sự nhận, không phải một chuỗi văn xuôi trần tôi tự nghĩ ra.
#
# Mỗi mục khẳng định mang một ĐỊA CHỈ: `validate` đòi *"mọi khẳng định phải có
# địa chỉ"*, và đó là luật đúng — một mục không neo vào nguồn nào là một mục
# không kiểm được.
def _muc(so, ten, chu, neo=True):
    dau = "###" if "." in so else "##"
    cham = "" if "." in so else "."
    return (f"{dau} {so}{cham} {ten}\n\n{chu}"
            + (f" [{NEO_VIET}]" if neo else "") + "\n")


KQ = {
    "text": "\n".join([
        _muc("1", "Overview", "Tài liệu giới thiệu nền tảng Linux Foundation.",
             neo=False),
        _muc("2", "Bối cảnh", "Nó ra đời khi hạ tầng mở cần một chỗ đứng chung.",
             neo=False),
        _muc("3", "Nội dung", "Ba phần dưới đây tách theo dòng dữ liệu.", neo=False),
        _muc("3.1", "Đầu vào", "Nguồn là tài liệu giới thiệu của chính tổ chức."),
        _muc("3.2", "Process", "Tổ chức điều phối đóng góp qua các dự án thành viên."),
        _muc("3.3", "Output", "Kết quả là hạ tầng phần mềm dùng chung, mở."),
        _muc("3.4", "Tinh túy", "Điểm cốt lõi: quản trị chung thay cho sở hữu riêng."),
        _muc("4", "Ý nghĩa thực tế",
             "Doanh nghiệp dùng được hạ tầng mà không phải tự nuôi toàn bộ."),
        _muc("5", "Rủi ro và tầm nhìn",
             "Rủi ro là phụ thuộc vào một tổ chức điều phối duy nhất."),
    ]),
    "quotes": ["nguyên lý cơ bản"],
    "model_da_dung": "gemini-2.5-flash-lite",
}
# `vi_tri` do `verify.dinh_vi()` tính — TA tính, không phải model. Số neo trong
# thân chính là `citations_sampled` mà máy đếm được.
DEM = {"citations_sampled": 1, "citations_verified": 1,
       "vi_tri": [{"neo": NEO, "diem": None, "tang": "chinh-xac"}]}

print("\n1 · Đủ MỌI trường `frontmatter.schema.json` đòi\n")

ban = worker._dung_nhap("tai-lieu/linux-foundation", KQ, DEM)
ok(ban.startswith("---"), "dựng được bản nháp có frontmatter")

# Tách frontmatter bằng phép cắt, không parse YAML: câu hỏi duy nhất là
# "khoá này có ở cột 0 không" — cùng lập luận `ghepBoSung` của `server.mjs`.
than_fm = ban.split("---", 2)[1] if ban.count("---") >= 2 else ""
co = {d.split(":", 1)[0].strip() for d in than_fm.splitlines() if ":" in d
      and not d.startswith((" ", "\t"))}

SCHEMA = json.loads(
    (R / "core" / "assets" / "frontmatter.schema.json").read_text(encoding="utf-8"))
thieu = [k for k in SCHEMA["required"] if k not in co]
ok(not thieu, f"đủ {len(SCHEMA['required'])} trường bắt buộc",
   f"thiếu: {thieu} — cửa duyệt sẽ trả 422 và người bấm không vào được kho")

print("\n2 · KHÔNG tự khai mức tin cậy CAO\n")

gt = {}
for d in than_fm.splitlines():
    if ":" in d and not d.startswith((" ", "\t")):
        k, v = d.split(":", 1)
        gt[k.strip()] = v.strip()

ok(gt.get("credibility_max") == "claimed",
   f"`credibility_max: claimed` — bậc THẤP NHẤT (được {gt.get('credibility_max')!r})",
   "một bản máy vừa sinh, chưa ai đọc, mà tự khai `verified` là đúng loại nói "
   "dối `M12-R2` cấm: bên bị đánh giá không được cầm bút chấm mình")
ok(gt.get("conformance") == "C",
   f"`conformance: C` — bậc thấp nhất (được {gt.get('conformance')!r})",
   "cùng lý do: mức tuân thủ là thứ NGƯỜI chấm sau khi đọc")
ok(gt.get("review_status") == "draft",
   f"`review_status: draft` (được {gt.get('review_status')!r})",
   "`draft` là trạng thái YẾU NHẤT — khai nó không phải tự duyệt, mà là nói "
   "đúng mình đang là gì. Khai `approved` mới là thứ `M12-R2` cấm.")
ok(gt.get("origin") == "pipeline",
   f"`origin: pipeline` (được {gt.get('origin')!r})",
   "`manual` là lời khai sai: không người nào gõ bản này")

print("\n3 · `validate.py --strict` ĐI QUA — phép đo thật, không suy\n")

with tempfile.TemporaryDirectory() as tmp:
    d = Path(tmp) / "article"
    d.mkdir(parents=True)
    (d / "phan-tich-linux-foundation.md").write_text(ban, encoding="utf-8")
    r = subprocess.run(
        [sys.executable, str(R / "core/src/source_distiller/validate.py"),
         # `--fix` vì CỬA DUYỆT chạy `--fix --strict` (dungchung.mjs:753).
         # Đo bằng một lệnh khác lệnh thật là đo một hệ khác.
         str(Path(tmp)), "--fix", "--strict",
         # Kho THẬT không có ở đây: cổng đo phép DỰNG bản nháp, không đo kho.
         # Tắt TƯỜNG MINH — validate đòi vậy, và đó là luật đúng: một cổng tắt
         # âm thầm là một cổng không ai biết đã tắt.
         "--no-concepts", "--no-categories"],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    xanh = r.returncode == 0
    ok(xanh, "validate `--strict` XANH trên bản nháp thuần",
       "còn đỏ:\n" + "\n".join(
           l for l in (r.stdout or "").splitlines() if "✗" in l)[:600])

print()
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} vấn đề — bản nháp CHƯA duyệt được")
print("pass · bản nháp đủ trường, khai bậc thấp nhất, validate xanh")
