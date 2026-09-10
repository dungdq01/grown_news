# T03-12 — FR-036/B6: cổng đầu đề an toàn cho hiện vật (đơn vị TEST)

> Tách khỏi T08-8 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> Cổng này đo **trên server thật**, không soi mã nguồn: một đầu đề khai trong code
> mà không tới được trình duyệt là một đầu đề không tồn tại. Đây đúng lớp lỗi
> `PRAGMA foreign_keys = ON` — khai trong header DDL suốt mấy tháng mà không cơ
> chế nào bật.
>
> **Plan sai một chỗ, ghi lại**: plan khai `cmd` của B6 là
> `node test/{media-dau-de,no-leak}.test.js`. Nhưng `no-leak.test.js` canh
> **listener rò qua SPA nav** (M03 AC-2.4.2), không canh egress/đầu đề — nó không
> liên quan gì tới B6. Cổng thật của B6 chỉ là `media-dau-de.test.js`.

phạm_vi_ghi:
  - web/test/media-dau-de.test.js
  - web/package.json
  - web/test/WORKLOG.md
  - web/WORKLOG.md            # o "| Test | <n> |" — check_worklog so so lieu

verifiability: hard
tiêu_chí:
  - AC1: sáu đầu đề đo bằng `res.headers` của một request THẬT, từng cái một ca —
      và `content-type` phải khớp `media-mime.json`, không khớp một chuỗi gõ tay
      trong test
    cmd: cd web && node test/media-dau-de.test.js
  - AC2: `attachment` chỉ cho `xem_truoc: "the"` và `inline` chỉ cho
      `xem_truoc: "iframe"` — bảng khai lái phép kiểm, không phải ngược lại
    cmd: cd web && node test/media-dau-de.test.js
  - AC3: bốn ca chối — dạng sha256 sai · sha256 không có · blob mồ côi (staging) ·
      method khác GET
    cmd: cd web && node test/media-dau-de.test.js
  - AC4: file test có trong chuỗi `npm test` và được nhắc trong `test/WORKLOG.md`
    cmd: cd web && node test/nut-song.test.js
phụ_thuộc: T08-8
