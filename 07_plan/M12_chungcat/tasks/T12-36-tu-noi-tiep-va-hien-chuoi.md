# T12-36 — Tự xếp việc NỐI TIẾP khi có tiến; hiện chuỗi trên thẻ

> `WO-080`. Chủ dự án 2026-09-09: *"làm, và phải hiển thị rõ trên UI — để còn
> biết hỏng tại đâu, chạy lại từ đâu ra sao"*.

phạm_vi_ghi:
  - .factory/wo/WO-080-tu-noi-tiep-viec-va-hien-chuoi.md
  - 07_plan/M12_chungcat/tasks/T12-36-tu-noi-tiep-va-hien-chuoi.md
  - chungcat/src/worker.py
  - chungcat/assets/nguong.json
  - chungcat/tests/check_tu_noi_tiep.py
  - web/plugins/chungcat/src/chungcat.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: hỏng ở chặng nối tiếp được + ĐÃ tiến ⇒ xếp một việc kế mang
      `lan_noi_tiep` · `noi_tiep_tu` · `tiep_tu_giay`
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tu_noi_tiep.py
  - AC2: KHÔNG tiến ⇒ KHÔNG đẻ. Đây là cái chặn giữa "tự nối tiếp" và "vòng
      lặp có hoá đơn" — cùng bất biến `WO-069`
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tu_noi_tiep.py
    đỏ_khi: bỏ phép so `den <= bat_dau_luot` (đã gieo, đỏ đúng)
  - AC3: hết `tran_noi_tiep_tu_dong` ⇒ dừng, để NGƯỜI quyết
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tu_noi_tiep.py
    đỏ_khi: bỏ phép so trần (đã gieo, đỏ đúng)
  - AC4: chặng `dang-verify` và loại việc khác ⇒ không đẻ
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tu_noi_tiep.py
  - AC5: `M12-R6` không đổi — `TRAN_GUI` vẫn 2, việc kế `lan_gui` = 0
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tu_noi_tiep.py
  - AC6: UI trả lời ba câu — hỏng tại đâu (`đã phiên âm tới mm:ss`), chạy lại
      từ đâu (`nối tiếp từ mm:ss` + ULID), ra sao (`nối tiếp n`); và câu "hết 2
      lần gửi" nhường chỗ khi máy đã tự tạo việc tiếp
    cmd: .venv/Scripts/python.exe chungcat/tests/check_tu_noi_tiep.py
