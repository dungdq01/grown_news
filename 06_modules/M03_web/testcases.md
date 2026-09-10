# M03_web — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Module lớn nhất: **29 AC**, **22** lệnh khác nhau. Đo 2026-09-03: **21
> xanh**, **1 lệnh trỏ một file KHÔNG TỒN TẠI** — và đó là phát hiện quan trọng
> nhất của cả lượt s6 này (`§cuối` mục 1).

## 2.1 · Ba luật tòa soạn

**AC-2.1.1** — đường render công-bố/deploy mới phải lọc `approved`
- *happy*: reviewer rà mọi đường render mới → có bộ lọc.
- *edge*: một đường render mới lọc `approved` **sau** khi gộp theo
  `url_normalized` → một bản `draft` **kéo** bản `approved` cùng nguồn lên site.
  `§3` chốt thứ tự *"lọc trước, gộp sau"*; đảo lại vẫn cho ra một danh sách trông
  đúng. Đây là ca reviewer phải rà, và AC chỉ nói *"phải lọc"*, không nói *"lọc ở
  đâu trong chuỗi"*.
- *edge 2*: `soft` vì *"không còn bundle để quét"*. ⚠️ Nhưng có **bộ lọc thật**
  (`web/plugins/approved-only/`) và **`only-approved.test.js`** canh nó ⇒ vế
  *"bộ lọc hiện có còn hoạt động"* là `hard`. AC gộp hai câu: *"bộ lọc còn đúng"*
  (đo được) và *"đường render **mới** cũng lọc"* (không đo được).

**AC-2.1.2** — trên `analyses.sample.v4.json`: build ra đúng **8** bài từ **13**
- *happy*: `expected-render.test.js` xanh, in `8 bài, 1 nhóm gộp, sắp đúng priority`.
- *edge*: số **8** trong test đọc từ `mong.articles_on_site` (contract), **không**
  gõ tay ⇒ bump sample thì test đi theo. Đây là hình dạng đúng, và nó là lý do
  test **không** lệch trong khi `§5` của spec lệch (`§cuối` mục 3).
- *edge 2*: sample bump lên `v5` → AC còn ghim `v4`. Contract có `v1…v5` trên
  đĩa; một AC ghim tên file là một AC hết hạn theo thời gian.
- *edge 3*: hai bản cùng `url_normalized` mà **khác** `review_status` (một
  `approved`, một `draft`) → nhóm gộp có **1** tab, không 2.

**AC-2.1.3** — bài nổi bật là `src_wfv001` (`priority` 65), không phải bài mới nhất
- *happy*: cùng lệnh, xanh.
- *edge*: một bản mới hơn với `priority` **cao hơn** → nó **phải** chiếm chỗ nổi
  bật. AC ghim một `slug` cụ thể, nên nó đo *"không sắp theo ngày"* bằng cách ghim
  kết quả — một cài đặt sắp theo `priority` **tăng** dần cũng có thể trùng khớp
  nếu dữ liệu thuận. Phép thử mạnh hơn: đòi thứ tự **giảm dần** trên toàn danh
  sách, và test **đã làm** (`ok priority giảm dần`).
- *edge 2*: hai bài **cùng** `priority` → thứ tự nào? Không AC nào nói, và nó
  quyết định bài nào lên đầu trang chủ.

## 2.2 · File lưu trữ không lên web

**AC-2.2.1** — file khớp `*.v[0-9]*.md` không có trong output
- *happy*: kho có `x.md` + `x.v1.md` → output có `x`, không `x.v1`.
- *edge*: `x.v1.md` là bản **duy nhất** → output rỗng cho slug đó, không lấy bản
  cũ cho đỡ trống.
- *edge 2*: một slug thật chứa `.v2` giữa tên (`nginx.v2.config`) → **không** bị
  lọc oan.
- *edge 3*: bản lưu trữ giờ ở **bảng `article_versions`**, không chỉ ở file
  (FR-034). Nên phép thử phải đo **output của đường render**, không đo tên file
  trong `kb/`. `§4` khai riêng dòng *"không render bản lưu trữ như bài hiện
  hành"* — cùng luật, hai chỗ nói.

