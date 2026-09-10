# Hợp đồng output

Một nguồn ra **một file `.md` duy nhất**. Không có file JSON đi kèm. Frontmatter gánh phần máy đọc, thân bài gánh phần người đọc.

Lý do gộp: duy trì hai artifact song song thì chúng sẽ lệch nhau, và không ai biết bản nào đúng. Frontmatter YAML validate được bằng JSON schema như thường — parse YAML rồi validate, không mất gì.

Quy ước ngôn ngữ: **khóa YAML tiếng Anh, mọi nội dung tiếng Việt.** Khóa tiếng Anh để code và schema xử lý được mà không phải encode dấu; nội dung tiếng Việt vì người đọc là người Việt.

## Tên file

```
kb/<source_type>/<slug>.md          # bản hiện hành
kb/<source_type>/<slug>.v1.md       # bản cũ giữ lại khi re-analyze
```

`slug` ổn định qua mọi lần re-analyze. Nhờ vậy `git diff` giữa hai bản đọc được bằng mắt, và diff đó tự nó là một loại nội dung: nguồn này đã đổi gì.

## Frontmatter

```yaml
---
# --- định danh ---
id: src_a1b2c3
slug: lightgbm-walk-forward-cv
source_type: paper                   # repo|paper|video|article|docs|announcement
url: https://arxiv.org/abs/2411.xxxxx
version_id: v2                       # commit SHA | arXiv ver | video id | ngày truy cập
protocol_version: "2.0"
analyzed_at: 2026-08-17

# --- nguồn ---
title: ...
author: ...
publisher: ...
published_at: 2025-11-03
size: 14 trang                       # hoặc "42 phút", "137 file"
license: CC-BY-4.0
decay_risk: medium                   # low|medium|high — tốc độ mục của lĩnh vực
archetype: null                      # chỉ điền khi source_type = repo

# --- tóm tắt máy đọc ---
one_liner: ...                       # ≤160 ký tự
concepts: [walk-forward-validation, leakage-prevention]
concepts_proposed: []                # chưa có trong danh mục, chờ duyệt
category: [data-ml]                  # CHỦ ĐỀ bài — danh mục ĐÓNG, xem dưới

# --- kiểm chứng ---
credibility_max: plausible           # mức CAO NHẤT trong file — chỉ để lọc, KHÔNG phải cổng chặn
corroboration_factor: 1.3            # 0.6|1.0|1.3|1.6
independent_sources: 2
contradicted_by: []

# --- đề xuất skill ---
skill_candidates:
  - capability: walk-forward-cv-design
    verdict: DEEPEN                  # NEW|DEEPEN|OVERLAP|OUT_OF_SCOPE
    target_skill: ml-engineer
    priority: 39
    credibility: plausible

# --- nguồn gốc bản phân tích ---
origin: pipeline                     # pipeline|external|manual
origin_tool: null                    # "gemini-2.5-pro", "codex", tên người...
origin_protocol_version: "2.0"       # null nếu không theo giao thức này
conformance: A                       # A|B|C — D thì không vào kho
ingested_at: 2026-08-17
citations_sampled: 0                 # bắt buộc ≥2 khi origin = external
citations_verified: 0
unverifiable_citations: false

# --- trạng thái duyệt ---
review_status: draft                 # draft|approved|edited|rejected
reviewed_by: null
reject_reason: null

# --- kiểm soát chất lượng ---
word_count: 1487
unresolved_count: 2
---
```

### Ba trường dễ bị bỏ qua

`protocol_version` — giao thức sẽ được tinh chỉnh. Không ghi version thì sau ba tháng bạn không biết bản nào sinh bằng luật nào, và không so sánh được bản cũ với bản mới.

`concepts_proposed` — tách riêng khỏi `concepts`. Xem mục danh mục kiểm soát bên dưới.

`reject_reason` — bắt buộc khi `review_status: rejected`. Đây là tín hiệu duy nhất để chỉnh cổng lọc ở Pass 4. Loại mà không ghi lý do thì cùng loại rác sẽ quay lại mãi.

`credibility_max` — mức cao nhất trong file, dùng để lọc và hiển thị. **Không phải cổng chặn.** Cổng khóa vào `skill_candidates[].credibility` của từng ứng viên. File có một khẳng định `verified` và bốn khẳng định `claimed` vẫn có `credibility_max: verified`, nên gác bằng trường này sẽ lọt.

`origin` — phân biệt file do pipeline sinh với file người dùng upload từ ngoài. Không có trường này thì sau sáu tháng kho sẽ trộn lẫn bản chất lượng cao với bản không rõ gốc và không lọc ra được. Chi tiết đường tĩnh xem `references/intake.md`.

## Chuẩn hóa URL trước khi đếm độc lập

Hệ số kiểm chứng chéo đếm theo **`url` đã chuẩn hóa của nguồn gốc**, không theo số bản phân tích. Ba bản phân tích về cùng một paper vẫn là một nguồn.

Chuẩn hóa: bỏ tham số theo dõi, bỏ `www`, thống nhất giao thức, quy `youtu.be` về `youtube.com/watch?v=`, quy `arxiv.org/pdf/x` về `arxiv.org/abs/x`, bỏ `.git` cuối URL repo.

Trùng `url` thì hợp nhất thành một node và giữ cả các bản trong `analyses[]`. Chênh lệch giữa chúng đáng đọc: chỗ nhiều AI đọc ra nhiều nghĩa khác nhau thường là chỗ nguồn thật sự mơ hồ, hoặc chỗ có một bản sai.

## Danh mục khái niệm kiểm soát

File `concepts.yaml` ở gốc kho:

```yaml
- id: walk-forward-validation
  label_vi: Kiểm định tiến dần theo thời gian
  aliases: [rolling-origin, time-series-cv, walk-forward-cv]
- id: idempotency
  label_vi: Tính lũy đẳng
  aliases: [exactly-once, dedupe, chống trùng bản ghi]
```

**Luật: không được tự sinh khái niệm mới.** Trường `concepts` chỉ chứa `id` đã có trong danh mục. Không tìm được mục phù hợp thì ghi vào `concepts_proposed`, và trường này **không tính vào** hệ số kiểm chứng chéo.

Duyệt lô đề xuất theo tuần: hoặc thêm vào danh mục, hoặc map thành alias của mục đã có.

Không có luật này, sau 50 nguồn sẽ có bốn node riêng cho cùng một khái niệm và hệ số kiểm chứng chéo trở nên vô nghĩa vì không gì gặp được nhau.

## Danh mục chủ đề `category` — danh mục KIỂM SOÁT, không phải enum schema

Trường `category` trả lời *"bài này thuộc **mảng** nào?"* — khác `concepts` (*"bài dạy **kỹ thuật** gì?"*) và `source_type` (*"nguồn ở **dạng** gì?"*).

**Chân lý là bảng `categories` trong `kb/_kho.sqlite`**, không phải schema. FR-034 đã BỎ enum khỏi `frontmatter.schema.json`; schema giờ chỉ ép dạng kebab-case, còn `validate.py --categories` mới là thứ so với bảng. Giá trị không có trong bảng thì validate **đỏ**, và **không có** đường `category_proposed` — thêm mảng mới là thao tác trên web, không phải sửa schema.

> **Bảng đang TRỐNG** sau lần dọn kho. Nghĩa là lúc này MỌI giá trị `category` > đều bị `--categories` từ chối. Sáu mảng dưới là bộ đã dùng trước khi dọn — > giữ ở đây làm gợi ý khi khai lại danh mục, KHÔNG phải danh sách đang có hiệu lực. > Kiểm thật trước khi dựa vào nó.

