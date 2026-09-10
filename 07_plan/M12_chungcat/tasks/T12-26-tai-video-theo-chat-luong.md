# T12-26 — JOB tải VIDEO theo CHẤT LƯỢNG (360/480/720/gốc) cho video URL

> Chủ dự án yêu cầu 2026-09-06: *"file tải xuống video/url cần là video, cho
> phép tải chất lượng 360 480 720…"*. KHÔNG transcode (mp4 upload chỉ có một
> bản gốc — ffmpeg pipeline là module khác); với video URL thì CHẤT LƯỢNG LÀ
> THẬT: host (YouTube) giữ sẵn các bậc, `yt-dlp -f` chọn bậc lúc tải —
> `tai_nguon.py` (T12-17) + allowlist + ingress.jsonl dùng lại nguyên.
> ID rule 9: max 25 ⇒ 26.

## Hình dạng

- `loai: tai-video` mới trong worker: payload {slug, chat_luong ∈ bảng khai}.
  Giai đoạn: `tai` (yt-dlp format "bv*[height<=H]+ba/b[height<=H]") → `xong`.
- Kết quả KHÔNG nhét kho (1 video = đầy lfs — bài học FR-054 §9.3): file nằm
  `xuat-tam/` NGOÀI repo (env CHUNGCAT_XUAT_TAM, mặc định %TEMP%), job mang
  đường + so_byte; DỌN theo tuổi `tran_xuat_tam_gio` (bảng khai, khởi điểm 24h,
  worker dọn mỗi vòng).
- `GET /viec/<ulid>` job tai-video xong ⇒ trả `tep_tam` (tên file) — web mở
  cửa tải: `GET /api/tai-video/<ulid>` (tho-cua proxy, stream file tạm,
  Content-Disposition tên "<slug>-<H>p.mp4"; job không xong/quá hạn ⇒ 404 câu rõ).
- Bảng khai `chat_luong`: [360, 480, 720, 1080, "goc"] + $vi_sao; URL ngoài
  allowlist từ chối TRƯỚC request (cổng T12-17 giữ).
- mp4 UPLOAD (có byte kho): KHÔNG qua job này — tải thẳng media (một bản gốc).

phạm_vi_ghi:
  - chungcat/src/worker.py             # dispatch tai-video + dọn xuat-tam
  - chungcat/src/tai_nguon.py          # tham số format theo chất lượng
  - chungcat/assets/nguong.json        # chat_luong[] + tran_xuat_tam_gio + $vi_sao
  - chungcat/src/api.py                # /viec trả tep_tam
# Cửa web `GET /api/tai-video/<ulid>` (`web/api/tho-cua.mjs` + `router.mjs`)
# nằm NGOÀI boundary `chungcat/**` của M12 ⇒ tách thành `T08-34`.
# `check_g6b` bắt đúng chỗ này: một đơn vị ghi sang module khác thì `R1` mất
# địa chỉ — hỏng ở cửa web mà quy về M12 là quy sai chủ.

verifiability: hard
tiêu_chí:
  - AC1: job tai-video chat_luong=480 ⇒ yt-dlp nhận format có height<=480
      (mock bắt tham số); chat_luong ngoài bảng ⇒ 422 kể bậc được phép
    cmd: python chungcat/tests/check_tai_video_chat_luong.py
  - AC2: file về xuat-tam NGOÀI repo (git status sạch); dòng ingress.jsonl có
      url+sha+byte; quá tran_xuat_tam_gio ⇒ vòng worker sau dọn
    cmd: python chungcat/tests/check_tai_video_chat_luong.py
  # AC3 (cửa web) chuyển sang `T08-34` cùng với `phạm_vi_ghi` của nó.
  - AC4: nền không vỡ — e2e mock + cổng M12 xanh
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
# cổng mới thuộc đơn vị test M12 (T12-15 mở rộng CÙNG LƯỢT) — R1
