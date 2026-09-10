# FR-027 — hệ "Kính trên ảnh": hạ tầng + ảnh nền mượt

**Mức**: s5 (`ui_frozen` + `tokens.css`) · mục **FR-027e** nới `DESIGN.md §9`
**Trạng thái**: hạ tầng **ĐÃ LÀM** (a–d) · Trang chủ **ĐÃ DỰNG** (e) — chuyển
động chờ người chốt · 5 màn còn lại chưa làm
**Ngày**: 2026-08-24
**Nguồn**: `ui_guide.md` của người dùng + `trang-chu.html` (596 dòng, tự chứa)

---

## Bối cảnh — đây không phải kế hoạch mới

`05_uiux/REDESIGN-PLAN.md` đã tồn tại và ghi trạng thái: *"**chờ bản tham khảo
của người dùng.** Mục 3 và 4 sẽ được viết lại khi có tham khảo."*
`ui_guide.md` chính là tham khảo đó. FR này là phần còn thiếu của kế hoạch đã có.

Và nó tôn trọng luật §5 của kế hoạch đó:

> *"Luật của lần này: nhịp C chỉ dựng MỘT màn. v1 hỏng ở chỗ tôi dựng cả 4 màn
> rồi mới đưa xem — nên khi bạn nói xấu, cả 4 màn cùng vứt."*

Nên FR này làm **hạ tầng**, không dựng 5 màn còn lại.

---

## Ba điều khảo sát đổi so với giả định ban đầu

**1 · Hệ ảnh nền ĐÃ CÓ và đang chạy.** `web/plugins/backdrop/` đã làm đúng ba
điều `ui_guide §5` đòi (đảo opacity hai lớp · dừng khi `visibilitychange` · dừng
khi `mouseover`), và `prototype.css:65-74` đã có `.sky` + `.mist` + `.grain` —
**ba tầng đầu của §1 đã tồn tại**. Không dựng lại; nâng cấp.

**2 · Ba trong bốn thứ của "kính" ĐÃ CÓ.** `--edge` (FR-014), `--e-top`
(FR-013), `--blur-lift` (DESIGN.md §3). Thiếu đúng thứ thứ tư: `--gloss`. Đó là
lý do panel trước FR này đọc ra là *"ô mờ"*, không phải mặt kính — mắt nhận ra
vật liệu qua **phản chiếu**, không qua độ mờ.

**3 · Phán đoán về tương phản của tôi trong plan SAI, và phép đo sửa nó.**
Plan viết *"`--t4` trượt ở cả hai hệ, sửa `#7c7c86` → `#8c8c96`"*. Đo lại trên
**ảnh thật** thì hệ này chỉ có **ba** bậc chữ, không bốn — `--t4` của guide là
bậc thứ tư không tồn tại ở đây. Không sửa gì cả.

Ca **thật sự** trượt nằm ở chỗ khác: **bản SÁNG**.

| Chế độ · nền tệ nhất | alpha .60 | .84 | .88 |
|---|---|---|---|
**sáng** · `light-4.jpg` (vùng giữa 109.2) · `muted-foreground` | **3.52 ✗** | 4.45 ✗ | **4.63 ✓** |
**tối** · `dark-5.jpg` (vùng giữa 151.7) · `ink-3` | **5.16 ✓** | — | 6.43 ✓ |

⇒ **hai chế độ, hai alpha.** Bản tối `.88 → .62` (kính thật); bản sáng **giữ
`.9`**. Không phải thiếu nhất quán mà là hệ quả vật lý: ảnh sáng làm nền nhạt
nên chữ **tối** cần panel **đặc** mới đọc được.

Chọn `.62` chứ không `.60` của guide: `.55` cho `ink-3` = 4.90, chỉ dư 0.4 so
với ngưỡng — thêm một ảnh sáng hơn là lật sang trượt. `.62` cho 5.16, dư 0.66.

Và `motion-polish.test.js:62` khoá `glass_alpha.light === 0.9` với
`--background:rgba(252,252,251,.9)` — giữ bản sáng nguyên **cũng là giữ test đó
xanh**, không phải trùng hợp: contract đã validate đúng con số này.

---

## Đã làm

### 1 · Ảnh nền cho mượt — `core/tools/toi_uu_anh_nen.py`

Đo được ở `public/`: **11 file / 17.7 MB**, lớn nhất **8.4 MB** (9783×5503 — bị
trần 4 MB của plugin **bỏ qua im lặng**), và **ba cặp trùng**:

| Cặp | Bằng chứng |
|---|---|
`light-6 copy.jpg` = `light-6.jpg` | **byte-identical** (cùng sha256) |
`lio.jpg` ≈ `…38714444.jpg` | lệch **0.35**/255 khi so ô 160×90 |
`…38543670 (1).jpg` ≈ `…38543670.jpg` | lệch **0.97**/255 |

Ngưỡng so 6.0 đã kiểm: cặp gần nhất tiếp theo lệch **25+**, nên không có nguy cơ
xoá ảnh khác nhau.

Ba việc, mỗi việc một lý do đo được: thu nhỏ về ≤2560px (ảnh bị `blur(22px)` +
veil phủ lên nên chi tiết hơn thế là thừa) · nén ≤400 KB, **không xuống dưới
q60** (dưới đó thấy banding trên vùng trời phẳng) · bỏ file trùng, **giữ bản
nhỏ**.

**Kết quả**: `public/` 17.7 MB → 2.3 MB · `static/bg/` **9306 → 2267 KB (giảm
76%)**, 10 → 8 file, lớn nhất 428 KB. `index.json` tự cập nhật.

Hai ảnh vùng giữa còn sáng (151.7 và 137.3) — **không đốt vào pixel**, xử lý
bằng veil trong CSS để còn đổi ý được. Script in `!!` gọi tên chúng.

### 2 · Token — `05_uiux/tokens.css`

- bản tối `--background` `.88 → .62` (số đo ở trên, ghi cả bảng vào comment)
- `--gloss` **mới**, khai riêng cho hai chế độ: sáng `.10`, tối **`.14`**

Vệt sáng ở tone tối **đậm hơn** tone sáng — ngược với `--e-top` (`.55 → .07`),
nhưng cùng một lý do: mắt đọc **độ tương phản với nền**, không đọc trị số alpha.
`--e-top` là một **vạch 1px** nên `.55` trên nền thẫm thành đường chói ⇒ hạ.
`--gloss` là **vệt loãng** trải 64% panel nên `.10` gần như tan ⇒ nâng.

### 3 · CSS — `web/styles/prototype.css`

Khối `FR-027` ở cuối: `.pn,.bk,.top{background-image:var(--gloss)}` và
`.cd{background-image:var(--gloss)}`. **+2 dòng**, không phải hệ CSS thứ hai.

Không dùng pseudo-element: `.pn::after` đã mang viền sáng FR-014, thêm
`::before` là thêm một lớp hợp thành nữa trên nền đang có ảnh — đúng thứ §6a
đếm. `background-image` nằm trên mặt nền sẵn có, **không tốn lớp**.

**Trả một nợ cũ**: `.dlg::backdrop` từng gõ `blur(2px)`, vi phạm `DESIGN.md §9`
(*"Không thêm blur khác `--blur-lift`"*) — luật tồn tại vì bản v15 dùng ba mức
blur và mắt đọc ra ba chất liệu trên cùng màn hình. Giờ dùng token.

### 4 · Bịt lỗ hổng + răng

**Trần cho bundle** — lỗ hổng thật: test canh *"CSS phải TÁCH ra file"* từ đầu
nhưng **không ai canh file đó nặng bao nhiêu**. Comment nói 86 KB, `css-applied`
nói 46 KB, thực tế `gn.css` đã **118 KB** — phình 2.4× mà không phép kiểm nào
đỏ. Tách file cứu phần **lặp**, không cứu phần **phình**. Thêm ngưỡng
`gn.css ≤ 160` · `gn.js ≤ 100` vào `page-weight.test.js`.

**`web/test/he-kinh.test.js`** — 19 phép kiểm:

| Khối | Canh gì |
|---|---|
1 | bốn thứ của §4 đều có token, đều tới được `.pn`; `--gloss` khai riêng hai chế độ |
2 | §6a — đếm lớp `backdrop-filter` ≤ ngưỡng khai (hiện 6/8); `.cd` **không** blur |
3 | §6b + DESIGN.md §9 — mọi blur dùng `var(--blur-lift)`, không `saturate()` gõ tay |
4 | §6c — không `mix-blend-mode` trên lớp phủ toàn màn |
5 | §6d — canvas (nếu có) phải có `document.hidden` + khoá 30fps + reduced-motion |
6 | ảnh nền ≤500 KB, không cặp nào trùng dung lượng |

Khối 5 chấp nhận *"chưa có canvas"* là hợp lệ — guide **mô tả** nó, không bắt buộc.

**Kiểm hai chiều**: lùi `--gloss` khỏi `.pn` ⇒ đỏ · trả `blur(2px)` ⇒ đỏ · gieo
một ảnh 3 MB ⇒ đỏ kèm đúng lệnh sửa. Ba loại, ba lần bắt đúng.

