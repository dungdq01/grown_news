# T01-3 — dọn môi trường Python, pin 3.11 khớp hai chỗ

phạm_vi_ghi:
  - core/pyproject.toml
verifiability: hard
tiêu_chí:
  - AC1: workflow `python-version` khớp `requires-python` của pyproject
    cmd: python core/tests/check_version_pin.py
  - AC2: 19 test vẫn xanh sau khi đổi sàn Python
    cmd: python -m pytest core/tests -q

## Task này thuộc M01, không phải M04

Nó ghi `core/pyproject.toml` — M01 sở hữu `core/**`. M04 *phát hiện* lỗi
(`check_version_pin.py`) nhưng không được sửa file mình chấm — luật gốc, và
`M04-R2`.

Đây là ví dụ sạch của bất đối xứng: bên chấm nêu vấn đề, bên sở hữu sửa.

## Vì sao task này đi trước mọi task khác

`check_version_pin.py` **đang đỏ**: workflow pin `3.11`, `pyproject.toml` ghi
`>=3.9`. Toàn bộ phiên s5–s6 chạy trên 3.9.

Hai số khác nhau ⇒ CI kiểm một môi trường, người phát triển chạy môi trường khác,
lỗi chỉ lộ trên CI — chỗ đắt nhất. ADR-02 · M04-R4.

Bật CI trước khi dọn thì CI đỏ ngay commit đầu, và **CI đỏ từ đầu bị bỏ qua theo
thói quen** — S3 mất răng vĩnh viễn (M04-R3).

## Việc

Sửa `requires-python = ">=3.11"` trong `core/pyproject.toml`.

**Kiểm trước khi sửa**: máy có Python 3.11 không? Không có ⇒ **DỪNG**, leo thang.
Không hạ workflow xuống 3.9 để cho khớp — đó là nới ADR-02, phải qua FR.

## Rule của pack áp vào task này

`M04-R4` — bề mặt S3, `check_version_pin.py`.
