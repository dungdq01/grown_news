# Spec overview — chia module

> Câu hỏi của file này: **chia sao?** Đây là **tổng quan** — spec chi tiết từng
> module sống ở s6 (`06_modules/Mxx/spec.md`), đừng viết sâu ở đây.
>
> Điều kiện đóng G3: mỗi module truy được về ≥1 mục PRD.

## Nguyên tắc chia

Chia theo **hướng phụ thuộc dữ liệu**, không theo công nghệ:

```
        ĐƯỜNG VÀO                 HỢP ĐỒNG            ĐƯỜNG RA
  M01_core  ──sinh ra──┐
                       ├──>  M02_kb  ──chỉ đọc──>  M03_web
  M05_intake ──gác cửa─┘        ▲ │
                                │ ├──chỉ đọc──>  M06_skillgen ──> SKILL.md nháp
                  M04_ci kiểm ──┘ └──chỉ đọc──>  M07_curate  ──> báo cáo nhịp
```

Bốn module đọc `kb/` không module nào ghi đè lên nhau: web render · skillgen sinh
file **ngoài repo** · curate chỉ báo · ci chỉ chấm. **Chỉ M01 và M05 được ghi vào
`kb/`.**

`M02_kb` là **hợp đồng**, không phải thư mục con của ai. Nếu nhét nó vào core thì
web phải với tay qua biên giới core để đọc dữ liệu — hai nhánh lại dính nhau đúng
chỗ cần tách.

---

## M01_core — sinh và kiểm file

**Làm gì**: chạy giao thức 6 pass sinh `.md`; kiểm file bằng 8 cổng máy.

**Vào**: link hoặc file do người dùng đưa · `frontmatter.schema.json` ·
`kb/concepts.yaml`

**Ra**: `kb/<loại>/<slug>.md` ở `draft` · kết quả validate (exit code + danh sách lỗi)

**Liên quan**: ghi vào `M02_kb`. **Không** biết gì về `M03_web`.

**Thành phần**:
- Skill `source-distiller` (6 pass · 6 lăng kính · 6 archetype repo) — cài ở `~/.claude/skills/`, không nằm trong repo
- `validate.py` — 8 cổng, có `--fix`, `--json`, `--strict`, `--no-concepts`
- `frontmatter.schema.json` — nơi ràng buộc máy đọc **sống**
- `tests/` — mỗi test phá một luật, khẳng định cổng đóng

**PRD**: U1 nạp · U4 kiểm máy · **BRD**: B-A1, B-A4, B-B2, B-C2, B-D2

> U2 (đường tĩnh) chuyển sang `M05_intake`, U7 (sinh skill) sang `M06_skillgen` —
> xem lý do ở từng module.

**Trạng thái**: ✅ **as-built, đã kiểm chứng** — 14 test pass, 7 cổng chặn thật.
Chưa qua s6 nên chưa có spec chuẩn.

---

## M05_intake — cửa cho bản không do pipeline sinh

**Làm gì**: nhận bản phân tích `.md` do agent khác sinh, kiểm rồi cho vào kho ở
trạng thái `draft`. Không sinh nội dung — chỉ gác cửa.

**Vì sao là module riêng, không nhét vào M01**: M05 có một luật mà M01 không có —
bản `external` **không bao giờ** vào thẳng `approved`. Nhét chung thì `validate.py`
phải mang hai chế độ, và mỗi lần sửa logic distiller lại phải nhớ kiểm đường
external. Tách ra thì sửa M01 không cần nghĩ tới M05.

**Vào**: file `.md` người dùng thả vào `_inbox/`

**Ra**: `kb/<loại>/<slug>.md` ở `draft` với `origin: external` · hoặc **trả lại**
kèm danh sách trường thiếu

**Liên quan**: ghi vào `M02_kb` (cùng đường M01 ghi). Dùng lại `validate.py` của
`M01_core` — **không viết logic kiểm mới**.

**Bốn việc**:
1. Đọc file trong `_inbox/`
2. Validate bằng schema sẵn có — thiếu trường thì trả lại danh sách, **không tự điền**
3. Bắt buộc `citations_sampled >= 2` — người dùng tự mở 2 link, xác nhận. Schema
   đã cưỡng chế điều này khi `origin: external`
4. Ghi vào `kb/` với `review_status: draft`

**Vì sao bắt spot-check**: tỉ lệ bịa trích dẫn của LLM khi tóm tắt nguồn kỹ thuật
là 17-34%. Kho không có cách tự biết cái nào sai. Người phải mở link.

**Entity sở hữu**: không sở hữu entity nào — ghi vào `Analysis` mà `M02_kb` sở hữu.
Cần thêm trường trên `Analysis` ⇒ FR tới M02.

**PRD**: U2 (đường tĩnh) · **BRD**: B-A2, B-B3

**Trạng thái**: ❌ chưa có. Schema đã sẵn sàng (`origin`, `conformance`,
ràng buộc `external ⇒ citations_sampled >= 2`), chưa module nào sở hữu việc kiểm.

---

## M06_skillgen — bản phân tích thành skill nháp

**Làm gì**: đọc `skill_candidates[]` trong các bản `approved`, chấm verdict bằng
`skill-manifest.json`, sinh **nháp** `SKILL.md` cho ứng viên đạt ngưỡng.

**Vì sao tồn tại**: M1.2 đo *"đã sinh skill thật VÀ cài vào agent VÀ output agent
đổi theo hướng tốt hơn"*, ngưỡng >=1/10 bản đầu. Không có module này thì M1.2
chắc chắn bằng 0 và một trong ba metric chặn tự động trượt.

**Vào**: `kb/**/*.md` ở `approved` · `skill-manifest.json` (năng lực hiện có)

**Ra**: `~/.claude/skills/<name>/SKILL.md` **dạng nháp** — nằm ngoài repo này

**Liên quan**: chỉ đọc `M02_kb`. Không ghi vào `kb/`. Không module nào phụ thuộc nó.

### Vì sao NHÁP chứ không hoàn chỉnh

Một skill cần hai thứ có độ tin cậy khác hẳn nhau:

| Phần | Máy làm | Vì sao |
|---|---|---|
| **Trigger** | ✅ tốt | `draft_trigger` đã có trong frontmatter — cụm người dùng thật sẽ gõ |
| **Nội dung** | ❌ dở | Sinh từ MỘT nguồn thì chỉ chép lại nguồn đó. Skill thật cần thứ học được sau 3 nguồn và một lần va thất bại |

Sinh đủ nội dung tạo ra thứ *trông như* skill mà cài vào làm agent tệ hơn — và
người dùng không phát hiện ngay. Nháp thì biết rõ nó chưa xong.

**Nháp gồm**: frontmatter `name` + `description` (lấy từ `draft_trigger`) · mục
"Khi nào dùng" · con trỏ ngược về bản `.md` nguồn kèm số dòng · thân để trống với
`<!-- TODO: viết sau khi có nguồn thứ 2 -->`.

### Ngưỡng và cổng

```
priority = (relevance × frequency × durability × corroboration_factor) / cost
```
Sinh nháp khi `priority >= 25` VÀ verdict thuộc `{NEW, DEEPEN}`.

**Cổng cứng** (schema đã cưỡng chế, M06 không được nới): `credibility` là
`claimed`/`conflicted` + `independent_sources == 1` ⇒ cấm `NEW`/`DEEPEN`.

**Thứ tự chấm verdict**: theo `skill-manifest.json` `$matching.order` — cổng cứng
chạy TRƯỚC kiểm domain. Chạy sai thứ tự cho ra `NEW` cho ứng viên schema đã cấm.

**Entity sở hữu**: không sở hữu entity trong `kb/`. Sở hữu `SkillDraft` (ngoài repo).

**PRD**: U7 · **BRD**: B-A2, B-D2

**Trạng thái**: ❌ chưa có. `skill-manifest.json` đã sẵn (5 skill / 23 capability,
kiểm 5/5 khớp), chưa có phần sinh file.

---

## M07_curate — giữ kho khỏi mục theo thời gian

**Làm gì**: quét kho theo nhịp, báo ba thứ hỏng dần mà không ai báo. **Chỉ báo và
đề xuất — không tự sửa `kb/`.**

**Vì sao là module chứ không phải "nhớ làm định kỳ"**: cả ba vấn đề dưới đây là
*không có ai làm*, không phải *làm sai*. Việc dựa vào trí nhớ thì hỏng im lặng.

| Hỏng gì | Vì sao xảy ra | M07 làm gì |
|---|---|---|
| **Bài chết** | `decay_risk: high` nghĩa là nguồn sẽ lỗi thời — repo đổi API, paper bị rút, video xoá. Bản phân tích vẫn nằm đó trông như còn đúng | Quét bài `decay_risk: high` quá ngưỡng ngày ⇒ xếp hàng chờ re-analyze (nối vào F3) |
| **Draft đọng** | Nạp 5 bài một tối, duyệt 2, ba bài nằm `draft` mãi. Prototype có màn "Chờ duyệt" nhưng không ai đẩy | Đếm draft quá ngưỡng ngày ⇒ nhắc |
| **`concepts.yaml` phình** | Mỗi bài đề xuất vài `concepts_proposed`. Không gộp thì 22 mục thành 80 mục trùng nghĩa, bộ lọc mất tác dụng | Gom `concepts_proposed` trùng nghĩa ⇒ **đề xuất** gộp, người chốt |

**Vào**: `kb/**/*.md` (chỉ đọc) · `kb/concepts.yaml` (chỉ đọc)

**Ra**: báo cáo nhịp (tuần + tháng). **Không ghi vào `kb/`** — kể cả `concepts.yaml`.

**Liên quan**: chỉ đọc `M02_kb`. Đề xuất re-analyze thì đẩy sang `M01_core` chạy.

### Ngưỡng là tham số, không phải hằng số trong code

Kho hiện **0 bài**. Mọi ngưỡng dưới đây là phỏng đoán và **sẽ sai**:

```yaml
# 07_curate/thresholds.yaml — sửa một chỗ, không rải trong code
decay_stale_days:  90    # decay_risk high quá ngần này ngày ⇒ nghi lỗi thời
draft_stale_days:  14    # draft quá ngần này ngày ⇒ nhắc
concept_merge_min:  2    # >= ngần này đề xuất gần nghĩa ⇒ gợi ý gộp
```

Sau khi nạp 10 nguồn thật (bước 2 của build order) sẽ có dữ liệu để chỉnh. Đặt
tham số một chỗ để lúc đó sửa một dòng, không phải sửa logic.

**Vì sao M07 không tự sửa `kb/`**: `kb/` là nguồn chân lý và là thứ M1 đo. Module
tự gộp concept hoặc tự đổi trạng thái thì người duyệt mất quyền kiểm soát thứ
đang được dùng để chấm dự án. M07 đề xuất, người chốt.

**Entity sở hữu**: không sở hữu entity nào. Chỉ đọc `Analysis` và `Concept`.

**PRD**: U3 (đẩy duyệt) · U6 (giữ concepts dùng được) · **BRD**: B-C1, B-C2

**Trạng thái**: ❌ chưa có. Ngưỡng chờ dữ liệu thật từ 10 bài đầu.

---

## M02_kb — kho tri thức, hợp đồng

**Làm gì**: chứa nguồn chân lý. Định nghĩa format mà hai bên còn lại tuân theo.

**Vào**: file `.md` do `M01_core` ghi

**Ra**: file `.md` cho `M03_web` đọc; `concepts.yaml` cho `M01_core` kiểm

**Liên quan**: không phụ thuộc module nào. Cả hai bên phụ thuộc **nó**.

**Thành phần**:
- `kb/<6 loại>/` — `repo · paper · video · article · docs · announcement`
- `concepts.yaml` — danh mục khái niệm kiểm soát, hiện 22 mục
- Quy ước tên: `<slug>.md` hiện hành, `<slug>.v1.md` bản cũ khi re-analyze

**Entity sở hữu**: `Analysis` (một bản phân tích một nguồn) · `Concept`

**PRD**: U3 (trạng thái duyệt), U6 (lọc theo concepts) · **BRD**: B-C1, B-C2, B-B1

**Trạng thái**: ✅ as-built. **Kho rỗng — 0 bài.** Đây là chỗ M1 chưa đo được.

---

## M03_web — tờ báo

**Làm gì**: đọc `kb/`, render kiểu báo điện tử, deploy.

**Vào**: `kb/**` — **chỉ đọc**

**Ra**: site tĩnh

**Liên quan**: phụ thuộc `M02_kb`. **Không** phụ thuộc `M01_core` — hợp đồng là
format file, không phải code.

**Thành phần dự kiến**:
- Trang bài (làm trước) — 7 khối theo mức cam kết người đọc
- Trang chủ (làm sau, chỉ có nghĩa khi >20 bài) — 3 khối
- Lọc theo `concepts` + full-text
- Build: đọc file lúc build, không cần database

**Luật hiển thị** (cưỡng chế ở tầng build):
- Chỉ `review_status: approved`
- Gộp theo `url_normalized` — 3 bản cùng nguồn = **1** bài
- Sắp theo `priority`, không theo `analyzed_at`
- Bundle tĩnh không bao giờ ghi `kb/` — đường ghi từ trình duyệt CHỈ qua API
  local M08 (`api_writes`, FR-011): người bấm, `validate.py --strict` kiểm,
  rồi mới ghi; xoá = recycle `_recycle/`

**PRD**: U5, U6 · **BRD**: B-B1, B-A3, B-C3, B-D3

**Trạng thái**: ❌ **chưa có code.** Mới có luật trong `web/README.md`.

**Câu hỏi mở chặn module này**: Quartz hay tự viết Next.js? → Q1 của s1. Quyết
định này **xoá được phần lớn module** nếu chọn Quartz.

---

## M04_ci — cưỡng chế tự động

**Làm gì**: chạy `validate.py` + `pytest` trên mỗi PR chạm `kb/` hoặc `core/`.

**Vào**: PR / push

**Ra**: trạng thái xanh/đỏ — điều kiện để merge

**Liên quan**: kiểm `M01_core` và `M02_kb`. **Không sở hữu** file nào của chúng.

**Thành phần dự kiến**:
- GitHub Actions workflow
- Pin phiên bản Python (hiện môi trường phân mảnh — bản có `jsonschema` thiếu `pip`)

**PRD**: U4 · **BRD**: gián tiếp mọi ràng buộc nhóm A và C

**Trạng thái**: ❌ **chưa có.** Hiện toolchain chỉ chạy tay.

**Vì sao là module riêng, không gộp vào M01**: S3 (toolchain + CI) là một trong
**bốn bề mặt duy nhất** mà rule của khung có răng. Không có CI thì R2 — *"đơn vị
được nhận mà không có kết quả máy xanh"* — không gác được ở mức PR, và mọi
"đã pass" chỉ là lời khai.

---

## Bảng module

> ⚠️ **Bảng này chụp ngày 2026-08-19 và cột "Trạng thái" đã lạc hậu** — phần
> lớn `❌ chưa có` nay đã dựng, và `M08`–`M11` sinh sau qua FR nên không có ở
> đây. Bảng module cập nhật: `project_map.yaml` (v17). Giữ bảng này làm hồ sơ
> lần chia module đầu tiên.

| Module | Vào | Ra | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| M01_core | link/file, schema, concepts | `.md` draft, kết quả validate | — | ✅ as-built |
| M02_kb | `.md` từ core | `.md` cho web, concepts cho core | — | ✅ rỗng |
| M03_web | `kb/**` chỉ đọc | site tĩnh | M02 | ❌ chưa có |
| M04_ci | PR/push | xanh/đỏ | M01, M02 | ❌ chưa có |
| M05_intake | `.md` ngoài trong `_inbox/` | `.md` draft vào kb, hoặc trả lại | M02 (+ dùng validator M01) | ❌ chưa có |
| M06_skillgen | `kb/` approved + manifest | `SKILL.md` nháp (ngoài repo) | M02 | ❌ chưa có |
| M07_curate | `kb/**` chỉ đọc | báo cáo nhịp, đề xuất (không tự sửa) | M02 | ❌ chưa có |

## Truy ngược — mọi scope-in của proposal có module gánh

`S*` là hạng mục scope-in ở `02_proposal/proposal.md#4`. Ký hiệu này **không liên
quan** tới `S1–S4` (bốn bề mặt rule) của khung Factory — trùng chữ cái, khác
không gian tên.

| Proposal | Hạng mục | Module gánh |
|---|---|---|
| S1 | Skill 6 pass sinh `.md` | M01_core |
| S2 | Schema + validator + test | M01_core (M05_intake dùng lại) |
| S3 | Thang kiểm chứng + hệ số chéo | M01_core (schema) + M02_kb (tích luỹ) |
| S4 | Cổng duyệt `draft → approved` | M02_kb |
| S5 | Web render kiểu tòa soạn | M03_web |
| S6 | CI chạy validate + test mỗi PR | M04_ci |

Không hạng mục scope-in nào không có module gánh.

## Truy ngược — mọi module về PRD

| Module | PRD tiêu thụ |
|---|---|
| M01_core | U1 nạp · U4 kiểm máy |
| M02_kb | U3 duyệt · U6 tra cứu |
| M03_web | U5 đọc web · U6 tra cứu |
| M04_ci | U4 kiểm máy |
| M05_intake | U2 đường tĩnh |
| M06_skillgen | U7 sinh skill |
| M07_curate | U3 đẩy duyệt · U6 giữ concepts dùng được |

**Không có module nào không truy được về PRD.** Điều kiện đóng G3 đạt.

Ngược lại — mọi mục PRD có module gánh: U1→M01 · U2→**M05** · U3→M02+**M07** · U4→M01+M04 ·
U5→M03 · U6→M02+M03+**M07** · U7→**M06**.

---

## Build order đề nghị

Ba chặng, theo **độ thật của dữ liệu** — đúng trạm `data` của s7:
`sample json → database → schema → migration`.

```
CHẶNG A — có hệ thống          CHẶNG B — chạy với sample        CHẶNG C — dữ liệu thật
M04_ci                          M03_web đọc sample.v2.json       nạp 10 nguồn → đo M1
                                M06 chạy trên sample             M05 · M07
```

### Chặng A — dựng khung

| # | Module | Vì sao ở đây |
|---|---|---|
| 1 | **M04_ci** | S3 phải có răng trước đơn vị việc đầu tiên. Không có CI thì reviewer đòi "máy xanh" mà không có gì trình ra |

### Chặng B — hệ thống chạy được với sample

| # | Module | Vì sao ở đây |
|---|---|---|
| 2 | **M03_web** trên sample | `contracts/analyses.sample.v2.json` đã có 10 bản ghi phủ edge case, `_expected_render` tính bằng máy. Đủ dựng web mà không cần một bài thật nào |
| 3 | **M06_skillgen** trên sample | Chấm verdict kiểm được ngay — thuật toán đã thử 5/5 khớp. **Phải bổ sung sample trước** (xem dưới) |

**Vì sao sample đủ**: cả hai module ăn **shape**, không ăn **nội dung**. Web render
theo frontmatter; skillgen chấm theo `score` và `verdict`. Chữ trong mục 5 là gì
không đổi một dòng code nào.

**Nhưng sample hiện CHƯA đủ cho M06** — đếm bằng máy trên `analyses.sample.v2.json`:

| Có | Thiếu |
|---|---|
| `DEEPEN` ×3 · `OUT_OF_SCOPE` ×2 | **`NEW`** · **`OVERLAP`** |
| `priority` 50 · 60 · 65 (đều ≥25) | ca dưới ngưỡng (`priority` <25) |
| `approved` ×6 · `draft` ×3 · `rejected` ×1 | — |

`NEW` là nhánh **chính** của M06 (năng lực chưa có ⇒ sinh nháp) mà sample không
có ca nào. `OVERLAP` là nhánh loại-có-lý-do. Thiếu cả hai thì chặng B kiểm được
đúng một nửa module.

⇒ **Đơn vị việc đầu của bước 3**: bổ sung sample lên đủ 4 verdict + 1 ca dưới
ngưỡng. Sửa `analyses.sample.v2.json` là đụng contract G5 ⇒ **FR + bump v3**,
không sửa tại chỗ.

### Chặng C — dữ liệu thật

| # | Module | Vì sao ở đây |
|---|---|---|
| 4 | **nạp 10 nguồn thật** vào `M02_kb` | Giờ có chỗ để nhìn chúng. Đo M1 tại đây |
| 5 | **M05_intake** | Làm khi gặp bản ngoài đầu tiên muốn đưa vào. Độc lập, không chặn ai |
| 6 | **M07_curate** | Ngưỡng ngày chỉnh theo dữ liệu thật của lứa 10 bài |
| — | M01_core | Đã as-built; chỉ sửa khi M1 lộ ra giao thức sai |

### Vì sao đổi so với bản trước

Bản trước đặt *nạp 10 nguồn thật* ở bước 2 — dữ liệu thật đứng trước cả hệ thống.
Nhầm hai việc khác nhau:

| Việc | Cần gì |
|---|---|
| **Đo M1** | bài thật |
| **Xây module** | dữ liệu đúng **shape** — sample đủ |

Gộp lại thì phải nạp bài thật trước khi có chỗ nào hiển thị chúng — duyệt bài trên
`cat` thay vì trên giao diện đã dựng xong.

### Rủi ro của lối này và cách chặn

**Rủi ro**: xây xong web mới phát hiện giao thức 6 pass cho ra bài không ai muốn
đọc — M1 trượt sau khi đã tốn công.

**Vì sao chấp nhận được**: M03 đọc `.md` qua frontmatter, **không phụ thuộc nội
dung**. M1 trượt ⇒ sửa giao thức trong M01, web đã dựng không phải bỏ.

**Chốt chặn**: hết chặng B, nạp **2 bài thật** trước khi nạp đủ 10. Hai bài đủ lộ
ra shape sai (thiếu trường, mục 5+6 teo, concept ngoài danh mục) mà chưa tốn công
duyệt cả lứa. Trượt ⇒ sửa giao thức rồi mới nạp tiếp.

**Q1 đã chốt** (F1, 2026-08-18): giữ **Quartz**. Kiểm tài liệu chính thức thay vì
đoán — `emit()` nhận toàn bộ content array nên gộp `url_normalized` được; SPA
routing giữ DOM state nên multi-window sống được. Vanilla tốn thêm ~700 dòng.

---

# Đợt hai — 2026-08-31 · ba vùng + M12–M16

> Nguồn: `02_proposal/proposal-2-ai-llm-kenh.md` §4 · `03_docs/prd.md` U8–U12.
> Đây là **tổng quan**; spec chi tiết từng module ở s6.

## Nguyên tắc chia đợt hai: cắt theo RANH GIỚI TIN CẬY, không theo tính năng

Cắt "mỗi tính năng một service" là cách hỏng phổ biến với một người vận hành.
Dự án đã có sẵn một đường cắt tốt hơn — **ai được ghi vào kho** và **ai được
nói chuyện với bên ngoài**:

| vùng | gồm | ràng buộc cứng |
|---|---|---|
| **LÕI** | `core/` · `web/api` · `kb/` | bind `127.0.0.1` · **một cửa ghi** · **không bao giờ** gọi ra Internet (`B-E2`) |
| **THỢ** | M12 · M13 · **M14** · M16 | nghe **trên** `127.0.0.1` · nơi **DUY NHẤT** gọi ra Internet · ghi vào kho **chỉ qua cửa ghi của LÕI** |
| **BIÊN** | M15 · **M17** | đối mặt Internet — `kenh/` **kéo** (không nghe), `cong/` **nghe thật** (`nghe_ngoai: true`, cổng 443) · cả hai **không chạm `kb/`** |

> **Đọc bảng trên đúng trục.** `LÕI/THỢ/BIÊN` là từ vựng của **trục tin cậy** —
> nó tồn tại để viết luật và cổng `Z1`–`Z8`, không để xếp hạng giá trị. Trên
> **trục sản phẩm** thì ngược lại: bốn dịch vụ `THỢ` (`chungcat` · `truyhoi` ·
> `chatbot` · `artifact`) **là core — các services AI/LLM**; `web/` là **hệ
> thống** (quản lý, một cửa ghi, chuẩn hoá output). Hai trục, hai nghĩa của cùng
> chữ *core*; giữ cả hai, không hợp nhất. Lý do và bảng đối chiếu:
> `04_system/adr.md#ADR-05` §*HAI bộ từ vựng*. Trục sản phẩm **không có cột
> riêng** trong `dich-vu.json` — nó đúng bằng `vung`.

Ba tính chất khiến cách chia này hợp dự án chứ không phải lời khuyên chung:

1. **Mỗi ranh giới canh được bằng cổng** — `api-guard` đã canh "LÕI không nghe
   ra ngoài"; thêm hai cổng cùng khuôn là canh đủ ba vùng (`FR-043` C1–C4).
2. **Hàng đợi giữa các vùng ĐÃ CÓ**: `_inbox/` + `05_intake/gate.py` là message
   queue có cổng kiểm — bền, soi được bằng mắt, và `gate.py:133` ép `draft` vô
   điều kiện. Không cần Redis/Kafka.
3. **Giữ được "một cửa ghi"**: thợ mở SQLite ghi trực tiếp là `database is
   locked` và mất `B-C1`. Thợ **thả file**, gate chấm.

**Một repo, nhiều tiến trình.** Tách repo là cổng hết nhìn thấy nhau.

**Service CHỈ có backend.** Không HTML/CSS/template/asset trong thư mục
service — chúng trả **dữ liệu**, không trả trình bày. Và **`web/` là WRAPPER**
— lớp trình bày duy nhất cho người: trình duyệt gọi `web`, `kenh/` gọi `web`.
*(Đính chính 2026-09-09 theo `ADR-08`: câu cũ "`web/` là client DUY NHẤT, không
ai gọi thẳng `:8788`/`:8790`/`:8791`/`:8792`" **hết hiệu lực** — service gọi
được service, mỗi cặp `(từ → tới)` khai trong `dich-vu.json` `goi_duoc`, mỗi
chiều một khoá + `aud`, bên NHẬN cưỡng chế. `M14/model_flow §2` đã đi ngược câu
cũ 6 ngày mà không cổng nào đỏ — đó là lý do đính chính, không phải nới.)*

