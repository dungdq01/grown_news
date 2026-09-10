# T03-119 — Hành động vòng đời (Loại · Bỏ · Đưa lên site · Sửa) phải VẼ LẠI TẠI CHỖ + toast nói rõ

> Chủ dự án bắt 2026-09-06: Loại một bài / Bỏ khỏi kho xong — "thông báo
> không rõ ràng, không tự cập nhật, phải Ctrl+Shift+R". API ĐÃ ăn (F5 thấy
> card gạch + rejected) — lỗi ở FE không phản ánh kết quả, người dùng tưởng
> hành động trượt và sẽ bấm lại.
> ID rule 9: max 118 ⇒ 119.

## Hình dạng

- SAU MỖI hành động vòng đời thành công (Đưa lên site · Loại · Bỏ khỏi kho ·
  khôi phục · Sửa-lưu):
  (a) TOAST nói đủ chủ-vị: "Đã LOẠI «tiêu đề» — ở lại kho, rejected, rời
      site" / "Đã BỎ «…» vào thùng rác — khôi phục được ở màn Kho" /
      "Đã ĐƯA «…» lên site" — không toast chung chung "thành công";
  (b) CỬA SỔ đang mở: khối meta (TIN CẬY/trạng thái) + BỘ NÚT chân cửa sổ
      đổi NGAY theo trạng thái mới (bài rejected thì hết nút Loại, có nút
      khôi-phục-về-draft nếu đường đó có); Bỏ khỏi kho ⇒ cửa sổ tự ĐÓNG
      kèm toast (bản ghi không còn để xem);
  (c) DANH SÁCH nền (màn /bai-viet/ · /tai-lieu/ · Kho): card vẽ lại tại
      chỗ (badge/gạch/đếm KPI) — khuôn veDanhMuc/dongBoThe sẵn có, 0 F5.
- Hành động THẤT BẠI (4xx/5xx): thân lỗi hiện nguyên văn, KHÔNG đổi gì.
- (chủ dự án duyệt 2026-09-06, cả hai lối) LỐI 1: card trạng thái draft ở màn
  quản lý mang nhãn "KHO — chưa lên site"; toast sau Duyệt-vào-kho chỉ đường:
  "Đã vào kho (draft). Muốn công khai: bấm Đưa lên site." LỐI 2: cửa sổ duyệt
  nháp (cctab) thêm checkbox "Đưa lên site luôn sau duyệt" — NGƯỜI quyết trong
  cùng cú bấm, FE gọi 2 cửa liên tiếp (duyệt → status approved), máy vẫn không
  tự approve; checkbox mặc định TẮT.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # toast + vẽ lại cửa sổ/bộ nút + đóng khi bỏ
  - web/render/trang.mjs                                        # CHỈ nếu card cần data-mount thêm
# vế cổng thuộc đơn vị test đi kèm (vong-doi-bai.test.js + cua-so-doc.test.js mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC1: mock Loại thành công ⇒ toast chứa tiêu đề + chữ "rejected"/"ở lại
      kho"; bộ nút chân cửa sổ đổi (hết nút Loại); card nền gạch — TẤT CẢ
      không reload (đo trong cùng DOM)
    cmd: node web/test/vong-doi-bai.test.js
    đỏ_khi: toast chung chung, hoặc DOM giữ trạng thái cũ tới khi reload
    xanh_khi: ba mặt (toast · cửa sổ · card) cùng đổi tại chỗ
  - AC2: Bỏ khỏi kho ⇒ cửa sổ đóng + toast nêu đường khôi phục; card rời lưới
    cmd: node web/test/vong-doi-bai.test.js
  - AC3: hành động 4xx ⇒ 0 thay đổi DOM + lỗi nguyên văn
    cmd: node web/test/vong-doi-bai.test.js
  - AC4: card draft mang nhãn "chưa lên site"; checkbox bật ⇒ sau duyệt bài
      thành approved (2 lời gọi đúng thứ tự, mock đếm); checkbox tắt ⇒ dừng ở
      draft như cũ
    cmd: node web/test/vong-doi-bai.test.js
  - AC5: bài rejected KHÔNG xuất hiện ở list mặc định; bộ lọc "Đã loại" đếm
      đúng và mở ra thấy nó; nạp lại cùng sha/slug vẫn bị chặn (dedup nguyên)
    cmd: node web/test/vong-doi-bai.test.js
  - AC6: suite web xanh
    cmd: cd web && npm test
