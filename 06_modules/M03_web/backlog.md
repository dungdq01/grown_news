# backlog — M03_web (chết ở G6C)


## 2026-09-11 · KÉO THEO từ C3 (T03-149) — hai nợ CÓ SẴN mà AC của PM làm lộ

- [ ] **`web/plugins/napvideo/src/napvideo.inline.ts:101` là BẢN SAO của `slugGoiY`.**
      Giống `multiwindow.inline.ts:1329` **từng bước**, kể cả `.slice(0, 60)` — tức
      luật sinh slug nay có **hai bản cài** trong `web/plugins/`. Đây chính là lớp lỗi
      `M13-R2` cấm: hai luật slug khác nhau ⇒ chatbot trích một anchor mà trang render
      không có, và **chết im lặng vì cả hai phía đều "chạy đúng"**.
      Hôm nay chưa gãy vì hai bản còn **giống nhau**; nó gãy ở lần đầu ai đó sửa một bản.
      Lộ ra khi dev chạy `--mot-luat` của `T03-148` (PM viết AC *"grep NFD ⇒ đúng 1 chỗ"*
      — phép đo quá thô, đã sửa 2026-09-11).
      Đóng bằng: `napvideo` gọi `slugGoiY` qua cầu `__GN_MW__` (khuôn `chungcat` gọi
      `capNhin`), hoặc tách `slugGoiY` ra `anchor.ts` cho cả hai import. **Không** đóng
      bằng cách đồng bộ tay hai bản.
      · object: `web/plugins/napvideo/src/napvideo.inline.ts:101` ·
      `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:1329`
      ⇒ **đơn vị M03 riêng, chưa mở** (cần ID chẵn của dev chính)

- [ ] **`boDau` (`multiwindow.inline.ts:1709`) trông giống `slugGoiY` nhưng KHÁC mục
      đích** — bỏ dấu để **so khớp**, không cắt 60, không thay `[^a-z0-9]`. Không phải
      bản sao, **không** gộp. Ghi ra đây để lần sau ai grep `normalize("NFD")` thấy ba
      kết quả thì biết cái nào là nợ, cái nào không.
      · object: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:1709`
      ⇒ **không phải nợ — ô này đóng ngay bằng chính dòng giải thích này**

## 2026-09-02 · KÉO THEO từ s6/M13 — sơ đồ `file#anchor` chưa có người tiêu thụ
Phát hiện khi viết `testcases.md` cho M13 (phép thử s6: *viết không nổi testcase
⇒ AC mơ hồ*). Worklog: `WL-01K9X2S6DONG`.

- [ ] **C3 phải sinh `id` trên heading, và `id` đó phải KHỚP `anchor` của M13.**
      Đo 2026-09-02:
      `grep -rn anchor web/render/ web/plugins/` ⇒ **0**;
      `grep -o '<h[23][^>]*>' web/site/index.html` ⇒ `<h2 data-i18n=...>` `<h3>`
      — **không có `id`**.
      Hệ quả nếu để nguyên: M13 sinh anchor trỏ vào HTML **không có `id` tương
      ứng**, nên chatbot sẽ trích dẫn những địa chỉ **bấm vào không tới đâu** — và
      nó hỏng **im lặng**, vì cả hai phía đều "chạy đúng".
      Đóng bằng: task C3 + **cổng đối chiếu BA bản** (`anchor_py` của M13 ↔
      `slugGoiY` của FE ↔ `id` trong HTML render). Hai bản là chưa đủ — bản thứ ba
      mới là bản người dùng bấm vào.
      **2026-09-10 · PM M13 mở task**: `T03-148` (test, 4 ca — ca D là cổng BA bản =
      A3 của FR-073) → `T03-149` (C3: `md()` sinh `id` = `slugGoiY` + dedup theo bài,
      ≤ 8 dòng trong multiwindow theo rule 15). Lý do mở hôm nay: `T03-125` AC2
      *"cuộn đúng anchor"* không có đường xanh khi heading không có `id`. Tick ô
      này bằng commit của `T03-149`.

## 2026-08-26 · FR-034/C6 cắt Quartz, C7 dọn không xong
Thay đổi: `FR-034-db-nguon-chan-ly.md` giai đoạn C (`WL-01K9M6FR034C`).
Chính worklog đó tự khai *"sandbox chặn rm — xoá vật lý cho người"*.

- [ ] `web/site/` — cây build Quartz cũ **vẫn nằm trên đĩa**. Đo được: `site/gn.js`
      mtime 14:13 trong khi nguồn `.ts` mtime 15:33, và bản `/gn.js` server trả
      về khớp **từng byte** với hiện vật cũ đó ⇒ server đang phục vụ code TRƯỚC
      FR-034. Bộ test đã thoát khỏi nó (C5 đổi nguồn sang `web/render/`), nên nó
      không làm test đỏ — nó chỉ **im lặng phục vụ bản cũ** cho ai không restart.
      Đây đúng là lớp lỗi "hiện vật chết vẫn được đọc": không ai đỏ, và người
      dùng thấy giao diện cũ rồi tưởng bản mới không chạy.

- [ ] Bốn file STUB retired chờ xoá vật lý (cùng lý do sandbox chặn `rm`):
      `core/tools/sinh_index.py`, `core/tests/check_index_dan_xuat.py`,
      `web/test/hai-duong-doc-khop.test.js`, `web/test/only-approved.test.js`.
      Stub còn trong chuỗi `npm test` là **cố ý** — meta-test §5 của
      `nut-song.test.js` đòi mọi file trong `test/` phải được `npm test` gọi.
      Xoá file thì phải xoá cả tên trong `package.json` cùng lúc, không thì §5 đỏ.

## 2026-08-27 · `ci.yml` liệt test bằng TAY và đã lạc hậu 6 file
Phát hiện lúc FR-036/B3 (`WL-01K9N5FR036B123`), khi `test/WORKLOG.md` tự khai
*"Nhớ thêm vào `package.json` `scripts.test` và `.github/workflows/ci.yml`"*.

- [ ] `.github/workflows/ci.yml` chạy **một step cho mỗi file test**, gõ tay. Đo
      được: `cua-so-doc` · `nut-song` · `danh-muc-phan-trang-ep-xoa` ·
      `khung-8-o` · `chu-giao-dien` · `thu-vien` — **6 file, 0 step**. Chúng xanh
      trên máy và **không hề chạy trên CI**, nên một hồi quy chỉ chúng bắt được
      sẽ merge được. Đây đúng lớp lỗi "tập gõ tay lạc hậu" mà `nut-song §5` dựng
      răng cho phía `package.json` — phía `ci.yml` chưa có răng nào.
      Sửa ở M04_ci (không phải M03): hoặc một step `npm test`, hoặc một cổng so
      `readdir(test/)` với `ci.yml` cùng cách §5 so với `package.json`.
      **Không** sửa tại chỗ trong đơn vị B3: `ci.yml` ngoài boundary M03/M08.

## 2026-08-27 · `check_worklog` so số bằng SUBSTRING nên xanh giả được (FR-036/B6)
Phát hiện khi thêm file test thứ 48 (`WL-01K9N8FR036B6`).

- [ ] `core/tests/check_worklog.py:108` kiểm số liệu bằng `doc in o` — **tìm chuỗi
      con trong CẢ file**. Đo được: sau B3/B5 số test thật là **47** và cổng XANH,
      nhưng không phải vì `web/WORKLOG.md` khai 47 — nó khai **46**; chuỗi `"47"`
      chỉ tình cờ xuất hiện ở chỗ khác trong file. Sang 48 thì hết trùng và cổng
      mới đỏ. Tức cổng này báo đúng vì **may**, và nó im lặng suốt một đơn vị việc.
      Sửa: neo vào đúng ô của bảng (`| Test | <n>,`), không quét cả file. Cùng lớp
      lỗi với `four-screens:168` (một điều kiện thành hiển nhiên đúng nên cổng
      xanh vô căn cứ) — ở đây là một điều kiện thành hiển nhiên đúng vì phạm vi
      tìm kiếm quá rộng.
      **Không sửa tại chỗ trong B6**: nó là cổng của đơn vị khác, và sửa một cổng
      trong lượt nó đang chấm mình là đúng thứ luật gốc cấm.


## 2026-08-28 · Khôi phục `multiwindow.inline.ts` — mất chú thích, và hai cổng đo HÌNH THỨC
Thay đổi: `git checkout --` của agent xoá công việc chưa commit; file khôi phục
từ `multiwindow.inline.js` (xem `WL-01K9NKUIVAMATFILE`).

- [ ] **Chú thích trong `multiwindow.inline.ts` là bản đắp lại, không phải bản
      gốc.** esbuild lột mọi chú thích, nên 21 hàm của FR-036→039 giờ không còn
      lời giải thích tại chỗ. Lý do còn trong `.factory/worklog/WL-01K9N*` +
      `.factory/fr/FR-036..040`. Cần một lượt đọc lại từng hàm và đắp chú thích
      từ worklog — không phải việc gấp, nhưng để lâu thì worklog cũng khó tra.

- [ ] `bon-trang-thai.test.js:112` — `ok(/kb\//.test(khoiBt), …)` đo một **CHÚ
      THÍCH**, không đo hành vi nào. Nó xanh khi nguồn có chuỗi `kb/` ở bất cứ
      đâu trong thân `veBienTap`, kể cả trong lời bình. Lộ ra vì bản khôi phục
      mất chú thích và cổng đỏ. Cùng lớp lỗi với `check_khai_mot_noi` §4 trước
      khi siết.

- [ ] `open-card.test.js:151` · `cua-so-doc.test.js:145` ·
      `tieu-de-khong-nhan-doi.test.js:50` — ba cổng đòi đúng **type annotation**
      của TypeScript (`(s: string)`, `querySelector<HTMLElement>`). Chúng đo cú
      pháp chứ không đo điều muốn nói (escape trước khi dựng thẻ · đo cuộn của
      `.bk-b` · mục lục đọc h2). Bản khôi phục mất kiểu ⇒ cả ba đỏ dù hành vi
      không đổi.

## 2026-08-28 · C6b — hai ô do chính lượt này mở ra
Thay đổi: `WL-01K9NMC6B` · màn `/video/nap/` + FE `ganNapVideo`/`ghiVideo`.

- [ ] **`gn.js` còn dư 5 BYTE** trên trần 100 KB (102395/102400). Bundle FE hết
      chỗ theo nghĩa thật. Tính năng FE kế tiếp KHÔNG nhét thêm được — phải TÁCH
      BUNDLE (tải theo màn) hoặc siết một khối cũ. Nới trần là bỏ một tripwire
      đang sát ngưỡng, và `page-weight:85-89` có tiền lệ "SIẾT, không nới".

- [ ] `page-weight.test.js` so `Math.round(byte/1024) <= 100`, nên nó **cho vượt
      tới 511 byte** mà vẫn xanh. Vừa lọt thật: `gn.js` 102666 byte (100.26 KB)
      báo "100 KB (ngưỡng 100)" và XANH. Đo bằng BYTE, đừng làm tròn — một
      tripwire làm tròn là một tripwire nới 0,5 KB cho mỗi lần sửa.

