# T12-17 — TẢI nguồn từ URL (video-URL → byte) — ✅ DUYỆT 2026-09-04 (quyết 4a)

> M11 đăng ký video bằng URL, KHÔNG byte — mà ASR cần byte. Nghiên cứu §17
> đường B chấm `yt-dlp` ($0, local). Nhưng tải URL là LỜI GỌI RA NGOÀI đầu
> tiên không-phải-model của M12 ⇒ không tự làm khi chưa có chữ NGƯỜI.
> ✅ Chủ dự án chốt 2026-09-04: **URL là nguồn CHÍNH** của video, MP4 upload
> là nguồn PHỤ (và web hiện CHƯA có chỗ upload mp4 — T03-109 mở riêng).
> ⇒ Đơn vị này LÀM, đúng hình dạng dưới.

## Hình dạng (nếu duyệt)

- `chungcat/src/tai_nguon.py`: yt-dlp qua MỘT cửa, allowlist domain ở bảng
  khai (`chungcat/assets/nguon-tai.json`: youtube.com · youtu.be · vimeo.com —
  khởi điểm, $vi_sao từng dòng); domain ngoài bảng ⇒ từ chối TRƯỚC request.
  Mỗi lần tải ghi dòng log (url, sha256 kết quả, byte) — khuôn egress.jsonl
  nhưng file riêng `ingress.jsonl` (chiều ngược, đừng trộn).
- Byte tải về đi vào kho qua CỬA LÕI media sẵn có (POST /api/articles/media)
  — không đường ghi mới; trần 1GB áp ở đó.
- Giai đoạn job: `tai` → (chuỗi sinh-transcript như T12-16).

phạm_vi_ghi:
  - chungcat/src/tai_nguon.py          # MỚI
  - chungcat/assets/nguon-tai.json     # MỚI — allowlist + $vi_sao
  - chungcat/src/worker.py             # giai đoạn `tai` trước asr khi bản ghi chỉ có URL
  - chungcat/pyproject.toml            # yt-dlp pin (Unlicense — kiểm lại khi pin)

verifiability: hard
tiêu_chí:
  - AC1: domain ngoài bảng ⇒ từ chối TRƯỚC khi mở kết nối (0 request, đo mock)
    cmd: python chungcat/tests/check_tai_url_allowlist.py
  - AC2: tải xong ⇒ ingress.jsonl có dòng (url · sha256 · byte); byte vào kho
      qua cửa LÕI, không đường ghi mới (api-guard giữ nguyên)
    cmd: python chungcat/tests/check_tai_url_allowlist.py && node web/test/api-guard.test.js
  - AC3: bản ghi có sẵn media byte ⇒ giai đoạn `tai` BỎ QUA (không tải lại)
    cmd: python chungcat/tests/check_worker_mot_vong.py
