# WO-014 — "Phân loại" và "loại nguồn" đang là MỘT ô; chúng là HAI chiều

loại: bug mô hình dữ liệu hiển thị
module: **M03_web** (`trang.mjs` · FE lọc) · M10_tailieu · M11_video
mức: người dùng THẤY được — *"chúng ta đang nhầm mục loại nguồn và phân loại"*

## Người dùng nói (2026-08-28, kèm hai ảnh chụp)

> 1 · trong loại **bài viết** có các loại nguồn: article · paper · repo ·
>     announcement …
> 2 · trong phân loại **tài liệu**: pdf · docs · ppt …
> 3 · trong phân loại **video**: video upload hệ thống · tiktok · youtube ·
>     douyin …
>
> → khi xem list **video** thì loại nguồn là upload hệ thống / tiktok / youtube…
> → khi xem **bài viết** thì loại nguồn là article / paper / repo …
>
> ⇒ trong trang danh sách **tổng hợp**: các key như `video`, `tai-lieu`,
> `bài viết` **không thể để chung chỗ** loại nguồn như tiktok / youtube /
> article / paper …

## Gốc, đo được

`bangLoc()` (`trang.mjs:218`) dựng nhóm "loại nguồn" bằng **`b.source_type`** —
một ô duy nhất đang chở HAI ý:

| | hôm nay | phải là |
|---|---|---|
**phân loại** | `source_type` | bài viết · tài liệu · video |
**loại nguồn** | *cùng ô đó* | **khác nhau theo từng module** |

Hệ quả nhìn thấy được: sidebar `/video/` sẽ hiện đúng MỘT dòng `video` (vô
nghĩa); `/tai-lieu/` hiện đúng một dòng `tai-lieu`; và màn **Tổng hợp** trộn
`article`/`paper`/`repo` (loại nguồn CỦA BÀI VIẾT) chung một danh sách với
`video`/`tai-lieu` (tên MODULE) — apples và oranges trong một facet.

## Điều KHÔNG cần đổi: schema

Dữ liệu đã có sẵn, chỉ chưa được đưa lên mặt:
- bài viết ⇒ loại nguồn = `source_type` (article · paper · repo · announcement · docs)
- tài liệu ⇒ loại nguồn = **định dạng**, suy từ `media.mime` → `ten` trong `media-mime.json`
- video   ⇒ loại nguồn = **nơi phát**, suy từ `url_normalized` → `video_host[].nhan`;
  và bản có `media` ⇒ "tải lên"

Không thêm trường, không đổi enum, không đụng DDL.

## Kỳ vọng

- màn **Tổng hợp** + **Kho**: facet là **PHÂN LOẠI** (bài viết · tài liệu · video)
- ba màn **loại**: facet là **LOẠI NGUỒN của module đó**
- MỘT phép suy, dùng cho cả SSR lẫn FE — không hai công thức

## Còn mở — cần người dùng chốt

*"video upload hệ thống"* trong lời người dùng: schema `anyOf [media|url]` CHO
PHÉP một bản video khai `media`, nên "tải lên" là một bucket hợp lệ. Nhưng
FR-037 chốt video **không có byte vào kho** (trần 25 MB của git), và màn
`/video/nap/` (C6b) chỉ nhận URL. Nên bucket đó sẽ **rỗng** cho tới khi có ai
mở đường tải video lên — và đó là một quyết định riêng, không thuộc WO này.
