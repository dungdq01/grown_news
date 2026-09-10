# T12-35 — Bỏ cue đảo mốc; thử lại NGẦM chunk khi cửa lỗi tạm thời

> `WO-079`. Chủ dự án 2026-09-09: *"bỏ qua cue đi"* + ý tưởng "request user /
> request ngầm". Đo ra `lan_gui` đếm LƯỢT JOB nên nới nó không cứu được 502
> giữa chừng — đòn đúng là thử lại chính chunk. `M12-R6` giữ nguyên.

phạm_vi_ghi:
  - .factory/wo/WO-079-thu-lai-ngam-khi-cua-502.md
  - 07_plan/M12_chungcat/tasks/T12-35-thu-lai-ngam-va-cue-dao-moc.md
  - chungcat/src/asr_cua.py
  - chungcat/assets/nguong.json
  - chungcat/tests/check_thu_lai_ngam.py
  - 06_modules/M12_chungcat/backlog.md

verifiability: hard
tiêu_chí:
  - AC1: cue `den <= tu` bị BỎ QUA + đếm + in ra; cue tốt cùng lô VẪN về
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_lai_ngam.py
    đỏ_khi: một cue đảo mốc làm cả lượt ném
  - AC2: lỗi TẠM THỜI (5xx/429/mạng/timeout) ⇒ thử lại chính chunk, tối đa
      `tran_thu_lai_cua` lần, giãn cách tăng dần
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_lai_ngam.py
    đỏ_khi: gọi cửa 1 lần rồi ném; hoặc gọi quá trần (vòng lặp có hoá đơn)
  - AC3: lỗi KHÔNG tạm thời (401/403/422) ⇒ ném NGAY, đúng MỘT lời gọi
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_lai_ngam.py
  - AC4: `TRAN_GUI` vẫn 2 và `ghi_nhan_gui` vẫn được gọi — thử lại ngầm không
      được là egress vô hình
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_lai_ngam.py
  - AC5: M12 xanh toàn bộ
    cmd: for f in chungcat/tests/check_*.py
