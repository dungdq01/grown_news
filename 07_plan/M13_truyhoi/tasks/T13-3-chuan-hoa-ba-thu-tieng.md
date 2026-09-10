# T13-3 — chuan_hoa_tim: NFC, lower, đ→d, chèn space quanh Hán (đọc dai-han.json)

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT.
> Tên hàm `chuan_hoa_tim` (T13-0 §3) — không import, không trùng tên với
> `chungcat.verify.chuan_hoa`. Dải Hán đọc từ `core/assets/dai-han.json` (T01-51),
> 0 regex gõ tay.

phạm_vi_ghi:
  - truyhoi/src/chuan_hoa.py
  - truyhoi/src/indexer.py

phụ_thuộc: T13-2 · T01-51

verifiability: hard
tiêu_chí:
  - AC1: MỘT hàm, đúng 2 caller (index + query, đếm AST); dải Hán đọc từ
      dai-han.json, 0 regex gõ tay; 0 import từ chungcat/
    cmd: python truyhoi/tests/check_mot_ham_chuan_hoa.py
  - AC2: bộ 10 truy vấn ba thứ tiếng 10/10 (vi dấu, vi không dấu, đ hai chiều,
      en, zh 1·2·4 chữ, câu trộn)
    cmd: python truyhoi/tests/check_ba_thu_tieng.py
  - AC3: remove_diacritics phải là 2 — đặt 1 thì cổng đỏ kèm lý do (hướng · phần)
    cmd: python truyhoi/tests/check_ba_thu_tieng.py
