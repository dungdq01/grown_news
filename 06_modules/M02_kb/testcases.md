# M02_kb — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Module `as-built`. File này **audit** AC của mã đang chạy. Và nó đã tìm ra
> một cổng **đỏ oan** (§cuối, mục 1) — nên nó không chỉ mô tả.

## 2.1 · Nguồn chân lý là DB, file là export dẫn xuất

**AC-2.1.3** — round-trip hai chiều không mất bản ghi
- *happy*: bản copy tạm của `kb/` → `dung_lai_db` → DB → `xuat_kho` → `kb′`:
  từng file **byte-equal**; và `DB → file → DB′` cùng hash nội dung.
- *edge*: hai bài **trùng `slug`, khác `source_type`** (`repo/x.md` và
  `paper/x.md`) → cả hai còn sau vòng. Khoá `slug` một mình từng làm **mất 2/5**
  bản ghi im lặng (FR-023 GĐ 3) ⇒ đây là ca bảo vệ khoá kép.
- *edge 2*: một bản `<slug>.v3.md` (bản lưu trữ) → nó vào `article_versions`,
  **không** vào `articles`, và xuất lại ra đúng `.v3.md`.
- *edge 3*: một file có **nhãn trùng** trong `concepts[]` (`["rag","rag"]`) →
  không mất bản ghi, và số nhãn sau vòng bằng số nhãn trước (không tự dedupe im
  lặng — dedupe là một **quyết định**, và nó phải nằm ở một chỗ khai được).
- *edge 4*: kho **rỗng** (0 file) → vòng chạy xong, DB có 0 hàng, và
  `xuat_kho` **không** xoá thư mục. Kho mới tinh là **trạng thái hợp lệ**.
- *edge 5*: một file `.md` **mồ côi** trong `kb/<loai>/` mà DB không có hàng →
  vòng reap xoá nó, và nó **phải nói ra đã xoá gì**. Đây là chỗ mất dữ liệu vĩnh
  viễn của cả module (plan `S12`), nên nó cần một ca riêng chứ không nằm trong
  *happy*.

**AC-2.1.1** — mọi file export parse được YAML và đạt schema
- *happy*: `validate.py kb/ --strict` → **0 lỗi**.
- *edge*: một file `_nhap.md` (bắt đầu bằng `_`) sai schema → **bỏ qua**, không
  tính lỗi. Cùng thế với `README.md`.
- *edge 2*: một file `.md` **không có** frontmatter → 1 lỗi, và lỗi **nêu tên
  file** (không chỉ nói "có lỗi").

⚠️ **Lệnh của AC này đo RỘNG HƠN chính AC** — xem §cuối mục 1. Testcase *happy*
ở trên viết **"0 lỗi"** chứ không viết **"exit 0"**, và đó là cố ý: hôm nay exit
là `1` trong khi lỗi là `0`.

**AC-2.1.2** — `source_type` khớp thư mục chứa file
- *happy*: `kb/paper/x.md` có `source_type: paper` → 0 lỗi.
- *edge*: `kb/paper/x.md` có `source_type: video` → 1 lỗi, nêu **cả hai** giá trị
  (thư mục nói gì, frontmatter nói gì) — chỉ nói "lệch" thì không sửa được.
- *edge 2*: file nằm **ngay** trong `kb/` (không trong thư mục loại nào) → phải
  chốt một hành vi: lỗi, hay bỏ qua như file `_`. Spec **không nói**.

## 2.2 · Trạng thái duyệt — cổng người duy nhất

**AC-2.2.1** — không tiến trình tự động nào ghi `approved`
- *happy*: reviewer rà diff mọi module ghi vào `kb/` → 0 chỗ **ghi** `approved`.
- *edge*: một module đặt `review_status` từ **biến** (`st = tinh_trang(); ...`) →
  phép rà theo chuỗi `"approved"` **không thấy**, nhưng đường ghi vẫn tồn tại.
  Đây là lý do AC khai `soft`: một `grep` xanh **không** là bằng chứng.
