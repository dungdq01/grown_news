# backlog — M04_ci (chết ở G6C)

## 2026-09-12 · Ba `cmd` của T04-12 không đo thứ ba AC nói (đo lúc thi công T04-12)

- [ ] **`.gitattributes` giờ ĐÚNG, nhưng KHÔNG cổng nào canh nó.** Ba AC của
      `07_plan/M04_ci/tasks/T04-12-gitattributes-media-binary.md` viết đúng phép đo,
      nhưng cả ba `cmd` trỏ vào chương trình không làm phép đo đó:
      · **AC1** `cmd: python core/tools/dung_lai_db.py --kiem` — `dung_lai_db.py`
        **không có argparse**, không có cờ `--kiem`. Nó **nuốt im lặng** cờ lạ rồi
        **DỰNG LẠI DB THẬT** (đo: chạy với `--kiem` trên worktree ⇒ in
        `da dung kb\_kho.sqlite · … · media 8 · d1077bbd6114d1fc`). Một `cmd` mà
        người đọc tưởng là *kiểm* nhưng thật ra là *GHI* — **đúng họ với sự cố
        `check_running.py` 2026-09-11** (ô M01 §10). Nó cũng không so `sha256` nội
        dung với `sha256` trong tên file, là thứ AC1 đòi.
      · **AC2 · AC3** `cmd: python core/tests/check_ci_teeth.py` — cổng đó
        `grep -c gitattributes` ⇒ **0**. Nó xanh (`pass · 7 luật phá đều đỏ`) y hệt
        dù có hay không có dòng `kb/_media/** -text`. Xanh vô căn cứ.
      ⇒ Ba AC đã được đo **bằng tay** lúc thi công và ghi số vào
      `WL-01M2A7RHN483271MSS6AFBDPMM`, nhưng phép đo đó **không tự chạy lại**:
      ai đó xoá dòng luật ngày mai thì mọi cổng vẫn xanh.
      **Cần một đơn vị M04**: cổng đọc `kb/_media/**` trên đĩa, so `sha256(nội dung)`
      với `Path(f).stem`, + `git check-attr -a` phải in `text: unset`, + một file ngoài
      `kb/_media` **vẫn** `text: set` (luật không rộng quá chỗ cần). `--tu-kiem`:
      checkout blob vào repo tạm `core.autocrlf=true` **không** có dòng luật ⇒ phải ĐỎ
      (đã chạy được phép này bằng `git checkout-index --prefix=`, số thật:
      `1815 / 959b38b2…` HỎNG vs `1754 / c4f6bcfb…` OK).
      · object: `07_plan/M04_ci/tasks/T04-12-…md` ba dòng `cmd` ·
        `core/tools/dung_lai_db.py` (0 argparse) · `core/tests/check_ci_teeth.py` (0 `gitattributes`)
      · **Không tự sửa**: `phạm_vi_ghi` của T04-12 chỉ có `.gitattributes`.


## 2026-08-28 · `<freeze-check>` không bắt artifact frozen MỚI thiếu FR (FR-037)
Phát hiện lúc đóng nhánh B (`WL-01K9NDFR037B10`).

- [ ] `core/tests/check_frozen.py` so hash file trong lock với file trên đĩa —
      nó bắt **"file frozen ĐỔI mà không có FR"**. Nó KHÔNG bắt
      **"artifact frozen MỚI được THÊM vào lock mà không có FR"**: thêm một khoá
      mới thì lần so đầu tiên đã khớp, và cổng xanh.
      Đo được: B0 tạo `06_modules/M09_thuvien/spec.md` + `rules.md`, ký cả hai
      vào `FROZEN.lock`, và **không FR nào** nhắc M09 cho tới B10 —
      `grep "M09" .factory/fr/*.md` ra **0 dòng** suốt cả nhánh.
      Sửa: so **tập khoá** của lock giữa hai lần ký, và đòi mỗi khoá MỚI có một
      FR đang mở nhắc đúng đường dẫn đó. Cùng khuôn "hai chiều" mà
      `check_rule_surfaces` đã dùng.
      **Không sửa trong B10**: nó là cổng của đơn vị khác, và sửa một cổng trong
      lượt nó đang chấm mình là đúng thứ luật gốc cấm.

## 2026-08-28 · `check_g6a` in "trên cả 7 module" khi có 9
- [ ] `core/tests/check_g6a.py:70` in `G6A: 6 điều kiện đạt trên cả 7 module` —
      con số **7 gõ tay**, trong khi `project_map` giờ có **9** module (M08 thêm
      ở FR-011, M09 ở FR-037). Cổng vẫn chấm ĐỦ cả 9 (dòng trên nó liệt từng
      module), nên đây là **lời khai sai trong báo cáo**, không phải lỗ cưỡng
      chế. Nhưng một cổng nói sai số của chính nó là cổng người ta bớt tin.
      Sửa: dẫn xuất từ `len(mp["modules"])`. Cùng lớp lỗi với
      `check_worklog` so số bằng substring (backlog M03_web).

