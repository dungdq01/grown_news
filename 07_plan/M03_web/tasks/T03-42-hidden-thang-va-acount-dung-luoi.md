# T03-42 — WO-015: `hidden` phải thắng · `#acount` đếm đúng lưới (đơn vị CODE)

> **BUG-1**: `body.api-co .api-only{display:block}` (0,2,1) thắng
> `[hidden]{display:none}` (0,1,0), nên `#f-bai`/`#tv-meta` **luôn hiện** khi API
> chạy dù JS đặt `hidden`. Đo được: `hidden = true`, `display = block`.
>
> Sửa bằng **trọng số**, không bằng `!important`: `[hidden]` nâng lên
> `[hidden][hidden]` (0,2,0) vẫn chưa đủ trước 0,2,1 — cần `body [hidden]`
> (0,2,1, và thắng vì đứng SAU trong file) hoặc chính xác hơn:
> `.api-only[hidden]` (0,2,0)… vẫn thua. Nên dùng `body.api-co .api-only[hidden]`
> (0,3,1) — cùng ngữ cảnh, chỉ thêm điều kiện, và nó nói ra ý: "đang có API mà
> vẫn `hidden` thì vẫn ẩn".
>
> `!important` là đường ngắn nhưng nó tắt mọi luật sau, kể cả luật hợp lệ; và
> `token-only`/`markup-matches-css` không bắt được hệ quả đó.
>
> **BUG-2**: `apLoc()` đặt nhãn bằng `.cd:not(.off)` **cả trang**. Mọi màn nằm
> trong cùng tài liệu, nên con số là tổng của mọi màn. Đếm trong ĐÚNG lưới mà
> nhãn đứng cạnh, và mỗi màn loại có ô đếm riêng.

phạm_vi_ghi:
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: `[hidden]` thắng — với `body.api-co`, một `.api-only[hidden]` có
      `display: none`; bỏ `hidden` thì nó hiện lại
    cmd: cd web && node test/hien-that.test.js
  - AC2: KHÔNG dùng `!important` để chữa — sửa bằng trọng số
    cmd: cd web && node test/hien-that.test.js
  - AC3: `#acount` = số thẻ đang hiện TRONG `#grid2`, không phải cả trang
    cmd: cd web && node test/hien-that.test.js
  - AC4: mỗi màn loại có ô đếm riêng, đếm trong lưới của chính nó
    cmd: cd web && node test/hien-that.test.js
  - AC5: ngân sách BYTE + không hồi quy
    cmd: cd web && node build-fe.mjs && node test/sua-dung-man.test.js && npm test
phụ_thuộc: T03-41
