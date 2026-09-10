# M17_cong — rules

> Mỗi rule S3 khai đủ **ba vế**: `lệnh` · `đỏ_khi` · `xanh_khi`.
> ⚠️ **Sáu lệnh dưới đây CHƯA TỒN TẠI** — `cong/` chỉ có README, và **ngôn ngữ chưa
> chọn**. Hôm nay sáu rule này là **kỷ luật, chưa phải cơ chế**.

```yaml
- id: M17-R1
  vi_phạm: "hai dịch vụ khai nghe_ngoai: true, hoặc web khai nó"
  bề_mặt: S3
  lệnh: python cong/tests/check_dung_mot_nghe_ngoai.py
  đỏ_khi: "đặt nghe_ngoai: true cho một dịch vụ thứ hai trong dich-vu.json, hoặc cho web"
  xanh_khi: "đếm nghe_ngoai: true trong dich-vu.json ra ĐÚNG 1, và nó là cong"
  why: >
    Z3 của ADR-05 nói "không dịch vụ nào nghe ngoài loopback", và M17 là ngoại lệ
    DUY NHẤT. Giá trị của một ngoại lệ nằm ở việc nó ĐẾM ĐƯỢC: ngoại lệ khai trong
    bảng thì cổng đếm được là một; ngoại lệ trong đầu người thì lần thứ hai không
    ai biết là lần thứ hai. Và lần thứ hai sẽ có lý do trông hợp lý — "mở tạm cổng
    cho webhook Zalo".

- id: M17-R2
  vi_phạm: "cong/ đọc hoặc ghi kb/**"
  bề_mặt: S3
  lệnh: python cong/tests/check_khong_cham_kho.py
  đỏ_khi: "grep một đường dẫn kb/ hoặc một sqlite3 trong cong/"
  xanh_khi: "cong/ chỉ nói chuyện với Internet (443) và với 127.0.0.1:8787"
  why: >
    Z4. M17 là tiến trình đối mặt Internet trực tiếp — bề mặt tấn công lớn nhất của
    cả hệ. Cho nó chạm kho nghĩa là một lỗ ở tầng ngoài cùng thành một lỗ ở tầng
    dữ liệu. Nó chuyển tiếp, không phải cửa ghi (FR-045 §2.4), và "chỉ đọc thôi" là
    câu mở đầu của mọi lần luật này chết.

- id: M17-R3
  vi_phạm: "tiến trình cong có biến môi trường chứa khoá model"
  bề_mặt: S3
  lệnh: python cong/tests/check_khong_co_key_model.py
  đỏ_khi: "dich-vu.json đổi can_key_model của cong sang true; hoặc env của tiến trình chứa một khoá"
  xanh_khi: "can_key_model: false, và env thực tế không có khoá nào"
  why: >
    Đây là cưỡng chế bằng CẤU TRÚC, không bằng lời hứa — cùng nguyên tắc đã dùng
    cho LÕI: không có gì để xác thực thì không gọi model được, kể cả khi ai đó viết
    nhầm một dòng fetch. Với M17 nó gắt hơn vì M17 nhận input từ người lạ: một
    prompt injection thành công trên một tiến trình CÓ khoá là một hoá đơn, còn
    trên một tiến trình KHÔNG có khoá thì chỉ là rác.

- id: M17-R4
  vi_phạm: "ma_moi dùng lại được, hoặc không có het_han, hoặc entropy < 128 bit"
  bề_mặt: S3
  lệnh: python cong/tests/check_ma_moi_mot_lan.py
  đỏ_khi: "dùng một mã hai lần mà lần hai vẫn qua; hoặc sinh một mã không có het_han; hoặc mã ngắn hơn 128 bit entropy"
  xanh_khi: "lần hai bị từ chối và bảng ghi dung_luc; mọi mã có het_han; entropy >= 128 bit"
  why: >
    Buộc chat_id <-> account là nơi lỗi bảo mật sống: ĐOÁN ĐƯỢC MÃ LÀ THÀNH NGƯỜI
    KHÁC TRONG KHO. Không phải "đăng nhập sai" — là đọc được toàn bộ tri thức của
    người khác và hỏi chatbot dưới danh tính họ. Một mã 6 số kiểu OTP SAI ở đây vì
    không có kênh thứ hai (SMS/app) để giới hạn số lần thử.

- id: M17-R5
  vi_phạm: "một lần thử xác thực (thành công HOẶC thất bại) không có dòng audit_log"
  bề_mặt: S3
  lệnh: python cong/tests/check_log_thu_that_bai.py
  đỏ_khi: "thử 100 mã sai rồi đếm audit_log ra < 100 dòng"
  xanh_khi: "mỗi lần thử đúng một dòng, kể cả thất bại; và có rate limit theo IP và theo mã"
  why: >
    FR-045 U4/U5 đòi log khi BUỘC thành công. Lỗ mà FR KHÔNG nêu (tìm thấy sau khi
    duyệt, security_baseline §8.1): một lần + hết hạn chặn dùng-lại và dùng-muộn,
    KHÔNG chặn thử hàng nghìn lần trong cửa sổ còn hiệu lực. Và nếu chỉ log lần
    thành công thì một cuộc dò 10.000 lần để lại ĐÚNG MỘT dòng log — dòng của lần
    nó thành công.

- id: M17-R6
  vi_phạm: "M17 tự cấp danh tính, hoặc để review_status đi từ payload vào kho"
  bề_mặt: S3
  lệnh: python cong/tests/check_khong_tu_cap_danh_tinh.py
  đỏ_khi: "header danh tính sinh từ payload thay vì từ phien hợp lệ; hoặc một request mang review_status: approved đi qua được"
  xanh_khi: "danh tính CHỈ sinh từ phien; mọi review_status trong payload bị lột"
  why: >
    FR-045 U7 + B-B1: chủ dự án là người DUY NHẤT duyệt, và câu đó không đổi một
    chữ khi hệ có 5 tài khoản. M17 là chỗ duy nhất một request từ Internet đi vào,
    nên nó là chỗ duy nhất một danh tính bịa có thể được cấp. Và cột `vai` trong
    bảng nguoi_dung hiện CHƯA AI ĐỌC — nên hôm nay không có gì chặn một account
    thường ngoài luật này.
```

## Ghi chú bề mặt

Sáu rule đều **S3**.

`M17-R5` là rule duy nhất trong dự án được viết ra vì một **lỗ trong một FR đã
duyệt**, không vì một quyết định mới. `FR-045` §3 gọi đúng tên chỗ nguy hiểm rồi bỏ
sót phép chặn; `security_baseline §8.1` ghi lại. Cần **FR bổ sung** — rule này khai
trước để s7 không chia task M17 mà thiếu ba cổng rate-limit/entropy/log-thất-bại.

`M17-R6` có một vế **không tự đứng được**: cột `vai` chưa ai đọc, nên "phân quyền"
hôm nay là **một cột trống**. Rule này là thứ duy nhất chặn một account thường —
ghi ra để không ai tưởng đã có hai lớp.
