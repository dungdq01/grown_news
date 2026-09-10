# M09_thuvien — bản ghi THƯ VIỆN: tài liệu tải lên + video theo URL

> Nguồn đối chiếu: `core/assets/kho.schema.sql` · `web/api/dungchung.mjs` ·
> `core/src/source_distiller/validate.py` · `web/render/`

| | |
|---|---|
| **Mở bởi** | `upgrade.md:83-99` — *"tải pdf + word + ppt + url video → lưu DB → mở tài liệu đã tải lên xem trên hệ thống"*, *"bộ nguồn gồm .md, pdf, word, ppt, url video"*, *"chế độ xem sẽ là preview"* |
| **Sở hữu** | hồ sơ kiểm `thu-vien` · bảng `media` (byte trong DB) · đường nạp hiện vật · màn xem trước |
| **Vào** | file người dùng tải lên (pdf/ppt/word ≤25 MB) · URL video (YouTube/TikTok) · nhãn `category`/`concepts` từ danh mục |
| **Ra** | một bản ghi trong `articles` với `ho_so: thu-vien` · một dòng `media` · byte export ra `kb/_media/<sha256>.<ext>` |
| **KHÔNG sở hữu** | giao thức phân tích (M01) · cửa ghi DB (M08) · export/import (M02) · chuyển đổi ppt→pdf (nợ, không ở v1) |

---

## 1 · Vì sao MỘT bảng, không phải ba

Người dùng nói *"module tài liệu, module video"*. Đó là cách nghĩ đúng về **nghiệp
vụ**, nhưng bảng lưu trữ là chuyện khác — và số đo quyết định:

`khoDoc()` (`web/api/dungchung.mjs:197`) là **cửa đọc duy nhất**, và
`web/render/trang.mjs:285` buộc `const tatCa = data.bans ?? []` rồi **~40 chỗ**
`filter/reduce` sinh mọi KPI, biểu đồ, thẻ, số đếm từ nó. Chuỗi `"articles"` **không
xuất hiện một lần nào** trong `trang.mjs`.

⇒ Bản ghi mới nằm trong `articles` thì **dashboard và Kho tổng hợp MIỄN PHÍ** — đúng
thứ `upgrade.md` đòi (*"trang dashboard lúc này sẽ tổng hợp All"*). Bảng thứ hai buộc
mọi query phải `UNION` và vẫn phải tự tổng hợp đúng 17 field `Ban`.

Thêm nữa `(source_type, slug)` là khoá của: VIEW `nhan`, `article_versions`,
`recycle`, bookkeeping `version`/`etag`, `chuyenSangRac`, `phucHoi`, route
`/api/articles/:type/:slug`, deep-link SSR. Ba bảng là ba bản sao của tất cả.

**Một `source_type` mới, không hai.** `media.mime` đã mang format, và `khoi3D` chỉ
hiện 3 cột (`NGUONG.cot3D`) nên thêm hai loại là ăn hết chỗ. Bản ghi video **dùng lại**
`source_type: video` đã có.

**KHÔNG gộp vào `docs`** — `05_intake/gate.py:158` khai `docs` là *"tài liệu chính
thức"*; trộn một PPT tải lên với một trang docs sản phẩm phá nghĩa trục thô nhất của
sidebar.

## 2 · Hợp đồng

### 2.1 · DB — bảng `media`, địa chỉ theo nội dung

```sql
-- source_type: THÊM MỘT giá trị. article_versions/recycle không có CHECK nên
-- không phải sửa.
source_type TEXT NOT NULL CHECK (source_type IN
  ('repo','paper','video','article','docs','announcement','tai-lieu')),

CREATE TABLE media (
  sha256      TEXT PRIMARY KEY,          -- MÁY tính từ byte, KHÔNG nhận từ client
  byte        BLOB NOT NULL,
  la_dan_xuat INTEGER NOT NULL DEFAULT 0,
  so_byte     INTEGER GENERATED ALWAYS AS (length(byte)) VIRTUAL
);
```

**Không cột metadata nào trong `media`.** `mime`, `ten_goc`, `so_byte` sống trong
`articles.frontmatter.media` — cùng triết lý *"mọi cột khác GENERATED từ JSON"* ở đầu
`kho.schema.sql`. Hai nơi khai một sự thật sẽ lệch.

