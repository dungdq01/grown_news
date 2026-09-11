# T03-152 — đơn vị TEST: dời cổng `T03-125-tim-toan-van.test.js` vào `web/test/` + đăng ký `npm test`

> Khuôn **`T03-150`** (đã làm cho cổng `T08-35`), cùng lý lẽ: `rule.md` mục 8 — cổng
> viết-trước sống ở thư mục task, **dời vào `web/test/` + đăng ký `npm test` CÙNG LƯỢT
> với mã**; và `check_g6b` §5 (R1) đòi việc dời là một **đơn vị test riêng**.
> Dev đã viết cổng ở `07_plan/M03_web/tasks/T03-125-tim-toan-van.test.js` (12 523 byte,
> 2026-09-11) và thi công xong `T03-125` bước 2 — nay là lúc dời.
> ID rule 9: `ls 07_plan/M03_web/tasks` max dải hiện hành 151 ⇒ dải CHẴN của dev chính
> ⇒ **152** (190+ là PM-Space).
>
> **Vì sao phải dời, nói bằng một câu đo được**: cổng nằm ở `07_plan/` **không** có trong
> `web/package.json` lẫn `ci.yml` ⇒ **0 răng tự động**. Một cổng không ai chạy là một cổng
> sẽ mục — và nó mục **im lặng**, vì màu xanh cuối cùng của nó vẫn nằm trong worklog.
>
> `git mv`, **không copy**: lịch sử đỏ-trước của cổng phải đi theo file (R5 đo bằng
> worklog, nhưng người đọc sau cần `git log --follow` thấy được).

phạm_vi_ghi:
  - web/test/tim-toan-van.test.js
  - web/package.json           # đăng ký vào scripts.test — MỘT dòng

phụ_thuộc: T03-125

verifiability: hard
tiêu_chí:
  - AC1: `git mv 07_plan/M03_web/tasks/T03-125-tim-toan-van.test.js
      web/test/tim-toan-van.test.js` (mv, không copy); cổng vẫn pass ở chỗ mới, kể cả
      vế gọi `_api.mjs` nếu có (T03-150 phải đổi một dòng import — kiểm xem cổng này có
      cần không)
    cmd: cd web && node test/tim-toan-van.test.js
  - AC2: `npm test` gọi cổng này — grep tên file trong `web/package.json` ⇒ 1; và bốn
      trạng thái của SCR-27 (rỗng · đang tìm · 0-kết-quả · lỗi service) vẫn được đo
    cmd: cd web && npm test
  - AC3: cổng CỦA ĐƠN VỊ NÀY không sống hai chỗ — `07_plan/M03_web/tasks/T03-125-tim-toan-van.test.js`
      KHÔNG còn tồn tại, và `web/test/tim-toan-van.test.js` có
    cmd: cd web && node test/tim-toan-van.test.js

# AC3 viết theo bản ĐÃ SỬA của T03-150 (2026-09-11): đo **file của đơn vị này**, KHÔNG
# đo "thư mục hết .test.js". Còn `T08-26b-cai-dat.test.js` trong `07_plan/M08_api/` là
# cổng viết-trước của `T08-17b` — đơn vị KHÁC, mã chưa thi công nên chưa tới lúc dời,
# đã có ô backlog M08. AC của một đơn vị chỉ được đo thứ đơn vị đó làm ra.