---

## Chưa làm — cố ý

- **5 màn còn lại** (`v-all`, `v-queue`, `v-kho`, `v-concepts`, `v-nap`).
  `REDESIGN-PLAN.md §5` viết luật đó ra sau khi v1 hỏng vì đúng lý do này.
  `v-nap` là **249 dòng / 36 control** và `ui_guide` không có công thức nào cho
  form — cần bàn riêng.
- **Canvas hạt 3D** (§6d/§8) — vẫn chưa làm.
- ~~**Ba vòng tự chuyển** (§5)~~ → **đã quyết ở FR-027e**: người dùng chỉ định
  `trang-chu.html` làm hợp đồng UI, nên `DESIGN.md §9` được **nới có giới hạn**
  cho **đúng hai** vòng ở Trang chủ. Xem *"Nợ luật"* ở mục FR-027e. Vòng thứ ba
  (ảnh nền 7s) **không** làm.
- **Không nhúng CSS/JS vào HTML**, không dùng `style=""` như `trang-chu.html`
  (**288 chỗ** so với 1.5 KB CSS thật). `page-weight.test.js:66` cấm, và tách
  file là thứ đã kéo 86 KB → 22 KB mỗi trang.
- **Không dùng Google Fonts CDN** như `trang-chu.html:8` — B-D3 là local/private.
- **Không đổi tên class** (`.pn`, `.sky`, `.brk-g`) — `css-applied.test.js` khoá
  4 dấu vân tay và `markup-matches-css.test.js` đòi song ánh hai chiều.

---

## Kết quả đo

| | Trước | Sau |
|---|---|---|
`static/bg/` | 9306 KB · 10 file | **2267 KB · 8 file** (−76%) |
ảnh lớn nhất | 3009 KB | **428 KB** |
`gn.css` | 118 KB, **không trần** | 119 KB, **trần 160** |
`mock/index.html` | 48 KB | 48 KB (không đổi) |
lớp `backdrop-filter` | 6, không đếm | 6, **ngưỡng 8 có test** |
blur gõ tay | 1 (`blur(2px)`) | **0** |

`npm test` **34/34** · `npm run check` sạch · `pytest` 30/30 · **13/13** cổng.

---

## Cần sinh lại + ký

`contrast-audit.json` khai `glass_alpha.dark: 0.88` — giờ là `.62`. File ở trong
`FROZEN.lock` và header ghi *"Sinh lại mỗi khi token màu đổi — KHÔNG chỉnh tay"*.
`motion-polish.test.js` chỉ khớp vế **light** nên hiện vẫn xanh, nhưng vế dark
đã lệch thực tế. **Nợ phải trả trước khi dựng Trang chủ.**

---

## FR-027e — Trang chủ dựng theo `trang-chu.html`

**Mức**: s5 (`ui_frozen` v1.11 → **v1.12** · `tokens.css` · **nới `DESIGN.md §9`**)
**Ngày**: 2026-08-24
**Nguồn**: người dùng chỉ định `trang-chu.html` làm hợp đồng UI của Trang chủ

### Vì sao có mục này — ba lượt trước trượt cùng một cách

Người dùng xem bản chạy ba lần và nói: *"chưa đẹp"* → *"tôi cần làm y chang file
`trang-chu.html`… bạn làm lại xấu quá"* → *"tôi muốn layout như `trang-chu.html`
luôn"*.

Chẩn đoán, đo được: kiến trúc thông tin **trùng nhau** (cùng 4 vùng), nhưng tôi
đổi token · thêm tầng loé sáng · đổi rail — tức **sơn lại bố cục cũ**. Nhìn vẫn
ra bản cũ vì nó *là* bản cũ. Mục này đổi **cấu trúc** từng vùng.

Còn *"`/mock` có giống real đâu"*: đo ra cấu trúc **giống hệt** — cùng 4 `.pn`,
cùng 5 họ layout. Khác là **dữ liệu** (mock 13 bản, real 3 bản với **0 approved**).
Nhưng câu đó vẫn phát hiện một bug thật **do tôi gây**: bỏ `.pn` bọc vùng Nổi bật
làm `<p class="hint">` của trạng thái rỗng trôi giữa ảnh nền, không còn panel.
Sửa bằng `.brk-g > .hint{grid-column:1/-1}` + nền panel riêng.

### Khoảng cách đo được, và cái đã chốt

| Vùng | Trước | Chốt |
|---|---|---|
Khung nội dung | **một** `.wrap` gộp hai việc | **hai lớp** — `.wrap` chỉ bù rail 78px · `.mid` `max-width:1440px` + `padding:0 48px` ⇒ nội dung **1344px** |
1 · Nổi bật | 1 panel bọc, 3 cột `1.5fr 1fr 1fr`, tĩnh | **không panel bọc** · 2 cột `1.5fr/1fr` + `perspective:1800px` · trái 3 thẻ **chồng** `grid-area:1/1` tự chuyển 6s + 3 dot · phải 2 thẻ `flex:1` |
3 · Kho | 3 ô KPI dọc + bar HTML phẳng | 4 ô KPI **2×2** + **3 pane chồng** (khối 3D · bar loại nguồn · bar độ tin) + 3 tab, đổi 5s |
3D | `preserve-3d` **0 chỗ** | khối 3 tầng transform, 3 cột × 3 mặt |

`.wrap` **không** mang `max-width`: một phần tử một việc. Gộp lại là lý do khung
không căn giữa được khi rail đổi bề rộng.

**Khối 3D cần đúng ba tầng**: `.tw-w` giữ `perspective:1500px` · `#tower` giữ
`preserve-3d` + `rotateX(60deg) rotateZ(-38deg)` · `.tw-p` giữ `preserve-3d`.
Gộp `perspective` vào `#tower` thì nó áp cho **chính** phần tử đó, không cho con,
và khối dẹt. Token mới: 9 × `--b{1,2,3}{t,f,s}` + `--gridline` + `--planeb`, khai
riêng cho **cả hai** chế độ — ba mặt ba màu là thứ làm khối đọc ra thể tích;
một bộ màu cho hai nền thì đúng một nền.

### Ba quirk của bản tham khảo — port nguyên là mang cả lỗi

`trang-chu.html` là bản tự chứa 596 dòng và nó tự mắc ba lỗi. Bê nguyên là bê
luôn cả ba, nên chúng được sửa **và** có răng canh:

| # | Bản tham khảo | Hệ quả thật | Sửa |
|---|---|---|---|
1 | `countUp(document)` / `growBars(document)` gọi lúc load | đặt cờ `__c`/`__g` ⇒ lần gọi trong `IntersectionObserver` **không bao giờ** làm gì ⇒ reveal-on-scroll **không tồn tại** | chỉ gọi qua observer, không gọi ở scope `document` lúc load |
2 | một cờ `hover` gắn hero, dùng cho **cả** vòng biểu đồ | hover hero **đóng băng biểu đồ**; hover biểu đồ **không dừng gì** | `treoFeat` + `treoPane` — hai cờ khai riêng |
3 | `style-hover="…"` | thuộc tính **bịa** — hover `translateY(-3px)` **chưa từng chạy** | CSS `:hover` thật |

### Nợ luật — nới `DESIGN.md §9`, khai chứ không tự quyết

`DESIGN.md §9` cấm **"carousel, infinite scroll, popup"**. Bản tham khảo do người
dùng chỉ định có **hai vòng tự chuyển kèm nút dot/tab** — theo nghĩa hẹp đó là
carousel.

Người dùng đã chỉ định `trang-chu.html` làm hợp đồng UI, nên làm theo. Nhưng đây
là **nới một luật tầng dưới**, phải khai kèm giới hạn đóng:

- **đúng hai** vòng, **chỉ** ở Trang chủ (6s tin nổi bật · 5s biểu đồ)
- dừng khi hover — **hai cờ riêng**, không dùng chung
- dừng khi `document.hidden`
- `prefers-reduced-motion` ⇒ **tắt hẳn**, không giảm biên độ (`DESIGN.md §7` nói
  *tắt hoàn toàn*)
- mỗi vòng có **nút bấm tay** gọi cùng hàm `veFeat(i)`/`vePane(i)`
- **không** vòng lặp vô hạn không điều khiển được; `addCleanup` gỡ hẹn giờ +
  observer khi điều hướng SPA

Không nới thêm gì ngoài đúng ngần này. Vòng thứ ba (ảnh nền 7s, §5) **không** làm.

### Trọng lượng — không nâng trần để cho vừa

Rail trái đẩy trang tới **dư 35 byte** dưới trần 48 KB. Cách dễ là nâng trần;
thay vào đó đo xem có mỡ thật không, và có: **CRLF + thụt đầu dòng** trong shell
HTML — bỏ ở lúc phát ra được **4 KB**, giữ `<pre>`/`<textarea>` nguyên vẹn.

