# T08-29 — cửa BỎ một bản nháp (`da_bo`), theo FR-057

> Đóng ô backlog `XOÁ nháp — HỞ HỢP ĐỒNG` của `06_modules/M08_api/backlog.md`.
> `T08-22` đã làm ba hành động + hai cửa đọc rồi **DỪNG ở Xoá** vì vòng đời
> `FR-046` không có giá trị nào nghĩa *"đã bỏ"*. Chủ dự án chốt lối **(a)**
> (2026-09-04, *"duyệt cả 2"*) ⇒ `FR-057` mở, và đây là phần thi công của nó.

## Bỏ ≠ xoá — nói một lần

Hàng CÒN, `ban_goc_ai` CÒN. Không cửa nào trong đơn vị này chạy `DELETE`.
Ba lý do ở `FR-057 §1`; ngắn gọn: `ban_goc_ai` tốn token model để tạo và là thứ
duy nhất trả lời *"người đã sửa những gì"*; `rule.md` mục 4 cấm agent tự xoá; và
một dòng `audit_loi` trỏ vào hàng đã biến mất là một vết vô nghĩa.

## `CHECK` phải RA CHỖ KHÁC, không `ALTER`

`T08-27` siết `trang_thai` thành `CHECK (trang_thai IN (...))` **bốn** giá trị.
SQLite **không** đổi được `CHECK` bằng `ALTER TABLE` — phải dựng lại bảng, chép,
đổi tên. Đường đó đã có: `diTruLoi(db)` trong `dungchung.mjs` (`WO-044`), và nó
đã tự dựng lại bảng + dựng lại trigger `ban_goc_ai` một lần rồi.

⚠️ Di trú phải **bất động** (chạy hai lần = một lần) và phải giữ trigger — bỏ
quên trigger là gỡ mất tính bất biến của `ban_goc_ai` một cách im lặng.

phạm_vi_ghi:
  - web/api/loi.schema.sql     # enum 5 giá trị
  - web/api/dungchung.mjs      # diTruLoi: nhánh enum 5 · loiDoiTrangThaiNhap
  - web/api/nhap-cua.mjs       # cửa `cuaBoNhap`
  - web/api/router.mjs         # đấu route `POST …/bo`

# Cổng KHÔNG khai ở đây: `web/test/loi-nhap-cua.test.js` là đất đơn vị TEST và
# đã đăng ký `npm test`. Ca mới thêm vào đó; bằng chứng đỏ-trước là output chạy
# TRƯỚC khi sửa code, ghi vào worklog cùng entry (`rule.md` mục 8).
#
# FE (nút Xoá ở `/chung-cat/nhap/`) KHÔNG ở đây — đó là `T03-107`, đơn vị M03.

verifiability: hard

tiêu_chí:
  - AC1: `da_bo` được DDL nhận; bốn giá trị cũ vẫn nhận; giá trị lạ vẫn ABORT
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: "`INSERT trang_thai='da_bo'` bị chặn, hoặc một giá trị lạ qua được"
    xanh_khi: năm giá trị FR qua, giá trị ngoài enum ABORT
  - AC2: `POST /api/nhap-chung-cat/<ulid>/bo` đổi trạng thái sang `da_bo`
      và `ly_do` đọc lại được
    cmd: node web/test/loi-nhap-cua.test.js
    đỏ_khi: cửa trả 404, hoặc `ly_do` không lưu
    xanh_khi: 200 · đọc chi tiết ra `trang_thai: da_bo` + đúng `ly_do`
  - AC3: BA ca âm — `ly_do` < 5 ký tự ⇒ 400 · hàng `da_duyet` ⇒ 409 ·
      hàng `da_bo` bỏ lần hai ⇒ 409
    cmd: node web/test/loi-nhap-cua.test.js
    đỏ_khi: ca nào trả 200
    xanh_khi: cả ba bị chặn, mỗi ca một mã đúng
  - AC4: danh sách triage mặc định KHÔNG có `da_bo`; lọc tường minh thì có
    cmd: node web/test/loi-nhap-cua.test.js
    đỏ_khi: hàng đã bỏ vẫn nằm trong hàng đợi việc phải làm
    xanh_khi: vắng ở mặc định, có ở `?trang_thai=da_bo`
  - AC5: di trú BẤT ĐỘNG và giữ trigger — chạy `diTruLoi` hai lần trên một DB
      enum-4 cho cùng kết quả, `UPDATE ban_goc_ai` vẫn ABORT
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: lần hai đổi gì đó, hoặc trigger mất sau di trú
    xanh_khi: bất động + trigger còn
  - AC6: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T08-22 · T08-27 · FR-057
