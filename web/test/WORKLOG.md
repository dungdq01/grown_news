# `web/test/` — 78 test, và lỗi mỗi cái sinh ra để chặn

> Chạy hết: `npm test`. Từng cái: `node test/<tên>.test.js`
>
> Mỗi test dưới đây ra đời **sau** một lỗi thật. File này ghi lỗi đó — vì test
> không có ngữ cảnh thì lần sau người ta sửa test cho xanh thay vì sửa code.

---

## 85 test

| Test | Chặn gì | Sinh ra sau lỗi nào |
|---|---|---|
| `only-approved` | M03-R1 — chỉ `approved` lên site | (viết cùng lúc với filter) |
| `expected-render` | M03-R5 — gộp + sắp theo `priority` | (viết cùng lúc với emitter) |
| `css-applied` | CSS đến được trang | trang ra **HTML thô**, build vẫn exit 0 |
| `script-runs` | script **chạy được** | trang chủ **trắng trơn** dù HTML đủ nội dung |
| `buttons` | mọi nút có mã xử lý | 10 nút `data-nav` **không ai nghe** |
| `four-screens` | 4 màn + a11y | (viết cùng lúc với emitter) |
| `no-leak` | không rò listener qua SPA | listener `nav` gắn mà không gỡ |
| `no-write-path` | M03-R2 — không đường ghi `kb/` | (phòng ngừa) |
| `token-only` | M03-R4 — không gõ tay token | (phòng ngừa) |
| `no-dangerous-html` | M03-R3 — sanitize + không analytics | (phòng ngừa) |
| `real-vs-mock` | hai bản đọc nguồn khác nhau | REAL và MOCK **trùng data** |
| `filter-counts` | số đếm khớp số thẻ · parser đọc được mảng | số hiển thị **không khớp** dữ liệu |
| `url-va-tuong-tac` | URL ghi khi đổi màn · mọi điều khiển có mã | ô tìm và thẻ concept là **trang trí** |
| `kho-tach-rieng` | `kb/` và `kb-mock/` tách hẳn | mock **mượn hợp đồng G5** làm nguồn |
| `page-weight` | trang nhẹ · màn Tất cả phân trang | 500 bản ghi ⇒ **1.2 MB** một trang |
| `markup-matches-css` | mọi class shell có luật CSS · điểm neo duy nhất | panel ra **rỗng** vì neo cắt sai |
| `open-card` | bấm thẻ mở được bài ở cả hai bản | thẻ có `data-open` mà chỉ mục **trỏ kho khác** |
| `danh-muc-them` | thêm nhãn qua API — chỉ-thêm, có bằng chứng, rollback khi cổng đỏ | (răng FR-019) |
| `nhan-dai-khong-tran` | nhãn dài không tràn khỏi ô chứa | (răng FR-021) |
| `man-danh-muc` | màn Danh mục: popup thay `prompt()`, control có mã xử lý | (răng FR-021) |
| `opacity-khong-pha-contrast` | hạ opacity làm hỏng tỉ lệ tương phản đã audit | (răng FR-021) |
| `motion-polish` | hiệu ứng FR-013/FR-014 đến trang, 3 bẫy chặn | (viết cùng đợt hiệu ứng) |
| `api-crud` | M08 — vòng CRUD đủ + ca âm trên kho tạm | (răng FR-011, viết trước code chạy) |
| `api-status` | M08-R3 — approve đòi 3 trường M1, bảng chuyển đóng | (răng FR-011) |
| `api-recycle` | M08-R4 — xoá là recycle byte-equal, restore an toàn | (răng FR-011) |
| `api-guard` | M08-R1/R2 — quét tĩnh `web/api/`: ghi chỉ sau validate, không listen/unlink/default | (răng FR-011) |
| `canh-bao-khong-chan-ghi` | cảnh báo của `validate.py` **không** được chặn ghi | `--strict` coi warning là exit 1 ⇒ API từ chối bài hợp lệ |
| `api-index-khong-can-build` | API đọc được kho **không cần** build trước | index dẫn xuất thiếu ⇒ 500 trên kho sạch |
| `hai-duong-doc-khop` | RETIRED — FR-034 chỉ còn một đường đọc (DB); răng thay: `check_export_dan_xuat.py` | index thiếu bản mà API vẫn trả 200 với dữ liệu cũ (bối cảnh cũ) |
| `ssr-routes` | FR-034/T03-8 — 5 màn + /mock/ + deep-link `/:type/:slug` render lúc request; kho 0 bài không màn trắng; GN_SSR=0 rơi về hành vi cũ | trang từng là bản build đóng băng — bài mới ghi không hiện cho tới khi build lại |
| `luong-day-du` | vòng upload → duyệt → sửa → xoá → phục hồi, đủ vòng | các flow chỉ từng được kiểm rời từng khúc |
| `luong-nap-bai` | nạp bài qua cổng: file đã vào kho **không** bị ghi đè | `gate.py` **âm thầm ghi đè** bài trong kho — chứng minh bằng thí nghiệm: sửa `one_liner` trên web, chạy gate, bản sửa **biến mất** |
| `bon-trang-thai` | 4 trạng thái đủ 4 dấu hiệu · ma trận đọc **từ** `status.mjs` | `st-edited` không có luật CSS nào nên trông y hệt `approved` dù bài đã rời site |
| `tieu-de-khong-nhan-doi` | tiêu đề không xuất hiện hai lần trên một màn | (răng FR-022) |
| `he-kinh` | 4 tầng kính đủ · số lớp `backdrop-filter` trong ngưỡng · mọi blur dùng token | 9 lớp `backdrop-filter` khi `ui_guide §6a` nói thẻ nhỏ dùng `--pns`, **không** blur |
| `rail-trai` | rail đúng 78px · `.wrap` bù đúng con số đó · icon ở CSS · cả 6 màn cùng khung | logo bị cắt còn "Grov" (nhồi 10 ký tự vào 40px) · nhãn HOA xuống dòng trong cột 54px |
| `trang-chu-layout` | Trang chủ đúng cách trình bày đã chốt · **ba quirk** của bản tham khảo không lọt vào · mọi vòng đủ ba chốt | ba lượt tôi **sơn lại bố cục cũ** thay vì dựng lại — xem FR-027e |
| `cac-man-con-lai` | 5 màn còn lại: thang chữ/hằng số bố cục đi qua token · dải "máy đã làm gì" KHÔNG còn câu văn nào (FR-029) · khối 3D chỉ ở nơi có PHÂN BỐ, chiều sâu ở nơi có TRÌNH TỰ | 9 luật `font-size` gõ px và 59 giá trị ≥8px nằm im trong `prototype.css` vì `token-only` miễn **cả file** — file đã 2046 dòng, tức M03-R4 không có răng trên file CSS lớn nhất dự án |
| `chu-giao-dien` | chữ HIỆN RA trên 15 trang đã build không chứa đường dẫn kho · tên file nội bộ · mã module/rule/FR · tên trường dữ liệu · tên công cụ · đếm bước kỹ thuật. Ba miễn trừ có canh riêng: tooltip ≤220 ký tự, khối lệnh copy phải CÒN, comment không tính | người dùng chỉ vào 4 chỗ (`03 bản ghi trong kb/`, `origin: manual`, `9 cổng validate`, `sẽ ghi vào kb/article/<slug>.md`) và nói *"thiếu chuyên nghiệp quá"*. Sửa tay một lượt thì lần sau lại có câu mới — nên quy ước phải thành cổng. Mục 2 của nó tôi viết SAI ba lần, xem FR-029 §Nợ |
| `cua-so-doc` | cửa sổ đọc: thanh tiến độ (rAF throttle · gỡ listener · reduced-motion CHỈ bỏ transition) · cột neo mang metadata · mục 6 Tinh túy đọc ra khác (số bằng CSS counter) · và **canh cả phần đã đúng** (lưới bất đối xứng, mục lục dính, 4 thứ của kính, độ dài dòng) | `REDESIGN-PLAN §3.2` nợ ba thứ từ v1; và bốn lượt tôi tự sai vì `cuoi()` lấy luật CUỐI trong khi câu hỏi là "có khai ở đâu đó không" — nay có `gop()` |
| `danh-muc-crud` | CRUD danh mục chạy THẬT cả bốn đường (POST·GET·PATCH·DELETE) cho **cả hai** loại nhãn, trên kho tạm + schema tạm; xoá lần hai phải 404; PUT vẫn đóng | `danh-muc-them` tự khai *"nhánh POST/DELETE categories KHÔNG có test đường-thành-công"* — tức "có mã" mà chưa ai chạy thử. Người dùng hỏi thẳng *"CRUD catalog hoạt động hay không?"* |
| `vong-doi-bai` | vòng đời MỘT bài đi liền mạch: tạo → sửa → duyệt → sửa lại (⇒ edited) → duyệt lại → loại (từ draft) → chuyển ra thùng rác → chuyển về kho, byte-equal. Mỗi bước kiểm CẢ mã trả về VÀ trạng thái trên đĩa | bốn file api-* phủ ca biên rất tốt nhưng không file nào đi trọn một vòng đời. Ca biên xanh không chứng minh vòng đời chạy — đúng lớp lỗ đã tìm ra ở `categories` |
| `cai-dat` | T08-17 `M18 §10` + `ADR-07` tầng **thứ ba** (giá trị ô ở DB, `chu` đổi được qua web) — `O_SUA_DUOC` là **allowlist RIÊNG**, không phải `QUYEN`: `QUYEN` nói *"việc này vai nào làm được"*, `O_SUA_DUOC` nói *"ô nào bật/tắt được từ web"* · `sua-cai-dat` **KHÔNG** trong allowlist (`chu` không tự khoá được) · `duyet-bai` vắng khỏi cả hai · cửa nhận `(khoa, gia_tri)` **không** nhận object · `gia_tri` boolean ở tầng DDL · gieo lại lúc mở DB **giữ** giá trị đã đổi có chủ ý | Ca mạnh nhất **không có trong `§10`** — tôi tìm ra nó lúc viết task file: nếu `duocLam` tra `cai_dat` **trước** rồi rơi về `QUYEN`, thì một hàng `cai_dat` **bịa** cho một `viec` ngoài allowlist sẽ **thắng** `QUYEN`. Tức tầng ba vượt tầng hai bằng một `INSERT`. `CVE-2026-17601`: một toggle mở mọi toggle · `CVE-2024-3028`: một trường setting ⇒ **xoá được file SQLite** |
| `phan-quyen` | FR-051 T08-16 — hai vai, **enum ĐÓNG** + `NOT NULL DEFAULT` vai ÍT quyền nhất · **DENY mặc định** (việc chưa khai ⇒ không ai làm được, kể cả chủ dự án) · **ĐÚNG MỘT** chỗ đọc `.vai` · `duyet-bai` **KHÔNG** có trong bảng quyền — `B-B1` ở MÃ không ở dữ liệu · đổi vai ghi audit | Cột `vai` từng là **cột trống** và `AC-6.1` cưỡng chế sự trống rỗng đó. `FR-051` cho nó tác dụng ⇒ AC cũ **phải đỏ**, và nó đỏ bằng cách NÉM vì `CHECK` mới từ chối giá trị bịa nó gieo. **Sửa AC, không xoá cổng** — xoá một cổng vì nó đỏ là cách một luật biến mất mà không ai quyết định gỡ |
| `rate-limit` | FR-049 T08-15 — chặn dò **hai chiều**: theo IP (một máy thử nhiều mã) và theo **mã** (nhiều IP thử một mã, mỗi lần một IP nên chiều IP không bắt được) · **đổi ngưỡng trong bảng khai ⇒ điểm chặn DỜI THEO** · entropy `randomBytes(n≥16)` và **không** `Math.random` · vượt ngưỡng ghi audit mà **không kèm mã** · `POST /api/articles` **không** bị đếm | `ma_moi` một-lần + hết-hạn chặn *dùng lại* và *dùng muộn*, KHÔNG chặn thử hàng nghìn lần trong cửa sổ còn hiệu lực — và đoán được mã là **thành người khác trong kho**. Entropy vốn đã đúng 256 bit nhưng **0 cổng canh**: đổi `randomBytes(32)` → `Math.random()` thì mọi test cũ vẫn xanh |
| `loi-cua-http` | FR-047 T08-14b — bảy cửa đo trên **SERVER THẬT**: 7/7 trả 401 khi thiếu khoá · khoá session và `aud` sai đều 401 · `C1` không đường nào trả `approved` · `C3` hai ca giống hệt từng byte · `C6` 404 thân rỗng · và `POST /api/articles` **vẫn sống**, không bị cổng khoá-dịch-vụ nuốt | `loi-cua.test.js` đo `V1` bằng **regex trên mã nguồn handler**, mà luật bằng chứng của dự án nói thẳng *"unit test pass KHÔNG tính — hệ thống chạy thật mới tính"*. Regex đó xanh kể cả khi route chưa đấu, kể cả khi `quaCong` chặn mất request trước khi tới dòng đó |
| `loi-cua` | FR-047 T08-12 — năm cửa tài khoản `C3`–`C7` giữ đủ `V2`–`V8`: danh tính do LÕI gán (payload bịa bị lột) · `ma_moi` một lần + hết hạn, `dung_luc` không ghi đè lần hai · C3 trả **giống hệt** cho `chat_id` lạ và `chat_id` chưa buộc · C6 không trả `ngu_canh` · thu hồi ⇒ phiên chết ở lần dùng kế mà hàng `nguoi_dung` vẫn còn · audit không có hàm sửa/xoá và không chứa mã đã thử · `ban_goc_ai` bất biến · khoá dịch vụ khác khoá session và `aud` được kiểm | `CVE-2026-47713` fail-open, `CVE-2025-41258` dùng chung secret (CVSS 8.0), `CVE-2026-44560` *"revocation is ineffective"*. Ba CVE, ba hình dạng lỗi khác nhau, và cả ba đều nằm ở đường TRUY HỒI chứ không ở prompt |
| `kho-hinh-dang` | FR-041 — màn Kho mỗi HÌNH DẠNG xuất hiện đúng một lần (lượt 2: donut · lưới ô · bar phân loại · vòng đời · đường vùng tháng · cột dọc ngày · 3D; bậc thang tin cậy + thanh chia đoạn origin ĐÃ RỜI theo chỉ đạo bốn-tổng-hợp); mọi hàm vẽ mới có chốt `if (reduced)` đọc từ MÃ đã bỏ comment; mọi setInterval có đường dừng; SVG không hex | FR-031 tự đề "ba góc nhìn ba HÌNH DẠNG" mà không cổng nào canh ⇒ mòn thành bar ×3 + thanh chia đoạn ×3. Người dùng: *"các biểu đồ đang cùng 1 form quá"*. Kiểm hai chiều còn bắt được chính tôi: phép kiểm chốt reduced khớp chữ trong COMMENT — gỡ chốt thật vẫn xanh |
| `duong-api-khop-route` | mọi đường `/api/articles/…` mà **bundle đã build** dựng phải khớp một hình dạng route đọc TỪ `router.mjs`; và server thật xác nhận route đòi đoạn `type` (GET/PATCH/PUT/DELETE, đường thiếu `type` ⇒ 400/404) | FE gọi `/api/articles/<slug>` trong khi route là `/api/articles/<type>/<slug>` ⇒ **bốn nút biên tập chết im lặng** (`docChiTiet` là bước đầu của cả bốn, nó trả `null`). 41 test xanh: `vong-doi-bai` gọi API trực tiếp bằng đường tự gõ đúng, không ai hỏi *FE dựng đường nào*. Bản một-mặt của lớp lỗi song sinh |
| `nut-song` | mỗi `data-act` được vẽ có nhánh xử lý (và ngược lại); `cur` (chỉ số BẢN) không lẫn `muc` (chỉ số MỤC H2); không khoá nút theo VỊ TRÍ trong `.bk-f`; mọi file test đều nằm trong `npm test` | `cur` mang HAI nghĩa: `tai()` đặt chỉ số bản, `dongBo()` — chạy mỗi lần **cuộn** — ghi đè bằng chỉ số mục H2 (con số "03 / 09"). Cuộn tới mục 3 ⇒ `bans[2]` rỗng ⇒ bốn nút biên tập `return` im lặng. Bài một bản + đứng ở mục 1 thì hai nghĩa TRÙNG nhau ⇒ mọi phép thử tay xanh; bug chỉ hiện khi người ta thật sự đọc. Kèm bug hai: `.bk-f button` lấy theo vị trí, `f[0]` là nút **Loại** ⇒ `f[0].disabled = (muc===0)` khoá đúng nút người dùng cần. Và chính file này sinh ra NGOÀI chuỗi `npm test` — nên §5 canh luôn chuyện đó |
| `khung-8-o` | số Ô của form = số **mục LÁ** đọc từ `core/assets/khung-than-bai.json`; bundle mang tên mục + 5 dòng bullet (tức `__KHUNG__` đã nhúng); item tinh túy ở cấp `####`; mục nào đòi locator thì gợi ý của nó phải nhắc địa chỉ | Trước FR-036 con số 9 nằm ở NĂM chỗ — tên `id`, nhãn nút, hai mảng JS, và một literal trong `four-screens`. Đổi khung là sửa tay cả năm. Răng này ĐẾM THEO KHUNG nên lần đổi sau không ai phải sửa test. Hai bẫy đã trúng khi viết nó: esbuild escape chữ có dấu thành **cả** `\uXXXX` **và** `\xXX` (giải một dạng vẫn đỏ oan dạng kia), và `### ` là **chuỗi con** của `#### ` nên phép kiểm "không chứa ###" luôn đỏ oan |
| `danh-muc-phan-trang-ep-xoa` | `?limit`/`?offset` cho hai cửa danh mục — và **mặc định KHÔNG cắt** (`/nap/` vẽ một checkbox mỗi nhãn; cắt mặc định là lặng lẽ mất nhãn) · ép xoá `?force=1` trả về DANH SÁCH bài giờ trỏ hụt, và phép kiểm chứng minh hệ quả THẬT (bài đó PUT ⇒ 422) · khôi phục dưới tên khác giữ được CẢ HAI bản, `slug` trong frontmatter đổi theo tên file | ba đường API mới của FR-031. Mục ép xoá đứng CUỐI file: nó xoá một nhãn mà mọi bản ghi seed đều dùng, nên nó phá TIỀN ĐỀ của mọi phép kiểm sau |

## 4 test `api-*` — chạy server THẬT trên kho TẠM (FR-011)

Khuôn ở `_api.mjs`: dựng kho ở `os.tmpdir()` (bản ghi viết tay đủ 9 cổng —
contract v4 có 7 bản approved thiếu 3 trường M1 nên không seed thẳng được),
spawn `node server.mjs` với env `KB_DIR`/`RECYCLE_DIR`/`API_PORT`, đợi
`/api/health`. **Cổng do HĐH cấp** (`listen(0)` thăm dò) — máy này có server
cũ giữ 8787-8792, test giả định cổng cố định là đỏ vì môi trường.
KHÔNG test nào đụng `kb/`, `_recycle/`, `_inbox/` thật. Cuối `api-crud` chạy
`validate.py --strict` cả kho tạm: API không được để kho ở trạng thái cổng
không nhận.

---

## Ba test bắt "hỏng im lặng"

Đây là loại nguy hiểm nhất: **build xanh, exit 0, mọi test khác xanh — nhưng
trang không dùng được.**

### `css-applied` — CSS đến được trang

Quartz sinh CSS component thành file riêng **có hash**. Trang do emitter tự sinh
chỉ nạp `/index.css`, mà file đó **không chứa** CSS component.

Kết quả: 30KB CSS, không một dòng `.sky`. Trang ra HTML thô — không nền, không
kính, không lưới.

Test soi **bốn dấu vân tay** của thiết kế s5: `.sky` · `backdrop-filter` · `.pn`
· `.brk-g`. Mất một cái là mất một tầng.

### `script-runs` — script **chạy**, không chỉ có mặt

`css-applied` vẫn xanh khi trang trắng: nó chỉ kiểm script **có mặt**.

Lỗi thật: hai script nối nhau bằng `;`, cả hai khai `khoiDong`/`gan`/`khiNav` ở
cùng phạm vi ⇒ `SyntaxError` ⇒ **không dòng nào chạy**, kể cả phần hiện panel.
`.rise{opacity:0}` ẩn sẵn mọi panel ⇒ trang chủ trắng trơn dù HTML có đủ 4852 ký
tự nội dung.

Test chạy `node --check` trên script đã nhúng — đó là thứ bắt được lỗi khai trùng
tên. Cộng: mỗi script phải bọc IIFE riêng, phải có `IntersectionObserver`, phải
có phép kiểm panel đã trong khung nhìn.

### `buttons` — nút có người xử lý

Shell prototype dùng `onclick="nav('all')"` gọi hàm toàn cục. Tôi đổi sang
`data-nav="all"` cho hợp module scope — **nhưng không port hàm `nav()`**.

10 nút nằm đó không làm gì. Build xanh, test xanh, mắt nhìn thấy nút.

Test đếm từng thuộc tính điều khiển trong HTML rồi **đòi script có mã xử lý
tương ứng**.

---

## Kho tạm nằm NGOÀI repo

`_seed.mjs` sinh kho từ `analyses.sample.v3.json` vào **thư mục tạm của hệ điều
hành**, không phải `web/test/`.

Lý do: Quartz bật `gitignore: true` (`glob.ts:18`), nên mọi thư mục bị
`.gitignore` **biến mất khỏi input** — `Found 0 input files` dù đĩa có 14 file.
Mà kho tạm thì *bắt buộc* phải ignore vì sinh lại mỗi lần chạy.

Hai ràng buộc chỏi nhau ⇒ đặt ra ngoài repo.

> `_seed.mjs` chỉ chạy khi được **gọi thẳng**. Lỗi cũ: `dev-server.mjs` import
> nó, và `--kb` bị nuốt làm đường dẫn ⇒ tạo thư mục rác tên `--kb`.

---

## Bảy lần test báo sai trên code ĐÚNG

Ghi lại vì đây là cái bẫy thường gặp nhất: thấy test đỏ thì phản xạ là sửa code.

| Test báo | Thực tế | Sửa ở đâu |
|---|---|---|
| `token-only`: 129 lỗi | quét cả **CSS Quartz sinh** | test — bỏ qua thư mục build |
| `token-only`: `font-size` trong dòng 2 | đọc chữ trong **comment** | test — bỏ comment trước khi quét |
| `token-only`: `margin: 0 auto` | căn giữa, không phải giá trị spacing | test — cho phép |
| `token-only`: `clamp()` | thứ `DESIGN.md` §2 **đòi** phải có | test — cho phép clamp neo thang |
| `four-screens`: `<input>` trên Chờ duyệt | ô tìm kiếm của **shell**, không ghi gì | test — luật là *không ghi*, không phải *không input* |
| `four-screens`: `fetch(` | script nền dùng để **tải ảnh** — là *đọc* | test — bỏ khỏi danh sách cấm |
| `script-runs`: khai trùng tên | nằm trong **IIFE khác nhau** | test — đếm trong từng khối |

**Quy tắc**: test đỏ ⇒ đọc *cả hai* phía trước khi sửa. `node --check` xanh mà
regex báo trùng tên thì regex sai, không phải code sai.

---

## `prototype.css` được miễn `token-only`

18 giá trị px gõ tay trong đó — đều **dưới 8px** (2px, 3px, 6px): chi tiết tinh
chỉnh mắt của s5. Thang token bắt đầu ở `--s-3xs: 4px` nên chúng **không có token
tương ứng**; ép qua token là làm hỏng thiết kế đã duyệt.

Nó là **hợp đồng G5 đã frozen** — sửa phải qua FR. Luật vẫn áp đầy đủ cho mọi
file viết mới.

---

## Thêm test mới

```js
import { seed, KHO_MAC_DINH } from "./_seed.mjs"
seed(KHO_MAC_DINH)
execSync(`npx quartz build -d "${KHO_MAC_DINH}" -o ../test/_site`,
  { cwd: join(TEST, "..", "_quartz"), stdio: "pipe" })
```

Rồi đọc `_site/` và khẳng định. **Đọc contract để tính số mong đợi, đừng hardcode**
— thêm bản ghi vào sample thì test tự bắt.

Nhớ thêm vào `package.json` `scripts.test` và `.github/workflows/ci.yml`.

---

## `thu-vien.test.js` — test đầu tiên gọi THẲNG hàm trong `web/api/`

Mọi test API khác đi qua HTTP (`batServer` + `goi`). File này `import` thẳng
`dungchung.mjs`, vì luật nó chấm là luật của **cửa ghi**, không của bộ định
tuyến: "sha256 do máy tính" sai ở tầng hàm thì route có đúng cũng vô nghĩa.
Route `POST /api/articles/media` là đơn vị sau (B5) và sẽ có test qua HTTP.

Ba thứ dễ sập nếu sửa file này:

**`process.env.KB_DIR` phải đặt TRƯỚC `await import(...)`.** `dungchung.mjs` đọc
env **một lần** lúc nạp module (`export const KB = process.env.KB_DIR ?? …`).
Đổi thành `import` tĩnh ở đầu file là test chạy trên kho THẬT — đúng thứ mọi
harness ở đây tồn tại để tránh.

**Mọi lời gọi nạp đi qua `nap()`.** Mất `INSERT OR IGNORE` thì SQLite **ném**
(UNIQUE), và ngoại lệ không bắt giết cả file ở lời gọi thứ hai — đỏ, nhưng đỏ
trước khi in được dòng nào về luật đã vỡ. Đo được lúc kiểm hai chiều: `đỏ=True
nói-ra=False`. Một màu đỏ không nói ra chỗ sai là màu đỏ người ta sẽ bỏ qua.

**Phép kiểm "chặn ở header" đua với một hẹn giờ 300ms.** Nếu hàm không chặn ở
`content-length` thì nó ngồi chờ byte mãi (req giả không phát gì) — test **treo**
thay vì báo. `Promise.race` biến một treo thành một dòng FAIL nói rõ nguyên nhân.

Đếm dòng `media` bằng cách **mở thẳng kho** (`node:sqlite`, readOnly), không qua
một `demHienVat()` sinh riêng cho test: hàm production không ai dùng ngoài test
là mã đầu cơ, và nó biến phép kiểm thành "hỏi lớp code đang bị chấm".

---

## `media-dau-de.test.js` — đo ĐẦU ĐỀ, không đo mã nguồn

Một `res.writeHead` đúng trong code mà không tới được trình duyệt là một đầu đề
**không tồn tại**. Repo này đã trúng đúng lớp lỗi đó: `PRAGMA foreign_keys = ON`
khai trong header DDL suốt mấy tháng mà không cơ chế nào bật — vô hại chỉ vì DDL
không có FK nào. Nên file này dùng `http.request` để lấy `res.headers` **nguyên
văn**, không qua lớp gói của `fetch`.

**Bảng khai lái phép kiểm.** `content-type` và `content-disposition` so với
`core/assets/media-mime.json` (`xem_truoc: "iframe"` ⇒ `inline`, `"the"` ⇒
`attachment`), KHÔNG so với chuỗi gõ tay trong test. Đổi bảng thì phép kiểm đổi
theo; gõ tay là bản thứ hai, và bản thứ hai luôn là bản sẽ lệch.

Hai chỗ đã đo sai một lần, ghi lại để lần sau khỏi mất thời gian:

**`id` của fixture phải khớp `^src_[a-z0-9]{6,}$`.** Bản đầu sinh `src_tlpdf`
(5 ký tự) nên bị schema chặn, trong khi `src_tlpptx` (6) đi qua — hai ca giống
nhau mà một đỏ một xanh, và nó đẩy người đọc đi tìm bug ở đường phục vụ.
**PAD, đừng cắt.**

**`if-none-match: undefined` làm `setHeader` NÉM**, giết cả file test trước khi
in được dòng nào về bốn phép kiểm còn lại. Nên `r.dd.etag ?? '"chua-co-etag"'`.
Cùng bài học với `nap()` ở `thu-vien.test.js`: phép kiểm phải sống sót qua đúng
thứ nó đang chấm.

---

## `hai-ban-shape.test.js` — cổng cho một khoảng trắng do một cổng bị gỡ để lại

`hai-duong-doc-khop.test.js` retired ở FR-034 với lý do *"chỉ còn MỘT đường
đọc"*. Điều đó **chỉ đúng cho kho thật**. `duLieuMock()` vẫn quét đĩa, nên
`data.mjs` vẫn có **hai** hàm dựng `Ban` (`banTuDb` và `docTuDia`), mỗi hàm một
danh sách trường gõ tay — và từ FR-034 tới FR-036/B7a **không cổng nào** so
chúng.

So **tập khoá**, không so giá trị: giá trị khác nhau là đúng (hai kho khác nhau).
Và so **hai chiều** — thiếu ở mock nghĩa là FE nhận `undefined` khi người dùng
bấm MOCK; thiếu ở real nghĩa là nó xảy ra trên kho THẬT, nặng hơn.

Lấy **hợp khoá của cả tập**, không lấy bản ghi đầu tiên: một bản ghi lẻ có thể
thiếu khoá vì giá trị `undefined` bị bỏ, và mẫu đó không đại diện.

Gieo fixture: **byte trước, `.md` sau**. `dung_lai_db.py` chết to khi một `.md`
khai `media.sha256` mà thiếu byte (M09-R1), nên thứ tự hai lệnh `writeFileSync`
là hợp đồng, không phải sở thích.

---

## `thu-vien-nap.test.js` — lối thứ tư của màn Nạp nguồn

Soi **bundle đã build**, không soi `.ts`: thứ chạy trên trình duyệt là bundle, và
một helper đúng trong `.ts` mà esbuild inline sai thì `.ts` vẫn xanh.

Phép kiểm nặng nhất là §3: **`.size` phải xuất hiện TRƯỚC `fetch(` trong thân
hàm** — đo bằng **vị trí**, không bằng "có tồn tại chuỗi". Lý do đã đo ở B5:
`413` không tới được client giữa lúc upload (trình duyệt nhận ECONNRESET trên
đường ghi trước khi kịp đọc phản hồi). Bỏ phép kiểm này thì người dùng kéo một
file 30 MB vào và chỉ thấy "mạng lỗi".

Kèm một phép kiểm **tiền đề**: "tìm được thân hàm `napHienVatFE`". Không có nó
thì ba phép kiểm dưới đo **một chuỗi rỗng** và xanh vô căn cứ — cùng lớp lỗi
`cua-so-doc` từng trúng (`indexOf` trả −1 ⇒ `slice(-1, 599)` cắt 1 ký tự).

`accept` của input **không** gõ trong `shell.html`: shell là HTML tĩnh, nó không
đọc được bảng khai. FE đặt `.accept` lúc chạy từ `__MEDIA__`.

**Đã sửa một phép kiểm cũ, và đây là lý do.** `cac-man-con-lai.test.js` ghim
`np-au` đúng **3** vạch và dãy **3/2/1**. Với bốn lối, trên thang **ba** vạch thì
bốn mức khác nhau là **không thoả được** — điều kiện cũ hết đúng, không phải bị
vi phạm. Viết lại theo đúng ý định bình luận cũ đã khai: số vạch **dẫn xuất** từ
số tab · mỗi vạch trong 1..3 · **≥2 mức khác nhau** · "Tự viết bài" là mức
**thấp nhất**. Hai lối *có thể* cùng mức, và đó là sự thật — ép chúng khác nhau
là bắt giao diện nói dối để một phép kiểm được xanh.

---

## `media-cua-so.test.js` — và bug nó tìm ra ngay trong lượt đầu

Hai tầng cố ý: §1–§3 soi **bundle** (luật về *cách* dựng `src` sống trong code,
không trong DOM), §4 đo **hai đường dữ liệu thật**.

**§4 lúc đầu đo sai chỗ.** Bản đầu tìm `media.sha256` trong **HTML của trang
mock** — và nó đỏ, nhưng vì lý do khác lý do tôi nghĩ: `media` **không bao giờ**
nằm trong HTML. Cửa sổ đọc lấy `BAI` qua JSON: bản mock từ
`/mock/static/open-index.json`, bản thật từ `/api/index`.

Sửa cách đo xong thì nó tìm ra **bug thật**: `articles.mjs:chiMucMo` là danh sách
trường gõ tay **thứ ba** (ngoài `banTuDb` và `docTuDia`), và B7a chỉ thêm
`ho_so`+`media` vào hai bản kia. `hai-ban-shape.test.js` canh hai bản đó khớp
nhau — nó **không biết bản thứ ba**. Hệ quả: xem trước hiện vật chạy trên
`/mock/` và **im lặng không chạy trên kho thật**.

Bài học cho lần sau: khi đếm bản song sinh, đếm theo **số đường dữ liệu tới màn
hình**, không theo số hàm trong một file. Ở đây có **bốn**: `banTuDb` ·
`docTuDia` · `chiMucMo` · và một bản thứ tư trong `expected-render.test.js`
(fixture của test, nên drift ở đó làm test đo một hình dạng cũ).

§3 kèm một phép kiểm **tiền đề** ("tìm được hàm `xemTruocHienVat`") — không có
nó thì hai phép kiểm dưới đo một chuỗi rỗng và xanh vô căn cứ.

---

## `thu-vien-tong-hop.test.js` — M09-R4, và cách đo một luật "KHÔNG đổi"

Dựng **hai** bộ dữ liệu khác nhau **đúng một điều** (thêm 4 bản thư viện) rồi so
**cùng một pane** giữa hai bản render. Không so với một con số gõ tay: khi đó
không phân biệt được *"pane đổi vì thư viện"* với *"pane đổi vì tôi gõ sai số
mong đợi"*.

Fixture của bản thư viện dùng `priority: 0` + `credibility_max: "plausible"` —
**đúng hình dạng `data.mjs` sinh ra** cho bản ghi không có `skill_candidates`,
không phải một fixture cực đoan dựng cho dễ đỏ.

**Ba pane chất lượng**: `mball` · `kf-uutien` · `bars3`. Mọi pane còn lại đếm cả
kho — đó chính là *"tổng hợp All"*.

So **sau khi bỏ dòng khai nền** (`.kf-n`): dòng đó **cố ý** chỉ xuất hiện khi kho
thật sự có bản thư viện, nên hai bản render khác nhau đúng ở đó và đó là hành vi
đúng. Luật cần đo là *"con số chất lượng không đổi"*.

**Hai chỗ đã đo sai, và kiểm hai chiều bắt được cả hai:**

`#acount` — bản đầu tìm chuỗi `"8 bản"` trên **cả trang**. Đổi `acount` sang nền
`phanTich` (tức mất ý "tổng hợp All") mà cổng **vẫn xanh**, vì `#tcount` in
*"4 bài · 8 bản ghi"* và chuỗi `"8 bản"` nằm trong đó. Một phép kiểm tìm chuỗi
trên cả trang đo **bất kỳ** ô nào có con số. Sửa: đọc đúng `id="acount"`.

Cộng một phép kiểm **chiều ngược**: pane số đếm phải vẫn khai nền *"cả kho"* —
đổi hết sang "phân tích" là mất ý người dùng đã chốt.


## FR-038/C4 · `loc-theo-nhom` + `hai-ban-shape` mở lên BỐN builder

`loc-theo-nhom.test.js` (MỚI, 53 → cổng thứ 53) canh `?nhom=` trên `/api/index`
và `/api/articles`. Bảy mục, và **chiều âm nặng hơn chiều dương**: nếu ai đó cài
`?nhom=` thành no-op "cho khỏi lỗi" thì mọi phép kiểm chiều dương vẫn xanh — mọi
bản ghi đều có mặt. Chỉ *"nhóm này KHÔNG được chứa bản của nhóm kia"* bắt được.

Ba răng nữa, mỗi răng bịt một cách xanh-vô-căn-cứ:

**Gieo đủ NĂM loại bài viết**, không một loại. Một cài đặt chỉ nhận `loai[0]`
vẫn xanh nếu kho tạm chỉ có `article`.

**Nhóm lạ ⇒ 400, không 200 rỗng.** Danh sách rỗng không phân biệt được với "kho
chưa có gì", nên một lỗi chính tả ở FE thành "màn Video trống mãi mãi" mà không
ai báo. Cộng phép kiểm ngược: `?nhom=` **rỗng** phải là *không lọc*, không phải
nhóm lạ — FE ghép query bằng chuỗi và một biến chưa gán thành `?nhom=`.

**Đo HÀNH VI, không đo chuỗi SQL**: thân phản hồi `?nhom=video` < nửa bản đầy.
Lọc trong JS *sau khi* đã đọc cả kho làm mọi phép kiểm nội dung xanh mà không
chữa được thứ cần chữa (mở màn Video vẫn tải cả kho).

### `hai-ban-shape` — tên nói "hai", đo được là BỐN

| builder | ở đâu | nuôi gì |
|---|---|---|
`banTuDb` | `render/data.mjs:156` | SSR, kho thật |
`docTuDia` | `render/data.mjs:255` | SSR, kb-mock |
`chiMucMo` | `api/articles.mjs:72` | cửa sổ đọc, bản THẬT |
`theBai` | `api/articles.mjs:20` | thẻ danh sách |

Ba builder đầu nuôi **cùng** một hàm `nap()` ở FE ⇒ tập khoá phải Y HỆT. `theBai`
là hợp đồng khác, nên khác biệt của nó khai **thành bảng** (`THE_VANG` /
`THE_RIENG`) chứ không nới phép so thành "gần giống": khai ra thì một khác biệt
MỚI là đỏ, còn nới phép so thì mọi khác biệt đều xanh.

**Cổng này tìm ra một lỗ chưa ai biết**: `chiMucMo` thiếu `concepts_proposed` mà
hai builder `data.mjs` đều có ⇒ trường đó CÓ trên bản mock và `undefined` trên
kho THẬT. Đúng lớp lỗi B8b, bản thứ tư của cùng một bệnh.

**Kiểm hai chiều cho hai răng xanh cả trước lẫn sau** (nên chưa chứng minh được
là đỏ nổi): coi `?nhom=` rỗng là nhóm lạ ⇒ đỏ đúng dòng đó · mọc thêm `than` vào
`theBai` ⇒ đỏ *"hợp đồng thẻ đổi mà bảng này chưa cập nhật"*. Hoàn tác cả hai,
sha256 khớp byte.

