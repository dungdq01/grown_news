# T03-94 — màn HÀNG ĐỢI NHÁP tại `/chung-cat/nhap/` (FR-046 · theo T03-97/rule 5: nằm DƯỚI url module, khuôn /bai-viet/nap/, menu=false, vào từ /chung-cat/ + badge)

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
> ⚠️ nhãn màn: thử cổng chu-giao-dien TRƯỚC khi chốt chữ (cụm "chờ duyệt" bị
> cấm từ FR-033; "Hàng đợi nháp" là ứng viên an toàn — đo rồi mới chốt).

**Là gì**: port `dot-hai/hang-doi-duyet.html`. Hai cột kiểu triage: list nháp
(badge nhap · đã sửa · trả lại · đã vào kho) + panel xem: X/Y địa chỉ đối
chiếu, "⚠ đã tỉa N (+lý do)", nội dung bản hiện tại, nút **"khác gì bản AI?"**
→ diff del/ins với `ban_goc_ai` (bất biến trong DB), 4 hành động: Duyệt-vào-kho
(validate --strict pass mới ghi FILE — toast "file giờ là chân lý") · Sửa ·
Trả lại (bắt lý do) · Xoá. Dữ liệu: cửa LÕI T08-19 (bảng nháp DB web/).

phạm_vi_ghi:
  - core/assets/man-hinh.json              # +màn /chung-cat/nhap/ CÙNG LƯỢT (menu=false, cat_khi_khac) — đất FR-056 ĐÃ DUYỆT
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css

# ✅ HẾT CHẶN 2026-09-04 — `T08-22` đã mở NĂM cửa (`web/api/nhap-cua.mjs`):
#   GET  /api/nhap-chung-cat          danh sách (KHÔNG cõng hai bản toàn văn)
#   GET  /api/nhap-chung-cat/<ulid>   CẢ HAI bản trong MỘT lời gọi → diff
#   POST …/sua · …/tra-lai (bắt `ly_do` ≥5) · …/duyet (validate rồi mới ghi)
# `T08-27` thêm `khang_dinh_bi_tia` + `ly_do` vào DDL cho đúng `FR-046 §1`.
#
# ⛔ CÒN MỘT hành động CHƯA CÓ CỬA: **Xoá**. `FR-046 §1` không khai trạng thái
# nào nghĩa "đã bỏ", nên `T08-22` cố ý dừng ở ba hành động — ô nợ M08 ghi hai
# lối, chờ NGƯỜI. Màn này dựng BA nút, không bốn.
#
# ⚠️ NGÂN SÁCH — đo 2026-09-04, quyết hình dạng màn:
#   trang chủ HTML  dư   10 byte ⇒ shell chỉ được thêm MỘT mốc rỗng
#   gn.css          dư  362 byte ⇒ 0 luật CSS mới
#   gn.js           dư 2535 byte ⇒ JS của màn KHÔNG vào bundle chung
#   ⇒ Màn dùng LẠI chunk `chungcat` (khuôn T03-102): nó là màn DƯỚI url module
#     chưng cất, nên chunk của module đó là chỗ đúng cả về byte lẫn về nghĩa.

phụ_thuộc: T03-97

# CHẶN CỨNG: chạy SAU T08-22 (nguồn dữ liệu) + T03-99 (gn.css hết chỗ).
verifiability: hard
tiêu_chí:
  - AC1: diff đọc từ ban_goc_ai vs ban_hien_tai; bản chưa sửa nói "trùng bản AI
      gốc" chứ không im
    cmd: node web/test/chung-cat-nhap.test.js
  - AC2: "đã tỉa N" hiện TRƯỚC nút duyệt khi khang_dinh_bi_tia có — không hiện
      là nói dối người duyệt (đo markup)
    cmd: node web/test/chung-cat-nhap.test.js
  - AC3: Duyệt → gọi đường validate-rồi-ghi có sẵn của LÕI; KHÔNG đường nào
      trên màn set review_status từ payload
    cmd: node web/test/chung-cat-nhap.test.js
  - AC4: Trả lại bắt kèm lý do; lý do hiện lại trên item
    cmd: node web/test/chung-cat-nhap.test.js
  - AC5: suite web xanh
    cmd: cd web && npm run build && npm test
