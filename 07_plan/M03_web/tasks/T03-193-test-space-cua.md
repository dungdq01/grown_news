# [Space] T03-193 — đơn vị TEST: `web/test/space-cua.test.js` (cổng của T08-90)

> `R1`: người viết mã không cầm bút viết thước chấm chính mình. `T08-90` cài
> `WHERE space` + CRUD space; cổng của nó thuộc đơn vị này, viết TRƯỚC mã
> (rule.md mục 8 — bằng chứng đỏ-trước vào worklog, không cần suite chung đỏ).
> phụ_thuộc: T01-90
> ID: T03-193 — ĐỔI NHÀ 2026-09-10 theo TIỀN LỆ `T03-91-test-cua-loi`: cổng
> của cửa M08 nhưng `web/test/**` thuộc boundary **M03_web**; check_g6b bắt
> đúng. Đơn vị test phía M03, mã phía M08 — vẫn đúng R1 (hai vai tách).

phạm_vi_ghi:
  - web/test/space-cua.test.js     # MỚI — cổng của T08-90
  - web/package.json               # đăng ký npm test CÙNG LƯỢT với mã (bài học T08-20)

verifiability: hard
tiêu_chí:
  - AC1: cổng chạy được ngay, ĐỎ vì "chưa có cửa space" (không phải lỗi cú
      pháp); có vế chống-đỏ-oan (kho 1 space thì mọi truy vấn vẫn xanh)
    cmd: node web/test/space-cua.test.js
    đỏ_khi: đỏ mà thông điệp không nói được thiếu gì
    xanh_khi: đỏ đúng lý do trước mã · xanh sau mã
  - AC2: phủ đủ 4 vế của T08-90 — lọc chéo · một-chỗ-lọc · slug cấm/trùng/quyền
      · xoá space chuyển nội dung
    cmd: node web/test/space-cua.test.js
