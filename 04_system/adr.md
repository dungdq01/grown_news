# ADR — quyết định kiến trúc s4

> Bốn ô mỗi quyết định: Chọn · Thay vì · Vì · Đổi thì.
> Tóm tắt đẩy sang `memory/decisions.md`; chi tiết và bằng chứng ở đây.

---

## ADR-01 · Quartz cho M03_web, không tự viết Next.js

**Đây là Q1 treo từ s1. Quyết định này xoá phần lớn M03_web.**

### Chọn
**Quartz v4** làm nền cho `web/`, cộng **3 plugin tuỳ biến** viết riêng.

### Thay vì
Tự viết Next.js App Router như `web-spec.md` đề xuất ban đầu.

### Vì — kiểm bằng bằng chứng, không phải cảm tính

Ba luật tòa soạn ở `web/README.md` là thứ tôi lo Quartz không làm được. Đã kiểm
từng cái:

| Luật tòa soạn | Quartz làm được? | Cơ chế |
|---|---|---|
| Chỉ render `approved` | ✅ | Filter plugin. `shouldPublish(ctx, content): boolean` đọc được frontmatter tuỳ ý — doc chỉ rõ ví dụ đọc `vfile.data?.frontmatter?.draft` |
| Sắp theo `priority`, không theo ngày | ✅ | "Có thể truyền custom sort, filter và map function… dùng TS override trong `quartz.ts`" |
| Gộp theo `url_normalized` | ⚠️ | Không có sẵn. Phải viết emitter riêng — emitter nhận **toàn bộ** content đã transform+filter nên gộp được |

