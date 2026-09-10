# WO-064 — mp4 trong kho KHÔNG xem được: bảng khai vẫn nói `tai`

loại: bug
module: M03_web (viewer + bảng khai) · M08_api (disposition) · M01_core (cổng bảng)
mức: hard
người báo: chủ dự án, 2026-09-09 — *"tải lên nhưng lỗi có xem được đâu?"* · *"cửa sổ xem ko được"*

## Hiện tượng

Sau `FR-075`, bản ghi video có byte ghi vào kho được. Mở nó ra thì cửa sổ đọc
hiện một thẻ: *"Trình duyệt không mở được dạng này — tải về để xem."* — cho một
`.mp4` mà trình duyệt phát được từ hai chục năm nay.

## Nguyên nhân — bảng khai LẠC HẬU sau FR-075, và hai chỗ đọc nó

`core/assets/media-mime.json` khai mp4 · webm · m4a · mp3 · wav là
**`xem_truoc: "tai"`**. Hai chỗ dẫn xuất từ đó, và cả hai làm ĐÚNG việc của
mình với một con số sai:

| chỗ | hệ quả |
|---|---|
| `web/api/articles.mjs:472` | `dat = xem_truoc === "iframe" ? "inline" : "attachment"` ⇒ mp4 phục vụ dạng **attachment** |
| `multiwindow.inline.ts:1493` | không `van-ban`, không `iframe` ⇒ rơi nhánh cuối *"tải về để xem"* |

⚠️ **`tai` KHÔNG phải một lựa chọn sai lúc nó được khai.** `M11_video/spec` khi
ấy nói video *"không byte, không dòng `media`"*, nên mp4 trong kho chỉ là ca
biên của `tai-lieu`. `FR-075` vừa biến nó thành đường CHÍNH — và đó là đúng
nghĩa *"việc vừa làm khiến artifact khác lỗi thời"*.

## Kỳ vọng

Thêm một giá trị `xem_truoc: "phat"` cho **media phát được bằng thẻ gốc của
trình duyệt** (`<video>`/`<audio>`), và:

1. viewer dựng `<video controls>` / `<audio controls>` trỏ
   `/api/articles/media/<sha>`;
2. `articles.mjs` phục vụ `phat` là **`inline`** — `attachment` thì thẻ `<video>`
   không phát được;
3. `core/tests/check_dinh_dang_mo.py:111` enum phải NHẬN `phat`, nếu không cổng
   đỏ vì chính thứ vừa thêm.

## Vì sao `phat` chứ không mượn `iframe`

`iframe` một mp4 chạy được nhưng nó là một trang trong trang: không có
`controls` của ta, không `preload` được, và `FR-039 §0` đã cấm đúng hình dạng
*"một file lạ render trong gốc của chính trang"*. `<video>` là thẻ NỘI DUNG —
nó không chạy script, và `nosniff` vẫn đứng.

## Cái WO này KHÔNG đổi

- magic-byte của năm định dạng — nguyên vẹn
- `mac_dinh.xem_truoc` vẫn KHÔNG phải `iframe` (`check_dinh_dang_mo:125`)
- `.vtt` vẫn `tai` — nó là hiện vật dẫn xuất, nhà riêng ở tab Transcript
