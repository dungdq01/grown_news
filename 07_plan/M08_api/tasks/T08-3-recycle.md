# T08-3 — DELETE = recycle + restore

phạm_vi_ghi:
  - web/api/**
  - _recycle/**
verifiability: hard
tiêu_chí:
  - AC1: DELETE ⇒ file byte-equal trong _recycle/<type>/, restore về đúng chỗ, restore đè ⇒ 409, xoá 2 lần cùng slug ⇒ hậu tố epoch
    cmd: node web/test/api-recycle.test.js

phụ_thuộc: T08-2

## Việc

- `web/api/recycle.mjs` — DELETE (rename, KHÔNG unlink — M08-R4), GET /api/recycle,
  POST restore. `_recycle/` tạo khi cần, cấu trúc gương `<type>/<slug>.md`.
- Trùng tên trong recycle ⇒ `<slug>.<epoch>.md` — không ghi đè bản xoá trước.

## Rule áp vào

`M08-R4` (không xoá thật).
