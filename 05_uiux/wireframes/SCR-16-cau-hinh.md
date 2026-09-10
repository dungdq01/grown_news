# SCR-16 · Cấu hình — [Q] read-only, trỏ file

> Ma trận §2 hàng 5 · mock: `prototype/dot-hai/cau-hinh.html`.
> Tiền lệ: VS Code settings hiển thị nguồn.

## Bố cục

Hai panel bảng read-only: (1) model theo tác vụ × ngôn ngữ — kèm cột dự phòng
CÙNG KHU VỰC pháp lý (tiếng Trung → kimi/deepseek; ngôn ngữ do MÁY đếm tỉ lệ
ký tự, model không tự khai); (2) trần & ngưỡng (thử lại 2 · trần file kênh ·
quota giọng đọc).

## Luật riêng

- KHÔNG form. Một ô sửa được trên UI là một đường ghi ngoài review — bảng khai
  trong repo là nguồn, mỗi bảng kèm dòng "sửa ở: <file>".
- Model thật dùng ghi vào vết từng lần gọi — cấu hình chỉ là ý định.

## Ba state

empty: bảng khai thiếu → chỉ đường tạo file · loading: — (đọc từ SSR) ·
error: bảng khai không parse được → nguyên văn lỗi + đường file.
