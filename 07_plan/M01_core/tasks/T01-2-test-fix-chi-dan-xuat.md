# T01-2 — test khẳng định `--fix` chỉ sửa dữ liệu dẫn xuất

phạm_vi_ghi:
  - core/tests/**
verifiability: hard
tiêu_chí:
  - AC1: --fix không đổi trường nào ngoài word_count
    cmd: python -m pytest core/tests/ -k fix_chi_dan_xuat

## Nợ khai ở s6

AC-2.3.1 của spec M01 là `soft` — `--fix` có luật nhưng không test nào kiểm.

## Việc

So frontmatter **trước và sau** `--fix` trên một file có sẵn lỗi `word_count`.
Khẳng định: đúng một khoá đổi giá trị, mọi khoá khác nguyên vẹn.

## Đây là ĐƠN VỊ TEST — vai riêng

R1: task test là đơn vị riêng, vai riêng. Đơn vị **không phải** `test` mà chạm
file test là vi phạm phạm vi.

Tên file mang chữ `test` là chủ ý — `check_g6b.py` kiểm điều này bằng máy, và
lượt đầu nó cảnh báo vì tên cũ (`T02-2-fix-chi-dan-xuat`) không lộ ra rằng đây
là đơn vị test.

Không gộp vào T01-1: T01-1 ghi `validate.py`, task này ghi `core/tests/**`.

## Rule áp vào

`M01-R2`: `--fix` sửa trường cần phán đoán là **bịa có hệ thống** — và bịa đi
thẳng qua mọi cổng còn lại vì nó "hợp lệ về hình thức".
