# T12-10 — `GET /viec` liệt kê việc (THỢ), có phân trang và lọc trạng thái

> Mở 2026-09-03 · chỉ đạo *"hoàn thiện tất cả task liên quan FE"*. Đo được:
> `grep -n '"/viec' chungcat/src/api.py` → chỉ `GET /viec/<id>`, **không có
> đường liệt kê**. `T03-93` (màn `/chung-cat/`) sống bằng danh sách việc, nên
> nó đứng chờ đúng đường này.

**Là gì**: `HangDoi.liet_ke()` đọc `new/` + `cur/`, trả danh sách đã sắp theo
ULID **giảm dần** (ULID sắp theo thời gian, nên đó là "mới nhất trước" mà không
cần đọc mtime — mtime là thứ `git checkout` đổi được, ULID thì không).

`GET /viec?giai_doan=&n=` — đòi khoá LÕI như `GET /viec/<id>`: danh sách việc
lộ slug của nguồn, tức lộ **cái gì đang có trong kho**.

phạm_vi_ghi:
  - chungcat/src/vong.py                 # `liet_ke()`
  - chungcat/src/api.py                  # route `GET /viec`

verifiability: hard
tiêu_chí:
  - AC1: `GET /viec` không khoá ⇒ 403; có khoá ⇒ 200 + `{dong: [...], tong}`
    cmd: python chungcat/tests/check_liet_ke_viec.py
    đỏ_khi: trả 200 khi thiếu khoá — danh sách việc lộ slug của kho
    xanh_khi: 403 khi thiếu khoá, 200 khi có
  - AC2: sắp theo ULID GIẢM DẦN, không theo mtime
    cmd: python chungcat/tests/check_liet_ke_viec.py
    đỏ_khi: đổi mtime của một file làm thứ tự đổi
    xanh_khi: thứ tự giữ nguyên sau khi `touch` một file cũ
  - AC3: `n` chặn trên — một kho 10k việc không được trả hết trong một lần
    cmd: python chungcat/tests/check_liet_ke_viec.py
    đỏ_khi: `n` bị bỏ qua hoặc `n` lớn hơn trần vẫn trả hết
    xanh_khi: `len(dong) <= min(n, TRAN)`

phụ_thuộc: T12-6
