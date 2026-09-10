# T03-21 — FR-037/B10: spec M03 khai lối thứ tư + xem trước (đơn vị CODE)

> `06_modules/M03_web/spec.md` là **FROZEN** và `grep` cho `thư viện|hiện vật` ra
> **0 dòng** — trong khi B7b thêm lối nạp thứ tư, B8b thêm ba dạng xem trước, và
> B9 tách hai nền cho dashboard.
>
> Riêng B9 là thứ **phải** có trong spec: nó là một quyết định sản phẩm (*"số đếm
> tổng hợp All, thước đo chất lượng thì không"*), không phải một chi tiết cài đặt.

phạm_vi_ghi:
  - 06_modules/M03_web/spec.md

verifiability: hard
tiêu_chí:
  - AC1: spec khai lối nạp thứ tư, ba dạng xem trước, và HAI NỀN của dashboard
      (M09-R4) — mỗi cái trỏ cổng đang canh
    cmd: grep -c "thư viện" 06_modules/M03_web/spec.md
  - AC2: lock ký lại sau khi FR-037 có
    cmd: python core/tests/check_frozen.py
phụ_thuộc: T08-10