Trần trang **vẫn** nâng 48 → **60 KB**, nhưng vì lý do khác: 3 pane + khối 3D là
**nội dung người dùng yêu cầu**, không phải phình. Cùng khuôn lý lẽ đã dùng khi
nâng 40 → 48. 60 vẫn cách xa 86 nên tripwire còn nổ đúng lúc.

Và thêm **hai trần chưa từng có**: `gn.css ≤ 160 KB` · `gn.js ≤ 100 KB`. Trước đó
bundle **không có trần nào** và đã âm thầm lên 112 KB.

### Bốn phép kiểm của tôi tự sai, mỗi cái một lớp lỗi

Ghi ra vì đây là lớp lỗi lặp lại, không phải sự cố lẻ:

| Phép kiểm | Sai vì | Sửa thành |
|---|---|---|
`exec` lấy luật `.mid` | lấy luật **cuối file** — mà luật cuối là luật **mobile** | lọc bỏ `@media` trước rồi mới lấy luật cuối (`cssGoc`) |
`grid-template-columns:…1.5fr…1fr` | **không neo cuối** ⇒ khớp cả `1.5fr 1fr 1fr`, tức bố cục 3 cột **cũ** vẫn xanh | neo `;` |
`/treoFeat[\s\S]*treoPane/` | tìm **tên xuất hiện**; đổi dòng khai thành `treoChung` vẫn xanh vì tên còn ở chỗ dùng | cắt riêng các dòng **khai** rồi mới tìm |
9 token khối trên **cả file** | một chế độ có là đủ xanh — mà một bộ màu cho hai nền thì sai một nền | cắt khối `:root` / `[data-theme="dark"]` rồi đo **từng** khối |

Lớp lỗi chung: **đếm hoặc tìm một chuỗi rồi kết luận về hành vi.** Cả bốn đều
lộ ra bằng cách **tái tạo lỗi và đòi test phải đỏ** — không cái nào lộ ra khi
chỉ chạy xanh.

### Kết quả đo

| | Số |
|---|---|
`npm test` | **36/36** file · exit 0 |
`npm run check` | sạch |
cổng Python | **13/13** |
`contrast-audit` | 62 cặp · **0 trượt** trên ảnh đang dùng |
`mock/index.html` | **48 KB** (trần 60) |
`gn.css` · `gn.js` | **148** (trần 160) · **71 KB** (trần 100) |
nội dung | **1344 px** trên màn 1920 |
`home-motion.inline.ts` | 193 dòng |

### Chưa làm — cố ý

- **5 màn còn lại** (`v-all`, `v-queue`, `v-kho`, `v-concepts`, `v-nap`).
  `upgrade.md §Redesign`: *"làm lần lượt từng page"*.
- **Canvas hạt** (§6d/§8) — `he-kinh.test.js` đã có khối canh, "chưa có" là
  trạng thái hợp lệ.
- **Parallax `#hero`/`#tower` theo cuộn** — `perspective` đã đặt sẵn ở CSS.
- **Vòng ảnh nền 7s** (§5) — hai vòng là đúng ngần được nới, không thêm.
- `dongBoThe()` chỉ đồng bộ `#grid2`.

---

## FR-027f — Năm màn còn lại: đồng bộ thang · dải "máy đã làm gì" · 3D đúng chỗ

**Mức**: s5 (`ui_frozen` v1.12 → **v1.13** · `tokens.css` — thêm bậc, không đổi giá trị nào)
**Ngày**: 2026-08-24
**Yêu cầu người dùng**: *"tất cả màn còn lại sửa hết, redesign hết"* · màn
`/mock/nap/` *"cũng hoàn thiện luôn"* · ba điều kiện: **(1)** đồng bộ size/font
**(2)** gọn gàng, thông minh, bố cục bắt mắt nhưng **có tính AI - tự động, 3D**
**(3)** note kỹ nếu chạm DB/BE/logic FE

### Điều KHÔNG chạm — trả lời trực tiếp điều kiện (3)

| | |
|---|---|
`web/api/**` · `core/src/**` · `05_intake/**` · `kb/**` · schema · index SQLite | **0 dòng.** Kiểm được: không file nào trong các thư mục đó chứa dấu `FR-027`. |
API mới · truy vấn mới · trường mới | **không có.** Mọi con số của năm dải đều đếm lại từ dữ liệu **đã nằm trên bản ghi** (`priority`, `source_type`, `concepts`, `concepts_proposed`). |

**Logic FE đổi đúng hai chỗ**, cả hai ở mức "cơ bản" mà `upgrade.md §Redesign` cho phép:

1. `home-motion.inline.ts` — danh sách phần tử observer quan sát:
   `".kpi, .pn-w"` → `".kpi, .pn-w, .mb"`. Một selector. Cần vì khối 3D của năm
   màn nằm trong `.mb`; không thêm thì cột không bao giờ dựng cao.
   Dựa trên hành vi chuẩn của `IntersectionObserver`: nó **vẫn bắn** khi phần tử
   đi từ `display:none` sang hiện — nên khối ở màn đang ẩn dựng đúng lúc màn đó
   được mở, không phải dựng sẵn rồi người dùng thấy nó đã cao từ đầu.
2. `home-pages/index.ts` — thêm `catBinhLuan()` **ở bước gộp CSS**. Đây là bước
   build, không phải mã chạy trên trang; nó không đổi một dòng CSS nào, chỉ bỏ
   bình luận. Xem *"Trọng lượng"* dưới.

`#tower` → `.tw-i` là đổi **markup + CSS**, không phải logic: khối 3D giờ dựng ở
bốn màn, mà cả 6 màn nằm trong **cùng một tài liệu** (`doiView()` đổi màn
client-side) — id thứ hai là HTML sai, và `querySelector` sẽ lấy đúng cái đầu rồi
ba màn kia **im lặng** không xoay.

### Điều kiện (1) · đồng bộ size/font — và cái lỗ nó phơi ra

Đo trước khi sửa, không đoán: `prototype.css` có **9 luật `font-size` gõ px** và
**59 giá trị ≥8px gõ tay**. Nguyên nhân gốc: thang 10 bậc **thiếu** ba bậc mà
`ui_guide §3` đòi (10.5 · 15.5 · 27–34) — không có bậc thì người viết gõ số.

Và `token-only.test.js` không thấy gì cả, vì nó **miễn CẢ FILE**:

> *"prototype.css BÊ NGUYÊN 437 dòng từ app-v20.html — nó là hợp đồng G5"*

Lý do đó đúng khi file có 437 dòng. File đã **2046 dòng**, phần lớn là mã ta
viết. Miễn cả file nghĩa là **M03-R4 không có răng trên file CSS lớn nhất dự án**.

Sửa: **miễn theo GIÁ TRỊ, không theo file** — px < 8 (đúng phạm vi lý do gốc:
2px vạch, 3px lệch, 6px góc; thang `--s-*` bắt đầu ở 4px nên chúng thật sự không
có token). Từ 8px trở lên là **nhịp bố cục**, phải qua token.

Token thêm — **không đổi giá trị nào đang có**:

| Nhóm | Token |
|---|---|
bậc chữ `ui_guide §3` | `--fs-nano` 10.5 · `--fs-card` 15.5 · `--fs-stat` 27 · `--fs-logo` 17 · `--fs-feat` clamp(30↔44) |
hằng số bố cục `§9` | `--rail-w` 78 · `--mid-w` 1440 · `--mid-pad` 48 · `--mid-bot` 120 · `--pn-py/px` 26/28 · `--pn-gap` 18 · `--r-pill` 999 |

Hai thang giữ **RIÊNG**, cố ý: nhịp `--s-*` là 4/8/12/16/24/32/48/64, nhịp của
bản tham khảo là 18/26/28. Trộn hai thang vào một tên là cách chắc nhất để sau
này ai đó chọn sai bậc.

`--rail-w` là token quan trọng nhất trong nhóm. Trước đây `rail-trai.test.js`
phải **so hai con số 78** gõ ở hai chỗ (rail và phần bù của khung nội dung). Giờ
cả hai đọc **cùng một token** ⇒ khớp do **cấu tạo**, không cần ai kiểm. Phép kiểm
đổi vai: canh không ai gõ lại số 78.

Còn lại **27 giá trị** là nhịp riêng của bản tham khảo (9/10/13/14/15/20/22/30/
34/36) — **neo về bậc gần nhất**, lệch tối đa 4px. Đổi lại có một thang thật để
năm màn dựng theo; đó chính là điều kiện (1).

### Điều kiện (2) · một bộ từ vựng, năm lần áp

Không dựng năm thiết kế rời — vì "đồng bộ" là chính điều kiện (1), và năm bản
một-lần là cách chắc nhất để lệch.

**Dải "máy đã làm gì"** (`.mb`), một dải mỗi màn. Lý do nó tồn tại: mọi con số
trên năm màn này **do máy tính** mà không màn nào nói ra điều đó — người đọc
không biết cái gì tự động, cái gì mình phải làm, nên con số đọc ra như nhãn tuỳ
ý. Luật của dải: **chỉ nói điều máy THẬT SỰ làm, kèm số thật**, và **mỗi màn một
sự thật KHÁC nhau**:

| Màn | Sự thật riêng | Số thật |
|---|---|---|
Tất cả bài | máy tính `priority` cho mọi bản, và đó **là** thứ tự mặc định; ba nút chỉ đổi thứ tự **đang hiện** (M03-R5) | phân bố ≥65 / 45–64 / <45 |
Chờ duyệt | máy xong phần của nó; **ba trường M1 máy không được điền hộ** (B-B1 / M08-R3) | `choDuyet` · 3 trường |
Kho | cả dashboard **dựng lại từ N file `.md`** mỗi lần build — không bản sao nào giữ sẵn số, nên không số nào lạc hậu; và **nói ra** số file không đọc được | N bản · N hỏng |
Danh mục | máy **đề xuất** nhãn từ nội dung; đủ ngưỡng `concept_merge_min` thì hiện nút kết nạp — **quyết định vẫn của người** | đề xuất · đạt ngưỡng · đang dùng |
Nạp nguồn | ba lối **không ngang nhau về mức tự động** | 6 pass · 4 cổng · 9 cổng |

Năm câu phải **khác nhau** — và đó là phép kiểm quan trọng nhất của mục này. Một
dải nói cùng một câu ở cả năm màn là nhãn *"AI-powered"*, không phải thông tin.

**3D — quy tắc chọn, không rải cho đẹp:**

```
có PHÂN BỐ  → khối 3D  .tw-*        (Tất cả · Kho · Danh mục)
có TRÌNH TỰ → chiều sâu perspective (Chờ duyệt · Nạp nguồn)
```

Khối 3D đọc được vì mắt **so chiều cao** ba cột; nó vô nghĩa khi dữ liệu là một
dãy bước, và ở đó `perspective` mới nói đúng điều *"cái này trước cái kia"*. Ba
khối phải vẽ **ba phân bố khác nhau** (priority · loại nguồn · nhãn dùng nhiều
nhất) — nếu không thì ba màn vẽ cùng một biểu đồ ba lần.

Số cột khai ở `NGUONG.cot3D = 3`, và ba **không tuỳ ý**: từ cột thứ tư trở đi cột
sau che cột trước trong phối cảnh nghiêng, lúc đó khối thành trang trí.

### Màn Nạp nguồn — *"hoàn thiện luôn"*

Ngoài dải + chiều sâu, sửa hai thứ đo được:

- **Vạch mức tự động** trên mỗi tab, đầy **3/2/1**. Đây là thông tin thật, không
  hoa văn: nó trả lời câu người mới thực sự hỏi ở màn này — *"tôi nên vào lối
  nào"*. Ba lối cùng số vạch thì vạch không mang thông tin nào, nên có răng canh.
- **Ô con trong panel kính.** `.np-form` và `.up-z` — hai mặt lớn nhất màn — còn
  dùng viền **đục** `--border` từ trước khi có hệ kính; trong một panel kính, một
  khung viền đặc đọc ra như dán từ app khác vào. Vật liệu thì đã đúng
  (`--glass-2` **chính là** `--card`, tức "ô con trong panel" của `ui_guide §2`);
  thiếu là **hai trong bốn** thành phần kính: `--gloss` và `--e-top`.
  **Không** thêm `backdrop-filter` — ô này nằm TRONG panel đã nhoè, nhoè lồng
  nhoè là lớp thứ 9, mà `ui_guide §6a` chốt chỉ panel lớn và rail được blur.
  Sau khi sửa: **7** lớp blur, ngưỡng 8.

Ba con số của dải đều có nguồn thật, không phải số nhớ — và có răng canh:
**6 pass** (`02_proposal §S1`) · **4 cổng** (`gac()` của `05_intake/gate.py`) ·
**9 cổng** (đánh số `# 1 —` … `# 9 —` trong `validate.py`, test đếm lại).

### Trọng lượng — lại tìm mỡ thật, không nâng trần

`gn.css` chạm **161 KB** trên trần 160. Đo trước khi quyết: **58 KB trong 160 KB
là BÌNH LUẬN** — 36% bundle. Chúng viết cho người đọc repo, không cho trình
duyệt. Cắt ở bước gộp: **160 → 83 KB**, và mọi luật còn nguyên (kiểm bằng răng:
`.mb-t-w`, `--rail-w`, `.np-au` vẫn có trong bundle).

Vì sao **không** minify thật (bỏ khoảng trắng, gộp selector): một bước biên dịch
thì phải có source map, không thì debug CSS thành đoán mò. Cắt bình luận là phép
**BỎ**, không phải phép **ĐỔI** — mọi dòng còn lại y nguyên nên số dòng trong
DevTools vẫn trỏ đúng chỗ.

Rồi **SIẾT** trần `gn.css` 160 → **100**. Trần 160 được canh khi bundle còn cõng
58 KB bình luận; giữ nó nghĩa là tripwire chỉ nổ khi CSS **tăng gấp đôi** — tức
nó thôi làm tripwire.

Và thêm một trần **chưa từng có**: **trang lớn nhất ≤ 74 KB**. Lỗ đo được: chỉ
`mock/index.html` bị canh, còn trang lớn nhất site là `mock/nap/` (**66 KB**) và
**không ai canh nó** — mà chính nó là nơi lỗi "CSS/JS bị nhúng lại" hiện ra sớm
nhất. Mọi trang mang cả 6 màn vì `doiView()` đổi màn **client-side**; thiếu một
màn là đổi sang nó bị trắng. Đó là đánh đổi đã chọn, không phải phình.

### Ba phép kiểm của tôi tự sai — cùng một lớp lỗi với lượt trước

| Phép kiểm | Sai vì | Sửa |
|---|---|---|
"năm dải nói sự thật riêng" | chỉ hỏi *"cửa sổ này có chứa từ khoá của tôi"*. Đem câu của màn Tất cả sang màn Kho **vẫn xanh**, vì màn Kho còn cụm "không đọc được" ở câu sau | mỗi dải có **câu ký**; kiểm hai chiều: **có** câu ký của mình **và KHÔNG** có câu ký của bốn dải kia |
trích thân dải tới dòng trống | file dùng **CRLF** nên mẫu hai dòng xuống không khớp, và test báo *"0 dải"* thay vì báo điều nó định đo | cắt **cửa sổ** từ chỗ gọi `chen(...)`, không phụ thuộc dòng trống |
sửa file bằng chuỗi nhiều dòng qua heredoc | cùng lý do CRLF — `assert` trượt im lặng | dùng công cụ sửa file không có lớp shell |

Lớp lỗi chung, **lần thứ hai** trong hai lượt liền: **đếm hoặc tìm một chuỗi rồi
kết luận về hành vi.** Cả ba lộ ra bằng cách **tái tạo lỗi và đòi test phải đỏ** —
không cái nào lộ ra khi chỉ chạy xanh.

### `/design:shadcn-ui` — không áp được, nói thẳng

shadcn là React + Tailwind. Dự án này là Quartz + CSS/TS thuần, **không có
React**. Kéo shadcn vào nghĩa là thêm một runtime React — phá trần
`gn.js ≤ 100 KB` và trái `upgrade.md §Redesign` (*"hạn chế tối đa việc thay đổi"*).
Lấy phần dùng được của nó — thang cỡ nhất quán, biến thể nút, trạng thái
focus/disabled — và áp bằng token sẵn có.

### Kết quả đo

| | Số |
|---|---|
`npm test` | **37/37** file · exit 0 (36 → 37) |
`npm run check` | sạch |
cổng Python | **14/14** |
`contrast-audit` | 62 cặp · **0 trượt** |
`gn.css` | **160 → 83 KB** (trần siết 160 → 100) |
`gn.js` | 72 KB (trần 100) |
trang chủ · lớn nhất | **54 KB** (trần 60) · **66 KB** `mock/nap/` (trần **mới** 74) |
lớp `backdrop-filter` | **7** (ngưỡng 8) — không thêm lớp nào |
giá trị ≥8px gõ tay trong CSS | **59 → 0** |

Kiểm **hai chiều** 10 phép: xoá bậc `--fs-card` · gõ lại 78px · dải Kho lấy câu
màn Tất cả · khối 3D quay về id · ba lối cùng số vạch · mốc `#mbq` sang sai màn ·
gõ lại `font-size:20px` / `padding:26px` / `78px` · tinh chỉnh 3px (phải **lọt**).
Chín phép đỏ đúng chỗ, phép thứ mười xanh đúng chỗ.

### Chưa làm — cố ý, và nói rõ

- **Trang bài** chưa dựng lại lưới bất đối xứng; thanh tiến độ đọc chưa có.
- **`REDESIGN-PLAN §3.3` vẫn chưa đạt**: `var(--brand)` xuất hiện **65** lần, mà
  ý định là *"đỏ tập trung vào một khoảnh khắc mỗi màn"*. Đo được, nên không cần
  tranh luận. Chưa có răng nào canh **tần suất** — thêm một cái là dễ, nhưng
  ngưỡng bao nhiêu thì cần bàn, không tự quyết.
