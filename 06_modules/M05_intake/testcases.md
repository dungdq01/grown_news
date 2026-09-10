# M05_intake — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ M05 là **một trong hai đường ghi** vào `kb/_kho.sqlite` (cùng M08). Nên mọi
> ca dưới đây phải chạy trên `INBOX_DIR`/`KB_DIR` trỏ **thư mục tạm** — đây đúng
> là module mà việc thiếu hai biến đó từng làm *"không ai dám viết test"*.

## 2.2 · Năm việc, đúng thứ tự

**AC-2.2.4** — kho đã có `(source_type, slug)` ⇒ trả lại, bản trong kho không đổi
một byte; file đã vào kho không xử lý lại lần sau
- *happy*: nộp một bài mà kho đã có → **trả lại**, và hash của hàng trong kho
  **bằng** hash trước đó.
- *happy 2*: chạy gate **hai lần liên tiếp** → lần hai xử lý **0** file (file đã
  đổi tên `<ten>.da-vao-kho.md`).
- *edge*: trùng `slug` nhưng **khác `source_type`** (`repo/x` vs `paper/x`) →
  **KHÔNG** trả lại, cả hai vào kho. Khoá là **kép**; một phép kiểm chỉ so `slug`
  sẽ trả lại oan — và khoá `slug` một mình từng làm mất 2/5 bản ghi (FR-023 GĐ 3).
- *edge 2*: file `_inbox/x.md` **và** `_inbox/x.da-vao-kho.md` cùng tồn tại →
  chỉ `x.md` được xử lý; và bước đổi tên phải **không** ghi đè bản `.da-vao-kho`
  cũ (đó lại là một lần ghi đè im lặng, đúng bug 2026-08-24 ở một chỗ khác).
- *edge 3*: quyền ghi bị từ chối lúc đổi tên (file đang mở) → bài **đã** vào kho
  mà file **chưa** đổi tên ⇒ lần chạy sau nộp lại và bị trả lại ở `AC-2.2.4`.
  Kết quả cuối đúng, nhưng người dùng thấy một *"trả lại"* mà họ không gây ra.
  Spec không nói thứ tự **INSERT trước hay đổi-tên trước**.
- *edge 4*: `_inbox/` **rỗng** → exit 0, xử lý 0 file, **không** nổ.

**AC-2.2.1** — file thiếu trường bắt buộc bị trả lại, không vào `kb/`
- *happy*: bản thiếu `credibility` → trả lại kèm **danh sách** trường thiếu.
- *edge*: bản thiếu **nhiều** trường → trả lại **cả danh sách** một lượt, không
  báo trường đầu rồi dừng. Báo một trường mỗi lượt biến một lần sửa thành N lượt.
- *edge 2*: bản có **thừa** một trường không trong schema → phải chốt: trả lại,
  hay bỏ qua? Schema có `additionalProperties` quyết chuyện đó, nhưng **AC không
  nói**, nên hai cài đặt đều "đúng AC".

**AC-2.2.2** — M05 không tự điền trường thiếu
- *happy*: sau một lượt trả lại, file trong `_inbox/` **không đổi một byte**.
- *edge*: `word_count` **sai** (không thiếu) → đây là ngoại lệ duy nhất được tính
  hộ (`§2.4`), nên nó **được** đổi. Ranh giới *"tính hộ"* vs *"tự điền"* nằm ở
  chỗ: một cái là **phép tính**, cái kia là **quyết định**.
- *edge 2*: bản thiếu `word_count` **hoàn toàn** → tính hộ, hay trả lại? `§2.4`
  nói M05 *"tính hộ được"* cho ca **sai**; ca **vắng** không được nói tới.

**AC-2.2.3** — bản qua cổng luôn `origin: external` + `review_status: draft`
- *happy*: bản không khai `origin` → vào kho với `external`.
- *edge*: bản **tự khai** `origin: pipeline` → phải bị ép về `external` hoặc trả
  lại (`CẤM: đặt origin: pipeline`). Ép **im lặng** và trả lại cho hai trải
  nghiệm rất khác; AC không nói cái nào.
- *edge 2*: bản **tự khai** `review_status: approved` → trả lại (schema cưỡng chế
  `const "draft"` cho `external`). Đây là ca prompt-injection của đường nạp, và
  nó **kiểm được bằng máy** — khác `AC-2.2.1` của M02 (`soft`).
- *edge 3*: bản khai `review_status: rejected` kèm `reject_reason` hợp lệ → schema
  đòi `const "draft"`, nên **trả lại**. Một người nộp bản họ đã tự loại sẽ không
  hiểu vì sao.

## 2.3 · Spot-check trích dẫn

**AC-2.3.1** — `citations_sampled < 2` với `origin: external` ⇒ chặn
- *happy*: `citations_sampled: 2`, `citations_verified: 2` → qua.
- *edge*: `citations_sampled: 1` → chặn.
- *edge 2*: `citations_sampled: 5`, `citations_verified: 3` → chặn
  (`verified >= sampled`). Vế này dễ mất: một bản khai đã lấy mẫu nhiều mà xác
  nhận ít **trông** cẩn thận hơn bản khai 2/2.
