# M16_artifact — rules

> Mỗi rule S3 khai đủ **ba vế**: `lệnh` · `đỏ_khi` · `xanh_khi`.
> ⚠️ **Năm lệnh dưới đây CHƯA TỒN TẠI** — `artifact/` chỉ có README. Hôm nay năm
> rule này là **kỷ luật, chưa phải cơ chế**.

```yaml
- id: M16-R1
  vi_phạm: "M16 xoá một byte trong kb/_media/, hoặc ghi đè một hiện vật đã có"
  bề_mặt: S3
  lệnh: python artifact/tests/check_khong_xoa_byte.py
  đỏ_khi: "grep một unlink/remove/truncate trên đường dẫn _media trong artifact/; hoặc chạy sinh artifact hai lần và sha256 của một hiện vật CŨ đổi"
  xanh_khi: "trước và sau khi sinh artifact, mọi hiện vật cũ giữ nguyên sha256; số file chỉ TĂNG"
  why: >
    M09-R1: mỗi DELETE phá byte VĨNH VIỄN. Nguyên liệu người nạp không dựng lại
    được — một PDF 30 trang mất là mất. M16 là module duy nhất GHI vào _media/, nên
    nó là module duy nhất có cơ hội xoá. Và nó sẽ có lý do trông hợp lý để xoá:
    "dọn artifact cũ cho đỡ nặng". Luật này không cấm dọn — nó cấm M16 tự dọn.

- id: M16-R2
  vi_phạm: "artifact sinh ra không khai `la_dan_xuat = 1` trong bảng media"
  bề_mặt: S3
  lệnh: python artifact/tests/check_khai_dan_xuat.py
  đỏ_khi: "sinh một artifact rồi truy bảng media thấy hàng đó thiếu cờ, hoặc cờ = 0"
  xanh_khi: "mọi hàng media do M16 sinh có la_dan_xuat = 1; mọi hàng do người nạp có 0"
  why: >
    Đây là ranh giới CỨU ĐƯỢC M16-R1. Nguyên liệu KHÔNG dựng lại được; artifact
    DỰNG LẠI ĐƯỢC. Không phân biệt hai loại thì một ngày ai đó dọn _media/ để tiết
    kiệm chỗ và xoá cả hai — và họ sẽ làm đúng, vì không có cách nào biết cái nào
    là cái nào. Cờ này là thứ cho phép một công cụ dọn TỒN TẠI về sau mà an toàn.

- id: M16-R3
  vi_phạm: "link quay-ngược bị đốt vào pixel thay vì đặt ở tầng metadata"
  bề_mặt: S3
  lệnh: python artifact/tests/check_link_o_metadata.py
  đỏ_khi: "đọc sidecar/ID3/hyperlink ra 0 địa chỉ trong khi artifact có chữ URL trong khung hình; hoặc video không có sidecar mốc thời gian"
  xanh_khi: "mọi artifact có >=1 địa chỉ phân giải được ở metadata, và 0 URL vẽ trong pixel"
  why: >
    Nguyên lý ⑤ NotebookLM là LÝ DO M16 tồn tại thay vì chỉ xuất file: artifact
    phải quay ngược làm input. URL trong pixel thì người xem không bấm được, không
    copy được, và khi URL đổi thì phải RENDER LẠI cả video. Metadata sửa được;
    pixel thì không. Đây là khác biệt giữa "một file đẹp" và "một cửa vào kho".

- id: M16-R4
  vi_phạm: "gọi TTS cloud mà không log sha256 văn bản TRƯỚC khi gửi; hoặc đường local sinh dòng log egress"
  bề_mặt: S3
  lệnh: python artifact/tests/check_mot_cua_egress.py
  đỏ_khi: "đảo thứ tự log↔gửi; hoặc chạy đường piper local mà egress.jsonl có thêm dòng"
  xanh_khi: "cloud: 1 dòng log/1 lần gọi, dựng lại payload từ log ra cùng sha256. local: 0 dòng"
  why: >
    Người dùng bấm "tạo giọng đọc" trông như một tiện ích nhỏ, nhưng nó gửi TOÀN
    VĂN một bài ra một nhà cung cấp nước ngoài — cùng bậc 4 với M12 gửi tài liệu
    nguyên liệu. Đây là chỗ dễ đánh giá thấp nhất của cả đợt hai. Và vế thứ hai
    (local phải sinh 0 dòng) không phải cho đủ đôi: nó là cách đường local CHỨNG
    MINH được nó không gửi gì, thay vì ta tin nó không gửi.

- id: M16-R5
  vi_phạm: "tên engine (Marp, pandoc, Azure, FPT.AI, piper, ffmpeg) xuất hiện trong file mã ngoài assets/"
  bề_mặt: S3
  lệnh: python artifact/tests/check_bang_khai_engine.py
  đỏ_khi: "grep tên engine trong artifact/**/*.py (trừ assets/) ra >=1 dòng; hoặc bảng khai thiếu ghi chú 'PPTX của Marp là ảnh'"
  xanh_khi: "đổi engine = đổi một dòng bảng, 0 dòng mã; và bảng ghi rõ giới hạn từng engine"
  why: >
    Cùng lý do M12-R4, cộng một thứ riêng của M16: giới hạn engine ở đây là thứ
    BẤT NGỜ. PPTX của Marp là ẢNH — chọn Marp cho một yêu cầu "sửa được chữ" thì
    file mở ra trông đúng và không sửa được, và người dùng phát hiện điều đó SAU
    KHI đã gửi cho người khác. Bảng khai ghi giới hạn nghĩa là cổng đỏ trước, thay
    vì người dùng phát hiện sau.
```

## Ghi chú bề mặt

Năm rule đều **S3**.

`M16-R1` và `M16-R2` là **một cặp**: R1 cấm xoá, R2 làm cho việc dọn AN TOÀN về sau
trở nên khả thi. Tách làm hai vì chúng đỏ ở hai lệnh khác nhau, và vì R2 là thứ dễ
bị coi là "một cột metadata cho đẹp" nếu không nói ra nó cứu cái gì.

`M16-R4` là rule duy nhất trong dự án có **vế phủ định phải đo được**: đường local
phải sinh **0** dòng log. Mọi rule khác đo *"có làm đúng không"*; rule này còn đo
*"có im lặng làm thêm gì không"*.
