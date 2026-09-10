# FR-081 — M14: bot = MỘT NÚT trên cây (gốc · space · lớp), thay "bot → tập doc_id"

- **mở**: 2026-09-09 · **người mở**: PM-Space · **trạng thái**: **ĐÃ DUYỆT**
  2026-09-10 — chủ dự án (*"tôi duyệt"*). ÁP KHI M14 VÀO s6: sửa spec M14
  (FROZEN) rồi **NGƯỜI ký `check_frozen --ky`** — agent không ký.
- **artifact chạm**: `06_modules/M14_chatbot/spec.md` (**FROZEN**) — `AC-8.4`,
  `AC-8.5`, §216-219
- **review**: PM-M13 (checklist song song §1 — M14 là đất cả hai cùng chờ)

## Vì sao

`ADR-09` (ĐÃ DUYỆT) chốt mô hình hai tầng: **Space** là container, **M19** là
cấu trúc có thứ tự bên trong. Chủ dự án phán 2026-09-09: *"bot admin cover
all vũ trụ, sau đó có bot vũ trụ, bot lớp học / bài học"*.

Spec M14 hiện khai *"bot → tập `doc_id`"* tự do. Hai vấn đề đo được:
1. Tập doc_id tự do **không biết ranh giới space** ⇒ một bot có thể trỏ tài
   liệu hai vũ trụ mà không ai khai điều đó ở đâu — đúng thứ checklist review
   ADR hỏi: *"chatbot space A có trích dẫn được space B không? Phải là KHÔNG"*.
2. Ba loại bot (admin · vũ trụ · lớp) sẽ thành **ba cơ chế** nếu không gộp —
   cùng lớp nợ mà ADR-09 §2 vừa tránh.

## Chốt đề nghị

- Bot khai **`nut`**: `goc` | `space:<slug>` | `lop:<id>`; tri thức = mọi thứ
  DƯỚI nút đó, cộng `nguon[]` tuỳ chọn **hẹp hơn** (không bao giờ rộng hơn).
- `AC-8.4` (hàm giải MỘT chỗ) giữ nguyên tinh thần, đổi đầu vào: giải từ
  `nut` (+`nguon[]`) ra tập `doc_id` — **một** hàm, và nó là chỗ duy nhất
  biết cây.
- Bot KHÔNG nhìn ngang: nút `space:tech` không bao giờ trả doc của `space:sport`
  — cổng R4 (`T04-91`) mở rộng thêm một vế cho đường chatbot khi M14 vào s8.

## Mở khoá

M14 vào s6/s7 với hình dạng bot đã khớp Space; `pham_vi` của M13 giữ vai
"lọc lúc hỏi" (hai trục, không thành ba).

## Không làm

Không đổi `pham_vi` của M13 · không mở `space_member` · không cho bot nhìn
xuyên space (kể cả bot `goc` cũng phải khai rõ space trong mỗi trích dẫn).
