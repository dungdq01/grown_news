---
id: src_ruflo3a
slug: ruflo-bo-khung-van-hanh-cho-agent
source_type: repo
url: https://github.com/ruvnet/ruflo
version_id: 3.38.23 · pushed 2026-09-07
protocol_version: '2.0'
analyzed_at: '2026-09-08'
title: ruvnet/ruflo — agent meta-harness (tên cũ Claude Flow)
author: ruvnet (Reuven Cohen)
publisher: GitHub
published_at: '2025-06-02'
size: 39 plugin · 71.311 sao · 945 issue mở
license: MIT
decay_risk: high
archetype: framework
one_liner: Bộ khung vận hành quanh Claude Code/Codex — và một cơ chế witness tự ký cho thấy vì sao chứng chỉ tự cấp không tính.
concepts:
- agent
concepts_proposed:
- kiem-chung-doc-lap
- tri-nho-vector
- harness-van-hanh
category:
- skill
credibility_max: verified
corroboration_factor: 1.3
independent_sources: 3
contradicted_by: []
skill_candidates:
- capability: phan-biet-chu-ky-tu-ky-voi-chung-thuc-doc-lap
  verdict: DEEPEN
  target_skill: source-distiller
  priority: 42
  credibility: verified
  why_now: Pass 3.5 hiện xếp hạng độ tin theo số nguồn, chưa có luật nào bắt kiểm khóa riêng khi nguồn trưng ra chữ ký số — Ruflo là ca đầu tiên trong kho đưa attestation ký Ed25519 ra làm bằng chứng.
  draft_trigger: repo này có signed manifest / attestation / SBOM, tin được không
  score:
    relevance: 5
    frequency: 3
    durability: 5
    corroboration_factor: 1.3
    cost: 2
- capability: phan-ra-ti-le-pass-truoc-khi-tin
  verdict: NEW
  proposed_name: doc-bao-cao-cong
  priority: 31
  credibility: verified
  why_now: Dự án đang dựng gate và đã có lớp lỗi 'cổng xanh vì neo sai'; một tỉ lệ pass 100% gộp ba mức chất lượng khác nhau là đúng hình dạng lỗi đó ở nơi khác.
  draft_trigger: CI báo pass 100% nhưng vẫn nghi
  score:
    relevance: 4
    frequency: 4
    durability: 4
    corroboration_factor: 1.3
    cost: 2
- capability: danh-gia-repo-bang-sao-github
  verdict: OVERLAP
  target_skill: source-distiller
  reason_rejected: Pass 3.5 và references/credibility.md đã có thang bốn mức; sao GitHub chỉ là một tín hiệu yếu trong đó, không cần skill riêng.
  credibility: plausible
origin_tool: claude-opus-5
origin_protocol_version: '2.0'
conformance: A
ingested_at: '2026-09-08'
citations_sampled: 24
citations_verified: 9
unverifiable_citations: false
url_normalized: github.com/ruvnet/ruflo
unresolved_count: 0
origin: manual
review_status: approved
word_count: 1413
---

## 1. Overview

Ruflo (tên cũ Claude Flow) đóng gói phần "không phải model" của một agent: định nghĩa agent, trí nhớ vector sống qua phiên, vòng lặp điều phối, và một lớp liên lạc giữa các máy — rồi cắm vào Claude Code và Codex theo hai đường có hệ quả khác hẳn nhau. Thứ đáng học nhất ở kho này không phải danh sách tính năng, mà là cách nó cố tự chứng minh mình đã sửa lỗi sau một bản audit nặng: một hệ thống witness ký Ed25519. Cơ chế đó tinh vi, và vẫn để bên bị đánh giá cầm bút.

## 2. Bối cảnh

Trước lớp harness, cách chạy nhiều agent là mở nhiều phiên Claude Code song song rồi tự dán kết quả cho nhau. Ba thứ thiếu: trí nhớ chết theo cửa sổ chat; không có đường an toàn cho agent trên hai máy nói chuyện; không có nơi khai "agent nào làm việc gì". Ruflo trả lời cả ba bằng một lớp bọc ngoài model, và đặt câu khung ngay dòng mở đầu — agent = model + harness [README.md:26]. Kho đã đổi tên từ `claude-flow` sang `ruflo` ở v3.5 (27-02-2026), nhưng gói npm và lệnh CLI vẫn giữ tên cũ.

## 3. Nội dung

### 3.1 Đầu vào

| Khối | Trách nhiệm |
|---|---|
| `.claude-plugin/marketplace.json` | Danh mục plugin cho đường cài nhẹ — đếm máy được 39 mục |
| `plugins/` | Thân từng plugin: README, skill, command |
| `.agents/` | Khai agent và skill (`README.md`, `config.toml`, `skills/`) |
| `crates/` + `Cargo.toml` | Nhân Rust biên dịch sang WASM |
| `v3/` · `services/` | Runtime v3 và dịch vụ nền |
| `verification/` | Witness manifest, `witness-fixes.json`, `inventory.json` |
| `bin/cli.js` + `package.json` | Cửa CLI; gói npm vẫn tên `claude-flow` |
| `docs/` | Federation, ADR, các bản review nội bộ |

