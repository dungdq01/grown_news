# T03-63 — cổng SỬA · XOÁ · KHÔI PHỤC chạy thật, cả ba loại (đơn vị TEST)

> `web/test/vong-doi-ba-loai.test.js` (MỚI). Nửa sau vòng đời —
> `ba-duong-nap-that` (T03-62) canh nửa đầu.
>
> Mang **luật nặng nhất** của dự án: **M09-R1** — byte hiện vật phải sống sót
> lần xoá. `recycle` là một trong năm nhánh của `tham_chieu_media`; bỏ sót nó thì
> **mỗi DELETE phá byte vĩnh viễn**, và `phucHoi()` sau đó **vẫn báo thành công**
> (nó chạy lại validate, mà validate không bao giờ thấy blob). Cộng **M08-R4**
> (xoá là chuyển sang `_recycle`) và **M08-R5** (địa chỉ bất biến, client không
> đặt được `origin`/`review_status`).
>
> `vong-doi-bai.test.js` đã đi vòng này cho **một** bài viết. Khác biệt ở đây: cả
> ba loại **cùng một kho**, nên một `xoaBai` xoá nhầm bảng, hay một `recycle` chỉ
> phủ `articles`, sẽ lộ ra — với một loại duy nhất thì không có gì để lẫn.
>
> **Ba lỗi HARNESS phải sửa trước khi cổng có nghĩa** — cả ba đều là tôi sai, và
> server chặt hơn tôi giả định:
>
> 1. PUT kèm `slug` khác ⇒ server **từ chối hẳn** (400), không lặng lẽ bỏ qua. Nên
>    phép *"slug không đổi"* xanh vì **không có gì đổi cả** — xanh vô nghĩa. Tách
>    thành một lần thử RIÊNG, đòi 400.
> 2. DELETE đòi `If-Match`. Quên nó ⇒ cả ba trả 400, và §4 (*"byte sống sót SAU
>    khi xoá"*) cùng §5 (*"trở lại danh sách"*) **xanh vô nghĩa** — chẳng có gì bị
>    xoá thì byte tất nhiên còn. Thêm **tự kiểm vật liệu**: bản ghi phải THỰC SỰ
>    rời danh sách trước khi nói bất cứ điều gì về byte.
> 3. Thay thân bài viết bằng một câu ⇒ 422 `Thiếu mục: 1, 2, 3, 4, 5…`: hồ sơ
>    `phan-tich` đòi khung 5 mục. Giữ thân gốc.

phạm_vi_ghi:
  - web/test/vong-doi-ba-loai.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng xanh — sửa/xoá/khôi phục cả ba loại, byte sống sót
    cmd: cd web && node test/vong-doi-ba-loai.test.js
  - AC2: có trong `npm test`, không cổng nào khác đỏ thêm
    cmd: cd web && npm test
