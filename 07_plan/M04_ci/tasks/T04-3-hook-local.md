# T04-3 — pre-commit hook, bề mặt S4

phạm_vi_ghi:
  - .githooks/**
verifiability: hard
tiêu_chí:
  - AC1: hook chặn commit file .md sai format
    cmd: bash .githooks/test-hook.sh
  - AC2: `--no-verify` bỏ qua được hook, và CI vẫn bắt
    cmd: bash .githooks/test-hook.sh --no-verify-case

phụ_thuộc: T04-2

## Vì sao vẫn cần hook khi đã có CI

Hai bề mặt khác nhau, không phải một việc làm hai lần:

| | S4 hook | S3 CI |
|---|---|---|
| Nhanh | ✅ ngay lúc commit | ❌ sau khi push |
| Bỏ qua được | ✅ `--no-verify` | ❌ |

Hook bắt sớm cho người làm; CI bắt chắc cho hệ thống. AC2 **khẳng định** hook bỏ
qua được — đó là lý do CI phải chạy lại validate, không phải lỗi cần sửa.

## Hai vấn đề về phạm vi — khai trước, không nới lén

**1 · `.githooks/**` giờ thuộc M04** — FR-003 đã duyệt 2026-08-19.
`project_map.modules.M04_ci.be = [.github/**, .githooks/**]` (map v7).

Trước FR, path này **không module nào sở hữu** và task phải chờ. PM không tự nới
boundary — đó là lý do `check_g6b.py` đỏ đúng một dòng suốt s7.

**2 · `.githooks/**` nằm trong deny list S1** và trong danh sách frozen của
`check_frozen.py` (S3). Sửa nó cần: FR → sửa → `check_frozen.py --ky`.

Hai bề mặt này là chủ ý, không phải trở ngại: `.githooks/pre-commit` **là** bề mặt
S4. Cho sửa dễ dàng thì S4 mất giá trị.
