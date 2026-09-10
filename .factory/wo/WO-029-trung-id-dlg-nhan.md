# WO-029 — thêm nhãn mới KHÔNG BAO GIỜ được vì hai phần tử trùng `id`

loại: bug chặn — người dùng KHÔNG có cách nào qua
module: **M03_web** (`web/render/shell.html` · `web/plugins/multiwindow/**`)
mức: **không thêm được khái niệm hay chủ đề nào qua giao diện**

## Người dùng báo (2026-08-29, kèm ảnh)

Ở `/khai-niem/` → *Chủ đề mới* → điền **Mã nhãn** `fututre`, **Tên hiển thị**
`FUTURE`, **Gồm những gì** `talkshow` → bấm **THÊM** ⇒

> *Thêm chủ đề cần NGƯỜI khai: — label_vi (nhãn tiếng Việt)*

Ô "Tên hiển thị" **đã điền**, và màn vẫn nói nó thiếu.

## Nguyên nhân — TRÙNG `id`

```html
shell.html:522   <dialog class="dlg" id="dlg-nhan" …>      ← thẻ hộp thoại
shell.html:537     <input  id="dlg-nhan" type="text" …>    ← ô nhập
```

`document.getElementById("dlg-nhan")` trả **phần tử đầu tiên theo thứ tự tài
liệu** ⇒ cái `<dialog>`. Một `<dialog>` không có `.value`, nên:

```js
const v = (id) => G(id)?.value.trim() ?? ""
const than = { id, label_vi: v("dlg-nhan") }   // → ""  ⇒ server trả 422
```

**Cùng một id đó lại phục vụ hai việc KHÁC chạy đúng** — `showModal()` và
`close()` vốn thuộc về dialog. Nên lỗi chỉ lộ ở **một nhánh**, và nhìn bằng mắt
thì mọi thứ có vẻ hợp lý.

Còn một hệ quả thứ hai, âm thầm hơn: vòng dọn form
`for (const id of ["dlg-id", "dlg-nhan", …]) el.value = ""` cũng trúng cái dialog,
nên **ô nhập không bao giờ được xoá giữa hai lần mở**.

## Vì sao cổng hôm qua không bắt

`moc-fe-con-that` (WO-028) hỏi *"mốc có tồn tại không"*. Nó **không** hỏi *"có
đúng một không"*. Id này tồn tại — **hai lần**.

## Kỳ vọng

Không id nào trùng trong shell. Ô nhập đổi thành `dlg-nhan-o`; thẻ `<dialog>` giữ
`dlg-nhan` vì `man-danh-muc.test.js:100` đang đòi đúng nó.

## Bằng chứng chạy thật

```
POST /api/categories {id:"fututre", label_vi:"FUTURE", gom:"talkshow"}  ⇒ 200
đọc lại có `fututre`?                                                     ⇒ true
nhãn RỖNG                                                                 ⇒ 422 (đúng)
```
