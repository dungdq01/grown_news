# T08-28 — `audit_loi` vào đường backup (WO-046)

> **Chủ dự án duyệt 2026-09-04.** ID theo `rule.md` mục 9: `ls` → max 27 ⇒ 28.
>
> `04_system/adr.md` **KHÔNG frozen** (`grep -c` trên `FROZEN.lock` = 0), nên
> sửa câu "ba bảng" thành "bốn bảng" **không cần FR**.

## Là gì

`XUAT_LOI` +1 bảng. Cột liệt kê TƯỜNG MINH như ba bảng kia — `SELECT *` sẽ xuất
bất kỳ cột nào bảng có về sau, và biến "thêm một cột bí mật" thành việc không ai
phải quyết.

`audit_loi` có `stt · khi · hanh_dong · doi_tuong · nguoi_dung_id · boi · ok` —
**không cột nào là bí mật**. `nguoi_dung_id` là số trỏ tới `nguoi_dung`, bảng đó
đã xuất kèm `ten`; `FR-050` giải chỗ đó bằng `_backup/` gitignore.

## KHÔNG đổi

**"Hai bảng bí mật vẫn không xuất"** — `ma_moi` và `phien` giữ nguyên ngoài
danh sách. Đó mới là mệnh đề mang luật của `ADR-06 (c)`; con số "ba" chỉ là hệ
quả của lúc viết.

phạm_vi_ghi:
  - web/api/dungchung.mjs        # XUAT_LOI +audit_loi
  - 04_system/adr.md             # "ba bảng" → "bốn bảng" (KHÔNG frozen)

# `web/test/loi-cua.test.js` là đất đơn vị TEST (`T03-91` glob `loi-*`); ca mới
# thêm vào đó, bằng chứng đỏ-trước là output chạy TRƯỚC khi sửa mã (mục 8).

verifiability: hard
tiêu_chí:
  - AC1: bốn bảng xuất; `audit-loi.yaml` có mặt và nội dung khớp DB
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: "`bang !== 4`, hoặc thiếu file"
    xanh_khi: bốn file, nội dung có dòng audit vừa ghi
  - AC2: hai bảng bí mật VẪN vắng — mã mời và id phiên không ra file
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: file chứa mã mời hoặc id phiên
  - AC3: điểm bất động — chạy lần hai ghi 0 file
    cmd: node web/test/loi-cua.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T08-19
