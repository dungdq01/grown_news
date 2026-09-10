# WO-088 · Hàng việc: chỉ BẢN CUỐI, chỉ việc của NGƯỜI, và có màu

| | |
|---|---|
| **Loại** | cải tiến UI · M03_web |
| **Mức** | `hard` |
| **Wireframe** | `SCR-26 §5` — **DUYỆT** 2026-09-10 (*"ok, nhưng note thêm 2 ý"*) |
| **Mở** | 2026-09-10 |

Ba việc, cùng MỘT lượt vẽ (`ccNap` → dòng bài), nên một WO.

## A · Đường ống chỉ có việc của NGƯỜI (`SCR-26 §5.1`)

Chủ dự án: *"Sinh thumbnail là cái gì? tao chỉ có transcript và chưng cất …
nhác rác vào các trạng thái của tao à?"*

Đo được:

| loại việc | số | ai đặt |
|---|---|---|
| `sinh-transcript` | 14 | **người** |
| `chung-cat-mot-nguon` | 3 | **người** |
| `sinh-thumbnail` | 7 | MÁY (`tho-cua.mjs:203` tự xếp sau khi tạo bản ghi) |
| `tai-video` | 1 | MÁY, bước tiền đề |

Đường ống **hai chặng**: `transcript → chưng cất`. Việc của máy xuống hàng meta
thành nhãn mờ, và **chỉ nổi thành chip đỏ khi hỏng** — lúc ấy mới cần người.

## B · Chỉ BẢN CUỐI mỗi chặng (`SCR-26 §5.3a`)

Chủ dự án: *"chỉ hiển thị các bài cuối thôi, các bản transcript hay chưng cất
— đã bỏ / lỗi / loại thì để hết ở thùng rác, ko hiển thị lên hàng này"*.

Đo được: **25 việc → 15 cặp `(bài, chặng)`**. `ecomerce-skill-claude` một mình
có **4** lần chạy `sinh-transcript`, và cả bốn đang đứng thành bốn thẻ.

Luật: mỗi cặp `(slug, loai)` chỉ giữ việc **mới nhất**. Lần chạy cũ — kể cả
`xong` — không thuộc Hàng việc; chúng là lịch sử, và lịch sử ở tab `Kết quả`
(`WO-089`) với thùng rác.

**Chặng vẫn ĐỎ khi lần chạy MỚI NHẤT hỏng.** Đây không phải "giấu lỗi": cái bị
giấu là những lần chạy đã bị thay thế, còn trạng thái hiện thời luôn hiện.

## C · Màu và chuyển động (`SCR-26 §5.2`)

Chủ dự án: *"cần thêm màu sắc và hiệu ứng, làm cơ bản thế cho người cổ đại
dùng à?"*

- **Cột sống trái** màu theo loại nguồn (bảng `SCR-25`), sáng + toả bóng khi rê.
- **Chặng** màu ngữ nghĩa: lục xong · vàng chạy · đỏ hỏng · gạch đứt chưa có.
- **Chỉ chặng đang chạy mới động**: chấm thở + vệt sáng quét. Một chỗ động
  trên cả màn, nên mắt bị kéo đúng chỗ bận.
- Tắt sạch dưới `prefers-reduced-motion`.

## Bẫy phải chặn bằng cổng

1. **Bỏ lần chạy cũ không được làm mất việc ĐANG CHẠY.** Nếu một bài có một
   `xong` cũ và một `đang chạy` mới, phải giữ cái **mới**, không phải cái
   `xong`. Sắp theo `tao_luc`, không theo trạng thái.
2. **Tổng kết vẫn đếm CẢ hàng đợi** (25), không đếm sau khi gộp — `WO-015/BUG-2`.
3. **`gn.css` đang dư 5 byte.** Màu + chuyển động phải nằm trong ngân sách đó,
   không nới trần (`FR-061a §0` đã là lần nới thứ tư).

## Ngoài phạm vi

- Tab `Kết quả` — `WO-089`.
- Thùng rác — đã có, không đụng.
