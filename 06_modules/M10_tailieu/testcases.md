# M10_tailieu — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Spec khai `⬜ chưa dựng`, nhưng **cả ba lệnh `hard` đều XANH** và ba màn đã
> có trong `man-hinh.json` (đo 2026-09-03). Xem `§cuối` mục 1.

## 2.1 · Bảng của tài liệu — cùng hình dạng, CHECK hẹp hơn

**AC-2.1.1** — bảng chỉ nhận `source_type = 'tai-lieu'`; mọi ràng buộc của bảng
bài viết còn hiệu lực (thử vi phạm trên **BẢN SAO** DB)
- *happy*: INSERT một hàng `source_type: 'tai-lieu'` → nhận.
- *edge*: INSERT `source_type: 'video'` vào bảng này → **CHECK** từ chối. Đây là
  vế phân biệt *"ba bảng"* với *"một bảng + một cột"*: nếu CHECK không hẹp, tách
  bảng chỉ là đổi tên.
- *edge 2*: `frontmatter.source_type` **lệch** cột `source_type` → CHECK thứ hai
  (`json_extract(...) = source_type`) từ chối. Hai CHECK, hai câu khác nhau: một
  cái giới hạn **miền**, cái kia buộc **JSON khớp cột**.
- *edge 3*: `slug` trùng trong **cùng** bảng → từ chối. `slug` trùng ở bảng
  **khác** → nhận (khoá là kép, FR-023 GĐ 3).
- *edge 4*: hàng `tai-lieu` **thiếu `media`** → cổng validate chặn (`ho_so:
  thu-vien` đòi `media` hoặc `url_normalized`). Đây là ranh giới với M11: cùng hồ
  sơ, **khác thứ bắt buộc**.
- *edge 5*: `INSERT OR REPLACE` thay vì `INSERT` → nó **đi vòng** `BEFORE UPDATE`
  và `BEFORE DELETE` trigger (đã đo trên SQLite trong phiên này). Nếu bảng này có
  trigger bảo vệ, phép thử phải dùng `OR REPLACE`, không chỉ `INSERT`.
- *edge 6*: mọi ca trên chạy trên **bản sao** DB. Chạy trên `kb/_kho.sqlite` thật
  là đúng thứ `CẤM: sửa file thật để thử một cổng` nói, và thao tác **hoàn tác**
  là chỗ mất dữ liệu.

## 2.2 · Màn `/tai-lieu/` — danh sách + CRUD tại chỗ

**AC-2.2.1** — màn chỉ hiện bản ghi `tai-lieu`; gieo thêm bài viết và video thì
số đếm KHÔNG đổi
- *happy*: kho 3 tài liệu → màn hiện 3.
- *edge*: gieo thêm 5 bài viết + 4 video → màn **vẫn** 3. Phép thử phải gieo
  **cả hai** loại kia: gieo một loại thôi thì một bộ lọc sai (`!= 'video'`) vẫn
  xanh.
- *edge 2*: 0 tài liệu, có bài viết → màn hiện **trạng thái rỗng**, không hiện
  bài viết cho "đỡ trống", và **không** hiện mãi *"đang tải…"*. (Bài học commit
  `0035fa3`: danh mục kẹt *"đang tải…"* — phải **NÓI RA** khi tải thất bại.)
- *edge 3*: kho > `NGUONG.moiTrang` tài liệu → màn **cắt** và **nói ra** phần bị
  cắt. Shell mang mọi màn trong MỌI trang, nên một màn không cắt là *cả kho* nhân
  vào từng trang (plan `S19`: 120 bản ⇒ 144 thẻ thay vì 24).
- *edge 4*: phép đếm của test phải cắt đúng lưới của màn này, không cắt cả trang.
  Ba phép đo đã từng lấy sai phạm vi vì đúng chuyện này (plan `S20`).

