# M14_chatbot — rules

> Mỗi rule S3 khai đủ **ba vế**: `lệnh` · `đỏ_khi` · `xanh_khi`.
> ⚠️ **Sáu lệnh dưới đây CHƯA TỒN TẠI** — `chatbot/tests/` chưa có file nào. Hôm
> nay sáu rule này là **kỷ luật, chưa phải cơ chế**.

```yaml
- id: M14-R1
  vi_phạm: "một block khẳng định bị BỎ IM LẶNG khi citation không verify được"
  bề_mặt: S3
  lệnh: python chatbot/tests/check_gan_co_tung_khang_dinh.py
  đỏ_khi: "gieo một quote không có trong nguồn ⇒ số block ra khỏi M14 ÍT HƠN số block model sinh"
  xanh_khi: "số block vào = số block ra; block hỏng mang trang_thai: chua-xac-minh"
  why: >
    Mọi repo khảo được (surfsense, onyx, morphik, khoj) đều drop-im-lặng citation
    hỏng. Đó là chỗ hệ RAG lừa người dùng: câu trả lời TRÔNG hoàn chỉnh, và không
    ai biết có thứ đã bị bỏ. Chủ dự án chọn gắn cờ từng khẳng định thay vì bỏ hoặc
    từ chối cả câu. Luật này là cách duy nhất giữ lựa chọn đó — đếm block, không
    tin lời khai của mã.

- id: M14-R2
  vi_phạm: "citations[] ra khỏi M14 mà chưa qua cổng verify quote-có-thật"
  bề_mặt: S3
  lệnh: python chatbot/tests/check_verify_bat_buoc.py
  đỏ_khi: "gọi đường trả phản hồi trực tiếp, bỏ qua verify; hoặc block da-xac-minh có citations rỗng"
  xanh_khi: "mọi block da-xac-minh có ≥1 citation, và mọi citation tìm thấy nguyên văn trong nguồn"
  why: >
    Ta mô phỏng format citations của Anthropic nhưng KHÔNG thừa hưởng bảo đảm
    "valid pointers" của họ — bảo đảm đó là validate server-side. Format giống
    nhau làm người đọc mã tưởng đã được kiểm. Cộng với B-A5 (địa chỉ phải phân
    giải được) và Stanford 2025 (trợ lý pháp lý có RAG vẫn bịa 17-34%): cổng
    verify TỰ CÀI là bắt buộc, không phải lưới an toàn.

- id: M14-R3
  vi_phạm: "`co-nhung-mau-thuan` bắn mà không kèm ≥2 địa chỉ phân giải được thuộc hai bản ghi khác nhau"
  bề_mặt: S3
  lệnh: python chatbot/tests/check_mau_thuan_can_hai_dia_chi.py
  đỏ_khi: "model khai lý do đó với 0 hoặc 1 địa chỉ, hoặc hai địa chỉ trỏ vào CÙNG một bản ghi, mà phản hồi vẫn ra"
  xanh_khi: "mọi lần bắn có ≥2 địa chỉ, cả hai phân giải được, thuộc hai bản ghi khác nhau, và có dòng log"
  why: >
    Chủ dự án chốt để MODEL tự khai nhánh này. Nó chỏi luật gốc — model vừa sinh
    câu trả lời vừa tự phán "nguồn mâu thuẫn nên tôi không trả lời", tức sở hữu
    thước đo của chính nó, và một lần từ chối SAI trông y hệt một lần ĐÚNG. Không
    đảo quyết định; thu hẹp chỗ nó tự do. Code không phán được NỘI DUNG có ngược
    nhau, nhưng chặn được lần từ chối KHÔNG TRỎ VÀO ĐÂU CẢ — dạng lạm dụng rẻ
    nhất. Và nhánh này KHÔNG có tiền lệ mã nguồn mở nào, nên log mọi lần bắn là
    cách duy nhất biết nó có đang bị lạm dụng.

- id: M14-R4
  vi_phạm: "M14 phụ thuộc web/ để chạy, hoặc trả HTML/trình bày thay vì dữ liệu"
  bề_mặt: S3
  lệnh: python chatbot/tests/check_api_doc_lap.py
  đỏ_khi: "tắt web rồi curl vào 8788 mà không trả JSON; hoặc grep một thẻ HTML trong phản hồi"
  xanh_khi: "curl trả JSON hợp lệ với web TẮT HẲN; chatbot/ không có file .html/.css nào"
  why: >
    Đây là quyết định kiến trúc quan trọng nhất của đợt hai: web là client THỨ
    NHẤT, không phải chủ sở hữu. Chatbot mọc trong web/ thì mỗi kênh thêm vào là
    viết lại nó, và toàn bộ luận điểm "core xong trước thì integration rẻ" sập.
    M8.2 (kênh thứ hai ≤20% công kênh thứ nhất) là phép đo cho đúng chuyện này —
    trượt nó gần như chắc chắn nghĩa là luật này đã mất.

- id: M14-R5
  vi_phạm: "M14 đọc hoặc ghi bảng `phien`"
  bề_mặt: S3
  lệnh: python chatbot/tests/check_phien_doc_lap.py
  đỏ_khi: "grep một câu SQL chạm bảng phien trong chatbot/, hoặc một lời gọi API đọc bảng đó"
  xanh_khi: "M14 nhận ngu_canh từ người gọi và không biết bảng phien tồn tại"
  why: >
    FR-045 U6. Session là DỮ LIỆU, và dữ liệu ở LÕI. Cho THỢ giữ session là cho
    một tiến trình có khoá model nắm trạng thái của 5 người dùng — và khi thêm
    kênh thứ hai, hai bản session sẽ tồn tại song song ở hai chỗ. Đường đúng là
    LÕI cấp ngữ cảnh cho mỗi lượt, THỢ không nhớ gì.

- id: M14-R6
  vi_phạm: "một ngưỡng tuyệt đối trên điểm bm25 thô quyết việc từ chối"
  bề_mặt: S3
  lệnh: python chatbot/tests/check_khong_nguong_bm25.py
  đỏ_khi: "grep một phép so sánh điểm với hằng số trong chatbot/"
  xanh_khi: "`khong-co-trong-kho` chỉ bắn khi M13 trả ĐÚNG 0 hàng"
  why: >
    bm25 thô không có thang tuyệt đối — ragflow tự TẮT threshold khi điểm là
    term-only, đúng vì lý do này. Một ngưỡng gõ tay sẽ đúng trên corpus 3 bản ghi
    và sai trên corpus 100, và nó sai theo cách im lặng: chatbot từ chối những câu
    nó trả lời được. "0 hàng" thì code biết chắc; "điểm thấp" thì không ai biết
    ngưỡng đúng là bao nhiêu.
```

## Ghi chú bề mặt

Sáu rule đều **S3** — tất cả nói về *trạng thái đếm được của mã, của phản hồi, và
của log*.

`M14-R3` là rule đặc biệt nhất của cả dự án: nó **không** cưỡng chế được điều nó
muốn (*"đừng từ chối sai"*), chỉ cưỡng chế được **điều kiện cần** (*"từ chối phải
trỏ vào hai chỗ có thật"*). Ghi rõ giới hạn đó ở đây để không ai đọc bảng rồi tưởng
nhánh `co-nhung-mau-thuan` đã được canh đúng nghĩa — nó chỉ bị **thu hẹp**, và
`AC-4.3` (log mọi lần bắn) là thứ duy nhất cho ta biết sau ba tháng nó có bị lạm
dụng hay không.
