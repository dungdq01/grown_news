# T01-31 — C6b: khai màn `/video/nap/` (đơn vị CODE)

> `$comment_chi_khai_man_da_dung` trong `man-hinh.json` ghi sẵn mọi trường cần
> thêm. Thêm ĐÚNG LÚC màn của nó tồn tại — luật T01-21: *"bảng mô tả màn CÓ
> THẬT"*, và một mục trỏ vào view chưa dựng là 500 trên URL chưa ai làm.
>
> Nút header của `/video/` hiện **cố ý vắng** (WO-012): module `video` chưa có
> đường nạp nên `nutNap()` trả rỗng. Thêm mục này là nút đó tự hiện — không phải
> sửa thêm chỗ nào.

phạm_vi_ghi:
  - core/assets/man-hinh.json

verifiability: hard
tiêu_chí:
  - AC1: bảng khai có `nap-video`; bảy mục menu và hai nhóm KHÔNG đổi
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: mọi màn trong bảng render được; `/video/nap/` mở đúng `v-napvideo`
    cmd: cd web && node test/bay-man.test.js && node test/man-nap-rieng.test.js
  - AC3: nút header của `/video/` tự hiện "+ đăng ký video"
    cmd: cd web && node test/ui-ba-man.test.js
phụ_thuộc: T01-29
