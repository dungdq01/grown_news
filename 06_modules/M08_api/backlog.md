# backlog — M08_api (chết ở G6C)


## 2026-09-11 · KÉO THEO từ T03-150 — cổng viết-trước còn sống ở `07_plan/`

- [ ] **`07_plan/M08_api/tasks/T08-26b-cai-dat.test.js` chưa dời vào `web/test/`.**
      `rule.md` mục 8: cổng viết-trước sống ở thư mục task, **dời vào `web/test/` +
      đăng ký `npm test` CÙNG LƯỢT với mã**. Cổng này của `T08-17b` (bảng `cai_dat`,
      `M18 §10`, 13 AC) có từ commit gốc `c27859e`; mã chưa thi công nên chưa tới lúc
      dời — **đúng luật, nhưng phải có tên** để không ai tưởng đã quên.
      Lộ ra khi `T03-150` AC3 (PM viết) đòi *"thư mục hết .test.js"* — sai phạm vi,
      đã sửa 2026-09-11 thành đo đúng file của đơn vị đó.
      Đóng bằng: `T08-17b` thi công, `git mv` cổng vào `web/test/` + `npm test`.
      · object: `07_plan/M08_api/tasks/T08-26b-cai-dat.test.js`
      ⇒ **khi T08-17b thi công**

> Nợ do một thay đổi CỤ THỂ vừa gây ra. Không phải TODO, không phải ý tưởng.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## 2026-08-26 · FR-034 đảo nguồn chân lý sang DB + bỏ site tĩnh
Thay đổi: `FR-034-db-nguon-chan-ly.md` (A+B+C — `WL-01K9M4FR034A`,
`WL-01K9M5FR034B`, `WL-01K9M6FR034C`). Chưa có commit — cây làm việc chưa
commit theo lệnh người dùng, nên object của entry này là FR + ba worklog.
Phát hiện bởi AI thứ hai lúc kiểm toán (`WL-01K9M7KIEMTOANDB`).

- [ ] `.claude/skills/nap-bai/SKILL.md` §4 và §6 — **hợp đồng GIAO NỘP đang chỉ
      dẫn SAI**. Đo được: §4:135 nói danh mục sống ở `kb/concepts.yaml` +
      `kb/categories.yaml` (giờ là bảng `concepts`/`categories` trong
      `kb/_kho.sqlite`, hai file yaml chỉ còn là export); §6:175 nói *"emitter
      lấp 34 mốc lúc build"*; §6:186 và §6:201 bảo agent **chạy `npm run build`
      (~7s)** để Trang chủ và dashboard Kho cập nhật — không còn bước build nào,
      SSR đọc DB ngay lúc request.
      Nặng vì file này **được framework trỏ vào**: `06_modules/M05_intake/spec.md`,
      `07_plan/M03_web/tasks/T03-5-test-api.md`,
      `07_plan/M03_web/tasks/T03-8-server-ssr-va-banxuat.md`, `web/package.json`.
      Agent nào đọc nó để nạp bài sẽ làm theo chỉ dẫn của kiến trúc đã chết.
      Không FROZEN ⇒ tick được không cần FR.

- [x] `.factory/fr/FR-035-tu-dung-lai-trang-sau-khi-ghi.md` — cơ chế đã bị gỡ
      (`dungLaiTrang` không còn là hàm; hai chỗ còn lại là comment ghi nhận việc
      gỡ ở `web/api/dungchung.mjs:293` và răng `api-guard §6` đã **đảo chiều** để
      khẳng định nó vắng mặt). Đã đánh dấu bị thay thế ngay trong FR-035 §0 —
      trả luôn vì nó rẻ và chắc, không cần một ô nợ chờ. → FR-034/C3

## 2026-08-27 · Blob bị bỏ dở nằm lại trong DB (FR-036/B4)
Phát hiện khi cài luật mồ côi (`WL-01K9N6FR036B4`).

- [ ] `luuHienVat` nạp byte TRƯỚC khi bản ghi tồn tại — đúng thiết kế, vì
      `source_type: tai-lieu ⇒ required: media` nghĩa là bản ghi không thể tồn
      tại hợp pháp trước blob của nó. Người dùng mở form, nạp một PDF 25 MB rồi
      thoát ⇒ dòng `media` **nằm lại trong `kb/_kho.sqlite` vĩnh viễn**: không
      bảng nào trỏ tới nó, nên nó không được export, không hiện ở đâu, và không
      ai thấy. **Không mất dữ liệu — chỉ tốn chỗ**, 25 MB mỗi lần bỏ form.
      `xuat_kho.py` KHÔNG được dọn nó: nó khai "CHỈ SELECT" và
      `check_export_dan_xuat.py` răng 2 grep đúng điều đó — một DELETE trong
      exporter là đổi một bảo đảm kiến trúc có răng lấy một tiện lợi.
      Đường đúng: một lệnh dọn riêng (`core/tools/`) tính mồ côi từ **cùng**
      union ba bảng mà exporter dùng, chạy tay hoặc theo lịch. Cùng phép tính,
      hai người gọi — nên phải TÁCH thành hàm dùng chung, không viết bản thứ hai.

