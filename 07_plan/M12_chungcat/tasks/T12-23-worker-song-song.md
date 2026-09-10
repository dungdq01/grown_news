# T12-23 — WORKER SONG SONG: N tiến trình × M luồng, trần đồng thời ở bảng khai

> Chỉ đạo chủ dự án 2026-09-05: *"set 2 worker, mỗi worker 4 threads — chạy
> song song tối đa 8 request một lúc; hiện mỗi lần xử lý 1 request, còn lại
> ngồi chờ, rất mất thời gian."*
> ID theo rule 9: ls max 22 ⇒ 23.

## Phân tích (PM đo trước khi viết)

- **Claim đã an toàn đa-worker sẵn**: Maildir claim-bằng-rename, T12-13 AC4
  đã có cổng "hai worker song song — mỗi job đúng MỘT lần chạy". Nhân số
  tiến trình gần như miễn phí về đúng đắn.
- **Chỗ phải thiết kế thật là `egress.jsonl`**: `seq` tăng dần do TA cấp,
  đọc-dòng-cuối để nối ([egress.py:53](../../..//chungcat/src/egress.py)) —
  N bên ghi cùng file là ĐUA: hai bên đọc cùng "dòng cuối" → trùng seq, và
  AC-6.2 (dựng lại từ log) vỡ. Chốt lối: **mỗi tiến trình một file**
  `egress.<worker_id>.jsonl`, seq riêng từng file (bảo toàn "liên tục
  trong một dòng thời gian"); công cụ đọc/`check_mot_cua_egress` gộp theo
  (worker_id, seq). KHÔNG khoá file chung — khoá chéo tiến trình trên
  Windows là ổ bug.
- **Hai loại job, hai loại tài nguyên**: chung-cat = I/O-bound (gọi model
  ~20s, chờ mạng) → luồng song song ăn ngay; sinh-transcript = CPU-bound
  (faster-whisper INT8) → 8 ASR cùng lúc là nghẽn CPU + RAM model. Trần
  PHẢI TÁCH THEO LOẠI, không một số chung.
- **Trần phía gateway**: 8 request đồng thời tới beeknoee — con số thuộc
  bảng khai (đo/hỏi hạn mức, khai kèm $vi_sao), không gõ cứng trong mã.

## Hình dạng

- `nguong.json` thêm khối `song_song`:
  `{tien_trinh: 2, luong_moi_tien_trinh: 4, tran_asr_dong_thoi: 1,
    $vi_sao: "...", $chua_kiem_chung: "hạn mức gateway chưa đo"}`
- `worker.py --vong` đọc `luong_moi_tien_trinh` → ThreadPool M luồng, mỗi
  luồng vòng claim-xử như hiện tại (claim rename vốn nguyên tử, luồng trong
  cùng tiến trình dùng chung — thêm lock nội bộ quanh bước chọn-file để
  hai luồng không thử rename cùng một tên); job `sinh-transcript` qua
  semaphore `tran_asr_dong_thoi`.
- `egress.py`: đường file log nhận hậu tố worker id
  (`CHUNGCAT_WORKER_ID` hoặc pid) — mỗi tiến trình một file, seq riêng.
- Chạy 2 tiến trình: script/README (`RUNNING.md` khai lệnh, mỗi tiến trình
  một `CHUNGCAT_WORKER_ID`); worker chết ⇒ tiến trình còn lại vẫn xử —
  và job cur/ của PID chết phải ĐƯỢC NHẶT LẠI (gộp ô backlog "mồ côi cur/":
  claim lại khi nhan_pid không còn sống + nhan_luc quá ngưỡng).
- `GET /viec` + màn /chung-cat/ không đổi hợp đồng — chỉ nhanh hơn.

phạm_vi_ghi:
  - chungcat/src/worker.py             # ThreadPool + semaphore ASR + nhặt-lại mồ côi
  - chungcat/src/egress.py             # file log theo worker id
  - chungcat/assets/nguong.json        # khối song_song + $vi_sao
  - chungcat/tools/chay_worker.py      # MỚI (nếu cần) — spawn N tiến trình
# RUNNING.md NGOÀI đất M12 (tiền lệ ô backlog cũ) — KHÔNG nới tại chỗ:
# lệnh chạy chuẩn ghi vào chungcat/README.md (đất mình); một dòng trỏ từ
# RUNNING.md là việc của chủ đất, nhắn kèm lúc bàn giao.
  - chungcat/README.md                 # lệnh chạy chuẩn

verifiability: hard
tiêu_chí:
  - AC1: nạp 8 job mock ⇒ với 2×4 cấu hình, thời gian xử toàn bộ < 2× thời
      gian một job (đo đồng hồ trên mock có sleep cố định) — song song THẬT
    cmd: python chungcat/tests/check_worker_song_song.py
    đỏ_khi: tổng thời gian ~8× một job (vẫn tuần tự)
    xanh_khi: tăng tốc ≥3×
  - AC2: mỗi job vẫn đúng MỘT lần chạy dưới 2 tiến trình × 4 luồng (đếm dòng
      "xong" mỗi ulid = 1)
    cmd: python chungcat/tests/check_worker_song_song.py
  - AC3: egress mỗi tiến trình một file, seq liên tục TRONG từng file, gộp
      (worker_id, seq) không trùng; check_mot_cua_egress đọc được cả hai
    cmd: python chungcat/tests/check_mot_cua_egress.py
  - AC4: 8 job trong đó 3 sinh-transcript ⇒ ASR chạy tối đa `tran_asr_dong_thoi`
      cùng lúc (đo bằng đếm semaphore mock), chung-cat không bị ASR chặn
    cmd: python chungcat/tests/check_worker_song_song.py
  - AC5: giết 1 tiến trình giữa job ⇒ tiến trình kia NHẶT LẠI job cur/ mồ côi
      sau ngưỡng (nhan_pid chết) và chạy trọn — đóng ô backlog mồ-côi-cur
    cmd: python chungcat/tests/check_worker_giet_giua_chung.py
  - AC6: nền không vỡ — e2e mock + suite cổng M12 xanh
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
