# T03-26 — FR-038/C5: cổng bảy màn + sửa các số cứng sắp đỏ (đơn vị TEST)

> Viết **trước** T03-11 và phải **ĐỎ trước** (R5).
>
> **`web/test/bay-man.test.js` (MỚI)** — đo HÀNH VI, không đo markup:
> mỗi màn trong `man-hinh.json` phải render được và mang đúng `tieu_de` khai ·
> ba màn loại **chỉ** chứa bản của loại mình (chiều ÂM: màn Video không được có
> một thẻ `paper` nào) · Kho và Tổng hợp **có** cả ba loại (chiều dương của
> *"chỉ hai màn đó để chung"*) · thanh menu đúng 7 tab chia hai nhóm 4+3.
>
> Đọc kỳ vọng **TỪ `man-hinh.json`**, không gõ tay lại — cổng gõ tay lại bảng khai
> là bản gõ tay thứ hai mà `check_khai_mot_noi` §3 sinh ra để cấm.
>
> **Ba con số cứng sẽ đỏ ở C5** (đã đo, phải sửa ở đây chứ không sửa lẫn vào code):
> `cac-man-con-lai.test.js:683-684` màn Kho đúng 3 `data-kpane`/`data-ktab` ·
> `trang-chu-layout.test.js:202-209` sáu phép `=== 3` + `class="kp " === 4` ·
> `four-screens.test.js:58` `vung.length === 4`.
> Sửa theo hướng **dẫn xuất**, không thay số cứng này bằng số cứng khác — một số
> cứng vừa hết hạn thì thay nó bằng số cứng mới là hẹn lại đúng lỗi đó.
>
> **`_render.mjs` `VIEWS`** (`:71-72`) là bảng thứ tư; nó phải đọc `man-hinh.json`
> như ba bảng kia. Quên nó ⇒ ba màn mới **vô hình** với 7 test quét-mọi-trang, và
> `ssr-routes.test.js:35` `MAN` là danh sách cứng nên màn mới không được kiểm
> 200/empty-state.
>
> `chu-giao-dien.test.js:196` — tổng chữ phụ trợ ≤ 480 ký tự/trang, và vì mọi màn
> ở cùng tài liệu nên chữ ba màn mới **cộng dồn vào từng trang**. Nếu vượt thì
> SIẾT CHỮ, không nới ngưỡng.

phạm_vi_ghi:
  - web/test/bay-man.test.js
  - web/test/_render.mjs
  - web/test/ssr-routes.test.js
  - web/test/four-screens.test.js
  - web/test/trang-chu-layout.test.js
  - web/test/cac-man-con-lai.test.js
  - web/test/page-weight.test.js
  - web/test/nut-song.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng mới ĐỎ trên code hiện tại (ba màn chưa có) và nói ra thiếu màn nào
    cmd: cd web && node test/bay-man.test.js; test $? -ne 0
  - AC2: sau T03-11 cả bộ XANH, cổng mới có trong `npm test`
    cmd: cd web && npm test
  - AC3: các số cứng đã đổi thành DẪN XUẤT — xoá một màn khỏi `man-hinh.json` thì
      cổng đỏ, không phải im lặng
    cmd: cd web && node test/bay-man.test.js
phụ_thuộc: T01-21
