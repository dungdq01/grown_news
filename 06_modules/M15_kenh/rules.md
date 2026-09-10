# M15_kenh — rules

> Mỗi rule S3 khai đủ **ba vế**: `lệnh` · `đỏ_khi` · `xanh_khi`.
> ⚠️ **Sáu lệnh dưới đây CHƯA TỒN TẠI** — `kenh/` chỉ có README. Hôm nay sáu rule
> này là **kỷ luật, chưa phải cơ chế**.

```yaml
- id: M15-R1
  vi_phạm: "kenh/ bind một cổng, hoặc dich-vu.json khai cong != null cho kenh"
  bề_mặt: S3
  lệnh: python kenh/tests/check_khong_nghe_gi.py
  đỏ_khi: "netstat trong lúc tiến trình chạy thấy một cổng listen thuộc nó; hoặc dich-vu.json đổi cong/nghe_ngoai của kenh"
  xanh_khi: "0 cổng listen; dich-vu.json giữ cong: null và nghe_ngoai: false"
  why: >
    Đây là ranh giới quan trọng nhất của cả phần tích hợp, và nó không phải chuyện
    khó/dễ: kênh nhận tin bằng cách GỌI RA là một tiến trình local — không VPS,
    không tunnel, không đụng M08-R1. Kênh đòi NGHE VÀO là một dự án hạ tầng, với
    chứng chỉ, với bề mặt tấn công, với người trực. Một dòng "mở tạm cổng cho
    webhook" đổi hạng cả dự án, và nó sẽ được thêm vì nó nhanh hơn.

- id: M15-R2
  vi_phạm: "kenh/ đọc kb/**, hoặc mở kb/_kho.sqlite"
  bề_mặt: S3
  lệnh: python kenh/tests/check_khong_doc_kho.py
  đỏ_khi: "grep một đường dẫn kb/ hoặc một sqlite3.connect trong kenh/"
  xanh_khi: "kenh/ chỉ nói chuyện với 127.0.0.1:8787 và với host của kênh"
  why: >
    BIÊN là vùng đối mặt Internet. Nội dung nó nhận là untrusted input theo định
    nghĩa. Cho nó đọc kho là cho một tiến trình có thể bị điều khiển từ ngoài đọc
    toàn bộ tri thức — và đọc là bước đầu của rò rỉ. Z4 nói đúng chỗ này: BIÊN
    KHÔNG chạm kb/, kể cả chỉ đọc.

- id: M15-R3
  vi_phạm: "kenh/ tự giữ danh sách người được phép, thay vì hỏi LÕI"
  bề_mặt: S3
  lệnh: python kenh/tests/check_khong_tu_giu_allowlist.py
  đỏ_khi: "grep một mảng/file chứa chat_id trong kenh/"
  xanh_khi: "mỗi tin nhắn vào sinh đúng một lời gọi LÕI hỏi chat_id thuộc tài khoản nào"
  why: >
    FR-045 thay allowlist phẳng của B-B4 bằng bảng dinh_danh_kenh, và khác biệt
    không phải hình thức: allowlist phẳng trả lời "ai được nói với bot"; bảng trả
    lời "tin nhắn này là của TÀI KHOẢN nào" — thứ cần để mỗi người một session.
    Một bản danh sách thứ hai trong kenh/ nghĩa là thu hồi quyền ở LÕI mà kênh vẫn
    cho vào, và không ai biết vì hai bản không đối chiếu.

- id: M15-R4
  vi_phạm: "một lệnh kênh được xử lý bằng `if` trong mã thay vì một dòng bảng khai"
  bề_mặt: S3
  lệnh: python kenh/tests/check_bang_khai_lenh.py
  đỏ_khi: "thêm một lệnh mà không thêm dòng nào vào kenh/assets/lenh.json"
  xanh_khi: "mọi lệnh có đúng một dòng bảng, và bảng ánh xạ tới đúng một endpoint LÕI"
  why: >
    M15 phải MỎNG, và "mỏng" là thứ đo được chứ không phải một ý định. Mỗi `if`
    thêm vào là một chút logic nghiệp vụ rò từ LÕI ra BIÊN, và nó rò từng dòng một
    nên không ai thấy khoảnh khắc nó thành dày. Bảng khai làm việc rò đó thành
    KHÔNG THỂ: thêm lệnh mà không thêm dòng bảng thì cổng đỏ.

- id: M15-R5
  vi_phạm: "kenh/ gửi ra kênh một bản ghi chưa `approved`"
  bề_mặt: S3
  lệnh: python kenh/tests/check_chi_gui_approved.py
  đỏ_khi: "gieo một bản draft rồi gọi đường gửi ⇒ nội dung đó ra tới kênh"
  xanh_khi: "chỉ approved hoặc thông báo hệ thống đi ra; draft bị chặn tại M15"
  why: >
    B-D3b: "private" cũ nghĩa là "không ai biết URL" — một tính chất KHÔNG ĐO
    ĐƯỢC. Đẩy một bản draft ra Telegram là công bố một bản chưa duyệt cho một
    nhóm người, tức vượt qua toàn bộ vòng đời duyệt M02 §2.2 bằng một đường khác.
    Và nó không hoàn tác được: tin nhắn đã gửi thì đã gửi.

- id: M15-R6
  vi_phạm: "thêm adapter cho một kênh không có bề mặt chính thức (API có version, tài liệu, thông báo thay đổi)"
  bề_mặt: S3
  lệnh: python kenh/tests/check_be_mat_chinh_thuc.py
  đỏ_khi: "một adapter dựa vào scraping HTML, hoặc vào một endpoint không có trong bảng khai kênh chính thức"
  xanh_khi: "mọi adapter trỏ vào một API có version, và bảng khai ghi nguồn tài liệu + ngày tra"
  why: >
    Crawler là cỗ máy hỏng-IM-LẶNG theo thiết kế: nó trả dữ liệu sai trước khi trả
    lỗi. Đó chỏi thẳng lý do dự án tồn tại — kho tri thức mà nguồn nhiễm im lặng
    thì tệ hơn không có kho. Bằng chứng cụ thể: Meta có đội Anti-Scraping và
    randomize class/id CỐ Ý; scraper Facebook lớn nhất (3.157★) TỰ NHẬN "không
    đáng tin cho production" rồi ngừng push 6/2024.
```

## Ghi chú bề mặt

Sáu rule đều **S3** — cả sáu nói về *trạng thái đếm được của mã, của cổng đang
listen, và của bảng khai*.

`M15-R1` là rule duy nhất trong dự án được canh bằng **quan sát tiến trình đang
chạy** (`netstat`), không bằng đọc mã. Lý do: một cổng có thể mở bởi một thư viện
mà mã không nhắc tên — đọc mã không thấy, chỉ chạy mới thấy.
