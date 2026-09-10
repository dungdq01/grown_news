<!-- Chuyen tu 07_plan/M02_kb/: `core/**` thuoc boundary M01_core
     (project_map: be: [core/**, ...]). M02_kb la `kb/**` — du lieu, khong phai
     cong cu sinh ra no. -->

# T01-32 — WO-019: cổng cho bảng `loai_nguon` trong DB (đơn vị TEST)

> `core/tests/check_loai_nguon_db.py` (MỚI). ĐỎ trước (R5).
>
> Người dùng: *"bạn cần lưu các dữ liệu của mục phân loại này vào bảng DB —
> giống concept và category ấy, ko được hardcode"* · *"quản lý danh sách LOẠI
> NGUỒN đó → loại nguồn nào ứng với PHÂN LOẠI nào"*.
>
> **§1 · Bảng có thật và có hình dạng đúng.** `id` là khoá; `module` nói loại
> nguồn này thuộc phân loại nào — đó chính là quan hệ người dùng hỏi.
>
> **§2 · ĐIỂM BẤT ĐỘNG, và nó là vế nặng.** `file → DB₁ → file′ → DB₂` phải cho
> `DB₁ ≡ DB₂`, và `export(DB₂)` không ghi thêm gì. Đây là phép kiểm đã cứu FR-034;
> một bảng mới không đi qua nó là một bảng có thể mất sạch sau một vòng export.
>
> **§3 · GIEO TỪ BẢNG KHAI khi bảng rỗng.** Kho mới tinh phải có sẵn 14 loại
> nguồn, không bắt người dùng gõ tay. Nguồn gieo: `loai-nguon.json` (bài viết) +
> `media-mime.json` (định dạng · nơi phát). Đây KHÔNG vi phạm M02-R3: loại nguồn
> là enum của schema và whitelist, không phải nhãn người tạo.
>
> **§4 · CA ÂM — gieo KHÔNG được đè.** Nếu người dùng sửa nhãn một loại nguồn
> rồi chạy lại `dung_lai_db.py`, sửa đó phải còn. Gieo chỉ chạy khi bảng RỖNG;
> chạy mọi lần là xoá công người dùng, im lặng.
>
> **§5 · CA ÂM — `source_type` VẪN ở file khai.** Bảng mới không được thay
> `loai-nguon.json`: file đó sinh `CHECK` của DDL, và `coFileBai()` cùng phép
> kiểm `type` của route phải chạy KHI DB CHƯA TỒN TẠI. Hai nguồn cho một enum là
> chỗ lệch im lặng.

phạm_vi_ghi:
  - core/tests/check_loai_nguon_db.py

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (chưa có bảng)
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_loai_nguon_db.py; test $? -ne 0
  - AC2: sau T01-33 XANH, và vòng export/import cũ không đổi
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_loai_nguon_db.py && python core/tests/check_export_dan_xuat.py
