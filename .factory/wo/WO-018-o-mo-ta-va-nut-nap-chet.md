# WO-018 — ô mô tả cho tài liệu/video · nút nạp chết trên màn nạp

loại: thiếu tính năng + bug điều hướng + một dòng chữ NÓI DỐI
module: **M03_web** (`shell.html` · `trang.mjs` · FE) · M10_tailieu · M11_video
mức: người dùng THẤY được cả ba

## Người dùng nói (2026-08-28, kèm 4 ảnh)

> 1 · khi upload tài liệu hay video thì cần thêm 1 số fields như viết bài: gán
>     category, gán concept, **mô tả — description**
> 2 · lỗi UI nút "nạp" · khi tôi chọn 1 trong mục nạp bài / video / tài liệu thì
>     button đăng ký / nạp **bị switch và ko back lại được** nút ban đầu

## Gốc, đo được

**(1) Ba màn nạp có ba bộ ô khác nhau, và hai bộ thiếu mô tả:**

| màn | ô nhập | ô nhãn |
|---|---|---|
`v-napbaiviet` | `f-title` `f-1l` `f-url` `f-type` `f-ngay` `f-id` `f-slug` `f-cred` `f-conf` … **`f-than`** | `f-cat` `f-cpt` |
`v-naptailieu` | `tv-1l` `tv-slug` | `tv-cat` `tv-cpt` |
`v-napvideo` | `vd-url` `vd-1l` `vd-slug` | `vd-cat` `vd-cpt` |

Chỗ đúng cho mô tả là **thân bài**, không phải một trường mới: bài viết đưa
`f-than` vào body, còn hai đường kia gửi `body: motCau` — tức **lặp lại câu tóm
tắt**. Thêm ô mô tả là ngừng lặp, và **không chạm `frontmatter.schema.json`**
(file duy nhất đang FROZEN trong `core/assets`).

Ô nhãn `tv-cat`/`vd-cat` **đã có** (WO-016) nhưng nằm trong khối `#tv-meta` /
`#vd-meta` mang `hidden` — chỉ hiện sau khi chọn file / dán URL. Người dùng mở màn
không thấy chúng, nên "cần thêm" là đúng ở tầng NHÌN THẤY.

**(2) Nút nạp trên màn nạp trỏ vào CHÍNH TRANG ĐANG ĐỨNG.** `man-hinh.json` khai
`nap-tai-lieu` với `module: tai-lieu`, và `nutNap()` tìm "màn nạp của module này"
⇒ trên `/tai-lieu/nap/` nó giải ra `nap-tai-lieu`. Nút chết: bấm không đi đâu, và
không có đường sang lối nạp khác. Đúng câu *"bị switch và ko back lại được"*.

**(3) MỘT DÒNG CHỮ TÔI VIẾT ĐANG NÓI DỐI.** Dải lối video ghi
`youtube · tiktok · douyin · bilibili`, còn `media-mime.json` chỉ có **hai** host:
`youtube.com` và `tiktok.com`. Dán link douyin ⇒ 422, và người dùng đọc màn thấy
nó được nhận. Sửa bằng cách **dẫn xuất dòng đó từ whitelist**, không gõ tay —
gõ tay là cách nó nói dối lần nữa.

## Kỳ vọng

1. Hai màn nạp có ô **mô tả**, và giá trị đó vào thân bài (không lặp câu tóm tắt)
2. Ô chủ đề + khái niệm **nhìn thấy được ngay khi mở màn**, không đợi bước sau
3. Trên màn nạp, nút header mời **các lối nạp khác** và đánh dấu lối đang mở —
   không phải một nút trỏ vào chỗ đang đứng
4. Dòng liệt kê nơi phát/định dạng **dẫn xuất từ bảng khai**, không gõ tay
5. Menu `+ nạp` đọc được trên cả hai theme (ảnh 4: panel trắng trên nền sáng)

## Ràng buộc

- `gn.js` dư **355 byte**. Ô mô tả là HTML; đọc giá trị nó thêm ~2 dòng JS.
  Vượt trần ⇒ siết, **không nới**.
- `TRAN_TU_THU_VIEN` giới hạn số từ thân bài của hồ sơ `thu-vien` — ô mô tả phải
  nói ra giới hạn đó, không để người dùng gõ xong mới bị 422.
- Chữ trên màn qua `chu-giao-dien`: ≤80 ký tự/đoạn, ≤480 ký tự/trang, không tên
  trường/module trong chữ hiện ra.
