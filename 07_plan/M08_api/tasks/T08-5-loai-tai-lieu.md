# T08-5 — FR-036/B1: `LOAI` nhận `tai-lieu` (đơn vị CODE)

> Chỉ MỘT giá trị enum. Cửa ghi, trần body, và đường nạp hiện vật là T08-6 (B3) —
> tách ra vì T08-5 phải ship CÙNG T01-8 (cùng một lần dựng lại DB).

phạm_vi_ghi:
  - web/api/dungchung.mjs
verifiability: hard
tiêu_chí:
  - AC1: `LOAI` có `tai-lieu`; router nhận `/api/articles/tai-lieu/<slug>`; một loại
      ngoài enum vẫn trả 400 — thêm giá trị không được nới cổng cấu trúc
    cmd: cd web && node test/duong-api-khop-route.test.js && node test/api-crud.test.js
  - AC2: trần body JSON `TRAN` GIỮ 1 MB — nó là chặn bù của mọi lần ghi bài (M09-R5)
    cmd: cd web && node test/api-guard.test.js
phụ_thuộc: T01-25
