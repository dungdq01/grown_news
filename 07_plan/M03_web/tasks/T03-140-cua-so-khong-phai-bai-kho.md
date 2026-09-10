# T03-140 — Chỉ cửa sổ BÀI KHO mới có bộ nút phán quyết

> `WO-087`. Chủ dự án 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-140-cua-so-khong-phai-bai-kho.md
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/test/cua-so-khong-phai-bai-kho.test.js
  - .factory/wo/WO-087-cua-so-khong-phai-bai-kho.md

verifiability: hard
tiêu_chí:
  - AC1: guard là DANH SÁCH CHO PHÉP, không phải loại trừ — chỉ cửa sổ bài kho
      gọi `tai()`; mọi `kieu` khác (kể cả `kieu` chưa tồn tại) đều KHÔNG gọi
    cmd: cd web && node test/cua-so-khong-phai-bai-kho.test.js
    đỏ_khi: còn `kieu !== "nhap"` · thêm một `kieu` mới lại lọt qua — vế 1/1a/2
  - AC2: `veBienTap` KHÔNG phát `data-act="loai"` / `data-act="xoa"` cho cửa sổ
      không phải bài kho
    cmd: cd web && node test/cua-so-khong-phai-bai-kho.test.js
    đỏ_khi: transcript vẫn có hai nút ấy — vế 3/3a
  - AC3: cửa sổ BÀI KHO vẫn đủ bộ nút như cũ (chống đỏ oan / chống sửa quá tay)
    cmd: cd web && node test/cua-so-khong-phai-bai-kho.test.js && node test/cua-so-doc.test.js && node test/nut-song.test.js
    đỏ_khi: sửa quá tay làm bài kho mất nút — vế 4
  - AC4: cửa sổ transcript và nháp vẫn mở và vẫn hiện nội dung
    cmd: cd web && node test/cua-so-transcript.test.js && node test/mo-nhap-da-duyet.test.js

ghi_chú: `T03-113` đã sửa đúng lớp lỗi này cho `kieu:"nhap"` nhưng viết guard
  dạng loại-trừ-một-phần-tử; `T03-122` thêm `kieu:"transcript"` thì ca mới lọt
  qua. WO này đảo sang fail-closed để ca THỨ BA không phải học lại.
