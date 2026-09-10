# WO-086 · Vẽ lại `/chung-cat/` — dòng bài + đường ống, nhóm theo mốc ngày

| | |
|---|---|
| **Loại** | cải tiến UI (thay bản `WO-085`) · M03_web |
| **Mức** | `hard` — người dùng THẤY |
| **Wireframe** | `05_uiux/wireframes/SCR-26-hang-viec-duong-ong.md` — **ĐÃ DUYỆT** 2026-09-10 (*"A và C được đấy"*) |
| **Mở** | 2026-09-10, chủ dự án: *"design không ổn: vẽ lại wireframe, tôi ko chấp nhận kiểu list menu design cổ hủ như thế"* |

## Vì sao WO này tồn tại — bản trước là của tôi

`WO-085` trả lời đúng câu hỏi nhưng bằng **một `<h3>` chen vào lưới phẳng**
(vách ngăn, không phải bố cục) và **thêm hàng nút thứ ba** vào một màn đã có
hai hàng. Chủ dự án từ chối, đúng.

Không revert `WO-085`: phép gộp theo bài (`ccNhom`) và phép tra tiêu đề
(`tenBai` qua cầu) là nền của bản mới. Cái bị thay là **cách vẽ**.

## Kỳ vọng

### A · Dòng bài + đường ống

- Một bài = MỘT dòng: bìa 44px (màu theo `source_type`) · tiêu đề · meta
  (`n việc · model · giờ`) · dải chặng.
- Mỗi chặng là một việc, bốn trạng thái đọc bằng màu: `✓ xong` · `● đang chạy`
  (vàng) · `✕ hỏng` (đỏ) · `chưa có` (mờ).
- Bấm chặng mở đúng việc ấy; chặng `chung-cat` đã xong mở thẳng bản nháp.

### C · Mốc ngày

- Tiêu đề nhóm `Hôm nay · Hôm qua · <mm-dd>`, kèm số việc của mốc.
- Trong mỗi mốc, bài xếp theo việc mới nhất.

### Ba hàng nút biến mất

- Hàng `tất cả · chờ · đang chạy · dừng · xong` — **bỏ**.
- Hàng `mới nhất · cũ nhất` + `hôm nay · 7 ngày · 30 ngày` (`WO-085` thêm
  sáng nay) — **bỏ**.
- `<h3>` gộp bài — **bỏ**, hàng chính là nó.

Khả năng lọc trạng thái KHÔNG mất: ba số tổng kết đã có sẵn dưới thanh tiến
trình (`xong · cần xử lý · chờ`) thành chỗ bấm. Đó là bản tóm tắt vốn đã ở đó,
nay bấm được — không phải hàng nút thứ tư. (`SCR-26 §2.1` — chủ dự án bác được.)

## Bẫy đã đo trước, phải chặn bằng cổng

1. **`capNhin` neo cứng `.cd`** (`multiwindow:1765`). Đơn vị bị cắt nay là DÒNG
   BÀI. Không cho nó nhận selector thì trần `WO-082` **im lặng ngừng chạy** và
   không cổng nào báo — đúng lớp lỗi `cong-xanh-vi-neo-sai`.
2. **Ba cổng đang đọc `ccThe`**: `the-viec-noi-ro-loai` (đo `tenLoai(...)`) ·
   `viec-theo-loai` + `ban-cu-vao-rac` (đo `data-ccnhap`). Chuyển `ccThe` thành
   bộ vẽ CHẶNG giữ được **cả hai** một cách tự nhiên — nên chúng phải VẪN XANH,
   không được dời.
3. **Tổng kết** vẫn nói về cả hàng đợi (`WO-015/BUG-2`).

## Ngoài phạm vi

- Tab `Kết quả` và `Thùng rác`.
- Hướng B (kanban) — đã cân nhắc và loại, lý do ở `SCR-26 §4`.
