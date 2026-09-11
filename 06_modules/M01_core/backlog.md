# backlog — M01_core (chết ở G6C)

> Nợ do một thay đổi CỤ THỂ vừa gây ra. Không phải TODO, không phải ý tưởng.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## 2026-09-11 · KÉO THEO từ lượt M13 — một cổng của M01 PHÁ dữ liệu của cây đang dùng
Mở bởi dev M13 (`WL-01M27G9E22KJEPTBX3SCP25AG1` — sự cố đã khắc phục). Kho **thật** của chủ dự án
không hề hấn gì; thiệt hại nằm ở worktree `../gn-m13`.

- [ ] **`core/tests/check_running.py` CHẠY THẬT `dung_lai_db.py` và `xuat_kho.py` trên `kb/` của cây**
      **đang dùng.** Hai lệnh ở `RUNNING.md:173-174` không có cờ `--fix|--ghi|--ky` và không nằm trong
      `GHI_KHONG_CO` (chỉ có `07_curate/curate.py`), nên nhánh “chỉ kiểm cú pháp” không bắt chúng.
      Đo 2026-09-11 trên worktree: `.vtt` trong `kb/_media` checkout ra CRLF ⇒ sha256 lệch tên ⇒
      `dung_lai_db` từ chối giữa chừng, để lại **DB RỖNG**; `xuat_kho` sau đó coi 16 file export là
      **mồ côi** và **xoá** chúng. Lưới `WO-039` trong chính cổng có báo vết của `sinh_kb_mock.py`
      nhưng không chặn hai lệnh này và không hoàn tác. Trên `main` vô hại (DB và export khớp) — và
      đó chính là lý do nó sống lâu mà không ai thấy.
      Đóng bằng: thêm cả hai vào `GHI_KHONG_CO`, hoặc chạy chúng với `KB_DIR` trỏ thư mục tạm — một cổng
      không được phá thứ nó đang đo.
      · object: `core/tests/check_running.py:37,45,109` · `RUNNING.md:173-174` · `core/tools/{dung_lai_db,xuat_kho}.py`

- [ ] **`RUNNING.md:54` nói sai về clone mới.** Câu *“Clone mới chưa có DB: chạy `dung_lai_db.py` một lần
      để dựng”* không chạy được hôm nay: `kb/_media/*` bị `.gitignore` trừ vài ngoại lệ (3/8 file),
      nên một clone sạch luôn dừng ở *“kho thiếu byte”*. Đo hai lần: `WL-01M24MFFK9T8GQSYBXZTZ17C9J`
      (T04-9, lúc tính chuyện cho CI dựng kho thật) và `WL-01M27G9E22KJEPTBX3SCP25AG1` (hôm nay).
      · object: `RUNNING.md:54` · `.gitignore:95` · `core/tools/dung_lai_db.py`

## 2026-09-01 · C1 đóng G-6/G-7, và nó để lại nợ ở M02
Thay đổi: `core/assets/dia-chi.json` (mới) · `validate.py` · `check_dia_chi.py`
(mới) · `check_khung.py` · `test_gates.py` · `core/pyproject.toml` · `kb-mock/**`.
Worklog: `WL-01K9W1C1`.

- [ ] **`M01-R3` không đỏ được cho ĐÚNG ca nó mô tả** *(lộ ra bởi chính C1)*.
      Luật: *"thêm cổng vào `validate.py` mà không có test phá đúng luật đó"*,
      bề mặt **S3**, cơ chế `check_rule_surfaces.py:19-33`.
      Cơ chế thật là `n_test >= cong` — **so hai TỔNG**, không phải đối ứng từng
      cổng. Hiện `20 cổng / 42 test`, tức **dư 22**.
      Đo trên chính C1: `git diff` cho **+4** `errs.append(` trong `check()` và
      **+0** `def test_` trong `test_gates.py`. Cổng vẫn **xanh**.
      ⇒ ca luật mô tả (*thêm cổng, không thêm test*) **đi qua được**, và sẽ còn
      đi qua thêm 22 lần nữa trước khi tỉ lệ chạm ngưỡng. Nó chỉ đỏ khi ai đó
      XOÁ test, không đỏ khi ai đó THÊM cổng.

      Bốn cổng mới của C1 **có** test — nhưng ở `check_dia_chi.py`, không phải
      `test_gates.py`. Cộng với ô "mười cổng vắng trong CI" bên dưới thì thành
      một vòng khép kín khó chịu: **cổng canh-cổng-không-có-test không thấy
      chúng, còn test thật của chúng thì không chạy trong CI.**

      **Không sửa ở đây**: đối ứng từng-cổng-một-test đòi một cách ÁNH XẠ cổng
      → test (đặt tên? chú thích? id?), và đó là một quyết định thiết kế về
      cách khai luật, không phải một dòng. Đổi ngưỡng thành `n_test >= cong + k`
      chỉ dời chỗ dư, không chữa hình dạng sai của phép đo.

- [ ] **⛔ CHẶN CI · KÉO THEO M02 — `kb/` thật chưa di trú.**
      `kb/docs/xgboost-taylor-bac-hai.md` khai `citations_sampled: 3 /
      verified: 3`; máy đếm **15 / 0**. Sau C1 đó là ba lỗi validate.
      **KHÔNG tự sửa ở đây**: `kb/**` là boundary của **M02_kb**, không phải
      M01 — nới vào C1 là đúng thứ `check_g6b` sinh ra để bắt.
      Lệnh khi làm: `validate kb/ --fix` rồi `dung_lai_db.py` (đường file→DB
      duy nhất, FR-034) — vì `xuat_kho.py` chạy tự động sau mỗi lần web ghi
      và nó ghi DB→file, nên sửa file mà không đẩy vào DB là sửa xong bị lùi.
      **Đo 2026-09-01**: `ci.yml:43` chạy `validate.py kb/ --strict` và lệnh đó
      nay **exit 1**. Tức C1 vừa hạ CI xuống đỏ, và nó ở đó cho tới khi ô này
      được làm. Tôi báo cáo C1 xong mà KHÔNG nói điều này — `25/29 cổng xanh`
      đúng trên máy tôi nhưng `check_*` không phải bề mặt duy nhất có răng.
      Đây không phải nợ để dành: theo R2, chưa máy xanh thì chưa xong.
      **Đã viết sẵn task**: `07_plan/M02_kb/tasks/T02-4-di-tru-citations-dan-xuat.md`
      — 4 AC, 4 cmd, qua `check_g6b`, kèm ba lệnh theo đúng thứ tự. Chờ duyệt;
      không tự chạy vì bước 2 ghi vào `kb/_kho.sqlite`, kho tri thức thật.

