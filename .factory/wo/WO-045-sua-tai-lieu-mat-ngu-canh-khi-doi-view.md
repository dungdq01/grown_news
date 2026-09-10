# WO-045 — bấm **Sửa** một tài liệu từ `/tai-lieu/` thành **Nạp mới**

- **loại**: bug · **mức**: **hard** · **module**: M03_web
- **mở**: 2026-09-04 · **người mở**: agent thi công (phiên 6c7880c5)
- **quy chủ**: **KHÔNG phải phiên này**. `git log -1` trên
  `multiwindow.inline.ts` → `8535a26 fix 123` (2026-08-30 03:07), và
  `git show HEAD:…` đã có `doiView("naptailieu")` ở dòng 1628.
  Lộ ra lúc đo ranh giới cho `T03-104`, không phải do `T03-104` gây.

## Repro (đo trên trình duyệt thật, server `:8787`)

```
1. mở /tai-lieu/
2. bấm thẻ `tai-lieu/xgboost-stap-by-step` → cửa sổ đọc mở
3. bấm nút "✎ Sửa…" ở chân cửa sổ
```

Quan sát: trang **điều hướng** sang `/tai-lieu/nap/`, và ở đó:

```
coForm    : true
tv-1l     : ""                 ← ô one_liner RỖNG
up-tv-kq  : ""                 ← không có dòng "Đang SỬA …"
tv-gui    : "Ghi vào kho"      ← đáng ra "Lưu thay đổi"
```

⇒ Người bấm **Sửa** và nhận một form **Nạp mới** trống. Ghi tiếp là tạo bản
thứ hai, hoặc 409 — không phải sửa bản đang có.

## Nguyên nhân

`suaTaiLieu()` (dòng 1772) gọi `doiView("naptailieu")` **rồi mới** điền form.
Nhưng `doiView` (dòng 1487-1492) có hai đường:

```js
if (v in DUONG && !G("v-" + v)) {          // view KHÔNG có trong DOM
  location.href = duong                     // ⇒ ĐIỀU HƯỚNG, và return
  return
}
```

Và view `v-naptailieu` **bị cắt khỏi mọi trang không phải nap** — đo được:

```
/tai-lieu/      v-naptailieu x0 · up-tv-z x0 · tv-1l x0
/tai-lieu/nap/  v-naptailieu x1 · up-tv-z x1 · tv-1l x1
```

Nên từ `/tai-lieu/`: `doiView` điều hướng, `suaTaiLieu` **vẫn chạy tiếp** —
đặt `SUA_TL`, `hienVatCho`, điền `tv-*` — trên một trang đang UNLOAD. Tất cả
mất theo lần tải mới.

Trên `/tai-lieu/nap/` thì view có sẵn ⇒ không điều hướng ⇒ chạy đúng. Đó là
lý do nó chưa bao giờ đỏ: **mọi cổng FE render một trang rồi đo trang đó**, và
không cổng nào đo *"bấm ở trang A, kết quả ở trang B"*.

## Lớp lỗi, không phải một dòng

`doiView` **có thể điều hướng**, và MỌI người gọi nào điền DOM *sau* khi gọi nó
đều mang cùng lỗi. `suaTuCua` dòng 1815-1816 là ca thứ hai y hệt:
`doiView(...)` rồi `const form = G("f-bai")`.

Dự án đã có khuôn nối lại đúng cho ca này: `khoiDong()` đọc
`document.body.dataset.moBai` để mở lại cửa sổ đọc **sau** điều hướng. Cần một
đường tương đương cho NGỮ CẢNH SỬA — nhưng phải chọn chỗ giữ: `sessionStorage`
sống qua tải trang; một biến module thì không.

## Kỳ vọng

Bấm Sửa từ bất kỳ trang nào ⇒ tới form nap **đã điền** one_liner/tiêu đề, nút
đọc "Lưu thay đổi", và `up-tv-kq` nói "Đang SỬA <slug>".

## tiêu_chí

- AC1: từ `/tai-lieu/`, bấm Sửa ⇒ sau điều hướng, `tv-1l` KHÔNG rỗng và
  `tv-gui` = "Lưu thay đổi"
  - cmd: `node web/test/sua-dung-man.test.js`
  - đỏ_khi: form trống hoặc nút vẫn "Ghi vào kho"
- AC2: `doiView` không còn người gọi nào điền DOM sau khi nó ĐIỀU HƯỚNG —
  hoặc mọi ca đó đi qua đường nối-lại
  - cmd: `node web/test/sua-dung-man.test.js`
  - đỏ_khi: còn một `doiView(...)` theo sau bởi `G(...)` cùng luồng mà không
    qua đường nối-lại
- AC3: suite web xanh
  - cmd: `cd web && npm test`
