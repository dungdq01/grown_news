# FR-046 — Bản nháp chưng cất + revision sống trong DB

- **mở**: 2026-09-02 · **người quyết**: chủ dự án (*"nháp chưng cất lưu DB luôn"*) ·
  **trạng thái**: đã duyệt
- **artifact chạm** *(sửa 2026-09-02 theo `ADR-06`/FR-047)*: **DDL của DB riêng
  trong `web/`** — KHÔNG phải `kho.schema.sql`: `dung_lai_db.py` xoá
  `kb/_kho.sqlite` rồi dựng lại từ file, bảng nháp đặt ở đó sẽ bay theo mỗi lần
  chạy. Chủ dự án chốt: "backend của phần nào ở đâu thì .db nằm ở đó". ·
  `04_system/adr.md` (ADR mới khi s6 M12 thi hành) · spec M12/M03 (s6 đợt tới)
- **mở khoá**: màn **Hàng đợi duyệt nháp** (ma trận UI đợt hai §2) — cần chỗ lưu
  bản-AI-gốc bất biến + bản-người-sửa để nút "khác gì bản AI" diff được.

## 0 · Vì sao phải FR

Ba thứ đang kéo nhau:

| | nói gì |
|---|---|
| chỉ đạo `upgrade.md` | *"tất cả qua API+DB"* — chưa từng thành FR |
| `B-C1` | `kb/` (file) là nguồn chân lý của KHO |
| `FR-028` | danh mục GIỮ yaml làm nguồn sự thật |

Quyết định hôm nay **không đảo B-C1 và không đụng FR-028** — nó cắt đúng ranh:

> **Bài ĐÃ VÀO KHO: file trong `kb/` vẫn là chân lý (B-C1 nguyên vẹn).
> Bản NHÁP chưng cất — thứ CHƯA vào kho — cùng bản-AI-gốc và các revision
> sống trong DB.** Nháp không phải kho; nó là dữ liệu làm-việc của một hàng đợi.

## 1 · Hình dạng chốt (khung — s6 M12/M03 chi tiết hoá)

- Bảng mới (tên do s6): `nhap_chung_cat(job_ulid, ban_goc_ai, ban_hien_tai,
  khang_dinh_bi_tia, trang_thai: nhap → da_sua → da_duyet | tra_lai | da_bo,
  sua_luc)`.
  > **Sửa 2026-09-04 — `FR-057`**: thêm `da_bo`. `T03-94` đòi bốn hành động
  > (Duyệt · Sửa · Trả lại · **Xoá**) mà vòng đời không có giá trị nào nghĩa
  > *"đã bỏ"*. **Bỏ ≠ xoá**: hàng còn, `ban_goc_ai` còn — vế "bất biến" ngay
  > dưới đây giữ nguyên. Luật của cửa `bo` ở `FR-057 §2`.
- **`ban_goc_ai` bất biến** — ghi một lần lúc job xong; mọi chỉnh sửa đổ vào
  `ban_hien_tai`. Diff "khác gì bản AI" = so hai cột, không cần bảng version.
- **Duyệt** = validate --strict pass → ghi file vào `kb/` (một cửa ghi như cũ)
  + `dung_lai_db`. Từ giây đó file là chân lý — DB nháp chỉ còn là lịch sử.
- `_inbox/` + gate **vẫn là đường của bản NGOÀI** (M05 nguyên vẹn); worker M12
  ghi nháp qua API vào bảng nháp, không thả file nữa — s6 M12 khai lại data_flow.

## 2 · Kèm theo (người quyết cùng lượt, 2026-09-02)

1. **M12 CÓ checkpoint theo giai đoạn** — "Chạy lại" mặc định từ giai-đoạn-hỏng
   (đỡ phí token); "chạy lại từ đầu" là lựa chọn phụ, tường minh.
2. Luật focus/z-order (cửa sổ đọc · panel chat · tray) → vào spec M03 khi port.
3. Rail phải gập/bottom-sheet → đo trên breakpoint thật khi port.

## 3 · KHÔNG làm trong FR này

- Không đụng B-C1, FR-028, M05-R1. Không chọn tên cột cuối — việc của s6.
- Không ký FROZEN.lock (schema không frozen; không file frozen nào bị chạm).
