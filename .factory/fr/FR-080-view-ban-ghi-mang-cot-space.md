# FR-080 — `view ban_ghi` mang cột `space` (mở đường migration Space)

- **mở**: 2026-09-09 · **người mở**: PM-Space · **trạng thái**: **ĐÃ DUYỆT** 2026-09-09 (chủ dự án). ÁP: sửa `kho.schema.sql` rồi **NGƯỜI ký `check_frozen --ky`** — agent không ký
- **artifact chạm**: `core/assets/kho.schema.sql` (**FROZEN**) — định nghĩa
  `CREATE VIEW ban_ghi` (:129) và ba bảng `bai_viet`/`tai_lieu`/`video`

## Vì sao

Đo trên BẢN SAO kho (spike R6, 2026-09-09): `ALTER TABLE` thêm cột `space`
vào ba bảng chạy **8 ms**, `view tham_chieu_media` và `view nhan` **không
gãy** — nhưng **`view ban_ghi` thiếu cột `space`** vì nó liệt cột tường minh.
Mọi bên đọc "một bản ghi là gì" đều đi qua view này (M08 · M13 · web), nên
nếu view không mang `space` thì cột mới **tồn tại mà không ai thấy** — đúng
lớp lỗi *"khai một chỗ, đọc chỗ khác"*.

## Chốt đề nghị

1. Ba bảng nội dung: `space TEXT NOT NULL DEFAULT 'mac-dinh'` + index.
2. `CREATE VIEW ban_ghi` liệt thêm `space` (giữ nguyên mọi cột hiện có —
   không đổi thứ tự, không bỏ cột: 13 consumer đang đọc theo tên).
3. `article_versions` · `recycle` thừa kế qua `(source_type, slug)` — **không**
   thêm cột (bản cũ/bị bỏ thuộc space của bản ghi gốc; suy được, không lưu hai chỗ).
4. PK **giữ nguyên** `(source_type, slug)` — lối A: slug duy nhất toàn hệ.

## Mở khoá

Migration Space (script ~20 dòng) · cổng R4 chống rò · mọi query `WHERE space`.

## Không làm

Không đổi PK · không đổi cây file `kb/<loai>/` (spike R2) · không mở
`space_member` (spike R5 — đợt 2).
