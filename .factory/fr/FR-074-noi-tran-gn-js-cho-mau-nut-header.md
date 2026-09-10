# FR-074 — nới trần `gn.js` (và `gn.css`) cho màu nút header

- **mở**: 2026-09-08 · **người quyết**: chờ chủ dự án · **trạng thái**:
  **ĐÃ DUYỆT** — chủ dự án 2026-09-08 (*"nới, ok tôi duyệt"*) · **ĐÃ ÁP**
- **artifact chạm**: `web/test/page-weight.test.js` (`TRAN_KB`)
- **tiền lệ**: `FR-068` nới `gn.css` 100 → 102 KB, cùng lý do, cùng khuôn

## 0 · Con số, đo 2026-09-08 sau khi `SCR-24` xanh

```
gn.js    102 625 / 102 400   VƯỢT 225 byte
gn.css   104 439 / 104 448   còn   9 byte
```

`SCR-24 §4` đã khai trước điểm dừng này, nguyên văn: *"JS phải ≤ 0 byte ròng…
Nếu ròng vẫn dương ⇒ DỪNG, mở FR nới trần — không lặng lẽ nhét vào rồi để
`page-weight` đỏ."* Đây là chỗ đó.

## 1 · 225 byte ấy mua gì

Chủ dự án 2026-09-08: *"nút cần gọn gàng có màu sắc. Nếu đã chưng cất/transcript
rồi thì màu chữ vàng, chưa click active lần nào thì màu hồng"*.

| phần | vì sao không bỏ được |
|---|---|
| `coTranscript(ban)` quyết màu tại render | tín hiệu có sẵn trên `media[]`; chờ mạng cho nó là chờ vô cớ |
| `veNutBanChungCat` sơn vàng sau khi `/api/index` trả lời | một bản ghi chưng cất được NHIỀU lần ⇒ KHÔNG suy được từ slug |
| hai class `nut-chua` / `nut-roi` | tên phải đọc được ở cả JS lẫn CSS |

**Đã trim những gì trim được** trước khi mở FR: nhãn ngắn lại (`Sinh
transcript` → `♫ Transcript`, bỏ chữ `trước`), ký tự thật thay `\uXXXX`. Phần
còn lại là logic, không phải chữ.

## 2 · Đề xuất

```
TRAN_KB = { css: 102, js: 100 }   →   { css: 104, js: 102 }
```

**+2 KB mỗi bundle, không +250 "vừa đủ".** Cùng lý lẽ `FR-068` đã ghi: *"một
trần chạm đúng vào mặt mình là một trần sẽ vỡ ở đơn vị kế tiếp, và mỗi lần vỡ
tốn một FR."* Hôm nay `gn.css` còn **9 byte** — nó đang ở đúng cái mặt ấy.

Sửa **một chỗ**: `TRAN_KB` trong `page-weight.test.js`. Công thức trần TRANG
đã đọc cùng hằng ấy (vá 2026-09-07), nên trần từng-file và trần mỗi-trang đi
cùng nhau — không còn ngày nào từng file hợp lệ mà mọi trang báo đỏ.

## 3 · Cái giá, nói thẳng

Tải đầu của một trang nặng thêm tối đa **4 KB**. Trên 3G ~50 KB/s đó là ~80ms.

Và nợ **`FR-061 §4` (giảm béo bundle) KHÔNG được tick bởi FR này** — y như
`FR-068` đã ghi. Nới trần là mua thời gian, không phải trả nợ. Ba lần nới liên
tiếp (`FR-061` → `FR-068` → FR này) là một tín hiệu: đường đúng là **dời vào
chunk**, và `gn.js` đang gánh nhiều thứ chỉ một loại màn dùng.

## 4 · Lối KHÔNG chọn, và vì sao

| lối | vì sao không |
|---|---|
| dời màu sang chunk | nút nằm ở header cửa sổ — dựng SSR ở mọi màn. Chunk nạp sau ⇒ nút nhấp màu, và nó nhấp ở đúng thứ người dùng nhìn đầu tiên |
| rút tên class (`nut-chua`→`nc`) | tiết kiệm ~25 byte trên 225. Đổi một tên đọc được thành hai chữ để mua 11% khoảng thiếu là bán thứ đắt mua thứ rẻ |
| bỏ vế sơn-vàng-sau-mạng | mất đúng thứ chủ dự án xin: *"đã chưng cất rồi thì vàng"* cho bản ghi tài liệu |

## 5 · Bằng chứng đóng

- `node web/test/page-weight.test.js` xanh, và **in ra** con số mới
- `node web/test/nut-header-mau.test.js` xanh — 15 vế của `SCR-24`
- `cd web && npm test` xanh toàn bộ
