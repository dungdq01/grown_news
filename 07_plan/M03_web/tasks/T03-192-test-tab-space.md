# [Space] T03-192 — đơn vị TEST: `web/test/tab-space.test.js` (cổng của T03-190/191)

> `R1` — cổng của tab bar + hiệu ứng thuộc đơn vị riêng, viết TRƯỚC mã.
> phụ_thuộc: T08-90
> ID: dải Space ở M03 = 190+ (M03 đã dùng tới 137).

phạm_vi_ghi:
  - web/test/tab-space.test.js     # MỚI — cổng của T03-190 và T03-191
  - web/package.json               # đăng ký npm test CÙNG LƯỢT

verifiability: hard
tiêu_chí:
  - AC1: cổng chạy được ngay, ĐỎ vì "chưa có tab bar"; vế chống-đỏ-oan: hệ
      MỘT space thì tab bar vắng là XANH, không phải thiếu
    cmd: node web/test/tab-space.test.js
    đỏ_khi: đỏ khi hệ chỉ có một space (đỏ oan)
    xanh_khi: đỏ đúng lúc thiếu tab với ≥2 space
  - AC2: phủ đủ vế của T03-190 (sidebar theo space · space rỗng tự ẩn · nút +
      chỉ `chu`) và T03-191 (reduced-motion · prefetch 1 request · skeleton ·
      Back giữ state)
    cmd: node web/test/tab-space.test.js
