# T04-7 — áp `FR-058` vào `check_g6b`, và sửa `da_xanh` chạy sai interpreter

> `FR-058` **ĐÃ DUYỆT** 2026-09-04 (chủ dự án: *"duyệt đề xuất"*). Cổng thuộc
> M04_ci — **không** thuộc bên bị đo, đúng luật gốc.
> ID theo `rule.md` mục 9: `ls 07_plan/M04_ci/tasks/` → max `T04-6` ⇒ 7.

## Việc 1 · `check_g6b` đọc mục `he_thong` của map (FR-058 lớp B)

`04_system/**` và `.gitignore` không nhận chủ module: `adr.md` là artifact **s4**
ở TẦNG TRÊN mọi module, và luật gốc cấm *"sở hữu thứ dùng để đánh giá mình"*.
Trước FR-058, mỗi task chạm chúng là một dòng FAIL bị **bỏ qua bằng tay**
(`T08-24` `.gitignore` · `T08-28` `04_system/adr.md`) — và một cổng mà mọi người
quen bỏ qua là một cổng đã chết.

Đọc **TỪ MAP**, không gõ danh sách trong cổng: gõ ở cổng là bản thứ hai của một
bảng khai, và nó lạc hậu im lặng đúng ngày ai đó thêm một đường vào map.

Lớp A của FR-058 (`core/assets/nguong-loi.json` về `M08_api.be`) là một dòng
`project_map.yaml`, không đụng cổng.

## Việc 2 · `da_xanh` chạy `python` trần, không chạy interpreter của dự án

Đo 2026-09-04: `python core/tests/check_reject_reason.py` dưới `.venv` → **exit 0,
XANH**; cùng lệnh đó qua `subprocess` với chữ `python` của bảng khai → **exit 1,
`Thiếu phụ thuộc: pip install pyyaml jsonschema`** (interpreter HỆ THỐNG).

⇒ W5 báo *"AC hard … chưa xanh"* cho một cổng ĐANG XANH. Cổng đỏ vì **sai
interpreter** là cổng **đỏ oan**, và nó dạy người đọc bỏ qua dòng W5 — mất đúng
thứ W5 canh. Sửa: `[sys.executable, *cmd.split()[1:]]`.

phạm_vi_ghi:
  - core/tests/check_g6b.py

# `project_map.yaml` CỐ Ý KHÔNG ở đây, dù FR-058 sửa nó.
#
# Map là thứ KHAI RA mọi boundary — cho một task ghi vào nó là để bên bị đo sửa
# đúng cái thước đang đo mình, ở tầng cao nhất. Và nó KHÔNG được vào mục
# `he_thong` của chính FR-058 vì cùng lý do đó, dù nó "không có chủ module".
# ⇒ Bump map là **hành động của PM (s7)**, đúng tiền lệ `FR-056` (*"map v28 đã
#   áp"*, không task nào khai nó). Ghi ở worklog `WL-01KA0U3VIECDUYET`.

verifiability: hard

tiêu_chí:
  - AC1: FAIL boundary của lớp A+B biến mất; lớp C GIỮ NGUYÊN đỏ
    cmd: python core/tests/check_g6b.py
    đỏ_khi: "`T08-16`/`T09-8` cũng hết đỏ — nghĩa là đã nới quá tay, và hai task
      đó là BUILD khai sai thành PATCH chứ không phải lỗi boundary"
    xanh_khi: 32 → 27 lỗi, và `T08-16`/`T09-8` vẫn còn trong danh sách
  - AC2: W5 không còn báo `check_reject_reason.py` "chưa xanh"
    cmd: python core/tests/check_g6b.py
    đỏ_khi: dòng W5 của M02_kb còn
    xanh_khi: 27 → 26 lỗi
  - AC3: nền Python giữ xanh
    cmd: python -m pytest core/tests -q

# `phụ_thuộc` để TRỐNG: `FR-058` đã DUYỆT nên nó không còn là việc phải chờ, và
# `check_g6b` chỉ phân giải được ID **task** — khai một id FR ở đây sinh một dòng
# FAIL *"phụ thuộc không tồn tại"*, tức một cổng đỏ vì cú pháp chứ không vì luật.
phụ_thuộc:
