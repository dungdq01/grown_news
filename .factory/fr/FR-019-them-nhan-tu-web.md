# FR-019 — Thêm nhãn từ web: mở đường ghi CHỈ-THÊM vào danh mục kiểm soát

mở_bởi: người dùng, 2026-08-19 ("user muốn xem danh sách category / concept ở web và thêm ở đó thôi, không phải lúc nào cũng có PC để chạy code hay mở source ra")
tới: s6 (`06_modules/M02_kb/rules.md` M02-R3 — FROZEN) · s4 (`04_system/security_baseline.md` §5.1, §6) · s3 (`.claude/settings.json` deny S1, `FROZEN.lock`)
mức: đổi BỀ MẶT cưỡng chế của một rule bất biến cấp module
trạng_thái: **DUYỆT** 2026-08-19 — người dùng: "Làm xong đi rồi chúng ta sửa sau, UI còn phải sửa nhiều đấy". Duyệt CẢ HAI đường (concepts + categories), không chỉ concepts.

## Vấn đề

Thêm một khái niệm vào danh mục hiện **bắt buộc mở source code**: sửa
`kb/concepts.yaml` bằng editor, rồi chạy `check_frozen.py --ky`. Thêm một chủ đề
còn nặng hơn — sửa `enum` trong `frontmatter.schema.json` **và** `kb/categories.yaml`.

Người dùng nói rõ họ không muốn vậy. GĐ A (WL-01K9J9XEMNHAN) đã giải phần **xem**:
màn `/khai-niem/` giờ hiện đủ 22 khái niệm + 6 chủ đề kèm nhãn tiếng Việt. FR này
là phần **thêm**.

## Ba phần trong yêu cầu — chỉ MỘT phần cần FR

| Việc | Trạng thái | Cần FR? |
|---|---|---|
| Xem danh mục trên web | ✅ GĐ A đã làm | không |
| Gán nhãn có sẵn cho bài từ web | ✅ đã chạy từ FR-011 (`inline.ts:1316-1319`) | không |
| Đề xuất khái niệm mới từ web | ✅ đã chạy — ô `#f-cptmoi` → `concepts_proposed` | không |
| **Kết nạp đề xuất vào `concepts.yaml`** | ❌ chặn | **FR này** |
| **Thêm giá trị `category`** | ❌ chặn nặng hơn | **FR này** |

Đường đề xuất đã tồn tại và đúng thiết kế — `kb/concepts.yaml:3` chỉ định:
*"Không tìm được mục phù hợp thì ghi vào `concepts_proposed`, chờ người duyệt."*
Cái thiếu là **bước duyệt cuối** phải mở editor.

## Vì sao phải mở FR — và phải sửa một điều đã tin sai

### Rào chắn thật KHÔNG phải deny S1

`security_baseline.md:68-77` (§5.1) đã ghi, như một **sự việc đã xảy ra**:

> deny khai `Write(./06_modules/**/spec.md)` và 5 path khác. Nhưng **21/21 file
> trong deny list đã bị ghi qua Bash heredoc** mà không bị chặn lần nào — kể cả
> `frontmatter.schema.json` (2 commit) và `kb/concepts.yaml`.

Deny S1 chỉ chặn tool `Write` của agent. Một tiến trình Node (`server.mjs`) không đi
qua lớp quyền đó. **Nên xoá dòng deny cũng không "mở" thêm gì về mặt kỹ thuật** —
nhưng nó là *lời khai ý định*, và bỏ nó mà không có FR là lách.

Ba lớp thật:

| Lớp | Chặn được Node ghi? | Ở đâu |
|---|---|---|
| S1 deny | **KHÔNG** | `.claude/settings.json:9` |
| S3 `check_frozen.py` | có, **hậu kiểm** | `FROZEN.lock:26` |
| **M02-R3 (luật)** | **có — rào thật** | `06_modules/M02_kb/rules.md:26-33` |

### M02-R3 nói gì, và vì sao nó KHÔNG cấm việc này

```yaml
- id: M02-R3
  vi_phạm: "concepts.yaml bị sửa bởi máy, không qua người"
  bề_mặt: S1
  why: >
    Danh mục đóng chỉ có giá trị khi cùng một ý có cùng một tên. Cho máy thêm
    thì sau 60 bài có rag / RAG / retrieval-augmented / rag-pipeline —
    bốn tên một thứ, bộ lọc ra bốn tập rời nhau.
    M07 được ĐỀ XUẤT gộp, không được ghi.
```