⚠️ **Lệnh của AC này trỏ một file KHÔNG TỒN TẠI** — `web/test/no-archived.test.js`
vắng (đo 2026-09-03). Theo `R3` nó **là `soft`**. Xem `§cuối` mục 1.

## 2.3 · Bốn màn + cửa sổ đọc

**AC-2.3.9a** (dòng 93 — *vòng đời bài*) — tạo → sửa → duyệt → sửa → duyệt lại
liền mạch
- *happy*: `vong-doi-bai.test.js` xanh.
- *edge*: sửa khi đang `approved` → tự chuyển `edited`, và UI **hiện** trạng thái
  mới, không giữ nhãn cũ.
- *edge 2*: bốn nút biên tập đều bắt đầu bằng `docChiTiet` → nếu nó trả `null`
  (đường API sai), **cả bốn chết im lặng**. Đã xảy ra thật, và
  `duong-api-khop-route.test.js` sinh ra từ đúng bug đó. Phép thử vòng đời gọi
  API bằng đường **tự gõ đúng**, nên nó **không** bắt được ca này — hai test, hai
  mặt của một lỗi.

**AC-2.3.10a** (dòng 101 — *CRUD danh mục*) — bốn đường POST · GET · PATCH · DELETE
- *happy*: `danh-muc-crud.test.js` xanh.
- *edge*: DELETE một nhãn **đang được dùng** → phải chặn hoặc đòi `?force=1`, và
  nếu ép xoá thì trả về **danh sách bài giờ trỏ hụt** — không xoá im lặng.
- *edge 2*: PATCH đổi tên nhãn → mọi bài dùng nhãn đó phải đi theo, hoặc phép đổi
  tên bị chặn. Một nhãn đổi tên mà bài không đi theo là bài trỏ hụt hàng loạt.

**AC-2.3.1** — mọi flow P0 click được trên sample data
- *happy*: người chốt trên bản build thật.
- *edge*: `body.api-co .api-only{display:block}` (0,2,1) **thắng**
  `[hidden]{display:none}` (0,1,0) ⇒ `#f-bai` và `#tv-meta` **luôn hiện** khi API
  chạy. Đo trên trình duyệt: `hidden=true` mà `display:block`. Nút *"Mở form viết
  bài"* vô nghĩa; *"Ghi vào kho"* bấm được khi chưa nạp gì.
  ⚠️ Đây là ca `soft` mà **đo được bằng máy** (độ đặc hiệu CSS là số học), và
  bình luận `prototype.css:1319-1321` khai *đã chữa* — **nó chưa chữa**.

**AC-2.3.2** — bundle tĩnh không có đường ghi ngoài whitelist literal đóng
- *happy*: `no-write-path.test.js` xanh.
- *edge*: `fetch(base + path, {method:"POST"})` — đường **ghép chuỗi** → whitelist
  **literal** không thấy. Giới hạn có chủ ý, và nó phải được khai; một cổng khai
  *"đóng"* mà chỉ đóng với literal là cổng **nói quá**.

**AC-2.3.3** — mọi trạng thái mà `BANG_CHUYEN` cho `→ approved` đều có nút + đủ 3
trường M1
- *happy*: `bon-trang-thai.test.js` xanh.
- *edge*: thêm một trạng thái mới vào `BANG_CHUYEN` mà quên nút → phải đỏ. Phép
  thử phải **dẫn xuất** danh sách trạng thái từ `BANG_CHUYEN`, không gõ tay bốn
  cái — nếu gõ tay thì thêm trạng thái thứ năm vẫn xanh.

**AC-2.3.4** — gộp không để lại đường chết (`v-queue`, `data-nav="queue"`)
- *happy*: `cac-man-con-lai.test.js` xanh.
- *edge*: một `data-nav` còn trong CSS mà không còn trong HTML → CSS chết, vô
  hại. Một `data-nav` còn trong HTML mà không có view → **nút bấm không làm gì**.
  Hai chiều rất khác nhau; AC nói *"đường chết"* không phân biệt.

