# WO-056 — bản chưng cất: nhãn kế thừa + hai chiều với bài gốc

loại: tính năng (chủ dự án chốt 2026-09-06)
mức: hard
chạm: M01_core · M12_chungcat · M08_api · M03_web ⇒ **BUILD**, tách theo module chủ

## Chủ dự án hỏi hai điều, đo được cả hai đều CHƯA đúng

> *"1. Bài chưng cất → coi như bài viết và hiển thị ở cả danh sách bài viết
> (nhãn concept và category gán đúng như bài viết gốc).
> 2. Cần có button 2 chiều…"*

### ① Nhãn không kế thừa — hỏng IM LẶNG

`worker._dung_nhap` ghi `source_type: article` (đúng — bài chưng cất VÀO danh
sách bài viết) nhưng **không ghi `category` lẫn `concepts`**.

Vì sao không cổng nào báo: `frontmatter.schema.json` `required` có 11 trường và
**không có hai trường ấy**. Nên bản nháp qua `validate.py --strict` sạch, cổng
`check_nhap_duyet_duoc` xanh, mà bài lên site **nhãn rỗng**. Đo trên
`kb/tai-lieu/linux-foundation.md`: `category:` trống, `concepts:` trống.

> Lỗi của tôi ở `T12-20`: task file liệt kê `category`·`concepts` phải điền,
> lúc thi công lại đo bằng `--strict` — mà `--strict` không đòi. **Để THƯỚC
> quyết định phạm vi thay vì để YÊU CẦU quyết định.**

### ② Hai chiều: chưa có chiều nào

| chiều | trạng thái đo được |
|---|---|
| chưng cất → gốc | frontmatter CÓ `nguon: [<slug>]`, nhưng grep `web/api/` + `web/render/` + `web/plugins/`: **0 nơi đọc**. Trường ghi-rồi-bỏ. |
| gốc → chưng cất | **không có gì** — không trường, không nút, không đường |

Thêm: `nguon` **không khai trong schema**, lọt qua vì schema cho phép trường
lạ. Nên nó không phải hợp đồng — mai ai ghi sai hoặc thôi ghi cũng không ai báo.

## Chốt: lối (b) — chỉ mục ngược từ `nguon`

Chủ dự án chọn (b), không phải (a) suy-từ-slug.

Lý do đứng vững sau này: **một bài gốc chưng cất được NHIỀU lần** (khác model,
khác lượt). Quy ước slug `phan-tich-<gốc>` chỉ chứa được đúng một bản — chọn
(a) là tự khoá vào một-gốc-một-bản ngay từ đầu, và đổi tên bài là đứt liên kết
mà không ai báo.

`nguon` thành **trường nhận diện thật**: khai trong schema, bắt buộc với
`ho_so: phan-tich`, đi qua CẢ BỐN builder tới FE.

## Bốn đơn vị, mỗi module một chủ

| đơn vị | module | việc |
|---|---|---|
| `T01-47` | M01_core | `nguon` vào `frontmatter.schema.json`; bắt buộc khi `ho_so: phan-tich` |
| `T12-24` | M12_chungcat | `_dung_nhap` chép `category`+`concepts` từ gốc; `nguon` chắc chắn có |
| `T08-32` | M08_api | `nguon` qua `theBai` + `chiMucMo` (`web/api/**`) |
| `T03-116` | M03_web | `nguon` qua `banTuDb`+`docTuDia`; hai nút mở **cửa sổ multiwindow** |

Thứ tự: `T01-47` → `T12-24` ∥ `T08-32` → `T03-116`.

## Nút — chủ dự án chốt hành vi

> *"nút click đó thì mở luôn cửa sổ multi window để xem bài chưng cất tương ứng"*

Không điều hướng trang. Bấm ⇒ **mở cửa sổ mới cạnh cửa sổ đang đọc**, đúng khuôn
`T03-112` đã dựng cho chưng cất.

Ca phải xử, không được lờ:

- gốc có **nhiều** bản chưng cất ⇒ nút nói số lượng, bấm mở bản mới nhất; các
  bản còn lại liệt kê trong cửa sổ đó
- gốc **chưa có** bản nào ⇒ nút KHÔNG hiện (nút chết là nút dạy người bỏ qua nút)
- bản chưng cất mà `nguon` trỏ tới bài **đã bị xoá** ⇒ nút hiện, bấm báo rõ
  *"bài gốc không còn trong kho"*, không mở cửa sổ trống
