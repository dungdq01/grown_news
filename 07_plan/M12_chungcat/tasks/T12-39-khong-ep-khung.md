# T12-39 — Không ép khung 5 mục cho bản `origin: pipeline`

> `WO-094` · `FR-036a` duyệt (thu hẹp) 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M12_chungcat/tasks/T12-39-khong-ep-khung.md
  - core/src/source_distiller/validate.py
  - chungcat/tests/check_khong_ep_khung.py
  - .factory/wo/WO-094-khong-ep-khung-cho-chung-cat.md

verifiability: hard
tiêu_chí:
  - AC1: `origin: pipeline` thiếu mục ⇒ PASS
    cmd: python chungcat/tests/check_khong_ep_khung.py
    đỏ_khi: vẫn "Thiếu mục" — vế 1
  - AC2: `origin: manual` thiếu mục ⇒ VẪN TRƯỢT
    cmd: python chungcat/tests/check_khong_ep_khung.py
    đỏ_khi: nới cho cả hai ⇒ bỏ cổng chứ không nới cổng — vế 2
  - AC3: trần từ · nhãn · schema VẪN chặn với `pipeline`
    cmd: python chungcat/tests/check_khong_ep_khung.py
    đỏ_khi: `pipeline` thành đường vòng qua mọi phép kiểm — vế 3/3a
  - AC4: bộ cổng M01 + M12 không đỏ thêm
    cmd: python core/tests/check_khung.py && python chungcat/tests/check_e2e_chung_cat.py --mock
