# T03-120 — REDESIGN bộ nút vòng đời + badge trạng thái (MÀU) — WIREFRAME TRƯỚC

> Chủ dự án 2026-09-06: *"design lại một chút về các button trạng thái —
> dễ nhìn, thêm màu sắc — vẫn lỗi UI"*. Hiện 5 nút chân cửa sổ cùng kiểu
> chữ xám, hành động nguy hiểm đứng cạnh hành động chính, trạng thái bài
> chỉ là chữ mờ (claimed · draft) — người phải ĐỌC thay vì NHÌN.
> Lệ wireframe-trước giữ nguyên (khuôn T03-116/117). ID rule 9: max 119 ⇒ 120.

## BƯỚC 1 — WIREFRAME `05_uiux/wireframes/SCR-20-nut-trang-thai.md` (NGƯỜI duyệt)

- Hệ MÀU trạng thái (token, cấm hex trần — thiếu token thì KHAI THÊM ở
  tokens.css/prototype.css :root kèm $vi_sao, cả sáng/tối):
  draft=vàng · approved=xanh lá · edited=cam · rejected=đỏ nhạt gạch ·
  thùng-rác=xám. Badge trạng thái trên card + trong cửa sổ CÙNG một hệ.
- Bộ nút chân cửa sổ phân VAI nhìn thấy được:
  · CHÍNH (một nút nổi — Đưa lên site khi draft; Duyệt vào kho khi là nháp)
  · PHỤ (Sửa · Xem bài gốc — ghost)
  · NGUY HIỂM (Loại · Bỏ khỏi kho — TÁCH cụm sang phải), và HAI NÚT NÀY phải
    TỰ GIẢI THÍCH — chủ dự án phải hỏi mới phân biệt được (2026-09-06):
    Loại = "bản án có hồ sơ" (viền đỏ, phụ đề/tooltip "ở lại kho · rejected ·
    bắt lý do") ≠ Bỏ = "vứt sọt" (xám, phụ đề "vào thùng rác · khôi phục
    được"). Wireframe vẽ cả tooltip/phụ đề.
  + nhãn ngữ cảnh chân cửa sổ: "BẢN NHÁP" / "BÀI TRONG KHO — chưa lên site"
    / "ĐANG TRÊN SITE" (đề xuất từ review nút 2026-09-06).
- THỨ TỰ NÚT CHỐT (chủ dự án chê thứ tự cũ "thiếu logic" 2026-09-06 — ảnh:
  Đưa-lên-site · Loại · Sửa · Bỏ · Xem-gốc · Tải-xuống lẫn lộn vai):
  trái → phải theo TẦN SUẤT + VAI, nguy hiểm tách xa (chống bấm nhầm):
  ┌ CHÍNH ─────┐┌ DÙNG BÀI hằng ngày ──────────────┐   (spacer)  ┌ NGUY HIỂM ┐
  [✓ Đưa lên site] [⬇ Tải xuống ▾] [↩ Xem bài gốc] [✎ Sửa]  …  [✕ Loại] [🗑 Bỏ]
  · nút CHÍNH đổi theo trạng thái (nháp: Duyệt vào kho · draft: Đưa lên site ·
    approved: không nút chính — nhãn "ĐANG TRÊN SITE" + nút Gỡ nếu có đường);
  · trong cụm nguy hiểm: nhẹ trước nặng (Loại rồi mới Bỏ, Bỏ ngoài cùng phải);
  · mobile/hẹp: cụm nguy hiểm xuống hàng riêng, không bao giờ chen giữa.
  Wireframe vẽ đủ ma trận trạng-thái×nút từng ô.
- Hover/focus/disabled rõ; reduced-motion giữ.

## BƯỚC 2 — CODE (sau duyệt wireframe)

- Áp token màu + cụm nút theo SCR-20 cho: cửa sổ đọc (multiwindow) · cửa sổ
  nháp/kết quả (cctab) · card danh sách (badge).
- Đồng bộ với T03-119 (bộ nút đổi theo trạng thái) — hai task chạm cùng chỗ,
  làm CHUNG lượt hoặc nối tiếp, khai trong worklog.

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-20-nut-trang-thai.md   # MỚI — bước 1
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/cctab/src/cctab.inline.ts
  - web/styles/prototype.css                      # token trạng thái + cụm nút (đo trần trước)
  - 05_uiux/tokens.css                            # CHỈ nếu khai token màu mới
# vế cổng thuộc đơn vị test đi kèm (buttons.test.js + token-only mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-20 duyệt TRƯỚC mọi dòng mã bước 2; worklog mốc duyệt
  - AC1: badge trạng thái dùng token theo bảng SCR-20 — 0 hex trần trong khối
      mới; sáng/tối đều có giá trị
    cmd: node web/test/token-only.test.js
  - AC2: nút nguy hiểm (Loại · Bỏ) TÁCH cụm + kiểu riêng; nút CHÍNH đúng theo
      trạng thái bài (ma trận SCR-20 — đo markup từng trạng thái mock)
    cmd: node web/test/buttons.test.js
  - AC3: nhãn ngữ cảnh chân cửa sổ đúng 3 ca (nháp / kho-chưa-site / trên site)
    cmd: node web/test/buttons.test.js
  - AC4: suite web xanh + page-weight xanh
    cmd: cd web && npm test
