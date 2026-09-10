# T12-19 — LỘ tiến độ transcript TỪNG PHẦN qua API (nền cho "sinh tới đâu show tới đó")

> Chỉ đạo chủ dự án 2026-09-05: *"nó sinh chữ tới đâu thì show tới đó"*.
> asr.py (T12-16) đã checkpoint theo segment-block — tức các cue ĐÃ SINH nằm
> sẵn trong checkpoint cạnh job. Đơn vị này chỉ MỞ CỬA ĐỌC: không đổi cách
> ASR chạy. ID theo rule 9: max M12 = 18 (dev vừa lấy 18 song song) ⇒ 19.

## Hình dạng

- Job `sinh-transcript` đang chạy: worker ghi cue đã sinh vào file
  `<ulid>.tien-do.vtt` cạnh job (atomic os.replace từng block — tên đích duy
  nhất theo khuôn Maildir, KHÔNG ghi đè dở).
- `GET /viec/<ulid>` trả thêm (chỉ khi loai=sinh-transcript):
  `tien_do: {cue_xong: N, giay_xong: <mốc giây cuối>, vtt_tung_phan: "<text>"}`
  — vtt_tung_phan cắt trần 64KB cuối (đủ show, không phình response).
- Cửa web tho-cua đi NGUYÊN trường này (không lọc — dữ liệu của chính người
  dùng, khuôn T08-21).

phạm_vi_ghi:
  - chungcat/src/asr.py            # ghi tien-do.vtt mỗi block (đã có checkpoint — thêm một os.replace)
  - chungcat/src/api.py            # GET /viec/<ulid> + tien_do
  - chungcat/src/worker.py         # dọn tien-do.vtt khi job xong (bản chính đã vào kho)

verifiability: hard
tiêu_chí:
  - AC1: giữa chừng ASR (fixture block 1 xong), GET /viec/<ulid> trả tien_do
      với cue_xong ≥1 và vtt_tung_phan chứa cue block 1
    cmd: python chungcat/tests/check_tien_do_transcript.py
    đỏ_khi: đang chạy mà tien_do vắng hoặc rỗng
    xanh_khi: cue block đã xong đọc được qua API
  - AC2: kill giữa block ⇒ tien-do.vtt không bao giờ là file hỏng (parse được
      hoặc là bản block trước — os.replace)
    cmd: python chungcat/tests/check_tien_do_transcript.py
  - AC3: job xong ⇒ tien-do.vtt được dọn, GET /viec trả tien_do đầy đủ lần cuối
      + hiện vật .vtt chính đã vào kho (check_transcript_hien_vat giữ xanh)
    cmd: python chungcat/tests/check_transcript_hien_vat.py
# cổng check_tien_do_transcript.py thuộc đơn vị test T12-15 (mở rộng CÙNG LƯỢT)
