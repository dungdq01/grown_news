# FR-066 — M18: `AC-6.1` đổi nghĩa + `M18-R3` đổi vai (mở đường cho T08-16)

- **mở**: 2026-09-05 · **người mở**: claude (PM) · **trạng thái**: **ĐÃ DUYỆT** 2026-09-05 — chủ dự án uỷ quyền nguyên văn cùng phiên: "Bạn duyệt giúp tôi FR 66 luôn" (PM ghi hộ; quyền duyệt vẫn của NGƯỜI)
- **artifact chạm**: `06_modules/M18_nguoidung/spec.md` (AC-6.1, thêm AC §10) ·
  `06_modules/M18_nguoidung/rules.md` (M18-R3) — CẢ HAI FROZEN
- **vì sao**: `T08-16` (phân quyền hai vai, FR-051 đã duyệt §3e) cần
  `nguoi_dung.vai` sống — nhưng `AC-6.1` hiện CƯỠNG CHẾ cột vai trống, và
  check_g6b bắt T08-16 ghi 2 file frozen M18 không FR (2 lỗi boundary).
  FR-051 duyệt phần CƠ CHẾ; phần GIẤY M18 chưa ai mở cửa — đây là cửa.
- **chốt đề nghị**: AC-6.1 đổi từ "vai luôn trống" → "vai ∈ {chu, dong_nghiep},
  gán qua cửa C6, không nhận từ payload"; M18-R3 đổi vai theo FR-051 §3e;
  thêm AC §10 cho hai vai. NGƯỜI ký lại lock sau áp.
- **mở khoá**: T08-16 hết 2 lỗi boundary; cột vai có luật sống.
