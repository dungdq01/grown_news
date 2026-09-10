# M03_web — data flow

## Vào — tất cả chỉ đọc

| Nguồn | Dùng để |
|---|---|
| `kb/**/*.md` | nội dung + frontmatter |
| `kb/concepts.yaml` | màn tra cứu, bộ lọc |
| `05_uiux/tokens.css` | **import**, không copy giá trị |
| `public/light/`, `public/dark/` | ảnh nền tự chuyển 5–7s |

## Ra

| Đích | Dạng |
|---|---|
| site tĩnh | HTML/CSS/JS, deploy **private** |

**Bundle tĩnh không ghi ngược.** Ghi từ trình duyệt đi qua API local M08
(FR-011): FE fetch whitelist literal đóng (`/api/inbox` · `/api/articles` ·
`/api/recycle`), M08 validate rồi mới chạm `kb/`. Không có API ⇒ không control
ghi nào tồn tại — `no-write-path.test.js` canh cả hai vế.

## Phép lọc — ba tầng, ba con số

```
10 bản ghi trong kb/
 └─ lọc approved ──────────> 6
     └─ bỏ *.v<n>.md ──────> 6
         └─ gộp url_normalized > 5 bài trên site
                                  (1 bài = 2 tab: src_var001 + src_var002)

9 dòng ở màn Tất cả = 10 bản ghi − 1 nhóm gộp
   (màn này hiện CẢ draft và rejected — nó là màn quản lý, không phải site công bố)
```

Ba số neo vào `_expected_render` của `analyses.sample.v2.json` — **tính bằng máy**.

## Trường frontmatter M03 đọc

| Trường | Dùng ở |
|---|---|
| `review_status` | filter `approvedOnly` |
| `url_normalized` | emitter `mergeBySource` |
| `skill_candidates[].priority` | `sortByPriority`, chọn bài nổi bật |
| `credibility_max` | dải cảnh báo |
| `origin` | badge `external` |
| `concepts[]` | màn tra cứu |
| `source_type` | đếm theo loại |

M03 **không đọc** `insight_new`, `skill_installed`, `review_minutes` — ba trường
đó là của M1, đo bằng tay, không hiển thị.
