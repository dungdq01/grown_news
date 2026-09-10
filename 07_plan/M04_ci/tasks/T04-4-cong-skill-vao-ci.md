# T04-4 — nối cổng `check_skill` vào CI

> Tách khỏi T01-8/T01-9 vì BOUNDARY: `.github/**` thuộc M04_ci, không thuộc
> `core/**` của M01_core. `check_g6b.py` mục 2 chặn đúng chỗ này.
>
> Cổng không nằm trong CI thì nó chỉ đỏ khi có người nhớ chạy tay.
>
> **`Makefile` KHÔNG nằm trong task này** — và đó là một phát hiện, không phải
> bỏ sót: `project_map.modules` cho M04_ci boundary `.github/**` + `.githooks/**`,
> nên `Makefile` hiện **không module nào sở hữu**. Khai nó ở đây làm `check_g6b`
> mục 2 đỏ. Nới boundary là tự tháo răng của chính cổng đó, nên để nguyên và
> báo người dùng. CI gọi thẳng từng cổng (`ci.yml` không đi qua `make`), nên
> việc thiếu dòng Makefile KHÔNG làm cổng mất hiệu lực — chỉ mất đường chạy tay.

phạm_vi_ghi:
  - .github/workflows/ci.yml
verifiability: hard
tiêu_chí:
  - AC1: CI chạy `check_skill.py`, và bước đó không nuốt lỗi (M04-R1)
    cmd: python core/tests/check_skill.py --trong-ci
phụ_thuộc: T01-9
