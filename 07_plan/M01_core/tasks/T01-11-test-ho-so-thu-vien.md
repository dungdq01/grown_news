# T01-11 — FR-036/B2: test hồ sơ `thu-vien` (đơn vị TEST)

> Tách khỏi T01-10 vì R1. Test ở đây viết TRƯỚC code (bước 5 của /factory:go): nó
> phải ĐỎ trước khi T01-10 chạy, không thì "đã sửa xong" chỉ là lời khai.

phạm_vi_ghi:
  - core/tests/test_gates.py
  - core/tests/check_ci_teeth.py

verifiability: hard
tiêu_chí:
  - AC1: mỗi luật mới có một ca ĐỎ và một ca XANH — cổng đỏ được, và không đỏ oan
    cmd: python -m pytest core/tests -q
  - AC2: CI đỏ được trên từng luật mới, bản đạt chuẩn vẫn sạch
    cmd: python core/tests/check_ci_teeth.py
phụ_thuộc: T01-10
