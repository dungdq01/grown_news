# T08-10 — FR-037/B10: spec M08 khai hai endpoint hiện vật (đơn vị CODE)

> `06_modules/M08_api/spec.md` là **FROZEN** và `grep "media"` trong đó ra **0
> dòng** — trong khi B5/B6 đã thêm `POST /api/articles/media`,
> `GET /api/articles/media/<sha256>`, và hai trường mới vào `/api/index`.
>
> Một endpoint chạy mà spec không khai là một endpoint không ai duyệt. FR-037 mở
> đường sửa; đây là phần M08 của nó.

phạm_vi_ghi:
  - 06_modules/M08_api/spec.md

verifiability: hard
tiêu_chí:
  - AC1: spec khai đủ ba thứ mới — hai endpoint + hai trường của `/api/index`, mỗi
      cái trỏ đúng cổng đang canh nó
    cmd: grep -c "articles/media" 06_modules/M08_api/spec.md
  - AC2: file frozen đổi thì lock phải ký lại, và ký SAU khi FR có
    cmd: python core/tests/check_frozen.py
phụ_thuộc: T03-19
