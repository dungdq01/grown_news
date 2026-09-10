# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Factory — thẻ luật cho agent

Copy thành **`<dự-án>/CLAUDE.md`** hoặc **`<dự-án>/.claude/CLAUDE.md`** — hai chỗ đều nạp
mọi phiên, cùng độ ưu tiên. **Chỉ hai chỗ đó.** Đặt vào `.agent/`, `AGENTS.md` hay đường
nào khác thì Claude Code **không đọc** và không báo gì (`#khung-tự-dính`).
Đã có `AGENTS.md` cho agent khác ⇒ tạo `CLAUDE.md` chứa một dòng `@AGENTS.md`.

**Kiểm đã nạp:** gõ `/context`, file phải có trong mục *Memory files*. Không thấy ⇒ chưa nạp.

Nạp mọi phiên nên chỉ chứa luật, không chứa lý do — giữ **dưới 200 dòng**, dài hơn thì
tụt độ tuân thủ. Lý do ở `cases.md`; cách làm ở skill. Mã `#…` là mục trong `cases.md`.

## Luật gốc

**Không ai được sở hữu thứ dùng để đánh giá mình.**
Không thuộc bên bị đánh giá: biên ghi · thước đo · trạng thái · hợp đồng tầng trên.
Tình huống lạ ⇒ hỏi *"ai đang chấm, họ có cầm bút ghi vào thứ họ chấm không?"*
R1–R6 do SessionStart hook bơm. Không thấy ⇒ DỪNG, báo người (`#khung-tự-dính`).

## Nhận việc — ba câu hỏi phân đường

```
1. Chạm ≥2 module, hoặc đổi `owner` của entity?   CÓ ⇒ BUILD (s6→s7→s8)
2. Chạm file FROZEN?                              CÓ ⇒ mở FR TRƯỚC mọi thứ
3. Còn lại                                        ⇒ PATCH (wo → task file → …)
```

Tra bằng `project_map.yaml` — `entities.*.used_by` · `modules.*.depends_on`. **Đọc file
thì mở thẳng file**; chỉ gọi `/factory:project-map` khi cần *ngữ pháp* (thêm entity, bump).

**Không biết gọi gì, hoặc gọi theo thứ tự nào ⇒ `/factory:go`** — cửa vào duy nhất:
PATCH 10 bước · BUILD · ngưỡng khi nào KHÔNG chạy đủ · bỏ bước nào mất gì.

## Trình tự — mọi việc chạm code, không nhảy cóc

**PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE**
① đọc spec + code thật, nêu giả định thành chữ
② các bước + tiêu chí verify từng bước + `phạm_vi_ghi`; người duyệt
③ chạy thật trên vật thay thế — test tái hiện **ĐỎ trước**, fixture ở thư mục tạm
④ commit tiêu chí **trước** commit code
Bị giục ⇒ mỗi nhịp ngắn lại, không bỏ nhịp.

## DỪNG

- spec / hợp đồng mơ hồ — đoán một lần là mọi thứ sau kiểm trên nền sai
- cần ghi ngoài `phạm_vi_ghi` ⇒ FR về s7/s4, **không nới tại chỗ** kể cả một file
- đỏ lần thứ N (`hard`=3 · `soft`=1) ⇒ leo thang; **vắng `.factory/rule-fire/` ⇒ DỪNG luôn**, không phải "còn lượt"
- máy đỏ mà **chưa quy được chủ** ⇒ `git status` + `find -newermt` trước khi phán (`#đỏ-của-người-khác`)
- artifact đã chốt hoá ra sai ⇒ mở ô `backlog` **ngay**; frozen thì chỉ sửa qua FR
- việc vừa làm khiến artifact khác lỗi thời ⇒ ô `kéo theo`
- AC không viết nổi testcase ⇒ AC mơ hồ, FR về s6
- không chắc mình được phép ghi vào đâu

## CẤM

