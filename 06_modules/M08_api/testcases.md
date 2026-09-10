# M08_api — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ M08 là **cửa ghi duy nhất** vào kho từ phía web, và là chỗ `B-B1` (*chỉ
> người được duyệt*) đứng hay đổ. Nên mọi ca dưới đây phải trả lời: *"nếu cổng
> này hỏng, máy có tự duyệt được không?"*

## 2.1 · CRUD — hàng trong DB là nguồn chân lý, JSON là view

**AC-2.1.2** — round-trip DB↔file giữ đủ dữ liệu trên kho gieo
- *happy*: `check_export_dan_xuat.py` xanh.
- *edge*: bài **trùng `slug`, khác `source_type`** → cả hai còn. Khoá `slug` một
  mình từng làm mất **2/5** bản ghi im lặng (FR-023 GĐ 3).
- *edge 2*: bản lưu trữ `*.v<n>.md` → vào `article_versions`, **vô hình** với mọi
  endpoint.
- *edge 3*: bài thiếu `url_normalized` → round-trip vẫn giữ, không tự điền.
- *edge 4*: ⚠️ cổng gieo **chỉ** `repo` + `article` — cả hai vào **một** bảng
  (`bai_viet`). Sau FR-038 có ba bảng, nên cổng này **xanh trên một bản cài đặt
  làm 1/3 việc** (plan `S11`). Phải gieo thêm một `video` và một `tai-lieu`.

**AC-2.1.1** — vòng CRUD đủ + tám ca âm
- *happy*: tạo → đọc → sửa → duyệt → sửa-khi-`approved` ⇒ `edited` → duyệt lại →
  xoá → restore.
- *edge*: POST **trùng** `(type, slug)` ⇒ **409**, và bản trong kho **không đổi
  một byte**.
- *edge 2*: PUT với `etag` cũ ⇒ **412**. Hai cửa sổ mở cùng bài, cửa sau nhận
  412 — multi-window là **tính năng thật** của web này, không phải ca bịa.
- *edge 3*: PUT đổi `slug`/`type`/`id` ⇒ **400** (M08-R5 lột chúng khỏi payload).
- *edge 4*: `:type` ngoài enum ⇒ **400**. ⚠️ Enum giờ **7** giá trị
  (`loai-nguon.json`), spec viết **6** — xem `§cuối` mục 2.
- *edge 5*: `slug` = `../../etc/passwd` ⇒ **400**, chặn bằng whitelist
  `[a-z0-9-]` tức bằng **cấu trúc**, không bằng lọc. Phép thử phải thử cả
  `..%2F..%2F` (đã url-decode) và `....//`.
- *edge 6*: `*.v1.md` **không** xuất hiện trong bất kỳ response nào.
- *edge 7*: cuối test kho tạm **vẫn** qua `validate.py --strict`. ⚠️ Vế này hôm
  nay **đỏ oan được**: `--strict` exit 1 trên **cảnh báo** (`validate.py:770`), và
  một khái niệm chờ duyệt sinh cảnh báo — xem `M02_kb/backlog.md`.
- *edge 8*: ghi **đồng thời** từ hai tiến trình → mutex trong process +
  `BEGIN IMMEDIATE` giữa các process; bên sau không ghi đè im lặng.
- *edge 9*: `PUT` khi bài đang `approved` **mà nội dung KHÔNG đổi** → có chuyển
  `edited` hay không? Spec nói *"`approved` + nội dung đổi ⇒ `edited`"*, nên
  không đổi thì giữ `approved`. Phép so *"nội dung đổi"* là phép so gì —
  frontmatter, than, hay cả hai? Spec không nói.

## 2.1b · Đường HIỆN VẬT

**AC-2.1b.1** — bốn mã trả về trên server thật; `sha256`/`so_byte` do MÁY tính;
`x-ten-goc` mang đường dẫn thì trả về **đã lọc sạch** dấu phân cách
- *happy*: nạp PDF → `201 { sha256, so_byte, mime, ten_goc }`.
- *edge*: gửi `sha256` và `so_byte` **cùng tên** trong request → **bị bỏ qua**,
  máy tính lại. Phép thử phải gửi giá trị **sai** rồi đòi kết quả **đúng** — gửi
  giá trị đúng thì không phân biệt được "bỏ qua" với "nhận".
- *edge 2*: `content-length` khai vượt trần ⇒ **413**, **trước** khi đọc byte.
- *edge 3*: mime ngoài enum ⇒ **415**.
- *edge 4*: magic-byte không khớp mime khai ⇒ **422**.
- *edge 5*: `x-ten-goc: ../../etc/passwd` → trả về **sạch** dấu phân cách.
  Và `x-ten-goc` chứa `"` hoặc newline → không đi vào `filename=` (đường **tách
  đầu đề**); `filename=` dùng **đuôi từ bảng khai** + 12 ký tự sha256.
