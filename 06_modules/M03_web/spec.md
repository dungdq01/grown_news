# M03_web — spec

> **Hợp đồng UI đã đóng băng ở G5.** Module này **không thiết kế lại** — nó nối
> `05_uiux/` với `kb/`. Đổi bất kỳ token nào ⇒ FR + bump `ui_frozen.version`.
>
> Nguồn: `05_uiux/README.md` · `tokens.css` (113 token) · 4 wireframe ·
> `contracts/analyses.sample.v4.json`.

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | `web/**` **trừ `web/api/**` (M08 — FR-011)** — module render SSR (`web/render/`), multi-window, `server.mjs` (entry, mount router M08 + route SSR) |
| **Không sở hữu** | kho (`kb/_kho.sqlite` — chỉ đọc qua `khoDoc()`) · token (M03 *dùng*, s5 sở hữu) · handler API (M08) |
| **Vào** | dữ liệu kho qua hàm đọc của M08 (`khoDoc()` — FR-034) · `kb-mock/` file cho bản `/mock/` · `tokens.css` · ảnh nền `public/` |
| **Ra** | trang HTML render lúc request trên `127.0.0.1:8787`, **private** (FR-034 — trước: site tĩnh build sẵn; Quartz nhổ ở giai đoạn C) |
| **Ghi được** | `web/**` trừ `web/api/**`. FE + module render vẫn RỖNG với kho — đường ghi duy nhất từ trình duyệt là API local M08 (FR-011) |

## 2 · Business logic

### 2.1 · Ba luật tòa soạn — sống tiếp trong module render (FR-034)

*(Bản gốc: "ba custom part Quartz". Quartz nhổ ở giai đoạn C của FR-034; ba
LUẬT không đổi, chỗ ở đổi sang `web/render/` + FE.)*

| # | Luật | Chỗ ở mới |
|---|---|---|
| 1 | nội dung CÔNG BỐ chỉ `review_status: approved` | mọi đường render công-bố (nếu tái xuất hiện — hiện app local hiển thị đủ trạng thái có nhãn rõ, như màn Tất cả từ trước) |
| 2 | sắp theo `priority`, **không** theo `analyzed_at` | `web/render/trang.mjs` (port từ emitter) |
| 3 | gộp bản cùng `url_normalized` thành 1 bài nhiều tab | cùng chỗ, công thức §3 |

**Vì sao 1 là luật chứ không phải bộ lọc tiện lợi**: `draft` là nơi mọi thứ chưa
được người xác nhận nằm — kể cả bài sinh ra do prompt injection
(security_baseline §6). Xuất bản ra ngoài là mất lớp giảm thiểu cuối. Ghi chú
FR-033/FR-034: app local một-người-dùng hiển thị mọi trạng thái (có nhãn) —
luật này trói đường **deploy/công bố**, không trói màn làm việc local.

**Vì sao 2**: `analyzed_at` đo *khi nào tôi rảnh*, `priority` đo *cái này quan
trọng thế nào*. Sắp theo ngày thì bài quan trọng nhất chìm sau một tối nạp nhiều.

> **AC-2.1.1** · Nếu một đường render công-bố/deploy tái xuất hiện, nó phải lọc
> `approved` và có test riêng trước khi merge (thu hẹp theo FR-034 —
> `only-approved.test.js` retire cùng bundle build).
> `soft` — không còn bundle để quét; reviewer S2 rà mọi đường render mới.

> **AC-2.1.2** · Trên `analyses.sample.v4.json`: build ra đúng **8** bài từ **13**
> bản ghi, gộp `src_var001` + `src_var002`. (FR-006 — v2 thiếu 2 verdict)
> `hard` · `cmd: node web/test/expected-render.test.js`
> Neo vào khối `_expected_render` — số tính bằng máy, không gõ tay.

> **AC-2.1.3** · Bài nổi bật là `src_wfv001` (`priority` 65), không phải bài mới
> nhất.
> `hard` · cùng lệnh 2.1.2.

### 2.2 · File lưu trữ không lên web

`<slug>.v<n>.md` là bản cũ sau re-analyze — lịch sử, không phải nội dung.

> **AC-2.2.1** · File khớp `*.v[0-9]*.md` không có trong output.
> `hard` · `cmd: node web/test/no-archived.test.js`

### 2.3 · Bốn màn + cửa sổ đọc

Từ G5, **không thiết kế lại**:

| Màn | Nội dung | Wireframe |
|---|---|---|
| `SCR-00` | app shell + multi-window | `wireframes/SCR-00-app-shell.md` |
| `SCR-02` | trang chủ, 4 vùng, mỗi vùng một layout family | `SCR-02-trang-chu.md` |
| `SCR-01` | trang bài, các mục theo khung khai, mục lục, số trang | `SCR-01-trang-bai.md` |
| `SCR-03` | tra cứu theo concept | `SCR-03-tra-cuu.md` |

**FR-026 vế B + B2 (ĐÃ KÝ 2026-08-25) · vòng đời KHÔNG còn ngõ cụt.** Trước đó
`approved` và `rejected` không có đường ra nào ngoài XOÁ — duyệt nhầm một bài thì
phải xoá nó, mà xoá là việc khác hẳn về nghĩa (nó đưa file ra khỏi mọi ô thống
kê, không phải ghi lại một phán quyết). Bảng giờ:

```
draft    → approved | rejected      approved → draft | rejected
edited   → approved | rejected      rejected → draft
```

B-B1 **nguyên vẹn**: bốn đường mới đều **rút** hoặc **từ chối**, không đường nào
**cấp** phê duyệt; `→ approved` vẫn đòi đủ ba trường M1.

`→ draft` **không** đòi trường mới — `kb/` nằm trong git nên **git là dấu vết**
(B-C1); thêm một trường "lý do rút" là ghi lại thứ git đã ghi. Nhưng trường **hết
hiệu lực** thì bị bỏ: rời `approved` bỏ ba trường M1 (lời khai cho một phê duyệt
đã rút), rời `rejected` bỏ `reject_reason` (lý do cho một phán quyết đã thu hồi).
Xoá **khoá**, không đặt `null` — `insight_new` khai `boolean` nên `null` trượt
validate, và một khoá vắng đọc ra "không có" còn `null` đọc ra "có mà rỗng".

> **AC-2.3.9** · Vòng đời một bài chạy **liền mạch**: tạo → sửa → duyệt → sửa
> lại (⇒ `edited`) → duyệt lại → bỏ duyệt (⇒ `draft`, M1 **bị bỏ**, duyệt lại
> **hỏi lại** M1) → loại → đưa lại vào hàng chờ (`reject_reason` **bị bỏ**) →
> chuyển ra thùng rác → chuyển về kho **byte-equal** với đúng trạng thái lúc xoá.
> Mỗi bước kiểm CẢ mã trả về VÀ trạng thái trên đĩa. Và `BANG_CHUYEN` không có
> trạng thái nào **thiếu đường ra**.
> `hard` · `cmd: node web/test/vong-doi-bai.test.js`

> **AC-2.3.10** · CRUD danh mục chạy thật cả bốn đường (POST · GET · PATCH ·
> DELETE) cho **cả hai** loại nhãn, trên kho tạm + schema tạm; xoá lần hai không
> trả 200; `PUT` vẫn đóng (nó là đường đổi `id` — thứ bài viết trỏ vào).
> `hard` · `cmd: node web/test/danh-muc-crud.test.js`

Cộng **mục** *Chờ duyệt* (FR-027g — nó là mục trong màn Kho, không còn màn riêng) — hiện danh sách; từ FR-011 có **nút duyệt/loại THẬT** khi
API local đang chạy (`/api/health` 200): bấm ⇒ form 3 trường M1 / lý do loại ⇒
`PATCH /api/articles/:type/:slug/status`. Không API ⇒ control ghi không hiện —
bundle tĩnh thuần vẫn chỉ-đọc như trước.

> **AC-2.3.1** · Mọi flow P0 click được trên sample data.
> `soft` — click là thao tác người. Người chốt trên bản build thật.

> **AC-2.3.2** · Bundle tĩnh không có đường ghi ngoài whitelist literal đóng
> (`/api/inbox` · `/api/articles` · `/api/recycle`) — và mọi đường trong whitelist
> chỉ sống khi người chạy API local (FR-011).
> `hard` · `cmd: node web/test/no-write-path.test.js` — quét bundle tìm lời gọi
> ghi file / API mutate ngoài whitelist.

> **AC-2.3.3** · Mọi trạng thái mà `BANG_CHUYEN` cho `→ approved` đều: có nút
> Duyệt ở cửa sổ đọc · **có mặt ở mục Chờ duyệt trong màn Kho** (FR-027g) ·
> được đếm vào ô *"chờ duyệt"* · có luật CSS riêng. Mọi nút hành động có `title`
> nói hệ quả. Ma trận đọc **từ** `status.mjs`, không gõ lại.
> `hard` · `cmd: node web/test/bon-trang-thai.test.js`

> **AC-2.3.4** · Gộp không để lại đường chết: `v-queue` và `data-nav="queue"`
> **không còn tồn tại** · `DUONG` bỏ key `queue` · mục nằm trong `v-kho` đúng
> thứ tự KPI → Chờ duyệt → biểu đồ · neo `#cho-duyet` có mặt · badge tab Kho đọc
> **cùng biến** `choDuyet` với ô KPI · khối chữ trong hàng chặn ở `62ch` còn hàng
> thì **không** bị chặn bề rộng · luật ẩn panel đòi **mọi** mốc rỗng (không dùng
> `:only-of-type`) · không selector `#v-queue` nào còn trong CSS.
> `hard` · `cmd: node web/test/cac-man-con-lai.test.js`

> **AC-2.3.5** · Đường cũ `/cho-duyet/` không gãy: cả bản real và mock đều
> chuyển hướng tới `../kho/#cho-duyet` — đúng **mục**, không chỉ đầu màn — bằng
> đường **tương đối** (mock không nhảy sang real), và có link thật chứ không chỉ
> `meta refresh`.
> `hard` · `cmd: node web/test/url-va-tuong-tac.test.js`

> **AC-2.3.6** · Trang chuyển hướng `/cho-duyet/` **không** nạp CSS/JS và ≤ 1 KB —
> ngoại lệ được **khai**, không phải điều bị bỏ qua: "trang không có CSS" cũng
> chính là triệu chứng của lỗi mà `css-applied` sinh ra để bắt.
> `hard` · `cmd: node web/test/css-applied.test.js`

> **AC-2.3.7** · Trên **mọi trang đã build**: `.mid` đóng đúng (đếm thẻ, không
> `indexOf`) và **mọi** `id="v-*"` nằm trong nó.
> `hard` · `cmd: node web/test/cac-man-con-lai.test.js`

> **AC-2.3.8** · Cửa sổ đọc: thanh tiến độ đo `.bk-b` · rAF throttle · gỡ
> listener · `reduced-motion` chỉ bỏ `transition` (KHÔNG ẩn) · cột neo có 4
> trường metadata không `fetch` · mục 6 dừng ở `h2` kế tiếp và số vẽ bằng CSS
> counter. **Và** phần nền đã đúng còn nguyên: lưới bất đối xứng, mục lục dính,
> bốn thứ của kính, chặn độ dài dòng.
> `hard` · `cmd: node web/test/cua-so-doc.test.js`

> **AC-2.3.9** · Biểu đồ **không được gõ tay** tập giá trị nó vẽ: nhóm trạng thái
> đọc `TRANG_THAI`, và `TRANG_THAI` lấy `enum` từ
> `core/skill-src/frontmatter.schema.json` (`properties.review_status.enum`).
> Thêm một trạng thái vào schema ⇒ nó **tự** xuất hiện, không cần sửa emitter.
> `hard` · `cmd: node web/test/bon-trang-thai.test.js`

> **AC-2.3.10** · Màn Danh mục: một thực thể **một** hình dạng — nhãn đang dùng
> và chưa dùng đều là hàng `.rc-r`, và **cả hai bản song sinh** (emitter +
> `barCptFE`) in cùng cấu trúc — không bản nào còn thanh `.bw`.
> `hard` · `cmd: node web/test/man-danh-muc.test.js`

> **AC-2.3.11** · Số hàng trong `#cb` khớp số nhãn đếm được, và các hàng sắp
> **giảm dần** theo số bài — màn này để *tìm*, thứ tự tuỳ ý bắt người dùng quét
> cả danh sách.
> `hard` · `cmd: node web/test/filter-counts.test.js`

> **AC-2.3.12** · Mọi đường `/api/articles/…` mà **bundle đã build** dựng phải
> khớp một hình dạng route đọc TỪ `router.mjs` — không đường nào ghép bằng
> `.slug` trần. Và server thật phải xác nhận route đòi đoạn `type` (đường thiếu
> `type` ⇒ 400/404), để luật trên có lý do chứ không phải một quy ước.
> `hard` · `cmd: node web/test/duong-api-khop-route.test.js`

> **AC-2.3.13** · Danh mục RỖNG là trạng thái hợp lệ: `GET /api/concepts` không
> truyền `limit` trả **đủ** mục (`/nap/` vẽ một checkbox mỗi nhãn) · `?force=1`
> mới xoá được nhãn đang dùng và phải trả **danh sách bài** bị bỏ lại · khôi phục
> `{slug_moi}` giữ được cả hai bản và sửa `slug` trong frontmatter theo tên file.
> `hard` · `cmd: node web/test/danh-muc-phan-trang-ep-xoa.test.js`

### 2.3b · Lối nạp THỨ TƯ + xem trước hiện vật (FR-037)

Màn Nạp nguồn có **bốn** lối, không ba. Ba lối đầu nhận một **bản phân tích**
(thân bài theo khung 5 mục); lối thứ tư nhận một **hiện vật** (file pdf/ppt/word)
+ nhãn — nên nó **không** dùng form viết bài, và cổng validate áp hồ sơ
`thu-vien` chứ không áp cổng mục/dẫn nhập/tinh túy.

`accept` của input và trần byte **đặt lúc chạy** từ `__MEDIA__` (bảng
`media-mime.json` nhúng qua `define` của `build-fe.mjs`) — `shell.html` là HTML
tĩnh, nó không đọc được bảng khai, nên gõ danh sách đuôi vào đó là bản thứ hai.

**FE PHẢI tự kiểm `file.size` TRƯỚC khi POST.** `413` không tới được client giữa
lúc upload: trình duyệt nhận ECONNRESET trên đường ghi trước khi kịp đọc phản hồi
(đo ở `WL-01K9N7FR036B5`). Không kiểm ở client thì người dùng kéo một file 30 MB
vào và chỉ thấy *"mạng lỗi"*.

**Ba dạng xem trước, chọn theo `xem_truoc` của bảng khai — không do FE đoán:**

| | |
|---|---|
`iframe` (pdf) | nhúng thẳng, `src` trỏ `/api/articles/media/<sha256>` |
`the` (ppt/doc) | thẻ + nút tải về. `attachment` ở server CHÍNH LÀ chính sách này; FE chỉ nói ra |
video | **click-to-load**, `src` dựng từ **whitelist host + regex id**, KHÔNG BAO GIỜ từ `fm.url` |

**Vạch "mức tự động" có BA mức cho BỐN lối** — hai lối *được* cùng mức, và đó là
sự thật ("dán link" và "nạp tài liệu" đều là máy làm gần hết). Ép chúng khác nhau
là bắt giao diện nói dối để một phép kiểm được xanh.

> **AC-2.3b.1** · Lối thứ tư có ở CẢ HAI `shell.html` (byte-identical) và có nhánh
> xử lý; bảng mime tới bundle; `.size` kiểm trước `fetch` — đo bằng **vị trí trong
> thân hàm**, không bằng "có tồn tại chuỗi".
> `hard` · `cmd: cd web && node test/thu-vien-nap.test.js`

> **AC-2.3b.2** · `src` video dựng từ hằng whitelist + id khớp `id_mau`; hàm dựng
> xem trước KHÔNG truy cập `.nhung` (iframe chỉ sinh sau khi bấm); `nhungVideo`
> xác nhận id **lần nữa** — giữa lúc vẽ và lúc bấm, DOM là thứ ai cũng sửa được.
> `hard` · `cmd: cd web && node test/media-cua-so.test.js`

### 2.3c · Dashboard tổng hợp All — HAI NỀN, mỗi pane khai nền của nó (M09-R4)

Người dùng chốt *"dashboard tổng hợp All"*. **Số đếm** đúng là phải tổng hợp:
tổng bản ghi · lưới thẻ · bộ lọc · bốn trạng thái · theo tháng · theo nguồn ·
theo loại. Chúng trả lời *"kho tôi có gì"*.

