# M09_thuvien — rules

> Ngữ pháp bốn field, giống rule khung. Tầng dưới **chỉ thêm ràng buộc, không nới**
> R1–R6 hay BRD.

```yaml
- id: M09-R1
  vi_phạm: >
    Luật MỒ CÔI của exporter tính tập tham chiếu từ ÍT HƠN ba bảng
    (articles + article_versions + recycle); hoặc dung_lai_db.py gặp một .md khai
    media.sha256 mà thiếu byte và vẫn dựng tiếp thay vì exit khác 0.
  bề_mặt: S3          # core/tests/check_media_dan_xuat.py
  lệnh: python core/tests/check_media_dan_xuat.py
  đỏ_khi: fixture — bản ghi bị xoá (chỉ recycle còn trỏ) rồi export, byte phải CÒN
  xanh_khi: fixture — bỏ tham chiếu cuối rồi export, byte phải BỊ reap
  why: >
    Bỏ sót `recycle` thì MỖI DELETE phá byte vĩnh viễn, và `phucHoi()` sau đó vẫn
    báo THÀNH CÔNG — nó chạy lại validate, mà validate không bao giờ thấy blob.
    Mất dữ liệu im lặng với bộ test xanh. Đây là rule nguy hiểm nhất của module.
    Lớp lỗi đã đo: WL-01K9N2FR036A56 — `dung_lai_db.py` dựng DB từ ĐĨA, nên một
    file đã mất khỏi đĩa thành một dòng DB mất không tiếng nào.

- id: M09-R2
  vi_phạm: >
    sha256 hoặc so_byte của hiện vật được nhận TỪ CLIENT thay vì máy tự tính; hoặc
    content-type suy ra từ phần mở rộng tên file thay vì đọc từ enum đóng; hoặc byte
    được nhận mà không kiểm magic-byte khớp mime khai.
  bề_mặt: S3          # web/test/thu-vien.test.js + web/test/media-dau-de.test.js
  lệnh: cd web && node test/thu-vien.test.js
  đỏ_khi: gửi media.sha256 bịa (không có trong bảng media) — cửa ghi phải từ chối
  xanh_khi: gửi sha256 do POST /api/articles/media trả về — phải nhận
  why: >
    Tên file là dữ liệu của người gửi. Tin nó để chọn content-type là mở đường cho
    một file HTML-có-script dán nhãn `application/pdf` chạy SAME-ORIGIN khi được
    phục vụ lại. Năm lớp hardening của intake (server.mjs:19-25) không lớp nào soi
    BYTE, nên magic-byte là lớp thứ sáu và nó không có chỗ khác để đứng.
    sha256 do máy tính cũng là thứ làm đường dẫn không thể traversal ĐƯỢC — khoá
    lưu trữ không bao giờ đến từ client.

- id: M09-R3
  vi_phạm: >
    `src` của iframe nhúng video được dựng từ `fm.url` (hoặc bất kỳ trường
    frontmatter) thay vì từ whitelist host + regex id; hoặc video được nhúng NGAY
    khi mở trang thay vì chờ người dùng bấm.
  bề_mặt: S3          # web/test/media-cua-so.test.js
  lệnh: cd web && node test/media-cua-so.test.js
  đỏ_khi: bundle chứa một iframe src nội suy từ `fm.url`
  xanh_khi: src dựng từ hằng host + id khớp `[A-Za-z0-9_-]{5,24}`
  why: >
    Nhúng video là LẦN ĐẦU sản phẩm gọi ra mạng ngoài, và nó chỏi thế trận đã khai:
    bind 127.0.0.1 (server.mjs:348), `analytics: provider: null` được ghim bằng
    no-dangerous-html.test.js:23-27, và no-leak.test.js. Người dùng đã ký cho egress
    này, nhưng ký cho HAI host cụ thể — không ký cho "bất cứ URL nào trong
    frontmatter". `fm.url` là dữ liệu; dựng src từ dữ liệu là để người nạp bài chọn
    máy chủ mà trình duyệt người đọc sẽ gọi.

- id: M09-R4
  vi_phạm: >
    Bản ghi hồ sơ `thu-vien` được đếm vào một thước đo CHẤT LƯỢNG (priority,
    credibility, tỉ lệ duyệt/loại) mà pane đó không khai rõ nền của nó.
  bề_mặt: S3          # web/test/thu-vien-tong-hop.test.js
  lệnh: cd web && node test/thu-vien-tong-hop.test.js
  đỏ_khi: gieo 4 bản thư viện, một pane chất lượng đổi số so với khi chỉ có phân tích
  xanh_khi: pane số ĐẾM đổi (đúng ý "tổng hợp All"), pane CHẤT LƯỢNG không đổi
  why: >
    `priority` sinh từ `fm.skill_candidates` (data.mjs:219) nên tài liệu luôn 0;
    `credibility_max` mô tả một bản phân tích chứ không mô tả một file PDF. 50 PDF
    sẽ đẩy histogram ưu tiên về ~100% "thấp" và làm phẳng cột duyệt/chờ/loại —
    dashboard TỆ HƠN TRƯỚC trong khi mọi con số vẫn "đúng". Người dùng đòi tổng hợp
    SỐ ĐẾM; suy ra họ cũng đòi trộn thước đo chất lượng là suy diễn quá tay.

- id: M09-R5
  vi_phạm: >
    Trần body JSON (`TRAN` = 1 MB trong dungchung.mjs) bị nới để chứa hiện vật;
    hoặc hiện vật đi qua đường JSON dưới dạng base64.
  bề_mặt: S3          # web/test/api-guard.test.js
  lệnh: cd web && node test/api-guard.test.js
  đỏ_khi: dungchung.mjs khai TRAN lớn hơn 1 MB
  xanh_khi: TRAN giữ 1 MB, TRAN_MEDIA là hằng số RIÊNG
  why: >
    `TRAN` là chặn bù của MỌI lần ghi bài (FR-010), không phải của riêng đường
    media. Nới nó để chứa một PDF là nới cả cửa kia. base64 còn phồng 33% và nhân
    đôi đỉnh RAM. Hai trần riêng là cách giữ một cửa ghi mà không hạ một lớp chặn.
```