- *edge 2*: `POST /api/articles` với `review_status: approved` trong thân request
  → endpoint **không** nhận (M08-R3: không default nào để tự điền). Đây là ca
  **kiểm được bằng máy** và nó nên là AC riêng của M08, không của M02.

**AC-2.2.2** — `rejected` thiếu `reject_reason` ⇒ chặn
- *happy*: `check_reject_reason.py` xanh.
- *edge*: `reject_reason` có **4** ký tự (dưới ngưỡng 5) → chặn.
- *edge 2*: `reject_reason` là **5 dấu cách** → phải chốt: đếm ký tự thô thì
  **qua**, đếm sau `strip()` thì **chặn**. Spec khai *"≥5 ký tự"*, không nói.
- *edge 3*: `review_status: draft` **kèm** `reject_reason` → không chặn (lý do dư
  thì vô hại), hay chặn (trường không thuộc trạng thái)? Spec không nói.
- *edge 4*: cổng có ở **hai** chỗ (`validate.py:163` + `allOf` trong schema) → gỡ
  **một** chỗ thì phép thử phải **vẫn đỏ**; nếu xanh, một trong hai chỗ là chết.

## 2.3 · `url_normalized`

**AC-2.3.1** — hai URL khác nhau chỉ ở tracking param cho cùng `url_normalized`
- *happy*: `a.com/x?utm_source=t` và `a.com/x` → cùng một `url_normalized`.
- *edge*: `youtu.be/X` và `youtube.com/watch?v=X` → cùng kết quả.
- *edge 2*: `arxiv.org/pdf/2401.1` và `arxiv.org/abs/2401.1` → cùng kết quả.
- *edge 3*: `www.a.com/x` và `a.com/x` → cùng kết quả; nhưng
  `blog.a.com/x` và `a.com/x` → **khác** (chỉ `www.` bị bỏ, không mọi subdomain).
- *edge 4*: `url_normalized` khai **tay sai** → cổng 9 chặn (đây là vế mà
  `normalize_url()` một mình không phủ: hàm đúng không ngăn người khai bừa).
- *edge 5*: `url` **vắng** (bản `origin: internal`) → `url_normalized` cũng vắng,
  và **không** nổ.

## 2.4 · `concepts.yaml` — danh mục kiểm soát

**AC-2.4.1** — `concepts[]` chứa id ngoài danh mục ⇒ chặn
- *happy*: `concepts: [rag]` với `rag` có trong `concepts.yaml` → 0 lỗi.
- *edge*: `concepts: [rag-pipeline]` (không có trong danh mục) → chặn.
- *edge 2*: cùng id đặt trong `concepts_proposed[]` → **không** chặn, và nó
  **không** tính vào hệ số kiểm chứng chéo. Vế thứ hai là chỗ dễ mất: một id đề
  xuất mà vẫn được đếm thì cả cơ chế "danh mục đóng" thành trang trí.
- *edge 3*: `concepts: []` (rỗng) → không chặn.
- *edge 4*: cùng một id nằm ở **cả** `concepts[]` và `concepts_proposed[]` → phải
  chốt một hành vi. Spec không nói.

## 2.5 · Bản cũ khi re-analyze

**AC-2.5.1** — `*.v[0-9]*.md` không xuất hiện trong output của M03
- *happy*: kho có `x.md` + `x.v1.md` → output của M03 có `x`, **không** có `x.v1`.
- *edge*: `x.v1.md` là bản **duy nhất** (không có `x.md`) → output **rỗng** cho
  slug đó, không phải "lấy bản cũ cho đỡ trống". Bản cũ **không phải** nội dung.
- *edge 2*: một slug thật chứa chuỗi `.v2` giữa tên (`nginx.v2.config.md`) →
  **không** bị lọc oan. Phép lọc theo `*.v[0-9]*` là **hình dạng tên**, và một
  tên hợp lệ khớp hình dạng đó là ca đỏ-oan của chính nó.