- **Canvas hạt** (`ui_guide §6d/§8`) chưa có.
- **Parallax `#hero`/`.tw-i` theo cuộn** (`§7`) chưa có — `perspective` đã đặt sẵn
  ở CSS nên nó là việc thêm JS, không phải đổi bố cục.
- **Vòng ảnh nền 7s** (`§5`) không làm — hai vòng là đúng ngần đã được nới ở
  FR-027e, không tự nới thêm.

---

## FR-027g — Gộp màn **Chờ duyệt** vào màn **Kho**

**Mức**: s5 (`ui_frozen` v1.13 → **v1.14** · `M03_web/spec.md` — file frozen)
**Ngày**: 2026-08-25
**Yêu cầu người dùng**: *"Gộp màn chờ duyệt và kho lại với nhau — vì kho đã chứa
thùng rác, thì ta nên để chờ duyệt in here cho dễ manager"* · *"đưa luôn url
`/cho-duyet` vào `/kho`"*

### Vì sao đúng — đo được, không phải ý thích

Hai màn tách nhau nhưng cùng **một vai**: nơi người dùng *thao tác* trên kho,
không phải nơi *đọc* nó.

| | Chờ duyệt (cũ) | Kho |
|---|---|---|
Việc | duyệt/loại bài đang treo | tổng quan + **khôi phục** bài đã xoá |
Danh sách thao tác | `#queue` | `#rac` (thùng rác) |
Nguồn dữ liệu | `choDuyet` — lọc từ `tatCa` | `tatCa` |

Hai danh sách thao tác trên hai màn, cùng một kho. Và con số ở ô KPI *"chờ
duyệt"* trước đây nằm ở màn Kho còn danh sách mà nó đếm nằm ở màn khác — người
đọc phải đổi màn để xem thứ mà con số vừa nói tới.

### Bố cục sau khi gộp

```
Kho
 ├ dải #mbkho   (dashboard dựng lại từ N file .md)
 ├ KPI 2×2      (duyệt · chờ · loại · tổng · thùng rác)
 ├─ CHỜ DUYỆT ──────────────  ← chuyển sang, nguyên khối
 │   ├ dải #mbq  (ranh giới B-B1: 3 trường M1 máy không điền hộ)
 │   └ .qw > .nw#queue
 ├ theo loại nguồn | theo tin cậy
 ├ trạng thái duyệt
 └ thùng rác (api-only)
```

**Việc-phải-làm đứng trước bối cảnh.** Người dùng vào Kho để duyệt bài; biểu đồ
là thứ để *tham khảo*, không phải thứ để *làm*. Thứ tự này có răng canh — nó là
điều dễ trôi nhất ở đây, vì đổi thứ tự không làm hỏng gì và không test nào khác
thấy.

### Ba quyết định người dùng chốt

| | Chọn | Vì sao |
|---|---|---|
Tab "Duyệt" | **bỏ**, tab Kho mang **badge số** | rail còn 4 tab. Bỏ tab là mất một đường một-bấm tới việc hằng ngày — badge trả lại tín hiệu đó mà không tốn một tab |
`/cho-duyet/` | giữ **trang chuyển hướng** | bookmark cũ không gãy. 404 trên một tool local đọc ra như *"dữ liệu mất"*, không phải *"trang đã dời"* |
Vị trí mục | **ngay sau KPI**, trước biểu đồ | việc trước bối cảnh |

### Hai dải trên một màn — đổi luật có chủ đích

FR-027f chốt *"một dải mỗi màn"*. Màn Kho giờ có **hai**. Luật đổi thành: **dải
thuộc MỤC nó đứng đầu, không thuộc MÀN.** `#mbkho` giải thích dashboard, `#mbq`
giải thích đúng danh sách ngay dưới nó.

Không gộp hai câu làm một: chúng nói hai sự thật khác nhau, và gộp sẽ mất câu
B-B1 (*"ba trường M1 máy không được điền hộ"*) — câu quan trọng nhất trong app.

### Trang chuyển hướng — bốn quyết định, mỗi cái một lý do

`/cho-duyet/index.html`, **469 byte**:

- **`meta refresh` VÀ một link thật.** Refresh có thể bị chặn, và trình đọc màn
  hình đọc trang trước khi nó kịp nhảy. Chỉ một trong hai là một ngõ cụt.
- **Không `<script>`.** Trang này không nạp `gn.js`, và một thẻ script rời sẽ
  buộc `no-dangerous-html` phải xét thêm một ngoại lệ. `meta refresh` là HTML
  thuần, không cần ngoại lệ nào.
- **Không nạp CSS/JS.** Nạp 84 KB rồi nhảy đi ngay là lãng phí thuần. Nhưng
  *"trang không có CSS"* cũng chính là triệu chứng của lỗi mà `css-applied` sinh
  ra để bắt — nên ngoại lệ này được **khai** bằng một AC riêng, không phải chỉ
  bị bỏ khỏi danh sách.
- **Đường tương đối `../kho/#cho-duyet`.** `/mock/cho-duyet/` phải về
  `/mock/kho/`, không nhảy sang bản real — người dùng sẽ tưởng dữ liệu biến mất.
  Và neo phải là `#cho-duyet` chứ không chỉ `/kho/`: thả người dùng ở đầu một màn
  có 5 mục rồi để họ tự tìm là làm hỏng đúng thứ việc gộp định sửa.

### 840px: đặt lên KHỐI CHỮ — tôi đặt sai hai lần trước khi đúng

`ui_guide §9` chốt màn cũ *"1 panel hẹp (max-width:840px), danh sách hàng"*.

**Lần 1** tôi để nguyên trên panel: `#v-queue > .pn`. Sai vì `#v-queue` không
còn tồn tại, và một panel 840px giữa các panel full-width của dashboard đọc ra
như bị lỗi.

**Lần 2** tôi chuyển sang `.nw` (cả danh sách). Cũng sai, và lần này người dùng
thấy: dải `.mb` phía trên và dòng ghi chú phía dưới trải hết panel, còn mỗi hàng
thì dừng ở 840px — để lại một mảng trống lớn bên phải **mọi** hàng.

**Lần 3, đọc lại §9 cho kỹ**: lý do của 840 là **độ dài dòng mắt phải quét**.
Thứ có độ dài dòng là **văn bản**. Hàng thì còn có ngày, chip loại và nút —
chúng là **cột thao tác** và chúng thuộc về mép phải. Nên:

```css
.qw .qr > a > div{max-width:62ch}   /* chặn CHỮ */
.qw .nw{transform-style:preserve-3d} /* hàng trải hết panel */
```

`62ch` là cùng con số và cùng lý lẽ đã dùng cho `.feat-d` ở Trang chủ
(*"quá dài thì mắt mất dòng khi quay lại"*).

Bài học: khi bê một ràng buộc sang ngữ cảnh mới, phải hỏi **ràng buộc đó nói về
thuộc tính gì** — rồi gắn nó vào phần tử THỰC SỰ mang thuộc tính đó. Bê theo tên
("nó vốn ở trên panel/danh sách") là bê sai chỗ.

### Lỗi thật thứ hai: cả panel Kho + KPI bị ẩn

Người dùng gửi ảnh `/kho/`: màn bắt đầu thẳng bằng mục **Chờ duyệt**, không có
tiêu đề màn, không có ô KPI nào.

Nguyên nhân — luật có sẵn từ trước, **không** do lượt gộp:

```css
.pn:has(> [data-mount]:empty:only-of-type){display:none}   /* SAI */
```

`:only-of-type` hỏi *"có phải phần tử `<p>` **duy nhất** trong panel không"* —
chứ **không** hỏi *"có phải **mốc** duy nhất không"*, là điều nó định hỏi. Panel
đầu màn Kho có `<p class="khocanh">` (cảnh báo file hỏng — **rỗng** khi mọi file
đọc được) nằm cạnh `<div id="mbkho">` và `<div id="kpi2">` đầy nội dung. `<p>` đó
là `<p>` duy nhất ⇒ khớp ⇒ **cả panel biến mất**.

Viết đúng ý định — *ẩn khi **mọi** mốc rỗng*:

```css
.pn:has(> [data-mount]:empty):not(:has(> [data-mount]:not(:empty))){display:none}
```

**Vì sao không test nào bắt được, và răng phải đặt ở đâu**: markup luôn có đủ —
chỉ CSS ẩn nó. Bắt bằng markup thì phải chạy trình duyệt thật. Nên răng đặt lên
chính **luật**: nó không được dùng `:only-of-type`, và phải có vế
`:not(:has(> [data-mount]:not(:empty)))`. Kiểm hai chiều: tái tạo `:only-of-type`
⇒ 2 phép kiểm đỏ; bỏ vế `:not(...)` ⇒ 1 phép kiểm đỏ.

Lỗi này có từ trước lượt gộp và không ai thấy, vì màn Kho trước đây bắt đầu
bằng các panel biểu đồ và không ai để ý phần đầu bị thiếu. Gộp Chờ duyệt vào
làm nó lộ ra.

