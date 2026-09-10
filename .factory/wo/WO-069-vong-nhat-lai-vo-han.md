# WO-069 — việc giết worker được nhặt lại VÔ HẠN, không bộ đếm nào chặn

loại: bug (an toàn chi phí)
module: M12_chungcat
mức: hard
người báo: chủ dự án 2026-09-09 — *"kiểm tra xem cả chưng cất và sinh transcript có case chạy mãi không dừng (loop) khi bị lỗi gì đó hay không"*

## Kết quả rà — 5 vòng lặp, 4 có cận

| vòng | cận | kết |
|---|---|---|
| `chay_chung_cat` | không có vòng nào; một lời gọi model; `lan_gui` ≤ 2 | **an toàn** |
| ASR cắt đoạn (`phien_am`) | `tran_vong_asr = 24`; đoạn không tiến ⇒ thử lại 1 lần rồi ném | **an toàn** |
| tải video `yt-dlp` | giết ở 3600s treo; `pr.wait(timeout=30)` | **an toàn** |
| `egress.gui` | `httpx timeout=600` | **an toàn** |
| `vong_lap` (`--vong`) | `while True` CÓ CHỦ Ý — hàng đợi rỗng thì `sleep`, không quay tít | **an toàn** |

## Vòng KHÔNG có cận — và nó đã đo được

Việc giết chết **TIẾN TRÌNH** worker (hết RAM lúc đọc 80 MB, bị `kill`, ffmpeg
sập) **không ném ngoại lệ nào**, nên `danh_hong` không bao giờ chạy. Việc nằm
lại `cur/` với lease của một PID đã chết ⇒ `_nhan_lai_bo_roi` nhặt lại ⇒ worker
chết lại ⇒ lặp.

```
Đo 2026-09-09 (mô phỏng PID chết, không sửa mã):
  nhận lại 12 lần liên tiếp · lan_gui = 0 · giai_doan = cho
  có bộ đếm số lần nhận? False
```

**`lan_gui` không cứu được**: nó chỉ tăng ở `ghi_nhan_gui`, tức *sau* khi đã
qua `doc-byte`. Việc chết ở `doc-byte` giữ `lan_gui = 0` mãi mãi.

Giá mỗi vòng: đọc lại 80 MB qua LÕI; với lối `tai_ve` là một lần **tải thật từ
Internet** — mà lối đó khai `tieu_egress: false` nên nó không chạm trần gửi nào.

## Đã làm

`TRAN_LAN_NHAN = 3` + `_qua_tran_nhan()` đếm ở **đường nhặt lại** (`cur/`),
không ở đường `new/` — lần chiếm đầu của một việc mới không phải một lần
*nhặt lại*, tính nó vào trần là cắt mất một lượt chạy hợp lệ.
Chạm trần ⇒ `danh_hong` ⇒ thùng rác, câu lỗi nói đúng nguyên nhân (worker chết
giữa chừng) chứ không đổ cho model.

## Cổng

`check_hong_khong_mang_nhan_cho.py` §F — 7 vế, mô phỏng PID chết và đếm số lần
nhặt lại thật.
