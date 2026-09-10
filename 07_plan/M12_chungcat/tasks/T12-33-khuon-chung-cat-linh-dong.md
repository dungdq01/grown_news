# T12-33 — Khung chưng cất là SÀN, không phải TRẦN; thêm `boi_canh` vào payload

> `WO-077`. Chủ dự án 2026-09-09. **Không FR**: đo được `validate` nhận mục
> thừa (`## 6.` + bảng ⇒ 0 lỗi), nên nới nằm trọn trong M12.

## Bước

1. Cổng ĐỎ trước — `check_khuon_linh_dong.py` → verify: chạy, phải đỏ
2. `_than_theo_khung` giữ mục ngoài khung → verify: vế 1–3 xanh
3. `_PROMPT` + `_CHOT` mở cho thêm mục, nhắc bảng → verify: vế 4–5
4. `boi_canh`: payload → prompt → frontmatter → verify: vế 6–8
5. Chạy `validate.py` THẬT trên thân dựng ra → verify: vế 9

phạm_vi_ghi:
  - .factory/wo/WO-077-khuon-chung-cat-linh-dong.md
  - 07_plan/M12_chungcat/tasks/T12-33-khuon-chung-cat-linh-dong.md
  - chungcat/src/worker.py
  - chungcat/src/api.py
  - chungcat/tests/check_khuon_linh_dong.py
  - 06_modules/M12_chungcat/backlog.md

verifiability: hard
tiêu_chí:
  - AC1: `_than_theo_khung` GIỮ mục ngoài khung (6, 7…), nối SAU khung bắt buộc,
      đúng thứ tự model viết
    cmd: .venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
    đỏ_khi: mục 6 biến mất khỏi thân dựng ra
    xanh_khi: đủ 1–5 đúng thứ tự RỒI tới 6, 7
  - AC2: mục bắt buộc VẪN đủ và đúng thứ tự kể cả khi model bỏ sót — phép nới
      không được làm mất răng của `_than_theo_khung`
    cmd: .venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
    đỏ_khi: model chỉ viết mục 1 và 6 mà thân thiếu 2–5
  - AC3: `_PROMPT` cho phép thêm mục + nhắc dùng bảng; `_CHOT` KHÔNG còn cấm
      thêm mục nhưng VẪN cấm phá JSON
    cmd: .venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
  - AC4: `boi_canh` — api kiểm kiểu + trần; vào prompt; vào frontmatter; bị
      `lam_sach_chi_dan` lột `«»`
    cmd: .venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
    đỏ_khi: `boi_canh` chứa `«` đóng được ô prompt
  - AC5: `validate.py` THẬT nhận thân có mục thừa — phép nới không đẩy bản ghi
      ra ngoài hợp đồng
    cmd: .venv/Scripts/python.exe chungcat/tests/check_khuon_linh_dong.py
  - AC6: M12 xanh toàn bộ
    cmd: for f in chungcat/tests/check_*.py
