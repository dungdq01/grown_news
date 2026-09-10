# T03-139 — `/chung-cat/` dòng bài + đường ống, mốc ngày

> `WO-086` · wireframe `SCR-26` **ĐÃ DUYỆT** 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-139-hang-viec-duong-ong.md
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css
  - web/test/chung-cat-nhom-theo-bai.test.js
  - web/test/tran-hien-thi-luoi.test.js
  - 05_uiux/wireframes/SCR-26-hang-viec-duong-ong.md
  - .factory/wo/WO-086-hang-viec-duong-ong.md

verifiability: hard
tiêu_chí:
  - AC1: một bài = MỘT dòng `.cc-bai`, mang bìa + tiêu đề + dải chặng `.cc-ong`;
      mỗi chặng là một việc
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: vẫn vẽ mỗi việc một thẻ `.cd` rời — vế 9/9a
  - AC2: chặng mang trạng thái bằng CLASS (`xong · chay · hong · trong`), đọc
      từ `giai_doan` của chính việc ấy
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: mọi chặng cùng một class ⇒ màu không nói gì — vế 9b/9c
  - AC3: nhóm dưới MỐC NGÀY `Hôm nay · Hôm qua · <mm-dd>`, kèm số việc
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: không có mốc · mốc sai nhãn cho hôm nay/hôm qua — vế 10/10a/10b
  - AC4: BA hàng nút biến mất — không còn `data-cclc`, `data-ccsap`,
      `data-cckhoang` trong markup
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: còn sót một hàng — vế 11
  - AC5: `capNhin` nhận SELECTOR; chunk `chungcat` truyền `.cc-bai`
    cmd: cd web && node test/tran-hien-thi-luoi.test.js && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: `capNhin` còn neo cứng `.cd` ⇒ trần WO-082 im lặng ngừng chạy trên
      màn này và không cổng nào báo — vế 12/12a
  - AC6: ba cổng đang đọc `ccThe` VẪN XANH — `tenLoai(...)` và `data-ccnhap`
      còn nguyên trong bộ vẽ chặng
    cmd: cd web && node test/the-viec-noi-ro-loai.test.js && node test/viec-theo-loai.test.js && node test/ban-cu-vao-rac.test.js
  - AC7: tổng kết vẫn nói về CẢ hàng đợi, và ba số ấy bấm được để lọc
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: số tổng đổi theo bộ lọc (`WO-015/BUG-2`) — vế 7/13

KHÔNG ghi: `web/api/**` · `chungcat/**` — dữ liệu đã đủ ở FE từ `WO-085`.
