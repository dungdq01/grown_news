# T01-10 — FR-036/B2: hồ sơ kiểm `thu-vien` trong validate.py (đơn vị CODE)

> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.2. MỘT cửa ghi vẫn giữ nguyên:
> `ghiSauValidate` không đổi, chỉ khối hình dạng thân bài được bọc theo `ho_so`.
>
> Đây ĐÚNG khối 47 dòng mà FR-036/A2 vừa viết lại — nên B2 bị chặn cứng bởi A2, và
> A2 đã xong.

phạm_vi_ghi:
  - core/src/source_distiller/validate.py

verifiability: hard
tiêu_chí:
  - AC1: bản ghi `thu-vien` thân rỗng đi qua cổng; bản ghi `phan-tich` thiếu mục VẪN
      bị chặn (nhánh mới không được nuốt cổng cũ); `thu-vien` thân >400 từ bị chặn;
      `tai-lieu` không khai `media` bị chặn; `video` thư-viện thiếu `url_normalized`
      bị chặn
    cmd: python -m pytest core/tests -q -k thu_vien
  - AC2: `normalize_url` xử lý TikTok dạng đầy đủ; link rút gọn `vm.tiktok.com`
      KHÔNG giải được offline nên trả host+path và nói ra thay vì bịa
    cmd: python -m pytest core/tests -q -k tiktok
  - AC3: kho thật và kho mock vẫn sạch — thêm một nhánh hồ sơ không được đổi phán
      quyết của bài cũ
    cmd: python core/src/source_distiller/validate.py kb-mock/ --no-concepts --no-categories && python core/tests/check_kb_mock.py
phụ_thuộc: T01-25
