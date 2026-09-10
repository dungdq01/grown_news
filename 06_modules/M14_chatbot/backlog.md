# backlog — M14_chatbot (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## Trống — M14 chưa có mã, nên chưa có thay đổi nào gây nợ

Năm thứ M14 đang chờ **không** thuộc backlog:

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| hình dạng JSON của `ngu_canh` | `model_flow §6` | `FR-045` khai **cột**, chưa khai hình dạng — **hợp đồng** |
| bảng khai model: chung với M12 hay riêng | `model_flow §6` | **quyết định của s7**, không phải nợ |
| M13 §5 (truy vấn) phải xong trước | `workflow §1b` | **phụ thuộc thứ tự**, đã khai |
| khoá service-to-service riêng | `FR-047 L3` (đã duyệt) | **hợp đồng với M08/M17** |
| sáu lệnh `chatbot/tests/` | `rules.md` đầu file | **việc của s8** |

## 2026-09-09 · KÉO THEO từ FR-072 (M13) — hợp đồng `/truy-hoi` đổi hình dạng

- [ ] **`nguon_van_ban` của mỗi đoạn M13 trả về phải đi tới block.** FR-072 §1.1
  thêm trường `nguon_van_ban` (`than` · `hien-vat:text/vtt` · `hien-vat:text/plain`).
  Một đoạn từ transcript ASR không cùng hạng bằng chứng với một đoạn của bài viết
  (`FR-054 §1.4`: chữ *verified* đổi nghĩa ở đó), nhưng `data_flow §2` hôm nay chỉ
  có `trang_thai` do verify-quote quyết — cờ ấy đúng cho *quote có thật*, không nói
  *nguồn là gì*. Hệ quả nếu để nguyên: người đọc thấy `da-xac-minh` trên một câu
  ASR nghe nhầm mà không có dấu hiệu nào.
  `spec.md` FROZEN ⇒ đóng bằng **FR khi s7 M14 bắt đầu**, không mở lúc này.
  · object: `06_modules/M14_chatbot/data_flow.md §2` · `FR-072 §1.3` (tính chất 3)
  ⇒ **s7 M14**
- [x] `model_flow §2` + `diagram_flow §1` đổi theo FR-072 §1.1 (`doan[]` →
  `ket_qua[]`, thêm `nguon`, khoá chiều + aud). ✅ 2026-09-09 · object: hai file
  đó, worklog `WL-01KB41KEOTHEO`.

## Hai nợ nằm ở module KHÁC — ô `[ ]` không đặt ở đây

**a · Cờ `chua-xac-minh` phải được NHÌN THẤY.**
M14 chỉ bảo đảm cờ có trong **dữ liệu** (`AC-3.1`). Việc nó render **khác** block đã
xác minh là **AC của M03**. Nếu không ai viết AC bên đó thì lựa chọn của chủ dự án
(*gắn cờ từng khẳng định*, 2026-09-01) **mất hiệu lực mà không cổng nào đỏ** — hệ
vẫn bỏ im lặng, chỉ là bỏ trong mắt người đọc thay vì trong dữ liệu.
⇒ Ô thuộc `06_modules/M03_web/backlog.md`, cùng chỗ với ô C3 mở ngày 2026-09-02.

**b · Địa chỉ chưa bấm được.**
M14 trả `doc_id#anchor` từ đầu, nhưng tới khi **C3** xong thì địa chỉ là **chữ**,
không phải link — tức nguyên lý ③ NotebookLM (*verify tốn một cử động chuột*)
**chưa có hiệu lực**, dù dữ liệu đã đủ. Cùng ô C3 ở M03.

## Phép thử s6 đã chạy — 29/29 AC viết được testcase

`testcases.md` §cuối: **27/29 viết được ngay**; hai cái mơ hồ và **đã sửa hợp đồng**
cùng phiên 2026-09-02:

- `AC-8.1` — bỏ ngỏ ca payload có **CẢ** `bot` **LẪN** `nguon[]` ⇒ nay khai luật ưu
  tiên tường minh (`nguon[]` thắng) **và** buộc ghi log khi hai thứ cùng có
- `AC-4.3` — *"mọi lần bắn"* đọc được thành "chỉ lần thành công" ⇒ nay log **hai ca
  phân biệt được**: bắn được chấp nhận, và bắn **bị bỏ** vì thiếu điều kiện

Không mở ô cho chúng vì **đã đóng trong cùng lượt**.