⚠️ AC khai `soft`, lệnh tương lai `node web/test/no-archived.test.js` — **file đó
chưa tồn tại** (đo 2026-09-03). AC nói đúng thế, nên đây **không** phải nợ giấu.
Và AC tự khai **chủ là M03**, nên nó không được đếm vào s6 của M02.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *ghi `kb/_kho.sqlite` ngoài M05 và M08*: quét đường mở DB → chỉ hai chỗ.
  ⚠️ Đây là chỗ một audit trước đã **bỏ sót `05_intake/gate.py`** (plan `S6`),
  nên phép thử phải quét **cả Python cả JS**, không chỉ `web/api/`.
- *ghi file `kb/**` ngoài `xuat_kho.py`*: quét đường ghi → một chỗ.
- *sửa bảng `concepts`/`categories` tự động*: M07 chỉ có đường **đề xuất**, không
  có đường `UPDATE`.
- *đặt `approved` bằng máy*: xem `AC-2.2.1`.
- *thêm trường vào `Analysis` không FR*: `check_frozen` đỏ khi
  `frontmatter.schema.json` đổi mà `FROZEN.lock` chưa ký.

## Kết quả PHÉP THỬ s6 — ba phát hiện

**1 · `AC-2.1.1` và `AC-2.1.2` đang ĐỎ OAN, và cái đỏ đó không phải lỗi kho.**
Đo 2026-09-03: `validate.py kb/ --strict` → **`3 file · 0 lỗi · 1 cảnh báo`**,
exit **1**. Nguyên nhân ở `validate.py:770`:

```
sys.exit(1 if n_err or (a.strict and n_warn) else 0)
```

`--strict` biến **cảnh báo** thành exit khác 0. Cảnh báo hiện tại là *"3 khái
niệm chờ duyệt danh mục"* — một trạng thái **biên tập nội dung**, không phải một
vi phạm schema. Nhưng hai AC kia chỉ khẳng định *"parse được YAML và đạt
schema"*. ⇒ **lệnh đo rộng hơn AC**: nó đỏ vì một chuyện AC không nói.

Đây đúng lớp lỗi `#cổng-đỏ-oan`, và đúng lớp lỗi tôi đã tự mắc ở `FR-051 §9`
(đo một mặt khác của cùng cái tên). Hệ quả thực tế: một cổng đỏ vì lý do vô hại
là cổng người ta sẽ tắt.

Hai đường sửa, **cần chủ dự án chọn** — cả hai là quyết định, không phải sửa mã:
- đổi **lệnh** của hai AC sang một vế chỉ đếm lỗi (giữ `--strict` cho chỗ khác);
- hoặc chấp nhận *"kho không được có khái niệm chờ duyệt"* là **một luật của
  M02** — thì phải khai nó thành AC riêng, vì hôm nay nó là hệ quả phụ của một cờ.

**2 · `§5` khai *"rỗng về nội dung — 0 bài"*, thực tế 3 bài.** Cùng lớp *tự khai*
với ba con số lệch của M01. Con số trong artifact là thứ không cổng nào canh.

**3 · Bốn AC không đủ để viết MỘT kết quả mong đợi** — mỗi chỗ tôi phải nêu hai
khả năng: `AC-2.1.2 edge 2` (file ngay trong `kb/`) · `AC-2.2.2 edge 2` (5 dấu
cách) · `AC-2.2.2 edge 3` (lý do dư) · `AC-2.4.1 edge 4` (id ở cả hai mảng).
Không chỗ nào chặn thi công — mã đang chạy đã chốt **một** hành vi cho mỗi ca —
nhưng AC **không** nói hành vi nào, nên một lần viết lại sẽ chọn khác mà mọi
cổng vẫn xanh.

⇒ Cả ba vào `backlog.md`. Mục 1 chạm `spec.md` frozen ⇒ tick bằng **FR id**.
