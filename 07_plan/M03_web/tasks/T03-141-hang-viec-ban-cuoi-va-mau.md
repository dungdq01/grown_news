# T03-141 — Hàng việc: bản cuối · việc của người · màu và nhịp

> `WO-088` · wireframe `SCR-26 §5`, duyệt 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-141-hang-viec-ban-cuoi-va-mau.md
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/styles/prototype.css
  - web/test/chung-cat-nhom-theo-bai.test.js
  - .factory/wo/WO-088-hang-viec-ban-cuoi-va-mau.md

verifiability: hard
tiêu_chí:
  - AC1: đường ống CHỈ chứa việc của người (`sinh-transcript`,
      `chung-cat-mot-nguon`); việc của máy không lên ống
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: `sinh-thumbnail` hay `tai-video` còn là một chặng — vế 15/15a
  - AC2: việc của máy HỎNG vẫn nổi lên, ở một khe riêng
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: lọc trơn ⇒ một `sinh-thumbnail` hỏng biến mất không dấu vết —
      vế 15b
  - AC3: mỗi cặp `(slug, loai)` chỉ giữ việc MỚI NHẤT theo `tao_luc`
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: 4 lần chạy transcript của một bài vẫn ra 4 chặng — vế 16/16a
  - AC4: giữ theo THỜI ĐIỂM, không theo trạng thái — một `đang chạy` mới phải
      thắng một `xong` cũ
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: ưu tiên `xong` ⇒ màn nói "xong" trong khi máy đang chạy — vế 16b
  - AC5: tổng kết vẫn đếm CẢ hàng đợi, không đếm sau khi gộp
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: `25 việc` tụt xuống theo số chặng còn lại — vế 7/17
  - AC6: có cột sống màu theo loại nguồn, và CHỈ chặng `chay` có chuyển động;
      mọi chuyển động tắt dưới `prefers-reduced-motion`
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js && node test/motion-polish.test.js
    đỏ_khi: thiếu `prefers-reduced-motion` · chặng tĩnh cũng động — vế 18
  - AC7: không nới trần bundle — `gn.css` và `gn.js` vẫn dưới trần hiện hành
    cmd: cd web && node test/o-nhan-nap.test.js && node test/token-only.test.js