Lý do chính không phải gọn — mà là **một chỗ chuẩn hoá**: hai client tự
dựng output từ cùng một service thì hai bên sẽ lệch. Chi tiết + cổng Z7/Z8'/Z9
ở `04_system/adr.md#ADR-05` và `#ADR-08`.

---

## M12_chungcat — nguyên liệu thành bản nháp

**Làm gì**: đọc một bản ghi `thu-vien` (PDF/video/URL đã trong kho), viết bản
phân tích 5 mục theo `khung-than-bai.json`, kèm địa chỉ phân giải được.

**Vào**: `slug` của bản nguyên liệu · byte ở `_media/<sha256>`
**Ra**: một `.md` trong `_inbox/` · một dòng log kèm `sha256` payload đã gửi
**Liên quan**: M01 (khung + validate) · M05 (gate) · M02 (kho)

**Vùng THỢ** — nó gọi model, nên nó là egress. **Có cổng vào, chỉ nghe
loopback**: `:8790` (`core/assets/dich-vu.json`), và luật thật là `M08-R1`
— *không nghe NGOÀI `127.0.0.1`* — chứ không phải *không nghe gì*
(`ADR-05` đính chính). Câu cũ (*"Không cổng vào"*) chỏi chính `:455` của
file này, và `spec M12` đã cờ nó ba ngày mà không ai sửa.
**Không bao giờ**: ghi thẳng `kb/` · tự đặt `approved` · gọi từ `web/api/**`.

**Hai kiểu việc, một hợp đồng**: `chung-cat-mot-nguon` → `ho_so: phan-tich`;
`tong-hop-chu-de` (N nguồn) → **`ho_so: tong-hop`** (`FR-044`). Cùng một
đường API, khác `loai` trong payload.

**Engine cắm rút được** (`ADR-05`): hợp đồng vào/ra khoá, engine phía sau
thay theo **bảng khai** `chủ_đề → engine`. Thêm khách hàng/nhóm chủ đề mới =
thêm một dòng, không sửa lõi.

**Phụ thuộc cứng**: cổng T2 của `FR-044` cần tập dạng địa chỉ của `B-A5`
⇒ **M12 không thi công được trước S8**.

→ PRD **U9** · proposal S11 · BRD B-B1, **B-A7**, B-E1 bậc 4, B-E2, B-E3 · **FR-044**

## M13_truyhoi — chỉ mục và truy hồi

**Làm gì**: dựng chỉ mục trên kho; nhận câu hỏi + **phạm vi** (bộ lọc facet),
trả về các đoạn liên quan **kèm địa chỉ**.

**Vào**: `ban_ghi` (chỉ đọc) · câu hỏi · phạm vi facet
**Ra**: danh sách đoạn + địa chỉ + điểm liên quan
**Liên quan**: M02 (nguồn) · M14 (khách hàng duy nhất)

**Vùng THỢ**. Chỉ mục **dựng lại được** từ kho — nó là dữ liệu dẫn xuất, không
phải chân lý (cùng nguyên tắc `B-C1`).

**Phạm vi là control HIỂN THỊ**, không phải top-k ẩn: người dùng thấy mình đang
hỏi trên tập nào.

→ PRD **U10** · proposal S12 · BRD B-C2

## M14_chatbot — hỏi đáp có địa chỉ

**Làm gì**: nhận câu hỏi + phạm vi → gọi M13 → dựng câu trả lời mà **mọi khẳng
định kèm địa chỉ bấm được**; không có trong kho thì **từ chối kèm lý do phân
loại**.

