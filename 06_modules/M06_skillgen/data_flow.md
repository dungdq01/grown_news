# M06_skillgen — data flow

## Vào

| Nguồn | Lọc | Dùng để |
|---|---|---|
| `kb/**/*.md` | **chỉ `approved`** | đọc `skill_candidates[]` |
| `skill-manifest.json` | — | 5 skill / 23 capability + aliases + `$matching.order` |

## Ra

| Đích | Dạng | Ở đâu |
|---|---|---|
| `~/.claude/skills/<name>/SKILL.md` | nháp 4 phần, thân rỗng | **ngoài repo** |

Ghi ngoài repo là chủ ý: skill sống ở nơi agent đọc, không phải nơi dự án lưu.
Backup theo `git remote riêng của agent` (F4).

## Trường M06 đọc từ `Analysis`

| Trường | Dùng |
|---|---|
| `review_status` | lọc `approved` |
| `skill_candidates[].capability` | khớp manifest (tên + alias) |
| `.credibility` | **cổng cứng** |
| `.verdict` | đối chiếu kết quả chấm lại |
| `.priority` | ngưỡng ≥25 |
| `.draft_trigger` | thành `description` của nháp |
| `.why_now` | vào mục "Khi nào dùng" |
| `independent_sources` | **cổng cứng** |

## Không chạm

`kb/**` — chỉ đọc. `concepts.yaml` — không đọc, không liên quan.

## Vòng khép lại bằng tay

```
M06 sinh nháp → người viết thân → người cài → người thấy output agent đổi
                                            → người điền skill_installed: true
```

Không tự động hoá bước nào trong bốn bước đó. `skill_installed` đo **cả ba** điều
kiện (sinh + cài + output đổi tốt hơn), và chỉ người biết vế thứ ba.
