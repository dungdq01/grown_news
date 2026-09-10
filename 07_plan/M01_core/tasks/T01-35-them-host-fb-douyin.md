# T01-35 — WO-019: thêm host `fb` + `douyin` vào whitelist (đơn vị CODE)

> ⛔ T01-34 phải ĐỎ trước.
>
> `core/assets/media-mime.json` → `video_host` thêm hai mục, mỗi mục đủ
> `nhan` · `mien` · `nhung` · `id_mau` · `id_tu` (M09-R3).
>
> Không file code nào phải đổi: `cong-module.mjs` · `idVideo()` · `nhungVideo()`
> · `nguonCua()` · panel Danh mục đều ĐỌC bảng. Đó là kiểm chứng cho thiết kế
> bảng-khai-một-nơi — nếu phải sửa thêm chỗ nào thì chỗ đó đang gõ tay.
>
> `id_mau` **chỉ chữ số** cho cả hai: id được ghép vào một tham số đã mã hoá
> phần trăm ở `nhung` của fb, nên tập ký tự hẹp là thứ chặn mọi lối thoát.
>
> Sau khi thêm: chạy `dung_lai_db.py` để bảng `loai_nguon` có hai hàng mới, và
> đo lại `chu-giao-dien` (dải chữ nơi phát trên màn nạp video dài thêm).

phạm_vi_ghi:
  - core/assets/media-mime.json

verifiability: hard
tiêu_chí:
  - AC1: cổng T01-34 XANH
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_host_video.py
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
