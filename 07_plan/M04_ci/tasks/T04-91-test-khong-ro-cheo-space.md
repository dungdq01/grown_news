# [Space] T04-91 — đơn vị TEST: cổng R4 `check_khong_ro_cheo_space`

> `ADR-09 §8`: *"Chống rò là CỔNG, không phải niềm tin."* Đây là thước đo của
> cả nhánh Space — và theo luật gốc, người viết mã scoping KHÔNG cầm bút viết
> thước chấm mình ⇒ cổng là đơn vị RIÊNG, viết TRƯỚC mã `WHERE space`.
> Đặt ở `core/tests/` (M04 boundary, checklist §2.2) — **hộp đen**, không
> import mã của M08/M13.
> CHẶN CỨNG: sau T01-90 (cột `space` phải tồn tại thì gieo mới có nghĩa) VÀ
> sau T04-90 — hai đơn vị cùng thêm dòng đăng ký vào `ci.yml` · `Makefile` ·
> `test_gates.py`; tuần tự thì mỗi lần chỉ một bên sửa ba file đó.
> phụ_thuộc: T01-90, T04-90
> ID theo rule 13: T04-91.

## Hình dạng

- Gieo **kho tạm** (`KB_DIR`, cổng 8895–8899 — checklist §4, cấm chạm 8787):
  2 space × 2 bản ghi, nội dung có từ khoá CHUNG để truy vấn nào cũng khớp cả
  bốn nếu quên lọc.
- Hai hộp đen, mỗi hộp một khẳng định:
  · `GET /api/index?space=mac-dinh` ⇒ 0 bản ghi của `the-thao`
  · `POST /truy-hoi {pham_vi:{space:'mac-dinh'}}` ⇒ 0 hàng `the-thao`
    (M13 chưa sống thì vế này SKIP có lý do in ra, không xanh giả)
- **Vế tự chứng minh**: chạy lại trên fixture CỐ TÌNH bỏ `WHERE space`
  (bản vá tạm trong thư mục tạm) ⇒ cổng phải ĐỎ. Cổng không đỏ được là cổng
  trang trí (`#cổng-không-đỏ-được`).

phạm_vi_ghi:
  - core/tests/check_khong_ro_cheo_space.py   # MỚI — hộp đen, 0 import mã M08/M13
  - .github/workflows/ci.yml                  # đăng ký: cổng ngoài CI là cổng không răng (M04-R1)
  - Makefile                                  # bản chạy tay
  - core/tests/test_gates.py                  # test subprocess để pytest phủ

verifiability: hard
tiêu_chí:
  - AC1: gieo 2 space ⇒ truy vấn space A trả 0 hàng space B ở CẢ HAI cửa
      (M13 chưa sống ⇒ SKIP có in lý do, không tính là xanh)
    cmd: python core/tests/check_khong_ro_cheo_space.py
    đỏ_khi: ≥1 hàng chéo lọt, dù chỉ một
    xanh_khi: 0 hàng chéo ở mọi cửa đo được
  - AC2: TỰ CHỨNG MINH — fixture bỏ `WHERE space` ⇒ cổng ĐỎ kèm câu nêu đúng
      cửa nào rò
    cmd: python core/tests/check_khong_ro_cheo_space.py
  - AC3: chạy trên kho TẠM, cổng 8895–8899; 0 lời gọi tới 8787/kb thật
    cmd: python core/tests/check_khong_ro_cheo_space.py
  - AC4: có răng — trong ci.yml + pytest gọi được
    cmd: python core/tests/check_ci_teeth.py && python -m pytest core/tests -q
