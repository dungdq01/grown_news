# T01-25 — FR-036/B1: bảng `media` + trường `ho_so` trong schema (đơn vị CODE)

> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.1–2.2. M09 là module NGANG, không
> sở hữu file nào — nên phần `core/**` của nó là task này.
>
> **Di trú HUỶ DIỆT, không lùi được bằng `ALTER`.** SQLite không `ALTER` được `CHECK`,
> nên thêm `tai-lieu` vào enum `source_type` phải dựng lại DB:
> `xuat_kho.py` rồi `dung_lai_db.py`. An toàn **hôm nay** vì `kb/` có 1 bài và export
> phủ 100% nội dung. Nó **thôi an toàn** ngay khi có byte trong DB ⇒ T01-8 và T08-5
> không được ship ở hai release khác nhau nếu có một lần dựng lại DB ở giữa.

phạm_vi_ghi:
  - core/assets/kho.schema.sql
  - core/assets/frontmatter.schema.json
  - core/skill-src/frontmatter.schema.json
  - core/assets/media-mime.json
  - core/tools/xuat_kho.py
  - core/tools/dung_lai_db.py
verifiability: hard
tiêu_chí:
  - AC1: bảng `media` có `sha256` PK · `byte` BLOB NOT NULL · `so_byte` GENERATED ·
      `la_dan_xuat` mặc định 0; `source_type` nhận `tai-lieu` và vẫn chặn giá trị
      ngoài enum; hai CHECK đồng bộ frontmatter↔cột vẫn bắn
    cmd: python core/tests/check_media_ddl.py
  - AC2: hai bản `frontmatter.schema.json` khớp nhau từng khoá và cùng số nhánh
      `allOf`; `ho_so` thiếu ⇒ mặc định `phan-tich` nên không bài cũ nào phải sửa;
      mọi trường `data_flow.md` của M09 có mặt trong schema
    cmd: python core/tests/check_danh_muc.py && python core/tests/check_ba.py
  - AC3: dựng lại DB từ export xong, hash nội dung không đổi và lần export thứ hai
      ghi 0 file — di trú huỷ diệt không mất bản ghi nào
    cmd: python core/tools/xuat_kho.py && python core/tools/dung_lai_db.py && python core/tests/check_export_dan_xuat.py
phụ_thuộc: T01-6
