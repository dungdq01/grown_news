# FR-023 — Index SQLite dẫn xuất: bỏ `readdirSync` mỗi request

mở_bởi: người dùng, 2026-08-24 (`upgrade.md` phase 3 — "cần database", "không để sau mỗi lần phải run build và api nữa")
tới: s4 (`04_system/adr.md` ADR-04) · s6 (`06_modules/M02_kb/spec.md` §2.1 và `rules.md` M02-R2, `M08_api/spec.md` §2.1 — đều FROZEN)
mức: sửa một ADR nền + 3 file frozen. KHÔNG đụng BRD.
trạng_thái: **DUYỆT** 2026-08-24 — người dùng: "ok làm luôn".
bị_phủ: **FR-034** (2026-08-26). FR này dựng `kb/_index.sqlite` làm **index DẪN XUẤT**, đúng B-C1 ("file `.md` là chân lý, DB chỉ là bản sao để truy vấn nhanh") — và toàn bộ lập luận dưới đây đứng trên bất biến đó. FR-034 **đảo B-C1**: `kb/_kho.sqlite` thành nguồn chân lý, file `.md` thành export một chiều. `sinh_index.py` và `check_index_dan_xuat.py` đã xoá theo. Giữ file này làm **biên bản lịch sử** — nó ghi đúng điều đã xảy ra lúc đó, và ghi số đo (7.555ms đường đĩa vs 0.098ms SELECT) vẫn còn giá trị. Đừng dựng lại đường index dẫn xuất theo nó.

## Vấn đề

`upgrade.md:38-42` (phase 3): *"Chúng ta cần database (có thể SQLite hoặc Postgres) để nâng cấp hệ thống. Logic: user/agent send .md → convert to json → call API → storage DB. Không để sau mỗi lần phải run build và api nữa."*

Hai mục tiêu. **Mục tiêu thứ hai đã giải xong** ở GĐ 1 (WL-01K9JKFR024) — `GET /api/index` đọc lúc request, thêm bài rồi F5 là thấy. Nó **không cần database**.

FR này là mục tiêu thứ nhất, và phải khai đúng nó giải gì.

## Nó giải gì — và KHÔNG giải gì

`web/api/dungchung.mjs:110-123` `quetKho()` chạy `readdirSync` trên 6 thư mục **mỗi request**, rồi `articles.mjs` `readFileSync` + parse YAML **từng file**. Với `GET /api/index` mới thêm, mỗi lần tải trang là một lượt quét toàn kho.

| Giải | Không giải |
|---|---|
Bỏ quét thư mục mỗi request | Tốc độ **hiện tại** — kho 3 bài, không ai đo được chậm |
Truy vấn lọc/đếm/gộp bằSQL thay vì `.filter()` trong JS | Việc phải `npm run build` — GĐ 1 đã xong |
Chỗ đứng cho truy vấn tương lai (dashboard, chart, RAG) | Nhu cầu đã có hôm nay |

**Nói thẳng: hôm nay chưa có vấn đề tốc độ.** Kho **3 bài**, build **669ms**. FR này là chuẩn bị hạ tầng, không phải chữa bệnh — người dùng đã chọn làm hạ tầng song song với việc nạp bài (`build_order.md:12` cảnh báo điều đó, và tôi đã ghi rủi ro ở plan).

## Vì sao ADR-04 phải sửa — và nó đã mở cửa sẵn

`adr.md:114-116` viết: *"Web đọc thẳng file `.md` lúc build. **Không Postgres, không SQLite, không index ngoài.**"*

Nhưng ô **"Đổi thì"** (`adr.md:128-132`) nêu tên SQLite là đường mở:

> *"Vượt vài trăm file mà build chậm: thêm index dẫn xuất (SQLite hoặc JSON sinh lúc build). Ràng buộc bất biến: **xoá sạch index rồi dựng lại từ `kb/` phải ra đúng trạng thái cũ.** Ngày nào phải khôi phục dữ liệu từ index về file là ngày kiến trúc hỏng."*

**Điều kiện của ADR-04 CHƯA THOẢ** — kho 3 bài, không phải vài trăm; build 669ms, không chậm. Nên FR này **không được viện điều kiện đó**. Lý do thật, khai rõ:

1. `readdirSync` + parse YAML mỗi request là O(số file) cho mọi lượt tải trang, và GĐ 1 vừa làm nó chạy thường xuyên hơn.
2. Có chỗ đứng cho truy vấn mà `.filter()` trong JS làm xấu: đếm theo nhóm, gộp theo `url_normalized`, thống kê dashboard.
3. Người dùng yêu cầu tường minh ở phase 3.

