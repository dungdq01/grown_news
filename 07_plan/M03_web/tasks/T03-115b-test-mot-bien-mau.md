# T03-115b — cổng cho `T03-115`

> Đơn vị TEST riêng, khuôn `T03-110b`: người viết mã không cầm bút viết thước
> chấm chính mình (`R1`).

phạm_vi_ghi:
  - web/test/mot-bien-mau.test.js    # cổng MỚI
  - web/package.json                 # đăng ký vào `npm test` CÙNG LƯỢT
  - web/test/api-index-khong-can-build.test.js   # đổi MỐC NEO của vế "hai bản
                                     # song sinh": `border-top-color` → `--c:`.
                                     # Tính chất canh KHÔNG đổi, số vế KHÔNG giảm.

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ được trên bản trước khi sửa (còn hai inline lặp)
    cmd: node web/test/mot-bien-mau.test.js
    đỏ_khi: chạy trên mã cũ mà vẫn xanh ⇒ cổng không đo gì
  - AC2: cổng đo CẢ BA chỗ sinh thẻ, không chỉ một
    cmd: node web/test/mot-bien-mau.test.js
