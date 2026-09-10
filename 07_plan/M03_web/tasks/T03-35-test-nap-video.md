# T03-35 — C6b: cổng cho đường nạp video (đơn vị TEST)

> `web/test/nap-video.test.js` (MỚI). ĐỎ trước (R5).
>
> Vế nặng: **FE phải gọi `/api/video`, không gọi `/api/articles`**. Gọi đường cũ
> vẫn TẠO ĐƯỢC bản video (bí danh còn sống), nên mọi phép kiểm "tạo được video"
> đều xanh — và cổng riêng của module video (whitelist host phía server) **không
> chạy**. Đó là cách một tính năng trông đúng mà bỏ qua cổng của chính nó.
>
> Và **FE KHÔNG được tự tính `url_normalized`**: một phép chuẩn hoá thứ hai bằng
> JS là đúng lớp lỗi `dongBoThe`. Đo bằng cách đòi bundle KHÔNG dựng chuỗi
> `youtube.com/watch?v=` từ id.
>
> Cộng: màn không chứa form viết bài / ô hiện vật (chiều âm của "tách biệt") ·
> host ngoài whitelist bị chặn tại chỗ dán · vòng end-to-end thật qua HTTP:
> dán URL hợp lệ ⇒ bản ghi vào kho với `source_type: video`.

phạm_vi_ghi:
  - web/test/nap-video.test.js
  - web/test/no-write-path.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (màn và đường chưa có)
    cmd: cd web && node test/nap-video.test.js; test $? -ne 0
  - AC2: sau T03-34 XANH, có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T01-30