| `category` | Bao gồm |
|---|---|
| `agent-llm` | agent, LLM, prompt, quản lý ngữ cảnh, eval harness |
| `backend` | tích hợp, hàng đợi, ERP, API, lũy đẳng, nhất quán |
| `data-ml` | dự báo, đánh giá mô hình, chuỗi thời gian, đặc trưng |
| `ai-services` | OCR, RAG, trích xuất tài liệu, recommendation |
| `observability` | log, trace, metric, debug hệ phân tán |
| `delivery` | ước công, chọn công nghệ, quy trình, nghiên cứu thị trường |

**Không bắt buộc.** Bài `announcement` (ra mắt phiên bản) có thể không thuộc mảng nào — để `category: []`. Đừng nhồi một giá trị chỉ để lấp trường.

Một bài **được** thuộc nhiều mảng: một bài về trace LLM call vừa `observability` vừa `agent-llm`. Nhưng quá hai mảng thường là dấu hiệu chưa đọc kỹ.

**Khác `concepts` ở chỗ dùng để làm gì**: `concepts` vào công thức `corroboration_factor` — hai bài khác nguồn cùng nói `idempotency` thì khẳng định đó đáng tin hơn. `category` chỉ để chia kho và lọc; hai bài cùng `backend` không nói gì về độ tin cậy.

> Thêm một `category` mới phải mở FR sửa schema (khác `concepts_proposed` duyệt lô hàng tuần). Lý do: 6 giá trị thô, đổi mỗi năm một lần. Nếu thấy cần đổi hàng tháng thì chính điều đó là bằng chứng danh mục chia sai — mở FR nhìn lại, đừng nhồi vào mảng gần nhất.

## Ngân sách từ

Trần mềm 1500 từ, trần cứng 1800. Vượt trần cứng thì nén, không được nộp.

| Mục | Từ |
|---|---|
| Hộp 60 giây | 60 |
| 1. Overview | 110 |
| 2. Bối cảnh | 110 |
| 3.1 Đầu vào | 240 |
| 3.2 Process | 300 |
| 3.3 Output | 80 |
| 3.4 Tinh túy | 340 |
| 4. Ý nghĩa thực tế | 100 |
| 5. Rủi ro và tầm nhìn | 140 |

Phần dẫn nhập (mục 1 + 2) là **220 trên ~1480, tức 15%**. Cổng đặt TRẦN ở
**25%** — không phải sàn. Bản phân tích nào có mục 1–2 phình ra là bản đang viết
lại phần dẫn nhập thay vì đọc thật, và đó là thứ đo được nên nó thành cổng.

Vì sao là trần chứ không phải sàn trên phần lõi: mục 3 gộp cả bốn mục cũ (bản đồ,
trục khái niệm, cơ chế, tinh túy) nên nó tự nhiên đã ~65% thân bài. Một sàn trên
nó luôn thoả, tức cổng không bao giờ đỏ.

## Trích dẫn

Để trần trong ngoặc vuông, **không dùng link markdown**:

```
[retry.py:44-71]      repo
[12:04–13:30]         video
[§4.2 Bảng 3]         paper
[#backpressure ¶3]    article, docs
[v2.4.0 § Breaking]   announcement
```

Lớp render tự dựng URL đầy đủ từ `url` + `version_id`. Giữ file `.md` sạch và portable, và link không hỏng khi repo đổi nhánh.

Khẳng định không có địa chỉ thì mở đầu bằng `[suy đoán]`.

## Thân bài

Năm mục, trong đó mục 3 có bốn mục con — **tên mục không bao giờ đổi theo loại
nguồn**. Nội dung mới đổi: mục 3.2 với repo là đường đi dữ liệu, với paper là
chuỗi lập luận, với video là dòng luận điểm. Cùng chỗ, cùng tên, khác bản chất.
Đây là cách giữ format thống nhất mà không ép sai bản chất từng loại.