**AC-2.2.2** — sửa một bản `tai-lieu` qua form của màn này thì `media.sha256`
KHÔNG đổi — **và điều đó đúng vì form CÓ ô `media`**, không vì `FM_GOC` giữ hộ
- *happy*: sửa `one_liner` → PUT 200, `media.sha256` giống hệt trước.
- *edge*: đặt `FM_GOC = null` rồi sửa → phải **422** (schema đòi `media` cho
  `ho_so: thu-vien`), **không** ghi một bản thiếu `media`. Đo được (plan `SỬA
  PLAN (6)`): kho được bảo vệ bằng **CẤU TRÚC**, không bằng may — nên `FM_GOC`
  hỏng **không** mất dữ liệu im lặng.
- *edge 2*: **vế thật của AC này** — form phải có ô `media` để người **xem và
  thay** được hiện vật. Phép thử: đọc markup của form màn này → có ô `media`.
  Nếu chỉ đo `sha256` không đổi thì một form **không có** ô `media` vẫn xanh
  (đúng thứ hôm nay đang xảy ra ở `#f-bai`) ⇒ AC xanh mà tính năng vắng.
- *edge 3*: thay hiện vật bằng file khác → `media.sha256` **phải đổi**, và byte cũ
  không được xoá khỏi `media` nếu bản ghi khác còn trỏ tới (`tham_chieu_media`
  UNION 5 nhánh).
- *edge 4*: `suaTuCua()` gọi `doiView("napbaiviet")` **không điều kiện** → sửa một
  TÀI LIỆU đưa người dùng sang màn nạp **BÀI VIẾT**. Đúng *"gộp chung màn"* người
  dùng cấm, và **nhìn thấy được**. Không AC nào phủ ca này.

## 2.3 · Màn nạp `/tai-lieu/nap/`

**AC-2.3.1** — form nạp có ô chọn `category` và `concepts` đọc từ danh mục; nhãn
ngoài danh mục bị chặn
- *happy*: chọn một `category` và hai `concepts` có trong danh mục → ghi thành công.
- *edge*: `concepts` chứa một id **ngoài** danh mục → chặn (cổng 5/5b của
  `validate.py`, áp cho **mọi** hồ sơ).
- *edge 2*: `GET /api/categories` **thất bại** → form phải **nói ra**, không hiện
  danh sách rỗng như thể danh mục không có nhãn nào. Danh sách rỗng và tải-thất-bại
  là hai trạng thái, và người dùng sẽ ghi bài không nhãn nếu chúng trông giống nhau.
- *edge 3*: danh mục **thật sự rỗng** → phải chốt: cho ghi không nhãn, hay chặn?
  Yêu cầu người dùng là *"tài liệu cũng gán với concept và category như bài
  viết"*, nên chặn — nhưng thế thì kho mới tinh **không nạp được gì**. Spec không
  nói cách thoát.
- *edge 4*: bỏ trống cả hai ô rồi bấm ghi → chặn **ở form**, không đợi 422.

**AC-2.3.2** — `file.size` kiểm **TRƯỚC** `fetch`
- *happy*: chọn file 30 MB (> trần 25 MB) → form chặn ngay, **0** request gửi đi.
- *edge*: file **đúng** 25 MB (`26214400` byte) → phải chốt `>` hay `>=`. Trần
  khai `tran_byte = 26214400`; một file đúng bằng nó là ca biên thật.
- *edge 2*: `file.size` = 0 (file rỗng) → chặn, và **magic-byte** cũng chặn (một
  file 0 byte không có byte mở đầu). Hai cổng cùng bắt; phép thử phải nói **cổng
  nào** báo, không thì gỡ một cổng vẫn xanh.
- *edge 3*: server **vẫn** phải chặn 30 MB kể cả khi FE không chặn — FE là tiện
  lợi, không phải cổng. Đo bằng cách gọi API trực tiếp, bỏ qua form.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *đọc/ghi bảng bài viết hay video*: quét mã của màn này → chỉ một tên bảng.
