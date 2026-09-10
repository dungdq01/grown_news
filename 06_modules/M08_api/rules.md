# M08_api — rules

> Ngữ pháp bốn field. Tầng dưới chỉ thêm ràng buộc, không nới BRD hay R1–R6.
> Cả 5 rule là răng máy (S3) — vì module này cầm đường ghi vào nguồn chân lý,
> "kỷ luật" không đủ.

```yaml
- id: M08-R1
  vi_phạm: "server nghe địa chỉ khác 127.0.0.1, hoặc handler trong web/api/ tự mở listen riêng"
  bề_mặt: S3          # api-guard.test.js — quét tĩnh listen/0.0.0.0; no-write-path.test.js canh server.mjs
  why: >
    BRD B-D3 + security_baseline §4: kho có thể chứa nguồn nội bộ. API này KHÔNG
    có auth (§1 — quyết định một-người-dùng); localhost là TOÀN BỘ lớp bảo vệ.
    Nghe ra mạng là biến "không có đăng nhập" từ quyết định hợp lý thành lỗ hổng.

- id: M08-R2
  vi_phạm: "COMMIT vào kb/_kho.sqlite mà không có lần chạy validate.py --strict đạt NGAY TRƯỚC đó trên đúng nội dung compose sẽ ghi (FR-034 — trước: 'ghi vào kb/')"
  bề_mặt: S3          # api-crud.test.js (bài hỏng ⇒ 422, DB không đổi) + api-guard.test.js (tĩnh: mutation SQL chỉ nằm trong dungchung.mjs)
  why: >
    DB là nguồn chân lý, validate.py là hợp đồng 7 module bám vào. Một đường ghi
    không qua cổng thì cổng thành trang trí — và đường không cổng sẽ thành lối
    chính vì nó nhanh hơn (cùng lý do M05-R1). Kiểm bằng validate.py THẬT qua
    spawn trên tmp .md compose từ payload, không viết lại bằng JS (M05-R3:
    hai bản kiểm lệch nhau im lặng).

- id: M08-R3
  vi_phạm: "code M08 chứa giá trị mặc định cho trường quyết định: insight_new, skill_installed, review_minutes, reject_reason, trạng thái đích, credibility_max"
  bề_mặt: S3          # api-status.test.js — approve thiếu 1/3 trường M1 ⇒ 422; api-guard.test.js quét literal gán default
  why: >
    B-B1 sống hay chết ở đây. FR-001 thêm 3 trường M1 để approved là LỜI KHAI của
    người; API điền hộ dù chỉ một default là máy-tự-duyệt có vỏ bọc người bấm.
    Cùng lý M05-R2: quyết định thì trả lại người, không tự điền. Ngoại lệ duy
    nhất: word_count và url_normalized — phép tính, và tính bằng validate.py --fix.

- id: M08-R4
  vi_phạm: "DELETE FROM articles nằm ngoài transaction có INSERT INTO recycle kèm snapshot nguyên văn; hoặc DELETE trên bảng recycle ngoài transaction restore có INSERT articles đối xứng (FR-034 — trước: 'unlink thay vì move _recycle/')"
  bề_mặt: S3          # api-recycle.test.js — snapshot-equal + restore; api-guard.test.js — không unlink trỏ kho, không DELETE recycle
  why: >
    Kho là thứ backup F4 gọi là "mất là mất tất cả". Nút xoá trên web mà xoá
    thật thì một click nhầm = mất bài đã duyệt. Bảng recycle giữ snapshot
    nguyên văn trong CÙNG transaction với DELETE — crash giữa chừng không để
    lại trạng thái mất bài; restore là thao tác máy làm được vì nó thuận nghịch.
    Export vẫn ghi _recycle/ ra file để mắt người soát.

- id: M08-R5
  vi_phạm: "PUT/POST nhận và ghi review_status, origin, id, slug, source_type lấy từ payload thay vì server quyết theo vòng đời"
  bề_mặt: S3          # api-crud.test.js — PUT chở review_status: approved ⇒ trường bị lột, bài giữ trạng thái vòng đời
  why: >
    Chuyển trạng thái phải đi cửa PATCH /status — cửa có bảng chuyển cứng và đòi
    trường M1. Cho PUT chở review_status là mở cửa hông: một request gộp sửa nội
    dung + tự duyệt, và test của cửa chính không thấy. id/slug/source_type bất
    biến qua PUT vì chúng LÀ khoá chính của hàng (FR-034 — trước: "địa chỉ
    file") — đổi tên là việc khác.

- id: M08-R6
  vi_phạm: "một bảng dữ liệu GỐC (không dựng lại được từ file) nằm trong kb/_kho.sqlite; hoặc một DB nằm ngoài thư mục của backend sở hữu nó"
  bề_mặt: S3
  lệnh: python core/tests/check_db_dung_cho.py
  đỏ_khi: "kho.schema.sql khai một bảng có trong danh sách DU_LIEU_GOC (nguoi_dung · ma_moi · dinh_danh_kenh · phien · nhap_chung_cat); hoặc tìm thấy một file .sqlite ngoài thư mục backend đã khai trong dich-vu.json; hoặc một trong BA bảng phải-xuất (nguoi_dung · dinh_danh_kenh · nhap_chung_cat) không có đường export ra file"
  xanh_khi: "mọi bảng trong kho.schema.sql đều dựng lại được từ file .md/.yaml; mỗi .db nằm trong thư mục của backend sở hữu nó; và ba bảng phải-xuất đều xuất ra file, hai bảng không-xuất (ma_moi · phien) thì KHÔNG"
  why: >
    ADR-06. dung_lai_db.py:139-140 XOA kb/_kho.sqlite roi dung lai TU FILE —
    docstring cua chinh no: "DB khong co lich su". Nen mot bang du lieu GOC nam
    trong do la mot bang BI XOA SACH moi lan chay lenh do, va lenh do khong hiem:
    _api.mjs goi trong test, B-C1 khai no la duong file->DB duy nhat, va no la buoc
    2 cua thu tuc T02-4.
    Hau qua neu mat luat nay: 5 tai khoan + moi chat_id da buoc + moi phien + moi
    ban nhap dang do -> mat, IM LANG, tren mot lenh nguoi ta chay thuong xuyen.
    Va xuat chung ra yaml de song sot la SAI HANG: ma_moi la bi mat, phien la
    Va xuat HAI trong nam bang ra yaml de song sot la SAI HANG: ma_moi la bi mat,
    phien la session — khoi phuc chung khong khoi phuc duoc gi.
    ADR-06 (c): BA bang con lai (nguoi_dung, dinh_danh_kenh, nhap_chung_cat) VAN
    xuat ra file de backup, dung co che B-C1 cua kho. Nen rule nay co HAI chieu:
    khong cho du lieu goc vao _kho.sqlite, VA khong cho ba bang do song ma khong
    co duong export — mot bang goc khong export la mot bang mat khi o cung hong.
```

## Quan hệ với rule tầng trên

M08 là kb_writer thứ ba (sau M01, M05 — FR-011 sửa M02-R2). M02-R1 vẫn nguyên:
M08 không bao giờ TỰ ghi `approved` — nó chỉ chuyển tiếp lời khai của người, và
M08-R3 làm điều đó kiểm được bằng máy thay vì chỉ bằng reviewer.
