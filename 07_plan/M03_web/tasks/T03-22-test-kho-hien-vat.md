# T03-22 — FR-036/B3: test kho hiện vật (đơn vị TEST)

> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.3 (AC-2.3.1, AC-2.3.2) và luật
> M09-R2 · M09-R5. Tách khỏi T08-6 vì R1 — test viết TRƯỚC code (bước 5 của
> `/factory:go`) và phải ĐỎ trước khi T08-6 chạy.
>
> B3 chỉ dựng KHO hiện vật trong `dungchung.mjs`; route `POST /api/articles/media`
> là B5. Nên ở đây gọi thẳng hàm qua `import`, không qua HTTP — trừ ca `413` là
> hợp đồng của `docBodyMedia` với `req.headers`, mô phỏng được bằng một req giả.

phạm_vi_ghi:
  - web/test/thu-vien.test.js
  - web/test/api-guard.test.js
  - web/package.json          # chuỗi `npm test` — nut-song §5: test ngoài chuỗi là test không tồn tại
  - web/test/WORKLOG.md       # check_worklog.py đòi mỗi file test được nhắc tên

verifiability: hard
tiêu_chí:
  - AC1: `sha256` + `so_byte` do MÁY tính (đối chiếu với `createHash` độc lập trong
      test); byte HTML dán nhãn `application/pdf` bị từ chối ở lớp magic-byte; mime
      ngoài enum đóng bị từ chối; nạp hai lần cùng byte ⇒ một dòng `media`;
      `docHienVat` trả lại ĐÚNG byte đã nạp
    cmd: cd web && node test/thu-vien.test.js
  - AC2: `ghiSauValidate` từ chối một `media.sha256` BỊA (không có dòng byte nào) —
      con trỏ treo không được COMMIT; cùng sha256 thật thì nhận
    cmd: cd web && node test/thu-vien.test.js
  - AC3: `docBodyMedia` từ chối theo `content-length` TRƯỚC khi đọc byte — req giả
      không phát một byte `data` nào mà promise vẫn reject
    cmd: cd web && node test/thu-vien.test.js
  - AC4: M09-R5 — `TRAN` giữ đúng 1 MB, `TRAN_MEDIA` là hằng RIÊNG và đọc từ
      `core/assets/media-mime.json`, không gõ số lần thứ hai; và răng cặp
      `giaoDich ⇒ banXuat` của api-guard phủ luôn `luuHienVat`
    cmd: cd web && node test/api-guard.test.js
phụ_thuộc: T08-6