**AC-2.3.5** — `/cho-duyet/` không gãy, cả real và mock
- *happy*: `url-va-tuong-tac.test.js` xanh.
- *edge*: `/cho-duyet` (không dấu `/` cuối) → cũng không gãy? Spec không nói.
- *edge 2*: `/tat-ca/` phải giữ (plan `S2`: `four-screens.test.js:107-109` vòng
  qua **toàn bộ** `contract.analyses` và đòi mọi `title` có mặt trên view
  `tat-ca`) ⇒ đổi tên view đó làm test đỏ **N lần**. Không AC nào khai ràng buộc
  này, và nó là ràng buộc **cứng nhất** của tầng màn.

**AC-2.3.6** — trang chuyển hướng `/cho-duyet/` **không** nạp CSS/JS và ≤ 1 KB
- *happy*: `css-applied.test.js` xanh.
- *edge*: 1024 byte đúng bằng trần → `>` hay `>=`? Một trang chuyển hướng gần
  trần là chỗ thêm một dòng `<meta>` làm đỏ.
- *edge 2*: trang đó **không** nạp CSS ⇒ nó hiện **không style** trong khoảnh
  khắc chuyển. Đó là chủ ý (nhanh hơn), và nó phải được khai để không ai "sửa".

**AC-2.3.7** — trên **mọi trang đã build**: `.mid` đóng đúng (đếm thẻ)
- *happy*: xanh.
- *edge*: đếm **thẻ**, không regex — một `</div>` trong chuỗi JS hoặc trong chú
  thích làm phép đếm regex lệch. ⚠️ Lớp lỗi này trúng phiên này **sáu lần**.
- *edge 2*: *"mọi trang đã build"* — nếu một màn mới không có trong
  `web/test/_render.mjs VIEWS` thì nó **vô hình** với phép thử này và 6 test khác
  (plan `S4`). AC nói *"mọi"*; phạm vi thật là danh sách `VIEWS`.

**AC-2.3.8** — cửa sổ đọc: thanh tiến độ đo `.bk-b` · rAF throttle · gỡ listener
- *happy*: `cua-so-doc.test.js` xanh.
- *edge*: `cur` (chỉ số **BẢN**) không được lẫn `muc` (chỉ số **MỤC H2**). Bug đã
  đo: `dongBo()` chạy mỗi lần **cuộn** và ghi đè `cur` bằng chỉ số mục ⇒ cuộn tới
  mục 3 ⇒ `bans[2]` rỗng ⇒ bốn nút biên tập `return` **im lặng**. Và bài một bản
  + đứng ở mục 1 thì hai nghĩa **TRÙNG** ⇒ mọi phép thử tay xanh.
- *edge 2*: không khoá nút theo **vị trí** trong `.bk-f` — `f[0]` là nút *Loại*,
  nên `f[0].disabled = (muc===0)` khoá **đúng nút người dùng cần**.
- *edge 3*: gỡ listener sau 10 lần điều hướng → `no-leak.test.js`. Hai AC
  (`2.3.8` và `2.5.2`) cùng đo một thứ bằng hai lệnh khác nhau.

**AC-2.3.9b** (dòng 156 — *biểu đồ không gõ tay tập giá trị*) 
- *happy*: `bon-trang-thai.test.js` xanh.
- *edge*: biểu đồ vẽ 4 nhóm trạng thái đọc từ `BANG_CHUYEN`; thêm trạng thái thứ
  năm → biểu đồ có 5 nhóm **không sửa mã**. Nếu tập gõ tay thì trạng thái mới
  **biến mất khỏi biểu đồ im lặng**, và mọi test cũ xanh.
- *edge 2*: một nhóm có **0** bản ghi → hiện cột 0, hay ẩn cột? Ẩn thì người đọc
  tưởng trạng thái đó không tồn tại.

**AC-2.3.10b** (dòng 162 — *màn Danh mục: một thực thể một hình dạng*)
- *happy*: `man-danh-muc.test.js` xanh.
- *edge*: nhãn **đang dùng** và nhãn **chưa dùng** phải cùng một hình dạng thẻ —
  khác hình dạng nghĩa là hai thực thể, và người dùng học hai lần.
