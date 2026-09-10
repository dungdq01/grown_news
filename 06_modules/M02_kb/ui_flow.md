# M02_kb — ui flow

**Module này không có màn nào.** Nó là hợp đồng dữ liệu, không phải thứ người dùng
nhìn thấy.

Màn hiển thị nội dung `kb/` thuộc **M03_web** (`SCR-00` → `SCR-03`).

Ghi file này ra để không ai đi tìm — trống là **có chủ ý**, không phải quên.

## Một ngoại lệ đáng nói

Thao tác duy nhất người làm trực tiếp trên `kb/` là **đổi `review_status` thành
`approved`** — từ FR-011 nó có HAI bề mặt, vẫn một cổng người:

1. **Editor + commit** — như cũ, luôn chạy được.
2. **Cửa sổ đọc trên web** — khi API biên tập local (M08) đang chạy: người mở
   bài, đọc, rồi khai 3 trường M1 vào form duyệt. Endpoint không có default nào
   để tự điền (M08-R3) — máy vẫn không tự duyệt được.

Bundle web tĩnh (deploy) vẫn không ghi gì. Màn *Chờ duyệt* không có API vẫn
chỉ **hiện danh sách** như trước.
