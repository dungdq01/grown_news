# T04-9 — CI chạy cổng M13 (`truyhoi/tests/check_*.py`) theo khuôn chungcat

> Plan M13 (s7 2026-09-07, thêm 2026-09-09). Đo: `grep truyhoi .github/workflows/*.yml`
> ⇒ 0. Không có bước này thì 18 cổng M13 chỉ xanh trên máy dev — đúng thứ R2
> gọi là "tự nhận xong". Khuôn sẵn: ci.yml:352 lặp `chungcat/tests/check_*.py`.
> ID rule 9: max T04-8 ⇒ 9. Chặn sau T13-2 (cần `truyhoi/pyproject.toml` để cài).

phạm_vi_ghi:
  - .github/workflows/**

phụ_thuộc: T13-2

verifiability: hard
tiêu_chí:
  - AC1: ci.yml có bước `pip install -e ./truyhoi` và vòng lặp chạy MỌI
      `truyhoi/tests/check_*.py`; một cổng đỏ ⇒ job đỏ (check_ci_teeth đọc được)
    cmd: python core/tests/check_ci_teeth.py
  - AC2: CI không cần khoá model để chạy cổng M13 (can_key_model=false — không
      có secret nào tên truyhoi trong workflow)
    cmd: python core/tests/check_ci_teeth.py