- *tự cầm SQL*: `api-guard` răng 2 — mọi mutation qua `web/api/dungchung.mjs`
  (M08-R2). ⚠️ Răng này đã đỏ thật một lần trong phiên này khi tôi đặt
  `DatabaseSync` ngoài `dungchung.mjs`; cách đúng là **dời mã**, không nới cổng.
- *nhận `sha256`/`so_byte` từ client*: gửi `sha256` bịa trong request → server
  **tính lại** và bỏ giá trị client (M09-R2).
- *trộn loại khác vào màn `/tai-lieu/`*: `AC-2.2.1`.

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · `§5` khai `⬜ chưa dựng`, nhưng module ĐÃ DỰNG.** Đo 2026-09-03: cả ba lệnh
`hard` xanh (`check_ba_bang.py` · `man-tai-lieu.test.js` · `thu-vien-nap.test.js`),
và `man-hinh.json` có cả `tai-lieu`. Đây là **chiều ngược** của lỗi M04/M06 (ở đó
nợ đã trả mà mục gốc nói còn đỏ); ở đây việc đã làm mà `§5` nói chưa. **Cùng một
cổng còn thiếu, hai chiều.**

**2 · Spec dùng TÊN BẢNG KHÔNG TỒN TẠI — 9 lần.** Spec viết bảng `documents` và
*"giữ nguyên mọi cột của `articles`"*. Bảng thật, đo trên `kho.schema.sql`:

```
bai_viet   (44)      tai_lieu  (70)      video  (94)
```

**Không** có `documents`, **không** có `articles`, **không** có `videos`. Tên đổi
trong lúc thi công (cùng đợt `loai-nguon.json`) và spec không đi theo. Nặng hơn
một con số lệch: một người đọc spec rồi viết `INSERT INTO documents` sẽ gặp lỗi
runtime, không gặp một câu sai vô hại.

⚠️ Và `M11_video/spec.md` có **3** lần cùng bệnh — nó viết `§2.1` bằng tên cũ
(*"khác `documents`"*, *"cùng hình dạng cột với `articles`"*) mà `§4` bằng tên mới
(*"không đọc/ghi bảng `bai_viet` hay `tai_lieu`"*). **Hai hệ tên trong một file.**

**3 · `AC-2.2.2` đo được cả khi tính năng VẮNG.** AC nói `media.sha256` không đổi
*"và điều đó đúng vì form CÓ ô `media`"* — nhưng **lệnh** chỉ đo được vế đầu.
Một form **không có** ô `media` (đúng trạng thái `#f-bai` hôm nay) vẫn cho
`sha256` không đổi, vì `FM_GOC` giữ hộ. ⇒ **AC xanh mà tính năng vắng.**
Đây đúng lớp lỗi tôi tự mắc ở `FR-051 §9`: đo sự **tồn tại** của một chỗ nghẽn
thay vì đo có gì **đi qua** nó. Vế thiếu: đọc markup form → phải có ô `media`.

**4 · Ba ca không có AC nào phủ, và một trong ba NHÌN THẤY ĐƯỢC:**
- `suaTuCua()` gọi `doiView("napbaiviet")` **không điều kiện** ⇒ sửa một tài liệu
  đưa người dùng sang màn nạp **bài viết** — đúng *"gộp chung màn"* người dùng
  cấm hai lần.
- `GET /api/categories` thất bại ⇒ form hiện danh sách rỗng như thể danh mục
  không có nhãn (`AC-2.3.1 edge 2`).
- danh mục **thật sự rỗng** ⇒ kho mới tinh **không nạp được gì**, và spec không
  nói cách thoát (`AC-2.3.1 edge 3`).

⇒ Cả bốn vào `backlog.md`. Mục 1, 2, 3 chạm `spec.md` FROZEN ⇒ **FR id**.
