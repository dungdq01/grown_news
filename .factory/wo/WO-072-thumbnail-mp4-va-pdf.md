# WO-072 — ảnh bìa cho mp4 trong kho và PDF; và LUẬT "chỉ khi CHƯA có nền"

loại: cải tiến (task C của `PLAN-2026-09-09`)
module: M12_chungcat · M08_api
mức: hard
chỉ đạo: *"note là video/url loại nào ko có nền mới áp dụng nhé — khảo luôn tiktok douyin, mp4, other luôn"*

## KHẢO — mọi loại nguồn, ảnh bìa lấy được từ đâu

| loại | nguồn | ảnh lấy từ đâu | hôm nay |
|---|---|---|---|
| video | **youtube** | `i.ytimg.com/vi/<id>/hqdefault.jpg` — đoán từ id | ✅ lớp 2, 0 lời gọi |
| video | **tiktok** | `yt-dlp --write-thumbnail` | ✅ WO-071 (chưa có mẫu thật trong kho) |
| video | **facebook** | `yt-dlp` | ✅ WO-071 — **nghiệm thu thật**, ảnh 45 591 byte |
| video | **douyin** | `yt-dlp` | ✅ WO-071 (chưa có mẫu thật) |
| video | host **NGOÀI** allowlist | — | ✗ icon. Cố ý: `AC-V4` cấm gọi host chưa khai |
| video | **mp4 byte trong kho** | `ffmpeg -ss -vframes 1` | ← **WO này** |
| tài liệu | **pdf** | `pypdfium2` trang 1 | ← **WO này** |
| tài liệu | docx · pptx · doc · ppt | cần LibreOffice/Word — **không có** trong hệ | ✗ icon, và nói thẳng vì sao |
| tài liệu | md · txt | không có gì để render thành ảnh | ✗ icon — đúng bản chất |
| bài viết | article · repo · paper · docs · announcement | không có hiện vật nào | ✗ icon |

Đo kho thật 2026-09-09: 6 video **đều đã có ảnh thật** (5 ytimg + 1 kho) ·
2 tài liệu (1 pdf, 1 md) · 1 article · 1 repo — tất cả đang icon+màu.

⇒ WO này thêm được ảnh cho **1 bản ghi** đang có (PDF). Nói ra để không ai
tưởng nó đổi cả kho.

## LUẬT: chỉ áp khi CHƯA CÓ NỀN — một phép quyết, không hai

Chỉ đạo của chủ dự án. Chỗ dễ sai: hai bên (LÕI xếp việc · THỢ chạy việc) mỗi
bên tự quyết thì chúng sẽ lệch, và lệch ở đây nghĩa là **gọi ra Internet cho
một bản ghi đã có ảnh** — tốn lời gọi, và ghi đè một ảnh đang đúng.

⇒ MỘT hàm `chienLuocAnhBia(fm)` trả về `null` | `"url"` | `"khung"` | `"pdf"`.
LÕI dùng nó để quyết CÓ XẾP việc không; THỢ dùng CHÍNH nó để quyết chạy nhánh
nào. Trả `null` khi:

- `media[]` đã có `image/*` — **đã có ảnh thật, không đụng**
- host là YouTube — ytimg đã cho ảnh, một job ở đây là lời gọi không mua gì
- không hiện vật nào dùng được và url không thuộc allowlist

## Cái WO này KHÔNG làm

- **không** sinh lại ảnh đã có. Sinh lại là việc NGƯỜI bấm, và nút đó chưa có.
- **không** render docx/pptx — thêm LibreOffice vào hệ là một quyết định khác
  hẳn về phụ thuộc, và nó cần chủ dự án.
