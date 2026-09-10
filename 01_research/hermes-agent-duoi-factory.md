# Research — Hermes Agent cắm vào Factory được không, ai control ai

> Yêu cầu gốc (nguyên văn): *"thửu nghiên cứu xem sepo hermess agent có thể cài
> trong factory này ko , để dễ control -> factory sẽ control hermess"*
>
> **Giả định đọc hiểu** (chưa được xác nhận): "sepo hermess" = *repo Hermes Agent*
> — bài `hermes-agent` đã có trong kho tri thức của chính dự án này
> (`web/site/repo/hermes-agent.html`, tiêu đề: *"vòng 'tự học' là agent fork chạy
> nền, phần đáng học nhất là nén ngữ cảnh"*). Sai giả định ⇒ dừng, cả file này bỏ.
>
> Đây **không phải G1**: `project_map.yaml` khai `adopted.skipped_gates: [G1,G2,G3]`.
> Nên đây là ghi chú khảo sát theo giao thức s1, không phải artifact ký gate.

## 1. Đối tượng khảo — fact

| Mục | Nội dung | Nguồn |
|---|---|---|
| Là gì | Hermes Agent — AI agent tự host của Nous Research, có vòng tự-cải-thiện: tự sinh/tinh chỉnh **skill**, bộ nhớ 3 tầng, kanban đa agent | github.com/NousResearch/hermes-agent (đọc 2026-08-30) |
| Giấy phép | MIT — dùng thương mại/riêng tư thoải mái | như trên |
| Nền tảng | Linux · macOS · WSL2 · Termux · **Windows native (PowerShell)** | như trên |
| Phụ thuộc | Python 3.11 · Node.js · ripgrep · ffmpeg · Git (bundle MinGit trên Windows) | như trên |
| Cài | `curl -fsSL https://hermes-agent.nousresearch.com/install.sh \| bash` · Windows: `iex (irm .../install.ps1)`, không cần quyền admin | như trên |
| Skill | chuẩn mở **agentskills.io**, nằm ở `~/.hermes/skills/`; `hermes skills install/list/inspect` | docs/reference/cli-commands |
| MCP | có, 40+ tool sẵn + MCP server | README |

## 2. Bề mặt để Factory cầm dây — fact (đây là phần quyết định)

`hermes -z` là **một-phát-rồi-thoát, stdout sạch**:

```
hermes -z "prompt"        # "Single prompt in, final response text out,
                          #  nothing else on stdout or stderr"
  -m/--model · --provider · --usage-file <path>   # usage-file = JSON token/cost
```

`hermes chat` cho đường dài hơn, các cờ đáng giá với Factory:

```
--oneshot          trả lời xong thoát, không vào interactive
--query-file -     đọc prompt từ stdin, KHÔNG bị shell diễn giải
                   (an toàn cho body sinh tự động / không tin cậy)
--in <dir>         đổi thư mục trước khi chạy
--worktree         tự tạo git worktree cô lập
--max-turns <N>    trần số vòng gọi tool
-Q/--quiet         chế độ programmatic: tắt banner/spinner/preview tool
--ignore-rules     bỏ nạp AGENTS.md / SOUL.md / .cursorrules
--ignore-user-config  bỏ ~/.hermes/config.yaml, dùng default
-s/--skills <name> nạp trước skill chỉ định
--yolo             bỏ qua hỏi duyệt lệnh nguy hiểm
--checkpoints      snapshot filesystem trước thay đổi phá huỷ
```

Mã thoát: `hermes chat` 0/khác-0 · `hermes -z` 0 khi thành công ·
`hermes serve` **75** khi cổng bận (in `BACKEND_PORT_IN_USE port=<port>`).
Còn có `hermes serve` (JSON-RPC/WebSocket, headless), `hermes gateway`
(Telegram/Discord/Slack/…), `hermes cron <list|create|run|tick>`.

**Suy luận:** bộ ba `-z` + mã thoát + `--usage-file` + `--worktree` là đúng hình
dạng một **executor** mà Factory gọi được bằng `Bash` và đo được bằng máy —
không phải "agent tự khai". Đây là điều kiện cần, và nó **có**.

## 3. Ổ nào của Factory — fact (đọc ADOPT.md:126-150)

Factory có sẵn ổ tên **`executor`**, mô tả ở skill `s8-implement`:
*"socket: executor (loại CHẠY — bên trong vòng lặp, không thay vòng lặp)"*.
Hermes vào đúng ổ này: nó **chạy** một đơn vị việc, nó **không thay** PHÂN TÍCH →
PLAN → MÔ PHỎNG → CODE, không ký gate, không tự nhận xong.

Đấu dây đủ ba nhịp, thiếu nhịp nào không tính:
1. chạy conformance fixture (`/factory:socket-check`)
2. ghi `.factory/sockets.yaml` kèm `pinned` + ngày `fixture`
3. một entry worklog, `object` = thư mục fixture output

**Fact:** dự án **chưa có** `.factory/sockets.yaml` — `.factory/` mới có
`fr/ wo/ worklog/` + `de-xuat-khung-2026-08-26.md`. Hermes sẽ là dây đầu tiên.

## 4. Khoảng trống — cái Hermes KHÔNG có mà Factory bắt buộc

| # | Khoảng trống | Hạng | Bịt bằng gì |
|---|---|---|---|
| G1 | **Không có khái niệm `phạm_vi_ghi`.** Hermes không giới hạn được nó ghi vào file nào — R1 mất bề mặt bắt | chặn | `--worktree` + `--in`, rồi Factory chấm bằng `git diff --name-only` đối chiếu `phạm_vi_ghi` của task. Hermes **không** được cầm cái thước này |
| G2 | **Hermes sở hữu biên ghi của chính nó** — bộ nhớ 3 tầng + skill tự sinh ghi vào `~/.hermes/`. Đụng thẳng Luật gốc: *không ai sở hữu thứ dùng để đánh giá mình* | chặn | biên ghi tính điểm phải là `.factory/worklog/` + git + CI. Log của Hermes = tư liệu tham khảo, **không phải bằng chứng** |
| G3 | **`cron` + `gateway` là cò súng ngoài cổng Factory** — job chạy theo lịch, tin nhắn Telegram kích việc, không qua G-gate nào | chặn | tắt cả hai ở profile dùng cho dự án; Factory giữ độc quyền kích. Nếu muốn lịch, dùng `cron tick` do Factory gọi |
| G4 | **Duyệt lệnh khi không có TTY: tài liệu không nói.** Docs CLI ghi "approvals still apply" nhưng im lặng về lúc stdin không phải terminal | cao | `--yolo` **chỉ** trong worktree/container; ngoài ra để prompt treo = fail nhanh còn hơn tự duyệt |
| G5 | Skill tự sinh, tự tiến hoá ⇒ hành vi executor **trôi giữa hai lần chạy**; `pinned` version của socket-check không khoá được cái trôi này | vừa | `--safe-mode` / `--ignore-user-config` / `-s` khoá skill khi chạy fixture; chạy lại fixture định kỳ |
| G6 | Windows native **có hỗ trợ** (fact) nhưng docs CLI viết theo hướng Unix; máy đang dùng là Win10 | vừa | smoke test thật trước khi tin — xem §5 |
| G7 | BYO API key (openrouter/anthropic/deepseek…) — chi phí và secret là của dự án | thấp | `--usage-file` cho ra JSON token/cost ⇒ đo được, không phải khai tay |

## 5. Trả lời câu hỏi gốc

**Cài được, và chiều control đúng như mong muốn: Factory ở trên, Hermes ở dưới.**
Vì Hermes có `-z`/`--oneshot` + mã thoát + `--worktree` + `--usage-file`, nó là
một *tiến trình gọi được và đo được*, không phải một khung điều phối tranh chỗ
với Factory. Cắm vào ổ `executor` ở s8.

Nhưng **không được cắm chay**. Bốn thứ phải khoá cùng lúc, thiếu một là Factory
mất quyền chấm: (a) worktree cô lập, (b) `phạm_vi_ghi` chấm bằng `git diff` do
Factory chạy, (c) `cron`/`gateway` tắt, (d) biên ghi tính điểm nằm ở
`.factory/worklog/` chứ không phải `~/.hermes/`.

Việc kế tiếp nếu duyệt hướng này — **fixture 5 phút**, chưa đụng file thật:

```
1. cài Hermes trên Win10, `hermes doctor`     → verify: exit 0
2. `hermes -z "in ra dòng OK"` trong thư mục tạm → verify: stdout đúng một dòng, exit 0
3. giao một task tí hon trong worktree, khai phạm_vi_ghi 1 file
                                              → verify: `git diff --name-only` KHÔNG có file thứ hai
4. cố tình giao task đòi ghi ra ngoài phạm_vi  → verify: Factory bắt được (fixture phải ĐỎ được)
```

Bước 4 là bước quan trọng nhất: một ổ không đỏ được là ổ chưa đấu (`#cổng-không-đỏ-được`).

## 6. Phát hiện lề — không thuộc câu hỏi, ghi để không mất

`kb/repo/` **rỗng** trong khi `web/site/repo/hermes-agent.html` vẫn render.
`FR-036` §A5 *"di trú `hermes-agent.md`"* còn ⬜ và `T02-3` liệt
`kb/repo/hermes-agent.md` là mục tiêu. Chưa quy được chủ — không phán ở đây.

## Nguồn

- https://github.com/NousResearch/hermes-agent — README, đọc 2026-08-30
- https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/cli-commands.md — bảng cờ CLI
- https://hermes-agent.nousresearch.com/docs/user-guide/cli — ghi chú non-interactive/approval/Windows
- ADOPT.md:126-150 (nghi thức socket) · CLAUDE.md (Luật gốc, CẤM) · project_map.yaml v17
