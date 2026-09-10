# `_control_db/` — sổ kiểm soát dữ liệu

Thư mục của agent **KIỂM SOÁT DỮ LIỆU**. Chỉ CHECK · REVIEW · GÓP Ý.

## Luật của thư mục này

- **Chỉ đọc phần còn lại của cây.** Không file nào ngoài `_control_db/**` được
  agent này ghi. Không sửa schema · FR · spec · code.
- **Mỗi lần review một file, có ngày**: `YYYY-MM-DD-<chủ-đề>.md`.
- **Mỗi nhận xét TRỎ VÀO VẬT THỂ** — `file:dòng` · FR · tên bảng · lệnh chạy được.
- **Phân loại**: `[chặn]` · `[nên]` · `[hỏi]`.
- **Không phán đỏ khi chưa quy được chủ.** Có ≥2 agent khác làm cùng cây;
  đỏ chưa quy chủ thì ghi `chưa quy được chủ` kèm `git status` / mtime.
- **Chỉ báo cáo — người quyết.** Không mở FR, không tick backlog, không ký gate.

## Nền phải thuộc khi đọc các báo cáo ở đây

| | |
|---|---|
| `kb/**/*.md` | **chân lý** của KHO |
| `kb/_kho.sqlite` | **dẫn xuất** — `dung_lai_db.py` xoá rồi dựng lại; cấm chứa dữ liệu GỐC |
| `web/_loi.sqlite` | **dữ liệu GỐC** (4 bảng tài khoản + nháp chưng cất) — chạm chỉ qua 7 cửa `FR-047` |
| `_backup/` | bản lùi 3 bảng gốc, **gitignore** (`FR-050` cách 2) — mất ổ = mất tài khoản |
| hàng đợi việc | **Maildir ở THỢ**, KHÔNG bảng job ở LÕI |
| gọi model | mỗi lần một dòng log kèm `sha256` payload (`security_baseline §4b` bậc 4) |

## Sổ tay SỐNG — đọc cái này trước

| file | là gì |
|---|---|
| **[BANG-DB.md](BANG-DB.md)** | **Hiện trạng mọi bảng DB**: vị trí file · khoá chính · cột · lưu gì · nợ đang mở. KHÔNG có ngày trong tên vì nó được **cập nhật liên tục** — có bảng mới/đổi cột/đổi khoá thì sửa ngay lượt đó. Mọi file dưới đây là ảnh chụp một ngày; file này là hiện tại. |

## Chỉ mục — ảnh chụp theo ngày

| ngày | file | phạm vi |
|---|---|---|
| 2026-09-03 | [2026-09-03-db-phase1-va-phase2.md](2026-09-03-db-phase1-va-phase2.md) | DB phase 1 (kho + LÕI) · thiết kế phase 2 M12–M19 |
| 2026-09-04 | [2026-09-04-nghien-cuu-cloudflare-r2.md](2026-09-04-nghien-cuu-cloudflare-r2.md) | nghiên cứu + kế hoạch chuyển dữ liệu lên Cloudflare R2 (video mp4 · DB · pháp lý) |
| 2026-09-05 | [2026-09-05-kiem-ke-db.md](2026-09-05-kiem-ke-db.md) | kiểm kê 3 DB + 2 thư mục bản lùi: bảng, số hàng, trạng thái, sơ đồ |
| 2026-09-08 | [2026-09-08-bang-khoa-chinh-va-noi-dung.md](2026-09-08-bang-khoa-chinh-va-noi-dung.md) | bảng đang chạy · khoá chính · lưu gì (sau khi M12 chốt) |
| 2026-09-09 | [2026-09-09-space-model-anh-huong-database.md](2026-09-09-space-model-anh-huong-database.md) | Space Model: ảnh hưởng tới schema — PK, ontology, media, export, quyền |
| 2026-09-10 | [2026-09-10-dinh-tuyen-space.md](2026-09-10-dinh-tuyen-space.md) | định tuyến /factory:go cho Space — FR → ADR-09 → s6; G1/G2/G3 đã bỏ |
| 2026-09-10 | [2026-09-10-ra-soat-file-sql-va-db-rac.md](2026-09-10-ra-soat-file-sql-va-db-rac.md) | rà soát .sql + DB rác — 0 file .sql rác; 135 MB đã vào git |
