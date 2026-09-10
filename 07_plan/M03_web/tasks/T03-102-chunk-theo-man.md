# T03-102 — CHUNK theo màn: `gn-<màn>.js` tải chỉ trên màn của nó

> **Chủ dự án chọn lối (b) 2026-09-03** khi được trình ba lối cho trần byte.
> Đo trước khi làm: `gn.js` **106753 / 102400** (vượt 4353) và trang chủ
> **62545 / 61440** (vượt 1105) sau T03-92 + T03-93. `web/test/WORKLOG.md` ghi
> `gn.js` đã ở **102314/102400 — dư 86 byte** TRƯỚC đợt này ⇒ mọi tính năng FE
> tiếp theo đều vượt, không riêng M12.

## Là gì

`gn.js` giữ vai **bundle CHUNG** (backdrop · home-motion · multiwindow). Mã của
một màn riêng thành file riêng, và **chỉ trang đó phát thẻ `<script>`** cho nó.

Cùng lối đó cho **HTML**: shell là MỘT file chứa MỌI view và nó đi theo mọi
trang, nên khung của màn (bốn nút lọc · ba `<section>` · panel chi tiết) **dựng
bằng JS trong chunk**, shell chỉ giữ một mốc rỗng.

## Vì sao đây KHÔNG phải lách thước đo

Nếu chỉ chuyển byte từ `gn.js` sang một chunk thì ba trần từng-file đều xuống
mà trang nạp chunk đó **không nhẹ đi một byte nào** — và nó lách được mà không
ai nói dối một câu.

⇒ `page-weight` đổi phép đo: **tổng byte đường tải đầu của TỪNG trang** =
`HTML + gn.css + gn.js + mọi chunk mà CHÍNH trang đó xin`. Danh sách chunk đọc
từ **HTML đã render**, không từ một bảng khai thứ hai.

Trần **dẫn xuất**, không đặt mới: `gn.css` 100 + `gn.js` 100 + trần HTML của
chính trang đó (60 trang chủ · 74 các trang khác — hai số đã duyệt). Một trang
được phép nặng đúng bằng thứ ba trần kia đã cho phép; chunk nằm TRONG đó.

Cộng một phép nữa: **đúng MỘT màn được xin chunk**. Không có nó thì một thẻ
`<script>` lỡ đặt vào shell sẽ đi theo mọi trang, mà tổng từng trang vẫn có thể
dưới trần — cổng xanh trong khi việc tách hết ý nghĩa.

phạm_vi_ghi:
  - web/plugins/chungcat/src/chungcat.inline.ts   # chunk màn `/chung-cat/`
  - web/render/assets.mjs                          # `gnChunk` + `vChunk`
  - web/render/trang.mjs                           # thẻ script thứ hai, theo màn
  - web/server.mjs                                 # route `/gn-<ten>.js`
  - web/render/shell.html
  - web/plugins/home-pages/shell.html              # view rút về một mốc rỗng

verifiability: hard
tiêu_chí:
  - AC1: `gn.js` VÀ trang chủ về dưới trần
    cmd: cd web && npm run build && node test/page-weight.test.js
    đỏ_khi: một trong hai còn vượt
    xanh_khi: cả hai dưới trần, cổng in ra hai con số
  - AC2: tổng tải đầu của MỌI trang dưới trần dẫn xuất
    cmd: node web/test/page-weight.test.js
    đỏ_khi: một trang vượt `100+100+trầnHTML`
    xanh_khi: cổng in trang nặng nhất kèm chunk nó xin
  - AC3: chunk KHÔNG đi theo mọi trang — đúng một MÀN xin nó
    cmd: 'node web/test/page-weight.test.js; for u in / /tat-ca/ /kho/; do curl -s http://127.0.0.1:8787$u | grep -c gn-chungcat.js; done'
    đỏ_khi: >1 màn xin chunk, hoặc `/` xin nó
    xanh_khi: chỉ `/chung-cat/` (và bản `mock/` của nó) có thẻ script đó
  - AC4: chunk TỰ CHỨA — không phụ thuộc thứ tự nạp của gn.js
    cmd: node web/test/cat-binh-luan-js.test.js
    đỏ_khi: chunk tham chiếu một tên sống trong IIFE của multiwindow
    xanh_khi: parse được độc lập
  - AC5: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T03-101
