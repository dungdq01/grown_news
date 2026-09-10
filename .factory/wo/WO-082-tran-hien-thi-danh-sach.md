# WO-082 · Danh sách không có trần hiển thị — nhiều dữ liệu là tràn màn

| | |
|---|---|
| **Loại** | bug · UI toàn cục |
| **Module** | M03_web (FE chung: `multiwindow` + `chungcat`) |
| **Mức** | `hard` — người dùng THẤY được |
| **Mở** | 2026-09-09, chủ dự án: *"ko có cơ chế phân trang và limit size, nên khi dữ liệu nhiều là bị tràn màn - phải scroll xuống liên tục"* |

## Repro

1. Mở `/chung-cat/` với 23 việc trong hàng đợi.
2. Cả 23 thẻ vẽ một lượt; trang dài ~5 màn hình, footer và tổng kết trôi khỏi tầm.
3. Cùng hình ở `/` (`#grid2`) và ba màn loại — `trang.mjs:590` `tatCa.map(...)`
   **không** slice, khác hẳn `/tat-ca/` (`trangTatCa`, `NGUONG.moiTrang = 24`).

Đo được: `/video/` trả về `id="grid2"` với **30** thẻ `.cd`.

## Vì sao KHÔNG cắt ở SSR

Ba màn loại (`/video/`, `/tai-lieu/`, `/kho/`) **dùng chung một lưới** và lọc ở FE
bằng cách gắn class `.off` (`apLoc`, `multiwindow.inline.ts:1673`). Cắt 24 thẻ đầu
ở server nghĩa là: một bản ghi video xếp thứ 25 theo thứ tự chung sẽ **không tồn
tại** trên màn `/video/` — dù màn ấy chỉ có 4 video. Đó là mất dữ liệu trên màn,
không phải phân trang.

Nên trần phải đặt lên **cái NHÌN THẤY sau khi lọc**, và tính lại mỗi lần lọc.

## Kỳ vọng

- Mỗi lưới chỉ hiện tối đa `TRAN_NHIN` thẻ *chưa bị lọc*; phần dư ẩn.
- Dưới lưới có nút `xem thêm N · còn M`; bấm nới thêm một trần nữa.
- Đổi bộ lọc / tìm kiếm ⇒ trần tính lại trên tập MỚI, không giữ tập cũ.
- Số đếm bên nhãn (`acount`, `dem`) vẫn là **tổng sau lọc**, không phải số đang hiện —
  một tổng kết đổi theo trần hiển thị thì không phải tổng kết (cùng lý lẽ WO-015/BUG-2).
- Áp cho cả `#g-cc` của tab Chưng cất (23 việc), không chỉ `grid2`.

## Ngoài phạm vi

- `page-weight` đỏ do WO-055 — trần hiển thị không giảm byte, không đụng ô đó.
- Phân trang THẬT ở server cho `/tat-ca/` đã có; không sửa.
