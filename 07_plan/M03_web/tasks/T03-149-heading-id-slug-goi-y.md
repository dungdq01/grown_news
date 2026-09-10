# T03-149 — C3: `md()` sinh `id` trên heading bằng `slugGoiY()` + dedup theo bài — địa chỉ `file#anchor` BẤM ĐƯỢC

> **Ngữ cảnh + harness: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** §1 · §1.5 (rule 15) · §4.
> Đóng ô C3 ở `06_modules/M03_web/backlog.md:7` (mở 2026-09-02). Test đi trước ở
> `T03-148`. ID rule 9: 148 ⇒ 149.
>
> **Việc**: trong `md()` (`multiwindow.inline.ts:313`), heading `<h${c}>` nhận
> `id="${anchor}"` với `anchor = slugGoiY(text)` + dedup `-1`/`-2` **state theo bài,
> reset mỗi lần `md()` chạy** (FR-073 §1 `$dedup`: *"renderer và indexer PHẢI cùng đi
> qua một object có state, theo cùng thứ tự heading"*). `slugGoiY` **đã có** ở `:1335`
> — **dùng lại, không viết hàm thứ hai** (M13-R2: hai luật slug là link chết hàng loạt).
>
> **`rule.md` mục 15 áp thế nào ở đây**: `md()` là renderer markdown **dùng chung**,
> không thuộc module nào — nên không có `web/plugins/<module>/` để dời nó tới. Phần
> đổi trong `multiwindow.inline.ts` phải **≤ 5 dòng** (một `id=`, một `Map` dedup, một
> `reset`); hàm dedup nếu > 3 dòng thì đặt ở **file mới** `web/plugins/multiwindow/src/scripts/anchor.ts`
> và import — không cộng thêm khối logic vào file 4 167 dòng. Diff `multiwindow.inline.ts`
> **> 8 dòng** ⇒ reviewer FAIL.
>
> **Kéo theo, mở ô NGAY**: `06_modules/M13_truyhoi/spec.md` AC-2.2 (FROZEN) đang nói
> *"vế khớp với anchor M03 render ra là AC của C3"* — sau đơn vị này vế đó **đo được**
> ở `T03-148` ca D, và spec M13 nên trỏ tới nó. Đó là một dòng trong file frozen ⇒
> **FR**, không sửa tay; ghi ô ở `06_modules/M13_truyhoi/backlog.md` trỏ PM M13.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # ≤ 8 dòng — rule 15
  - web/plugins/multiwindow/src/scripts/anchor.ts               # MỚI nếu dedup > 3 dòng
  - 06_modules/M03_web/backlog.md                              # tick ô C3 bằng commit

phụ_thuộc: T03-148

verifiability: hard
tiêu_chí:
  - AC1: bốn ca của T03-148 xanh — heading có `id` == slugGoiY, dedup -1/-2 ổn định,
      reset theo bài, ba bản khớp trên 50 heading kho thật
    cmd: cd web && node test/heading-id-anchor.test.js
  - AC2: `git diff --stat` của multiwindow.inline.ts trong đơn vị này ≤ 8 dòng thay
      đổi; 0 hàm slug mới (grep `normalize("NFD")` trong web/plugins ⇒ đúng 1 chỗ)
    cmd: cd web && node test/heading-id-anchor.test.js --mot-luat
  - AC3: page-weight — id trên heading không đẩy gn.js/gn.css qua trần (id sinh lúc
      render client, không vào bundle CSS)
    cmd: cd web && node test/page-weight.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