**Địa chỉ theo nội dung** (`sha256` là khoá chính) cho ba thứ miễn phí: export
idempotent tự nhiên · dedup hai bản ghi dùng chung một file · `etag` hợp pháp vĩnh viễn.

`la_dan_xuat` khai **ngay v1** dù chưa ai set: nó là chỗ ngồi cho bản PDF chuyển đổi từ
ppt/word sau này. Thêm cột sau = một lần dựng lại DB huỷ diệt nữa (SQLite không
`ALTER` được `CHECK`).

> **AC-2.1.1** · Bảng `media` có `sha256` làm PK, `byte` BLOB NOT NULL, và
> `so_byte` là cột GENERATED — không ai ghi được số byte lệch byte thật.
> `hard` · `cmd: python -m pytest core/tests -q -k media`

> **AC-2.1.2** · `source_type` nhận `tai-lieu`; một `source_type` ngoài enum vẫn bị
> CHECK chặn. Hai CHECK đồng bộ `frontmatter`↔cột vẫn bắn.
> `hard` · `cmd: python -m pytest core/tests -q -k media`

> **AC-2.1.3** · Round-trip `file → DB → file → DB′` giữ nguyên byte hiện vật, và lần
> export thứ hai ghi **0 file** (fixpoint). Luật mồ côi hợp **union ba bảng**
> `articles` + `article_versions` + `recycle`.
> `hard` · `cmd: python core/tests/check_media_dan_xuat.py`

### 2.2 · Hồ sơ kiểm thứ hai — `thu-vien`

Bản ghi thư viện **không** cần thân 5 mục. Nhưng cửa ghi vẫn là **một** cửa:
`ghiSauValidate` không đổi, chỉ khối hình dạng thân bài trong `validate.py` được bọc:

```python
ho_so = fm.get("ho_so") or "phan-tich"     # thiếu ⇒ phan-tich: bài cũ không phải sửa
if ho_so == "thu-vien":
    # cổng mục/dẫn nhập/tinh túy/locator KHÔNG áp — đây là HIỆN VẬT + NHÃN
    # bù lại: thân >400 từ ⇒ đặt sai hồ sơ; tai-lieu phải có media;
    #         video phải có url_normalized
else:
    <khối mục theo khung khai>
```

**Giữ BẬT cho cả hai hồ sơ**: frontmatter parse · schema · `word_count` khai==đếm ·
`concepts` ⊆ danh mục · `category` ⊆ danh mục · external spot-check · `url_normalized`
dẫn xuất · `rejected ⇒ reject_reason`.

Cổng danh mục bật cho cả hai **chính là** yêu cầu *"các module mới cũng cần có danh
mục: category, concept"* — và VIEW `nhan` (`kho.schema.sql:52-60`) đếm nhãn qua
`json_each(frontmatter)` nên nó **không cần sửa gì**.

> **AC-2.2.1** · Bản ghi `thu-vien` thân rỗng đi qua cổng; bản ghi `phan-tich` thiếu
> mục vẫn bị chặn (nhánh mới không được nuốt cổng cũ); `thu-vien` thân >400 từ bị
> chặn; `tai-lieu` không khai `media` bị chặn.
> `hard` · `cmd: python -m pytest core/tests -q -k "thu_vien"`

> **AC-2.2.2** · `normalize_url` xử lý TikTok (`tiktok.com/@user/video/ID` →
> `tiktok.com/video/ID`); link rút gọn `vm.tiktok.com` **không** giải được offline nên
> trả về host+path và form nạp phải nói ra.
> `hard` · `cmd: python -m pytest core/tests -q -k tiktok`

### 2.3 · Đường nạp hiện vật

Byte đi **trước**, bản ghi đi **sau** — vì `source_type: tai-lieu ⇒ required: media`
nghĩa là bản ghi không thể tồn tại hợp pháp trước blob của nó.

```
POST /api/articles/media          content-type: <mime trong enum đóng>
                                  content-length: <kiểm TRƯỚC khi đọc byte>
                                  x-ten-goc: <chỉ để hiện, NEVER là đường dẫn>
  → 201 { sha256, so_byte, mime }
POST /api/articles                { frontmatter: { ho_so, media: {…} }, body }
```

Blob chưa có bản ghi tham chiếu là hợp pháp đúng khoảng thời gian người dùng điền
form. Bỏ form giữa chừng ⇒ **lần `banXuat()` kế tiếp reap nó như mồ côi**. Tự lành,
không cần state machine, không cần cron dọn.

