# T05-1 — cổng gác cửa: validate, trả lại, không tự điền

phạm_vi_ghi:
  - 05_intake/**
verifiability: hard
tiêu_chí:
  - AC1: file thiếu trường bị trả lại, KHÔNG vào kb/
    cmd: python 05_intake/test_gate.py -k tra_lai
  - AC2: M05 không tự điền trường thiếu
    cmd: python 05_intake/test_gate.py -k khong_tu_dien
  - AC3: file không frontmatter ⇒ trả lại kèm khung
    cmd: python 05_intake/test_gate.py -k khong_frontmatter
  - AC4: external thiếu spot-check bị chặn
    cmd: python -m pytest core/tests/test_gates.py -k external
  - AC5: kho đã có <slug>.md ⇒ TRẢ LẠI, bản trong kho không đổi một byte; file đã vào kho không bị xử lý lại lần sau
    cmd: python 05_intake/test_gate.py -k khong_ghi_de
  - AC6: file đã vào kho được dọn khỏi _inbox/ (đổi tên, không xoá) và không bị xử lý lại
    cmd: python 05_intake/test_gate.py -k don_inbox

## Việc

Đọc `_inbox/*.md` → validate bằng `validate.check()` **import từ M01** → vào kho
hoặc trả `<tên>.rejected.md`.

## Ranh giới: phép tính thì làm, phán đoán thì trả lại

| M05 đặt | M05 KHÔNG đặt |
|---|---|
| `origin: external` · `review_status: draft` | `id`, `slug` — trùng slug là hỏng đường dẫn web |
| `ingested_at` — dữ kiện | `credibility_max`, `verdict` — phán đoán |
| `word_count` — **phép tính** | `concepts[]` — phải đối chiếu danh mục |
| | `citations_verified` — **người** mở link mới biết |

`M05-R2`: tự điền là bịa có hệ thống, và bịa đi thẳng qua mọi cổng vì nó "hợp lệ
về hình thức".

## Import, không copy

`M05-R3`: copy logic kiểm ⇒ hai bản lệch nhau **im lặng**. M02 sửa schema thì bản
copy vẫn dùng luật cũ và cho qua thứ đáng lẽ bị chặn.

Đây là ngoại lệ có chủ ý: 6 module còn lại nối nhau bằng file, M05 được import M01.

## AC không có ở đây, và vì sao

*"Người thật đã mở link, không phải máy khai hộ"* — **không lệnh nào** phân biệt
được. Đó là `soft`, người chốt, và là **giới hạn thật** của module, không phải nợ.