- *edge 2*: ⚠️ **màn Kho khai loại bằng hình dạng THỨ BA**: `v-kho` có **0**
  `data-loai` và **0** `tg` trên 8476 byte — nó khai qua nhãn cột `.bl` của biểu
  đồ *"Theo loại nguồn"* (plan `S22`). Một cổng chỉ đọc `data-loai` báo *"Kho
  trộn 0 nhóm"* ⇒ **sửa PHÉP ĐO, không sửa màn**.

**AC-2.3.11** — số hàng `#cb` khớp số nhãn đếm được, hàng sắp đúng
- *happy*: `filter-counts.test.js` xanh.
- *edge*: `#acount` — SSR trả **16** (đúng, khớp DB/API/`#tcount`), FE ghi đè
  thành **20**: `locThe` đếm `.cd:not(.off)` **toàn trang** (`#grid` 4 + `#grid2`
  16) thay vì trong **đúng lưới** mà nhãn nói về. Bug đã đo trên trình duyệt.
  ⇒ Phép đếm phải cắt theo **lưới**, không theo **trang** — và ba phép đo khác đã
  lấy sai phạm vi vì đúng chuyện này (plan `S20`).

**AC-2.3.12** — đường `/api/articles/…` mà **bundle đã build** dựng phải khớp route
đọc **từ** `router.mjs`
- *happy*: `duong-api-khop-route.test.js` xanh.
- *edge*: FE gọi `/api/articles/<slug>` trong khi route là
  `/api/articles/<type>/<slug>` ⇒ **bốn nút biên tập chết im lặng**. 41 test
  xanh lúc đó, vì `vong-doi-bai` gọi API bằng đường **tự gõ đúng** — **không ai
  hỏi FE dựng đường nào**. Đây là bản một-mặt của lớp lỗi song sinh.
- *edge 2*: route đọc **từ `router.mjs`**, không gõ tay hình dạng ⇒ đổi route thì
  test đi theo.

**AC-2.3.13** — danh mục RỖNG là trạng thái hợp lệ
- *happy*: `danh-muc-phan-trang-ep-xoa.test.js` xanh.
- *edge*: `GET /api/concepts` trên kho rỗng → **200 + `[]`**, không 404, không
  500. Kho mới tinh là trạng thái hợp lệ.
- *edge 2*: ⚠️ **mặc định KHÔNG cắt** — `/nap/` vẽ một checkbox mỗi nhãn, nên
  cắt mặc định là **lặng lẽ mất nhãn**. Đây là ca mà một *"tối ưu"* hợp lý (phân
  trang mặc định) phá một tính năng.
- *edge 3*: danh mục rỗng vs **tải thất bại** → hai trạng thái, phải hai thông
  điệp. Bài học commit `0035fa3` (*danh mục kẹt "đang tải…"*), và cùng ca với M10
  `AC-2.3.1 edge 2` · M11 `AC-2.3.2 edge 2`.

## 2.3b · Lối nạp THỨ TƯ + xem trước hiện vật

**AC-2.3b.1** — lối thứ tư có ở **CẢ HAI** `shell.html` (byte-identical) + có nhánh
- *happy*: `thu-vien-nap.test.js` xanh.
- *edge*: sửa **một** `shell.html` quên cái kia → đỏ. Hai file byte-identical; một
  phép thử đọc một file xanh trên trạng thái lệch.
- *edge 2*: `file.size` kiểm **TRƯỚC** `fetch` — `413` không tới được client giữa
  lúc upload (ECONNRESET).

**AC-2.3b.2** — `src` video từ hằng whitelist + id khớp `id_mau`
- *happy*: `media-cua-so.test.js` xanh.
- *edge*: `fm.url` chứa `javascript:` → **không** vào `src` (nó không bao giờ
  vào `src`).
- *edge 2*: host trong whitelist nhưng id **không** khớp `id_mau` → không dựng
  `src`. Hai cổng; phép thử phải nói cổng nào chặn.

## 2.3c · Dashboard tổng hợp All — HAI NỀN

**AC-2.3c.1** — gieo thêm 4 bản thư viện: **không pane chất lượng nào đổi số**
- *happy*: `thu-vien-tong-hop.test.js` xanh.
- *edge*: gieo **50** bản thư viện → vẫn không đổi. Với 4 bản một cài đặt sai chỉ
  lệch chút; 4 là số nhỏ nhất mà lỗi làm-phẳng còn ẩn được.
