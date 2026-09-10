# SCR-14 · Hàng đợi duyệt — [Q] nháp AI (FR-046: nháp sống trong DB)

> Contract: `chungcat.sample.v2.json` khối `nhap[]` (ban_goc_ai bất biến ·
> ban_hien_tai · khang_dinh_bi_tia) · ma trận §2 hàng 2 · mock:
> `prototype/dot-hai/hang-doi-duyet.html`. Tiền lệ: Linear Triage 2 cột.

## Bố cục

```
+ trái 1/3: list nháp -------+ phải 2/3: xem + hành động ----------+
| badge trạng thái (nháp ·   | tiêu đề · badge · X/Y địa chỉ đối   |
| đã sửa · trả lại · đã vào  | chiếu · đã tỉa N (+lý do)           |
| kho) + tên + mã việc       | nội dung bản hiện tại               |
|                            | [khác gì bản AI?] → diff del/ins    |
|                            | [Duyệt→vào kho][Sửa][Trả lại][Xoá]  |
```

## Luật riêng

- Bản-AI-gốc BẤT BIẾN — diff luôn trả lời "người đã đổi gì"; chưa sửa thì diff
  nói "trùng bản AI gốc" chứ không im.
- "Đã tỉa N khẳng định" hiện TRƯỚC khi duyệt — bài trông hoàn chỉnh mà không
  khai đã tỉa là nói dối người duyệt.
- Duyệt = kiểm chặt tự động chạy trước, pass mới ghi FILE vào kho — toast nói
  thẳng: "file giờ là chân lý; bản DB thành lịch sử". Không đường tự vào kho.
- Trả lại bắt kèm lý do — lý do hiện lại trên item để lần chưng sau biết.

## Ba state

| state | hiện |
|---|---|
| empty | "không nháp nào chờ — chưng cất từ cửa sổ đọc hoặc màn Tài liệu" |
| loading | list skeleton một nhịp |
| error | kiểm lỗi lúc duyệt: nguyên văn từng cổng đỏ, nháp GIỮ NGUYÊN trạng thái |
