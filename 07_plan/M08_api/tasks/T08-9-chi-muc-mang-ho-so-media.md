# T08-9 — FR-036/B8b: `/api/index` mang `ho_so` + `media` (đơn vị CODE)

> **Bug đo được khi cài xem trước (B8b).** Cửa sổ đọc lấy `BAI` từ hai nguồn:
> bản mock `fetch("/mock/static/open-index.json")`, bản THẬT
> `fetch("/api/index")`. Endpoint đó dựng object `ban` bằng **một danh sách trường
> gõ tay thứ ba** (`articles.mjs:chiMucMo`) — ngoài `banTuDb` và `docTuDia` của
> `data.mjs`.
>
> B7a thêm `ho_so`+`media` vào hai builder trong `data.mjs`, và
> `hai-ban-shape.test.js` canh hai bên đó khớp nhau. Nó **không** biết builder thứ
> ba. Hệ quả: xem trước hiện vật chạy trên bản `/mock/` và **im lặng không chạy
> trên kho thật** — đúng lớp lỗi "bản song sinh" mà repo đã trúng bốn lần, lần này
> với ba bản thay vì hai.

phạm_vi_ghi:
  - web/api/articles.mjs

verifiability: hard
tiêu_chí:
  - AC1: `GET /api/index` trả `ho_so` + `media` cho bản ghi thư viện; bản ghi
      thường có `ho_so: "phan-tich"` và `media: null`
    cmd: cd web && node test/media-cua-so.test.js
  - AC2: ba builder `Ban` cùng tập khoá ở phần FR-036 — đo trên server thật
    cmd: cd web && node test/media-cua-so.test.js && node test/hai-ban-shape.test.js
  - AC3: không hồi quy — chỉ mục vẫn đúng hình dạng cũ
    cmd: cd web && node test/api-index-khong-can-build.test.js && npm test
phụ_thuộc: T01-15
