# T08-11 — FR-038/C3: một cửa SQL, ba bảng đích (đơn vị CODE)

> Mười chỗ SQL trong `web/api/dungchung.mjs` nhắc `articles`: `:230` `docBai` ·
> `:245` `khoDoc` · `:261` `demSoBai` · `:449` `hienVatPhucVu` · `:510 :516 :521`
> `ghiSauValidate` · `:611 :618` `chuyenSangRac` · `:687` `phucHoi`.
>
> Đường **ĐỌC-cả-kho** → VIEW `ban_ghi`. Đường **GHI** → nêu **tên bảng thật** qua
> `bangCua(source_type)`.
>
> **KHÔNG** dùng `INSTEAD OF` trigger trên một view tên `articles` (diff ≈ 0).
> Đo được: ghi qua view có trigger thì `changes()` **nói dối** — `rowcount = 0`
> trong khi hàng đã đổi. `dungchung.mjs` hôm nay không đọc `.changes` nên vô hại,
> và đó **chính xác** là hình dạng cái bẫy `PRAGMA foreign_keys = ON` mà
> `check_media_ddl.py:6-9` viết cả một đoạn để kể: vô hại chỉ vì chưa ai dùng.
>
> `:449` `hienVatPhucVu` union ba nhánh → `SELECT frontmatter FROM tham_chieu_media`
> — năm nhánh, khai MỘT nơi trong DDL. Đây là chỗ M09-R1 thành **cấu trúc**.
>
> `api-guard` răng 2 (mọi mutation SQL chỉ ở file này) **không được nới**.

phạm_vi_ghi:
  - web/api/dungchung.mjs

verifiability: hard
tiêu_chí:
  - AC1: `bangCua()` đọc `loai-nguon.json`; đường đọc-cả-kho dùng `ban_ghi`;
      `hienVatPhucVu` dùng `tham_chieu_media`
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: CRUD đầy đủ còn chạy trên cả ba loại — tạo · đọc · sửa · đổi trạng thái ·
      xoá · khôi phục
    cmd: cd web && node test/api-crud.test.js && node test/thu-vien.test.js && node test/vong-doi-bai.test.js
  - AC3: `api-guard` răng 2 vẫn xanh — không mutation nào rời khỏi file này
    cmd: cd web && node test/api-guard.test.js
  - AC4: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T05-5
