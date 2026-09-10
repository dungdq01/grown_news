# T03-96 — đơn vị TEST FE đợt hai (R1: chỉ đơn vị này chạm web/test mới)

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

**Là gì**: sở hữu ba file cổng FE mới của đợt UI M12. Viết TRƯỚC các đơn vị
code (R5 — đỏ đúng lý do "chưa có màn/nút", không phải lỗi cú pháp; phân biệt
thiếu-mã với thiếu-route). Đo MARKUP + HÀNH VI, không đo ý định — khuôn
hien-that.test.js.

phạm_vi_ghi:
  - web/test/chung-cat-ui.test.js
  - web/test/chung-cat-quan-ly.test.js
  - web/test/chung-cat-nhap.test.js

# ⚠️ HAI ĐIỀU về `chung-cat-ui.test.js`, đo 2026-09-03 — đọc TRƯỚC khi viết:
#
# 1 · FILE ĐÃ CÓ, và nó đang đỗ ngoài `web/test/`:
#     `07_plan/M03_web/tasks/T03-92-cong-chua-dung.test.js`
#     Lý do dời: `nut-song.test.js` đòi *"mọi file test đều được `npm test`
#     gọi"*, còn `R5` đòi cổng tồn tại ĐỎ TRƯỚC code ⇒ một cổng đỏ-trước nằm
#     trong `web/test/` làm suite đỏ, không nằm trong đó thì cổng "mọi file
#     test" đỏ. **Không nước đi nào xanh** — hai luật của dự án chỏi nhau
#     (ô nợ M08, PM quyết luật nào nhường; T08-17b vướng đúng chỗ này).
#     ⇒ Đơn vị này dời file VÀO `web/test/` **cùng lượt** với mã của T03-92 và
#       đăng ký vào `web/package.json` — ba việc một lần, hoặc suite đỏ.
#
# 2 · CỔNG ĐANG ĐO SAI HỢP ĐỒNG. §5 "Fact 2" của nó đòi mã FE gửi `X-Khoa-Loi`
#     + `X-Nguoi-Dung`. Sau T08-20 điều đó là **thứ phải CẤM**: khoá dịch vụ ở
#     env SERVER, trình duyệt gọi `/api/model` + `/api/job` của `web` và không
#     bao giờ cầm khoá (mở DevTools là thấy). Cổng viết trước khi cửa proxy tồn
#     tại nên nó đóng băng thiết kế cũ.
#     ⇒ Đổi hai phép đo header thành phép PHỦ ĐỊNH: *"mã FE KHÔNG chứa chuỗi
#       `x-khoa-loi`"*. Lần này nó đo được — tính năng gửi request đã tồn tại,
#       nên phủ định không còn xanh-vô-căn-cứ (xem `okPhuDinh()` trong file).

verifiability: hard
tiêu_chí:
  - AC1: ba cổng chạy được ngay, tự khai ĐỎ_KHI/XANH_KHI; đỏ vì màn chưa dựng
      phải NÓI đúng điều đó
    cmd: node web/test/chung-cat-quan-ly.test.js
  - AC2: mỗi cổng có vế CHỐNG-ĐỎ-OAN (ví dụ: bản phan-tich không nút chưng cất
      là XANH, không phải "thiếu nút")
    cmd: node web/test/chung-cat-ui.test.js
  - AC3: cổng KHÔNG assert mã HTTP cụ thể cho ca ULID-trùng (chưa có FR chốt
      201/200/409) — assert lớp 2xx + hành-vi-UI; kèm ca 403 khi thiếu header
    cmd: node web/test/chung-cat-ui.test.js
