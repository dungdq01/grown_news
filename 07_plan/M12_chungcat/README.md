# Plan M12_chungcat — C4a (đường TÀI LIỆU)

> s7 · 2026-09-03 · PM: claude (phiên trợ lý). Plan là SOFT — NGƯỜI duyệt (G6B)
> rồi mới bắn task. Nguồn: s6 pack + FR-046/047/053 + nghiên cứu kỹ thuật §13.

## Thứ tự + phụ thuộc

```
T12-0 (giấy: áp FR-053 + người ký lock)   ← chạy TRƯỚC TẤT CẢ
   → T12-8 (đơn vị TEST: 17 cổng spec, đỏ trước — R5)
   ├→ T12-1 bảng khai ─┐
   ├→ T12-2 verify.py  ├→ T12-5 adapter nhà 1 → T12-6 vòng+API → T12-9 tổng-hợp → T12-7 nhà 2
   └→ T12-4 egress ────┘
T08-19 (plan M08: DDL nháp + cửa ghi nháp) ← MÃ ĐÃ VIẾT, chưa commit
```

> **Đổi 2026-09-03**: `T08-2` → **`T08-19`**. `check_g6b` bắt *ID TRÙNG* — hai
> task khác nhau cùng mang `T08-2`, nên `phạm_vi_ghi` của một trong hai **không
> được kiểm** (R1 có lỗ). Đơn vị dời từ `T12-3` nhận số mới; `T08-17`/`T08-18`
> đã có người nên số trống là **19**.
>
> **Và nó KHÔNG còn là việc chờ**: đo 2026-09-03 — cả bảy cửa `FR-047` đã có mã
> (`web/api/loi-cua.mjs` C1–C7 · `loi.schema.sql` 5 bảng + trigger `ban_goc_ai`
> · `loidb.mjs` · `loi-cua.test.js` 449 dòng · router đã đấu). **Bốn file đang
> `??`** — chưa commit. Còn **ba chỉnh trước khi commit**: đổi tên cột
> `lan_gui` → `lan_gui_duyet` · thêm cột `review_status` (`CHECK` hằng
> `= 'draft'`) · `cuaNhapChungCat` lột trường trạng thái từ payload.

- Hai agent trở lên ⇒ mỗi đơn vị một nhánh; T08-19 bắt buộc worktree riêng
  (đất web/) + scope-check. Chỉ T12-8 được chạm chungcat/tests/ (R1).
- Mỗi đơn vị: tiêu chí commit TRƯỚC code · test đỏ trước · reviewer ⑤ + vai
  khác merge.

## CHỜ — không tạo task trước khi quyết (bài học S18)

| việc | chờ gì |
|---|---|
| C4b sinh-transcript · C4c chưng video | FR-054 **ĐÃ DUYỆT 2026-09-03** + FR-052 đã áp (§7.3 của FR-054 đo được) — chia task ở ĐỢT BỔ SUNG ngay sau khi C4a có bộ khung chạy (T12-6 xong), không chờ gì khác |
| 5 cửa FR-047 còn lại | đơn vị của M08, ngoài plan này |
| ~~UI~~ | **ĐÃ CHIA 2026-09-03**: T03-92..95 + T03-96 (test) trong plan M03 — bắn sau khi T12-0 xong + backend được agent kia test |
| batch (che_do) | sau C4a chạy sync ổn — đổi 1 dòng bảng là phép thử AC-7.1 |

## Việc của NGƯỜI, ghi để không trượt

- Ký lại FROZEN.lock sau T12-0 (spec+rules M12).
- **Nạp thêm nguyên liệu PDF trước khi đo M6.1** — kho có 1 tài liệu, thước đo
  cần 10.
