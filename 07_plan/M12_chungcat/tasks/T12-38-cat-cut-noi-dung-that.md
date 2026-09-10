# T12-38 — Phản hồi bị cắt cụt phải NÓI nó bị cắt

> `WO-084`. Chủ dự án 2026-09-10.

phạm_vi_ghi:
  - 07_plan/M12_chungcat/tasks/T12-38-cat-cut-noi-dung-that.md
  - chungcat/src/adapter/hop_dong.py
  - chungcat/src/adapter/openai.py
  - chungcat/src/adapter/google.py
  - chungcat/assets/nguong.json
  - chungcat/tests/check_cat_cut_noi_that.py

verifiability: hard
tiêu_chí:
  - AC1: `nguong.json` khai `tran_chu_chung_cat` kèm `$vi_sao_`, và CẢ HAI
      adapter đọc trần ấy TỪ BẢNG (không gõ số trong mã)
    cmd: python chungcat/tests/check_cat_cut_noi_that.py
    đỏ_khi: một adapter gõ cứng số · một adapter không gửi `max_tokens` —
      vế 1/1a/1b
  - AC2: `finish_reason: "length"` ⇒ ném câu nói phản hồi BỊ CẮT, kèm số ký
      tự nhận được; câu ấy KHÔNG chứa "không phải JSON"
    cmd: python chungcat/tests/check_cat_cut_noi_that.py
    đỏ_khi: vẫn báo "không phải JSON" ⇒ người sửa đi tìm ở hình dạng thay vì
      ở trần token — vế 2/2a/2b
  - AC3: `finish_reason: "stop"` mà JSON hỏng thật ⇒ VẪN nói "không phải
      JSON", không quy oan cho việc bị cắt
    cmd: python chungcat/tests/check_cat_cut_noi_that.py
    đỏ_khi: quy mọi lỗi parse thành "bị cắt" — vế 3
  - AC4: câu báo lỗi parse mang cả ĐUÔI phản hồi, không chỉ 300 ký tự ĐẦU
    cmd: python chungcat/tests/check_cat_cut_noi_that.py
    đỏ_khi: chỉ có đầu ⇒ cửa sổ vô dụng nhất có thể chọn, vì chỗ vỡ ở cuối —
      vế 4/4a
  - AC5: phản hồi ĐỦ và `finish_reason: stop` vẫn đi qua như cũ — không cổng
      nào của M12 đỏ thêm
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
    đỏ_khi: phép kiểm mới chặn cả phản hồi lành

ghi_chú: chẩn đoán ở `WO-084` — KHÔNG phải model bọc sai vỏ. `_boc` đòi đúng
  `{text, quotes}` nên `{"text": …}` là hình dạng hợp đồng; nó bị CẮT trước khi
  `quotes` kịp xuất hiện. Lối transcript đã bịt cả ba chỗ từ 2026-09-08; lối
  chưng cất chưa được mang sang.
