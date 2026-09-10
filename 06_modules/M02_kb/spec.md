# M02_kb — spec

> **Module này không chạy.** Nó là *hợp đồng*: định nghĩa hai entity mà sáu module
> kia đọc và ghi. Không có tiến trình nào tên là "kb".
>
> Vì sao vẫn cần spec: chỗ nào **không** ai được làm gì phải viết ra, nếu không
> mỗi module sẽ tự suy diễn một kiểu.

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | entity `Analysis`, entity `Concept`, quy ước tên file, trạng thái duyệt |
| **Không sở hữu** | logic sinh (M01), logic kiểm (M01 + M04), render (M03) |
| **Vào** | `.md` từ M01_core hoặc M05_intake |
| **Ra** | `.md` cho M03/M04/M06/M07 đọc · `concepts.yaml` cho M01/M05 kiểm |

## 2 · Business logic

### 2.1 · Một bản phân tích là một HÀNG — file là export

*(ĐẢO theo FR-034, 2026-08-26 — bản gốc: "một bản phân tích là một file; nguồn
chân lý là file `.md` trên đĩa". Khối FR-023 về index dẫn xuất hết hiệu lực —
index đã bị thay bằng chính kho.)*

Nguồn chân lý là **một hàng trong bảng `articles` của `kb/_kho.sqlite`**:
khoá `(source_type, slug)` — `source_type` thuộc 6 loại đóng `repo · paper ·
video · article · docs · announcement`; nội dung = 2 cột `frontmatter` (JSON
nguyên văn) + `than` (markdown). Mọi cột khác là GENERATED từ JSON — bảng là
ảnh chiếu của frontmatter, không phải một lựa chọn trường.

File `kb/<source_type>/<slug>.md` vẫn tồn tại, **đọc được bằng mắt thường**,
nhưng là **export dẫn xuất một chiều DB→file** (`core/tools/xuat_kho.py`),
commit vào git làm backup. Kho dựng lại được sau khi mất mọi thứ khác (F4):
export trong git + `core/tools/dung_lai_db.py` — đường file→DB duy nhất,
người/CI/test chạy, server không bao giờ gọi.

Ba bài học FR-023 GĐ 3 sống tiếp trong DDL: khoá kép `(source_type, slug)`
(khoá `slug` một mình từng làm mất 2/5 bản ghi im lặng); bản lưu trữ tách bảng
`article_versions` (xuất ra `*.v<n>.md`); INSERT thường, không `OR IGNORE`
(nuốt xung đột là che bug mất dữ liệu).

> **AC-2.1.3** · Round-trip hai chiều trên bản copy tạm: `kb/ → dung_lai_db →
> DB → xuat_kho → kb′` byte-equal, và `DB → file → DB′` cùng hash nội dung;
> bài trùng slug khác `source_type`, bản `.v<n>`, nhãn trùng trong một file
> đều không mất bản ghi nào.
> `hard` · `cmd: python core/tests/check_export_dan_xuat.py`

> **AC-2.1.1** · Mọi file export trong `kb/**` (trừ `README.md` và file bắt đầu
> `_`) có frontmatter parse được bằng YAML và đạt `frontmatter.schema.json` —
> export phải trung thực với DB nên chính nó cũng phải qua cổng.
> `hard` · `cmd: python core/src/source_distiller/validate.py kb/ --strict`

> **AC-2.1.2** · `source_type` trong frontmatter khớp thư mục chứa file export.
> `hard` · `cmd: python core/src/source_distiller/validate.py kb/ --strict`

### 2.2 · Trạng thái duyệt — cổng người duy nhất

```
draft ──người duyệt──> approved ──> (lên web)
  │                        │
  └──> rejected            └──> edited ──> approved
```

**Chỉ người được ghi `approved`.** Không tiến trình tự động nào — kể cả M01, M05,
M06, M07 — được đặt giá trị đó. → BRD B-B1, security_baseline §1

FR-011: người duyệt được thao tác qua **API biên tập local** (M08) thay vì mở
editor — vẫn là NGƯỜI bấm và NGƯỜI khai 3 trường M1 (FR-001); endpoint không có
default nào để tự điền (M08-R3), nên "máy tự duyệt" vẫn bất khả. Đường editor +
commit vẫn nguyên như cũ — hai bề mặt, một cổng người.

