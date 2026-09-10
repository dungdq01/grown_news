# T12-31 — TikTok cần `curl_cffi`; Douyin KHÔNG lấy được ảnh bìa

> `WO-074` §1 §2 §5. Chủ dự án 2026-09-09 nạp hai bản ghi thật.

phạm_vi_ghi:
  - .factory/wo/WO-074-tiktok-douyin-day-du.md
  - 07_plan/M12_chungcat/tasks/T12-31-tiktok-curlcffi-douyin-khong-anh.md
  - chungcat/pyproject.toml
  - chungcat/assets/nguon-transcript.json
  - chungcat/src/worker.py
  - chungcat/tests/check_sinh_thumbnail.py
  - 06_modules/M12_chungcat/backlog.md

verifiability: hard
tiêu_chí:
  - AC1: `curl_cffi` khai trong `pyproject.toml` kèm lý do — không phải cài tay
    cmd: .venv/Scripts/python.exe chungcat/tests/check_sinh_thumbnail.py
    đỏ_khi: gói vắng trong bảng khai, hoặc vắng trong môi trường
    xanh_khi: cả hai có, và `yt-dlp` liệt kê được ít nhất một impersonate target
  - AC2: `chien_luoc_anh_bia` trả `None` cho douyin — đọc TỪ BẢNG, 0 host gõ cứng
    cmd: .venv/Scripts/python.exe chungcat/tests/check_sinh_thumbnail.py
    đỏ_khi: douyin ra `"url"` (xếp một job chắc chắn hỏng), hoặc host gõ cứng trong .py
  - AC3: tiktok VẪN ra `"url"` — loại trừ douyin không được kéo theo tiktok
    cmd: .venv/Scripts/python.exe chungcat/tests/check_sinh_thumbnail.py
  - AC4: M12 xanh toàn bộ
    cmd: .venv/Scripts/python.exe -c "..." (bộ 51 cổng)
