# `web/plugins/` — sáu plugin, và giá đã trả cho từng cái

> Mỗi plugin là một thư mục có `package.json` khai khối `quartz`, cộng một file
> vào. Quartz nạp chúng qua `quartz.config.yaml`.
>
> File này ghi **vì sao** mỗi plugin tồn tại và **cái gì đã sai** khi dựng nó.
> Đọc trước khi sửa — sáu vấn đề dưới đây tốn cả buổi để chẩn đoán.

---

## Sáu plugin

| Plugin | Loại | Luật nó cưỡng chế |
|---|---|---|
| `approved-only` | filter | **M03-R1** — chỉ `review_status: approved` lên site |
| `merge-by-source` | emitter | **M03-R5** — gộp `url_normalized`, sắp theo `priority` |
| `home-pages` | emitter | ba màn từ shell prototype |
| `backdrop` | component | nền phong cảnh tự chuyển 5–7s |
| `backdrop-assets` | emitter | chép ảnh `public/` → `/static/bg/` |
| `multiwindow` | component | cửa sổ đọc nổi, kéo giãn 8 hướng |
| `home-motion` | component | chuyển động Trang chủ — 2 vòng tự chuyển + reveal-on-scroll |

---

## 1 · `approved-only` — luật quan trọng nhất

```ts
shouldPublish(ctx, [tree, vfile]) → boolean
```

Chặn `draft`, `rejected`, và bản lưu trữ `<slug>.v<n>.md`.

**Vì sao là luật chứ không phải bộ lọc tiện lợi**: `draft` là nơi mọi thứ chưa
được *người* xác nhận nằm — kể cả bài sinh ra do prompt injection. Toàn bộ lớp
giảm thiểu của `security_baseline` §6 đứng trên một câu: *"tác động tối đa là một
bài rác trong draft"*. Lọt lên web thì câu đó sai.

Không frontmatter ⇒ **không đạt**. Không đoán: `kb/README.md` và ghi chú kho
không phải bản phân tích.

> Kiểm: `node test/only-approved.test.js` — 14 phép, đọc contract rồi so với
> output build thật, không chép đáp án từ code filter.

---

## 2 · `merge-by-source` — hai luật, một emitter

```ts
emit(ctx, content: ProcessedContent[], resources) → Promise<FilePath[]>
```

Cả hai luật cần nhìn **toàn bộ** tập bài, nên gộp vào một emitter.

**Gộp `url_normalized`**: ba bản phân tích cùng một URL là **một** nguồn. Đếm
theo `url` thô thì thêm `?utm_source=` là ra "nguồn độc lập" mới — và hệ số kiểm
chứng chéo bị thổi phồng bằng một thao tác copy link. Hệ số đó đi thẳng vào
`priority`, và `priority` quyết định có sinh skill điều khiển agent hay không.

**Sắp theo `priority`, không theo `analyzed_at`**: `analyzed_at` đo *khi nào tôi
rảnh*; `priority` đo *cái này quan trọng thế nào*. Sắp theo ngày thì bài quan
trọng nhất chìm sau một tối nạp nhiều nguồn — đúng thứ hệ thống này sinh ra để
chống.

**Thứ tự bắt buộc**: lọc `approved` **trước**, gộp **sau**. Ngược lại thì một bản
`draft` kéo bản `approved` cùng nguồn lên site.

Sinh `/static/merged-index.json` — `multiwindow` đọc file này.

> Kiểm: `node test/expected-render.test.js` — neo vào `_expected_render` của
> contract, **không hardcode số 8**. Thêm bản ghi vào sample thì test tự bắt.

---

## 3 · `home-pages` — bê nguyên shell

`shell.html` là bản sao **nguyên vẹn** `<body>` của `05_uiux/prototype/app-v20.html`
(gốc 10.150 ký tự; hiện 58633 sau FR-011 (nút duyệt · form viết bài · ba màn loại đầy đủ + ba màn nạp riêng FR-038/WO-012/C6b · ô đếm mỗi lưới WO-015 · tab loại nguồn + ô nhãn hai form WO-016 · hai dải lối + tab Phân loại WO-017 ·
thùng rác), FR-013/FR-014, FR-016 (màn Nạp nguồn theo tab, mô tả từng trường), FR-017
(nút sắp xếp màn Tất cả), FR-027c (rail trái 78px) FR-027e (khung nội dung
`.mid`, bỏ `.pn` bọc hai vùng) và FR-027f (dải "máy đã làm gì" ở
5 màn + vạch mức tự động ở màn Nạp nguồn) và WO-035 (nút Ghi vào kho về cuối form, bọc `.f-act`) và T03-90 (view `v-dothai`) — T03-98 gỡ LẠI tab rail của màn đó, giữ URL: nó là trang overview, vào bằng URL chứ không bằng mục nav). Mọi thẻ, mọi class, mọi thứ tự gốc giữ y hệt —
**trừ** hai chỗ FR-027e cố ý bỏ panel bọc, ghi rõ ở FR đó.

