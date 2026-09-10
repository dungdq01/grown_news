# T03-136 — Trần hiển thị cho mọi lưới

> `WO-082`. Chủ dự án 2026-09-09: *"ko có cơ chế phân trang và limit size, nên
> khi dữ liệu nhiều là bị tràn màn - phải scroll xuống liên tục"*.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-136-tran-hien-thi-danh-sach.md
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/styles/prototype.css
  - web/test/tran-hien-thi-luoi.test.js
  - web/test/_tran.mjs

verifiability: hard
tiêu_chí:
  - AC1: mỗi lưới chỉ hiện tối đa `TRAN_NHIN` (12) thẻ CHƯA bị lọc; phần dư
      mang class `qua` và bị CSS ẩn
    cmd: cd web && node test/tran-hien-thi-luoi.test.js
    đỏ_khi: 30 thẻ mà hiện quá 12 — vế 2/2a/9
  - AC2: trần đếm trên tập ĐÃ LỌC, không trên tập gốc; lọc còn 5 thẻ thì hiện
      đủ 5 và không mọc nút thừa
    cmd: cd web && node test/tran-hien-thi-luoi.test.js
    đỏ_khi: đếm trên tập gốc ⇒ màn `/video/` trống dù có 5 video — vế 5/5a
  - AC3: có nút `xem thêm N · còn M` ngay sau lưới; bấm nới thêm một trần,
      hết thẻ dư thì nút tự rút
    cmd: cd web && node test/tran-hien-thi-luoi.test.js
    đỏ_khi: nút đọc trần từ biến đóng ⇒ lần bấm thứ hai không nhích — vế
      3/3a/4/4a/4b
  - AC4: đổi bộ lọc thì trần tính LẠI (`datLai`), và nhãn đếm vẫn nói về tập
      sau lọc — KHÔNG tụt xuống theo phần đang hiện
    cmd: cd web && node test/tran-hien-thi-luoi.test.js
    đỏ_khi: giữ trần đã nới của bộ lọc trước · `apLoc` đếm bỏ luôn `.qua` —
      vế 6/8
  - AC5: chunk `chungcat` gọi `capNhin` QUA cầu `__GN_MW__`, không gọi trần;
      `apLoc` quét MỌI `.grid`, không riêng `grid2`
    cmd: cd web && node test/chunk-tu-chua.test.js
    đỏ_khi: gọi `capNhin` trần trong chunk ⇒ ReferenceError lần vẽ đầu — vế
      7/7a/7b/7c

KHÔNG ghi: `web/render/trang.mjs` — không cắt ở SSR. Ba màn loại dùng chung
`grid2` và lọc ở FE bằng `.off`; cắt 12 thẻ đầu ở server nghĩa là một video
xếp thứ 25 theo thứ tự chung KHÔNG TỒN TẠI trên màn `/video/` dù màn ấy chỉ có
4 video. Đó là mất dữ liệu trên màn, không phải phân trang.

ghi_chú: `capNhin` tốn 853 byte đã nén ⇒ `gn.js` vượt trần 513 byte. Bốn đường
lấy lại byte đã đo (`WO-083`) và cả bốn bằng 0. Gỡ chặn bằng `FR-061a` — chủ
dự án ký 2026-09-09 (*"ok, duyệt và ký giúp tôi"*), `TRAN_KB.js` 102 → 103.
