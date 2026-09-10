# T08-6 — FR-036/B3: kho hiện vật trong dungchung.mjs (đơn vị CODE)

> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.3. MỘT cửa ghi giữ nguyên: byte
> vào kho qua `luuHienVat`, và nó nằm cùng file với mọi mutation SQL khác — răng
> `api-guard` răng 2 (handler không cầm `prepare`) không phải nới.
>
> Bốn hàm mới + một phép kiểm chèn vào `ghiSauValidate`:
>
> | | |
> |---|---|
> `TRAN_MEDIA` | đọc `tran_byte` từ `core/assets/media-mime.json` — KHÔNG gõ 25 MB lần thứ hai. `TRAN` (1 MB) **không đổi** (M09-R5)
> `docBodyMedia` | từ chối theo `content-length` **trước** khi đọc byte đầu tiên; vẫn giữ chặn theo byte đã nhận (header là dữ liệu của người gửi)
> `luuHienVat` | magic-byte khớp mime khai → `createHash` → `giaoDich` `INSERT OR IGNORE` → `banXuat()`
> `docHienVat` | SELECT byte theo sha256 (khoá do máy tính ⇒ không traversal ĐƯỢC)
> `ghiSauValidate` | `fm.media.sha256` khai mà không có dòng byte ⇒ **không COMMIT**

phạm_vi_ghi:
  - web/api/dungchung.mjs

verifiability: hard
tiêu_chí:
  - AC1: AC-2.3.1 của M09 — máy tính sha256/so_byte, magic-byte lệch bị từ chối,
      mime ngoài enum bị từ chối, dedup theo nội dung, đọc lại đúng byte, con trỏ
      treo bị chặn ở cửa ghi
    cmd: cd web && node test/thu-vien.test.js
  - AC2: AC-2.3.2 — không đường ghi nào ngoài `/api/articles/…`; `luuHienVat` có
      `giaoDich(` thì phải có `banXuat(`; `TRAN` vẫn 1 MB
    cmd: cd web && node test/api-guard.test.js && node test/no-write-path.test.js
  - AC3: không hồi quy — thêm một kho byte không được đổi phán quyết của đường ghi
      bài hiện có
    cmd: cd web && npm test
phụ_thuộc: T01-10
