# T12-41 — `_than_theo_khung` không được nuốt mục trùng số

> `WO-098`.

phạm_vi_ghi:
  - 07_plan/M12_chungcat/tasks/T12-41-khong-nuot-muc-trung-so.md
  - chungcat/src/worker.py
  - chungcat/tests/check_khuon_linh_dong.py
  - .factory/wo/WO-098-than-theo-khung-nuot-muc-trung-so.md

verifiability: hard
tiêu_chí:
  - AC1: thân có HAI mục cùng số ⇒ cả hai còn, không chữ nào mất
    cmd: PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
    đỏ_khi: '`noi`/`tieu_de`/`da_ra` khoá theo số ⇒ mục 6 của bài gốc mất 108 chữ — vế 10/10a/10b'
  - AC2: bất biến trên thân ĐÚNG khung vẫn giữ (không sửa hỏng đường thường)
    cmd: PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
    đỏ_khi: số chữ vào ≠ số chữ ra khi không có mục trùng — vế 10c
  - AC3: vế 9a đo ĐÚNG thứ nó canh — chuẩn hoá số dẫn xuất bằng `validate --fix`
    cmd: PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
    đỏ_khi: '`validate` thêm phép cấm mục thừa (không phải lệch `word_count`)'
  - AC4: cả M12 không đỏ mới
    cmd: PYTHONIOENCODING=utf-8; for f in chungcat/tests/check_*.py; do ./.venv/Scripts/python.exe "$f" >/dev/null 2>&1 || echo "RED $f"; done
    đỏ_khi: in ra bất kỳ dòng RED nào
