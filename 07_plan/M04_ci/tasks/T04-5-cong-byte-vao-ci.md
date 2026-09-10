# T04-5 — FR-036/B4: đấu `check_media_dan_xuat.py` vào CI + Makefile

> Đơn vị RIÊNG vì `phạm_vi_ghi` của nó nằm ngoài boundary M01_core (`core/**`).
> Nới ở tầng **chia việc**, không nới tại chỗ — đó là bài học đã ghi ở
> `WL-01K9N1FR036A4`.
>
> Một cổng không ai chạy là một cổng không tồn tại. `check_media_dan_xuat.py`
> canh **rule nguy hiểm nhất** của M09 (byte bị phá vĩnh viễn, test vẫn xanh),
> nên nó đứng ngoài CI một ngày là một ngày rule đó không có bề mặt S3.

phạm_vi_ghi:
  - .github/workflows/ci.yml
  - Makefile

verifiability: hard
tiêu_chí:
  - AC1: cổng có trong CI **và** trong `make check` — hai chỗ, vì `make check` là
      bản người chạy tay và CI là bản chấm
    cmd: grep -c check_media_dan_xuat .github/workflows/ci.yml Makefile
  - AC2: cổng mới xanh trên kho THẬT (không đỏ oan), và mọi cổng `check_*.py`
      khác không đổi phán quyết. `make` KHÔNG có trên máy này (đã đo:
      `make: command not found`), nên tiêu chí chạy trực tiếp danh sách cổng —
      `make check` gọi một TẬP CON của danh sách đó (4 cổng không nằm trong
      Makefile, cả 4 đều có trong ci.yml), nên xanh ở đây kéo theo xanh ở kia
    cmd: python core/tests/check_media_dan_xuat.py
  - AC3: `Makefile` và `ci.yml` cùng khai một cổng — hai danh sách của MỘT chủ
    cmd: python core/tests/check_media_dan_xuat.py
phụ_thuộc: T01-13