## FR-038/C5 · `bay-man.test.js` + ba phép đo đã lấy sai phạm vi

Cổng mới đọc kỳ vọng **từ `man-hinh.json`**, không gõ tay lại — một cổng gõ tay
lại bảng khai là bản gõ tay thứ hai, đúng thứ `check_khai_mot_noi` §3 sinh ra để
cấm, và nó sẽ lệch đúng vào hôm bảng khai đổi.

**Chiều âm là vế nặng.** "Màn Video có video" xanh ngay cả khi màn Video hiện
**cả kho** — tức đúng kiến trúc người dùng vừa bác bỏ. Vế bắt được là *"màn Video
KHÔNG được có một thẻ `paper` nào"*.

**Phép đo loại phải biết BA hình dạng**, và tôi suýt sửa nhầm màn vì thiếu một:
`the()` có `data-loai` · `dong()` chỉ có phù hiệu `tg()` · Kho khai loại qua nhãn
cột `.bl` của biểu đồ "Theo loại nguồn". Bản đầu chỉ đọc `data-loai` ⇒ báo *"Kho
trộn 0 nhóm"*. Đo trước khi kết luận: `v-kho` có **0** `data-loai` và **0** `tg`
trên 8476 byte — nó không giấu gì, nó chỉ khai bằng hình dạng thứ ba.

Trả **TẬP** chứ không trả danh sách: một thẻ mang cả `data-loai` lẫn `tg` nên đếm
thì gấp đôi — và gấp đôi ở **hai vế** của một phép so vẫn "khớp", tức phép so đó
không đo cái nó nói. (§5 lúc đầu so 0 với 30, số 30 là 15 thẻ × 2.)

Nhóm tab đọc từ thẻ bao `.tbg`, không từ thuộc tính của nút: hai regex ở
`rail-trai.test.js` kẹp thẻ `<button>` từ hai phía (`class` phải liền `data-nav`,
`data-nav` phải liền `data-i18n` rồi `>`), nên nhét thuộc tính thứ ba vào nút làm
đứt một trong hai — và cái đứt đó im lặng.

### Ba phép đo lấy sai phạm vi, cùng một lớp lỗi với BUG-2 `#acount`

Chèn ba màn vào giữa `v-all` và `v-nap` làm lộ ba chỗ cắt vùng bằng `indexOf`
tới `</main>` — mỗi chỗ đều đúng khi `v-all` còn là view cuối:

`page-weight:demThe` cắt `grid2 → </main>` ⇒ kho 120 bản đọc ra **144** thẻ thay
vì 24. Sửa: cắt tới `<div class="view"` kế tiếp.

`nut-song` gán *"thẻ thuộc mount CUỐI CÙNG đứng trước nó"* với danh sách mount gõ
tay `brk|nw|grid|grid2|feat` ⇒ ba lưới mới tính cho `grid2`, và `grid2` báo 30
thẻ với 15 slug lặp — **đỏ oan**, mà đỏ oan là loại đỏ sẽ bị tắt. Sửa: danh sách
mount dẫn xuất từ bảng khai, không gõ thêm ba tên.

`cac-man-con-lai:117` cắt theo `id="v-nap"` — và thứ phá nó là một **BÌNH LUẬN**
tôi vừa viết trong shell có chứa literal `id="v-nap"`. Lát cắt bắt đầu ở bình
luận nên `#mbnap` rơi ra ngoài màn của nó. Sửa ở bình luận, không ở cổng: cổng
đúng, chữ của tôi mới sai.

## FR-039/FR-040 · `dinh-dang-mo.test.js` — đo ĐẦU ĐỀ, không đo mã nguồn

Cổng này GET lại hiện vật qua HTTP thật rồi đọc `content-type` /
`content-disposition` trả về. Một cổng đọc mã nguồn sẽ xanh ngay cả khi
`phucVuHienVat` có một nhánh sớm trả 404 trước khi tới chỗ đặt đầu đề — và đó
**chính là** hành vi cũ với mime ngoài enum.

Vế nặng là chiều âm: *"nạp được `.xyz`"* là điều người dùng xin; *"`.xyz` phục vụ
`inline` với content-type đoán từ tên file"* là cái lỗ FR-039 §0 nói sẽ KHÔNG mở.

**Bốn lần cổng của tôi tự sai, và mỗi lần là một bài học khác nhau:**

`nap()` gửi body JSON trong khi hợp đồng là **byte thô + `content-type` +
`x-ten-goc`**. Mọi phép kiểm đỏ vì một lý do không liên quan.

§4 XANH VÔ CĂN CỨ: bốn ca `ten_goc` độc đều 404, nên `content-disposition` là
chuỗi rỗng — chuỗi rỗng không chứa ký tự xấu nào. Bốn phép kiểm xanh mà chưa từng
đo một `filename=` nào. Sửa: đòi `ma === 200` trước.

§4 rồi lại ĐỎ OAN: bản sửa cấm mọi `"` và bắt luôn hai dấu ngoặc **bao** hợp lệ
của `filename="…"`. Cái nguy là dấu ngoặc kép NẰM TRONG giá trị. Sửa: so với một
khuôn đầy đủ `^(inline|attachment); filename="[A-Za-z0-9._-]+"$` — khuôn bắt được
thứ danh sách-ký-tự-cấm không bắt được.

§5 CHẾT thay vì đỏ: `fetch` không đo được 413 (đo ở B5 — ECONNRESET trên đường
GHI trước khi kịp ĐỌC). Đã biết mà vẫn dùng `goi()`. Sửa bằng `http.request` +
`flushHeaders()`.

**Tên độc đi qua FRONTMATTER, không qua đầu đề.** undici TỪ CHỐI gửi một header
có xuống dòng (`Headers.append: … is an invalid header value`), nên đường đầu đề
đã có lớp che ở phía client. Đường không có lớp che nào là
`frontmatter.media.ten_goc` trong body JSON — nó đi thẳng vào DB rồi được đọc lại
để dựng `filename=`. Kiểm đường đã có hàng rào mà bỏ đường không có là kiểm đúng
chỗ không cần kiểm.

**Ba kỳ vọng trong `thu-vien.test.js` HẾT HẠN** theo FR-039 (mime lạ ⇒ từ chối ·
2 dòng byte ⇒ 3 · `text/html` ⇒ 415). Sửa kỳ vọng kèm lý do tại chỗ, và thay bằng
phép kiểm CÒN đáng đỏ: mime **sai hình dạng** ⇒ 415. Ca `; charset=x` KHÔNG dùng
được ở tầng HTTP — `articles.mjs:362` cắt tham số sau `;` trước khi gọi, và đó là
hành vi đúng cho một header hợp lệ.

**Sự cố escaping thứ 16**: `\r\n` viết trong heredoc thành `CR CR LF` thật, làm cả
file thành lỗi cú pháp. Sửa ở tầng BYTE, và CRLF trong test giờ dựng bằng
`String.fromCharCode(13)` — dạng không có dấu gạch chéo thì không tầng nào đổi.

## FR-040 · `route-theo-module.test.js` — và một cổng của tôi VÔ CĂN CỨ

§2 bản đầu chỉ đòi `ma === 422`. Kiểm hai chiều cho thấy nó **XANH cả khi cổng
module bị tắt hoàn toàn**: `validate.py` cũng từ chối đúng ba ca đó, nên phép
kiểm đang đo cái hàm **dùng chung** — tức chính thứ FR-040 nói là vấn đề.

Sửa bằng cách phân biệt AI từ chối, không chỉ "có bị từ chối không". Hai tầng trả
hai hình dạng lỗi: cổng module ⇒ `{loi}` · `validate.py` ⇒ `{loi_validate}`.

Và ca **host ngoài whitelist** đỏ vì **SAI LÝ DO**: tôi bỏ trống `url_normalized`
nên nó rơi vào luật *"video thu-vien phải khai url_normalized"*, không phải luật
host. Đo trực tiếp mới biết: một bản video host lạ **kèm** `url_normalized` đi qua
`validate.py --strict` **sạch** — nên whitelist host trước FR-040 thật sự chỉ sống
ở FE. Một phép kiểm đỏ đúng mã vì sai lý do là một phép kiểm chưa đo gì.

Sau khi sửa, kiểm hai chiều nói được điều đáng nói: tắt `congNhom` ⇒ host lạ được
**lưu (201)**, đúng lỗ FR-040 đóng · đổi so-hậu-tố thành `includes` ⇒
`youtube.com.ke-xau.example` lọt. Cả hai hoàn tác khớp sha256.

Ba lỗi mầm gieo trước đó, mỗi lỗi làm cả một mục đo nhầm: `id` thiếu độ dài
(`^src_[a-z0-9]{6,}$`) nên cả ba mầm 422 và §1 đo **ba bản của fixture** · thân
"Ghi chu ngan." làm bản `paper` trượt cổng khung · video thiếu `url_normalized`.

## FR-038/C6a · `man-nap-rieng.test.js` — và một HỎNG THẬT cổng bắt được

Cổng đo chiều ÂM: màn nạp Tài liệu KHÔNG được chứa form viết bài, màn nạp Bài
viết KHÔNG được chứa ô chọn hiện vật. *"Màn nạp tài liệu có ô chọn file"* xanh
ngay cả khi nó mang nguyên cả bốn lối như `/nap/` cũ.

**Tôi làm hỏng thật, và cổng bắt được**: bỏ dải tab khiến lối `file` và `viet`
(mang `hidden`) không còn gì bật chúng hiện — hai trong ba lối của màn Bài viết
biến mất. Đã khôi phục dải tab **ba** lối. Luật *"không gộp chung"* nói về
MODULE, không nói về hai lựa chọn bên trong một module.

**Bốn lỗi cấu trúc khác của lát cắt**, mỗi lỗi một bài học:

`#mbnap` thành ID TRÙNG vì khung đầu bị nhân đôi — `chen()` thay theo id nên hai
thẻ cùng id là một phép thay không xác định. Màn tài liệu giờ có `#mbnaptl` riêng,
và dải của nó nói đúng việc máy làm cho một file (băm · soi byte · đặt tên), không
dán lại "3 lối · 9 bước" của màn kia.

Một `</div>` LẠC làm `.mid` đóng sớm ⇒ màn nạp tài liệu nằm ngoài khung. Đo cân
bằng thẻ thay vì đọc mắt.

Và tôi **đo sai một lần nữa** khi truy: lát cắt tới `</main>` nuốt luôn thẻ đóng
của `.mid`, nên khối tài liệu báo -1 trong khi nó đúng. Cộng một lượt `assert`
ném **trước** `write_bytes` nên bản vá chưa từng được áp — mà tôi đã đọc kết quả
như thể nó đã áp.

**Bốn kỳ vọng hết hạn ở bốn file**: `MOC` trỏ `v-nap` · số dải/trang bằng
`MOC.length` (sai từ khi có `cat_khi_khac` — giờ đếm theo màn CÓ MẶT) ·
`ssr-routes` danh sách đường gõ tay (giờ dẫn xuất) · `chu-giao-dien` đọc
`nap/index.html` và **chết** bằng TypeError thay vì đỏ một phép kiểm.

`_render.mjs` `VIEWS` — bảng thứ tư — giờ cũng dẫn xuất từ `man-hinh.json`.

## WO-012 · `ui-ba-man.test.js` — và cổng của tôi đo HÌNH THỨC hai lần

Người dùng: *"tôi thấy chưa đẹp và khoa học đâu"*. Tôi mở trình duyệt thật trước
khi hỏi, và **ảnh chụp tìm ra một lỗi 77 file test đều bỏ lọt**: `/tai-lieu/nap/`
hiện màn DANH SÁCH tài liệu — tiêu đề "Nạp tài liệu", thân trang "Chưa có tài liệu
nào". Xem `WL-01K9NKUIVAMATFILE`.

Cổng đối chiếu với **màn Tổng hợp** thay vì gõ danh sách thành phần: hôm nào Tổng
hợp thêm một khối, ba màn loại lại tụt lại mà không ai thấy — và đó chính là cách
chúng sinh ra nghèo ở C5 (tôi viết "cùng một khuôn", khuôn tôi chọn là khuôn tối
giản nhất).

§2 đòi ba dải nói **ba tập số KHÁC nhau**. "Có dải" xanh cả khi ba dải in số cả
kho; chỉ so ba dải với nhau mới bắt được.

### Hai lần cổng của tôi đo hình thức, không đo sự thật

**§4 `min-height`**: cổng hỏi *"`.mid` có luật `min-height` không"* và trả lời
"có" — trong khi trên trình duyệt `.mid` cao 906/1026px mà `.pn` (khối kính NHÌN
THẤY ĐƯỢC) vẫn **278px**. `.mid` trong suốt, nên kéo nó cao không làm tờ báo cao
thêm một pixel. Sửa: chuỗi ba khâu (`.mid` cột flex → `.view.on` ăn phần còn lại
→ `.pn` giãn), và §7 khai thẳng rằng đây là phép kiểm CHUỖI LUẬT, kèm số đo thật
bằng Playwright (panel 27% → **70%**, ảnh nền 65% → **20%**).

**§5 vùng đo sai**: tôi cắt tới `</header>`, và `<header class="top">` là RAIL
TRÁI — chữ "viết bài" chưa bao giờ ở đó. Nên CẢ HAI chiều đều vô căn cứ: vế âm
xanh vì đo vùng trống, vế dương đỏ vì cùng lý do. Vùng đúng là `.ph`.

### Bốn kỳ vọng hết hạn ở bốn file

`cac-man-con-lai` bảng `MOC` (giờ dẫn xuất) · hai phép kiểm `chen(shell, "<id>"`
chỉ thấy lời gọi **gõ tay**, không thấy vòng lặp — *một cổng chỉ thấy bản gõ tay
là cổng ép người ta gõ tay* · `real-vs-mock` regex `id="tcount">` đòi `>` liền
sau id, hụt khi ô đếm thành một mốc có `data-mount`.

Và một cổng chặn tôi đúng chỗ: **`.mid` chỉ được có MỘT luật** — "một selector,
một sự thật", vì hai luật thì phép kiểm dễ khớp vào luật đã bị đè. Tôi đã thêm
luật thứ hai; phải gộp vào luật duy nhất.

## C6b · `nap-video.test.js` — cổng cho một đường TRƯỚC ĐÓ KHÔNG TỒN TẠI

Vế nặng: **FE phải gọi `/api/video`, không `/api/articles`**. Đường cũ vẫn tạo
được bản video (bí danh còn sống từ FR-040), nên gọi nó thì mọi phép kiểm "tạo
được video" đều xanh — mà cổng riêng của module video (whitelist host phía server)
**không chạy**. Đó là cách một tính năng bỏ qua đúng cái cổng sinh ra cho nó.

Vế nặng thứ hai: **FE KHÔNG được tự tính `url_normalized`**. `validate.py --fix`
điền bằng `normalize_url()` (T01-29) — một công thức, chạy một nơi. Cổng đo bằng
cách đòi bundle không dựng dạng chuẩn từ id, và bằng một vòng HTTP thật: POST
`/api/video` **không gửi** `url_normalized` ⇒ 201, rồi GET lại thấy máy đã điền.

`no-write-path` whitelist đường ghi giờ **dẫn xuất** từ `loai-nguon.json`. Gõ ba
tên vào regex là bản gõ tay thứ hai, lệch đúng vào hôm thêm module thứ tư. Regex
dựng bằng **mã hex** cho ba dấu nháy (`\x22\x27\x60`): lớp ký tự có backtick làm
đứt mọi template literal, và trong chuỗi thường thì mỗi tầng công cụ lại ăn một
dấu gạch chéo — đây là dạng không tầng nào đổi được.

`thu-vien-nap` tập "pane cố ý không có tab" cũng dẫn xuất: C6b thêm `video`, và
một danh sách gõ tay sẽ đỏ oan ngay lượt sau.

**Hai điều tự bắt được, ghi ở backlog M03**: `gn.js` vượt trần 266 byte mà
`page-weight` vẫn xanh vì nó **làm tròn KB** (cho vượt tới 511 byte) — đã siết
bốn chỗ, còn dư đúng 5 byte · và một bản ghi THỬ đi vào kho THẬT vì tôi trỏ server
vào `kb/` khi kiểm bằng trình duyệt, thay vì `KB_DIR` kho tạm như mọi test.

## WO-013/1 · `sua-dung-man.test.js` — CHẠY phép tra, không tìm chuỗi

Cổng rút hàm `manNapCua` khỏi **bundle** rồi **chạy nó** với bảy `source_type`.
Tìm chuỗi `napvideo` trong bundle là vô nghĩa — nó đã có sẵn từ C6b; chỉ phép tra
trả đúng đích mới là thứ người dùng gặp.

Khung chạy phải dùng tên **esbuild sinh ra** (`define_NAP_CUA_default`), không
dùng tên trong nguồn `.ts`: bundle mới là thứ chạy trên trình duyệt.

**Răng ngân sách đo bằng BYTE.** `page-weight` so `Math.round(byte/1024) <= 100`
nên nó cho vượt tới **511 byte** mà vẫn xanh — lọt thật ở C6b (102666 byte báo
"100 KB" và XANH). Ở đây so byte thẳng, và chính nó bắt cả ba lượt vượt trần
trong đơn vị này.

### Điều đo được, đổi hẳn cách nhìn về ngân sách

`__MAN__` đang nhúng **nguyên** `man-hinh.json` vào bundle chỉ để dựng `DUONG`
(id_shell → path). `lotComment` lột `$comment*` nhưng KHÔNG lột `$loi`/`$alias`/
`$slug`/`$bo` — nên toàn bộ văn xuôi giải thích đi thẳng vào `gn.js`.

Chiếu xuống đúng hai trường FE cần: **99359 byte, dư 3041** — từ chỗ dư **5**.
Cùng nguyên tắc cho `__NAP_CUA__` (chỉ ngoại lệ + khoá `""` mặc định). Cả hai
tính LÚC BUILD từ chính bảng khai, nên không có bản gõ tay thứ hai.

Bài học: "bundle hết chỗ" hoá ra là "bundle đang chở văn xuôi". Đo trước khi kết
luận phải tách bundle.

## WO-014 · `hai-chieu-facet.test.js` — hai chiều, không một ô

Người dùng, kèm ảnh chụp: *"chúng ta đang nhầm mục loại nguồn và phân loại… các
key như video, tai-lieu KHÔNG THỂ để chung chỗ loại nguồn như tiktok / youtube /
article / paper"*.

`bangLoc:218` dựng facet bằng `b.source_type` — một ô chở HAI ý. Sidebar
`/video/` khi đó hiện đúng MỘT dòng "video".

**Vế nặng: ba tập KHÔNG GIAO NHAU.** Nếu phép suy rơi về `source_type` cho mọi
module thì `/video/` vẫn "có facet" và mọi phép kiểm có-mặt đều xanh — trong khi
sidebar vẫn vô nghĩa đúng như ảnh. Kiểm hai chiều xác nhận: cho `nguonCua` trả
`source_type` ⇒ đỏ *"một dòng tai-lieu trong sidebar tai-lieu là vô nghĩa"*.

Kết quả: `/bai-viet/` article·paper·repo·announcement·docs · `/tai-lieu/` pdf ·
`/video/` youtube · Tổng hợp = **phân loại** (bài viết · tài liệu · video).
KHÔNG đổi schema — cả ba đã nằm sẵn trong `source_type` / `media.mime` /
`url_normalized`.