### Màu tiêu đề — thắng bằng đặc hiệu, không bằng thứ tự

`#v-kho .pn-h h2{color:var(--success)}` áp cho mọi panel trong Kho, kể cả mục
Chờ duyệt — mà vai của mục này khác hẳn: *việc đang treo*, không phải *toàn cảnh*.

`#cho-duyet .pn-h h2` có **cùng đặc hiệu** (1,1,1) với luật trên, và lúc đó chỉ
**thứ tự nguồn** quyết định — đúng cái bẫy cascade dự án đã trả giá **ba lần**.
Dùng `#v-kho #cho-duyet .pn-h h2` cho (2,1,1): thắng dứt khoát dù ai đó sắp xếp
lại file.

### Badge — một con số, một nguồn

`chen(shell, "tbn", choDuyet.length ? … )` đặt **ngay cạnh** `qcount` trong
emitter, có chủ đích: hai chỗ in **cùng một** con số ở hai vị trí khác nhau. Để
cạnh nhau thì sửa một cái mà quên cái kia sẽ lộ ngay khi đọc.

Rỗng khi 0 — luật `[data-mount]:empty{display:none}` ẩn hẳn. Không cần một nhánh
điều kiện nào, và **không có trạng thái "badge 0"** để ai đó phải nghĩ xem nó
nghĩa là gì.

Contrast của badge (cặp **mới**, chưa có trong `contrast-audit`) tính tay bằng
đúng công thức WCAG: sáng `#FFFFFF` trên `#854D0E` = **6.85:1** · tối `#1A0B0B`
trên `#FBBF24` = **11.47:1**. Cả hai đạt AA. Cặp này đi được ở cả hai chế độ vì
**cả `--warning` lẫn `--primary-foreground` đều đảo** theo chế độ.

### Bảy phép kiểm im lặng — phần đáng giá nhất của lượt này

Chạy `npm test` sau khi gộp: **1 lỗi**. Nhưng tôi đã đếm **8** chỗ neo vào màn cũ.

Nguyên nhân: `npm test` nối bằng `&&`, nên **một cái đỏ che hết phần sau**. Chạy
độc lập từng file thì ra **6** file đỏ. Còn **2** file thì xanh — và đó mới là
phần đáng lo:

| File | Vì sao xanh dù đã hỏng |
|---|---|
`open-card` | phép kiểm bọc trong `if (dong > 0)`. Mốc `queue` không còn ở trang đó ⇒ `dong = 0` ⇒ **phép kiểm tự loại mình khỏi tồn tại**. Một phép kiểm chỉ chạy khi đã có dữ liệu thì nó không canh được việc dữ liệu **biến mất** — mà đó đúng là thứ vừa xảy ra |
`url-va-tuong-tac` | chỉ hỏi *"file có tồn tại không"*. Trang stub tồn tại ⇒ xanh, dù `cho-duyet` không còn là một màn |

Và **ba phép kiểm mới của chính tôi** cũng sai, lộ ra khi kiểm chiều ngược:

| Phép kiểm | Sai vì | Sửa |
|---|---|---|
neo `#cho-duyet` + thứ tự trong Kho | khớp vào **bình luận tôi tự viết** ngay phía trên thẻ thật — đổi tên id của `<section>` vẫn xanh | bỏ `<!-- -->` trước khi đo vị trí |
badge đọc `choDuyet` | chỉ hỏi *"`choDuyet.length` có xuất hiện trong 200 ký tự không"* — đổi **một vế** (`rej.length ? String(choDuyet.length)`) vẫn để lại tên đúng trong cửa sổ | khớp **cả biểu thức** |
`.qw .nw` giữ 840px | `cuoi()` lấy luật **cuối**, mà `.qw .nw` có **hai** luật khai hai thuộc tính khác nhau ⇒ đọc trúng một nửa | gộp thành **một** luật ở nguồn — một selector, một sự thật |

Lớp lỗi chung, **lần thứ ba** liên tiếp: **đếm hoặc tìm một chuỗi rồi kết luận
về hành vi.** Và một lớp mới cần ghi tên: **phép kiểm có điều kiện tự vô hiệu
hoá mình khi điều kiện biến mất.**

### Dọn mồ côi do chính thay đổi này tạo ra

- `.tb[data-nav="queue"]::before` — luật icon của tab đã bỏ. Xoá.
- `#v-queue > .pn` và `#v-queue .pn-h h2` — selector trỏ vào id không còn tồn
  tại. Xoá, có răng canh *"CSS không còn selector `#v-queue` nào"*.
- `nav.queue` trong bảng i18n EN. Xoá. `pn.queue` **giữ** — vẫn là tiêu đề mục.
- `iconMask >= 5` trong `rail-trai` — số cứng, và nó vừa sai (4 tab, 4 icon). Ý
  định thật của luật là *"mọi tab đều có icon"*, dòng ngay dưới đã nói đúng điều
  đó và không bao giờ lạc hậu. Sàn chuyển sang **số tab**, nơi nó thuộc về.

### Đổi tên `nam-man-con-lai.test.js` → `cac-man-con-lai.test.js`

Ngoài phạm vi người dùng nêu, và tôi đã hỏi trước. Lý do: gộp xong còn **bốn**
màn, nên cái tên mang số vừa sai — và sẽ sai lại lần sau. Tên mang số là tên sẽ
lạc hậu. 4 chỗ tham chiếu: `package.json`, `test/WORKLOG.md`, `spec.md` AC-2.4.4,
`T03-5` AC12.

### Kết quả đo

| | Số |
|---|---|
`npm test` | **37/37** file · exit 0 |
`npm run check` | sạch |
cổng Python | **14/14** |
`contrast-audit` | 62 cặp · **0 trượt** (không đổi token màu nào) |
trang chủ · lớn nhất | **54 KB** (trần 60) · **66 KB** (trần 74) — **không đổi** |
`gn.css` · `gn.js` | 84 · 72 KB (trần 100/100) |
rail | 5 tab → **4** |
trang chuyển hướng | **469 byte** (trần 1 KB) |

Gộp là **trung tính về trọng lượng**: shell mất một `.view`, màn Kho được thêm
một `<section>` — cùng khối markup, chỉ đổi chỗ.

Kiểm **hai chiều** 7 phép: đổi tên id `<section>` · chuyển mục xuống sau biểu đồ
· hồi sinh `data-nav="queue"` · `DUONG` có lại key · badge đọc nửa biểu thức khác
· bỏ `max-width` của danh sách · màu tiêu đề chỉ một id. Cả 7 đỏ đúng chỗ và nêu
đúng thứ bị phá.

### Điều KHÔNG làm

- **Không đụng backend.** `web/api/**`, `core/**`, `kb/**`, schema, index SQLite —
  **0 dòng**. Gộp màn là markup + routing FE; `choDuyet` đã được tính sẵn.
- **Không đổi tập `choDuyet`** (`draft` + `edited`). `bon-trang-thai` canh điều
  đó và nó đúng nguyên vẹn sau khi gộp.
- **Không bỏ nút duyệt khỏi cửa sổ đọc.** B-B1 đòi người phải *đọc* rồi mới
  duyệt; gộp màn không được biến duyệt thành thao tác một-bấm từ danh sách.
- **Không đổi slug `khai-niem`** hay URL nào khác.
- **Không sửa `.factory/worklog/WL-01K9KBNAMMAN.yaml`** dù nó nhắc tên file test
  cũ — worklog là **biên bản lịch sử**, không phải tài liệu sống. Nó ghi đúng
  điều đã xảy ra lúc đó.

---

## FR-027h — Hai lỗi bố cục người dùng chỉ ra, và cửa sổ đọc

**Mức**: s5 (`ui_frozen` v1.14 → **v1.15** · `M03_web/spec.md` — file frozen)
**Ngày**: 2026-08-25
**Nguồn**: ảnh chụp `/nap/` của người dùng — *"ok, làm cho tất cả các màn luôn,
kể cả page nạp dữ liệu"*

### Lỗi 1 · Màn Nạp nguồn nằm NGOÀI khung giữa

Ảnh cho thấy panel NẠP NGUỒN trải gần hết bề ngang trong khi thanh tìm `.ph` bị
bó ở 1440px. Hai thứ nằm cùng một khung mà rộng khác nhau — nên một trong hai
không ở trong khung.

Đo bằng cách đếm độ sâu lồng nhau của shell:

```
v-home  v-all  v-kho  v-concepts →  độ sâu 2   (main > mid > view)
v-nap                             →  độ sâu 1   (main > view)
```

Nguyên nhân: một `</div>` **lạc**, kèm một bản **sao y** của dòng
`<p class="foot api-thieu">Muốn thêm/sửa/xoá nhãn…</p>` (bản thật ở dòng 317,
bên trong `v-concepts`). Cái `</div>` lạc đóng `.mid` ngay trước `v-nap`.

