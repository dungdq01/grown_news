# WO-032 — `referrerpolicy="no-referrer"` làm YouTube trả Lỗi 153

loại: bug — người dùng THẤY được, tính năng xem video không dùng được
module: **M03_web** (`web/plugins/multiwindow/**`)
mức: mở bất kỳ video YouTube nào cũng ra khung lỗi thay vì trình phát

## Người dùng báo (2026-08-29, kèm ảnh)

Mở cửa sổ đọc của video vừa đăng ký ⇒ khung nhúng hiện:

> **Xem video trên YouTube** · **Lỗi 153** · *Lỗi cấu hình trình phát video*

## Nguyên nhân

`nhungVideo()` đặt:

```js
f.setAttribute("referrerpolicy", "no-referrer")
```

YouTube **từ chối phát** khi khung nhúng không gửi `Referer` — đó chính là lỗi
153. Ý định riêng tư là thật (đừng rò địa chỉ trang đang đọc), nhưng nó tắt luôn
tính năng.

## Đo được — HAI KHUNG CẠNH NHAU, cùng một video, cùng một trang

Dựng một trang tĩnh có hai `<iframe>` trỏ cùng
`https://www.youtube-nocookie.com/embed/85kbC_s8Ldg`, khác đúng một thuộc tính,
rồi chụp màn hình bằng trình duyệt thật:

```
A · referrerpolicy="no-referrer"   →  Error 153 · Video player configuration error
B · referrerpolicy="origin"        →  video nạp bình thường (thumbnail + nút play)
```

Một biến, hai kết quả. Không phải suy luận.

## Kỳ vọng

`referrerpolicy="origin"` — **chặt nhất trong những giá trị còn chạy được**:
gửi `http://localhost:8787` chứ KHÔNG gửi đường dẫn trang đang đọc. Mặc định của
trình duyệt (`strict-origin-when-cross-origin`) cũng chạy nhưng rộng hơn không
cần thiết.

## KHÔNG đổi

`youtube-nocookie.com` giữ nguyên — nó là thứ chặn cookie theo dõi, và nó không
liên quan tới lỗi 153. M09-R3 giữ nguyên: `src` vẫn chỉ dựng từ whitelist + regex
id.
