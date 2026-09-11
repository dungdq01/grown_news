# T01-58 — `check_running.py` chạy lệnh GHI trong thư mục tạm, không trên cây đang đo (WO-100 vế A)

> Test đi trước ở `T01-56`. WO: `WO-100` vế A. ID rule 9: max 56 ⇒ dải chẵn ⇒ **58**.
>
> **Việc**: hai lệnh `RUNNING.md:173-174` (`dung_lai_db.py` · `xuat_kho.py`) phải chạy
> với `KB_DIR`/`RECYCLE_DIR` trỏ **thư mục tạm**, không phải `kb/` của cây.
>
> **Chọn (b), không chọn (a)** — WO §1 đã cân: thêm hai lệnh vào `GHI_KHONG_CO` (cách a)
> là hạ đúng hai lệnh **quan trọng nhất** xuống mức *"chỉ kiểm cú pháp"*, tức cổng còn
> xanh mà không ai biết `dung_lai_db` có chạy được không. Cách (b) giữ nguyên *"chạy
> thật"* — chỉ chạy ở chỗ khác. Cơ chế đã có sẵn: `dung_lai_db.py:37` và `xuat_kho.py:33`
> đều đọc `KB_DIR` từ môi trường; `core/tools/do_tai.py:216` đã dùng đúng khuôn đó.
>
> **Giữ răng**: lệnh ĐỌC (`validate.py kb/`…) vẫn chạy thật trên cây — ca D của `T01-56`
> canh điều này. Đừng hạ mọi lệnh xuống `--help`.

phạm_vi_ghi:
  - core/tests/check_running.py

phụ_thuộc: T01-56

verifiability: hard
tiêu_chí:
  - AC1: bốn ca của `T01-56` xanh — cây không đổi một byte ở `kb/**`, `_recycle/**`,
      `web/_loi.sqlite*`; lệnh ĐỌC vẫn chạy thật
    cmd: python -m pytest core/tests/test_gates.py -q -k running_khong_pha_cay
  - AC2: chạy trên CÂY THẬT — `git status --porcelain` trước và sau `check_running.py`
      ra **cùng một chuỗi**; và cổng vẫn exit 0
    cmd: python core/tests/check_running.py
  - AC3: `GHI_KHONG_CO` **không** mọc thêm phần tử nào cho hai lệnh này (chứng minh
      đã chọn (b) chứ không lặng lẽ rơi về (a)) — grep `dung_lai_db|xuat_kho` trong
      khối `GHI_KHONG_CO` ⇒ 0
    cmd: python -m pytest core/tests/test_gates.py -q -k running_khong_pha_cay
  - AC4: suite core xanh, số failed KHÔNG tăng so với baseline (6 failed/43 — WO-094)
    cmd: python -m pytest core/tests -q
