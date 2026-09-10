# [Space] T01-92 — export/import theo space: yaml per-space, cây `kb/<loai>/` GIỮ

> Spike R2: `xuat_kho.py` là đường DB→file DUY NHẤT, `bam_cay()` là điểm bất
> động của round-trip. ADR-09 §4: **space sống trong frontmatter, KHÔNG trong
> đường dẫn** — đổi cây `kb/<space>/<loai>/` làm mọi cổng round-trip phải sửa
> cùng lúc, đổi lấy một tiện lợi không ai cần (kho đọc qua API, không qua ls).
> CHẶN CỨNG: sau `T01-91` (ba bảng danh mục có space).
> phụ_thuộc: T01-91
> ID rule 13: T01-92 — ĐỔI NHÀ 2026-09-10: `xuat_kho.py`/`dung_lai_db.py` là
> đất **M01_core** (M02_kb boundary = `kb/**`), check_g6b bắt đúng. Nội dung
> không đổi, chỉ đổi module chủ.

## Hình dạng

- `xuat_kho.py`: mỗi bản ghi ghi thêm `space:` vào frontmatter; ba file yaml
  danh mục xuất **theo space** — `kb/<space>/categories.yaml` (space mặc định
  giữ nguyên `kb/categories.yaml`, KHÔNG đổi đường của bản đang có: 84 consumer).
- `dung_lai_db.py`: đọc ngược — frontmatter thiếu `space` ⇒ gán mặc định (bản
  ghi cũ), KHÔNG đỏ; yaml theo space nạp về đúng hàng.
- `bam_cay` giữ nguyên phép tính; cây `kb/<loai>/` KHÔNG đổi.

phạm_vi_ghi:
  - core/tools/xuat_kho.py
  - core/tools/dung_lai_db.py

verifiability: hard
tiêu_chí:
  - AC1: round-trip DB→file→DB với 2 space ⇒ `bam_cay` trước/sau KHỚP, 0 bản
      ghi lạc space
    cmd: python core/tests/check_export_dan_xuat.py
    đỏ_khi: bam_cay lệch, hoặc bản ghi đổi space sau vòng
    xanh_khi: khớp từng ký tự
  - AC2: bản ghi CŨ (frontmatter chưa có `space`) nạp lại ⇒ gán mặc định,
      không đỏ (đường di trú người dùng thật đi qua)
    cmd: python core/tests/check_export_dan_xuat.py
  - AC3: yaml danh mục space mặc định GIỮ đường cũ `kb/categories.yaml`
    cmd: python core/tests/check_danh_muc.py