**Vào**: câu hỏi · phạm vi · (tuỳ chọn) lịch sử hội thoại
**Ra**: câu trả lời + danh sách địa chỉ, **dạng JSON**
**Liên quan**: M13 (truy hồi) · M03 (client #1) · M15 (client #2..n)

**Vùng THỢ** — nó gọi model để dựng câu trả lời, tức nó làm egress.

> ⚠️ **Sửa 2026-08-31**: bản đầu xếp M14 vào LÕI. Sai. Luật vùng nói về
> **ai gọi RA ngoài**, không nói về ai gọi tới mình. Xếp nhầm vì nghĩ *"nó
> phục vụ web nên nó là lõi"* — trộn hai vế. Chatbot **phải** gọi model,
> nên nó không thể ở vùng có luật *"không bao giờ gọi ra Internet"*.

**Và đây là quyết định kiến trúc quan trọng nhất của đợt hai:**

> **M14 là service có API. Web là client thứ nhất, KHÔNG phải chủ sở hữu.**
> Nếu chatbot mọc trong `web/` thì mỗi kênh thêm vào là viết lại nó. Tách ra
> thì thêm kênh chỉ là thêm một adapter mỏng — đó là toàn bộ lý do *"core xong
> trước thì integration rẻ"*.

Metric bắt được nếu làm sai: **M7.4** (`curl` vào API trả JSON, không qua web)
và **M8.2** (kênh thứ hai tốn ≤20% công kênh thứ nhất).

→ PRD **U10** · proposal S13 · BRD B-A5

## M15_kenh — adapter kênh chat

**Làm gì**: gọi **RA** kênh lấy tin nhắn; dịch lệnh thành lời gọi API của LÕI;
dịch phản hồi thành tin nhắn.

**Vào**: tin nhắn từ kênh (long polling / gateway — **không mở cổng vào**)
**Ra**: lời gọi `127.0.0.1` tới M08 · tin nhắn trả về người gửi
**Liên quan**: M08 (API nạp — **đã có**) · M14 (hỏi đáp)

**Vùng BIÊN. Mỏng có chủ ý** — ba việc và chỉ ba: xác thực người gửi
(**allowlist**, `B-B4`) · dịch lệnh → API · dịch phản hồi → tin nhắn. Không
logic nghiệp vụ, không đọc `kb/`.

Thứ tự kênh: **Telegram → Discord → Zalo → FB**. Hai kênh đầu nhận tin bằng
cách **gọi RA** ⇒ một tiến trình local. Hai kênh sau đòi **webhook nghe VÀO**
⇒ hạ tầng riêng, khác hạng (`B-E4`).

→ PRD **U11** · proposal S14 · BRD B-B4, B-E1 bậc 1–2, B-E4

## M16_artifact — slide · giọng đọc · video

**Làm gì**: một bài `approved` → bản trình bày / bản đọc / bản video.

**Vào**: `slug` của bài đã duyệt
**Ra**: file trong `_media/` + bản ghi liên kết · log `sha256` đã gửi
**Liên quan**: M02 (nguồn) · M09 (kho hiện vật)

**Vùng THỢ.** Chạy **phút**, không phải giây ⇒ không nằm trong một HTTP request.

**Xếp cuối vì phụ thuộc**: cần corpus, cần M12 chạy tốt, tốn nhất, `gửi RA`
gắt nhất. Nguyên lý đáng giữ: artifact phải **quay ngược làm input** — bấm một
nút trong slide thì hỏi tiếp được, chứ không phải "sinh ra file rồi hết".

→ PRD **U12** · proposal S15 · BRD B-E1 bậc 4, B-E3

---

## Bảng module đợt hai

| Module | Vùng | Vào | Ra | Phụ thuộc |
|---|---|---|---|---|
| M12_chungcat | THỢ | slug nguyên liệu + byte | `.md` vào `_inbox/` | M01, M05 |
| M13_truyhoi | THỢ | `ban_ghi` + câu hỏi + phạm vi | đoạn + địa chỉ | M02 |
| M14_chatbot | **THỢ** | câu hỏi + phạm vi | JSON: trả lời + địa chỉ | M13 |
| M15_kenh | BIÊN | tin nhắn kênh | lời gọi `127.0.0.1` | M08, M14 |
| M16_artifact | THỢ | slug bài duyệt | file `_media/` | M02, M09 |
| **M17_cong** | **BIÊN** | HTTPS từ Internet | chuyển tiếp vào `127.0.0.1` | M08 |
| **M18_nguoidung** | LÕI | — (module NGANG) | hợp đồng 4 bảng tài khoản **+ `cai_dat`** | M08, M03 |
| *M19_baihoc* | *LÕI* | *— chưa thi công* | *tập nguồn có tên + có thứ tự* | *M14, M13, M03* |

⚠️ **M18 và M19 vào bảng này bằng `FR-048`, không qua s1–s5** — và hai cái vào
theo hai tư cách khác nhau:

**`M18_nguoidung` — giấy tờ đuổi theo một FR đã duyệt.** Nó không thêm phạm vi
nào: `prd.md:8` đã khai *"MỘT chủ dự án + 5 tài khoản đọc"* từ 2026-09-01, và
`FR-045` (đã duyệt) đã quyết bốn bảng + cổng U1–U7. Cái thiếu là **một cái tên
để `entities.*.owner` neo vào** — `FR-045` viết *"LÕI sở hữu"*, mà LÕI là một
**vùng tin cậy**, không phải một module. Tiền lệ: `M17_cong` cũng vào đúng đường
này, và cũng chỉ có dòng bảng chứ không có mục riêng.

**`M18_nguoidung` mở rộng, KHÔNG mở `M20_caidat`** *(2026-09-03, `proposal-3`)*.

`s1` tìm tiền lệ **tách** (Strapi: *"separation of concerns"*) nhưng đọc cả bài
thì lý do **không phải an ninh**. Và *"có hệ nào HỐI TIẾC vì gộp"* ⇒ **không tìm
thấy hối tiếc khai bằng chữ**.

Có **CVE** trả lời đúng câu hỏi: `CVE-2024-3283` → cửa
`/admin/system-preferences` (**cài đặt**), trường `multi_user_mode` (**chế độ
xác thực**), hệ quả **tạo được một admin**. `CVE-2026-32715` hai năm sau, **cùng
cặp cửa**: hai endpoint **generic** cho vai `manager` trong khi mọi bề mặt khác
chạm cùng setting đó chỉ cho `admin`.

⇒ Cái gây hại **không** phải hai thứ ở cùng một màn. Là **một endpoint generic
mang một quyền thô**.

**Quyết định**: **gộp MÀN, tách `viec`** — một màn, nhưng `moi-nguoi-moi` ·
`thu-hoi` · `xem-audit` · `sua-cai-dat` là **bốn `viec` riêng**, mỗi cái một
phép kiểm. `M20` **không đặt số**: hai module NGANG cùng đích `M03`+`M08` thì
ranh giới giữa chúng là **giấy**, và quyết muộn không đắt (`FR-051 §7`).

**`M19_baihoc` — GIỮ CHỖ, in nghiêng, chưa thi công.** Nó **là** một mở rộng
phạm vi, nên nó **chưa** truy về được PRD hay proposal — xem hai bảng truy ngược
dưới. Lý do khai sớm: `M14 AC-8.4` (đã viết, G6A xanh) hứa *"đúng MỘT hàm giải
`bot` → tập `doc_id`"*, và hôm nay **không có bảng nào đứng sau lời hứa đó**.
Không khai hình dạng thì ba module (M13, M14, M03) mỗi bên tự nghĩ ra một hình
dạng.

## Truy ngược — mọi scope-in đợt hai có module gánh

| Proposal | Hạng mục | Module gánh |
|---|---|---|
| S7 | FR *gửi RA* theo bậc | — (**artifact chính sách**, `FR-043`) |
| S8 | cú pháp địa chỉ + phép phân giải | **M01_core** |
| S9 | `citations_*` thành dữ liệu dẫn xuất | **M01_core** |
| S10 | bấm địa chỉ → mở nguồn | **M03_web** |
| S11 | worker chưng cất | **M12_chungcat** |
| S12 | index + truy hồi | **M13_truyhoi** |
| S13 | chatbot service | **M14_chatbot** |
| S14 | adapter kênh | **M15_kenh** |
| S15 | artifact | **M16_artifact** |
| S16 | ba vùng + cổng canh ranh giới | **M04_ci** (cổng) + mọi module (tuân) |
| — | **chủ cho bốn bảng tài khoản** | **M18_nguoidung** (`FR-048`; phạm vi từ `FR-045`) |
| P3 | **quản lý và cài đặt hệ thống** — ô quyền sửa được từ web | **M18_nguoidung** (`proposal-3`; **gộp**, không mở `M20`) |
| ❌ | *gom nhóm thành bài học / khóa học* | *M19_baihoc — **CHƯA có scope-in***|

⚠️ **Dòng cuối là một lỗ CỐ Ý để hở, không phải một dòng bị bỏ quên.**
`M19_baihoc` không truy về được mục nào của proposal đợt hai, vì proposal đó
**không có** hạng mục "gom nhóm". Luật riêng của s2 nói thẳng: *"Proposal duyệt
xong = phạm vi thô **CHỐT**. Đổi ⇒ FR, không âm thầm phình ở s3."*

⇒ Trước khi M19 thi công, phải có **FR mở rộng phạm vi** → proposal + PRD → rồi
s6. **KHÔNG** quay về s1: `research_summary §3.1` nguyên lý ① (*"phạm vi truy hồi
là control **hiển thị**"*) đã phủ đúng ý niệm này, và NotebookLM là một trong bốn
bản khảo đã chưng vào đó.

Để dòng này ở đây, hở, là cách nó **không** lặng lẽ trở thành hợp lệ.

## Truy ngược — mọi module đợt hai về PRD

| Module | PRD | BRD tiêu thụ |
|---|---|---|
| M01_core *(S8, S9)* | U8 | B-A5, B-A6 |
| M03_web *(S10)* | U8 | B-A5 |
| M12_chungcat | U9 | B-B1, B-E1, B-E2, B-E3 |
| M13_truyhoi | U10 | B-C2 |
| M14_chatbot | U10 | B-A5 |
| M15_kenh | U11 | B-B4, B-E1, B-E4 |
| M16_artifact | U12 | B-E1, B-E3 |
| M04_ci *(S16)* | — (cưỡng chế) | B-E2, B-E3 |
| **M17_cong** *(FR-045)* | U8–U12 *(mọi U cần account)* | B-D3b, B-B4, B-E1 bậc 3 |

**Không module nào không truy được về PRD** — điều kiện đóng G3.
`B-E5` (nghĩa vụ DLCN giai đoạn 2) **chưa có chỗ tiêu thụ**, và điều đó được
ghi nhận là **nợ đã biết** trong bảng truy của `brd.md`, không phải bỏ sót.

## Build order đợt hai

```text
S8 · S9   M01 — địa chỉ phân giải được + citations do máy tính
   ↓        0 LLM · 0 phụ thuộc · di trú ĐÚNG 1 bản ghi
S7        FR-043 — đã viết, đã duyệt
   ↓
S10       M03 — bấm địa chỉ mở nguồn
   ↓
S11       M12_chungcat
   ↓
S12       M13_truyhoi
   ↓
S13       M14_chatbot + web là client #1
   ↓         ═══ CORE XONG (PRD U10 chạy trên web) ═══
S14       M15_kenh — Telegram, rồi Discord
   ↓
S15       M16_artifact
```

Hai ghi chú thứ tự, cả hai đã tranh luận và chốt:

- **S8/S9 đứng TRƯỚC S11**, không phải sau. Chưng cất là một tính năng LLM; chạy
  nó trên một đường ray tự khai là **tự động hoá việc bịa**.
- **S14 sau CORE XONG** — quyết định của người dùng: *"core trước tích hợp sau"*.
