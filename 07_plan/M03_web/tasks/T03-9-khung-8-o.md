# T03-9 — FR-036: form nạp theo khung khai (8 ô) + tinh túy h3/h4

# Khi dựng form mới lộ ra `nang: true` đang đặt ở §3 (mục cha) trong khung khai,
# còn SCR-05 chốt mục nặng là §3.2 và §3.4. Tôi thử nới phạm vi task này để sửa
# — và `check_g6b` chặn đúng: `core/assets/**` ngoài boundary M03_web (`web/**`).
# Việc đó thuộc M01_core ⇒ T01-6. Đây là ca "nới ở tầng chia việc" chạy thật.
phạm_vi_ghi:
  - web/build-fe.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/styles/prototype.css
verifiability: hard
tiêu_chí:
  - AC1: khung thân bài tới được bundle FE qua MỘT nguồn khai; văn xuôi (2 shell)
      khớp số mục lá và số mục `##` đọc từ core/assets/khung-than-bai.json
    cmd: python core/tests/check_khung.py
  - AC2: bundle dịch được; mọi class mới có luật CSS; và mọi test KHÔNG phải
      test nghiệm thu của màn nạp / cửa sổ đọc vẫn xanh.
      Hai file `four-screens` + `cua-so-doc` khẳng định hình dạng FE CŨ, và R1
      cấm đơn vị này chạm `web/test/**` ⇒ chúng thuộc T03-10 (m-test).
    cmd: cd web && node build-fe.mjs && node test/markup-matches-css.test.js && node test/luong-nap-bai.test.js && node test/chu-giao-dien.test.js && node test/page-weight.test.js && node test/cac-man-con-lai.test.js
phụ_thuộc: T01-6
