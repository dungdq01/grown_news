# FR-009 — `category` thay `tags`: một trường một vai

mở_bởi: người dùng, 2026-08-19
tới: s6 (`core/assets/frontmatter.schema.json` — FROZEN) · s3 (PRD U6 · BRD B-C2)
mức: đụng schema 7 module bám vào — chặn việc lọc theo chủ đề
trạng_thái: MỞ — chờ người duyệt

## Vấn đề

Người dùng nói: *"khái niệm và category đang dễ nhầm. 'Khái niệm' ta có thể hiểu —
cái khái niệm trong ngành; còn 'category' là chủ đề của bài viết đó."*

Định nghĩa này đúng, và đo được rằng hệ thống **đã có** vai "chủ đề" nhưng để nó
trong một trường không tên vai, không danh mục, không cổng kiểm.

### Bằng chứng: `tags` đang lẫn hai vai và đã trôi dạt

12 tag trên 13 bản ghi sample (`analyses.sample.v3.json`):

| Tần suất | Tag | Là gì |
|---|---|---|
| 4× | `llm` | **chủ đề** |
| 3× | `agent` | **chủ đề** |
| 2× | `backend` `research` `observability` | **chủ đề** |
| 1× | `time-series` `forecasting` `queue` `production` `ssg` `web` | từ khoá lẻ |
| 1× | `quan-ly` | **trôi dạt** — tiếng Việt giữa 11 tag tiếng Anh |

Ba dấu hiệu:

1. **Lẫn vai**: 5 tag xuất hiện ≥2 lần hành xử như danh mục chủ đề; 7 tag còn lại
   là từ khoá dùng một lần. Cùng một trường, hai vai khác nhau.
2. **Trôi dạt đã bắt đầu**: `quan-ly` là tiếng Việt. Đúng thứ M02-R3 dự báo:
   *"sau 60 bài có rag / RAG / retrieval-augmented / rag-pipeline — bốn tên một
   thứ, bộ lọc ra bốn tập rời nhau."*
3. **Schema không định nghĩa vai**: `tags` (dòng 134-139) là trường **duy nhất**
   trong 41 property không có `description`. Không enum, không pattern, không
   maxItems. Nó chưa bao giờ được quyết định là gì.

### Vì sao `concepts` không phủ được việc này

`concepts` = **khái niệm trong ngành** (`idempotency`, `walk-forward-validation`) —
một kỹ thuật cụ thể, có thể chuyển giao, dùng để tính `corroboration_factor`.

`category` = **chủ đề bài viết** (`ai-llm`, `backend`) — bài này nói về mảng nào.

Hai câu hỏi khác nhau: *"bài này dạy kỹ thuật gì"* vs *"bài này thuộc mảng nào"*.
Một bài có thể thuộc chủ đề `ai-llm` mà mang khái niệm `eval-harness`; một bài
khác cùng chủ đề lại mang `context-management`. Gộp hai chiều thì mất một chiều.

Đo thêm: **không tag nào trùng tên concept nào** trong 13 bản ghi — hai chiều đã
phân vai sạch trên thực tế, chỉ chưa được phân vai trong schema.

## Danh mục `category` — không phát minh, lấy từ thứ đã có

Dự án đã có **hai** bộ phân loại chủ đề ở tầng cao, gần trùng nhau:

| `skill-manifest.json` `domain` | `kb/concepts.yaml` nhóm | tag thực tế |
|---|---|---|
| `agent-engineering` | AI agent và LLM | `llm`(4) `agent`(3) |
| `backend-integration` | hệ thống và tích hợp | `backend`(2) `queue` |
| `ai-solutions` | dữ liệu và ML | `time-series` `forecasting` |
| `ai-services` | tài liệu và OCR | *(chưa có bài)* |
| `solution-consulting` | — | `quan-ly` `research`(2) |
| — | kỹ thuật phân tích | `observability`(2) |

Đề xuất **6 giá trị**, hợp nhất ba bộ trên:

```yaml
agent-llm        # agent, LLM, prompt, context — gộp llm + agent (7 lần dùng)
backend          # tích hợp, hàng đợi, ERP, API — backend + queue
data-ml          # dự báo, đánh giá mô hình, chuỗi thời gian
ai-services      # OCR, RAG, trích xuất tài liệu, recommendation
observability    # log, trace, metric, debug hệ phân tán
delivery         # ước công, chọn công nghệ, quy trình — quan-ly + research
```

**Vì sao 6 mà không nhiều hơn**: `chart-palette.json` (frozen) có **4 màu
categorical** với luật *"Series thứ 5 gộp vào 'khác', không sinh hue mới"*. Vẽ
category lên chart thì 6 nhóm là 4 màu + "khác" — vẫn trong luật. Trên 20 nhóm
thì mọi biểu đồ theo category thành vô nghĩa.

