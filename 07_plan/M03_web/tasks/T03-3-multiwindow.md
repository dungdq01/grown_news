# T03-3 — port multi-window sang component Quartz

phạm_vi_ghi:
  - web/quartz/components/**
verifiability: hard
tiêu_chí:
  - AC1: không listener nào rò sau 10 lần điều hướng
    cmd: node web/test/no-leak.test.js
  - AC2: không đường ghi nào vào kb/ trong bundle
    cmd: node web/test/no-write-path.test.js

phụ_thuộc: T03-2

## Việc

Port **363 dòng JS** từ `05_uiux/prototype/app-v20.html` thành component.
**Không viết lại** — quyết F1 giữ Quartz chính vì số dòng này port được.

| Cần | Cách |
|---|---|
| Nhúng JS | `afterDOMLoaded` |
| Cửa sổ sống qua điều hướng | SPA routing giữ DOM state |
| Khởi tạo lại | `nav` event |
| Chống rò | `window.addCleanup` |

Bốn điều trên **đã kiểm trong tài liệu chính thức** ở F1, không phải phỏng đoán.

## AC soft — người chốt

- Mở 2 cửa sổ, điều hướng, cả hai còn nguyên (AC-2.4.1 của spec)
- Mọi flow P0 click được (AC-2.3.1)

Hai cái này `soft`: 1 lần thử, người chốt bắt buộc, output là DRAFT.

## Rule áp vào

`M03-R2` không đường ghi `kb/` (S3, AC2).
