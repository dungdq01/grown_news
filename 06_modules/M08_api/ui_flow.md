# M08_api — ui flow

M08 không sở hữu màn nào — FE thuộc M03 (`fe: null`). File này tả **hợp đồng
thao tác**: nút nào trên màn của M03 gọi endpoint nào, và khi nào nút được sống.

## Feature-detect — control ghi ẩn mặc định

FE gọi `GET /api/health` đúng một lần lúc khởi động. 200 ⇒ thêm class `api-co`
lên `<body>`; mọi control ghi (Duyệt/Loại/Sửa/Xoá/Tạo bài) chỉ hiện khi có class
đó. Không có API (site tĩnh thuần, hoặc deploy) ⇒ control ghi không tồn tại với
người dùng — đúng AC-2.5.1.

## Màn Chờ duyệt (SCR-02 vùng queue) — nút duyệt THẬT

```
danh sách draft/edited ──bấm "Duyệt"──> form 3 trường M1 (bắt buộc, không prefill)
                                          insight_new · skill_installed · review_minutes
                                          ──gửi──> PATCH /:type/:slug/status {to: approved}
                       ──bấm "Loại"───> ô reject_reason (≥5 ký tự)
                                          ──gửi──> PATCH {to: rejected}
```

422/409/412 ⇒ hiện **nguyên văn** THIẾU/SAI/SỬA từ validate — cổng nói gì hiện
đúng thế. Sau 200 ⇒ re-GET danh sách + nhắc *"trang đọc là bản build — chạy
`npm run build` để thấy bài trên site"*.

## Màn bài viết / Tất cả — Sửa và Xoá

- **Sửa**: mở form frontmatter + body, gửi `PUT` kèm `If-Match` etag đã đọc.
  412 ⇒ "bài đã đổi ở nơi khác — tải lại rồi sửa tiếp", không ghi đè mù.
- **Xoá**: xác nhận ⇒ `DELETE` ⇒ bài vào thùng rác, biến khỏi danh sách API ngay.
- **Thùng rác**: `GET /api/recycle` + nút restore từng bài (409 nếu kb đã có).

## Màn Nạp nguồn (v-nap) — ba lối ngang hàng, không phải ba bước

| Lối | Đường | Trạng thái |
|---|---|---|
| A — dán link cho distiller | chép lệnh CLI (như cũ) | luôn sống, không cần API |
| B — nộp file agent sinh | kéo-thả → `POST /api/inbox` → gate (FR-010) | cần API |
| C — tự viết bài | form đủ trường schema → `POST /api/articles` | cần API |

Lối C: server áp `origin: manual` + `draft` — người viết KHÔNG chọn được trạng
thái ở bước tạo. Form không tự điền trường quyết định nào; `concepts` chọn từ
danh mục (đọc qua API), không gõ tự do — gõ tự do vào `concepts_proposed`.
