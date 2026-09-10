# T08-4 — FR-034 B4: flip API đọc+ghi sang kb/_kho.sqlite (một PR)

Theo plan đã duyệt 2026-08-26 (`.claude/plans/ph-ng-n-b-l-n-sorted-swan.md`,
giai đoạn B). Cổng mới có trước ở T01-5 (R3). Harness test đổi theo ở T03-5
(đơn vị test của M08, scope web/test/**).

phạm_vi_ghi:
  - web/api/**
verifiability: hard
tiêu_chí:
  - AC1: vòng CRUD đủ trên DB tạm, ca âm giữ nguyên (409 trùng, 412 etag cũ,
      400 đổi khoá, 400 type ngoài enum, traversal)
    cmd: node web/test/api-crud.test.js
  - AC2: chuyển trạng thái theo bảng cứng, PUT không chở review_status
    cmd: node web/test/api-status.test.js
  - AC3: DELETE = INSERT recycle + DELETE articles cùng txn; restore chiều ngược
    cmd: node web/test/api-recycle.test.js
  - AC4: guard tĩnh — mutation SQL chỉ trong dungchung.mjs, không unlink kho,
      không default trường quyết định, mỗi COMMIT kèm banXuat
    cmd: node web/test/api-guard.test.js
  - AC5: bốn răng export một chiều
    cmd: python core/tests/check_export_dan_xuat.py
phụ_thuộc: T01-5
