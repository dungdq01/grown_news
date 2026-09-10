# T03-32 — WO-012: ba màn loại đầy đủ · panel kéo đáy · bốn chỗ nói sai (đơn vị CODE)

> Người dùng: *"tôi thấy chưa đẹp và khoa học đâu"*, rồi chốt hai hướng qua
> AskUserQuestion: **ba màn loại đầy đủ như màn Tổng hợp** · **panel kéo tới đáy**.
>
> **DÙNG LẠI class của màn Tổng hợp, không đặt class mới.** `gn.css` đang
> **92/100 KB** — còn 8 KB. `.fw` (hai cột) · `.fl` (sidebar lọc) · `.sortb` (ba
> nút sắp) · `.mb` (dải) · `.grid` đều đã có luật; markup mới thì CSS mới gần 0.
> Đặt class mới cho việc đã có class là cách hết 8 KB đó trong một lượt.
>
> Sáu việc:
>
> 1 · ba màn loại: sidebar lọc + sắp xếp + dải số đếm **của loại đó** — `bangLoc()`
>     và `daiMay()` đã là hàm dùng chung, gọi lại với tập đã lọc.
> 2 · panel kéo đáy: `min-height` trên `.mid`, KHÔNG trên `.view` — `.view` bị
>     `display:none` khi không mở nên `min-height` ở đó vô nghĩa.
> 3 · trạng thái rỗng trải CẢ bề ngang: `.empty` hiện đang là con của `.grid` nên
>     nó ăn một cột 240px. Đưa ra ngoài lưới.
> 4 · nút header đổi theo màn: `/tai-lieu/` ⇒ "+ Nạp tài liệu", `/video/` ⇒
>     "+ Đăng ký video". Đích đọc từ `man-hinh.json`, không gõ ba đường.
> 5 · số đếm header theo MÀN đang mở, không theo cả kho.
> 6 · bỏ dải "LỚP CỔNG" ở màn nạp tài liệu (`chu-giao-dien` cấm màn nói kiến
>     trúc — và chính tôi thêm nó ở C6a); `GHI VÀO KHO` thành nút chính.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: mỗi màn loại có sidebar lọc + ba nút sắp + một dải, và dải nói số của
      ĐÚNG loại đó (không phải số cả kho)
    cmd: cd web && node test/ui-ba-man.test.js
  - AC2: panel cao tới đáy khung — `.mid` có `min-height` theo viewport; ảnh nền
      không còn chiếm quá nửa chiều cao khi kho 1 bài
    cmd: cd web && node test/ui-ba-man.test.js
  - AC3: trạng thái rỗng KHÔNG nằm trong `.grid`
    cmd: cd web && node test/ui-ba-man.test.js
  - AC4: nút header + số đếm header đổi theo màn; trên `/tai-lieu/` không có nút
      nào nói "viết bài"
    cmd: cd web && node test/ui-ba-man.test.js
  - AC5: màn nạp tài liệu KHÔNG còn chữ "lớp cổng"; nút ghi là nút CHÍNH
    cmd: cd web && node test/ui-ba-man.test.js && node test/chu-giao-dien.test.js
  - AC6: ngân sách — gn.css ≤ 100 KB, trang lớn nhất ≤ 74 KB; hai shell
      byte-identical
    cmd: cd web && node build-fe.mjs && node test/page-weight.test.js && node test/four-screens.test.js
  - AC7: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T03-31
