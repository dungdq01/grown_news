# WO-034 — Phóng to cửa sổ đọc, khung PDF/video KHÔNG giãn theo

loại: bug (người dùng THẤY được)
module: M03_web
mở_bởi: người dùng, 2026-08-29 — *"khi phóng to cửa sổ detail thì khung xem bài
  viết / video / pdf vẫn chưa tăng size theo, dẫn đến bị lệch khung"* (2 ảnh)

## Repro

1. `npm run api`, mở `localhost:8787/tat-ca/`
2. Bấm một bản có hiện vật — PDF (`tai-lieu`) hoặc video (`video`)
3. Phóng to cửa sổ đọc (nút ▭ hoặc kéo cạnh)

## Kỳ vọng vs thực tế

| | |
|---|---|
| kỳ vọng | khung PDF/video giãn theo bề rộng cửa sổ |
| thực tế | khung dừng ở **900px**, phần còn lại là khoảng trắng |

Ảnh 1: cửa sổ ~1700px, khung PDF hết ở ~1120px — PDF hiển thị ở **28%**, đọc
không nổi. Ảnh 2: video cùng hiện tượng.

## Nguyên nhân (đã truy, không phải phỏng đoán)

`.hv` nằm TRONG `<article class="doc">`, mà `.doc` bị chặn bề rộng có chủ đích:

```
.doc{max-width:var(--w-read)}                          /* 600px */
@container win (min-width:900px) { max-width:min(78cqw,820px) }
@container win (min-width:1200px){ max-width:min(72cqw,900px) }
```

Chặn đó **ĐÚNG cho văn xuôi** — độ dài dòng là luật đọc (ui_guide §9), và
`cua-so-doc.test.js` đang canh nó. Sai ở chỗ **hiện vật thừa hưởng cái chặn của
chữ**: một PDF 23 trang và một dòng văn không có cùng bề rộng tối ưu.

Nên đây KHÔNG phải "bỏ max-width của .doc" — làm thế là phá luật đọc để chữa
một triệu chứng. Hiện vật phải **thoát ra khỏi** cột chữ.

## Mức

`hard` — đo được bằng CSS đã build.