`data-loai` GIỮ nghĩa `source_type`; hai chiều mới đi vào `data-pl` và
`data-nguon`. Đổi nghĩa `data-loai` là phá `bay-man` §3-5 · `nut-song` ·
`ui-ba-man` vì một lý do không liên quan.

**Hai lần escaping lại cắn**: `String.raw` cho regex trong `filter-counts` (trong
template literal thường, `\s`/`\d` bị nuốt dấu gạch chéo ⇒ regex thành `s*`/`d+`
và khớp 0 nút mà không lời nào) · và một `\n}` trong chú thích Python thành xuống
dòng THẬT, làm cả file test thành lỗi cú pháp.

## WO-013/2 · `o-media-sua.test.js` — và một lỗ `npm test` KHÔNG thấy

Backend đã đúng từ trước (§3-§4 xanh ngay lượt đầu): `media` sống qua lưu, thay
được. Thiếu là **FE** — người dùng sửa một tài liệu mà không thấy file của nó.

**§5 sinh ra vì một phép phá đi lọt.** Tôi đổi `hienVatCho = m ?? null` thành
`= null` trong `suaTaiLieu` — tức bấm "Lưu thay đổi" là `media` biến mất — và
**`npm test` vẫn exit 0**. Mọi phép kiểm HTTP tự dựng payload nên chúng không đi
qua đường FE. §5 đọc BUNDLE và đòi `suaTaiLieu` lấy con trỏ TỪ bản ghi; sau khi
thêm, phá lại thì nó đỏ đúng câu đó.

Lát cắt thân hàm phải dùng **ngoặc khớp**: chữ ký `suaTaiLieu` trải hai dòng và
kết thúc bằng ngoặc nhọn mở, nên mốc "xuống dòng + ngoặc nhọn" trúng ngay chữ ký
— lát cắt thành chữ ký, thân hàm nằm ngoài, và phép kiểm đỏ oan.

## WO-015 · `hien-that.test.js` — hai bug không cổng đọc-chuỗi nào thấy được

Hai bug đã đo trên trình duyệt lúc kiểm toán, cả hai **xanh** với mọi cổng đang có.

**BUG-1 · `[hidden]` không thắng.** `#f-bai` mang `hidden = true` mà
`display = block`: `body.api-co .api-only` (0,2,1) thắng `[hidden]` (0,1,0). Nút
"Mở form viết bài" vô nghĩa, "Ghi vào kho" bấm được khi chưa nạp gì.

Bản sửa ĐẦU thêm `:not([hidden])` vào ba luật `.api-only`. Cổng xanh — trình
duyệt vẫn `display: grid`, vì luật thắng là `.np-form{display:grid}`, một luật
**thứ tư** ngoài tập tôi xét. Đó là bằng chứng `:not([hidden])` từng luật là cuộc
đua không có đích: mọi luật `display` ai thêm sau cũng thắng lại, im lặng.

Nên đổi sang **bất biến** `[hidden]{display:none !important}`. Ghi chú ban đầu
của WO-015 xếp `!important` là anti-pattern; phép đo cho thấy phương án thay thế
tệ hơn, nên đảo hướng và ghi lý do vào chính chỗ mã. Ca âm giữ `!important` không
rải sang luật khác — hai `!important` là đua trọng số lần nữa, và lần đó không
còn bất biến nào phân xử.

**BUG-2 · `#acount` đếm cả trang.** Mọi màn nằm trong cùng tài liệu, nên
`document.querySelectorAll(".cd:not(.off)")` cho TỔNG của Trang chủ + Tổng hợp +
ba màn loại: nhãn "14 bản" cạnh một lưới có **7** thẻ. Mỗi lưới nay khai ô đếm
của nó bằng `data-dem`; một id cứng nghĩa là lọc ở màn Video ghi số vào nhãn của
màn Tổng hợp.

**Phép đo của tôi nuốt dấu phân cách.** Mẫu mở đầu `(?:^|\})` khớp và do đó
TIÊU THỤ dấu `}` của luật trước, nên nó chỉ bắt được luật **cách một** —
`[hidden]{…}` rơi đúng nhịp bị bỏ, và cổng báo *"thấy 0 luật"* trong khi luật
có thật trong file. Bỏ dấu phân cách khỏi mẫu: từ 3 luật lên 5 luật nhìn thấy.

**Chú thích phá mã, ba lần trong một lượt:** khối `/*…*/` trước luật đi lọt vào
phần bắt selector · chuỗi đóng khối viết trong chú thích làm khối tự đóng ⇒
`SyntaxError` · và hai chú thích CSS còn khai bản sửa là `:not([hidden])` sau khi
thứ đó đã bị bỏ — đúng bệnh WO-015 mở ra để chữa, lần này là chú thích của tôi.

## WO-016 · ba cổng cho bốn chiều nhãn

Người dùng: *"Phân biệt rõ PHÂN LOẠI / Loại nguồn / CHỦ ĐỀ (category) VÀ KHÁI
NIỆM (concept)"*, kèm yêu cầu `/khai-niem/` liệt kê đủ ba và ba đường nạp phải gán
được cả ba, **get từ DB**.

### `bon-chieu-facet.test.js`

**Phép đo đầu tiên của tôi sai, và đo tiếp mới thấy.** `bangLoc` đã phát
`nhom("chủ đề", "cat", …)` từ trước; facet vắng vì `nhom()` trả rỗng khi không có
mục — tức **không bản ghi nào có `category`**. Kho thật `category: []`, kho mock
không khai trường này, và `categories`/`concepts` có **0 hàng**. Vấn đề ở DỮ LIỆU.

Nên cổng này **gieo dữ liệu CÓ `category`** và §0 tự kiểm điều đó trước khi tin
kết luận nào. Không có §0 thì §2 đỏ vì dữ liệu rỗng và tôi sẽ đi sửa mã không có
bug — lớp lỗi đã trúng bốn lần trước đó.

Lỗi mã thật chỉ có một: `bangLoc` dùng `if/else` nên màn trộn nhận `pl`, màn loại
nhận `nguon`, **không màn nào cả hai**.

**Cổng XANH khi tôi xoá tab.** §7 bản đầu hỏi `vKn.includes("loại nguồn")` —
chuỗi đó còn nằm trong đoạn văn giải thích ngay dưới, nên xoá `data-dmtab="nguon"`
mà cổng vẫn xanh. Nay đo COMPONENT: tab · panel · mốc đổ danh sách.

**Mẫu không được nuốt dấu phân cách** — cùng bài học `hien-that`: một mẫu bắt đầu
bằng `(?:^|\})` tiêu thụ dấu `}` của luật trước và chỉ bắt được luật cách một.

### `nhan-bat-buoc.test.js`

Ba "ok" xanh vì **lý do sai**, và cả ba là cùng một bệnh: `"chủ đề".length` và
`"cả hai".length` đều là 6 ⇒ hai ca trùng slug, ca sau được **409 xung đột** mà
tôi đọc thành "luật đã nổ"; và PUT ba đoạn ⇒ **404 sai chỗ**, cũng không phải luật
nổ (đường đúng có bốn đoạn).

`sv.dong?.()` — tên sai, và `?.` làm nó im lặng không làm gì: mọi phép kiểm xanh
mà tiến trình **treo** (exit 124). Tên đúng là `dung()`.

### `o-nhan-nap.test.js`

Cổng này bắt buộc chứ không phải thêm cho đủ: luật server vừa đòi nhãn, mà hai màn
nạp có **0** `<select>` — nạp một tài liệu qua UI là **422 không có ô nào để
điền**. Luật và ô phải về cùng lượt; để lệch là làm sản phẩm xấu hơn khi chưa có
luật.

Nó cũng là cổng bắt `gn.js` vượt trần **251 byte** trong khi `page-weight` vẫn nói
"100 KB · ok" (so KB làm tròn). Chữa bằng SIẾT, không nới: ba câu lỗi xuất hiện
5/3/3 lần hợp về một khai báo. Còn dư **147 byte** — quá chật, nên tách bundle là
đơn vị kế tiếp.

## WO-017 · `nap-ba-khung.test.js` — và hai bug SỐNG mà 77 file test bỏ lọt

Người dùng, kèm ảnh: *"ba khung nạp riêng → có vẻ bạn chưa làm"* và *"chưa có form
và design UI cho tài liệu / video. Và các url như video/nap đang bị ẩn"*.

**Bug 1 · hai màn nạp VÔ HÌNH.** Luật

```css
.pn:has(> [data-mount]:empty):not(:has(> [data-mount]:not(:empty))){display:none}
```

tắt **cả section** của `/tai-lieu/nap/` và `/video/nap/`, vì mốc `mbnaptl` rỗng và
không mốc nào khác trong section. Mở màn đó là **trang trắng** — đúng câu người
dùng nói. Chú thích của chính luật khai chủ ý *"ẩn panel khi MỌI mốc rỗng — tức
panel chỉ còn cái đầu bảng"*; tiền đề đó **sai** với hai màn nạp, chúng đầy nội
dung tĩnh. Vế còn thiếu: `:not(:has(input, select, textarea, button))` — panel có
điều khiển thì nó không rỗng.

**Bug 2 · handler `data-naptab` không tồn tại.** Bấm "Tự viết bài" không làm gì;
`#f-bai` vẫn `hidden`. Hai trong ba lối nạp bài viết không vào được, tức không
viết được bài nào qua web. Handler mất khi một lần `git checkout --` phá
`multiwindow.inline.ts`; bản khôi phục từ build là bản **trước** khi nó được thêm.

**Vì sao 77 file test bỏ lọt cả hai:** `cac-man-con-lai` và `thu-vien-nap` có nhắc
`naptab`, nhưng chúng kiểm **markup** — "nút có trong DOM", "panel có trong DOM".
Cả hai đúng. Thứ sai là **không ai nối chúng lại**, và markup không nói được điều
đó. §1 nay đòi song ánh tab↔panel **và** đòi bundle có đường nối; §6 đòi luật
tự-ẩn mang vế miễn trừ.

**Cổng của tôi tự tố hai lần.** (a) Bỏ phép đặt panel mà cổng **vẫn xanh** — phép
kiểm nối hai điều kiện trên *cả bundle*, và `.hidden =` còn ở hàm khác; siết vào
đúng thân `moTab`. (b) Nó tìm chuỗi `napview` trong bundle, mà bản cài đặt đúng
dựng selector từ biến nên chuỗi đó **không tồn tại** ⇒ đỏ oan trong khi trình
duyệt đã xác nhận chạy. Đo cơ chế, không đo chuỗi.

**Phạm vi cả shell, hai lần trong `thu-vien-nap`:** đếm `data-naptab` trên toàn
shell rồi đòi `=== 3` (nay 5 vì hai dải mới), và "không còn tab `tep`" cũng quét
cả shell. Cả hai đổi sang cắt **vùng**.

**Escaping #30-32:** backtick trong chuỗi kép bash bị thay-thế-lệnh làm hai khai
báo mất thân · `</div>` qua `bash -c` đọc thành chuyển hướng · và `\b` thành ký tự
**backspace 0x08**, làm `/function moTab\x08/` không khớp gì.

**Siết, không nới:** handler làm `gn.js` vượt trần 81 byte. Hợp hai mẫu câu lỗi
(×5 và ×3) còn vượt 29; rồi `?.addEventListener(` ×13 — đoạn `")?.addEventListener("`
một mình là **252 byte** — thay bằng một hàm `nghe()`. Về 102045, dư **355**.

## WO-018 · `mo-ta-va-nut-nap.test.js` — và một dòng chữ của tôi nói dối

Người dùng, kèm 4 ảnh: *"khi upload tài liệu hay video thì cần thêm 1 số fields
như viết bài: gán category, gán concept, mô tả"* · *"button đăng ký / nạp bị
switch và ko back lại được nút ban đầu"*.

**Ô mô tả → thân bài.** Hai đường gửi `body: motCau`, tức thân bài lặp lại câu
tóm tắt — bản ghi tự nói hai lần. Ca âm của §1: ô có mà hàm gửi vẫn dùng `motCau`
thì "có ô" vẫn xanh trong khi giá trị người dùng gõ không đi đâu.

**Ô nhãn có trong DOM mà không ai thấy.** `tv-cat`/`vd-cat` nằm trong khối
`hidden`. §2 đo QUAN HỆ CHỨA bằng cách đếm độ sâu thẻ, không tìm chuỗi `hidden`
ở gần — thứ sau khớp cả một thẻ chị em.

**Nút nạp chết.** Màn nạp cũng khai `module`, nên phép tìm "màn nạp của module
này" giải ra chính nó ⇒ nút trỏ vào trang đang đứng, và không có đường sang lối
nạp khác.

**§4 bắt một dòng chữ TÔI viết nói dối:** dải video ghi `douyin · bilibili` trong
khi whitelist có hai host; dải tài liệu ghi `docs · bảng tính` trong khi bảng có
`pdf pptx docx ppt doc`. Cổng so chữ trên màn với bảng khai — cách duy nhất nó
không nói dối lần nữa là dẫn xuất, và cách duy nhất biết nó có dẫn xuất là so.

**Ba lần cổng của tôi tự tố.** §3 cắt `slice(0, indexOf("<main"))` vì tôi tưởng
nút ở header — nút ở vị trí 2541, `<main>` ở 2050 ⇒ lát cắt 0 nút, phép kiểm xanh
vô căn cứ. Rồi hai phép đo HÌNH THỨC: đòi thân hàm chứa chuỗi `tv-mo` (bản cài
đặt tốt hơn dùng một helper chung nên không chứa), và đọc dòng liệt kê bằng mẫu
`<span>` trơn (mốc do SSR đổ nên nó CÓ thuộc tính).

**Và một lát cắt của tôi nuốt khối khác:** khi viết lại panel loại nguồn, lát cắt
đi từ `nguonlist` tới hết dòng `nguoncount` — khối đổ bốn mốc nằm giữa hai mốc
đó, nên nó bị xoá cùng. §4 bắt được ("0 nơi phát").

**Đính chính của người dùng về tên:** *"thứ chúng ta cần là danh sách LOẠI NGUỒN,
chứ ko phải phân loại"*. Panel quản lý **loại nguồn**; phân loại là nhóm cha. Và
nội dung cũng sai — nó đọc `m.loai` của `loai-nguon.json`, tức tên BẢNG. Nay dùng
lại `nguonCua()`, một phép suy đã có từ WO-014.

## WO-020 · một răng mới tìm ra TÁM token chưa khai

Người dùng: *"mục nộp file .md cũng chưa có mô tả và gán concept/category"* ·
*"design lại layout bố cục của trang /khai-niem/: big update"*.

**§7 · lối `file`.** Template `mau-nap-nguon.md` ĐÃ khai `one_liner`, `concepts`,
`category` — nên ba ô mới không phải nguồn thứ hai: chúng chỉ điền khoá file
THIẾU, và luật đó được nói ra trên màn.

Phép kiểm đầu của tôi tìm chữ "thiếu"/"chỉ khi" trong `server.mjs` — và chú thích
của tôi viết "THIEU" không dấu nên nó không khớp. Một phép kiểm khớp **văn xuôi kể
về luật** thì đổi một chữ là nó nói sai, còn luật đổi thì nó vẫn xanh. Cả hai chiều
đều vô dụng. Đổi sang gọi **HTTP thật**: file có `category` + header đề nghị giá
trị khác ⇒ giá trị của file phải sống; file thiếu ⇒ bổ sung được điền.

**Một răng mới, và nó tìm ra tám lỗi im lặng.** `var(--x)` trỏ vào token chưa khai
không cảnh báo, không đỏ — chỉ một thuộc tính rơi về giá trị thừa hưởng. Tôi thêm
răng sau khi tự trúng (`--c-docs` bịa tên ⇒ viền thẻ Tài liệu ra gần như đen), và
nó lôi ra bảy cái nữa **có sẵn từ trước**:

| token | hệ quả thật |
|---|---|
`--f-mono` · `--mono` | gõ sai tên (`tokens.css` khai `--f-mn`) ⇒ chữ đó **không** mono |
`--hov` | 3 chỗ hover tab rail ⇒ hover **không đổi màu gì** |
`--e-out` | tên sai cho easing (`--e-*` là đổ bóng) ⇒ hai transition dùng easing mặc định |
`--lh-meta` · `--bg` · `--fs-xs` | rơi về giá trị thừa hưởng |

Ánh xạ chỉ dùng token **đã khai**; `--hov` khai lại theo giá trị thu hồi từ
`trang-chu.html` — nguồn gốc của chính token đó. Không bịa giá trị mới.

**Thiết kế lại panel Loại nguồn.** Bốn điều sai đo được: 14 dòng dọc × 36px =
500px một cột trong khi nửa phải màn hình trống · số đếm sát lề trái cách tên 40px
· ba nhóm không gì phân biệt · `0 bài` × 11 dòng. Hướng: bảng công cụ dày đặc —
mỗi phân loại một **thẻ** (quan hệ tập-con là quan hệ nhóm, đọc bằng khối cạnh
nhau), `auto-fit` chứ không `repeat(3,…)` vì ba là số phân loại *hôm nay*, số áp lề
phải, thanh tỷ lệ **trong** nhóm. Panel 500px → 251px.

**`.ln-mo{opacity:.62}` của tôi phá contrast** — 3.63:1, dưới AA 4.5:1.
`opacity-khong-pha-contrast` bắt: `opacity` chồng lên một token đã audit là làm
hỏng đúng thứ audit bảo đảm.

**Và một lần siết vì trần:** `document.getElementById(` xuất hiện **128 lần** ≈
2.9 KB. Gom về `G()` đưa `gn.js` từ 102450 (vượt trần 50) về 99703.

## WO-021 · cân bằng thẻ ĐÚNG SỐ mà SAI CHỖ — sáu lượt vá

Cổng mới: `format-chung.test.js`.

Người dùng: *"format của viết bài và nạp tài liệu / video chưa đồng bộ"* ·
*"UI các màn nhập input nạp đang bị lệch về bên trái quá"*.

**§1 đo TẬP, không đo sự có mặt.** "Màn A có ô Tiêu đề" xanh khi tôi thêm ô cho
một màn và quên hai màn kia. Điều phải đúng là ba tập GIỐNG NHAU, nên §1 đo tập
giao và tập hiệu.

**§2 đo hai vế của một việc:** bốn trường đã gỡ không còn ô, **nhưng vẫn vào
payload** — schema đòi cả bốn, và gỡ ô mà quên tự điền thì mỗi lần bấm Ghi là 422
tới *sau khi* người dùng gõ xong cả form.

**§4 đảo một phép kiểm cũ.** `nhan-bat-buoc` từng đòi 422; người dùng đảo quyết
định của chính họ, nên nó nay đòi 201. File không bị xoá — nó canh chiều ngược
(một lần siết lại ngoài ý muốn sẽ làm nó đỏ) và là hồ sơ của lần đảo.

### Sai lầm nặng nhất: bọc markup làm hỏng shell, sáu lượt mới về

Lát cắt lấy mốc chia là chuỗi **đầu tiên trong cả view**, nên khối hai cột mở ở
panel `link` và đóng ở panel `file`.