Lý do 3 là lý do thật nhất. Hai lý do đầu là **chuẩn bị**, không phải cấp bách — FR phải nói vậy chứ không thổi phồng.

## B-C1 KHÔNG bị đụng — và đó là điều kiện của FR này

`brd.md:97-100`: *"File `.md` trong git là nguồn chân lý duy nhất. Database, cache, index — nếu có — đều là **dẫn xuất**. Phải xoá sạch rồi dựng lại từ `kb/` mà vẫn ra đúng trạng thái cũ."*

FR này giữ nguyên B-C1. Hình dạng:

```
user/agent gửi .md
  → API (127.0.0.1, M08)
  → validate.py --strict          ← cổng, spawn thật (M08-R2 nguyên)
  → ghi .md vào kb/               ← NGUỒN CHÂN LÝ, git diff review được
  → cập nhật index SQLite         ← DẪN XUẤT, một chiều kb/ → DB
  → API đọc index để trả JSON
```

**Không bao giờ** có đường DB → `.md`. Nếu có, `git diff` mất nghĩa và `brd.md:102` gọi đó là *"ngày kiến trúc hỏng"*.

## Phạm vi

### Được thêm

| | |
|---|---|
`kb/_index.sqlite` | index dẫn xuất. Tên `_` nên `quetKho()` và emitter **đã** bỏ qua (cùng cách `_nhat-ky-danh-muc.md`). Vào `.gitignore` |
`core/tools/sinh_index.py` | đọc `kb/**/*.md` → ghi DB. Dùng lại parser + `count_words` của `validate.py`, **không viết bản thứ hai** (M05-R3) |
`web/api/dungchung.mjs` | thêm bước cập nhật index **sau** khi rename `.md` thành công |

Schema **không thiết kế lại** — `core/skill-src/web-spec.md:77` đã có: bảng `analyses` với `frontmatter` (JSON) + 5 cột sinh ra để index (`source_type`, `analyzed_at`, `url_normalized`, `max_priority`, `review_status`).

### KHÔNG thêm

- **Không dependency mới.** `sqlite3` là Python stdlib (đã kiểm: 3.50.4), `node:sqlite` built-in ở Node 22 (đã kiểm, local và CI đều Node 22). `security_baseline §7` không vướng — nhưng vẫn ghi lý do vào `decisions.md` vì `node:sqlite` còn `ExperimentalWarning`.
- **Không thêm trường vào `frontmatter.schema.json`.** Metadata index (`synced_at`, `revision`) sống **chỉ trong DB**. Thêm vào frontmatter là đụng M02-R4 + deny S1 mà không được gì.
- **Không bỏ `validate.py`.** M08-R2 + `no-write-path.test.js:134` canh nó.
- **Không bỏ build tĩnh.** 12/28 test soi output build, và `approved-only` là răng duy nhất của M03-R1.

## Đổi thì

| File | Đổi gì | Frozen? |
|---|---|---|
`04_system/adr.md` | ADR-04: thêm mục "Sửa bởi FR-023" — SQLite không còn bị cấm, điều kiện bất biến giữ nguyên | không |
`06_modules/M02_kb/spec.md` | §2.1 *"Không database. Nguồn chân lý là file `.md`"* → *"Nguồn chân lý là `.md`; index SQLite là dẫn xuất, dựng lại được"* | **CÓ** |
`06_modules/M02_kb/rules.md` | M02-R2: thêm vế — ghi index **không** là ghi `kb/`, nhưng đường DB → `.md` là vi phạm | **CÓ** |
`06_modules/M08_api/spec.md` | §2.1: API đọc index thay vì quét thư mục | **CÓ** |
`project_map.yaml` | `entities.Analysis` thêm `index: kb/_index.sqlite (dẫn xuất)`; `backup` ghi rõ index KHÔNG cần backup | không |
`.gitignore` | `kb/_index.sqlite` | không |
`memory/decisions.md` | lý do dùng `node:sqlite` dù `ExperimentalWarning` | không |

**Mất gì — nói thẳng.** ADR-04 chọn không-DB vì *"bỏ hẳn một tầng đồng bộ có thể lệch"* (`adr.md:123`). FR này **thêm lại tầng đó**. Đổi lấy: một cổng máy chứng minh nó không lệch (răng 1 dưới). Nhưng cổng chỉ chạy khi ai đó gọi nó — giữa hai lần chạy, lệch vẫn có thể tồn tại.

Và `M02_kb/spec.md:29` nói *"DB thêm một thứ phải backup riêng mà không thêm khả năng nào"*. Vế "phải backup" **không còn đúng** (index dựng lại được, không backup). Vế "không thêm khả năng nào" thì FR này phải phản biện — và phản biện thật là: nó chưa thêm khả năng nào **hôm nay**, chỉ mở chỗ cho sau.

