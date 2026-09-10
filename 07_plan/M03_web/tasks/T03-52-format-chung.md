# T03-52 — WO-021: một format chung · gỡ bốn trường · bố cục hai cột (CODE)

> Bốn việc:
>
> 1. **Gỡ bốn trường** khỏi form bài viết — `Mã bài` · `Tên đường dẫn` ·
>    `Tín cậy tối đa` · `Mức đầy đủ` — và `guiFormThat` tự điền chúng, cùng cách
>    tài liệu/video đang làm. Schema vẫn đòi cả bốn; thiếu là 422 sau khi người
>    dùng gõ xong. Gỡ cả `Địa chỉ trong kho` ở hai màn kia — cùng lý do, cùng
>    nhóm "cất ở đâu trong kho".
> 2. **Thêm `Tiêu đề`** cho tài liệu và video — hai màn chưa có, và nó là trường
>    cố định người dùng kể tên.
> 3. **Nới cổng module**: không còn đòi chủ đề + khái niệm cho tài liệu/video
>    (người dùng chốt bỏ, đảo quyết định của chính họ ở T08-17). Nhãn đổi từ
>    "bắt buộc" sang "nên có" — một ô ghi "bắt buộc" mà server nhận khi trống là
>    màn nói sai về luật.
> 4. **Bố cục hai cột**: form một bên, lời giải thích máy-làm-gì một bên. Không
>    kéo ô nhập rộng 1344px — vấn đề là chỗ TRỐNG (715px = 53%), không phải chiều
>    rộng ô.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js
  - web/api/cong-module.mjs

verifiability: hard
tiêu_chí:
  - AC1: ba form cùng bộ trường cố định; bốn trường đã gỡ vẫn vào payload
    cmd: cd web && node test/format-chung.test.js
  - AC2: POST tài liệu/video thiếu chủ đề ⇒ 201 (qua HTTP thật)
    cmd: cd web && node test/format-chung.test.js
  - AC3: bố cục hai cột ở rộng, một cột ở hẹp
    cmd: cd web && node test/format-chung.test.js
  - AC4: ghi một bài viết qua form vẫn 201 — bốn trường máy điền hợp lệ
    cmd: cd web && node test/vong-doi-bai.test.js && node test/api-crud.test.js
  - AC5: ngân sách đo BYTE, và cả bộ xanh
    cmd: cd web && node build-fe.mjs && npm test
phụ_thuộc: T03-51
