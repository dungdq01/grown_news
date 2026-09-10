# T08-12 — FR-038/C4: lọc theo nhóm + builder hình dạng thứ tư (đơn vị CODE)

> Ba màn loại (Bài viết · Tài liệu · Video) cần danh sách CỦA RIÊNG loại đó.
> `GET /api/index` hiện **không nhận tham số nào** (`router.mjs:39-42`) và trả cả
> kho kèm cả thân bài ⇒ mở màn Video vẫn tải toàn bộ kho.
>
> **Lọc bằng `source_type IN (…)`, KHÔNG bằng cột `bang`** — đây là phép ĐO, không
> phải sở thích. `EXPLAIN QUERY PLAN` trên chính DDL hiện tại:
>
> ```
> WHERE bang = 'video'            → SCAN bai_viet · SCAN tai_lieu · SCAN video
> WHERE source_type IN ('video')  → SEARCH … (source_type=?) trên cả ba PK index
> ```
>
> `bang` là **literal** trong từng nhánh UNION nên SQLite không tỉa nhánh theo nó;
> nó quét cả ba rồi lọc. `source_type` là cột thật, đầu PK, nên vị từ đẩy xuống
> được. Cột `bang` vẫn hữu ích cho việc định tuyến lần sửa, chỉ không dùng để lọc.
>
> **Nhóm lạ ⇒ 400, KHÔNG phải 200 rỗng.** Một danh sách rỗng không phân biệt được
> với "kho chưa có gì", nên một lỗi chính tả ở FE thành "màn Video trống mãi mãi"
> mà không ai báo. Cùng lớp lỗi `bangCua()` chọn NÉM thay vì rơi về bảng mặc định.
>
> **`theBai()` là builder hình dạng bản ghi THỨ TƯ** (`articles.mjs:20-32`) và
> không trả `ho_so`/`media`. Ba builder kia — `banTuDb` · `docTuDia` · `chiMucMo` —
> đã mang từ B7a/B8b. Đây là bản còn lại chưa ai canh, đúng lớp lỗi đã trúng ở B8b.
>
> `danhSach` nhận `?nhom=` cùng lúc: nó đã có `?type=` cho MỘT loại, còn nhóm
> `bai-viet` gồm **năm** loại — không thêm ở đây thì FE phải gõ tay danh sách năm
> loại, tức tầng thứ hai gõ tay đúng thứ `loai-nguon.json` sinh ra để dẹp.

phạm_vi_ghi:
  - web/api/dungchung.mjs
  - web/api/articles.mjs
  - web/api/router.mjs

verifiability: hard
tiêu_chí:
  - AC1: `?nhom=` lọc ĐÚNG — `bai-viet` trả cả năm loại bài và KHÔNG trả
      tai-lieu/video; `video` chỉ trả video. Nhóm lạ ⇒ **400** kèm danh sách nhóm
      hợp lệ, không phải 200 rỗng
    cmd: cd web && node test/loc-theo-nhom.test.js
  - AC2: lọc xảy ra ở SQL, đo bằng HÀNH VI — thân phản hồi `?nhom=video` nhỏ hơn
      hẳn phản hồi không lọc khi kho có bài viết
    cmd: cd web && node test/loc-theo-nhom.test.js
  - AC3: `theBai()` mang `ho_so` + `media`; `media.sha256` tới nguyên vẹn, vắng
      `media` là `null` chứ không `undefined`
    cmd: cd web && node test/hai-ban-shape.test.js
  - AC4: danh sách nhóm đọc từ `loai-nguon.json`, không gõ tay ở tầng thứ hai
    cmd: python core/tests/check_khai_mot_noi.py
  - AC5: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T08-11
