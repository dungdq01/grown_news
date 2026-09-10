# WO-076 — Loại nguồn video bị hiện vật dẫn xuất cướp nhãn · icon Douyin thật

- **Loại**: bug + cải tiến · **Module**: M03_web · **Mức**: hard
- Chủ dự án 2026-09-09, đếm bằng mắt trên `/video/`.

## 1 · Bộ lọc đếm sai — lỗi nặng nhất

Kho có **5 youtube · 2 facebook · 1 tiktok · 1 douyin**. Bộ lọc báo
**`tai-len 7 · douyin 1 · youtube 1`**.

`nguonCua()` có một dòng: *`b.media` không rỗng ⇒ `"tai-len"`*. Dòng ấy ĐÚNG
vào ngày nó được viết — thứ duy nhất nằm trong `media` của một video khi ấy là
byte mp4 người dùng tải lên. Từ đó `media` nhận thêm **hai loại hiện vật do MÁY
sinh**:

| | |
|---|---|
| `.vtt` | transcript (`T12-27`) |
| `image/*` | ảnh bìa (`WO-071` · `072` · `075`) |

Nên một video YouTube **vừa sinh transcript xong là tự đổi loại nguồn thành
"tải lên"**, và nguồn thật biến mất khỏi bộ lọc. Đúng 7 bản ghi có hiện vật
dẫn xuất — khớp con số `tai-len 7`.

⚠️ **Quy chủ**: KHÔNG phải lỗi do ảnh bìa. Nó có từ transcript đầu tiên; ảnh bìa
chỉ chạm thêm 3 bản ghi nữa, đủ nhiều để nhìn thấy bằng mắt.

**Sửa**: lọc bằng cờ `chi_dan_xuat` của bảng khai — cờ ĐÃ CÓ SẴN cho cả hai
loại, chỉ chưa ai đọc nó ở đây. Cùng phép lọc `xemTruocHienVat` dùng để chọn
hiện vật chính.

**Sau khi sửa** (đo trên màn thật): `youtube 5 · fb 2 · tiktok 1 · douyin 1`.
`tai-len` biến mất — đúng, vì kho chưa có video mp4 nào.

## 2 · Icon Douyin

`XUAT-XU.md` từng khai *"simple-icons không có mark Douyin nên giữ glyph video
chung"*. Vẫn đúng ở `16.30.0` (bản mới nhất). Chủ dự án chỉ nguồn khác:
`en.wikipedia.org/wiki/File:Douyin_logo.svg`.

Ba điều phải cân, ghi ở `public/icon/XUAT-XU.md`:

1. **Giấy phép khác hạng** — `PD-ineligible-USonly` + `Trademarked`, KHÔNG tự
   do ở Trung Quốc tới 2067 (nên nó không ở Commons). Bốn mark kia là CC0 toàn
   cầu. Dùng ở đây là *định danh nguồn*, cùng thông lệ — rủi ro thấp, không
   bằng không.
2. **File gốc là wordmark** 500×196 (nốt + chữ 抖音). Cắt lấy 7 path phần NỐT,
   giữ nguyên từng đường, chỉ đặt lại `viewBox` về bao của chúng.
3. **Lấy CẢ BA lớp** (cyan/magenta/đen). Đo bằng mắt ở đúng cỡ thẻ 99px: chỉ
   lớp đen thì **giống hệt TikTok** — hai host không phân biệt được, tức icon
   vô dụng đúng chỗ nó cần có ích. Hợp ba lớp còn viền lệch, phân biệt được.

## 3 · Và lỗi làm cả hai việc trên vô hình

Đổi icon xong, màn **vẫn hiện glyph cũ**. Server trả file mới, `fetch` thấy file
mới, mask vẫn cũ.

`/i/` gửi `cache-control: public, max-age=86400` **trần** — không `ETag`, không
`Last-Modified`, URL không mang version. ⇒ **đổi bất kỳ icon nào cũng không tới
người dùng trong 24 giờ, và không có dấu hiệu nào cho biết vì sao.**

Sửa: `ETag` theo `mtime`+`size` + `max-age=300`. Nghiệm thu: `If-None-Match`
đúng ⇒ **304**, sai ⇒ **200**.
