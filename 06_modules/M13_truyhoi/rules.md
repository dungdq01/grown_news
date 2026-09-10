# M13_truyhoi — rules

> Mỗi rule S3 khai đủ **ba vế**: `lệnh` · `đỏ_khi` · `xanh_khi`.
> ⚠️ **Sáu lệnh dưới đây CHƯA TỒN TẠI** — `truyhoi/tests/` chưa có file nào. Nên
> hôm nay sáu rule này là **kỷ luật, chưa phải cơ chế**; ba vế viết ra để s8 có
> đích chính xác, không để ai đọc bảng rồi tưởng đã được canh.
>
> **Áp `FR-072` 2026-09-09** (chủ dự án duyệt): `M13-R6` **mới** — người gọi đọc từ
> `goi_duoc`, bên NHẬN cưỡng chế (`ADR-08` Z9); `M13-R1` đổi theo tên hàm
> `chuan_hoa_tim` *(chốt PM 2026-09-09)*.
>
> ⚠️ **Bẫy khi dựng `truyhoi/tests/`**: `check_rule_surfaces.py` xếp một rule là
> **CHỜ** khi thư mục cha của `lệnh` chưa tồn tại, nhưng là **ĐỎ** khi thư mục đã có
> mà file thì không. Nên file **đầu tiên** tạo trong `truyhoi/tests/` sẽ lật mọi rule
> còn lại sang đỏ cùng lúc ⇒ `T13-1` dựng **cả sáu cổng trong MỘT lượt**, không nhỏ
> giọt từng file.

```yaml
- id: M13-R1
  vi_phạm: "chuan_hoa_tim() có bản thứ hai, hoặc chỉ áp cho một trong hai phía (index / query), hoặc truyhoi/ import chuan_hoa của chungcat/"
  bề_mặt: S3
  lệnh: python truyhoi/tests/check_mot_ham_chuan_hoa.py
  đỏ_khi: "gieo một phép chuẩn hoá thứ hai (khác NFC/lower/đ→d/cách-quanh-Hán) ⇒ cổng nêu đúng file; hoặc bỏ chuan_hoa_tim ở phía query; hoặc thêm một `from chungcat...import chuan_hoa` vào truyhoi/"
  xanh_khi: "đúng một hàm tên chuan_hoa_tim, gọi ở đúng hai chỗ, 0 import từ chungcat/, dải Hán đọc từ core/assets/dai-han.json, và bộ 10 truy vấn ba thứ tiếng ra 10/10"
  why: >
    FR-072 · tên hàm: `chungcat/src/verify.py:55` ĐÃ CÓ `def chuan_hoa(s)` với nghĩa
    khác (NFKC · ligature · casefold, để so khớp quote). Cùng tên hai nghĩa trong một
    repo là chính lớp lỗi rule này cấm, nên bản của M13 tên `chuan_hoa_tim`. Hai hàm
    khác mục đích thì ĐƯỢC có hai bản; thứ PHẢI dùng chung là bảng khai dải Hán
    (`core/assets/dai-han.json`), không phải hàm — và cổng đối chiếu fixture chung ở
    `check_doi_chieu_chuan_hoa.py` canh phần giao.
    Đo được: `đ` (U+0111) KHÔNG fold bằng tokenizer nào — cả unicode61 lẫn trigram.
    Và unicode61 cắt câu 15 chữ Hán thành ĐÚNG MỘT token, nên mọi truy vấn tiếng
    Trung trả 0. Cả hai chỉ chữa được ở tầng ứng dụng. Khi index dùng hàm A và
    query dùng hàm B, hệ KHÔNG báo lỗi — nó chỉ trả ÍT kết quả hơn, và không ai
    biết đã mất gì. Joplin từng dính đúng lớp này với ký tự NUL phá FTS.

- id: M13-R2
  vi_phạm: "anchor_py() của M13 lệch slugGoiY() của FE cho cùng heading, hoặc dedup hậu tố không ổn định qua hai lần dựng"
  bề_mặt: S3
  lệnh: python truyhoi/tests/check_anchor_mot_luat.py
  đỏ_khi: "đổi một bước trong luật slug ở MỘT phía (bỏ đ→d, hoặc cắt 80 thay vì 60) ⇒ cổng nêu heading lệch; hoặc hai heading fold trùng mà hậu tố -1/-2 đổi giữa hai lần dựng"
  xanh_khi: "mọi heading trong kho sinh cùng anchor ở cả hai bản hiện có, khớp từng ký tự; hậu tố dedup ổn định (state theo FILE, reset mỗi file)"
  why: >
    Địa chỉ chatbot trích dẫn là `file#anchor`. Hai luật slug khác nhau nghĩa là
    chatbot trỏ vào một anchor mà trang render KHÔNG có — link chết hàng loạt, và
    chết im lặng vì cả hai phía đều "chạy đúng". Đo 2026-09-01: hàm ASCII-fold chỉ
    có bản JavaScript; bản Python của M13 là bản THỨ HAI của một luật, tức đúng
    lớp lỗi đang làm check_danh_muc đỏ.
    FR-073 §1 thêm hai điều rule này phải đo: dạng `file-anchor` nay CÓ trong
    `core/assets/dia-chi.json` (nên anchor lệch là một địa chỉ KHÔNG phân giải được,
    không chỉ một link chết), và luật dedup là hậu tố `-1`/`-2` kiểu github-slugger
    với state theo FILE, reset mỗi file — renderer và indexer phải đi qua cùng một
    thứ tự heading, không thì hai bản lệch ở đúng những heading trùng nhau.
    Vế "khớp với anchor M03 RENDER RA" KHÔNG thuộc rule này: đo 2026-09-02, M03 chưa
    sinh `id` trên heading nào ⇒ không có bản thứ ba để so. Đó là ô C3 ở
    `06_modules/M03_web/backlog.md`, và cổng đối chiếu BA bản là A3 của FR-073.

