# T01-6 — FR-036: khung thân bài khai MỘT nơi (đơn vị CODE)

> Khung 9 mục cũ gõ tay ở SÁU chỗ và đã trôi thành HAI bộ tên khác nhau mà không
> cổng nào bắt — vì cổng chỉ ép SỐ mục, không bao giờ đọc tên. Task này dựng
> nguồn khai duy nhất và cho bốn cổng hình dạng đọc địa chỉ từ nó.
>
> Fixture + cổng canh là đơn vị RIÊNG (T01-7) — R1: đơn vị không phải test thì
> không chạm file test. `check_g6b` chặn đúng chỗ này khi tôi gộp hai vào một.

phạm_vi_ghi:
  - core/assets/khung-than-bai.json
  - core/src/source_distiller/khung.py
  - core/src/source_distiller/validate.py
  - core/tools/sinh_kb_mock.py
  - core/skill-src/mau-dat-chuan.md
verifiability: hard
tiêu_chí:
  - AC1: bốn cổng hình dạng đọc ĐỊA CHỈ từ khung (thiếu mục · trần dẫn nhập ·
      tinh túy `#### n.m.k` · locator), và kho mock sinh lại đi qua sạch
    cmd: python core/tools/sinh_kb_mock.py && python core/tests/check_kb_mock.py
  - AC2: `than_mau()` sinh từ khai báo đi qua chính cổng của nó; kho thật không
      lỗi cấu trúc nào ngoài phần chờ danh mục
    cmd: python core/src/source_distiller/validate.py kb-mock/ --no-concepts --no-categories
phụ_thuộc: T01-5
