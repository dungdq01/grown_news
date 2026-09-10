# T03-90 — màn "Đợt hai" (mock M12–M16) TRONG chính web app

> Chỉ đạo người dùng 2026-09-01: *"kế thừa từ UI đã có, và nó trên cùng 1 giao
> diện luôn — dựng overview cho xong, khi agent khác hoàn thiện s6 docs thì dựa
> vào đó hoàn thiện prototype"*. app-v21.html (standalone) giữ làm bản nháp s5;
> bản CHÍNH của mock đợt hai là một màn thật trong web.
>
> Mức OVERVIEW: một route `/dot-hai/`, 5 panel M12–M16 render từ ĐÚNG
> `05_uiux/contracts/*.sample.v1.json` (một nguồn sự thật). Không JS mới,
> không cửa sổ mới — tương tác chi tiết đợi s6.

phạm_vi_ghi:
  - core/assets/man-hinh.json      # NGOÀI fe của M03 trong map v17/v18 — khai tường minh:
      # đây là BẢNG KHAI MÀN mà server/trang.mjs/build-fe đều dẫn xuất; thêm màn
      # là đúng ngữ pháp của bảng ($comment_chi_khai_man_da_dung: mục vào bảng
      # CHỈ khi view render được — commit cùng lúc với view). Agent C1 không chạm
      # file này. Nợ này đã thành FR-056 (2026-09-03) — man-hinh.json về chủ M03.
  - web/render/shell.html
  - web/plugins/home-pages/shell.html   # byte-identical với bản trên (thu-vien-nap canh)
  - web/render/trang.mjs                # +trangDotHai() + nhánh renderTrang
  - web/styles/prototype.css            # +khối .dh-* (token-only) + icon mask tab dothai
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # +i18n nav.dothai
  - web/test/**                         # cổng ghim đổi CÓ CHỦ ĐÍCH, mỗi chỗ kèm lý do
  - 05_uiux/screen_inventory.md         # cập nhật: mock sống ở /dot-hai/, v21 là nháp

verifiability: hard
tiêu_chí:
  - AC1: /dot-hai/ và /mock/dot-hai/ trả 200 + mốc .mid — ssr-routes TỰ phủ vì
      route dẫn xuất từ man-hinh.json
    cmd: node web/test/ssr-routes.test.js
  - AC2: tab "Đợt hai" đúng format rail (data-nav thuần [a-z], nhãn ≤9 ký tự,
      CÓ icon mask — iconMask >= soTab)
    cmd: node web/test/rail-trai.test.js
  - AC3: trang /dot-hai/ chứa đủ 5 mốc module m12..m16 lấy số liệu từ contracts;
      trang KHÁC không mang view v-dothai (cat_khi_khac — page-weight không phình)
    cmd: node web/test/page-weight.test.js
  - AC4: hai shell byte-identical
    cmd: node web/test/thu-vien-nap.test.js
  - AC5: không phá gì — toàn bộ cổng web xanh
    cmd: cd web && npm run build && npm test
