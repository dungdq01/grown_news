# T12-21 — nén audio trước khi gửi cửa

> `WO-054`. Đường ASR lối `cua-asr` chưa từng chạy đầu-cuối: audio 19 phút ra
> ~16 MB base64, vượt trần thân request 8 MiB của cửa. Ba file audio đã tải
> trong `hang-doi/cur/` đều 1133 giây — đây là độ dài thường, không phải ca biên.
>
> ID theo quy ước chủ dự án 2026-09-05: **M12 dev lấy 20-29**. Max dev = 20 ⇒ 21.

## Vì sao NÉN, không phải nới trần và không phải cắt đoạn

**Nới trần** thì không sửa gì: 8 MiB là trần của BÊN KIA, `QuaLonChoCua` đã tách
riêng khỏi `egress.VuotTran` đúng vì lý do đó. Ta nới số của mình thì cửa vẫn
trả 200 + stream rỗng, chỉ khác là sau khi đã đẩy 16 MB lên mạng.

**Cắt đoạn** thì N đoạn = N lần gửi cho cùng một job, đụng `M12-R6` (trần 2,
không reset). `rules.md` FROZEN ⇒ phải mở FR trước. Để nguồn dài cho một đơn vị
khác; đơn vị này không được lấn.

**Nén** thì không chạm luật nào và giảm đúng thứ `M12-R6` bảo vệ: **số byte rời
khỏi máy**. Cùng một lần gửi, ít hơn 62% dữ liệu đi ra.

> **Phạm vi nới sau khi đo** (ghi lại để reviewer đối chiếu): mở WO này ra chỉ
> để nén. Nhưng lần chạy thật đầu tiên cho thấy nén KHÔNG phải nguyên nhân —
> `tran_than_cua_byte` là một chẩn đoán sai, và bên dưới nó là bốn lỗi nữa
> trong `asr_cua.py` + `egress.py`. Sửa nén mà để nguyên bốn lỗi kia thì đường
> này vẫn không chạy, và cổng sẽ xanh trên một thứ chết. Nên `phạm_vi_ghi` gồm
> cả `egress.py`; xem `WL-01M1RM8K2Q7X4N0B5DVEA3C9TZ` để đối chiếu từng phép đo.

## Hình dạng

- Thêm `nen_cho_cua(duong) -> Path` trong `asr_cua.py`: `ffmpeg -ac 1 -ar 16000
  -c:a libmp3lame -b:a 32k`, ra **thư mục tạm**, xoá sau khi gửi.
- **mono 16 kHz** không phải để tiết kiệm — ASR hạng whisper hạ mẫu về đúng
  16 kHz mono trước khi nghe. Giữ stereo 44.1 kHz là trả tiền mạng cho phần dữ
  liệu bên nhận vứt đi ngay.
- **mp3, không opus.** Đo được opus 24k nhỏ hơn (4.6 MB so với 6.0 MB), nhưng
  `beeknoee-api-guide.md` §4.3 chỉ khai `format: "mp3"`. Lấy 1.4 MB đổi một giả
  định về thứ bên kia nhận là sai chiều — nhất là khi cửa từ chối ÂM THẦM.
- Trần vẫn kiểm **SAU khi nén**, trên byte thật. Nén là để lọt, không phải để
  bỏ phép kiểm: nguồn đủ dài thì bản nén vẫn vỡ trần, và lúc đó `QuaLonChoCua`
  phải nói ra kèm số phút ước tính lọt được.
- `ffmpeg` vắng ⇒ báo bằng câu đọc được, không `WinError 2` trần trụi (cùng lỗi
  `yt-dlp` đã mắc một lần).

phạm_vi_ghi:
  - chungcat/src/asr_cua.py                      # `nen_cho_cua` + hình dạng request
  - chungcat/src/egress.py                       # nhánh không-stream + `so_chunk` đếm thật
  - chungcat/assets/nguon-transcript.json        # sửa lời khai đã bị chứng minh sai
# Cổng `chungcat/tests/check_nen_audio.py` thuộc ĐƠN VỊ TEST `T12-8` (mở rộng
# CÙNG LƯỢT) — `R1`: đơn vị viết mã không cầm bút viết thước chấm chính mình.

verifiability: hard
tiêu_chí:
  - AC1: audio 19 phút THẬT qua `nen_cho_cua` ra file lọt trần `tran_than_cua_byte`
    cmd: python chungcat/tests/check_nen_audio.py
    đỏ_khi: base64 của bản nén vẫn > trần
    xanh_khi: bản nén 1133 giây cho thân ước tính < 8 MiB
  - AC2: bản nén là mono 16 kHz — đọc bằng `ffprobe`, không tin cờ ta tự đặt
    cmd: python chungcat/tests/check_nen_audio.py
    đỏ_khi: số kênh ≠ 1 hoặc tần số ≠ 16000
  - AC3: nguồn quá dài ⇒ VẪN `QuaLonChoCua`, và câu lỗi nói được số phút lọt
    cmd: python chungcat/tests/check_nen_audio.py
    đỏ_khi: nén xong lọt thẳng qua mà không kiểm lại trần
  - AC4: `ffmpeg` vắng ⇒ lỗi đọc được, không `FileNotFoundError` trần trụi
    cmd: python chungcat/tests/check_nen_audio.py
  - AC5: hình dạng request giữ đúng năm phát hiện đo trên cửa thật 2026-09-05 —
      base64 TRẦN (không `data:` URI) · có `max_tokens` · KHÔNG stream ·
      vớt cue tự bắt nhịp lại · nhánh không-stream mang `headers` và trả dict
    cmd: python chungcat/tests/check_nen_audio.py
    đỏ_khi: một trong năm bị "dọn dẹp cho gọn" mất
    xanh_khi: cả năm còn nguyên
  - AC6: nền giữ xanh
    cmd: python -m pytest core/tests -q