**Vì sao không ai kêu:** phép đếm thăng bằng thẻ vẫn `+0`. *Cân bằng đạt được ở
sai chỗ vẫn là cân bằng* — đếm thăng bằng **không chứng minh được cấu trúc**. Phép
đi độ sâu của tôi cũng báo "ba view đóng sạch", vì độ sâu về 0 ở một thẻ đóng
khác. Và khối bọc cần **ba** thẻ đóng cho ba thẻ mở; tôi viết hai — với tài
liệu/video nó *tình cờ* đóng đúng chỗ nên hai màn đó xanh trong khi cùng lỗi.

**Thứ cuối cùng bắt được nó là một cổng đếm CHỮ:** `chu-giao-dien` báo 577 > 480,
vì ba dòng "dừng ở bản nháp" của cả ba màn rò ra ngoài view nên hiện trên mọi
trang. Một cổng đếm chữ tìm ra một lỗi cấu trúc.

**Đổi hướng:** bỏ hẳn wrapper, làm bố cục bằng CSS thuần (`margin-inline:auto` +
`max-width`). Ở CSS thì sai chỉ sai hiển thị, không hỏng DOM.

### Bố cục

Đo được: `.f-row` `max-width:600px` trong panel **1344px** ⇒ trống **715px = 53%**.
Không kéo ô nhập rộng 1344px — mắt mất hàng khi xuống dòng; vấn đề là chỗ trống.
Và khối giải thích cuối màn nằm *ngoài* `.np-p`, nên không căn nó thì màn có hai
mép trái (form x=488, giải thích x=315).

## WO-019 · loại nguồn vào bảng DB — `loai-nguon-api.test.js`

Người dùng: *"bạn cần lưu các dữ liệu của mục phân loại này vào bảng DB — giống
concept và category ấy, ko được hardcode"*.

Bảng `loai_nguon (id, module, nhan, thu_tu)`, cùng khuôn `concepts`/`categories`:
DB là chân lý, `kb/loai-nguon.yaml` là export dẫn xuất. `loai-nguon.json` **không**
bị thay — nó giữ enum `source_type`, sinh các `CHECK` của DDL, và phải đọc được
*khi DB chưa tồn tại*. Hai vai khác nhau, không phải hai bản.

**Ca âm nặng nhất của cổng web:** đưa một nhãn CHỈ CÓ trong dữ liệu (`NHAN-LA-CHI-
CO-TRONG-DB`) rồi đòi màn hiện nó. Panel còn suy từ `media-mime.json` thì phép kiểm
"panel có 14 dòng" vẫn xanh trong khi mọi sửa trong DB im lặng.

**Luật gieo tôi viết sai lần đầu.** "Gieo khi bảng RỖNG" làm `check_media_dan_xuat`
đỏ: gate đó dựng DB1 bằng SQL trực tiếp nên file xuất ra rỗng, rồi vòng sau gieo 14
dòng ⇒ hai cây export khác nhau. *"Bảng rỗng"* và *"chưa có file"* là hai trạng
thái — một kho đã có file rỗng là một kho đã **nói**: không loại nguồn nào.

**Điểm bất động hỏng lần đầu** vì export ghi khoá `label_vi` còn import đọc khoá
`nhan` ⇒ tên rơi về id sau một vòng. Cổng bắt được vì nó so **từng hàng**; so số
hàng thì 14 == 14 và nó xanh.

**Cổng chết thay vì báo, hai lần:** `dem()` ném khi bảng chưa có, và `items[0]` là
`undefined` ở lần chạy đầu. R5 đòi ĐỎ TRƯỚC — nên "chưa có" là trạng thái *hợp lệ*
của lần chạy đầu, và phép kiểm phải báo.

### WO-019 phần FE · sửa nhãn ngay trên màn Danh mục

`guiPopupSua` chọn đường bằng **bảng tra** `DUONG_NHAN` thay cho chuỗi ternary hai
nhánh — hai nhánh không mở rộng được cho cái thứ ba mà không thêm nhánh, và mỗi
nhánh là một chỗ để quên.

**Một khuôn hàng, không hai.** Nhánh *"nhóm chưa dùng loại nào"* từng dựng hàng
bằng khuôn thứ hai, và nút sửa chỉ vào khuôn thứ nhất — nên một nhóm chưa dùng gì
thì không sửa được dòng nào. Hợp về `hangLn(x, n)`.

**Sửa xong màn phải đổi NGAY.** Đo trên trình duyệt: PATCH thành công mà hàng giữ
chữ cũ tới khi tải lại — danh sách loại nguồn do SSR dựng nên `napDanhMuc()` không
có mốc nào để làm mới. *"Ghi mà đọc không ra"*, cùng lớp lỗi đã bắt ở WO-016. Vá
tại chỗ, và đổi luôn `data-nhan` của nút: quên nó thì lần mở sau hiện giá trị lúc
trang được dựng.

**Cổng cũ phải đảo:** `bon-chieu-facet` §8 từng cấm cả ba `them|sua|xoa` — tôi viết
khi thiết kế còn chỉ-đọc. Người dùng nói rõ *"ta cần QUẢN LÝ danh sách"*, nên SỬA
thì được; hai vế kia giữ nguyên và có lý do.

**`opacity` lại phá contrast.** `.ln-s2{opacity:0}` (giấu tới khi hover) làm cổng
báo `1.00:1`. Cổng **đúng**: `opacity` trên token đã audit phá chính thứ audit bảo
đảm, và nó không phân biệt được *mờ* với *ẩn*. `visibility` giấu mà không đụng màu.

**Và một phép kiểm âm mong manh:** `? await fetch` có bốn chỗ hợp lệ khác trong
file, nên mẫu phủ định quanh nó bắt nhầm. Đổi sang đo **dương**: dòng gửi PATCH
dựng đường từ bảng tra.

### `id-video-hoa-thuong` · id YouTube bị hạ chữ thường

`idVideo()` hạ **cả** url về chữ thường rồi mới bóc id. Chữ thường cần cho **một**
việc — so tên miền — nhưng nó được áp cho cả phần id, và id YouTube là base64url
**phân biệt hoa–thường**.

Đo trên byte đã build: `youtube.com/watch?v=dQw4w9WgXcQ` → id `dqw4w9wgxcq`, tức
`src` iframe trỏ vào **một video khác**. Id 11 ký tự trên bảng 64 ký tự có 26 chữ
hoa ⇒ xác suất không ký tự nào hoa là `(38/64)^11 ≈ 0,0028`. **~99,7% video
YouTube hiện nhúng sai.**

**Vì sao 70 cổng trước đó không cổng nào kêu.** `dqw4w9wgxcq` vẫn khớp
`^[A-Za-z0-9_-]{11}$`. `id_mau` hỏi *"id có đúng HÌNH DẠNG không"* và câu trả lời
là **có** — id sai vẫn đúng hình dạng. Đo hình thức thay vì đo sự thật, lớp lỗi đã
gặp nhiều lần ở dự án này. Cổng mới so **từng ký tự** với id kỳ vọng.

Và ba file test nhắc `video_host` đều dùng id toàn chữ thường hoặc toàn chữ số:
`tiktok` là số nên `.toLowerCase()` vô hại ở đó. Bug ẩn sau đúng cái host duy nhất
miễn nhiễm với nó — nên §5 giữ một ca tiktok, để phép sửa không làm hỏng nó.

**Cổng chạy BYTE ĐÃ BUILD**, cắt thân `idVideo` ra khỏi `gn.js` rồi `new Function`.
Chép tay một bản thứ hai là kiểm bản chép — bản chép luôn đúng vì tôi vừa viết nó.

**§3 kẹp phép sửa từ phía kia:** `YouTube.COM/watch?v=…` vẫn phải nhận ra host. Bỏ
luôn `.toLowerCase()` thì §2 xanh mà §3 đỏ. Phép sửa đúng là hạ **riêng** phần
host — cùng hình dạng `normalize_url()` phía Python đã dùng
(`chu = duong.lower().split("/", 1)[0]`). Hai nơi, một luật.

### `man-video` + `man-tai-lieu` · bảy AC trỏ vào hư không suốt từ C0

Hai spec `M10_tailieu` và `M11_video` khai **bảy** AC bằng
`cmd: node test/man-video.test.js` / `man-tai-lieu.test.js` từ lúc FR-038 mở
module — và **hai file đó chưa từng tồn tại**. `check_g6b` có nhìn thấy: nó in
`KHÔNG ai sinh: 1` / `: 2`. Nhưng dòng đó **cảnh báo chứ không đỏ**, nên suốt
nhiều đơn vị việc không ai phải dừng. Một cổng cảnh báo là một cổng đọc-thì-biết,
và người ta chỉ đọc khi đã nghi.

Hai spec đang **FROZEN**, nên đường tắt "sửa spec cho nó trỏ sang cổng đã có"
không mở. Viết đúng hai cổng chúng khai.

**Vế nặng nhất, và không cổng nào trong 71 file đang đo nó:** mở màn `/video/`
phải **0 request ra ngoài**. `no-leak.test.js` — cái tên gần nhất — đo **listener**
rò, không đo **request**. Nhúng video là lần đầu sản phẩm này gọi ra mạng ngoài;
một màn danh sách tự gọi youtube là gửi IP người đọc cho bên thứ ba mà không ai
bấm gì.

Đo được lúc viết: **0 iframe, 0 `src`/`href` tuyệt đối ra ngoài** ⇒ cổng xanh
ngay. Nên nó tự chứng minh mình **đỏ được**: chèn một iframe youtube vào bản sao
HTML rồi đòi cả hai vế bắt. Một cổng xanh trên mã đúng mà chưa ai thử phá thì
chưa biết nó bắt gì — trong dự án này đã hai lần một cổng xanh vì **phép cắt sai
chỗ**, không vì luật đúng.

**Không đo lại thứ đã có cổng.** `o-media-sua.test.js` §3 đã đo vế kết quả của
M10 AC-2.2.2 (`sha256` không đổi qua PUT). `man-tai-lieu` đo vế **cơ chế** mà
spec nêu đích danh: *"và điều đó đúng vì form CÓ ô `media`, không vì `FM_GOC` giữ
hộ"*. Kết quả đúng nhờ may thì vẫn đúng — cho tới hôm nó không.

**Tôi suýt sửa MÀN thay vì sửa PHÉP ĐO.** §4 của `man-video` đo ô chủ đề bằng
tiền tố id `nv-` tôi tự nghĩ ra; nó FAIL trong khi ô **có thật** (id là `vd-`).
Nếu tin phép đo, việc tiếp theo là đi thêm một ô đã có. Cả hai cổng nay đo hai vế
độc lập — **chữ người đọc thấy** và **một ô tồn tại cho chiều đó** — không đo một
cái tên riêng tôi đoán.

Và mỗi cổng mang bằng chứng phép đo **không mù**: `man-tai-lieu` đòi khối `v-all`
(Tổng hợp) có nhiều hơn một loại. Ba mục "màn chỉ hiện tài liệu" vẫn xanh nếu tôi
cắt nhầm vào một khối khác cũng chỉ chứa thẻ tài liệu — không gì kêu cả.

### `page-weight` so theo KB ĐÃ LÀM TRÒN — nhường 511 byte quá trần

`const kb = (s) => Math.round(byteLength(s) / 1024)` rồi `ok(n <= tran)`.
`Math.round(102911 / 1024)` là `100`, và `100 <= 100` **cho qua**. Cổng im lặng
nhường tới **511 byte** quá trần danh nghĩa.

Dự án nói rõ về đúng con trần này: *"FR-027f · gn.css 160 → **100**. SIẾT, không
nới."* Một cổng lặng lẽ nhường 511 byte là **một nửa lần nới trần mà không ai
quyết** — nó làm đúng thứ FR-027f cấm, chỉ khác là không ai nhìn thấy.

Không phải giả định xa: đo lúc sửa, `gn.js` dư **974 byte**. Thêm 1 KB nữa thì
cổng vẫn xanh trong khi bundle đã qua trần.

**So theo byte, hiện theo KB.** `kb()` giữ nguyên — người đọc không nghĩ bằng
byte. Câu báo nay mang cả hai: `gn.js 99 KB (101426 / 102400 byte)`.

Phép **sắp xếp** tìm trang nặng nhất cũng sắp theo KB làm tròn: hai trang lệch
400 byte đổi chỗ được, và câu lỗi sẽ nêu **sai tên trang**. Đổi luôn sang byte.

**Răng tự chứng minh** thay cho đỏ-trước: dựng một chuỗi dài đúng 100.499 KB rồi
đòi *phép so cũ cho qua* **và** *phép so mới chặn*. Hai phép cho cùng kết quả ⇒
hoặc lỗ không tồn tại, hoặc phép đo sai — câu lỗi nói thẳng *"đừng sửa mã, sửa
phép đo này trước"*. Kèm ca âm: một file **đúng bằng** trần vẫn phải qua; chặn cả
nó là siết quá tay, và một cổng đỏ oan bị người ta tắt chứ không bị người ta sửa.

Không một con trần nào bị đổi. Đây là siết **phép so**.

**Mở rộng — cùng lỗ ở `he-kinh`, và một hồ sơ cho thấy nó ĐÃ lọt thật.**

`sua-dung-man.test.js:98` mang sẵn ghi chép từ C6b: *"điều đó vừa lọt thật:
`gn.js` **102666 byte** báo '100 KB (ngưỡng 100)' và XANH"*. Cách chữa lúc đó là
đặt một phép so byte ở **cổng khác** làm chốt chéo — chữa triệu chứng ở nơi khác,
để nguyên cái cân hỏng. Chốt chéo giữ lại: một bất biến quan trọng đo ở hai nơi
độc lập thì một nơi hỏng không làm mất cả hai, và nó là hồ sơ.

`he-kinh` mắc y hệt (`Math.round(size/1024) > 500` cho lọt ảnh 512511 byte), và nó
hỏng thêm một phép kiểm thứ hai trong cùng file: *"Trùng ảnh: hai file cùng
**byte**"* — chú thích nói byte, phép so dùng KB đã làm tròn, nên hai ảnh cách
nhau 400 byte bị báo **trùng**. Sai theo chiều **báo động giả**, chiều mà người ta
học cách bỏ qua.

Một biến tên `kb` giữ giá trị byte chính là hình dạng của cả lớp lỗi này.

### `filter-counts` · hai phép kiểm báo "ok" mà không đo gì

Chính output của cổng đã nói điều đó suốt:

```
ok   nhãn đếm "(trống — danh mục rỗng)" đúng dạng
ok   hàng sắp giảm dần:                       ← không có gì sau dấu hai chấm
```

Kho mock không có nhãn nào đang dùng — **trạng thái hợp lệ**, emitter khai rõ
`ccount` rỗng khi danh mục rỗng. Hệ quả: `mCc` là `null` nên `if (mCc) ok(…)`
**không chạy và không in dòng nào**, còn `soTrongHang` rỗng nên `[].every(…)` đúng
vô điều kiện.

Phép thứ nhất **biến mất không dấu vết**. Phép thứ hai **in ra chữ "ok"** trong khi
tập nó xét là rỗng.

**Bằng chứng nó thật sự chết:** phá `.sort` ở `trang.mjs:590` trước bản vá ⇒ cổng
vẫn XANH. Sau bản vá ⇒ ĐỎ, câu lỗi in `1 2 3`; phục hồi ⇒ sha256
`5d0d03b9be187164` y hệt.

**Bản vá dùng một bản render riêng**, không đụng `kn`: cả chục phép khác dựa vào
nó, và kho mock rỗng nhãn là trạng thái hợp lệ không nên bị ép đổi. Gieo 3 khái
niệm với **3 · 2 · 1** lượt dùng ⇒ thứ tự đúng là `3 2 1`.

Kèm hai phép **tự kiểm vật liệu** — một cổng không kiểm vật liệu của nó là cổng
chưa biết mình đo cái gì: `> 0` hàng nhãn, và `>= 2` hàng mang số (dưới 2 thì
`.every` lại đúng vô điều kiện, chỉ khác là chết ở chỗ mới). Và `if (mCc)` đổi
thành `ok(mCc !== null, …)` rồi mới `if`: im lặng bỏ qua là thứ phải bị chặn.

**Quét cả 19 chỗ `.every(` trong bộ cổng** — `api-crud` có `total === 3` chặn
trước, `script-runs` có `khoi.length - 1 >= 2`, `hai-chieu-facet` có
`ng.length > 0` trong vòng ngay trên. Chỉ `filter-counts` không có ai canh vật
liệu.

### Neo `(?:^|\})` nuốt dấu `}` — phép quét CSS chỉ thấy một nửa số luật

Đo trên `cssGoc` của `cac-man-con-lai`: neo cũ thấy **416** luật, bỏ neo thấy
**832**. Neo tiêu thụ dấu `}` của luật trước, nên với `matchAll` vị trí quét đã đi
qua nó và luật kế tiếp không còn dấu `}` nào ở ngay trước để khớp — thấy **cách
một luật**. Cùng bug đã sửa ở WO-015, nơi `[hidden]{display:none}` có thật mà cổng
báo *"thấy 0 luật"*.

**Nói cho đúng: hôm nay nó chưa sai.** Đếm theo từng selector các cổng thật sự
hỏi — `.top` 3·3 · `.wrap` 2·2 · `.mid` 1·1 · `.tb` 2·2 · `.view` 1·1 — hai neo cho
cùng kết quả. Sửa vì nó đúng **do may**: một luật hiện ra hay không phụ thuộc vị
trí chẵn/lẻ trong chuỗi luật của cả file, và thêm một luật **không liên quan** ở
phía trên là đổi nhịp.

Nặng nhất ở `rail-trai` và `ui-ba-man`: chúng `.map()` **mọi** match chứ không lấy
cái cuối, nên một luật ghi đè ở phía sau rơi vào nhịp bị bỏ là **vô hình**.

`[^}]*` không thể vượt qua một `}`, nên nó không tràn sang luật khác được — **neo
là thừa ngay từ đầu**. Thay bằng `(?:^|[};])` + cờ `m` (thiếu `m` thì `^` chỉ có
nghĩa ở đầu **chuỗi**). Bảy chỗ, ba file.

**Kèm một phép kiểm chết:** `ok(!/max-width:840px/.test(cuoi(".qw .nw")))` đúng vô
điều kiện — luật đó đã bị xoá cùng màn Chờ duyệt (FR-033), `.qw` chỉ còn trong một
chú thích. Không xoá (mã chết của người khác); ô backlog đã mở.

**Bài học về phép đo:** bản dựng lại `cuoi()` của tôi qua `node -e` báo *"rỗng cho
mọi selector"* và tôi suýt kết luận cổng hỏng nặng. Sai nằm ở phép đo — bash nuốt
escape. Chỉ khi đo bằng **chính file cổng** (chèn một dòng in, chạy, xoá) mới ra
sự thật: 6/7 selector tìm thấy bình thường.

### `ba-duong-nap-that` · một người, ba việc, MỘT kho

Từng mảnh đã có cổng riêng. Thứ **chưa ai làm**: một người dùng nạp bài viết,
tài liệu và video trong **một** phiên, rồi đọc lại bằng chính các màn họ sẽ mở.

