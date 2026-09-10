# T01-24 — FR-039: cổng cho định dạng mở (đơn vị TEST)

> `core/tests/check_dinh_dang_mo.py` (MỚI). Viết **trước** T01-23, ĐỎ trước (R5).
>
> Chiều dương (mime lạ hợp lệ được schema nhận) là vế DỄ. Vế nặng là chiều âm:
> schema phải TỪ CHỐI `mime` mang `\r\n` · dấu cách · `;` · ký tự điều khiển —
> vì chuỗi đó đi thẳng vào đầu đề `content-type`, và một đầu đề tách được là một
> lỗ có thật, không phải một lỗi hình thức.
>
> Cộng: bảng mime giữ đủ 5 định dạng đã biết (bỏ sót một cái là PDF mất xem
> trước) · khối `mac_dinh` có đủ `mime`/`duoi`/`xem_truoc` · `xem_truoc` của
> `mac_dinh` KHÔNG được là `iframe`.

phạm_vi_ghi:
  - core/tests/check_dinh_dang_mo.py

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên schema hiện tại (enum-5 chưa mở)
    cmd: python core/tests/check_dinh_dang_mo.py
  - AC2: sau T01-23 XANH, và ca âm `mime` có ký tự điều khiển vẫn bị chặn
    cmd: python core/tests/check_dinh_dang_mo.py
phụ_thuộc: T01-22
