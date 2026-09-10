# T03-114 — media MẢNG phía FE/render (con của T09-8)

> Căn cứ: T09-8. `xemTruocHienVat` đã Array.isArray (hotfix 09-05) — con này
> quét NỐT các chỗ đọc còn lại. Chạy SAU T08-31 (API trả hình chuẩn).

phạm_vi_ghi:
  - web/render/data.mjs
  - web/render/trang.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
# vế cổng thuộc đơn vị test T09-8b (mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC1 (Z4): mime/ten_goc/so_byte vẫn chỉ ở MỘT nơi trong markup (không nhân
      đôi khi 2 hiện vật)
    cmd: cd web && node test/media-mang.test.js
  - AC2: SSR trang tài liệu với bản ghi mảng 2 hiện vật render không vỡ; suite xanh
    cmd: cd web && npm run build && npm test