**Thước đo CHẤT LƯỢNG thì không.** `priority` sinh từ `fm.skill_candidates` nên
bản ghi thư viện luôn **0**; `credibility_max` mô tả một *bản phân tích* chứ không
mô tả một file PDF. 50 PDF sẽ đẩy histogram ưu tiên về ~100% "thấp" và làm phẳng
thang tin cậy — dashboard **tệ hơn trước** trong khi mọi con số vẫn "đúng".

Suy từ *"tổng hợp số đếm"* ra *"trộn cả thước đo chất lượng"* là suy quá tay.
Pane chất lượng đứng trên `ho_so === "phan-tich"`: **`mball`** (ưu tiên, màn Tất
cả). *(FR-041 lượt 2 — người dùng chốt màn Kho chỉ còn bốn tổng hợp thời gian ·
phân loại · loại nguồn · trạng thái, nên hai pane chất lượng của màn Kho —
`kf-uutien` ưu tiên và `bars3` độ tin cậy — đã RỜI màn. Luật của mục này không
đổi: thước đo chất lượng không nhận bản ghi thư viện vào nền.)*

Và mỗi pane chất lượng **nói ra nền của nó** — nhưng chỉ khi kho thật sự có bản
thư viện: một chú thích *"nền: bản phân tích"* trên kho toàn phân tích là chú
thích không giải thích gì.

> **AC-2.3c.1** · Gieo thêm 4 bản thư viện: **không pane chất lượng nào đổi số**,
> pane số đếm **đổi đúng** bằng số bản ghi thêm vào. Đo bằng cách so **hai bộ dữ
> liệu khác nhau đúng một điều**, không so với một con số gõ tay.
> `hard` · `cmd: cd web && node test/thu-vien-tong-hop.test.js`

### 2.4 · FR-027 — hệ "Kính trên ảnh"

Bốn tầng chồng nhau, mỗi tầng một việc (`ui_guide §1`): ảnh (`.sky`) → veil
(`.mist`) → nhiễu (`.grain`) → panel kính. **Ảnh không bao giờ chạm chữ trực
tiếp**.

Panel kính cần **đủ bốn** thứ: `--gloss` (vệt sáng chéo 157°) · `--e-top` (gờ
sáng mép trên) · `--edge` (viền 1px) · `--blur-lift` (nhoè nền).

**Hai chế độ hai alpha** — hệ quả vật lý: tối `.62` · sáng `.80`. Ràng buộc
binding ở bản sáng là **đỏ thương hiệu** `#C81E1E`; không hạ đỏ để lấy độ trong.

**Điều hướng là RAIL TRÁI 78px** (`ui_guide §9`). Rail nằm **ngoài** mọi `.view`
nên nó là khung của **mọi** màn. `--rail-w` là token: rail và phần bù của khung
nội dung đọc **cùng một** token nên khớp do **cấu tạo**.

**Trang chủ dựng theo `trang-chu.html`** (FR-027e): khung nội dung **hai lớp**
(`.wrap` chỉ bù rail · `.mid` `max-width:var(--mid-w)`) · vùng Nổi bật **không
panel bọc**, 2 cột + `perspective`, 3 thẻ **xếp chồng** `grid-area:1/1` · KPI
**2×2** · **3 pane chồng** + khối 3D **ba tầng** transform.

**Các màn còn lại** (FR-027f): thang chữ và hằng số bố cục đi qua token — thiếu
bậc là lý do người viết gõ px. 3D chọn theo **hình dạng dữ liệu**: có **phân bố**
→ khối 3D · có **trình tự** → chiều sâu `perspective`.

**Chờ duyệt là MỤC trong màn Kho, không còn màn riêng** (FR-027g). Thứ tự:
KPI → **Chờ duyệt** → biểu đồ → thùng rác; việc-phải-làm đứng **trước** bối cảnh.
Rail còn **4 tab**; tab *Kho* mang **badge** đọc cùng biến `choDuyet` với ô KPI.
`/cho-duyet/` giữ làm **trang chuyển hướng** ~470 byte sang `/kho/#cho-duyet`.

**FR-027h · khung giữa phải BỌC mọi màn.** Đo trên **trang đã build**, không
trên shell: `catNap` (bước phát ra) từng cắt tới `</main>` và cắt luôn `</div>`
của `.mid`, trong khi shell hoàn toàn cân bằng. Trình duyệt tự vá một `<div>`
chưa đóng nên **mắt không thấy** — răng phải đếm thẻ.

