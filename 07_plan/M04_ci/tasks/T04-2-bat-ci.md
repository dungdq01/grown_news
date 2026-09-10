# T04-2 — bật CI, chứng minh nó đỏ được

phạm_vi_ghi:
  - .github/workflows/**
verifiability: hard
tiêu_chí:
  - AC1: CI đỏ được — phá luật thì check() trả lỗi
    cmd: python core/tests/check_ci_teeth.py
  - AC2: không bước nào nuốt lỗi
    cmd: python core/tests/check_rule_surfaces.py
  - AC3: toàn bộ test xanh trên cây sạch
    cmd: python -m pytest core/tests -q
  - AC4: validate chạy độc lập với hook
    cmd: python core/src/source_distiller/validate.py kb/

phụ_thuộc: T01-3

## Việc

Đổi tên `.github/workflows/ci.yml.template` → `ci.yml`, thêm 4 bước script mới
vào job (`check_ci_teeth`, `check_version_pin`, `check_rule_surfaces`, `check_g6a`).

## Điều kiện bắt buộc trước khi đổi tên

Cả 4 lệnh trên **phải xanh trên máy trước**. Đây là AC-2.4.1 của spec, nhãn `soft`
— thứ tự thao tác người, không lệnh nào kiểm được.

`M04-R3`: bật khi chưa xanh ⇒ CI đỏ từ commit đầu ⇒ bị bỏ qua ⇒ S3 mất răng.

## Điểm dừng

`hard` ⇒ 3 lần đỏ thì DỪNG, leo thang (R4). CI đỏ vì môi trường GitHub khác máy
local là dấu hiệu T04-1 chưa xong thật, không phải "chạy lại là được".
