# T05-5 — FR-038/C2: `gate.py` định tuyến theo bảng khai (đơn vị CODE)

> **ĐƯỜNG GHI THỨ BA vào kho, và audit ban đầu của tôi BỎ SÓT nó.**
> `05_intake/gate.py:219` `SELECT 1 FROM articles …` · `:236-238`
> `INSERT INTO articles` trong `BEGIN IMMEDIATE`, rồi `:269` gọi `xuat_kho.xuat()`.
> Đây là `make intake` / `npm run nap`. Nó **không** đi qua `dungchung.mjs` nên
> `api-guard.test.js` chưa bao giờ thấy nó.
>
> Tôi đã khai trong plan rằng *"mọi SQL sống trong MỘT file"* — sai, có **hai**.
>
> Đơn vị này thuộc **khối nguyên tử của C2**: DDL đã đổi nên `articles` không còn
> tồn tại, và `05_intake/test_gate.py` ĐANG ĐỎ. Không có trạng thái trung gian
> xanh — đó là tính chất của một lần dựng lại schema, không phải lựa chọn.

phạm_vi_ghi:
  - 05_intake/gate.py

verifiability: hard
tiêu_chí:
  - AC1: `gate.py` đọc `loai-nguon.json` và định tuyến INSERT theo bảng khai;
      phép kiểm trùng slug đọc VIEW `ban_ghi` (một bài đã có ở bất kỳ bảng nào
      cũng là trùng)
    cmd: python 05_intake/test_gate.py
  - AC2: M05-R1 giữ nguyên — hàng nhập từ `_inbox/` vẫn vào kho ở `draft`
    cmd: python 05_intake/test_gate.py && python core/tests/check_rule_surfaces.py
  - AC3: không tầng nào còn gõ tay tập 7 loại
    cmd: python core/tests/check_khai_mot_noi.py
phụ_thuộc: T01-18
