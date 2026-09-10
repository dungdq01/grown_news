# M09_thuvien — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.

## Mở

- [ ] **`§1` lập luận NGƯỢC với kiến trúc đã thi công — cần FR, không phải sửa chữ.**
  Cả mục 1 mang tiêu đề *"Vì sao MỘT bảng, không phải ba"* và bảo vệ nó bằng số
  đo thật (`khoDoc()` là cửa đọc duy nhất · ~40 chỗ `filter/reduce` ở
  `trang.mjs` · chuỗi `"articles"` không xuất hiện lần nào ở đó). **Lập luận đó
  đúng lúc viết.** Sau đó **FR-038 chốt ba bảng** và đã thi công:
  `kho.schema.sql` có `bai_viet` (:44) · `tai_lieu` (:70) · `video` (:94) + hai
  VIEW `ban_ghi`, `tham_chieu_media`.
  ⇒ Người đọc M09 hôm nay đọc một **lập luận chống lại thứ đang chạy**, kèm số đo
  để tin nó. **Nặng hơn** mọi phát hiện ở 10 module kia: chúng lệch một con số
  hoặc một tên; cái này lệch một **quyết định kiến trúc**.
  Hệ quả kỹ thuật: `AC-2.1.3` viết *"union **ba** bảng"*; tập tham chiếu thật là
  **năm** nhánh, và `check_media_dan_xuat.py` **xanh** ⇒ **AC lạc hậu hơn cổng
  của chính nó.**
  Và mã mang cùng vết lệch: `dungchung.mjs:637` nói *"union ba bảng"*, `:649` —
  tám dòng dưới — nói *"Năm nhánh… (FR-038)"*. Mã **làm** đúng năm; câu văn nói
  ba.
  · object: `06_modules/M09_thuvien/spec.md §1 §2.1` ·
  `web/api/dungchung.mjs:637` · `core/assets/kho.schema.sql:44,70,94,129,152`
  ⇒ **FR id** (spec FROZEN)

- [ ] **Nửa `AC-2.2.2` không có cổng.**
  Vế *"form nạp phải nói ra"* (link `vm.tiktok.com` chưa giải được offline) là
  **UI**, mà lệnh là `pytest -k tiktok` — Python **không đo được** form. Vế Python
  xanh; vế UI chưa ai đo. Cùng hình dạng với M10 `AC-2.2.2` và với `FR-051 §9`.
  Nặng hơn: hệ quả thật **không** ở form. Hai link rút gọn khác nhau trỏ cùng một
  video ⇒ hai `url_normalized` ⇒ **một video thành hai "nguồn độc lập"**, đúng
  thứ `url_normalized` sinh ra để chặn. Đó là chỗ phải nói ra, và AC không nói.
  · object: `06_modules/M09_thuvien/spec.md §2.2` ⇒ **FR id**

- [ ] **`AC-2.4.1` đếm BA builder `Ban`, thực tế BỐN.**
  AC đã tự sửa một lần (*"bản B0 nói hai; thực tế ba"*) và vẫn thiếu một:
  `theBai()` (`web/api/articles.mjs:20-32`) — builder **không** trả
  `ho_so`/`media`. `hai-ban-shape.test.js` canh hai bản ⇒ builder thứ tư **không
  ai canh**.
  Ba lần đếm sai cùng một thứ (2 → 3 → 4) ⇒ con số builder là thứ **phải dẫn
  xuất**, không phải thứ đếm tay.
  · object: `06_modules/M09_thuvien/spec.md §2.4` · `web/api/articles.mjs:20-32`
  ⇒ **FR id**

- [ ] **`sha256` của một blob CÓ THẬT NHƯNG KHÁC được nhận.**
  `docHienVat` (`dungchung.mjs:626-631`) kiểm **định dạng** rồi kiểm **tồn tại**;
  không vế nào nối blob với lần nạp vừa rồi. **Không** phải leo thang quyền (một
  kho, mọi bản ghi đọc được) — là chuyện **toàn vẹn dữ liệu**: bản ghi trỏ sai
  hiện vật, `sha256` khớp nên không cổng nào thấy.
  Hệ quả nhỏ kèm theo: `hienVatPhucVu` cố ý trả `null` cho blob **không bản ghi
  nào trỏ** (byte đang staging *"không phải nội dung công khai"*) ⇒ trỏ một bản
  ghi vào blob đó **làm nó công khai**.
  · object: `web/api/dungchung.mjs:626-631` · `06_modules/M09_thuvien/spec.md §2.3`

- [ ] **Ba ca biên không AC nào phủ.**
  `article_versions` và `recycle` **không có** CHECK enum ⇒ `source_type` bịa vào
  được hai bảng đó (spec khai như **tiện lợi**; nó cũng là lỗ) ·
  `content-length` khai **nhỏ hơn** byte thật ⇒ đi vòng cổng *"kiểm TRƯỚC khi đọc
  byte"* · `khoi3D` chỉ **3** cột ⇒ loại nguồn thứ tám bị đẩy ra **im lặng**, và
  spec dùng chính lý lẽ đó để quyết một luật rồi **không canh nó**.
  · object: `06_modules/M09_thuvien/testcases.md` ⇒ **FR id**

## Đã đóng

*(chưa có)*
