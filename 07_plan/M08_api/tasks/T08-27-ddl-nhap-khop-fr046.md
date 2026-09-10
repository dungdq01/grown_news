# T08-27 — DDL `nhap_chung_cat` khớp `FR-046 §1` (WO-043, lối A)

> **Chủ dự án duyệt 2026-09-04**: *"sửa luôn DDL và cứ note vào worklog,
> backlog là được — hướng A"*. `FR-046` ĐÃ DUYỆT nên **không cần FR mới**: đây
> là làm cho mã khớp hợp đồng đã chốt, không phải đổi hợp đồng.
>
> ID cấp theo `rule.md` mục 9: `ls 07_plan/M08_api/tasks/` → max **26** ⇒ **27**.
> Ghi tên file vào worklog NGAY lúc tạo (`WL-01K9SE4T0827DDL`).

## Ba sửa — mỗi cái một dòng của FR-046 §1

| FR-046 §1 khai | DDL đang có | sửa thành |
|---|---|---|
| `khang_dinh_bi_tia` | **không có** | cột `TEXT` (JSON, cho phép NULL) |
| `nhap` → `da_sua` → `da_duyet` \| `tra_lai` | `nhap` · `da_gui` · `bo` | đúng bốn giá trị của FR |
| *(ca trả lại bắt lý do)* | không có | cột `ly_do TEXT` |

`da_gui` và `bo` **không có nguồn** — grep toàn repo: chỉ trong chính DDL đó và
một dòng test của nó. Không spec, không FR, không `decisions.md`.

## Bốn thứ KHÔNG được đổi

1. **`review_status` giữ `CHECK` hằng `= 'draft'`.** Nó là chuyện KHÁC
   (`AC-1.3` của M12): bảng này CHỈ chứa nháp, một hàng mang `approved` là lỗi
   **cấu trúc**. `da_duyet` của `trang_thai` KHÔNG có nghĩa "đã vào kho" —
   duyệt = ghi FILE vào `kb/` + `dung_lai_db`, và từ giây đó **file là chân lý**
   (`FR-046 §1` · `B-C1`).
2. **Trigger `nhap_chung_cat_ban_goc_bat_bien`** còn nguyên.
3. **`lan_gui_duyet`** giữ tên — `lan_gui` chỉ có một nghĩa (egress ở THỢ),
   `decisions.md` 2026-09-03 chốt điều đó.
4. **`cap_nhat_luc`** giữ tên thay vì đổi sang `sua_luc` của FR: hai tên cho
   cùng một nghĩa, và đổi tên một cột đang được ba chỗ đọc là rủi ro không mua
   được gì. Ghi ra để không ai tưởng đây là chỗ lệch thứ tư.

## Vì sao RẺ NGAY BÂY GIỜ

Bốn file của `T08-19` còn `??` (chưa commit) và bảng **chưa có dữ liệu thật**
⇒ **0 migration**, `DROP`+`CREATE` trong fixture là đủ. Cùng ba sửa này sau khi
có dữ liệu là một FR + một đường di trú. Đúng lập luận đã dùng cho `B1/B2/B3`.

phạm_vi_ghi:
  - web/api/loi.schema.sql     # +2 cột, enum 4 giá trị
  - web/api/dungchung.mjs      # XUAT_LOI cột + loiTaoNhap/loiSuaNhap
  - web/api/loidb.mjs          # nếu cần hàm đọc cột mới

# Cổng KHÔNG khai ở đây: `web/test/loi-*.test.js` là đất `T03-91` (đơn vị TEST).
# `loi-cua.test.js` ĐÃ CÓ và đã đăng ký `npm test`, nên ca mới thêm vào đó —
# bằng chứng đỏ-trước là output chạy TRƯỚC khi sửa DDL (`rule.md` mục 8).

verifiability: hard
tiêu_chí:
  - AC1: enum đúng bốn giá trị FR-046 — `tra_lai` và `da_sua` được nhận,
      `da_gui` và `bo` bị CHẶN ở tầng DDL
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: "`INSERT` với `trang_thai='da_gui'` vẫn qua, hoặc `'tra_lai'` bị chặn"
    xanh_khi: bốn giá trị FR qua, hai giá trị cũ ABORT
  - AC2: `khang_dinh_bi_tia` + `ly_do` tồn tại và đọc lại được qua cửa
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: một trong hai cột không có, hoặc `XUAT_LOI` không liệt kê nó
    xanh_khi: ghi rồi đọc lại ra đúng giá trị
  - AC3: `review_status` VẪN `CHECK` hằng, trigger `ban_goc_ai` VẪN abort
    cmd: node web/test/loi-cua.test.js
    đỏ_khi: "`UPDATE review_status='approved'` qua được, hoặc `UPDATE ban_goc_ai` không abort"
    xanh_khi: cả hai còn chặn
  - AC4: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T08-19
