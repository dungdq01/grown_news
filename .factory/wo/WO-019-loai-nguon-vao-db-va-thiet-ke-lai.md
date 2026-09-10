# WO-019 — loại nguồn vào BẢNG DB · và thiết kế lại mục Phân loại

loại: sai dữ liệu + nợ kiến trúc + thiết kế
module: **M02_kb** (DDL · export/import) · **M08_api** (đường đọc) ·
**M03_web** (màn Danh mục)
mức: người dùng THẤY được — *"nội dung phân loại tôi thấy ko đúng"*

## Người dùng nói (2026-08-28, kèm ảnh 3)

> đi design lại layout, color, ui của mục phân loại: đẹp và khoa học hơn
>
> nội dung phân loại tôi thấy ko đúng: đáng ra của **tài liệu** thì là pdf, docs,
> ppt… / của **video** thì phải là youtube, tiktok, fb, douyin… → bạn cần **lưu
> các dữ liệu của mục phân loại này vào bảng DB — giống concept và category ấy,
> ko được hardcode**

## Nội dung đang SAI, đo được

Panel Phân loại liệt kê `m.loai` của `loai-nguon.json`:

```
Tài liệu 1 bản  →  tai-lieu     ← tên BẢNG, không phải loại nguồn
Video 1 bản     →  video        ← cũng vậy
Bài viết 3 bản  →  repo · paper · article · docs · announcement   ← đúng
```

Với bài viết thì `source_type` **chính là** loại nguồn nên nó đúng tình cờ. Với
hai module kia, loại nguồn là **định dạng** (pdf · pptx · docx · ppt · doc) và
**nơi phát** (youtube · tiktok · …) — dữ liệu đó đã có trong `media-mime.json`,
và `nguonCua()` (WO-014) đã suy đúng cho các thanh facet. Chỉ panel Danh mục còn
đọc sai nguồn.

## Đính chính lập luận CŨ của tôi

Ở WO-016 tôi từ chối đưa loại nguồn vào DB, lý do: `loai-nguon.json` sinh ra các
ràng buộc `CHECK` của DDL nên một bảng DB là hai nguồn sự thật.

**Lập luận đó đúng cho `source_type`, và KHÔNG đúng cho thứ người dùng đang nói.**
Hai thứ khác nhau:

| | ở đâu | có sinh `CHECK`? |
|---|---|---|
`source_type` (7 giá trị) | `loai-nguon.json` | **có** — giữ nguyên ở file |
định dạng tài liệu | `media-mime.json` `loai[]` | không (FR-039 đổi mime sang `pattern`) |
nơi phát video | `media-mime.json` `video_host[]` | không |

Người dùng đã nói lần thứ hai và nói rõ *"ko được hardcode"* ⇒ làm, không tranh
lại. Và `kho.schema.sql` **không** nằm trong `FROZEN.lock` (chỉ
`frontmatter.schema.json` có) nên thêm bảng không cần FR.

## Hình dạng

Bảng master trong DB, file là **export dẫn xuất** — đúng khuôn `concepts` /
`categories` đã dùng từ FR-019:

```sql
CREATE TABLE loai_nguon (
  id       TEXT PRIMARY KEY,   -- 'pdf' · 'youtube' · 'paper'
  module   TEXT NOT NULL,      -- bai-viet | tai-lieu | video
  nhan     TEXT NOT NULL,      -- chữ hiện ra
  thu_tu   INTEGER NOT NULL DEFAULT 0
);
```

**`source_type` VẪN ở `loai-nguon.json`** — nó sinh `CHECK`, và `coFileBai()` cùng
phép kiểm `type` của route phải chạy khi DB chưa tồn tại.

## Nợ kèm theo, phải nói ra

Whitelist chỉ có **hai** host (`youtube.com` · `tiktok.com`). Người dùng kể tên
`fb` và `douyin`. Thêm một host KHÔNG phải thêm một dòng chữ: M09-R3 đòi
`nhung` + `id_mau` + `id_tu` cho mỗi host, vì `src` của iframe chỉ được dựng từ
whitelist + regex id. Thêm host mà thiếu ba trường đó là mở đúng lỗ M09-R3 chặn.

## Kỳ vọng

1. Panel Phân loại: tài liệu ⇒ định dạng · video ⇒ nơi phát · bài viết ⇒ 5 loại
2. Dữ liệu đọc từ **bảng DB**, không từ chỗ gõ tay nào
3. Vòng DB→file→DB đạt điểm bất động (cùng phép kiểm C2 của FR-038 đã dùng)
4. Thiết kế lại panel: phân cấp thị giác cho quan hệ tập-con, số đếm đọc được,
   màu theo module, và trạng thái RỖNG nói ra điều gì đang thiếu
5. Thêm host `fb` + `douyin` **kèm đủ ba trường** M09-R3 đòi

## Ràng buộc

- Không đổi ý nghĩa `data-loai` (`source_type`); chiều mới đã ở `data-nguon`
- `gn.css` dư ~6.6 KB · `gn.js` dư 355 byte — panel là SSR nên rẻ về JS
- Thứ tự: **WO-018 trước** (không chạm DDL), rồi WO-019
