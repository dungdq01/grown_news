# M12_chungcat — rules

> Mỗi rule S3 khai đủ **ba vế**: `lệnh` · `đỏ_khi` · `xanh_khi`.
> `CLAUDE.md` cấm khai `bề_mặt: S3` mà thiếu chúng — thiếu một vế thì cổng hoặc
> không đỏ được, hoặc đỏ oan, và cả hai đều tệ hơn không có cổng.
>
> **Đo 2026-09-03**: `chungcat/tests/` nay có **18 cổng, cả 18 xanh** — sáu rule
> dưới đây từ **kỷ luật** đã thành **cơ chế**. Câu cũ (*"sáu lệnh CHƯA TỒN TẠI"*)
> bỏ vì nó sai; `M12-R4` và `M12-R5` đổi theo `FR-053` (xem `why` của từng cái).
> Ba vế vẫn viết ra để s8
> có đích chính xác, và để không ai đọc bảng này rồi tưởng đã được canh.

```yaml
- id: M12-R1
  vi_phạm: "một đường chạy nào của chungcat/ mở kb/_kho.sqlite, hoặc ghi vào kb/**"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_khong_cham_kho.py
  đỏ_khi: "gieo một dòng `sqlite3.connect(KB)` hoặc `open(kb/..., 'w')` vào chungcat/ ⇒ cổng phải nêu ĐÚNG file và dòng đó"
  xanh_khi: "chungcat/ chỉ nói chuyện với kho qua HTTP 127.0.0.1:8787, và mọi lời gọi đó là GET"
  why: >
    Kiến trúc ba vùng đứng trên đúng một câu: MỘT cửa ghi, và nó ở LÕI (M08-R2).
    THỢ giữ khoá model, tức nó là bề mặt nhận nội dung không tin được từ Internet.
    Cho nó ghi kho là gộp "nơi đọc nội dung lạ" với "nơi quyết nội dung nào vào
    kho" — mất luật này thì một trang web độc đi thẳng vào kho, không qua gate.

- id: M12-R2
  vi_phạm: "chungcat tự đặt review_status: approved, hoặc ghi thẳng kb/ thay vì bảng nháp"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_khong_tu_duyet.py
  đỏ_khi: "gieo payload chứa `review_status: approved` ⇒ hàng nháp đọc lại KHÔNG phải draft/nhap; hoặc chungcat gọi POST /api/articles (cửa taoBai đặt approved KHÔNG điều kiện); hoặc chungcat ghi thẳng kb/"
  xanh_khi: "mọi hàng nháp M12 ghi ra đều `trang_thai: nhap` + `review_status: draft`, kể cả khi payload đòi approved"
  why: >
    Cùng bất biến với M01-R1, khác chỗ đứng: máy KHÔNG BAO GIỜ tự duyệt.
    SỬA 2026-09-02 (FR-046): trước đây M12 có HAI rào — nó tự ghi draft, VÀ
    gate.py:133 ép draft vô điều kiện lần nữa. Nay nháp vào DB qua API, nên
    gate.py KHONG CON tren duong cua M12 — rào thứ hai mất, và rào còn lại là
    mặc định `trang_thai: nhap` của bảng nháp.
    Đó là lý do đỏ_khi phải GIEO một payload đòi approved rồi ĐỌC LẠI hàng đã
    ghi, thay vì đo 'file ra _inbox/ mang draft' — đo thế thì cổng xanh RỖNG,
    vì M12 không thả file nào vào đó nữa.

- id: M12-R7
  vi_phạm: "POST /job nhận lời gọi từ một THỢ khác, hoặc tin `nguoi_dung_id` lấy từ payload"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_chi_loi_goi_tu_loi.py
  đỏ_khi: "giả lập lời gọi từ chatbot:8788 hoặc artifact:8792 ⇒ job được nhận; hoặc payload mang `nguoi_dung_id` mà hàng job giữ nguyên giá trị đó"
  xanh_khi: "chỉ lời gọi mang danh tính LÕI được nhận; `nguoi_dung_id` luôn do LÕI gán"
  why: >
    Bốn dịch vụ THỢ cùng nằm trên 127.0.0.1, nên AC-1.2 (bind loopback) KHÔNG nói
    được ai gọi. Payload job mang `nguon: [slug...]` do người gọi nêu — đúng hình
    dạng CVE-2026-44560 của Open WebUI: scope identifier do client gửi, và tên đoán
    được. Ta KHÔNG chữa bằng cách cho M12 tự giải quyền: khảo sát 2026-09-02 rút ra
    luật MỘT chokepoint, và chokepoint đó ở LÕI. Việc của M12 là không mở một cửa
    thứ hai cho ai khác đưa danh sách nguồn vào.

- id: M12-R3
  vi_phạm: "lời gọi ra Internet không đi qua hàm egress duy nhất, hoặc gửi trước khi log"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_mot_cua_egress.py
  đỏ_khi: "thêm một `httpx.post`/`requests.post`/`fetch` ở bất kỳ file nào ngoài hàm egress; hoặc đảo thứ tự log↔gửi trong hàm đó"
  xanh_khi: "grep mọi lời gọi mạng ⇒ đúng một chỗ; và dựng lại payload từ egress.jsonl rồi băm lại ra CÙNG sha256"
  why: >
    FR-043 bậc 4 là hợp đồng với chủ dự án về việc dữ liệu rời máy. Hợp đồng đó
    chỉ có nghĩa nếu ĐẾM được, và đếm được chỉ khi có đúng một chỗ đi ra. Log SAU
    khi gửi là log của những lần thành công — đúng những lần thất bại (timeout,
    bị chặn giữa đường) là lúc ta cần biết nhất mà lại không có dòng nào.

- id: M12-R4
  vi_phạm: "tên model hoặc tên nhà cung cấp xuất hiện trong file mã (ngoài assets/) — GỒM cả danh mục mà `GET /model` trả về"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_bang_khai_model.py
  đỏ_khi: "grep tên model/nhà trong chungcat/**/*.py (trừ assets/) ra ≥1 dòng; hoặc danh mục `GET /model` không sinh từ bảng khai"
  xanh_khi: "thêm một nhà cung cấp = thêm một dòng model.json + một adapter, 0 dòng ở lõi"
  why: >
    Chỉ đạo 2026-09-01 là gọi được model của mọi nhà, tuỳ tác vụ và tuỳ ngôn ngữ.
    Gõ tên trong mã thì mỗi lần đổi nhà phải sửa N chỗ, và chỗ thứ N+1 sẽ lệch —
    cùng lớp lỗi đã trúng ở LOAI gõ tay bốn nơi (FR-038/C1) và ở hai bản schema
    đang làm check_danh_muc đỏ. Bảng khai còn cho một thứ mã không cho: ĐẾM được
    hôm nay gửi tới đâu.

    FR-053 §6-2 áp thêm MỘT bề mặt: từ khi NGƯỜI chọn model, `GET /model` là chỗ
    tên model đi RA tới bộ chọn. Danh mục đó phải SINH từ bảng khai — gõ tay ở
    đó là chỗ thứ hai tên model tồn tại, và chỗ thứ hai luôn là chỗ lệch.

- id: M12-R5
  vi_phạm: "dự phòng tự động rơi sang model khác `khu_vuc` mà bảng không khai tường minh; HOẶC rơi dự phòng khi người đã chọn model TƯỜNG MINH"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_du_phong_cung_khu_vuc.py
  đỏ_khi: "model.json khai `du_phong` trỏ sang dòng có `khu_vuc` khác mà thiếu cờ `cho_phep_cheo_khu_vuc: true`; hoặc job có `model_nguoi_chon` mà log ghi một lần rơi"
  xanh_khi: "mọi cặp (model, du_phong) cùng khu_vuc HOẶC có cờ tường minh; VÀ đường chọn-tường-minh có 0 lần rơi — job dừng và nói lý do"
  why: >
    Chủ dự án chọn rơi tự động, và tôi đã nói ra chỗ nó chỏi: đích gửi RA đổi khu
    vực pháp lý mà không ai duyệt. NĐ 356/2025 Điều 14 đòi hồ sơ chuyển dữ liệu
    xuyên biên giới, và nó ĐÃ kích hoạt từ khi FR-045 thêm 5 tài khoản đồng
    nghiệp. Luật này không cản việc dùng — nó buộc việc đổi khu vực phải là một
    dòng khai đọc được, không phải một nhánh fallback trong đầu người viết mã.

    FR-053 §1.5 thêm vế thứ hai, và nó là hệ quả sắc của "user chọn model":
    người chọn X, X chết, rơi tự động sang Y = ÂM THẦM ĐẢO quyết định của người,
    và nếu Y khác khu_vuc thì đảo luôn quyết định pháp lý. Nên du_phong chỉ còn
    hiệu lực trên đường MẶC ĐỊNH. Chọn tường minh mà model chết thì job DỪNG,
    báo lý do, hỏi lại — đó là cái giá của lựa chọn, và không trả nó thì lựa
    chọn là trang trí.

- id: M12-R6
  vi_phạm: "THỬ LẠI lần thứ 3 cho cùng một job (một lần THỬ = một lượt phiên âm/chưng cất trọn nguồn — chia bao nhiêu ĐOẠN cũng tính MỘT), hoặc một đoạn gửi đi mà không có dòng log sha256 riêng, hoặc chạy lại RESET bộ đếm"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_tran_thu_lai.py
  đỏ_khi: "giả lập model lỗi liên tục ⇒ đếm được ≥3 lần THỬ; hoặc N đoạn gửi đi mà egress.jsonl có ít hơn N dòng; hoặc chạy lại từ `dang-verify` làm `lan_gui` giảm/reset; hoặc 'chạy lại từ đầu' khi lan_gui=2 mà vẫn gửi; hoặc `lan_gui` tăng theo SỐ ĐOẠN của một lần thử"
  xanh_khi: "đúng 2 lần gửi, đúng 2 dòng log, kể cả khi hai payload y hệt nhau; chạy lại từ giai-đoạn-sau-model ra 0 lời gọi model và `lan_gui` không đổi"
  why: >
    Mỗi lần GỬI là một lần tài liệu rời khỏi máy. Trần ở đây KHÔNG phải chuyện
    chịu lỗi — nó là trần cho số lần dữ liệu đi ra. Một vòng retry "cho chắc"
    biến một job thành N lần gửi, và nếu chỉ log lần cuối thì con số trong báo cáo
    egress nhỏ hơn sự thật.
    SỬA 2026-09-02 (FR-046 §2.1): checkpoint theo giai đoạn tách bộ đếm làm HAI.
    Chỉ giai đoạn `dang-goi-model` tiêu egress; chạy lại từ `dang-verify` tốn 0.
    Nên `lan_gui` phải BỀN qua mọi lần chạy lại — nếu chạy lại reset nó thì người
    bấm mười lần là tài liệu đi ra mười lần, và trần thành trang trí.
    Và trần này KHÔNG phải quota của người: nó chặn vòng lặp TỰ ĐỘNG. Người cần
    gửi lần ba thì tạo job MỚI — ULID mới, log riêng, con số vẫn đúng.
    SỬA 2026-09-05 (FR-065, chủ dự án duyệt): đổi chữ "GỬI" thành "THỬ LẠI".
    Không phải nới — đây là chữ nói đúng thứ đoạn `why` này vẫn luôn nói ("một
    vòng retry 'cho chắc'"). Nguồn audio dài phải cắt thành N đoạn rồi gộp lại;
    đó là MỘT lượt phiên âm chia làm N mảnh, không phải N lần thử lại. Đọc theo
    nghĩa cũ thì một nguồn 60 phút chạm trần ngay lần thử ĐẦU TIÊN, chưa hỏng
    lần nào — tức luật biến thành trần ĐỘ DÀI NGUỒN, thứ nó không được dựng lên
    để chặn.
    Vế đi kèm SIẾT chứ không nới: mỗi ĐOẠN phải có dòng log `sha256` riêng.
    Trước đây "một lần gửi một dòng" là hiển nhiên nên không ai viết ra; giờ một
    lần thử có nhiều đoạn thì phải viết, không thì log N đoạn bằng một dòng và
    con số byte rời máy nhỏ hơn sự thật — đúng thứ đoạn trên đang chống.
```