- [ ] **`AC-2.5.1` ĐANG ĐỎ: `bash .githooks/test-hook.sh` báo *"hook chặn cả file
  ĐẠT CHUẨN — đỏ giả, người ta sẽ tắt hook"*.**
  Tái hiện trên **bản copy** của `kb/`: thả `core/tests/fixtures/dat-chuan.md`
  vào `kb/paper/` ⇒ **4 lỗi** — `walk-forward-validation` và `data-leakage`
  không có trong `kb/concepts.yaml` · `citations_sampled` khai 0 mà máy đếm 8 ·
  `unverifiable_citations` phải `true`.
  **Nguyên nhân gốc, và nó sâu hơn tên file**: *"đạt chuẩn" không phải thuộc tính
  của một file — nó là quan hệ giữa file và **danh mục** nó rơi vào.*
  `kb/concepts.yaml` co lại (704 byte, ghi 08-29) và mất hai id fixture dùng.
  Fixture không đổi; **nền** đổi. Nên `pytest -k ban_dat_chuan` **xanh** (nền
  riêng) trong khi `test-hook.sh` **đỏ** (nền `kb/` thật) — hai phép thử cùng tên
  "đạt chuẩn", hai nền, hai kết quả, và **không cổng nào canh chuyện đó**.
  `đỏ_do:` **chưa quy được chủ** — `kb/concepts.yaml` mtime 08-29 13:54, fixture
  08-27 18:33, `test-hook.sh` 08-19 02:11; cả ba **trước** phiên 2026-09-02/03,
  và phiên này không chạm `.githooks/**`, `core/tests/fixtures/**`,
  `kb/concepts.yaml`.
  · object: `.githooks/test-hook.sh` · `core/tests/fixtures/dat-chuan.md`
  · `kb/concepts.yaml`

- [ ] **`§5` khai *"31 bước"*, `ci.yml` thực tế 71.**
  Lần thứ ba cùng lớp *tự khai* (M01 ba số · M02 *"0 bài"* · M04) — xem ô tổng
  ở `06_modules/M07_curate/backlog.md` (sáu lần, sáu module).
  · object: `06_modules/M04_ci/spec.md §5` ⇒ **FR id**

- [ ] **`§2.3` và `AC-2.4.1` đã tiêu thụ xong mà vẫn viết như điều kiện tương lai.**
  `§2.3` nói *"Hiện tại KHÔNG khớp"* trong khi `§5` nói nợ đã trả (pin `3.13`);
  `AC-2.4.1` nói *"Khi đổi tên…"* trong khi `.template` không còn tồn tại.
  **Spec kể hai trạng thái cho một thứ, ở hai mục cách nhau 60 dòng** — y hệt
  `M06 §2.5` vs `§5`. Hai module cùng hình dạng: nợ trả ở `§5`, mục gốc không sửa.
  · object: `06_modules/M04_ci/spec.md §2.3 §2.4 §5` ⇒ **FR id**

- [ ] **Hai bộ lọc khác nhau cho cùng một câu hỏi *"file nào được kiểm"*.**
  `pre-commit:7` lọc `^kb/.*\.md$` và **khớp** `kb/_nhap.md`; `validate.py`
  **bỏ qua** file bắt đầu `_`. Con số hook in ra (*"validate: N file"*) vì thế
  **không** phải số file được kiểm. Vô hại hôm nay; là chỗ một người debug mất
  thời gian.
  · object: `.githooks/pre-commit:7` · `core/src/source_distiller/validate.py`

- [ ] **`check_ci_teeth.py` nằm trong `core/tests/` mà thuộc vai M04.**
  `CẤM: sửa file trong core/ hoặc kb/` là **luật gốc** (M04 kiểm hai module đó).
  Nhưng cổng của M04 sống ở `core/tests/` ⇒ một phép thử chỉ đọc **đường dẫn** sẽ
  báo vi phạm oan. Ranh giới thật là **vai**, không phải thư mục, và điều đó chưa
  khai ở đâu ngoài `workflow.md`.
  · object: `core/tests/check_ci_teeth.py` · `06_modules/M04_ci/workflow.md`

- [ ] **`<worklog-check>` CHƯA CÀI, và đo tay thấy 55/174 entry sẽ đỏ.**
  `check_map.py:16` đã khai thẳng *"`<worklog-check>` — CHƯA CÀI"*. Đo 2026-09-04
  bằng `yaml.safe_load` + kiểm khoá `object`:
  · **7 entry KHÔNG PARSE** — `WL-01K9J4FR011` · `WL-01K9J9XEMNHAN` ·
    `WL-01K9JKFR024` · `WL-01K9K1FR022` · `WL-01K9K2FR023` · `WL-01K9PDWO032` ·
    `WL-01K9X5T0810`. Nguyên nhân cùng một lớp: văn xuôi tiếng Việt đầy backtick,
    dấu hai chấm và xuống dòng — ba thứ làm vỡ *plain scalar* của YAML.
  · **48 entry THIẾU `object`** (toàn bộ là entry cũ, trước khi luật `object`
    thành bắt buộc). `CLAUDE.md`: *"không có ⇒ lời khai, reviewer FAIL"*.
  ⇒ **KHÔNG tự vá 48 entry cũ**: điền `object` cho một bàn giao mình không chứng
  kiến là **bịa bằng chứng** — đúng thứ luật `object` đi dẹp. Người quyết:
  (a) chấp nhận mốc — `<worklog-check>` chỉ soi entry từ một ngày trở đi;
  (b) đánh dấu 48 entry cũ là `di_san: true` và cổng bỏ qua chúng tường minh;
  (c) đi tìm `object` cho từng entry (đắt, và nhiều commit đã lẫn).
  Ba entry của 2026-09-04 (`WL-01KA0T0828AUDIT` · `WL-01KA0T0829BONHAP` ·
  `WL-01KA0U3VIECDUYET`) **đã sửa cho parse được** — dùng block scalar `- |` cho
  mọi mục văn xuôi. Đó là khuôn nên áp cho entry mới.
  · object: `core/tests/check_map.py:16` · đo: `python -c "yaml.safe_load(...)"`
    trên `.factory/worklog/*.yaml` ⇒ **NGƯỜI chọn (a)/(b)/(c) trước khi cài cổng**
