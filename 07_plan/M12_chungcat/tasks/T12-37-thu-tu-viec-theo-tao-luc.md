# T12-37 — Danh sách việc sắp theo `tao_luc`, không theo id ngẫu nhiên

> `WO-081 §1`. Phát hiện khi không mở nổi panel vừa sửa để nghiệm thu.

phạm_vi_ghi:
  - .factory/wo/WO-081-thu-tu-viec-va-panel-transcript.md
  - 07_plan/M12_chungcat/tasks/T12-37-thu-tu-viec-theo-tao-luc.md
  - chungcat/src/vong.py
  - chungcat/tests/check_thu_tu_viec.py
  - chungcat/tests/check_liet_ke_viec.py   # vế cũ mã hoá tiền đề SAI, đổi CHỖ đo

verifiability: hard
tiêu_chí:
  - AC1: `liet_ke` trả MỚI NHẤT TRƯỚC theo `tao_luc`, kể cả khi id ngược chiều
      thời gian
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_tu_viec.py
    đỏ_khi: sắp theo id — id là `uuid4`, tức sắp ngẫu nhiên
  - AC2: `tao_luc` nằm TRONG file; `touch` một việc cũ KHÔNG đẩy nó lên đầu
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_tu_viec.py
  - AC3: việc CŨ chưa có `tao_luc` vẫn liệt kê được và không biến mất
    cmd: .venv/Scripts/python.exe chungcat/tests/check_thu_tu_viec.py
  - AC4: `nhan_viec` nhặt CŨ NHẤT trước theo `tao_luc` — hàng đợi FIFO thật
    cmd: .venv/Scripts/python.exe chungcat/tests/check_hang_doi_nguyen_tu.py
  - AC5: M12 xanh toàn bộ
    cmd: for f in chungcat/tests/check_*.py