- [ ] **`build_order` tự nói ngược về phạm vi của C1.**
      `:136` bảng khai `Phạm vi ghi: core/**`; `:157` nút mermaid mô tả C1 là
      *"0 LLM · **di trú 1 bản ghi**"* — mà bản ghi nằm ở `kb/**`, boundary của
      `M02_kb`. Hai câu trong **một file** nói ngược nhau, và người thi công
      đọc câu nào cũng tự thấy mình đúng.
      Hệ quả thật: C1 làm xong theo `:136` thì CI đỏ; làm theo `:157` thì phạm
      R1. Tôi chọn cách đọc an toàn hơn (tách task M02) và ghi ra đây.
      **Không tự sửa**: `04_system/**` ngoài boundary M01 — cần s4 quyết một
      trong hai câu là câu đúng.

- [x] **KÉO THEO M08 — cổng địa chỉ KHÔNG chạy ở CỬA GHI.** ✅ `WO-040`
      `dungchung.mjs:654` gọi `chayValidate(tmpFile, …)` với một **file** trong
      thư mục tạm ngoài repo (cố ý, M08-R2). Cổng địa chỉ tự bật **chỉ khi target
      là thư mục**, nên trên đường ghi nó **tắt**.
      Đo 2026-09-01 trên đúng bản ghi thật, copy vào tmp rồi gọi y như web gọi:

      | | kết quả |
      |---|---|
      | như web gọi hôm nay | **0 lỗi** — 15 địa chỉ không phân giải được + khai `3/3` sai vẫn qua sạch |
      | thêm `--kho kb` | **3 lỗi** |

      ⇒ `G-6` đóng một phần ở cửa ghi (§7 vẫn chạy: `[2, 1, 0.5]` hết được tính
      là địa chỉ), nhưng **`G-7` KHÔNG đóng ở đó** — `citations_*` vẫn là lời
      khai cho mọi bài đi qua form. Đó là chỗ bài viết THẬT SỰ vào kho, nên đây
      là nửa quan trọng hơn.
      **Sửa là MỘT cờ**: `chayValidate(tmpFile, catalog, ["--fix", "--kho", KB])`.
      Rủi ro thấp vì `--fix` chạy trước và tự điền ba trường. Nhưng
      `web/api/**` là boundary **M08_api** ⇒ đơn vị việc khác, không nới vào C1.
      Cũng phải xét: có nên để cửa ghi phân giải địa chỉ vào kho THẬT không —
      nó làm phép kiểm phụ thuộc trạng thái kho tại thời điểm ghi, và đó là một
      quyết định, không phải một cờ.
      **Bằng chứng thành một test ĐỎ THẬT (đo 2026-09-01)**: chạy 80 test web
      từng cái ⇒ **79/80 xanh**, đỏ duy nhất là `web/test/api-crud.test.js` §7
      *"validate --strict cả kho tạm exit 0 sau đủ vòng CRUD"*. Fixture ở
      `web/test/_api.mjs:43-46` dùng `[nguon.py:10-40]` · `[nguon.md:1-2]` —
      **nhận dạng được nhưng không phân giải được** (hai file đó không có trong
      kho tạm). Cửa ghi không tính `citations_*` (target là file ⇒ cổng tắt),
      rồi §7 của test validate cả THƯ MỤC ⇒ cổng bật ⇒ ba lỗi.
      Tức hệ tự mâu thuẫn: **cửa ghi không sinh ra thứ mà phép kiểm thư mục
      đòi**. Đây là lập luận mạnh nhất cho việc thêm `--kho` vào cửa ghi.

      **XONG 2026-09-01** · object: `WL-01K9W2WO040` ·
      `web/api/dungchung.mjs:654` `+["--fix", "--kho", KB]` ·
      `web/test/_api.mjs` `+vaSoDanXuat()` · `validate.py` §8 thu hẹp ·
      `check_dia_chi.py` +ca E/F. Bằng chứng: **web 80/80 xanh** (trước 79/80),
      pytest 42, 25/29 cổng Python (4 đỏ cũ).
      Một triệu chứng hoá ra **ba nguyên nhân ở ba module**: cửa ghi thiếu
      `--kho` (M08) · fixture ghi thẳng file không qua cửa ghi (M03) · và §8 cũ
      đọc số dẫn xuất như lời tự nhận thất bại (M01 — lỗ trong chính C1).

- [ ] **KÉO THEO M08 — `phucHoi` không có phép kiểm citations nào.**
      `dungchung.mjs:834` gọi validate với một FILE và không `--fix`, nên cổng
      địa chỉ tắt. Cố ý không thêm trong `WO-040`, vì cả hai cách đều tệ hơn:
      `--kho` không `--fix` ⇒ restore **422** ⇒ chặn đường lấy lại dữ liệu;
      `--kho --fix` không đọc lại ⇒ validate xanh trên bản tạm còn bản COMMIT
      vẫn số cũ ⇒ **cổng xanh giả** (`phucHoi` INSERT từ `fm` trong bộ nhớ).
      Muốn có thật thì phải cho `phucHoi` đọc lại file sau `--fix`, cùng khuôn
      `ghiSauValidate` — một đơn vị M08 riêng, không phải một cờ.

- [ ] **`[slug]` trần KHÔNG báo được link gãy** — đánh đổi có chủ ý, khai ở
      `dia-chi.json.$comment_link_gay`. Lý do: `category: [backend]` trong một
      ví dụ khớp dạng `slug` y hệt địa chỉ thật, nên báo link gãy cho nó là đỏ
      oan. Hệ quả: một `[slug-viet-sai]` trôi qua im lặng, chỉ không được tính
      vào `citations_verified`. Muốn bắt thì cần một cú pháp phân biệt được
      địa chỉ với chuỗi thường — đó là một quyết định về CÚ PHÁP, không phải
      một dòng mã.

- [ ] **`slug-moc` (`:t=03:15`) chỉ kiểm được bản ghi là video**, không kiểm
      được mốc có nằm trong thời lượng. Kiểm được thì phải tải video về, mà
      LÕI không gọi ra ngoài (`B-E2`). Khai `manh: mot_phan` để không ai đọc
      nhầm là đã kiểm đủ.


## 2026-08-28 · FR-039 mở `media.mime`, và bản schema THỨ HAI chưa theo
Thay đổi: `.factory/fr/FR-039-nhan-moi-dinh-dang-tai-lieu.md` ·
`core/assets/frontmatter.schema.json` (enum-5 → `pattern`) ·
`core/assets/media-mime.json` (thêm khối `mac_dinh`).