- id: M13-R3
  vi_phạm: "truyhoi ghi vào kb/**, hoặc mở kb/_kho.sqlite trực tiếp"
  bề_mặt: S3
  lệnh: python truyhoi/tests/check_khong_cham_kho.py
  đỏ_khi: "gieo một `sqlite3.connect(kb/_kho.sqlite)` hoặc bất kỳ mở-để-ghi nào vào kb/"
  xanh_khi: "truyhoi chỉ đọc kho qua HTTP 127.0.0.1:8787, và index sống ở truyhoi/index.sqlite"
  why: >
    Chỉ mục là DỮ LIỆU DẪN XUẤT. Ranh giới đó chỉ đứng được nếu chỉ mục KHÔNG
    bao giờ là nơi duy nhất giữ một thông tin. Cho M13 ghi kho là mở đường cho
    một trường chỉ tồn tại trong index — và lúc đó "mất chỉ mục không mất gì"
    thành lời nói dối, đúng lúc ai đó xoá index để dựng lại.

- id: M13-R4
  vi_phạm: "snippet() được dùng làm bằng chứng trích dẫn thay vì chỉ làm preview"
  bề_mặt: S3
  lệnh: python truyhoi/tests/check_snippet_chi_preview.py
  đỏ_khi: "đoạn trả về cho M14 là kết quả snippet() (đo bằng độ dài bị cắt ở 64 token)"
  xanh_khi: "đoạn trả về là body đầy đủ của chunk, lấy qua rowid"
  why: >
    snippet() có trần 64 token. Một trích dẫn bị cắt giữa câu vẫn TRÔNG như trích
    dẫn, và cổng verify quote-có-thật của M14 sẽ so một đoạn đã bị cắt với nguồn
    — nó sẽ trượt vì lý do sai, hoặc tệ hơn, khớp một phần và được coi là đạt.
    Đây là chỗ "có trích dẫn" và "trích dẫn đúng" tách nhau.

