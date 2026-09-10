# T08-19 — Cửa LÕI cho M12: DDL bảng nháp (DB `web/`) + cửa ghi nháp (FR-047)

> Đơn vị của M08_api (đặt đúng đất — G6B từng cảnh báo khi nằm trong plan M12). Chỉ dựng
> phần M12 cần: cửa nhận job (proxy sang :8790) + cửa ghi nháp. 5 cửa còn lại
> của FR-047 là các đơn vị sau, không gộp.
> FR-046 + ADR-06: bảng nháp ở DB riêng web/, ban_goc_ai BẤT BIẾN.
>
> ⚠️ **ĐỔI ID 2026-09-03: `T08-2` → `T08-19`.** `check_g6b` bắt được
> *"`T08-2`: ID TRÙNG — … file sau ghi đè file trước nên `phạm_vi_ghi` của MỘT
> trong hai KHÔNG được kiểm"* ⇒ **R1 có lỗ**. Đơn vị này là bản dời từ `T12-3`
> (đặt nhầm đất `web/**` trong plan M12 — xem `WL-01K9Y1S7M12`), nên nó nhận số
> mới; `T08-2-ghi-va-status.md` giữ nguyên vì nó có trước.
> `T08-17`/`T08-18` **đã có người** — số trống tiếp theo là **19**.
>
> ⚠️ **`phạm_vi_ghi` sửa cho khớp mã THẬT** (đo 2026-09-03): mã đã viết nằm ở
> `web/api/`, không phải `web/db/`. Bốn file đang `??` (chưa commit).

phạm_vi_ghi:
  - web/api/loi.schema.sql              # DDL 5 bảng + trigger ban_goc_ai bất biến
  - web/api/loidb.mjs                   # mở DB (WAL, foreign_keys) + hàm truy vấn
  - web/api/loi-cua.mjs                 # handler C1–C7, mỗi cái qua quaCong
  - web/api/router.mjs                  # đấu dây route cửa LÕI
  - web/api/dungchung.mjs               # CHỈ `XUAT_LOI[nhap_chung_cat].cot` + loiTaoNhap/loiSuaNhap

# ⚠️ HAI ĐƯỜNG BỊ GỠ 2026-09-03 — chúng NGOÀI boundary của M08_api
# (`project_map`: web/api/** · _recycle/** · 06_modules/M08_api/**):
#
#   web/test/loi-cua.test.js   → đất của M03_web (`fe: web/**`); và `check_g6b`
#                                còn bắt thêm R1: "chạm file test mà không phải
#                                đơn vị test". File ĐÃ ĐƯỢC VIẾT (449 dòng,
#                                đang `??`) mà KHÔNG đơn vị nào khai sở hữu.
#   core/assets/dich-vu.json   → đất của M01_core.
#
# Đây KHÔNG phải nợ tôi tạo ra — gỡ hai đường này chỉ làm nó ĐẾM ĐƯỢC. Trước
# khi đổi ID, `phạm_vi_ghi` của đơn vị này bị `T08-2` ghi đè nên KHÔNG ai kiểm,
# và cả hai vi phạm nằm im. Cần một quyết định của PM/người:
#   (a) một đơn vị TEST riêng sở hữu `web/test/loi-*.test.js`, hoặc
#   (b) mở boundary M08_api trong `project_map` — đổi map là việc có FR.
# Ô backlog: `06_modules/M08_api/backlog.md`.

verifiability: hard
tiêu_chí:
  - AC1: POST cửa ghi nháp ⇒ hàng mới trang_thai=nhap, review_status=draft
      LUÔN LUÔN — payload cố ghi approved bị lờ (khuôn cửa-cho-MÁY FR-047)
    cmd: node web/test/loi-cua.test.js
  - AC2: ban_goc_ai ghi MỘT lần; update sau chỉ đụng ban_hien_tai — cố UPDATE
      ban_goc_ai ⇒ lỗi
    cmd: node web/test/loi-cua.test.js
  - AC3: dung_lai_db.py chạy xong bảng nháp CÒN NGUYÊN (nó ở DB khác — đúng
      ADR-06)
    cmd: node web/test/loi-cua.test.js
  - AC4: không phá gì — suite web xanh
    cmd: cd web && npm test