- *edge 2*: **0** bản phân tích + 4 thư viện → pane chất lượng hiện **trạng thái
  rỗng**, không `0%` như thể đã đo.
- *edge 3*: mỗi pane **khai rõ nền của nó** (`trang.mjs:699`) → đọc markup, có
  nhãn nói nền là `phan-tich`.

## 2.4 · FR-027 — hệ "Kính trên ảnh"

**AC-2.4.1** — bốn thứ của kính đủ cả bốn trên `.pn`; số lớp `backdrop-filter` có trần
- *happy*: `he-kinh.test.js` xanh.
- *edge*: thêm một lớp `backdrop-filter` thứ N+1 → đỏ. Trần này là **hiệu năng**,
  và nó phải đỏ được, không thì nó là chú thích.
- *edge 2*: `backdrop-filter` chưa test Safari/Firefox (`§5` khai nợ) ⇒ AC xanh
  trên một trình duyệt không chứng minh gì về hai cái kia.

**AC-2.4.2** — rail đọc `var(--rail-w)`, `.wrap` bù bằng **cùng** token, icon ở CSS
- *happy*: `rail-trai.test.js` xanh.
- *edge*: ⚠️ `data-nav` **phải thuần `[a-z]`, KHÔNG gạch nối** — hai regex
  (`:137`, `:167`) bắt `data-nav="[a-z]+"`. Tên `bai-viet`/`tai-lieu` **không
  khớp** ⇒ nhãn mới lặng lẽ **ra khỏi phép đo**, và `soTab >= 4` (`:172`) **tụt
  rồi đỏ** (plan `S1`).
- *edge 2*: thuộc tính **thứ ba** trên thẻ nút làm đứt một trong hai regex, **im
  lặng** ⇒ nhóm tab phải khai ở thẻ bao `.tbg`, không nhét vào `<button>`
  (plan `S21`).
- *edge 3*: mỗi tab mới cần một **icon CSS** riêng — `iconMask >= soTab` là ràng
  buộc **cứng**, không phải trang trí.

**AC-2.4.3** — trang chủ đúng cách trình bày đã chốt
- *happy*: `trang-chu-layout.test.js` xanh.
- *edge*: ⚠️ `:200` cắt `slice(indexOf('v-home'), indexOf('v-all'))` ⇒ **không
  được chèn view mới giữa `v-home` và `v-all`** (7 phép `=== 3/9/4` sẽ sai). Và
  `catNap()` (`trang.mjs:247`) cắt từ `id="v-nap"` tới `</main>` ⇒ **không được
  đặt sau `v-nap`**. Khe hợp lệ **đúng một**: sau `v-all`, trước `v-nap`
  (plan `S3`).
- *edge 2*: `cac-man-con-lai:117` cắt theo `id="v-nap"`, và thứ phá nó là một
  **bình luận** chứa literal đó (plan `S20`).

**AC-2.4.4** — màn ngoài Trang chủ đồng bộ thang (mọi giá trị ≥8px, bội của thang)
- *happy*: `cac-man-con-lai.test.js` xanh.
- *edge*: `chu-giao-dien.test.js:196` — tổng chữ phụ trợ **≤ 480 ký tự/trang**, và
  vì **mọi màn ở cùng tài liệu** nên chữ của một màn mới **cộng dồn vào từng
  trang**. Thêm màn là tiêu ngân sách chữ của mọi trang.

## 2.5 · Multi-window + pipeline render

**AC-2.5.1** — mở 2 cửa sổ, điều hướng, cả hai còn nguyên
- *happy*: người chốt.
- *edge*: một màn **không có trong DOM** → nhánh
  `multiwindow.inline.ts:1414-1420` xử lý; cắt màn khỏi shell (`catNap()`) phải
  mở rộng đúng đó.

**AC-2.5.2** — không listener nào rò sau 10 lần điều hướng
- *happy*: `no-leak.test.js` xanh.
- *edge*: mọi `setInterval` có đường **dừng**; mọi hàm vẽ có chốt `if (reduced)`
  đọc từ **MÃ đã bỏ comment** — phép kiểm từng khớp chữ trong **COMMENT**, nên gỡ
  chốt thật vẫn xanh (bài học `kho-hinh-dang`).

