# T03-127 — FE: tên file qua header ở dạng ASCII + `catch` tách hai ca

> `WO-057`. Bug chủ dự án báo 2026-09-09. ID rule 9: max 126 ⇒ 127.

## Hình dạng

- BA chỗ gửi cùng một lối `encodeURIComponent(f.name)`:
  `napvideo.inline.ts` (`x-ten-goc`) · `multiwindow.inline.ts` (`x-ten-goc`
  và `x-ten-file`). Vá một chỗ là để hai chỗ hỏng im lặng.
- `catch` **tách hai ca**: request chưa rời máy (TypeError lúc dựng) ≠ máy chủ
  không nghe. Gộp chúng là chỉ người đọc đi sửa nhầm chỗ (`workflow §1a`).
- Một hàm dùng chung cho phép mã hoá, KHÔNG ba bản gõ tay — ba bản là ba chỗ
  để lệch, và chỗ thứ ba luôn là chỗ lệch.

⚠️ `multiwindow.inline.ts` có sửa CHƯA COMMIT của phiên khác (`FR-011`):
đọc lại file ngay trước khi Edit, không gỡ thay đổi dở của họ.

phạm_vi_ghi:
  - web/plugins/napvideo/src/napvideo.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
# cổng thuộc đơn vị test T03-110b (ten-file-co-dau.test.js) — R1

verifiability: hard
tiêu_chí:
  - AC1: cả BA chỗ gửi đều mã hoá tên file; grep `"x-ten-goc": f.name` và
      `"x-ten-file": f.name` ⇒ 0 dòng
    cmd: node web/test/ten-file-co-dau.test.js
    đỏ_khi: còn một chỗ nhét tên thô vào header
    xanh_khi: 3/3 chỗ đi qua phép mã hoá dùng chung
  - AC2: `catch` phân biệt hai ca — có nhánh nói về TÊN FILE, và câu
      "máy chủ chưa chạy" KHÔNG còn là câu duy nhất
    cmd: node web/test/ten-file-co-dau.test.js
  - AC3: phép mã hoá là MỘT hàm dùng chung, không ba bản gõ tay
    cmd: node web/test/ten-file-co-dau.test.js
  - AC4: suite web xanh (trừ vế page-weight đã có chủ ở WO-055)
    cmd: cd web && npm test
