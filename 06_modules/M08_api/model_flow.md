# M08_api — model flow

## Entity chạm vào

| Entity | Owner (project_map) | M08 làm gì |
|---|---|---|
| `Analysis` | M02_kb | ĐỌC (parse frontmatter → JSON view) · GHI theo hợp đồng: chỉ qua `validate.py --strict`, chỉ các chuyển trạng thái M02 §2.2 cho phép |
| `Concept` | M02_kb | CHỈ ĐỌC — trả danh mục cho form tạo bài; không thêm/sửa (M02-R3) |

M08 **không sở hữu entity nào**. Nó là *writer có điều kiện* của `Analysis` —
được FR-011 ghi vào `boundaries.kb_writers` cùng M01/M05, và điều kiện (validate
trước ghi, không default trường người) nằm ở M08-R2/R3.

## Gọi module nào, qua hợp đồng nào

| Gọi | Hợp đồng | Ghi chú |
|---|---|---|
| M01_core `validate.py` | CLI: `--fix` rồi `--strict --concepts kb/concepts.yaml`, exit code + stdout | spawn tiến trình con — KHÔNG import, KHÔNG viết lại (M05-R3) |
| M05_intake `gate.py` | như FR-010, chỉ cho `/api/inbox` | M08 không đụng — cửa external vẫn của M05 |
| M02_kb | format file `.md` + schema | hợp đồng là format, không phải code (project_map.boundaries.contract) |

## Vòng đời `Analysis` nhìn từ M08

```
POST  ──> draft (origin manual — server áp, client không đổi được)
PATCH ──> draft → approved | draft → rejected | edited → approved   (bảng đóng)
PUT   ──> approved → edited (hệ quả sửa nội dung, không phải lệnh đổi trạng thái)
DELETE──> file rời kb/ sang _recycle/ (trạng thái trong file GIỮ NGUYÊN — recycle
          là chỗ-ở, không phải trạng-thái; restore trả về nguyên trạng)
```

Quyết định ghi lại tường minh: **recycle không phải một `review_status` mới.**
Thêm giá trị enum thì mọi consumer schema phải học nó; move file thì mọi consumer
(build, validate, curate) tự nhiên không thấy bài nữa — đúng hành vi muốn có,
không sửa hợp đồng nào.