**Ở lúc phát ra, shell bị bỏ CRLF + thụt đầu dòng** — được 4 KB, đủ để rail trái
vừa trần trọng lượng mà không phải nâng trần. `<pre>`/`<textarea>` được cắt ra
trước khi xử lý và ghép lại nguyên vẹn: bỏ thụt trong đó là đổi **nội dung**
người đọc thấy, không phải đổi định dạng nguồn.

Emitter chỉ thay bốn khối dữ liệu cứng:

| Khối trong shell | Thay bằng |
|---|---|
| `.brk-g` | ba thẻ nổi bật |
| `.nw` | danh sách mới phân tích |
| `.kpi` + `.bars` | ba con số + bar theo loại |
| `.grid#grid2` | màn Tất cả |

**Không thêm, không bớt một thẻ nào.**

> **Bài học đắt nhất của cả module**: hai lần đầu tôi tự viết markup rồi cố ghép
> CSS prototype vào. Lần một dùng tên class riêng (`gn-card`, `gn-v`) → 27/33
> class lệch → trang trắng trơn. Lần hai đổi tiền tố CSS sang `gn-*` cho "khỏi
> đụng Quartz" → HTML dùng tên gốc → vẫn lệch.
>
> **Bê nguyên nghĩa là bê cả tên.**

### Đọc thẳng từ đĩa, không dùng `content`

`build.ts:95` gọi `filterContent()` **trước** khi chạy emitter, nên mảng
`content` chỉ còn bản `approved`. Màn *Tất cả* và *Chờ duyệt* là màn **quản lý** —
chúng phải thấy `draft` và `rejected`, không thì Chờ duyệt luôn rỗng.

Đọc file là **chỉ đọc**. M03 không thuộc `kb_writers`.

### CSS và script nhúng thẳng

Quartz sinh CSS component thành file riêng **có hash** (`component-4b41b8ff.css`).
Trang do Quartz render nạp đủ; trang do emitter này sinh thì chỉ nạp `/index.css`
— mà `index.css` **không chứa** CSS component. 30KB CSS, không một dòng `.sky`.

Không trỏ vào tên có hash được: emitter chạy **trước** khi `ComponentResources`
ghi chúng.

⇒ Nhúng thẳng `tokens.css` + `prototype.css` vào `<style>`, hai script đã dịch
vào `<script>`.

**Mỗi script bọc IIFE riêng.** Cả hai khai `khoiDong`, `gan`, `khiNav` — nối
thẳng bằng `;` thì trùng tên ⇒ `SyntaxError` ⇒ **không dòng nào chạy**, kể cả
phần hiện panel.

---

## 3b · `home-motion` — chuyển động Trang chủ (FR-027e)

193 dòng. Bốn hàm: `veFeat` (vòng tin nổi bật 6s) · `vePane` (vòng biểu đồ 5s) ·
`veCot` (dựng khối 3D, stagger `140 + i*130`) · `demSo` (đếm số, 42ms × 14 nhịp).

**Ba quirk của `trang-chu.html` được sửa ở đây, không bê theo:**

1. Bản gốc gọi `countUp(document)`/`growBars(document)` **lúc load**, đặt cờ
   `__c`/`__g` ⇒ lần gọi trong `IntersectionObserver` không bao giờ làm gì ⇒
   **reveal-on-scroll không tồn tại**. Ở đây chỉ gọi qua observer.
2. Bản gốc dùng **một** cờ `hover` gắn hero cho **cả** vòng biểu đồ ⇒ hover hero
   đóng băng biểu đồ, hover biểu đồ không dừng gì. Ở đây `treoFeat` + `treoPane`
   là **hai** cờ khai riêng.
3. `style-hover="…"` của bản gốc là thuộc tính **bịa** — hover `translateY(-3px)`
   chưa từng chạy. Ở đây là CSS `:hover` thật.

