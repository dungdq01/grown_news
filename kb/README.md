# kb — kho dữ liệu + bản export của nó

*(ĐẢO theo FR-034, 2026-08-26 — bản gốc: "file .md là nguồn chân lý, không phải
database".)*

```
mọi đường ghi ──validate──>  kb/_kho.sqlite  ──xuat_kho.py──>  kb/**.md (+2 yaml)
                             (NGUỒN CHÂN LÝ)                    (EXPORT, commit git)
```

## Nguồn chân lý

**`kb/_kho.sqlite`** (gitignore) là nguồn chân lý cho bài viết + danh mục. File
`.md/.yaml` trong thư mục này là **export dẫn xuất một chiều DB→file** — commit
vào git làm backup và để đọc diff bằng mắt.

- Đường ghi: API (`npm run api`) hoặc gate `_inbox/` — mọi ghi qua
  `validate.py --strict` trước khi COMMIT, rồi tự export ra file.
- Đường file→DB **duy nhất**: `python core/tools/dung_lai_db.py` (dựng lại sau
  clone / khôi phục F4). Sửa file .md bằng tay rồi mong nó "vào kho" là hiểu
  sai chiều mũi tên — bản sửa sẽ bị export đè ở lần ghi kế tiếp.
- Răng: `python core/tests/check_export_dan_xuat.py` (round-trip 2 chiều).

## Quy ước tên

```
kb/<source_type>/<slug>.md      bản hiện hành
kb/<source_type>/<slug>.v1.md   bản cũ giữ lại khi re-analyze
```

`slug` ổn định qua mọi lần re-analyze. Nhờ vậy `git diff` giữa hai bản đọc được bằng mắt, và diff đó tự nó là một loại nội dung: nguồn này đã đổi gì.

## Sáu loại

`repo` · `paper` · `video` · `article` · `docs` · `announcement`

## Ba chiều phân loại — đừng nhầm chúng với nhau

Một bản phân tích được xếp theo **ba** chiều độc lập. Mỗi chiều trả lời một câu
hỏi khác nhau, và không chiều nào thay được chiều nào.

| Trường | Câu hỏi nó trả lời | Giá trị | Ai đặt |
|---|---|---|---|
| `source_type` | *nguồn này ở **dạng** gì?* | 6, enum trong schema | máy, ở Pass 0 (nhận dạng URL) |
| `category` | *bài này thuộc **mảng** nào?* | bảng `categories` trong DB (FR-034) | người khai qua API |
| `concepts` | *bài này dạy **kỹ thuật** gì?* | bảng `concepts` trong DB | máy **chọn**, không tạo |

Ví dụ một bài:

```yaml
source_type: paper          # là bài báo khoa học
category: [data-ml]         # thuộc mảng dữ liệu và ML
concepts: [walk-forward-validation, data-leakage]   # dạy hai kỹ thuật này
```

**`category` vs `concepts`** — chỗ dễ nhầm nhất. `category` là *chủ đề* của bài,
thô, dùng để chia kho thành mảng lớn. `concepts` là *khái niệm trong ngành*, mịn,
dùng để tính hệ số kiểm chứng chéo: hai bài khác nguồn cùng nói về `idempotency`
thì khẳng định đó đáng tin hơn. Hai bài cùng `category: [backend]` không nói lên
điều gì về độ tin cậy.

Danh mục `category` từng đóng trong enum schema (FR-009, 6 giá trị); FR-031 xoá
sạch để nhập lại, FR-034 chuyển hẳn vào **bảng `categories`** — thêm/sửa/xoá qua
API (`POST/PATCH/DELETE /api/categories`), người khai `label_vi` + `gom`.
`categories.yaml` trong thư mục này là export.

`category` **không bắt buộc**: một bài `announcement` có thể không thuộc mảng nào.

## Danh mục khái niệm (bảng `concepts`, export ra concepts.yaml)

Trường `concepts` trong frontmatter **chỉ** được lấy từ danh mục — không tìm được mục phù hợp thì ghi vào `concepts_proposed` và chờ duyệt.

Không có luật này, sau 50 nguồn sẽ có bốn node riêng cho cùng một khái niệm và hệ số kiểm chứng chéo trở nên vô nghĩa vì không gì gặp được nhau.

Duyệt lô theo tuần: hoặc thêm vào danh mục, hoặc map thành alias của mục đã có.

## Trạng thái duyệt

| `review_status` | Nghĩa | Lên web |
|---|---|---|
| `draft` | Máy vừa sinh, chưa ai đọc | Không |
| `edited` | Người đã sửa, chưa duyệt xong | Không |
| `approved` | Đã duyệt | **Có** |
| `rejected` | Loại — bắt buộc ghi `reject_reason` | Không |

Chỉ người mới được đổi trường này. Đây là cổng người duy nhất trong toàn hệ thống.
