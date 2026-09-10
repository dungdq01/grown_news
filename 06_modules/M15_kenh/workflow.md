# M15_kenh — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — ba lý do ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước.

## 1 · Ba chỗ M15 khác trình tự chuẩn

**a · Đất trắng.** `kenh/` chỉ có README. Mỗi đơn vị: **viết cổng → đỏ vì LUẬT →
viết mã**.

**b · Một cổng KHÔNG grep được.** `AC-1.1` (0 cổng listen) phải canh bằng **quan
sát tiến trình đang chạy** (`netstat`), không bằng đọc mã — một cổng có thể do một
**thư viện** mở mà mã ta không nhắc tên. Nên `kenh/tests/` cần một fixture **chạy
thật**, không phải một phép grep. Đây là cổng duy nhất của cả dự án có hình dạng đó.

**c · BỐN cửa của LÕI chưa có, và có một đường đi vòng đang mở.**
`FR-047` (đã duyệt) mở `C1` `POST /api/nhap` · `C3` tra `dinh_danh_kenh` · `C5` ghi
`audit_log`. Cho tới khi ba cửa đó tồn tại, **M15 không thi công được** — và đường
duy nhất đang có là `POST /api/articles`, cửa của **người**, đặt `approved` **vô
điều kiện**.

⚠️ Chia task M15 trước khi `FR-047` thi công ⇒ người làm **sẽ** dùng cửa đó, và
`M05-R1` mất trong khi mọi cổng vẫn xanh. Đây không phải cảnh báo chung — là một
đường cụ thể, có tên, đang mở.

## 2 · Thứ tự trong module

```
1. bảng khai kenh.json + lenh.json (host · trần file · nguồn + ngày tra)  ← 0 phụ thuộc
2. adapter Telegram — CHỈ kéo tin + gửi tin, chưa logic                    ← cần 1
3. xác thực: hỏi LÕI "chat_id → tài khoản"                                ← cần FR-047 C3
4. dịch lệnh → gọi API (bảng khai, không if)                              ← cần 2 + 3
5. nạp nội dung → POST /api/nhap                                          ← cần FR-047 C1
6. audit mọi tin vào                                                      ← cần FR-047 C5
7. đông cứng MẪU SỐ của M8.2 (tổng dòng kenh/ lúc chỉ có Telegram)         ← cần 1-6 xong
8. adapter Discord — đơn vị việc RIÊNG, và là PHÉP ĐO                     ← cần 7
```

**Bước 7 là một hành động, không phải một ghi chú.** Mẫu số của `M8.2` phải được
**ghi vào bảng khai** đúng lúc kênh thứ nhất đóng — sau đó nó không đổi nữa. Không
đông cứng thì kênh thứ ba làm mẫu số phình và tỉ lệ **luôn đạt**, tức cổng chết.

**Bước 8 là PHÉP ĐO, không phải tính năng.** `build_order` C9 nói rõ: nếu Discord
tốn > 20% thì luận điểm *"core xong trước thì kênh rẻ"* **sai**, và chỗ sửa là
**tách M14 khỏi web**, không phải viết adapter gọn hơn.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py
python core/tests/check_ba.py
python core/tests/check_rule_surfaces.py
# + đúng `cmd` của AC trong đơn vị đó
```

## 4 · Chỗ DỪNG riêng của M15

- định dùng `POST /api/articles` để nạp ⇒ **DỪNG** — đó là cửa của người
- định giữ một danh sách `chat_id` trong `kenh/` ⇒ DỪNG (`M15-R3`)
- một adapter vượt **300 dòng** ⇒ DỪNG, nghiệp vụ đang rò ra BIÊN
- định mở một cổng "cho tiện" (webhook Zalo/FB) ⇒ DỪNG, đổi hạng cả dự án
- định thêm kênh không có **bề mặt chính thức** ⇒ DỪNG (`M15-R6`)
- `M8.2` vượt 20% ⇒ DỪNG và **báo**, đừng tối ưu adapter — số đó đang nói về M14
