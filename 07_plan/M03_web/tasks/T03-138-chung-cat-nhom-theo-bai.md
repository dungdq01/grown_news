# T03-138 — `/chung-cat/` nhóm theo bài gốc + trục thời gian

> `WO-085`. Chủ dự án 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-138-chung-cat-nhom-theo-bai.md
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css
  - web/test/chung-cat-nhom-theo-bai.test.js

verifiability: hard
tiêu_chí:
  - AC1: việc được GỘP theo `payload.slug`; mỗi bài gốc một khối, và khối
      mang TIÊU ĐỀ thật lấy từ chỉ mục, không phải slug
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: 5 việc cùng slug vẫn nằm rải · khối hiện slug khi tra được tiêu đề
      — vế 2/2a/2b
  - AC2: tra không ra tiêu đề ⇒ LÙI về slug, khối vẫn hiện
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: khối biến mất, hoặc đầu khối rỗng — một việc trỏ tới bản ghi đã
      xoá vẫn phải nhìn thấy được — vế 3/3a
  - AC3: chunk `chungcat` lấy tiêu đề QUA cầu `__GN_MW__`, KHÔNG tự `fetch`
      `open-index.json` bản thứ hai
    cmd: cd web && node test/chunk-tu-chua.test.js && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: có `fetch("…open-index…")` trong chunk `chungcat` — vế 4
  - AC4: có nút sắp `mới nhất / cũ nhất` và chip lọc khoảng
      `hôm nay · 7 ngày · 30 ngày · tất cả`, cùng đọc `tao_luc`
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: thiếu một trong hai · lọc đọc `nhan_luc` (thời điểm NHẬN, không
      phải thời điểm TẠO) — vế 5/5a/5b
  - AC5: nhóm xếp theo việc MỚI NHẤT trong nhóm, không theo tên bài
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: sắp theo slug ⇒ bài vừa chạy xong không lên đầu — vế 6
  - AC6: tổng kết vẫn nói về CẢ hàng đợi, không tính lại trên tập đã lọc
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: bấm chip `hôm nay` mà con số tổng đổi theo — đó là `WO-015/BUG-2`,
      đã trả giá một lần — vế 7
  - AC7: trần hiển thị `WO-082` vẫn áp cho lưới việc
    cmd: cd web && node test/tran-hien-thi-luoi.test.js

KHÔNG ghi: `web/api/**` · `chungcat/**` — cả ba dữ liệu (`slug`, `title`,
`tao_luc`) đã tới FE rồi; đụng cửa là nới phạm vi mà không cần.