- *edge 6*: `GET media/<sha256>` của blob **không bản ghi nào trỏ** ⇒ **404**,
  không 200. Byte đang staging *"không phải nội dung công khai"* — phục vụ nó là
  biến cửa nạp thành **chỗ chứa file ai cũng đọc được, chỉ cần biết sha256**.
- *edge 7*: `POST` tới `GET media/<sha>` ⇒ **405 + `Allow`**.
- *edge 8*: `If-None-Match` khớp ⇒ **304**. Spec nói thẳng *"etag không có 304 là
  etag trang trí"*.

**AC-2.1b.2** — `/api/index` mang `ho_so` + `media`; bản thường có `phan-tich` +
`media: null` (cùng mặc định `data.mjs`)
- *happy*: `/api/index` trả hai trường cho mọi bản ghi.
- *edge*: bản ghi **không** phải thư viện → `ho_so: "phan-tich"`,
  `media: null` — **không** `undefined`. `null` và `undefined` khác nhau qua
  `JSON.stringify`: `undefined` **biến mất** khỏi payload.
- *edge 2*: ⚠️ có **BỐN** builder `Ban`, spec đếm ba. Builder thứ tư `theBai()`
  (`articles.mjs:20-32`) **không** trả hai trường này ⇒ xem trước hiện vật chạy
  trên `/mock/` và **im lặng không chạy** trên kho thật (bug đã đo,
  `WL-01K9NBFR036B8`). Phép thử phải phủ **cả bốn**.

## 2.4b · Sáu đầu đề an toàn

**AC-2.4b.1** — sáu đầu đề đo bằng `res.headers` của request THẬT; `content-type`
và `content-disposition` so với `media-mime.json`, **không** với chuỗi gõ tay
- *happy*: sáu đầu đề có mặt và đúng giá trị.
- *edge*: `.pdf` → `inline`; `.pptx`/`.docx` → **`attachment`**. Một cài đặt trả
  `inline` cho **tất cả** vẫn có đủ "sáu đầu đề" và vẫn sai — *"attachment CHÍNH
  LÀ chính sách xem trước cho format không render được"*.
- *edge 2*: file `.pdf` khai mime `text/html` → `content-type` lấy từ **enum**,
  không sniff tên file ⇒ không bao giờ ra `text/html`. Thiếu `nosniff` thì blob
  dán nhãn sai bị re-sniff và **chạy same-origin**.
- *edge 3*: CSP ở **HEADER**, không ở attribute. Spec nêu lý do đo được:
  `sandbox` attribute không kèm `allow-scripts` **làm hỏng viewer PDF của
  Chromium** — nên đây là ca mà cách cài đặt "an toàn hơn" phá tính năng.
- *edge 4*: **không** hứa `accept-ranges` — Range không cài ở v1, *"hứa mà không
  cài là hứa dối"*. Phép thử: đầu đề đó **vắng**.
- *edge 5*: so với `media-mime.json` bằng cách **đọc file**, không gõ chuỗi. Nếu
  test gõ tay `"application/pdf"` thì đổi bảng khai ⇒ test xanh mà server sai.

## 2.2 · Chuyển trạng thái — cửa RIÊNG, người khai

**AC-2.2.1** — approve thiếu bất kỳ 1/3 trường M1 ⇒ 422 và **file trên đĩa không
đổi byte**; reject lý do <5 ký tự ⇒ 422; chuyển ngoài bảng ⇒ 409; external +
approve ⇒ 200
- *happy*: `draft → approved` với đủ `insight_new` · `skill_installed` ·
  `review_minutes` ⇒ 200.
- *edge*: thiếu **từng** trường một → **ba** ca riêng, không một ca thiếu cả ba.
  Thiếu cả ba thì một cài đặt chỉ kiểm trường đầu vẫn xanh.
- *edge 2*: `reject_reason` = 4 ký tự ⇒ 422. = 5 dấu cách ⇒ ? (spec không nói —
  cùng khoảng trống với M02 `AC-2.2.2`).
- *edge 3*: `rejected → approved` ⇒ **409** (ngoài bảng chuyển).
- *edge 4*: `approved → edited` qua cửa này ⇒ **409**; nó là **hệ quả của PUT**,
  không phải một chuyển trạng thái người bấm.
- *edge 5*: ba trường M1 **không có default trong code** (M08-R3) ⇒ quét
  `web/api/**` tìm giá trị mặc định cho ba tên đó → **0**. Đây là vế giữ `B-B1`:
  *máy không có gì để điền vào chỗ chỉ người trả lời được*.
- *edge 6*: 422 rồi ⇒ **file trên đĩa không đổi byte**. Phép thử phải hash file
  trước/sau, không chỉ đọc mã trả về. Một 422 kèm ghi nửa vời là mất dữ liệu.
