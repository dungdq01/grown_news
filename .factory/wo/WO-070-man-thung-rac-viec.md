# WO-070 — thùng rác VIỆC có API mà không có chỗ bấm

loại: cải tiến (task A của `PLAN-2026-09-09`)
module: M03_web (màn) · M08_api (proxy) · M12_chungcat (cửa xoá)
mức: hard
người báo: chủ dự án 2026-09-09 — *"hiện tại chưa có màn thùng rác thật, mới có tổng hợp thùng rác ở kho thôi"*

## Hiện trạng

`WO-068` dựng ngăn `rac/` + `GET /api/job?rac=1`; `WO-067` dựng
`POST /api/viec/<id>/lai`. **Không màn nào đọc chúng.** `/kho/` là thùng rác của
**bài viết** (`_recycle/`), một thứ khác hẳn.

⇒ Việc hỏng vào rác rồi **biến mất khỏi mọi màn** — tệ hơn lúc nó hiện sai
trạng thái, vì giờ người dùng không có đường nào tới nút "chạy lại" mà chính
tôi vừa dựng.

## Kỳ vọng

- màn `/chung-cat/` thêm **tab thứ ba** *Thùng rác* (đã có sẵn cơ chế hai tab
  `viec`/`ketqua` + `ccDoiTab` — không dựng màn mới: một màn mới cần một dòng
  `man-hinh.json` + markup trong shell, mà shell đi theo MỌI trang và trần HTML
  trang chủ đang âm)
- mỗi dòng nói: chặng hỏng · lý do · số lần gửi
- hai nút: **↻ Chạy lại** (đường `WO-067`) · **🗑 Xoá hẳn** (cửa mới)
- badge đếm trên nhãn tab — thùng rác rỗng thì tab vẫn còn, nhưng nói "trống"

## Cửa mới: `DELETE /viec/<ulid>`

Chỉ xoá việc **đang ở `rac/`** — xoá một việc đang chạy là cướp chỗ ghi kết quả
của worker. Sổ `egress.*.jsonl` **không đụng tới**: vết tiền sống độc lập với
file việc, nên câu *"đã tiêu bao nhiêu"* vẫn trả lời được sau khi xoá (cùng lý
lẽ `don_viec_cu` đã dùng).

## Lỗ nhỏ phát hiện lúc đọc mã

`nhomLoc()` (bộ lọc màn `/chung-cat/`) không có nhánh `hong` ⇒ nó rơi về `"cho"`.
Hôm nay vô hại vì việc `hong` nằm trong `rac/` và `GET /api/job` không kể rác —
nhưng đó là *vô hại do hoàn cảnh*, không do thiết kế. Thêm nhánh tường minh.

## Cổng

`web/test/thung-rac-viec.test.js` — dựng server thật, đẩy một việc vào rác qua
`danh_hong`, rồi đo cả ba đường (liệt kê · chạy lại · xoá hẳn) + markup FE.