Lỗi có từ **trước** mọi lượt FR-027 — cân bằng thẻ ở HEAD đã lệch −1. Không ai
thấy vì bốn màn kia vẫn đúng, và `v-nap` chỉ xuất hiện trên **một** trang.

`<dialog>` **giữ** ở ngoài `v-concepts`: nó là top-layer, và nếu nằm trong một
`.view` đang `display:none` thì `showModal()` không vẽ được gì.

### Lỗi 2 · `.mid` không bao giờ đóng trên bốn trang còn lại

Sửa lỗi 1 làm lộ lỗi 2 — chúng che nhau.

`catNap` cắt khối Nạp nguồn khỏi các trang khác bằng
`html.slice(0, dau) + html.slice(indexOf("</main>"))`. Nó cắt **mọi thứ** từ
`v-nap` tới `</main>` — kể cả `</div>` của `.mid`. Trước đây không ai thấy vì
`.mid` đã bị `</div>` lạc đóng sớm, nên đoạn bị cắt không chứa thẻ đóng nào.

Sửa: tìm **đúng** thẻ đóng của `v-nap` bằng **đếm thẻ**. `indexOf('</div>')` sẽ
lấy thẻ đóng của phần tử **con** đầu tiên — cùng lớp lỗi đã mắc ở `.qw .nw`.

Trình duyệt tự vá một `<div>` chưa đóng ở `</main>`, nên **mắt không thấy**. Đó
là lý do lỗi này sống qua 37 file test.

### Răng cho cả hai — đặt ở TRANG ĐÃ BUILD, không ở shell

Lỗi 2 do bước **phát ra** sinh, shell hoàn toàn cân bằng. Kiểm shell là kiểm sai
vật. Nên phép kiểm mở từng trang đã build, tìm thẻ đóng của `.mid` bằng đếm thẻ,
rồi đòi **mọi** `id="v-*"` nằm trong khoảng đó.

Kiểm hai chiều: tái tạo `</div>` lạc ⇒ đỏ, nêu đúng tên `nap`. Tái tạo `catNap`
cũ ⇒ **8** phép kiểm đỏ trên 4 trang.

### Lỗi 3 · Badge tab Kho chồng vào icon

Đo hình học: tab rộng 54, `padding:12px 0`, icon 19×19 căn giữa ⇒ icon chiếm
x 17.5–36.5, y 12–31. Badge ở `top:4 right:6` cỡ 15 chiếm x 33–48, y 4–19 ⇒
**chồng** ở x 33–36.5. Đó là lý do nó đọc ra như dính vào chữ ("Kho3").

Sửa: dồn sát góc (`2px`) — hết chồng với badge một chữ số. Và cộng một vòng 2px
bằng chính bề mặt rail (`--glass`): badge hai chữ số nở về bên trái và chồng
lại, nhưng có vòng thì mắt vẫn đọc ra *"badge NẰM TRÊN icon"* chứ không phải một
vết nhoè.

### Cửa sổ đọc — đo trước, và kết quả đo đổi hẳn phạm vi

`REDESIGN-PLAN §3.2` ghi trang bài còn nợ *"lưới bất đối xứng"*. Đo thì phần lớn
**đã có**:

| Đã có | Ở đâu |
|---|---|
lưới bất đối xứng `200px 1fr` | `@container win (min-width:1100px)` |
mục lục **dính** | `.bk-toc{position:sticky}` |
đủ **bốn** thứ của kính | `.bk` + luật gộp `.pn,.bk,.top` cho `--gloss` |
độ dài dòng chặn | `--w-read`, nới tới `820/900px` trong cửa sổ rộng |
0 chỗ gõ px cho `font-size` | — |

Tôi đã nói sai ở lượt trước rằng thân bài không chặn độ dài dòng. Nó có.

Nên **không dựng lại bố cục** — chỉ thêm đúng ba thứ còn thiếu:

**1 · Thanh tiến độ đọc.** 2px dưới header cửa sổ. Vùng cuộn là `.bk-b`, không
phải window — cửa sổ đọc là khung riêng, đo window là đo sai vật. Bài ngắn hơn
khung ⇒ **ẩn** thanh: đoạn cuộn bằng 0 mà vẫn vẽ thì nó báo 0% hoặc 100%, cả hai
đều là số bịa.

`reduced-motion` **KHÔNG tắt** thanh này — chỉ bỏ `transition`. Nó là **thông
tin** (đang ở đâu trong bài), không phải hiệu ứng; tắt nó là bỏ một thứ người
đọc dùng. Đây là lần đầu trong dự án `reduced-motion` **không** tắt hẳn một thứ,
nên phải nói rõ lý do chứ không im lặng làm khác.

**2 · Cột neo mang metadata.** Bốn hàng `loại / tin cậy / ưu tiên / ngày`. Mọi
trường **đã** nằm trên `ban` từ `open-index.json` — không truy vấn mới, không
API mới. Vì sao ở cột trái mà không ở chân cửa sổ: chân đã có "loại · tin cậy"
nhưng nó là một dòng chạy ngang, đọc ra như chú thích. Cột trái là chỗ mắt quay
về khi đang đọc.

`analyzed_at` phải khai thêm vào `type Ban` của multiwindow — nó **đã** có trong
JSON, chỉ kiểu chưa khai.

**3 · Mục 6 "Tinh túy" đọc ra khác.** `§3.2`: *"đây là phần quan trọng nhất của
bài, v1 làm thành 5 thẻ giống hệt nhau"*. Vẫn đúng: `md()` giữ đúng cấp nên
`### 6.1` ra `h3` y hệt mọi `h3` khác.

Phải làm bằng **JS** vì CSS không chọn được *"những `h3` nằm sau một `h2` có chữ
'Tinh túy'"*, còn nhuộm **mọi** `.doc h3` thì sai — bài thật có thể có `h3` ở mục
khác. Một vòng quét DOM sau render, gắn class, CSS lo trình bày. Phải **dừng ở
`h2` kế tiếp**, không thì nó nhuộm cả mục 7–9.

Số thứ tự vẽ bằng **CSS counter** (`decimal-leading-zero`), cỡ `--fs-stat` 27px:
thêm/bớt một tinh túy thì số tự đúng, không ai gõ tay. Chữ tinh túy dùng
`--fs-lead` 18px — **không** to hơn tít mục 6, vì nó là con của mục đó; phân biệt
bằng **số** và **lề**, không bằng cỡ chữ.

### Bốn lượt phép kiểm của tôi tự sai — cùng MỘT nguyên nhân

Lần đầu chạy `cua-so-doc.test.js`: **10 báo đỏ giả**. Không lỗi nào ở code — cả
mười ở helper của tôi.

`cuoi(sel)` lấy luật **cuối**. Nó đúng khi hỏi *"trình duyệt vẽ giá trị nào"* cho
một thuộc tính bị **ghi đè** qua nhiều luật. Nhưng rất nhiều selector có nhiều
luật khai những thuộc tính **khác nhau**:

| Selector | Luật 1 | Luật 2 |
|---|---|---|
`.bk` | vật liệu kính | `min-width:340px` |
`.tt-b` | `counter-increment` | `font-size` |
`.doc` | `max-width:var(--w-read)` | `counter-reset` |

Lấy luật cuối ở đây là đọc trúng **một nửa** rồi báo "THIẾU" cho nửa kia.

Thêm `gop(sel)` — nối mọi luật — và ghi rõ **khi nào dùng cái nào**. Đây là lần
thứ **tư** cùng lớp lỗi (trước đó: `.mid` lấy luật mobile · `.tb[aria-current]`
lấy luật bị đè · `.qw .nw` đọc một nửa).

Hai lỗi phụ cùng họ:

- **`find()` lấy khối at-rule đầu.** Có **3** khối
  `@container win (max-width:640px)` — một từ FR-027c, hai từ FR-027h. Sửa: nối
  mọi khối cùng điều kiện.
- **Cắt at-rule bằng regex tới `\n}`** — nó đo **định dạng**, không đo **cấu
  trúc**, và lặng lẽ bỏ sót khối viết một dòng. Sửa: `catAtRule()` đếm ngoặc.

### Kết quả đo

| | Số |
|---|---|
`npm test` | **38/38** file · exit 0 (37 → 38) |
chạy **độc lập** từng file | 0 file đỏ |
`npm run check` | sạch |
cổng Python | **14/14** |
`contrast-audit` | 62 cặp · **0 trượt** (không đổi token màu nào) |
`gn.css` · `gn.js` | 86 · 76 KB (trần 100/100) |
trang chủ · lớn nhất | **54 KB** (trần 60) · **66 KB** (trần 74) |
`/nap/` bản real | 66 → **47 KB** sau khi sửa `catNap` |

Kiểm **hai chiều** 8 phép: `</div>` lạc trước `v-nap` · `catNap` cũ · bỏ thanh
tiến độ · bỏ rAF throttle · không dừng ở `h2` · số gõ tay thay counter · ẩn thanh
khi `reduced-motion` · bỏ metadata. Cả 8 đỏ đúng chỗ.

