# M16_artifact — ui flow

> **M16 KHÔNG CÓ giao diện** (`Z7`). Nhưng nó là module duy nhất mà **sản phẩm của
> nó LÀ một giao diện** — một file slide/audio/video mà người ta mở ngoài hệ thống.
>
> Ta không kiểm được nó bằng `markup-matches-css`. Ta chỉ quyết **cái gì nằm trong
> metadata của file đó**.

## 1 · Màn nào phục vụ M16

| màn | thao tác | ai sở hữu | M16 góp gì |
|---|---|---|---|
| cửa sổ đọc một bài `approved` | nút *"tạo slide / giọng đọc / video"* | M03_web | nhận job, trả `job_id` |
| dashboard | job đang chạy / xong / dừng | M03_web | trạng thái job |
| cửa sổ đọc | danh sách artifact đã sinh của bài | M03_web | liên kết ⚠️ **chưa lưu được** |

**Nút chỉ hiện trên bài `approved`.** Hiện nó trên bài `draft` là mời người dùng vào
một đường sẽ bị từ chối (`AC-2.1`) — cùng lớp lỗi với `#f-bai` luôn hiện khi API
chạy dù `hidden=true` (BUG-1, plan C8).

## 2 · Bốn thứ phải NÓI RA

**a · Job mất PHÚT, và phải nói ra là phút.** Không hiện spinner như một request 200
ms. Người dùng đóng tab rồi mở lại phải thấy job vẫn đang chạy — `job_id` bền, không
sống trong bộ nhớ tab.

**b · Đường TTS đã dùng: cloud hay local.** Đây **không** phải chi tiết kỹ thuật —
cloud nghĩa là **toàn văn bài đã rời khỏi máy** (bậc 4). Người dùng có quyền biết
trước khi bấm, và biết sau khi xong đã dùng đường nào.

**c · Giới hạn engine, TRƯỚC khi sinh.** Chọn *"slide"* mà muốn sửa chữ thì phải
được cảnh báo **trước**: PPTX của Marp là **ảnh**. Nói sau khi file đã gửi cho người
khác là quá muộn (`M16-R5`).

**d · Thất bại phải phân biệt được ba loại**: hết quota cloud · engine lỗi · bài
không đủ điều kiện. Ba lý do dẫn tới ba hành động khác nhau — gộp thành *"có lỗi
xảy ra"* là xoá đúng thông tin người dùng cần. Tiền lệ: *"Danh mục kết 'đang
tải...': ở đó phải NÓI RA khi tải thất bại"* (commit `0035fa3`).

## 3 · Artifact quay ngược làm input — phần UI của nguyên lý ⑤

| người dùng mở | bấm vào đâu | về đâu |
|---|---|---|
| PPTX | hyperlink trên shape | bài nguồn trong kho |
| PDF | `#page=N` | đúng trang |
| audio | chapter (ID3 CHAP) | mốc + bài nguồn |
| video | sidecar `timestamp → URL` | mốc + bài nguồn |

**Đây là chỗ M16 khác một công cụ xuất file.** Nếu người xem không quay lại được kho
thì artifact chỉ là một bản sao chết, và toàn bộ lý do M16 xếp trong đợt hai mất
nghĩa.

⚠️ Địa chỉ chỉ **bấm được thật** sau khi **C3** xong (bấm địa chỉ → mở nguồn). Tới
lúc đó, hyperlink trong PPTX trỏ vào một URL **chưa mở được đúng vị trí**. Ghi ra để
không ai đọc `AC-4.1` rồi tưởng vòng quay-ngược đã hoạt động.

## 4 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| bất kỳ HTML/CSS/JS trong `artifact/` | `Z7`; giao diện thuộc `web/` |
| thanh tiến độ theo % | không đo được thật; `giai_doan` đếm được, `%` là số bịa |
| xem trước trong trang | file mở bằng ứng dụng ngoài; nhúng preview là một tính năng khác |
| nút "sinh lại" ghi đè bản cũ | `M16-R1` — chỉ THÊM; bản mới là một hiện vật mới |
| nút "dọn artifact cũ" | không phải việc của M16 (`M16-R1`); công cụ riêng, và nó chỉ an toàn nhờ `la_dan_xuat` |
| chọn engine trên UI | `engine.json` là **bảng khai trong repo** — sửa bằng sửa file + review |

## 5 · Nợ

**Danh sách artifact của một bài chưa hiện được.** Bảng `media` có đúng ba cột
(`sha256`, `byte`, `la_dan_xuat`) — **không** có cột trỏ về `slug`. Nên câu *"bài này
đã có những artifact nào"* hiện **không trả lời được từ kho**; chỉ trả lời được bằng
cách đọc metadata trong từng file. Cần **FR tới M09**.

**`man-hinh.json` KHÔNG khai màn nào của M16 trước khi dựng** — bài học `S18`/C5.

**Nút chỉ được thêm vào shell cùng lúc với lần dựng đường API thật**, không trước:
một nút gọi một endpoint chưa có là một 500 trên đường người dùng.
