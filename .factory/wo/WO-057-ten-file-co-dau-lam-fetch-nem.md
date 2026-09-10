# WO-057 — tên file CÓ DẤU làm `fetch` ném trước khi gửi, và cửa báo sai lý do

loại: bug
module: M03_web (FE gửi) · M08_api (server đọc)
mức: hard
người báo: chủ dự án, 2026-09-09, kèm ảnh màn Đăng ký video

## Hiện tượng

Nạp `Thầy ôn bai thi final .mp4` (55.0 MB) ở màn *Đăng ký video* ⇒

```
Không gọi được /api/articles/media — máy chủ chưa chạy?
```

Máy chủ **đang chạy**. Đây là hai lỗi, và lỗi thứ hai làm lỗi thứ nhất khó tìm.

## Repro — tối giản, chạy được

```js
// trong console của trang, máy chủ đang chạy
await fetch("/api/articles/media", {
  method: "POST",
  headers: { "content-type": "video/mp4", "x-ten-goc": "Thầy ôn.mp4" },
  body: new Uint8Array([0,0,0,32,102,116,121,112]),
})
// ⇒ TypeError: Failed to read the 'headers' property from 'RequestInit':
//    String contains non ISO-8859-1 code point.
```

Đổi `"Thầy ôn.mp4"` → `"t.mp4"`: **gửi được**. Đo 2026-09-09 bằng playwright
trên `:8787` thật.

## Nguyên nhân gốc — KHÔNG phải kích cỡ

`napvideo.inline.ts:363` nhét tên file NGUYÊN VĂN vào **header** `x-ten-goc`.
Giá trị header HTTP chỉ nhận **ISO-8859-1**; `ầ` `ô` nằm ngoài dải đó ⇒ `fetch`
ném **TypeError ngay tại lúc dựng request**, tức **0 byte rời máy**.

**55 MB hoàn toàn không liên quan** — đã loại trừ bằng đo:

```
$ curl -X POST :8787/api/articles/media -H 'content-type: video/mp4' \
       -H 'x-ten-goc: t.mp4' --data-binary @t.mp4   # 55 MB
HTTP 201 · 1.61s · gửi 57 671 680 byte
```

Server nhận 55 MB trong 1.6 giây. Trần bảng khai là **1 GB**.

## Lỗi THỨ HAI — cửa chẩn sai lý do (`workflow §1a` cấm)

`catch` gộp **mọi** lỗi thành *"máy chủ chưa chạy?"*. Nhưng hai ca khác hẳn:

| thật ra là gì | câu nên nói |
|---|---|
| request **chưa bao giờ rời máy** (TypeError lúc dựng) | *"tên file có ký tự header không chở được"* |
| máy chủ **thật sự** không nghe | *"máy chủ chưa chạy?"* |

Người đọc câu hiện tại sẽ đi khởi động lại máy chủ — sai chỗ hoàn toàn. Đây
đúng lớp lỗi `check_quote_co_that` đã trả giá một lần (`WL-01K9…`, hai ca gộp
vào một nhánh `except ImportError`).

## BA chỗ, không một — cùng một lớp lỗi

| # | file | header | ai chạm |
|---|---|---|---|
| 1 | `napvideo.inline.ts:363` | `x-ten-goc` | **ca người báo** |
| 2 | `multiwindow.inline.ts:1203` | `x-ten-goc` | nạp tài liệu/thư viện |
| 3 | `multiwindow.inline.ts:1091` | `x-ten-file` | nạp `.md` |

⇒ Một tài liệu `.pdf` hay `.md` tên tiếng Việt **cũng hỏng y hệt**, chưa ai báo
vì chưa ai thử. Vá một chỗ là để hai chỗ hỏng im lặng.

## Lỗi THỨ BA, ẩn hơn: tên Latin-1 KHÔNG ném mà bị SAI

`café.mp4` nằm TRONG dải ISO-8859-1 ⇒ `fetch` gửi được, nhưng Node đọc header
theo latin1 và ta xử lý như UTF-8 ⇒ tên vào frontmatter bị **mojibake**. Ca này
tệ hơn ca ném: nó *thành công* với dữ liệu sai.

## Kỳ vọng

1. Tên file đi qua header ở dạng **ASCII thuần** (`encodeURIComponent`), server
   giải mã. Một luật, hai đầu.
2. Server giải mã **có phòng hộ**: client thứ hai (curl) gửi tên thô mang `%`
   lẻ không được làm 500 — giữ nguyên chuỗi thô khi giải mã thất bại.
3. `catch` **tách hai ca**, không gộp.
4. Cả **ba** chỗ gửi cùng một lối.

## Hợp đồng ĐỔI — nói ra vì nó là liên module

`x-ten-goc` / `x-ten-file` từ *"tên thô"* thành *"tên percent-encoded"*.
Tương thích lùi giữ được: `decodeURIComponent("t.mp4") === "t.mp4"`, nên client
cũ gửi tên ASCII vẫn đúng. Chỉ tên thô chứa `%` lẻ là ca cần phòng hộ (§2).

## Đơn vị việc

- `T03-127` — FE: ba chỗ gửi + tách hai ca trong `catch` (M03)
- `T08-36` — server: giải mã có phòng hộ ở `tenGocAnToan` + `tenAnToan` (M08)

⚠️ `multiwindow.inline.ts` và `server.mjs` **đang có sửa chưa commit của phiên
khác** (`FR-011`). Luật của `FR-011` là *đọc lại file ngay trước khi Edit*, và
*không gỡ thay đổi dở của họ* — không phải cấm sửa. Áp đúng thế.
