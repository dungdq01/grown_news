# T08-16 — Phân quyền hai vai: enum đóng + một chokepoint (`FR-051`)

> `FR-051` chốt ma trận: **chủ dự án ✅ cả bốn · đồng nghiệp ❌ cả bốn**
> (sửa bài người khác · mời người mới · thu hồi · xem audit). Hai cột
> *"duyệt bài"* và *"nạp nguồn"* đã cố định bởi `B-B1` + `M05-R1`.

## Trạng thái trước đơn vị này

`nguoi_dung.vai` là **cột trống**, và `M18 AC-6.1` đang **cưỡng chế sự trống
rỗng đó**: bốn giá trị `vai` khác nhau cho **cùng một** kết quả.

⚠️ Đơn vị này **đảo chiều** một cổng đang xanh. Đó là chỗ đáng cẩn thận nhất:
`AC-6.1` sẽ **đỏ đúng cách** sau khi thi công, và phải sửa **AC** trước, không
phải xoá cổng. `M18-R3` cũng **đổi vai** chứ không bị gỡ (`FR-051 §3e`).

## Phạm vi

phạm_vi_ghi:
  - web/api/loi.schema.sql        # CHECK enum cho `vai` + backfill
  - web/api/dungchung.mjs         # `duocLam()` — MỘT chokepoint
  - web/api/loi-cua.mjs           # gọi `duocLam` ở cửa cần quyền
# Giấy tờ M18 (`spec.md` · `rules.md`) TÁCH sang `T18-1` theo `FR-066` — đất
# M18, ngoài boundary `M08_api`. Cùng tiền lệ PM dùng cho `T09-8`: đơn vị chạm
# ≥2 module là BUILD-hình-dạng, mã tách theo module CHỦ. `T08-16` giữ phần cơ
# chế ở `web/api/**`; phần giấy có chủ riêng.

**Không** chạm: `web/test/**` (đơn vị TEST `T08-16b` — `R1`) ·
`articles.mjs` (cửa của NGƯỜI, `B-B1`) · `core/assets/**`.

## Quyết định

**a · Hai vai, enum ĐÓNG.** `vai IN ('chu', 'dong_nghiep')` — `CHECK` ở DDL.
`FR-051 §3a`: chuỗi tự do làm một lỗi chính tả thành một vai mới **im lặng**.

**b · `NOT NULL DEFAULT 'dong_nghiep'`.** `null` bị **cấm**, không phải "có
nghĩa rõ". Fail-closed: một hàng thiếu `vai` mặc định là vai **ít quyền nhất**,
không phải nhiều nhất. Đây là chỗ `CVE-2026-47713` hỏng theo chiều ngược
(`user ? whereWithUser(user) : where({})` — thiếu danh tính thì trả **tất cả**).

**c · Backfill:** hàng hiện có → `'dong_nghiep'`. Chủ dự án phải được **nâng
tay**, không tự động. Một script tự đoán "ai là chủ" là một script sẽ đoán sai.

**d · ĐÚNG MỘT hàm `duocLam(nguoi_dung_id, viec)`.** Đếm được bằng grep, cùng
hình dạng `M14 AC-8.4` và `M18 AC-3.1`.

**e · DENY mặc định.** `viec` không có trong bảng khai ⇒ **false**. Thêm một
thao tác mới mà quên khai quyền ⇒ nó **không chạy được**, chứ không phải **ai
cũng chạy được**.

**f · `B-B1` KHÔNG đi qua `duocLam`.** *"Chỉ chủ dự án duyệt bài"* ở **mã**,
không ở bảng quyền — `FR-051 §7a`. Một cờ tắt được `B-B1` là một cờ sẽ có ngày
bị tắt.

**g · Đổi `vai` ghi `audit_log`.** `FR-051 §7b`.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1 (Y1): `INSERT` một `vai` ngoài enum ⇒ **bị DDL từ chối**
    cmd: cd web && node test/phan-quyen.test.js
  - AC2 (Y2): không hàng nào `vai IS NULL`; hàng mới mặc định `dong_nghiep`
    cmd: cd web && node test/phan-quyen.test.js
  - AC3 (Y3): đúng **MỘT** chỗ đọc `vai` để quyết định
    cmd: cd web && node test/phan-quyen.test.js
  - AC4 (Y4): `viec` chưa khai ⇒ **false** (DENY mặc định)
    cmd: cd web && node test/phan-quyen.test.js
  - AC5 (Y5): `dong_nghiep` **không** đặt được `approved` — `B-B1` nguyên vẹn
    cmd: cd web && node test/phan-quyen.test.js
  - AC6 (Y6): `M17-R6` vẫn lột `review_status` ở biên
    cmd: cd web && node test/loi-cua.test.js
  - AC7: đổi `vai` ghi audit
    cmd: cd web && node test/phan-quyen.test.js
  - AC8: `M18 AC-6.1` đổi nghĩa, **không** bị xoá; `check_g6a` xanh
    cmd: python core/tests/check_g6a.py
  - AC9: không hồi quy
    cmd: cd web && npm test

⚠️ **AC5 là vế không thương lượng** — mọi ma trận nào, ô *"đồng nghiệp × duyệt
bài"* vẫn ❌.

## Đỏ TRƯỚC

`R5`: `T08-16b` viết `test/phan-quyen.test.js` **trước**; nó phải ĐỎ vì
`duocLam` chưa tồn tại.

phụ_thuộc: T08-11 (DDL), T08-15 (rate limit) — đã xong