```yaml
- id: M12-R8
  vi_phạm: "đường ASR local nhắc tới egress — import, gọi, hay dựng một request"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_asr_khong_egress.py
  đỏ_khi: "`chungcat/src/asr.py` (hay module nào trên đường `sinh-transcript` lối local) import `egress`, hoặc quét AST thấy một lời gọi `.post`/`.stream`/`urlopen` trong đó"
  xanh_khi: "0 lời gọi mạng trong đường ASR local; lối `dich_vu` là một MODULE KHÁC và nó đi qua `egress.gui()` như mọi lối egress"
  why: >
    `FR-054 §1.5` khai ba lối sinh transcript, và cột `tieu_egress` là thứ trả lời
    "audio có rời máy không". Nếu lối local và lối dịch vụ nằm chung một file thì
    cột đó thành lời khai: không phép đo nào phân biệt được đường nào vừa chạy.
    Chủ dự án chốt 2026-09-04 làm CẢ HAI lối và ưu tiên gọi dịch vụ — chính vì
    thế phép tách phải cưỡng chế bằng cấu trúc, không bằng ý định. Lối local là
    đường duy nhất khi audio KHÔNG ĐƯỢC rời máy, và đó là ràng buộc pháp lý chứ
    không phải một tuỳ chọn hiệu năng.

- id: M12-R9
  vi_phạm: "ASR chạy dù nguồn vượt trần, hoặc trần chỉ đo MỘT nhịp"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_tran_hai_nhip.py
  đỏ_khi: "job nguồn 2GB vào được hàng đợi; hoặc video 2 tiếng chạy ASR rồi mới dừng; hoặc số trần gõ trong mã thay vì bảng khai"
  xanh_khi: "byte bị chặn ở CỬA NHẬN JOB · thời lượng bị chặn SAU khi đọc metadata và TRƯỚC giây ASR đầu tiên · cả ba số (1GB video · 500MB audio · 3600s) đọc từ bảng khai"
  why: >
    Hai nhịp vì hai con số biết được ở hai thời điểm khác nhau. Byte biết ngay ở
    cửa; thời lượng chỉ biết sau khi đọc metadata, mà đọc metadata đã là tải file
    về. Đo một nhịp thì hoặc chặn quá muộn (đã tốn 8 phút ASR cho một video
    người ta gửi nhầm), hoặc chặn quá sớm bằng một con số đoán từ byte — mà
    bitrate biến thiên hàng chục lần, nên phép đoán đó sai theo cả hai chiều.
    `AC-6.4` đã trả giá một lần cho lớp lỗi "trần khai trong spec, không có
    trong máy": số phải ở bảng khai, và cổng phải đọc số THẬT.

- id: M12-R10
  vi_phạm: "chưng cất một bản ghi VIDEO bằng `than` thay vì transcript, hoặc một việc xong mà không để lại con trỏ tới sản phẩm"
  bề_mặt: S3
  lệnh: python chungcat/tests/check_chung_cat_dung_transcript.py
  đỏ_khi: "video có transcript mà nguyên liệu vẫn là `than`; hoặc video chưa có transcript mà job chạy tiếp bằng phần mô tả; hoặc `sinh-transcript` xong mà `ket_qua` rỗng"
  xanh_khi: "video CÓ transcript ⇒ nguyên liệu là nội dung `.vtt` · CHƯA có ⇒ NÉM kèm câu chỉ đường · bản ghi văn bản giữ nguyên `than` · `ket_qua` của transcript mang `sha256`"
  why: >
    Với video đăng ký bằng URL, `than` là phần mô tả người gõ tay — vài dòng.
    Chưng cất nó rồi bắt model dựng một bài đủ khung là bắt model bịa, và lỗi
    ấy KHÔNG tự lộ: bản nháp vẫn ra, vẫn đủ mục, vẫn qua `validate`. Chỉ người
    ĐỌC mới thấy nó rỗng — nghĩa là không cổng nào bắt được trừ cổng này.
    Vế thứ hai (con trỏ) đứng chung một rule vì nó là ĐIỀU KIỆN của vế thứ
    nhất: không có `sha256` thì không tra được transcript để dùng.
```

## Ghi chú bề mặt

Cả **tám** rule khai **S3** vì cả tám nói về *một trạng thái đếm được của mã và của
log* — khác `M01-R1`/`M01-R2` (S2, vì chúng nói về *điều-không-xảy-ra trên mọi
đường chạy*, thứ không lệnh nào chứng minh được).

**Vì sao vẫn khai S3 khi lệnh chưa tồn tại**: `R3` có tiền lệ cho ca đối xứng —
*"`hard` mà không có lệnh chạy được ⇒ nó là `soft`"*. Áp thẳng vào đây thì các
rule chưa có lệnh đang là **S2**. Nhưng hạ chúng xuống S2 rồi nâng lại sau là hai lần sửa
cùng một file, và lần nâng lại là thứ **phải nhớ mới làm** — đúng lớp lỗi bảng
khai sinh ra để dẹp (`S18`, bài học C5). Nên: khai S3 kèm đủ ba vế, và **nói thẳng
ở đầu file rằng lệnh chưa có**. `check_ba` là cổng đọc chỗ này; nó phải thấy lệnh
được trỏ, và người đọc phải thấy lệnh chưa chạy được.
