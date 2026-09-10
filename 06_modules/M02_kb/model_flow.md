# M02_kb — model flow

> "Model" ở đây là **mô hình dữ liệu**, không phải mô hình ML. Dự án không có ML.

## Entity vào / ra

| | Entity | Chiều |
|---|---|---|
| Vào | `Analysis` (draft) | từ M01_core, M05_intake |
| Vào | `Analysis` (approved) | từ **người**, qua editor |
| Ra | `Analysis` | tới M03, M04, M06, M07 — chỉ đọc |
| Ra | `Concept` | tới M01, M05 (kiểm), M03 (lọc), M07 (đề xuất) |

## Gọi module khác qua contract nào

**Không gọi ai.** M02 là dữ liệu tĩnh trên đĩa; không có tiến trình, không có API,
không có hàm nào để gọi.

Sáu module kia đọc file trực tiếp. Hợp đồng là **format của file `.md`**, không
phải một interface code — đó là điểm khiến core và web phát triển song song được
mà không dính nhau.

## Ràng buộc sống ở đâu

| Ràng buộc | File | Bề mặt |
|---|---|---|
| Kiểu và trường bắt buộc | `core/assets/frontmatter.schema.json` | S3 (CI chạy validate) |
| Danh mục khái niệm | `kb/concepts.yaml` | S3 |
| Cấu trúc thân bài (khung khai) | `core/assets/khung-than-bai.json` + `validate.py` | S3 |
| Không sửa hai file trên tại chỗ | deny rule `.claude/settings.json` | S1 |

Schema **là** nơi ràng buộc sống. Module khác cần trường mới ⇒ **FR tới M02**,
không tự thêm.