- *edge 7*: `origin: external` + approve ⇒ **200** (FR-012). Vế này chống một
  luật quá tay: bản ngoài **được** duyệt, chỉ không được vào thẳng `approved`.

## 2.3 · Xoá = recycle

**AC-2.3.1** — DELETE xong file `_recycle/` **byte-equal** bản gốc; restore về
đúng chỗ; restore khi `kb/` đã có file cùng tên ⇒ 409; xoá **hai lần** cùng slug
⇒ bản sau mang hậu tố epoch, **không ghi đè**
- *happy*: bốn vế xanh.
- *edge*: DELETE là **một** transaction `INSERT recycle` + `DELETE articles` —
  hai vế **không tách rời**. Phép thử: làm `INSERT` thất bại → `DELETE` **không**
  được xảy ra. Nếu tách, một lỗi giữa hai vế **mất bài vĩnh viễn**.
- *edge 2*: **không** code path nào `DELETE` trên bảng `recycle` → quét → 0.
  Thùng rác mà xoá được thì nó không phải thùng rác.
- *edge 3*: xoá hai lần cùng slug → hậu tố **epoch**. Hai lần xoá **trong cùng
  một giây** → hai bản cùng hậu tố ⇒ ghi đè. Epoch giây có độ phân giải hữu hạn,
  và spec không nói đơn vị.
- *edge 4*: restore một bản mà `concepts.yaml` đã **mất** nhãn nó dùng → validate
  chặn ⇒ **không restore được**. Đây là ca thật (bài học `dat-chuan.md` của M04:
  *"đạt chuẩn" là quan hệ với danh mục, không phải thuộc tính của file*), và
  không AC nào phủ.

## 2.4 · Chặn bù là cấu trúc code, kiểm tĩnh được

**AC-2.4.1** — quét tĩnh `web/api/**` xác nhận **năm** điều
- *happy*: `api-guard.test.js` xanh.
- *edge*: đặt một `DatabaseSync` **ngoài** `dungchung.mjs` → răng 2 phải **đỏ**.
  ⚠️ Đã xảy ra thật trong phiên này. Cách đúng là **dời mã vào `dungchung.mjs`**,
  **không** nới cổng — và nó có lợi phụ: buộc chỗ nghẽn thành **cấu trúc**.
- *edge 2*: gỡ `spawn validate.py --strict` khỏi `ghiSauValidate` → đỏ.
- *edge 3*: thêm `0.0.0.0` hoặc một `listen` trong handler → đỏ.
- *edge 4*: thêm `unlink`/`rmSync` trỏ kho → đỏ.
- *edge 5*: ⚠️ **quét tĩnh KHÔNG thấy `05_intake/gate.py`** — đường ghi **thứ
  ba** vào kho, nằm ngoài `web/api/` (plan `S6`). `api-guard` khai *"mọi ghi đi
  qua đúng MỘT hàm"*, và câu đó đúng **trong phạm vi nó quét**. Phạm vi ấy không
  phải toàn bộ đường ghi.
- *edge 6*: một literal trong **chú thích** khớp phép quét → đỏ oan. Đã trúng
  phiên này **sáu lần**; cổng đếm trên mã nguồn **phải bỏ chú thích**.

## 2.5 · Bundle tĩnh không đổi tính chất

**AC-2.5.1** — bundle tĩnh không có đường ghi ngoài whitelist literal đóng; khối
quét plugins giữ nguyên
- *happy*: `no-write-path.test.js` xanh.
- *edge*: thêm một `fetch(..., {method:"POST"})` với đường **ghép chuỗi** →
  whitelist **literal** không thấy. Đó là giới hạn *có chủ ý* của cổng, và nó
  phải được khai — một cổng khai "đóng" mà chỉ đóng với literal là cổng nói quá.
- *edge 2*: site build ra **deploy được không cần API** → mở bundle tĩnh, mọi
  chức năng **đọc** còn nguyên.
- *edge 3*: `/api/health` trả **không** 200 → FE **không** bật control ghi. Và
  `/api/health` trả 200 từ một server **khác** (cùng cổng, khác tiến trình) →
  FE bật control ghi cho một API không có. Feature-detect theo một endpoint là
  tin một câu trả lời, không phải một hợp đồng.

**AC-2.5.2** — trải nghiệm duyệt trên bản chạy thật
- *happy*: mở web, bấm duyệt, khai 3 trường M1, thấy trạng thái đổi.
- *edge*: bấm duyệt **hai lần** nhanh → lần hai nhận 409 (đã `approved`), và UI
  **nói ra**, không im lặng.
