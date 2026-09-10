# T03-115 — một biến màu cho một thẻ, thay hai inline lặp

> `WO-055`. Trả nợ trần trang chủ (`AC5` của `T03-112`): 61915/61440, vượt 475 byte.

## Hình dạng

Thẻ bài phát **hai** `style=` cho **một** dữ kiện `source_type`. Gộp thành một
biến CSS đặt ở thẻ cha, hai chỗ dùng đọc biến đó:

```html
<!-- trước: 2 inline, ~98 byte/thẻ -->
<button class="cd" data-loai="video" style="border-top-color:var(--c-video,var(--ink-2))">
  <i class="tg"><b style="background:var(--c-video,var(--ink-2))">video</b></i>

<!-- sau: 1 inline, ~34 byte/thẻ -->
<button class="cd" data-loai="video" style="--c:var(--c-video,var(--ink-2))">
  <i class="tg"><b>video</b></i>
```

```css
.cd{border-top-color:var(--c,var(--ink-2))}
.cd .tg b{background:var(--c,var(--ink-2))}
```

## Ba quyết định

- **Biến, không phải lớp theo loại.** Một lớp mỗi loại (`.l-video`, `.l-paper`…)
  cần 8 luật CSS ≈ 360 byte, mà `gn.css` chỉ dư **128**. Trả nợ trang chủ bằng
  cách vỡ trần bundle CHUNG là đổi một nợ lấy một nợ nặng hơn — `FR-061` cấm
  đúng chiều đó. Một biến thì **hai** luật là đủ, cho **mọi** loại kể cả loại
  thêm sau này.
- **Fallback giữ ở CẢ HAI nơi** (`var(--c,var(--ink-2))` trong CSS, và
  `var(--c-<loai>,var(--ink-2))` trong inline). Thừa một tầng, nhưng nó là tầng
  duy nhất còn đứng khi thẻ được render ở chỗ không có inline — và một thẻ mất
  màu viền thì người dùng thấy ngay, còn 20 byte thì không ai thấy.
- **Không đụng `data-loai`.** Nó là hợp đồng của bộ lọc; đổi nó là đổi một thứ
  khác đang có người dùng, trong một đơn vị chỉ được phép sửa cân nặng.

## Không làm trong đơn vị này

`data-i18n` (755 byte) và `<svg>` (1045 byte) cũng nặng, nhưng chúng là **nội
dung**, không phải lặp. Cắt chúng là đổi hành vi, và `WO-055` chỉ hỏi về byte
lặp. Đủ trả 475 rồi thì dừng — cắt thêm "cho chắc" là sửa thứ chưa ai nói hỏng.

phạm_vi_ghi:
  - web/render/trang.mjs                       # `tg()` + inline của thẻ
  - web/plugins/home-pages/index.ts            # bản song sinh của trang chủ
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # thẻ dựng phía FE
  - web/styles/prototype.css                   # hai luật đọc `--c`
  - web/render/shell.html                      # NỚI GIỮA CHỪNG — xem ghi chú
  - web/plugins/home-pages/shell.html          # bản song sinh của shell
#
# NỚI PHẠM VI, khai thẳng: hai `shell.html` KHÔNG có trong bản khai đầu. Lý do
# phải nới, và vì sao nó thuộc đúng đơn vị này:
#
# `AC6` đòi `npm test` xanh. Suite dùng `&&` nên nó DỪNG ở file đỏ đầu tiên —
# trước đây là `page-weight`. Khi `T03-115` đưa page-weight về xanh, suite chạy
# tiếp và lộ ra `bay-man.test.js` đỏ: lượt trước tôi chuyển `/chung-cat/` sang
# nhóm `hethong` trong `man-hinh.json` mà KHÔNG chuyển nút trong `shell.html`.
# Bảng khai nói `hethong`, markup nói `noidung`.
#
# Tức: một thay đổi của tôi từ lượt trước CHƯA TỪNG được kiểm, vì cổng canh nó
# nằm sau một cổng đang đỏ. Đó là cái giá của việc để một vế đỏ nằm lại — nó
# che mọi vế sau nó.
#
# Không mở đơn vị riêng cho hai dòng này: chúng là phần chưa hoàn tất của một
# thay đổi đã có, và `AC6` của chính đơn vị này là chỗ nó bị bắt.
# Cổng `web/test/page-weight.test.js` đã có sẵn và thuộc đơn vị test khác —
# đơn vị này KHÔNG chạm nó (`R1`). Vế mới đo bằng cổng riêng của T03-115b.

verifiability: hard
tiêu_chí:
  - AC1: trang chủ dưới trần 61440 byte
    cmd: cd web && node test/page-weight.test.js
    đỏ_khi: trang chủ ≥ 61440
    xanh_khi: mọi vế page-weight xanh, KHÔNG nới trần nào
  - AC2: `gn.css` vẫn dưới 102400 — trả nợ trang chủ không được vỡ bundle chung
    cmd: cd web && node test/page-weight.test.js
  - AC3: thẻ không còn phát HAI inline cho một `source_type` — 0
      `border-top-color:var(--c-`, huy hiệu `<b>` trong `.tg` không mang
      `style=`, và inline màu-theo-loại còn lại ≤ 5 (chấm `.tp-c`, ngoại lệ
      có chủ ý: một inline cho một dữ kiện, và đổi nó LỖ 9 byte trên `gn.css`
      đang chỉ dư 22)
    cmd: node web/test/mot-bien-mau.test.js
    đỏ_khi: còn một chỗ phát hai inline cho một `source_type`
  - AC4: màu viền + màu huy hiệu VẪN đúng theo loại — đổi cách khai, không đổi
      thứ người dùng nhìn thấy
    cmd: node web/test/mot-bien-mau.test.js
    đỏ_khi: thẻ mất `--c`, hoặc CSS không có luật đọc `--c`
  - AC5: hai bản render (SSR `trang.mjs` và FE `multiwindow`) ra CÙNG hình dạng
    cmd: node web/test/mot-bien-mau.test.js
    đỏ_khi: một bản đổi, bản kia còn inline cũ — lệch hai đường đọc
  - AC6: nền web giữ xanh
    cmd: cd web && npm test
