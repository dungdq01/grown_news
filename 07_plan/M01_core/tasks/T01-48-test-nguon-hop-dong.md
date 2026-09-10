# T01-48 — cổng cho `T01-47`

> Đơn vị TEST riêng (`R1`).

phạm_vi_ghi:
  - core/tests/check_nguon_hop_dong.py   # cổng MỚI
  - core/tests/fixtures/dat-chuan.md     # fixture khai `pipeline` nên phải có
                                         # `nguon` — nó là VẬT ĐO, và một vật đo
                                         # không hợp lệ thì mọi phép đo dựa vào
                                         # nó đều nói về một thứ không tồn tại

phụ_thuộc: T01-47

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ được trên schema trước khi sửa
    cmd: python core/tests/check_nguon_hop_dong.py
    đỏ_khi: chạy trên schema cũ mà vẫn xanh ⇒ cổng không đo gì
  - AC2: cổng đo bằng chính `jsonschema`, không bằng phép so chuỗi trên file
    cmd: python core/tests/check_nguon_hop_dong.py
