# WO-085 · `/chung-cat/` không nói việc thuộc BÀI NÀO, và không có trục thời gian

| | |
|---|---|
| **Loại** | bug UI + cải tiến · M03_web (chunk `chungcat`) |
| **Mức** | `hard` — người dùng THẤY |
| **Mở** | 2026-09-10, chủ dự án: *"có 1 vấn đề về logic: /chung-cat/ đang không phân loại theo bài. Ý tôi là tôi cần biết bài chưng cất, transcript đó thuộc bài gốc nào? và có filter theo thời gian nữa (như các màn bài viết)"* |

## Vì sao là MỘT đơn vị việc, không phải hai

Hai yêu cầu, nhưng cùng **một màn, một lượt vẽ, một hàm** (`ccNap` →
`ccThe`). Tách đôi thì WO thứ hai viết lại đúng đoạn WO thứ nhất vừa viết.
Luật tách của `go` nhắm việc KHÔNG liên quan (*"sửa bug X, tiện thêm nút Y"*);
đây là một câu hỏi duy nhất: **danh sách này tổ chức thế nào**.

AC vẫn tách bạch hai nhóm để quy trách nhiệm được.

## Repro

Ảnh chụp 2026-09-10, `/chung-cat/` với 25 việc:

- **Năm thẻ đầu tiên** đều là `video/mo-mang-tam-mat-sau-khi-xem-chi-lauren-xai-ai`
  (1 `sinh-thumbnail` + 4 `TRANSCRIPT`) nhưng nằm rải, không gộp — người phải
  tự đọc slug từng thẻ để biết chúng cùng một bài.
- Slug hiển thị bị **cắt cụt**: `video/doanh-nghiep-mot-nguoi-tai-viet-nam-dang-va…`
  Đó là khoá kỹ thuật, không phải tên bài. Tiêu đề thật
  (*"Doanh nghiệp một người tại Việt Nam đang vận hành như thế nào?"*) không
  xuất hiện ở đâu trên màn này.
- **Không một điều khiển thời gian nào**: không sắp mới/cũ, không lọc khoảng.
  Màn bài viết có `SAP` (mới/cũ); màn này không có gì.

## Đo — dữ liệu ĐÃ CÓ, thiếu chỗ trình bày

| Cần | Có sẵn ở đâu | Thiếu gì |
|---|---|---|
| bài gốc | `payload.slug` của mỗi việc | không gộp, không đọc được |
| tiêu đề bài | `/static/open-index.json` → `bans[].title` | chunk `chungcat` chưa tra |
| thời điểm | `tao_luc` (thêm ở `WO-081`) | không ai dùng để sắp/lọc |

⇒ **Không đổi API, không đổi cửa `THỢ`.** Cả ba thứ đã tới FE rồi.

Chỉ mục `open-index.json` đã được `multiwindow` nạp và cache vào `BAI`
(`:353`). Chunk `chungcat` **không** được tự `fetch` bản thứ hai — một chỉ mục
tải hai lần là hai bản sẽ lệch, và `chunk-tu-chua` đã canh đúng lớp đó. Đi qua
cầu `__GN_MW__`.

## Kỳ vọng

### A · Nhóm theo bài gốc (chủ dự án chọn: *"tiêu đề làm đầu nhóm"*)

- Mỗi bài gốc là MỘT khối; **tiêu đề thật** làm dòng đầu, không phải slug.
- Mọi việc của bài ấy (chưng cất · transcript · thumbnail) nằm trong khối đó.
- Tiêu đề tra không ra ⇒ **lùi về slug**, không để trống và không giấu khối.
  Một việc trỏ tới bản ghi đã xoá vẫn phải nhìn thấy được.

### B · Trục thời gian (chủ dự án chọn: *"cả hai"*)

- Nút sắp **mới nhất / cũ nhất**, cùng lối `SAP` của màn bài viết.
- Chip lọc khoảng: **hôm nay · 7 ngày · 30 ngày · tất cả**, đọc `tao_luc`.
- Sắp theo bài: nhóm xếp theo việc MỚI NHẤT trong nhóm — không theo tên bài.
  Một bài vừa chạy xong phải lên đầu.

### C · Không được phá thứ đang đúng

- Tổng kết (`25 việc · đang chạy 0 · chờ 0 · xong 24`) vẫn nói về **cả hàng
  đợi**, không tính lại trên tập đã lọc — đó là `WO-015/BUG-2`, đã trả giá một
  lần.
- Trần hiển thị của `WO-082` (`capNhin`) vẫn áp.
- Ba tab `Hàng việc · Kết quả · Thùng rác` giữ nguyên.

## Ngoài phạm vi

- Màn `/chung-cat/` **Kết quả** và **Thùng rác** — WO này chỉ đụng `Hàng việc`.
- Lọc theo model / theo loại việc — chưa ai xin.
