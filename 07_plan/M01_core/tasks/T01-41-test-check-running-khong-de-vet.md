# T01-41 — `check_running` không để vết, và có LƯỚI cho lệnh ghi chưa khai (đơn vị TEST)

> WO-039. Đơn vị này chạm `core/tests/**` ⇒ nó **là** đơn vị test, một mình.
>
> **Hai việc, và việc thứ hai quan trọng hơn:**
>
> **1 · Lưới đo SỰ THẬT, không đo tên.** Chụp `git status --porcelain` + băm nội
> dung mọi file trong đó, trước và sau khi chạy từng lệnh. Lệnh nào làm working
> tree khác đi ⇒ **ĐỎ, nêu đúng lệnh và đúng file**.
>
> Vì sao lưới trước danh sách: bộ phát hiện hiện tại đoán từ **hậu tố cờ**
> (`--fix`/`--ghi`/`--ky`). Nó đúng cho ba lệnh và **im lặng sai** ở lệnh thứ tư.
> Thêm một dòng vào danh sách chữa đúng một ca; lưới chữa **cả lớp** — lệnh ghi
> tương lai nào cũng bị bắt, ngay lần đầu, và bị bắt **ồn ào**.
>
> **2 · Khai `07_curate/curate.py` là lệnh ghi** ⇒ chỉ kiểm cú pháp.
> Vế *"chạy thật"* của curate **không mất**: `07_curate/test_curate.py` đã chạy
> nó thật (`Makefile:56`). Đây là chia việc, không phải bỏ việc.
>
> **Giới hạn của lưới, phải ghi ra**: một lệnh ghi ra nội dung **y hệt** thứ đang
> có thì lưới không thấy — và đúng, vì nó không đổi gì.

phạm_vi_ghi:
  - core/tests/check_running.py

verifiability: hard
tiêu_chí:
  - AC1: lưới ĐỎ trước — thêm lưới mà CHƯA khai curate ⇒ cổng đỏ, nêu đích danh
      `python 07_curate/curate.py week` và file nó sinh
    cmd: python core/tests/check_running.py
  - AC2: sau khi khai curate là lệnh ghi ⇒ cổng **không để vết**
    cmd: git status --porcelain > /tmp/a && python core/tests/check_running.py; git status --porcelain > /tmp/b && diff /tmp/a /tmp/b
  - AC3: vế "lệnh chạy thật" của các lệnh KHÁC không mất — cổng vẫn đỏ được khi
      một lệnh trong RUNNING.md thật sự hỏng (thử trên bản sao ở thư mục tạm)
    cmd: python core/tests/check_running.py
