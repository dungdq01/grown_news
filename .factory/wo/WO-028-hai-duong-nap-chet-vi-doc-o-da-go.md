# WO-028 — nạp video và nạp tài liệu CHẾT HẲN vì đọc một ô đã gỡ

loại: bug chặn — người dùng KHÔNG có cách nào qua
module: **M03_web** (`web/plugins/multiwindow/**`)
mức: **hai trong ba đường nạp không dùng được**, người dùng báo trực tiếp

## Người dùng báo (2026-08-29, kèm ảnh)

Dán `https://youtu.be/85kbC_s8Ldg?si=…` vào `/video/nap/`, điền một câu tóm tắt
và tiêu đề, bấm **Ghi vào kho** ⇒ màn trả:

> *Địa chỉ trong kho phải là chữ thường, số và dấu gạch nối.*

Và không cách nào qua được — vì **không còn ô nào để sửa cái địa chỉ đó**.

## Nguyên nhân

WO-021 gỡ ô *"Địa chỉ trong kho"* (`vd-slug` · `tv-slug` · `f-slug`) đúng theo yêu
cầu người dùng — nhưng **hai hàm gửi vẫn đọc nó**:

```js
const oS = G("vd-slug")                                   // null — ô đã bị gỡ
const slug = (oS?.value ?? "").trim()                     // ""
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { …lỗi…; return }   // LUÔN đỏ
```

`?.value ?? ""` **trông như** đã phòng thủ, nhưng cái nó phòng thủ lại rơi thẳng
vào một phép kiểm từ chối chuỗi rỗng. Guard không cứu được gì.

**Bài viết sống sót** vì nó tự suy:
`slug: FM_GOC?.slug ?? slugGoiY(gt("f-title") || gt("f-1l"))`.

⇒ **Hai trong ba đường nạp chết hẳn kể từ WO-021.**

## Vì sao 75 cổng không bắt

- `format-chung` §2 hỏi *"ô đã bị gỡ chưa"* và *"`guiFormThat` có tự điền không"*
  — nhưng `guiFormThat` là hàm của **bài viết**, đúng cái duy nhất không hỏng.
- `ba-duong-nap-that` (viết hôm nay) POST **thẳng API**, nên nó bỏ qua cái nút.
- `man-video` / `man-tai-lieu` đo **markup** có ô nhãn hay không.

Cả ba đo thứ **ở cạnh** chỗ hỏng. Không cổng nào hỏi *"bấm nút thì có ghi được
không"*.

## Kỳ vọng

Hai hàm gửi **tự suy** slug bằng `slugGoiY(tiêu đề || một câu)` — cùng công thức
bài viết đang dùng, một công thức chứ không ba.

## Sửa kèm — mồ côi của cùng lần gỡ

`f-slug` còn được đọc ở hai chỗ nữa, và `veDuongGhi()` vẽ đường dẫn vào thẻ
`f-duong-v` — **cả thẻ lẫn ô đều đã bị gỡ**, nên hàm thoát ngay dòng đầu và không
bao giờ vẽ gì. Ba đoạn này là mồ côi của **chính** lần gỡ WO-021, nên dọn theo.

## KHÔNG thuộc WO này

`kp-rac` — mồ côi của một lần gỡ **khác** (thiết kế lại KPI): KPI thùng rác không
bao giờ cập nhật. `CLAUDE.md` §3 nói mã chết **không liên quan** thì nêu ra chứ
đừng xoá. Đã mở ô backlog, và cổng mới ghi nó thành một **ngoại lệ có tên** để
một mốc treo MỚI vẫn đỏ được.
