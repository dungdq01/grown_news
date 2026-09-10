# T03-112 — CỬA SỔ CHƯNG CẤT SONG SONG: tiến trình → kết quả → DUYỆT tại chỗ

> USER FLOW CHỐT (chủ dự án mô tả nguyên văn 2026-09-05, ĐÈ hình dạng tab
> của T03-110 cho phần theo dõi): *"Đang đọc bài, xem video → click Chưng cất
> / Sinh transcript → web hiển thị 1 tab window CHẠY SONG SONG đến khi ra kết
> quả (UI phải có animation chuyển động đẹp và AI) — tôi vừa xem bản tài liệu
> vừa xem bản chưng cất BÊN CẠNH. Màn /chung-cat/ chỉ là nơi lưu trữ và quản
> lý. Nút DUYỆT hiển thị ở tab xem detail chưng cất luôn — bấm duyệt là xong,
> không phải vào đâu duyệt nữa; chưa duyệt thì nháp nằm lại làm backup."*
> ID theo rule.md mục 9: 112 (giữ số đã cấp, nội dung viết lại theo flow chốt).

## Hình dạng

1. **Bấm Chưng cất/Sinh transcript (đã xác nhận popup) ⇒ mở CỬA SỔ MULTIWINDOW
   MỚI**, tự đặt CẠNH cửa sổ đang đọc (hai cửa sổ song song — hệ multiwindow
   sẵn có nhiều cửa sổ; nếu màn hẹp thì xếp chồng lệch, người kéo được).
   Cửa sổ cũ giữ nguyên bài đang đọc — KHÔNG rời, KHÔNG đổi tab của nó.
2. **Pha ĐANG CHẠY** (đặc tả design "sang chảnh" của T03-110 áp nguyên):
   pipeline stepper động theo giai đoạn enum — nút giai đoạn hiện hành nhịp
   thở pulse/glow, qua giai đoạn thì ✓ nảy, dừng thì đổi màu + rung một nhịp;
   đồng hồ elapsed chạy; poll 3–5s chỉ khi cửa sổ mở và việc còn chạy.
3. **Pha XONG — "khoảnh khắc"**: chuyển cảnh (shimmer/vòng ✓ vẽ nét) rồi
   TOÀN VĂN bản chưng cất trải ra trong chính cửa sổ (đổ chữ an toàn khuôn
   hv-txt) + citations đã verify + cảnh "đã tỉa N" nếu có.
4. **DUYỆT TẠI CHỖ**: nút "Duyệt vào kho" ngay dưới kết quả — gọi ĐÚNG hành
   động duyệt sẵn có của cửa nháp (validate→ghiSauValidate, một cửa ghi —
   FE chỉ thêm NÚT, không thêm đường ghi); duyệt xong: trạng thái đổi
   "ĐÃ VÀO KHO" + toast, khỏi đi đâu nữa. Kèm nút phụ "Xem diff với bản AI"
   và link "mở hàng nháp" (Sửa/Trả/Bỏ vẫn ở màn nhập).
   CHƯA duyệt ⇒ nháp nằm lại hàng nháp làm backup — đúng FR-046, không đổi gì.
5. **/chung-cat/ = LƯU TRỮ + QUẢN LÝ**: thẻ `xong` bấm mở nội dung (?nhap=);
   khối "BẢN CHƯNG CẤT" đếm tách 4 trạng thái (nháp · đã sửa · trả lại ·
   đã vào kho) + lối vào /chung-cat/nhap/. Job `dung`/hết lượt tách nhóm
   khỏi "đang chạy" (ô backlog bộ-đếm-gộp).
6. Tab "Chưng cất" T03-110 trong cửa sổ đọc GIỮ làm danh sách lịch sử việc
   của bản ghi (mặt tra cứu); cửa sổ song song là mặt TRẢI NGHIỆM chính.

phạm_vi_ghi:
  - web/plugins/cctab/src/cctab.inline.ts          # thân cửa sổ: stepper + kết quả + nút duyệt
  - web/plugins/chungcat/src/chungcat.inline.ts    # mở cửa sổ sau xác nhận gửi + màn quản lý (khối BẢN CHƯNG CẤT, link thẻ xong)
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # spawn cửa sổ cạnh cửa sổ nguồn
  - web/styles/prototype.css                       # đo trước — gn.css đang sát trần
# cổng thuộc đơn vị test đi kèm (khuôn 110b): tab-theo-doi-chung-cat.test.js + chung-cat-quan-ly.test.js thêm vế

verifiability: hard
tiêu_chí:
  - AC1: gửi thành công ⇒ cửa sổ MỚI mở cạnh cửa sổ nguồn; cửa sổ nguồn giữ
      nguyên nội dung đang đọc (đo markup: 2 cửa sổ, bài gốc còn nguyên)
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
    đỏ_khi: nội dung cửa sổ nguồn bị thay, hoặc không cửa sổ mới nào mở
    xanh_khi: 2 cửa sổ song song, nguồn nguyên vẹn
  - AC2: việc chuyển `xong` (mock) ⇒ cửa sổ render ban_hien_tai + citations;
      chữ đổ bằng textContent ("<script>" hiện như chữ)
    cmd: node web/test/tab-theo-doi-chung-cat.test.js && node web/test/no-dangerous-html.test.js
  - AC3: nút Duyệt gọi ĐÚNG endpoint duyệt sẵn có của cửa nháp — không route
      ghi mới (api-guard whitelist không đổi); duyệt xong trạng thái trong
      cửa sổ đổi "đã vào kho" và bài xuất hiện trong kho
    cmd: node web/test/tab-theo-doi-chung-cat.test.js && node web/test/api-guard.test.js
  - AC4: /chung-cat/ có khối BẢN CHƯNG CẤT đếm tách 4 trạng thái + lối vào
      /chung-cat/nhap/; thẻ xong mang link ?nhap=
    cmd: node web/test/chung-cat-quan-ly.test.js
    đỏ_khi: không đường bấm từ /chung-cat/ tới hàng nháp, hoặc đếm gộp trạng thái
    xanh_khi: link + 4 số tách
  - AC5: suite web xanh + page-weight xanh (trả trần về xanh trước bàn giao)
    cmd: cd web && npm test
  - AC6: animation trong khối prefers-reduced-motion, chỉ transform/opacity/
      color (kế thừa AC6 T03-110)
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
  - AC7 (soft — NGƯỜI chấm): quay màn flow "đọc bài → bấm chưng cất → cửa sổ
      song song chạy animation → kết quả trải ra → bấm Duyệt tại chỗ" đính
      worklog; chủ dự án phán "đẹp và AI" lúc nghiệm thu