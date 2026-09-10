# T12-6 — `vong.py` Maildir + lan_gui/checkpoint + `api.py` 4 endpoint (stdlib)

> Hàng đợi GIỮ Maildir (chốt 09-02). Checkpoint theo giai đoạn (FR-046 kèm):
> chạy-lại mặc định từ giai-đoạn-hỏng. http.server stdlib (nghiên cứu §12).

phạm_vi_ghi:
  - chungcat/src/vong.py
  - chungcat/src/api.py                 # POST /job · GET /viec/<id> · GET /model · health

verifiability: hard
tiêu_chí:
  - AC1: ULID trùng nạp 2 lần ⇒ đúng MỘT việc (AC-5.1); tên đích new/<ULID>
      LUÔN duy nhất — không đường đè
    cmd: python chungcat/tests/check_hang_doi_nguyen_tu.py
  - AC2: giết tiến trình N lần lúc ngẫu nhiên ⇒ new/ không có JSON parse-lỗi
      (AC-5.2 bản FR-053)
    cmd: python chungcat/tests/check_hang_doi_nguyen_tu.py
  - AC3: lan_gui không reset; = 2 mà cả hai lần lệch schema ⇒ ly_do_dung nói
      RÕ "lệch định dạng — tạo việc mới với nhà khác" (nghiên cứu §6)
    cmd: python chungcat/tests/check_hang_doi_nguyen_tu.py
  - AC4: bind đúng 127.0.0.1 + cổng đọc từ dich-vu.json; POST trả viec_id ngay
      (không giữ kết nối)
    cmd: python chungcat/tests/check_nghe_loopback.py
  - AC5: (FR-053 AC-4.6) POST /job mang model không có trong bảng ⇒ từ chối;
      cổng gọi THẲNG :8790, không qua web/ — kiểm service, không kiểm FE
    cmd: python chungcat/tests/check_nghe_loopback.py
