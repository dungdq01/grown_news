# M05_intake — ui flow

**Không có màn.** Giao diện là **thư mục** — thả file vào `_inbox/`.

| Thao tác | Cách | Kết quả |
|---|---|---|
| Nạp | copy `.md` vào `_inbox/` | — |
| Chạy cổng | `python -m intake _inbox/` | vào kho, hoặc `.rejected.md` |
| Xem vì sao trượt | mở `<tên>.rejected.md` | danh sách trường thiếu ở đầu file |
| Sửa và thử lại | sửa file gốc, chạy lại | — |

Chọn thư mục thay vì giao diện là chủ ý: thả file là thao tác đã quen, không cần
học gì mới, và nó hợp với chỗ file đến từ đâu (tải về từ chat với agent khác).

## Lỗi phải nói được cách sửa

Trả lại mà chỉ ghi *"không hợp lệ"* thì người phải đoán. Format bắt buộc:

```
THIẾU: id, slug, credibility_max
SAI:   citations_sampled = 0, cần >= 2 (origin: external)
SỬA:   mở 2 link bất kỳ trong bài, xác nhận trích dẫn khớp, rồi điền
       citations_sampled và citations_verified
```

Cùng nguyên tắc với `validate.py`: cổng chặn phải kèm cách qua cổng.
