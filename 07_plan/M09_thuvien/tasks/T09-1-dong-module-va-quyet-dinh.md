# T09-1 — FR-037/B10: đóng M09 + hồ sơ quyết định (đơn vị CODE)

> Đơn vị **cuối** của plan FR-036/FR-037.
>
> `spec.md` của M09 khai 11 AC `hard` từ B0 nhưng không dòng nào nói AC đó **đã
> xanh chưa** và **cổng nào** đang canh. Một spec không nói trạng thái là một spec
> người đọc phải tự đi tìm.

phạm_vi_ghi:
  - 06_modules/M09_thuvien/spec.md

verifiability: hard
tiêu_chí:
  - AC1: mỗi rule M09-R1..R5 trỏ đúng file cổng đang canh nó, và trạng thái module
      đổi từ `planned` sang `as-built`
    cmd: python core/tests/check_rule_surfaces.py
  - AC2: lock ký lại; mọi cổng còn xanh
    cmd: python core/tests/check_frozen.py && python core/tests/check_g6a.py
phụ_thuộc: T03-21
