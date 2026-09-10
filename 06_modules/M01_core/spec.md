# M01_core — spec

> **Module as-built.** Spec này viết *sau* code, nên nó mô tả cái **đang chạy**,
> không phải cái mong muốn. Chỗ nào code chưa có, ghi rõ là nợ chứ không viết như
> thể đã xong.
>
> Nguồn đối chiếu: `core/src/source_distiller/validate.py` · 19 test trong
> `core/tests/test_gates.py`.

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | giao thức 6 pass, 8 cổng máy, `word_count`, cấu trúc thân bài — **khai ở `core/assets/khung-than-bai.json`** (FR-036), hiện 5 mục với §3 gồm bốn mục con |
| **Không sở hữu** | `Analysis`/`Concept` (M02) · verdict skill (M06) · render (M03) |
| **Vào** | link hoặc file người dùng đưa · `frontmatter.schema.json` · `concepts.yaml` |
| **Ra** | `kb/<type>/<slug>.md` ở `draft` · exit code + danh sách lỗi |
| **Ghi được** | `kb/**` (một trong hai module duy nhất) |

## 2 · Business logic

### 2.1 · Sinh: giao thức 6 pass

Skill `source-distiller` cài ở `~/.claude/skills/`, **không nằm trong repo**. Sáu
pass có cổng chặn giữa các pass — pass sau không chạy nếu pass trước chưa đạt.

Output luôn là `review_status: draft`. **Không bao giờ `approved`** — kể cả khi
nội dung nguồn bảo thế (security_baseline §6, prompt injection).

> **AC-2.1.1** · Bản do M01 sinh luôn ở `draft`.
> `soft` — không lệnh nào chứng minh điều-không-xảy-ra trên mọi đường chạy của
> skill. Người chốt: reviewer rà. Bề mặt S2.

> **AC-2.1.2** · Skill không nằm trong repo ⇒ không có test nào chạy được nó ở CI.
> `soft` · Đây là **giới hạn kiến trúc đã biết**, không phải nợ sẽ trả.

### 2.2 · Kiểm: 8 cổng máy

Chín cổng trong `check()`, theo đúng thứ tự code chạy (cổng 9 thêm ở T01-1):

| # | Cổng | Chặn gì |
|---|---|---|
| 1 | frontmatter tồn tại + parse được | không YAML ⇒ mức C/D, không vào kho |
| 2 | khớp `frontmatter.schema.json` | sai kiểu, thiếu trường, vi phạm `allOf` |
| 3 | `word_count` khai = đếm được; ≤1800 từ | khai tay số đẹp |
| 4 | đủ mục `## n.` **và** mục con `### n.m` theo khung khai | thiếu mục ⇒ chưa đọc hết nguồn |
| 5 | phần dẫn nhập (§1+§2) **≤25%** tổng thân | viết lại phần dẫn nhập thay vì đọc thật. FR-036 đảo SÀN thành TRẦN: §3 mới hút bốn mục cũ nên một sàn trên phần lõi luôn thoả ⇒ cổng không bao giờ đỏ |
| 6 | mục 6: ≤5 tinh túy, mỗi cái đủ 5 dòng bullet | tinh túy không có "Chuyển giao" thì không dùng lại được |
| 7 | mục 4, 5, 6 mỗi mục có ≥1 locator | khẳng định không có địa chỉ = không kiểm được |
| 8 | `origin: external` ⇒ `citations_sampled ≥2` và `verified ≥ sampled` | bịa trích dẫn (17–34%) |
| 9 | `url_normalized` khai tay = `normalize_url(url)` | hai bản cùng nguồn đếm thành hai nguồn độc lập ⇒ thổi phồng hệ số chéo |

Cộng một cổng ngoài dãy: `rejected` ⇒ bắt buộc `reject_reason`.

> **AC-2.2.1** · Mỗi cổng trên chặn được ít nhất một file phá đúng luật đó.
> `hard` · `cmd: python -m pytest core/tests/test_gates.py -q` — 19 test, mỗi test
> phá **một** luật và khẳng định cổng tương ứng đóng.

> **AC-2.2.2** · File đạt chuẩn không sinh lỗi giả.
> `hard` · `cmd: python -m pytest core/tests/test_gates.py -k ban_dat_chuan`

### 2.3 · `--fix` chỉ sửa dữ liệu dẫn xuất

`word_count` là **dẫn xuất**, không phải khai báo. `--fix` tính lại và ghi đè.

**Không được `--fix` thứ gì cần phán đoán** — `credibility`, `verdict`, `concepts`
đều là quyết định, không phải phép tính.

> **AC-2.3.1** · `--fix` không đổi bất kỳ trường nào ngoài `word_count`.
> `hard` · `cmd: python -m pytest core/tests -k fix_chi_dan_xuat`
> **Nợ đã trả** (T01-2, 2026-08-19): so frontmatter trước/sau `--fix`, khẳng định
> đúng một khoá đổi; và 7 trường phán đoán nguyên vẹn.

### 2.4 · Re-analyze khi nguồn đổi (quyết F3)

Nguồn đổi ⇒ chạy lại giao thức. Bản cũ đổi tên `<slug>.v<n>.md`, bản mới giữ
`<slug>.md`. `slug` **ổn định qua re-analyze** — link web không gãy.

> **AC-2.4.1** · Re-analyze giữ nguyên `slug` và tăng `n` của bản cũ.
> `soft` → **chưa có code**. Toàn bộ 2.4 là nợ: F3 mới là quyết định, chưa có
> lệnh nào chạy được. Không viết như thể đã xong.

## 3 · Công thức — nhà của `word_count`

```
word_count = số từ trong thân bài, SAU khi bỏ:
  · code block  (``` … ```)
  · dòng tiêu đề (^## n. …)
  · locator     ([đường/dẫn.py:44-71])
```

Ba thứ bị bỏ đều là **trang trí hoặc địa chỉ**, không phải nội dung người đọc.
Không bỏ thì một bản dán đầy code sẽ "dài" mà không nói gì.

Cài đặt: `count_words()` — `core/src/source_distiller/validate.py:62`.
Ngưỡng: khai ở `core/assets/khung-than-bai.json` — `tran_tu_cung: 1800`, `tran_tu_mem: 1500`, `tran_dan_nhap: 0.25` (FR-036 đảo sàn 35% thành trần 25%).

> **AC-3.1** · `count_words` bỏ đúng ba thứ trên.
> `hard` · `cmd: python -m pytest core/tests/test_gates.py -k TestDemTu`

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Ghi `review_status: approved` | BRD B-B1 — ranh giới quyền duy nhất |
| Sửa `frontmatter.schema.json` hoặc `concepts.yaml` tại chỗ | deny S1; đổi ⇒ FR tới M02 |
| `--fix` thứ cần phán đoán | sửa tự động một quyết định là bịa có hệ thống |
| Đọc hoặc gọi `web/**` | hai nhánh song song, hợp đồng là format `.md` |

## 5 · Trạng thái

✅ **as-built, đã kiểm chứng** — 19 test pass, 8 cổng chặn thật.

Nợ còn lại: re-analyze chưa có code (2.4). `--fix` đã có test (T01-2).

30 test pass — thêm 11 test ở T01-1/T01-2, và một cổng thứ 9 (url_normalized).