## 2.6 · Token là nguồn duy nhất

**AC-2.6.1** — không giá trị px nào cho `font-size`/spacing ngoài `tokens.css`
- *happy*: `token-only.test.js` xanh.
- *edge*: `prototype.css` được **miễn** (`test/WORKLOG.md`) ⇒ AC nói *"không giá
  trị px nào"*, phạm vi thật có một ngoại lệ. Ngoại lệ được khai ở WORKLOG, không
  ở AC.
- *edge 2*: `1px` cho border → có bị chặn? AC nói `font-size`/spacing, nên không.
  Phép thử phải chỉ áp cho hai họa tính đó, không mọi px.

## 3 · Công thức — gộp

- *happy*: 13 bản ghi `approved` → 8 bài, 1 nhóm gộp (đo được).
- *edge*: **thứ tự bắt buộc** *lọc `approved` trước, gộp sau*. Đảo lại: một bản
  `draft` kéo bản `approved` cùng nguồn lên site. Cả hai thứ tự cho ra một danh
  sách **trông đúng** ⇒ phép thử phải gieo đúng ca đó: một nguồn có 1 `approved`
  + 1 `draft`, rồi đòi nhóm có **1** tab.
- *edge 2*: sắp giảm dần theo `max(priority trong nhóm)` — không phải theo
  `priority` của bản đầu nhóm. Một nhóm có `[10, 65]` phải xếp như 65.
- *edge 3*: nhóm mà **mọi** bản có `priority` null → xếp đâu?

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *FE/render ghi vào kho*: `no-write-path.test.js` (và giới hạn literal của nó).
- *render markdown không qua `md()`*: quét → 0 chỗ dựng thẻ trước khi escape.
  markdown là **untrusted input**.
- *deploy công khai*: `analytics: null`, bind `127.0.0.1`, `no-leak.test.js`.
- *gõ lại giá trị token*: `AC-2.6.1`.
- *render bản lưu trữ như bài hiện hành*: `AC-2.2.1` — ⚠️ **lệnh của nó không tồn
  tại**.

## Kết quả PHÉP THỬ s6 — năm phát hiện

**1 · `AC-2.2.1` khai `hard` mà LỆNH TRỎ MỘT FILE KHÔNG TỒN TẠI — và cổng G6A
không bắt được.**

Đo 2026-09-03: `web/test/no-archived.test.js` **vắng**. 21/22 lệnh khác của M03
xanh; đây là cái duy nhất không chạy được.

Theo `R3` nguyên văn: *"`hard` mà không có lệnh chạy được ⇒ nó là `soft`"*. Nên
AC này **đang là `soft`** trong khi spec khai `hard` — và spec đã frozen.

Nguyên nhân cổng không bắt, đo tại `core/tests/check_g6a.py:76`:

```python
elif h and not re.search(r"cmd:|cùng lệnh", blk):
    loi.append(f"{ac}: hard nhưng KHÔNG có cmd — theo R3 nó là soft")
```

Cổng tìm **chuỗi** `cmd:`. `R3` đòi **lệnh chạy được**. Hai mặt khác nhau của
cùng một cái tên — và cổng đo mặt dễ hơn.

⚠️ Đây **chính xác** là lớp lỗi tôi tự mắc ở `FR-051 §9`: đo sự **tồn tại** của
một chỗ nghẽn thay vì đo có gì **đi qua** nó. Và nó nghiêm trọng hơn ở đây, vì
`check_g6a` là **điều kiện đóng G6A** cho cả 18 module. Một cổng đo *"AC có viết
chữ cmd không"* thay vì *"lệnh có chạy không"* để lọt đúng thứ `R3` sinh ra để
chặn.

Cộng: `cùng lệnh` cũng thoả phép tìm đó. Một AC viết *"`hard` · cùng lệnh"* mà
lệnh nó trỏ tới đã hỏng thì **hai** AC im lặng cùng lúc.

**Đề xuất cần chủ dự án duyệt**: thêm vào `check_g6a` một vế **giải lệnh ra file
và kiểm tồn tại** (không cần chạy — chạy 22 lệnh trong một cổng là quá đắt).
Dạng tối thiểu: rút đường dẫn sau `cmd:`, `Path(...).exists()`.

