# WO-079 — Một cue méo và một 502 đều giết cả job; thêm THỬ LẠI NGẦM cho chunk

- **Loại**: bug + cải tiến · **Module**: M12_chungcat · **Mức**: hard
- **Task**: `T12-35`
- Chủ dự án 2026-09-09:

> *"bỏ qua cue đi"* · *"nới rộng số lần gửi/job (5-10 lần)… nếu model dừng:
> note bản đã transcript vào /tmp, tự động gửi lại request từ lúc bị ngắt…
> 1 job cho limit lần gửi, nhưng trong mỗi lần gửi có chế độ tự động retry khi
> đứt (ta gọi request user và request ngầm)"*

## Đo trước: phần lớn ý tưởng ấy ĐÃ CÓ

| ý | trạng thái |
|---|---|
| ghi bản dở ra chỗ tạm | ✅ `.tien-do.vtt`, checkpoint **theo từng cue** (`T12-19`) |
| gửi lại từ lúc bị ngắt | ✅ `bat_dau` (`WO-067`) + qua job cùng `slug` (`WO-078`) |
| "request ngầm" trong một lần gửi | ✅ vòng chunk trong `phien_am`, trần `tran_vong_asr: 24` |
| `lan_gui` = "request user" | ✅ `ghi_nhan_gui` gọi **một lần cho cả job** (`worker.py:845`), KHÔNG mỗi chunk |

⇒ **Nới `lan_gui` lên 5–10 KHÔNG cứu được ca này.** Nó đếm *lượt job*, nên nới
chỉ cho phép khởi động lại nhiều lần hơn — mỗi lần vẫn chết ở đúng chunk ấy.
Đòn đúng là thử lại **chính cái chunk** vừa đứt. `M12-R6` giữ nguyên.

## Hai lỗ thật

### 1 · Một cue đảo mốc giết cả job

```
VttHong: cue 172: `den` (687.841) trước `tu` (743.8)
```

Model trả một cue **kết thúc trước lúc bắt đầu**. `vtt.dung()` từ chối cả file
⇒ job hỏng, **172 cue tốt bị vứt**.

Trớ trêu: ngay phía trên (`asr_cua.py:544`) mã đã **bỏ qua** cue thiếu `tu`/`den`
với đúng lý lẽ *"bỏ một cue thì mất một câu — thấy được"*. Cùng một loại rác,
hai cách xử. Mốc đảo cũng phải bỏ qua.

Offset `moc` cộng vào **cả** `tu` lẫn `den` (`asr_cua.py:550`) nên raw từ model
đã đảo sẵn — không phải lỗi phép cộng.

### 2 · 502 giữa chừng giết cả job

`_phien_am_mot_doan` để `httpx.HTTPStatusError` bay thẳng ra khỏi vòng chunk.
Vòng ấy CÓ thử lại — nhưng chỉ cho ca *"đoạn không tiến"*, không cho ca *"cửa
502"*. Mà 502 là ca **thường gặp nhất** (đo 05-09: 3 lần gọi, 1 thành công).

## Kỳ vọng

1. Cue có `den <= tu` ⇒ **bỏ qua + đếm + in ra**, như cue thiếu mốc.
2. Chunk gặp lỗi **tạm thời** (502/503/504/timeout/lỗi mạng) ⇒ thử lại chính
   chunk ấy, tối đa `tran_thu_lai_cua` lần (bảng khai), có giãn cách.
3. Lỗi **không tạm thời** (401/403/422, thiếu khoá) ⇒ ném NGAY, không thử lại —
   thử lại một lỗi cấu hình là đốt tiền để nhận cùng một câu trả lời.
4. `lan_gui` và `M12-R6` **không đổi**.

## Ràng buộc

- Thử lại vẫn **tiêu egress** (byte rời máy) dù 502 không tính token. Phải đi
  qua `egress.gui()` như mọi lời gọi, và **đếm được** trong sổ.
- Trần thử lại là **bảng khai**, không gõ trong mã.
- Giãn cách để không đập cửa đang ốm.
