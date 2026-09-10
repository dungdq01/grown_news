# WO-037 — form viết bài chỉ nhận VĂN XUÔI, không nhận dấu markdown

loại: cải tiến UI — người dùng yêu cầu trực tiếp
module: **M03_web** (`web/plugins/multiwindow/**` · `web/render/shell.html`)
mức: người dùng phải gõ cú pháp markdown ở đúng một ô

## Người dùng nói (2026-08-29, kèm ảnh)

> *user chỉ nhập text, tuyệt đối ko nhập dấu markdown như `###` hay `##`, `***`…
> để định nghĩa header. Form của ta định nghĩa sẵn, còn UI mở lên read and write
> chỉ có nhập text như nhập văn bản thôi*

## Hiện trạng — hẹp hơn tưởng, đã đo

**7/8 ô đã đúng ý.** `dungKhung()` dựng một textarea cho mỗi mục lá; `gomKhung()`
tự sinh `## 1. Overview`, `### 3.1 Đầu vào`… Người dùng **không** gõ heading.

**Sai đúng một ô: `3.4 Tinh túy`.** Gợi ý của nó lấy từ `khung-than-bai.json` và
nó *là* markdown:

```
#### 3.4.1 Tên tinh túy
- **Không hiển nhiên vì:** …
- **Chuyển giao:** …
```

Vì cấu trúc tinh túy nằm **bên trong** một textarea, chỗ đó bắt gõ `####` và `**`.

**Và một chế độ thứ hai:** `#f-tho-o` — textarea markdown thô cho cả thân bài,
kèm nút chuyển `[data-soan]`. Người dùng chốt **bỏ hẳn**.

## Ba điều bản vá phải giữ

**1 · `#f-than` KHÔNG chỉ là ô soạn thô — nó là ĐÍCH LẮP RÁP.**
`gomKhung()` ghi markdown đã ráp vào `#f-than`, và form gửi giá trị đó đi. Xoá
thẻ mà không đổi `gomKhung()` sang *trả về chuỗi* là **mất đường gửi thân bài**.

**2 · Chế độ thô đang là LƯỚI AN TOÀN.** `multiwindow.inline.ts:2511`:
```js
if (SOAN === "muc" && !raiKhung(ban.than)) doiSoan("tho");
```
Mở một bài cũ có thân KHÔNG khớp khung ⇒ rơi về chế độ thô để khỏi mất nội dung.
Bỏ lưới mà không thay gì ⇒ **sửa một bài như vậy là mất thân bài, âm thầm**.
Thay bằng: **từ chối mở form**, nói rõ lý do. Không bao giờ mở một form không
trả lại được nội dung nó nhận vào.

**3 · Locator KHÔNG phải markdown.** `[§II.4]`, `[file.py:10-40]` là địa chỉ dẫn
chứng và `validate.py` ĐÒI chúng ở mục 3.2/3.3/3.4/4. Chúng ở lại.

## Kỳ vọng

- Ô `3.4` thành nhóm ô con lặp được (tên + 5 ô: Không hiển nhiên vì · Chuyển
  giao · Tin cậy · Bằng chứng · Loại), tối đa `tinh_tuy.toi_da` = 5.
- `gomKhung()` sinh `#### 3.4.k` và `- **…:**` — người dùng chỉ gõ chữ.
- Không textarea nào trong form còn gợi ý chứa cú pháp markdown.
- Không còn chế độ thô, không còn nút `[data-soan]`.
- Mở bài không khớp khung ⇒ báo và KHÔNG mở form.
