# T03-147 — `?dang=pdf` render bằng Typst

> `WO-096`.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-147-xuat-pdf-typst.md
  - web/api/xuat-cua.mjs
  - core/assets/xuat-dang.json
  - web/test/xuat-pdf-typst.test.js
  - .factory/wo/WO-096-xuat-pdf-bang-typst.md

verifiability: hard
tiêu_chí:
  - AC1: `mdSangTypst` dựng đúng tiêu đề · bảng · danh sách · trích dẫn ·
      khối mã · đậm/nghiêng/mã · liên kết
    cmd: cd web && node test/xuat-pdf-typst.test.js
    đỏ_khi: bảng ra chữ thô — vế 1…1f
  - AC2: ÂM · ký tự đặc biệt của Typst trong thân bài bị THOÁT
    cmd: cd web && node test/xuat-pdf-typst.test.js
    đỏ_khi: `#import`/`#eval` do model sinh chạy được trong bộ dựng — vế 2/2a/2b
  - AC3: chạy THẬT `typst` ⇒ PDF hợp lệ, và dấu tiếng Việt round-trip 100%
    cmd: cd web && node test/xuat-pdf-typst.test.js
    đỏ_khi: NCM thiếu glyph — vế 3/3a
  - AC4: không có binary ⇒ 503 nói thẳng, KHÔNG file rỗng; `?dang=in` còn nguyên
    cmd: cd web && node test/xuat-pdf-typst.test.js && node test/in-pdf-dinh-dang.test.js
    đỏ_khi: trả 200 với 0 byte — vế 4
  - AC5: bảng khai `xuat-dang.json` có `pdf`, và cửa 422 cho loại không hỗ trợ
    cmd: cd web && node test/xuat-pdf-typst.test.js && node test/xuat-van-ban.test.js