**Trần riêng, KHÔNG nới trần cũ**: `TRAN = 1 MB` (body JSON) là chặn bù của **mọi** lần
ghi bài; media có `TRAN_MEDIA = 25 MB` riêng.

**Lớp thứ sáu cho intake**: năm lớp hiện có không soi byte. Kiểm **magic-byte** phải
khớp mime khai (`%PDF-`, `PK\x03\x04`, `\xD0\xCF\x11\xE0`). ~10 dòng, 0 dep. Đây là
phòng thủ duy nhất chống file HTML-có-script dán nhãn `application/pdf`.

> **AC-2.3.1** · `sha256` và `so_byte` do **máy** tính; một `media.sha256` bịa không
> có trong bảng `media` bị từ chối ở cửa ghi; magic-byte lệch mime bị từ chối; body
> 26 MB trả **413** trước khi đọc hết byte.
> `hard` · `cmd: cd web && node test/thu-vien.test.js`

> **AC-2.3.2** · Mọi đường ghi media nằm dưới tiền tố `/api/articles/…` nên whitelist
> literal của `no-write-path` **không cần sửa**; và `luuHienVat` chứa `giaoDich(` thì
> phải chứa `banXuat(` (api-guard răng 3).
> `hard` · `cmd: cd web && node test/api-guard.test.js && node test/no-write-path.test.js`

### 2.4 · Giao diện — nạp và xem

**Nạp**: màn Nạp nguồn đã có ba tab (`t-link` dán URL · `t-file` nộp `.md` ·
`t-viet` viết form). Thêm **tab thứ tư** cho thư viện: chọn file **hoặc** dán URL
video, cộng ô tiêu đề · một câu · nhãn. **Không** có 8 ô thân bài — hồ sơ này không
đòi.

**Xem** — ba hình dạng, và một trong ba là *không render được*, nói thẳng:

| Loại | v1 |
|---|---|
PDF | `<iframe>` — Chrome/Edge/Firefox đều có viewer sẵn, **0 thư viện** |
Video | **click-to-load**: vẽ poster + nút play, **không request gì** tới khi người dùng bấm; rồi nhúng `youtube-nocookie.com` / `tiktok.com/embed` |
PPT · Word | **KHÔNG xem trước được** mà không chuyển đổi. v1: thẻ tài liệu (icon mime · tên gốc · kích cỡ · nhãn · one_liner) + nút **Tải về** |

Ba đường đã cân và loại, ghi lại để không ai bàn lại: Office/Google viewer đòi file
**công khai trên internet** — máy này bind 127.0.0.1 và tài liệu là nội bộ · renderer
client-side chỉ có `mammoth.js` cho `.docx` (lossy, và không có bản cho `.pptx`) ·
`soffice --headless` chạy được nhưng thêm một binary ngoài vào `RUNNING.md` ⇒ **nợ,
không phải v1**.

**Egress**: nhúng video là **lần ĐẦU** sản phẩm gọi ra mạng ngoài — chỏi thế trận hiện
tại (bind 127.0.0.1, `analytics: null`, `no-leak.test.js`). Người dùng đã ký, kèm ba
giảm thiểu: click-to-load · `youtube-nocookie` · `src` dựng từ **whitelist host + regex
id**, không bao giờ từ `fm.url` thô.

> **AC-2.4.1** · Lối nạp thứ tư có ở CẢ HAI `shell.html` và có nhánh xử lý; bảng
> mime tới bundle qua `__MEDIA__` (không gõ tay chuỗi mime nào trong `.ts`);
> **`file.size` kiểm TRƯỚC `fetch`**; `ho_so` + `media` có trong shape `Ban` ở
> **cả ba** đường dữ liệu (`banTuDb` · `docTuDia` · `/api/index`).
>
> *B7b sửa AC này: bản B0 trỏ `luong-nap-bai.test.js` — cổng đó canh form VIẾT
> BÀI, không canh lối thư viện. Và bản B0 nói "thiếu cả file và URL" như thể một
> form làm hai việc; thực tế lối 4 chỉ nhận FILE, còn video đăng ký URL đi qua
> form viết bài với `source_type: video`. Cộng một điều B0 không biết: có **ba**
> builder `Ban`, không hai (xem `WL-01K9NBFR036B8`).*
> `hard` · `cmd: cd web && node test/thu-vien-nap.test.js && node test/hai-ban-shape.test.js`

