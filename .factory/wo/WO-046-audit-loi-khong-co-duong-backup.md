# WO-046 — `audit_loi` KHÔNG có đường backup; một lần dựng lại DB xoá nó im lặng

- **loại**: bug · **mức**: **hard** · **module**: M08_api
- **mở**: 2026-09-04 · **người mở**: agent thi công (phiên 6c7880c5)
- **chủ dự án duyệt**: 2026-09-04 (*"duyệt cả 2"*)
- **quy chủ**: thiết kế `ADR-06 (c)` + `XUAT_LOI` — có trước phiên này; lộ ra ở
  `WO-044` khi phải dời DB và không có đường xuất nào cho bảng đó.

## Repro

```
grep -n "bang:" web/api/dungchung.mjs
→ nguoi_dung · dinh_danh_kenh · nhap_chung_cat        (BA bảng)

python -c "import sqlite3; print(sqlite3.connect('web/_loi.sqlite')
  .execute('SELECT COUNT(*) FROM audit_loi').fetchone())"
→ 9 hàng — và KHÔNG file nào trong `_backup/` chứa chúng
```

## Bug

`XUAT_LOI` phủ ba bảng. `audit_loi` **không nằm trong đó**, nên một lần dựng
lại DB (`WO-044` vừa phải làm đúng việc đó) xoá vết audit **IM LẶNG** — mà
audit log tồn tại đúng để chống điều đó.

Lượt `WO-044` phải xuất tay 9 hàng ra một file JSON ở thư mục tạm vì **không có
đường chính thức**.

## Vì sao cổng không bắt

`loi-cua.test.js` đo `a.bang === 3` và `ten.length === 3` — nó đo **"ba bảng đã
khai"**, không đo **"mọi bảng đáng backup"**. Cổng xanh trong khi bảng thứ tư
không ai cứu. Cùng lớp `#tự-khai`: phép đo lấy con số từ chính thứ bị đo.

## Vì sao `audit_loi` ĐÁNG xuất, còn hai bảng kia thì không

`ADR-06 (c)` loại `ma_moi` và `phien` vì chúng chứa **bí mật** — mã mời và id
phiên là thứ dùng để ĐĂNG NHẬP. `audit_loi` không có bí mật nào: nó có `khi` ·
`hanh_dong` · `doi_tuong` · `nguoi_dung_id` · `boi` · `ok`.

`nguoi_dung_id` là một **số trỏ tới** `nguoi_dung`, và bảng đó đã xuất (kèm
`ten` — dữ liệu cá nhân). `FR-050` đã giải chỗ đó: `_backup/` **gitignore**, ở
ổ đĩa chứ không trong git. Nên thêm bảng thứ tư không mở thêm bề mặt nào.

⇒ `ADR-06 (c)` đổi từ *"ba bảng"* thành **"bốn bảng"**; *"hai bảng bí mật vẫn
không xuất"* GIỮ NGUYÊN — đó mới là mệnh đề mang luật.

## Kỳ vọng

`xuatLoi()` xuất bốn bảng; `audit-loi.yaml` có mặt trong `_backup/`; hai bảng
bí mật vẫn vắng; điểm bất động giữ (chạy hai lần ra cùng byte).

## tiêu_chí

- AC1: bốn bảng xuất, và `audit-loi.yaml` có nội dung khớp DB
  - cmd: `node web/test/loi-cua.test.js`
  - đỏ_khi: `a.bang !== 4`, hoặc file thiếu
- AC2: hai bảng bí mật VẪN không xuất — mã mời và id phiên không ra file
  - cmd: `node web/test/loi-cua.test.js`
  - đỏ_khi: file chứa mã mời hoặc id phiên
- AC3: điểm bất động giữ — chạy hai lần ghi 0 file
  - cmd: `node web/test/loi-cua.test.js`
- AC4: suite web xanh
  - cmd: `cd web && npm test`
