# T01-28 — FR-038/C6a: khai hai màn nạp riêng đã dựng (đơn vị CODE)

> `$comment_chi_khai_man_da_dung` trong `man-hinh.json` ghi sẵn ba mục phải thêm
> lại ở C6. Thêm **HAI** — `nap-bai-viet` và `nap-tai-lieu` — vì đó là hai lối
> ĐÃ CHẠY, chỉ được dời chỗ. `nap-video` là đường **chưa tồn tại**, nên nó vào
> bảng ở C6b cùng lúc với màn của nó; đó chính là luật T01-21 đặt ra.
>
> `/nap/` chung **bị bỏ** khỏi bảng cùng lượt: giữ nó là bốn màn nạp cho ba loại,
> tức đúng "gộp chung màn" mà người dùng cấm. Nội dung được DỜI, không chép —
> `viet` (9267 ký tự) sang bài viết, `thu-vien` (1877) sang tài liệu, còn `link`
> (891) + `file` (1052) là hai lối nhận **bản phân tích** nên thuộc bài viết.

phạm_vi_ghi:
  - core/assets/man-hinh.json

verifiability: hard
tiêu_chí:
  - AC1: bảng khai có `nap-bai-viet` + `nap-tai-lieu`, KHÔNG còn `nap`, chưa có
      `nap-video`; cả hai `menu: false` · `cat_khi_khac: true` · `module` đúng
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: bảy mục menu và hai nhóm KHÔNG đổi
    cmd: python core/tests/check_khai_mot_noi.py
  - AC3: mọi màn trong bảng render được
    cmd: cd web && node test/bay-man.test.js
phụ_thuộc: T01-27
