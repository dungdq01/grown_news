# M11_video — rules

> Ngữ pháp bốn field. Tầng dưới **chỉ thêm ràng buộc, không nới** R1–R6, BRD, hay
> M09 (whitelist host + click-to-load).

```yaml
- id: M11-R1
  vi_phạm: >
    Màn `/video/` hoặc màn nạp của nó đọc/ghi bảng `bai_viet` hay `tai_lieu`;
    hoặc danh sách của màn hiện một bản ghi không phải `video`.
  bề_mặt: S3          # web/test/man-video.test.js
  lệnh: cd web && node test/man-video.test.js
  đỏ_khi: gieo 3 bài viết + 2 tài liệu + 2 video — màn hiện nhiều hơn 2 bản ghi
  xanh_khi: cùng dữ liệu, màn hiện đúng 2, và Kho/Tổng hợp hiện cả 7
  why: >
    Cùng lý do M10-R1: người dùng nói hai lần *"ko gộp chung các màn và tính năng
    lại với nhau"*. Đo bằng SỐ ĐẾM chứ không bằng lời khai, vì một màn "gần như
    chỉ có video" là màn sẽ trôi về gộp. Ngoại lệ duy nhất: Kho và Tổng hợp, và
    chúng đọc VIEW `ban_ghi`.

- id: M11-R2
  vi_phạm: >
    Mở màn `/video/` sinh ra một request tới host ngoài; hoặc một `<iframe>` có
    `src` trỏ host video tồn tại trong DOM trước khi người đọc bấm.
  bề_mặt: S3          # web/test/man-video.test.js + web/test/no-leak.test.js
  lệnh: cd web && node test/man-video.test.js
  đỏ_khi: hàm dựng thẻ video chứa `.nhung` hoặc một hằng host — dù qua một biến
  xanh_khi: chỉ có nút `data-act`; `src` dựng trong nhánh xử lý cú bấm
  why: >
    Nhúng video là LẦN ĐẦU sản phẩm gọi ra mạng ngoài, và nó chỏi thế trận đã
    khai: bind 127.0.0.1 (`server.mjs:348`), `analytics: provider: null` ghim bằng
    `no-dangerous-html.test.js:23-27`, và `no-leak.test.js`. Người dùng ký cho
    egress này — nhưng ký cho HAI host, không ký cho "mọi lần mở trang".
    Màn `/video/` là chỗ luật này chịu áp lực lớn nhất: một danh sách 50 video mà
    tự nhúng hết là 50 request ra ngoài trong một cú mở trang.
    Đo bằng CÁCH DỰNG, không bằng số request: kiểm hai chiều ở B8b đã chứng minh
    phép kiểm "không chứa hằng host" xanh oan khi host đi qua một biến — nên luật
    cấm cả `.nhung` (truy cập thuộc tính) trong thân hàm dựng.

- id: M11-R3
  vi_phạm: >
    `url_normalized` nhận từ client; hoặc form nạp ghi được một URL có host ngoài
    whitelist mà không báo lỗi TẠI CHỖ DÁN.
  bề_mặt: S3          # web/test/man-video.test.js
  lệnh: cd web && node test/man-video.test.js
  đỏ_khi: dán một URL vimeo — form vẫn cho bấm Ghi, hoặc chỉ báo lỗi sau khi POST
  xanh_khi: báo ngay khi dán; `url_normalized` do `normalize_url()` sinh
  why: >
    Hai việc, một rule, vì chúng cùng gốc: **danh tính của video do máy quyết**.
    `url_normalized` là khoá gộp theo nguồn (M03-R5) — nhận từ client là để client
    quyết hai video có phải một hay không, và một lần đổi tên tài khoản là hệ số
    kiểm chứng chéo bị thổi.
    Còn "báo tại chỗ dán" là bài học đã đo ở B5: `413` không tới được client giữa
    lúc upload, nên tài liệu phải kiểm `file.size` ở FE. Video cùng hình dạng —
    một `422` sau khi điền xong ba ô là một `422` người dùng đọc thành "mạng lỗi".
```
