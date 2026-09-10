# T08-31 — media MẢNG phía API: 8 chỗ đọc trong web/api (con của T09-8)

> Căn cứ: T09-8. ƯU TIÊN `articles.mjs:67` — đang CHỦ ĐỘNG chặn mảng:
> `(fm.media && !Array.isArray(fm.media)) ? fm.media : null` ⇒ bản ghi mảng
> (mọi bản NẠP MỚI từ 2026-09-05) mất media IM LẶNG trên API.
> Chạy SAU T01-46.

phạm_vi_ghi:
  - web/api/articles.mjs       # 4 chỗ, có :67
  - web/api/dungchung.mjs      # 3 chỗ
  - web/api/cong-module.mjs    # 1 chỗ

verifiability: hard
tiêu_chí:
  - AC1 (Z1): bản ghi 2 hiện vật ⇒ API trả đủ mảng 2, hiện vật thứ nhất không mất
    cmd: cd web && node test/media-mang.test.js
  - AC2: bản ghi kiểu CŨ (object — dữ liệu lịch sử chưa di trú) vẫn đọc được,
      trả về CHUẨN HOÁ thành mảng 1 phần tử — một hình dạng ra duy nhất
    cmd: cd web && node test/media-mang.test.js
  - AC3: suite web xanh (api-crud · media-cua-so · thu-vien giữ)
    cmd: cd web && npm test
