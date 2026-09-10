# T12-4 — `egress.py`: một cửa ra Internet, seq + fsync + allowlist + trần

> M12-R3/AC-6.1/AC-6.3. Kiểm được KHÔNG cần mạng (mock httpx).

phạm_vi_ghi:
  - chungcat/src/egress.py

verifiability: hard
tiêu_chí:
  - AC1: đích ngoài allowlist (từ model.json) ⇒ raise TRƯỚC khi mở socket
    cmd: python chungcat/tests/check_mot_cua_egress.py
  - AC2: payload > trần 32MB ⇒ raise TRƯỚC khi sha256/ghi log — log không được
      chứa lần gửi không-bao-giờ-xảy-ra
    cmd: python chungcat/tests/check_mot_cua_egress.py
  - AC3: seq do TA cấp, log fsync TRƯỚC post; payload mang _seq — giết tiến
      trình giữa hai lệnh: dòng log vẫn còn
    cmd: python chungcat/tests/check_mot_cua_egress.py
  - AC4: sha256 trên canon(payload) — dựng lại từ log băm ra CÙNG số (AC-6.2)
    cmd: python chungcat/tests/check_mot_cua_egress.py
  - AC5: grep toàn module: đúng MỘT chỗ gọi client.post
    cmd: python chungcat/tests/check_mot_cua_egress.py