- *edge 3*: `origin: internal`, `citations_sampled: 0` → **qua**; cổng chỉ áp cho
  `external`.
- *edge 4*: `citations_sampled: 0` **và** `citations_verified: 0` với `external` →
  chặn ở vế `≥2`, không được "0 ≥ 0 nên qua".

**AC-2.3.2** — người thật đã mở link
- *happy*: reviewer xác nhận.
- *edge*: một bản khai `citations_verified: 8` mà **cả 8 địa chỉ không phân giải
  được** → `unverifiable_citations` phải `true`. Đây là ca **kiểm được** một phần
  của thứ AC khai là `soft` — và nó đã bắt được `dat-chuan.md` (xem M04 `§cuối`).
  ⇒ AC nên trỏ tới vế đo được đó thay vì chỉ nói *"người chốt"*.

## 2.4 · Không có frontmatter

**AC-2.4.1** — file không frontmatter ⇒ trả lại kèm khung, không vào `kb/`
- *happy*: markdown thuần → trả lại, output chứa khung tối thiểu và một dòng
  hướng dẫn sửa.
- *edge*: khung trả về **không** chứa `id`, `slug`, `credibility` đã điền sẵn —
  cả ba là quyết định. Nếu khung điền sẵn `credibility: 3` thì người ta sẽ để
  nguyên, và một mặc định lặng lẽ thành phán quyết.
- *edge 2*: file có `---` ở đầu nhưng YAML **không parse được** → đây là *"sai
  frontmatter"* hay *"không có frontmatter"*? Hai đường xử lý khác nhau (trả lại
  danh sách trường thiếu vs trả lại khung), và AC không phân biệt.
- *edge 3*: file **rỗng** (0 byte) → trả lại kèm khung, không nổ.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *ghi `approved`*: schema cưỡng chế `const "draft"` cho `external` ⇒ kiểm được
  bằng một bản nộp khai `approved` (`AC-2.2.3 edge 2`).
- *tự điền trường thiếu*: `AC-2.2.2 happy` — file không đổi một byte.
- *copy logic từ `validate.py`*: quét `05_intake/gate.py` → có `import` từ
  `source_distiller`, và **0** bản copy của `check()`/`count_words()`. Hai bản
  kiểm sẽ lệch nhau; phép thử phải đo **import**, không đo *"trông giống nhau"*.
- *đặt `origin: pipeline`*: `AC-2.2.3 edge`.
- *nhận file ngoài `_inbox/`*: gate đọc **không đệ quy** ⇒ đặt một file ở
  `_inbox/sau/x.md` → **không** được xử lý.

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · Tiêu đề `§2.2` viết *"Bốn việc"*, bảng có NĂM hàng.** Việc thứ 5 (dọn
`_inbox/`) thêm 2026-08-24 cùng bug ghi-đè, và tiêu đề không đi theo. Đây là con
số thứ tư cùng lớp trong bốn module (M01 ba số · M02 *"0 bài"* · M04 *"31 bước"*).

**2 · Sáu AC không đủ để viết MỘT kết quả mong đợi** — mỗi chỗ tôi phải nêu hai
khả năng:
`AC-2.2.4 edge 3` (INSERT trước hay đổi-tên trước) · `AC-2.2.1 edge 2` (trường
thừa) · `AC-2.2.2 edge 2` (`word_count` **vắng** chứ không sai) · `AC-2.2.3 edge`
(ép im lặng hay trả lại) · `AC-2.4.1 edge 2` (YAML không parse được: *"sai"* hay
*"không có"*).
Năm ca này đều là ca **thật sẽ xảy ra**, không phải ca bịa cho đủ.

**3 · `AC-2.3.2` khai `soft` nhưng có một vế ĐO ĐƯỢC nó không trỏ tới.**
`unverifiable_citations` phải `true` khi không địa chỉ nào phân giải được — và
cổng đó **có thật**, nó vừa bắt `dat-chuan.md` (M04 `§cuối` mục 1). AC nói *"không
lệnh nào phân biệt được"*, đúng cho câu *"người có mở link không"*, nhưng nó bỏ
mất câu *"link có phân giải được không"* — hai câu khác nhau, và vế thứ hai là
`hard`.

**4 · Thứ tự AC trong spec đảo.** `AC-2.2.4` đứng **trước** `AC-2.2.1`/`.2`/`.3`
vì nó thêm sau (2026-08-24) và được chèn cạnh đoạn văn kể bug. Không sai gì, và
nó làm người đọc tưởng có `AC-2.2.4` trước khi biết `.1` là gì.

⇒ Cả bốn vào `backlog.md`. Mục 2 và 3 chạm `spec.md` FROZEN ⇒ tick bằng **FR id**.
