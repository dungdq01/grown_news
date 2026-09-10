# M02_kb — data flow

> Entity chi tiết ở `04_system/diagrams/data-model.md`. File này chỉ nói **dữ liệu
> đi đâu trong module này**, không lặp lại định nghĩa trường.

## Hai entity module sở hữu

| Entity | Lưu ở | Ai ghi | Ai đọc |
|---|---|---|---|
| `Analysis` | `kb/<source_type>/<slug>.md` | M01, M05, người (chỉ `approved`) | M03, M04, M06, M07 |
| `Concept` | `kb/concepts.yaml` | **chỉ người** (deny S1) | M01, M05 (kiểm), M03 (lọc), M07 (đề xuất gộp) |

## Đường vào

```
M01_core ──┐
           ├──> kb/<type>/<slug>.md  (review_status: draft)
M05_intake ─┘                          origin: pipeline | external
```

Cả hai đường **chỉ ghi được `draft`**. Không đường nào ghi `approved`.

## Đường ra — bốn khách, bốn lát cắt khác nhau

| Khách | Lọc gì | Vì sao |
|---|---|---|
| M03_web | `approved` only, rồi gộp `url_normalized` | 10 bản ghi → 5 bài trên site |
| M04_ci | **tất cả** file, kể cả draft/rejected | CI kiểm format, không kiểm nội dung |
| M06_skillgen | `approved` + `skill_candidates[]` có `priority ≥ 25` | nháp skill chỉ sinh từ bản người đã duyệt |
| M07_curate | **tất cả** + `decay_risk` + tuổi file | phải thấy draft đọng mới nhắc được |

**Ba con số ở ba tầng** (từ `contracts/analyses.sample.v2.json`):

| Số | Nghĩa |
|---|---|
| 10 | bản ghi trong `kb/` |
| 9 | dòng ở màn *Tất cả* — gộp 2 bản cùng nguồn |
| 5 | bài trên site — `approved` rồi mới gộp |

Đừng nhầm ba số này là lệch dữ liệu.

## Dữ liệu dẫn xuất — không khai tay

`word_count` sinh bằng `validate.py --fix`. Người gõ tay thì cổng đếm-lại sẽ chặn.

`corroboration_factor` suy từ `independent_sources`, không phải trường độc lập.
