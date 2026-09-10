# T08-2 — đường GHI: POST/PUT + PATCH status, validate-trước-ghi

> ⚠️ **Thu phạm vi 2026-09-03**: trước đây khai `web/api/**`. Wildcard đó **bao
> trùm** `web/api/loi-cua.mjs` của `T08-19`, nên `<scope-check>` (*"hai task
> tranh cùng một file"*) **không phân biệt được hai đơn vị**. Danh sách dưới là
> ba file mục §Việc đã nêu đích danh — không mất gì, chỉ hết nuốt.

phạm_vi_ghi:
  - web/api/articles.mjs                # POST/PUT
  - web/api/status.mjs                  # PATCH status
  - web/api/dungchung.mjs               # ghiSauValidate()
verifiability: hard
tiêu_chí:
  - AC1: vòng CRUD đủ + ca âm (POST trùng 409, PUT etag cũ 412, PUT đổi slug 400, PUT chở review_status bị lột, kho tạm sạch validate cuối test)
    cmd: node web/test/api-crud.test.js
  - AC2: approve thiếu 1/3 trường M1 ⇒ 422 và file không đổi byte; reject_reason <5 ⇒ 422; chuyển ngoài bảng ⇒ 409; external+approve (FR-012) ⇒ 200
    cmd: node web/test/api-status.test.js

phụ_thuộc: T08-1

## Việc

- `web/api/articles.mjs` — POST (áp `origin: manual` + `draft`, lột trường
  server-quyết), PUT (If-Match, `approved`+đổi nội dung ⇒ `edited`).
- `web/api/status.mjs` — PATCH, bảng chuyển cứng M02 §2.2, approve đòi 3 trường
  M1 nguyên từ body (KHÔNG default — M08-R3), reject đòi lý do ≥5.
- `ghiSauValidate()` trong dungchung — MỌI ghi kb đi qua đúng hàm này:
  tmp ngoài repo → `validate.py --fix` → `--strict --concepts kb/concepts.yaml`
  → exit 0 mới rename nguyên tử (tmp-rename cạnh kb, cùng volume).
- 422 trả **nguyên văn** THIẾU/SAI/SỬA từ stdout validate.

## Rule áp vào

`M08-R2` (validate trước ghi) · `M08-R3` (không default) · `M08-R5` (lột trường).
