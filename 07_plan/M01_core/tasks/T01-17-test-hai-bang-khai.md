# T01-17 — FR-038/C1: cổng "khai một nơi" (đơn vị TEST)

> Tách khỏi T01-16 vì R1. Viết TRƯỚC bảng khai, phải ĐỎ trước.
>
> Cổng này là **cổng theo dõi**: §3 của nó cố ý đỏ tới khi C5 đấu xong consumer.
> A1 của FR-036 đã dùng đúng khuôn này, và lý do giữ nguyên — một cổng chỉ xanh
> sau khi việc xong là cổng nói được "việc chưa xong", còn một cổng thêm sau khi
> xong là một cổng chưa bao giờ đỏ.

phạm_vi_ghi:
  - core/tests/check_khai_mot_noi.py

verifiability: hard
tiêu_chí:
  - AC1: §1 — `loai-nguon.json` tự nhất quán: một loại thuộc đúng một module; hợp
      ba module == enum `source_type` của `frontmatter.schema.json` (đọc từ
      schema, KHÔNG gõ 7 giá trị vào cổng)
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: §2 — `man-hinh.json`: `path`/`id_shell`/`data_nav` duy nhất từng cái;
      `data_nav` khớp `^[a-z]+$`; nhãn ≤ 9 ký tự; đúng 7 màn thuộc menu
    cmd: python core/tests/check_khai_mot_noi.py
  - AC3: §3 — KHÔNG bản gõ tay thứ hai: bốn file (`kho.schema.sql`,
      `xuat_kho.py`, `dung_lai_db.py`, `dungchung.mjs`) không được liệt tập 7 loại;
      ba file (`server.mjs`, `trang.mjs`, `multiwindow.inline.ts`) không được liệt
      tập màn. DDL là ngoại lệ khai rõ (SQL không đọc JSON) và cổng phải so hai
      bản khớp nhau thay vì cấm
    cmd: python core/tests/check_khai_mot_noi.py
  - AC4: ca ÂM — phá bảng khai (một loại thuộc hai module · `data_nav` có gạch
      nối · nhãn 10 ký tự · path trùng) thì cổng ĐỎ và nói ra chỗ sai
    cmd: python core/tests/check_khai_mot_noi.py
phụ_thuộc: T01-16