**Ba chốt bắt buộc của mọi vòng**: dừng khi hover · dừng khi `document.hidden` ·
`prefers-reduced-motion` **tắt hẳn** (không giảm biên độ — `DESIGN.md §7`).
`addCleanup` gỡ `setInterval` + observer, vì `gan()` chạy lại mỗi lần điều hướng
SPA nên không gỡ là mỗi lần nav thêm một bộ hẹn giờ chạy song song.

Hai vòng này **nới `DESIGN.md §9`** (cấm carousel) — giới hạn đóng ghi ở FR-027e
*"Nợ luật"*, không nới im lặng. Răng canh: `trang-chu-layout.test.js`.

---

## 4 · `backdrop` + `backdrop-assets` — nền phong cảnh

Tách hai plugin vì Quartz nạp theo `category`: một `component`, một `emitter`.

### Kỹ thuật giữ nguyên từ `DESIGN.md` §6

| | Vì sao |
|---|---|
| Hai lớp `.sky` đảo opacity | `cross-fade()` Firefox chưa hỗ trợ (tính đến 2026) |
| `decode()` **trước** khi fade | đặt `src` rồi hiện ngay ⇒ giải mã giữa lúc chuyển ⇒ khung hình giật |
| Khoảng **5–7s ngẫu nhiên** | nhịp đều tăm tắp làm người đọc để ý tới chuyển cảnh |
| Tự dừng khi tab ẩn / rê chuột lên nền | người đang nhìn ảnh, đừng đổi giữa chừng |

### Ảnh phải chép ra output

`public/` là thư mục **ảnh nguồn của người dùng** — 10 file `.jpg` commit từ s5.
Nó không nằm trong đường phục vụ của site, và **không được đụng vào**.

> Quartz **xoá sạch thư mục output** trước mỗi build. Trỏ output vào `public/`
> là mất ảnh. Đây là lỗi suýt xảy ra thật.

`backdrop-assets` chép ra `<output>/static/bg/` + sinh `index.json`. Bỏ ảnh
> 4MB — nặng quá thì người đọc thấy khung trang trước khi thấy nền.

Bộ sáng = `public/light/`. Bộ tối = `public/dark/`, chưa có thì lấy file ở gốc.

---

## 5 · `multiwindow` — port 363 dòng, không viết lại

Thuật toán giữ nguyên từ prototype: lệch 28px mỗi cửa sổ, min 340×220, kéo mép
bắc/tây đổi **cả** `left`/`top`, Esc đóng cửa sổ trên cùng.

### Ba thứ đổi, và chỉ ba thứ đó

| Prototype | Ở đây | Vì sao |
|---|---|---|
| `onclick="open_(3)"` | delegation trên `document` | script chạy trong module scope — hàm không nằm trên `window`, inline handler gọi không tới |
| `DOCS` cứng trong file | đọc `/static/merged-index.json` | trả nợ G5: *"nội dung 9 mục dùng chung cho mọi bài"* |
| listener gắn thẳng | `window.addCleanup` | SPA giữ DOM state, nhưng listener gắn lại mỗi `nav` sẽ chồng lên nhau |

### Phần hiện panel — thứ suýt bị bỏ quên

`.rise{opacity:0}` trong CSS **ẩn sẵn** mọi panel, chờ JS thêm class `.in`.
Prototype có `IntersectionObserver` (`proto.js:347-350`); không port cái này thì
**trang chủ trắng trơn** dù HTML có đủ nội dung.

Cộng một phép an toàn: panel đã trong khung nhìn ngay lúc tải thì hiện luôn,
không đợi sự kiện cuộn.

### Điều hướng

`nav()` và `th()` port từ `proto.js:241-247` và `339-343`. Bốn view nằm sẵn trong
shell, chỉ một cái mang class `on` — đổi view là đổi class, **không tải lại
trang**, nên cửa sổ nổi sống qua điều hướng.

---

## Sáu vấn đề đấu dây plugin local — đọc trước khi thêm plugin thứ bảy

Plugin cộng đồng **build sang `dist/*.js`** trước khi Quartz nạp. Plugin local
nạp **thẳng từ nguồn `.ts`** — nên gặp cả sáu thứ này:

| # | Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|---|
| 1 | `Local plugin path does not exist` | đường giải theo **CWD lệnh build** (`web/_quartz/`), không theo vị trí config | `../plugins/...` |
| 2 | `EPERM: symlink` | Windows chặn symlink kiểu `dir` nếu chưa bật Developer Mode | `link-plugins.mjs` tạo **junction** |
| 3 | `Cannot find module .../MultiWindow` | Node ESM đòi đuôi rõ ràng | gộp một file, hoặc bật `allowImportingTsExtensions` |
| 4 | `Unknown file extension ".scss"` | Node không hiểu `.scss`; chỉ bundler Quartz hiểu | đọc bằng `fs` — `css` khai kiểu `StringResource` tức **chuỗi** |
| 5 | `declares components but failed to load` | `componentLoader.ts:13` tìm subpath export `"./components"`, **không đọc `index.ts`** | khai `exports["./components"]` |
| 6 | component nạp nhưng không render | registry gọi `ctor()` để lấy component | export **constructor**, không export component |
| 7 | `Expected ";" but found "Bo"` | `afterDOMLoaded` nhận **chuỗi JS thuần**, Quartz không strip TypeScript | `link-plugins.mjs` dịch mọi `*.inline.ts` bằng esbuild |

**Không sửa mã Quartz để lách.** `_quartz/` là thượng nguồn — bản vá sẽ âm thầm
biến mất khi cập nhật.

---

## Thêm plugin mới — bốn bước

1. `plugins/<tên>/package.json` với khối `quartz` khai `category` và `exports`
2. `index.ts` export **constructor** (component) hoặc plugin instance
3. Bật trong `quartz.config.yaml`: `- source: ../plugins/<tên>`
4. (lịch sử Quartz — FR-034 nhổ bước link) giờ là `npm run build` (build-fe.mjs, esbuild devDep)

Script chạy trên trình duyệt đặt tên `*.inline.ts` — `link-plugins.mjs` quét đệ
quy và dịch tự động.

> Bước 4 hay bị quên: `link-plugins.mjs` làm ba việc — tạo junction, chép
> style, dịch TS→JS. Bỏ qua nó thì plugin mới không tồn tại với Quartz.

---

## Đặt tên nút — quy ước (FR-016)

Người dùng hỏi *"nút 'thôi' là gì?"* — câu hỏi đó chính là lỗi. Nhãn nút phải
trả lời được **"bấm vào thì cái gì xảy ra với dữ liệu"**, đọc một mình, không
cần ngữ cảnh xung quanh.

| Luật | Đúng | Sai |
|---|---|---|
| **Động từ + tân ngữ**, không phải trạng từ hay thán từ | `Ghi vào kho` · `Lưu thay đổi` · `Khôi phục` | `thôi` · `ok` · `xong` |
| Nhãn đổi theo **chế độ** khi cùng một nút làm hai việc | tạo ⇒ `Ghi vào kho`; sửa ⇒ `Lưu thay đổi` | một nhãn cứng cho cả hai |
| Nói rõ **có mất gì không** khi việc đó phá huỷ | `Đóng` + chú thích "bỏ thay đổi chưa lưu, không xoá gì trong kho" | `huỷ` (huỷ *bài*? huỷ *thao tác*?) |
| Thao tác **không thuận nghịch** phải hỏi lại trước | `🗑 xoá` → hỏi, rồi nói rõ "vào thùng rác, khôi phục ở màn Kho" | xoá im lặng |
| Dùng **đúng từ của miền**, khớp trạng thái trong `.md` | `duyệt` / `loại` (khớp `approved`/`rejected`) | `chấp nhận` / `từ chối` |
| Không hứa thứ trang không làm được | ẩn nút khi không có API (`.api-only`) | nút xám bấm không phản ứng |

Ba nhãn đã sửa theo luật này: `thôi` → **Đóng** · `ghi vào kho (draft)` →
**Ghi vào kho** / **Lưu thay đổi** (theo chế độ) · `mở form viết bài` →
**✎ Mở form viết bài**.

---

## 5 · `chungcat` — CHUNK theo màn (T03-102)

Plugin đầu tiên **không** nằm trong `gn.js`. `assets.mjs` ghép ba plugin cũ vào
bundle chung; `chungcat.inline.js` thành `/gn-chungcat.js`, và **chỉ trang
`/chung-cat/` phát thẻ `<script>` cho nó**.

Vì sao: `gn.js` là một bundle cho MỌI màn, nên thêm một màn là thêm byte cho
mọi trang. Đo được — nó đã ở **102314 / 102400 (dư 86 byte)** trước đợt này, và
màn chưng cất đẩy lên 106753. Trần đó tồn tại để giữ **đường tải ĐẦU** nhẹ, mà
mã của một màn người chưa mở thì không thuộc đường tải đầu của họ.