> **AC-2.4.2** · PDF khung được; video **không** request gì trước khi bấm; ppt/word ra
> thẻ + tải về (không phải khung trắng); `src` của iframe không bao giờ dựng từ
> `fm.url`; `ten_goc` được `esc()`.
> `hard` · `cmd: cd web && node test/media-cua-so.test.js && node test/no-dangerous-html.test.js`

> **AC-2.4.3** · Đường phục vụ byte mang đủ sáu đầu đề: `content-type` từ enum đóng
> (**không** sniff từ tên file) · `nosniff` · `content-disposition` (`inline` cho pdf,
> **`attachment`** cho ppt/doc) · CSP `default-src 'none'; sandbox` · `etag` ·
> `cache-control: immutable`.
> `hard` · `cmd: cd web && node test/media-dau-de.test.js`

### 2.5 · Tổng hợp All — số đếm và thước đo KHÁC nhau

Người dùng đòi *"dashboard tổng hợp All"*. Số đếm thì đúng ý. Nhưng **thước đo chất
lượng không có nghĩa** trên bản ghi thư viện: `priority` sinh từ `fm.skill_candidates`
(`data.mjs:219`) nên tài liệu luôn 0; `credibility_max` mô tả một bản phân tích, không
mô tả một file PDF.

50 PDF sẽ: chiếm 1 trong 3 cột `khoi3D` · đẩy histogram ưu tiên về ~100% "thấp" · làm
phẳng cột duyệt/chờ/loại. Đó là cách làm dashboard **tệ hơn trước** trong khi mọi con
số vẫn "đúng".

⇒ **Số đếm trên `tatCa`; thước đo chất lượng chỉ trên `ho_so === "phan-tich"`; mỗi
pane khai rõ nền của nó** (quy ước đã có ở `trang.mjs:699`).

> **AC-2.5.1** · Gieo 3 bản phân tích + 4 bản thư viện: mọi số đếm khớp bảng tính tay;
> pane chất lượng **không** đổi khi thêm bản thư viện; sidebar lọc theo loại hiện
> `tai-lieu` với số đúng.
> `hard` · `cmd: cd web && node test/thu-vien-tong-hop.test.js && node test/filter-counts.test.js`

## 3 · Trạng thái

✅ **as-built** — FR-037 duyệt 2026-08-27, thi hành xong 2026-08-28 (B1→B10).

| Rule | Bề mặt S3 đang canh nó | Xanh |
|---|---|---|
M09-R1 mồ côi hợp UNION BA bảng · khoá không nói dối | `core/tests/check_media_dan_xuat.py` | ✅ |
M09-R2 máy cầm khoá · magic-byte là lớp thứ sáu | `web/test/thu-vien.test.js` | ✅ |
M09-R3 `src` từ whitelist · click-to-load | `web/test/media-cua-so.test.js` | ✅ |
M09-R4 chất lượng không trộn · mỗi pane khai nền | `web/test/thu-vien-tong-hop.test.js` | ✅ |
M09-R5 `TRAN` và `TRAN_MEDIA` là HAI hằng | `web/test/api-guard.test.js` §7 | ✅ |
DDL — mọi ràng buộc bắn thật trên bản sao | `core/tests/check_media_ddl.py` | ✅ |
Sáu đầu đề an toàn trên đường phục vụ | `web/test/media-dau-de.test.js` | ✅ |

### Ba điều spec này KHÔNG bao và người sau phải biết

**Blob bỏ dở nằm lại trong DB.** Exporter khai *CHỈ SELECT* nên nó reap **file**,
không reap **dòng**. Nạp một PDF rồi bỏ form ⇒ 25 MB nằm lại, không export,
không ai thấy. **Không mất dữ liệu** — chỉ tốn chỗ. Cần một lệnh dọn riêng dùng
**chung** phép tính mồ côi của exporter (ô backlog `M08_api`).

**`413` không tới được client giữa lúc upload.** Trình duyệt nhận ECONNRESET trên
đường ghi trước khi kịp đọc phản hồi. Nên FE **phải** tự kiểm `file.size`; trần ở
server là lớp thứ hai, không phải lớp duy nhất.

**Đuôi file KHÔNG phân biệt được pptx với docx** — cả hai là ZIP (`504b0304`).
Magic-byte chặn được file lạ đội lốt Office, không chặn được người đổi tên
`.docx` thành `.pptx`. Muốn chặn phải đọc `[Content_Types].xml`; quá tay cho v1.
