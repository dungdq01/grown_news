# WO-023 — `title` rỗng thành thẻ KHÔNG TÊN, và ba đường đọc trả ba câu khác nhau

loại: bug — sai dữ liệu người dùng THẤY được
module: **M08_api** (`web/api/articles.mjs`) · **M03_web** (`web/render/data.mjs`)
⇒ chạm hai module ⇒ **không phải PATCH**, cần người chốt đường đi
mức: một tài liệu/video lưu không tên hiện thành thẻ trống tên, không phân biệt được

## Bối cảnh — vì sao nó mới thành vấn đề

`title` **không** nằm trong `required` của `frontmatter.schema.json` và kiểu là
`["string","null"]`. Trên hai màn nạp tài liệu/video ô Tiêu đề ghi *"nên có"*, và
`cong-module.mjs` không có vế nào đòi nó. Tức **bỏ trống là đường hợp lệ, có chủ
đích** — đúng chỉ đạo *"các fields cố định… ko hẳn cần require (ví dụ gán
category, concept, tiêu đề, mô tả ngắn gọn…)"*.

Nhưng không đường đọc nào có **đường lùi cho chuỗi RỖNG**.

## Repro — đo qua HTTP thật trên kho tạm

POST `/api/video` ba lần, rồi đọc lại bằng cả ba đường:

```
title = "" (form gửi khi ô trống) -> fm: ""  | /api/index: ""      | /api/video: ""
không có khoá title               -> fm: —   | /api/index: "vid-2" | /api/video: null
title có chữ                      -> fm: "Có tên" | "Có tên"       | "Có tên"
```

Và thẻ dựng ra: `<h4></h4>` — **thẻ không tên**.

## Hai lỗi, KHÁC NHAU

**BUG-1 · `??` không bắt chuỗi rỗng.** `data.mjs:147` `fm.title ?? slug…` và
`:246` `fm.title ?? r.slug` đã có đường lùi — nhưng `??` chỉ bắt `null`/
`undefined`. Form gửi `""` khi ô trống, nên đường lùi **không bao giờ chạy** cho
đúng ca nó sinh ra để đỡ. Đây là "đã chữa" trên giấy mà chưa chữa — cùng hình
dạng với BUG-1 của WO-015 (`prototype.css:1319` khai đã chữa, chưa chữa).

**BUG-2 · BA đường đọc, HAI câu trả lời cho cùng một bản ghi.** Khoá `title`
vắng ⇒ `/api/index` trả `"vid-2"` (lùi về slug) còn `/api/video` trả **`null`**.
Nguồn: `articles.mjs:49` `theBai()` viết `fm.title ?? null` trong khi
`articles.mjs:113` và `data.mjs` cùng lùi về slug.

`theBai` là **builder hình dạng bản ghi thứ tư** — đúng thứ plan xếp là rủi ro
R4, và `hai-ban-shape.test.js` canh nó về *sự có mặt của trường*, không về *giá
trị khi trường vắng*. Một cổng hình dạng không phân biệt được `null` với `"vid-2"`.

## Kỳ vọng

Một quy tắc, một chỗ: `title` trắng (vắng · `null` · chuỗi rỗng · toàn khoảng
trắng) ⇒ lùi về `media.ten_goc` rồi `slug`. Ba đường đọc trả **cùng một câu**.

## Vì sao KHÔNG tự sửa trong lượt này

Call site nằm ở `web/api/articles.mjs` (M08_api) **và** `web/render/data.mjs`
(M03_web). Ba câu phân đường của `CLAUDE.md`: chạm ≥2 module ⇒ **BUILD**, không
PATCH. Sửa "chỉ ba dòng" ở hai module là đúng thứ ngưỡng đó tồn tại để chặn.

Đường rẻ nhất nếu người dùng chốt: một hàm `tenBai(fm, slug)` trong
`web/api/dungchung.mjs` — `data.mjs` **đã** import từ đó (`docLoaiNguon`), nên
không mở phụ thuộc mới; rồi ba call site cùng gọi nó. Cổng: POST một bản
`title: ""` rồi đòi **ba** đường đọc trả cùng một chuỗi khác rỗng.

## Không thuộc WO này

Bỏ `required` khỏi `#f-title` trên màn nạp bài viết. Nhãn ở đó ghi *"bắt buộc"*
và điều đó **đúng với hành vi hiện tại** — ô nằm trong `<form>` và `#f-gui` là
`type="submit"`, nên trình duyệt chặn thật. Nó chỏi chỉ đạo *"ko hẳn cần
require"* (người dùng kể đích danh *tiêu đề*), nhưng nới nó **trước** khi có
đường lùi là chủ động sinh thêm thẻ không tên. Thứ tự đúng: đường lùi trước.
