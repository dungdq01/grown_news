# T08-17 — WO-016: cổng module đòi chủ đề + khái niệm cho tài liệu/video (CODE)

> `web/api/cong-module.mjs` — thêm vào cổng `tai-lieu` và `video` phép kiểm
> `≥1 category` + `≥1 concepts`. **Không** thêm cho `bai-viet`: hồ sơ
> `phan-tich` đã có cổng riêng trong `validate.py`, và một luật viết hai nơi là
> hai nơi để lệch.
>
> Vì sao ở đây mà không ở schema: người dùng chốt phương án này (2026-08-28).
> `frontmatter.schema.json` FROZEN, và đổi `required` của nó làm mọi bản ghi cũ
> thiếu hai trường thành không hợp lệ trên cả kho — một FR, không phải một patch.
>
> Câu lỗi phải nói **thiếu gì**, không phải "dữ liệu không hợp lệ".

phạm_vi_ghi:
  - web/api/cong-module.mjs
  - web/api/articles.mjs

verifiability: hard
tiêu_chí:
  - AC1: tài liệu/video thiếu chủ đề hoặc khái niệm ⇒ bị chặn, câu lỗi nói thiếu gì
    cmd: cd web && node test/nhan-bat-buoc.test.js
  - AC2: bài viết KHÔNG bị chặn bởi luật này
    cmd: cd web && node test/nhan-bat-buoc.test.js
  - AC3: cổng cũ của tài liệu/video (media · whitelist host) còn nguyên
    cmd: cd web && node test/route-theo-module.test.js && node test/thu-vien.test.js
  - AC4: cả bộ còn xanh
    cmd: cd web && npm test
phụ_thuộc: T03-48