## Chặn bù — 4 răng, kiểm được bằng máy

| # | Răng | Kiểm |
|---|---|---|
1 | **Dựng lại được** — `rm kb/_index.sqlite && sinh_index.py` ra nội dung y hệt | so hash bảng trước/sau, hai lượt liên tiếp |
2 | **Một chiều** — không code path nào ghi DB → `.md` | quét tĩnh, khuôn `api-guard.test.js` |
3 | `validate.py --strict` vẫn spawn **trước** mỗi ghi | `no-write-path.test.js:134` đã canh |
4 | **Index không phải nguồn** — xoá index xong API vẫn trả đúng (tự dựng lại hoặc rơi về quét file) | gọi API sau khi `rm` DB |

Răng 1 là AC `hard` của B-C1. Nếu nó đỏ, kiến trúc hỏng theo đúng nghĩa `brd.md:102` nói.

## Thi hành

**ĐÃ LÀM — GĐ 2 (2026-08-24) và GĐ 3 (2026-08-24).**

GĐ 2: `core/tools/sinh_index.py` · `capNhatIndex()` sau `renameSync` ·
`core/tests/check_index_dan_xuat.py` · `.gitignore` · Makefile/CI/RUNNING.md ·
amend `M02_kb/spec.md` §2.1, `M02_kb/rules.md` M02-R2, `M08_api/spec.md`, ADR-04.

GĐ 3: `khoDoc()` — cửa đọc duy nhất, index nếu có / đĩa nếu không. Sáu chỗ đọc
chuyển sang nó (`GET /api/articles`, `GET /api/index`, hai vòng đếm nhãn).
`web/test/hai-duong-doc-khop.test.js` là răng thứ 5 (dưới).

### Răng thứ 5 — thêm sau khi làm, vì 4 răng cũ không đủ

| # | Răng | Kiểm |
|---|---|---|
5 | **Hai đường đọc trả dữ liệu Y HỆT** | `node web/test/hai-duong-doc-khop.test.js` |

Không có nó thì "index là dẫn xuất" chỉ là lời khai: tắt index mà màn hình đổi
nội dung nghĩa là index đã mang thông tin riêng. Test tự gieo ba hình dạng dữ
liệu **không có** trong `kb/` hôm nay: bài trùng slug khác `source_type`, bản
`*.v<n>.md`, bài thiếu `url_normalized`.

### Ba bug thật lộ ra khi index có người đọc

Cả ba nằm sẵn trong index từ GĐ 2, không ai thấy vì chưa ai đọc:

1. `slug` PRIMARY KEY một mình ⇒ `repo/x.md` cạnh `article/x.md` thì index ghi
   **3/5 bản**, hai bài mất im lặng. Đây là **phá răng 1**, không phải bug chậm.
2. `*.v<n>.md` không đánh dấu ⇒ bản lưu trữ lọt vào danh sách (trái M02 §2.5).
3. `INSERT OR IGNORE` trên bảng `nhan` **nuốt** xung đột khoá — chính thứ che bug 1.

Cả ba ngủ vì `kb/` có 3 bài, 3 slug khác nhau, 0 bản lưu trữ — đúng lớp lỗi
*"dữ liệu mẫu không phủ hình dạng dữ liệu thật"*. Nên `check_index_dan_xuat.py`
giờ có khối 6 **tự gieo** ba hình dạng đó.

### Số đo

| | |
|---|---|
`quetKho()+docBai()` (đĩa) | 7.546 ms/lượt |
`khoDoc()` (index) | 1.079 ms/lượt |
`sinh_index.py` một lượt dựng lại | ~430 ms |
giữ handle vs mở-đọc-đóng | 0.206 vs 0.594 ms |

Chọn **mở-đọc-đóng**: trả 0.4ms để không giữ file, vì `sinh_index.py` xoá rồi
tạo lại `_index.sqlite`. Giữ handle gây `EBUSY` khi dọn kho tạm (Windows, lỗi
cứng, giết cả file test) và handle trỏ inode đã xoá.

Chọn **không chờ dựng lại**, đánh dấu index bẩn (`banIndex()` ở cả ba
`renameSync`): chờ đồng bộ là +430ms mỗi lệnh ghi, đắt hơn thứ nó tiết kiệm.

### Kết quả

`npm test` 30/30 · `npm run check` sạch · `pytest` 30/30 · 12/12 cổng
`check_*` · `FROZEN.lock` ký lại 27 file.
