# M01_core — data flow

## Vào

| Nguồn | Dạng | Ai đưa |
|---|---|---|
| link / file nguồn | url hoặc đường dẫn | người dùng |
| `frontmatter.schema.json` | JSON Schema | M02 sở hữu, M01 **chỉ đọc** |
| `kb/concepts.yaml` | YAML danh mục | M02 sở hữu, M01 **chỉ đọc** |

## Ra

| Đích | Dạng | Trạng thái |
|---|---|---|
| `kb/<source_type>/<slug>.md` | markdown + frontmatter | luôn `draft` |
| stdout / exit code | danh sách lỗi, `--json` cho CI | 0 = sạch |

## Dữ liệu dẫn xuất — sinh chứ không khai

| Trường | Sinh từ | Lệnh |
|---|---|---|
| `word_count` | đếm thân bài, bỏ code/tiêu đề/locator | `validate.py --fix` |
| `corroboration_factor` | suy từ `independent_sources` | pass 6 |

Người gõ tay `word_count` thì cổng 3 chặn: *"khai 260 nhưng đếm được 202"*.

## Không chạm

`M01` **không đọc** `web/**`, không biết `M03` tồn tại. Hợp đồng là format `.md`.
