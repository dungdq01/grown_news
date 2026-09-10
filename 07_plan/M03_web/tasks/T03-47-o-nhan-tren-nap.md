# T03-47 — WO-016: ba ô nhãn trên hai đường nạp còn lại (đơn vị CODE)

> Hai màn `/tai-lieu/nap/` và `/video/nap/` nhận ô **chủ đề** + **khái niệm**,
> nạp từ server qua `/api/categories` và `/api/concepts` — cùng đường mà form bài
> viết đã dùng. Loại nguồn thì KHÔNG cần ô: nó suy ra từ chính đường nạp
> (`/tai-lieu/nap/` ⇒ `tai-lieu`) và từ `media.mime` / `url_normalized`; một ô
> cho nó là hỏi người dùng thứ máy đã biết.
>
> **Mốc khai bằng thuộc tính `data-dm`, không bằng id gõ cứng.** `napDanhMuc` gõ
> hai id thì form thứ ba im lặng không được nạp — cùng bệnh `#acount` đếm cả
> trang của WO-015, và cách chữa cũng cùng hình dạng (`data-dem`).
>
> **Ngân sách: `gn.js` dư 1178 byte.** Vòng qua `[data-dm]` rẻ hơn ba cặp id gõ
> tay, và nó làm form thứ tư tốn **0** byte. Vượt trần ⇒ tách bundle, không nới.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: hai màn nạp có ô chủ đề + khái niệm, mốc khai bằng thuộc tính
    cmd: cd web && node test/o-nhan-nap.test.js
  - AC2: hai hàm gửi đưa `category` + `concepts` vào frontmatter
    cmd: cd web && node test/o-nhan-nap.test.js
  - AC3: nạp một tài liệu/video ĐỦ nhãn qua API ⇒ 201, thiếu ⇒ 422
    cmd: cd web && node test/nhan-bat-buoc.test.js
  - AC4: ngân sách — đo BYTE
    cmd: cd web && node build-fe.mjs && node test/page-weight.test.js
  - AC5: cả bộ còn xanh
    cmd: cd web && npm test
phụ_thuộc: T03-46