**Vì sao vế đó khác:** mỗi cổng module gieo **chỉ loại của nó**, nên câu *"màn A
không lẫn loại khác"* ở đó xanh một cách **rỗng** — không có gì để lẫn. Chỉ khi
cả ba cùng nằm trong một kho thì phép lọc mới bị thử thật. Đây là chỗ canh luật
thường trực *"ba module tách biệt ở mọi tầng; chỉ Kho và Tổng hợp được gộp"* ở
tầng **dữ liệu thật**, không ở markup.

§6 xác nhận WO-022 sống sót end-to-end: `url_normalized` trả về
`youtube.com/watch?v=dQw4w9WgXcQ` — **chữ hoa còn nguyên** sau khi
`normalize_url()` của Python chạm vào.

**Lượt đầu cả ba đường trả 422 và tôi suýt báo "ba đường nạp hỏng".** Đọc hết
thông báo: `id: 'src_khoi1' does not match '^src_[a-z0-9]{6,}$` — fixture của tôi
sai, 5 ký tự thay vì 6. Thông báo nói đúng chỗ ngay từ đầu; cái thiếu là tôi chưa
đọc hết nó. Lý do đã ghi vào chính file cổng để lần sau không ai mất lượt đó.

### `vong-doi-ba-loai` · sửa · xoá · khôi phục, cả ba loại, một kho

Nửa sau vòng đời, và nó mang **luật nặng nhất**: **M09-R1** — byte hiện vật phải
sống sót lần xoá. `recycle` là một trong năm nhánh của `tham_chieu_media`; bỏ sót
nó thì **mỗi DELETE phá byte vĩnh viễn**, và `phucHoi()` sau đó **vẫn báo thành
công** (nó chạy lại validate, mà validate không bao giờ thấy blob).

`vong-doi-bai` đã đi vòng này cho **một** bài viết. Khác biệt: cả ba loại **cùng
một kho**, nên một `xoaBai` xoá nhầm bảng, hay một `recycle` chỉ phủ `articles`, sẽ
lộ ra.

**Ba lỗi harness, và cả ba đều đáng ghi hơn cổng:**

1. PUT kèm `slug` khác ⇒ server **từ chối hẳn** (400), không lặng lẽ bỏ qua. Nên
   phép *"slug không đổi"* xanh vì **không có gì đổi cả**.
2. DELETE đòi `If-Match`. Quên nó ⇒ cả ba trả 400, và **phép quan trọng nhất của
   cả file** — *"byte sống sót sau khi xoá"* — **xanh vì chẳng có gì bị xoá**. Đã
   thêm tự kiểm vật liệu: bản ghi phải thực sự rời danh sách trước khi nói bất cứ
   điều gì về byte.
3. Thay thân bài viết bằng một câu ⇒ 422 `Thiếu mục: 1, 2, 3, 4, 5…` — hồ sơ
   `phan-tich` đòi khung 5 mục, `thu-vien` thì không. Server phân biệt **đúng**.

Cả ba lần phản xạ đầu là *"hệ thống hỏng"*; cả ba lần là harness sai, và mỗi
thông báo lỗi đã nói đúng chỗ ngay từ đầu.

### `moc-fe-con-that` · hai đường nạp CHẾT HẲN vì đọc một ô đã gỡ

Người dùng báo: dán một URL youtube hợp lệ vào `/video/nap/` thì màn trả *"Địa chỉ
trong kho phải là chữ thường, số và dấu gạch nối"* — và **không còn ô nào để sửa
cái địa chỉ đó**.

WO-021 gỡ ô *"Địa chỉ trong kho"* đúng theo yêu cầu, nhưng hai hàm gửi vẫn đọc nó:
`G("vd-slug")` trả `null`, `slug` thành `""`, và phép kiểm ngay dưới từ chối chuỗi
rỗng ⇒ **luôn đỏ**. Bài viết sống sót vì nó tự suy. **Hai trong ba đường nạp chết
hẳn kể từ WO-021.**

`?.value ?? ""` **trông như** đã phòng thủ, nhưng cái nó phòng thủ lại rơi thẳng
vào một phép kiểm từ chối chuỗi rỗng. Hình dạng đáng nhớ: một `?.` làm lỗi im lặng
ở chỗ nó xảy ra, rồi nổ ở chỗ khác.

**Vì sao 75 cổng không bắt** — `format-chung` §2 kiểm `guiFormThat`, là hàm của
**bài viết**, đúng cái duy nhất không hỏng; `ba-duong-nap-that` POST **thẳng API**
nên bỏ qua cái nút; `man-video`/`man-tai-lieu` đo **markup**. Cả ba đo thứ **ở
cạnh** chỗ hỏng. Không cổng nào hỏi *"bấm nút thì có ghi được không"*.

Nên cổng này đo theo **cấu trúc**, bắt cả lớp: mọi `G("id")` phải trỏ tới mốc có
thật. Tìm ra **5** mốc treo, không phải 2. Ngoại lệ `kp-rac` ghi thành **bảng có
tên + lý do**, và cổng đòi ngoại lệ đó **vẫn đúng thực tế** — một danh sách bỏ qua
không ai kiểm sẽ che mất mốc khác.

**§4 — và một id TRÙNG mà §1 không hỏi tới.**

Người dùng báo tiếp: thêm *Chủ đề mới* ở `/khai-niem/` thì màn nói *"cần NGƯỜI
khai: label_vi"* trong khi ô "Tên hiển thị" **đã điền**.

`<dialog id="dlg-nhan">` và `<input id="dlg-nhan">` cùng tồn tại.
`getElementById` trả **phần tử đầu tiên** ⇒ cái dialog; dialog không có `.value` ⇒
`label_vi` luôn rỗng ⇒ 422. Hệ quả rộng: **không thêm được khái niệm hay chủ đề
nào qua giao diện** — chính là lý do các màn nạp hiện *"Danh mục đang trống"*.

Cùng id đó phục vụ **hai việc khác chạy đúng** (`showModal`/`close` vốn thuộc về
dialog), nên lỗi chỉ lộ ở một nhánh. Và một hệ quả âm thầm hơn: vòng dọn form
cũng trúng cái dialog, nên ô nhập **không bao giờ được xoá giữa hai lần mở**.

**§1 hỏi *"mốc có tồn tại không"*, không hỏi *"có đúng một không"*.** Id này tồn
tại — hai lần. Cổng đúng câu hỏi nhưng hẹp một bậc so với thứ cần canh; đây là
lần thứ hai liên tiếp một cổng vừa viết bỏ lọt đúng lớp nó tưởng đã phủ.

§4 quét **cả hai** bản shell, và thêm vế **hành vi**: ô đó phải là một `<input>` —
đo **tên thẻ**, không chỉ đo id, vì lần sau ai đó có thể gắn id ấy lên một
`<label>` và mọi phép chỉ-đo-id lại xanh.

**§5 — màn Danh mục không bao giờ gọi API.**

Người dùng báo: thêm khái niệm và chủ đề xong thì *"ko hiển thị lên web, dù tôi
thấy đã lưu vào DB"*. Trên **cùng một màn**, KPI hiện **01/01** còn danh sách nói
*"đang trống"*.

Dữ liệu đúng ở **mọi** tầng — yaml có, DB có, `GET /api/concepts` trả `tong:1`.
Lỗi là **FE không hỏi**: `[data-dm]` chỉ có trên các màn **nạp**, và `catNap()`
**cắt** các màn nạp khỏi mọi trang khác để tiết kiệm byte. Nên trên màn Danh mục
không còn mốc nào, `napLoaiDanhMuc` thoát ở `if (!moc.length) return []`, và API
không được gọi lần nào.

**Màn Danh mục cần chính dữ liệu, không cần ô tích của màn nạp.** Buộc phép đọc
vào mốc của một màn *khác* là buộc nó vào thứ có thể bị cắt đi — và đã bị. KPI
vẫn đúng vì nó do SSR dựng từ DB; chính sự lệch giữa hai đường trên cùng một màn
là manh mối rõ nhất.

**Cách khoanh vùng** (vài phút, không đọc mã đoán): `curl` server đang chạy của
người dùng ⇒ API đúng; rồi đếm `[data-dm]` trên hai trang ⇒ `/khai-niem/` **0**,
`/bai-viet/nap/` **4**.

§5 **tự chứng minh tiền đề** trước khi kết luận: đòi đúng 0 mốc `[data-dm]` trên
màn Danh mục *nhưng vẫn có* `#cb`/`#cchua`/`#catlist` — tiền đề sai thì §5 đang đo
một thế giới khác, và nó nói ra điều ấy.

**§6 — GỌI hàm, đừng chỉ ĐỌC nó.**

Người dùng báo: *"tôi thấy create file .md rồi nhưng hệ thống báo lỗi"*. Đúng
vậy — WO-028 xoá dòng khai `const oS = G("vd-slug")` nhưng để sót
`if (oS) oS.value = ""`, **nằm sau lời gọi POST**. Bản ghi được tạo thật, rồi
`ReferenceError` bị `try/catch` của chính hàm nuốt và báo thành *"Không gọi
được /api/video — máy chủ chưa chạy?"*.

`node --check` chỉ bắt **cú pháp**. Và tôi vừa **đọc** chính đoạn đó khi sửa
WO-028 mà không thấy — đọc không phải phép đo. Mọi cổng FE của dự án đều đọc mã
hoặc markup; **không cổng nào gọi hàm**.

§6 gọi. Sandbox là `with` trên một `Proxy`: `has` trả true cho mọi tên, `get`
trả stub cho tên module biết trước và **ném** cho tên lạ.

**Vế quyết định, và là vế lượt đầu tôi đo thiếu:** hàm có `try/catch` riêng nên
lỗi bên trong **không ném ra ngoài** — cổng đầu tiên của tôi xanh dù bug còn
nguyên. Đo *"có ném không"* là đo sai chỗ. Phải đo **thứ người dùng thấy**: câu
cuối `kqTV` phải là *"Đã ghi …"*.

**Và vì gọi thật, nó lộ hai lỗi nữa** ở đường tài liệu mà đọc mã không thấy:
`ghiBanGhiThuVien` POST vào **`/api/articles`** (bí danh) nên cổng riêng của
module tài liệu không chạy; và nhánh PUT đặt `title` làm **tuỳ chọn của `fetch`**
thay vì trong `body` — `fetch` bỏ qua khoá lạ không cảnh báo gì, nên **sửa một
tài liệu là mất tiêu đề, im lặng**.

### `media-cua-so` §5 · `no-referrer` làm YouTube trả Lỗi 153

Người dùng mở cửa sổ đọc của một video ⇒ khung nhúng hiện **Lỗi 153 · Lỗi cấu
hình trình phát video**.

`nhungVideo()` đặt `referrerpolicy="no-referrer"`, và YouTube **từ chối phát**
khi khung nhúng không gửi `Referer`. Ý định riêng tư là thật, nhưng nó tắt luôn
tính năng.

**`curl` không phân giải được** — trang nhúng trả HTML giống nhau, và chuỗi
"153" có trong bảng lỗi chung của cả hai bản. Đếm chuỗi ở đây là phép đo mù.

Thứ phân giải được là **thí nghiệm một biến** trên trình duyệt: hai `<iframe>`
cùng trang, cùng video, đổi **đúng một** thuộc tính, rồi chụp màn hình.

```
A · referrerpolicy="no-referrer"  →  Error 153 · Video player configuration error
B · referrerpolicy="origin"       →  video nạp bình thường
```

`origin` là **chặt nhất trong những giá trị còn chạy được**: gửi
`http://localhost:8787`, không gửi đường dẫn trang đang đọc.

§5 đo **giá trị** thuộc tính chứ không đo hành vi, và nói ra vì sao: một cổng
gọi YouTube mỗi lần chạy là cổng đỏ theo **đường truyền**, không theo mã. **Hai
vế**, không một: cấm `no-referrer` **và** đòi một giá trị *có* gửi origin — chỉ
cấm `no-referrer` thì `same-origin` lọt qua và hỏng y hệt.

**Và chú thích tôi vừa viết đã phá chính cổng của tôi**: nó chứa tên miền nhúng,
mà §2 có một phép kiểm âm tìm đúng chuỗi đó trong `.ts` (chống gõ tay host). Cổng
đúng, chữ của tôi sai.

### `nghe-hai-loopback` · ~205 ms mỗi request nằm ở bước CONNECT

Người dùng: *"load hơi lâu"*. Mười màn đều ~230 ms phía server, **đồng đều**,
với kho chỉ 1 bản ghi ⇒ chi phí **cố định mỗi request**. Và nó trúng cả
`/static/bg/index.json`, một file **0 KB** — đó là phép đo khoanh vùng nhanh
nhất: một tài sản tĩnh rỗng mà cũng chậm thì không thể đổ cho renderer.

```
localhost:8787    connect 207 ms   ttfb 215 ms
127.0.0.1:8787    connect   1 ms   ttfb   8 ms
```

`server.listen(CONG, "127.0.0.1")` chỉ nghe IPv4; `localhost` trên Windows phân
giải `::1` **trước**, bị từ chối, client chờ rồi mới thử lại. Sau khi thêm một
listener `::1`: `/` **229 → 39 ms**, `/kho/` **226 → 12 ms**.

**Hai giả thuyết bị phép đo bác bỏ** — ghi lại vì đây chính là giá trị của việc
đo trước:

1. *"Ảnh nền quá nặng"* — chúng chiếm 87% trọng lượng trang, nhưng
   `toi_uu_anh_nen.py --xem` chỉ giảm **10%**: gần như mọi ảnh đã dưới ngưỡng.
2. *"Thu nhỏ ảnh sẽ giải mã nhanh hơn"* — đo thẳng: 2.1 MP mất 49 ms, 4.4 MP mất
   53 ms (gần như **phẳng**), và thu nhỏ lúc giải mã còn **chậm hơn** (71–138 ms).

Cả hai bản vá đều hợp lý, cả hai đều sai, và cái đúng nằm ở chỗ không ai nhìn.

**Ca âm giữ ràng buộc an ninh**, và nó không phải trang trí: một bản vá "cho
nhanh" bằng `0.0.0.0` cũng làm vế tốc độ xanh. Cổng liệt kê địa chỉ **ngoài**
loopback của máy rồi thử nối thật — `192.168.1.35`, `172.29.176.1` đều không nối
được. Kèm phép tự kiểm vật liệu: máy phải **có** địa chỉ ngoài để thử, không thì
ca âm đúng vô điều kiện.

**ĐÍNH CHÍNH mục trên (`Neo `(?:^|\})`…`) — tôi ghi sai nguyên nhân.**

Đo lại, tách từng biến:

```
neo cũ  (?:^|\})   KHÔNG cờ m : 417
neo cũ  (?:^|\})   CÓ cờ m    : 826
neo mới (?:^|[};])  có cờ m    : 826   ← đóng góp ĐÚNG BẰNG KHÔNG
không neo                      : 834
```

Thứ thật sự chữa là **cờ `m`** — thiếu nó thì `^` chỉ có nghĩa ở đầu **chuỗi**.
Việc nới lớp ký tự từ `\}` sang `[};]` không thay đổi một luật nào. Bản vá vẫn
đúng (417 → 826), nhưng đúng vì tôi thêm `m` cùng lúc, **không** vì lý do đã viết.

Và còn sót **1 selector thật** (`.st.dr`), không phải 8 — hai cái kia là bước
keyframes (`0%,100%`, `from`).

Đường đúng hẳn là **quét ngoặc theo độ sâu**, không neo gì cả.

### `form-van-xuoi` · người gõ CHỮ, máy gõ dấu

Người dùng, nguyên văn: *"user chỉ nhập text, tuyệt đối ko nhập dấu markdown
như `###` hay `##`, `***`… form của ta định nghĩa sẵn"*.

Đo trước khi viết cổng: **7/8 ô đã đúng** — `gomKhung()` vẫn tự sinh `## 1.` và
`### 3.1`. Sai đúng **một** ô: `3.4 Tinh túy`, vì cấu trúc lồng của nó nằm BÊN
TRONG một textarea, nên gợi ý của ô đó buộc phải là markdown thật.

Cổng **chạy hàm**, không đọc mã: form do `dungKhung()` dựng lúc chạy, không nằm
trong `shell.html`. Ba lần chính cổng này xanh mù, và cả ba đều đáng ghi:

| lần | hộp cát thiếu | hậu quả |
|---|---|---|
| 1 | `define_KHUNG_default` (tên esbuild nội `__KHUNG__` thành) | form 0 byte, ba phép "không markdown" đúng **vô điều kiện** |
| 2 | `addEventListener` / `createElement` trên mốc | `themTinhTuy()` không chạy ⇒ **ô con không tồn tại** để mà đo |
| 3 | — | §3 đọc thân `gomKhung` tìm `####`, nhưng `####` do `gomTinhTuy()` sinh ⇒ **đỏ oan** |

Chốt vật liệu giờ **`process.exit(1)`**, không chỉ cảnh báo: một bảng toàn `ok`
dựng trên 0 byte form còn tệ hơn một cổng đỏ.

Và §3 đo **vòng khép**: `gomTinhTuy()` → markdown → `raiTinhTuy()` → ô con, rồi
so giá trị. Không khép thì mở một bài cũ ra sửa là mất mục 3.4, âm thầm.

### `bang-khai-khong-mo` · byte chết trong bundle, và chiều ngược

Sinh ra vì WO-037 tốn ~2,1 KB JS trong khi `gn.js` chỉ còn 1,8 KB dưới trần.
Trần **không được nới** (tiền lệ `page-weight.test.js:85-89`), nên phải tìm mỡ.
Mỡ nằm ở bảng khai nhúng qua `define`: nhúng NGUYÊN bảng thì mọi trường đi theo,
kể cả trường chỉ Python đọc.

| khoản | byte | vì sao chết |
|---|---|---|
| `$magic_la` | 166 | chú thích cho `magic` — mà `magic` đã bị chiếu ra từ FR-036. `lotComment` chỉ lột `$comment*` nên khoá `$` tên khác **lọt im lặng** |
| `locator` | 140 | luật của validate phía Python |
| `phien_ban` · `tran_tu_mem` · `tran_tu_thu_vien` | 56 | chỉ có trong **khai báo kiểu** TS — thứ biến mất lúc biên dịch |
| `loai_thu_vien` | ~90 | FR-038/S5 đã ghi "chưa có consumer JS"; vẫn đúng |

Cổng hỏi **hai chiều**, và chiều B mới là chiều đắt:

- **A · thừa** — khoá trong bundle mà FE không đọc ⇒ tải về rồi bỏ.
- **B · thiếu** — FE đọc một khoá phép chiếu vừa bỏ ⇒ `undefined` lúc chạy, form
  thiếu một ô, **không cổng nào đỏ**.

Ba đỏ oan của bản đầu, cả ba là lỗi ĐO chứ không phải lỗi mã:

1. cắt khai báo kiểu bằng `interface|type` — file dùng `declare const X: {…}` ⇒
   cắt **0 byte**, và phép tự kiểm §0 tố đúng chỗ đó.
2. tìm khoá bằng regex trên văn bản chưa tách chuỗi ⇒ `"Chuyển giao:"` thành một
   "khoá" tên `giao`.
3. đòi FE nhắc tên từng khoá của `__DUONG__` — nhưng đó là bảng **tra**, khoá của
   nó là dữ liệu, FE tra động `DUONG[id]`. Đo nhầm **loại bảng**.

