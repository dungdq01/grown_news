# M04_ci — data flow

## Vào

| Nguồn | Dạng |
|---|---|
| PR / push chạm `core/**`, `kb/**`, `web/**` | git ref |
| `core/tests/**` | test do M01 sở hữu |
| `kb/**` | dữ liệu do M02 sở hữu |

## Ra

| Đích | Dạng |
|---|---|
| GitHub check | xanh / đỏ |
| Log | output nguyên văn của từng lệnh |

**Không artifact nào khác.** Không báo cáo, không dashboard, không file sinh ra.

## Không chạm

M04 **không ghi** vào `core/` hay `kb/` — kể cả `--fix`. Luật gốc: không ai sở hữu
thứ dùng để đánh giá mình (M04-R2).

## Dữ liệu M04 tiêu thụ mà không sở hữu

| Thứ | Chủ | M04 làm gì |
|---|---|---|
| 19 test | M01_core | chạy |
| 8 cổng validate | M01_core | chạy |
| `frontmatter.schema.json` | M02_kb | chạy gián tiếp qua validate |
| lệnh của AC `hard` mọi module | module đó | chạy |

Danh sách lệnh CI chạy = hợp của mọi AC `hard`. Module thêm AC `hard` ⇒ **FR tới
M04** để thêm bước, không tự sửa workflow.
