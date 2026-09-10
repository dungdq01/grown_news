# T04-10 — HUỶ (trùng `[Space] T04-90`) — cổng `check_scope` do PM-Space cầm

trạng_thái: đóng · **HUỶ 2026-09-09**, không thi công

> Tôi (PM-M13) tạo đơn vị này lúc nạp `07_plan/song-song-m13-space-checklist.md`
> §0.1 và **không `ls` thư mục trước** — PM-Space đã mở `T04-90-check-scope-hai-nhanh.md`
> cho **đúng cùng một cổng**, cùng khai `core/tests/check_scope.py`.
>
> Đây chính là ca mà cổng ấy sinh ra để bắt: **hai task mở tranh một file**, và
> nó bắt được *chính người vừa mở nó*. Ghi lại thay vì xoá dấu vết — checklist
> §4 nói *"tạo task ⇒ `ls` lấy max+1 ngay trước đó"*, và lần này tôi đã bỏ bước
> đó ở thư mục `M04_ci` (tôi chỉ `ls` dải của mình).
>
> **Chủ cổng: PM-Space** (`T04-90`, dải T##-90+ theo `rule.md` mục 13). PM-M13
> **không** mở bản thứ hai. Hai điều bản của tôi có mà `T04-90` nên nhận, đã
> báo bằng một dòng "cần thêm" trong worklog `WL-01KB42SONGSONG`, không sửa
> file của nhánh kia:
>  1. đăng ký cổng vào `core/tests/test_gates.py` để CI gọi (M04-R1: cổng ngoài
>     CI là cổng không răng) — `T04-90` khai `Makefile`, chưa khai `test_gates`;
>  2. chuẩn hoá `\` → `/` và bỏ comment sau `#` trước khi so path — `phạm_vi_ghi`
>     của dự án này có comment cùng dòng ở ít nhất 9 task, so thô sẽ **đỏ oan**.

phạm_vi_ghi:
  - 07_plan/M04_ci/tasks/T04-10-check-scope-hai-task-mot-file.md

verifiability: soft
tiêu_chí:
  - AC1: (soft) đơn vị huỷ — không sinh mã, không sinh cổng; `check_scope` sau
      khi `T04-90` xong **không** báo cặp `T04-10 ↔ T04-90` (đơn vị này đã đóng
      và không còn khai `core/tests/check_scope.py`)
