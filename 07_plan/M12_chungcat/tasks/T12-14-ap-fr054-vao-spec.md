# T12-14 — áp FR-054 (video/transcript) vào spec/rules M12 + NGƯỜI ký lock

> Khuôn T12-0 (giấy TRƯỚC mã — bài học ô #1 backlog). FR-054 ĐÃ DUYỆT nhưng
> spec M12 hiện 0 lần nhắc video/transcript/ASR (ô backlog đo bằng grep).
> Mọi đơn vị mã C4b (T12-15..17) CHẶN CỨNG sau đơn vị này.
> ✅ 4 QUYẾT chủ dự án 2026-09-04: (1a) byte qua API LÕI · (2) tai-lieu CẤM
> media mime video/*|audio/*, bản ghi video ĐƯỢC — cưỡng chế validate.py
> (vế cài ở T01-45) · (3) NGƯỜI sẽ ký trần 25MB→1GB khi đơn vị này mời ·
> (4a) tải URL bằng yt-dlp allowlist (T12-17 làm). Áp cả (2) vào spec §1.

## Việc

1. Áp vào `spec.md`: §1 Vào thêm đường byte QUA API LÕI
   `GET /api/articles/media/<sha>` (lối (a) — chủ dự án duyệt kèm plan này);
   §2 loai thứ ba `sinh-transcript`; §5 giai đoạn job transcript
   (doc-byte → asr → vtt → gan-hien-vat); AC V1..V7 theo FR-054 §3 —
   V6 sửa thành vế happy (ô backlog: FR-052 đã áp nên vế cũ hết đỏ được).
2. Áp vào `rules.md`: M12-R8 "ASR chạy LOCAL — 0 lời gọi egress trong đường
   asr" (bề_mặt S3 + lệnh + đỏ_khi/xanh_khi); M12-R9 trần hai nhịp (byte ở
   cửa · thời lượng sau metadata — 1GB video / 500MB audio / 3600s).
3. Trần frontmatter 25MB→1GB (`frontmatter.schema.json` FROZEN) — bản vá để
   NGƯỜI áp + `check_frozen --ky`; kèm ba dòng giá FR-054 §9.3 (git-lfs 1GB
   free ≈ 1 video · $5/50GB · CI skip-smudge) ngay trong lời mời ký.
4. NHÂN TIỆN spec đang mở: thêm câu hợp đồng cho `GET /viec` (danh sách —
   T12-10 đã cài nhưng spec §7 chưa có dòng, review API 2026-09-04 bắt) và
   câu mã trả về ca idempotent (`200 + da_co:true` — đóng ô backlog chờ FR).
5. Chạy lại check_g6b sau áp (bài học T12-0/AC5).

phạm_vi_ghi:
  - 06_modules/M12_chungcat/spec.md      # FROZEN — sửa xong NGƯỜI ký lại
  - 06_modules/M12_chungcat/rules.md     # FROZEN — như trên
  - 06_modules/M12_chungcat/testcases.md # V1..V7 khớp hai chiều
# `FROZEN.lock` KHÔNG nằm trong `phạm_vi_ghi`: agent không bao giờ ghi nó.
# *"Gate do NGƯỜI ký"* — agent chuẩn bị evidence rồi DỪNG, người chạy
# `check_frozen.py --ky`. Khai nó ở đây là khai một quyền mình không có, và
# `check_g6b` bắt đúng: `FROZEN.lock` nằm ngoài boundary của M12.

verifiability: hard
tiêu_chí:
  - AC1: grep -icE "video|transcript|ASR|vtt" spec.md ≥ 8; V1..V7 có trong
      testcases khớp hai chiều
    cmd: python core/tests/check_g6a.py
  - AC2: hash mới trong FROZEN.lock do NGƯỜI ký; check_frozen exit 0
    cmd: python core/tests/check_frozen.py
  - AC3: check_g6b không lỗi M12 mới trên spec mới
    cmd: python core/tests/check_g6b.py
