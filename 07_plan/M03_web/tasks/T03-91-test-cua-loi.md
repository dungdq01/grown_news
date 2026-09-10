# T03-91 — đơn vị TEST: sở hữu `web/test/loi-*.test.js` (cửa LÕI FR-047)

> Quyết của PM 2026-09-03, chọn lối (a) trong ô treo của T08-19: đơn vị TEST
> riêng thay vì mở boundary M08 (đổi map là việc có FR — đắt hơn cái được).
> File `web/test/loi-cua.test.js` (449 dòng) ĐÃ ĐƯỢC VIẾT mà không ai khai —
> đơn vị này nhận sở hữu để R1 đếm được, và rà lại nó theo đúng vai bên-đo.

phạm_vi_ghi:
  - web/test/loi-cua.test.js
  - web/test/loi-*.test.js              # các cổng cửa LÕI về sau
      # 2026-09-03 · glob này nay phủ `loi-tho-cua.test.js` (cổng của `T08-20`
      # — hai cửa `GET /api/model` + `POST /api/job`). Không phải mẹo đặt tên:
      # chúng LÀ cửa của LÕI, chỉ khác chỗ đích là THỢ. Nhờ nó, `T08-20` không
      # phải khai `web/test/**` và R1 không có lỗ.
  - web/package.json                    # 1 dòng: đăng ký cổng vào `npm test`
      # 2026-09-03 · NHẬN TỪ T08-20. `nut-song.test.js` đòi *"mọi file test đều
      # được `npm test` gọi"*, nên mỗi cổng mới là một dòng trong `package.json`.
      # T08-20 tự thêm file này vào `phạm_vi_ghi` giữa lúc thi công và check_g6b
      # bắt đúng: `web/package.json` là đất **M03** (`web/**`), ngoài boundary
      # M08 (`web/api/**`). Ai sở hữu cổng thì đăng ký cổng — hợp cả R1 lẫn nghĩa.

verifiability: hard
tiêu_chí:
  - AC1: cổng đo đủ khuôn cửa-cho-MÁY (FR-047): review_status luôn draft bất kể
      payload · ban_goc_ai bất biến · dung_lai_db không đụng DB web/
    cmd: node web/test/loi-cua.test.js
  - AC2: không phá gì — suite web xanh
    cmd: cd web && npm test