- [ ] **`§5` khai `planned`, module ĐÃ CHẠY — chín lệnh `hard` xanh.**
  Đo 2026-09-03: `check_export_dan_xuat` · `api-crud` · `thu-vien` ·
  `media-cua-so` · `media-dau-de` · `api-status` · `api-recycle` · `api-guard` ·
  `no-write-path`. Cùng ô với M10/M11 — **một cổng còn thiếu, hai chiều**:
  M04/M06 nói còn đỏ khi đã xanh; M08/M10/M11 nói chưa dựng khi đã dựng.
  **Năm module, một bệnh.**
  · object: `06_modules/M08_api/spec.md §5` ⇒ **FR id** (spec FROZEN)

- [ ] **Spec — và cả mã — vẫn gọi bảng `articles`, bảng đó KHÔNG CÒN.**
  Bảng thật: `bai_viet` (:44) · `tai_lieu` (:70) · `video` (:94) trong
  `core/assets/kho.schema.sql`. Spec M08 nói *"khoá chính `(source_type, slug)`
  của bảng `articles`"* và *"`DELETE FROM articles`"*.
  `web/api/dungchung.mjs` còn **6** chỗ nhắc `articles` — **cả sáu trong chú
  thích**, nên mã **chạy đúng** và **kể sai**.
  Cùng vết với M09 (`:637` nói *ba nhánh*, `:649` nói *năm*) và M10/M11
  (`documents`/`videos`) ⇒ **bốn module + một file mã**, một lần đổi tên chưa lan
  hết.
  · object: `06_modules/M08_api/spec.md §2.1 §2.3` ·
  `web/api/dungchung.mjs:87,637,715,846,849,879` ⇒ **FR id**

- [ ] **`§2.1` khai enum `6` giá trị, thực tế `7`.**
  `core/assets/loai-nguon.json` là bảng khai, và `$comment` của nó nói thẳng
  *"trước FR-038 tập **7** giá trị này gõ tay ở BỐN nơi"*. Con số **thứ bảy**
  cùng lớp *tự khai* trong bảy module liền — xem ô tổng ở
  `06_modules/M07_curate/backlog.md`.
  · object: `06_modules/M08_api/spec.md §2.1` ⇒ **FR id**

- [ ] **`M08-R1` lạc hậu về AN NINH, không chỉ về chữ.**
  `§4` viết *"không có auth — localhost LÀ lớp bảo vệ"*. Sau FR-047/049/051 có:
  bảy cửa khoá dịch vụ (`C1`–`C7`) · phân quyền hai vai (`chu`/`dong_nghiep`) ·
  rate-limit hai chiều · audit có `boi`. `localhost` vẫn là **một** lớp; nó
  **không còn là lớp duy nhất**.
  ⚠️ Một câu như thế trong artifact frozen là câu người sau dùng để quyết *"chỗ
  này không cần kiểm quyền"* — nên đây không phải nợ tài liệu, là **rủi ro an
  ninh dạng văn bản**.
  · object: `06_modules/M08_api/spec.md §4` · `06_modules/M08_api/rules.md M08-R1`
  ⇒ **FR id**

- [ ] **`api-guard` KHÔNG thấy `05_intake/gate.py` — đường ghi THỨ BA vào kho.**
  `AC-2.4.1` khai *"mọi ghi `kb/` đi qua đúng MỘT hàm (`ghiSauValidate`)"*. Câu
  đó đúng **trong phạm vi cổng quét** (`web/api/**`), và phạm vi ấy **không phải
  toàn bộ đường ghi** (plan `S6`: `gate.py:219,236-238` `INSERT` trong
  `BEGIN IMMEDIATE`).
  ⇒ Một cổng khai *"mọi"* mà chỉ quét một thư mục là cổng **nói quá phạm vi của
  mình** — và đó là hình dạng nguy hiểm hơn một cổng thiếu, vì nó tạo cảm giác đã
  phủ.
  · object: `web/test/api-guard.test.js` · `05_intake/gate.py:219,236-238`

- [ ] **`check_export_dan_xuat` gieo chỉ `repo` + `article` — cả hai vào MỘT bảng.**
  Sau FR-038 có ba bảng, nên cổng này **xanh trên một bản cài đặt làm 1/3 việc**
  (plan `S11`). Phải thêm một `video` và một `tai-lieu` vào `gieo()`.
  Đây là lỗ **có sẵn** mà tách bảng làm thành lỗ **nguy hiểm**.
  · object: `core/tests/check_export_dan_xuat.py:48-61`

