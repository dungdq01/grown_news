# T04-14 — `ci.yml`: 29 bước liệt tay → **một** bước `npm test`, để `package.json` là nguồn duy nhất

> Reviewer lần hai (2026-09-15) nêu, PM đo lại. ID rule 9: `ls 07_plan/M04_ci/tasks` max
> 12 ⇒ **14**.
>
> **Sự thật đo được:** `.github/workflows/ci.yml` liệt kê **29 bước** `node test/...`
> riêng lẻ, **không** chạy `npm test`. Hậu quả đo được ngay hôm nay, ba lần cùng một lỗi:
>
> | cổng | trong `package.json` | trong `ci.yml` |
> |---|---|---|
> | `heading-id-anchor.test.js` (`T03-148`, canh C3) | không | không |
> | `kho-delta.test.js` (`T03-150` vừa đăng ký) | có | **không** |
> | `tim-toan-van.test.js` (`T03-152` vừa đăng ký) | có | **không** |
>
> Tức câu *"đã đăng ký cổng vào `npm test`"* trong hai đơn vị vừa xong là **đúng với máy
> dev và sai với CI** — nơi duy nhất có răng. Mỗi cổng mới phải nhớ sửa **hai** chỗ, và
> đã quên đúng ba lần liên tiếp. Đó không phải ba lần bất cẩn, đó là một lớp lỗi: **một
> con số sống ở hai nơi thì hai nơi sẽ lệch**, đúng bài học `_tran.mjs` đã viết ra cho
> trần byte.
>
> **Vì sao gộp chứ không thêm ba bước**: thêm ba bước đóng ca hôm nay và để nguyên lớp
> lỗi cho cổng thứ 33. Gộp thì `package.json` thành nguồn duy nhất, và `T03-164` dựng
> cổng canh việc *không cổng nào rơi khỏi `package.json`*.
>
> **Rủi ro thật, và cách chặn**: gộp 29 bước thành một làm mất **tên bước** trong giao
> diện CI (hỏng ở bước nào thì phải mở log). Đổi lại được tính đúng đắn. `AC3` canh vế
> nguy hiểm hơn nhiều: một cổng **rơi im lặng** khỏi phạm vi chạy.

phạm_vi_ghi:
  - .github/workflows/ci.yml

phụ_thuộc: T03-162, T03-164

verifiability: hard
tiêu_chí:
  - AC1: `ci.yml` **hết** bước `node test/...` riêng lẻ — grep `node test/` ⇒ **0**;
      và có đúng **một** bước chạy `npm test` trong `web/`
    cmd: python core/tests/check_ci_teeth.py
    đỏ_khi: còn ≥1 bước `node test/`, hoặc 0 bước `npm test`
    xanh_khi: 0 và 1
  - AC2: **không cổng nào rơi** — tập 29 file trong bản `ci.yml` trước lượt này phải là
      **tập con** của tập `npm test` chạy thật
    cmd: cd web && node test/ci-phu-kin-cong.test.js
    đỏ_khi: một file của danh sách cũ không được `npm test` chạy ⇒ nêu tên
    xanh_khi: 0 file rơi
  - AC3: **CI vẫn đỏ được**. Sửa một kỳ vọng trong bản sao `web/test/` ở thư mục tạm rồi
      chạy `npm test` ở đó ⇒ exit khác 0. Một `ci.yml` luôn xanh là một `ci.yml` đã chết
    cmd: cd web && node test/ci-phu-kin-cong.test.js --tu-kiem
    đỏ_khi: `npm test` exit 0 trên cây đã gieo lỗi
    xanh_khi: exit khác 0, và nêu tên cổng đã đỏ
  - AC4: các bước **không phải test** của `ci.yml` (lint · cổng python · build) còn
      **nguyên** — đếm số `- name:` trước và sau, chênh lệch đúng bằng 29 − 1 = **28**
    cmd: python core/tests/check_ci_teeth.py
    đỏ_khi: chênh lệch khác 28 ⇒ có bước không-test bị dọn nhầm
    xanh_khi: đúng 28

# ⚠️ `npm test` hôm nay **ĐỎ** vì `page-weight.test.js`: `gn.css` của nhánh `m13` vượt
# trần 105 byte (đo trên blob LF: 106601/106496), và vế *"trang chủ 65667/61440"* đỏ SẴN
# trên `main` — đo trên worktree sạch ép LF. Cả hai là việc khác, đang chờ chủ dự án quyết.
# Đơn vị này KHÔNG sửa chúng và KHÔNG được nới trần để `npm test` xanh: nới trần để cổng
# của mình xanh đúng là điều reviewer vừa bắt ở `T03-149`.
# Nếu CI phải xanh trước khi merge được, đó là một quyết định của chủ dự án, không phải
# một dòng `continue-on-error` do dev thêm.
#
# AC4 đếm 28 chứ không đếm "còn vài bước": số cụ thể là thứ duy nhất phân biệt được
# "dọn đúng 29 bước test" với "dọn nhầm cả bước build".
