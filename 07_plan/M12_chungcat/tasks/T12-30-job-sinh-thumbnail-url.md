# T12-30 — job `sinh-thumbnail` cho video URL (`yt-dlp --write-thumbnail`)

> `WO-071` · task B. Thay nhánh (a) oEmbed của `T12-29`. ID rule 9: max 29 ⇒ 30.

## Hình dạng

- `loai: sinh-thumbnail` trong `BANG_LOAI`; bản ghi có `url` host trong
  allowlist ⇒ `yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg`
- lệnh dựng ở `tai_nguon.lenh_tai_thumbnail()` (KHÔNG chạy) rồi đi qua
  `egress.gui()` như `lenh_tai` — `seq` + dòng log `tieu_egress: false`
- ảnh vào kho qua `_nap_hien_vat`, gắn bằng cửa hẹp với
  `kieu_moc: "la_thumbnail"` + `thay_kieu_moc: true`
- `douyin.com` thêm vào `host_cho_phep`
- con trỏ sản phẩm: `ket_qua = {sha256, slug}` (`FR-070 §3`)
- bản ghi ĐÃ có ảnh ⇒ vẫn chạy được (thay), nhưng YouTube thì KHÔNG cần job:
  `nenThe` lớp 2 đã có URL đoán được

phạm_vi_ghi:
  - chungcat/src/worker.py
  - chungcat/src/tai_nguon.py
  - chungcat/assets/nguon-transcript.json
# cổng thuộc T12-28 (check_sinh_thumbnail.py) — R1

verifiability: hard
tiêu_chí:
  - AC1: `lenh_tai_thumbnail` dựng đúng cờ, và kiểm host TRƯỚC khi dựng
    cmd: python chungcat/tests/check_sinh_thumbnail.py
    đỏ_khi: host ngoài allowlist mà vẫn dựng được lệnh
  - AC2: `douyin.com` có trong `host_cho_phep`
    cmd: python chungcat/tests/check_sinh_thumbnail.py
  - AC3: job gắn hiện vật với `kieu_moc: la_thumbnail` + `thay_kieu_moc: true`
    cmd: python chungcat/tests/check_sinh_thumbnail.py
    đỏ_khi: thiếu cờ thay ⇒ chạy lại đẻ entry thứ hai
  - AC4: `ket_qua` mang `sha256` — việc không để lại con trỏ là việc không ai kiểm được
    cmd: python chungcat/tests/check_sinh_thumbnail.py
  - AC5: thiếu `yt-dlp` ⇒ câu lỗi nói đúng công cụ thiếu, không "không rõ"
    cmd: python chungcat/tests/check_sinh_thumbnail.py
