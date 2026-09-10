# M01_core — model flow

> "Model" = mô hình dữ liệu. Dự án không có ML.

## Entity vào / ra

| Chiều | Entity | Chủ sở hữu | Quyền của M01 |
|---|---|---|---|
| Ra | `Analysis` | M02_kb | **ghi** — nhưng chỉ `draft` |
| Vào | `Concept` | M02_kb | chỉ đọc (kiểm `concepts[]`) |

M01 **không sở hữu entity nào**. Nó ghi vào entity của M02 — đây là lý do
`boundaries.kb_writers` liệt kê nó.

## Gọi module khác qua contract nào

| Gọi | Qua | Không qua |
|---|---|---|
| M02_kb | đọc/ghi **file trên đĩa** | không API, không import |
| M04_ci | CI *gọi ngược* `validate.py` | M01 không biết CI tồn tại |
| M03/M06/M07 | **không gọi** | — |

## Cần trường mới trên `Analysis` thì làm gì

**FR tới M02_kb.** Không tự thêm — `frontmatter.schema.json` có deny rule S1.

Ví dụ làm đúng: FR-001 thêm `insight_new` · `skill_installed` · `review_minutes`,
kèm ràng buộc `allOf` và 5 test.