- [ ] `core/skill-src/frontmatter.schema.json` — `media.mime` vẫn là **enum 5
      giá trị**, trong khi `core/assets/frontmatter.schema.json` đã mở thành
      `pattern`. `check_danh_muc.py` báo *"schema lech · rang buoc `media` khac
      nhau"*. Hệ quả THẬT nếu để nguyên: skill đóng gói mang một schema **từ
      chối** đúng thứ API vừa **nhận**, nên một tài liệu `.xyz` nạp qua web thì
      được, nạp qua skill thì bị chặn — hai cửa cùng một kho, hai luật.
      **KHÔNG tự sửa**: `core/skill-src/**` thuộc agent khác (người dùng đã phân
      công). Cần người dùng định tuyến — hoặc giao lại quyền ghi, hoặc chuyển
      cho agent đó cùng FR-039.
      **Đã diff hai file (09-01), fix là HAI dòng** — không phải hợp nhất hai
      file: trong `properties.media.properties.mime`, bỏ `enum` (5 giá trị),
      thêm `pattern: "^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$"`
      + `description`. Hai chỗ lệch còn lại (`allOf[3].$comment` và
      `category.$comment`/`description`) **chỉ là chú thích, không đổi nghĩa** —
      ghi ra để agent đó không đi đối chiếu chúng.

- [ ] `FROZEN.lock` — `core/assets/frontmatter.schema.json` lệch baseline.
      FR-039 đã mở và người dùng đã chốt qua AskUserQuestion, nên đây là thay
      đổi HỢP LỆ chờ chữ ký, không phải vi phạm. **Agent không tự ký**: bài học
      FR-037 (`memory/decisions.md` 2026-08-28) là tôi từng vừa làm vừa tự ký,
      và cách chặn không nằm ở kỷ luật cá nhân. Chờ người ký bằng
      `check_frozen.py --ky`.

## 2026-08-28 · FR-040 tách route, và `url_normalized` của video vẫn do CLIENT khai
Thay đổi: `.factory/fr/FR-040-tach-route-theo-module.md` · `web/api/cong-module.mjs`
(MỚI) · `web/api/router.mjs` · `web/api/articles.mjs`.

- [ ] `POST /api/video` nhận `url_normalized` **từ client** thay vì tự tính.
      `validate.py:288` đòi trường này cho video hồ sơ `thu-vien`, và cổng 9
      (`validate.py:233`) so lời khai với `chuan_hoa_url()`. Cổng `/api/video`
      **cố ý KHÔNG tự tính**: viết lại phép chuẩn hoá ở JS là bản THỨ HAI của
      `chuan_hoa_url()` trong Python — đúng lớp lỗi "hai công thức, không ai đối
      chiếu" đã trúng ở `dongBoThe`. Đường đúng là cho API gọi lại chính hàm
      Python đó (cùng khuôn `spawn validate.py` đã có), và đó là một đơn vị việc
      riêng, không phải một dòng thêm vào FR-040.

## 2026-08-29 · WO-019 (host fb/douyin) — hai lỗ đo được, không đóng trong đơn vị này
Thay đổi: `core/assets/media-mime.json` · `core/tests/check_host_video.py` (MỚI).

- [ ] **MƯỜI cổng Python không có trong `.github/workflows/ci.yml`**
      *(đếm lại 2026-09-01; ô này viết "tám" và nay thiếu hai)*:
      `check_ba_bang` · `check_dinh_dang_mo` · `check_fix_url` · `check_host_video`
      · `check_index_dan_xuat` · `check_khai_mot_noi` · `check_loai_nguon_db` ·
      `check_map` · **`check_dia_chi`** ·
      `check_reject_reason`. CI đăng ký cổng bằng từng bước `- name:` gõ tay, nên
      viết một cổng mới **không** làm nó chạy ở đâu cả — và theo `CLAUDE.md`,
      *"chưa cài ⇒ vế gate đó không tồn tại và không ai báo"*. Sáu trong tám cái
      này có từ trước phiên này.
      **`check_dia_chi` là cái đắt nhất trong mười**: nó là toàn bộ răng của
      `B-A5`/`B-A6` (G-6 + G-7). Không đăng ký thì luật chống-bịa vừa dựng chỉ
      tồn tại trên máy người viết nó — đúng câu `CLAUDE.md`: *chưa cài ⇒ vế gate
      đó không tồn tại và không ai báo*.
      **Vì sao không tự nối:** thêm tám bước vào CI làm CI CHẶT HƠN cho mọi PR
      sau này, và tôi **không chạy được GitHub Actions ở đây** để chứng minh nó
      còn xanh trên runner. Nối mà không đo là tự nhận xong (R2). Đây là việc của
      M04_ci và cần người quyết. Cùng lúc: đăng ký gõ tay chính là cơ chế sinh ra
      lỗ này — cân nhắc một cổng `check_ci_dang_ky` so `core/tests/check_*.py`
      với `ci.yml` hai chiều.

- [ ] **Thêm host vào whitelist KHÔNG tới được bảng `loai_nguon`.**
      `dung_lai_db.py` gieo `loai_nguon` khi **chưa có file** `kb/loai-nguon.yaml`
      (WO-019 — luật đó ĐÚNG, và lý do nằm trong `WL-01K9NXWO019`). Hệ quả: kho
      thật đã có file, nên `fb`/`douyin` vừa thêm **không** xuất hiện trong 14
      hàng của bảng, và màn Danh mục vẫn liệt hai nơi phát. Facet thì đúng —
      `nguonCua()` suy thẳng từ whitelist, không qua bảng.
      **Vì sao không sửa ở đây:** "gieo mỗi lần nhập" làm vỡ lại
      `check_media_dan_xuat` (nó dựng DB1 bằng SQL trực tiếp, nên vòng
      file→DB→file lệch — chính lỗi đã bắt ở WO-019). Cần một luật ĐỐI CHIẾU
      phân biệt được "kho chưa từng khai" với "kho đã khai và người dùng đã sửa
      nhãn", và đó là một quyết định thiết kế, không phải một dòng thêm vào.
      Đo được lúc ghi: 14 hàng, **không hàng nào có nhãn do người sửa** (tài liệu
      giữ nhãn gieo, video có `nhan == id`), nên chưa có gì để mất — nhưng điều
      đó thay đổi ngay khi người dùng bấm "sửa" một lần.

