# M05_intake — data flow

## Vào

| Nguồn | Dạng |
|---|---|
| `_inbox/*.md` | markdown, có thể **không** có frontmatter |
| `core/assets/frontmatter.schema.json` | chỉ đọc — M02 sở hữu |
| `kb/concepts.yaml` | chỉ đọc — kiểm `concepts[]` |

## Ra — hai đường

| Đường | Đích | Điều kiện |
|---|---|---|
| Vào kho | `kb/<type>/<slug>.md` | qua cả 3 cổng |
| Trả lại | `_inbox/<tên>.rejected.md` + danh sách lỗi | trượt bất kỳ cổng nào |

Trả lại **giữ nguyên file gốc** — người sửa rồi thả lại, không phải viết từ đầu.

## Trường M05 đặt, và trường M05 KHÔNG đặt

| Đặt | Vì |
|---|---|
| `origin: external` | bản không đi qua 6 pass |
| `review_status: draft` | schema cưỡng chế |
| `ingested_at` | thời điểm nạp — dữ kiện, không phải phán đoán |
| `word_count` | **phép tính** (dùng `count_words` của M01) |

| **Không** đặt | Vì |
|---|---|
| `id`, `slug` | quyết định — trùng slug là hỏng đường dẫn web |
| `credibility_max`, `verdict` | phán đoán |
| `concepts[]` | phải người đối chiếu danh mục |
| `citations_verified` | **người** mở link mới biết |

Ranh giới: **phép tính thì M05 làm, phán đoán thì trả lại.**

## Không chạm

Không đọc `web/**`. Không sửa `concepts.yaml`. Không đọc file ngoài `_inbox/`.
