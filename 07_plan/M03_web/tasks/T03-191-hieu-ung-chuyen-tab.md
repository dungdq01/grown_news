# [Space] T03-191 — HIỆU ỨNG chuyển tab + prefetch + cache + skeleton

> Ý tưởng gốc §6 — và §6.4 tự nói thẳng: *"rủi ro thật là độ trễ mạng, không
> phải animation"*. Nên đơn vị này làm **cả bốn** thứ cùng lúc, không tách
> hiệu ứng ra làm một mình.
> CHẶN CỨNG: sau `T03-190` (tab sống trên dữ liệu thật).
> phụ_thuộc: T03-190
> ID: dải Space ở M03 = 190+.

## Hình dạng

- **View Transitions API** (`document.startViewTransition`) — native, 0 byte
  thư viện, tự fallback khi trình duyệt không hỗ trợ.
- Trượt hướng theo vị trí tab + so le nhẹ (§6.1-6.2: out 160ms · in 300ms ·
  stagger 45ms · tổng ≤600ms).
- **Prefetch on hover** · **cache theo space** (quay lại tab cũ hiện tức thì)
  · **skeleton giữ đúng chiều cao** (§6.4 — thứ phá cảm giác mượt nhiều nhất).
- `prefers-reduced-motion`: đổi thẳng, 0 animation (bắt buộc — và là cách QA
  tách logic khỏi hiệu ứng).
- Back/Forward chạy **animation ngược hướng**; state cũ (filter/sort/scroll)
  giữ nguyên khi quay lại tab (§4.2 kịch bản B).

phạm_vi_ghi:
  - web/plugins/spacetab/src/spacetab.inline.ts
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: mọi animation nằm trong khối `prefers-reduced-motion`; chỉ
      transform/opacity (không animate layout) — đo trên CSS thật
    cmd: node web/test/tab-space.test.js
    đỏ_khi: animate width/height/top/left, hoặc luật ngoài khối reduced
    xanh_khi: cả hai vế
  - AC2: rê chuột lên tab ⇒ ĐÚNG MỘT request prefetch; bấm ⇒ 0 request thêm
      (cache); quay lại tab cũ ⇒ 0 request
    cmd: node web/test/tab-space.test.js
  - AC3: skeleton giữ chiều cao — container không sập rồi bung (đo style
      min-height trong lúc chuyển)
    cmd: node web/test/tab-space.test.js
  - AC4: Back/Forward đúng space + state cũ (filter/sort/scroll) còn nguyên
    cmd: node web/test/tab-space.test.js
  - AC5 (soft — NGƯỜI chấm): quay màn chuyển tab trên dữ liệu thật, đính
      worklog; chủ dự án phán "mượt" lúc nghiệm thu
  - AC6: suite web + page-weight xanh
    cmd: cd web && npm test