Ba trục khái niệm:

- **Harness hai đường vào.** Đường plugin không ghi file nào vào workspace; đường CLI ghi `.claude/`, `.claude-flow/`, `CLAUDE.md`, hooks, daemon [README.md:55-61]. Bỏ trục này thì mọi câu "Ruflo làm được X" mất nghĩa, vì X đúng ở đường này và sai ở đường kia.
- **AgentDB + HNSW.** Trí nhớ vector xuyên phiên [README.md:204]. Bỏ đi thì phần còn lại chỉ là một bộ sưu tập slash command.
- **Federation zero-trust.** mTLS + ed25519 challenge-response, pipeline dò 14 loại PII với chính sách BLOCK/REDACT/HASH/PASS, điểm tin cậy hành vi `0.4×success + 0.2×uptime + 0.2×threat + 0.2×integrity` [README.md:290-294]. Bỏ đi thì "đội hình đa máy" chỉ là nhiều tiến trình trên một máy.

### 3.2 Process

**Đường A — cài, và dấu vết để lại.**

1. `/plugin marketplace add ruvnet/ruflo` rồi `/plugin install ruflo-core@ruflo`; workspace không sinh file nào [README.md:55-61].
2. Tool của đường này mang tên `mcp__plugin_ruflo-core_ruflo__memory_store`, **khác** tên trần `memory_store` / `swarm_init` / `agent_spawn` mà scaffold đường CLI gọi [README.md:78].
3. Hệ quả: prompt viết cho đường CLI gọi tool không tồn tại khi chạy trên đường plugin. Đây đúng lớp lỗi cộng đồng báo dưới dạng "MCP tool naming mismatch, 100% swarm coordination fail" [issue #126 · discussion #1666]. README nay đã ghi rõ — ở dòng 78 của một file 417 dòng.

**Đường B — kho tự chứng minh đã sửa lỗi.**

1. Tháng 4/2026, một bản audit ngoài trên v3.5.51 kết luận khoảng 10 trong hơn 300 MCP tool chạy thật; `agent_spawn` chỉ ghi bản ghi JSON không sinh tiến trình; swarm init báo `agentCount: 0`; neural training trả dự đoán ngẫu nhiên [gist roman-rr, 2026-04].
2. Kho phản hồi bằng loạt vá 3.6.14–3.6.22 và dựng cơ chế witness: mỗi fix khai một `marker` (chuỗi con trong file), một SHA-256, và chữ ký Ed25519 [verification/README.md:217-218].
3. Bản chạy 06-05-2026 báo 55/55 đạt, nhưng phân rã ra: 10 `PASS` khớp hash, **43 `PASS_DRIFT`** chỉ còn khớp chuỗi marker, 2 `PASS_SRC_ONLY` kiểm file `.ts` vì `dist` chưa build [verification/results.md:13-24].
4. **Chỗ đứt gãy:** khóa công khai suy ra tất định từ `sha256(gitCommit + ':ruflo-witness/v1')` [verification/README.md:217-218]. Ai có commit cũng ký lại được. Chữ ký chứng minh manifest khớp commit, không chứng minh **ai** ký — trong khi bên ký, bên chọn marker và bên bị đo là cùng một bên.

### 3.3 Output

Đường CLI ghi vào workspace: `.claude/`, `.claude-flow/`, `CLAUDE.md`, settings, hooks, daemon [README.md:55-61]. Kho ghi ra `agentdb.rvf` cho trí nhớ, và bundle witness manifest + history theo từng OS dưới `verification/{linux,macos,windows}/`. Số đo công khai duy nhất kèm điều kiện đo dùng được là HNSW: ~1.9× ở N=20k, ~3.2–4.7× ở N=5k so với brute force, recall@10 ~0.99, kèm chú thích ANN hoà hoặc thua ở N nhỏ [README.md:204].

### 3.4 Tinh túy

#### 3.4.1 Đọc một chữ ký số bằng câu hỏi "khóa riêng ở đâu", không bằng chữ "signed"

- **Không hiển nhiên vì:** "Ed25519 signature + reproducible public key" đọc như bằng chứng mạnh; phải lần tới công thức seed mới thấy khóa riêng suy được từ dữ liệu công khai, nên chữ ký không phân biệt nổi người ký với bất kỳ ai khác.
- **Chuyển giao:** mọi manifest, attestation, SBOM hay biên bản gate ký bằng khóa dẫn xuất tất định.
- **Tin cậy:** verified · 1 nguồn (đọc thẳng mã)
- **Bằng chứng:** [verification/README.md:217-218]
- **Loại:** skill

#### 3.4.2 Phân rã một tỉ lệ pass trước khi tin nó

- **Không hiển nhiên vì:** "100.0% (55/55)" là con số cuối và trông tuyệt đối; phải xuống bảng phân rã mới thấy 43/55 chỉ khớp một chuỗi con, và 2/55 kiểm file nguồn thay cho file thật sự được ship.
- **Chuyển giao:** mọi báo cáo coverage, CI, migration có nhiều mức "pass" khác chất lượng.
- **Tin cậy:** verified · 1 nguồn
- **Bằng chứng:** [verification/results.md:13-24]
- **Loại:** skill

#### 3.4.3 Với harness nhiều đường cài, hỏi "đường nào" trước khi hỏi "làm được gì"

- **Không hiển nhiên vì:** hai đường cùng tên sản phẩm, cùng tài liệu, nhưng khác tiền tố tên tool — cùng một prompt chạy đường này thì xanh, đường kia gọi vào tool không tồn tại và fail toàn bộ.
- **Chuyển giao:** bất kỳ công cụ nào có bản "plugin nhẹ" song song bản "cài đầy đủ".
- **Tin cậy:** verified · 2 nguồn độc lập
- **Bằng chứng:** [README.md:55-61] [README.md:78]
- **Loại:** skill

#### 3.4.4 Lệch số giữa README, CHANGELOG và manifest là chỉ báo rẻ tiền về độ tươi của tài liệu

- **Không hiển nhiên vì:** từng con số hợp lý khi đứng riêng; chỉ khi đặt cạnh nhau mới thấy README nói 100+ agent ở dòng 26 và 98 agent ở dòng 57, ghi "All 35 plugins" ở dòng 79 trong khi manifest có 39 mục, CHANGELOG dừng ở 3.34.0 còn `package.json` đã là 3.38.23.
- **Chuyển giao:** kiểm nhanh mọi repo trước khi cam kết dùng — vài lệnh grep, không cần đọc mã.
- **Tin cậy:** verified · 1 nguồn (đếm bằng máy)
- **Bằng chứng:** [README.md:26] [package.json:2-3] [CHANGELOG.md:10]
- **Loại:** skill

#### 3.4.5 Sao GitHub đo được sự chú ý, không đo được tỉ lệ tính năng chạy thật

- **Không hiển nhiên vì:** 71.311 sao thường được đọc thẳng thành bằng chứng chất lượng, nhưng cùng thời điểm kho có 945 issue mở, và bản audit ngoài đếm được khoảng 10 trên hơn 300 tool chạy thật.
- **Chuyển giao:** mọi lần chọn thư viện hoặc framework dựa vào số sao.
- **Tin cậy:** plausible · 3 nguồn độc lập
- **Bằng chứng:** [gist roman-rr] [discussion #1666] [package.json:2-3]
- **Loại:** knowledge

## 4. Ý nghĩa thực tế

Cơ chế witness của Ruflo là bản mẫu tốt của một ý tưởng và bản mẫu xấu của cách thi hành — nó vi phạm đúng thứ luật gốc "không ai được sở hữu thứ dùng để đánh giá mình" cấm. Ví dụ cụ thể nếu bê nguyên khuôn `witness-fixes.json` vào một gate nội bộ: người viết fix cũng là người chọn `marker`, nên xoá sạch thân hàm mà giữ lại chuỗi marker vẫn cho ra PASS — đúng lớp lỗi mà 43 ca `PASS_DRIFT` không phân biệt nổi [verification/results.md:22-24]. Muốn dùng lại ý này thì marker phải do bên khác đặt, hoặc thay hẳn bằng một lệnh chạy thật.

## 5. Rủi ro và tầm nhìn

| Vấn đề | Loại | Địa chỉ |
|---|---|---|
| "ruflo wins cold start, single turn, RSS by 1.3×–1953×" vs LangGraph/AutoGen/CrewAI: có nền tảng phần cứng, không có tải, baseline hay version đối thủ; lại đo trên v3.8.0 trong khi hiện tại là 3.38.23 | số liệu thiếu điều kiện đo | [README.md:384] |
| Witness manifest do chính kho ký, marker do chính người vá đặt | xung đột lợi ích | [verification/README.md:217-218] |
| Cảnh báo lệch tên tool nằm ở dòng 78 của README 417 dòng, sau bảng tính năng | rủi ro tài liệu | [README.md:78] |
| Bản audit gốc đo v3.5.51 (4/2026), nhiều lỗi đã được vá từ 3.6.x — đừng trích nó như hiện trạng | nội dung đã cũ | [package.json:2-3] |
| 945 issue mở, đánh giá độc lập có tên tuổi vẫn mỏng so với 71.311 sao | nguồn phản biện mỏng | [discussion #1666] |

**Tầm nhìn:** thứ đáng giữ khi Ruflo trôi là câu hỏi nó buộc người ta phải đổi — thôi hỏi "model nào mạnh nhất", quay sang hỏi "đã dựng đủ bộ khung chưa" — cộng bài học ngược lại chính nó: phần bộ khung nào tự cấp chứng chỉ cho mình thì phần đó không tính.
