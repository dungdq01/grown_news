# T03-150 — đơn vị TEST (M03, cho cửa M08): dời cổng `kho-delta.test.js` từ thư mục task vào `web/test/` + đăng ký `npm test`

> **Ngữ cảnh + harness: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** §1 · §4.
> `rule.md` mục 8: cổng viết-trước sống ở thư mục task, **dời vào `web/test/` + đăng ký
> `npm test` CÙNG LƯỢT với mã**. Dev đã viết cổng ở
> `07_plan/M08_api/tasks/T08-35-kho-delta.test.js` (19 lỗi → pass, commit `cf51668`)
> và **dừng đúng vế dời** vì `web/test/**` + `web/package.json` không có trong
> `phạm_vi_ghi` của T08-35 — và theo `check_g6b` §5 (R1) chúng phải thuộc một **đơn vị
> test riêng**. Đây là đơn vị đó.
> **Vì sao ở M03 chứ không phải M08**: `web/test/**` thuộc boundary `fe: web/**` của
> M03_web — tiền lệ `T08-27`/`T08-29`/`T08-30` đều ghi *"cổng KHÔNG khai ở M08; đơn vị
> TEST ở M03 (`T03-91`)"*. Bản đầu của đơn vị này là `T08-39` (2026-09-10) và `check_g6b`
> §2 bắt ngay: *ghi `web/test/kho-delta.test.js` ngoài boundary M08_api*. Đổi module,
> giữ nội dung. ID rule 9: max T03-149 (dải hiện hành, 190+ là PM-Space) ⇒ 150.

phạm_vi_ghi:
  - web/test/kho-delta.test.js
  - web/package.json           # đăng ký vào scripts.test — MỘT dòng

phụ_thuộc: T08-35

verifiability: hard
tiêu_chí:
  - AC1: `git mv 07_plan/M08_api/tasks/T08-35-kho-delta.test.js web/test/kho-delta.test.js`
      (mv, không copy — lịch sử cổng đỏ-trước phải theo file); cổng vẫn pass ở chỗ mới
    cmd: cd web && node test/kho-delta.test.js
  - AC2: `npm test` gọi cổng này — grep tên file trong web/package.json ⇒ 1; và vế AC3
      (poke) vẫn in SKIP kèm lý do, không xanh rỗng (T08-35 AC3 HOÃN, chờ FR)
    cmd: cd web && npm test
  - AC3: thư mục 07_plan/M08_api/tasks/ hết file .test.js (0) — cổng viết-trước không
      sống hai chỗ
    cmd: cd web && node test/kho-delta.test.js