**FR-027h · cửa sổ đọc.** Đo trước khi làm: lưới bất đối xứng, mục lục dính, đủ
bốn thứ của kính, chặn độ dài dòng — **đều đã có**. Chỉ thêm ba thứ còn nợ: thanh
tiến độ (đo `.bk-b`; bài ngắn hơn khung ⇒ **ẩn**) · cột neo mang metadata (mọi
trường **đã** có trên `ban`) · mục 6 "Tinh túy" khác biệt (JS quét gắn class, dừng
ở `h2` kế tiếp; số bằng **CSS counter**).

`prefers-reduced-motion` **KHÔNG tắt** thanh tiến độ — chỉ bỏ `transition`. Nó là
**thông tin**, không phải hiệu ứng. Ngoại lệ **duy nhất** so với `DESIGN.md §7`,
khai ở FR-027h.

**FR-027i · màn Kho: biểu đồ thay số khô khan.** Bốn số đầu là **ba phần của một
tổng**; ô rời rạc che **tỉ lệ**. Ba quyết định về tính trung thực: thùng rác
**không** là một đoạn (đã rời `kb/` ⇒ sai mẫu số) · mẫu số là `tatCa` **không**
phải tổng ba đoạn (nếu không thanh luôn đầy 100%) · cắt bớt phải **nói ra**.
Chuyển động chạy **một lần** khi vào tầm nhìn — dashboard là **ảnh chụp** lúc
build; nhấp nháy kiểu đang-xử-lý là nói sai về hệ thống.

> **AC-2.4.1** · Bốn thứ của kính đủ cả bốn trên `.pn`; số lớp `backdrop-filter`
> trong ngưỡng khai; mọi blur dùng `var(--blur-lift)`; ảnh nền ≤500 KB không trùng.
> `hard` · `cmd: node web/test/he-kinh.test.js`

> **AC-2.4.2** · Rail đọc `var(--rail-w)`, `.wrap` bù bằng **cùng** token, icon ở
> CSS không ở markup, và **mọi** màn cùng khung.
> `hard` · `cmd: node web/test/rail-trai.test.js`

> **AC-2.4.3** · Trang chủ đúng cách trình bày đã chốt: khung hai lớp · `.brk-g`
> **đúng** 2 cột + `perspective` · thẻ nổi bật xếp chồng bằng `grid-area` · KPI
> 2×2 · khối 3D đủ ba tầng transform và 9 token mặt ở **cả hai** chế độ · ba
> quirk của bản tham khảo **không** lọt vào · mọi vòng đủ ba chốt.
> `hard` · `cmd: node web/test/trang-chu-layout.test.js`

> **AC-2.4.4** · Các màn ngoài Trang chủ đồng bộ thang (mọi giá trị ≥8px và mọi
> `font-size` đi qua token; `token-only` miễn theo GIÁ TRỊ <8px, không miễn cả
> file) · mỗi dải nằm trong đúng màn của nó · khối 3D chỉ ở màn có phân bố, dùng
> class không dùng id · ba số của màn Nạp nguồn khớp nguồn thật · ba trường M1
> khớp `status.mjs` · biểu đồ thành phần của màn Kho không gộp thùng rác vào mẫu số.
> `hard` · `cmd: node web/test/cac-man-con-lai.test.js`

### 2.5 · Multi-window + pipeline render (FR-034 — trước: "Port sang Quartz")

Lịch sử: 363 dòng `app-v20.html` port sang `web/plugins/multiwindow/` (quyết
F1), rồi FR-034 giai đoạn C chuyển cả pipeline khỏi Quartz:

- `web/render/{data,trang,assets}.mjs` — port từ emitter home-pages (vốn tự
  đọc kho, tự ghép shell/CSS/JS — cắt dây Quartz, không viết lại template).
- `server.mjs` render 5 màn + `/mock/*` lúc request; route `/:type/:slug` trả
  shell + `data-mo-bai` cho FE mở cửa sổ đọc (deep-link giữ).
- FE (`multiwindow.inline.ts`) đọc 100% API; API chết ⇒ báo lỗi nhìn thấy,
  không rơi im lặng về ảnh chụp tĩnh.
- Kill-switch chuyển tiếp `GN_SSR=0` rơi về `web/site/` cũ — gỡ cùng lúc nhổ
  Quartz.

