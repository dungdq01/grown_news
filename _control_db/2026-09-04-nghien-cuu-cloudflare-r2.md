# Nghiên cứu + kế hoạch — chuyển dữ liệu lên Cloudflare R2

**Ngày**: 2026-09-04 · **loại**: nghiên cứu + phương án · **agent**: kiểm soát dữ liệu
**Trạng thái**: BÁO CÁO — không mở FR, không viết code, không đặt bucket.
**Phục vụ**: `FR-060 §1` mốc **kế** (video mp4 lên R2) và mốc **sau nữa** (toàn bộ
dữ liệu). `FR-060 §5` đã khai *"không dựng client R2, không đặt bucket"* — file
này là phần **đo** mà hai mốc đó còn thiếu.

> ⚠️ **Team agent đang thi công s7/s8 cho M12.** Không mục nào dưới đây đòi sửa
> file M12 đang mở. Mọi số đo kèm lệnh tái chạy được.

---

## 0 · Kết luận trước, lý do sau

**Ba câu:**

1. **R2 hợp với bài này, và gần như miễn phí** — ~**$0,16/tháng** ở quy mô 12
   tháng tới (~21 GB). Rẻ hơn Cloudflare Stream **~50×** cho đúng nhu cầu.
2. **Nhưng R2 không phải "chỗ để DB".** SQLite của dự án **không** lên
   Cloudflare được mà không phá `M08-R1` + `M08-R2` — xem §7. Câu *"sau này tất
   cả dữ liệu đẩy lên Cloudflare"* nếu hiểu là *"DB chạy trên Cloudflare"* thì
   nó là một quyết định kiến trúc khác hẳn, không phải một bước migrate.
3. **Chặn thật không nằm ở kỹ thuật, nằm ở `ADR-05 Z2`**: LÕI (`web/`) **không
   được gọi ra ngoài `127.0.0.1`**. Client R2 đặt trong `web/api/**` là vi phạm
   Z2 — và **không cổng nào bắt được**, vì `api-guard.test.js` có 5 điều, không
   điều nào là Z2 (đo ở §3.1).

**Bảng quyết định — bốn thứ chỉ chủ dự án chốt được** (chi tiết §12):

| # | câu hỏi | đề xuất của tôi |
|---|---|---|
| Q1 | Ai giữ khoá R2 — LÕI hay THỢ? | **THỢ** — giữ nguyên học thuyết `can_key_model` |
| Q2 | Trình duyệt tải video từ đâu? | **thẳng từ R2** bằng presigned URL ngắn hạn |
| Q3 | Bytes hiện vật (`media.byte`) có rời SQLite không? | **có, nhưng ở giai đoạn 3** — không cùng lượt với video |
| Q4 | Bản lùi `_backup/` (có DLCN) có lên R2 không? | **KHÔNG** cho tới khi có hồ sơ TIA — §9 |

---

## 1 · Đo hiện trạng — máy, không chép tay

```bash
py -3.13 -c "import sqlite3;c=sqlite3.connect('kb/_kho.sqlite');\
print(list(c.execute('SELECT count(*),coalesce(sum(length(byte)),0) FROM media')))"
# → [(1, 2976936)]        1 hiện vật · 2,98 MB

du -sh kb/_media           # → 2.9M

grep -rn "boto3\|@aws-sdk\|r2.cloudflarestorage\|S3Client" \
     --include=*.json --include=*.toml --include=*.py --include=*.mjs . | grep -v node_modules
# → 0 dòng                 CHƯA có một dòng client S3/R2 nào trong repo
```

| | hôm nay |
|---|---|
| hiện vật trong DB | **1 object · 2,98 MB** (`media.byte` BLOB trong `kb/_kho.sqlite`) |
| hiện vật trên đĩa | `kb/_media/<sha256>.<đuôi>` — export dẫn xuất của `xuat_kho.py` |
| video | **0 byte trong kho.** `media-mime.json` `$comment_tran`: *"Muốn video 200 MB thì câu trả lời là ĐĂNG KÝ URL, không phải nới trần"* — hôm nay video là URL youtube/tiktok/fb/douyin |
| trần | `tran_byte: 26214400` (25 MiB) · `FR-054-va-tran-1gb` **chờ người ký** nâng lên 1 GiB |
| ảnh trong git | 33 file ~25 MB (`FR-060 §2.3`) |
| client R2 | **chưa có** |

**Đây là thời điểm rẻ nhất để làm.** Một object trong kho, không có client nào
để tháo, không có URL nào đã phát ra ngoài. Mọi quyết định dưới đây đắt hơn
tuyến tính theo số object.

---

## 2 · Sự thật về R2 — có nguồn, truy 2026-09-04

### 2.1 · Giá

| | Standard | Infrequent Access |
|---|---|---|
| lưu trữ | **$0,015 / GB-tháng** | $0,01 / GB-tháng |
| Class A (ghi: `PutObject`, `UploadPart`, `CreateMultipartUpload`, `CompleteMultipartUpload`, `ListObjects`, `CopyObject`…) | **$4,50 / triệu** | $9,00 / triệu |
| Class B (đọc: `GetObject`, `HeadObject`…) | **$0,36 / triệu** | $0,90 / triệu |
| **egress** | **$0** | **$0** |
| phí lấy dữ liệu | không | $0,01 / GB |
| lưu tối thiểu | không | **30 ngày** |