`ssg` `web` `production` không lên danh mục: chúng là từ khoá lẻ, và bài Quartz
plugin API thực chất thuộc `delivery` (chọn công nghệ).

## Cơ chế nhập — cưỡng chế ở schema, không ở UI

Người dùng chọn: **schema enum, chặn ở validate**. Lý do đúng: đó là tầng phủ được
**cả ba đường nạp** — skill sinh, `_inbox/` gate, và sửa tay. Dropdown trên form
CRUD (bước 5 của plan) là tiện lợi thêm, không phải cơ chế chặn.

Cùng khuôn với `concepts` đang chạy — `validate.py:188`:

```python
# 5 — concepts phải nằm trong danh mục kiểm soát
for c in fm.get("concepts") or []:
    if c not in concepts:
        errs.append(f"concepts · '{c}' không có trong concepts.yaml — …")
```

Khác một điểm quan trọng: `concepts` để danh mục trong **file rời**
(`kb/concepts.yaml`) vì nó dài (22 mục) và người thêm thường xuyên. `category`
chỉ 6 giá trị và **hiếm khi đổi** — đặt thẳng `enum` trong schema là đủ, không cần
file thứ hai và cổng thứ hai.

> **Hệ quả có ý thức**: thêm một category mới phải mở FR (sửa schema frozen), chứ
> không duyệt lô hàng tuần như `concepts_proposed`. Đây là chủ ý — 6 nhóm chủ đề
> đổi mỗi năm một lần thì FR là đúng nhịp; nếu hoá ra cần đổi hàng tháng thì
> chính điều đó là bằng chứng danh mục chia sai, và cần một FR nhìn lại.

## Phạm vi

| Đổi | Không đổi |
|---|---|
| `tags` → `category`, thêm `enum` 6 giá trị + `description` | `concepts` và `concepts_proposed` — nguyên vẹn |
| `validate.py` thêm cổng kiểm category | `kb/concepts.yaml` — không chạm |
| Sidebar lọc thêm tầng chủ đề | `source_type` — nguyên vẹn |
| `analyses.sample.v3.json` → v4 (đổi tên trường) | công thức `priority`, `corroboration_factor` |

**Ba chiều sau FR này**, mỗi chiều một câu hỏi:

```
source_type  →  "nguồn này ở dạng gì?"      repo paper video article docs announcement
category     →  "bài này thuộc mảng nào?"   6 giá trị, enum đóng trong schema
concepts     →  "bài dạy kỹ thuật gì?"      22 mục, danh mục rời, duyệt lô
```

Không có chiều thứ tư. `tags` **bỏ hẳn** — mọi giá trị hiện có map được vào
`category` hoặc là từ khoá dùng một lần không đáng giữ.

## Đổi thì

Nếu sau 20 bài thật thấy 6 nhóm chia sai (một nhóm chiếm 15/20 bài, hoặc thường
xuyên phải bỏ trống), thì đó là bằng chứng cần FR nhìn lại — không phải lý do nới
enum tại chỗ.

Nếu hoá ra cần chủ đề tự do cho từ khoá lẻ, mở lại `tags` như trường **thứ tư** —
nhưng lúc đó phải trả lời được vì sao nó không trôi dạt lần nữa.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `core/assets/frontmatter.schema.json` | `tags` → `category`, enum 6 + description. **FROZEN** ⇒ `--ky` sau khi duyệt |
| `core/skill-src/frontmatter.schema.json` | đồng bộ (bản này đang lệch 3 trường, xem nợ dưới) |
| `core/src/source_distiller/validate.py` | cổng 5b: category ngoài enum ⇒ lỗi kèm danh sách hợp lệ |
| `05_uiux/contracts/analyses.sample.v3.json` | → **v4**: 13 bản ghi đổi `tags` → `category` |
| `kb/README.md` | mục mới: ba chiều phân loại khác nhau chỗ nào |
| `03_docs/prd.md` U6 | tra cứu theo ba chiều, không hai |
| `web/plugins/home-pages/index.ts` | sidebar thêm tầng `category`; `.tgs` đổi vai |
| `web/test/filter-counts.test.js` | thêm phép kiểm tầng category |
| `project_map.yaml` `entities.Analysis.fields` | ghi `category` |

## Nợ phát hiện khi khảo sát — nên xử lý cùng

1. **Hai bản schema đã lệch**: `core/skill-src/frontmatter.schema.json` có 38
   property, `core/assets/` có 41 — bản `skill-src` **thiếu cả 3 trường M1**
   (`insight_new`, `skill_installed`, `review_minutes`) và ràng buộc `approved`.
   Bản `skill-src` không nằm trong `FROZEN.lock`. Skill sinh file theo bản đó sẽ
   không biết về FR-001.
2. **FR-001 và FR-002 không tồn tại trên đĩa** dù được tham chiếu 8 chỗ trong
   tài liệu (schema `$comment`, `M02_kb/rules.md:39`, `RUNNING.md:137`…).
