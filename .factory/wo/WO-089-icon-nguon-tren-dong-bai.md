# WO-089 · Bìa dòng bài ở `/chung-cat/` phải mang ICON CỦA LOẠI NGUỒN

| | |
|---|---|
| **Loại** | cải tiến UI · M03_web |
| **Mức** | `soft` — thẩm mỹ + nhận diện, không chặn việc |
| **Mở** | 2026-09-10, chủ dự án: *"icon của tab bài viết ở chưng cất dùng luôn icon của loại nguồn tương ứng. ví dụ: 'Doanh nghiệp một người…' — đây thuộc loại nguồn youtube → icon youtube"* |

## Repro

Ảnh 2026-09-10: ô bìa 40px của mỗi dòng bài **trống trơn**.

## Gốc

`WO-086` đặt `data-i="${ccLoaiNguon(g.slug)}"`, tức lấy **tiền tố slug** —
`video` · `tai-lieu` · `article`. Nhưng bảng icon trong `prototype.css:939+`
khai theo **loại nguồn**, không theo tiền tố slug:

```
[data-i=youtube] · [data-i=tiktok] · [data-i=fb] · [data-i=md]
[data-i=pdf] · [data-i=docx] · [data-i=pptx] · [data-i=txt]
```

`video` không có trong bảng ⇒ `::before` không có `mask-image` ⇒ ô trống.
(`public/icon/` có sẵn **19** `.svg`, gồm cả `youtube` · `tiktok` · `douyin`.)

## Vì sao FE phải TỰ suy, không đọc sẵn

Phép của SSR là `nguonCua(b)` (`trang.mjs:1464`) — không tới được chunk FE.
Và trường `nguon` trong `open-index` **không phải** thứ đó: đo được nó là một
**mảng** nguồn (`nguon: []`), không phải khoá icon.

FE có sẵn nguyên liệu: `MEDIA.video_host[].mien` để khớp host, và
`MEDIA.loai[].mime → duoi` cho tài liệu.

## Kỳ vọng

- Video có host trong whitelist ⇒ icon của host (`youtube` · `tiktok` ·
  `douyin` · `fb`).
- Tài liệu ⇒ icon theo đuôi hiện vật đầu (`pdf` · `docx` · `pptx` · `md` · `txt`).
- Không khớp gì ⇒ lùi về `source_type`, và nếu vẫn không có icon thì ô trống —
  **không** được vỡ.
- Dùng `idVideo` KHÔNG đủ: nó trả `null` khi regex id không khớp, nên một URL
  youtube lạ dạng sẽ mất icon dù host đúng. Khớp **host** tách khỏi việc bóc id.
- Đi qua cầu `__GN_MW__`, không tải chỉ mục bản thứ hai (`WO-085` đã chốt).

## Ngoài phạm vi

- Ảnh bìa thật (thumbnail) thay cho icon — đã có ở thẻ kho, chưa xin cho dòng này.
