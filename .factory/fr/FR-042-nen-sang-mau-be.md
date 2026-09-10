# FR-042 — Chế độ sáng đổi nền chủ đạo sang BE, thôi trắng tinh

mở_bởi: người dùng, 2026-08-30 — *"tôi muốn giao diện light đổi màu chủ đạo
  sang màu be — chứ không phải trắng tinh khôi như hiện tại"* (kèm ảnh tham
  chiếu Checklist Design: nền kem, thẻ sáng hơn một nấc).
tới: `05_uiux/tokens.css` (hợp đồng G5, 113 token) · `05_uiux/contracts/contrast-audit.json` (FROZEN)
mức: đổi SẮC của họ trung tính chế độ sáng, GIỮ ĐỘ SÁNG — không đụng chế độ tối,
  không đụng đỏ thương hiệu, không đổi alpha nào (các alpha là kết quả đo FR-027b).
trạng_thái: **DUYỆT** 2026-08-30 — yêu cầu trực tiếp.

## Cách làm — và răng

Mọi giá trị bề mặt sáng (background/card/popover/secondary/muted/border/edge/veil)
dời từ xám-trắng sang họ be CÙNG ĐỘ SÁNG. Độ sáng giữ nguyên vì toàn bộ lập luận
alpha .8 của FR-027b neo vào đó (đỏ #C81E1E chỉ dư 0.17 trên nền tệ nhất).

**Trọng tài là máy**: `python core/tools/sinh_contrast_audit.py` sinh lại
contract từ tokens — cặp nào trượt AA là đỏ, không có "nhìn cũng được".

`contrast-audit.json` là FROZEN — sửa qua FR này, **CHƯA ký lại FROZEN.lock**
(baseline đang lệch sẵn ở schema + spec chờ ký chùm — ký lúc này là ký hộ).
