# T03-151 — lấy lại byte `gn.js`, và `tach()` đọc được cả ba dạng khai báo

> `WO-097`.
> 🔁 **Đổi số `T03-148` → `T03-151` (2026-09-11, PM M13 làm theo chỉ đạo chủ dự án).**
> `T03-148` đã bị `T03-148-test-heading-id-anchor.md` lấy từ 09-10 08:37 (commit
> `805ccd3`, **8 chỗ trỏ tới**: `T03-149` · hai `backlog.md` · `BAN-GIAO-DEV` · ba
> worklog). Bản này tạo 09-11 06:57, **2 chỗ trỏ** ⇒ đổi bản ít tham chiếu ngoài hơn,
> cùng cách đã xử `FR-070`/`FR-071`/`WO-084`. Nội dung KHÔNG đổi.
> `check_g6b` tố đúng: hai file một ID thì file sau **ghi đè** file trước trong dict
> của cổng, nên `phạm_vi_ghi` của một trong hai **không được kiểm** — R1 mất địa chỉ.
> ID mới: `ls 07_plan/M03_web/tasks` max dải hiện hành = 150 ⇒ 151 (190+ là PM-Space).

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-151-lay-lai-byte-va-thuoc-tach.md
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/test/chung-cat-nhom-theo-bai.test.js
  - _devops/infra.md
  - .factory/wo/WO-097-lay-lai-byte-sau-dot-chung-cat.md

verifiability: hard
tiêu_chí:
  - AC1: `gn.js` dưới trần 105472 mà KHÔNG sửa `web/test/_tran.mjs`
    cmd: cd web && node test/tab-theo-doi-chung-cat.test.js && node test/nap-ba-khung.test.js && node test/sinh-transcript-ui.test.js && node test/o-nhan-nap.test.js && node test/chung-cat-hover.test.js && node test/sua-dung-man.test.js && node test/mo-ta-va-nut-nap.test.js
    đỏ_khi: bundle 105539 — bảy cổng trần đỏ cùng lúc
  - AC2: `tach()` trích được `function` · `async function` · `const … =`
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: '`viecNguoi` sang dạng mũi tên ⇒ vế 15-0 báo "phép lọc không nằm ở cầu"'
  - AC3: `tach()` vẫn ĐỎ ĐƯỢC — mất tên thì trả `null`, không trả nhầm khối khác
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js
    đỏ_khi: neo lỏng khớp cả chỗ GỌI hàm ⇒ vế nào cũng xanh
  - AC4: đổi sang `const` không sinh TDZ — `_cau()` chỉ gọi trong hàm
    cmd: cd web && node test/cua-so-khong-phai-bai-kho.test.js && node test/tab-ket-qua-day-du.test.js
    đỏ_khi: '`_cau()` chạy lúc nạp module ⇒ ReferenceError trên `_timBan`'
  - AC5: không đỏ mới ngoài 7 đỏ nền đã khai ở `_devops/infra.md` §3
    cmd: cd web && ls test/*.test.js | while read f; do node "$f" >/dev/null 2>&1 || echo "RED $f"; done
    đỏ_khi: danh sách đỏ dài hơn 7 dòng
