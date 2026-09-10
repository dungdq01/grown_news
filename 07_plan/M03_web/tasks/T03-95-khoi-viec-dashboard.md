# T03-95 — khối việc RÚT GỌN trên Dashboard + badge rail

> **Ràng buộc chung đợt UI M12** (từ ma trận + bài học T03-90):
> nút/màn vào `man-hinh.json` CÙNG LƯỢT với lần dựng — không trước; token-only,
> KHÔNG hex; gn.css chỉ còn **39 byte** dư (ĐO 2026-09-03: 102361/102400 —
> `node web/test/page-weight.test.js`; con số ~150B trong bản PM đã cũ, T08-20
> phải viết sát lần BA để lấy lại 261 byte). 39 byte nghĩa là **luật CSS kế
> tiếp nào cũng vượt trần** — ba màn của đợt này KHÔNG thể thêm CSS mà không
> mở đơn vị giảm-béo TRƯỚC. Chỗ béo đã đo: 8 luật `.tb[data-nav]::before` lặp
> ~960 byte boilerplate SVG (ô nợ M03); chữ hiện ra qua cổng chu-giao-dien
> (không mã nội bộ, không đường kho, thử cụm từ trước khi chốt nhãn); hai shell
> byte-identical; animation một nhịp có chốt reduced; mock đối chiếu:
> `05_uiux/prototype/dot-hai/` — prototype thắng khi lệch.

**Là gì**: port khối trong `dot-hai/dashboard.html` — 3 con số (đang chạy ·
cần xử lý · xong hôm nay) + MỘT link mở /chung-cat/ (T03-97). Badge đếm cần-xử-lý trên đúng
MỘT mục nav (Chưng cất — T03-97) — `data-mount` + luật `:empty{display:none}` sẵn có
(khuôn badge Kho FR-027g), 0 nhánh điều kiện.

# QUYẾT PM 2026-09-04 (chủ dự án gật, lối a): trang chủ chỉ còn ~9 byte dư ⇒
# JS của khối này KHÔNG vào bundle chung — đi theo khuôn CHUNK T03-102
# (`gn-<màn>.js`, chỉ trang chủ phát thẻ script). gn.css hiện 91380/102400
# (dư 11KB sau T03-99) — CSS không kẹt, chỉ HTML trang chủ + gn.js kẹt.
# Markup khối giữ TỐI THIỂU: 3 số + 1 link, badge :empty như đã khai.
# ⛔ ĐO 2026-09-04 · HAI TIỀN ĐỀ CỦA QUYẾT (a) KHÔNG ĐÚNG — đơn vị này CHẶN
#
# Quyết PM viết: *"gn.css hiện 91380/102400 (dư 11KB sau T03-99) — CSS không
# kẹt, chỉ HTML trang chủ + gn.js kẹt"*. Đo bằng máy:
#
#   1 · `T03-99` CHƯA CHẠY lúc PM viết câu đó — 8 luật `.tb[data-nav]::before`
#       còn nguyên, `gn.css` = **102391/102400 (dư 9 byte)**, không 91380.
#       ⇒ Lượt này ĐÃ CHẠY T03-99 (phép BỎ boilerplate SVG): 102038, dư 362.
#
#   2 · Lối (a) — chunk theo màn — **KHÔNG lọt cho trang chủ**:
#         thẻ `<script>` chunk thêm vào HTML trang chủ  = +48 byte, dư **9**
#         chunk cộng vào TỔNG tải đầu của `/`           = +8010 byte, dư **326**
#       (tổng của `/` là 265914/266240 trước khi thêm gì.)
#
#   3 · Lối còn lại — vào bundle chung — thiếu **59 byte**: khối dựng xong tốn
#       ~1512 byte trong `gn.js`, mà `gn.js` dư **1453**. Đã thử gọt: bỏ thẻ bọc
#       `display:contents` (-5), đưa nút link ra ngoài `.kpi` (-5), bỏ `esc2()`
#       trên nhãn hằng (-9 vì nhãn mới dài hơn). **Không hội tụ** — và gọt tiếp
#       là gọt tính năng, không gọt phí.
#
# ⇒ Mã đã viết xong và ĐÃ HOÀN NGUYÊN để suite không đỏ; bản nguồn 3595 byte
#   giữ ở thư mục tạm của phiên. Cổng viết-trước đỗ tại
#   `07_plan/M03_web/tasks/T03-95-chung-cat-quan-ly.test.js` (ĐỎ 7 lỗi, đúng
#   lý do "chưa có hàm" — bằng chứng đỏ-trước theo `rule.md` mục 8).
#
# QUYẾT PM 2026-09-04 01:5x — chọn (i): mở T03-104-giam-beo-gn-js (chunk JS ba
# màn nap theo T03-102, mục tiêu ≥2000B) → khối này vào BUNDLE CHUNG (hết thiếu
# 59B), không thẻ script mới trên trang chủ. (ii) bị loại vì cắt AC1; (iii) bị
# FR-027f cấm. T03-95 CHẶN CỨNG sau T03-104. Bản nguồn 3595B ở thư mục tạm của
# dev dùng lại được nguyên trạng.
# (Ba lối dev nêu, giữ làm sử:)
#   (i)  đơn vị GIẢM BÉO `gn.js` (khuôn T03-99 nhưng cho JS). Chỗ béo lớn nhất
#        đã thấy: JS của ba màn `nap` (form 14 trường) chỉ cần trên `/…/nap/`
#        — đúng ứng viên chunk theo T03-102.
#   (ii) thu phạm vi khối: bỏ nút link, chỉ ba số (~-120 byte) ⇒ lọt, nhưng
#        `AC1` đang đòi "ba số + MỘT link".
#   (iii) xem lại trần dẫn xuất của trang chủ (60KB HTML + 200KB asset). Đây là
#        nới trần — `FR-027f` nói "SIẾT, không nới", nên phải là quyết của người.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/plugins/chungcat/src/chungcat.inline.ts   # đếm từ GET /api/job, đổ badge — chunk theo màn (T03-102), KHÔNG vào multiwindow bundle chung
  # AS-BUILT (WL-01K9SK1T0395KHOI, PM chấp nhận 2026-09-04): mã nằm ở
  # multiwindow.inline.ts (bundle chung) — thẻ script chunk tốn +48B HTML trang
  # chủ mà nó chỉ dư 11B; T03-104 dọn 3466B trong gn.js làm bundle chung lọt.
  # Quyết (a) đúng hướng dọn-chỗ, sai chỗ đặt cuối — số đo trong worklog.
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: khối chỉ TÓM TẮT + 1 link — không lặp bảng chi tiết của /chung-cat/ (đo:
      không có hàng job nào trong khối)
    cmd: node web/test/chung-cat-quan-ly.test.js
  - AC2: 0 việc cần-xử-lý ⇒ badge TỰ biến mất (luật :empty, không if)
    cmd: node web/test/chung-cat-quan-ly.test.js
  - AC3: suite web xanh (kể cả trang-chu-layout, page-weight trang chủ)
    cmd: cd web && npm run build && npm test
