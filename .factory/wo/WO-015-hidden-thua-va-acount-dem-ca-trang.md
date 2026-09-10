# WO-015 — `[hidden]` thua `.api-only`; `#acount` đếm CẢ TRANG

loại: bug hiển thị
module: **M03_web** (`prototype.css` · `multiwindow.inline.ts`)
mức: người dùng THẤY được — hai lỗi đã đo trên trình duyệt

## BUG-1 · `hidden` không có tác dụng trên `.api-only`

Đo trên Chromium, `body.api-co`, trang `/bai-viet/nap/`:

```
#f-bai   hidden = true   display = block
```

Bốn luật khớp `#f-bai`, theo thứ tự trọng số:
```
.api-only            { display: none  }   (0,1,0)
body.api-co .api-only{ display: block }   (0,2,1)  ← THẮNG
[hidden]             { display: none  }   (0,1,0)
.np-form             { display: grid  }
```

`body.api-co .api-only` có trọng số **0,2,1**, thắng `[hidden]` **0,1,0**. Nên khi
API chạy, `#f-bai` và `#tv-meta` **luôn hiện** dù JS đặt `hidden`. Hệ quả: nút "mở
form" vô nghĩa, và "Ghi vào kho" bấm được khi chưa nạp gì.

Bình luận ở `prototype.css:1319-1321` khai đã chữa — **nó chưa chữa**.

## BUG-2 · `#acount` đếm thẻ CẢ TRANG, không đếm trong lưới nó nói về

Đo trên `/tat-ca/`, kho tạm 4 bản ghi:

```
#acount            = "14 bản"
#grid2 có          = 7 thẻ      ← lưới mà nhãn đứng cạnh
.cd cả trang       = 14 thẻ
```

`apLoc()` đặt nhãn bằng `document.querySelectorAll(".cd:not(.off)").length` —
**cả trang**. Mọi màn đều nằm trong cùng tài liệu (shell mang cả các màn), nên
con số là tổng của Trang chủ + Tổng hợp + ba màn loại.

Plan ghi "SSR 16 / FE 20"; sau C5 thêm ba màn loại thì sai số **lớn hơn**, và nó
lớn thêm mỗi lần thêm một màn có thẻ.

## Kỳ vọng

- `hidden` PHẢI thắng: một phần tử JS đặt `hidden` thì không hiện, bất kể `.api-only`
- `#acount` đếm trong ĐÚNG lưới nó đứng cạnh (`#grid2`), không đếm cả trang
- và mỗi màn loại có ô đếm riêng của nó, đếm trong lưới của chính nó

## Cả hai cần cổng đo HÀNH VI, không đo markup

BUG-1 chỉ lộ khi so **trọng số** hoặc đọc `getComputedStyle`. BUG-2 chỉ lộ khi so
số trên nhãn với số thẻ **trong một lưới cụ thể**. Cổng đọc chuỗi không thấy cả hai.