**2 · BỐN AC dùng HAI id — `AC-2.3.9` và `AC-2.3.10` mỗi cái xuất hiện hai lần.**
Dòng 93 (*vòng đời bài*) và dòng 156 (*biểu đồ không gõ tay*) đều là `AC-2.3.9`;
dòng 101 (*CRUD danh mục*) và dòng 162 (*màn Danh mục*) đều là `AC-2.3.10`.

`check_g6a` lặp theo **khối** (không dict) nên cả bốn **đều được kiểm** — không có
bug ghi đè như `check_g6b S24`. Nhưng hệ quả thật vẫn nặng: một tham chiếu
*"AC-2.3.9"* trong task file, worklog, hay PR **không phân giải được**. Và `R3`
đòi *"vi phạm chỉ ra được bằng một câu trỏ vào vật thể"* — một id trùng làm câu
đó bất khả.

Trong file này tôi đặt tên `2.3.9a`/`2.3.9b`/`2.3.10a`/`2.3.10b` để viết được
testcase. Đó là **giải pháp tạm của tôi**, không phải quyết định — spec phải đánh
lại số.

**3 · `§5` khai *"9 bài lên site từ 13"*, `AC-2.1.2` khai *"8 bài từ 13"*.**
Test khẳng định **8** (`pass · 8 bài, 1 nhóm gộp`), và nó đọc số từ
`mong.articles_on_site` của contract — **không** gõ tay. Nên: **AC đúng, `§5`
sai, và test đúng vì nó không tin con số nào trong tài liệu.**

Cùng `§5` còn khai *"7 test node"* — thực tế `web/test/` có **85** file.
Con số **thứ tám** cùng lớp *tự khai*, trong **tám** module liền (M01 · M02 ·
M04 · M05 · M06 · M07 · M08 · M03). Xem ô tổng ở `M07_curate/backlog.md`.

**4 · `§2.7` là một mục ĐÃ HẾT HẠN HOÀN TOÀN.** Nó viết:

> *"`web/` chưa tồn tại. Mọi `cmd: node web/test/*.js` là **lệnh sẽ có**, không
> phải lệnh đang có."*

Đo được: `web/test/` có **85** file, **21/22** lệnh của M03 xanh. Mục này còn đặt
ra *"Điều kiện G6C: lệnh chạy thật, exit 0. Chưa chạy được ⇒ AC tụt `soft` ⇒
DRAFT + người chốt"* — một thủ tục cho một tình trạng **không còn**.

Và trớ trêu: thủ tục đó **chính là** thứ cần cho phát hiện 1. `§2.7` viết đúng
luật, cho đúng ca, rồi hết hạn trước khi ca đó xảy ra thật.

**5 · Ba AC `soft` mà có vế ĐO ĐƯỢC bằng máy:**
- **`AC-2.3.1`** khai `soft` (*"click là thao tác người"*). Nhưng
  `body.api-co .api-only{display:block}` (0,2,1) **thắng** `[hidden]{display:none}`
  (0,1,0) là **số học độ đặc hiệu CSS** — đo được. Hệ quả nhìn thấy được: `#f-bai`
  và `#tv-meta` **luôn hiện** khi API chạy; nút *"Ghi vào kho"* bấm được khi chưa
  nạp gì. Bình luận `prototype.css:1319-1321` khai **đã chữa** — nó chưa chữa.
- **`AC-2.1.1`** gộp hai câu: *"bộ lọc hiện có còn đúng"* (có
  `only-approved.test.js` — `hard`) và *"đường render **mới** cũng lọc"* (`soft`).
  Nhãn `soft` phủ lên cả hai làm vế thứ nhất mất cổng trên giấy.
- **`AC-2.5.1`** — vế *"màn không có trong DOM"*
  (`multiwindow.inline.ts:1414-1420`) đo được bằng máy; vế *"cảm nhận cả hai còn
  nguyên"* thì không.

⇒ Cả năm vào `backlog.md`. Mục **1** là **đề xuất sửa CỔNG**, không phải nợ tài
liệu — và nó ảnh hưởng cả 18 module.
