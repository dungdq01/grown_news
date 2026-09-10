# WO-027 — neo `(?:^|\})` nuốt dấu `}`, phép quét CSS chỉ thấy MỘT NỬA số luật

loại: cổng đo mong manh + một phép kiểm chết
module: **M03_web** (`web/test/**`)
mức: **không phép kiểm nào sai HÔM NAY** — đây là rủi ro tiềm ẩn, và một ca chết

## Đo được

Trên chính `cssGoc` của `cac-man-con-lai.test.js`:

```
tổng luật thấy được — neo (?:^|\}) : 416
                      không neo     : 832      ⇒ bỏ sót ĐÚNG MỘT NỬA
```

`(?:^|\})` **tiêu thụ** dấu `}` của luật trước, nên với `matchAll` thì vị trí quét
đã đi qua nó và luật kế tiếp không còn dấu `}` nào ở ngay trước để khớp. Kết quả:
thấy cách một luật. **Cùng bug đã sửa ở WO-015**, nơi `[hidden]{display:none}` có
thật mà cổng báo *"thấy 0 luật"*.

## Nói cho đúng: hôm nay nó CHƯA sai

Đếm theo từng selector các cổng thật sự hỏi:

```
.top   cũ 3 · mới 3        .wrap  cũ 2 · mới 2       .mid  cũ 1 · mới 1
.tb    cũ 2 · mới 2        .view  cũ 1 · mới 1
```

Hai neo cho **cùng kết quả**. Vậy không phép kiểm nào đang đọc sai.

**Vấn đề là nó đúng do MAY.** Một luật hiện ra hay không phụ thuộc vị trí CHẴN/LẺ
của nó trong chuỗi luật của cả file — thêm một luật **không liên quan** ở phía
trên là đổi nhịp, và một phép kiểm có thể lặng lẽ thành vô hiệu. Không ai báo gì.

Nặng nhất ở `rail-trai` và `ui-ba-man`: chúng `.map()` **mọi** match chứ không lấy
cái cuối, nên một luật ghi đè ở phía sau rơi vào nhịp bị bỏ là **vô hình**, và
phép kiểm "luật cuối đặt X" đọc nhầm sang luật khác.

## Bản sửa

Bỏ neo: `[^}]*` **không thể vượt qua một `}`**, nên nó không tràn sang luật khác
được — neo là thừa ngay từ đầu. Thay bằng `(?:^|[};])` + cờ `m` (thiếu `m` thì
`^` chỉ có nghĩa ở đầu CHUỖI, không ở đầu dòng).

Bảy chỗ: `cac-man-con-lai` ×1 · `rail-trai` ×4 · `ui-ba-man` ×2.

## Một phép kiểm CHẾT tìm ra kèm

`cac-man-con-lai.test.js:378`

```js
ok(!/max-width:840px/.test(cuoi(".qw .nw")), "`.qw .nw` KHÔNG bị chặn bề rộng")
```

`cuoi(".qw .nw")` trả `""`. Trong `prototype.css`, `.qw` chỉ còn xuất hiện **trong
một chú thích**: *"FR-033 · KHỐI `.qw` / `.qr` ĐÃ XOÁ"*. Luật đó không tồn tại, nên
phép phủ định đúng vô điều kiện — nó khẳng định một tính chất của một luật đã bị
gỡ cùng màn Chờ duyệt.

**KHÔNG xoá trong WO này**: đó là mã chết của người khác, và `CLAUDE.md` nói nêu
ra chứ đừng xoá. Ô backlog đã mở. Ba phép kiểm ở `:240` · `:241` · `:381` đã canh
đúng điều còn có nghĩa — `v-queue` và `#v-queue` không còn.