- [ ] Một bản ghi THỬ đã đi vào kho THẬT trong lượt kiểm bằng trình duyệt
      (`video/hoi-thao-ve-ngu-canh-agent-dang-ky-thu`). Đã xoá qua API nên byte
      còn trong `_recycle` (M08-R4), và `bam_cay(kb,_recycle)` đổi từ
      `ef94495f161ef0e5` sang `74a0412e3ab1b051`. `kb/` về đúng 1 bản ghi. Cần
      người dùng quyết: **ép xoá** bản trong `_recycle` hay để đó làm hồ sơ.
      Bài học: kiểm bằng trình duyệt phải trỏ server vào KHO TẠM (`KB_DIR`), y
      như mọi test làm — tôi chạy trên kho thật.

- [ ] `.f-che` trong `web/styles/prototype.css` (6 dòng, ~350 byte) thành CSS mồ
      côi sau khi WO-037 gỡ nút chế độ soạn. `markup-matches-css` không bắt vì nó
      đối chiếu theo chiều ngược. Ngoài `phạm_vi_ghi` của T03-83 nên không tự gỡ.
      Đáng gỡ: `gn.css` đang 102207/102400, dư 193 byte.

- [ ] `05_uiux/wireframes/SCR-05-form-viet-bai.md` mô tả HỢP ĐỒNG CŨ của mục
      3.4: `#### 3.4.1 <tên>` + 5 dòng bullet + nút `[+ tinh túy]` (dòng 69-71,
      109-113). WO-038 bỏ toàn bộ cấu trúc đó — mục 3.4 nay là một ô văn xuôi.
      Wireframe mô tả ngược với màn đã dựng là hỏng IM LẶNG: người sau đọc nó
      rồi dựng lại thứ vừa bỏ. Thuộc `05_uiux`, không phải module của WO-038.

## 2026-09-02 · BỐN số SCR trỏ hai thứ khác nhau — phát hiện khi viết M18 (FR-048)

- [ ] **`project_map.screens` và `05_uiux/wireframes/` dùng CHUNG một dãy số cho
  HAI thứ khác nhau, và bốn số đang đụng.** Đo trực tiếp:

  | số | `project_map` khai | file wireframe thật | lệch |
  |---|---|---|---|
  | `SCR-06` | màn Tài liệu (M10, `:568`) | `SCR-06-ba-man-nap.md` | khác màn |
  | `SCR-07` | nạp tài liệu (M10, `:568`) | `SCR-07-chung-cat.md` (**M12**) | **khác module** |
  | `SCR-08` | màn Video (M11, `:585`) | `SCR-08-tra-cuu-kho.md` (**M13**) | **khác module** |
  | `SCR-09` | nạp video (M11, `:585`) | `SCR-09-hoi-kho.md` (**M14**) | **khác module** |

  Ba trong bốn không chỉ khác màn — chúng trỏ sang **module khác hẳn**. Nên câu
  *"màn của module này là SCR-08"* hôm nay có **hai** câu trả lời mâu thuẫn, tuỳ
  người đọc mở file nào.

  **Không cổng nào bắt được**: `check_map` đối chiếu `modules` ↔ thư mục
  `06_modules/`, **không** đọc `screens` và **không** biết `05_uiux/wireframes/`
  tồn tại. Cùng lớp lỗ với `entities` không có chủ mà `FR-048 §1` vừa vá.

  **Chặn ngay ai đặt số tiếp theo**: `M18_nguoidung` cần một màn admin và đã phải
  khai `screens: []` + DỪNG thay vì chọn một số (`M18/ui_flow §0`,
  `workflow §4`). Ô này mở ra để lần sau không ai đoán.

  M03 sở hữu `05_uiux/**` từ `FR-042` nên ô nằm ở đây, không ở M18 — s6 đòi
  backlog module sạch, và một ô của module khác trong backlog của tôi thì nó
  chặn G6A của tôi vì một quyết định không phải của tôi.

- [ ] **⚠️ ẢNH HƯỞNG 18 MODULE — `check_g6a` đo *"AC có viết chữ `cmd`"*, không đo
  *"lệnh có chạy được"*.**
  Phát hiện qua `AC-2.2.1` của M03: nó khai `hard` với
  `cmd: node web/test/no-archived.test.js`, và **file đó không tồn tại**
  (đo 2026-09-03; 21/22 lệnh khác của M03 xanh). Theo `R3` nguyên văn — *"`hard`
  mà không có lệnh chạy được ⇒ nó là `soft`"* — AC này **đang là `soft`** trong
  khi spec frozen khai `hard`.
  Nguyên nhân, tại `core/tests/check_g6a.py:76`:
  `elif h and not re.search(r"cmd:|cùng lệnh", blk)` — cổng tìm **chuỗi**, `R3`
  đòi **lệnh chạy được**. Hai mặt của một cái tên, và cổng đo mặt dễ hơn.
  ⚠️ **Chính xác lớp lỗi `FR-051 §9`**: đo sự **tồn tại** của một chỗ nghẽn thay
  vì đo có gì **đi qua** nó. Nghiêm trọng hơn ở đây vì `check_g6a` là **điều kiện
  đóng G6A cho cả 18 module**.
  Cộng: chuỗi `cùng lệnh` cũng thoả phép tìm ⇒ một AC viết *"`hard` · cùng lệnh"*
  trỏ tới một lệnh đã hỏng thì **hai** AC im lặng cùng lúc.
  **Đề xuất cần chủ dự án duyệt**: thêm vế **rút đường dẫn sau `cmd:` rồi
  `Path(...).exists()`** — không chạy lệnh (chạy 22 lệnh trong một cổng quá đắt),
  chỉ đòi file tồn tại.
  · object: `core/tests/check_g6a.py:76` · `06_modules/M03_web/spec.md §2.2` ·
  `web/test/no-archived.test.js` (VẮNG) ⇒ cần **FR** (sửa cổng + sửa spec frozen)

- [ ] **BỐN AC dùng HAI id: `AC-2.3.9` ×2 và `AC-2.3.10` ×2.**
  Dòng 93 (*vòng đời bài*) và 156 (*biểu đồ không gõ tay*) đều `AC-2.3.9`;
  dòng 101 (*CRUD danh mục*) và 162 (*màn Danh mục*) đều `AC-2.3.10`.
  `check_g6a` lặp theo **khối** nên cả bốn **đều được kiểm** — **không** có bug
  ghi đè như `check_g6b S24`. Nhưng một tham chiếu *"AC-2.3.9"* trong task file,
  worklog hay PR **không phân giải được**, và `R3` đòi *"vi phạm chỉ ra được bằng
  một câu trỏ vào vật thể"*.
  Trong `testcases.md` tôi đặt tạm `2.3.9a/b` · `2.3.10a/b` để viết được ca —
  **đó là giải pháp tạm của tôi, không phải quyết định**. Spec phải đánh lại số.
  · object: `06_modules/M03_web/spec.md:93,101,156,162` ⇒ **FR id** (spec FROZEN)

- [ ] **`§5` chỏi `AC-2.1.2` trên cùng một con số: 9 vs 8.**
  `§5` khai *"9 bài lên site từ 13 bản ghi"*; `AC-2.1.2` khai *"8 bài từ 13"*.
  Test khẳng định **8** (`pass · 8 bài, 1 nhóm gộp`) và nó đọc số từ
  `mong.articles_on_site` của contract, **không** gõ tay ⇒ **AC đúng, `§5` sai,
  và test đúng vì nó không tin con số nào trong tài liệu.**
  Cùng `§5` khai *"7 test node"* — thực tế `web/test/` có **85** file.
  Con số **thứ tám** cùng lớp *tự khai* trong **tám** module liền — xem ô tổng ở
  `06_modules/M07_curate/backlog.md`.
  · object: `06_modules/M03_web/spec.md §5` ⇒ **FR id**

- [ ] **`§2.7` là một mục ĐÃ HẾT HẠN HOÀN TOÀN.**
  Nó viết *"`web/` chưa tồn tại. Mọi `cmd: node web/test/*.js` là **lệnh sẽ
  có**"*. Đo được: `web/test/` có **85** file, **21/22** lệnh của M03 xanh.
  Mục còn đặt ra thủ tục *"Điều kiện G6C: lệnh chạy thật, exit 0. Chưa chạy được
  ⇒ AC tụt `soft` ⇒ DRAFT + người chốt"* — cho một tình trạng **không còn**.
  ⚠️ Và trớ trêu: thủ tục đó **chính là** thứ cần cho ô thứ nhất ở trên. `§2.7`
  viết đúng luật, cho đúng ca, rồi **hết hạn trước khi ca đó xảy ra thật**.
  · object: `06_modules/M03_web/spec.md §2.7` ⇒ **FR id**

- [ ] **Ba AC khai `soft` mà có vế ĐO ĐƯỢC bằng máy.**
  `AC-2.3.1` (*"click là thao tác người"*): nhưng
  `body.api-co .api-only{display:block}` (0,2,1) **thắng**
  `[hidden]{display:none}` (0,1,0) là **số học độ đặc hiệu CSS** — đo được. Hệ quả
  **nhìn thấy được**: `#f-bai` và `#tv-meta` **luôn hiện** khi API chạy; nút *"Ghi
  vào kho"* bấm được khi chưa nạp gì; nút *"Mở form viết bài"* vô nghĩa. Và bình
  luận `web/styles/prototype.css:1319-1321` khai **đã chữa** — **nó chưa chữa** ·
  `AC-2.1.1` gộp *"bộ lọc hiện có còn đúng"* (có `only-approved.test.js` ⇒ `hard`)
  với *"đường render **mới** cũng lọc"* (`soft`); nhãn `soft` phủ cả hai làm vế
  thứ nhất **mất cổng trên giấy** ·
  `AC-2.5.1` — vế *"màn không có trong DOM"*
  (`multiwindow.inline.ts:1414-1420`) đo được, vế *"cảm nhận"* thì không.
  · object: `06_modules/M03_web/spec.md §2.1 §2.3 §2.5` ·
  `web/styles/prototype.css:1319-1321` ⇒ **FR id**

## Mở 2026-09-03 — đợt UI M12: T03-92 CHẶN vì thiếu proxy ở LÕI

> Đã dựng phần dựng được của `T03-92`: bảng khai `HANH_DONG_CHUNG_CAT` + helper
> `cumNutChungCat(ban)` gọi từ ĐÚNG MỘT chỗ (khối `.bk-t` của cửa sổ đọc), nên
> mọi cửa sổ — bài viết · tài liệu · video — đều mang cụm nút.
> `chung-cat-ui.test.js` (T03-96): **§1–§3 xanh**, §4–§6 đỏ vì ô dưới đây.
> `build-fe` xanh · `ssr-routes` · `page-weight` · `cua-so-doc` ·
> `chu-giao-dien` đều xanh — không phá gì.