Vi phạm là *"sửa **bởi máy, không qua người**"* — không phải *"sửa qua HTTP"*. Lý do
nêu ra là **máy tự sinh tên**, dẫn tới bốn tên một thứ. Người bấm nút không tạo ra
lỗi đó.

Baseline đã dùng **đúng lập luận này** cho nút Duyệt — thứ nhạy cảm hơn nhiều
(`security_baseline.md:24-26`):

> FR-011 thêm bề mặt (nút duyệt trên web) nhưng **không thêm chủ thể**: endpoint chỉ
> phản ứng request người bấm, và 3 trường M1 không có default trong code (M08-R3)
> — máy không có gì để điền vào chỗ chỉ người trả lời được.

FR này áp cùng khuôn: **thêm bề mặt, không thêm chủ thể.**

### Nhưng có một chỗ tôi KHÔNG được dùng lại

`security_baseline.md:114-116` giới hạn rủi ro:

> **Chấp nhận rủi ro có ý thức**: mức tác động tối đa là một bài rác trong `draft`.

Giới hạn này **chỉ phủ nội dung bài**. Một nhãn rác trong `concepts.yaml` không phải
bài rác — nó là **lỗi tách bộ lọc**, đúng thứ M02-R3 sinh ra để chặn, và nó ảnh
hưởng mọi bài đã và sẽ có. **Không được viện câu đó để biện minh FR này.** Baseline
cần một câu giới hạn riêng (xem *Đổi thì* bên dưới).

### Lý do THẬT của rào, ghi lại cho đúng

`project_map.yaml` từng ghi `concepts` *"dùng tính corroboration_factor"*. Tôi đã đo:
`grep corroboration` trong `core/src/`, `05_intake/`, `06_skillgen/`, `07_curate/` →
**0 kết quả**. Không mã nào tính nó; nó là số LLM tự khai, suy từ
`independent_sources` (đếm theo `url_normalized`). Câu đó đã sửa ở
WL-01K9J8DANHMUC.

**Lý do thật, và đủ mạnh**: danh mục mịn trôi thì bộ lọc mất nghĩa — đúng cái `tags`
đã làm trước FR-009 (`quan-ly` tiếng Việt lọt giữa 11 tag tiếng Anh, 7/12 tag dùng
một lần). Đó là lý do FR này **chỉ mở CREATE**, không mở UPDATE/DELETE.

## Phạm vi

### Được mở

| | |
|---|---|
`POST /api/concepts` | thêm một khái niệm — đòi bằng chứng ≥ `concept_merge_min` bài |
`POST /api/categories` | thêm một chủ đề — ghi **cả** enum schema **và** `categories.yaml` |

### KHÔNG mở — vẫn phải qua FR

- **Xoá** nhãn · **đổi tên** id · **sửa** `label_vi` của mục đã có · **sửa `aliases`**.
  Đây là thứ làm bài cũ trỏ vào nhãn không tồn tại. `PUT`/`PATCH`/`DELETE` trên hai
  đường trên trả **404** — *không có*, chứ không phải *chưa làm*.
- Bundle tĩnh vẫn **read-only tuyệt đối**: nút Kết nạp chỉ hiện khi `API_CO`
  (`inline.ts:865`). Mở file tĩnh không có server ⇒ không thấy nút.
- Server vẫn bind cứng `127.0.0.1` (M08-R1 **không đổi**). FR này **không** giải
  chuyện "không có PC" — muốn xem từ điện thoại là FR-020 riêng, đụng B-D3.

## Đổi thì