Kết quả: `gn.js` **102314 / 102400** — dưới trần, không đổi một con số trần nào.
Dư **86 byte**: lần thêm FE tới phải tách bundle hoặc siết tiếp, không nới.

---

## `loi-tho-cua` — hai cửa LÕI để FE gọi được THỢ (T08-20)

`web` **gọi** `:8790`; **trình duyệt KHÔNG**. Hai chủ thể khác nhau, và toàn bộ
giá trị của hai cửa `GET /api/model` + `POST /api/job` nằm ở chỗ đó: `POST /job`
của THỢ đòi `X-Khoa-Loi` (`M12-R7`), nên trình duyệt gọi thẳng nghĩa là khoá
nằm trong JS tải về máy người dùng — mở DevTools là thấy khoá.

Nên **phép đo nặng nhất** của cổng là *khoá không bao giờ ra khỏi server*. Đo
được nhờ dựng một **THỢ GIẢ** (`thoGia()`): một `:8790` tối thiểu ghi lại đúng
thứ nó NHẬN được. Gọi vào THỢ thật thì không quan sát được `web` **gửi** gì —
chỉ thấy nó trả gì về, mà đó là câu hỏi khác.

Bốn thứ cổng canh, mỗi thứ một lớp bệnh:

| đo | bệnh nếu thiếu |
|---|---|
| `dich` không ra thân trả về, **kể cả khi đầu kia trả nó** | đích egress lọt ra trình duyệt; và cửa LÕI *tin* đầu kia đã lọc |
| `X-Khoa-Loi` có trong request `web`→THỢ, không có trong thân trả về / `gn.js` | khoá dịch vụ ra máy người dùng |
| payload khai `nguoi_dung_id: 999` bị BỎ trước khi chuyển tiếp | client tự khai danh tính (`FR-047 §2.1 L1`) |
| THỢ chết ⇒ **502** kèm câu đọc được, có timeout | 500 trần nói "lỗi ở tôi" khi lỗi ở dịch vụ sau; hoặc request treo |

Thiếu phiên thì cổng đòi **VẪN tạo việc** với `nguoi_dung_id` null + một dòng
`audit_log`, và đòi KHÔNG có `X-Nguoi-Dung`. Không phải sự lỏng lẻo: đăng nhập
web chưa dựng, mà rơi về "người dùng mặc định" là fail-open — null **có vết** là
trung thực. Khi đăng nhập web có, phép đo này đổi thành DENY.

Cổng ĐỎ TRƯỚC mã: 10 lỗi, toàn bộ 404 vì hai route chưa tồn tại.

---

## `chung-cat-ui` — cụm nút CHƯNG CẤT trong cửa sổ đọc (T03-92)

Chỉ đạo: nút nhúng vào **TẤT CẢ** multiwindow. Nên phép đo là **MỘT component
dùng chung**, không hai nhánh `if` cho hai loại cửa sổ — hai nhánh thì nhánh
thứ hai sẽ lệch, và lệch ở đây nghĩa là một loại bản ghi mất nút mà không ai
thấy.

Cổng này **đảo chiều một phép đo** sau khi `T08-20` mở cửa proxy. Bản đầu đòi
mã FE gửi `X-Khoa-Loi` + `X-Nguoi-Dung`; sau T08-20 đó là **thứ phải CẤM** —
khoá dịch vụ đọc từ env SERVER, và một chuỗi khoá trong bundle nghĩa là mở
DevTools là thấy nó. Phép đo đổi từ KHẲNG ĐỊNH sang PHỦ ĐỊNH.

Hai bài học ĐO, cả hai từng làm cổng này đỏ oan:

- **Đo BUNDLE, không đo nguồn.** Nguồn có hai dòng *chú thích* giải thích
  "không gõ `:8790`", và cổng đọc chính câu giải thích rồi tố nó. Bundle là
  phép đo đúng hơn: thứ tới trình duyệt là bundle, và esbuild cắt chú thích.
- **Đo LỜI GỌI, không đo quy ước đặt tên.** Bản đầu đòi `/toast|bao[A-Z]/`; hàm
  báo của dự án tên `bao(loi, chu)`, chữ thường — cổng đỏ vì cách đặt tên.

Bốn phép phủ định đi qua `okPhuDinh()`: *"mã không rẽ nhánh theo 201"* tự đúng
khi chưa có dòng mã nào, và một cổng xanh RỖNG tệ hơn đỏ vì nó trông như đã
được canh.

## `cat-binh-luan-js` — phép cắt bình luận JS (T03-101)

Cắt bình luận trong JS **không** an toàn như trong CSS: `//` sống được trong
chuỗi (`"http://x"`), trong regex literal, và trong template literal nhiều
dòng. Một phép cắt quá tay làm hỏng mã **im lặng** — bundle vẫn tải, và vỡ ở
một nhánh không ai bấm tới trong lúc test.

Nên cổng đo BA thứ, và thứ ba mới đắt:

| đo | bệnh nếu thiếu |
|---|---|
| bundle nhỏ hơn nguồn | phép cắt không chạy |
| **số dòng bằng nhau** | bình luận bị XOÁ DÒNG ⇒ số dòng DevTools lệch, đúng thứ `FR-027f` từ chối khi nó từ chối minify |
| `new Function(bundle)` parse được | kích thước không phân biệt "cắt đúng" với "cắt mất một dấu ngoặc" — thứ hai cũng nhỏ hơn |

Năm ca bẫy: URL trong chuỗi · `//` trong nháy đơn · `/* */` trong template
literal · regex literal chứa gạch chéo · phần mã SAU một chuỗi.

⚠️ Fixture phải **BỌC IIFE** y như `assets.mjs`: cả ba file khai
`khiNav`/`khoiDong`/`gan`, nối thẳng thì `new Function` báo lỗi TRÙNG TÊN chứ
không báo lỗi của phép cắt. Bản đầu nối thẳng và tố oan đúng chỗ đó.

---

## `loi-nhap-cua` — năm cửa NHÁP cho trình duyệt (T08-22)

Bảng nháp là chỗ **CHƯA vào kho** (`FR-046`), và năm cửa này là đường duy nhất
người chạm vào nó. Cổng đo bằng lời gọi **KHÔNG mang khoá nào** — đúng thứ
trình duyệt gửi. Nếu mã nằm sau `quaCong` của `loi-cua.mjs` (bảy cửa của MÁY,
đòi khoá dịch vụ) thì mọi phép đo trả 403, và đó là cách phát hiện chỗ đặt sai.

Phép đo nặng nhất là **THỨ TỰ** ở cửa DUYỆT: validate `--strict` chạy TRƯỚC khi
`trang_thai` đổi. Cổng gieo một nháp HỎNG (thiếu `id`), đòi 422, rồi đọc lại
hàng và đòi nó **vẫn `nhap`**. Một cửa đổi trạng thái trước rồi mới validate sẽ
để lại hàng nói `da_duyet` trong khi kho không có file — hai nguồn chân lý, và
nguồn sai là nguồn người đọc trước.

`§7` đo **chiều ngược**: `POST /api/nhap-chung-cat` (cửa C2 của MÁY) không khoá
phải VẪN bị chặn. Mở cửa cho NGƯỜI không được nới cửa của MÁY.

Bốn bài học ĐO, cả bốn từng làm cổng này đỏ trong khi mã đúng:

- **Fixture "bản nháp hợp lệ" phải lấy hình dạng từ một BẢN GHI THẬT**
  (bản ghi `docs/xgboost-taylor-bac-hai` — nay đã vào thùng rác).
  Bản tự nghĩ thiếu 5 trường
  (`url` · `protocol_version` · `analyzed_at` · `one_liner` · `conformance`) và
  **9 mục** (1–5 + 3.1–3.4).
- Và nó còn trượt hai luật **NỘI DUNG**: mục 1+2 dưới 25% toàn bài, mọi mục
  phải có địa chỉ máy đọc được (`[§II.4]`). Hai luật đó bắt fixture viết như
  một bài thật — đúng như vậy.
- **`dungKho()` trả `{ kho, rac, don }`, phải DESTRUCTURE.** Gán cả object vào
  `kho` làm server CHẾT `unable to open database file`, và cổng chỉ thấy
  `TypeError: fetch failed`. ⚠️ `loi-cua-http.test.js` truyền cả object y như
  vậy và VẪN xanh — vì nó không bao giờ GHI vào kho.
- Nên `batServer()` nay trả thêm **`loi()`** — đọc stderr của tiến trình server.
  Một cổng không đọc được stderr chỉ báo được *"không kết nối được"*, và ba
  hướng chẩn đoán đầu của tôi đều đi sai chỗ vì thiếu đúng dòng đó.

⚠️ Hai phép PHỦ ĐỊNH ở `§2`/`§3` có chốt chống-xanh-rỗng: `!("x" in {})` đúng
ngay cả khi cửa trả 404, và `undefined === undefined` cũng đúng — nên chúng đòi
danh sách có hàng / hai bản là chuỗi thật TRƯỚC khi so.

---

## `chung-cat-quan-ly` — khối việc trên Dashboard + badge rail (T03-95)

Cổng này đo **BA RÀNG BUỘC BYTE** trước khi đo tính năng, vì chính chúng quyết
hình dạng khối — không phải sở thích:

```
trang chủ HTML  61430 / 61440  ⇒ dư   11 byte ⇒ 0 byte HTML mới trong shell
gn.css         102038 / 102400 ⇒ dư  362 byte ⇒ 0 luật CSS mới
gn.js           98277 / 102400 ⇒ dư 4123 byte ⇒ khối ~1512 lọt
```

Nên phép đo là: khối **dựng bằng JS**, cắm vào mốc `#kpi` ĐÃ CÓ, và shell không
mọc thẻ nào. Cộng vế phủ định `không luật .cc-tc/.cc-dash/.ccbadge mới`.

**Badge dùng luật `[data-mount]:empty{display:none}` sẵn có, 0 nhánh `if`** —
cổng đòi `data-mount` trong thân `ccBadge` VÀ đòi nó KHÔNG tự ẩn bằng JS: hai
cơ chế cho một hành vi là hai chỗ phải sửa, và chỗ thứ hai sẽ lệch.

⚠️ **Đọc `maFeNguon()`, không đọc một file.** Bản đầu ghim khối vào
`chungcat.inline.ts` theo `phạm_vi_ghi` của PM; thực tế nó phải nằm ở BUNDLE
CHUNG (thẻ `<script>` chunk tốn 48 byte HTML mà trang chủ dư 11). Một cổng ghim
chỗ đặt sẽ đỏ khi chỗ đặt đúng đổi — lớp lỗi đã trúng SÁU cổng ở `T03-104`.

**Điều cổng này KHÔNG bắt được, ghi ra để nhớ**: ba ô số cắm vào `#kpi` nằm
trong panel tiêu đề **KHO**, nên "đang chạy 2" đọc ra như 2 bản ghi kho — mọi
con số đúng, mọi phép kiểm xanh, và khối **nói sai vì chỗ đặt**. Chỉ ảnh chụp
mới thấy; đã thêm một ô nhãn `chưng cất` đứng trước.

---

## `chung-cat-nhap` — màn hàng đợi nháp (T03-94)

Đây là màn người ta **KÝ DUYỆT một bản do máy viết**, nên cổng đo ba thứ mà nếu
sai thì người duyệt ký vào thứ họ không thấy:

1. **`⚠ đã tỉa N` dựng TRƯỚC cụm nút.** Phép đo là VỊ TRÍ trong chuỗi markup
   (`iTia < iDuyet`) — người đọc từ trên xuống, và một cảnh báo nằm dưới nút
   Duyệt là cảnh báo họ thấy SAU khi đã ký. Ba ca phân biệt: `>0` cảnh báo ·
   `0` "không có" · `null` **"CHƯA ĐO"** — `null` và `{so:0}` là hai câu khác nhau.
2. **Bản chưa sửa NÓI RA "Trùng bản AI gốc"** — im lặng đọc ra như "chưa tải xong".
3. **BA nút, không bốn.** `FR-046 §1` chưa có trạng thái "đã bỏ" nên `T08-22`
   chưa mở cửa Xoá; `S18` cấm render nút gọi đường chưa có.

Cộng ba ràng buộc NGÂN SÁCH, vì chúng quyết hình dạng màn: shell chỉ một **mốc
rỗng** (trang chủ dư 10 byte) · **0 luật CSS mới** (gn.css dư 362) · JS vào
chunk `chungcat`.

⚠️ **Hai bài học ĐO, cả hai tôi tự vấp trong chính lượt này:**

- Bản đầu neo vào tên hàm `ccNhapDung` mà mã đặt tên khác — đúng lớp lỗi đã
  trúng SÁU cổng ở `T03-104`. Đổi sang neo vào **mốc `v-chungcatnhap`**: shell
  khai nó, nên nó là hợp đồng thật, còn tên hàm là chuyện nội bộ.
- Phép `review_status` quét CẢ mã FE và trúng `ban.review_status = "approved"`
  của luồng duyệt bài KHO — một dòng hợp lệ, không liên quan. Tính chất cần giữ
  có PHẠM VI: *màn nháp* không được tự đặt trạng thái duyệt.


## Bốn cổng thêm ở đợt cửa sổ chưng cất

| cổng | giữ tính chất gì | vì sao neo như vậy |
|---|---|---|
| `tab-theo-doi-chung-cat` | tab *Việc của bạn* lọc theo slug đang đọc, nhịp poll có thật, dòng việc đọc được khi 0 việc | neo vào **mốc `v-cctab`** shell khai, không neo tên hàm — tên hàm là chuyện nội bộ của chunk |
| `chung-cat-hover` | chi tiết việc hiện dạng bảng NỔI, không đổ hết vào lưới | `WO-048`: dữ liệu nhiều thì lưới phẳng thành không đọc được |
| `sinh-transcript-ui` | *"sinh chữ tới đâu hiện tới đó"* — khối tiến độ đọc `tien_do` do THỢ tính | FE **không** suy tiến độ từ `giai_doan`: giai đoạn là enum bốn nấc, suy ra số câu từ nó là bịa một tiến độ |
| `hien-vat-gan` | hiện vật gắn đúng bản ghi nguồn | — |

**Bẫy chung của bốn cổng này**, ghi để lần sau đỡ mất thời gian: chúng đo **văn
bản mã**. Suite từng xanh trọn trong khi chunk ném `ReferenceError` ngay lần gõ
URL đầu — chỉ mở trình duyệt và bấm thật mới thấy. Cổng văn-bản-mã là lưới thô,
không phải bằng chứng chạy được.


## `mot-bien-mau` — một dữ kiện, một chỗ khai

`T03-115` · `WO-055`. Trần trang chủ vỡ (61915/61440) vì mỗi thẻ bài phát **hai**
`style=` inline cho **một** dữ kiện `source_type`: `border-top-color` ở `.cd` và
`background` ở `<b>` trong huy hiệu. Đo trên trang chủ: 176 `style=` / 6531 byte,
mười giá trị tốn nhất đều là màu theo loại.

Sửa: thẻ đặt **một** biến `--c`, CSS đọc. 61915 → 59292 byte.

**Cổng đo trên HTML DỰNG THẬT, không đọc mã nguồn** — cái cần giữ là byte đi tới
trình duyệt, và một phép đo trên mã nguồn vẫn xanh khi ai đó thêm inline ở chỗ
thứ tư. Ba vế:

| vế | giữ gì |
|---|---|
| 0 `border-top-color:var(--c-` + huy hiệu không mang `style=` | chính khuyết tật `WO-055` mô tả |
| thẻ CÓ `--c` và CSS CÓ luật đọc nó | chiều ngược — xoá inline mà quên đặt biến thì "sạch byte, hỏng giao diện" |
| trần ĐẾM ≤ 5 inline màu-theo-loại | chấm `.tp-c` là ngoại lệ CÓ CHỦ Ý (một inline cho một dữ kiện, và đổi nó lỗ 9 byte trên `gn.css` chỉ dư 22). Ngoại lệ được tồn tại, không được lớn dần mà không ai thấy |

**Bài học đo được trong chính lượt này:** suite dùng `&&` nên dừng ở file đỏ đầu
tiên. `page-weight` đỏ đã che `bay-man` suốt — và `bay-man` đang bắt một lỗi
THẬT: `/chung-cat/` khai nhóm `hethong` trong bảng khai mà markup còn để ở
`noidung`. Một vế đỏ nằm lại che mọi vế sau nó, nên "còn đúng một FAIL" không
bao giờ đọc được là "còn đúng một lỗi".


## `man-co-chunk-phai-cat` — màn có chunk riêng phải tự cắt

`WO-058`. Bug chủ dự án bắt: bấm menu `/chung-cat/` ra **màn trống**, F5 mới hiện.

Cơ chế: `chung-cat` khai `cat_khi_khac: false`, nên khung `v-chungcat` **rỗng**
đi theo mọi trang. `doiView()` chỉ điều hướng thật khi khung ĐÓ KHÔNG có
(`v in DUONG && !G("v-" + v)`) — thấy khung tồn tại thì nó hiện tại chỗ, trong
khi mã đổ nội dung nằm trong chunk  (URL sinh lúc chạy) chưa ai nạp.

Sửa xong lộ **lỗi thứ hai**, và nó mới là lỗi nguy hiểm: đổi bảng khai sang
`true` mà khung VẪN đi theo. `catMotMan` so `<div class="view" id="v-X">` đúng
từng ký tự, còn thẻ thật viết `<div class="view" id="v-chungcat" data-mount>` —
thêm một thuộc tính là **trượt im lặng**. Nay neo vào `id`, không vào cách viết
thẻ: thêm thuộc tính là chuyện bình thường, mất một màn thì không.

**Hai vế, và vế thứ hai là vế đáng giá:**

| vế | bắt gì |
|---|---|
| màn có chunk khai `cat_khi_khac: true` | bảng khai đúng |
| trang chủ KHÔNG mang khung rỗng đó (đo trên HTML **dựng thật**) | *bảng khai nói một đằng, emitter làm một nẻo* — chính là lỗi thứ hai |

Vế một xanh mà vế hai đỏ là đúng trạng thái sau khi sửa bảng khai. Một cổng chỉ
đọc bảng khai sẽ báo "xong" trong khi người dùng vẫn thấy màn trắng.


## `chunk-tu-chua` — chunk không được gọi hàm của `gn.js`

`WO-059`. Bug chủ dự án bắt: bấm **Ghi vào kho** ở `/video/nap/` không có gì xảy
ra. Console: `ReferenceError: nhanCua is not defined`.

Mỗi chunk bọc IIFE riêng (`assets.mjs`: *"chunk phải TỰ CHỨA"*), nên một hàm khai
trong `gn.js` KHÔNG nhìn thấy được từ chunk. `napvideo` gọi `nhanCua()` và
`thanTu()` — cả hai sống ở `multiwindow.inline.ts` — nên nó ném ngay **lần bấm
đầu tiên** của người dùng.

**Vì sao không cổng nào bắt suốt từ trước:** mọi cổng đo *văn bản mã*.
`nhanCua("vd","cat")` có mặt trong nguồn, trông đúng, và chỉ nổ khi CHẠY.
`plugins/WORKLOG.md` đã ghi đúng bài học này một lần — *"suite 2796 phép đo XANH
trong khi chunk ném ReferenceError ngay lần gõ URL đầu tiên"* — nhưng chưa ai
dựng cổng. Đây là cổng đó.