> **AC-2.5.1** · Mở 2 cửa sổ, điều hướng sang màn khác, cả hai còn nguyên.
> `soft` — hành vi tương tác. Người chốt.

> **AC-2.5.2** · Không listener nào rò sau 10 lần điều hướng.
> `hard` · `cmd: node web/test/no-leak.test.js`

### 2.6 · Token là nguồn duy nhất

Import `tokens.css`. **Không gõ lại giá trị** — kể cả khi thấy nó chỉ là `16px`.

> **AC-2.6.1** · Không giá trị px nào cho `font-size`/spacing ngoài `tokens.css`.
> `hard` · `cmd: node web/test/token-only.test.js`

### 2.7 · Sáu lệnh `hard` ở trên CHƯA CHẠY ĐƯỢC

`web/` chưa tồn tại. Mọi `cmd: node web/test/*.js` là **lệnh sẽ có**, không phải
lệnh đang có.

Theo R3, AC không có lệnh chạy được thì nó là `soft`. Nhưng ở đây khác trường hợp
M02/M04: kia là *cổng đã có mà tôi chọn sai lệnh*, đây là *module chưa có code*.

Cách xử lý, không nới luật:

| | |
|---|---|
| **Bây giờ (s6)** | sáu AC ghi `hard` kèm lệnh — đây là **đặc tả test s8 phải viết** |
| **Ràng buộc s7** | mỗi lệnh là một đơn vị việc; test đi **cùng** đơn vị, không dồn cuối (W4) |
| **Điều kiện G6C** | lệnh chạy thật, exit 0. Chưa chạy được ⇒ AC tụt `soft` ⇒ **DRAFT + người chốt** |

Viết lệnh ra bây giờ có giá trị: nó buộc AC phải *đo được*. AC nào không nghĩ ra
nổi lệnh thì lộ ngay ở s6 — rẻ hơn lộ ở s8.

**Hai AC `soft` (2.3.1 · 2.5.1)** thì khác: chúng `soft` vì
click và cảm nhận thị giác không có lệnh nào đo được, không phải vì thiếu code.

## 3 · Công thức

Không sở hữu công thức nào. `priority` sống ở M06 §3; M03 chỉ **đọc** để sắp xếp.

Một phép tính thuộc M03 — **gộp**:

```
bài_trên_site = nhóm(analyses ở approved, theo url_normalized)
                 → mỗi nhóm = 1 bài, n bản = n tab
                 → sắp giảm dần theo max(priority trong nhóm)
```

Thứ tự bắt buộc: **lọc `approved` trước, gộp sau**. Ngược lại thì một bản `draft`
kéo theo bản `approved` cùng nguồn lên site.

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| FE/module render ghi bất cứ gì vào kho | BRD B-C3 (FR-011: ghi từ trình duyệt CHỈ qua API local M08) |
| Render markdown không qua escape-trước-dựng-thẻ của `md()` | markdown là untrusted input (sec §2; FR-034 thay vai `allowDangerousHTML` của Quartz) |
| Deploy công khai | BRD B-D3; đổi ⇒ rà lại toàn kho trước |
| Gõ lại giá trị token | `tokens.css` thắng mọi tài liệu |
| Render bản lưu trữ (`article_versions`) như bài hiện hành | §2.2 |

## 5 · Trạng thái

✅ **as-built** — s8 chặng B, 2026-08-19. Quartz **v5** (FR-007).

| Phần | Ở đâu | Kiểm |
|---|---|---|
| filter `approvedOnly` | `web/plugins/approved-only/` | `only-approved.test.js` 14/14 |
| emitter `mergeBySource` + sort | `web/plugins/merge-by-source/` | `expected-render.test.js` 11/11 |
| 4 màn | `web/plugins/home-pages/` | `four-screens.test.js` |
| multi-window (363 dòng port) | `web/plugins/multiwindow/` | `no-leak.test.js` |
| token | `web/styles/custom.scss` | `token-only.test.js` |

7 test node, tất cả xanh. Build ra **67 file**, 9 bài lên site từ 13 bản ghi.

Nợ từ G5: nội dung mẫu dùng chung mọi bài (chưa nối `kb/`) · ảnh gốc 1308px ·
chưa test Safari/Firefox (`backdrop-filter`, `container-query`).
