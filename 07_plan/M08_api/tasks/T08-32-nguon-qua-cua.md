# T08-32 — `nguon` đi qua cửa tới FE

> `WO-056` ②. `nguon` là trường nhận diện (`FR-067`), nhưng grep toàn dự án ra
> **0 nơi đọc**. Nó không tới được FE thì nút hai chiều không dựng được.

## Bốn builder, và vì sao phải sửa CẢ BỐN

Chú thích sẵn ở `articles.mjs:55` gọi tên vấn đề: *"BUILDER HÌNH DẠNG THỨ TƯ,
và hai trường này thiếu ở đây"* — `banTuDb` · `docTuDia` · `chiMucMo` · `theBai`
dựng cùng một hình dạng ở bốn chỗ. Thiếu một trường ở MỘT builder thì FE nhận
`undefined` trên đúng đường đọc đó, và không lỗi nào nổ.

Đơn vị này giữ hai builder thuộc `web/api/**`. Hai builder còn lại nằm ở
`web/render/**` (đất M03) ⇒ `T03-116`, làm CÙNG LƯỢT.

## Hình dạng

- `theBai` + `chiMucMo` trả `nguon: <mảng slug>` — vắng ⇒ `[]` (KHÔNG
  `undefined`, KHÔNG `null`): *"một hình dạng ổn định là thứ FE kiểm được bằng
  MỘT phép thử"*, đúng lý lẽ builder này đã dùng cho `ho_so`/`media`.
- **Không lọc, không chuẩn hoá.** Slug đã đúng khuôn từ `FR-067`; sửa lại ở cửa
  là dựng bản thứ hai của một luật đã có chủ.

phạm_vi_ghi:
  - web/api/articles.mjs     # `theBai` + `chiMucMo` mang `nguon`
# Cổng thuộc đơn vị test đi kèm — vế thêm vào `web/test/hai-ban-shape.test.js`
# hoặc cổng mới của `T03-116b`.

phụ_thuộc: T01-47 · FR-067

verifiability: hard
tiêu_chí:
  - AC1: `GET /api/articles/<loai>/<slug>` trả `nguon` là MẢNG, kể cả khi vắng
    cmd: node web/test/nguon-hai-chieu.test.js
    đỏ_khi: trả `undefined` ⇒ FE phải kiểm hai kiểu cho một trường
  - AC2: `GET /api/index` trả `nguon` cho mọi bản ghi
    cmd: node web/test/nguon-hai-chieu.test.js
  - AC3: nền API giữ xanh
    cmd: cd web && npm test
