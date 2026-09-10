# WO-022 — `idVideo()` hạ CẢ URL về chữ thường ⇒ id YouTube sai

loại: bug — sai dữ liệu người dùng THẤY được
module: **M03_web** (`web/plugins/**`)
mức: cửa sổ đọc video hiện **sai video** với ~99,7% id YouTube

## Repro — chạy trên BYTE ĐÃ BUILD, không chép tay lại

```js
const js = readFileSync("plugins/multiwindow/src/scripts/multiwindow.inline.js", "utf8")
const than = js.slice(js.indexOf("function idVideo"), …)   // lấy nguyên thân hàm
const idVideo = new Function("MEDIA", than + "\nreturn idVideo")(MEDIA)
idVideo("youtube.com/watch?v=dQw4w9WgXcQ")
```

Kết quả đo được (2026-08-29):

```
"youtube.com/watch?v=dQw4w9WgXcQ"  ->  id: "dqw4w9wgxcq"
   src iframe = https://www.youtube-nocookie.com/embed/dqw4w9wgxcq
```

Kỳ vọng: `dQw4w9WgXcQ`. Nhận được: `dqw4w9wgxcq`.

## Vì sao

```js
const s = String(un ?? "").toLowerCase();   // ← hạ CẢ URL
…
const m = new RegExp(h.id_tu).exec(s);      // ← bóc id TỪ CHUỖI ĐÃ HẠ
```

Chữ thường cần cho **một** việc: so tên miền. Nhưng nó được áp cho **cả** chuỗi,
kể cả phần id. Id YouTube là base64url và **phân biệt hoa–thường**.

`normalize_url()` phía Python làm đúng: `chu = duong.lower().split("/", 1)[0]` —
hạ **riêng** phần host, giữ nguyên phần còn lại. FE làm lệch với nó.

## Vì sao KHÔNG cổng nào kêu

`dqw4w9wgxcq` vẫn khớp `^[A-Za-z0-9_-]{11}$`. Phép kiểm `id_mau` hỏi *"id có ĐÚNG
HÌNH DẠNG không"*, và câu trả lời là **có** — id sai vẫn đúng hình dạng. Đây là
lớp lỗi đã gặp nhiều lần trong dự án: **đo HÌNH THỨC thay vì đo SỰ THẬT**.

Và không test nào gọi `idVideo` với một id có chữ hoa: 3 file test nhắc
`video_host` đều dùng id toàn chữ thường hoặc toàn chữ số (`tiktok` là số nên
`.toLowerCase()` vô hại — bug ẩn sau đúng cái host duy nhất miễn nhiễm).

## Xác suất trúng

Id YouTube 11 ký tự trên bảng 64 ký tự, 26 trong đó là chữ hoa. Không ký tự nào
hoa: `(38/64)^11 ≈ 0,0028`. Tức **~99,7% video YouTube hiện nhúng sai**.

## Kỳ vọng

So host không phân biệt hoa–thường (giữ nguyên), **bóc id từ chuỗi GỐC**.

## Không thuộc WO này

Thêm host `fb` + `douyin` — việc riêng, chạm `core/assets/**` (M01_core).
