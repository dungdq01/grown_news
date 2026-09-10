# WO-095 · Bản in ra PDF là Markdown THÔ trong một `<pre>`

| | |
|---|---|
| **Loại** | bug · M03_web (cửa xuất) |
| **Mức** | `hard` — người dùng THẤY, và là bản đưa cho người khác đọc |
| **Mở** | 2026-09-10, chủ dự án: *"Đặc biệt là format in ra PDF (download) như tôi từng nói với bạn ấy."* |

## Repro

`GET /api/xuat/<loai>/<slug>?dang=in` → trang tự gọi `window.print()`.

`xuat-cua.mjs:273`:

```js
"<pre>" + esc2(than) + "</pre>",
```

Cả thân bài nằm trong **một `<pre>`**. Hệ quả trên bản PDF in ra:

- `## 2. Bối cảnh` in ra đúng chữ `## 2. Bối cảnh` — không thành tiêu đề;
- bảng Markdown (`WO-077` vừa mời model dùng) in ra thành một rừng dấu `|`;
- `- ` đầu dòng không thành gạch đầu dòng; `**đậm**` giữ nguyên hai dấu sao;
- `pre` là chữ ĐƠN CÁCH và `white-space:pre-wrap`, nên dòng dài xuống hàng
  theo ký tự chứ không theo từ;
- không có ngắt trang, không tránh mồ côi/goá, tiêu đề rơi cuối trang một mình.

## Vì sao `<pre>` từng là lựa chọn đúng

Nó an toàn: `esc2` chặn HTML, và không cần một bộ md→html ở server. Nhưng nó
trả lời câu *"in ra được không"*, còn câu đang hỏi là *"in ra có đọc được
không"*.

## Kỳ vọng

- Dựng **HTML thật** từ Markdown: `h1..h4` · đoạn · danh sách có/không thứ tự ·
  **bảng** · trích dẫn · khối mã · `**đậm**` `*nghiêng*` `` `mã` `` · liên kết.
- **Thoát HTML TRƯỚC khi dựng thẻ.** Đây là vế an toàn: thân bài do MODEL sinh,
  và một `<script>` trong đó không được thành thẻ thật. `<pre>` cũ an toàn nhờ
  `esc2` — bản mới phải giữ đúng tính chất ấy.
- Kiểu chữ để ĐỌC: chữ có chân cho thân bài, khổ ~46em, `orphans/widows`,
  `break-after: avoid` cho tiêu đề, `break-inside: avoid` cho bảng và khối mã.
- Đầu trang mang tiêu đề + nguồn + ngày; `@page` có lề.

## Ngoài phạm vi

- Sinh PDF ở server (Typst/wkhtmltopdf) — `01_research` có khảo sát, nhưng đó
  là một phụ thuộc mới và một quyết định riêng. WO này chỉ làm trang in tử tế.
