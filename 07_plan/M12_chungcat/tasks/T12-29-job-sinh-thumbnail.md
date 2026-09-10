# T12-29 — JOB `sinh-thumbnail`: TikTok/Douyin oEmbed · mp4 frame · PDF trang 1

> Đợt 2 của thẻ-2-tầng (chủ dự án duyệt 2026-09-08). Thumbnail = HIỆN VẬT
> DẪN XUẤT (khuôn transcript: media[] + la_dan_xuat, kieu_moc=la_thumbnail)
> — thẻ FE tự nâng cấp khi ảnh về (T03-126 AC3 đã chờ sẵn).
> ID rule 9: max 28 ⇒ 29.

## Hình dạng

- `loai: sinh-thumbnail` trong worker, ba nhánh theo bản ghi:
  (a) video URL TikTok/Douyin: gọi oEmbed lấy thumbnail_url → TẢI ảnh về —
      cả hai lời gọi qua `tai_nguon` allowlist (+2 domain oEmbed, $vi_sao)
      + dòng ingress.jsonl; KHÔNG hotlink URL hay-hết-hạn của họ.
  (b) mp4 có byte trong kho: ffmpeg -ss 1 -vframes 1 → jpg (ffmpeg đã theo
      yt-dlp; thiếu thì exit 3 thiếu-gói, khuôn _nap.py).
  (c) tài liệu PDF: pypdfium2 (dependency sẵn của pdfplumber) render trang 1
      → png, bề rộng trần ở bảng khai (~640px, $vi_sao).
- Ảnh nạp vào kho qua CỬA MEDIA sẵn có (một đường ghi), gắn media[] với
  kieu_moc=la_thumbnail; SINH LẠI = THAY entry cũ (đúng FR-054 §9.1 — không
  lặp lỗi append của transcript, ô backlog 2026-09-08).
- YouTube KHÔNG cần job (hotlink ytimg đủ — T03-126); chỉ chạy khi bản ghi
  thiếu nguồn ảnh tốt hơn.

phạm_vi_ghi:
  - chungcat/src/worker.py
  - chungcat/src/tai_nguon.py          # oEmbed + tải ảnh, allowlist mở rộng
  - chungcat/src/thumbnail.py          # MỚI — ba nhánh
  - chungcat/assets/nguon-tai.json     # +domain oEmbed
  - chungcat/assets/nguong.json        # be_rong_thumbnail + $vi_sao

verifiability: hard
tiêu_chí:
  - AC1: bản ghi TikTok (mock oEmbed) ⇒ ảnh về media[] kieu_moc=la_thumbnail,
      2 dòng ingress (oEmbed + ảnh); domain ngoài allowlist ⇒ chặn TRƯỚC request
    cmd: python chungcat/tests/check_sinh_thumbnail.py
  - AC2: mp4 fixture ⇒ jpg đúng bề rộng bảng khai; thiếu ffmpeg ⇒ exit 3
      thiếu-gói, không đỏ oan
    cmd: python chungcat/tests/check_sinh_thumbnail.py
  - AC3: PDF fixture ⇒ png trang 1; chạy job LẦN HAI ⇒ THAY entry, media[]
      vẫn đúng MỘT thumbnail (vế chống-append — đỏ được trên hành vi thêm)
    cmd: python chungcat/tests/check_sinh_thumbnail.py
  - AC4: nền không vỡ — e2e mock + cổng M12 xanh
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
# cổng check_sinh_thumbnail.py thuộc đơn vị test M12 (T12-15 mở rộng CÙNG LƯỢT) — R1
