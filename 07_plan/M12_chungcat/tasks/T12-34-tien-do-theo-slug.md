# T12-34 — Việc MỚI tiếp được tiến độ của việc CŨ cùng `slug`

> `WO-078`. Ảnh màn chủ dự án 2026-09-09: 502 từ cửa, hết 2 lần gửi, hệ khuyên
> "tạo VIỆC MỚI" — và việc mới bỏ phí 151 cue đang nằm trong rác.

phạm_vi_ghi:
  - .factory/wo/WO-078-viec-moi-khong-thay-tien-do-cu.md
  - 07_plan/M12_chungcat/tasks/T12-34-tien-do-theo-slug.md
  - chungcat/src/worker.py
  - chungcat/tests/check_tien_do_theo_slug.py
  - chungcat/tests/check_hong_khong_mang_nhan_cho.py   # D6 đổi CHỖ đo, không nới
  - 06_modules/M12_chungcat/backlog.md

verifiability: hard
tiêu_chí:
  - AC1: việc mới không có tiến độ riêng ⇒ nạp bản MỚI NHẤT của cùng `slug`,
      tìm ở CẢ bốn ngăn (`cur` `done` `rac` `new`)
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tien_do_theo_slug.py
    đỏ_khi: chỉ quét `cur/` — bản cần dùng nằm ở `rac/`
  - AC2: `slug` KHÁC thì KHÔNG ghép — chặn duy nhất, vì `.vtt` của video khác
      vẫn là `.vtt` hợp lệ và không cổng nào bắt được
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tien_do_theo_slug.py
    đỏ_khi: bỏ phép so `slug` (đã gieo, đỏ đúng)
  - AC3: việc CÓ tiến độ riêng thì dùng của mình — bản đang chạy thắng bản cũ
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tien_do_theo_slug.py
  - AC4: `M12-R6` KHÔNG bị nới — `lan_gui` việc mới = 0 và trần 2 giữ nguyên;
      `chay_lai` VẪN từ chối khi hết lượt
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tien_do_theo_slug.py
  - AC5: M12 xanh toàn bộ
    cmd: for f in chungcat/tests/check_*.py
