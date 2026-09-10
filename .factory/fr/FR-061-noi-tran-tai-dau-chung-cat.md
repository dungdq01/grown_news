# FR-061 — Nới trần TẢI ĐẦU cho trang `/chung-cat/**`

- **mở**: 2026-09-04 · **người quyết**: chủ dự án (*"chọn b → nới trần ra"*) ·
  **trạng thái**: **ĐÃ DUYỆT hướng — số cụ thể ở §2, chờ xác nhận**
- **artifact chạm**: `web/test/page-weight.test.js` (bảng trần) ·
  `06_modules/M03_web/rules.md` nếu trần khai ở đó
- **liên đới**: `FR-027f` chốt *"SIẾT, không nới"* — FR này **đảo một vế** của
  nó, và đó là lý do nó phải là một FR chứ không một dòng sửa.

## 0 · Vì sao — số đo, không cảm giác

`T03-110` (tab theo dõi chưng cất) khai một pipeline stepper + pulse +
slide-in + shimmer + chốt `prefers-reduced-motion`. Chính task đó chốt *"trần
gn KHÔNG nới — thiếu chỗ thì mở đơn vị giảm-béo, KHÔNG cắt luật reduced"*.

Đo 2026-09-04, sau khi đã lấy hết phần giảm béo **không rủi ro**:

| | |
|---|---|
| `gn.css` | 102002 / 102400 — còn **398** byte |
| `gn.js` | 100992 / 102400 — còn 1408 byte |
| tải đầu `/chung-cat/nhap/` | 280421 / 280576 — còn **155** byte |
| CSS tối thiểu cho stepper | ước **600–900** byte |

Bốn rule đã bỏ là **re-declare y hệt** bản trước (`.br` · `.nw a:last-child` ·
`.nw a:hover h4` · `.rise.in`) — bỏ không đổi một pixel, suite chứng minh. Được
162 byte. Phần còn lại (100+ selector trùng) là **override HỢP TÁC** — chính
`prototype.css` đã ghi *"41 selector trùng nhưng 0 luật chết"* — nên gộp chúng
đòi đọc cascade từng ca, và đó là một đơn vị việc riêng.

⇒ Hai lối, và chủ dự án chọn **nới trần**.

## 1 · Vì sao nới là lối ĐÚNG ở đây (không phải lối dễ)

`FR-027f` siết trần vì một số đo thật: bản v15 nặng **1217 KB** cho 500 bản ghi,
*"trang không dùng được"*. Trần tồn tại để chặn **phình do lười**, không để chặn
**tính năng có thật**.

Ba điều làm ca này khác:

1. **Trần bị chạm bởi CHUNK của đúng hai trang**, không bởi bundle chung.
   `/chung-cat/` và `/chung-cat/nhap/` tải thêm `chungcat` chunk (15791 byte).
   Mọi trang khác còn hàng chục KB trống — đo được: trang chủ 61432/61440 là
   trang chật thứ hai, và nó chật vì HTML, không vì chunk.
2. **Đây là hai trang CÔNG CỤ**, không phải trang đọc. Người mở
   `/chung-cat/nhap/` là người đang làm việc trong hệ, không phải khách vào đọc
   một bài — và `FR-027f` đo *"lần tải đầu của người đọc"*.
3. **Cắt phần còn lại là cắt luật, không cắt byte.** Thứ duy nhất còn cắt được
   ở `T03-110` là vế `prefers-reduced-motion` — và task cấm đúng điều đó, đúng:
   một animation không tắt được là một trang gây chóng mặt cho người đã khai
   mình cần nó tắt.

## 2 · Chốt số

Trần **RIÊNG cho trang có chunk**, không nới trần chung:

```
trần chung (mọi trang):        100 + 100 + <cap HTML của trang>   ← KHÔNG ĐỔI
trần trang có chunk:           + kích thước chunk của trang đó + 4 KB
```

Nói bằng lời: **một trang được cộng thêm đúng bằng chunk nó xin, cộng 4 KB dự
phòng cho mã màn.** Với `/chung-cat/nhap/` hôm nay: 280576 + 15791 + 4096 =
**300463** byte.

Vì sao viết thành **công thức** chứ không một con số:

- Một con số cứng (vd 300000) là con số sẽ lạc hậu ngày chunk đổi kích thước,
  và lúc đó không ai biết nó từng nghĩa gì.
- Công thức giữ được **răng**: tách một khối sang chunk **không** tự mua thêm
  chỗ — chunk to lên thì trần to lên đúng bằng nó, nên phép *"tách để lách
  thước đo"* mà `assets.mjs` đã cảnh báo vẫn bị chặn.
- 4 KB là ngân sách của **mã màn**, và nó là số duy nhất phải quyết bằng tay.
  Chọn 4 KB vì `T03-110` ước cần 600–900 byte CSS + ~2 KB JS ⇒ còn dư cho một
  đơn vị nữa, không dư cho mười.

## 3 · KHÔNG nới

- **`gn.css` và `gn.js` giữ nguyên 102400.** Đó là bundle CHUNG — nới nó là nới
  cho mọi trang, kể cả trang đọc. Việc FE tiếp theo chạm `gn.css` vẫn phải
  giảm béo hoặc mở FR riêng.
- **Trần HTML từng trang giữ nguyên** (home 61440 · trang khác 75776).
- Không bỏ phép đo *"tách bundle KHÔNG cứu được"* — công thức ở §2 giữ đúng
  tinh thần đó.

## 4 · Nợ vẫn còn, ghi để không mất

Đợt giảm béo `gn.css` thật (100+ selector trùng) **vẫn cần** — FR này không xoá
nó, chỉ tháo chặn cho `T03-110`. Ô backlog M03 giữ nguyên.