**Cách đo:** bỏ chuỗi + template khỏi mã chunk, rút mọi định danh được GỌI mà
chunk không tự khai (kể cả khai bằng destructuring `const { mo, bao } = mw()`),
trừ tên có sẵn của trình duyệt.

Ba tinh chỉnh, mỗi cái vì một lần đỏ oan:

| nhiễu | vì sao lọc |
|---|---|
| `x.map(` `x.replace(` | lời gọi PHƯƠNG THỨC thuộc đối tượng bên trái, không phải định danh tự do |
| `var(` `calc(` `translate(` | cú pháp CSS trong template literal, không phải hàm JS |
| `u1EDA…` | mảnh của escape `\uXXXX` còn sót sau khi bỏ chuỗi |

**Cổng tìm thêm hai thứ ngoài bug ban đầu:** `thanTu` cũng thiếu (cùng lỗi, chưa
ai bấm tới), và `chungcat` còn một `prompt()` sót lại sau `FR-022` — hộp thoại
trình duyệt khoá cứng cả tab, không theo giao diện, và trên vài trình duyệt bị
chặn hẳn nên nút im lặng không làm gì.


## `sau-khi-ghi-video` — màn nói tiếng người

`WO-060`. Ba chỗ chủ dự án bắt cùng một ngày, và cùng một gốc: **màn nói bằng
tiếng của MÁY**.

| chỗ | trước | sau |
|---|---|---|
| nhãn tab cửa sổ đọc | `src_thunghiemg` — `frontmatter.id`, chuỗi máy cắt 10 ký tự | tiêu đề, cắt 22 ký tự **theo từ**; tiêu đề đủ ở `title=` |
| báo sau khi ghi | `Đã ghi video/abc.md vào kho.` — một ĐƯỜNG DẪN FILE | tên bản ghi + *đang mở màn Video…* |
| sau khi ghi | đứng lại ở form vừa xoá trắng | chuyển sang màn Video sau 900ms |

Người vừa đăng ký một video không hỏi *file nằm đâu*; họ hỏi **xong chưa, và nó
đâu rồi**. Form trống rồi đứng im trả lời câu thứ nhất một cách mơ hồ và câu thứ
hai thì không. Chờ 900ms trước khi chuyển vì chuyển ngay thì câu xác nhận chớp
qua — người không chắc mình vừa bấm thành công hay chưa.

**Hai vết sửa sau đó, cả hai đều là cổng neo sai chỗ:**

- `sua-dung-man` cân `gnJsNguon` (bản CHƯA nén) so với trần của bản SHIP — chênh
  18 KB, báo vỡ trần trong khi trang thật còn dư rộng. Trần nói về thứ trình
  duyệt tải; nay cân `gnJs`.
- `moc-fe-con-that` neo vào chữ `/Đã ghi/`. Chú thích ngay trên nó nói rõ tính
  chất cần giữ là *"người dùng phải thấy báo THÀNH CÔNG, không phải một lỗi bị
  nuốt"* — nên nay neo vào **loại** thông báo (`"ok"`). Đổi câu chữ cho dễ hiểu
  không được làm cổng đỏ, mà `ReferenceError` bị nuốt vẫn bị bắt (loại `"loi"`).

**Một lỗi thật lộ ra nhờ hộp cát:** `(G("vd-title"))?.value.trim()` — `a?.b.c`
chỉ chặn khi `a` null; `b` có mà `undefined` thì `.c` vẫn ném, và `catch` bên
ngoài nuốt nó rồi báo *"máy chủ chưa chạy"* cho một lời gọi ĐÃ thành công.


## `o-chi-dan` — ô chỉ dẫn trong popup chưng cất

`T03-116` bước 2, sau khi chủ dự án duyệt wireframe `SCR-18`
(`WL-01M1SH3B8W5R2Y7K4NPQVDXC6T`). Cổng canh đúng những gì bản vẽ hứa.

| vế | giữ tính chất gì |
|---|---|
| `<details>` không `open` | ô GẤP mặc định — mở sẵn thì hộp thoại xác nhận thành một cái form |
| 0 chuỗi preset gõ cứng | chips dẫn xuất từ API; gõ cứng thì thêm một dòng bảng khai KHÔNG mọc thêm chip, hỏng luôn `AC4` của `T12-25` |
| trần đọc từ API | FE đếm cho người THẤY, server chặn cho THẬT — hai vai, không thay nhau |
| đếm NGƯỢC | người đang gõ hỏi *"còn bao nhiêu chỗ"*, không hỏi *"đã gõ bao nhiêu"* |
| spread có điều kiện | `chi_dan` chỉ vào body KHI CÓ; gửi chuỗi rỗng thì mọi job mang thêm một trường vào `sha256`+`egress`, và *"job không chi_dan chạy y như cũ"* thành lời nói suông |
| FE không tự viết câu lỗi trần | hai bản của một lời là hai chỗ để lệch; bản FE sẽ nói câu cũ sau lần server đổi trần |
| không disable nút Gửi | nút xám không nói vì sao nó xám — để nó bấm được và hiện nguyên văn 422 |

**`maxlength` đặt GẤP ĐÔI trần, không bằng trần.** Bằng trần thì trình duyệt cắt
ÂM THẦM đúng thứ server từ chối bằng 422 kèm lời giải thích — người gõ quá tay
không bao giờ biết câu mình viết đã cụt. Gấp đôi cho người gõ xong, thấy *"vượt
N ký tự"*, rồi tự rút.


## `viec-theo-loai` — việc theo LOẠI, hiện vật theo VAI

`WO-061`. Ba lỗi chủ dự án bắt cùng lúc, một gốc: **hệ coi mọi việc là việc
chưng cất, và coi mọi hiện vật là thứ đáng chiếm chỗ xem trước.**

| lỗi | cơ chế |
|---|---|
| video biến mất sau khi sinh transcript | `xemTruocHienVat` lấy cứng `media[0]`; `[0]` giờ là `.vtt` nên hàm thoát sớm, nhánh vẽ trình phát không bao giờ chạy. Dữ liệu KHÔNG mất — `url` YouTube nguyên vẹn; mất **chỗ** |
| cửa sổ việc ghi "Chưng cất" cho việc transcript | tiêu đề gắn cứng chuỗi ấy |
| hàng nháp `0 nháp` | việc transcript KHÔNG BAO GIỜ sinh nháp, mà câu kết chỉ mọi người sang hàng nháp bất kể loại |

Lỗi thứ ba là hệ quả của lỗi thứ hai: nhãn nói dối, người đi theo nhãn tới một
nơi chắc chắn trống, rồi báo là lỗi. **Đúng là lỗi** — chỉ không nằm ở hàng nháp.

Lọc theo cờ `chi_dan_xuat` của `media-mime.json` chứ không gõ cứng `text/vtt`:
gõ cứng thì loại dẫn xuất thứ hai (giọng đọc, tóm tắt máy) chiếm chỗ y hệt.

**Cổng `bang-khai-khong-mo` bắt được một tầng nữa:** `chi_dan_xuat` bị lược khỏi
bundle, nên phép lọc vừa viết sẽ **lặng lẽ vô hiệu** — `undefined` không đỏ ở
đâu cả. Đó đúng là lý do cổng ấy tồn tại.

**Ba trạng thái tách bạch** (chủ dự án chốt): dải tab nay là **Xem · Chưng cất ·
Transcript**, tab *Xem* LUÔN có. Trước đó tab bản ghi chỉ dựng khi có >1 bản,
nên với bản ghi thường, bấm sang Chưng cất là **mất đường về** bài đang đọc.

**Hai lối vào bản nháp đều mở CỬA SỔ**, không điều hướng: *xem bản nháp* ở cửa
sổ việc, và bấm thẻ ở `/chung-cat/`. Rời trang là mất cả cửa sổ nguồn lẫn cửa
sổ việc — mà cả điểm của flow là *vừa xem bản gốc vừa duyệt bản chưng cất bên
cạnh*. Việc CHƯA xong thì vẫn mở panel chi tiết: chưa có nháp thì không có gì
để đọc.


## `xuat-van-ban` — cửa xuất md · txt · docx · srt

`T08-33`. Nguyên tắc chốt: **chỉ xuất được dạng mà nội dung THẬT SỰ có.**

| loại | dạng | vì sao |
|---|---|---|
| bài viết · bản chưng cất | md · txt · docx · PDF(in) | mọi dạng dựng từ CÙNG một chữ |
| transcript | srt · txt · docx · file gốc `.vtt` | `.vtt` là hiện vật máy sinh; ba dạng kia là bản dựng lại |
| tài liệu PDF/doc/ppt · video | **chỉ file gốc** | *"tải xuống"* = trả lại đúng byte đã nạp |

Chuyển `pdf → docx` ở máy chủ là **dựng lại** một tài liệu mới mang tên tài liệu
cũ: mất bố cục, mất bảng, mất phông — và người nhận tưởng đó là bản gốc. Nói dối
bằng một cái nút.

**PDF đi đường IN của trình duyệt**, không render ở máy chủ: mọi thư viện PDF
server kéo theo phông nhúng, và tiếng Việt có dấu là chỗ chúng vỡ trước tiên.

**Cách đo `.docx`:** không mở bằng thư viện đọc — kiểm HÌNH DẠNG là đủ và rẻ.
`.docx` là một zip; bốn byte đầu phải là `PK 03 04`, và bên trong phải có
`word/document.xml`. Một file "docx" không phải zip thì Word từ chối mở, và đó
đúng là thứ cần chặn.

**`.srt` khác `.vtt` ba chỗ**, cả ba bắt buộc: đánh SỐ từng cue · dấu PHẨY cho
mili-giây · không có dòng `WEBVTT`. Bỏ sót cái nào thì trình phát nhận file mà
không hiện phụ đề — **hỏng im lặng**, nên cổng đo từng vế một.

**Dấu bản nháp** đóng ở ĐẦU mọi dạng, mang **nguồn · ngày · chỉ dẫn**. File rời
khỏi máy thì cái vết phải đi cùng nó: một bản nháp gửi qua chat mà không mang
dấu sẽ được đọc như một bài đã duyệt, và người đọc không có cách nào biết.


## `nut-tai-xuong` — menu "Tải xuống ▾" + trang in

`T03-117` bước 2, sau khi chủ dự án duyệt `SCR-19` và trả lời ba câu
(`WL-01M1T7X3B6N4K8P2VQDWHM5FGJ`).

| vế | giữ tính chất gì |
|---|---|
| menu đọc `__XUAT__` | cửa API và menu cùng MỘT nguồn — thêm một dạng vào bảng là mục tự mọc và 422 tự đổi |
| 0 tên dạng gõ cứng | gõ cứng là dựng nguồn sự thật thứ hai, và nó lệch vào đúng ngày ai đó thêm dạng |
| `<a download>` thẳng cửa, 0 blob | trình duyệt tải bằng bộ tải của nó: có thanh tiến trình, có thư mục Tải xuống, huỷ được. Blob thì ta phải tự dựng lại tất cả, và nó giữ cả file trong RAM |
| trang in tự gọi `window.print()`, 0 rail | PDF do TRÌNH DUYỆT dựng — thư viện PDF server kéo theo phông nhúng, và tiếng Việt có dấu là chỗ chúng vỡ trước tiên |

**Ba quyết định của chủ dự án**, ghi để sau này đọc lại hiểu vì sao:

1. **Giữ menu xổ** kể cả khi chỉ một mục — nút cùng chỗ, cùng hình ở mọi loại;
   người học một lần rồi dùng khắp nơi.
2. **Bài viết CÓ "File gốc"**. Lúc hỏi tôi cho là *hai tên cho một thứ* — sai:
   `md` là THÂN BÀI, `goc` là NGUYÊN FILE có frontmatter. Ai mang bản ghi sang
   kho khác cần frontmatter; thiếu nó là bài mất danh tính.
3. **Chỉ đặt trong cửa sổ đọc**. Thẻ ngoài lưới tiện hơn nhưng thêm byte cho
   MỌI trang, kể cả trang người chỉ lướt.

**Hai cổng phải sửa vì chúng neo vào CHỖ ĐẶT, không vào tính chất:**

- `markup-matches-css` chỉ soi `prototype.css`, nên nó tố oan mọi class có luật
  trong khối CSS **tiêm từ mã** — chính cách `cctab`/`multiwindow` tránh trần
  `gn.css`. Nay nó soi cả hai nguồn, và **ngay lập tức bắt được hai luật
  typography trong chunk chưa từng ai kiểm** (`#cc-hv` thiếu `--f-ui`).
- Vế "trang in nằm ở `trang.mjs`" hỏi *nó ở file nào*, không hỏi *nó có tồn tại
  và có sạch không*. Chỗ đặt là quyết định thi công; tính chất mới là thứ cần giữ.

---

## Đợt T03-119 → T03-124 · mười ba cổng, và thứ mỗi cổng giữ

Ghi ở đây vì `check_worklog` đòi mọi file test có một dòng nói *nó giữ gì* —
một cổng không ai mô tả được là một cổng không ai biết khi nào được phép xoá.

| cổng | giữ điều gì |
|---|---|
| `sau-phan-quyet` | duyệt/loại xong thì thẻ đổi TẠI CHỖ + toast; không nạp lại cả màn |
| `mau-trang-thai` | nháp xanh dương · loại đỏ + gạch ngang; màu KHÔNG mượn của chiều phân loại khác |
| `menu-tai-dot-hai` | tải xuống hỏi cho MỌI bản nhị phân · 5 bậc chất lượng · hạn 72h |
| `xuat-transcript` | cửa xuất transcript có thật; `dang=goc` trả FILE GỐC, không trả hiện vật dẫn xuất |
| `mo-nhap-da-duyet` | mở nháp đi qua `moTheoSlug` + đường đầy đủ, không bịa một bản ghi rỗng |
| `header-theo-man` | header dựng theo MÀN đang đứng; liên-module thì đủ điều hướng |
| `ban-cu-vao-rac` | bản chưng cất cũ vào thùng rác, đọc đúng khoá `type` mà `khoDoc` trả |
| `the-viec-noi-ro-loai` | thẻ việc nói rõ LOẠI bằng chữ + màu + dấu, dẫn xuất từ một bảng |
| `mo-theo-slug` | bóc phong bì API đúng chỗ, không để `than` rỗng thành 404 câm |
| `cua-so-transcript` | transcript có cửa sổ RIÊNG và xem được chi tiết (`T03-122`) |
| `chung-cat-sau-transcript` | nút Chưng cất chỉ có nghĩa SAU khi transcript xong (`FR-070`) |
| `o-chi-dan-hien-that` | ô nhập chỉ dẫn HIỆN THẬT — cửa proxy phải chở đủ trần + chip mẫu |
| `nhip-sinh` | dải nhịp lấy từ CUE THẬT (0 `Math.random()`), vòng xoay không hứa phần trăm, guard chuyển động không giấu thông tin |

| `chen-ten-co-thuc` | mọi `${tên}` chèn vào template literal phải là một tên CÓ THỰC trong hàm ấy |
| `hien-vat-lac-hau` | bản ghi trong BỘ NHỚ có thể lạc hậu — hỏi lại kho trước khi nói "chưa có" |
| `mang-chop-khong-giet-cua-so` | một lần mạng CHỚP không được giết cửa sổ đang theo dõi việc |
| `model-value-va-mot-chu` | hai bug 2026-09-07, cả hai là *"một thứ có hai chủ"* |
| `nut-header-mau` | `SCR-24` · ba nút header cửa sổ — nhãn NGẮN, màu nói trạng thái |
| `phieu-chung-cat-ui` | phiếu chưng cất — MODEL + PROMPT, và không gì thừa |
| `phieu-transcript-chon-model` | phiếu sinh transcript chọn được model, và chỉ model NHẬN ĐƯỢC AUDIO |
| `the-hai-tang` | `SCR-25`/`T03-126` — thẻ 2 tầng, nền trực quan theo loại nguồn |
| `thu-gon-rail` | thu gọn thanh bên (chủ dự án 2026-09-07) |
| `ten-file-co-dau` | `WO-057` — tên file CÓ DẤU đi qua header tải xuống |
| `thumbnail-video-url` | `WO-071` — cửa gắn hiện vật THAY theo `kieu_moc`, `image/*` vào bảng |
| `tai-file-video` | `WO-058`/`FR-075` — tải file `.mp4` rồi GHI ĐƯỢC vào kho |
| `thung-rac-viec` | `WO-070` — thùng rác việc: ba đường + màn |
| `mot-phieu-chung-cat` | MỘT phiếu chưng cất cho MỌI loại, và lời mời sau khi transcript xong |
| `xem-tiktok-douyin` | `WO-074` — cửa sổ xem TikTok + Douyin, và đường lùi cho mọi host |
| `nguon-video-theo-host` | `WO-076` — loại nguồn của video theo HOST, không theo "có media hay không" |
| `tran-hien-thi-luoi` | `WO-082` — trần 12 thẻ mỗi lưới, đếm trên tập ĐÃ LỌC, có nút `xem thêm` |

| `chung-cat-nhom-theo-bai` | `WO-085` — việc gộp theo bài gốc, tiêu đề thật làm đầu khối, trục thời gian (sắp + lọc khoảng) |

| `cua-so-khong-phai-bai-kho` | `WO-087` — chỉ cửa sổ BÀI KHO gọi `tai()`; guard là danh sách CHO PHÉP nên `kieu` chưa tồn tại cũng bị chặn |

| `tab-ket-qua-day-du` | `WO-090` — cửa nhận cờ `gom_da_bo`, mặc định giữ nguyên hàng đợi việc; tab Kết quả xin tập đầy đủ và vẽ theo `SCR-26` |

| `ten-file-tai-xuong` | `WO-091` — `?dang=goc` luôn `attachment`, tên thật qua RFC 5987 `filename*`, và 302 cõng theo ý định |

| `in-pdf-dinh-dang` | `WO-095` — trang in dựng HTML thật từ Markdown (bảng · danh sách · tiêu đề), thoát thẻ của model, và có luật ngắt trang |

| `xuat-pdf-typst` | `WO-096` — `?dang=pdf` dựng bằng Typst (New Computer Modern); mã Typst của model bị thoát; thiếu binary thì 503 |

**Bài học đắt nhất của đợt: một cổng XANH không chứng minh gì nếu nó neo sai.**

- `ban-cu-vao-rac` xanh suốt trong lúc mã đọc `b.source_type`, còn `khoDoc`
  trả `type`. Chỉ lần chạy THẬT mới bắt được.
- `o-chi-dan-hien-that` lượt đầu neo `/tran/` — khớp luôn chữ "**tran**script".
- `nhip-sinh` lượt đầu neo `/ns-vong/` — khớp TÊN LỚP CSS trước khi tới thân
  hàm, và neo `aria-hidden` bắt trúng hàm bên cạnh.

⇒ Lệ mới, áp từ `nhip-sinh` trở đi: **mỗi cổng phải chứng minh mình ĐỎ ĐƯỢC**
bằng fixture hỏng dựng ở thư mục tạm, không phải bằng lời khai xanh.