- [ ] **`web` KHÔNG có proxy sang `:8790` — popover và `POST /job` của T03-92
  không có đường đi.**
  Đo 2026-09-03: `grep "8790\|chungcat\|/api/model\|/api/job"` trên
  `web/api/router.mjs` + `web/server.mjs` ⇒ **0 kết quả**.
  `ADR-05` (`Z8`) khai *"chỉ `web/` gọi service; trình duyệt gọi `web`"* — nên FE
  **không được** gọi thẳng `127.0.0.1:8790`, và cũng không nên: `M12-R7` đòi
  `X-Khoa-Loi`, tức FE mà gọi thẳng thì khoá dịch vụ phải nằm trong JS gửi tới
  trình duyệt. Đó là `CVE-2025-41258` theo một đường khác.
  ⇒ Cần **hai cửa proxy ở LÕI**: `GET /api/model` (đọc danh mục, để dựng bộ
  chọn) và `POST /api/job` (gắn `X-Khoa-Loi` từ env của server + `X-Nguoi-Dung`
  từ phiên, rồi chuyển tiếp). Cả hai thuộc `web/api/**` = **đất M08_api**, và
  `phạm_vi_ghi` của `T03-92` **không có** nó ⇒ **không nới tại chỗ** (R1).
  ⚠️ Và đây là chỗ `Z8` mua được một thứ thật: khoá dịch vụ **ở lại server**.
  Nếu ai đó "chữa nhanh" bằng cách cho FE gọi thẳng `:8790`, khoá đi ra trình
  duyệt và `M12-R7` mất nghĩa.
  ⇒ Trong lúc chờ: nút `tai-lieu` để **`bat: false`** kèm lý do *"cửa LÕI chưa
  mở"* — nút-nói-thật, đúng `S18` (không render nút gọi endpoint chưa có). Đổi
  sang `bat: true` là **một dòng bảng khai** khi proxy có.
  · object: `web/api/router.mjs` · `07_plan/M03_web/tasks/T03-92-*.md` ·
  `chungcat/src/api.py` (đích) ⇒ **cần đơn vị của M08_api**

