# T01-52 — đơn vị TEST: vế `file-anchor` cho check_dia_chi (A1 · A2 · A4 của FR-073)

> **Ngữ cảnh + harness cho dev: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** — đọc nó
> TRƯỚC khi gõ dòng đầu (7 file phải đọc · 8 lệnh cổng + số baseline · 5 bẫy đã đo ·
> 12 điều KHÔNG được làm · 6 ca DỪNG).
> Plan M13 (2026-09-09). Test đi ĐẦU, đỏ-đúng-lý-do trước mã (rule.md mục 8):
> ba vế mới của `core/tests/check_dia_chi.py` viết ở đây, ĐỎ vì dia-chi.json
> chưa có dạng `file-anchor` và validate.py chưa nhận dạng — rồi T01-51 làm
> chúng xanh. Tách riêng vì R1: đơn vị không phải test không chạm file test.
> ID rule 9: max T01-51 ⇒ 52.

phạm_vi_ghi:
  - core/tests/check_dia_chi.py
  - core/tests/fixtures/**
  - core/tests/check_khai_mot_noi.py   # NỚI 2026-09-10 (PM M13, review): §dai-han H1·H2·H4 của FR-077 §2 — đơn vị test M01, cùng cổng T01-51 AC1 trỏ tới; trước đó AC1 của T01-51 xanh RỖNG vì §4 chưa có

phụ_thuộc: —
# 2026-09-10: dev đã đóng T01-52 (bf5e33f) + T01-51 (e932753); vế check_khai_mot_noi §dai-han là LƯỢT HAI của đơn vị này, không phải đơn vị mới — cùng cổng, cùng người

verifiability: hard
tiêu_chí:
  - AC1: A1 — `[docs/x.md#vi-sao-bac-hai]` nhận dạng được, đếm vào
      citations_sampled; chuỗi có `#` nhưng anchor không theo luật slug ⇒ KHÔNG
      nhận (đỏ được trên fixture cố tình sai ở thư mục tạm)
    cmd: python core/tests/check_dia_chi.py
  - AC2: A2 — phân giải: file tồn tại ∧ một heading fold ra đúng anchor ⇒
      verified; anchor không thuộc heading nào ⇒ citations_verified KHÔNG tăng
    cmd: python core/tests/check_dia_chi.py
  - AC3: A4 — hai heading trùng ⇒ -1/-2 ổn định qua hai lần dựng; đổi thứ tự
      heading ⇒ hậu tố đổi theo (state theo file, reset mỗi file)
    cmd: python core/tests/check_dia_chi.py
