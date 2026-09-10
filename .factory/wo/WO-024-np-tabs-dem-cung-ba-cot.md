# WO-024 — dải tab màn nạp khai CỨNG ba cột, hai màn chỉ có một tab

loại: bug bố cục — người dùng THẤY được
module: **M03_web** (`web/styles/prototype.css`)
mức: đúng chỗ người dùng đã kêu — *"UI các màn nhập input nạp đang bị lệch về bên trái quá"*

## Repro — đo, không nhìn

```
.np-tabs{display:grid;grid-template-columns:repeat(3,1fr);…}   ← prototype.css:1153

nap-bai-viet   số .np-tab = 3
nap-tai-lieu   số .np-tab = 1
nap-video      số .np-tab = 1
```

Ba cột cứng, một phần tử ⇒ trên `/tai-lieu/nap/` và `/video/nap/` cái tab duy
nhất bị nhét vào **1/3 bề ngang đầu tiên** và **2/3 còn lại bỏ trống**. Đó chính
là dải trống bên phải người dùng kêu.

## Vì sao WO-021 không bắt được

WO-021 chữa **cột form** (`.np-p{max-width:52rem;margin-inline:auto}`) và
`format-chung.test.js` §5 đo đúng cái đó — *"cột form căn giữa panel"*. Dải tab
nằm **ngoài** `.np-p`, nên nó không nằm trong phạm vi phép đo. Chữa một nửa màn
rồi đo đúng nửa đã chữa.

## Đã có bản chữa đúng trong chính repo này

`.dm-tabs` (màn Danh mục) từng mắc y hệt và đã đổi sang:

```css
.dm-tabs{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;…}
```

`auto-flow` sinh đúng số cột bằng số phần tử **có mặt**, nên không bao giờ lệch
với markup. `repeat(N)` là một con số gõ tay ở tầng thứ hai — thêm/bớt một tab là
lệch, và lệch **im lặng** vì CSS không báo gì.

## Kỳ vọng

Không dải tab nào khai số cột **cứng** trong khi các màn dùng nó có số tab khác
nhau. Kèm: truy vấn hẹp phải đổi `grid-auto-flow` sang `row`, không đổi
`grid-template-columns` — với `auto-flow: column` thì thuộc tính kia vô hiệu, và
ba tab sẽ nằm ngang trên điện thoại.

## Không thuộc WO này

`.np-tab` (bản thân cái thẻ tab) không đổi. Và một tab đơn trải hết bề ngang là
**đúng ý**: nó là thẻ mô tả lối nạp, không phải nút chọn giữa nhiều lối.
