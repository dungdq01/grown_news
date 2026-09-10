# T03-10 — FR-036: test nghiệm thu cho khung 8 ô (đơn vị TEST)

> Đơn vị TEST riêng vì R1: FE không ghi test nghiệm thu của chính nó. T03-9 khai
> phạm vi không chứa `web/test/**`, nên hai file dưới đây — vốn khẳng định hình
> dạng FE CŨ — chỉ trạm m-test được sửa.

phạm_vi_ghi:
  - web/test/four-screens.test.js
  - web/test/cua-so-doc.test.js
  - web/test/khung-8-o.test.js
verifiability: hard
tiêu_chí:
  - AC1: màn Nạp nguồn khai đúng số ô = số mục LÁ đọc từ khung, và ba hàm dựng /
      gom / rải ô có mặt trong bundle
    cmd: cd web && node test/four-screens.test.js && node test/khung-8-o.test.js
  - AC2: mục tinh túy nhận `.tt-h` ở cấp h3 và các tinh túy nhận `.tt-b` ở cấp
      h4; vòng quét DỪNG ở h3 lẫn h2 — không dừng thì mọi h4 sau §3.4 thành tinh túy
    cmd: cd web && node test/cua-so-doc.test.js
phụ_thuộc: T03-9
