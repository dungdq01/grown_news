# T12-27 — transcript ĐỂ LẠI CON TRỎ, và làm nguyên liệu cho chưng cất

> Quyền: **`FR-070`** (chờ duyệt). Chưa duyệt ⇒ không chạm `spec.md`; phần mã
> dưới đây độc lập với spec và làm được trước.
> ID rule 9: max M12 = 26 ⇒ 27.

## Hai lỗ, một gốc

Đo 2026-09-07: `ket_qua` của MỌI việc `sinh-transcript` là **`null`**.
`chay_sinh_transcript` trả `{sha256, cue, model_asr}` nhưng không gọi
`ghi_ket_qua`, còn `mot_vong` chỉ giữ khoá `citations`.

Một việc không để lại con trỏ tới sản phẩm của nó thì:

- chưng cất **không tra được** transcript (không có `sha256`),
- màn **không mở được** detail (chủ dự án bắt: *"nó không xem detail được như
  chưng cất"*).

## Hình dạng

- `chay_sinh_transcript` gọi `q.ghi_ket_qua(ulid, {sha256, so_cue, slug})`.
- `_doc_nguon_video(slug)` — đọc hiện vật `text/vtt` của bản ghi qua cửa LÕI,
  đổi VTT → text thuần (bỏ mốc giờ, gộp dòng).
- `chay_chung_cat` rẽ theo loại bản ghi:
  - `video` **có** transcript ⇒ nguyên liệu = nội dung transcript
  - `video` **chưa** có ⇒ `ViecHong("cho", …)` nói rõ *"sinh transcript
    trước"* — **KHÔNG rơi về `than`**: rơi về mô tả là im lặng làm một việc
    khác việc người bấm.
  - loại khác ⇒ **giữ nguyên** `than` (không đụng đường đã chốt).

phạm_vi_ghi:
  - chungcat/src/worker.py
# Cổng `chungcat/tests/check_chung_cat_dung_transcript.py` thuộc ĐƠN VỊ TEST
# `T12-15` (mở rộng CÙNG LƯỢT) — `R1`.

verifiability: hard
tiêu_chí:
  - AC1: việc `sinh-transcript` xong ⇒ `ket_qua.sha256` có mặt
    cmd: python chungcat/tests/check_chung_cat_dung_transcript.py
    đỏ_khi: "`ket_qua` rỗng hoặc thiếu `sha256`"
  - AC2: bản ghi video CÓ transcript ⇒ nguyên liệu là NỘI DUNG `.vtt`,
      không phải `than`
    cmd: python chungcat/tests/check_chung_cat_dung_transcript.py
  - AC3: bản ghi video CHƯA có transcript ⇒ NÉM, câu nói rõ phải sinh
      transcript trước; KHÔNG rơi về `than`
    cmd: python chungcat/tests/check_chung_cat_dung_transcript.py
    đỏ_khi: chưng cất chạy tiếp bằng phần mô tả
  - AC4: bản ghi VĂN BẢN giữ nguyên đường cũ
    cmd: python chungcat/tests/check_chung_cat_dung_transcript.py
  - AC5: nền M12 giữ xanh
    cmd: 'for f in chungcat/tests/check_*.py; do python "$f"; done'