- [ ] **Cổng `chung-cat-ui.test.js` của tôi đo sai chỗ BỐN lần — ghi để không lặp.**
  (1) đòi `data-act="chung-cat"` xuất hiện **literal** trong `.bk-t`, nhưng cách
      dựng đúng là `.bk-t` **gọi** helper ⇒ cổng phạt đúng cách làm đúng. Sửa:
      đo **quan hệ** (`.bk-t` gọi `cumNutChungCat(`), không đo vị trí chữ.
  (2) đo `disabled`/`title` trong bảng khai và trong `.bk-t` — hai chỗ không
      chứa chúng. Sửa: đo **thân helper**, nơi trạng thái nút được quyết.
  (3) regex bảng khai dừng ở `}` **đầu tiên** ⇒ báo thiếu `video`/`article`
      trong khi bảng có đủ: **đo một phần rồi phán về toàn thể**.
  (4) bốn phép PHỦ ĐỊNH **xanh rỗng** khi chưa có mã (*"không rẽ nhánh theo
      201"* tự đúng khi không có dòng nào). Sửa: `okPhuDinh()` — chưa có tính
      năng ⇒ in `--  chưa đo được`, KHÔNG in `ok`.
  Lớp lỗi chung, cùng lớp đã gặp ở sáu cổng M12: **cổng đo văn bản / đo cấu
  trúc phụ thay vì đo luật**. Nó nguy hiểm hơn cổng lọt vì cổng đỏ oan là cổng
  bị người tắt, và cổng xanh rỗng là cổng trông như đang canh.
  · object: `web/test/chung-cat-ui.test.js` ⇒ **đóng bằng mã**

## Mở 2026-09-03 (lượt 2) — T03-90 dựng xong, nhưng VƯỢT TRẦN CSS 222 byte

> Màn `/dot-hai/` dựng theo `T03-90`: bảng khai `DOT_HAI` (5 dịch vụ, thêm một
> dịch vụ = một dòng) · số đọc từ `contracts/*.sample.v1.json` (không gõ số) ·
> `man-hinh.json` khai CÙNG LƯỢT · hai shell **byte-identical** · i18n đủ ba
> khoá · `cat_khi_khac: true` nên view không phình sang trang khác.
> Render thật: 5 mốc `m12`–`m16` · 4 chip THỢ + 1 BIÊN · dải nói-thật *"chưa
> phải hệ đang chạy"*. **12 cổng web xanh**, `token-only` xanh.

- [ ] **`page-weight` ĐỎ: `gn.css` 102 622 / 102 400 byte — quá 222.**
  Ràng buộc của đợt UI M12 nói rõ: *"gn.css chỉ còn ~150B dư — khối CSS mới
  viết SÁT, vượt trần thì **mở đơn vị giảm-béo riêng chứ không nới trần**"*.
  Tôi đã viết sát **ba lượt**: 1283 → 671 → 320 → **222** byte quá trần, bằng
  cách (a) bỏ `.dh-g`/`.dh-l` để dùng lại `.kpi`/`.cds`; (b) đặt thẻ dịch vụ
  **lên `.kp`** (cùng vai: ô có viền, KHÔNG bấm được, trong panel) và `.dh-c`
  chỉ còn thêm phần xếp dọc; (c) bỏ ellipsis/mono/shadow khỏi khối.
  Cắt nữa là cắt vào **ba quyết định thị giác** (chip vùng có màu · thẻ không
  hover · dải nói-thật), và cắt icon mask thì `rail-trai` đỏ (`AC2` đòi
  `iconMask >= soTab`).
  ⇒ Cần **đơn vị giảm-béo riêng** trên `prototype.css` (100 KB — chắc chắn có
  luật chết). KHÔNG gộp vào đơn vị tính năng: gộp làm diff không review được
  và R1 mất địa chỉ.
  ⚠️ **KHÔNG nới trần.** Trần này là phép đo *"lần tải đầu người dùng phải
  chờ bao lâu"*, và nới nó là đổi câu trả lời thay vì đổi sự thật.
  · object: `web/styles/prototype.css` · `web/test/page-weight.test.js` ·
  `07_plan/M03_web/tasks/T03-90-*.md` `AC5` ⇒ **đơn vị giảm-béo của M03_web**

- [ ] **`/dot-hai/` đổi hướng LẦN THỨ TƯ — ghi để lần sau tính giá trước.**
  `screen_inventory §Đợt hai` ghi chỉ đạo **2026-09-01 lần ba**: *"xóa
  /dot-hai/ ở web — prototype trước, sau apply TỪNG MODULE lần lượt"*, và web
  đã **gỡ sạch 5 lớp**. Chỉ đạo **2026-09-03** đảo lại: *"màn /dot-hai thì phải
  implement cả giao diện cho đẹp vào nhe"*.
  Chỉ đạo mới thắng — đó là quyền của chủ dự án, và tôi đã dựng theo nó. Nhưng
  một màn bị gỡ rồi thêm lại là **hai lần công**, và `T03-90` được viết trên
  tiền đề 09-01 (bản trước lần ba) nên nó không biết mình đang đảo một quyết
  định. Đã ghi cả bốn lượt vào `screen_inventory`.
  ⇒ Hai thứ KHÔNG đổi qua cả bốn lượt, giữ làm mốc: `prototype/dot-hai/` là
  **bản đối chiếu** (prototype thắng khi lệch), và **`Z7`** — dịch vụ không có
  màn riêng, nên `/dot-hai/` là màn TOÀN CẢNH, không phải năm màn cho năm module.
  · object: `05_uiux/screen_inventory.md` · `07_plan/M03_web/tasks/T03-90-*.md`
  ⇒ **đã ghi; cần PM đối chiếu T03-90 với chỉ đạo lần ba**

- [ ] **Cổng `chung-cat-ui` ĐO SAI HỢP ĐỒNG sau khi T08-20 mở cửa proxy.**
  Nó đòi mã FE gửi `X-Khoa-Loi` + `X-Nguoi-Dung` (§5 "Fact 2"). Sau T08-20 điều
  đó là **ĐIỀU PHẢI CẤM**: khoá dịch vụ nằm ở env SERVER, trình duyệt gọi
  `/api/model` + `/api/job` của `web` và **không bao giờ cầm khoá**. Cổng viết
  trước khi cửa proxy tồn tại nên nó đóng băng thiết kế cũ.
  Phải sửa khi T03-92 vào việc: đổi hai phép đo header thành *"mã FE KHÔNG chứa
  chuỗi `x-khoa-loi`"* — phép phủ định, và lần này nó **đo được** vì tính năng
  gửi request đã tồn tại.
  · object: `07_plan/M03_web/tasks/T03-92-cong-chua-dung.test.js` ·
  `web/api/tho-cua.mjs` ⇒ **T03-92 sửa trước khi dựng**

- [ ] **`gn.css` chỉ còn 39 byte dưới trần** (102361 / 102400). Lượt này đã viết
  sát LẦN BA để lấy lại 261 byte (`.dh-canh`→`.al` · `.dh-v*`→`.ex`+`.ex.bn` ·
  `.dh-lam`/`.dh-t`→bộ chọn cấu trúc · bỏ `linecap/linejoin` ở mask `dothai`).
  39 byte nghĩa là **luật CSS kế tiếp nào cũng vượt trần** — kể cả một dòng.
  Chỗ béo thật đã đo: 8 luật `.tb[data-nav]::before` lặp ~120 byte boilerplate
  SVG mỗi cái ≈ **960 byte trùng**, mà `url()` của CSS không ghép chuỗi được ⇒
  phải đổi cách (sprite mask một file, hoặc `<svg>` inline trong shell).
  · object: `web/styles/prototype.css` · `web/test/page-weight.test.js` ⇒ **đơn vị riêng**

- [ ] **`markup-matches-css` KHÔNG quét `web/render/trang.mjs`.** Nó quét
  `multiwindow.inline.js` + `shell.html`. Vì thế `.dh-ma` sống ở markup của
  `dhThe()` **không có luật CSS** mà không cổng nào báo — lỗi lọt đúng lớp mà
  cổng này sinh ra để bắt. Đã cho `.dh-ma` một luật (qua `.dh-c header
  span:first-child`), nhưng **cái lỗ vẫn còn**.
  · object: `web/test/markup-matches-css.test.js` · `web/render/trang.mjs`
  ⇒ **thêm nguồn quét (đơn vị test)**

- [ ] **`/dot-hai/` VẪN SỐNG và bây giờ nó CHỎI rule 5.** Chỉ đạo mới (`rule.md`
  mục 5, `T03-97`): *"gom tất cả vào /dot-hai/ không phải ý tưởng tốt"* — mỗi
  module một URL. Nhưng màn gom vẫn còn nguyên: `man-hinh.json` dòng 114–117 ·
  view `v-dothai` + tab rail trong HAI shell · khối `.dh-*` trong
  `prototype.css` · `dhKpi()`/`dhThe()` trong `trang.mjs`. `T03-97` không khai
  file nào trong số đó nên nó **không tháo được, và cũng không chỉ định ai tháo**.
  Đây là quyết định của NGƯỜI, không phải việc agent tự làm — tháo là bỏ công
  T03-90 vừa xong. Ba lối: (a) giữ `/dot-hai/` làm trang overview, mỗi module
  vẫn có URL riêng — hai thứ cùng tồn tại, không phạm rule 5; (b) tháo hẳn, mở
  đơn vị riêng; (c) đổi thành trang chuyển hướng.
  · object: `core/assets/man-hinh.json` · `web/render/shell.html` ·
  `web/styles/prototype.css` · `07_plan/M03_web/tasks/T03-97-…md` ⇒ **NGƯỜI chọn lối**

- [ ] **`/dot-hai/` là lần đổi hướng thứ NĂM của cùng một màn.** `screen_inventory`
  đã ghi bốn lần; rule 5 là lần năm, và nó đến SAU khi màn đã dựng xong. Không
  phải lỗi ai — nhưng bốn lần dựng-rồi-đổi là dấu hiệu **chốt hình dạng màn
  trước khi dựng** đang thiếu một nhịp. Ghi để retro s10 có số liệu, không phải
  để phán.
  · object: `05_uiux/screen_inventory.md` ⇒ **s10-retro**

- [ ] **`trang chủ` chỉ còn 9 byte dư** (61431/61440) và `gn.css` còn 9 byte
  (102391/102400). T03-102 tách chunk theo màn nên `gn.js` thoải mái (100947),
  nhưng HAI trần kia thì không: **markup hay CSS thêm vào shell là vượt ngay**.
  ⇒ `T03-95` (khối việc trên Dashboard) **CHẶN ở đây**, không chặn ở dữ liệu:
  nó thêm markup vào đúng trang đang sát trần. Hai lối: dựng khối đó bằng chunk
  của trang chủ (khuôn T03-102), hoặc chạy `T03-99` (giảm béo) trước.
  · object: `web/test/page-weight.test.js` · `web/render/shell.html` ·
  `web/styles/prototype.css` ⇒ **quyết trước khi làm T03-95**

- [ ] **`dinh-dang-mo.test.js` — cổng FLAKY.** Phép kiểm *"khai vượt 25 MB ⇒
  413"* thỉnh thoảng nhận `ngat` (ECONNRESET) thay vì 413: đua giữa lúc server
  đóng kết nối và lúc client đọc xong đầu đề. Đo: đỏ 1 lần trong suite, rồi
  **3/3 xanh** khi chạy riêng. Một cổng đôi khi đỏ oan là cổng dạy người ta
  chạy lại thay vì đọc — và đó là cách một đỏ THẬT bị bỏ qua.
  · object: `web/test/dinh-dang-mo.test.js:213` ⇒ **đơn vị test sửa phép đo**

- [ ] **`.rise` giữ `opacity:0` cho thẻ tạo bằng JS.** IntersectionObserver chỉ
  quét panel CÓ SẴN trong shell lúc khởi động, nên một `<section class="pn
  rise">` dựng sau đó nằm đúng chỗ, cao 813px, và **vô hình**. Lượt này tránh
  bằng cách không dùng `rise`, nhưng cái bẫy còn đó cho mọi màn dựng-bằng-JS
  sau (T03-94/95 đi đúng đường này).
  ⇒ Hoặc observer quan sát cả thẻ mới (MutationObserver), hoặc `.rise` chỉ được
  đặt bởi SSR và tài liệu nói rõ điều đó.
  ⚠️ KHÔNG phép kiểm DOM nào bắt được: `innerHTML` có 3450 ký tự,
  `getBoundingClientRect()` trả kích thước thật, `display:block` — chỉ `opacity`
  nói "không". **Chỉ ảnh chụp mới thấy.**
  · object: `web/styles/prototype.css` `.rise` · `web/plugins/home-motion/**`
  ⇒ **đơn vị riêng, trước T03-94/95**

- [ ] **`T03-95` CHẶN ở tường dung lượng — hai tiền đề của quyết (a) không đo được.**
  PM ghi *"gn.css 91380/102400, dư 11KB sau T03-99"*: `T03-99` **chưa chạy** lúc
  đó (gn.css thật 102391, dư 9 byte). Lượt này đã chạy T03-99 → 102038, dư 362.
  Nhưng lối (a) vẫn không lọt: thẻ `<script>` chunk = **+48 byte** HTML trang chủ
  (dư 9) · chunk = **+8010 byte** tổng tải đầu của `/` (dư 326). Lối bundle chung
  thiếu **59 byte** (khối 1512, gn.js dư 1453) — đã gọt ba lần, không hội tụ.
  ⇒ Mã đã hoàn nguyên để suite xanh; cổng đỏ-trước đỗ ở thư mục task.
  Ba lối chờ quyết ghi trong `T03-95-khoi-viec-dashboard.md`.
  · object: `07_plan/M03_web/tasks/T03-95-khoi-viec-dashboard.md` ·
  `web/test/page-weight.test.js` ⇒ **NGƯỜI chọn lối**

- [ ] **`v-dothai` tốn 598 byte HTML trên MỌI trang.** Shell là một file chứa
  mọi view, nên markup của màn overview (người mở thỉnh thoảng) đi theo cả tám
  trang. Đo: 1046 byte thô, 598 sau khi cắt chú thích. Đúng ứng viên chunk
  T03-102, và nó là 598 byte trả lại cho `trang chủ` (đang dư 10).
  · object: `web/render/shell.html` · `web/plugins/chungcat/src/` ⇒ **đơn vị riêng**

- [x] **`T03-99` — giảm béo `gn.css`: XONG 2026-09-04.** Phép BỎ boilerplate
  trong 8 mask data-URI: `stroke='%23000'`→`stroke='red'` (màu VÔ NGHĨA với mask
  — mask chỉ đọc alpha, `.tb::before` tô bằng `currentColor`) và bỏ
  `stroke-linecap/linejoin` ở 7 mask (dấu nét tròn ở 16px không phân biệt được).
  `stroke-width='1.6'` GIỮ — nó đổi hình nhìn thấy, mà `AC2` cấm đổi hình.
  Đo: gn.css **102391 → 102038** (bớt 353 byte, dư 9 → 362). `rail-trai` xanh:
  8 tab đủ icon, `mask` vẫn tô `currentColor`. `token-only` xanh.
  · object: `web/styles/prototype.css` · `web/test/page-weight.test.js`

- [ ] **`WO-045` · bấm Sửa một tài liệu từ `/tai-lieu/` thành Nạp mới.**
  `suaTaiLieu()` gọi `doiView("naptailieu")` RỒI MỚI điền form; `doiView` thấy
  view không có trong DOM (nó bị cắt khỏi mọi trang không phải nap) nên
  **ĐIỀU HƯỚNG**, và phần điền form chạy trên một trang đang unload ⇒ mất hết.
  Đo trên trình duyệt: `tv-1l` rỗng · `up-tv-kq` rỗng · `tv-gui` = "Ghi vào kho".
  Quy chủ: commit `8535a26` (2026-08-30), **không phải phiên này** — lộ ra lúc
  đo ranh giới cho T03-104.
  ⚠️ LỚP LỖI: `doiView` **có thể điều hướng**, và mọi người gọi điền DOM SAU nó
  đều mang cùng lỗi (`suaTuCua:1815-1816` là ca thứ hai). Không cổng nào bắt
  được vì mọi cổng FE render một trang rồi đo trang đó — không ai đo *"bấm ở
  trang A, kết quả ở trang B"*.
  · object: `.factory/wo/WO-045-…md` ·
  `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:1772,1815`
  ⇒ **PM xếp vào plan**

- [ ] **`T03-104` — tiền đề ĐÚNG, đã xác nhận bằng máy.** JS ba màn `nap` thật
  sự chỉ cần trên `/…/nap/`: view `v-naptailieu` bị cắt khỏi trang khác (đo:
  `/tai-lieu/` có 0, `/tai-lieu/nap/` có 1), và `doiView` điều hướng khi view
  vắng — nên không có đường nào chạm form nap từ trang khác mà không tải lại.
  Ứng viên tách, đo trong `.js` đã build:
  `napHienVatFE` ~1587B · `ganNapThuVien` ~1419B · `ganNapVideo` ~722B
  (`manNapCua` ~116B PHẢI Ở LẠI — cửa sổ đọc dùng nó trên mọi màn).
  ⚠️ Phụ thuộc phải mang theo: `kqTV` (25 chỗ dùng, 24 trong vùng nap + 1 ở
  `suaTaiLieu`) · `doGon` · `DUOI_MEDIA` · `MEDIA`. Ranh giới **không sạch** ở
  đúng chỗ `WO-045` đang hỏng — nên `WO-045` nên chạy TRƯỚC, không sau.
  · object: `07_plan/M03_web/tasks/T03-104-giam-beo-gn-js.md` ⇒ **PM chốt thứ tự**

- [x] **`WO-045` / `T03-105` — ngữ cảnh SỬA sống qua điều hướng: XONG 2026-09-04.**
  `suaTaiLieu` CẤT ngữ cảnh vào `sessionStorage` **TRƯỚC** khi gọi `doiView`
  (gọi sau là quá muộn — `doiView` điều hướng và mọi dòng sau chạy trên trang
  đang unload). `noiLaiSua()` đọc + **XOÁ NGAY** ở `khoiDong()`, cạnh khuôn
  `data-moBai` đã có. Phần điền form tách thành `dienFormSua()` để dùng lại —
  chép đôi thì chỗ thứ hai sẽ lệch.
  `sessionStorage` chứ không `localStorage`: ngữ cảnh sửa là việc của MỘT tab
  đang làm dở. Sửa cả ca thứ hai (`suaTuCua`) — cùng lớp lỗi.
  Đo trên trình duyệt THẬT, cả hai chiều:
  · `/tai-lieu/` → Sửa → `/tai-lieu/nap/`: `tv-1l` = "Đôi điều về XGBoost" ·
    `up-tv-kq` = "Đang SỬA xgboost-stap-by-step…" · `tv-gui` = "Lưu thay đổi" ·
    `sessionStorage` = null (đã xoá)
  · vào `/tai-lieu/nap/` bằng đường thường: form TRỐNG, nút "Ghi vào kho"
  Suite: exit 0 · **2795 ok** · `gn.js` 101743/102400.
  · object: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` ·
  `web/test/sua-dung-man.test.js` · `web/test/o-media-sua.test.js` ·
  `07_plan/M03_web/tasks/T03-105-…md`

- [ ] **Một cổng đo VỊ TRÍ HÀM thay vì đo TÍNH CHẤT — đã sửa, ghi lớp lỗi.**
  `o-media-sua.test.js` quét riêng thân `suaTaiLieu` tìm `hienVatCho = m`. Tách
  hàm (hành vi KHÔNG đổi) làm nó ĐỎ. Đã đổi sang quét CẢ đường sửa + thêm vế
  phủ định.
  ⚠️ Lớp lỗi: một cổng neo vào TÊN HÀM sẽ phạt mọi lần refactor đúng, và người
  bị phạt sẽ học cách **không refactor** — đúng chiều ngược với thứ cổng muốn.
  Còn bao nhiêu cổng khác neo kiểu đó thì chưa đếm.
  · object: `web/test/o-media-sua.test.js:152` ⇒ **đơn vị test rà lượt sau**

- [x] **`T03-104` — giảm béo `gn.js` bằng chunk `napvideo`: XONG 2026-09-04.**
  `gn.js` **101743 → 98277** (bớt **3466 byte**, AC1 đòi ≥2000). Chunk chỉ tải
  trên `/video/nap/` — đo trên server thật: `/` · `/video/` · `/tai-lieu/nap/`
  đều **0** tham chiếu `gn-napvideo.js`.
  Chọn lát cắt VIDEO chứ không THƯ VIỆN, và lý do là phép đo: vùng thư viện
  (6131B) đụng `hienVatCho` · `SUA_TL` · `MEDIA` đầy đủ, mà `__MEDIA__` là
  **6590 byte** — nhân đôi nó vào chunk sẽ đẩy TỔNG tải đầu trang nap VƯỢT trần.
  Vùng video chỉ cần `MEDIA.video_host`, lấy qua `globalThis.__GN_MEDIA__`.
  ⚠️ Ngoại lệ CÓ Ý THỨC với luật "chunk tự chứa" của T03-102: chỉ DỮ LIỆU,
  không hàm · đọc LÚC GỌI nên thứ tự nạp không thành ràng buộc · một chiều.
  Đo trên trình duyệt thật: host sai ⇒ "Nơi phát này không nằm trong danh sách
  nhận: youtube.com · tiktok.com · fac…" và `vd-meta` ẩn; host đúng ⇒ "Nhận —
  youtube…" và `vd-meta` hiện.
  Suite: exit 0 · **2796 ok**.
  · object: `web/plugins/napvideo/src/napvideo.inline.ts` ·
  `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` ·
  `web/render/assets.mjs` · `web/render/trang.mjs` · `web/test/_render.mjs`
  · `07_plan/M03_web/tasks/T03-104-giam-beo-gn-js.md`

- [ ] **NĂM cổng cùng đo SAI CHỖ khi một khối dời sang chunk — đã sửa, ghi lớp lỗi.**
  `nap-video` · `mo-ta-va-nut-nap` · `o-nhan-nap` · `moc-fe-con-that` ·
  `man-video` đều đọc RIÊNG `multiwindow.inline.ts/js` (hoặc `gnJs`) rồi kết
  luận về TOÀN THỂ mã FE. `T03-104` dời `ghiVideo`/`ganNapVideo` sang chunk —
  hành vi KHÔNG đổi — và cả năm đỏ.
  Sửa: `maFeNguon(duoi)` + `taiSan().jsMoi` trong `_render.mjs`, **dẫn xuất từ
  thư mục** `web/plugins/*/src/**` — thêm một chunk sau này không phải sửa cổng
  nào. Danh sách gõ tay là chỗ nó lạc hậu im lặng.
  ⚠️ Và một cổng (`nap-video`) từng XANH **do cửa sổ quét tràn**: nó cắt 2200 ký
  tự từ `function ganNapVideo` và bắt được chuỗi `idVideo(` của HÀM KẾ BÊN. Dời
  hàm ra chunk (thành hàm cuối, hết chỗ tràn) mới lộ ra nó chưa bao giờ đo thứ
  nó khai đo. Đã đổi sang cắt thân bằng ĐẾM NGOẶC.
  · object: `web/test/_render.mjs` `maFeNguon()` · năm file cổng trên
  ⇒ **đơn vị test rà: còn cổng nào cắt bằng cửa sổ cố định?**

- [ ] **Vùng nạp THƯ VIỆN (6131B) chưa tách — chặn ở `__MEDIA__` 6590 byte.**
  Nó đụng `hienVatCho` (11 chỗ) · `SUA_TL` (7 chỗ) · `MEDIA` đầy đủ, và nhân đôi
  bảng media vào chunk làm trang nap NẶNG LÊN. Muốn tách thì phải công bố thêm
  dữ liệu qua `__GN_MEDIA__` và dời cả `dienFormSua`/`noiLaiSua` — một đơn vị
  riêng, không phải phần đuôi của T03-104.
  · object: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:916-1136`
  ⇒ **PM xếp nếu còn cần chỗ trong `gn.js`**

- [x] **`T03-95` — khối việc trên Dashboard + badge rail: XONG 2026-09-04.**
  Ba số (đang chạy · cần xử lý · xong) + MỘT link, cắm vào mốc `#kpi` ĐÃ CÓ —
  **0 byte HTML mới trong shell** (trang chủ dư 11 byte) và **0 luật CSS mới**.
  Badge trên mục nav **Chưng cất** dùng `data-mount` + luật `[data-mount]:empty
  {display:none}` sẵn có — **0 nhánh `if`**. Đo cả hai chiều trên trình duyệt:
  rỗng ⇒ `display:none`; đặt "3" ⇒ `display:block`.
  ⚠️ Ở **BUNDLE CHUNG**, ngược `phạm_vi_ghi` của PM (`plugins/chungcat`), và lý
  do là phép đo: thẻ `<script>` chunk tốn **+48 byte** HTML trang chủ mà nó dư
  **11**; còn `gn.js` sau T03-104 dư 4123 và khối ~1512 ⇒ bundle chung là chỗ
  DUY NHẤT nó lọt. Ghi trong mã để reviewer nhịp ⑤ soi.
  Thêm một nhãn `chưng cất` trước ba ô: không có nó, ba số nằm dưới tiêu đề
  panel **KHO** và người đọc hiểu "đang chạy 2" là 2 bản ghi kho — khối nói SAI
  vì chỗ đặt, dù mọi con số đều đúng. (Thấy trên ảnh chụp, không thấy trong mã.)
  `gn.js` 99865/102400 · trang chủ 61430/61440 · suite exit 0 · **2815 ok**.
  · object: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` ·
  `web/test/chung-cat-quan-ly.test.js` · `web/package.json` ·
  `07_plan/M03_web/tasks/T03-95-khoi-viec-dashboard.md`

- [ ] **SÁU cổng cùng hỏng vì một lần dời mã — con số cuối cùng của lớp lỗi này.**
  `nap-video` · `mo-ta-va-nut-nap` · `o-nhan-nap` · `moc-fe-con-that` ·
  `man-video` (hai lần) đều neo vào MỘT FILE hoặc MỘT CÁCH VIẾT thay vì vào
  tính chất. Đã sửa hết bằng `maFeNguon()` + nới phép so.
  ⚠️ Và tôi tự thêm MỘT phép phủ định SAI trong lúc sửa: *"không tên miền nào
  gõ tay trong `hostVideoHopLe`"* — hàm đó CÓ một tên gõ tay có chủ đích
  (`PHU = { "youtube.com": ["youtu.be"] }`, vì `youtu.be` là tên rút gọn cùng
  nhà mà FE tự sinh). Thêm rồi gỡ ngay trong cùng lượt.
  ⇒ Bài học hai chiều: cổng neo sai chỗ phạt refactor đúng; và một phép phủ
    định quét cả thân hàm sẽ phạt mọi ngoại lệ ĐÃ ĐƯỢC ghi lý do.
  · object: sáu file cổng trên ⇒ **đơn vị test rà lượt sau**

- [x] **`T03-94` — màn hàng đợi nháp `/chung-cat/nhap/`: XONG 2026-09-04.**
  Dùng LẠI chunk `chungcat` (nó là màn DƯỚI url module chưng cất — chỗ đúng cả
  về byte lẫn về nghĩa). Shell chỉ một mốc RỖNG; khung dựng bằng JS.
  · `⚠ đã tỉa N` dựng **TRƯỚC** cụm nút — người duyệt thấy trước khi ký. Ba ca
    phân biệt: `>0` cảnh báo · `0` "không có" · `null` **"CHƯA ĐO"** (khác hẳn).
  · Bản chưa sửa NÓI RA "Trùng bản AI gốc" — im lặng đọc ra như "chưa tải xong".
  · **BA** nút, không bốn: `S18` cấm render nút gọi cửa chưa có (Xoá).
  Đo trên trình duyệt: rỗng ⇒ "Chưa có bản nháp nào" (khác dải "KHÔNG hỏi
  được"); 1 nháp ⇒ mở chi tiết + `?nhap=<ulid>`; Duyệt ⇒ 409 nguyên văn *"kho
  đã có docs/… — sửa bài đó, đừng duyệt nháp thành bản thứ hai"*; Trả lại lý do
  "abc" ⇒ chặn NGAY ở FE, lý do đủ dài ⇒ `tra_lai` và **lý do hiện lại trên thẻ**.
  Suite exit 0 · **2856 ok** · trang chủ 61433/61440 · tải đầu max 279325/280576.
  · object: `web/plugins/chungcat/src/chungcat.inline.ts` · `core/assets/man-hinh.json`
  · `web/render/shell.html` ×2 · `web/render/trang.mjs` · `web/test/chung-cat-nhap.test.js`

- [x] **`cat_khi_khac` mang HAI nghĩa — đã tách 2026-09-04.**
  (1) *"cắt khỏi trang khác"* — việc của render (`catNap`/`catMotMan`);
  (2) *"là màn NẠP"* — thứ cụm `+ nạp` lọc theo.
  `T03-98` đã va đúng chỗ này (`/dot-hai/` mọc trong dropdown `+ nạp`), và
  `T03-94` va lần nữa: nó CẦN nghĩa (1) — mốc view tốn ~50 byte mà trang chủ dư
  10 (đo: 61488/61440 khi chưa cắt) — nhưng KHÔNG được nhận nghĩa (2).
  ⇒ `trang.mjs:1398` lọc cụm `+ nạp` bằng `cat_khi_khac && module`. Chỉ màn NẠP
  mới có `module`, nên vế thứ hai tách đúng hai nghĩa mà không thêm cờ nào.
  · object: `web/render/trang.mjs` · `core/assets/man-hinh.json`

- [ ] **`catMotMan` khớp CHUỖI MỞ chính xác — một thuộc tính thêm vào làm phép
  cắt TRƯỢT, im lặng.** `const mo = '<div class="view" id="v-…">'`; mốc của tôi
  có `data-mount` nên `indexOf` không thấy, view không bị cắt, và trang chủ vượt
  trần — không có thông báo nào, chỉ một con số byte.
  ⇒ Hoặc `catMotMan` dùng regex cho phép thuộc tính, hoặc có một phép kiểm
    "mọi màn `cat_khi_khac` thật sự VẮNG khỏi trang khác".
  · object: `web/render/trang.mjs:262` ⇒ **đơn vị sau**

- [ ] **Nút "Sửa" của màn nháp NÓI THẬT là chưa có màn soạn.** Cửa `POST …/sua`
  đã có (T08-22) nhưng chưa có màn biên tập nháp, nên nút báo *"Màn soạn nháp
  chưa dựng — cửa `…/sua` đã có, đơn vị sau nối vào"* thay vì làm một nút giả.
  · object: `web/plugins/chungcat/src/chungcat.inline.ts` ⇒ **PM xếp đơn vị soạn nháp**

- [ ] **NGÂN SÁCH BYTE FE ĐÃ CẠN — việc tiếp theo chạm `gn.css` sẽ đỏ.**
  Đo sau `T03-107` (2026-09-04): `gn.css` **102364/102400 — còn 36 byte** ·
  tải đầu `/chung-cat/nhap/` **280517/280576 — còn 59 byte** (`gn.js` còn 1518).
  `T03-107` đã phải gộp ba chỗ CSS trùng nhau + cắt hai nhãn chỉ để vừa. Không
  còn phép gộp rẻ nào nhìn thấy được.
  ⇒ Hai lối, NGƯỜI chọn: (a) một đợt giảm béo `gn.css` theo khuôn `T03-99`;
  (b) FR nới trần — nhưng `FR-027f` viết "SIẾT, không nới", nên (b) là đảo một
  quyết định đã chốt và cần lý do đo được.
  · object: `web/test/page-weight.test.js` · `web/test/o-nhan-nap.test.js §4`
    ⇒ **NGƯỜI chọn (a)/(b)**

- [ ] **`npm run api` thiếu `CHUNGCAT_KHOA_LOI` ⇒ `/api/job` trả 403.**
  Đo 2026-09-04 bằng Playwright trên `/tai-lieu/`: console báo
  `403 @ /api/job?n=200`. Nguyên nhân: `web/api/tho-cua.mjs:58` đọc khoá từ env
  SERVER, `chungcat/src/api.py` đọc CÙNG tên biến — hai dịch vụ phải mang cùng
  một khoá, và **không lệnh dev nào khai điều đó**. Người chạy `npm run api`
  trần sẽ thấy màn Chưng cất chết mà không hiểu vì sao.
  ⇒ Cần một lệnh dev khai cả hai (khuôn `dich-vu.json`), hoặc `tho-cua.mjs` trả
  câu lỗi nói RÕ "server chưa đặt `CHUNGCAT_KHOA_LOI`" thay vì 403 trần.
  · object: `web/package.json` scripts · `web/api/tho-cua.mjs:58`

- [ ] **`prompt()` của trình duyệt còn sống trong chunk `chungcat`** —
  `web/plugins/chungcat/src/chungcat.inline.ts:478` dùng
  `prompt("Vì sao trả lại? …")` cho lý do TRẢ LẠI một bản nháp. Đi ngược
  `FR-022` (*"hộp thoại của sản phẩm, bỏ confirm()/prompt() của trình duyệt"*),
  và commit `4eb6a37` đã dẹp lớp này ở chỗ khác.
  Phát hiện 2026-09-04 lúc soát chunk tìm byte — không cổng nào canh, nên nó
  sống được. ⇒ Cần một cổng cấm `prompt(`/`confirm(` trong `web/plugins/**`
  (đơn vị TEST), và một `<dialog class="dlg">` cho ô lý do (khuôn `T03-107`).
  ⚠️ Cả hai đều tốn byte, mà tải đầu `/chung-cat/nhap/` còn **5 byte** — phải
  đi sau đợt giảm béo `gn.css`.
  · object: `web/plugins/chungcat/src/chungcat.inline.ts:478`

- [ ] **`gn.css` có 107 selector KHAI TRÙNG — vật liệu cho đợt giảm béo.**
  Đo 2026-09-04 (quét `([^{}]+)\{([^}]*)\}` trên bundle đã cắt bình luận):
  107 selector xuất hiện ≥2 lần. Nặng nhất: `.tb` 2× 720B · `.cd` 3× 683B ·
  `.bt` 2× 665B · `.dm-tab` 3× 643B · `.top` 3× 566B · `.rc-r` 3× 566B ·
  `body` 3× 466B.
  ⚠️ KHÔNG gộp mù: rule sau đè rule trước, và gộp đổi thứ tự so với các selector
  NẰM GIỮA hai bản. Mỗi phép gộp phải đọc cả đoạn ở giữa — đó là một đơn vị
  việc riêng (khuôn `T03-99`), không phải việc làm chen giữa một task khác.
  · object: `web/styles/prototype.css` ⇒ **đơn vị M03 riêng**

- [ ] **Panel chi tiết việc /chung-cat/ THIẾU timeline log — mô tả có, AC không
  đo, nên nó rơi im lặng.** Chủ dự án bắt trên màn thật 2026-09-05 (panel chỉ
  5 trường tĩnh: việc·giai đoạn·nguồn·model·lần gửi). T03-93 dòng 16-17 khai
  "timeline log theo mã việc" + nguồn `GET /api/viec/<id>` (chi tiết + log),
  nhưng 5 AC của nó không vế nào đo timeline ⇒ cổng chung-cat-quan-ly xanh
  trên panel không log (grep timeline|log trong cổng = 0). Lớp lỗi
  `#cổng-không-đỏ-được`, cùng bệnh check_g6a đã ghi.
  ⇒ Việc dev: (1) render timeline từ trường log của GET /api/viec/<id> (tho-cua
  đã trả nguyên); (2) THÊM VẾ cổng "chi tiết có ≥1 dòng timeline khi log có,
  và dòng mang mốc giờ + giai đoạn" — sửa cổng CÙNG LƯỢT với mã.
  Tick khi: cổng có vế mới + panel màn thật hiện timeline (screenshot worklog).
  · object: `07_plan/M03_web/tasks/T03-93-man-xuong.md:16` ·
  `web/test/chung-cat-quan-ly.test.js` · ảnh chủ dự án 2026-09-05

- [x] **REGRESSION CHẶN NGHIỆP VỤ: nạp tài-liệu + form bài-viết chết vì
  `slugGoiY` bị dời sang plugin napvideo.** Chủ dự án bắt trên màn thật
  2026-09-05 (console: `ReferenceError: slugGoiY is not defined` tại
  `ghiBanGhiThuVien` gn.js:1313 khi bấm GHI VÀO KHO). Đo: hàm chỉ còn định
  nghĩa ở `napvideo.inline.ts:78` (đơn vị video vừa làm), trong khi
  `multiwindow.inline.ts` gọi ở 3 chỗ (1017 · 2637 · 2639) và `gn.js` build ra
  chứa 0 định nghĩa. Hàm dùng chung nằm trong chunk một-màn = mồ côi xuyên
  chunk. ⇒ Dev: (1) đưa `slugGoiY` về nơi CẢ HAI với tới (bundle chung hoặc
  util chung các plugin import), build lại + restart; (2) THÊM CỔNG chống
  lớp lỗi này — vế "mọi định danh gọi trong gn.js phải được định nghĩa trong
  gn.js" (parse build ra, hoặc bật kiểm tsc xuyên plugin) — vì suite hiện đo
  markup, không đo đường bấm nút trên bundle thật, nên regression này XANH
  toàn suite. Đỏ_do: đơn vị napvideo (dev).
  ✅ HOTFIX PM 2026-09-05 02:4x (chủ dự án yêu cầu trực tiếp — chặn test):
  slugGoiY trả về multiwindow.inline.ts (bundle chung, kèm chú "nhà thật");
  bản chunk napvideo GIỮ (chunk tự chứa, khuôn kqTV). Đỏ-trước đo trên
  multiwindow.inline.js: goi=3 dinh_nghia=false → sau build: dinh_nghia=true;
  server :8787 restart (rule 6), SERVED gn.js dinh_nghia=true; 7 cổng xanh
  (nut-song·chung-cat-ui·nap-video·thu-vien-nap·man-video·page-weight·token-only).
  ⚠️ VẾ CÒN MỞ cho dev: cổng "mọi định danh gọi trong gn.js phải được định
  nghĩa trong gn.js" — chưa cài, tách ô dưới.
  · object: `web/plugins/napvideo/src/napvideo.inline.ts:78` ·
  `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:1017,2637,2639` ·
  console 2026-09-05 (gn.js:1313)


- [ ] **Cổng chống định-danh-mồ-côi-xuyên-chunk — chưa cài** (tách từ ô
  regression slugGoiY, phần hotfix đã đóng). Suite hiện đo markup nên
  ReferenceError trên bundle build XANH toàn suite. Dev: một cổng parse
  gn.js dựng ra (acorn sẵn có trong esbuild ecosystem hoặc regex khai báo
  hàm) — mọi định danh hàm được GỌI phải được ĐỊNH NGHĨA trong cùng bundle;
  đỏ được trên fixture thiếu-hàm.
  · object: `web/test/` (cổng mới) · bài học slugGoiY 2026-09-05

- [x] **REGRESSION thứ hai cùng phiên test: nạp tài liệu 422 vì FE gửi `media`
  OBJECT trần — FR-052 đòi MẢNG.** Chủ dự án bắt 2026-09-05 (422 tại
  ghiBanGhiThuVien, panel in "X schema · media: {...}"). KHÔNG phải vấn đề
  mime: `text/markdown` QUA schema (FR-039 kiểm hình dạng, không enum) — thủ
  phạm là schema `media: type array, minItems 1` (FR-052 áp 09-03) mà hai chỗ
  gửi của FE (multiwindow 1069 sửa · 1093 nạp mới) vẫn `media: hienVatCho`
  object. Mọi nạp tài liệu MỚI chết từ lúc FR-052 ký, PDF cũng vậy — bản
  xgboost sống vì nạp trước đó.
  ✅ HOTFIX PM 2026-09-05 03:0x (chủ dự án chặn test, yêu cầu trực tiếp):
  bọc mảng `[hienVatCho]` cả 2 chỗ + build + restart :8787; served gn.js
  mang bản vá (grep = 2); cổng thu-vien-nap · media-cua-so · api-crud ·
  nut-song · chung-cat-ui · hien-that đều 0.
  ⚠️ VẾ CÒN MỞ (dev): cổng luong-nap-bai/thu-vien-nap KHÔNG bắt được vụ này
  — chúng không POST hình dạng frontmatter THẬT của FE qua schema thật. Cần
  một vế "payload FE dựng ra phải qua validate --strict" (fixture kho tạm).
  · object: multiwindow.inline.ts:1070,1095 · frontmatter.schema.json §media

- [ ] **Trần HTML trang chủ vỡ vì HAI đơn vị cộng dồn** — `61980 / 61440` (dư
      **-540**). Đo được 2026-09-05, và quy chủ rõ ràng:

      | bỏ gì | home HTML |
      |---|---|
      | nguyên trạng | 61980 ⇒ ĐỎ |
      | bỏ `.md` + `.txt` của `T03-111` | **61433** (dư 7) |
      | bỏ 5 dòng video của `T01-45` | 61980 — KHÔNG đổi (đã lọc đúng ở 3 chỗ) |

      ⇒ Hai chip `md` · `txt` của `T03-111` (xem trước văn bản) là phần vỡ trần.
      Trần vốn chỉ còn **7 byte**, nên đơn vị nào chạm vào sau cũng vỡ — đây là
      cộng dồn của hai đơn vị, không phải lỗi của một.

      KHÔNG tự sửa: `.md`/`.txt` là công việc đang dở của phiên khác (có
      `$vi_sao` khai rõ trong `media-mime.json`), và nới trần thì `FR-061` đã
      lập tiền lệ là phải có FR ký. Ba lối, chủ dự án chọn:
      ① `T03-111` cho `.md`/`.txt` một cờ *"phục vụ được, KHÔNG làm chip lọc"* —
         bảng mime đang gánh hai việc khác nhau (map content-type vs facet lọc);
      ② FR nới trần HTML trang chủ, nói rõ vì sao trang chủ được nặng thêm;
      ③ giảm số chip trên trang chủ (quyết định sản phẩm).

- [ ] **`gn.css` / trần HTML đã hết chỗ về mặt cấu trúc.** Mọi CSS mới của một
      MÀN nay phải đi qua chunk (`WO-048`, `WO-050`): `#cc-hv`, `.cct*`, `.tr*`
      đã dời. Chưa có cơ chế CSS-theo-màn chính thức trong `assets.mjs` — mỗi
      chunk tự tiêm `<style>`. Đáng một đơn vị hạ tầng nếu màn thứ ba cần nó.

- [ ] **Màn /chung-cat/ — hai lỗ UX chủ dự án hỏi 2026-09-05:** (1) thẻ `xong`
  KHÔNG có link mở bản nháp tương ứng (?nhap=<ulid> ở /chung-cat/nhap/) —
  người thấy 12 xong mà không có đường bấm tới kết quả; (2) bộ đếm "đang chạy"
  GOM cả job `cho·gửi 2/2` (hết trần M12-R6, không bao giờ chạy nữa) — trạng
  thái chết hiển thị như sống. Việc: thêm link nháp trên thẻ+panel chi tiết;
  tách nhóm "hết lượt" (đỏ/cam) khỏi "đang chạy", khớp phân loại UI với
  ly_do_dung backend. · object: màn /chung-cat/ (chungcat.inline.ts) · ảnh
  chủ dự án 2026-09-05 03:5x

- [ ] **Trần HTML trang chủ vỡ LẦN HAI, lần này do `shell.html`** — đo
      2026-09-05 lúc bàn giao `T03-113`: `61914 / 61440` (dư **-474**).

      Quy chủ: `git diff --numstat web/plugins/home-pages/shell.html` = **+37
      dòng, 0 xoá**, mtime 11:14 — một phiên KHÁC vừa thêm một khối
      (`<div class="cds" id="dhthe" data-mount>` …). Shell đi theo **mọi**
      trang, nên 37 dòng đó nhân với tám màn.

      Của tôi thì KHÔNG: chip `md`/`txt` đã lọc đúng (đo: 16 chip, không có
      md/txt), và mọi thứ `T03-112`/`T03-113` thêm đều nằm trong CHUNK.

      Đây là lần thứ hai trần này vỡ vì cộng dồn giữa hai đơn vị chạy song
      song trên cùng working tree — và nó sẽ còn lặp. Ba lối:
      ① mỗi đơn vị một worktree (luật `s8` đã ghi, chưa ai theo);
      ② shell tách theo màn thay vì MỘT bản cho cả tám;
      ③ FR nới trần trang chủ, nói rõ vì sao.

- [x] **QUY CHỦ xong vụ trang chủ +37 dòng vượt trần (61915/61440).** git diff
  shell.html = nav button "Chưng cất" + view toàn cảnh T03-90/T03-102 comment
  — mã của ĐỢT FE M12 các đơn vị trước (phiên dev FE), không phải bí ẩn.
  Trần trả về xanh là AC5 của T03-112 (đơn vị đang mở) — không mở ô mới,
  dòng này chỉ chốt quy chủ để khỏi truy lại. · object: git diff --numstat
  web/render/shell.html (+37/0) 2026-09-05

- [ ] **Bản nháp chưng cất không có `title`** — đo trên màn thật 2026-09-06:
      `article/phan-tich-cai-dat-va-thiet-lap-hermes-tren-vps` có
      `frontmatter.title = None`, nên THẺ, tiêu đề CỬA SỔ và TOAST đều hiện
      slug. FE không bịa được tiêu đề, và bịa cũng sai — chỗ phải sửa là bên
      TẠO: `chungcat/src/worker.py::_dung_nhap` (cùng khuôn `T12-20`).
      Thuộc M12, mở ô ở đây vì M03 là bên PHÁT HIỆN.
- [ ] **Cổng `nut-tai-xuong.test.js` neo bằng `indexOf("Tải xuống")`** — một
      chú thích chứa đúng chuỗi ấy đẩy cửa sổ cắt đi chỗ khác và cổng đỏ OAN
      (gặp thật 2026-09-06). Neo phải là một dấu KHÔNG xuất hiện trong văn
      xuôi. Thuộc đơn vị test `T03-110b`.
- [ ] **Cổng `chung-cat-nhap.test.js` grep chuỗi `Đưa lên site`** nên không
      phân biệt được một NÚT với một NHÃN/ô chọn. `T03-119` phải đổi chữ ô
      chọn thành *"Duyệt xong cho hiện trên site luôn"* để tránh đỏ oan —
      chữ trên màn đang bị hình dạng của cổng nắn. Thuộc `T03-110b`.
- [ ] **`prototype.css` nhận bản THỨ HAI của luật `.tx`** (một phiên khác,
      chú thích `T03-117 hotfix`, 2026-09-06 18:44) làm `gn.css` vỡ trần 354
      byte. `T03-119` đã gộp về `TX_CSS` và giữ hai sửa đúng của bản ấy
      (`details.tx`, token `--card`/`--line`). Ô này để RÀ: còn chỗ nào khác
      đang giữ hai bản của cùng một luật không.
- [ ] **Trần bundle chép cứng ở BẢY chỗ** — `page-weight.test.js` ·
      `chung-cat-hover` · `sinh-transcript-ui` · `mo-ta-va-nut-nap` ·
      `nap-ba-khung` · `o-nhan-nap` · `tab-theo-doi-chung-cat`. `FR-068` phải
      sửa cả bảy, và sáu trong bảy chỗ không ai nhớ là có. Trần phải là MỘT
      nguồn (một file khai, mọi cổng đọc). Thuộc đơn vị test `T03-110b`.
- [ ] **`--primary` === `--destructive` ở hệ TỐI** (`#F87171`), và ở hệ sáng
      `--primary` cũng là đỏ `#C81E1E`. Nút chính sơn màu thương hiệu thì
      trông y hệt nút nguy hiểm — `T03-120` né bằng nền trung tính, nhưng
      GỐC là hai vai dùng chung một màu trong `tokens.css`. Tách token là
      việc của UI/UX, không phải né ở từng màn.
- [ ] **CSS TIÊM từ chunk không có ai canh cú pháp.** Bug thật 2026-09-06:
      `TX_CSS` mở đầu bằng văn xuôi (chú thích bị `catBinhLuanJs` gỡ mất cặp
      dấu), bộ phân tích CSS nuốt nó làm selector rác và **rule đầu tiên biến
      mất** — không một lỗi nào được báo, cổng vẫn xanh. `T03-121` vá một chỗ
      (`TX_CSS`) và thêm vế `1g2`; các chuỗi CSS tiêm KHÁC (`KHOI_CSS` của
      cctab/chungcat…) chưa ai soi. Cần một cổng CHUNG: mọi chuỗi CSS tiêm
      phải parse được.
- [ ] **`hoi()` còn nhánh dự phòng `prompt()/confirm()`** khi markup
      `<dialog id="dlg-hoi">` vắng — vi phạm `FR-022` CÓ SẴN, không phải của
      `T03-121`. Vế `3d` của `menu-tai-dot-hai.test.js` đang GHI NHẬN nó; vế ấy
      ĐỎ nghĩa là nợ đã trả, lúc đó bỏ vế đi.
- [ ] **Kho chưa có bản ghi nào mang hiện vật NHỊ PHÂN** (đo 2026-09-06: 0
      media khác `text/vtt`). Nên nhãn `PDF (.pdf) · 2.8 MB` của `T03-121` mới
      thử trên nút dựng đúng khuôn, chưa trên một PDF thật. Nạp một tài liệu
      là việc của người, và nó cũng mở khoá vế nghiệm thu ấy.
- [ ] **Cổng `chunk-tu-chua` bỏ chuỗi mà KHÔNG hiểu regex literal.** Một dấu
      nháy nằm trong `/…/` bị nó tưởng là mở chuỗi ⇒ LỆCH PHA cả file ⇒ tố oan
      những dòng cách đó hàng nghìn ký tự (đo 2026-09-06: nó tố `model(` và
      `local(`, hai mảnh nằm giữa hai câu chữ CÓ SẴN). Thuộc đơn vị test.

## Mở 2026-09-08 — `T03-126` bước 1 (thẻ 2 tầng)

- [x] **`T03-126` khai wireframe là `SCR-23` — SỐ ĐÃ CÓ CHỦ.**
      ✅ ĐÓNG 2026-09-08 — wireframe dựng ở `SCR-25`, và `T03-126` đã sửa
      cả `phạm_vi_ghi` lẫn hai tiêu đề BƯỚC 1/BƯỚC 2.
      ⚠️ Vế CÒN LẠI tách thành ô riêng ngay dưới: `rule 9` vẫn chưa nói gì
      về số SCR, nên lần sau vẫn đụng.
      · object: `05_uiux/wireframes/SCR-25-the-hai-tang.md` ·
      `07_plan/M03_web/tasks/T03-126-…md` · worklog `WL-01M1ZK7P4N2R8T5V3QXWBDHF9`
      `SCR-23-phieu-chung-cat.md` (07-09 20:12) và `SCR-24-nut-header-cua-so.md`
      (08-09 02:43) đều sinh SAU khi task được soạn. Viết đúng như task khai là
      **hai wireframe cùng số 23** — và cái sau ghi đè cái trước nếu ai đó dùng
      cùng tên file.
      ⇒ Wireframe đã dựng ở **`SCR-25-the-hai-tang.md`** (max+1, cùng luật
      `rule 9` đang dùng cho task id). `T03-126` cần sửa MỘT dòng `phạm_vi_ghi`
      + một dòng ở BƯỚC 1.
      ⚠️ Đây là lớp lỗi sẽ lặp: `rule 9` cấp id cho **task**, không nói gì về
      **SCR**. Wireframe cũng do nhiều phiên sinh song song.
      · object: `07_plan/M03_web/tasks/T03-126-the-hai-tang-thumbnail.md`
      (`phạm_vi_ghi` dòng 1) · `05_uiux/wireframes/SCR-25-the-hai-tang.md`

- [x] **`T03-126` bước 2 khai thêm HAI cột `mau` + `icon` vào `media-mime.json`
      — cột `icon` là BẢN THỨ HAI của một danh sách đã có.**
      ✅ ĐÓNG 2026-09-08 — chỉ thêm **một** cột `mau` (7 dòng tài liệu), 0 cột
      `icon`. Cổng `3b` đo được điều đó: thân hàm `nenThe` không được gõ tên
      định dạng nào, và nó **ĐỎ ĐƯỢC** (fixture gõ cứng `"pdf"` ⇒ đỏ).
      Dòng nhóm `video` KHÔNG khai `mau` — chốt câu 2 của chủ dự án.
      · object: `core/assets/media-mime.json` (`$comment_mau` + 7 dòng) ·
      `web/render/trang.mjs::nenThe` · `web/test/the-hai-tang.test.js` vế 3a-3d
      Đo: `trang.mjs:1337` dựng `ICON_CO` bằng cách **đọc chính thư mục**
      `public/icon/`, và `public/icon/XUAT-XU.md` khai thẳng luật *"tên file =
      ĐÚNG giá trị của chip… nhờ vậy thêm một `.svg` là có icon mới, 0 dòng mã —
      và không cần một bảng ánh xạ, thứ sẽ là bản thứ hai của danh sách file"*.
      ⇒ Thêm cột `icon` **đảo** chính luật đó: từ *thêm 1 file* thành *thêm 1
      file + nhớ 1 dòng bảng*. Chỉ cột **`mau`** là thứ chưa tồn tại (hôm nay
      `--c-*` khoá theo `source_type`, nên 5 định dạng tài liệu dùng chung MỘT
      màu — lỗ thật, `SCR-25 §3`).
      · object: `07_plan/M03_web/tasks/T03-126-…md` (BƯỚC 2 dòng 1) ·
      `public/icon/XUAT-XU.md` · `web/render/trang.mjs:1337`

- [ ] **`rule 9` cấp id cho TASK nhưng KHÔNG nói gì về số `SCR`.**
      Tách từ ô trên. Wireframe cũng do nhiều phiên sinh song song, và số đụng
      nhau **không cổng nào kêu** — hai file cùng số 23 chỉ lộ khi có người đọc.
      ⇒ Hoặc mở `rule 9` cho mọi artifact đánh số (task · SCR · WO · FR), hoặc
      một vế trong `check_rule_surfaces` đếm số trùng trong `05_uiux/wireframes/`.
      · object: `.claude/rule.md` (mục 9) · `05_uiux/wireframes/`

- [ ] **`page-weight` trang chủ ĐỎ — 268 byte của người khác, 652 byte của
      `T03-126`, và vế này KHÔNG xanh được từ bên trong đơn vị ấy.**
      Ba số đo 2026-09-08, tách bạch — không ước:
      ```
      trần                      61 440
      TRƯỚC tầng nền            61 708   vượt   268  ← nợ CÓ SẴN
      SAU   tầng nền            63 200   vượt 1 760
      ⇒ T03-126 thêm             1 492   (652 video+tài liệu · 840 bài viết)
      ```
      ⚠️ 840 byte sau là GIÁ TRỰC TIẾP của việc chủ dự án đảo câu 1 chiều
      2026-09-08 (*"tài liệu và bài viết chưa có"* ⇒ MỌI loại có nền), không
      phải một hồi quy. Nó đổi CỠ của việc còn lại: trước khi đảo cần dọn ~900
      byte, nay cần **~1 760**.
      **Chủ của 268**: `web/render/shell.html` (mtime **2026-09-08 01:14**) ·
      `server.mjs` · 5 file `web/api/**` · 2 plugin — tất cả **sửa chưa commit**
      từ phiên khác (`FR-011`, bàn biên tập chung). Phép đo đầu tiên của phiên
      này, trước khi chạm bất cứ gì, đã là 61 708.

      ⚠️ **Giả định của `SCR-25 §6` SAI, và ghi ra vì nó mua một quyết định**:
      §6 đề xuất hoãn vùng lưới trang chủ như cách CÔ LẬP chi phí, và chủ dự án
      chốt câu 4 trên giả định ấy. Đo xong: một `shell` chứa markup của **mọi**
      màn (`trang-chu` 62 724 · `tat-ca` 62 731 — chênh **7 byte**), nên 24 thẻ
      của màn Tất cả nằm trong HTML trang chủ dù người dùng không thấy chúng.
      Tắt lưới 4 thẻ vẫn đáng làm — nó bớt 4 thẻ trên MỌI trang — nhưng nó
      **không** chuyển vế đỏ thành xanh. Và gỡ SẠCH tầng nền cũng không: còn 268.

      ⇒ Ba lối, **NGƯỜI chọn** (hai trong ba động vào đất người khác hoặc vào
      một hợp đồng đã chốt, nên dev không tự chọn):
      **(a)** phiên đang giữ 268 byte kia commit + tự trả — rồi đơn vị này còn
      nợ 652, vẫn đỏ;
      **(b)** một đơn vị GIẢM BÉO riêng cho `shell`/`the()` — đây là chỗ có mỏ
      thật, nhưng nó là đất đang có người sửa (`<scope-check>`);
      **(c)** đưa ảnh ytimg sang hydrate phía client (`data-yt="<id>"` 22 byte
      thay URL 78 byte) — bớt ~56 byte/thẻ video, nhưng mất ảnh khi không JS,
      tức đổi một vế của `SCR-25 §5` (*offline vẫn đọc được*) → cần NGƯỜI duyệt.
      · object: `web/test/page-weight.test.js` (vế *"trang chủ"*) ·
      `web/render/trang.mjs:506` · `web/render/shell.html` ·
      worklog `WL-01M1ZK7P4N2R8T5V3QXWBDHF9`

- [ ] **`.ph-d` trôi khi cuộn** — `FR-076 §4`. Năm điều khiển toàn app nay ở
      `.ph`, mà `.ph` nằm trong `.wrap` nên nó cuộn theo nội dung; chỗ cũ
      (`.top`) là `position:fixed`. Không ai yêu cầu sticky nên `T03-130` không
      làm, nhưng cái giá là thật — ghi để lần sau thấy vướng thì có địa chỉ,
      không phải phát hiện lại. object: `web/styles/prototype.css` `.ph-d`

- [ ] **`npm test` che 116 cổng** — chuỗi `&&` của `package.json:scripts.test`
      dừng ở `page-weight.test.js` (thứ 13/129), mà cổng đó ĐANG ĐỎ từ
      2026-09-05 (`WO-055`). Chạy rời từng file 2026-09-09 phát hiện **6 cổng
      đỏ khác** không ai thấy: `api-guard` · `opacity-khong-pha-contrast` ·
      `man-video` · `man-tai-lieu` · `moc-fe-con-that` · `mot-bien-mau`.
      Sửa: đổi `&&` thành một runner chạy hết rồi tổng hợp — "một cổng đỏ làm
      116 cổng biến mất" là đúng thứ `R2` cấm. object: `web/package.json:scripts.test`

- [ ] **TikTok nhúng: CDN trả 403** — khung nhúng của ta ĐÚNG (trang nhúng vẽ
      đủ tác giả, caption, 251 like), nhưng `vx-bdp.tiktokv.com/video/tos/...`
      trả 403. Đo tách bạch 2026-09-09: mở THẲNG
      `https://www.tiktok.com/embed/v2/<id>` ở tab top-level, **không có app
      của ta trong đường đi** — vẫn 403 y hệt. Không phải lỗi phía mình. Ghi
      lại để lần sau không ai đi sửa `referrerpolicy` hay `allow=` cho nó.
      object: `core/assets/media-mime.json` dòng `tiktok`

- [ ] **`mock/index.html` ở 99,9% trần** — 272 136/272 384 trước `T03-131`, tức
      còn **248 byte** cho mọi tính năng chạm `gn.js`. Đơn vị ấy phải cắt tới
      ba lượt để lọt. Cùng gốc với nợ `WO-055`; ô này ghi con số để lần sau
      không ai tưởng mình vừa làm gì sai. object: `web/test/page-weight.test.js`

- [ ] **Cửa sổ douyin thiếu câu giải thích — hết byte** — nay chỉ có nút trơ
      "Mở ở nguồn ↗", nên chủ dự án 2026-09-09 tưởng cửa sổ hỏng và báo lại.
      Câu *"Nguồn không cho nhúng"* tốn **31 byte** mà `mock/index.html` không
      có (272 384/272 384). Đã thử ba cách rút gọn, đều vẫn vượt. `FR-074 §3`
      chốt sẵn đường đúng: *"nới trần mua thời gian, KHÔNG trả nợ — đường đúng
      là dời vào chunk"*. Câu giải thích này là **lần đầu món nợ ấy làm hỏng
      một thứ người dùng THẤY**, không chỉ một con số trong cổng.
      object: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` nhánh `data-ngoai`

- [ ] **`?dang=goc` lưu ra tên SHA, và `inline` thay vì `attachment`** — nút
      "Bản gốc" của cửa sổ đọc lưu file thành `6714ee19086f.pdf` chứ không phải
      `[Reading]-XGBoost.pdf`. Đo 2026-09-09: `?dang=goc` **302** sang
      `/api/articles/media/<sha>`, và route đó đặt
      `content-disposition: inline; filename="<12 hex đầu>.pdf"`. Theo chuẩn,
      `Content-Disposition` của server **thắng** thuộc tính `download`, nên
      `data-ten` FE truyền vào bị vứt. `inline` còn làm trình duyệt MỞ thay vì
      LƯU. Sửa: route media nhận `?ten=` (hoặc tra `ten_goc`) và trả `attachment`
      khi được gọi qua `dang=goc`. object: `web/api/articles.mjs:485`

- [ ] **5 file tải về mang tên UUID — KHÔNG tái hiện được**
      Chủ dự án báo 2026-09-09 (ảnh `chrome://downloads`: 5 file tên UUID v4,
      không đuôi, *From http://127.0.0.1:8787*), rồi xác nhận **"giờ ko bị nữa"**.
      Đo cùng ngày: mọi route xuất trả 200 kèm `Content-Disposition` đúng tên;
      bấm thật ra `cai-dat-va-thiet-lap-hermes-tren-vps.txt`. FE **không có** chỗ
      nào `createObjectURL` để tải (chỉ một blob trong lib để tạo Web Worker) —
      mà UUID-có-gạch là vân tay riêng của tải từ `blob:`. File cũng không còn
      trong `Downloads` để đọc.
      **Để MỞ, không đóng**: một lỗi tự hết là một lỗi chưa hiểu. Ai gặp lại thì
      chụp `chrome://downloads` **và** tab Network của cú bấm ấy.

- [ ] **`gn.js` HẾT TRẦN — chặn mọi tính năng FE mới** (WO-082 vượt 513 byte:
      104961/104448). `WO-083` đã đo bốn đường lấy lại byte, **cả bốn đều 0**:
      bảng nhúng đã chiếu sạch · không hàm chết · chú thích đã cắt · thụt đầu
      dòng đã bị `minifyWhitespace` bỏ từ WO-057. `TX_CSS` không trả về CSS
      được vì `gn.css` cũng vỡ. Tách `home-motion` (6469 B) thì HTML trang chủ
      dư 9 byte và tổng tải đầu của `/` dư 326 (`trang.mjs:1792`) — đỏ chỉ
      chuyển chỗ. ⇒ **Cần quyết định TRẦN, không phải tối ưu.** `FR-061` cấm
      nới trần bundle chung nên ô này chỉ tick được bằng một FR id.
      Object: `.factory/wo/WO-083-lay-lai-byte-gn-js.md`

- [ ] **`check_g6b` chỏi chính luồng PATCH — 21 task vướng.** Cổng phán *"chạm
      file test mà không phải đơn vị test (R1)"* cho mọi task có file test
      trong `phạm_vi_ghi` mà tên không mang `-test-`. Nhưng PATCH bước 5 bắt
      **chính task sửa bug** viết cổng tái hiện ĐỎ TRƯỚC — nên luồng đúng luôn
      luôn vi phạm cổng. Đã vướng: T03-129 · T03-130 · T03-131 · T03-136 ·
      T08-38 · T12-31 · T12-33…T12-37 (và 10 task nữa).
      Hai lối, cần người chọn: (a) tách mỗi bug thành task-sửa + task-test —
      đúng chữ R1 nhưng gấp đôi giấy tờ cho mọi bug; (b) sửa cổng để CHO PHÉP
      một task ghi ĐÚNG cổng của chính nó, và chỉ đỏ khi nó ghi cổng của task
      KHÁC — đó mới là thứ R1 định chặn.
      Object: `core/tests/check_g6b.py` · đo 2026-09-09

- [ ] **`grid2` không có trần Ở SSR — HTML trang chủ lớn TUYẾN TÍNH theo kho.**
      Đo 2026-09-09 sau `WO-082`: trang chủ 65669/61440 byte, và **0 byte** CSS
      hay JS nhúng lại — nó nặng thuần tuý vì đang phát **34 thẻ `.cd`**.
      `trang.mjs:590` `tatCa.map(...)` không slice, khác `/tat-ca/` vốn đã có
      `trangTatCa` + `NGUONG.moiTrang`.
      `WO-082` đặt trần lên cái NHÌN THẤY (đúng, vì ba màn loại lọc ở FE bằng
      `.off`) nên nó chữa "tràn màn" mà KHÔNG chữa byte. Hệ quả: mỗi bản ghi
      mới đẩy `page-weight` xa thêm, và trần HTML trang chủ đang là thứ khoá
      đường dời-vào-chunk (`FR-061a §3`).
      Hướng cần đo trước khi mở WO: cho ba màn loại danh sách RIÊNG ở server
      (thay vì cùng `grid2` rồi lọc ở FE) — lúc đó slice ở SSR không giấu bản
      ghi khỏi màn đã lọc nữa.
      Object: `web/render/trang.mjs:590` · đo 2026-09-09

