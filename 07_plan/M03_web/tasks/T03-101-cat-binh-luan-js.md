# T03-101 — CẮT BÌNH LUẬN JS lúc ghép bundle (khuôn FR-027f, đã duyệt cho CSS)

> Mở 2026-09-03 · chỉ đạo *"hoàn thiện tất cả task liên quan FE"*. Đo được:
> `gn.js` **110479 / 102400** sau T03-92 + T03-93, và `web/test/WORKLOG.md` ghi
> nó đã ở **102314 / 102400 — dư 86 byte** TRƯỚC phiên này. Nghĩa là **mọi
> tính năng FE tiếp theo đều vượt trần**, không riêng hai màn này.

## Vì sao đây là phép BỎ, không phải phép ĐỔI

`assets.mjs` đã làm đúng việc này cho CSS từ `FR-027f`, và lý do ghi ngay tại
đó: *"58 KB trong 160 KB `gn.css` là BÌNH LUẬN — 36% bundle. Chúng viết cho
người đọc repo, không cho trình duyệt; nguồn giữ nguyên từng chữ."*

JS của dự án này đặc bình luận hơn CSS. Cùng lập luận, cùng khuôn, chỉ khác
ngôn ngữ — nên đây **không phải một quyết định mới**, nó là áp một quyết định
đã duyệt sang chỗ thứ hai của cùng vấn đề.

## Vì sao KHÔNG minify

Cùng lý do `FR-027f` đã viết: *"một bước biên dịch thì phải có source map,
không thì debug thành đoạn mù"*. `minifyWhitespace` của esbuild gộp dòng ⇒ số
dòng trong DevTools không còn trỏ đúng chỗ. Cắt bình luận **giữ nguyên số
dòng** nếu ta thay bình luận bằng dòng trống thay vì xoá dòng.

## Vì sao KHÔNG regex tổng quát trên JS

`//` sống được trong chuỗi (`"http://x"`), trong regex literal (`/\/\//`), và
trong template literal nhiều dòng. Một regex "cắt mọi `//` tới hết dòng" là
cách làm hỏng mã một cách im lặng.

⇒ Chỉ cắt **hai dạng KHÔNG NHẬP NHẰNG**, cả hai nhận diện được ở đầu dòng:

| cắt | không cắt |
|---|---|
| dòng có ký tự đầu (sau khoảng trắng) là `//` | `//` giữa dòng — có thể trong chuỗi |
| khối `/* … */` mà `/*` là ký tự đầu của dòng | `/* */` giữa dòng · `/** @type */` nội dòng |

Chỗ còn rủi ro: một **template literal nhiều dòng** có một dòng bắt đầu bằng
`//` hoặc `/*`. Không dò được bằng cách nhìn từng dòng ⇒ cổng phải CHẠY bundle
đã cắt, không chỉ đo kích thước. `script-runs.test.js` làm đúng việc đó.

phạm_vi_ghi:
  - web/render/assets.mjs                  # `catBinhLuanJs()` + áp vào `js`

verifiability: hard
tiêu_chí:
  - AC1: `gn.js` xuống dưới trần 102400 byte
    cmd: cd web && npm run build && node test/page-weight.test.js
    đỏ_khi: vẫn ≥ 102400
    xanh_khi: dưới trần, và cổng in ra con số
  - AC2: bundle đã cắt VẪN CHẠY — không phải chỉ nhỏ hơn
    cmd: node web/test/script-runs.test.js
    đỏ_khi: bundle lỗi cú pháp, hoặc một hàm mất đi
    xanh_khi: script-runs xanh
  - AC3: SỐ DÒNG giữ nguyên — DevTools còn trỏ đúng chỗ
    cmd: node web/test/cat-binh-luan-js.test.js
    đỏ_khi: số dòng bundle khác số dòng nguồn
    xanh_khi: bằng nhau, và cổng đo cả một ca `//` TRONG CHUỖI không bị cắt
  - AC4: mọi cổng đọc `gn.js` vẫn xanh (chúng đo chuỗi trong bundle)
    cmd: cd web && npm test

phụ_thuộc: T03-92