- [ ] **Hai đường nhúng `fb` và `douyin` CHƯA ĐO ĐƯỢC.** Cổng
      `check_host_video.py` chứng minh phần tôi chứng minh được: `id_mau` neo hai
      đầu và từ chối mọi ký tự thoát URL, `nhung` là https trỏ đúng host nhúng,
      `id_tu` bắt ra thứ `id_mau` nhận, và `src` cuối cùng vẫn ở trong whitelist
      (M09-R3 — **an toàn không phụ thuộc đường nhúng có đúng hay không**).
      Thứ nó KHÔNG chứng minh: trình nhúng của Facebook và Douyin có thật sự
      phát ở URL đó không. Tôi không gọi ra ngoài mạng để thử được.
      **Người chốt:** dán một URL fb và một URL douyin, mở cửa sổ đọc. Khung
      trống ⇒ chỉ sửa `nhung` trong `core/assets/media-mime.json`, không đụng mã.

## 2026-08-29 · `title` rỗng và ba đường đọc lệch — đã mở WO-023, chưa sửa
Thay đổi: không có (chỉ chẩn đoán + `memory/decisions.md` 4 entry).

- [ ] **WO-023**: `title: ""` (thứ form gửi khi ô trống) đi qua mọi đường đọc
      thành thẻ `<h4></h4>` không tên; và khoá `title` VẮNG thì `/api/index` trả
      slug còn `/api/video` trả `null` — ba đường đọc, hai câu trả lời. Đo qua
      HTTP thật, chi tiết trong
      `.factory/wo/WO-023-tieu-de-rong-va-ba-duong-doc-lech.md`.
      **Chưa sửa vì chạm HAI module** (`web/api/**` M08_api và `web/render/**`
      M03_web) ⇒ vượt ngưỡng PATCH. Cần người chốt trước.

- [ ] **`#f-title` còn `required` trên màn nạp bài viết** trong khi hai màn kia
      ghi *"nên có"*. Nhãn "bắt buộc" ở đó ĐÚNG với hành vi (ô trong `<form>`,
      `#f-gui` là `type="submit"` ⇒ trình duyệt chặn thật), nhưng chỏi chỉ đạo
      *"ko hẳn cần require"* — người dùng kể đích danh *tiêu đề*. **Phụ thuộc
      WO-023**: nới trước khi có đường lùi là chủ động sinh thêm thẻ không tên.

## 2026-08-29 · WO-027 — một phép kiểm chết còn lại, KHÔNG xoá
Thay đổi: `web/test/cac-man-con-lai.test.js` · `rail-trai.test.js` · `ui-ba-man.test.js`.

- [ ] `cac-man-con-lai.test.js:378` — `ok(!/max-width:840px/.test(cuoi(".qw .nw")))`
      đúng **vô điều kiện**: `cuoi(".qw .nw")` trả `""` vì luật đó đã bị xoá cùng
      màn Chờ duyệt (FR-033). Trong `prototype.css`, `.qw` chỉ còn trong một chú
      thích ghi *"KHỐI `.qw` / `.qr` ĐÃ XOÁ"*.
      **Không xoá ở WO-027**: mã chết của người khác — `CLAUDE.md` nói nêu ra chứ
      đừng xoá. Ba phép ở `:240` · `:241` · `:381` đã canh đúng điều còn có nghĩa
      (`v-queue` và `#v-queue` không còn), nên phép này chỉ là dư, không phải lỗ.

## 2026-08-29 · Tám lệnh kiểm `CLAUDE.md` khai — quét lại, ba cái còn thiếu
Thay đổi: `core/tests/check_map.py` (MỚI) · `07_plan/M01_core/tasks/T01-36-*`.

Đã có: `<freeze-check>` = `check_frozen` · `<rule-surface-check>` =
`check_rule_surfaces` · `<pin-check>` = `check_version_pin` · `<worklog-check>` =
`check_worklog` · `<map-check>` = **`check_map` (cài hôm nay)**.
Không áp dụng: `<docs-sync>` — chuỗi `factory:sinh` **không xuất hiện ở đâu** trong
repo này, kể cả README; không có khối nào để đối chiếu.

- [ ] **`<scope-check>` chưa cài được vì lý do CẤU TRÚC, không phải bỏ quên.**
      Đo được: 126 task khai `phạm_vi_ghi` trên 121 đường dẫn, và **52 đường bị
      nhiều task khai** (`web/test/WORKLOG.md` 29 task · `web/package.json` 25 ·
      `multiwindow.inline.ts` 17 · `prototype.css` 13 …). Nhưng đó là các task
      **hoàn thành ở những thời điểm khác nhau**, không phải chạy song song —
      `CLAUDE.md` nói rõ rule này dành cho *"song song ⇒ mỗi đơn vị một worktree"*.
      Task file chỉ khai **ba** trường (`phạm_vi_ghi` · `verifiability` ·
      `tiêu_chí`) — **không có trạng thái**, nên không phân biệt được task đang mở
      với task đã đóng. Cài theo nghĩa đen ⇒ đỏ trên toàn bộ lịch sử, tức tệ hơn
      không có. Cần một quyết định thiết kế trước: thêm trường trạng thái, hay
      suy "đang mở" từ git/worklog.

- [ ] **`<backlog-check>` chưa cài — và cài vào là ĐỎ NGAY.** `CLAUDE.md` nói ô
      `[ ]` **"chết ở gate"**, dạng tối thiểu là
      `grep '^\s*- \[ \]' <đơn-vị>/backlog.md`. Hiện **0 cổng** nào làm việc đó,
      nên mọi ô mở — kể cả những ô tôi vừa mở — không chặn gì cả.
      **Không tự cài:** nó biến mọi ô `[ ]` đang mở thành đỏ, tức đổi thứ chặn
      được việc. Đó là quyết định của người, cùng loại với việc nối 8 cổng vào CI
      (ô backlog 2026-08-29 phía trên).

- [ ] `check_map.py` cũng **chưa có trong `ci.yml`** — thuộc cùng ô "tám cổng vắng
      CI" đã mở. Nay là **chín**.


