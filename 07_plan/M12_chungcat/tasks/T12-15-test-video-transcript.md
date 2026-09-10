# T12-15 — đơn vị TEST video/transcript (R1: sở hữu cổng mới của C4b)

> Khuôn T12-8. Viết TRƯỚC mã (R5 theo rule.md mục 8 — output đỏ tại mốc
> trước-code vào worklog). Đỏ phải vì THIẾU MÃ/THIẾU MÀN, không vì thiếu gói.

phạm_vi_ghi:
  - chungcat/tests/check_worker_mot_vong.py       # cổng của T12-13
  - chungcat/tests/check_worker_giet_giua_chung.py
  - chungcat/tests/check_worker_song_song.py
  - chungcat/tests/check_asr_khong_egress.py      # M12-R8: 0 lời gọi egress trong đường asr
  - chungcat/tests/check_vtt_hop_le.py            # magic WEBVTT · cue tăng dần · mtime
  - chungcat/tests/check_tran_hai_nhip.py         # byte ở cửa · thời lượng sau metadata
  - chungcat/tests/check_transcript_hien_vat.py   # .vtt = media la_dan_xuat=1 + kieu_moc=la_asr, bản gốc nguyên từng byte (V6 happy)
  - chungcat/tests/check_tai_url_allowlist.py     # T12-17: domain ngoài bảng ⇒ từ chối TRƯỚC request
  - chungcat/tests/check_chi_dan.py               # T12-25: chỉ dẫn người · sandwich · trần · preset
  - chungcat/tests/check_tai_video_chat_luong.py   # T12-26 · bậc chất lượng

verifiability: hard
tiêu_chí:
  - AC1: 8 cổng chạy được ngay, tự khai ĐỎ_KHI/XANH_KHI; đỏ hiện tại nói đúng
      "chưa có mã X" (phân biệt ThieuMa/ThieuGoi qua _nap.py sẵn có)
    cmd: python chungcat/tests/check_vtt_hop_le.py
  - AC2: mỗi cổng có vế CHỐNG-ĐỎ-OAN (fixture xanh được) — chứng minh bằng
      fixture ở THƯ MỤC TẠM, không ghi repo
    cmd: python chungcat/tests/check_asr_khong_egress.py
