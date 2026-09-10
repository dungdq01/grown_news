# WO-080 — Tự tạo việc NỐI TIẾP khi có tiến; và hiện rõ chuỗi trên UI

- **Loại**: cải tiến · **Module**: M12_chungcat + M03_web · **Mức**: hard
- **Task**: `T12-36` (thợ) · `T03-134` (màn)
- Chủ dự án 2026-09-09: *"làm, và phải hiển thị rõ trên UI"* ·
  *"để còn biết hỏng tại đâu, chạy lại từ đâu ra sao"*

## Vì sao GIỜ mới làm được

`WO-078` cho việc mới nhìn thấy tiến độ của việc cũ cùng `slug`; `WO-079` cho
chunk thử lại ngầm. Trước hai cái đó, "tự tạo việc tiếp" chỉ là tự bấm lại một
việc chạy từ giây 0 — tức tự động hoá một sự lãng phí.

## Điều kiện — và nó là cái chặn, không phải cái trang trí

Chỉ tự tạo việc nối tiếp khi **CẢ BA**:

1. `loai == sinh-transcript` và chặng hỏng nối tiếp được
   (`dang-doc-nguon` · `dang-goi-model`)
2. **CÓ TIẾN**: số giây đã phiên âm **tăng** so với lúc lượt này bắt đầu
3. Chưa quá `tran_noi_tiep_tu_dong` (bảng khai)

Điều kiện 2 là cái chặn thật: không tiến ⇒ không tự tạo ⇒ **không thể thành
vòng lặp có hoá đơn**. Đây đúng là bất biến `WO-069` đã dựng để đóng vòng lặp
vô hạn, nay dùng lại làm điều kiện cho một vòng lặp CÓ ÍCH.

Điều kiện 3 là lan can thứ hai: một chuỗi tiến 1 giây mỗi lượt vẫn kết thúc,
nhưng sau rất nhiều việc. Trần khai ở bảng, không gõ trong mã.

## `M12-R6` không đổi

Mỗi việc nối tiếp là một ULID mới, `lan_gui` riêng bắt đầu từ 0, trần 2 giữ
nguyên, sổ egress riêng. Không chỗ nào reset `lan_gui`.

## UI — trả lời ĐÚNG ba câu chủ dự án hỏi

| câu | hiện ở đâu |
|---|---|
| **hỏng tại đâu?** | thẻ trong thùng rác: chặng hỏng + lý do (đã có) **+ MỚI**: *"đã phiên âm tới `mm:ss`"* |
| **chạy lại từ đâu?** | thẻ việc mới: *"nối tiếp từ `mm:ss`"* |
| **ra sao?** | cả hai thẻ mang nhãn chuỗi *"nối tiếp n/N"* + trỏ tới ULID kia |

Thẻ hỏng mà hệ ĐÃ tự tạo việc tiếp thì **không** còn câu *"hết 2 lần gửi — tạo
việc mới nếu cần"*: câu ấy sai khi máy đã làm hộ, và một câu sai ở chỗ này đẩy
người đi tạo một việc thứ hai trùng lặp.

## Ràng buộc

- Việc nối tiếp tạo qua **cùng một cửa** `POST /job` của THỢ, không đi đường
  riêng: một đường tạo việc thứ hai là một chỗ nữa để lệch hợp đồng payload.
- Tạo việc nối tiếp KHÔNG được làm hỏng việc đánh dấu `hong` — nó là fire-and-
  forget, lỗi ở đây chỉ được ghi log.