Nguồn: [quartz.jzhao.xyz/advanced/making-plugins](https://quartz.jzhao.xyz/advanced/making-plugins) ·
[ExplicitPublish](https://quartz.jzhao.xyz/plugins/ExplicitPublish) ·
[Configuration](https://quartz.jzhao.xyz/configuration) · truy 2026-08-18

`ExplicitPublish` có sẵn kiểm `publish: true` — **không** dùng trực tiếp được vì
ta cần `review_status: approved`, nhưng nó chứng minh **kiểu** filter này là
đường đi chính thống của Quartz, không phải hack.

**Thứ được miễn phí** — không phải viết dòng nào: parse markdown + frontmatter,
render, backlink, graph view, full-text search, RSS, sitemap, dark mode, mobile
responsive, GitHub Pages deploy, incremental build.

Đối chiếu `research_summary.md`: Quartz "thousands of students, developers,
teachers đang dùng", v4 viết lại tập trung khả năng mở rộng người dùng cuối.

**Phần phải tự viết** thu về đúng 3 thứ — chính là 3 luật tòa soạn:
1. Filter `approvedOnly` — ~15 dòng
2. Sort theo `priority` — custom sort function trong config
3. Emitter gộp `url_normalized` — phần nặng nhất, ~100 dòng

### Đổi thì
Nếu sau này cần thứ Quartz không cho (vd trang tương tác phức tạp, API động cho
agent đọc), **không** đập đi viết lại — thêm một route Next.js riêng bên cạnh,
hoặc chuyển sang Astro. Hợp đồng là file `.md` trong `kb/`, nên đổi lớp render
không đụng `M01_core` lẫn `M02_kb`. Đây chính là lợi ích của ranh giới ba vùng.

Rủi ro đã biết: Quartz mang sẵn mô hình *digital garden* (graph view, backlink) —
nếu chúng làm loãng cảm giác "tòa soạn" thì tắt component, không phải bỏ Quartz.

---

## ADR-02 · Python 3.11+ pin cứng cho M01_core

> **Cập nhật FR-005 (2026-08-19)**: số cụ thể là **3.13**, không phải 3.11.
> Máy không có 3.11; 3.13 có sẵn và đã chạy sạch 19 test + 9 script.
> Tiêu đề "3.11+" giữ nguyên — 3.13 nằm trong đó, lý do không đổi.

### Chọn
Pin **Python 3.13** trong CI và `pyproject.toml`. Dùng `python -m pip` chứ không
gọi `pip` trần.

### Thay vì
Để `requires-python = ">=3.9"` như hiện tại và mặc kệ interpreter nào chạy.

### Vì
Môi trường máy hiện tại đã lộ vấn đề thật: bản có `jsonschema` (venv hermes)
**thiếu `pip`**; bản có `pip` (Python 3.9) ban đầu thiếu `jsonschema`. Suốt s1-s3
tôi phải chỉ định đường dẫn interpreter tuyệt đối để chạy test.

Đây là gap đã ghi trong `project_map.yaml`. Không pin thì CI sẽ đỏ vì lý do không
liên quan tới code, và R2 (*"kết quả máy xanh"*) mất nghĩa — không phân biệt được
"test fail" với "môi trường sai".

### Đổi thì
Hạ xuống bản thấp hơn phải chạy **cả 9 script + 19 test** trên bản đó trước, không
chỉ pytest — `check_*.py` dùng cú pháp mới hơn `validate.py`. Ghi kết quả vào FR.

Không cài thêm bản Python thứ ba: ADR này tồn tại để chống môi trường phân mảnh.

---

## ADR-03 · CI là GitHub Actions, chạy trên mọi PR chạm `core/` hoặc `kb/`

### Chọn
GitHub Actions, hai job: `pytest core/tests` và `validate.py kb/`.

### Thay vì
Chỉ dựa vào pre-commit hook local.

### Vì
Hook local **bỏ qua được** bằng `git commit --no-verify`, và nó không chạy khi
người khác clone repo. S3 (toolchain + CI) là một trong **bốn bề mặt duy nhất**
rule có răng — không có CI thì R2 chỉ gác được bằng lời khai.

Hook và CI không thừa nhau: hook cho phản hồi nhanh lúc commit, CI là thứ **không
bỏ qua được**.

### Đổi thì
Nếu chuyển khỏi GitHub, giữ nguyên hai lệnh — chúng là hợp đồng, còn runner là
chi tiết. `validate.py --json` đã có sẵn cho CI đọc.

---

## ADR-04 · Không dùng database ở bản đầu

> ⛔ **ĐÃ BỊ THAY THẾ — FR-034 (2026-08-26).** Dự án nay dùng **SQLite**
> (`kb/_kho.sqlite`), và `brd.md` **B-C1** khai ngược hẳn ADR này: *"DB là chân
> lý, file là export"*. Giữ nguyên văn bản dưới làm hồ sơ của quyết định
> 2026-08-19; **không đọc nó như luật đang hiệu lực**.
>
> Phát hiện 2026-08-31 lúc thêm ADR-05. Một ADR nói ngược với thứ đã xây là
> hỏng im lặng: người sau đọc nó rồi dựng lại thứ vừa bỏ.

### Chọn
Web đọc thẳng file `.md` lúc build. Không Postgres, không SQLite, không index
ngoài.

### Thay vì
Postgres + pgvector như `web-spec.md` bản cũ đề xuất.

### Vì
BRD B-C1: file `.md` trong git là nguồn chân lý **duy nhất**. Với vài trăm file,
đọc lúc build là đủ nhanh và bỏ hẳn một tầng đồng bộ có thể lệch.

`concepts.yaml` được kiểm soát nên lọc theo `concepts` là **lọc chính xác**,
không cần embedding — rẻ hơn và giải thích được.

### Đổi thì
Vượt vài trăm file mà build chậm: thêm index dẫn xuất (SQLite hoặc JSON sinh lúc
build). Ràng buộc bất biến: **xoá sạch index rồi dựng lại từ `kb/` phải ra đúng
trạng thái cũ.** Ngày nào phải khôi phục dữ liệu từ index về file là ngày kiến
trúc hỏng.

### ĐÃ ĐỔI — FR-023, 2026-08-24

Câu "Không Postgres, không SQLite, không index ngoài" ở mục **Chọn** không còn
đúng: `kb/_index.sqlite` tồn tại, sinh bởi `core/tools/sinh_index.py`.

**Điều kiện của ô "Đổi thì" CHƯA thoả khi đổi** — kho 3 bài, build 669ms, không
ai đo được chậm. FR-023 khai lý do khác chứ không viện điều kiện này: bỏ
`readdirSync` + parse YAML mỗi request (`GET /api/index` của FR-024 làm việc đó
chạy thường xuyên hơn), và mở chỗ cho truy vấn gộp/đếm mà `.filter()` trong JS
làm xấu. FR nói thẳng: **hôm nay chưa có vấn đề tốc độ**, đây là chuẩn bị.

**Ràng buộc bất biến GIỮ NGUYÊN và giờ có răng**: ba tính chất — dựng lại được ·
một chiều `kb/` → DB · xoá index hệ thống vẫn chạy — kiểm bằng
`core/tests/check_index_dan_xuat.py` (trong `make check` và CI). Phép kiểm thứ
nhất là AC `hard` của B-C1; đỏ nghĩa là kiến trúc hỏng, không phải bug cần sửa.

**Mất gì**: ADR này chọn không-DB một phần vì "bỏ hẳn một tầng đồng bộ có thể
lệch". FR-023 thêm lại tầng đó, đổi lấy một cổng máy chứng minh nó không lệch.
Nhưng cổng chỉ chạy khi ai đó gọi — giữa hai lần chạy, lệch vẫn có thể tồn tại.
`capNhatIndex()` dựng lại TOÀN BỘ sau mỗi ghi (không cập nhật một dòng) để cửa
sổ đó hẹp nhất có thể.

Không đổi: `concepts.yaml` vẫn là danh mục kiểm soát, lọc theo `concepts` vẫn là
lọc chính xác, **không** thêm embedding.

### GĐ 3 — API ĐỌC index (2026-08-24)

Đến bước này index mới có người đọc. Đo trên kho 3 bài, gọi chính hàm của API:
`quetKho()+docBai()` **7.546 ms** → `khoDoc()` **1.079 ms** mỗi lượt.

**Ba bug thật lộ ra khi index có người đọc** — cả ba đã nằm sẵn trong index từ
GĐ 2, chỉ không ai thấy vì chưa ai đọc:

1. `slug` làm PRIMARY KEY một mình ⇒ gieo `repo/x.md` cạnh `article/x.md` thì
   index ghi **3/5 bản**, hai bài **biến mất im lặng**. Mất bản ghi là phá thẳng
   ràng buộc "dựng lại được". Khoá đúng là `(source_type, slug)`.
2. `*.v<n>.md` không bị đánh dấu ⇒ bản lưu trữ lọt vào danh sách, trái M02 §2.5.
   Thêm cột `luu_tru`; index **giữ** bản lưu trữ (nó là ảnh chiếu của kho) còn
   consumer lọc `luu_tru = 0`.
3. `INSERT OR IGNORE` trên bảng `nhan` **nuốt** xung đột khoá — chính thứ che
   bug 1. Bỏ `OR IGNORE`; trùng trong cùng một file thì `dict.fromkeys` lo.

Cả ba ngủ được vì `kb/` thật có 3 bài, 3 slug khác nhau, 0 bản lưu trữ. Đúng lớp
lỗi *"dữ liệu mẫu không phủ hình dạng dữ liệu thật"* — nên `check_index_dan_xuat.py`
giờ **tự gieo** ba hình dạng đó vào kho tạm.

**Ràng buộc mới, có răng**: hai đường đọc (index / đĩa) phải trả **dữ liệu y
hệt** — `web/test/hai-duong-doc-khop.test.js`. Không có phép kiểm này thì "index
là dẫn xuất" chỉ là lời khai: tắt index mà màn hình đổi nội dung nghĩa là index
đã mang thông tin riêng.

**Mở-đọc-đóng, không giữ handle** — có đo: 0.206 ms (giữ) vs 0.594 ms (mở mỗi
lần), vẫn nhanh 12.7× so với đĩa. Trả 0.4ms để đổi lấy: hết `EBUSY` khi dọn kho
tạm (Windows, lỗi cứng, giết cả file test), và hết handle trỏ inode đã bị
`sinh_index.py` xoá — thứ đọc dữ liệu cũ mà không báo gì.

### ĐÃ ĐỔI — FR-034, 2026-08-26: DB thành nguồn chân lý, mũi tên đảo chiều

Toàn bộ ADR này (và khối FR-023 ở trên) mô tả kiến trúc **file là chân lý, DB là
dẫn xuất**. FR-034 đảo nó theo chỉ đạo `upgrade.md:70`:

- `kb/_kho.sqlite` (gitignore) là nguồn chân lý cho bài viết + danh mục.
- `kb/**/*.md` + `concepts.yaml` + `categories.yaml` là **export dẫn xuất một
  chiều DB→file** (`core/tools/xuat_kho.py`, chỉ SELECT), commit git làm backup.
- Câu cũ ở ô "Đổi thì" — *"ngày nào phải khôi phục dữ liệu từ index về file là
  ngày kiến trúc hỏng"* — đảo thành: **đường file→DB duy nhất là
  `core/tools/dung_lai_db.py`, chạy bởi người/CI/test, không bao giờ bởi server.**
  Một đường file→DB tự động trong server là tái sinh "hai nguồn chân lý".

**Lý do thật, khai thẳng** (không viện tốc độ): (1) transaction BEGIN IMMEDIATE
cho hai AI ghi song song (FR-011) — file + mutex trong-process không cho điều đó;
(2) chân lý `category` đang xé 3 file với giao dịch ghi không nguyên tử (FR-019
tự khai yếu nhất) — về một bảng thì rollback tay biến mất; (3) FE chuyển 100% API,
hết `npm run build` sau mỗi ghi.

**Ràng buộc bất biến mới, có răng** (`core/tests/check_export_dan_xuat.py`, thay
`check_index_dan_xuat.py`): (1) dựng-lại-được hai chiều — clone không DB →
`dung_lai_db` → `xuat_kho` byte-equal, DB→file→DB cùng hash; (2) `xuat_kho.py`
chỉ SELECT, server không import `dung_lai_db`; (3) API không ghi file kho ngoài
mkdtemp, mỗi COMMIT kèm `banXuat()`; (4) `.gitignore` đúng chiều — DB ignore,
export .md KHÔNG BAO GIỜ ignore.

Không đổi: `validate.py` file-based spawn thật trước mọi COMMIT (M08-R2);
danh mục vẫn kiểm soát đóng, lọc theo `concepts` vẫn lọc chính xác, không embedding.
Ba bài học FR-023 GĐ 3 (khoá kép `(source_type, slug)` · bản lưu trữ có cờ ·
không nuốt xung đột) sống tiếp trong DDL: PK ghép, bảng `article_versions`,
INSERT thường không `OR IGNORE`.

---

## ADR-05 · Mỗi dịch vụ MỘT thư mục gốc, MỘT tiến trình, MỘT cổng

> Chỉ đạo người dùng 2026-08-31, nguyên văn: *"quán triệt về việc áp dụng
> microservices (tức là tách node app / port ra và source code ra nhé — ko dồn
> tất cả vào folder /web)"*.

### Chọn

Mỗi module có mã chạy được **sống ở một thư mục GỐC của repo**, có tiến trình
riêng và (nếu nghe) cổng riêng. **Không** nhét vào `web/`.

| thư mục | module | ngôn ngữ | vùng | cổng |
|---|---|---|---|---|
| `core/` | M01 | Python | LÕI | — |
| `kb/` | M02 | (dữ liệu) | LÕI | — |
| `web/` | M03 + M08 | Node | LÕI | **8787** |
| `05_intake/` | M05 | Python | LÕI | — |
| `chungcat/` | M12 | Python | **THỢ** | — |
| `truyhoi/` | M13 | Python | **THỢ** | — |
| `chatbot/` | M14 | Node | **THỢ** | **8788** |
| `kenh/` | M15 | Node | **BIÊN** | — (long polling) |
| `cong/` | M17 | *(s4 chọn)* | **BIÊN** | **443** — `nghe_ngoai: true` |
| `artifact/` | M16 | Python | **THỢ** | — |

**Một repo, nhiều tiến trình.** Tách repo là chuyện khác và **không làm** —
cổng phải nhìn thấy mọi vùng cùng lúc mới canh được ranh giới giữa chúng.

### Thay vì

Dồn M14 (chatbot) và M15 (kênh) vào `web/` cho tiện — cùng runtime Node, cùng
`package.json`, cùng `node_modules`, một lệnh chạy.

### Vì

**1 · Đây đã là quy ước của repo, chỉ chưa viết thành luật.** Đo 2026-08-31:
module có mã chạy được đều ở gốc — `core/` `kb/` `web/` `05_intake/`
`06_skillgen/` `07_curate/`. `web/` là nhà của M03, chưa bao giờ là thùng chứa.

**2 · Ba vùng khác nhau về QUYỀN, không chỉ về việc.** `spec_overview` đợt hai
khai LÕI/THỢ/BIÊN với ràng buộc trái ngược nhau:

| vùng | được gọi ra Internet? | được nghe vào? | được ghi `kb/`? |
|---|---|---|---|
| LÕI | **không** | có, `127.0.0.1` | có — một cửa |
| THỢ | **có** — cửa duy nhất | có, **trên** `127.0.0.1` | không, chỉ qua cửa ghi của LÕI |
| BIÊN | có (gọi RA) | không | **không** |

Ba bộ quyền ngược nhau **trong một thư mục** thì không cổng nào phân biệt được
ai là ai. Cùng lý do `M08-R1` tách `web/api/**` ra khỏi `web/render/**`.

**3 · Metric M8.2 sẽ nói dối nếu trộn.** Proposal đặt cược: *kênh thứ hai tốn
≤20% công kênh thứ nhất*. Đo được điều đó chỉ khi adapter là một thư mục có
biên rõ. Trộn vào `web/` thì "công viết adapter" không tách khỏi "công sửa web".

**4 · Tiến trình riêng là điều kiện vận hành, không phải thẩm mỹ.** M12/M16
chạy **phút** (đọc PDF, dựng video) — không nằm trong một HTTP request được.
M15 chạy vòng lặp long polling vô hạn. Nhét chúng vào tiến trình phục vụ web
là một request chậm làm chết cả trang.

### Cổng — nếu không có thì ADR này chỉ là lời khuyên

| # | Bắt gì | Đỏ khi |
|---|---|---|
| Z1 | Mỗi thư mục dịch vụ khai trong `project_map.yaml` | `check_map` — có thư mục không khai, hoặc khai mà không có |
| Z2 | **LÕI không gọi ra NGOÀI `127.0.0.1`** | `fetch`/`http.request` tới host khác `127.0.0.1`/`::1`/`localhost` trong `web/**`, `core/**` |
| Z3 | **Chỉ dịch vụ khai `nghe_ngoai: true` trong `dich-vu.json` được nghe ngoài loopback, và hiện có ĐÚNG MỘT** (`FR-045`) | hai dịch vụ khai · `web` khai · hoặc một dịch vụ nghe ngoài mà không khai |
| Z4 | **BIÊN không đọc `kb/`** | `kenh/` tham chiếu đường dẫn `kb/` |
| Z5 | **Không service nào ghi thẳng `kb/`** trừ cửa ghi của M08 | ghi file/DB vào `kb/` ngoài `web/api/dungchung.mjs` và `05_intake/gate.py` |
| Z6 | **Cổng khai MỘT nơi** | một service gõ cứng số cổng thay vì đọc bảng khai |
| Z7 | **Service không có giao diện** | tìm thấy `.html`/`.css`/template/asset tĩnh trong thư mục service |
| Z8 | **Chỉ `web/` gọi service** | `kenh/` hoặc FE tham chiếu cổng của service khác `8787` |

`api-guard.test.js` hiện **chỉ quét `web/api/`** (`api-guard.test.js:17`). Nó
phải được tổng quát hoá thành cổng theo **vùng**, nếu không thì mọi service mới
nằm ngoài tầm nhìn của nó — và đó đúng là cách một ràng buộc kiến trúc chết
trong im lặng.

### Bảng khai cổng — `core/assets/dich-vu.json` (MỚI)

Số cổng hiện gõ cứng ở `web/server.mjs:46` (`API_PORT ?? 8787`). Với N dịch vụ,
nó thành N chỗ gõ tay và sẽ lệch. Theo đúng tiền lệ `man-hinh.json` /
`loai-nguon.json` / `khung-than-bai.json`: **một bảng khai, mọi tầng đọc**.

Bảng khai mỗi dịch vụ: `ten · thu_muc · module · vung · ngon_ngu · cong`.
Cổng Z1/Z3/Z6 **dẫn xuất từ bảng này**, không gõ danh sách thư mục lần thứ hai.

### Bổ sung 2026-09-01 — HAI bộ từ vựng, đừng để một chữ gánh cả hai

Chỉ đạo người dùng: *"web là nơi quản lý và system, còn core tức LLM/thuật
toán phải là các services AI LLM ấy"*. Đúng — **trên trục giá trị**. Nhưng
`ADR-05` gọi `web/` là **LÕI** — đúng **trên trục tin cậy**. Hai trục, hai
nghĩa của cùng chữ *core*.

| trục | từ | dùng khi |
|---|---|---|
| **sản phẩm** | `/web` = **system** · services = **core (LLM/thuật toán)** | nói giá trị, nói với người |
| **tin cậy** | `web/` = **LÕI** · services = **THỢ** · `kenh/`+`cong/` = **BIÊN** | viết **luật và cổng** |

**Giữ hai bộ, không hợp nhất.** Lý do không phải ngoại giao: cổng `Z1`–`Z8`
phải trỏ vào một cái tên **không đổi nghĩa**. Và chuyển đổi được của hai bên
khác nhau một trời — engine LLM là **cắm rút được** (chatbot chết là mất một
tính năng); `kb/` hỏng là **mất cả dự án**. Ai tin LLM là *core theo trục tin
cậy* sẽ tối ưu cho nó và coi kho là đường ống, và thứ mất đầu tiên sẽ là
*một cửa ghi*.

### Bổ sung 2026-08-31 — services CHỈ có backend; `web/` là client duy nhất

> Chỉ đạo người dùng, nguyên văn: *"các services chatbot/artifact/truyhoi/
> chungcat/… chúng ta chỉ build backend thôi nha. phần giao diện và normolize
> output quy về web hết nhé"*.

**Hai luật, không phải một:**

1. **Không service nào có giao diện.** Không HTML, không template, không CSS,
   không asset tĩnh trong `chungcat/` `truyhoi/` `chatbot/` `artifact/` `kenh/`.
   Chúng trả **dữ liệu** (JSON), không trả trình bày.
2. **`web/` là client DUY NHẤT của mọi service.** Trình duyệt gọi `web`;
   `kenh/` gọi `web`. Không ai gọi thẳng `:8788` / `:8790` / `:8791` / `:8792`.

```text
trình duyệt ──┐
              ├──→  web :8787  ──┬──→ chatbot  :8788
kenh/       ──┘   (UI + chuẩn    ├──→ truyhoi  :8791
                   hoá output)   ├──→ chungcat :8790
                                 └──→ artifact :8792
```

**Vì sao luật 2 chứ không để trình duyệt gọi thẳng service:**

- **Một chỗ chuẩn hoá.** Nếu trình duyệt *và* `kenh/` mỗi bên tự gọi `chatbot`
  rồi tự dựng output, sẽ có **hai** nơi biến một `địa chỉ` thành thứ người đọc
  thấy — và chúng sẽ lệch. Đây là lý do chính.
- **Một origin** cho FE — hết CORS, hết cấu hình nhiều cổng ở client.
- **`kenh/` chỉ cần biết MỘT địa chỉ** (`127.0.0.1:8787`). Adapter mỏng đi, và
  đó đúng là thứ metric **M8.2** đặt cược (kênh thứ hai tốn ≤20% công).

**Cái mất, nói thẳng**: `web/` gánh **ba vai** — cửa ghi · UI · gateway chuẩn
hoá. Nó phồng lên và là điểm chết đơn. Đổi lại được tính chất *"chỉ MỘT nơi
quyết định bên ngoài nhìn thấy gì"*, cùng dòng họ với *"một cửa ghi"*.

**Hệ quả cho cổng Z2** — phải viết đúng ngay từ đầu:

> `web/` nay **gọi HTTP tới `127.0.0.1`**. Đo 2026-08-31: `api-guard.test.js`
> hiện **không kiểm lời gọi ra ngoài** một chút nào, và `web/api/*.mjs` chưa có
> `fetch(` nào. Nên `Z2` phải cấm **host NGOÀI `127.0.0.1`/`::1`**, không phải
> cấm `fetch`. Một cổng grep `fetch(` trần sẽ đỏ oan ngay ngày đầu.

### Đính chính 2026-08-31 — hai luật tôi siết quá tay

Bản đầu của ADR này khai *"THỢ và BIÊN không mở cổng vào"*. **Sai hai lần:**

1. Ràng buộc thật là `M08-R1` — **không nghe NGOÀI `127.0.0.1`**. Nghe **trên**
   loopback đúng bằng thứ `web/` đang làm, không phá gì. Cấm THỢ mở cổng làm
   hỏng đúng thứ cần nhất: một service **gọi được** thì **thay được**; một
   worker kéo việc thì dính chặt vào hàng đợi và không customize theo khách
   hàng/chủ đề được.
2. `M14_chatbot` bị xếp nhầm vào LÕI. Nó **phải** gọi model ⇒ nó làm egress ⇒
   nó là THỢ. Xếp nhầm vì trộn *ai gọi nó* với *nó gọi ai*; luật vùng nói về
   vế thứ hai.

**BIÊN thì vẫn không nghe gì** — nhưng vì bản chất công việc (long polling
kéo tin từ kênh), không vì một điều cấm.

Việc dài (chưng cất, dựng video) chạy **phút** ⇒ API **bất đồng bộ**: `POST`
trả `viec_id` ngay, `GET /viec/<id>` hỏi tiến độ. Không giữ kết nối HTTP 5 phút.

### Điều ADR này KHÔNG quyết

- **Không** tách repo. Một repo, nhiều tiến trình.
- **Không** chọn cách chạy nhiều tiến trình (script, `pm2`, `docker-compose`) —
  việc của s4.
- **Không** đặt số cổng cụ thể cho M14 ngoài đề xuất `8788` — s4 chốt.
- **Không** đổi chỗ ở của M08. Nó ở `web/api/**` và `project_map` đã khai vậy;
  dời nó là một FR riêng, không kèm vào đây.

## ADR-06 · Dữ liệu có CRUD sống trong DB; mỗi backend giữ DB của nó

**Ngày**: 2026-09-02 · **người quyết**: chủ dự án

### Chọn

**a · Dữ liệu có CRUD ⇒ DB, KHÔNG yaml.**
Nguyên văn chỉ đạo: *"ngày trước category và concept chúng ta xuất ra `.yaml` và
sau đó nó không phù hợp, nên từ giờ cứ database mà dùng — vì sau còn CRUD nữa, có
phải hardcode đâu"*.

**b · DB nằm cùng chỗ với BACKEND sở hữu nó.**
Nguyên văn: *"backend của phần nào ở đâu thì `.db` nằm ở đó"*.
`kb/_kho.sqlite` đúng luật này sẵn — kho là của M02, và nó nằm trong `kb/`.

| dữ liệu | chủ | DB ở đâu |
|---|---|---|
| bài viết · tài liệu · video · danh mục | M02_kb | `kb/_kho.sqlite` |
| chỉ mục mở cửa sổ | M03/FR-023 | `kb/_index.sqlite` (dẫn xuất) |
| chỉ mục truy hồi | M13_truyhoi | `truyhoi/index.sqlite` (dẫn xuất) |
| **tài khoản · mã mời · định danh kênh · phiên** | **M18_nguoidung** *(`FR-048`)* | **`web/`** |
| **bản nháp chưng cất** (`FR-046`) | **M12_chungcat** | **`web/`** |

> ⚠️ **Sửa 2026-09-02 (`FR-048`)**: hai dòng cuối trước đây ghi chủ là `M08_api`. Đó là
> tôi **tự gán**, trong một ADR, cho những entity chưa có trong `project_map.entities`.
> `M08_api` khai `purpose: bàn biên tập local — CRUD **bài viết** qua HTTP` — tài khoản
> không nằm trong câu đó. M08 là **nơi THI HÀNH** (DDL + bảy cửa `FR-047`), không
> phải **chủ**. Phân biệt này quan trọng vì `owner` là thứ `phạm_vi_ghi` của một
> task neo vào — gán sai chủ thì `R1` mất địa chỉ. Chỗ ở của `.db` **không đổi**.

**c · Dữ liệu gốc trong DB mới vẫn XUẤT RA FILE để backup — nhưng chỉ ba trong năm bảng.**
Nguyên văn chỉ đạo: *"dữ liệu mới làm như dữ liệu cũ đi, site chính `.db` còn ta vẫn
xuất ra được `.md`/`.yaml` để backup"*. Đúng cơ chế `B-C1` đang dùng cho kho.

| bảng | xuất ra file? | vì sao |
|---|---|---|
| `nguoi_dung` | **có** | mất là phải dựng lại thủ công từng tài khoản |
| `dinh_danh_kenh` | **có** | mất là mọi người phải buộc lại `chat_id` |
| `nhap_chung_cat` | **có** | **tốn token model** để tạo ra — thứ đắt nhất trong năm |
| `ma_moi` | **không** | mã **một-lần + hết-hạn**. Khôi phục một mã đã dùng hoặc đã hết hạn = khôi phục rác. Mất thì cấp mã mới |
| `phien` | **không** | session. Khôi phục xong người dùng **vẫn** phải đăng nhập lại |

Hai bảng không xuất **không phải** là hai bảng không có dấu vết. Dấu vết của chúng
sống trong `audit_log` dưới dạng **SỰ KIỆN**, không phải **TRẠNG THÁI**:

| | ghi gì | ở đâu |
|---|---|---|
| trạng thái | *"mã `ABC123` còn hiệu lực tới 10:00"* | chỉ trong DB, **không** ra file |
| sự kiện | *"14:03 tài khoản 3 dùng một mã mời — thành công"* | `audit_log` → `kb/_audit.jsonl` |

Và một luật kèm theo, `M17 testcases.md:68` đã khai (AC-3.6 *edge 2*): **dòng log không chứa giá trị bí mật**.
Ghi *"có người thử sai"*, không ghi *"người đó thử mã `ABC123`"* — log tồn tại để
phát hiện đang bị dò, không phải để lưu bí mật. Log **không hết hạn**, còn mã thì
có; chép mã vào log là biến một bí mật ngắn hạn thành một bí mật vĩnh viễn.


### Thay vì

Đặt năm bảng của `FR-045`/`FR-046` vào `kb/_kho.sqlite` — chỗ trực giác nhất.

### Vì

**`dung_lai_db.py:139-140` XOÁ `kb/_kho.sqlite` rồi dựng lại từ FILE.** Docstring
của chính nó: *"Xoa DB cu, dung lai tu dau. DB khong co lich su"*.

Nên bảng nào nằm trong `_kho.sqlite` mà **không được export ra file** thì **bị xoá
sạch** mỗi lần chạy lệnh đó — và lệnh đó không hiếm: `_api.mjs` gọi nó trong test,
`B-C1` khai nó là *đường file→DB duy nhất*, và nó là bước 2 của thủ tục `T02-4`.

Hậu quả nếu đặt sai: **5 tài khoản · mọi `chat_id` đã buộc · mọi phiên · mọi bản
nháp đang dở → mất**, im lặng, trên một lệnh người ta chạy thường xuyên.

Và với **hai** trong năm bảng, xuất ra file để sống sót còn **sai hạng**: `ma_moi`
là **bí mật**, `phien` là **session**. Hai thứ đó không thuộc về một file trong
git — và cũng không cần, vì khôi phục chúng không khôi phục được gì (mục **c**).

⇒ DB riêng, ở chỗ backend của nó. `_kho.sqlite` **giữ nguyên** tính thuần dẫn
xuất, nên `B-C1` và điểm bất động của `check_export_dan_xuat` **không bị nới**.

### Đổi thì

**Loại dữ liệu THỨ BA xuất hiện, và quyết định (c) đưa nó về loại thứ nhất.**
Trước hôm nay có đúng hai loại: *file là chân lý* và *dẫn xuất, xoá thoải mái*.
Tài khoản / phiên / nháp là **dữ liệu gốc, không phải file, không dựng lại được**.

Quyết định (c) không tạo loại thứ ba — nó **áp cơ chế của loại thứ nhất** lên ba
bảng đáng cứu, và **khai chết** hai bảng còn lại là thứ không đáng cứu. Sau ADR
này dự án vẫn có hai loại dữ liệu.

**Hệ quả 1 — backup: GIẢI RỒI SỬA LẠI.**

Bản đầu ADR này viết: *"`B-C1` giải backup bằng export-rồi-commit-vào-git, và ba
bảng đáng cứu nay đi đúng đường đó"*.

⚠️ **`FR-050` (chốt 2026-09-02) LẬT vế `commit vào git`.** Chủ dự án chọn cách
2: bản lùi ra `_backup/` ở gốc repo, và `_backup/` **gitignore**. Lý do: hai
trong các file chứa **dữ liệu cá nhân** (`ten`, `chat_id`), nên cách đó **xoá**
vấn đề `B-E5` thay vì quản nó.

⇒ `ADR-06 (c)` **giữ nguyên**: các bảng đáng cứu vẫn xuất ra file, hai bảng bí
mật (`ma_moi`, `phien`) vẫn **không** xuất. Chỉ **ĐÍCH** đổi — từ *"file trong
git"* sang *"file trên ổ, ngoài git"*.

**Cập nhật 2026-09-04 (`T08-28` / `WO-046`): BỐN bảng, không ba.** `audit_loi`
thiếu đường backup — mà nó là **vết**, thứ duy nhất trả lời *"ai đã làm gì"* khi
dữ liệu đã đổi; một lần dựng lại DB xoá nó im lặng (`WO-044` đã phải xuất tay 9
hàng). Con số *"ba"* ở bản đầu là **ngẫu nhiên** — vế chịu lực của `ADR-06 (c)`
là *"hai bảng bí mật không xuất"*, và vế đó **không đổi**. Danh sách chuẩn là
`XUAT_LOI` trong `web/api/dungchung.mjs`; cổng `web/test/loi-cua.test.js` đo cả
số bảng lẫn *"dòng audit vừa ghi có trong bản lùi"*.

Và câu *"backup riêng: vẫn thừa"* ở `env_plan` **HẾT ĐÚNG**: `_backup/` chính
**là** backup riêng. Đã sửa ở `env_plan`.

### Hướng chỗ-ở của dữ liệu — BA MỐC (`FR-060`, chốt 2026-09-04)

| khi | dữ liệu ở đâu |
|---|---|
| **hôm nay** | **CHỈ `public/**` (ảnh nền của sản phẩm) vào git.** Mọi ảnh khác + video/mp4 sống ở **local**. DB local, bản lùi `_backup/` |
| **mốc kế** | **video mp4 lên Cloudflare R2** |
| **sau nữa** | **toàn bộ dữ liệu** lên Cloudflare, gồm DB |

`ADR-06 (c)` và `FR-050` **giữ nguyên hiệu lực hôm nay** — mục này ghi HƯỚNG,
không đảo một quyết định nào đang chạy. Ba mốc là ba việc: gộp chúng thành *"lên
R2 hết"* là cách mốc đầu (rẻ, làm ngay) bị hoãn theo mốc cuối (đắt, cần đo).

⚠️ Hai hệ quả đã đo, ghi ở `FR-060 §2`: `T04-8` (git-lfs) thành **lỗi thời**, và
ba dòng giá của lời mời ký trần 1GB **hết đúng** (chúng nói về git-lfs, không về
R2). Ảnh trong git: **33 → 11**, còn đúng `public/**` — nhóm đó ở lại vì
`web/render/assets.mjs#anhNen()` **serve** chúng, tức một clone mới không có
chúng là một clone không có ảnh nền.

> **Đánh đổi phải nhớ**: mất ổ `_backup/` = **mất tài khoản**. Không có bản thứ
> hai ở đâu cả. Kho (`kb/`) vẫn dùng `B-C1` như cũ vì nó **dựng lại được từ
> file** — hai loại dữ liệu, hai cơ chế, và đó là lý do ADR này tồn tại.

**Hệ quả 2 — `.gitignore`: GIẢI, nhưng NGƯỢC chiều bản đầu.** Bản đầu viết *"ba
file export thì **commit**"*. Sau `FR-050` cách 2: **cả DB lẫn các file export
đều gitignore**. `_luu/` và `_backup/` đều không vào git.

⇒ **Khác** hình dạng `kb/` — và đó là điểm phân biệt hai loại dữ liệu: `kb/`
commit export được vì export **là** nguồn dựng lại; DB của LÕI thì không.

✅ **Hệ quả 3 — DỮ LIỆU CÁ NHÂN VÀO GIT: GIẢI bởi `FR-050` cách 2.**

Bản đầu ghi đây là *"một bẫy đã cài, nổ vào lần `git push` đầu tiên"*. Cách 2
**tháo bẫy** thay vì gắn một cổng canh nó: không file nào chứa `ten`/`chat_id`
vào git, nên `B-E5` **không có phép chuyển nào để áp vào**.

Cổng `X4` của `FR-050` canh điều đó bằng `git ls-files` — đo thứ git **đang
theo dõi**, không đo `.gitignore` (một file đã được theo dõi thì thêm nó vào
`.gitignore` **không** gỡ nó ra).

⚠️ **Hệ quả 4 — vòng reap của exporter, chưa giải.** `xuat_kho.py:141-146` xoá mọi
file không có trong tập `can_co`. Ba bảng mới xuất ra file ⇒ chúng **phải** nằm
trong tập đó, không thì mỗi lần xuất là mỗi lần xoá sạch bản backup vừa ghi. Đây
là đúng rủi ro `S12` của plan tách-ba-bảng, tái xuất trên một tập bảng khác.
Cổng bắt buộc: xuất một hàng của **mỗi** bảng rồi đòi file của nó **còn** sau
`xuat()` thứ hai.

Hệ quả 3 và 4 **chưa có FR**. Ghi ở đây để chúng không rơi vào khe giữa các FR.

## ADR-07 · Ba tầng cho quyền: bất biến ở mã · schema ô ở mã · giá trị ô ở DB

**Ngày**: 2026-09-03 · **s4** (G4) · **người quyết**: chủ dự án
**Nguồn**: `01_research/quan-ly-va-cai-dat-he-thong.md` · `FR-055` · `B-B6`

### Chọn

**Ba tầng, và ranh giới giữa chúng LÀ quyết định.**

| tầng | ở đâu | ai đổi được | cưỡng chế bằng |
|---|---|---|---|
| **bất biến** | mã + DDL `CHECK` | **không ai** | `CHECK`, cổng `Y5`, `M18-R3` |
| **schema ô** | `QUYEN` + `O_SUA_DUOC` trong mã | không ai **qua web** | allowlist, cổng đếm |
| **giá trị ô** | bảng `cai_dat` trong DB của LÕI | `chu`, qua web | `duocLam("sua-cai-dat")` |

Tầng giữa là thứ phân biệt quyết định này với *"một form sửa DB"*: DB chỉ giữ
**giá trị** của ô **đã được khai tồn tại trong mã**. Không đường nào để một form
**tạo ra một ô mới**.

### Thay vì

**(a) Ma trận quyền hoàn toàn trong DB** — hình dạng trực giác nhất, và là hình
dạng của mọi CVE `s1` tìm được. `CVE-2026-9796` (Keycloak) là ca đắt nhất: neo
luật vào **tên vai** sửa được ⇒ TOCTOU đổi tên để thắng cuộc đua, **cộng** một
regression phá vai `admin` hợp pháp.

**(b) Giữ hoàn toàn trong mã** — an toàn nhất, nhưng nó là nguyên trạng, và nó
làm đổi một ô quyền thành *"sửa mã + test + restart"*. Chỉ đạo của chủ dự án là
bỏ đúng vòng lặp đó.

**(c) Feature-flag engine** (Unleash · Flagsmith · LaunchDarkly) —
`s1` đo: **chính ngành đó nói flag KHÔNG phải phân quyền**. GrowthBook
(2026-05-01): *"Feature flags control visibility, not access."* Và Flagsmith
**khuyến nghị** gating theo trait ở một trang docs rồi **mô tả cách đi vòng nó**
ở một trang khác **không liên kết chéo**, biện pháp chống **mặc định TẮT**.

### Vì

`OWASP ASVS 4.0.3 V4.1.2` (CWE-639, bắt buộc từ **L1**) **không cấm** policy
sửa được — nó nói *"unless **specifically authorized**"*. Ba tầng trên **là**
chữ đó, viết thành cấu trúc.

Và bốn thứ `s1` đo được ép hình dạng này chứ không phải hình dạng khác:

**1 · Invariant trong TÀI LIỆU không phải invariant.** Keycloak khai luật *"chỉ
gán được vai mình đang có"* trong docs kèm `IMPORTANT:`, rồi **vi phạm nó trong
mã** (`CVE-2025-7784`). Bản vá là đưa luật **từ văn xuôi vào mã**.
⇒ Mọi vế của `B-B6` phải có **một cổng đỏ được**, không phải một câu.

**2 · Allowlist, không denylist.** `CVE-2018-8007` (CouchDB) đi vòng một
**blacklist**. Và `s1` tìm ra một invariant **bất khả diễn đạt ở tầng dữ liệu**:
Supabase — *"update hàng của mình nhưng không cột này"* **không viết được** trong
RLS.
⇒ Tập ô sửa-được là **allowlist trong mã**, không phải *"mọi thứ trừ vài cái"*.

**3 · Một chokepoint là CẦN, không ĐỦ.** LiteLLM **có** chokepoint; nó gác
**route**, không gác **trường**.
⇒ Chokepoint phải trả **ba** câu: *ai ghi hàng nào* · *trường nào* · *giá trị
nào*. Hôm nay `duocLam` chỉ trả câu đầu.

**4 · Guardrail phải tự nêu tên mình trong deny của chính nó.** `CVE-2026-17601`:
một ô **mở ra tất cả các ô**.
⇒ `viec` sửa-setting **không** sửa được **danh sách ô sửa được**.

### Đổi thì

**a · Break-glass — CHỐT: chặn + gieo lại, KHÔNG mở đường ngoài UI.**

`s1` khai ba đường và nói **không được thiếu cả hai** đường đầu:

| | đường | trạng thái |
|---|---|---|
| 1 | **chặn** hạ `chu` cuối (Entra · Entra PIM · Directus · Strapi — **bốn** sản phẩm) | ✅ **đã có** (`Y10`) |
| 2 | **break-glass ngoài UI** (kubeadm `super-admin.conf` · Keycloak bootstrap-admin) | ❌ **cố ý KHÔNG làm** |
| 3 | **gieo lại từ `QUYEN` mỗi lần khởi động** (k8s auto-reconciliation) | ⇒ **làm** |

Chọn **1 + 3**, không làm **2**. Lý do:

Đường 2 là một **cửa hậu thường trực** — một file mà ai chạm được là bỏ qua toàn
bộ phân quyền. `s1` khai nó phải *"đánh dấu tạm trên UI, xoá bằng tay, phục hồi
đòi dừng tiến trình, mọi lần dùng ghi audit + báo động"* — **năm** nghĩa vụ, và
mỗi nghĩa vụ là một chỗ hỏng. Với **một** admin duy nhất, năm nghĩa vụ đó không
có ai kiểm chéo.

Đường 3 rẻ hơn và hợp `SCR-16` (*bảng khai trong repo là nguồn*): mỗi lần khởi
động, ô nào **không** có trong `O_SUA_DUOC` bị **xoá khỏi `cai_dat`**, và ô nào
thiếu được gieo lại giá trị mặc định.

⚠️ **Đường 3 KHÔNG thay đường 2** — `s1` nói rõ nó chỉ cứu ca *"ô setting bị sửa
hỏng"*, **không** cứu ca *"không còn `chu`"*. Ca đó vẫn để hở:

> **Mất quyền truy cập của `chu` duy nhất ⇒ không có đường vào.** Đường ra là
> `sqlite3` trên file `.db` — tức **chạm máy**, không phải chạm UI.
>
> Đó là **chấp nhận có ý thức**, không phải bỏ sót: repo là local, một người,
> `web/` chỉ nghe `127.0.0.1`. Ai chạm được file `.db` thì đã chạm được máy, và
> lúc đó một cửa hậu trong UI **không thêm gì**.
>
> ⇒ Câu này **đổi** nếu `M17_cong` đưa hệ ra Internet. Ghi vào `no_con_lai`.

**b · Pin Node 24 — CHỐT: có, và nó là phòng thủ theo LỚP không phải giải pháp.**

`s1` đo: `node:sqlite` **Node 24** có `setAuthorizer` (v24.10.0) + `defensive`
(v24.14.0, mặc định `true`) ⇒ từ chối `SQLITE_DROP_TRIGGER` và `SQLITE_PRAGMA`
**ngay trong tiến trình**, và chặn hẳn `writable_schema`.

Node 22 **EOL 2027-04-30**; Node 24 LTS **EOL 2028-04-30** ⇒ **dù sao cũng phải
lên**, nên đây là một quyết định đã có sẵn lý do thứ hai.

⚠️ **Nó không đổi gì với `sqlite3` CLI hay `rm`.** Ai chạm được file thì vẫn
xoá được trigger. Nó chỉ chặn **tiến trình `web/` tự** làm điều đó — tức chặn
một lỗi lập trình, không chặn một người có quyền file.

⇒ **Không** dựa vào nó làm vế duy nhất, và **không** dùng `PRAGMA
recursive_triggers` làm vế duy nhất (đo được: **không sống qua kết nối mới**; và
`PRAGMA defensive` trên Node 22 là **no-op im lặng** — đo được).

**c · Nhân chứng ngoài — CHỐT: `git push` sang remote không force-push.**

`s1` xếp theo độ rẻ: **(a)** email head tới cả sáu hộp thư · **(b)** `git push`
`_audit.jsonl` + head sang remote mà `chu` **không** có force-push
(`receive.denyNonFastForwards` + `denyDeletes`) · **(c)** `ots stamp`
(OpenTimestamps).

Chọn **(b)**. Lý do: dự án **chưa có remote** (`git remote -v` rỗng), nên đây là
lần đầu dựng — và dựng nó với hai cờ đó là **rẻ hơn** dựng rồi siết sau.

⚠️ Nhưng nó **đụng `FR-050` cách 2**: bản lùi của DB LÕI **không vào git** vì
chứa dữ liệu cá nhân. `_audit.jsonl` là bảng audit của **kho**, không phải
`audit_loi` của LÕI — hai file khác nhau. Vế *"nhân chứng cho `audit_loi`"*
**chưa giải**, và nó là câu cho FR thi công.

⚠️ **Và phải công bố `(số_hàng, head, thời_điểm)`, không chỉ hash** —
`s1`: nếu chỉ hash thì **cắt đuôi** vẫn cho chuỗi hợp lệ.

**d · Cửa sổ không phát hiện được phải khai bằng SỐ.** Nó = khoảng giữa hai lần
công bố head. Để ẩn là để người ta tưởng nó bằng 0.

**e · `duocLam` phải trả `boolean` ĐỒNG BỘ.** `CVE-2026-77426` (Unleash): một
`await` bị quên biến `Promise` thành truthy ⇒ **mọi** phép kiểm thành `true`.
Hôm nay `duocLam` đồng bộ — nhưng **do may**, và cổng duy nhất bắt được là
**kiểu trả về**. ⇒ `M3.5`.

### Điều ADR này KHÔNG đổi

- `B-B1` — chỉ chủ dự án duyệt. **Không** là một ô, không bao giờ.
- `M17-R6` — biên vẫn lột `review_status`. Hai lớp, hai chiều.
- `ADR-05` — `M18` là module NGANG, không thư mục/tiến trình/cổng.
- `ADR-06` — chỗ ở của `.db` không đổi; `cai_dat` vào DB của LÕI.
- `FR-050` cách 2 — bản lùi vẫn không vào git.
- **Không** mở `M20`. Gộp vào `M18` (`proposal-3 §8`).

## ADR-08 · Service gọi được service; `web/` là WRAPPER, không phải client duy nhất

**Ngày**: 2026-09-07 · **người quyết**: chủ dự án, nguyên văn: *"Rule của tôi là các
module / services có thể gọi lẫn nhau, web chỉ là wrapper"* · **đảo**: `ADR-05`
bổ sung 2026-08-31 luật 2 + cổng `Z8`.

### Chọn

**a · THỢ gọi được THỢ. LÕI gọi được THỢ. `web/` là lớp bọc (UI + chuẩn hoá
output cho người), không phải điểm đi qua bắt buộc.**

**b · Có luật, không tự do.** Mỗi cặp gọi `(từ → tới)` **khai trong bảng**
`core/assets/dich-vu.json` (trường `goi_duoc: [...]` trên dịch vụ **bị gọi**),
và mỗi **chiều** gọi có **khoá riêng** + `aud` riêng (`FR-047 §2.1 L3`: khoá
service-to-service phải riêng; `CVE-2025-41258`). Không khai cặp ⇒ 403 ở bên nhận.

**c · Ba luật `FR-047 §2.1` GIỮ NGUYÊN** ở bên nhận, bất kể ai gọi: L1 danh tính
do LÕI gán · L2 DENY khi thiếu danh tính · L3 khoá riêng theo chiều.

### Thay vì

- Giữ luật 2 (*"không ai gọi thẳng `:8791`"*) ⇒ M14 hỏi M13 phải vòng qua `web/`,
  tức LÕI thành **proxy** cho mọi truy hồi — LÕI gánh tải hỏi-đáp và giữ luôn
  khoá của cả hai THỢ.
- Cho gọi tự do, không bảng ⇒ đúng thứ `CVE-2026-44560` mô tả (*năm đường chạy,
  ba đường không kiểm quyền*).

### Vì

- **Thực tế đã vượt luật 6 ngày**: `M14/model_flow §2` khai `M14 → M13: POST /truy-hoi`
  (G6A xanh) trong khi luật 2 cấm bằng chữ in — và **không cổng nào đỏ**: `check_ba.py`
  không cưỡng chế Z8, `core/tests/` không grep cổng nào. Một luật không ai đo và
  spec đã đi ngược thì không phải luật.
- **"M13 là nền"** (`01_research/m13-truy-hoi-dich-vu-nen.md`): khách của M13 sẽ là
  M14 · web · M19 · M12 · M16. Cấm THỢ→THỢ là biến mỗi khách mới thành một ngoại lệ
  trong đầu người.
- **Lý do gốc của luật 2 vẫn đúng và VẪN ĐƯỢC GIỮ** — *"một chỗ chuẩn hoá output
  cho người"*. Nó là luật về **trình bày**, không về **đồ thị gọi**: THỢ trả JSON,
  chỉ `web/` (và `kenh/` qua `web/`) biến JSON thành thứ người đọc. `Z7` đã canh
  đúng chỗ đó.

### Đổi thì

1. **`Z8` đổi nghĩa**: từ *"chỉ `web/` gọi service"* thành **Z8' · "chỉ `web/`
   và `kenh/`-qua-`web/` TRÌNH BÀY cho người; mọi service trả dữ liệu"** — tức
   Z8' hợp vào Z7 về bản chất. **Z9 (MỚI)**: *"mọi lời gọi giữa hai dịch vụ nằm
   trong `goi_duoc` của dịch vụ bị gọi, mang khoá + `aud` của đúng chiều đó"* —
   đỏ khi: một `fetch`/`urlopen` tới cổng dịch vụ mà cặp không khai, hoặc bên nhận
   chấp nhận một `aud` không phải của mình.
2. **Bên nhận là nơi cưỡng chế**, không phải bên gọi: mỗi THỢ có `_tu_ai()` đọc
   `goi_duoc` từ bảng khai và so `aud` — tổng quát hoá `_tu_loi()` của M12
   (`chungcat/src/api.py:90-101`).
3. **Artifact phải theo — liệt đủ, không giấu**:

| artifact | frozen? | đổi gì |
|---|---|---|
| `06_modules/M12_chungcat/spec.md` `AC-1.4` + `rules.md` `M12-R7` | **FROZEN** | *"chỉ nhận từ LÕI"* → *"chỉ nhận từ cặp đã khai, mang khoá chiều đó"*; L1/L2/AC-4.6 **giữ**. Cổng `check_chi_loi_goi_tu_loi.py` giữ 6/7 phép kiểm, đổi **một**: 403 cho *"THỢ khác không trong `goi_duoc`"*, không phải *"THỢ khác"* | ⇒ **FR** |
| `06_modules/M13_truyhoi/model_flow.md §3` (❌ `web → M13`) | không frozen | mũi tên đứt thành mũi tên thật cho **tìm** (không ghép câu trả lời); hỏi-đáp vẫn qua M14 | ⇒ cùng **FR-072** *(đổi số từ FR-070 2026-09-07 — trùng số với FR-070 của team M12)* |
| `03_docs/spec_overview.md:452-458` | không | một câu đính chính | ⇒ s3 |
| `04_system/security_baseline.md:411` | không | dòng checklist Z8 → Z8' + Z9 | ⇒ cùng ADR này |
| `core/assets/dich-vu.json` | không | thêm `goi_duoc` từng dịch vụ; sửa `vai` của `web` (*"Client DUY NHẤT của mọi dịch vụ THỢ"* → *"wrapper — UI + chuẩn hoá output"*) | ⇒ task M04/M08 |
| `.claude/rule.md` | — | mục 12 | ⇒ đã ghi |

4. **Cái ADR này KHÔNG đổi**: `Z2` (LÕI không gọi ra ngoài loopback) · `Z3`
   (một dịch vụ nghe ngoài) · `Z5` (một cửa ghi) · `Z7` (service không có UI) ·
   `M12-R3`/`M13-R5` (egress một cửa / 0 lời gọi mạng) · `B-E2`.
5. **Rủi ro nói trước**: đồ thị gọi thành đồ thị, không còn hình sao. Cách giữ
   nó đọc được là **`goi_duoc` là bảng**, và một cổng vẽ được đồ thị từ bảng —
   không phải grep mã tìm số cổng.

---

## ADR-09 · Space — đa vũ trụ tri thức: `space` là CỘT LỌC, slug duy nhất toàn hệ

- **ngày**: 2026-09-09 · **người**: PM-Space · **trạng thái**: **ĐÃ DUYỆT** 2026-09-09 — chủ dự án (*"duyệt giúp tôi"*)
- **nguồn**: `02_proposal/proposal-4-space-da-vu-tru.md` (ĐÃ DUYỆT) ·
  `01_research/space-spike-r1-r6-ket-qua.md` (spike đã chạy, số đo thật)

### Bối cảnh

Hệ khai một tiền đề ngầm: **một vũ trụ tri thức**. Ontology global, sidebar
global, một pipeline chưng cất. Mở sang lĩnh vực khác — hoặc mở lớp học, hoặc
bán cho doanh nghiệp — thì tiền đề vỡ. Ba use case (lĩnh vực · lớp học ·
tenant) là **cùng một primitive**: một container tri thức có ranh giới.

Kho đang **13 bản ghi**. Cùng việc này sau 6 tháng là di trú hàng nghìn item.

### Phương án đã cân

| | A · `space` là CỘT LỌC, slug duy nhất toàn hệ | B · PK ba cột, slug duy nhất trong space | C · N cơ sở dữ liệu, mỗi space một DB |
|---|---|---|---|
| DDL đổi | +1 cột ×3 bảng, +1 cột view (FR-080) | đổi PK 4 bảng | tách kho, đổi mọi đường mở DB |
| Địa chỉ trích dẫn | **0/5 dạng đổi** | 5/5 mang tiền tố space ⇒ di trú mọi trích dẫn | 0 nhưng địa chỉ chỉ có nghĩa trong một DB |
| `doc_id` M13/M14 | giữ = slug | đổi ⇒ FR-072 + mọi client | giữ, nhưng chỉ mục tách N bản |
| Chống rò | `WHERE space` + **cổng R4** | như A | mạnh nhất (vật lý) |
| Giá thật | rẻ nhất, có sẵn phần lớn | đắt: di trú địa chỉ | đắt vận hành: N kho, N backup, tìm xuyên vũ trụ thành bài toán mới |

### Quyết định — **A**

1. `space TEXT NOT NULL DEFAULT 'mac-dinh'` trên ba bảng nội dung + index;
   **PK giữ `(source_type, slug)`** ⇒ slug duy nhất TOÀN HỆ.
2. `view ban_ghi` mang thêm `space` (**FR-080**, `kho.schema.sql` frozen).
3. Ontology (`concepts` · `categories` · `loai_nguon`) **per-space bằng cột**;
   yaml vẫn là bản export.
4. Cây file `kb/<loai>/` **GIỮ NGUYÊN** — space sống trong frontmatter, không
   trong đường dẫn (giữ điểm bất động `bam_cay` của round-trip DB→file→DB).
5. **M19_baihoc GIỮ**, lồng trong space (`BaiHoc.space_id`) — Space là container,
   bài học là cấu trúc CÓ THỨ TỰ bên trong. Vẫn đúng hai trục khoanh phạm vi:
   `space` (chứa) · `pham_vi` (lọc lúc hỏi).
6. Bot = **một NÚT trên cây** (gốc / space / lớp) ± nguồn hẹp hơn — thay
   "bot → tập doc_id tự do" của spec M14 (FR khi M14 vào s6).
7. **Quyền: KHÔNG mở `space_member` đợt 1.** FR-045 giữ nguyên (một `chu` +
   ≤5 tài khoản đọc); `chu` thấy mọi space. Lớp học nhiều người góp = đợt 2.
8. Chống rò là **CỔNG, không phải niềm tin**: `check_khong_ro_cheo_space.py`
   phải đỏ được trên fixture bỏ-lọc (đề bài R4 trong báo cáo spike).

### Hệ quả

- **Mất**: hai space không được trùng slug (409 hiện có + thông điệp gợi tên
  khác). Chấp nhận: đổi lấy 0 dòng di trú địa chỉ.
- **Được**: mọi trích dẫn `[slug:p.7]`, `doc_id`, `media`, `versions`, URL cửa
  sổ **không đổi một ký tự**.
- **Migration**: ~20 dòng, đo thật **8 ms** trên bản sao 276 MB; rollback =
  export cũ trong git + bản sao trước di trú.
- **Chưa quyết (đợt 2)**: cross-post (`cross_posted_to`) · persona per-space ·
  tìm xuyên vũ trụ (mặc định KHÔNG) · `space_member`.

### Đổi thì sao

- Tenant B2B đòi trùng slug giữa khách ⇒ chuyển sang B bằng **một** FR qua
  FR-072 (`doc_id` là hợp đồng một cửa — đó là lý do nó tồn tại).
- Lớp học cần xuyên vũ trụ ⇒ `BaiHoc` mất `space_id`, thành trục riêng ⇒ mở
  lại câu "hai trục" trong `decisions.md` 2026-09-09.