- id: M13-R5
  vi_phạm: "gọi embedding API, hoặc thêm bất kỳ lời gọi ra Internet nào"
  bề_mặt: S3
  lệnh: python truyhoi/tests/check_khong_embedding.py
  đỏ_khi: "grep lời gọi mạng trong truyhoi/ ra ≥1 dòng"
  xanh_khi: "0 lời gọi mạng; mọi phép tính chạy trên SQLite local"
  why: >
    M13 là THỢ nên nó ĐƯỢC phép egress — nhưng FR-043 khai bốn bậc gửi RA, và
    truy hồi KHÔNG có bậc nào. Thêm một lời gọi embedding là thêm một đường dữ
    liệu rời máy mà hợp đồng egress chưa nói tới, tức nó không được log và không
    ai đếm. Muốn dùng thì mở FR trước, không phải thêm một import.

- id: M13-R6
  vi_phạm: "nhận lời gọi từ một dịch vụ ngoài `goi_duoc` của `truyhoi`, hoặc không kiểm `aud`, hoặc nhận khoá của một chiều khác"
  bề_mặt: S3
  lệnh: python truyhoi/tests/check_ai_goi_vao.py
  đỏ_khi: "gọi POST /truy-hoi từ một dịch vụ ngoài mảng `goi_duoc` (vd `artifact`) mà được 2xx; hoặc mang `x-aud` khác `truyhoi` mà vẫn qua; hoặc bỏ hẳn khoá mà vẫn qua; hoặc đọc danh sách người gọi từ một hằng trong mã thay vì từ `core/assets/dich-vu.json`"
  xanh_khi: "cả ba ca trả 403; lời gọi từ `web` và `chatbot` mang khoá đúng chiều + `x-aud: truyhoi` trả 2xx; danh sách người gọi đọc từ bảng khai, thêm khách = một phần tử vào mảng"
  why: >
    ADR-08 (2026-09-07) đảo ADR-05 luật 2: THỢ gọi được THỢ, nhưng CÓ LUẬT — mỗi cặp
    (từ → tới) khai trong `dich-vu.json`, mỗi chiều một khoá + `aud` riêng, và BÊN NHẬN
    cưỡng chế. Trước rule này M13 KHÔNG có luật nào về người gọi: đo 2026-09-07 —
    `M12 AC-1.4` cấm THỢ→THỢ bằng cổng thật, `M14/model_flow §2` khai M14 gọi thẳng
    :8791, còn M13 không nói gì; `check_ba.py` không cưỡng chế Z8 và `core/tests` grep
    `8791|Z8` ⇒ 0. Ba module một vùng, ba luật, không máy nào đo.
    Bốn dịch vụ THỢ cùng ở 127.0.0.1 nên "bind loopback" (Z3) KHÔNG nói được ai gọi.
    Và vì M13 là NỀN cho M14 · web · M19 · M12 · M16, mỗi khách mới không có bảng khai
    sẽ là một ngoại lệ trong đầu người — CVE-2026-44560 là hình dạng của chuyện đó:
    năm đường chạy, ba đường không kiểm quyền.
```

## Ghi chú bề mặt

Sáu rule đều **S3** vì cả sáu nói về *một trạng thái đếm được của mã và của chỉ
mục*. Không rule nào S2 — module này không có bất biến kiểu *"không đường nào tự
duyệt"*; mọi thứ nó làm đều đo được trên một chỉ mục dựng lại được.

`M13-R6` cũng S3 dù nó nói về **quyền**: thứ nó đo là *một dòng mã có đọc `goi_duoc`
từ bảng khai và có so `aud` hay không*, và ba ca 403 chạy được bằng lệnh. Nó **không**
S2 vì nó không phải bất biến của quy trình mà là một trạng thái của mã.

`M13-R1` và `M13-R2` là **cùng một bệnh ở hai chỗ**: một luật, hai bản cài. Ghi
thành hai rule chứ không gộp, vì chúng đỏ ở hai lệnh khác nhau và người sửa là hai
vai khác nhau (R1 thuộc M13; R2 phải đối chiếu với M03).
