# WO-026 — hai phép kiểm trong `filter-counts` báo "ok" mà không đo gì

loại: cổng chết — xanh vì MÙ, không vì đúng
module: **M03_web** (`web/test/filter-counts.test.js`)
mức: không ai thấy; nhưng nó là một mảng bảo vệ **không tồn tại**

## Repro — chạy cổng và đọc chính output của nó

```
ok   nhãn đếm "(trống — danh mục rỗng)" đúng dạng
ok   hàng sắp giảm dần:                       ← không có gì sau dấu hai chấm
```

Kho mock **không có nhãn nào đang dùng**, và đó là trạng thái hợp lệ của nó
(emitter khai rõ `ccount` rỗng khi danh mục rỗng). Hệ quả:

```js
const mCc = cc.match(/(\d+)\/(\d+)/)          // null
if (mCc) ok(soHang === Number(mCc[1]), …)     // KHÔNG chạy, và KHÔNG in dòng nào

const soTrongHang = [...cb.matchAll(/<time>(\d+) bài<\/time>/g)]…   // []
ok(soTrongHang.every(…), …)                   // [].every(…) === true
```

**Phép thứ nhất biến mất không dấu vết** — không có cả một dòng "bỏ qua".
**Phép thứ hai in ra chữ "ok"** trong khi tập nó xét là rỗng.

## Bằng chứng nó thật sự chết

Phá phép sắp trong emitter (`trang.mjs:590`, đổi chiều so sánh) **trước** bản vá:
cổng vẫn XANH. Sau bản vá: ĐỎ, và câu lỗi in ra `1 2 3`.

## Kỳ vọng

Dùng **một bản render riêng** có nhãn thật cho đúng hai phép này — không đụng
`kn`, vì cả chục phép khác trong file dựa vào nó, và kho mock rỗng nhãn là trạng
thái hợp lệ không nên bị ép đổi.

Kèm **hai phép tự kiểm vật liệu**, vì một cổng không kiểm vật liệu của nó là cổng
chưa biết mình đo cái gì:

- bản render riêng phải có `> 0` hàng nhãn;
- phải có `>= 2` hàng mang số — dưới 2 thì `.every` đúng vô điều kiện trở lại,
  chỉ khác là chết ở chỗ mới.

Và `if (mCc)` đổi thành `ok(mCc !== null, …)` **rồi mới** `if` — im lặng bỏ qua
là thứ phải bị chặn, không phải thứ được phép.

## Không thuộc WO này

`hai-chieu-facet.test.js:76` có hình dạng giống (`.every` trên
`tapCua[...] ?? []`) nhưng **an toàn**: vòng ngay trên đó đã đòi `ng.length > 0`
cho từng module. Đã kiểm, không sửa.
