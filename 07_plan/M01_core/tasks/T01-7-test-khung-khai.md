# T01-7 — FR-036: fixture + cổng canh khung (đơn vị TEST)

> Tách khỏi T01-6 vì R1. Cổng `check_khung.py` là thứ canh phần VĂN XUÔI của
> khung — hai file `.md` mẫu và hai `shell.html` — vì văn xuôi không dẫn xuất
> được từ file khai, và chỗ không dẫn xuất được là chỗ trôi.

phạm_vi_ghi:
  - core/tests/check_khung.py
  - core/tests/check_ci_teeth.py
  - core/tests/test_gates.py
  - core/tests/fixtures/dat-chuan.md
verifiability: hard
tiêu_chí:
  - AC1: khai báo · 2 file mẫu · 2 shell cùng nói một khung; số ô DẪN XUẤT từ số
      mục lá, không gõ số vào cổng
    cmd: python core/tests/check_khung.py
  - AC2: mỗi cổng hình dạng mới đỏ được trên một fixture hỏng đã biết, và KHÔNG
      đỏ oan khi §3 dài (ca âm mà bộ test cũ không diễn đạt được)
    cmd: python -m pytest core/tests -q && python core/tests/check_ci_teeth.py
phụ_thuộc: T01-6
