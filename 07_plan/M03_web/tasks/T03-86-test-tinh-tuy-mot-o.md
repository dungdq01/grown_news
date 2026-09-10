# T03-86 — form: tinh túy là MỘT ô (đơn vị TEST)

> WO-038. `form-van-xuoi.test.js` hiện canh ĐÚNG cấu trúc con vừa bị bỏ: §2 đòi
> ô Tên riêng + 5 ô bullet, §3 đòi `gomTinhTuy()` sinh `####`. Cả hai phải đổi
> **đích**, không xoá trắng — điều người dùng muốn vẫn là *không dấu markdown*,
> chỉ khác là nay đạt được bằng cách **bỏ cấu trúc**, không bằng cách máy gõ hộ.
>
> Đích mới:
>
> **1 · số ô = số mục lá.** Trước WO-038 mục 3.4 không góp `placeholder` nào nên
> cổng phải trừ nó ra. Nay nó là ô bình thường ⇒ ngưỡng về đúng `soLa`, không
> còn phép trừ. Ngưỡng trừ mà không ai trả lại là ngưỡng tự nới.
>
> **2 · không hàm nào còn sinh `####`.** `gomKhung()` chỉ được sinh `##` và `###`.
> Còn sót một chỗ sinh `####` là còn một chỗ ép người viết theo cấu trúc cũ.
>
> **3 · chiều ngược — vòng vẫn phải khép.** `raiKhung()` rồi `gomKhung()` phải
> trả lại đúng thân bài. Bỏ `raiTinhTuy` mà quên rằng 3.4 nay do `raiKhung` lo là
> mất mục 3.4 khi sửa bài cũ, âm thầm — đúng lớp lỗi WO-037 đã trúng.

phạm_vi_ghi:
  - web/test/form-van-xuoi.test.js
  - web/test/khung-8-o.test.js
  # `_khung.mjs` là bản GƯƠNG của `khung.py` phía test — nó đọc
  # `KHUNG.tinh_tuy.bullets`, nên bảng khai đổi là nó NÉM, kéo theo mọi cổng
  # dùng `thanBaiKhung()`. Hai cổng kia nhập `TINH_TUY_O` từ nó.
  - web/test/_khung.mjs
  - web/test/api-crud.test.js
  - web/test/cua-so-doc.test.js
  # `thanBai()` dựng thân bài mẫu cho mọi cổng API. Bỏ 5 dòng bullet làm nó
  # ngắn đi ~30 từ ⇒ mục 1+2 vọt lên 36% > trần 25%. Fixture suy biến, không
  # phải sản phẩm — chữa bằng cách cho nó hình dạng của bài THẬT.
  - web/test/_api.mjs

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên bản hiện tại (form còn ô con), XANH sau T03-87
    cmd: cd web && node test/form-van-xuoi.test.js
  - AC2: vòng `raiKhung` → `gomKhung` khép trên một thân bài 8 mục
    cmd: cd web && node test/form-van-xuoi.test.js
