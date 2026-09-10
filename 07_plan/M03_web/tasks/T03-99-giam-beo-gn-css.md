# T03-99 — GIẢM BÉO gn.css (chạy TRƯỚC T03-93/94/95)

> Chặn cứng: gn.css còn **39 byte** dư dưới trần 100KB — không đơn vị UI nào
> thêm được một luật. Chỗ béo ĐÃ ĐO: 8 luật `.tb[data-nav]::before` lặp ~960
> byte boilerplate SVG (`xmlns…viewBox…stroke-width…linecap…linejoin`).
> Đây là đơn vị PHÉP BỎ/GỌN — không đổi hình icon nhìn thấy, không nới trần.

phạm_vi_ghi:
  - web/styles/prototype.css           # 8 icon mask
  - web/render/assets.mjs              # CHỈ nếu chọn lối phép-BỎ lúc ghép (giữ số dòng — khuôn catBinhLuan)

verifiability: hard
tiêu_chí:
  - AC1: gn.css giảm ≥600 byte so mốc (đo bằng máy trước/sau, số ghi worklog);
      trần 102400 giữ nguyên — CẤM nới
    cmd: cd web && npm test
  - AC2: 8 tab vẫn đủ icon (iconMask >= soTab — rail-trai) và icon nhìn KHÔNG
      đổi (screenshot đối chiếu trước/sau, đính worklog)
    cmd: node web/test/rail-trai.test.js
  - AC3: nếu đổi cách vẽ (stroke→fill path): vẫn currentColor, không hex
    cmd: cd web && npm test