**Free tier (vĩnh viễn, chỉ Standard)**: **10 GB-tháng** lưu trữ ·
**1 triệu** Class A/tháng · **10 triệu** Class B/tháng.
`DeleteObject`, `DeleteBucket`, `AbortMultipartUpload` **miễn phí**.

### 2.2 · Giới hạn kỹ thuật

| | số |
|---|---|
| object lớn nhất | **4,995 TiB** (5 TiB − 5 GiB) |
| một lần PUT / một part | **4,995 GiB** (5 GiB − 5 MiB) |
| part nhỏ nhất (trừ part cuối) | **5 MiB** |
| nhất quán | **strong consistency** — ghi xong đọc thấy ngay, toàn cầu |
| REST API (quản trị) | 1.200 req / 5 phút / tài khoản — **không** dùng cho đường dữ liệu |
| `r2.dev` | **có rate limit, KHÔNG dùng cho production** (429 ở hàng trăm req/s) |
| production | **custom domain** (`assets.example.com`) hoặc S3 endpoint |
| presigned URL | có — **chỉ dùng được với S3 endpoint**, **không** với custom domain |
| Range request | có — R2 trả **206** cho ranged GET ⇒ **tua video được** |
| checksum | `PutObject` nhận **sha256** (và sha1/md5) ⇒ **buộc được nội dung khớp khoá** |
| event notification | R2 → **Queues**, tới 5.000 msg/s |
| lifecycle | chuyển Standard → IA theo tuổi, hoặc xoá theo tuổi |
| jurisdiction | **`eu`** (EEUR/WEUR) · **`fedramp`** (ENAM/WNAM) · mặc định: **không cam kết vị trí** |

⚠️ **Không có jurisdiction `vn`.** Đây là gốc của §9.

### 2.3 · R2 so với Cloudflare Stream — cho đúng bài này

| | R2 | Stream |
|---|---|---|
| lưu | $0,015/GB-tháng | **$5 / 1.000 phút lưu**, bất kể dung lượng |
| phát | $0 (egress free), tính Class B | **$1 / 1.000 phút phát** |
| transcode / ABR / HLS | **không có** — bạn phát file gốc | **có sẵn**, encode miễn phí |
| tua | có (Range 206) | có |
| ai xem được | bạn tự canh (presigned / Access) | signed token có sẵn |

**Ước cho 100 video × 20 phút (~15 GB)**: R2 ≈ **$0,08/tháng** ·
Stream = 2.000 phút lưu = **$10/tháng** + phí phát.
⇒ **R2 rẻ hơn ~50×.** Đổi lại: người xem tải nguyên file ở bitrate gốc, không
có bản nhẹ cho mạng yếu. Với **6 người dùng nội bộ** (`prd.md:8`), đó là đánh
đổi đúng.

> **Ngưỡng để xét lại**: khi có người xem trên 4G, hoặc số người xem vượt vài
> chục. Lúc đó Stream — hoặc tự transcode trong M16 rồi đẩy nhiều bitrate lên
> R2 — mới đáng tiền.

---

## 3 · Bốn ràng buộc CỦA DỰ ÁN mà R2 va vào

Đây là phần không có trong tài liệu Cloudflare, và là lý do file này tồn tại.

### 3.1 · `[chặn]` `ADR-05 Z2` — LÕI không được gọi ra ngoài, và KHÔNG cổng nào canh

**Luật**: `core/assets/dich-vu.json` `$comment_vung` — *"LOI: nghe loopback,
**KHONG BAO GIO goi ra ngoai loopback**"*. Cổng **Z2** ở `04_system/adr.md#ADR-05`.

**Đo**: `web/test/api-guard.test.js:5-11` khai đúng **năm** điều:

```
1 handler không cầm lời gọi fs ghi   2 spawn validate.py --strict, không unlink
3 không listen( / 0.0.0.0            4 không literal default cho trường quyết định
5 không đường nào ghi "approved" bằng literal
```