| File | Đổi gì | Frozen? |
|---|---|---|
`06_modules/M02_kb/rules.md` | M02-R3 `bề_mặt: S1` → `S3 + S2`; `vi_phạm` nói rõ "máy TỰ SINH" vs "người bấm qua endpoint" | **CÓ** |
`04_system/security_baseline.md` | §5.1 thêm mục "đường ghi danh mục"; thêm câu giới hạn rủi ro RIÊNG cho danh mục (không dùng chung với "một bài rác trong draft") | không |
`core/assets/frontmatter.schema.json` | `enum` category — chỉ khi thêm chủ đề | **CÓ** |
`kb/concepts.yaml` | append mục mới | **CÓ** |
`.claude/settings.json` | giữ nguyên deny (nó là lời khai ý định, và không cưỡng chế được đường Node) — **ghi rõ trong worklog là CỐ Ý giữ** | — |
`FROZEN.lock` | ký lại sau mỗi lần thêm | — |
`web/test/no-write-path.test.js:35` | whitelist thêm `/api/concepts` + `/api/categories` | không |
`project_map.yaml` | `kb_writers` ghi rõ M08 ghi cả danh mục | không |

### Mất gì — nói thẳng

**`check_frozen` không còn là rào tuyệt đối cho `concepts.yaml`.** Server tự chạy
`--ky` sau khi ghi, nên hash luôn khớp. Đây là **giảm một lớp**, không phải giữ nguyên.

Bù: `--ky` tự động **chỉ** chạy trong đường `POST` đã qua 5 răng dưới, và mỗi lần
thêm ghi một dòng vào `kb/_nhat-ky-danh-muc.md` — hồ sơ *ai thêm nhãn gì, bằng
chứng nào*. Đó là thứ frozen vốn bảo vệ: không phải bytes, mà là **có người chịu
trách nhiệm cho mỗi mục**.

## Chặn bù — 5 răng, đều kiểm được bằng máy

| # | Răng | Test |
|---|---|---|
1 | **Chỉ-thêm**: `PUT`/`PATCH`/`DELETE` → 404 | 3 request, cả ba 404 |
2 | **Không trùng**: id đã có (kể cả trùng `aliases`) → 409 | POST hai lần |
3 | **Đòi bằng chứng** (concepts): id phải ở `concepts_proposed` của ≥ `concept_merge_min` bài; ngưỡng đọc từ `07_curate/thresholds.yaml`, dùng lại logic `curate.py:92-95` | POST id chỉ có ở 1 bài → 422 |
4 | **Không default** (M08-R3): `label_vi` do **người** khai, thiếu → 422. Khuôn `status.mjs:45-58` | POST không `label_vi` → 422 |
5 | **Nguyên vẹn phần cũ**: parse/ghi bằng lib `yaml` thật, **không** regex. `aliases` của 22 mục cũ còn nguyên | diff file trước/sau |

Thêm cho `categories`: ghi **hai** file trong một thao tác, rồi chạy
`check_danh_muc.py`. Đỏ ⇒ **rollback cả hai**, trả 500. Không để kho ở trạng thái
nửa vời.

Mọi ghi đi qua `dungchung.mjs` (`api-guard.test.js:37-41` đòi handler không cầm
`writeFileSync`). Lưu ý `api-guard.test.js:52-55` đòi `renameSync` **đúng 3 lần** —
thêm ghi atomic thứ 4 làm test đỏ; hoặc dùng lại đường có sẵn, hoặc sửa số **kèm
lý do trong FR này**.

### Điểm yếu phải khai — `category` không có bằng chứng

`concepts` có `concepts_proposed` nên đòi được "≥2 bài đã dùng". `category`
**không có** `category_proposed` ⇒ răng số 3 **không áp được**. Bù bằng: xác nhận 2
bước + đòi `label_vi` + `gom`. Đây là chỗ yếu nhất của FR, không giấu.

Cân nhắc khi duyệt: có thể **chỉ mở `concepts`** ở lượt này và để `category` sau —
`category` hiếm đổi (6 giá trị, `project_map.yaml:220` ghi *"hiếm đổi, nên thêm mục
mới phải qua FR"*), và chân lý của nó là schema frozen mà 7 module bám vào.

## Thi hành

Chưa. Đợi người dùng duyệt.

Nếu duyệt: `web/api/danhmuc.mjs` (mới) + route + nút Kết nạp ở `/khai-niem/` + 6 test
(5 răng + rollback) + worklog `amend-frozen`. Ký lại `FROZEN.lock` **sau** khi FR
chuyển trạng thái, không trước.

Nếu bác: GĐ A vẫn đứng độc lập — màn xem danh mục không phụ thuộc FR này.
