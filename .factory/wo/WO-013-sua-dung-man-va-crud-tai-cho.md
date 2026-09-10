# WO-013 — Sửa một bản đưa sang màn của MODULE KHÁC; CRUD chỉ ở cửa sổ đọc

loại: bug hiển thị + cải tiến
module: **M03_web** (`multiwindow.inline.ts` · shell) · M10_tailieu · M11_video
mức: người dùng THẤY được — vi phạm luật thường trực *"ko gộp chung các màn"*

## Repro

`npm run api`, mở `/tai-lieu/`, bấm một thẻ tài liệu để mở cửa sổ đọc, bấm **Sửa**.
⇒ Màn nhảy sang **`/bai-viet/nap/`** (màn nạp BÀI VIẾT), và form viết bài mở ra
với nội dung của một tài liệu.

Gốc: `suaTuCua()` gọi `doiView("napbaiviet")` **không điều kiện**
(`multiwindow.inline.ts`, khối `suaTuCua`).

## Ba điều, và MỘT điều đã bị bác bỏ

**1 · Sửa đưa sang màn của module khác.** Thấy được, và đúng thứ người dùng cấm.

**2 · Form sửa không có ô `media`.** Người dùng không xem được hiện vật đang gắn,
không thay được nó. Đây là **thiếu tính năng**.

**3 · CRUD chỉ ở chân cửa sổ đọc.** `bam()` có `const win = t.closest(".bk"); if
(!win) return`, nên mọi `data-act` bắt buộc nằm trong `.bk`. Muốn sửa/xoá một thẻ
trên màn danh sách thì phải mở cửa sổ đọc trước.

**ĐÃ BỊ BÁC BỎ — plan nói sai:** *"dễ mất `media` im lặng"*. Đo trên kho tạm:
`guiFormThat` bắt đầu bằng `{...FM_GOC}` nên `media` đi qua nguyên vẹn (PUT 200,
`media` sau BẰNG trước từng ký tự); và ca `FM_GOC = null` trả **422** vì schema
đòi `media` cho `ho_so: thu-vien`. Kho được bảo vệ bằng CẤU TRÚC. Không có mất
dữ liệu nào để sửa.

## Kỳ vọng

- Sửa một bản ⇒ về màn nạp **của module bản đó**, đích đọc từ `man-hinh.json`
- Form sửa tài liệu có ô hiện vật (xem tên + kích cỡ, thay được)
- CRUD trên màn danh sách, bắt **TRƯỚC** dòng `.bk` guard

## Ràng buộc ĐO ĐƯỢC — cứng hơn mọi ràng buộc trước

`gn.js` = **102395 / 102400 byte, dư 5**. Mục 2 và 3 thêm FE ⇒ **không còn chỗ**.
Lựa chọn: **tách bundle** (tải theo màn) hoặc **siết một khối cũ**. KHÔNG nới
trần — `page-weight:85-89` có tiền lệ "SIẾT, không nới".

Mục 1 gần như miễn phí (thay một hằng bằng một phép tra), nên nó đi TRƯỚC và
tách thành đơn vị riêng.