- *edge 2*: mất mạng giữa lúc bấm → UI nói ra, và **không** hiện trạng thái mới
  như thể đã ghi. `soft` — người chốt, và đây là danh sách để họ chốt theo.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *nghe ngoài `127.0.0.1`*: `api-guard` — *"không có auth ⇒ localhost LÀ lớp bảo
  vệ"* (M08-R1, B-D3). ⚠️ Câu này **đã đổi** sau FR-047: giờ có bảy cửa khoá
  dịch vụ + phân quyền hai vai. `localhost` vẫn là một lớp, không còn là **lớp
  duy nhất** — và spec chưa cập nhật.
- *ghi `kb/` không qua validate*: `AC-2.4.1`.
- *default trường quyết định*: `AC-2.2.1 edge 5`.
- *xoá thật*: `AC-2.3.1 edge 2`.
- *nhận `review_status`/`origin`/`id`/`slug`/`source_type` từ payload*:
  `AC-2.1.1 edge 3` — và phải thử **cả năm** trường, không một.
- *viết lại logic kiểm bằng JS*: quét `web/api/**` → có `spawn` gọi
  `validate.py`, và **0** bản cài đặt lại cổng nào bằng JS (M05-R3).

## Kết quả PHÉP THỬ s6 — năm phát hiện

**1 · `§5` khai `planned`, module ĐÃ CHẠY.** Đo 2026-09-03: **chín** lệnh `hard`
xanh (`check_export_dan_xuat` · `api-crud` · `thu-vien` · `media-cua-so` ·
`media-dau-de` · `api-status` · `api-recycle` · `api-guard` · `no-write-path`).
Cùng ô với M10/M11 — **một cổng còn thiếu, hai chiều**: M04/M06 nói còn đỏ khi đã
xanh; M08/M10/M11 nói chưa dựng khi đã dựng. **Năm module, một bệnh.**

**2 · `§2.1` khai enum `6` giá trị, thực tế `7`.** `core/assets/loai-nguon.json`
là bảng khai (và `$comment` của nó nói thẳng *"trước FR-038 tập **7** giá trị này
gõ tay ở BỐN nơi"*). Con số **thứ bảy** cùng lớp *tự khai* trong bảy module liền
(M01 · M02 · M04 · M05 · M06 · M07 · M08) — xem ô tổng ở `M07_curate/backlog.md`.

**3 · Spec — và cả mã — vẫn gọi bảng `articles`, bảng đó KHÔNG CÒN.**
`kho.schema.sql`: `bai_viet` (:44) · `tai_lieu` (:70) · `video` (:94).
Spec M08 nói *"khoá chính `(source_type, slug)` của bảng `articles`"* và
*"`DELETE FROM articles`"*. `dungchung.mjs` còn **6** chỗ nhắc `articles` — cả
sáu trong **chú thích**, nên mã **chạy đúng** và **kể sai**. Cùng vết với M09
(`:637` nói *ba nhánh*, `:649` nói *năm*) và với M10/M11 (`documents`/`videos`).
⇒ **Bốn module + một file mã**, cùng một lần đổi tên chưa lan hết.

**4 · `M08-R1` đã lạc hậu về AN NINH, không chỉ về chữ.** `§4` viết *"không có
auth — localhost LÀ lớp bảo vệ"*. Sau FR-047/FR-049/FR-051 có: bảy cửa khoá dịch
vụ · phân quyền hai vai (`chu`/`dong_nghiep`) · rate-limit hai chiều · audit.
`localhost` vẫn là **một** lớp; nó **không còn là lớp duy nhất**. Một câu như thế
trong artifact frozen là câu người sau dùng để quyết *"chỗ này không cần kiểm
quyền"*.

**5 · Bốn ca không AC nào phủ, và hai trong bốn là khoảng trống của CỔNG:**
- **`api-guard` không thấy `05_intake/gate.py`** — đường ghi **thứ ba** vào kho
  (plan `S6`). AC khai *"mọi ghi đi qua đúng MỘT hàm"*; câu đó đúng **trong phạm
  vi nó quét**, và phạm vi ấy không phải toàn bộ đường ghi.
- **`check_export_dan_xuat` gieo chỉ `repo` + `article`** — cả hai vào **một**
  bảng ⇒ cổng xanh trên một bản cài đặt làm **1/3** việc (plan `S11`).
- `PUT` khi `approved` mà nội dung **không** đổi: phép so *"nội dung đổi"* là so
  frontmatter, than, hay cả hai? (`AC-2.1.1 edge 9`)
- restore một bản mà `concepts.yaml` đã **mất** nhãn nó dùng ⇒ validate chặn ⇒
  **không restore được**. Ca thật, cùng bài học `dat-chuan.md` của M04.

⇒ Cả năm vào `backlog.md`. Mục 1–4 chạm `spec.md` FROZEN ⇒ **FR id**.
