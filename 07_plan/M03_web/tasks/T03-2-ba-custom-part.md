# T03-2 — ba luật tòa soạn: filter, emitter, sort

phạm_vi_ghi:
  - web/quartz/plugins/**
  - web/quartz.config.ts
verifiability: hard
tiêu_chí:
  - AC1: chỉ approved lên site
    cmd: node web/test/only-approved.test.js
  - AC2: 13 bản ghi ra đúng 8 bài, gộp src_var001+src_var002
    cmd: node web/test/expected-render.test.js
  - AC3: bài nổi bật là src_wfv001 (priority 65), không phải bài mới nhất
    cmd: node web/test/expected-render.test.js
  - AC4: file *.v<n>.md không lên site
    cmd: node web/test/no-archived.test.js

phụ_thuộc: T03-1

## Việc

| Part | Kiểu | Chữ ký |
|---|---|---|
| `approvedOnly` | filter | `shouldPublish(ctx, content) => boolean` |
| `mergeBySource` | emitter | `emit(ctx, content[], resources) => Promise<FilePath[]>` |
| `sortByPriority` | config | so sánh trong `defaultListPageLayout` |

## Thứ tự bắt buộc trong code

**Lọc `approved` TRƯỚC, gộp SAU.** Ngược lại thì một bản `draft` kéo bản
`approved` cùng nguồn lên site.

AC2 bắt được lỗi này: sample có `src_var001` (approved) và `src_var002` — nếu gộp
trước thì số bài ra sai.

## Nguồn số để đối chiếu

`05_uiux/contracts/analyses.sample.v3.json` khối `_expected_render` — **tính bằng
máy, không gõ tay**. Test đọc thẳng từ đó, không hardcode số 8.

## Rule áp vào

`M03-R1` (S3, AC1) · `M03-R5` (S3, AC3).
