# T01-15 — FR-036/B8b: khai `mien` + `id_tu` cho host video (đơn vị CODE)

> Đơn vị RIÊNG vì nó chạm `core/assets/**` — ngoài boundary M03_web, nơi code FE
> của B8b sống. Nới ở tầng **chia việc**, không nới tại chỗ.
>
> **Lỗ đã đo**: `video_host` hiện khai `nhan` · `nhung` · `id_mau`. FE cần thêm
> hai thứ để **rút id ra khỏi `url_normalized`**:
>
> - `mien` — tên miền của dạng URL người dùng dán (`youtube.com`, `tiktok.com`).
>   `nhung` là miền NHÚNG (`youtube-nocookie.com`), khác miền xem — nên không suy
>   ra được từ nó.
> - `id_tu` — regex rút id khỏi phần còn lại (`watch?v=ID` vs `/video/ID`).
>
> Thiếu hai field này thì FE phải **gõ tay** hai tên miền và hai cách rút id, tức
> bản thứ hai của cùng một sự thật — đúng thứ M09-R3 chống: *"src dựng từ
> whitelist, không từ dữ liệu"* chỉ có nghĩa khi whitelist là MỘT bản khai.

phạm_vi_ghi:
  - core/assets/media-mime.json

verifiability: hard
tiêu_chí:
  - AC1: mỗi host có `mien` + `id_tu`, và `id_tu` rút được id từ dạng
      `url_normalized` mà `normalize_url` sinh ra
    cmd: cd web && node test/media-cua-so.test.js
  - AC2: bảng vẫn đọc được ở cả bốn nơi dùng nó (exporter · server · bundle FE ·
      cổng DDL) — thêm field không được làm chỗ nào vỡ
    cmd: python core/tests/check_media_ddl.py && cd web && node test/api-guard.test.js
phụ_thuộc: T01-14
