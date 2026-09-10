# WO-083 · `gn.js` hết trần — lấy lại byte bằng cách cắt thụt đầu dòng

| | |
|---|---|
| **Loại** | cải tiến (gỡ chặn) · M03_web |
| **Mức** | `hard` |
| **Mở** | 2026-09-09, chặn WO-082 |
| **Đóng** | 2026-09-09 — **KHÔNG cứu được**, đã hoàn tác. Xem §Kết quả |

## Vì sao

`WO-082` thêm `capNhin` (853 byte) và `gn.js` vượt trần **523 byte**
(104971/104448). **Chín** cổng cùng đo con số ấy nên cùng đỏ. Đây không phải nợ
WO-055 — quy chủ rõ: red này của WO-082.

Đo trước khi chọn hướng:

- ba bảng nhúng (`MEDIA` 2452B · `KHUNG` 1868B · `XUAT` 1389B) **đã bị chiếu
  sạch** từ FR-036/FR-038 — 0 byte lấy thêm được;
- không có hàm chết nào trong chunk;
- chú thích **đã** bị `catBinhLuanJs` cắt lúc ghép `gn.js`;
- `TX_CSS` (4 KB) không trả về `prototype.css` được — `gn.css` cũng vỡ trần, và
  đó chính là lý do nó bị đẩy sang JS.

Còn đúng một miếng: **thụt đầu dòng**. Đo được **1828 byte** nằm ngoài mọi
chuỗi trong ba file nguồn của `gn.js`.

## Vì sao KHÔNG minify

`FR-027f` từ chối minify với lý do: DevTools phải trỏ đúng dòng. Cắt thụt đầu
dòng **giữ nguyên số dòng** — nó tôn trọng đúng lý lẽ ấy, chỉ lệch cột.

## Rủi ro và cách chặn

Một dòng bắt đầu bằng khoảng trắng **bên trong một template literal nhiều
dòng** thì khoảng trắng ấy là NỘI DUNG. Cắt nó là đổi chuỗi — hỏng im lặng,
đúng loại lỗi mà chú thích của `catBinhLuanJs` đã cảnh báo cho `//`.

Chặn bằng một **trọng tài máy**: `esbuild.transform(minify)` giữ nguyên từng
byte nội dung chuỗi. Nên

```
minify(bản gốc) === minify(bản đã cắt)
```

đúng **khi và chỉ khi** phép cắt không chạm một byte nào bên trong chuỗi. Bản
minify KHÔNG được ship — nó chỉ là thước.

## Kỳ vọng

- `gn.js` về dưới trần, không nới một byte trần nào.
- Số DÒNG của bundle không đổi.
- Trọng tài minify xanh trên cả ba file nguồn thật.
- `cat-binh-luan-js.test.js` (chạy bundle bằng `new Function`) vẫn xanh.

## Ngoài phạm vi

- Trần `gn.css`, `mock/index.html`, `trang chủ` — nợ WO-055, không đụng.

---

## Kết quả — ĐÓNG, hoàn tác toàn bộ

Đã cài `catThutDauDong` + trọng tài minify, cổng xanh trên cả ba file thật, cắt
được 9846 byte **ở tầng nguồn**. Rồi đo thứ được SHIP:

```
gn.js đã ship: 104961 B   (không đổi một byte)
```

Vì `assets.mjs:330` đã chạy `esbuild.transformSync({minifyWhitespace:true})`
trên `gn.js` từ `WO-057`. Thụt đầu dòng **đã bị bỏ từ trước** — phép cắt của
WO-083 lấy lại đúng **0 byte** ở chỗ cần.

Chỗ nó có tác dụng là các CHUNK (không đi qua bước nén ấy): trang
`/chung-cat/` giảm 1992 byte. Nhưng đổi lại nó làm ĐỎ `id-video-hoa-thuong` và
`nap-video` — hai trong bốn cổng mà chính chú thích `WO-057` đã liệt kê: chúng
**cắt một hàm khỏi chunk theo dòng rồi CHẠY nó**, nên đổi thụt là đổi thứ
chúng đang đọc.

⇒ Hoàn tác. `render/assets.mjs` về nguyên trạng, cổng `cat-thut-dau-dong` xoá.

### Đo được — bốn đường đều CỤT cho `gn.js`

| Đường | Lấy lại | Vì sao cụt |
|---|---|---|
| Ba bảng nhúng (`MEDIA` 2452B · `KHUNG` 1868B · `XUAT` 1389B) | **0** | đã chiếu sạch từ FR-036/FR-038; `mime_ten` FE có đọc |
| Hàm chết | **0** | quét toàn chunk: không hàm nào không ai gọi |
| Chú thích | **0** | `catBinhLuanJs` đã cắt từ T03-101 |
| Thụt đầu dòng | **0** | `minifyWhitespace` đã bỏ từ WO-057 |
| `TX_CSS` (4 KB) → `prototype.css` | **0** | `gn.css` cũng vỡ trần — đó chính là lý do nó bị đẩy sang JS |
| `home-motion` (6469 B) → chunk | 6469 ở `gn.js` | nhưng HTML trang chủ dư **9 byte** và tổng tải đầu của `/` dư **326** (`trang.mjs:1792`) — một thẻ `<script>` là +48 B, chunk là +6.5 KB ⇒ đỏ chuyển sang cổng khác, không mất đi |

**Kết luận: `gn.js` không còn một byte nào lấy lại được bằng kỹ thuật.** Mọi
tính năng FE mới từ đây đều cần một quyết định về TRẦN, không phải một phép
tối ưu. Đó là việc của người ký, không phải của agent.