Ràng buộc kèm theo, để tách không thành lách: `page-weight` nay đo **tổng byte
tải đầu của TỪNG trang** (`HTML + gn.css + gn.js + chunk mà chính trang đó
xin`), và đòi **đúng một MÀN** xin chunk.

TỰ CHỨA: chunk khai lại `esc` + `bao` (~200 byte) thay vì dùng của multiwindow —
hai hàm đó sống trong IIFE của file kia. Một chunk phụ thuộc thứ tự nạp của
chunk khác là một lỗi chờ xảy ra.

⚠️ Khung của màn (KPI · nút lọc · panel chi tiết) dựng **bằng JS trong chunk**,
shell chỉ giữ `<div class="view" id="v-chungcat" data-mount></div>`. Shell đi
theo mọi trang nên mỗi thẻ trong đó nhân với tám — bản đầu đặt khung vào shell
và đẩy trang chủ lên 62545/61440.

---

## 6 · `napvideo` — CHUNK màn nạp video (T03-104)

Plugin thứ hai không nằm trong `gn.js`. Nó tồn tại để **dọn chỗ**: `T03-95` cần
~1512 byte trong bundle chung mà bundle chỉ dư 1453, và `FR-027f` cấm nới trần.

**Chọn lát cắt bằng phép đo**, không bằng cảm giác:

| vùng | byte trong `.js` | vướng gì |
|---|---|---|
| nạp **VIDEO** | 3637 | không đụng `hienVatCho`/`SUA_TL`; chỉ cần `video_host` |
| nạp **THƯ VIỆN** | 6131 | đụng `hienVatCho` (11 chỗ) · `SUA_TL` (7 chỗ) · `MEDIA` đầy đủ |

Kết quả: `gn.js` **101743 → 98277**, bớt 3466 byte.

⚠️ **Một ngoại lệ HẸP với luật "chunk tự chứa" của `T03-102`.** Chunk cần
`MEDIA.video_host`, nhưng tự khai `__MEDIA__` thì esbuild nhúng cả bảng JSON
**6590 byte** — và tổng tải đầu của trang nap sẽ VƯỢT trần. Tách mà làm trang
nặng lên thì tách để làm gì.

⇒ `gn.js` công bố `globalThis.__GN_MEDIA__`. Ranh giới của ngoại lệ:

- chỉ **DỮ LIỆU**, không hàm — chunk không gọi ngược vào `gn.js`
- chunk đọc **LÚC GỌI**, không lúc nạp ⇒ thứ tự nạp không thành ràng buộc
- **một chiều** — `gn.js` không bao giờ đọc thứ gì của chunk

Ba helper chép lại (~350 byte): `G` · `kqTV` · `loiMay`. Đó là giá của độc lập.

**Bẫy đã trúng, ghi để lần sau đỡ mất thời gian**: suite 2796 phép đo XANH
trong khi chunk ném `ReferenceError: MEDIA is not defined` ngay lần gõ URL đầu
tiên — thay `LOI_HOST` mà sót một `MEDIA.video_host` trong `hostVideoHopLe`.
Mọi cổng ở đây đo **văn bản mã**; chỉ mở trình duyệt và gõ thật mới thấy.


## `cctab` — chunk nạp-theo-yêu-cầu của tab chưng cất

`FR-062`. Nhà của mọi thứ thuộc **cửa sổ chưng cất**: hộp thoại chọn model ·
thân tab *Việc của bạn* · cửa sổ VIỆC (`T03-112`) · cửa sổ NHÁP (`T03-113`) ·
khối tiến độ transcript (`T03-108`) · bảng nổi chi tiết việc (`WO-048`).

**Vì sao là chunk chứ không nằm trong `gn.js`:** thân tab không vừa — đo
103.555/102.400 byte lúc mở `FR-062` — và `FR-061` cấm nới trần bundle CHUNG.
Nới trần thì MỌI trang phải tải thêm vì MỘT màn; chunk thì chỉ ai bấm mới tải.

**Cầu một chiều:** chunk đọc `globalThis.__GN_MW__`; `gn.js` không bao giờ đọc
ngược lại thứ gì của chunk. Hai chiều thì thứ tự nạp thành một hợp đồng ngầm,
và nó gãy đúng lúc mạng chậm.

**CSS đi kèm nằm TRONG chunk** (`trCss()` / `KHOI_CSS`), không vào
`prototype.css`: `gn.css` đang sát trần, và một luật CSS chỉ dùng ở một màn mà
nằm trong bundle chung là đúng thứ `FR-061` chống.