`rejected` bắt buộc kèm `reject_reason` ≥5 ký tự: loại mà không ghi lý do thì
cùng loại rác sẽ quay lại mãi.

> **AC-2.2.1** · Không tiến trình tự động nào ghi `review_status: approved`.
> `soft` — không có lệnh nào chứng minh điều-không-xảy-ra trên toàn bộ code.
> Người chốt: reviewer rà diff mọi module ghi vào `kb/` (bề mặt S2).

> **AC-2.2.2** · `rejected` mà thiếu `reject_reason` ⇒ chặn.
> `hard` · `cmd: python core/tests/check_reject_reason.py`
> Cổng có thật ở hai chỗ: `validate.py:163` và `allOf` trong schema. Không test
> pytest nào phá luật này, nên lệnh là script kiểm riêng — viết ở s6 chứ không
> đợi s8, vì AC không có lệnh thì theo R3 nó là `soft`.

### 2.3 · `url_normalized` — đơn vị đếm nguồn độc lập

Ba bản phân tích cùng một URL là **một** nguồn, không phải ba. Nếu đếm theo `url`
thô thì thêm `?utm_source=` là ra nguồn "độc lập" mới — và hệ số kiểm chứng chéo
bị thổi phồng bằng một thao tác copy link.

Chuẩn hoá: bỏ tracking param · bỏ `www.` · `youtu.be/X` → `youtube.com/watch?v=X`
· `arxiv.org/pdf/X` → `arxiv.org/abs/X`.

> **AC-2.3.1** · Hai URL khác nhau chỉ ở tracking param cho cùng `url_normalized`.
> `hard` · `cmd: python -m pytest core/tests -k TestUrlNormalized`
> **Nợ đã trả** (T01-1, 2026-08-19): `normalize_url()` ở `validate.py`, cộng cổng
> 9 chặn khai tay sai. 7 test + 2 test cổng. Phá 3 cách đều đỏ.

### 2.4 · `concepts.yaml` — danh mục kiểm soát

`concepts[]` chỉ được lấy từ danh mục. Khái niệm mới đi vào `concepts_proposed[]`
và **không tính** vào hệ số kiểm chứng.

**Vì sao đóng**: bộ lọc theo concept chỉ dùng được khi cùng một ý có cùng một tên.
Cho tự sinh thì sau 60 bài có `rag`, `RAG`, `retrieval-augmented`, `rag-pipeline`
— bốn tên một thứ, lọc ra bốn tập rời nhau.

> **AC-2.4.1** · `concepts[]` chứa id ngoài `concepts.yaml` ⇒ chặn.
> `hard` · `cmd: python -m pytest core/tests/test_gates.py -k khai_niem_tu_bia`

### 2.5 · Bản cũ khi re-analyze

Nguồn đổi ⇒ M01 phân tích lại (quyết F3). Bản hiện hành là hàng trong `articles`;
bản cũ chuyển sang bảng `article_versions` (FR-034), export ra `<slug>.v<n>.md`.

**Bản cũ không lên web** và không tính vào M1 — nó là lịch sử, không phải nội dung.

> **AC-2.5.1** · File khớp `*.v[0-9]*.md` không xuất hiện trong output của M03.
> `soft` → chuyển thành `hard` khi M03 có bộ test. Lệnh tương lai:
> `node web/test/no-archived.test.js`. Chủ AC là M03, không phải M02.

## 3 · Công thức

Không có công thức nào sống ở module này. `priority` sống ở M06_skillgen §3;
`word_count` sống ở M01_core §3. Map chỉ trỏ.

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Bất kỳ module nào ghi vào `kb/_kho.sqlite` ngoài M05 và M08 (FR-034; M01 nộp qua M05/M08) | `boundaries.db_writers` |
| Bất kỳ đường nào ghi file `kb/**` ngoài `xuat_kho.py` | file là export — hai người ghi là hai nguồn chân lý |
| Bất kỳ module nào sửa bảng `concepts`/`categories` tự động | M07 chỉ **đề xuất** gộp; người khai nhãn (M02-R3) |
| Đặt `approved` bằng máy | BRD B-B1 — ranh giới quyền duy nhất |
| Thêm trường vào `Analysis` mà không FR | schema là hợp đồng, deny S1 chặn sửa |

## 5 · Trạng thái

`as-built` về cấu trúc, **rỗng về nội dung** — 0 bài. Đây là chỗ M1 chưa đo được.
