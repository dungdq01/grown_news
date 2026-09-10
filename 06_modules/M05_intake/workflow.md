# M05_intake — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mọi đơn vị việc
của M05 là *một luật của cổng gác cửa*, viết được thành fixture đỏ trước.

Ba chỗ áp riêng — **không** phải bước mới:

**③ MÔ PHỎNG — `INBOX_DIR` và `KB_DIR` trỏ THƯ MỤC TẠM, luôn luôn.** Trước
2026-08-24 hai đường này là **cứng** trong `gate.py`, nên mọi phép kiểm sẽ ghi
vào `_inbox/` và `kb/` **thật** — và đó là lý do đường ghi này *"không ai dám
viết test cho nó"*, và là lý do bug ghi-đè sống lâu. Hai biến môi trường đó
**là** thứ cho phép nhịp ③ tồn tại ở module này.

**③b Ca phải mô phỏng TRƯỚC mọi ca khác: nạp TRÙNG.** `dich.write_text()` không
kiểm tồn tại; sửa `one_liner` một bài trên web rồi chạy gate ⇒ dòng sửa **biến
mất, không cảnh báo**. Cùng một kho mà M08 có `_recycle/` + 409 còn đường này
từng không có gì — hai mức bảo vệ cho một tài sản.

**④ CODE — DÙNG LẠI `validate.check()`, không copy.** M05-R3. Hai bản kiểm sẽ
lệch nhau, và cái lệch không ai thấy: cả hai đều xanh trên đầu vào bình thường.
Phép thử là **có `import`**, không phải *"trông giống"*.

## Thứ tự bốn/năm việc là một phần của hợp đồng

```
① đọc _inbox/*.md (KHÔNG đệ quy)
② validate bằng schema SẴN CÓ        → thiếu ⇒ trả lại DANH SÁCH, không tự điền
③ đòi citations_sampled ≥ 2
④ INSERT vào kho ở `draft`, origin: external   → đã có (source_type, slug) ⇒ TRẢ LẠI
⑤ đổi tên <ten>.da-vao-kho.md        → ĐỔI TÊN, không unlink
```

Đảo ④ và ⑤ đổi hành vi ở ca lỗi: đổi tên trước rồi INSERT thất bại ⇒ bài **không**
vào kho mà file **đã** đánh dấu đã-vào-kho, tức mất bài im lặng. Bỏ ⑤ ⇒ **mỗi**
lần chạy gate xử lý lại từ đầu, và đó **chính là cơ chế** của bug ghi-đè.

⚠️ Thứ tự này chưa có cổng nào canh. Spec kể nó bằng một bảng.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| luật kiểm nội dung · `count_words` | **M01** — M05 `import`, không copy (M05-R3) |
| hợp đồng schema | **M02** — đổi ⇒ FR tới M02 |
| `POST /api/inbox` end-to-end | **M03** (`T03-5 AC7`) — `server.mjs` chỉ *gọi* gate; R1: đơn vị test là đơn vị riêng |
| bản cũ thành `.v<n>.md` | **M02 §2.5** (re-analyze) — **không** phải hậu quả của một lần nạp trùng |
| `_recycle/` + 409 | **M08** — hai bề mặt cùng bảo vệ một kho |