- [ ] **Hai ca không AC nào phủ.**
  `PUT` khi bài đang `approved` mà nội dung **không** đổi: phép so *"nội dung
  đổi"* là so frontmatter, than, hay cả hai? Spec chỉ nói *"nội dung đổi ⇒
  `edited`"* ·
  restore một bản mà `concepts.yaml` đã **mất** nhãn nó dùng ⇒ validate chặn ⇒
  **không restore được**. Ca thật, cùng bài học `dat-chuan.md` của M04 (*"đạt
  chuẩn" là quan hệ với danh mục, không phải thuộc tính của file*).
  · object: `06_modules/M08_api/testcases.md` ⇒ **FR id**

## Mở 2026-09-03 — khử `T08-2` ID trùng làm lộ hai vi phạm R1 đã nằm im

> Đơn vị `T08-2-cua-loi-va-ddl-nhap.md` đổi ID → **`T08-19`** (`check_g6b` bắt
> *ID TRÙNG*: hai task cùng số ⇒ `phạm_vi_ghi` của một trong hai **không được
> kiểm**). Đổi xong thì `phạm_vi_ghi` của nó **lần đầu được kiểm**, và hai đường
> trong đó **nằm ngoài boundary M08_api** — chúng đã nằm im suốt thời gian bị ghi đè.

- [x] **`web/test/loi-cua.test.js` (449 dòng, đang `??`) KHÔNG đơn vị nào sở hữu.**
  ✔ PM quyết 2026-09-03: lối (a) — đơn vị TEST riêng phía M03 nhận sở hữu, không mở
  boundary M08 (đổi map là việc có FR, đắt hơn cái được).
  object: `07_plan/M03_web/tasks/T03-91-test-cua-loi.md`
  `project_map` khai M08_api = `web/api/**` · `_recycle/**` · `06_modules/M08_api/**`;
  `web/test/**` thuộc **M03_web** (`fe: web/**`). Và `check_g6b` bắt thêm R1:
  *"chạm file test mà không phải đơn vị test"*.
  ⚠️ File **đã được viết rồi** — nên đây không phải "chưa xây", nó là **một artifact
  không có chủ**. Tiền lệ trong dự án: `T12-8` là đơn vị TEST riêng, sở hữu toàn bộ
  `chungcat/tests/`.
  ⇒ Hai lối, **cần PM/người chọn**: (a) một đơn vị TEST riêng sở hữu
  `web/test/loi-*.test.js`; (b) mở boundary M08_api trong `project_map` — đổi map
  là việc **có FR**.
  · object: `07_plan/M08_api/tasks/T08-19-cua-loi-va-ddl-nhap.md` ·
  `web/test/loi-cua.test.js` · `project_map.yaml` `modules.M08_api` ⇒ **cần quyết**

- [ ] **`core/assets/dich-vu.json` khai trong `phạm_vi_ghi` của T08-19 — đất M01_core.**
  Dòng khai kèm điều kiện *"nếu cần khai thêm key/cột"*. Điều kiện đó **không làm
  nó vào boundary**: cần sửa bảng khai của M01 thì mở FR tới owner, không nới
  `phạm_vi_ghi` tại chỗ (`CLAUDE.md` §DỪNG).
  Đã gỡ khỏi `phạm_vi_ghi`; nếu thi công **thật sự** cần cột mới trong
  `dich-vu.json` thì đó là một FR, không phải một dòng.
  · object: `07_plan/M08_api/tasks/T08-19-…md` · `core/assets/dich-vu.json` ⇒ **FR nếu cần**

- [x] **BỐN ID trùng khác còn nguyên trong plan M08** — **ĐÓNG 2026-09-04 01:2x,
  chủ dự án gật, PM thi hành.** Nguyên tắc: bản CŨ HƠN đã commit (28–29/08) giữ
  số; bản mới (02–03/09, chưa track) dời:
  `cong-db-dung-cho` → **T08-23** · `ddl-db-loi` → **T08-24** ·
  `nam-cua-tai-khoan` → **T08-25** · `bang-cai-dat` → **T08-26** ·
  `test-cai-dat` → **T08-26b** (giữ khuôn đơn-vị-b đi kèm).
  Header trong file + tham chiếu SỐNG (xanh_khi của T08-26b) đã sửa; worklog cũ
  KHÔNG sửa — sổ lịch sử ghi đường dẫn đúng tại thời điểm ghi. `nut-song` exit 0
  sau khi dời.
  · object: `07_plan/M08_api/tasks/T08-2[3-6]*.md` · nut-song exit 0

- [ ] **`npm test` KHÔNG THỂ xanh khi tồn tại một cổng đỏ-trước — hai luật của
  dự án chỏi nhau.** `nut-song.test.js §…` đòi *"mọi file test đều được `npm test`
  gọi"*; `R5` đòi cổng tồn tại **ĐỎ TRƯỚC** code. Cổng đỏ-trước mà đăng ký thì
  suite đỏ; không đăng ký thì cổng "mọi file test" đỏ. Không có nước đi nào xanh.
  Đã gặp **hai lần trong một ngày, hai tác nhân khác nhau**:
  `web/test/cai-dat.test.js` (T08-17b, 02:57 — không phải phiên này) và
  `web/test/chung-cat-ui.test.js` (T03-92, phiên này).
  Lượt này xử tạm: cổng của T03-92 **dời khỏi `web/test/`** sang
  `07_plan/M03_web/tasks/T03-92-cong-chua-dung.test.js`; T03-92 dời lại vào
  `web/test/` **cùng lúc** với mã và đăng ký vào `npm test`. Đó là cách né, không
  phải cách sửa — luật vẫn chỏi.
  · object: `web/test/nut-song.test.js` · `web/package.json` ·
  `07_plan/M03_web/tasks/T03-92-cong-chua-dung.test.js` ⇒ ~~PM quyết luật nào nhường~~
  **CHỐT 2026-09-04, chủ dự án gật**: KHÔNG luật nào nhường — đổi CHỖ ĐO của R5.
  "Đỏ trước" chứng minh bằng **bằng chứng trong worklog** (output cổng ĐỎ chạy tại
  mốc trước-code + XANH sau, cùng entry, có SHA/mốc thời gian làm object), KHÔNG
  bằng trạng thái suite trên cây chung — suite chung chỉ cần xanh lúc BÀN GIAO.
  nut-song §5 giữ nguyên nghĩa gốc ("mọi file trong web/test/ phải được npm test
  gọi"); cổng viết-trước sống ở thư mục task cho tới lượt dời-cùng-mã (khuôn
  T03-92 đã dùng — giờ là khuôn CHÍNH THỨC, không phải cách né). Dev gỡ bản sửa
  "có CHỦ không" của §5 về nghĩa gốc. Luật ghi ở `.claude/rule.md` mục 6.

- [ ] **`web/package.json` phải vào `phạm_vi_ghi` của MỌI task sinh cổng mới.**
  T08-20 khai hai file (`tho-cua.mjs` · `router.mjs`) rồi mới phát hiện cổng mới
  bắt buộc phải đăng ký trong `package.json`, nếu không `nut-song.test.js` đỏ.
  Lượt này đã thêm dòng khai vào task file **giữa lúc thi công** và ghi rõ ra —
  reviewer nhịp ⑤ phải soi đúng chỗ đó.
  · object: `07_plan/M08_api/tasks/T08-20-cua-tho-cho-fe.md` · `web/package.json`
  ⇒ **PM đưa vào khuôn task**

- [ ] **HAI ĐƠN VỊ M08 CÒN THIẾU, và hai màn của đợt UI M12 đứng chờ chúng.**
  Đo 2026-09-03 trên `web/api/router.mjs`: tồn tại `GET /api/model` +
  `POST /api/job` (T08-20) và `POST /api/nhap-chung-cat` (T08-19) — **không cửa
  ĐỌC nào**. Nhưng:
  · `T03-93` khai sống bằng `GET /api/job` + `GET /api/viec/<id>` ⇒ cần `T08-21`
  · `T03-94` khai sống bằng "cửa LÕI T08-19" cho hàng đợi nháp, mà T08-19 chỉ
    GHI ⇒ cần `T08-22`: `GET /api/nhap-chung-cat` · `…/<ulid>` (kèm `ban_goc_ai`
    để FE dựng diff) · bốn cửa Duyệt/Sửa/Trả-lại/Xoá.
  ⚠️ `check_g6b` KHÔNG bắt được lớp lỗi này: nó đo `phạm_vi_ghi` và AC/cmd, chứ
  không đo *"cửa mà AC dựa vào có thật không"*. Hai task đã qua G6B sạch trong
  khi nguồn dữ liệu của chúng không tồn tại.
  ⚠️ Cửa Duyệt của T08-22 phải giữ `AC-1.3`: `review_status` không đến từ
  payload — DDL `CHECK (review_status = 'draft')` chặn ở tầng bảng, nên "duyệt"
  là **chuyển sang kho**, không phải đổi cột trong bảng nháp.
  · object: `web/api/router.mjs` · `07_plan/M03_web/tasks/T03-93-…md` ·
  `07_plan/M03_web/tasks/T03-94-…md` ⇒ **PM mở T08-21 + T08-22**

- [ ] **HAI ID TRÙNG do hai tác nhân làm SONG SONG trên cùng working tree.**
  `T08-21`: PM viết `T08-21-proxy-doc-job.md` lúc 22:20, agent thi công viết
  `T08-21-cua-doc-viec.md` lúc 23:46 — **cùng đơn vị, cùng ID, không ai thấy
  file của người kia**. `T03-98` y hệt: PM khai *"THÁO /dot-hai/"*, agent khai
  *"ẩn /dot-hai/"*, hai hướng NGƯỢC nhau dưới cùng một ID.
  Đã xử: ID thuộc về file CÓ TRƯỚC; nội dung của bản sau hoà vào đó
  (`T08-21`), hoặc bản sau nhận ID mới và bản trước đánh dấu SUPERSEDED kèm
  nguyên văn quyết của chủ dự án (`T03-98` → `T03-103`).
  ⚠️ Gốc chưa sửa: `CLAUDE.md` §Kết thúc nói *"song song ⇒ mỗi đơn vị một
  WORKTREE"*, nhưng hai tác nhân này ghi vào **cùng một thư mục**. Nhánh bảo vệ
  lịch sử; worktree mới bảo vệ thư mục. Và `check_g6b` chỉ bắt được SAU khi cả
  hai file đã tồn tại — nó không ngăn được lần va thứ ba.
  · object: `07_plan/M08_api/tasks/T08-21-proxy-doc-job.md` ·
  `07_plan/M03_web/tasks/T03-98-thao-dot-hai.md` ⇒ **PM cấp ID trước khi giao**

- [x] **`WO-043` / `T08-27` — DDL `nhap_chung_cat` khớp `FR-046 §1`: XONG 2026-09-04.**
  Chủ dự án duyệt lối A (*"sửa luôn DDL"*). Ba sửa:
  · enum `nhap|da_gui|bo` → **`nhap|da_sua|da_duyet|tra_lai`** (đúng `FR-046 §1`).
    `da_gui`/`bo` KHÔNG CÓ NGUỒN — grep toàn repo chỉ ra chính DDL đó và một
    dòng test của nó; tôi tự đặt một từ vựng rồi cưỡng chế nó bằng `CHECK`.
  · **+`khang_dinh_bi_tia`** (`FR-046 §1` khai, DDL thiếu). `T03-94` đòi hiện
    *"⚠ đã tỉa N"* TRƯỚC nút duyệt — không có cột thì không có gì để hiện, và
    không hiện là **nói dối người duyệt**.
  · **+`ly_do`** — ca TRẢ LẠI bắt kèm lý do (`T08-22 AC3`).
  GIỮ nguyên: `review_status` `CHECK` hằng `='draft'` (chuyện khác — `da_duyet`
  của `trang_thai` KHÔNG nghĩa "đã vào kho"; duyệt = ghi FILE vào `kb/` +
  `dung_lai_db`, từ giây đó FILE là chân lý) · trigger `ban_goc_ai` bất biến ·
  `lan_gui_duyet` · `cap_nhat_luc` (không đổi sang `sua_luc` — hai tên một
  nghĩa, đổi tên một cột ba chỗ đọc là rủi ro không mua được gì).
  **Rẻ vì làm sớm**: bốn file T08-19 còn `??`, bảng chưa có dữ liệu ⇒ 0 migration.
  Bằng chứng đỏ-trước (`rule.md` mục 8): `node web/test/loi-cua.test.js` tại mốc
  trước-code → **7 SAI** (`da_sua`/`da_duyet`/`tra_lai` bị chặn · `da_gui`/`bo`
  được nhận · hai cột thiếu, `Error: no such column: khang_dinh_bi_tia`); sau →
  12 ok. Suite: **exit 0 · 2746 ok**.
  · object: `web/api/loi.schema.sql` · `web/api/dungchung.mjs` (`XUAT_LOI` +2 cột)
  · `web/test/loi-cua.test.js` · `.factory/wo/WO-043-…md`
  · `07_plan/M08_api/tasks/T08-27-ddl-nhap-khop-fr046.md`

- [ ] **Một cổng cũ từng xanh vì LÝ DO SAI, đã sửa cùng lượt — ghi để nhớ lớp lỗi.**
  Ca *"payload đòi `trang_thai` phải bị lột"* dùng giá trị `da_gui`. Sau khi enum
  khớp FR-046, `da_gui` bị `CHECK` chặn ⇒ cổng xanh vì **DDL từ chối giá trị**,
  không vì `loiTaoNhap` lột nó. Đã đổi sang `da_duyet` — giá trị DDL SẼ NHẬN,
  nên thứ duy nhất giữ hàng ở `nhap` là chữ ký hàm.
  ⚠️ Lớp lỗi: **siết một enum có thể làm một phép kiểm khác thành vô nghĩa mà
  nó vẫn xanh.** Mỗi lần đổi `CHECK`, phải soi lại mọi phép kiểm dùng giá trị
  vừa bị loại — không cổng nào tự báo điều đó.
  · object: `web/test/loi-cua.test.js:166` ⇒ **đơn vị test rà lượt sau**

- [x] **`T08-22` — năm cửa NHÁP cho trình duyệt: XONG 2026-09-04.**
  Mã ở **`web/api/nhap-cua.mjs`** (file MỚI), KHÔNG `loi-cua.mjs` như task khai:
  `loi-cua.mjs` là bảy cửa của MÁY và `quaCong` **đòi khoá dịch vụ** ⇒ 403 mọi
  lời gọi thật từ trình duyệt; `tho-cua.mjs` là proxy LÕI→THỢ, mà năm cửa này
  không proxy gì (bảng nháp ở DB của chính LÕI). Vai thứ ba cần một cái tên.
  · `GET /api/nhap-chung-cat` — danh sách, KHÔNG cõng hai bản toàn văn
  · `GET …/<ulid>` — CẢ HAI bản trong MỘT lời gọi (FE dựng diff không gọi lần hai)
  · `POST …/sua` · `POST …/tra-lai` (bắt `ly_do` ≥5) · `POST …/duyet`
  DUYỆT dùng lại `ghiSauValidate()` — KHÔNG dựng đường ghi thứ hai cho `kb/`
  (`B-C1`). Thứ tự **validate trước, đổi trạng thái sau** là cả luật: đảo lại là
  để một hàng `da_duyet` mà kho không có file — hai nguồn chân lý.
  Cửa C2 của MÁY VẪN đòi khoá — cổng đo cả chiều đó (`§7`).
  Bằng chứng đỏ-trước: **30 lỗi** (404 vì cửa chưa có) → **30 ok**.
  Suite: exit 0 · **2785 ok**.
  · object: `web/api/nhap-cua.mjs` · `web/api/dungchung.mjs`
  (`loiLietKeNhap` + `loiDoiTrangThaiNhap`) · `web/api/router.mjs` ·
  `web/test/loi-nhap-cua.test.js` · `web/test/_api.mjs` (`batServer().loi()`)

- [x] **XOÁ nháp — HỞ HỢP ĐỒNG, chưa thi công.** ⇒ ĐÓNG bằng **`FR-057`**
  (2026-09-04, chủ dự án chọn **lối (a)**: thêm `da_bo`, KHÔNG xoá hàng).
  Thi công ở `T08-29`: enum 5 giá trị ở DDL + di trú qua `diTruLoi` ·
  `POST /api/nhap-chung-cat/<ulid>/bo` (`ly_do` ≥5) · hai ca 409 (`da_duyet`
  vì file đã trong kho; `da_bo` vì một chiều) · `cuaSuaNhap` cũng chặn `da_bo` ·
  danh sách mặc định lọc bỏ `da_bo`, `?trang_thai=da_bo` vẫn đọc được.
  Đỏ-trước: **10 lỗi** (404 vì cửa chưa có) → **pass**. Suite: exit 0 · **2877 ok**.
  · object: `.factory/fr/FR-057-bo-mot-ban-nhap.md` ·
  `07_plan/M08_api/tasks/T08-29-cua-bo-mot-ban-nhap.md` · `web/api/nhap-cua.mjs` ·
  `web/api/loi.schema.sql` · `web/api/dungchung.mjs` · `web/api/router.mjs` ·
  `web/test/loi-nhap-cua.test.js` (§6c · §6d) · `web/test/loi-cua.test.js`
  · worklog: `WL-01KA0T0829BONHAP`

<details><summary>ô gốc — giữ nguyên văn để đọc lại được vì sao nó mở</summary>

- **XOÁ nháp — HỞ HỢP ĐỒNG, chưa thi công.** `T03-94` đòi bốn hành động
  (Duyệt · Sửa · Trả lại · **Xoá**); `FR-046 §1` khai vòng đời
  `nhap → da_sua → da_duyet | tra_lai` — **không trạng thái nào nghĩa "đã bỏ"**,
  và `T08-27` vừa siết enum đúng theo FR. Hai lối:
  (a) thêm `da_bo` ⇒ **sửa `FR-046`** (một FR nữa), nhưng nháp và `ban_goc_ai`
      CÒN — đọc lại được, đúng tinh thần "bản gốc bất biến vì mất nó là mất câu
      *người đã sửa những gì*";
  (b) xoá HÀNG thật ⇒ không sửa FR, nhưng **phá `ban_goc_ai`** (thứ tốn token
      model để tạo), và `rule.md` mục 4 cấm agent tự xoá.
  ⇒ Lượt này làm BA hành động + hai cửa đọc. Xoá DỪNG.
  · object: `.factory/fr/FR-046-nhap-chung-cat-luu-db.md` ·
  `07_plan/M08_api/tasks/T08-22-cua-nhap-chung-cat.md` ⇒ **NGƯỜI chọn lối**

</details>

- [ ] **FE chưa có nút Xoá ở `/chung-cat/nhap/` — cửa sống, màn chưa gọi.**
  `T08-29` mở `POST …/bo` và cổng đo nó ở tầng HTTP; màn triage `T03-94` vẫn
  chỉ có ba nút. Một cửa không ai bấm được là một cửa chưa giao.
  Cần: nút Xoá + hộp `ly_do` (≥5, cùng khuôn Trả lại) + xử hai ca 409 bằng
  câu server trả về, không bằng một câu gõ cứng ở FE.
  · object: `web/plugins/chungcat/src/chungcat.inline.ts` ⇒ **đơn vị M03**

- [ ] **`batServer()` không đọc được stderr của server — đã vá, ghi lớp lỗi.**
  Cửa DUYỆT làm server CHẾT (`unable to open database file`) và cổng chỉ báo
  `TypeError: fetch failed` — một câu nói "không kết nối được", **không nói vì
  sao**. Tôi đi tìm nguyên nhân ở validate, ở fixture, ở tên khoá — ba hướng
  sai — trước khi thêm `sv.loi()` trả stderr. Nguyên nhân thật: `dungKho()` trả
  `{ kho, rac, don }` mà tôi gán cả object vào `kho`.
  ⚠️ `loi-cua-http.test.js` truyền cả object y như vậy và VẪN xanh — vì nó không
  bao giờ GHI vào kho. Một cách dùng sai mà chỉ lộ khi có phép ghi.
  ⇒ Nên `dungKho()` trả object thì mọi cổng phải destructure; hoặc nó nên NÉM
    khi bị truyền cả object vào `batServer`.
  · object: `web/test/_api.mjs:325` · `web/test/loi-cua-http.test.js:25`
  ⇒ **đơn vị test siết hạ tầng fixture**

- [x] **`WO-044` — DDL đổi cột mà DB đang có không theo: XONG 2026-09-04.**
  Chủ dự án duyệt lối A. Hai việc, và việc thứ hai mới là việc thật:
  · **DB dev dời khỏi repo** (KHÔNG xoá — bản cũ ở thư mục tạm phiên), dựng lại
    theo schema mới. Xác nhận: `GET /api/nhap-chung-cat` → 200 trên server thật.
  · **Đường DI TRÚ `diTruLoi()`** trong `dungchung.mjs`, chạy mỗi lần mở DB,
    idempotent qua `PRAGMA table_info` (không cột cờ "đã di trú" — một cờ như
    vậy nói về LỜI KHAI, còn `table_info` nói về thứ CÓ THẬT).
    Dựng bảng mới + copy + đổi tên, KHÔNG `ALTER`: SQLite `ALTER ADD COLUMN`
    thêm được cột nhưng **không sửa được `CHECK`**, mà T08-27 đổi enum 3→4 giá
    trị. Dựng lại trigger `ban_goc_ai` — nó gắn với bảng CŨ và chết theo bảng;
    bỏ dòng đó là mất một bất biến mà không ai báo.
    `da_gui`/`bo` cũ ánh xạ về `nhap` (cả hai vốn không có nguồn); giữ nguyên
    thì `INSERT` vỡ ở `CHECK` và mất cả hàng.
  · **Cổng `§6b`** dựng DB theo schema CŨ rồi trỏ server vào đó — ĐỎ trước
    (`500 no such column`), xanh sau. Không có nó, lần đổi cột sau lặp lại y hệt.
  Suite: exit 0 · **2786 ok**.
  · object: `web/api/dungchung.mjs` (`diTruLoi`) · `web/test/loi-nhap-cua.test.js §6b`
  · `.factory/wo/WO-044-ddl-doi-cot-db-cu-khong-theo.md`

- [ ] **`audit_loi` KHÔNG có đường backup.** `XUAT_LOI` phủ ba bảng
  (`nguoi_dung` · `dinh_danh_kenh` · `nhap_chung_cat`); `audit_loi` **không nằm
  trong đó**. Nghĩa là một lần dựng lại DB xoá vết audit **IM LẶNG** — và audit
  log tồn tại đúng để chống điều đó.
  Đo lượt này: 9 hàng `tao-job-khong-chu` trong DB dev, đã xuất tay ra
  `audit_loi-truoc-T08-27.json` ở thư mục tạm phiên vì không có đường chính thức.
  ⚠️ `ADR-06 (c)` khai xuất BA bảng và `loi-cua.test.js` đo đúng ba — nên cổng
  XANH trong khi bảng thứ tư không ai backup. Cổng đo *"ba bảng đã khai"*, không
  đo *"mọi bảng đáng backup"*.
  · object: `web/api/dungchung.mjs` `XUAT_LOI` · `04_system/adr.md` ADR-06
  ⇒ **PM/người quyết: audit có vào backup hay không**

- [ ] **Tôi báo SAI tiền đề cho một phép duyệt.** Trình lối A với câu *"DB rỗng
  0 hàng"*; thực tế `audit_loi` có **9 hàng**. Nguyên nhân: lần kiểm đầu tôi gõ
  `audit_log` (sai tên — bảng thật là `audit_loi`), nhận `no such table`, rồi
  **đọc một lỗi TÊN thành một sự thật về DỮ LIỆU**.
  Chốt đã tự đặt và đã chạy: kiểm LẠI tiền đề ngay trước thao tác không hoàn
  tác được (`assert tong == 0`) — nó DỪNG đúng lúc, và nhờ vậy 9 hàng được xuất
  ra file trước khi DB bị dời.
  ⇒ Bài học: một truy vấn trả "không có" phải phân biệt *"bảng không tồn tại"*
    với *"bảng rỗng"*. Hai câu đó dẫn tới hai quyết định khác nhau.
  · object: `.factory/wo/WO-044-…md` ⇒ **kỷ luật, không phải mã**

- [ ] **T08-22 bàn giao LỆCH KHAI một dòng (R1)** — PM bắt 2026-09-04 02:55:
  `phạm_vi_ghi` vẫn khai `web/api/loidb.mjs`, nhưng hai hàm DB của nháp
  (`loiLietKeNhap`:1536 · `loiDoiTrangThaiNhap`:1567) nằm ở
  `web/api/dungchung.mjs`; `loidb.mjs` không đụng (mtime 09-02). Worklog
  `WL-01K9SF2T0822NHAP` khai object ĐÚNG chỗ thật — tức lệch nằm ở dòng khai
  chưa sửa nốt, không phải mã giấu. Cũng thiếu khai: `web/test/loi-nhap-cua.test.js`
  + `web/test/_api.mjs` + `web/package.json` (ô "package.json vào phạm_vi_ghi
  mọi task sinh cổng" đã có — đây là lần tái phạm đầu sau khi ô mở).
  Tick khi: dev sửa nốt dòng khai (loidb → dungchung + 3 đường test/pkg), HOẶC
  dời hai hàm sang `loidb.mjs` cho đúng vai file (dungchung đã 1500+ dòng).
  Cổng lúc bắt: loi-nhap-cua 30 ok · loi-cua · api-guard · no-write-path đều 0.
  · object: `07_plan/M08_api/tasks/T08-22-cua-nhap-chung-cat.md:44` ·
  `web/api/dungchung.mjs:1536,1567` · `WL-01K9SF2T0822NHAP`

- [x] **`T08-28` khai ghi `04_system/adr.md` — VƯỢT boundary M08_api.** ⇒ ĐÓNG bằng **`FR-058`** (ĐÃ DUYỆT 2026-09-04, chủ dự án "duyệt đề xuất"); áp ở `T04-7`. Đo: check_g6b 32 → 27 → 26.
  `check_g6b` báo `ghi 04_system/adr.md ngoài boundary M08_api`. R1 ở mức *đơn
  vị việc* KHÔNG thủng (file nằm trong `phạm_vi_ghi` mà task tự khai); thứ thủng
  là **phạm vi khai vượt boundary của module** — và đó là lỗi s7, không phải lỗi
  thi công. Ba task khác cùng lớp: `T08-15` (`core/assets/nguong-loi.json`) ·
  `T08-24` (`.gitignore`) · và ở M09 là `T09-8`.
  ⇒ Đã mở **`FR-058`** (ĐỀ XUẤT, chờ chủ dự án): lớp A cho `nguong-loi.json` về
  M08 (đo được: chỉ `web/api/dungchung.mjs` + cổng của nó đọc file này), lớp B
  khai `04_system/**` + `.gitignore` là artifact HỆ THỐNG không nhận chủ.
  Chủ dự án bác ⇒ `T08-28` phải quay lại đổi đường.
  · object: `.factory/fr/FR-058-chu-cho-artifact-he-thong.md` ·
  `07_plan/M08_api/tasks/T08-28-audit-vao-backup.md` ⇒ tick bằng **FR-058**

- [ ] **Lối THAY hiện vật (sinh lại transcript) chưa có đường — `T08-30` chỉ
  làm lối THÊM.** `FR-054 §9.1` khai vòng đời sinh lại: `media[]` **thay**
  `sha256` cũ bằng mới → bump `ban` → snapshot frontmatter cũ sang
  `article_versions` → byte cũ **vẫn nằm** trong bảng `media` (`M09-R1`).
  Cửa `POST .../hien-vat` của `T08-30` là lối **THÊM**: không hiện vật nào bị
  thay, nên không có bản cũ nào để snapshot, và nó CỐ Ý không bump `ban`.
  ⚠️ Chỗ khó không phải một endpoint thiếu: bảng `article_versions` hôm nay
  **chỉ được nạp TỪ FILE** (`dung_lai_db.py:202`, đọc `<slug>.v<n>.md`), tức
  *version là FILE* — đúng `B-C1`. Một cửa API ghi thẳng vào `article_versions`
  là dựng nguồn chân lý thứ hai cho lịch sử bản ghi.
  ⇒ Ba câu cần trả lời trước khi thi công: (1) cửa THAY ghi file `<slug>.v<n>.md`
  hay ghi bảng? (2) nếu ghi file thì ai đặt số `<n>` — và số đó phải bất động
  qua retry; (3) `ten_goc: "<slug>.v2.vtt"` của `FR-054 §9.1` là nhãn NGƯỜI đọc,
  vậy chân lý máy vẫn là `article_versions` — ai ghi nó?
  · object: `web/api/articles.mjs#ganHienVat` · `core/tools/dung_lai_db.py:202` ·
  `.factory/fr/FR-054-...md` §9.1 ⇒ **cần quyết trước khi thi công**

- [ ] **Cửa duyệt không đổi `review_status` khi ghi vào kho** — đo 2026-09-05
      (nghiệm thu `T12-20`):

      | nơi | giá trị sau khi duyệt |
      |---|---|
      | hàng nháp (`nhap_chung_cat.trang_thai`) | `da_duyet` |
      | file trong kho (`review_status`) | **`draft`** |

      `cuaDuyetNhap` truyền `fm` của bản nháp THẲNG vào `ghiSauValidate`, và
      `ghiSauValidate` không chạm `review_status`. Nên một bài "đã duyệt" nằm
      trong kho mang nhãn `draft`, và mọi màn đọc `review_status` (thẻ kho, bộ
      lọc, `only-approved`) coi nó là chưa duyệt.

      M12 KHÔNG được sửa chỗ này: `M12-R2` cấm bên bị đánh giá chạm trạng thái
      duyệt của chính mình — bản nháp khai `draft` là đúng. Quyền đổi sang
      `approved` thuộc CỬA, vì cửa mới là bên duyệt.

      Sửa: `cuaDuyetNhap` đặt `review_status: "approved"` (và cân nhắc
      `origin`) trước khi gọi `ghiSauValidate` — cùng khuôn `M08-R5` (server
      quyết hai trường này, client không).

- [ ] **T08-33 · `dang=goc` trả FILE BẢN GHI thay vì BYTE MEDIA GỐC.** PM đo
  2026-09-06: `GET /api/xuat/tai-lieu/xgboost-stap-by-step?dang=goc` trả
  `text/markdown`, filename `xgboost-stap-by-step.md`, 5 byte đầu `---\ni`
  (frontmatter bản ghi kho) — trong khi File-gốc của tài liệu PDF phải là byte
  PDF trong `media` (magic `%PDF`). Người bấm "File gốc" nhận nhầm file text.
  ⇒ Sửa: `goc` = phục vụ media[0] qua đường `hienVatPhucVu` sẵn có (đúng
  mime + `ten_goc` làm filename, KHÔNG slug); bản ghi 0 media ⇒ 422 nói rõ.
  + THÊM VẾ cổng: "goc của tai-lieu pdf ⇒ byte đầu khớp magic mime" — cổng
  hiện xanh vì không đo vế này (lớp `#cổng-không-đỏ-được`).
  Tick khi: curl goc ra `%PDF` + filename ten_goc + vế cổng đỏ được trên
  fixture trả-nhầm-md.
  *(mở rộng 2026-09-06, chủ dự án dính tiếp ở VIDEO: tải video ra .md)*
  Vế video: bản ghi CÓ media byte ⇒ goc = đúng byte + ten_goc (mp4 ra mp4);
  bản ghi URL-only (0 media — đa số video) ⇒ 422 "video này chỉ có URL,
  không có file trong kho" VÀ menu FE ẨN mục File-gốc (dẫn xuất từ
  media[] của bản ghi, không bày mục chết) — thay bằng mục "Mở nguồn ↗"
  trỏ url gốc.
  · object: `web/api/xuat-cua.mjs` · `web/test/xuat-van-ban.test.js` ·
  curl 2026-09-06 (ct=text/markdown cho PDF)

- [ ] **`POST /api/job` nhận thân RỖNG `{}` và trả 201.** Đo 2026-09-06:
      tạo được một job không có `loai` lẫn `slug`; worker nhặt lên rồi đỗ
      lại ở "loại chưa có người chạy". Job rác đã xoá tay. Cửa nhận một việc
      nó không biết chạy là cửa để FE đẻ rác — và `T03-121` mục 4 vừa thêm
      một chỗ POST nữa. Cần bắt buộc `loai` ∈ `BANG_LOAI` và `slug`.
- [ ] **Cửa xuất từng HỨA một dạng mã chưa cài** (`theo_loai.transcript` khai
      ở `T08-33`, nhánh xử lý mãi tới 2026-09-06 mới có). Cần một cổng CHUNG:
      mọi `loai` trong `xuat-dang.json` phải có nhánh trong `xuat-cua.mjs`,
      không thì bảng khai lại hứa suông lần nữa.
