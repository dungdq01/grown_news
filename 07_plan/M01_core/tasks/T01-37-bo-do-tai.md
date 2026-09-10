# T01-37 — bộ đo TẢI cho hệ thống (s9/G7 `workload_report`)

> `core/tools/do_tai.py` (MỚI). s9 đòi `workload_report` có **p95 · throughput ·
> error rate** — *"số đo, không phải 'chạy ổn'"*. Dự án có 77 cổng và **không
> cái nào đo THỜI GIAN**; mọi con số hiệu năng cho tới nay mô tả một hệ thống có
> **1 bản ghi**.

> **Bảy quyết định thiết kế** ghi trong docstring của công cụ. Cái trung tâm:
> **số bất biến là ĐỘ DỐC, không phải mili giây**. Mili giây đổi theo máy, theo
> tải nền — một ngưỡng ms là `#cổng-đỏ-oan`. `t(N) ~ N^k` thì không đổi theo máy.

> **Nhưng `k` một mình giấu bội số**: một đường 48 → 315 ms có k ≈ 0.25, đúng về
> toán và sai về nghĩa. Bản đầu của tôi dán nhãn *"PHẲNG"* lên đúng đường đó.
> Sửa: báo **cả hai** — `k` (hình dạng) và `×bội` (cái giá), và bội số có quyền
> phủ quyết nhãn.

> **Tự kiểm vật liệu**: byte của màn liệt kê phải TĂNG theo N. Bản đầu quên dựng
> DB sau khi gieo .md, nên server thấy kho rỗng và **mọi độ dốc ra 0.00 "PHẲNG"**
> — đẹp và vô nghĩa. Phép tự kiểm bắt được; rồi chính nó cũng sai lần đầu vì so
> `max` toàn bộ đường, mà `gn.js` 98 KB át hết.

> **KHÔNG phải cổng trong `npm test`** (D7): nó bật 4 server và gieo tới 800 bản.
> Đây là INSTRUMENT — chạy ở s9/G7, khi nghi ngờ, khi đổi thứ có thể đắt.

phạm_vi_ghi:
  - core/tools/do_tai.py

verifiability: hard
tiêu_chí:
  - AC1: chạy được và tự kiểm vật liệu (byte màn liệt kê tăng theo N)
    cmd: PYTHONIOENCODING=utf-8 python core/tools/do_tai.py --xem
  - AC2: quét đủ, sinh báo cáo + baseline, 0 lỗi
    cmd: PYTHONIOENCODING=utf-8 python core/tools/do_tai.py