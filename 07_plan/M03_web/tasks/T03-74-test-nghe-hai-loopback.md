# T03-74 — WO-033: cổng cho server nghe CẢ HAI loopback (đơn vị TEST)

> `web/test/nghe-hai-loopback.test.js` (MỚI). ĐỎ trước (R5).

> **Đo HÀNH VI, không đọc mã**: bật server trên kho tạm rồi mở kết nối tới
> `127.0.0.1` **và** `::1`, đo `connect`. Đọc mã chỉ cho biết chuỗi nào có mặt;
> nó không cho biết cổng nào thật sự nghe.

> **Ca âm giữ ràng buộc an ninh**: KHÔNG được nghe trên một địa chỉ ngoài
> loopback. BRD B-D3 · security_baseline §4 — bản phân tích có thể chứa nguồn
> nội bộ. Cổng đòi cả hai vế, vì một bản vá "cho nhanh" bằng `0.0.0.0` sẽ
> **đạt vế tốc độ** và phá vế kia.

phạm_vi_ghi:
  - web/test/nghe-hai-loopback.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên mã hiện tại — `::1` không nghe
    cmd: cd web && node test/nghe-hai-loopback.test.js; test $? -ne 0
  - AC2: sau T03-75 XANH
    cmd: cd web && node test/nghe-hai-loopback.test.js