# WO-012 — UI: ba màn loại nghèo, panel không kéo đáy, bốn chỗ nói sai

loại: cải tiến + bug hiển thị
module: **M03_web** (shell · trang.mjs · prototype.css) · M10_tailieu · M11_video
mức: người dùng THẤY được — *"tôi thấy chưa đẹp và khoa học đâu"* (2026-08-28)

## Repro

Chạy `npm run api`, mở `http://127.0.0.1:<cổng>/bai-viet/` và `/tai-lieu/` và
`/tai-lieu/nap/` ở khung 1600×1000. Kho thật có **1 bài**, 0 tài liệu, 0 video.

## Sáu điều đo được trên ảnh chụp

**1 · Ba màn loại nghèo hơn hẳn màn Tổng hợp.** Chúng chỉ có `<h2>` + ô đếm +
lưới. Màn Tổng hợp có sidebar lọc + ba nút sắp xếp + dải phân bố ưu tiên. Bấm từ
Tổng hợp sang Bài viết là tụt hẳn một bậc — tôi dựng ba màn đó ở C5 với "cùng một
khuôn", nhưng khuôn tôi chọn là khuôn tối giản nhất.

**2 · Panel không kéo tới đáy.** Panel cao theo nội dung, nên với 1 bài nó chiếm
~250/1000px và ảnh nền lộ **65-70%** chiều cao. Tờ báo đọc ra như một thanh nổi
trên ảnh du lịch. Độ dài nội dung đang quyết định bức ảnh lộ bao nhiêu.

**3 · Trạng thái rỗng nhét vào MỘT Ô LƯỚI.** "Chưa có tài liệu nào trong kho."
nằm trong cột đầu của `.grid` (~240px) nên nó xuống dòng giữa câu và lệch trái.

**4 · Nút header sai module.** `+ VIẾT BÀI` (đỏ đậm) đứng trên **mọi** màn, kể cả
`/tai-lieu/` và `/video/`. Đúng thứ người dùng vừa nhắc: *"ko gộp chung các màn
và tính năng"*.

**5 · Số đếm header là số CẢ KHO.** Trên màn Tài liệu (0 tài liệu) header vẫn nói
"1 bài · 1 bản ghi". Cùng lớp lỗi BUG-2 `#acount`: một con số đúng, đặt sai chỗ.

**6 · Màn nạp tài liệu nói kiến trúc và đảo thứ bậc nút.** Dải "LỐI NẠP 1 · LỚP
CỔNG 6 · MB TỐI ĐA 25" — "lớp cổng" là từ vựng nội bộ, và tôi vừa thêm nó ở C6a.
Nút `GHI VÀO KHO` (hành động chính của màn) là nút ghost viền mờ, trong khi
`+ VIẾT BÀI` ở header thì đỏ đậm — thứ bậc ngược.

## Kỳ vọng (người dùng chốt qua AskUserQuestion 2026-08-28)

- ba màn loại **đầy đủ như màn Tổng hợp**: sidebar lọc + sắp xếp + dải số đếm
  riêng của loại đó
- **panel kéo tới đáy màn hình**; ảnh nền chỉ còn thấy ở viền
- bốn chỗ ở mục 4-6: sửa không cần hỏi

## Ràng buộc đã đo

`gn.css` **92/100 KB** — còn 8 KB. Dùng LẠI `.fw`/`.fl`/`.sortb`/`.mb`/`.grid`
của màn Tổng hợp thay vì đặt class mới; markup mới thì gần như 0 CSS mới.
Trang lớn nhất 55/74 KB. `chu-giao-dien` giới hạn chữ phụ trợ ≤ 480 ký tự/trang.
