# T13-2 — INDEXER: chunk theo heading · anchor slugGoiY · incremental kho-delta

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT, mất không mất gì.
> Chỉ index `than` ở đơn vị này; hiện vật văn bản là T13-7.
> Anchor: luật slugGoiY + dedup -1/-2 state theo FILE (FR-073 §1 $dedup).
> CHẶN CỨNG: sau T13-1 + T08-35 (cửa delta sống).
> 🔁 **`rule.md` mục 16 (chốt 2026-09-10)**: `index.sqlite` là dẫn xuất, xoá được,
> nên KHÔNG cần nhịp "chủ chấp nhận" — nhưng mọi test dựng nó ở `KB_DIR` **tạm**,
> không sinh file trong cây repo và không bao giờ ở `kb/`. Đường file đọc từ cấu
> hình/biến môi trường, không gõ cứng `truyhoi/index.sqlite` trong test.

phạm_vi_ghi:
  - truyhoi/src/indexer.py
  - truyhoi/src/anchor.py
  - truyhoi/src/db.py
  - truyhoi/pyproject.toml          # khai phụ thuộc MỘT chỗ (bài học M12); pin python theo ADR-02/FR-005

phụ_thuộc: T13-1 · T08-35

verifiability: hard
tiêu_chí:
  - AC1: xoá index dựng lại ⇒ cùng tập (file, anchor, line, checksum) từng dòng
    cmd: python truyhoi/tests/check_dung_lai_duoc.py
  - AC2: anchor khớp TỪNG KÝ TỰ với slugGoiY của FE trên fixture 50 heading kho
      thật; dedup -1/-2 ổn định qua hai lần dựng
    cmd: python truyhoi/tests/check_anchor_mot_luat.py
  - AC3: sửa 1 bài (mock delta) ⇒ chỉ bài đó re-chunk; lệch kho BÁO đúng slug
    cmd: python truyhoi/tests/check_lech_kho_bao_duoc.py
  - AC4: 0 ghi kb/**, 0 mở _kho.sqlite, 0 open() vào kb/_media (AST + runtime)
    cmd: python truyhoi/tests/check_khong_cham_kho.py
  - AC5: re-index TĂNG DẦN: mtime/sha_than từ kho-delta khác → mới re-chunk
      (đủ chuỗi AC-2.4, đo đếm số chunk bị tính lại)
    cmd: python truyhoi/tests/check_reindex_tang_dan.py
  - AC6: line_end ≤ số dòng thật; `dia_chi` dạng file:A-B phân giải qua dia-chi.json
    cmd: python truyhoi/tests/check_dia_chi_phan_giai.py
