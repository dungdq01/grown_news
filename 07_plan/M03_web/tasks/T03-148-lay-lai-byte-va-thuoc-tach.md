# T03-148 — lấy lại byte `gn.js`, và `tach()` đọc được cả ba dạng khai báo

> `WO-097`.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-148-lay-lai-byte-va-thuoc-tach.md
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