**Không điều nào là Z2.** `ADR-05` đã tự khai lỗ này (*"api-guard.test.js hiện
chỉ quét `web/api/` … phải được tổng quát hoá thành cổng theo VÙNG"*) và nó
**vẫn chưa được vá**.

⇒ Hôm nay ai thêm `new S3Client(...)` vào `web/api/dungchung.mjs` thì **mọi cổng
vẫn xanh**. Ràng buộc kiến trúc quan trọng nhất của dự án đang không có răng, và
R2 là thứ đầu tiên sẽ thử nó.

**Hệ quả cho kế hoạch**: cổng Z2 phải có **TRƯỚC** dòng client R2 đầu tiên,
không phải sau. Xem cổng `R1` ở §10.

### 3.2 · `[chặn]` Học thuyết `can_key_model` — LÕI không giữ bí mật ngoài

`dich-vu.json` `$comment_key_model`, nguyên văn:

> *"Chỉ THỢ nhận key. Đây là cưỡng chế bằng CẤU TRÚC cho B-E2: **LÕI không có gì
> để xác thực nên không gọi model được kể cả khi ai đó viết nhầm một dòng
> fetch**."*

Khoá R2 là **cùng loại vật** với khoá model: một bí mật cho một dịch vụ ngoài.
Đặt nó vào `web/` là gỡ đúng cái cưỡng chế-bằng-cấu-trúc mà câu trên mô tả — và
gỡ nó **cho R2** thì lần sau gỡ **cho cái khác** không còn lý do để từ chối.

⇒ Đây là gốc của **Q1**, và là lý do tôi đề xuất THỢ giữ khoá (§5).

### 3.3 · `[chặn]` `B-C1` / `check_export_dan_xuat` — kho phải dựng lại được từ file

`kb/_kho.sqlite` là **dẫn xuất**: `dung_lai_db.py` xoá rồi dựng lại từ `kb/`, và
`dung_lai_db.py:174-188` nạp `media.byte` **từ `kb/_media/`**, kiểm tên file =
sha256 của chính byte.

Nếu byte hiện vật chỉ còn trên R2 thì `dung_lai_db.py` **không dựng lại được
bảng `media`** ⇒ `check_export_dan_xuat` / `check_media_dan_xuat` mất nghĩa.

**Không phải lý do để không làm** — mà là lý do phải khai R2 **thay chỗ của
`kb/_media/`**, chứ không phải **thêm một chỗ nữa**. Hai chỗ giữ byte là hai
nguồn chân lý, đúng thứ `ADR-04`/`ADR-06` tồn tại để chặn.

### 3.4 · `[chặn]` Lớp thứ SÁU của intake — magic-byte — chết nếu upload thẳng lên R2

`core/assets/media-mime.json` `$comment_magic`, nguyên văn:

> *"`magic` là byte MỞ ĐẦU phải khớp… Đây là LỚP THỨ SÁU của intake: năm lớp
> hiện có **KHÔNG lớp nào soi byte**. Không có lớp này thì một file
> HTML-có-script dán nhãn `application/pdf` được phục vụ lại SAME-ORIGIN."*

Trình duyệt `PUT` thẳng lên R2 bằng presigned URL ⇒ **không byte nào đi qua
LÕI** ⇒ lớp thứ sáu **không chạy**.

Và `kho.schema.sql:181`: `sha256` — *"MÁY tính, **KHÔNG nhận từ client**"*.
Upload thẳng thì client chọn khoá object ⇒ client tự khai sha256.

**Cả hai đều vá được** (§6.2), nhưng phải vá **cùng lượt**, không phải sau.

---

## 4 · Ba tầng dữ liệu — ba số phận, đừng trộn

`ADR-06` đã dạy dự án chia dữ liệu theo *"dựng lại được hay không"*. R2 cần thêm
một trục: *"có DLCN hay không"*.

| tầng | ví dụ | dựng lại được? | có DLCN? | lên R2? |
|---|---|---|---|---|
| **1 · nội dung kho** | `kb/**/*.md`, `concepts`, `categories` | ✅ từ git | ❌ | **không cần** — git đã là backup, và chúng nhỏ |
| **2 · byte hiện vật** | pdf/pptx, **video mp4**, slide+giọng đọc của M16 | ❌ *(byte là thứ không dựng lại được — `M09-R1`)* | ❌ | ✅ **ĐÂY LÀ VIỆC** |
| **3 · dữ liệu gốc LÕI** | `nguoi_dung.ten`, `dinh_danh_kenh.chat_id`, `phien`, `ma_moi`, `nhap_chung_cat` | ❌ | ✅ **có** (`loi.schema.sql:28,62`) | ⛔ **KHÔNG** cho tới khi có hồ sơ TIA (§9) |

**Toàn bộ kế hoạch dưới đây chỉ nói về tầng 2.** Tầng 1 không cần R2. Tầng 3
**không được** lên R2 hôm nay — và đó là câu trả lời kỹ thuật cho *"sau này tất
cả dữ liệu đẩy lên Cloudflare hết"*: **tất cả, trừ tầng 3, cho tới khi giấy tờ
xong.**

---

## 5 · Kiến trúc đề xuất — và hai phương án bị loại

### 5.1 · Đề xuất: R2 là **hộc byte của THỢ**, LÕI giữ con trỏ

```text
                  ┌───────────── LÕI · web:8787 ──────────────┐
trình duyệt ─────►│ GET /api/hien-vat/<sha>/url               │
   │              │  ① tra `phien` → ai đang hỏi   (B-D3b)    │
   │              │  ② gọi 127.0.0.1:879x  ───────┐           │
   │              │  ③ trả { url, het_han }       │           │
   │              └───────────────────────────────┼───────────┘
   │                                              ▼
   │                       ┌──── THỢ · kho-hien-vat ───────────┐
   │                       │ GIỮ khoá R2                       │
   │                       │ KÝ presigned URL  (HMAC, KHÔNG    │
   │                       │   một byte mạng nào)              │
   │                       │ kiểm magic-byte · xác nhận sha256 │
   │                       └───────────────┬───────────────────┘
   │                                       │ S3 API — egress của THỢ
   ▼                                       ▼
GET/PUT thẳng ────────────────────► Cloudflare R2
(206 Range · egress $0)              bucket: kho-hien-vat
```

**Bốn tính chất, mỗi cái đổi lấy một ràng buộc đã ký:**

| tính chất | giữ được gì |
|---|---|
| khoá R2 **chỉ** ở THỢ | `can_key_model` nguyên văn (§3.2) — LÕI vẫn không có gì để xác thực |
| LÕI **không** gọi R2 | `Z2` nguyên văn (§3.1); LÕI chỉ gọi `127.0.0.1`, đúng thứ `ADR-05` đã cho phép |
| byte **không** đi qua LÕI | `web/` không gánh băng thông video; egress R2 = $0 |
| URL do LÕI **quyết định có cấp hay không** | `B-D3b` — *"kho chỉ tới người trong `nguoi_dung`"* vẫn cưỡng chế ở LÕI |

> **Điểm tinh tế đáng đọc kỹ**: *ký* một presigned URL là **HMAC-SHA256 trên một
> chuỗi**, **không có một byte mạng nào**. Nên xét riêng `Z2`, ký URL ở LÕI cũng
> **không** phải "gọi ra ngoài". Tôi vẫn đề xuất đặt ở THỢ — không vì `Z2`, mà
> vì §3.2: chỗ để **khoá**, không phải chỗ để **phép tính**.

**Cái mất, nói thẳng**: thêm một tiến trình. `ADR-05` đang có 7 dịch vụ; cái này
là thứ 8. **Tôi KHÔNG gán chủ cho nó** — `FR-048` đã dạy đúng bài đó (*"`owner`
là thứ `phạm_vi_ghi` neo vào; gán sai chủ thì `R1` mất địa chỉ"*). Hai lối: một
dịch vụ mới, hay mở rộng `M16_artifact` (đã là THỢ, python, đã sinh media).
**Chủ dự án chốt.**

### 5.2 · Loại — "client R2 trong `web/api/`"

Ngắn nhất để viết, và nó phá **cả hai** §3.1 và §3.2 cùng lúc. Nếu chọn nó thì
phải là một **FR sửa `ADR-05`**, không phải một task. Ghi ra để nó là một lựa
chọn **có giá**, không phải một đường tắt vô hình.

### 5.3 · Loại — "bucket public + custom domain, ai có link thì xem"

Rẻ và nhanh. Nhưng nó **xoá `B-D3b`**: *"Kho chỉ tới người trong `nguoi_dung`.
Không SEO, không link công khai, không ai đọc được mà không có account."*
Một URL R2 công khai là **đúng định nghĩa** một link công khai.

Nếu chủ dự án muốn hướng này, đường hợp lệ là **custom domain + Cloudflare
Access**. Lúc đó việc canh *"ai được xem"* chuyển từ LÕI sang Cloudflare — một
quyết định về **nơi đặt cổng quyền**, phải qua FR.

---

## 6 · Đường ghi và đường đọc — đủ chi tiết để chia task

### 6.1 · Khoá object — dùng lại thứ dự án đã có

```
kho-hien-vat/media/<sha256>            # không đuôi: mime sống trong frontmatter
```

`kho.schema.sql:159-163` đã khai *"ĐỊA CHỈ THEO NỘI DUNG: `sha256` là khoá
chính, và nó cho ba thứ MIỄN PHÍ — export idempotent · dedup · `etag` hợp pháp
vĩnh viễn"*. **Ba thứ đó chuyển thẳng sang R2 không mất gì**:

- PUT cùng nội dung hai lần = cùng khoá = **idempotent tự nhiên**;
- hai bản ghi dùng chung một file = **một object**;
- `ETag` của R2 khớp khái niệm `etag` đang dùng.

⇒ **Không cần nghĩ ra sơ đồ khoá mới.** Đây là món quà của một quyết định cũ.

### 6.2 · Upload — vá hai lỗ của §3.4

| kích cỡ | đường | magic-byte | sha256 |
|---|---|---|---|
| **≤ 25 MiB** (tài liệu) | **giữ nguyên hôm nay**: qua LÕI, `napHienVat` → DB | ✅ chạy như cũ | ✅ máy tính |
| **> 25 MiB** (video, artifact M16) | presigned **PUT** thẳng lên R2 | ⚠️ xem dưới | ⚠️ xem dưới |

Hai vá, cả hai **có cơ chế sẵn của R2**:

1. **Buộc `sha256` vào chính chữ ký.** `PutObject` của R2 nhận
   `x-amz-checksum-sha256`. Ký presigned URL **kèm** giá trị đó ⇒ client gửi
   byte khác thì **R2 từ chối**, không phải ta phải phát hiện sau. Câu
   *"`sha256` MÁY tính, KHÔNG nhận từ client"* (`kho.schema.sql:181`) **vẫn
   đúng**: máy quyết định giá trị lúc ký, client chỉ có thể khớp hoặc trượt.
   ⚠️ Điều kiện: bên ký phải **biết trước** sha256 ⇒ client băm trước khi xin
   URL. Với video 200 MB trong trình duyệt, đó là một lượt đọc file — chấp nhận được.

2. **Magic-byte kiểm SAU, bằng máy, không bằng lời hứa.** **R2 event
   notification → Queue** bắn khi object mới xuất hiện; THỢ đọc **256 byte
   đầu** (một ranged GET = 1 Class B) và so với `media-mime.json`. Không khớp ⇒
   xoá object (`DeleteObject` **miễn phí**) + ghi `audit`.
   ⇒ Bản ghi chỉ **hiện ra** sau khi qua kiểm — cùng khuôn `M05-R1` (*mọi thứ
   nạp vào dừng ở `draft`*).

> ⚠️ **Cái mất phải khai**: giữa lúc PUT xong và lúc verifier chạy, R2 **có** một
> object chưa soi byte. Nó không phục vụ được cho ai (chưa bản ghi nào trỏ tới),
> nhưng nó tồn tại. Đây là khác biệt thật so với hôm nay, nơi byte **không bao
> giờ** vào kho trước khi qua lớp sáu.

**Video > 100 MB dùng multipart** (part ≥ 5 MiB). Với trần 1 GiB của
`FR-054-va-tran-1gb`, **một lần PUT là đủ** — multipart chỉ để chống đứt mạng,
không phải để vượt giới hạn (giới hạn một PUT là 4,995 GiB).

### 6.3 · Đọc — presigned GET ngắn hạn

- LÕI tra `phien` → có quyền không (`B-D3b`) → gọi THỢ ký → trả `{url, het_han}`.
- Hạn **5–15 phút**. Đủ để bắt đầu phát; trình duyệt tua bằng **Range** trên
  cùng URL nên không cần ký lại giữa chừng (R2 trả **206**).
- URL trỏ `<account>.r2.cloudflarestorage.com` — **không** custom domain
  (presigned không dùng được với custom domain).
- ⇒ Cần **CORS** trên bucket cho origin của `web/`.

### 6.4 · Luật mồ côi — chỗ khó nhất, và cách KHÔNG làm nó hỏng

`xuat_kho.py` có **vòng reap**: xoá mọi file không nằm trong tập `can_co`, và
tập đó dựng từ view `tham_chieu_media` (`kho.schema.sql:152-157`). `FR-052` đã
kể lần cơ chế này **suýt xoá sạch `kb/_media/`** vì một hàm trả tập rỗng
(`dung_lai_db.py:84-89`).

> **KHÔNG chuyển vòng reap sang R2 ở giai đoạn đầu.** Một vòng xoá tự động chạy
> qua mạng, trên một tập con trỏ có thể rỗng vì lỗi mạng, là **cùng một cái
> bẫy** — nhưng lần này **byte không có bản thứ hai trên đĩa để cứu**.

Đường an toàn: reap trên R2 là **thao tác tay có báo cáo** — liệt object không
ai trỏ tới, in ra, **người bấm**. Cùng tinh thần `trangThaiBanLui()`
(`dungchung.mjs:1594`): *"Không tự khôi phục, không tự tạo gì. Chỉ TRẢ LỜI."*

### 6.5 · `dung_lai_db.py` — chỗ phải sửa để §3.3 không vỡ

Hôm nay `:174-188` đọc `kb/_media/`. Sau khi R2 thay chỗ đó, ba lối:

| lối | dựng lại được? | CI cần mạng? |
|---|---|---|
| **a** · `dung_lai_db` đọc thẳng R2 | ✅ | ❌ **CI phải có khoá R2** — đỏ mỗi lần mạng chập |
| **b** · giữ `kb/_media/` làm **cache local**, R2 là bản chính | ✅ | không |
| **c** · bảng `media` **không** giữ byte nữa, chỉ giữ `sha256` + `so_byte` | ✅ (không có byte để dựng) | không |

**Đề xuất: (c) cho tầng video, (b) cho tài liệu ≤ 25 MiB.**
(c) làm `media.byte` thành `NULL`-được cho hàng video — tức DDL đổi, tức FR.
(b) giữ mọi cổng hiện có xanh mà **không cần mạng**.

---

## 7 · `[chặn]` Vì sao **DB** không lên Cloudflare được — bốn phương án đã xét

Đây là phần trả lời câu *"sau này tất cả dữ liệu đẩy lên Cloudflare hết"*.

| phương án | dung lượng | vỡ ở đâu |
|---|---|---|
| **D1** (SQLite của Cloudflare) | **10 GB/DB** (Free: 500 MB), **không nâng được** | ⛔ D1 chỉ chạm được từ Worker/HTTP API ⇒ **cửa ghi rời khỏi `127.0.0.1`** ⇒ `M08-R1` (*"localhost LÀ toàn bộ lớp bảo vệ"*) **sập**. Và `M08-R2` đòi **spawn `validate.py --strict` thật trước mọi COMMIT** — không spawn được Python trong Worker |
| **Durable Objects SQLite** | 10 GB/object | ⛔ cùng hai lý do trên |
| **SQLite-VFS trên R2** (`litestream-vfs`, `sqlite-s3vfs`) | — | ⛔ **không an toàn khi ghi đồng thời**. `FR-011` (hai AI ghi song song) và `M18-R1` dựa vào `BEGIN IMMEDIATE` giữa hai tiến trình — object storage không có khoá đó |
| **R2 SQL / R2 Data Catalog** (Iceberg) | — | ⛔ phân tích, không phải OLTP; không thay được đường ghi |

### ✅ Cái **được**: Litestream → R2 làm **bản lùi liên tục**

Litestream v0.5 tự nhận diện R2 qua endpoint
`s3://<bucket>/db?endpoint=<account>.r2.cloudflarestorage.com`, và nó *"chỉ nói
chuyện với SQLite qua API của SQLite nên không làm hỏng DB"*.

Đây **đúng thứ `ADR-06` đang thiếu**. Nhắc lại phát hiện của báo cáo 09-03:

> `FR-050` cách 2 chốt `_backup/` **gitignore** ⇒ *"**mất ổ backup = mất tài
> khoản**. Không có bản thứ hai ở đâu cả."*

Litestream → R2 **là** bản thứ hai đó. Nhưng ⛔ `_loi.sqlite` **chứa DLCN** ⇒
đẩy nó lên R2 là **chuyển dữ liệu cá nhân xuyên biên giới** (§9). Nên:

| DB | Litestream → R2? |
|---|---|
| `kb/_kho.sqlite` | ✅ được — dẫn xuất, không DLCN. *(Nhưng nó dựng lại được từ git nên lợi ích thấp)* |
| `truyhoi/index.sqlite` | ✅ được, nhưng vô nghĩa — dẫn xuất thuần |
| **`web/_loi.sqlite`** | ⛔ **đúng cái cần nhất, và là cái duy nhất không được** cho tới khi có hồ sơ TIA |

**Chi phí Litestream đáng nêu**: nó ghi liên tục ⇒ **Class A**. Ở nhịp ~10 s,
một tháng ≈ **260.000** Class A — vẫn dưới free 1 triệu, nhưng nó là **khoản
Class A lớn nhất** của cả hệ, gấp ~500× toàn bộ đường media. Bật cho nhiều DB
thì phải đo lại.

---

## 8 · Chi phí — dựng từ số của dự án, không từ ví dụ của Cloudflare

**Kịch bản 12 tháng tới** (từ `M12-R9` trần 1 GB · `prd.md:8` sáu người dùng):

| khoản | lượng | GB |
|---|---|---|
| tài liệu pdf/pptx | 200 × 3 MB | 0,6 |
| video mp4 nạp | 100 × 150 MB | 15,0 |
| artifact M16 (slide + giọng đọc + video) | 100 × 50 MB | 5,0 |
| ảnh nền `public/**` | 16 file | 0,025 |
| **tổng** | | **~20,6 GB** |

| | tính | $/tháng |
|---|---|---|
| lưu trữ | (20,6 − 10 free) × $0,015 | **$0,159** |
| Class A · media | ~500 PUT/tháng | ~$0 |
| Class A · Litestream (nếu bật) | ~260.000 | **$0** *(trong free 1 M)* |
| Class B · xem | ~50.000 | **$0** *(trong free 10 M)* |
| egress | 6 người × video | **$0** |
| **tổng** | | **≈ $0,16 / tháng** |

**Ba ngưỡng đáng cảnh báo — không phải hôm nay:**

- vượt **10 GB** ⇒ bắt đầu tính tiền lưu trữ (rơi vào ~tháng thứ 6 của kịch bản);
- vượt **1 M Class A** ⇒ Litestream + reap + multipart cộng lại; đo lại nếu bật
  Litestream cho **hơn một** DB;
- **Infrequent Access** chỉ đáng khi có video **không ai xem 30+ ngày** — nó có
  phí lấy $0,01/GB và **ràng 30 ngày tối thiểu**, nên bật sớm là **lỗ**.

---

## 9 · `[chặn]` Pháp lý — chặn thật, không phải giấy tờ hình thức

**Nghị định 356/2025/NĐ-CP** (ban hành 31/12/2025, **hiệu lực 01/01/2026**, thay
NĐ 13/2023) — `brd.md B-E5` và `FR-045 §4` đã ghi nhận nó.

Điều buộc phải đọc:

> Tổ chức phải lập và nộp **hồ sơ đánh giá tác động chuyển DLCN xuyên biên giới
> (TIA)** khi **chuyển DLCN thu thập/lưu tại Việt Nam ra máy chủ ngoài Việt Nam**
> hoặc **tới nhà cung cấp dịch vụ đám mây nước ngoài**. Nộp cho Bộ Công an trong
> **60 ngày** kể từ khi tiến hành chuyển.

Đối chiếu vào ta:

| dữ liệu | có DLCN? | lên R2 = chuyển xuyên biên giới? |
|---|---|---|
| pdf/pptx/mp4 nội dung kỹ thuật | ❌ | **không kích hoạt** |
| `kb/**/*.md` | ❌ | không |
| **`_backup/nguoi-dung.yaml`** (`ten`) | ✅ | ⛔ **CÓ** |
| **`_backup/dinh-danh-kenh.yaml`** (`chat_id`) | ✅ | ⛔ **CÓ** |
| **`web/_loi.sqlite`** (cả hai bảng trên) | ✅ | ⛔ **CÓ** |

Và **R2 không có jurisdiction Việt Nam** — chỉ `eu`, `fedramp`, hoặc mặc định
không cam kết vị trí. Không cấu hình R2 nào làm phép chuyển này biến mất.

> ⚠️ **`FR-050` cách 2 đã chọn đúng, và R2 có thể lật nó.** Chủ dự án chọn cách 2
> (`_backup/` ra ổ, gitignore) với lý do nguyên văn: *"cách này **XOÁ** vấn đề
> `B-E5` thay vì quản nó."* Đẩy `_backup/` lên R2 **mang vấn đề đó quay lại**,
> lần này với một phép chuyển **thật sự xuyên biên giới**, không phải một
> `git push` giả định.

**⇒ Khuyến nghị `[chặn]`**: tầng 3 (§4) **không lên R2** cho tới khi có hồ sơ
TIA. Đây là **việc của người**, không phải của agent — `FR-045 §4` đã khai đúng
vậy. Nó **không chặn** tầng 2 (media), nên **kế hoạch này chạy được ngay**.

*(Tôi không phải luật sư. Đây là đối chiếu văn bản với dữ liệu dự án đang giữ;
xác nhận cuối là việc của người.)*

---

## 10 · Cổng phải có — mỗi cổng một câu ĐỎ ĐƯỢC

Không có những cổng này thì kế hoạch trên là **lời hứa**.

| # | bắt gì | ĐỎ khi | XANH khi |
|---|---|---|---|
| **R1** | **Z2 có răng** — LÕI không gọi host ngoài loopback | gieo một `fetch("https://…r2.cloudflarestorage.com")` vào `web/api/**` hoặc `core/**` ⇒ cổng **phải nêu đúng file:dòng** | `web/**` chỉ gọi `127.0.0.1`/`::1`/`localhost` |
| **R2** | khoá R2 **không** ở LÕI | `R2_ACCESS_KEY_ID`/`R2_SECRET…` xuất hiện trong env của dịch vụ có `vung: LOI` | chỉ dịch vụ khai `can_key_r2: true` nhận |
| **R3** | không bí mật R2 trong repo | `git ls-files` + grep ra access key / secret / account id | 0 dòng |
| **R4** | presigned URL **có hạn** | ký một URL không `X-Amz-Expires`, hoặc hạn > 60 phút | mọi URL ≤ 15 phút |
| **R5** | `sha256` buộc vào chữ ký | gieo một PUT với byte khác sha đã ký ⇒ **R2 phải từ chối** | 4xx từ R2, không phải ta tự phát hiện sau |
| **R6** | magic-byte **vẫn** chạy trên đường mới | đẩy một HTML dán nhãn `.pdf` qua presigned PUT ⇒ verifier phải xoá object + ghi audit | object biến mất, có dòng audit |
| **R7** | **không** vòng reap tự động trên R2 | tồn tại một đường code `DeleteObject` chạy theo lịch / theo mỗi lần ghi | chỉ có lệnh liệt-kê + người bấm |
| **R8** | **không** DLCN lên R2 | object nào trong bucket khớp `nguoi-dung.yaml` / `dinh-danh-kenh.yaml` / `_loi.sqlite` | 0 |
| **R9** | video **không** vào git | `git ls-files` thấy `*.mp4/mov/webm/mkv/mp3/wav/m4a` | 0 — `FR-060 §3.1` đã làm phần `.gitignore` |
| **R10** | mất R2 thì **NÓI RA** | bản ghi trỏ `sha256` mà R2 không có object, và màn hình im lặng | báo *"hiện vật không với tới được"*, không phải một khung trắng |

**R1 là cổng đắt nhất và phải có TRƯỚC.** `ADR-05` đã khai nó phải tồn tại từ
2026-08-31 và nó vẫn chưa có. R2 chỉ là thứ đầu tiên sẽ đi qua chỗ trống đó.

**R10 cùng lớp lỗi** `ui_flow §3` mà dự án đã vấp một lần (`0035fa3`): *một danh
sách rỗng vì API chết trông giống hệt một kho chưa có gì*.

---

## 11 · Lộ trình — bốn giai đoạn, mỗi cái có điều kiện vào/ra

Xếp theo **rẻ trước, không-lùi-được sau**. `FR-060 §1` đã chốt ba mốc; đây là
cách chia chúng thành việc.

### GĐ 0 · Dọn + đặt răng *(không cần R2, không cần tiền)*

| việc | điều kiện ra |
|---|---|
| `FR-060 §3` (đã quyết): gitignore video/audio tuyệt đối · `.playwright-mcp/` · `kb/_media/**` | `git ls-files` ra 0 file media |
| **Cổng `R1`** — tổng quát hoá `api-guard` thành cổng theo VÙNG | gieo một `fetch` ra ngoài vào `web/api/` ⇒ **đỏ, nêu đúng dòng** |
| Thêm `can_key_r2` vào `dich-vu.json` *(chưa ai `true`)* | `check_khai_mot_noi` xanh |

> ⛔ **Không sang GĐ 1 khi `R1` chưa đỏ được.** Đây là chỗ duy nhất trong lộ
> trình tôi đề nghị cứng.

### GĐ 1 · Video mp4 lên R2 — `FR-060` mốc **kế**

Điều kiện vào: GĐ 0 xong · `FR-054-va-tran-1gb` đã ký (`media.so_byte` → 1 GiB).

| việc | điều kiện ra |
|---|---|
| Chốt **Q1** (ai giữ khoá) — dịch vụ THỢ mới hay mở rộng M16 | có chủ trong `project_map.entities`, **không** trong một ADR *(bài học `FR-048`)* |
| Bucket `kho-hien-vat` + CORS + token phạm vi hẹp | `R2`, `R3` xanh |
| Đường PUT presigned kèm `x-amz-checksum-sha256` | `R5` xanh |
| Verifier magic-byte qua event notification → Queue | `R6` xanh |
| `frontmatter.media[]` thêm `noi_luu: "r2"` *(FROZEN ⇒ FR)* | `check_frozen` xanh sau khi ký |
| Đường GET presigned + màn phát video | `R4`, `R10` xanh |

**Không đụng**: `media.byte` của tài liệu ≤ 25 MiB · `kb/_media/` · `_backup/`.

### GĐ 2 · Bản lùi kho lên R2 *(tuỳ chọn — lợi ích thấp)*

`kb/_kho.sqlite` dựng lại được từ git ⇒ đây là **bản thứ ba**, không phải bản
thứ hai. Làm nếu rẻ, bỏ được nếu bận.

⛔ **`web/_loi.sqlite` KHÔNG ở giai đoạn này** — §9.

### GĐ 3 · Byte hiện vật tài liệu rời SQLite *(mốc "toàn bộ dữ liệu")*

Điều kiện vào: GĐ 1 chạy thật ≥ 1 tháng, `R6`/`R10` chưa đỏ lần nào.

| việc | rủi ro phải quản |
|---|---|
| `media.byte` thành `NULL`-được cho hàng ở R2 | DDL đổi ⇒ FR ⇒ `check_media_ddl` phải theo |
| `dung_lai_db.py` bỏ đường nạp byte cho hàng R2 | §3.3 — `check_export_dan_xuat` phải vẫn xanh **không cần mạng** |
| Reap thủ công có báo cáo | `R7` |

### GĐ 4 · DLCN lên cloud — **chờ giấy, không chờ code**

Điều kiện vào: **hồ sơ TIA đã nộp Bộ Công an**. Lúc đó Litestream → R2 cho
`_loi.sqlite` là bước rẻ nhất, và nó vá đúng điểm yếu *"mất ổ = mất tài khoản"*
mà `FR-050` đã khai.

---

## 12 · Bốn câu hỏi cho chủ dự án

**Q1 · Ai giữ khoá R2?**
→ Đề xuất **THỢ** (dịch vụ thứ 8, hoặc mở rộng `M16_artifact`). Giữ nguyên
`can_key_model`; đổi lại thêm một tiến trình. Lối kia (khoá ở LÕI) rẻ hơn một
tiến trình nhưng phải **sửa `ADR-05`** — và tôi không đề nghị đổi một ADR để đỡ
một tiến trình.

**Q2 · Trình duyệt tải video từ đâu?**
→ Đề xuất **thẳng từ R2 bằng presigned URL 5–15 phút**. Lối kia (bucket public +
custom domain) rẻ hơn và **xoá `B-D3b`**.

**Q3 · Byte tài liệu ≤ 25 MiB có rời SQLite không?**
→ Đề xuất **có, nhưng GĐ 3** — sau khi đường video đã chạy thật. Làm cùng lượt
với video là gộp một việc **an toàn** (video chưa từng vào kho) với một việc
**nguy** (di trú byte đã có trong kho).

**Q4 · `_backup/` + `_loi.sqlite` có lên R2 không?**
→ **KHÔNG, cho tới khi có hồ sơ TIA.** Đây là mục duy nhất tôi xếp `[chặn]` mà
**không có** đường đi vòng kỹ thuật.

---

## 13 · Điều tôi KHÔNG khuyến nghị

| | vì sao |
|---|---|
| **Cloudflare Stream** cho v1 | $10/tháng vs $0,08 cho cùng 100 video. Xét lại khi có người xem ngoài văn phòng |
| **D1 / Durable Objects** thay SQLite local | §7 — sập `M08-R1` + `M08-R2` |
| **Infrequent Access** ngay từ đầu | ràng 30 ngày + phí lấy $0,01/GB; kho đang **tăng**, không đang **nguội** |
| **`r2.dev`** cho bất cứ gì người dùng chạm | Cloudflare khai thẳng: **không dùng cho production**, 429 ở hàng trăm req/s |
| **Vòng reap tự động trên R2** | `FR-052` đã kể lần cơ chế này **suýt xoá sạch** `kb/_media/`. Trên R2 **không có bản thứ hai để cứu** |
| **Bỏ tracking 12 ảnh fixture** `web/test/_probe/static/**` | `FR-060 §4b` đã đề xuất giữ, và tôi đồng ý: *một CI phải tải ảnh từ R2 để chạy test là một CI đỏ mỗi lần mạng chập* |

---

## Nguồn — truy 2026-09-04

- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/) · [bản .md](https://developers.cloudflare.com/r2/pricing/index.md)
- [R2 Limits](https://developers.cloudflare.com/r2/platform/limits/)
- [R2 Consistency model](https://developers.cloudflare.com/r2/reference/consistency/)
- [R2 Data location / Jurisdictional Restrictions](https://developers.cloudflare.com/r2/reference/data-location/)
- [R2 Public buckets (r2.dev · custom domain)](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/) · [Extensions](https://developers.cloudflare.com/r2/api/s3/extensions/)
- [R2 Event notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/) · [Object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [R2 Storage classes](https://developers.cloudflare.com/r2/buckets/storage-classes/)
- [R2 · Protect a bucket with Cloudflare Access](https://developers.cloudflare.com/r2/tutorials/cloudflare-access/)
- [Cloudflare Stream Pricing](https://developers.cloudflare.com/stream/pricing/)
- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) · [Durable Objects limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Litestream](https://litestream.io/) · [Replicating to S3-Compatible Services](https://litestream.io/guides/s3-compatible/)
- NĐ 356/2025/NĐ-CP — [EY Vietnam legal alert](https://www.ey.com/en_vn/technical/tax/tax-and-law-updates/legal-alert-march-2026-decree-no-356-2025-nd-cp-providing-detailed-guidance-for-implementation-of-personal-data-protection-law) · [Vietnam Briefing](https://www.vietnam-briefing.com/news/vietnam-personal-data-protection-regulation-decree-356.html/) · [DLA Piper — Vietnam transfer](https://www.dlapiperdataprotection.com/countries/vietnam/transfer.html)

---

*Agent kiểm soát dữ liệu · chỉ đọc · không ký gate · không mở FR · không đặt bucket.*