- **tự nhận xong** — không máy xanh thì chưa xong (R2, R6)
- **sửa artifact FROZEN**; deny chặn `Write`+`Edit`, `Bash` thì không — không đi vòng (`#deny-một-cửa`)
- **đếm tay rồi chép số** — số phải do máy tổng hợp từ nguồn (`#tự-khai`)
- **sửa file thật để thử một cổng** — dựng fixture ở thư mục tạm; thao tác *hoàn tác* là chỗ mất dữ liệu
- **chép nội dung artifact sang chỗ khác** — trỏ con trỏ, đừng chép
- **khai `bề_mặt: S3` thiếu `lệnh` + `đỏ_khi` + `xanh_khi`** (`#cổng-không-đỏ-được` · `#cổng-đỏ-oan`)
- **viết code trước tiêu chí**; bug fix: test tái hiện đỏ trước (R3, R5)
- **nhảy thẳng vào code** — bốn nhịp là bắt buộc
- **làm xong rồi mới ghi sổ** — ghi ngay lúc phát hiện

## PHẢI GHI

| Ghi          | Khi                                                                     | Ở đâu                                                                     |
| ------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| worklog      | bàn giao · ký gate · đấu socket · FR mở/đóng · đóng module | `.factory/worklog/WL-<ulid>.yaml`, mỗi entry một file                    |
| `đỏ_do:` | mỗi lần báo kết quả ĐỎ                                           | dòng trong entry worklog — tên tác nhân hoặc`chưa quy được chủ` |
| FR           | artifact tầng trên sai; đổi thứ FROZEN                             | `.factory/fr/` + worklog                                                   |
| backlog      | việc vừa làm khiến cái khác lỗi thời                            | `<đơn-vị>/backlog.md`, ô `[ ]` — **chết ở gate**            |
| decisions    | hướng còn giá trị sau ba tháng                                    | `memory/decisions.md`, bốn ô                                             |

- mỗi entry phải có **`object`** (path · SHA · PR#); không có ⇒ lời khai, reviewer FAIL
- **FR là quyền, backlog là trí nhớ** — ô trỏ FROZEN chỉ tick bằng FR id
- **không ghi worklog cho từng task** — git đã là trace của task-level
- xem worklog theo module: `grep -l "Mxx" .factory/worklog/*.yaml`

## Bằng chứng

TÍNH: output máy — log CI · output lệnh · git diff · SHA · PR# · hệ thống **chạy thật**
KHÔNG: "đã kiểm rồi" · số chép tay · unit test pass · demo · agent tự khai (`#chạy-thật`)

## Tám lệnh kiểm — đặc tả, dự án tự cài

| Lệnh | Bắt |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `<freeze-check>` | file frozen đổi mà không có FR |
| `<rule-surface-check>` | rule S3/S4 không chạy được · không đỏ được · đỏ oan |
| `<scope-check>` | hai task tranh cùng một file |
| `<map-check>` | `project_map` lệch thư mục thật, hai chiều |
| `<docs-sync> --kiểm` | khối`factory:sinh` trong README lệch map |
| `<pin-check>` | `pinned` lệch version plugin đang cài |
| `<worklog-check>` | worklog không parse được hoặc thiếu`object` |
| `<backlog-check>` | ô`[ ]` còn · `[x]` thiếu object · backlog.md từng bị xoá. Dạng tối thiểu ở gate: `grep '^\s*- \[ \]' <đơn-vị>/backlog.md` |

Chưa cài ⇒ vế gate đó **không tồn tại và không ai báo**.

## Skill

`/factory:map` bước nào·gate·PATCH · `/factory:factory-rules` R1–R6·hard|soft·S1–S4
`/factory:factory` vòng lặp·hook · `/factory:trace` ghi gì vào đâu · `/factory:wo` bug/cải tiến
`/factory:project-map` map·luật hai-bản · `/factory:module-pack` pack·FROZEN.lock
`/factory:socket-check` đấu skill·fixture·pin · `/factory:s1-research` … `s10-retro`
Tám trạm `m-*` không tự gọi được — chỉ s7/s8 điều phối.

## Kết thúc một đơn vị việc

① nhánh riêng · commit tiêu chí trước code → ② làm trong phạm vi đã khai → ③ PR
→ ④ CI chạy lệnh tiêu chí → ⑤ **quy chủ** rồi gọi `factory-reviewer` → ⑥ **vai khác** merge
Song song ⇒ mỗi đơn vị **một worktree**, nhánh riêng không đủ.
**Gate do NGƯỜI ký.** Agent chuẩn bị evidence, không ký, không tự đóng.
