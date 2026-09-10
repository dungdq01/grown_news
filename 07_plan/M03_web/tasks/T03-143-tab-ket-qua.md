# T03-143 — Tab `Kết quả`: "tất cả" đúng nghĩa, vẽ theo `SCR-26`

> `WO-090`. Chủ dự án 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-143-tab-ket-qua.md
  - web/api/dungchung.mjs
  - web/api/nhap-cua.mjs
  - web/plugins/chungcat/src/chungcat.inline.ts
  - web/test/tab-ket-qua-day-du.test.js
  - .factory/wo/WO-090-tab-ket-qua.md

verifiability: hard
tiêu_chí:
  - AC1: cửa nhận `?gom_da_bo=1` ⇒ trả CẢ `da_bo`; KHÔNG cờ ⇒ hành vi y như cũ
    cmd: cd web && node test/tab-ket-qua-day-du.test.js
    đỏ_khi: đổi MẶC ĐỊNH thay vì thêm cờ ⇒ hàng đợi việc của `T03-94` bỗng
      cõng bản đã bỏ — vế 1/1a/1b
  - AC2: `tong` đếm CÙNG tập với `dong` ở CẢ HAI chế độ
    cmd: cd web && node test/tab-ket-qua-day-du.test.js
    đỏ_khi: badge nói 8 mà danh sách 3 — `dungchung.mjs` đã ghi đúng cái bẫy
      này — vế 1c
  - AC3: tab `Kết quả` gọi kèm cờ; chip `đã bỏ` ra 5, `tất cả` ra 8
    cmd: cd web && node test/tab-ket-qua-day-du.test.js
    đỏ_khi: còn `fetch("/api/nhap-chung-cat?n=50")` trần — vế 2/2a
  - AC4: bốn ô số đếm trên TẬP ĐẦY ĐỦ
    cmd: cd web && node test/tab-ket-qua-day-du.test.js
    đỏ_khi: đếm trên tập đã lọc chip — vế 2b
  - AC5: vẽ theo `SCR-26` — gộp theo bài, mốc ngày, cột sống, icon nguồn; và
      KHÔNG gọi `ccBanCuoi` (đây là lịch sử, mọi bản đều hiện)
    cmd: cd web && node test/tab-ket-qua-day-du.test.js
    đỏ_khi: gọi `ccBanCuoi` ⇒ tab lịch sử giấu mất bản đã bị thay — vế 3/3a/3b
  - AC6: hàng đợi việc (`Hàng việc`) KHÔNG đổi hành vi
    cmd: cd web && node test/chung-cat-nhom-theo-bai.test.js && node test/chung-cat-quan-ly.test.js
  - AC7: không nới trần bundle
    cmd: cd web && node test/o-nhan-nap.test.js && node test/token-only.test.js
