# `cong` — M17_cong · cổng xác thực

> **KHUNG RỖNG.** Dựng 2026-09-01 theo `FR-045`. **Chưa có một dòng logic nào.**

| | |
|---|---|
| vùng | **BIÊN** |
| ngôn ngữ | **chưa chọn** — s4 quyết (Caddy · nginx · tự viết) |
| cổng | **443** |
| `nghe_ngoai` | **true** — dịch vụ DUY NHẤT được nghe ngoài loopback |
| key model | không |

## Vai

Nhận HTTPS từ Internet → xác thực (`ma_moi` / `phien`) → chuyển tiếp vào
`127.0.0.1`.

**Vì sao tồn tại**: chỉ đạo 2026-08-31 là **5 tài khoản, mỗi người một session**.
Đặt bề mặt Internet vào `web/` thì phải viết lại `M08-R1` (*"localhost LÀ toàn
bộ lớp bảo vệ"*) và sửa `api-guard.test.js`. Đặt vào đây thì **cả hai giữ nguyên
văn** — vì BIÊN vốn đã là vùng được giao việc đối mặt Internet.

## Luật — không nới

- **KHÔNG ghi `kb/`.** Nó chuyển tiếp, không phải cửa ghi (`FR-045` §2.4).
- **KHÔNG đọc `kb/`** một lần nào (`Z4`).
- **KHÔNG** có key model.
- Là dịch vụ **duy nhất** khai `nghe_ngoai: true`. Hai dịch vụ khai ⇒ `Z3` đỏ.
- Không có giao diện (`Z7`) — giao diện thuộc `web/`.

## Chỗ lỗi bảo mật sống

> Buộc `chat_id ↔ account`. **Đoán được mã là THÀNH người khác trong kho.**
> Mã một lần · hết hạn · mỗi lần buộc ghi `audit_log` (`FR-045` U3, U4).

## Hợp đồng ở đâu

- `FR-045` — bốn bảng, bảy cổng U1–U7
- `04_system/security_baseline.md` §1.1 — authz, và vì sao không mật khẩu
- `04_system/adr.md#ADR-05` — ba vùng, cổng Z1–Z8
- `core/assets/dich-vu.json` — **số cổng đọc từ đó**
