# FR-015 — Contract v5: bản `approved` phải đủ 3 trường M1

mở_bởi: claude (phát hiện khi chạy full gauntlet), 2026-08-19
tới: s5 (`05_uiux/contracts/analyses.sample.v4.json` — FROZEN)
mức: `validate kb-mock/ --strict` đang ĐỎ 37 lỗi
trạng_thái: ĐÃ THI HÀNH — 2026-08-19, worklog WL-01K9J7CONTRACTV5

## Vấn đề

`validate.py kb-mock/ --strict` → **14 file · 37 lỗi**. Truy được nguồn gốc và
nó không nằm ở `kb-mock/`:

| Loại lỗi | Số | Nguồn |
|---|---|---|
| thiếu `insight_new` `skill_installed` `review_minutes` | 21 | contract |
| `word_count` khai lệch số đếm được | 14 | contract |
| `id: src_qz001` sai `^src_[a-z0-9]{6,}$` (chỉ 5 ký tự sau `src_`) | 1 | contract |
| Spot-check trượt 1/2 locator | 1 | **cố ý** — ca âm của cổng 7 |

`kb-mock/` sinh từ `analyses.sample.v4.json` bằng `core/tools/sinh_kb_mock.py`
nên nó **thừa hưởng** lỗi, không tự gây ra.

## Lỗi có từ FR-001, không phải từ FR-009

Kiểm `analyses.sample.v3.json` (bản trước FR-009 đổi `tags`→`category`): cũng
thiếu **đúng 6 bản**. Nghĩa là lỗi phát sinh khi FR-001 thêm 3 trường M1 vào
schema và ràng buộc `approved ⇒ required` — nhưng **không cập nhật contract**.

Từ đó tới nay contract nói dối: nó khai 9 bản `approved` mà 6 bản không thoả
chính schema mà nó phải làm mẫu cho.

**Vì sao không ai thấy sớm hơn**: `validate.py` chạy trên `kb/` (0 bài) ở mọi
lệnh trong `RUNNING.md` và CI. `kb-mock/` chưa từng được validate — nó mới tách
ra thành kho riêng gần đây.

## Giá trị điền vào: có căn cứ, không bịa

3 trường M1 là **lời khai của người** (`M08-R3`, `B-B1`). Trong contract chúng là
*dữ liệu mẫu*, nên phải thoả hai điều: hợp schema, **và** làm M1 đạt ngưỡng —
nếu không thì mọi test đo M1 trên mẫu sẽ luôn fail.

Ngưỡng (`proposal.md:85-87`): `M1.1 ≥3/10 insight_new` · `M1.2 ≥1/10
skill_installed` · `M1.3 trung bình <20 phút`.

Căn cứ gán: **`priority` + `verdict`** của chính bản đó.

| slug | priority | verdict | `insight_new` | `skill_installed` | `review_minutes` |
|---|---|---|---|---|---|
| walk-forward-validation-k-fold | 65 | DEEPEN | **true** | **true** | 18 |
| quan-ly-ngu-canh-agent-production | 60 | DEEPEN | **true** | false | 17 |
| khu-trung-ban-ghi-khoa-luy-dang | 50 | DEEPEN | **true** | false | 14 |
| storm-multi-perspective | 0 | — | false | false | 12 |
| storm-multi-perspective-codex | 0 | — | false | false | 8 |
| blog-prompt-caching | 0 | OUT_OF_SCOPE | false | false | 6 |

Lý lẽ: `priority ≥ 50` với verdict `DEEPEN` nghĩa là bản đó **có ứng viên skill
đáng làm** — đúng định nghĩa "insight chưa biết và sẽ hành động theo".
`priority 0` thì không.

`skill_installed: true` cho **đúng một** bản — bản `priority` cao nhất (65). M1.2
chỉ đòi ≥1/10, và khai nhiều hơn là nói dối về thứ M1.2 đo (*"đã sinh skill VÀ
cài VÀ output agent đổi tốt hơn — cả ba điều"*).

`review_minutes` tỷ lệ nghịch với `word_count`: bài dài đọc lâu hơn. Trung bình
9 bản = **12.3 phút**, dưới ngưỡng 20.

Kết quả trên 9 bản `approved`: **4/9 insight_new** · **1/9 skill_installed** ·
**TB 12.3 phút** — M1 đạt cả ba vế.

## Hai lỗi còn lại

**`word_count`** — sinh lại bằng `validate.py --fix`. Đây là **dữ liệu dẫn xuất**
(`M01-R2`: `--fix` chỉ được sửa `word_count`, không bao giờ chạm `credibility`
`verdict` `concepts`), nên máy tính là đúng việc.

**`id: src_qz001`** → `src_qz0001`. Pattern đòi ≥6 ký tự `[a-z0-9]` sau `src_`;
bản này có 5. Thêm một chữ số, không đổi ý nghĩa.

**Spot-check trượt KHÔNG sửa** — đó là ca âm cố ý của cổng 7, nằm ở bản
`review_status: rejected`. Sửa nó là bỏ mất một phép kiểm.

## Đổi thì

Nếu sau này nạp bài thật và M1 **không** đạt, contract vẫn đạt — nó là mẫu, không
phải số đo thật. Đừng đọc số của contract như kết quả M1 của dự án;
`07_curate/curate.py` đo trên `kb/`, không trên `kb-mock/`.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `05_uiux/contracts/analyses.sample.v5.json` | MỚI — 6 bản thêm 3 trường M1, sửa `id`, `word_count` đúng |
| `core/tools/sinh_kb_mock.py` | trỏ v4 → v5 |
| `web/test/_seed.mjs` · `page-weight.test.js` | trỏ v5 |
| `kb-mock/**` | sinh lại |
| `06_modules/M03_web/spec.md` (FROZEN) · `project_map` · `RUNNING.md` · README | tham chiếu v5 |
| `FROZEN.lock` | ký lại sau khi FR duyệt |

### Nợ nên trả cùng — cổng máy chưa canh `kb-mock/`

Không lệnh nào trong `RUNNING.md` hay CI chạy `validate kb-mock/ --strict`. Đó là
lý do lỗi này sống được lâu. Thêm nó vào bảng lệnh + CI là việc nhỏ và chặn được
đúng lớp lỗi vừa gặp.