### Điều KHÔNG làm

- **Không đụng backend.** `web/api/**`, `core/**`, `kb/**`, schema, index — 0
  dòng. `analyzed_at` chỉ là khai kiểu cho một trường **đã** có trong JSON.
- **Không dựng lại bố cục cửa sổ đọc** — đo ra nó đã đúng. Thay vào đó **canh**
  phần đã đúng, vì "đã đúng" là thứ dễ mất nhất khi ai đó sửa quanh đó.
- **Không tắt thanh tiến độ khi `reduced-motion`** — nó là thông tin, không phải
  hiệu ứng. Ngoại lệ duy nhất trong dự án, và được khai ở đây.

### Còn nợ — nói rõ

- **`§3.3` đỏ như mực in**: `var(--brand)` **69** chỗ, ý định là *"một khoảnh
  khắc mỗi màn"*. Chưa có răng canh **tần suất** — ngưỡng bao nhiêu là quyết định
  thiết kế của **người**, tôi không tự siết.
- **Canvas hạt** (`ui_guide §6d/§8`) chưa có.
- **Parallax `#hero`/`.tw-i` theo cuộn** (`§7`) chưa có — `perspective` đã đặt
  sẵn ở CSS nên đây là việc thêm JS, không phải đổi bố cục.
- **Vòng ảnh nền 7s** (`§5`) **không** làm — hai vòng là đúng ngần đã nới ở
  FR-027e.

---

## FR-027i — Màn Kho: biểu đồ thay số khô khan

**Mức**: s5 (`ui_frozen` v1.15 → **v1.16**)
**Ngày**: 2026-08-25
**Yêu cầu**: *"page /kho — cần làm biểu đồ thay vì các con số khô khan… đây là
nơi làm animation AI vào nè"*

### Lỗi thật ảnh chụp phơi ra trước

Khối 3D ở dải màn Kho ghi **"0 PAPER · 0 VIDEO · 0 REPO"** — ba cột rỗng.

Nguyên nhân: FR-027f gõ cứng `["paper","video","repo"]`. Đo ra `kb/` thật có
`docs:1, article:2` — **không có** paper/video/repo nào. `kb-mock/` thì có cả
sáu loại.

Đây là **lớp lỗi lặp lại của dự án** — *"dữ liệu mẫu không phủ hình dạng dữ liệu
thật"* — nhưng lần này **ngược**: mẫu phủ rồi, thật thì không. Nên nó chỉ hiện
trên bản real, và bản real là bản người dùng mở.

Sửa: lấy **ba loại nhiều nhất** từ chính dữ liệu.

### Năm số khô khan → một thanh chia đoạn

Bốn con số đầu (duyệt / chờ / loại / tổng) **không** phải bốn đại lượng độc lập —
chúng là **ba phần của một tổng**. Năm ô rời rạc che đúng điều quan trọng nhất:
**tỉ lệ**.

Và lưới `1fr 1fr` với **5** ô cho ra 2+2+1 — ô lẻ cuối đọc ra như thiếu dữ liệu.
Đó chính là lỗi tôi **đã tự ghi** ở FR-027e (*"3 ô trong lưới 2 cột cho ra 2+1"*)
rồi vẫn để nó xảy ra với 5 ô.

```
[████████████░░░░░░░░░░░░]   ← một thanh 100%
 03 bản ghi trong kb/
 ▪ ĐÃ DUYỆT 01  ·  ▪ CHỜ DUYỆT 00  ·  ▪ ĐÃ LOẠI 02
 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
 NGOÀI KHO · TRONG THÙNG RÁC  02
```

Chú giải giữ **đúng con số** — không mất thông tin nào, chỉ thêm tỉ lệ.

### Ba quyết định về TÍNH TRUNG THỰC của biểu đồ

Một biểu đồ nói sai tệ hơn một con số khô khan, vì nó đọc ra thuyết phục.

**1 · Thùng rác KHÔNG là một đoạn.** Bài xoá đã **rời** khỏi `kb/`, nên nó không
phải một phần của tổng. Gộp vào là biểu đồ nói sai về chính **mẫu số** của nó.
Nó ở khối riêng, dưới một đường kẻ nét đứt — cần ranh giới **thị giác**, vì
không có nó thì mắt vẫn cộng vào.

**2 · Mẫu số là `tatCa`, không phải tổng ba đoạn.** Lấy tổng ba đoạn làm mẫu số
thì thanh **luôn** đầy 100% — kể cả khi có một trạng thái không thuộc nhóm nào.
Ở đây thanh phải **hụt**, và có một câu nói ra *"N bản ở trạng thái khác"*.

**3 · Cắt bớt phải nói ra.** Khối 3D chỉ vẽ `NGUONG.cot3D` = 3 cột. Bản mock có
**sáu** loại nguồn ⇒ ba cột cộng ra 9 cạnh câu nói 13. Thêm nhãn **"+3 loại
nữa"**. Cắt bớt là hợp lệ (khối 3D chỉ đọc được khi ít cột); cắt **im lặng** thì
biểu đồ đọc ra như đã phủ hết.

### Một mâu thuẫn nữa tìm ra khi sửa

`demTheo` mặc định đếm **`appr`**. Nên hai panel *"Theo loại nguồn"* / *"Theo tin
cậy"* đếm bài **đã duyệt**, trong khi dải đầu màn và thanh thành phần đếm
`tatCa`. Hai cơ sở khác nhau trên **cùng một màn**, không nói ra ⇒ người đọc cộng
nhầm hai biểu đồ.

**Không đổi cơ sở** — *"theo loại nguồn của bài đã lên site"* là một câu hỏi
thật, và đổi nó là đổi **ý nghĩa** của panel. Chỉ **khai** nó ở nhãn bên phải
tiêu đề: *"bài đã duyệt"*. Labelling fix, không phải data change.

Riêng khối 3D thì **đổi** sang `tatCa`: nó nằm **bên trong** dải có câu *"dựng
lại từ N file"*. Hai con số trong **cùng một ô** đếm hai tập khác nhau là lỗi im
lặng khó truy nhất.

### "Animation AI" — ranh giới tôi giữ, và vì sao

Người dùng gọi màn này là *"nơi làm animation AI vào"*. Chuyển động ở đây chạy
**MỘT LẦN khi vùng vào tầm nhìn** (`veThanhPhan` qua `IntersectionObserver`),
**không** phải một vòng lặp.

Vì sao: dashboard này được **dựng lại lúc build** — nó là một **ảnh chụp**, không
phải một dòng dữ liệu đang chảy. Một hiệu ứng nhấp nháy kiểu *"AI đang xử lý"*
trên một trang tĩnh là **nói sai về hệ thống**, và cùng loại sai với một biểu đồ
sai mẫu số: nó đọc ra rất thuyết phục.

Chạy một lần thì nó nói đúng điều đang xảy ra: *"con số này vừa được tính"*. Đó
cũng là đúng từ vựng chuyển động dự án đã có (`veCot`, `demSo` — cùng observer,
cùng cờ chống chạy lại).

`prefers-reduced-motion` ⇒ đoạn hiện thẳng bề rộng cuối. Không mất thông tin nào,
nên tắt **hoàn toàn** theo `DESIGN.md §7` (khác thanh tiến độ đọc ở FR-027h —
cái đó là *thông tin*, cái này là *chuyển động*).

### Kết quả đo

| | Số |
|---|---|
`npm test` | **38/38** · exit 0 · chạy độc lập 0 file đỏ |
`npm run check` | sạch |
cổng Python | **14/14** |
`contrast-audit` | 62 cặp · **0 trượt** (dùng token màu có sẵn) |
`gn.css` · `gn.js` | 88 · 77 KB (trần 100/100) |
trang chủ · lớn nhất | 55 KB (trần 60) · 67 KB (trần 74) |

Nhất quán nội bộ, đo trên **cả hai** bản:

| | REAL | MOCK |
|---|---|---|
đoạn thanh | 33.33% + 66.67% = 100% | 69.23 + 23.08 + 7.69 = 100% |
khối 3D | `2 article · 1 docs` = 3 | `3 article · 3 paper · 3 video` **+3 loại nữa** |
dải nói | 3 file | 13 file |

Kiểm **hai chiều** 4 phép — bốn cách làm biểu đồ nói sai: gộp thùng rác thành
một đoạn · lấy tổng ba đoạn làm mẫu số · quay về gõ cứng ba loại · cắt bớt im
lặng. Cả 4 đỏ đúng chỗ.

### Còn nợ

- **`§3.3` đỏ như mực in**: `var(--brand)` vẫn ~69 chỗ. Chưa có răng canh **tần
  suất** — ngưỡng là quyết định thiết kế của người.
- **Canvas hạt** (`§6d/§8`) · **parallax theo cuộn** (`§7`) — chưa có.
- **Cơ sở đếm của `bars2`/`bars3`** giờ được **khai** là `appr`. Nếu muốn chúng
  đếm `tatCa` thì đó là đổi ý nghĩa panel — cần bạn chốt, tôi không tự quyết.
