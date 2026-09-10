# T08-7 — FR-036/B5: đường nạp hiện vật qua HTTP (đơn vị CODE)

> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.3. Byte đi **trước**, bản ghi đi
> **sau** — vì `source_type: tai-lieu ⇒ required: media` nghĩa là bản ghi không
> thể tồn tại hợp pháp trước blob của nó.
>
> **Bẫy đã biết (R2 của plan)**: `api-guard` răng 5 đòi literal
> `review_status: "approved"` **chỉ** trong `taoBai`. Một handler mới có literal
> riêng làm `npm test` chết ở chỗ trông như không liên quan. ⇒ tạo bản ghi thư
> viện đi qua `POST /api/articles` (tức `taoBai`), **không** endpoint thứ hai.
>
> `dungchung.mjs` vào phạm vi vì `luuHienVat` cần trả `ma` (mã HTTP) theo đúng
> khuôn `themVaoDanhMuc` đã có — hai lý do từ chối khác nhau (mime ngoài enum
> vs byte không khớp mime khai) cho người gọi hai lời khuyên khác nhau.

phạm_vi_ghi:
  - web/api/router.mjs
  - web/api/articles.mjs
  - web/api/dungchung.mjs

verifiability: hard
tiêu_chí:
  - AC1: `POST /api/articles/media` trả 201 `{sha256, so_byte, mime}` cho hiện vật
      hợp lệ; **413** cho body 26 MB; **415** cho mime ngoài enum đóng; **422** khi
      magic-byte không khớp mime khai
    cmd: cd web && node test/thu-vien.test.js
  - AC2: `x-ten-goc` được LỌC ở server rồi trả lại — tên hiển thị không bao giờ
      là một đường dẫn, và luật đó sống ở MỘT chỗ (không phải trong client)
    cmd: cd web && node test/thu-vien.test.js
  - AC3: bản ghi `tai-lieu` tạo qua `POST /api/articles` (delegate `taoBai`) đi
      qua; cùng payload với sha256 bịa bị 422; không handler nào có literal
      `approved` riêng
    cmd: cd web && node test/thu-vien.test.js && node test/api-guard.test.js
  - AC4: không hồi quy — route mới không làm lệch đường `:type/:slug` nào
    cmd: cd web && npm test
phụ_thuộc: T01-12
