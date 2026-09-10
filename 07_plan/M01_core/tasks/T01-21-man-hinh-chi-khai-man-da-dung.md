# T01-21 — FR-038/C5: `man-hinh.json` chỉ khai màn ĐÃ DỰNG (đơn vị CODE)

> `man-hinh.json` đang khai 11 màn, trong đó ba màn nạp riêng
> (`nap-bai-viet` · `nap-tai-lieu` · `nap-video`) **chưa tồn tại** — chúng là việc
> của C6.
>
> Điều đó chặn C5. Nếu `server.mjs` dẫn xuất `VIEW_SSR` từ bảng khai thì
> `/bai-viet/nap/` map sang view `nap-bai-viet`, `trang.mjs` ném *"view không có"*,
> và người dùng nhận **500 trên một URL chưa ai làm**. Một bảng khai mà consumer
> chỉ đọc được một phần thì tệ hơn cả hai đầu: nó không còn là nguồn duy nhất, mà
> cũng không còn là danh sách gõ tay ai cũng thấy.
>
> **KHÔNG thêm cờ `da_dung: false`.** Một cờ như thế phải được ai đó nhớ lật, và
> thứ phải nhớ lật thì sẽ có ngày không được lật — đúng lớp lỗi mà cả bảng khai
> này sinh ra để dẹp. Bảng mô tả thứ CÓ THẬT; ba mục kia quay lại ở C6 cùng lúc
> với màn của chúng.
>
> Ghi lý do vào chính file, để C6 biết phải thêm lại gì.

phạm_vi_ghi:
  - core/assets/man-hinh.json

verifiability: hard
tiêu_chí:
  - AC1: mọi màn trong bảng khai đều render được — không mục nào trỏ vào một view
      `trang.mjs` không dựng nổi
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: bảy mục menu · hai nhóm · bốn màn nội dung vẫn nguyên (bỏ ba màn nạp
      riêng KHÔNG được đụng vào thanh menu)
    cmd: python core/tests/check_khai_mot_noi.py
  - AC3: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T01-20
