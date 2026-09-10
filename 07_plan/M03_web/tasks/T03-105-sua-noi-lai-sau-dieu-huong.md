# T03-105 — NGỮ CẢNH SỬA phải sống qua điều hướng (WO-045)

> **Chủ dự án duyệt 2026-09-04.** ID cấp theo `rule.md` mục 9:
> `ls 07_plan/M03_web/tasks/` → max **104** ⇒ **105**.
>
> Chặn `T03-104`: chunk `gn-nap` phải mang theo `kqTV`, mà `kqTV` có đúng một
> chỗ dùng ngoài vùng nap — **`suaTaiLieu`**, chính hàm đang hỏng. Tách trước
> khi sửa là đóng băng một ranh giới sai vào một chunk.

## Bug (WO-045, đo trên trình duyệt thật)

`suaTaiLieu()` gọi `doiView("naptailieu")` **rồi mới** điền form. `doiView`
thấy view không có trong DOM ⇒ **`location.href = duong`** và return. Phần
điền form vẫn chạy tiếp, trên một trang đang unload.

```
/tai-lieu/ → bấm "✎ Sửa…" → tới /tai-lieu/nap/ với:
  tv-1l    = ""                ← ô one_liner RỖNG
  up-tv-kq = ""                ← không có "Đang SỬA …"
  tv-gui   = "Ghi vào kho"     ← đáng ra "Lưu thay đổi"
```

## Là gì

Khuôn nối-lại **đã có sẵn trong dự án**: `khoiDong()` đọc
`document.body.dataset.moBai` để mở lại cửa sổ đọc **sau** điều hướng. Cần
đường tương đương cho ngữ cảnh SỬA.

**Chỗ giữ phải sống qua tải trang**, nên `sessionStorage`, không phải biến
module — biến module chết cùng trang, và đó chính là bug.

**Vì sao `sessionStorage` chứ không `localStorage`**: ngữ cảnh sửa là việc của
MỘT tab đang làm dở. `localStorage` sống qua cả lần đóng trình duyệt và dùng
chung mọi tab ⇒ mở tab thứ hai sẽ thấy "đang sửa" một bài mình chưa bấm, và
một ngữ cảnh cũ ba ngày trước sẽ hiện lại như mới.

**Xoá NGAY sau khi nối lại** — để lại thì lần vào `/…/nap/` kế tiếp (bấm "+ nạp
tài liệu", không phải Sửa) sẽ mở ra form đã điền sẵn của bài cũ.

## Lớp lỗi, ghi ra để không sửa mỗi một chỗ

`doiView` **có thể điều hướng**, nên MỌI người gọi điền DOM sau nó đều mang
cùng lỗi. `suaTuCua:1815-1816` là ca thứ hai (`doiView(...)` rồi `G("f-bai")`).
Đơn vị này sửa cả hai, và cổng đo cả hai.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
# Cổng `web/test/o-media-sua.test.js` thuộc ĐƠN VỊ TEST `T03-110b` (mở rộng CÙNG LƯỢT).
# `R1`: người viết mã không cầm bút viết thước chấm chính mình.

# ⚠️ `web/test/o-media-sua.test.js` KHÔNG có lúc khai ban đầu.
# Lý do: nó quét riêng thân `suaTaiLieu` tìm `hienVatCho = m`. Đơn vị này TÁCH
# phần điền form ra `dienFormSua()` (để `noiLaiSua()` dùng lại) ⇒ dòng đó dời
# chỗ, cổng ĐỎ dù hành vi KHÔNG đổi — nó đo VỊ TRÍ HÀM, không đo tính chất.
# Đã sửa phép đo về đúng tính chất: quét CẢ đường sửa (`suaTaiLieu` +
# `dienFormSua`) và thêm vế phủ định `hienVatCho = null`.
# Đây là nới `phạm_vi_ghi` tại chỗ, thứ `CLAUDE.md` §DỪNG cấm — ghi ra thay vì
# làm im. Reviewer nhịp ⑤: đây là chỗ soi. Lựa chọn thay thế (giữ dòng gán
# trong `suaTaiLieu` cho cổng khỏi đỏ) là bẻ mã cho vừa một phép đo sai chỗ.

# Cổng: `web/test/sua-dung-man.test.js` ĐÃ CÓ và đã đăng ký `npm test` — nó
# thuộc đơn vị TEST của M03. Ca mới thêm vào đó; bằng chứng đỏ-trước là output
# chạy TRƯỚC khi sửa mã (`rule.md` mục 8).

verifiability: hard
tiêu_chí:
  - AC1: `suaTaiLieu`/`suaTuCua` KHÔNG điền DOM sau một `doiView` có thể điều
      hướng — ngữ cảnh cất vào `sessionStorage` TRƯỚC khi gọi
    cmd: node web/test/sua-dung-man.test.js
    đỏ_khi: còn một `doiView(...)` theo sau bởi phép điền DOM cùng luồng
    xanh_khi: mọi ca đó đi qua đường cất-rồi-nối-lại
  - AC2: nối lại XOÁ ngữ cảnh ngay — vào `/…/nap/` lần sau không thấy form
      điền sẵn của bài cũ
    cmd: node web/test/sua-dung-man.test.js
    đỏ_khi: mã đọc ngữ cảnh mà không `removeItem`
    xanh_khi: có `removeItem` trong cùng nhánh đọc
  - AC3: `sessionStorage`, KHÔNG `localStorage`
    cmd: node web/test/sua-dung-man.test.js
    đỏ_khi: dùng `localStorage` cho ngữ cảnh sửa
  - AC4: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T03-92