Khung này khai ở `assets/khung-than-bai.json` và `scripts/validate.py` đọc từ đó.
Đổi khung thì sửa file khai, không sửa tài liệu này rồi hy vọng hai bên khớp —
trước FR-036 khung được gõ tay ở sáu chỗ và đã trôi thành HAI bộ tên khác nhau.

```markdown
# <Tiêu đề — một mệnh đề mô tả nguồn này là gì>

> **60 giây**
> <Vấn đề nó giải. Cách tiếp cận đặc trưng. Ai nên quan tâm.>
> <Với video: tổng thời lượng và 2–3 mốc đáng xem nhất.>

## 1. Overview
Một đoạn. Nếu chỉ nhớ được một điều thì nhớ điều này.

## 2. Bối cảnh
Vấn đề tồn tại trước khi có nguồn này. Cách giải cũ và chỗ chúng đau.
Không viết lại abstract hay README.

## 3. Nội dung

### 3.1 Đầu vào
Nguồn này nhận vào cái gì: bản đồ các khối, trục khái niệm, tiền đề kỹ thuật.
Bảng bản đồ tối đa 8 dòng — nhiều hơn thì gom nhóm. Trục khái niệm 3–5 mục,
mỗi mục: mô hình hoá gì, ai dùng, bỏ đi thì sập gì.

### 3.2 Process
2–3 đường truy vết, mỗi đường các bước đánh số, mỗi bước một địa chỉ.
Ghi rõ chỗ đứt gãy nếu có — nơi kết luận vượt quá bằng chứng. **Đòi locator.**

### 3.3 Output
Nó tạo ra cái gì, đo được ở đâu. Với repo: file/bảng/trạng thái nó ghi ra.
Với paper: số liệu và điều kiện đo. **Đòi locator.**

### 3.4 Tinh túy
Tối đa 5 mục, format cứng (xem bên dưới). **Đòi locator.**

## 4. Ý nghĩa thực tế
Dùng được vào việc gì, và MỘT ví dụ thực tế. **Đòi locator** — một ví dụ không
có địa chỉ là một ví dụ bịa.

## 5. Rủi ro và tầm nhìn
| Vấn đề | Loại | Địa chỉ |
|---|---|---|
Khẳng định chưa kiểm chứng, xung đột lợi ích, số liệu thiếu điều kiện đo,
nội dung đã cũ, nguồn phản biện. Kèm một câu **tầm nhìn**: thứ đáng giữ khi
nguồn này trôi.
```

### Format cứng cho mục tinh túy (3.4)

Cả người lẫn agent đều đọc mục này, nên nó không được tự do:

```markdown
#### 3.4.1 <Phát biểu một câu, bắt đầu bằng động từ nếu là skill>
- **Không hiển nhiên vì:** <cổng 1 — vì sao người có chuyên môn không tự nghĩ ra trong 10 phút>
- **Chuyển giao:** <cổng 2 — bối cảnh khác áp dụng được>
- **Tin cậy:** plausible · 2 nguồn độc lập
- **Bằng chứng:** [retry.py:44-71] [§4.2]
- **Loại:** skill
```

Trường `Loại` là `knowledge` hoặc `skill`. Phép thử: nhét phát biểu đó vào system prompt của một agent — hành vi có đổi không? Có là skill, không là knowledge.

## Danh sách kiểm trước khi nộp

- [ ] Frontmatter validate được với `assets/frontmatter.schema.json`
- [ ] `word_count` dưới 1800
- [ ] Mục 1 + mục 2 (dẫn nhập) KHÔNG quá 25% tổng số từ
- [ ] Mọi khẳng định có địa chỉ hoặc tiền tố `[suy đoán]`
- [ ] Mọi `concepts` đều có trong `concepts.yaml`
- [ ] Số liệu nào cũng có điều kiện đo, hoặc bị loại
- [ ] Mục 6 không quá 5 mục, mỗi mục đủ 5 dòng bullet
- [ ] `review_status: draft` — chỉ người mới được đổi trường này
