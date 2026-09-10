# WO-067 — "chạy lại từ chỗ hỏng" không có ĐƯỜNG, và có thì cũng chạy từ 0

loại: bug (kéo theo của WO-066)
module: M12_chungcat · M08_api (proxy) · M03_web (nút)
mức: hard
người báo: chủ dự án 2026-09-09 — dán nguyên câu lỗi `502 Bad Gateway … (hỏng ở chặng: dang-goi-model) Transcript đã có tới đâu vẫn giữ — chạy lại tiếp từ chỗ hỏng`

## Hiện tượng

WO-066 làm việc hỏng **hiện đúng** (nhãn `hong`, lý do, chặng). Câu trên màn
hứa *"chạy lại tiếp từ chỗ hỏng"*. Đo:

```
THỢ  POST routes:   /job                     ← duy nhất
LÕI  /api/viec/*:   GET ds · GET một việc    ← không POST
FE   cctab:         0 nút "chạy lại"
vong.chay_lai():    CÓ — và không ai gọi
```

Một câu hứa không có nút là một câu nói dối lịch sự.

## Lỗi thứ hai, nặng hơn: có đường thì cũng chạy LẠI TỪ 0

`chay_sinh_transcript`: `da_co = []`, `phien_am` bắt đầu `moc = 0.0`. File
tiến độ (`T12-19`, checkpoint theo cue — job này có **102 cue tới 00:13:22**)
không được đọc lúc chạy lại. "Chạy lại" = trả tiền lại 13 phút đã đúng, bốc
lại xúc xắc trên quãng đã đúng, và tiêu **lần gửi thứ hai — cũng là lần
cuối** (`M12-R6`) vào việc làm lại.

## Lỗi thứ ba: lease

`chay_lai` chỉ đổi `giai_doan`. PID worker cũ **còn sống** (nó chỉ hỏng một
việc), nên `con_giu()` nói "đang giữ" ⇒ không worker nào nhặt trong `HAN_TREO`
(30 phút). Nút bấm mà không có gì xảy ra trong nửa tiếng.

## Về cái 502

Hạ tầng trước cửa Beeknoee, không phải model — `asr_cua` đã ghi nhận lối
không-stream *"thỉnh thoảng ăn 502 … một lần GỬI hỏng, M12-R6 cho đúng 2 lần"*.
**Không** tự thử lại 502 trong job: lần gửi thứ hai là của NGƯỜI quyết, và họ
phải thấy nó tốn 1/2.

## Đã làm

- THỢ `POST /viec/<ulid>/lai` → `chay_lai(tu_giai_doan = giai_doan_hong)`;
  chỉ nhận việc `hong` (khác ⇒ 409); chạm trần ⇒ 409 kèm câu của `TranGui`.
- `chay_lai` xoá `nhan_luc`/`nhan_pid` ⇒ worker nhặt ngay.
- `phien_am(bat_dau=…)`; `chay_sinh_transcript` đọc file tiến độ → ghép cue cũ,
  ASR chạy từ giây cuối đã có.
- LÕI `cuaChayLaiViec` + router `POST /api/viec/<id>/lai`.
- FE nút *"↻ Chạy lại từ chỗ hỏng (gửi n/2)"*; hết 2 lần ⇒ nói "tạo việc mới".

## Cổng

`check_hong_khong_mang_nhan_cho.py` §D — 9 vế; D5 CHẠY `phien_am(bat_dau=200)`
với cửa giả và đếm mốc đã gọi.
