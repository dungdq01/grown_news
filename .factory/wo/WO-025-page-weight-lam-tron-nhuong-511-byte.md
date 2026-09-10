# WO-025 — `page-weight` làm tròn KB, im lặng nhường 511 byte quá trần

loại: cổng đo lỏng — không sai kết quả HÔM NAY, nhưng tripwire hụt một đoạn
module: **M03_web** (`web/test/page-weight.test.js`)
mức: không người dùng nào thấy; nhưng nó là **tripwire của tripwire**

## Repro — phép tính, không phải suy luận

```js
const kb = (s) => Math.round(Buffer.byteLength(s, "utf8") / 1024)
ok(n <= tran, …)                                   // tran = 100
```

`Math.round(102911 / 1024)` = `100`, và `100 <= 100` **cho qua**. Cổng tự đo:

```
phép so CŨ nhường 511 byte quá trần; phép so MỚI chặn
```

## Vì sao nó đáng sửa dù hôm nay chưa ai vượt

Đo lúc mở WO: `gn.js` **101426 / 102400** — dư **974 byte**. Tức nếu ai đó thêm
1 KB thì cổng vẫn xanh trong khi bundle đã qua trần.

Và dự án nói rõ về đúng con trần này: *"FR-027f · gn.css 160 → **100**. SIẾT,
không nới."* Một cổng lặng lẽ nhường 511 byte là **một nửa lần nới trần mà không
ai quyết** — nó làm đúng thứ FR-027f cấm, chỉ khác là không ai nhìn thấy.

Tôi cũng đã báo *"gn.js 99 KB / ngưỡng 100"* nhiều lần trong phiên này dựa trên
con số đã làm tròn đó. Con số ấy không sai, nhưng nó **không phải thứ đang được
so**.

## Kỳ vọng

So theo **byte**, hiện theo **KB**. Câu báo cho người đọc vẫn là KB — người đọc
không nghĩ bằng byte — nhưng phép so thì không.

Cùng lỗi ở bốn chỗ: `gn.css` · `gn.js` · trang chủ · trang lớn nhất. Và phép
**sắp xếp** tìm trang nặng nhất cũng sắp theo KB đã làm tròn: hai trang lệch 400
byte có thể đổi chỗ, và câu lỗi sẽ nêu sai tên trang.

## Đã LỌT THẬT một lần — không phải giả định

`web/test/sua-dung-man.test.js:98` mang sẵn hồ sơ, viết từ C6b:

> *"`page-weight` so `Math.round(byte/1024) <= 100`, nên nó cho vượt tới 511 byte
> mà vẫn xanh — và điều đó VỪA LỌT THẬT ở C6b: `gn.js` **102666 byte** báo
> "100 KB (ngưỡng 100)" và XANH."*

Tức lỗ này **đã cho một bundle quá trần đi qua**, và cách chữa lúc đó là đặt một
phép so byte ở một cổng KHÁC làm chốt chéo — chữa triệu chứng ở nơi khác, để
nguyên cái cân hỏng. WO này vá tận gốc. Chốt chéo GIỮ LẠI: một bất biến quan
trọng đo ở hai nơi độc lập thì một nơi hỏng không làm mất cả hai, và nó là hồ sơ
— xoá đi thì lần sau không ai biết lỗ ấy từng tồn tại.

## MỞ RỘNG · `he-kinh` mắc y hệt

```js
anh.push([f, Math.round(statSync(...).size / 1024)])
const nang = anh.filter(([, kb]) => kb > TRAN_ANH_KB)      // 500
```

Một ảnh **512511 byte** ⇒ `Math.round(500.499)` = `500` ⇒ **qua**. Cùng 511 byte.

Và nó còn hỏng một phép kiểm thứ hai trong cùng file: *"Trùng ảnh: hai file cùng
byte là một file dư phải tải"* — chú thích nói **byte**, phép so dùng **KB đã làm
tròn**, nên hai ảnh cách nhau 400 byte bị báo là **TRÙNG**. Sai theo chiều báo
động giả, chiều mà người ta học cách bỏ qua.

Một biến tên `kb` giữ giá trị byte chính là hình dạng của cả lớp lỗi này — đổi
tên luôn.

*(`he-kinh` vẫn ĐỎ, và đúng: ảnh 724662 byte người dùng thêm. Câu báo nay nêu cả
byte thật.)*

## Không thuộc WO này

Không đổi một con trần nào. Đây là siết phép so, không phải đổi ngưỡng.
