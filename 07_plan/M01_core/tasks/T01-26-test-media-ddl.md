# T01-26 — FR-036/B1: cổng cho DDL media (đơn vị TEST)

> Tách khỏi T01-8 vì R1. Cổng này thử ràng buộc trên BẢN SAO DB, không trên kho thật.

phạm_vi_ghi:
  - core/tests/check_media_ddl.py
  - core/tests/test_gates.py
verifiability: hard
tiêu_chí:
  - AC1: mọi ràng buộc khai trong DDL đều BẮN THẬT trên bản sao — enum source_type ·
      hai CHECK frontmatter/cột · NOT NULL byte · PK sha256 trùng · so_byte GENERATED
      không ghi tay được
    cmd: python core/tests/check_media_ddl.py
  - AC2: hồ sơ `thu-vien` không nuốt cổng của hồ sơ `phan-tich` — bài phân tích
      thiếu mục vẫn bị chặn sau khi thêm nhánh
    cmd: python -m pytest core/tests -q
phụ_thuộc: T01-8
