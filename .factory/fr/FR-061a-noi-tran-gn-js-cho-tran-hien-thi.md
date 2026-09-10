# FR-061a — Nới trần `gn.js` 102 → 103 KB cho trần hiển thị danh sách

- **mở**: 2026-09-09 · **người quyết**: chủ dự án (*"ok, duyệt và ký giúp tôi"*,
  sau khi đọc bảng bốn đường cụt) · **trạng thái**: **DUYỆT**
- **artifact chạm**: `web/test/_tran.mjs` (`TRAN_KB.js`) — MỘT dòng, một nguồn
- **đảo vế của**: `FR-061 §"SIẾT, không nới"` (kế thừa từ `FR-027f`)
- **mở đường cho**: `WO-082` / `T03-136` — trần hiển thị danh sách
- **số ID**: dùng hậu tố `a` của `FR-061` chứ không lấy `FR-081`, vì dải
  `FR-080+` đã cấp cho PM-Space. FR này sửa đúng thứ `FR-061` lập ra, nên tên
  nó nên trỏ vào đó.

## 0 · Đây là lần nới THỨ TƯ — nói trước, không giấu trong phần sau

```
FR-061  (2026-09-04)  mở đường nới trần tải đầu /chung-cat/
FR-068  (2026-09-06)  gn.css 100 → 102
FR-074  (2026-09-08)  gn.css 102 → 104 · gn.js 100 → 102
FR-061a (2026-09-09)  gn.js  102 → 103          ← FR này
```

`_tran.mjs:22` đã tự ghi: *"Ba lần nới liên tiếp là một tín hiệu"*, và
`FR-074 §3`: *"nới trần mua thời gian, KHÔNG trả nợ"*. Cả hai câu đó vẫn đúng
với FR này. Nó **không** trả nợ nào; nó mua 512 byte.

Lý do vẫn duyệt: xem §2 — nợ đúng đã được đo, và nó **không nằm ở `gn.js`**.

## 1 · Số đo

`WO-082` thêm `capNhin` (853 byte đã nén) ⇒

```
gn.js  104961 / 104448  —  vượt 513 byte,  9 cổng đỏ
```

Trước `WO-082`, `gn.js` còn dư **~330 byte**. Backlog M03 đã ghi từ trước:
*"`gn.js` còn dư 5 BYTE trên trần"*. Bundle này đã kịch trần từ lâu.

## 2 · Bốn đường lấy lại byte — ĐÃ ĐO, cả bốn bằng 0

Đây là phần làm FR này khác một lần nới cho tiện. `WO-083` đã thi công thật,
không ước lượng:

| Đường | Lấy lại ở `gn.js` | Vì sao cụt |
|---|---|---|
| Ba bảng nhúng (`MEDIA` 2452 · `KHUNG` 1868 · `XUAT` 1389) | **0** | đã chiếu sạch từ `FR-036`/`FR-038`; `mime_ten` FE có đọc thật |
| Hàm chết | **0** | quét toàn chunk: không hàm nào không ai gọi |
| Chú thích | **0** | `catBinhLuanJs` đã cắt từ `T03-101` |
| Thụt đầu dòng | **0** | `minifyWhitespace` đã bỏ từ `WO-057` |
| `TX_CSS` (4 KB) → `prototype.css` | **0** | `gn.css` cũng vỡ trần — đó **chính là** lý do nó bị đẩy sang JS |

`WO-083` đã cài `catThutDauDong` kèm một trọng tài `esbuild.minify`
(`minify(gốc) === minify(đã cắt)` ⇔ không byte nào của chuỗi bị chạm). Trọng
tài bắt được hai bug thật của máy quét — template lồng trong `${}`, và regex
`` /`([^`]+)`/g `` mang ba dấu backtick. Cắt được 9846 byte **ở tầng nguồn**,
và **0 byte ở `gn.js`**, vì `assets.mjs:330` đã nén khoảng trắng từ `WO-057`.
Đổi lại nó làm đỏ `id-video-hoa-thuong` + `nap-video` (hai cổng cắt một hàm
khỏi chunk **theo dòng** rồi chạy). ⇒ hoàn tác sạch.

## 3 · Đường ĐÚNG (dời vào chunk) đang bị chặn ở CHỖ KHÁC — đây mới là nợ

`FR-061 §4` và `FR-074 §3` đều chỉ cùng một hướng: **dời vào chunk**. Đo hướng
đó cho ứng viên rõ nhất, `home-motion` (`FR-027e`, chỉ Trang chủ dùng,
**6469 byte** đã nén trong `gn.js`, chỉ phụ thuộc `addCleanup`):

```
gn.js sau khi dời:  104961 − 6469 = 98492  ✅ dư gần 6 KB
```

Nhưng `trang.mjs:1792` đã đo và ghi lại:

```
thẻ <script> thêm vào HTML trang chủ  = +48 byte,  mà nó dư   9
chunk cộng vào tổng tải đầu của `/`   = +8010 byte, mà nó dư 326
```

⇒ Dời `home-motion` **chuyển** cái đỏ sang cổng HTML trang chủ, không xoá nó.
Và `page-weight` cố ý chặn đúng chiêu ấy: *"Tách KHÔNG được thành cách lách
thước đo"* (`assets.mjs:147`).

**Nợ thật, viết đúng tên nó:** không phải *"gn.js quá to"* mà là **HTML Trang
chủ hết chỗ cho một thẻ `<script>` thứ hai** (dư 9 byte). Chừng nào chưa gỡ
được chỗ đó, đường chunk còn khoá, và mọi tính năng FE mới còn phải đi qua một
lần nới trần. Ô backlog M03 mở với đúng câu này.

## 4 · Vì sao 103, không phải 104

512 byte đủ cho `WO-082` (vượt 513 → thiếu 1 byte... nên chính xác là 1024).
Nới **một** KB: đủ cho tính năng này và dư ~510 byte, không hơn. Nới 2 KB là
mua sẵn chỗ cho lần lười tiếp theo, và đó đúng là thứ `FR-027f` dựng trần để
chặn.

```
sau FR này:  gn.js 104961 / 105472  —  dư 511 byte
```

Con số dư ấy **cố ý nhỏ**: tính năng FE kế tiếp sẽ lại chạm trần, và lúc đó
câu hỏi phải là §3, không phải một FR-061b.

## 5 · Thay đổi

`web/test/_tran.mjs`:

```diff
-export const TRAN_KB = { css: 104, js: 102 }
+export const TRAN_KB = { css: 104, js: 103 }
```

Một dòng, một nguồn — đúng thứ `_tran.mjs` được dựng ra để bảo đảm.

## 6 · KHÔNG được kèm theo

- `TRAN_KB.css` giữ **104**.
- Trần HTML trang chủ và trần tổng-tải-đầu giữ nguyên — chúng là nợ `WO-055`,
  và §3 vừa nói rõ vì sao chúng quan trọng hơn `gn.js`.