## 2026-08-29 · WO-028 — mồ côi `kp-rac` của lần gỡ KHÁC, không xoá
Thay đổi: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` ·
`web/test/moc-fe-con-that.test.js` (MỚI).

- [ ] **`kp-rac` là mốc treo**: `napThungRac()` đọc `G("kp-rac")` để cập nhật ô KPI
      thùng rác, nhưng `shell.html` **không có id nào bắt đầu bằng `kp-`** — thẻ đó
      biến mất ở lần thiết kế lại KPI. Có `if (oKpiRac)` bao nên nó im lặng không
      làm gì: **KPI thùng rác không bao giờ cập nhật**.
      **Không xoá ở WO-028**: đó là mồ côi của một lần gỡ KHÁC, và `CLAUDE.md` §3
      nói mã chết không liên quan thì nêu ra chứ đừng xoá. Hai đường: khôi phục
      thẻ KPI trong shell, hoặc bỏ hẳn khối 5 dòng — cả hai là quyết định của
      người. Cổng `moc-fe-con-that` ghi nó thành **ngoại lệ có tên** và đòi ngoại
      lệ đó vẫn đúng thực tế, nên một mốc treo MỚI vẫn đỏ được.


## 2026-08-29 · WO-033 — hai thứ đã ĐO được nhưng chưa sửa
Thay đổi: `web/server.mjs` · `web/test/nghe-hai-loopback.test.js` (MỚI).

- [ ] **Vòng đổi ảnh nền không kiểm `prefers-reduced-motion`.** `hen_gio()`
      (`backdrop.inline.ts:50`) chỉ gác `treoChuot || document.hidden ||
      bo.length < 2`. Người đã tắt hiệu ứng ở hệ điều hành vẫn nhận một lần
      crossfade + giải mã ~50 ms **mỗi 5–7 giây, mãi mãi**. `DESIGN.md` §7 nói
      chiều sâu phải TẮT HẲN khi reduced-motion, và file này đã đọc media query
      đó cho parallax (`:145`) — chỉ vòng đổi ảnh là quên.
      Không gộp vào WO-033 vì đó là hành vi người dùng thấy được, cần quyết:
      tắt hẳn, hay giãn nhịp?

- [ ] **19 phần tử `backdrop-filter` sống trong DOM** (CSS khai 9 luật).
      CHƯA có bằng chứng nó là vấn đề — cuộn 12 khung hết 105 ms
      (~8,7 ms/khung, dưới ngưỡng 16,7). Ghi lại để lần sau ai nghi nó thì
      biết con số hiện tại, đừng đo lại từ đầu.

- [ ] **`toi_uu_anh_nen.py` chỉ giảm 10%** (3615 → 3286 KB, đo bằng `--xem`).
      Nó vẫn đáng chạy vì chữa cái đỏ `he-kinh` (707 → 378 KB), nhưng **không
      phải bản vá tốc độ** — ghi ra để không ai kỳ vọng nhầm. Công cụ GHI ĐÈ
      tại chỗ và XOÁ file trùng, nên người dùng chạy, không phải agent.

## 2026-08-29 · Bộ đo tải tìm ra ba thứ ở lần chạy đầu
Thay đổi: `core/tools/do_tai.py` (MỚI) · `09_deploy/workload_report.md` (sinh ra).

- [ ] **Chỉ `/tat-ca/` phân trang.** Đo được ở N=800: `tat-ca` giữ **70 KB**,
      còn `trang-chu` · `bai-viet` · `tai-lieu` · `video` · `kho` · `khai-niem`
      và cả ba màn nạp đều phình **34 → 487 KB** (độ dốc byte 0.37). Ở 5000
      bản ghi là ~3 MB mỗi trang.
      Nghi ngờ (chưa xác nhận): mọi trang đều cõng view `all`, và nó chỉ được
      phân trang trên chính trang `/tat-ca/`. Cần đo thêm trước khi sửa.

- [ ] **`api:index` tăng tuyến tính hoàn hảo** — độ dốc byte **1.00**, từ 1 KB
      lên **696 KB** ở N=800. FE gọi nó lúc nạp trang. Đây đúng thứ plan ghi ở
      *"sự thật 9"* (`GET /api/index` không nhận tham số nào và trả cả kho kèm
      cả thân bài) — đã biết từ lâu, chưa ai sửa, và giờ có số.

- [ ] **Phân trang cắt BYTE, không cắt THỜI GIAN.** `tat-ca` byte phẳng 70 KB
      mà p95 vẫn ×6.1 (48 → 295 ms). Server vẫn đọc/sắp cả kho rồi mới cắt 24
      thẻ. Chỉ hai con số tách nhau mới nói được điều này.

- [ ] **`09_deploy/**` không thuộc module nào** trong `project_map.yaml`, nên
      một task khai `phạm_vi_ghi` vào đó sẽ trượt `check_g6b`. Hiện coi nó là
      OUTPUT của công cụ (cùng khuôn `xuat_kho.py` ghi `kb/**` mà M01 không sở
      hữu `kb/**`). Nếu sau này có người SỬA TAY trong `09_deploy/` thì phải
      thêm nó vào boundary của M04_ci trước — và đó là một quyết định về map.

- [ ] **`check_g6b` kiểm *module có plan*, KHÔNG kiểm *thư mục plan có module*.**
      `:110` `co_plan = any(v["mod"] == d.name …)` vòng qua `06_modules/`. Chiều
      ngược không ai kiểm: `mod` lấy từ **tên thư mục** (`:21`
      `md.parent.parent.name`), nên `07_plan/M99_gi-cung-duoc/tasks/` tồn tại
      được, và `mp["modules"].get("M99…", {})` trả `{}` ⇒ `bound` chỉ còn bốn
      đường phổ dụng. Task nào khai `phạm_vi_ghi` **toàn bộ** trong
      `07_plan/**` · `.factory/**` · `core/tests/**` · `05_uiux/contracts/**`
      thì **xanh mà không thuộc boundary nào**. Hẹp (task thuần plan hợp lệ ghi
      đúng chỗ đó), nhưng nó là chiều còn hở của `<map-check>` hai-chiều.

> **ĐÍNH CHÍNH — không phải ô việc.** Ngày 09-01 tôi báo miệng với chủ dự án
> rằng *"`check_g6b:62` mù `modules_du_kien` nên task khai `phạm_vi_ghi:
> chungcat/**` đi qua cổng không được kiểm ⇒ R1 vô địa chỉ"*.
> **Sai.** Ghi ở đây vì lời khai đó đã ra khỏi đầu tôi, nên phải có chỗ đọc được
> nó bị rút. Không mở ô `[ ]` (không có việc gì phải làm) và không tick `[x]`
> (không có path/SHA để làm object — object là output lệnh, dưới đây).
>
> Chạy đúng biểu thức `:62-73` trên `project_map` v19, ba ca:
>
> | `mod` | `phạm_vi_ghi` | kết quả |
> |---|---|---|
> | `M12_chungcat` | `chungcat/**` | **ĐỎ** — `ghi chungcat/** ngoài boundary M12_chungcat (None/None)` |
> | `M01_core` | `core/tests/x.py` | xanh |
> | `M12_chungcat` | `07_plan/M12/t.md` | xanh |
>
> `m = mp["modules"].get("M12_chungcat", {})` trả `{}`, nên `bound` còn đúng bốn
> đường phổ dụng, nên `chungcat/**` **rơi vào `ngoai` ⇒ `fails.append`**.
> **Cổng đỏ to, không mù.**
>
> **Hệ quả THẬT** — và nó là *điều kiện tiên quyết*, không phải lỗ: sáu module ở
> `modules_du_kien` **phải tốt nghiệp sang `modules:`** trước khi một task thi
> công nào của chúng viết được một dòng. Không thì mọi `phạm_vi_ghi` vào
> `chungcat/**` `truyhoi/**` `chatbot/**` `kenh/**` `artifact/**` `cong/**` đỏ ở
> `check_g6b`. Tức **`s6-module-spec` chặn trước việc giao thi công**, không
> chạy song song được với nó.
>
> **Bài học.** Tôi suy hành vi cổng từ **đọc một dòng** (`mp["modules"]`) thay vì
> chạy nó. Lời khai *"cổng này không bắt được X"* mà không có output máy thì cùng
> loại `#tự-khai` — và tệ hơn theo một chiều: nó **giục người đi cài thêm răng
> cho một cổng đã có răng**, tức tiêu công vào chỗ không hở và bỏ chỗ hở thật
> (ô `[ ]` ngay trên).

## 2026-08-29 · WO-027 đính chính, và bảy chỗ nên đổi sang quét độ sâu
Thay đổi: đính chính `WL-01K9P5WO027.yaml` + `web/test/WORKLOG.md`.

- [ ] **Bảy chỗ trong `web/test/` còn cắt luật CSS bằng NEO** (`rail-trai` ×4 ·
      `ui-ba-man` ×2 · `cac-man-con-lai` ×1). Neo nào cũng sót: bản hiện tại bỏ
      qua `.st.dr`. Đường đúng hẳn là **quét ngoặc theo độ sâu**, và WO-035 đã có
      sẵn một bản trong `mo-ta-va-nut-nap.test.js` §9 để chép sang.
      Chưa làm vì bảy chỗ đó đang xanh và lỗ chỉ là 1 selector — nhưng ghi ra để
      lần sau ai sửa thì biết có sẵn bản đúng, đừng viết neo thứ ba.

- [x] `khung-than-bai.json:74` — `goi_y` của mục tinh túy vẫn chứa markdown mẫu
      (`#### 3.4.1 Tên tinh túy` · `- **…**`). Sau WO-037 không còn ô nào hiển thị
      chuỗi đó, nên nó là byte chết trong bảng khai nhúng — và nó chính là thứ
      người dùng bảo bỏ. Kéo theo của WO-037; M01 nên chủ sở hữu quyết.
      **Đóng bằng WO-038 · T01-40.** object: `core/assets/khung-than-bai.json`
      (bỏ khối `tinh_tuy`, bỏ cờ, `goi_y` thành văn xuôi) ·
      `core/src/source_distiller/khung.py` · `core/src/source_distiller/validate.py`
      (bỏ §6). Cổng: `python core/tests/check_khung.py` exit 0.

- [ ] **`<worklog-check>` chưa bao giờ được cài** — `CLAUDE.md` khai nó phải bắt
      *"worklog không parse được hoặc thiếu `object`"*, và cũng cảnh báo sẵn:
      *"Chưa cài ⇒ vế gate đó không tồn tại và không ai báo."*

      **Đo 2026-08-31**: `.factory/worklog/*.yaml` có **121 file** ·
      **7 không parse được YAML** · **48 thiếu khoá `object`** ⇒ **55 file**
      không làm được việc mà worklog sinh ra để làm (biến lời khai thành bằng
      chứng). Ví dụ: `WL-01K9K1FR022.yaml` vỡ ở dòng 70 vì một chuỗi
      `Người chốt:` nằm giữa danh sách; `WL-01K9K6HEKINH.yaml` kể việc đã làm
      nhưng không nói file nào.

      **Nhầm lẫn cần ghi ra**: `core/tests/check_worklog.py` KHÔNG phải cổng
      này — nó kiểm `web/**/WORKLOG.md` (tài liệu, số dòng CSS, số test) và
      **không đụng `.factory/worklog/` một dòng nào**. Trùng tên, khác việc,
      nên nhìn qua tưởng đã có cổng.

      **QUYẾT ĐỊNH 2026-08-31 (người dùng)**: áp dụng **TỪ NAY VỀ SAU**, không
      sửa ngược 55 file cũ.

      Cách cài để "từ nay về sau" không âm thầm thành "không bao giờ":
      dùng **danh sách miễn trừ TƯỜNG MINH** (grandfather list) nằm trong chính
      cổng, liệt kê đủ 55 file. Cổng ĐỎ với mọi file **không** có trong danh
      sách. Ba tính chất cần: (a) file mới bắt buộc sạch · (b) danh sách chỉ
      **co lại**, không bao giờ nở ra · (c) nợ cũ **nhìn thấy được**, không
      giấu sau một mốc ngày.

      KHÔNG dùng mốc theo `at:` — file không parse được thì đọc `at:` cũng
      không xong. Đó là vòng luẩn quẩn.

- [x] **`check_map.py:7` khai sai**: docstring liệt `<worklog-check>` vào nhóm
      *"đã có"*. Đo 2026-08-31: `grep -rl 'factory/worklog' core/tests/ scripts/
      Makefile .github/` ⇒ **không file nào**. Chỉ có đúng một lần nhắc, và nó
      chính là dòng docstring đó.

      Đây là **một khẳng định chưa kiểm nằm trong phần giải thích của một cổng**
      — đúng lớp lỗi mà cả bộ cổng sinh ra để bắt. Nó nguy hiểm hơn thiếu cổng:
      ai đọc `check_map.py` để biết cổng nào đã có sẽ tin nhầm.

      ~~Sửa cùng lúc với việc cài `<worklog-check>` (ô ngay trên).~~

      **ĐÓNG 2026-09-01** — không đợi `<worklog-check>`: sửa một khẳng định sai
      là *đổi chữ, không đổi hành vi* (ngưỡng rút gọn của `/factory:go`), còn
      cài cổng là đổi hành vi và cần WO. Gộp hai việc là để cái rẻ chờ cái đắt.

      **object**: `core/tests/check_map.py` — docstring §"VÌ SAO CỔNG NÀY TỒN
      TẠI" thay câu liệt kê bằng **bảng 8 lệnh đo lại từng cái**.

      Đo trước khi sửa (vì sửa một câu mà chỉ kiểm một khẳng định thì có thể
      phải sửa lần hai): `<freeze-check>`→`check_frozen.py` ✅ ·
      `<rule-surface-check>`→`check_rule_surfaces.py` ✅ ·
      `<pin-check>`→`check_version_pin.py` ✅ · **`<worklog-check>` → không có** ❌.
      Đúng ba, sai một.

      Verify: `python core/tests/check_map.py` exit 0.

- [ ] **`Z6` chưa cài** — `ADR-05` khai cổng *"Cổng khai MỘT nơi: một service gõ
      cứng số cổng thay vì đọc bảng khai"*, nhưng `core/assets/dich-vu.json`
      (tạo ở s4, 2026-08-31) **chưa có cổng nào canh**.

      **Đo 2026-08-31**: `check_khai_mot_noi.py` biết `loai-nguon.json` ·
      `man-hinh.json` · `frontmatter.schema.json` — **không biết `dich-vu.json`**.
      Và 11 file "đọc" bảng khai đó đều là **tài liệu**, không một dòng mã:
      số cổng hiện gõ tay ở `adr.md` · `env_plan.md` · `diagrams/flow-dot-hai.md`
      + 5 README service.

      **Hiện KHÔNG lệch** — kiểm cơ học tám file, 0 sai (một "lệch" là sai dương
      của regex: dòng *"Không ai gọi thẳng `:8788`…"*). Nhưng *"hôm nay khớp"*
      không phải tính chất sống được — đó chính xác là lý do
      `check_khai_mot_noi` tồn tại cho ba bảng kia.

      **Không tự viết cổng ở vòng tự động**: thêm một cổng là đổi hành vi (sinh
      ra một đường đỏ mới), nên nó cần WO + task file, không phải ngưỡng rút gọn.

      Hình dạng đề nghị khi làm: `check_khai_mot_noi` nạp thêm `dich-vu.json`,
      và đỏ khi **một số cổng xuất hiện trong tài liệu/mã mà không khớp bảng
      khai**. Cẩn thận chiều ngược: dòng liệt kê *các cổng KHÔNG được gọi* là
      hợp lệ — cổng phải phân biệt được, không thì đỏ oan ngay ngày đầu.

- [x] **`check_running.py` GHI vào repo như tác dụng phụ.** Nó THỰC THI mọi lệnh
      liệt trong `RUNNING.md` (`check_running.py:50` — `subprocess.run`), và hai
      lệnh trong đó **sinh file**:

      | `RUNNING.md` | lệnh | ghi gì |
      |---|---|---|
      | :181 | `python 07_curate/curate.py week` | `07_curate/reports/2026-Wxx.md` — **file mới, chưa track** |
      | :182 | `python 07_curate/curate.py month` | `07_curate/reports/2026-08.md` — **ghi đè** |

      **Đo 2026-08-31 23:10**: chạy `for g in core/tests/check_*.py` sinh ra
      `2026-W36.md` (untracked) + ghi đè `2026-08.md` + tạo
      `kb/_kho.sqlite-wal`/`-shm` (vì `curate.py` mở DB).

      **Không sai kết quả** — nhưng nó phá một tính chất người ta ngầm tin:
      **kiểm không được đổi thứ đang kiểm**. Hệ quả cụ thể: ai chạy bộ cổng
      cũng nhận một working tree bẩn, và `git status` sau đó không còn phân biệt
      được "tôi vừa sửa gì" với "cổng vừa sinh gì". Đó đúng là công cụ dùng để
      **quy chủ** khi máy đỏ (`CLAUDE.md`: *"máy đỏ mà chưa quy được chủ ⇒
      `git status` + `find -newermt` trước khi phán"*).

      Ba đường, chưa chọn:
      (a) `curate.py` thêm `--kiem` chỉ in không ghi, `RUNNING.md` liệt bản đó;
      (b) `check_running` chạy lệnh trong thư mục tạm (`--out <dir>`);
      (c) `check_running` chỉ kiểm lệnh **tồn tại và parse được**, không chạy —
      nhưng vế đó yếu hơn hẳn, và cổng này sinh ra chính vì tài liệu hay nói dối.

      ~~Tôi nghiêng (a) hoặc (b).~~

      **ĐÓNG 2026-09-01 · WO-039 / T01-41** — chọn đường THỨ TƯ, không phải (a)/(b)/(c):
      lỗi không phải "thiếu một dòng" mà là **cách phát hiện đoán từ hậu tố cờ**.
      Nên sửa hai tầng: bảng `GHI_KHONG_CO` (rẻ, chặn trước) **+ LƯỚI đo thật**
      (chụp `git status` + băm nội dung trước/sau MỖI lệnh; lệch thì đỏ và nêu tên).
      Bảng một mình chỉ biết những gì đã biết; lưới bắt cả lớp.

      **object**: `core/tests/check_running.py` (+`chup_cay`/`so_cay`/`GHI_KHONG_CO`) ·
      `WO-039` · `T01-41`.
      **Verify**: `git status` trước/sau khi chạy CẢ 26 cổng ⇒ không khác một dòng.
      Lưới chứng minh đỏ-được bằng fixture git riêng, 4 ca (file mới · ghi đè file
      đã ` M` · lệnh chỉ đọc không đỏ oan · ghi nội dung y hệt thì không thấy).

      KHÔNG sửa `07_curate/curate.py`: `out` không lộ ra CLI ⇒ chạm M07 ⇒ hai
      module ⇒ BUILD, ngoài phạm vi PATCH.

- [ ] **`FR-045` U3 thiếu phép chặn ĐOÁN MÃ** — tìm thấy 2026-09-01, **sau khi FR
      đã duyệt**. U3 đòi `ma_moi` *một lần* + *hết hạn*: cả hai đúng, và **không đủ**.

      `ma_moi` là bí mật **đoán được** trên endpoint **hướng Internet** (`cong/`,
      443). Một-lần chặn *dùng lại*; hết-hạn chặn *dùng muộn*. **Không cái nào chặn
      thử hàng nghìn lần trong cửa sổ còn hiệu lực.** Và hậu quả không phải "đăng
      nhập sai" — đoán được mã là **THÀNH người khác trong kho**.

      `FR-045` §3 gọi đúng tên chỗ nguy hiểm (*"nơi lỗi bảo mật sống"*) rồi **bỏ sót
      phép chặn**. Đó là kiểu bỏ sót tệ nhất: đã nhìn thấy rủi ro mà vẫn hụt.

      Ba thứ phải có, chi tiết ở `security_baseline §8.1`: rate limit theo IP+mã ·
      entropy mã ≥128 bit (**không** dùng OTP 6 số — không có kênh thứ hai để giới
      hạn) · ghi `audit_log` mỗi lần thử THẤT BẠI.

      **Cần FR bổ sung cho FR-045**, không tự sửa: đây là thêm cổng vào một FR đã
      duyệt, tức đổi hợp đồng.

- [ ] **SÁU CỔNG CORE ĐỎ — nợ đất M01/M08/M09/M18, dev M12 báo 2026-09-05,
  PM ghi sổ.** Danh sách dev đo: schema lệch HAI BẢN · 16/24 loại nguồn ·
  `ma_moi`/`phien` bị exporter khai · DDL chưa bắn 2 ràng buộc (cổng tự nói
  "sửa DDL, KHÔNG sửa cổng"). Không cái nào thuộc M12/M03 đợt này — chúng là
  nợ nền lộ ra khi suite chạy toàn phần. ⇒ mỗi món một đơn vị ở plan module
  chủ khi tới lượt; giữ ô này làm MỤC LỤC để "backlog sạch" của G6C các
  module kia không tự xanh. Tick khi: 6 cổng exit 0 trên suite core.
  · object: output check_g6b + 6 cổng core 2026-09-05 (dev M12 liệt kê)

- [ ] **`check_g6b` CRASH (TypeError) khi một task thiếu `verifiability` —
  cổng vỡ thay vì báo lỗi, và nó chặn CẢ HAI NHÁNH.** PM-Space đo 2026-09-09
  15:2x: `check_g6b.py:81` format `v['verif']` = None ⇒ traceback, exit 1,
  **không task nào được kiểm** (95 dòng ok biến mất). Quy chủ: hai file chưa
  commit của nhánh kia — `T03-136` (14:50) · `T03-137` (15:12) dùng khuôn
  `- **Loại**: PATCH · hard` thay cho `verifiability: hard`.
  ⇒ HAI việc, tách rõ: (a) **đất PM-M13/dev M03**: hai task đó khai
  `verifiability:` đúng khuôn (PM-Space KHÔNG sửa đất nhánh kia — checklist
  song song §4); (b) **đất M01 (cổng)**: `check_g6b` phải CHỊU LỖI — task
  thiếu trường ⇒ in "T03-136: thiếu verifiability" rồi tiếp tục, không
  traceback. Một cổng chết vì dữ liệu xấu là cổng không dùng được đúng lúc
  cần nhất, và ở chế độ hai nhánh nó khoá cả hai bên.
  · object: `core/tests/check_g6b.py:81` · `07_plan/M03_web/tasks/T03-136*`,
  `T03-137*` (untracked, 2026-09-09) ⇒ **(a) PM-M13 · (b) đơn vị M01**

  **Cập nhật 2026-09-09 (PM-M13)** — vế (a) **ĐÓNG**, vế (b) **CÒN MỞ và ô này giữ**:
  - **(a) ĐÓNG** · chủ hai task tự sửa lúc **16:08** (`T03-136`) và **16:09**
    (`T03-137`); cả hai nay khai `verifiability: hard` / `soft` đúng khuôn. Đo lại:
    `check_g6b` **hết traceback**, `T03-136` ok 5 AC/5 cmd · `T03-137` ok soft.
    PM-M13 **không sửa** hai file đó — chúng là plan của nhánh kia (checklist §4),
    và chúng vẫn `??` chưa commit.
    · object: `07_plan/M03_web/tasks/T03-136*` (16:08) · `T03-137*` (16:09)
  - **(b) CÒN MỞ, và đây là chỗ dễ tưởng đã xong nhất.** Cổng nay **xanh vì hết dữ
    liệu kích hoạt**, không vì nó đã chịu được giá trị vắng. `:81` vẫn in **bốn** ô
    (`mod` · `verif` · `acs` · `cmds`) qua f-string; ô nào vắng cũng chết cùng cách,
    và task tiếp theo khai thiếu một trường sẽ lại khoá cổng cho **cả hai nhánh**.
    Đã mở **`WO-084`** + hai đơn vị: **`T01-54`** (test, 4 ca: thiếu `verifiability` ·
    `phạm_vi_ghi` rỗng · 0 AC · đủ ba mục — ba ca đầu ĐỎ nêu tên task, ca cuối XANH)
    → **`T01-53`** (cổng ĐỎ có tên và **chạy tiếp** hết 306 task). Tách hai đơn vị
    theo `R1` **và** theo luật gốc: cổng chấm `check_g6b` không nằm cùng đơn vị với
    việc sửa `check_g6b`.
    ⚠️ **`WO-084 §5` từ chối một đề nghị nghe hợp lý**: nới regex để nhận cả khuôn
    `- **Loại**: PATCH · hard`. Đo 2026-09-09: **295/297** task dùng `verifiability:`
    (nay 306 task, cùng tỉ lệ) ⇒ khuôn kia là **sai của một lượt**. Hai khuôn cho một
    trường là hai chỗ sẽ lệch; đổi khuôn là quyết định riêng, phải đổi **cả** plan.
    · object: `.factory/wo/WO-084-check-g6b-crash-thay-vi-do.md` ·
    `07_plan/M01_core/tasks/T01-53-*`, `T01-54-*` · `WL-01KB46G6BCRASH`
    🔁 **Chủ thi công 2026-09-10: dev M12** (chủ dự án giao — *"WO 84 dev M12 fix
    bug, tạm thời ko động"*). PM M13 / dev M13 **không chạm** hai đơn vị đó và
    `core/tests/check_g6b.py`; ID giữ nguyên, chỉ đổi người làm. Dev M13 **không
    chờ**: cổng hết crash nên `T01-52` → `T01-51` → `T13-1` chạy song song.
  - **Ô này chết ở gate của M01**, không phải của M13 — tick bằng commit của `T01-53`.

- [ ] **CLI `khung.py` chết ngay dòng đầu — `NameError: TINH_TUY_O`** —
      `WO-038` gỡ có chủ ý `TINH_TUY_O`/`TINH_TUY_MAX`/`TINH_TUY_BULLETS` (chú
      thích ở `core/src/source_distiller/khung.py:60` nói rõ), nhưng khối
      `if __name__ == "__main__"` ở dòng 111 còn tham chiếu. Chạy
      `./.venv/Scripts/python.exe core/src/source_distiller/khung.py` là
      traceback, chưa in được một dòng nào. Không cổng nào bắt: `khung.py`
      được **import** ở mọi nơi (đường import lành), chỉ đường **chạy thẳng**
      hỏng — và không cổng nào chạy thẳng nó. Phát hiện 2026-09-11 khi kiểm
      từng lệnh trước lúc ghi vào `_devops/run.md`.
