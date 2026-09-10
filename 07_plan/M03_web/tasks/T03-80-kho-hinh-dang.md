# T03-80 — FR-041: màn Kho mỗi câu hỏi một hình dạng (đơn vị CODE)

> 7 bộ dữ liệu đang vẽ bằng 3 hình (bar ngang ×3, thanh chia đoạn ×3). Đổi 5
> vùng sang hình đúng bản chất dữ liệu: donut (phần-của-tổng) · lưới ô (đếm
> nhỏ theo loại) · bậc thang (enum có thứ tự) · vòng đời (bảng chuyển) ·
> đường vùng (chuỗi thời gian). Bản đồ + lý do từng hình: FR-041.

phạm_vi_ghi:
  - web/render/trang.mjs
  # Lượt 2 của FR-041 (bỏ tin cậy/ưu tiên/origin, thêm phân loại + theo ngày):
  - web/plugins/home-pages/shell.html   # pt3 cột 2 đổi vai; vòng xoay còn 2 pane
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts  # i18n kho.bycred -> kho.bynhom
  - web/render/shell.html               # bản SSR — thu-vien-nap đòi byte-identical với bản plugins
  - web/plugins/home-pages/index.ts
  - web/render/assets.mjs             # gn.css kịch trần — siết khối cũ (cắt thụt đầu dòng) đúng chỉ dẫn của page-weight     # emitter CHẾT (không ai import) nhưng markup-matches-css vẫn đối chiếu chen⇔mốc
  - 06_modules/M03_web/spec.md          # FROZEN — sửa qua FR-041 lượt 2, KHÔNG ký (baseline đang lệch bởi phiên kia)
  - web/plugins/home-motion/src/home-motion.inline.ts
  - web/styles/prototype.css
  - web/styles/WORKLOG.md
verifiability: hard
tiêu_chí:
  - AC1: 5 vùng đổi hình đúng FR-041; mốc id giữ nguyên; bars4 vẫn lặp trên
      TRANG_THAI đọc từ schema
    cmd: node web/test/bon-trang-thai.test.js
  - AC2: chuyển động một-nhịp qua máy reveal của home-motion, có chốt reduced;
      không rAF loop mới, không backdrop-filter mới
    cmd: node web/test/kho-hinh-dang.test.js
  - AC3: các cổng cũ của web không đỏ
    cmd: cd web && npm test
phụ_thuộc: T03-76
