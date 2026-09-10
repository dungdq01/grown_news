# M07_curate — data flow

## Vào — tất cả chỉ đọc

| Nguồn | Đọc trường gì |
|---|---|
| `kb/**/*.md` | `review_status` · `decay_risk` · `analyzed_at` · `concepts_proposed` |
| `kb/concepts.yaml` | danh mục hiện có, để so với `concepts_proposed` |
| `07_curate/thresholds.yaml` | ba ngưỡng |

M07 đọc **cả draft và rejected** — khác M03 và M06. Nó phải thấy draft đọng mới
nhắc được.

## Ra

| Đích | Nhịp | Nội dung |
|---|---|---|
| `07_curate/reports/<năm>-W<tuần>.md` | tuần | bài chết mới · draft đọng |
| `07_curate/reports/<năm>-<tháng>.md` | tháng | đề xuất gộp · xu hướng |

**Không ghi vào `kb/`.** `boundaries.curate_writes: []`.

## Tuổi tính từ đâu

`analyzed_at` trong frontmatter, **không** phải mtime của file.

mtime đổi mỗi lần `git checkout`, `git clone`, hay copy thư mục — dùng nó thì sau
một lần clone mọi bài đều "mới", và báo cáo im lặng đúng lúc cần nhất.

## Dữ liệu M07 sinh mà không ai khác đọc

Báo cáo là **cho người**, không phải đầu vào của module nào. Không module nào
parse nó.

Đây là chủ ý: báo cáo có thể đổi format tự do mà không gãy gì.
